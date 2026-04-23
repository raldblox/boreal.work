import "server-only";

import { getBorealRuntimeConfig } from "@/lib/boreal/config";
import {
  ensureCatalogSeeded,
  saveArtifactMetadata,
  saveIntentPipelineRecord,
} from "@/lib/boreal/dal/intent-repository";
import { resolveProviderAdapter } from "@/lib/boreal/integrations/providers/registry";
import type { ComposableAgent } from "@/lib/boreal/agents/base";
import type {
  ChatAssistantResponse,
  CatalogItem,
  MediaArtifact,
  WorkspaceState,
} from "@/lib/boreal/schemas/chat";
import type {
  IntentExtraction,
  PersistedIntent,
} from "@/lib/boreal/schemas/intent";
import { classifyGenerationIntent } from "@/lib/boreal/tools/embeddings/classify-generation-intent";
import { searchCatalog } from "@/lib/boreal/tools/catalog/search-catalog";
import { extractStructuredIntent } from "@/lib/boreal/tools/llm/extract-structured-intent";
import { generateHelpfulAnswer } from "@/lib/boreal/tools/llm/generate-helpful-answer";
import { generateImageAsset } from "@/lib/boreal/tools/media/generate-image-asset";
import { generateSpeechAsset } from "@/lib/boreal/tools/media/generate-speech-asset";
import { startVideoGeneration } from "@/lib/boreal/tools/media/start-video-generation";
import { buildIntentPersistencePayload } from "@/lib/boreal/tools/ui/build-intent-response";

type ChatAssistantAgentInput = {
  message: string;
  conversationId?: string;
};

export const chatAssistantAgent: ComposableAgent<
  "chat-assistant",
  readonly unknown[],
  ChatAssistantAgentInput,
  ChatAssistantResponse
> = {
  description:
    "Routes Boreal chat requests into general help, catalog lookup, or media generation, then persists useful intents and output metadata.",
  name: "chat-assistant",
  tools: [
    {
      description: "Ensures the Boreal supply catalog exists before routing.",
      execute: ensureCatalogSeeded,
      name: "ensure-catalog-seeded",
    },
    {
      description:
        "Embeds the message and scores it against text, image, speech, and video intent profiles.",
      execute: classifyGenerationIntent,
      name: "classify-generation-intent",
    },
    {
      description:
        "Extracts a routed intent schema without exposing internal artifacts to the user.",
      execute: extractStructuredIntent,
      name: "extract-structured-intent",
    },
    {
      description: "Searches the Boreal catalog for relevant supplies and tools.",
      execute: searchCatalog,
      name: "search-catalog",
    },
    {
      description: "Generates helpful natural-language answers for general or catalog requests.",
      execute: generateHelpfulAnswer,
      name: "generate-helpful-answer",
    },
    {
      description: "Generates image assets for image intents.",
      execute: generateImageAsset,
      name: "generate-image-asset",
    },
    {
      description: "Generates speech assets for TTS intents.",
      execute: generateSpeechAsset,
      name: "generate-speech-asset",
    },
    {
      description: "Starts async video generation jobs for video intents.",
      execute: startVideoGeneration,
      name: "start-video-generation",
    },
    {
      description: "Persists routed chat intent state into Convex.",
      execute: saveIntentPipelineRecord,
      name: "save-intent-pipeline-record",
    },
  ] as const,
  async run(input) {
    const runtimeConfig = getBorealRuntimeConfig();
    const provider = resolveProviderAdapter();

    await ensureCatalogSeeded();

    const modality = await classifyGenerationIntent({
      embeddingModelId: runtimeConfig.embeddingModel,
      message: input.message,
      provider,
    });

    const intent = await extractStructuredIntent({
      intentModelId: runtimeConfig.intentModel,
      message: input.message,
      modalityScores: modality.modalityScores,
      provider,
    });

    const relatedCatalogItems = intent.shouldSearchCatalog
      ? await searchCatalog({
          limit: 6,
          query: intent.catalogQuery || input.message,
        })
      : [];

    const conversationId = input.conversationId ?? crypto.randomUUID();
    const userMessageId = crypto.randomUUID();
    const assistantMessageId = crypto.randomUUID();

    const resolved = await resolveOutcome({
      assistantModelId: runtimeConfig.assistantModel,
      catalogItems: relatedCatalogItems,
      imageModelId: runtimeConfig.imageModel,
      inputMessage: input.message,
      intent,
      provider,
      speechModelId: runtimeConfig.speechModel,
      videoModelId: runtimeConfig.videoModel,
    });

    const persistedIntent = buildIntentPersistencePayload({
      assistantMessageId,
      conversationId,
      embedding: modality.embedding,
      embeddingModel: runtimeConfig.embeddingModel,
      intent,
      intentModel: runtimeConfig.intentModel,
      modalityScores: modality.modalityScores,
      provider: provider.key,
      userMessageId,
    });

    let intentId: string | undefined;
    let intentKey: string | undefined;
    let persisted = false;

    if (shouldPersistIntent(persistedIntent, resolved.artifact)) {
      const persistedResult = await saveIntentPipelineRecord({
        assistantMessage: resolved.assistantMessage,
        conversationId,
        intent: persistedIntent,
        userMessage: input.message,
      });

      intentId = persistedResult.intentId;
      intentKey = persistedResult.intentKey;
      persisted = true;

      if (resolved.artifact) {
        await saveArtifactMetadata({
          artifactKind: toArtifactKind(resolved.artifact),
          conversationId,
          intentKey,
          mediaType:
            resolved.artifact.kind === "video"
              ? "video/mp4"
              : resolved.artifact.mediaType,
          metadataJson: JSON.stringify(resolved.artifact),
          provider: provider.key,
          remoteId:
            resolved.artifact.kind === "video"
              ? resolved.artifact.jobId
              : undefined,
          status: toArtifactStatus(resolved.artifact),
          subtitle: resolved.workspace.subtitle,
          title: resolved.artifact.title,
        });
      }
    }

    return {
      assistantMessage: resolved.assistantMessage,
      conversationId,
      intent: persistedIntent,
      intentId,
      persisted,
      relatedCatalogItems,
      workspace: resolved.workspace,
    };
  },
};

async function resolveOutcome(input: {
  assistantModelId: string;
  catalogItems: CatalogItem[];
  imageModelId: string;
  inputMessage: string;
  intent: IntentExtraction;
  provider: ReturnType<typeof resolveProviderAdapter>;
  speechModelId: string;
  videoModelId: string;
}): Promise<{
  artifact?: MediaArtifact;
  assistantMessage: string;
  workspace: WorkspaceState;
}> {
  if (input.intent.needsClarification || input.intent.routeTarget === "clarification") {
    return {
      assistantMessage: buildClarificationMessage(input.intent),
      workspace: {
        kind: "clarification",
        questions: input.intent.missingDetails,
        subtitle: "Fill the gaps here or reply in chat to continue.",
        suggestions: input.intent.suggestedReplies,
        title: "Missing details",
      },
    };
  }

  if (input.intent.routeTarget === "image_generation") {
    const artifact = await generateImageAsset({
      modelId: input.imageModelId,
      prompt: input.intent.assetPrompt,
      provider: input.provider,
      title: input.intent.title,
    });

    return {
      artifact,
      assistantMessage:
        "I generated an image for this request. The result is in the workspace panel so the chat stays clean.",
      workspace: {
        artifact,
        kind: "artifact",
        subtitle: "Generated image output",
        title: artifact.title,
      },
    };
  }

  if (input.intent.routeTarget === "speech_generation") {
    const artifact = await generateSpeechAsset({
      instructions: "Natural, clear product-ready delivery.",
      modelId: input.speechModelId,
      provider: input.provider,
      text: input.intent.speechText,
      title: input.intent.title,
      voice: input.intent.voice,
    });

    return {
      artifact,
      assistantMessage:
        "I generated the speech asset and placed it in the workspace panel.",
      workspace: {
        artifact,
        kind: "artifact",
        subtitle: `Voice: ${artifact.voice}`,
        title: artifact.title,
      },
    };
  }

  if (input.intent.routeTarget === "video_generation") {
    const artifact = await startVideoGeneration({
      modelId: input.videoModelId,
      prompt: input.intent.assetPrompt,
      provider: input.provider,
      title: input.intent.title,
    });

    return {
      artifact,
      assistantMessage:
        "I queued the video generation job. It runs asynchronously, and the job details are in the workspace panel.",
      workspace: {
        artifact,
        kind: "artifact",
        subtitle: "Async video generation job",
        title: artifact.title,
      },
    };
  }

  const assistantMessage = await generateHelpfulAnswer({
    assistantModelId: input.assistantModelId,
    catalogItems: input.catalogItems,
    intent: input.intent,
    message: input.inputMessage,
    provider: input.provider,
  });

  if (input.catalogItems.length > 0) {
    return {
      assistantMessage,
      workspace: {
        highlightedId: input.catalogItems[0]?.id,
        items: input.catalogItems,
        kind: "catalog",
        subtitle: "Matched catalog entries",
        title: "Catalog results",
      },
    };
  }

  return {
    assistantMessage,
    workspace: {
      kind: "empty",
      subtitle: "Workspace content will appear here for assets, forms, and catalog results.",
      title: "Workspace",
    },
  };
}

function buildClarificationMessage(intent: IntentExtraction) {
  const details = intent.missingDetails
    .map((detail) => `- ${detail}`)
    .join("\n");

  return [
    "I can continue, but I need a few missing details first:",
    details || "- Add the missing constraints or desired output details.",
    "",
    "You can answer here in chat or use the workspace prompts on the right.",
  ].join("\n");
}

function shouldPersistIntent(intent: PersistedIntent, artifact?: MediaArtifact) {
  return (
    intent.persistence.shouldPersist ||
    intent.persistence.isUnresolved ||
    intent.routeTarget !== "general_assistance" ||
    Boolean(artifact)
  );
}

function toArtifactKind(artifact: MediaArtifact) {
  if (artifact.kind === "image") {
    return "image" as const;
  }

  if (artifact.kind === "audio") {
    return "audio" as const;
  }

  return "video" as const;
}

function toArtifactStatus(artifact: MediaArtifact) {
  if (artifact.kind === "video") {
    if (artifact.status === "completed") {
      return "ready" as const;
    }

    return artifact.status;
  }

  return "ready" as const;
}
