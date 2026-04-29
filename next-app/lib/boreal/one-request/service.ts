import "server-only";

import {
  appendRequestExecution,
  ensureCatalogSeeded,
  markRequestFulfilled,
  saveArtifactMetadata,
  saveIntentPipelineRecord,
} from "@/lib/boreal/dal/intent-repository";
import { getBorealRuntimeConfig } from "@/lib/boreal/config";
import { resolveProviderAdapter } from "@/lib/boreal/integrations/providers/registry";
import { refineIntentForRequestLifecycle } from "@/lib/boreal/routing/request-handling";
import type { PersistedIntent } from "@/lib/boreal/schemas/intent";
import { classifyGenerationIntent } from "@/lib/boreal/tools/embeddings/classify-generation-intent";
import { extractStructuredIntent } from "@/lib/boreal/tools/llm/extract-structured-intent";
import { buildIntentPersistencePayload } from "@/lib/boreal/tools/ui/build-intent-response";
import {
  buildDirectAgentTeamBlueprint,
  serializeRequestTeamBlueprint,
} from "@/lib/boreal/swarm/team-blueprint";

import { executeAutoRoute } from "./routing";
import type {
  OneRequestCaller,
  OneRequestExecutionResult,
  OneRequestRoutePlan,
} from "./types";

export async function prepareOneRequest(input: { message: string }) {
  await ensureCatalogSeeded();
  const runtimeConfig = getBorealRuntimeConfig();
  const provider = resolveProviderAdapter();
  const modality = await classifyGenerationIntent({
    embeddingModelId: runtimeConfig.embeddingModel,
    message: input.message,
    provider,
  });
  const extracted = await extractStructuredIntent({
    intentModelId: runtimeConfig.intentModel,
    message: input.message,
    modalityScores: modality.modalityScores,
    provider,
    uiContext: {
      browseTab: "requests",
      centerTab: "chat",
      requestId: null,
      requestRole: "none",
      requestStatus: null,
      surface: "home",
    },
  });
  const refined = refineIntentForRequestLifecycle(extracted, input.message, undefined);

  return {
    embedding: modality.embedding,
    extractedIntent: refined,
    modalityScores: modality.modalityScores,
    providerKey: provider.key,
    runtimeConfig,
  };
}

export function buildPersistedIntent(input: {
  assistantMessageId: string;
  conversationId: string;
  embedding: number[];
  extractedIntent: ReturnType<typeof refineIntentForRequestLifecycle>;
  intentModel: string;
  modalityScores: PersistedIntent["modalityScores"];
  providerKey: string;
  userMessageId: string;
  embeddingModel: string;
}) {
  return buildIntentPersistencePayload({
    assistantMessageId: input.assistantMessageId,
    conversationId: input.conversationId,
    embedding: input.embedding,
    embeddingModel: input.embeddingModel,
    intent: input.extractedIntent,
    intentModel: input.intentModel,
    modalityScores: input.modalityScores,
    provider: input.providerKey,
    userMessageId: input.userMessageId,
  });
}

export async function persistOneRequestThread(input: {
  assistantMessage: string;
  caller: OneRequestCaller;
  initialStatus: "blocked" | "open";
  persistedIntent: PersistedIntent;
  routePlan?: OneRequestRoutePlan | null;
  userMessage: string;
}) {
  return saveIntentPipelineRecord({
    assignedTeamJson:
      input.routePlan
        ? serializeRequestTeamBlueprint(
            buildDirectAgentTeamBlueprint(
              input.routePlan.selected.map((selection) => selection.agent),
            ),
          )
        : undefined,
    assistantMessage: input.assistantMessage,
    conversationId: input.persistedIntent.conversationId,
    initialStatus: input.initialStatus,
    intent: input.persistedIntent,
    ownerDisplayName: input.caller.displayName,
    ownerExternalId: input.caller.externalId,
    ownerHandle: undefined,
    userMessage: input.userMessage,
  });
}

export async function executeAndPersistOneRequest(input: {
  caller: OneRequestCaller;
  intentId: string;
  intentKey: string;
  persistedIntent: PersistedIntent;
  routePlan: OneRequestRoutePlan;
}) {
  const assignedTeamJson = serializeRequestTeamBlueprint(
    buildDirectAgentTeamBlueprint(
      input.routePlan.selected.map((selection) => selection.agent),
    ),
  );

  await appendRequestExecution({
    activityPayload: JSON.stringify({
      agentKeys: input.routePlan.selected.map((selection) => selection.agent.key),
      requestMode: "auto",
    }),
    activityType: "request.execution_started",
    assignedAgent: "Boreal Agent",
    assignedTeamJson,
    assignedToolNames: input.routePlan.selected.map((selection) => selection.agent.key),
    assistantMessage: `Executing the locked auto route across ${input.routePlan.selected
      .map((selection) => selection.agent.identity.displayName)
      .join(", ")}.`,
    intentId: input.intentId,
    ownerExternalId: input.caller.externalId,
    status: "in_progress",
  });

  const results = await executeAutoRoute({
    intent: input.persistedIntent,
    routePlan: input.routePlan,
  });

  for (const execution of results) {
    await persistExecutionArtifact({
      conversationId: input.persistedIntent.conversationId,
      execution,
      intentKey: input.intentKey,
      provider: input.persistedIntent.provider,
    });
  }

  const completionMessage = buildCompletionMessage(results);
  await appendRequestExecution({
    activityPayload: JSON.stringify({
      completedAgentKeys: results.map((execution) => execution.agentKey),
      resultCount: results.length,
    }),
    activityType: "request.delivered",
    assignedAgent: "Boreal Agent",
    assignedToolNames: results.map((execution) => execution.agentKey),
    assistantMessage: completionMessage,
    intentId: input.intentId,
    ownerExternalId: input.caller.externalId,
    status: "fulfilled",
  });
  await markRequestFulfilled({
    intentId: input.intentId,
    ownerExternalId: input.caller.externalId,
  });

  return {
    completionMessage,
    results,
  };
}

function buildCompletionMessage(results: OneRequestExecutionResult[]) {
  const labels = results.map((result) => result.result.title).join(", ");

  return results.length === 1
    ? `Delivered through ${labels}.`
    : `Delivered through ${labels}.`;
}

async function persistExecutionArtifact(input: {
  conversationId: string;
  execution: OneRequestExecutionResult;
  intentKey: string;
  provider: string;
}) {
  switch (input.execution.result.kind) {
    case "image_generation":
      await saveArtifactMetadata({
        artifactKind: "image",
        conversationId: input.conversationId,
        intentKey: input.intentKey,
        mediaType: input.execution.result.mediaType,
        metadataJson: JSON.stringify({
          agentKey: input.execution.agentKey,
          base64: input.execution.result.base64,
          prompt: input.execution.result.prompt,
        }),
        provider: input.provider,
        remoteId: undefined,
        status: "ready",
        subtitle: input.execution.result.prompt,
        title: input.execution.result.title,
      });
      break;
    case "speech_generation":
      await saveArtifactMetadata({
        artifactKind: "audio",
        conversationId: input.conversationId,
        intentKey: input.intentKey,
        mediaType: input.execution.result.mediaType,
        metadataJson: JSON.stringify({
          agentKey: input.execution.agentKey,
          base64: input.execution.result.base64,
          format: input.execution.result.format,
          transcript: input.execution.result.transcript,
          voice: input.execution.result.voice,
        }),
        provider: input.provider,
        remoteId: undefined,
        status: "ready",
        subtitle: input.execution.result.transcript.slice(0, 140),
        title: input.execution.result.title,
      });
      break;
    case "video_generation":
      await saveArtifactMetadata({
        artifactKind: "video",
        conversationId: input.conversationId,
        intentKey: input.intentKey,
        mediaType: "video/mp4",
        metadataJson: JSON.stringify({
          agentKey: input.execution.agentKey,
          jobId: input.execution.result.jobId,
          model: input.execution.result.model,
          progress: input.execution.result.progress,
          size: input.execution.result.size,
          status: input.execution.result.status,
        }),
        provider: input.provider,
        remoteId: input.execution.result.jobId,
        status: input.execution.result.status === "completed" ? "ready" : "queued",
        subtitle: input.execution.result.prompt,
        title: input.execution.result.title,
      });
      break;
    case "text":
      break;
    default:
      break;
  }
}
