import "server-only";

import { getBorealRuntimeConfig } from "@/lib/boreal/config";
import {
  appendRequestExecution,
  approveRequestDraft,
  ensureCatalogSeeded,
  getRequestExecutionContext,
  saveArtifactMetadata,
  saveIntentPipelineRecord,
} from "@/lib/boreal/dal/intent-repository";
import type { ComposableAgent } from "@/lib/boreal/agents/base";
import { resolveProviderAdapter } from "@/lib/boreal/integrations/providers/registry";
import {
  getRequestHandlingLabel,
  getRequestHandlingMode,
  refineIntentForRequestLifecycle,
} from "@/lib/boreal/routing/request-handling";
import type {
  ChatAssistantResponse,
  CatalogItem,
  ChatUiContext,
  MediaArtifact,
  WorkspaceState,
} from "@/lib/boreal/schemas/chat";
import type {
  IntentExtraction,
  PersistedIntent,
  ToolRoute,
} from "@/lib/boreal/schemas/intent";
import { classifyGenerationIntent } from "@/lib/boreal/tools/embeddings/classify-generation-intent";
import { searchCatalog } from "@/lib/boreal/tools/catalog/search-catalog";
import { extractStructuredIntent } from "@/lib/boreal/tools/llm/extract-structured-intent";
import { generateHelpfulAnswer } from "@/lib/boreal/tools/llm/generate-helpful-answer";
import { generateImageAsset } from "@/lib/boreal/tools/media/generate-image-asset";
import { generateSpeechAsset } from "@/lib/boreal/tools/media/generate-speech-asset";
import { startVideoGeneration } from "@/lib/boreal/tools/media/start-video-generation";
import { buildIntentPersistencePayload } from "@/lib/boreal/tools/ui/build-intent-response";
import { withRetry } from "@/lib/boreal/utils/retry";

type RequesterIdentity = {
  displayName?: string;
  externalId?: string;
  handle?: string;
};

type ChatAssistantAgentInput = {
  conversationId?: string;
  message: string;
  requester?: RequesterIdentity;
  uiContext?: ChatUiContext;
};

type ApprovedExecutionResult = {
  assistantMessage: string;
  relatedCatalogItems: CatalogItem[];
  requestStatus: "blocked" | "fulfilled" | "in_progress";
  workspace: WorkspaceState;
  artifact?: MediaArtifact;
};

export const chatAssistantAgent: ComposableAgent<
  "chat-assistant",
  readonly unknown[],
  ChatAssistantAgentInput,
  ChatAssistantResponse
> = {
  description:
    "Detects Boreal requests from chat, drafts approval-first requests, and executes approved work through routed tools.",
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
      description: "Generates image assets for approved image requests.",
      execute: generateImageAsset,
      name: "generate-image-asset",
    },
    {
      description: "Generates speech assets for approved TTS requests.",
      execute: generateSpeechAsset,
      name: "generate-speech-asset",
    },
    {
      description: "Starts async video generation jobs for approved video requests.",
      execute: startVideoGeneration,
      name: "start-video-generation",
    },
    {
      description: "Persists routed request state into Convex.",
      execute: saveIntentPipelineRecord,
      name: "save-intent-pipeline-record",
    },
  ] as const,
  async run(input) {
    const runtimeConfig = getBorealRuntimeConfig();
    const provider = resolveProviderAdapter();

    await ensureCatalogSeeded();

    const modality = await withRetry(
      () =>
        classifyGenerationIntent({
          embeddingModelId: runtimeConfig.embeddingModel,
          message: input.message,
          provider,
        }),
      { attempts: 3 },
    );

    const extractedIntent = await withRetry(
      () =>
        extractStructuredIntent({
          intentModelId: runtimeConfig.intentModel,
          message: input.message,
          modalityScores: modality.modalityScores,
          provider,
          uiContext: input.uiContext,
        }),
      { attempts: 3 },
    );
    const intent = refineIntentForRequestLifecycle(extractedIntent, input.message);

    const relatedCatalogItems = intent.shouldSearchCatalog
      ? await withRetry(
          () =>
            searchCatalog({
              limit: 6,
              query: intent.catalogQuery || input.message,
            }),
          { attempts: 2 },
        )
      : [];

    const conversationId = input.conversationId ?? crypto.randomUUID();
    const userMessageId = crypto.randomUUID();
    const assistantMessageId = crypto.randomUUID();
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

    if (requestNeedsApproval(persistedIntent)) {
      const assistantMessage = buildApprovalMessage(intent, relatedCatalogItems);
      const persistedResult = await saveIntentPipelineRecord({
        assistantMessage,
        conversationId,
        initialStatus: "proposed",
        intent: persistedIntent,
        ownerDisplayName: input.requester?.displayName,
        ownerExternalId: input.requester?.externalId,
        ownerHandle: input.requester?.handle,
        userMessage: input.message,
      });

      return {
        assistantMessage,
        conversationId,
        intent: persistedIntent,
        intentId: persistedResult.intentId,
        persisted: true,
        relatedCatalogItems,
        requiresApproval: true,
        workspace: buildDraftWorkspace(intent, relatedCatalogItems),
      };
    }

    const resolved = await runExecutionWithRetry({
      assistantModelId: runtimeConfig.assistantModel,
      catalogItems: relatedCatalogItems,
      imageModelId: runtimeConfig.imageModel,
      inputMessage: input.message,
      intent,
      provider,
      speechModelId: runtimeConfig.speechModel,
      uiContext: input.uiContext,
      videoModelId: runtimeConfig.videoModel,
    });

    let intentId: string | undefined;
    let persisted = false;

    if (shouldPersistIntent(persistedIntent, resolved.artifact)) {
      const persistedResult = await saveIntentPipelineRecord({
        assistantMessage: resolved.assistantMessage,
        conversationId,
        intent: persistedIntent,
        ownerDisplayName: input.requester?.displayName,
        ownerExternalId: input.requester?.externalId,
        ownerHandle: input.requester?.handle,
        userMessage: input.message,
      });

      intentId = persistedResult.intentId;
      persisted = true;

      if (resolved.artifact) {
        await saveArtifactMetadata({
          artifactKind: toArtifactKind(resolved.artifact),
          conversationId,
          intentKey: persistedResult.intentKey,
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
      requiresApproval: false,
      workspace: resolved.workspace,
    };
  },
};

export async function approvePersistedRequest(input: {
  intentId: string;
  ownerExternalId?: string;
}) {
  const runtimeConfig = getBorealRuntimeConfig();
  const provider = resolveProviderAdapter();

  await ensureCatalogSeeded();

  const request = await getRequestExecutionContext({
    intentId: input.intentId,
    ownerExternalId: input.ownerExternalId,
  });

  if (!request) {
    throw new Error("Request not found.");
  }

  const handlingMode = getRequestHandlingMode(toExecutionIntent(request));
  const assignedToolNames = buildAssignedTools(request.routeTarget);
  if (handlingMode === "clarify") {
    throw new Error("This request still needs clarification before approval.");
  }

  if (handlingMode === "workers") {
    await approveRequestDraft({
      assistantMessage:
        "Request approved. Boreal opened it for proposals instead of auto-executing it.",
      intentId: input.intentId,
      ownerExternalId: input.ownerExternalId,
      status: "open",
    });

    return {
      assistantMessage:
        "This request is now open for workers. Boreal will keep tracking proposals and matched supply here.",
      intentId: input.intentId,
      relatedCatalogItems:
        request.catalogQuery.trim().length > 0
          ? await withRetry(
              () =>
                searchCatalog({
                  limit: 6,
                  query: request.catalogQuery,
                }),
              { attempts: 2 },
            )
          : [],
      workspace: buildApprovedWorkerWorkspace(request),
    };
  }

  await approveRequestDraft({
    assignedAgent: "boreal-agent",
    assignedToolNames,
    intentId: input.intentId,
    ownerExternalId: input.ownerExternalId,
    status: "claimed",
  });

  return runApprovedExecutionForRequest({
    assignedToolNames,
    input,
    provider,
    request,
    runtimeConfig,
  });
}

export async function retryPersistedRequest(input: {
  intentId: string;
  ownerExternalId?: string;
}) {
  const runtimeConfig = getBorealRuntimeConfig();
  const provider = resolveProviderAdapter();

  await ensureCatalogSeeded();

  const request = await getRequestExecutionContext({
    intentId: input.intentId,
    ownerExternalId: input.ownerExternalId,
  });

  if (!request) {
    throw new Error("Request not found.");
  }

  const assignedToolNames = buildAssignedTools(request.routeTarget);

  await appendRequestExecution({
    activityPayload: JSON.stringify({
      assignedAgent: "boreal-agent",
      retrying: true,
      routeTarget: request.routeTarget,
    }),
    activityType: "request.retrying",
    assignedAgent: "boreal-agent",
    assignedToolNames,
    assistantMessage: "Retrying this request with the current Boreal agent stack.",
    intentId: input.intentId,
    ownerExternalId: input.ownerExternalId,
    status: "in_progress",
  });

  return runApprovedExecutionForRequest({
    assignedToolNames,
    input,
    provider,
    request,
    runtimeConfig,
  });
}

async function executeIntent(input: {
  assistantModelId: string;
  catalogItems: CatalogItem[];
  imageModelId: string;
  inputMessage: string;
  intent: IntentExtraction;
  provider: ReturnType<typeof resolveProviderAdapter>;
  speechModelId: string;
  uiContext?: ChatUiContext;
  videoModelId: string;
}): Promise<ApprovedExecutionResult> {
  if (input.intent.needsClarification || input.intent.routeTarget === "clarification") {
    return {
      assistantMessage: buildClarificationMessage(input.intent),
      relatedCatalogItems: input.catalogItems,
      requestStatus: "blocked",
      workspace: {
        kind: "clarification",
        questions: input.intent.missingDetails,
        subtitle: "Reply in chat or use the workspace prompts to unblock the request.",
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
        "Image request approved and completed. The generated output is attached to this request.",
      relatedCatalogItems: input.catalogItems,
      requestStatus: "fulfilled",
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
        "Voice request approved and completed. The audio deliverable is attached to this request.",
      relatedCatalogItems: input.catalogItems,
      requestStatus: "fulfilled",
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
        "Video request approved. Boreal queued the render and will keep this request updated until delivery.",
      relatedCatalogItems: input.catalogItems,
      requestStatus: "in_progress",
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
    uiContext: input.uiContext,
  });

  if (input.catalogItems.length > 0) {
    return {
      assistantMessage,
      relatedCatalogItems: input.catalogItems,
      requestStatus: "fulfilled",
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
    relatedCatalogItems: input.catalogItems,
    requestStatus: "fulfilled",
    workspace: {
      kind: "empty",
      subtitle: "The work is complete. Request details and history remain available on the side panels.",
      title: "Work complete",
    },
  };
}

async function runApprovedExecutionForRequest(input: {
  assignedToolNames: string[];
  input: {
    intentId: string;
    ownerExternalId?: string;
  };
  provider: ReturnType<typeof resolveProviderAdapter>;
  request: NonNullable<Awaited<ReturnType<typeof getRequestExecutionContext>>>;
  runtimeConfig: ReturnType<typeof getBorealRuntimeConfig>;
}) {
  const relatedCatalogItems =
    input.request.catalogQuery.trim().length > 0
      ? await withRetry(
          () =>
            searchCatalog({
              limit: 6,
              query: input.request.catalogQuery,
            }),
          { attempts: 2 },
        )
      : [];

  try {
    const resolved = await runExecutionWithRetry({
      assistantModelId: input.runtimeConfig.assistantModel,
      catalogItems: relatedCatalogItems,
      imageModelId: input.runtimeConfig.imageModel,
      inputMessage: input.request.body,
      intent: toExecutionIntent(input.request),
      provider: input.provider,
      speechModelId: input.runtimeConfig.speechModel,
      uiContext: {
        canApproveProposals: false,
        canSubmitProposal: false,
        centerTab: "chat",
        requestId: input.input.intentId,
        requestRole: "owner",
        requestStatus: input.request.status,
        surface: "request",
      },
      videoModelId: input.runtimeConfig.videoModel,
    });

    await appendRequestExecution({
      activityPayload: JSON.stringify({
        assignedAgent: "boreal-agent",
        routeTarget: input.request.routeTarget,
      }),
      activityType:
        resolved.requestStatus === "fulfilled"
          ? "request.delivered"
          : resolved.requestStatus === "blocked"
            ? "request.blocked"
            : "request.started",
      assignedAgent: "boreal-agent",
      assignedToolNames: input.assignedToolNames,
      assistantMessage: resolved.assistantMessage,
      intentId: input.input.intentId,
      ownerExternalId: input.input.ownerExternalId,
      status: resolved.requestStatus,
    });

    if (resolved.artifact) {
      await saveArtifactMetadata({
        artifactKind: toArtifactKind(resolved.artifact),
        conversationId: input.request.conversationId ?? crypto.randomUUID(),
        intentKey: input.request.intentKey,
        mediaType:
          resolved.artifact.kind === "video"
            ? "video/mp4"
            : resolved.artifact.mediaType,
        metadataJson: JSON.stringify(resolved.artifact),
        provider: input.provider.key,
        remoteId:
          resolved.artifact.kind === "video"
            ? resolved.artifact.jobId
            : undefined,
        status: toArtifactStatus(resolved.artifact),
        subtitle: resolved.workspace.subtitle,
        title: resolved.artifact.title,
      });
    }

    return {
      assistantMessage: resolved.assistantMessage,
      intentId: input.input.intentId,
      relatedCatalogItems,
      workspace: resolved.workspace,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Boreal failed after retrying this request.";

    await appendRequestExecution({
      activityPayload: JSON.stringify({
        assignedAgent: "boreal-agent",
        error: message,
        routeTarget: input.request.routeTarget,
      }),
      activityType: "request.blocked",
      assignedAgent: "boreal-agent",
      assignedToolNames: input.assignedToolNames,
      assistantMessage:
        "Boreal could not complete this request automatically. You can retry it from the workboard.",
      intentId: input.input.intentId,
      ownerExternalId: input.input.ownerExternalId,
      status: "blocked",
    });

    return {
      assistantMessage:
        "Boreal could not complete this request automatically. The request is blocked and can be retried from the workboard.",
      intentId: input.input.intentId,
      relatedCatalogItems,
      workspace: {
        kind: "empty",
        subtitle: "Execution failed after automatic retries. Use retry to run the request again.",
        title: "Retry needed",
      } satisfies WorkspaceState,
    };
  }
}

async function runExecutionWithRetry(input: {
  assistantModelId: string;
  catalogItems: CatalogItem[];
  imageModelId: string;
  inputMessage: string;
  intent: IntentExtraction;
  provider: ReturnType<typeof resolveProviderAdapter>;
  speechModelId: string;
  uiContext?: ChatUiContext;
  videoModelId: string;
}) {
  return withRetry(() => executeIntent(input), { attempts: 3, baseDelayMs: 600 });
}

function toExecutionIntent(
  request: NonNullable<Awaited<ReturnType<typeof getRequestExecutionContext>>>,
): IntentExtraction {
  return {
    assetPrompt: request.assetPrompt,
    body: request.body,
    capabilityTags: [],
    catalogQuery: request.catalogQuery,
    category: "request",
    confidence: 0.8,
    extractionNotes: [],
    generationSignals: request.generationSignals,
    intentType: "demand",
    keywords: [],
    missingDetails: request.missingDetails,
    needsClarification: request.needsClarification,
    persistence: {
      isUnresolved: request.needsClarification,
      reason: "Approved Boreal request.",
      shouldPersist: true,
    },
    requestedOutputTypes: request.requestedOutputTypes,
    responseInstructions: request.responseInstructions,
    routeTarget: request.routeTarget,
    routing: {
      resolutionTier: "auto",
      shouldCreateFulfillmentRequest: true,
      shouldPersistToBoard: true,
    },
    shouldSearchCatalog: request.catalogQuery.trim().length > 0,
    speechText: request.speechText,
    suggestedReplies: request.suggestedReplies,
    summary: request.summary,
    title: request.title,
    voice: request.voice,
  };
}

function buildDraftWorkspace(intent: IntentExtraction, catalogItems: CatalogItem[]): WorkspaceState {
  const handlingMode = getRequestHandlingMode(intent);

  if (intent.needsClarification || intent.routeTarget === "clarification") {
    return {
      kind: "clarification",
      questions: intent.missingDetails,
      subtitle:
        handlingMode === "workers"
          ? "Clarify the scope first, then open it for workers or proposals."
          : "Clarify the outcome first, then approve Boreal Agent to draft the final deliverable.",
      suggestions: intent.suggestedReplies,
      title: "Clarify before approval",
    };
  }

  if (catalogItems.length > 0) {
    return {
      highlightedId: catalogItems[0]?.id,
      items: catalogItems,
      kind: "catalog",
      subtitle:
        handlingMode === "workers"
          ? "These matches can support worker discovery once the request is approved."
          : "Relevant matches are ready if you want Boreal or the market to handle this request.",
      title: "Preflight matches",
    };
  }

  return {
    kind: "empty",
    subtitle:
      handlingMode === "workers"
        ? "Approve to publish this request for workers and proposals."
        : "Approve to let Boreal Agent handle it, or cancel to discard the draft.",
    title:
      handlingMode === "workers" ? "Open for workers" : "Approve Boreal Agent",
  };
}

function buildApprovalMessage(intent: IntentExtraction, catalogItems: CatalogItem[]) {
  const handlingMode = getRequestHandlingMode(intent);
  const modeLabel = intent.requestedOutputTypes
    .map((value) => value.replaceAll("_", " "))
    .join(", ");

  if (handlingMode === "clarify") {
    return [
      `I drafted this as a ${modeLabel} request, but it still needs a bit more scope before anyone should start.`,
      intent.summary,
      intent.missingDetails.length > 0
        ? `Still needed:\n${intent.missingDetails.map((detail) => `- ${detail}`).join("\n")}`
        : "Reply with the missing scope details in chat.",
      "Once that is clear, you can approve Boreal Agent or open it for proposals.",
    ].join("\n\n");
  }

  return [
    `I drafted a request for ${modeLabel}.`,
    intent.summary,
    `Recommended next handler: ${getRequestHandlingLabel(handlingMode)}.`,
    catalogItems.length > 0
      ? `I also found ${catalogItems.length} related catalog match${catalogItems.length === 1 ? "" : "es"}.`
      : "No extra artifacts were started yet.",
    handlingMode === "workers"
      ? "Approve to open it for workers and proposals, or cancel if you want to revise the ask first."
      : "Approve to let Boreal Agent start, or cancel if you want to revise the ask first.",
  ].join("\n\n");
}

function buildClarificationMessage(intent: IntentExtraction) {
  const details = intent.missingDetails.map((detail) => `- ${detail}`).join("\n");

  return [
    "This request is active, but it still needs a few details:",
    details || "- Add the missing constraints or desired output details.",
    "",
    "Reply here or use the workspace prompts to unblock it.",
  ].join("\n");
}

function requestNeedsApproval(intent: PersistedIntent) {
  return (
    intent.routeTarget !== "general_assistance" ||
    intent.needsClarification ||
    intent.requestedOutputTypes.some((type) => type !== "text") ||
    intent.routing.shouldCreateFulfillmentRequest
  );
}

function shouldPersistIntent(intent: PersistedIntent, artifact?: MediaArtifact) {
  return (
    intent.persistence.shouldPersist ||
    intent.persistence.isUnresolved ||
    intent.routeTarget !== "general_assistance" ||
    Boolean(artifact)
  );
}

function buildAssignedTools(routeTarget: ToolRoute) {
  const baseTools = ["classify-generation-intent", "extract-structured-intent"];

  if (routeTarget === "catalog_lookup") {
    return [...baseTools, "search-catalog", "generate-helpful-answer"];
  }

  if (routeTarget === "image_generation") {
    return [...baseTools, "generate-image-asset"];
  }

  if (routeTarget === "speech_generation") {
    return [...baseTools, "generate-speech-asset"];
  }

  if (routeTarget === "video_generation") {
    return [...baseTools, "start-video-generation"];
  }

  if (routeTarget === "clarification") {
    return baseTools;
  }

  return [...baseTools, "generate-helpful-answer"];
}

function buildApprovedWorkerWorkspace(
  request: NonNullable<Awaited<ReturnType<typeof getRequestExecutionContext>>>,
): WorkspaceState {
  if (request.catalogQuery.trim().length > 0) {
    return {
      kind: "empty",
      subtitle: "This request is approved and waiting for proposals or matched workers to claim it.",
      title: "Waiting for workers",
    };
  }

  return {
    kind: "empty",
    subtitle: "Boreal approved the request and opened it for workers instead of auto-executing it.",
    title: "Waiting for workers",
  };
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
