import "server-only";

import { getBorealRuntimeConfig } from "@/lib/boreal/config";
import { buildVideoSettingsSummary } from "../../media/video-contract.ts";
import {
  appendConversationAssistantMessage,
  appendRequestExecution,
  approveMatchedSupply,
  approveRequestDraft,
  ensureCatalogSeeded,
  getMyProfileRecord,
  getRequestDetailRecord,
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
import {
  buildAutoRoutePlan,
  executeAutoRoute,
} from "@/lib/boreal/one-request/routing";
import type {
  ChatAssistantResponse,
  ChatAssistantDebugEvent,
  CatalogItem,
  ChatUiContext,
  MediaArtifact,
  WorkspaceState,
} from "@/lib/boreal/schemas/chat";
import {
  createEmptyProfileBuilderDraft,
  type ProfileBuilderDraft,
} from "@/lib/boreal/schemas/profile-builder";
import { deriveRequestClassification } from "@/lib/boreal/schemas/intent";
import type {
  IntentExtraction,
  PersistedIntent,
  ToolRoute,
} from "@/lib/boreal/schemas/intent";
import type { OneRequestRoutePlan } from "@/lib/boreal/one-request/types";
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
import {
  buildAutoReopenForWorkersCopy,
  shouldAutoReopenRequestForWorkers,
} from "@/lib/boreal/request-recovery";
import {
  buildInitialInteractiveFollowUpQuestion,
  buildInteractiveExecutionMessage,
  isInteractiveRequestAgentKey,
  planInteractiveRequestThread,
} from "../request-thread-specialists";

type RequesterIdentity = {
  displayName?: string;
  externalId?: string;
  handle?: string;
};

type ChatAssistantAgentInput = {
  conversationId?: string;
  message: string;
  onDebugEvent?: (event: ChatAssistantDebugEvent) => void | Promise<void>;
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

    const interactiveThreadResult = await continueApprovedRequestThread({
      input,
      provider,
      runtimeConfig,
    });

    if (interactiveThreadResult) {
      return interactiveThreadResult;
    }

    await ensureCatalogSeeded();

    const modalityDebugId = crypto.randomUUID();
    await emitDebugEvent(input.onDebugEvent, {
      id: modalityDebugId,
      input: {
        message: input.message,
      },
      state: "input-available",
      title: "Classify request modality",
      type: "tool-classify-generation-intent",
    });

    let modality;

    try {
      modality = await withRetry(
        () =>
          classifyGenerationIntent({
            embeddingModelId: runtimeConfig.embeddingModel,
            message: input.message,
            provider,
          }),
        { attempts: 3 },
      );
    } catch (error) {
      await emitDebugEvent(input.onDebugEvent, {
        errorText:
          error instanceof Error
            ? error.message
            : "Failed to classify request modality.",
        id: modalityDebugId,
        input: {
          message: input.message,
        },
        state: "output-error",
        title: "Classify request modality",
        type: "tool-classify-generation-intent",
      });
      throw error;
    }

    await emitDebugEvent(input.onDebugEvent, {
      id: modalityDebugId,
      input: {
        message: input.message,
      },
      output: {
        modalityScores: modality.modalityScores.map(({ kind, score }) => ({
          kind,
          score: Number(score.toFixed(4)),
        })),
        primaryMode: modality.modalityScores[0]?.kind ?? "text",
      },
      state: "output-available",
      title: "Classify request modality",
      type: "tool-classify-generation-intent",
    });

    const extractionDebugId = crypto.randomUUID();
    await emitDebugEvent(input.onDebugEvent, {
      id: extractionDebugId,
      input: {
        message: input.message,
        modalityScores: modality.modalityScores.map(({ kind, score }) => ({
          kind,
          score: Number(score.toFixed(4)),
        })),
      },
      state: "input-available",
      title: "Extract structured intent",
      type: "tool-extract-structured-intent",
    });

    let extractedIntent;

    try {
      extractedIntent = await withRetry(
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
    } catch (error) {
      await emitDebugEvent(input.onDebugEvent, {
        errorText:
          error instanceof Error
            ? error.message
            : "Failed to extract structured intent.",
        id: extractionDebugId,
        input: {
          message: input.message,
        },
        state: "output-error",
        title: "Extract structured intent",
        type: "tool-extract-structured-intent",
      });
      throw error;
    }

    await emitDebugEvent(input.onDebugEvent, {
      id: extractionDebugId,
      input: {
        message: input.message,
      },
      output: {
        capabilityTags: extractedIntent.capabilityTags,
        category: extractedIntent.category,
        extractionNotes: extractedIntent.extractionNotes,
        intentType: extractedIntent.intentType,
        keywords: extractedIntent.keywords,
        missingDetails: extractedIntent.missingDetails,
        needsClarification: extractedIntent.needsClarification,
        requestedOutputTypes: extractedIntent.requestedOutputTypes,
        routeTarget: extractedIntent.routeTarget,
        routing: extractedIntent.routing,
        shouldSearchCatalog: extractedIntent.shouldSearchCatalog,
      },
      state: "output-available",
      title: "Extract structured intent",
      type: "tool-extract-structured-intent",
    });

    const intent = refineIntentForRequestLifecycle(
      extractedIntent,
      input.message,
      input.uiContext,
    );
    await emitDebugEvent(input.onDebugEvent, {
      id: crypto.randomUUID(),
      input: {
        extractedIntent: {
          intentType: extractedIntent.intentType,
          needsClarification: extractedIntent.needsClarification,
          requestedOutputTypes: extractedIntent.requestedOutputTypes,
          routeTarget: extractedIntent.routeTarget,
          routing: extractedIntent.routing,
          shouldSearchCatalog: extractedIntent.shouldSearchCatalog,
        },
        uiContext: input.uiContext ?? null,
      },
      output: {
        catalogQuery: intent.catalogQuery,
        handlingMode: getRequestHandlingMode(intent),
        intentType: intent.intentType,
        needsClarification: intent.needsClarification,
        persistence: intent.persistence,
        requestedOutputTypes: intent.requestedOutputTypes,
        routeTarget: intent.routeTarget,
        routing: intent.routing,
        shouldSearchCatalog: intent.shouldSearchCatalog,
      },
      state: "output-available",
      title: "Refine routed request",
      type: "tool-refine-request-lifecycle",
    });

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
    const specialistRoutePlan = buildSpecialistRoutePlan({
      intent: persistedIntent,
      message: input.message,
    });
    const previewCatalogItems = mergePreviewCatalogItems(
      relatedCatalogItems,
      buildRoutePreviewCatalogItems(specialistRoutePlan),
    );

    if (
      input.uiContext?.surface !== "request" &&
      requestNeedsApproval(persistedIntent)
    ) {
      const assistantMessage = buildApprovalMessage(
        intent,
        previewCatalogItems,
        specialistRoutePlan,
      );
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
        relatedCatalogItems: previewCatalogItems,
        requiresApproval: true,
        workspace: buildDraftWorkspace(
          intent,
          previewCatalogItems,
          specialistRoutePlan,
        ),
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

async function emitDebugEvent(
  callback: ChatAssistantAgentInput["onDebugEvent"],
  event: ChatAssistantDebugEvent,
) {
  await callback?.(event);
}

async function continueApprovedRequestThread(input: {
  input: ChatAssistantAgentInput;
  provider: ReturnType<typeof resolveProviderAdapter>;
  runtimeConfig: ReturnType<typeof getBorealRuntimeConfig>;
}): Promise<ChatAssistantResponse | null> {
  const requestId = input.input.uiContext?.requestId;
  const ownerExternalId = input.input.requester?.externalId;

  if (
    input.input.uiContext?.surface !== "request" ||
    !requestId ||
    !ownerExternalId
  ) {
    return null;
  }

  const requestDetail = await getRequestDetailRecord({
    intentId: requestId,
    ownerExternalId,
  });

  if (
    !requestDetail.intent ||
    !requestDetail.access?.isOwner ||
    (requestDetail.intent.status !== "claimed" &&
      requestDetail.intent.status !== "in_progress")
  ) {
    return null;
  }

  const threadPlan = planInteractiveRequestThread(requestDetail);

  if (!threadPlan) {
    return null;
  }

  const request = await getRequestExecutionContext({
    intentId: requestId,
    ownerExternalId,
  });

  if (!request) {
    return null;
  }

  const persistedIntent = toPersistedExecutionIntent(
    request,
    input.runtimeConfig,
    input.provider.key,
  );

  try {
    if (threadPlan.kind === "ask") {
      await appendRequestExecution({
        activityPayload: JSON.stringify({
          assignedAgent: threadPlan.agent.identity.displayName,
          assignedToolNames: [threadPlan.agent.key],
          awaitingUserReply: true,
          routeLabel: threadPlan.agent.identity.displayName,
          routeTarget: request.routeTarget,
        }),
        activityType: "request.follow_up",
        assignedAgent: threadPlan.agent.identity.displayName,
        assignedToolNames: [threadPlan.agent.key],
        assistantMessage: threadPlan.assistantMessage,
        intentId: requestId,
        ownerExternalId,
        status: "in_progress",
      });

      return {
        assistantMessage: threadPlan.assistantMessage,
        conversationId: request.conversationId ?? crypto.randomUUID(),
        intent: persistedIntent,
        intentId: requestId,
        persisted: false,
        relatedCatalogItems: [],
        requiresApproval: false,
        workspace: {
          kind: "empty",
          subtitle:
            "Reply in this request thread. The approved specialist now owns the next turn here.",
          title: "Specialist follow-up",
        },
      };
    }

    const result = await threadPlan.agent.directExecution!.invoke({
      modelId: input.runtimeConfig.assistantModel,
      payload: threadPlan.payload,
    });
    const assistantMessage = buildInteractiveExecutionMessage(result);

    await appendRequestExecution({
      activityPayload: JSON.stringify({
        assignedAgent: threadPlan.agent.identity.displayName,
        assignedToolNames: [threadPlan.agent.key],
        routeLabel: threadPlan.agent.identity.displayName,
        routeTarget: request.routeTarget,
      }),
      activityType: "request.delivered",
      assignedAgent: threadPlan.agent.identity.displayName,
      assignedToolNames: [threadPlan.agent.key],
      assistantMessage,
      intentId: requestId,
      ownerExternalId,
      status: "fulfilled",
    });

    return {
      assistantMessage,
      conversationId: request.conversationId ?? crypto.randomUUID(),
      intent: persistedIntent,
      intentId: requestId,
      persisted: false,
      relatedCatalogItems: [],
      requiresApproval: false,
      workspace: {
        kind: "empty",
        subtitle:
          "The specialist delivered in-thread. Request history stays attached here for review and payout follow-through.",
        title: "Route complete",
      },
    };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "The approved specialist could not continue this request.";

    await appendRequestExecution({
      activityPayload: JSON.stringify({
        assignedAgent: threadPlan.agent.identity.displayName,
        assignedToolNames: [threadPlan.agent.key],
        error: message,
        routeLabel: threadPlan.agent.identity.displayName,
        routeTarget: request.routeTarget,
      }),
      activityType: "request.blocked",
      assignedAgent: threadPlan.agent.identity.displayName,
      assignedToolNames: [threadPlan.agent.key],
      assistantMessage:
        `${threadPlan.agent.identity.displayName} could not continue this request automatically. Last error: ${message}. Retry it or reopen it for workers.`,
      intentId: requestId,
      ownerExternalId,
      status: "blocked",
    });

    return {
      assistantMessage:
        `${threadPlan.agent.identity.displayName} could not continue this request automatically. Last error: ${message}. The request is blocked until you retry it or reopen it for workers.`,
      conversationId: request.conversationId ?? crypto.randomUUID(),
      intent: persistedIntent,
      intentId: requestId,
      persisted: false,
      relatedCatalogItems: [],
      requiresApproval: false,
      workspace: buildBlockedWorkspace(request.routeTarget, message),
    };
  }
}

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

  const persistedExecutionIntent = toPersistedExecutionIntent(
    request,
    runtimeConfig,
    provider.key,
  );
  const specialistRoutePlan = buildSpecialistRoutePlan({
    intent: persistedExecutionIntent,
    message: request.body,
  });
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

  if (specialistRoutePlan) {
    const selectedRoutePlan = narrowSpecialistRoutePlanForExecution(
      specialistRoutePlan,
    );
    const specialistToolNames = selectedRoutePlan.selected.map(
      (selection) => selection.agent.key,
    );
    const assignedAgentLabel = selectedRoutePlan.selected
      .map((selection) => selection.agent.identity.displayName)
      .join(", ");

    await approveRequestDraft({
      assignedAgent: assignedAgentLabel,
      assignedToolNames: specialistToolNames,
      assistantMessage: `Request approved. Boreal locked the best route: ${assignedAgentLabel}.`,
      intentId: input.intentId,
      ownerExternalId: input.ownerExternalId,
      status: "claimed",
    });

    return runApprovedSpecialistExecutionForRequest({
      input,
      provider,
      request,
      routePlan: selectedRoutePlan,
      runtimeConfig,
    });
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

export async function openPersistedRequestForWorkers(input: {
  intentId: string;
  ownerExternalId?: string;
}) {
  await ensureCatalogSeeded();

  const request = await getRequestExecutionContext({
    intentId: input.intentId,
    ownerExternalId: input.ownerExternalId,
  });

  if (!request) {
    throw new Error("Request not found.");
  }

  await approveRequestDraft({
    assistantMessage:
      "Boreal reopened this request for workers after the automatic route stalled. Matching and proposals stay attached here.",
    intentId: input.intentId,
    ownerExternalId: input.ownerExternalId,
    status: "open",
  });

  return {
    assistantMessage:
      "This request is now open for workers and proposals. Boreal kept the failed automatic route in the timeline so you can compare it against the next participants.",
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

export async function approveMatchedSupplyForRequest(input: {
  intentId: string;
  ownerExternalId?: string;
  supplyId: string;
}) {
  await ensureCatalogSeeded();

  const request = await getRequestExecutionContext({
    intentId: input.intentId,
    ownerExternalId: input.ownerExternalId,
  });

  if (!request) {
    throw new Error("Request not found.");
  }

  const result = await approveMatchedSupply({
    intentId: input.intentId,
    ownerExternalId: input.ownerExternalId,
    supplyId: input.supplyId,
  });

  if (!result.approved) {
    throw new Error(mapMatchedSupplyApprovalError(result.reason));
  }

  return {
    approved: true as const,
    assistantMessage:
      "Boreal approved that match into the team. The request is now active and the worker can begin.",
    intentId: input.intentId,
    workspace: {
      kind: "empty",
      subtitle:
        "The selected worker is now part of this request. Boreal kept the remaining matches attached so you can compare or add more collaborators later.",
      title: "Worker approved",
    } satisfies WorkspaceState,
  };
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

  const persistedExecutionIntent = toPersistedExecutionIntent(
    request,
    runtimeConfig,
    provider.key,
  );
  const specialistRoutePlan = buildSpecialistRoutePlan({
    intent: persistedExecutionIntent,
    message: request.body,
  });
  const selectedRoutePlan = specialistRoutePlan
    ? narrowSpecialistRoutePlanForExecution(specialistRoutePlan)
    : null;
  const assignedToolNames = buildAssignedTools(request.routeTarget);
  const executionAgentId = getExecutionAgentId(request.routeTarget);
  const retryToolNames = selectedRoutePlan
    ? selectedRoutePlan.selected.map((selection) => selection.agent.key)
    : assignedToolNames;
  const retryAgentLabel = selectedRoutePlan
    ? selectedRoutePlan.selected
        .map((selection) => selection.agent.identity.displayName)
        .join(", ")
    : executionAgentId;

  await appendRequestExecution({
    activityPayload: JSON.stringify({
      assignedAgent: retryAgentLabel,
      retrying: true,
      routeTarget: request.routeTarget,
    }),
    activityType: "request.retrying",
    assignedAgent: retryAgentLabel,
    assignedToolNames: retryToolNames,
    assistantMessage: selectedRoutePlan
      ? `Retrying this request with ${retryAgentLabel}.`
      : `Retrying this request with ${getExecutionAgentDisplayName(request.routeTarget)}.`,
    intentId: input.intentId,
    ownerExternalId: input.ownerExternalId,
    status: "in_progress",
  });

  if (selectedRoutePlan) {
    return runApprovedSpecialistExecutionForRequest({
      input,
      provider,
      request,
      routePlan: selectedRoutePlan,
      runtimeConfig,
    });
  }

  return runApprovedExecutionForRequest({
    assignedToolNames,
    input,
    provider,
    request,
    runtimeConfig,
  });
}

async function reopenBlockedRequestForWorkers(input: {
  assignedAgent: string;
  assignedToolNames: string[];
  input: {
    input: {
      intentId: string;
      ownerExternalId?: string;
    };
    request: NonNullable<Awaited<ReturnType<typeof getRequestExecutionContext>>>;
  };
  message: string;
  relatedCatalogItems: CatalogItem[];
}) {
  const recoveryCopy = buildAutoReopenForWorkersCopy({
    assignedAgent: input.assignedAgent,
    message: input.message,
    routeTarget: input.input.request.routeTarget,
  });

  await approveRequestDraft({
    assignedAgent: input.assignedAgent,
    assignedToolNames: input.assignedToolNames,
    assistantMessage: recoveryCopy.approvalMessage,
    intentId: input.input.input.intentId,
    ownerExternalId: input.input.input.ownerExternalId,
    status: "open",
  });

  return {
    assistantMessage: recoveryCopy.assistantMessage,
    intentId: input.input.input.intentId,
    relatedCatalogItems: input.relatedCatalogItems,
    workspace: buildApprovedWorkerWorkspace(input.input.request),
  };
}

function mapMatchedSupplyApprovalError(
  reason:
    | "capacity_exhausted"
    | "gated_out"
    | "missing_buyer_wallet"
    | "missing_payout_wallet"
    | "request_not_open"
    | "supplier_unavailable"
    | "wallet_network_mismatch"
    | undefined,
) {
  switch (reason) {
    case "capacity_exhausted":
      return "That worker is already at capacity right now.";
    case "gated_out":
      return "That worker no longer passes the current request gates.";
    case "missing_buyer_wallet":
      return "Connect a buyer wallet before approving paid work.";
    case "missing_payout_wallet":
      return "The selected worker needs a payout wallet before approval.";
    case "request_not_open":
      return "This request is not open for worker approval anymore.";
    case "supplier_unavailable":
      return "That worker is unavailable right now.";
    case "wallet_network_mismatch":
      return "Buyer and worker payout wallets must be on the same supported network for paid work.";
    default:
      return "Could not approve that worker into the team.";
  }
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
      seconds: input.intent.videoSeconds,
      size: input.intent.videoSize,
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
        subtitle: buildVideoSettingsSummary({
          seconds: artifact.seconds,
          size: artifact.size,
        }),
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
    const shouldAutoReopenForWorkers = shouldAutoReopenRequestForWorkers(
      input.request.routeTarget,
      message,
    );

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
        `${getExecutionAgentDisplayName(input.request.routeTarget)} could not complete this request automatically. Last error: ${message}. Retry it or reopen it for workers.`,
      intentId: input.input.intentId,
      ownerExternalId: input.input.ownerExternalId,
      status: "blocked",
    });

    if (shouldAutoReopenForWorkers) {
      return reopenBlockedRequestForWorkers({
        assignedAgent: executionAgentId,
        assignedToolNames: input.assignedToolNames,
        input,
        message,
        relatedCatalogItems,
      });
    }

    return {
      assistantMessage:
        `${getExecutionAgentDisplayName(input.request.routeTarget)} could not complete this request automatically. Last error: ${message}. The request is blocked until you retry it or reopen it for workers.`,
      intentId: input.input.intentId,
      relatedCatalogItems,
      workspace: {
        ...buildBlockedWorkspace(input.request.routeTarget, message),
      } satisfies WorkspaceState,
    };
  }
}

async function runApprovedSpecialistExecutionForRequest(input: {
  input: {
    intentId: string;
    ownerExternalId?: string;
  };
  provider: ReturnType<typeof resolveProviderAdapter>;
  request: NonNullable<Awaited<ReturnType<typeof getRequestExecutionContext>>>;
  routePlan: OneRequestRoutePlan;
  runtimeConfig: ReturnType<typeof getBorealRuntimeConfig>;
}) {
  const persistedIntent = toPersistedExecutionIntent(
    input.request,
    input.runtimeConfig,
    input.provider.key,
  );
  const leadSelection = input.routePlan.selected[0] ?? null;
  const relatedCatalogItems = mergePreviewCatalogItems(
    input.request.catalogQuery.trim().length > 0
      ? await withRetry(
          () =>
            searchCatalog({
              limit: 6,
              query: input.request.catalogQuery,
            }),
          { attempts: 2 },
        )
      : [],
    buildRoutePreviewCatalogItems(input.routePlan),
  );

  if (leadSelection && isInteractiveRequestAgentKey(leadSelection.agent.key)) {
    const assistantMessage = buildInitialInteractiveFollowUpQuestion(
      leadSelection.agent.key,
    );
    const assignedAgent = leadSelection.agent.identity.displayName;

    await appendRequestExecution({
      activityPayload: JSON.stringify({
        assignedAgent,
        assignedToolNames: [leadSelection.agent.key],
        awaitingUserReply: true,
        routeLabel: assignedAgent,
        routeTarget: input.request.routeTarget,
      }),
      activityType: "request.follow_up",
      assignedAgent,
      assignedToolNames: [leadSelection.agent.key],
      assistantMessage,
      intentId: input.input.intentId,
      ownerExternalId: input.input.ownerExternalId,
      status: "in_progress",
    });

    return {
      assistantMessage,
      intentId: input.input.intentId,
      relatedCatalogItems,
      workspace: {
        kind: "empty",
        subtitle:
          "Reply in this request thread. The approved specialist now owns the next turn here.",
        title: "Specialist follow-up",
      } satisfies WorkspaceState,
    };
  }

  try {
    const results = await executeAutoRoute({
      intent: persistedIntent,
      modelId: input.runtimeConfig.assistantModel,
      routePlan: input.routePlan,
    });

    if (results.length === 0) {
      throw new Error("No specialist route completed the approved request.");
    }

    const assistantMessage = buildSpecialistExecutionMessage(results);
    const assignedAgent = input.routePlan.selected
      .map((selection) => selection.agent.identity.displayName)
      .join(", ");

    await appendRequestExecution({
      activityPayload: JSON.stringify({
        assignedAgent,
        routeLabel: assignedAgent,
        routeTarget: input.request.routeTarget,
        selectedAgentKeys: input.routePlan.selected.map(
          (selection) => selection.agent.key,
        ),
      }),
      activityType: "request.delivered",
      assignedAgent,
      assignedToolNames: input.routePlan.selected.map(
        (selection) => selection.agent.key,
      ),
      assistantMessage,
      intentId: input.input.intentId,
      ownerExternalId: input.input.ownerExternalId,
      status: "fulfilled",
    });

    return {
      assistantMessage,
      intentId: input.input.intentId,
      relatedCatalogItems,
      workspace:
        relatedCatalogItems.length > 0
          ? ({
              highlightedId: relatedCatalogItems[0]?.id,
              items: relatedCatalogItems,
              kind: "catalog",
              subtitle:
                "Boreal routed this request through the strongest matched specialists.",
              title: "Matched route",
            } satisfies WorkspaceState)
          : ({
              kind: "empty",
              subtitle:
                "The matched specialist route completed. Request history stays in the chat timeline.",
              title: "Route complete",
            } satisfies WorkspaceState),
    };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "The matched specialist route failed.";
    const assignedAgent = input.routePlan.selected
      .map((selection) => selection.agent.identity.displayName)
      .join(", ");
    const assignedToolNames = input.routePlan.selected.map(
      (selection) => selection.agent.key,
    );
    const shouldAutoReopenForWorkers = shouldAutoReopenRequestForWorkers(
      input.request.routeTarget,
      message,
    );

    await appendRequestExecution({
      activityPayload: JSON.stringify({
        assignedAgent,
        error: message,
        routeLabel: assignedAgent,
        routeTarget: input.request.routeTarget,
        selectedAgentKeys: input.routePlan.selected.map(
          (selection) => selection.agent.key,
        ),
      }),
      activityType: "request.blocked",
      assignedAgent,
      assignedToolNames,
      assistantMessage:
        `The matched specialist route could not complete this request automatically. Last error: ${message}. Retry it or reopen it for workers.`,
      intentId: input.input.intentId,
      ownerExternalId: input.input.ownerExternalId,
      status: "blocked",
    });

    if (shouldAutoReopenForWorkers) {
      return reopenBlockedRequestForWorkers({
        assignedAgent,
        assignedToolNames,
        input,
        message,
        relatedCatalogItems,
      });
    }

    return {
      assistantMessage:
        `The matched specialist route could not complete this request automatically. Last error: ${message}. The request is blocked until you retry it or reopen it for workers.`,
      intentId: input.input.intentId,
      relatedCatalogItems,
      workspace: {
        ...buildBlockedWorkspace(input.request.routeTarget, message),
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
  const routing = {
    resolutionTier: "auto" as const,
    shouldCreateFulfillmentRequest: true,
    shouldPersistToBoard: true,
  };
  const shouldSearchCatalog = request.catalogQuery.trim().length > 0;

  return {
    assetPrompt: request.assetPrompt,
    body: request.body,
    capabilityTags: request.capabilityTags,
    catalogQuery: request.catalogQuery,
    category: request.category,
    classification: deriveRequestClassification({
      intentType: "demand",
      needsClarification: request.needsClarification,
      requestedOutputTypes: request.requestedOutputTypes,
      routeTarget: request.routeTarget,
      routing,
      shouldSearchCatalog,
    }),
    confidence: 0.8,
    extractionNotes: [],
    generationSignals: request.generationSignals,
    intentType: "demand",
    keywords: request.keywords,
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
    routing,
    shouldSearchCatalog,
    speechText: request.speechText,
    suggestedReplies: request.suggestedReplies,
    summary: request.summary,
    title: request.title,
    videoSeconds: request.videoSeconds,
    videoSize: request.videoSize,
    voice: request.voice,
  };
}

function toPersistedExecutionIntent(
  request: NonNullable<Awaited<ReturnType<typeof getRequestExecutionContext>>>,
  runtimeConfig: ReturnType<typeof getBorealRuntimeConfig>,
  providerKey: string,
): PersistedIntent {
  return {
    ...toExecutionIntent(request),
    assistantMessageId: crypto.randomUUID(),
    conversationId: request.conversationId ?? crypto.randomUUID(),
    embedding: [],
    embeddingModel: runtimeConfig.embeddingModel,
    intentModel: runtimeConfig.intentModel,
    modalityScores: [],
    provider: providerKey,
    userMessageId: crypto.randomUUID(),
  };
}

function buildDraftWorkspace(
  intent: IntentExtraction,
  catalogItems: CatalogItem[],
  specialistRoutePlan?: OneRequestRoutePlan | null,
): WorkspaceState {
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
    const hasSpecialistPreview =
      handlingMode !== "workers" &&
      Boolean(specialistRoutePlan && specialistRoutePlan.selected.length > 0);

    return {
      highlightedId: catalogItems[0]?.id,
      items: catalogItems,
      kind: "catalog",
      subtitle:
        handlingMode === "workers"
          ? "These matches can support the request once you approve and open it to the market."
          : hasSpecialistPreview
            ? "Boreal already scored the strongest specialist routes. Review them before you open tracked work."
            : "These matches are ready if you approve and want Boreal to route the work.",
      title: hasSpecialistPreview ? "Best-fit routes" : "Potential matches",
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

function buildApprovalMessage(
  intent: IntentExtraction,
  catalogItems: CatalogItem[],
  specialistRoutePlan?: OneRequestRoutePlan | null,
) {
  const handlingMode = getRequestHandlingMode(intent);
  const workLabel = describeIntentWorkLabel(intent);

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
      `This looks like ${workLabel}, but it still needs a bit more scope before Boreal should open it.`,
      intent.summary,
      intent.missingDetails.length > 0
        ? `Still needed:\n${intent.missingDetails.map((detail) => `- ${detail}`).join("\n")}`
        : "Reply with the missing scope details in chat.",
      "Once that is clear, approve to open it as tracked work.",
    ].join("\n\n");
  }

  if (specialistRoutePlan && specialistRoutePlan.selected.length > 0) {
    const primary = specialistRoutePlan.selected[0]?.agent.identity.displayName;
    const alternates = specialistRoutePlan.selected
      .slice(1)
      .map((selection) => selection.agent.identity.displayName);

    return [
      `This is qualified ${workLabel}.`,
      intent.summary,
      primary
        ? `Top match: ${primary}.`
        : "Boreal already found a strong direct route for the first pass.",
      alternates.length > 0
        ? `Alternates are attached below: ${alternates.join(", ")}.`
        : "The top route is already expanded below.",
      "Invite the highlighted route when you want Boreal to start tracked work.",
    ].join("\n\n");
  }

  return [
    `I prepared a draft for ${workLabel}.`,
    intent.summary,
    `Recommended path: ${getRequestHandlingLabel(handlingMode)}.`,
    intent.routeTarget === "video_generation"
      ? `Planned render: ${buildVideoSettingsSummary({
          seconds: intent.videoSeconds,
          size: intent.videoSize,
        })}.`
      : null,
    catalogItems.length > 0
      ? `I also found ${catalogItems.length} related catalog match${catalogItems.length === 1 ? "" : "es"}.`
      : "No extra artifacts were started yet.",
    getApprovalActionLine(intent.routeTarget, handlingMode),
  ]
    .filter((section): section is string => Boolean(section))
    .join("\n\n");
}

function describeIntentWorkLabel(intent: IntentExtraction) {
  const solanaSignal = [
    intent.category,
    intent.title,
    intent.summary,
    intent.body,
    ...intent.capabilityTags,
    ...intent.keywords,
  ]
    .join(" ")
    .toLowerCase();

  if (
    intent.category.trim().toLowerCase() === "solana" ||
    /\b(solana|jupiter|raydium|orca|meteora|phantom|backpack|stake|staking|swap|wallet)\b/i.test(
      solanaSignal,
    )
  ) {
    return "Solana work";
  }

  return intent.requestedOutputTypes
    .map((value) => `${value.replaceAll("_", " ")} work`)
    .join(", ");
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

function buildBlockedWorkspace(routeTarget: ToolRoute, message: string): WorkspaceState {
  if (
    routeTarget === "video_generation" &&
    /video route is unavailable for the current project or API key/i.test(message)
  ) {
    return {
      kind: "empty",
      subtitle:
        "Motion Video Studio could not start because the current OpenAI project or key does not have working Sora video access. Fix provider access, then retry or reopen the request for workers.",
      title: "Video route unavailable",
    };
  }

  return {
    kind: "empty",
    subtitle: `Execution failed after automatic retries. Last error: ${message}`,
    title: "Route blocked",
  };
}

function buildSpecialistRoutePlan(input: {
  intent: PersistedIntent;
  message: string;
}) {
  const routeTarget = input.intent.routeTarget;
  const textOnlyRequest =
    input.intent.requestedOutputTypes.length === 1 &&
    input.intent.requestedOutputTypes[0] === "text";

  if (
    input.intent.intentType !== "demand" ||
    input.intent.needsClarification ||
    !input.intent.routing.shouldCreateFulfillmentRequest ||
    !textOnlyRequest ||
    routeTarget === "catalog_lookup" ||
    routeTarget === "profile_update" ||
    routeTarget === "clarification" ||
    routeTarget === "image_generation" ||
    routeTarget === "speech_generation" ||
    routeTarget === "video_generation"
  ) {
    return null;
  }

  const routePlan = buildAutoRoutePlan({
    intent: input.intent,
    message: input.message,
  });

  if (!routePlan) {
    return null;
  }

  const textSelections = routePlan.selected.filter((selection) =>
    selection.outputKinds.includes("text"),
  );

  if (textSelections.length === 0) {
    return null;
  }

  return {
    ...routePlan,
    selected: textSelections,
    totalQuoteUsd: textSelections.reduce(
      (sum, selection) => sum + selection.quoteUsd,
      0,
    ),
  } satisfies OneRequestRoutePlan;
}

function narrowSpecialistRoutePlanForExecution(routePlan: OneRequestRoutePlan) {
  const leader =
    routePlan.selected.find((selection) =>
      selection.outputKinds.includes("text"),
    ) ?? routePlan.selected[0];

  if (!leader) {
    return routePlan;
  }

  return {
    ...routePlan,
    selected: [leader],
    summary: `Auto route locked to ${leader.agent.identity.displayName}.`,
    totalQuoteUsd: leader.quoteUsd,
  } satisfies OneRequestRoutePlan;
}

function buildRoutePreviewCatalogItems(
  routePlan: OneRequestRoutePlan | null | undefined,
): CatalogItem[] {
  if (!routePlan) {
    return [];
  }

  return routePlan.selected.map((selection, index) => ({
    actorKind: "agent",
    averageRating: null,
    brand: "Boreal",
    capabilityTags: selection.agent.supplyEntry.capabilityTags,
    category: selection.agent.supplyEntry.category,
    checkoutProtocol: selection.agent.supplyEntry.checkoutProtocol ?? "custom",
    currency: routePlan.currency,
    deliveryType: selection.agent.supplyEntry.deliveryType,
    description: selection.agent.supplyEntry.description,
    estimatedDeliveryLabel:
      selection.agent.supplyEntry.estimatedDeliveryLabel ??
      `${routePlan.estimatedMinutes} min`,
    executionSurface:
      selection.agent.supplyEntry.executionSurface ?? "http",
    executorUrl:
      selection.agent.supplyEntry.executorUrl ??
      selection.agent.directExecution?.routePath ??
      null,
    fulfillmentKind:
      selection.agent.supplyEntry.fulfillmentKind ?? "digital",
    gatedOutReasons: [],
    id: `route-preview:${selection.agent.key}`,
    isCartEnabled: false,
    isPinned: index === 0,
    matchReasons: [
      `direct specialist score ${selection.score}`,
      ...selection.agent.profile.skillTags.slice(0, 2),
    ],
    matchScore: selection.score,
    matchStage: "ranked",
    paymentNetworkHints: [routePlan.networkKey],
    paymentProtocol: routePlan.paymentProtocol,
    priceAmount: selection.quoteUsd,
    priceLabel: `${routePlan.currency} ${selection.quoteUsd.toFixed(2)}/fixed`,
    requiresHumanApproval: false,
    reviewCount: 0,
    seller: {
      actorKind: "agent",
      displayName: selection.agent.identity.displayName,
      handle: selection.agent.identity.handle,
      profileId: `external:${selection.agent.identity.externalId}`,
    },
    sourceListingUrl: null,
    sourceProviderKey: "manual",
    subtitle: selection.agent.profile.headline,
    supplyType: selection.agent.supplyEntry.supplyType,
    supportsDirectInvoke: true,
    supportsPrivyWallet: false,
    successProbability: selection.score,
    title: selection.agent.supplyEntry.title,
  }));
}

function mergePreviewCatalogItems(
  catalogItems: CatalogItem[],
  previewItems: CatalogItem[],
) {
  const merged = [...previewItems, ...catalogItems];
  const seen = new Set<string>();

  return merged.filter((item) => {
    const key = `${item.title}::${item.seller?.displayName ?? ""}`;

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function buildSpecialistExecutionMessage(
  results: Awaited<ReturnType<typeof executeAutoRoute>>,
) {
  if (results.length === 1 && results[0]?.result.kind === "text") {
    return [
      `${results[0].result.title} completed this request.`,
      results[0].result.content,
    ].join("\n\n");
  }

  return results
    .map((result) => {
      if (result.result.kind !== "text") {
        return `${result.result.title} completed this request.`;
      }

      return [`## ${result.result.title}`, result.result.content].join("\n\n");
    })
    .join("\n\n");
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
      subtitle:
        "This request is open for proposals and matched workers. Approve a team directly from the attached matches when you are ready.",
      title: "Waiting for workers",
    };
  }

  return {
    kind: "empty",
    subtitle:
      "Boreal opened the request for workers instead of auto-executing it. Approve a team directly when the right match appears.",
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
