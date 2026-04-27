import "server-only";

import { getBorealRuntimeConfig } from "@/lib/boreal/config";
import {
  appendConversationAssistantMessage,
  appendRequestExecution,
  approveRequestDraft,
  ensureCatalogSeeded,
  getMyProfileRecord,
  getRequestExecutionContext,
  saveConversationExchange,
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
import {
  createEmptyProfileBuilderDraft,
  type ProfileBuilderDraft,
} from "@/lib/boreal/schemas/profile-builder";
import type {
  IntentExtraction,
  PersistedIntent,
  ToolRoute,
} from "@/lib/boreal/schemas/intent";
import { classifyGenerationIntent } from "@/lib/boreal/tools/embeddings/classify-generation-intent";
import { searchCatalog } from "@/lib/boreal/tools/catalog/search-catalog";
import { extractStructuredIntent } from "@/lib/boreal/tools/llm/extract-structured-intent";
import { draftProfileBuilder } from "@/lib/boreal/tools/llm/draft-profile-builder";
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
      description:
        "Drafts editable public profile and first-listing updates for supply onboarding requests.",
      execute: draftProfileBuilder,
      name: "draft-profile-builder",
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
    const intent = refineIntentForRequestLifecycle(
      extractedIntent,
      input.message,
      input.uiContext,
    );

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
    const currentProfile = input.requester?.externalId
      ? await getMyProfileRecord({
          ownerExternalId: input.requester.externalId,
        })
      : null;

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

    if (
      input.uiContext?.surface !== "request" &&
      requestNeedsApproval(persistedIntent)
    ) {
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
      currentProfile,
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

    if (input.uiContext?.surface === "request") {
      await appendConversationAssistantMessage({
        assistantMessage: resolved.assistantMessage,
        conversationId,
        ownerExternalId: input.requester?.externalId,
      });

      return {
        assistantMessage: resolved.assistantMessage,
        conversationId,
        intent: persistedIntent,
        intentId: input.uiContext.requestId ?? undefined,
        persisted: false,
        relatedCatalogItems,
        requiresApproval: false,
        workspace: resolved.workspace,
      };
    }

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
    } else {
      await saveConversationExchange({
        assistantMessage: resolved.assistantMessage,
        conversationId,
        ownerDisplayName: input.requester?.displayName,
        ownerExternalId: input.requester?.externalId,
        ownerHandle: input.requester?.handle,
        userMessage: input.message,
      });
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
  const executionAgentId = getExecutionAgentId(request.routeTarget);
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
    assignedAgent: executionAgentId,
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
  const executionAgentId = getExecutionAgentId(request.routeTarget);

  await appendRequestExecution({
    activityPayload: JSON.stringify({
      assignedAgent: executionAgentId,
      retrying: true,
      routeTarget: request.routeTarget,
    }),
    activityType: "request.retrying",
    assignedAgent: executionAgentId,
    assignedToolNames,
    assistantMessage: `Retrying this request with ${getExecutionAgentDisplayName(request.routeTarget)}.`,
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
  currentProfile: Awaited<ReturnType<typeof getMyProfileRecord>>;
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

  if (input.intent.routeTarget === "profile_update") {
    const draft = await draftProfileBuilder({
      currentProfile: input.currentProfile,
      message: input.inputMessage,
      modelId: input.assistantModelId,
      provider: input.provider,
    });

    return {
      assistantMessage:
        "Boreal drafted your public profile update and first supply listing. Review the builder, edit anything you want, then save it when ready.",
      relatedCatalogItems: [],
      requestStatus: "in_progress",
      workspace: {
        draft,
        kind: "profile_builder",
        sourceBrief: input.inputMessage,
        subtitle:
          "This draft is editable. Save the profile only, or publish the first listing after you review it.",
        title: "Profile and supply builder",
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
        "Image Studio completed this request. The generated output is attached here.",
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
        "Voiceover Studio completed this request. The audio deliverable is attached here.",
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
        "Video request approved. Motion Video Studio queued the render and will keep this request updated until delivery.",
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
  const currentProfile = input.input.ownerExternalId
    ? await getMyProfileRecord({
        ownerExternalId: input.input.ownerExternalId,
      })
    : null;
  const relatedCatalogItems =
    input.request.routeTarget !== "profile_update" &&
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
    const executionAgentId = getExecutionAgentId(input.request.routeTarget);
    const resolved = await runExecutionWithRetry({
      assistantModelId: input.runtimeConfig.assistantModel,
      catalogItems: relatedCatalogItems,
      currentProfile,
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
    const activityPayload = {
      assignedAgent: executionAgentId,
      routeTarget: input.request.routeTarget,
      ...(resolved.workspace.kind === "profile_builder"
        ? {
            draft: resolved.workspace.draft,
            sourceBrief: resolved.workspace.sourceBrief,
          }
        : {}),
    };
    const activityType =
      resolved.workspace.kind === "profile_builder"
        ? "profile.builder_drafted"
        : resolved.requestStatus === "fulfilled"
          ? "request.delivered"
          : resolved.requestStatus === "blocked"
            ? "request.blocked"
            : "request.started";

    await appendRequestExecution({
      activityPayload: JSON.stringify(activityPayload),
      activityType,
      assignedAgent: executionAgentId,
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
    const executionAgentId = getExecutionAgentId(input.request.routeTarget);

    await appendRequestExecution({
      activityPayload: JSON.stringify({
        assignedAgent: executionAgentId,
        error: message,
        routeTarget: input.request.routeTarget,
      }),
      activityType: "request.blocked",
      assignedAgent: executionAgentId,
      assignedToolNames: input.assignedToolNames,
      assistantMessage:
        `${getExecutionAgentDisplayName(input.request.routeTarget)} could not complete this request automatically. You can retry it from the workboard.`,
      intentId: input.input.intentId,
      ownerExternalId: input.input.ownerExternalId,
      status: "blocked",
    });

    return {
      assistantMessage:
        `${getExecutionAgentDisplayName(input.request.routeTarget)} could not complete this request automatically. The request is blocked and can be retried from the workboard.`,
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
  currentProfile: Awaited<ReturnType<typeof getMyProfileRecord>>;
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

  if (intent.routeTarget === "profile_update") {
    return {
      draft: buildProfileBuilderWorkspaceDraft(intent),
      kind: "profile_builder",
      sourceBrief: intent.body,
      subtitle:
        "Fill this manually now, or approve Boreal Agent to draft a stronger public profile and first listing from your brief.",
      title: "Profile and supply builder",
    };
  }

  if (intent.needsClarification || intent.routeTarget === "clarification") {
    return {
      kind: "clarification",
      questions: intent.missingDetails,
      subtitle:
        handlingMode === "workers"
          ? "Clarify the scope first, then approve if you want Boreal to open this work to the market."
          : "Clarify the outcome first, then approve if you want Boreal to open this as tracked work.",
      suggestions: intent.suggestedReplies,
      title: "Review before opening work",
    };
  }

  if (catalogItems.length > 0) {
    return {
      highlightedId: catalogItems[0]?.id,
      items: catalogItems,
      kind: "catalog",
      subtitle:
        handlingMode === "workers"
          ? "These matches can support the request once you approve and open it to the market."
          : "These matches are ready if you approve and want Boreal to route the work.",
      title: "Potential matches",
    };
  }

  return {
    kind: "empty",
    subtitle:
      handlingMode === "workers"
        ? "Approve to open this as tracked work and gather workers or proposals."
        : "Approve to open this as tracked work, or discard the draft.",
    title:
      handlingMode === "workers" ? "Ready to open work" : "Ready to open work",
  };
}

function buildApprovalMessage(intent: IntentExtraction, catalogItems: CatalogItem[]) {
  const handlingMode = getRequestHandlingMode(intent);
  const modeLabel = intent.requestedOutputTypes
    .map((value) => value.replaceAll("_", " "))
    .join(", ");

  if (intent.routeTarget === "profile_update") {
    return [
      "I prepared this as a private profile and supply onboarding workspace.",
      intent.summary,
      "Approving Boreal Agent will draft:",
      "- a stronger public profile headline and bio",
      "- searchable skills and capability tags",
      "- a first supply listing for your services, products, or offers",
      "If you prefer, open the builder form and fill it manually without using Boreal drafting.",
    ].join("\n\n");
  }

  if (handlingMode === "clarify") {
    return [
      `This looks like ${modeLabel} work, but it still needs a bit more scope before Boreal should open it.`,
      intent.summary,
      intent.missingDetails.length > 0
        ? `Still needed:\n${intent.missingDetails.map((detail) => `- ${detail}`).join("\n")}`
        : "Reply with the missing scope details in chat.",
      "Once that is clear, approve to open it as tracked work.",
    ].join("\n\n");
  }

  return [
    `I prepared a work draft for ${modeLabel}.`,
    intent.summary,
    `Recommended path: ${getRequestHandlingLabel(handlingMode)}.`,
    catalogItems.length > 0
      ? `I also found ${catalogItems.length} related catalog match${catalogItems.length === 1 ? "" : "es"}.`
      : "No extra artifacts were started yet.",
    getApprovalActionLine(intent.routeTarget, handlingMode),
  ].join("\n\n");
}

function getApprovalActionLine(
  routeTarget: ToolRoute,
  handlingMode: ReturnType<typeof getRequestHandlingMode>,
) {
  if (routeTarget === "image_generation") {
    return "Approve to hand this request to Image Studio, or discard the draft if you want to revise the prompt first.";
  }

  if (routeTarget === "speech_generation") {
    return "Approve to hand this request to Voiceover Studio, or discard the draft if you want to revise the script first.";
  }

  if (routeTarget === "video_generation") {
    return "Approve to hand this request to Motion Video Studio, or discard the draft if you want to revise the brief first.";
  }

  return handlingMode === "workers"
    ? "Approve to open it to workers and proposals, or discard the draft if you want to revise the ask first."
    : "Approve to open it as tracked work, or discard the draft if you want to revise the ask first.";
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
  if (
    !intent.needsClarification &&
    intent.routeTarget !== "profile_update" &&
    !intent.routing.shouldCreateFulfillmentRequest &&
    intent.requestedOutputTypes.every((type) => type === "text")
  ) {
    return false;
  }

  return (
    intent.needsClarification ||
    intent.routeTarget === "profile_update" ||
    intent.requestedOutputTypes.some((type) => type !== "text") ||
    intent.routing.shouldCreateFulfillmentRequest
  );
}

function shouldPersistIntent(intent: PersistedIntent, artifact?: MediaArtifact) {
  return (
    intent.persistence.isUnresolved ||
    intent.routeTarget === "profile_update" ||
    intent.routeTarget === "image_generation" ||
    intent.routeTarget === "speech_generation" ||
    intent.routeTarget === "video_generation" ||
    intent.routing.shouldCreateFulfillmentRequest ||
    Boolean(artifact)
  );
}

function buildAssignedTools(routeTarget: ToolRoute) {
  const baseTools = ["classify-generation-intent", "extract-structured-intent"];

  if (routeTarget === "profile_update") {
    return [...baseTools, "draft-profile-builder"];
  }

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

function buildProfileBuilderWorkspaceDraft(intent: IntentExtraction): ProfileBuilderDraft {
  const draft = createEmptyProfileBuilderDraft();

  draft.profile.headline = intent.title.slice(0, 120);
  draft.profile.bio = intent.summary.slice(0, 320);
  draft.profile.capabilityTags = intent.capabilityTags.slice(0, 8);
  draft.profile.skillTags = intent.capabilityTags.slice(0, 8);
  draft.profile.productLabels = intent.keywords.slice(0, 6);
  draft.listing.capabilityTags = intent.capabilityTags.slice(0, 8);
  draft.listing.description = intent.summary.slice(0, 320);
  draft.listing.title = intent.title.slice(0, 120);
  draft.listing.enabled = intent.intentType === "supply";

  return draft;
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

function getExecutionAgentId(routeTarget: ToolRoute) {
  if (routeTarget === "image_generation") {
    return "agent:image-studio";
  }

  if (routeTarget === "speech_generation") {
    return "agent:voiceover-studio";
  }

  if (routeTarget === "video_generation") {
    return "agent:motion-video-studio";
  }

  return "boreal-agent";
}

function getExecutionAgentDisplayName(routeTarget: ToolRoute) {
  if (routeTarget === "image_generation") {
    return "Image Studio";
  }

  if (routeTarget === "speech_generation") {
    return "Voiceover Studio";
  }

  if (routeTarget === "video_generation") {
    return "Motion Video Studio";
  }

  return "Boreal Agent";
}
