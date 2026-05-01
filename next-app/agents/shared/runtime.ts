import type { Id } from "../../convex/_generated/dataModel.js";

import { api, createAgentConvexClient } from "./convex-client.ts";
import { buildDirectExecutionProtocolDescriptor } from "./registry.ts";
import type {
  RequestDetail,
} from "../../lib/boreal/integrations/convex/function-refs.ts";
import type {
  AgentExecutionResult,
  AgentRequestDetail,
  AutonomousAgentDefinition,
} from "./types.ts";

const MATCH_THRESHOLD = 30;

export async function syncAgentPresence(agent: AutonomousAgentDefinition) {
  const client = createAgentConvexClient();
  const now = Date.now();

  await client.mutation(api.profiles.upsertMyProfile, {
    availabilityStatus: agent.profile.availabilityStatus,
    bio: agent.profile.bio,
    capabilityTags: agent.profile.capabilityTags,
    headline: agent.profile.headline,
    isPublic: agent.profile.isPublic,
    ownerActorKind: agent.identity.actorKind,
    ownerDisplayName: agent.identity.displayName,
    ownerExternalId: agent.identity.externalId,
    ownerHandle: agent.identity.handle,
    productLabels: agent.profile.productLabels,
    skillTags: agent.profile.skillTags,
  });

  if (agent.settlement) {
    const walletSync = await client.mutation(api.wallets.syncWalletAccount, {
      chainFamily: agent.settlement.chainFamily,
      environment: agent.settlement.environment,
      networkKey: agent.settlement.networkKey,
      ownerDisplayName: agent.identity.displayName,
      ownerExternalId: agent.identity.externalId,
      roles: ["connected", "payout"],
      setAsDefaultBuyer: false,
      setAsDefaultPayout: true,
      walletAddress: agent.settlement.payoutAddress,
      walletProvider: "manual",
    });

    if (walletSync.walletAccountId) {
      await client.mutation(api.wallets.setDefaultPayoutWalletAccount, {
        ownerExternalId: agent.identity.externalId,
        walletAccountId: walletSync.walletAccountId,
      });
    }
  }

  const supplyResult = await client.mutation(
    api.supplies.createSupplyEntry,
    buildAgentSupplyMutationArgs(agent, now),
  );

  if (!supplyResult.created || !supplyResult.supplyId) {
    throw new Error(
      `Could not sync agent "${agent.key}" into supply: ${supplyResult.reason ?? "unknown_error"}.`,
    );
  }
}

export async function runAgentTick(
  agent: AutonomousAgentDefinition,
  modelId = process.env.BOREAL_AGENT_MODEL ?? "gpt-4.1-mini",
) {
  const client = createAgentConvexClient();
  const requests = await client.query(api.intents.listMarketplace, {
    limit: 32,
    ownerExternalId: agent.identity.externalId,
    query: undefined,
  });

  for (const request of requests) {
    if (!["open", "proposed", "claimed", "in_progress"].includes(request.status)) {
      continue;
    }

    const baseScore = agent.match({ request });

    if (baseScore < MATCH_THRESHOLD) {
      continue;
    }

    const detail = (await client.query(api.intents.getRequestDetail, {
      intentId: request._id,
      ownerExternalId: agent.identity.externalId,
    })) as RequestDetail;

    if (!detail.intent || !detail.access) {
      continue;
    }

    const score = agent.match({ detail: detail.intent, request });

    if (score < MATCH_THRESHOLD) {
      continue;
    }

    const myProposal = detail.proposals.find((proposal) => proposal.isMine);

    if (
      detail.access.canSubmitProposal &&
      !myProposal &&
      (detail.intent.status === "open" || detail.intent.status === "proposed")
    ) {
      const proposal = agent.buildProposal({ detail: detail.intent });
      await client.mutation(api.proposals.submitProposal, {
        currency: proposal.currency,
        deliverablesBody: proposal.deliverablesBody,
        deliverablesType: "markdown",
        etaAt: proposal.etaAt,
        intentId: detail.intent._id as Id<"intents">,
        ownerDisplayName: agent.identity.displayName,
        ownerExternalId: agent.identity.externalId,
        ownerHandle: agent.identity.handle,
        price: proposal.price,
        proposerKind: "agent",
      });
      console.log(`[${agent.key}] submitted proposal for ${detail.intent.title}`);
      continue;
    }

    if (
      myProposal?.status === "accepted" &&
      (detail.intent.status === "claimed" || detail.intent.status === "in_progress")
    ) {
      const artifactDelivery = await maybeRunDirectArtifactDelivery({
        agent,
        detail,
        modelId,
      });

      if (artifactDelivery) {
        if (
          artifactDelivery.artifact.kind === "video" &&
          hasPendingQueuedArtifact(detail)
        ) {
          console.log(`[${agent.key}] skipped duplicate queued render for ${detail.intent.title}`);
          continue;
        }

        const result = await client.mutation(api.fulfillments.submitWork, {
          artifact:
            artifactDelivery.artifact.kind === "video"
              ? {
                  artifactKind: "video",
                  mediaType: "video/mp4",
                  metadataJson: JSON.stringify(artifactDelivery.artifact),
                  remoteId: artifactDelivery.artifact.jobId,
                  status: normalizeArtifactStatus(artifactDelivery.artifact),
                  subtitle: artifactDelivery.subtitle,
                  title: artifactDelivery.artifact.title,
                }
              : artifactDelivery.artifact.kind === "audio"
                ? {
                    artifactKind: "audio",
                    mediaType: artifactDelivery.artifact.mediaType,
                    metadataJson: JSON.stringify(artifactDelivery.artifact),
                    status: "ready",
                    subtitle: artifactDelivery.subtitle,
                    title: artifactDelivery.artifact.title,
                  }
                : {
                    artifactKind: "image",
                    mediaType: artifactDelivery.artifact.mediaType,
                    metadataJson: JSON.stringify(artifactDelivery.artifact),
                    status: "ready",
                    subtitle: artifactDelivery.subtitle,
                  title: artifactDelivery.artifact.title,
                },
          deliverablesBody: artifactDelivery.deliverablesBody,
          deliveryStage:
            artifactDelivery.artifact.kind === "video" &&
            normalizeArtifactStatus(artifactDelivery.artifact) !== "ready"
              ? "started"
              : "delivered",
          intentId: detail.intent._id as Id<"intents">,
          workerDisplayName: agent.identity.displayName,
          workerExternalId: agent.identity.externalId,
        });

        if (result.submitted) {
          console.log(`[${agent.key}] submitted media work for ${detail.intent.title}`);
        }

        continue;
      }

      const delivery = await agent.buildDelivery({
        detail: detail.intent,
        modelId,
      });

      const result = await client.mutation(api.fulfillments.submitWork, {
        deliverablesBody: delivery.deliverablesBody,
        intentId: detail.intent._id as Id<"intents">,
        workerDisplayName: agent.identity.displayName,
        workerExternalId: agent.identity.externalId,
      });

      if (result.submitted) {
        console.log(`[${agent.key}] submitted work for ${detail.intent.title}`);
      }
    }
  }
}

export async function watchAgent(
  agent: AutonomousAgentDefinition,
  options?: {
    intervalMs?: number;
    modelId?: string;
    once?: boolean;
  },
) {
  await syncAgentPresence(agent);

  const intervalMs = options?.intervalMs ?? 15000;
  const modelId = options?.modelId ?? process.env.BOREAL_AGENT_MODEL ?? "gpt-4.1-mini";

  do {
    await runAgentTick(agent, modelId);

    if (options?.once) {
      break;
    }

    await sleep(intervalMs);
  } while (true);
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function buildAgentSupplyMutationArgs(
  agent: AutonomousAgentDefinition,
  now = Date.now(),
) {
  const supportsDirectInvoke =
    agent.supplyEntry.supportsDirectInvoke ?? Boolean(agent.directExecution);
  const paymentNetworkHints = Array.from(
    new Set([
      ...(agent.supplyEntry.paymentNetworkHints ?? []),
      ...(agent.settlement?.networkKey ? [agent.settlement.networkKey] : []),
    ]),
  );

  return {
    agentReady: agent.supplyEntry.agentReady ?? Boolean(agent.directExecution),
    capabilityTags: agent.supplyEntry.capabilityTags,
    category: agent.supplyEntry.category,
    checkoutProtocol: agent.supplyEntry.checkoutProtocol,
    connectorHealthStatus:
      agent.supplyEntry.connectorHealthStatus ?? "healthy",
    connectorLastHeartbeatAt: now,
    connectorLastTestedAt: now,
    deliveryType: agent.supplyEntry.deliveryType,
    description: agent.supplyEntry.description,
    estimatedDeliveryLabel:
      agent.supplyEntry.estimatedDeliveryLabel ??
      inferEstimatedDeliveryLabel(agent),
    executionSurface:
      agent.supplyEntry.executionSurface ??
      (agent.directExecution ? "http" : "handoff"),
    executorUrl:
      agent.supplyEntry.executorUrl ?? agent.directExecution?.routePath,
    fulfillmentKind: agent.supplyEntry.fulfillmentKind,
    isCartEnabled: agent.supplyEntry.isCartEnabled,
    maxConcurrentJobs:
      agent.supplyEntry.maxConcurrentJobs ?? inferMaxConcurrentJobs(agent),
    mcpServerUrl: agent.supplyEntry.mcpServerUrl,
    mcpToolName: agent.supplyEntry.mcpToolName,
    offerSlug: agent.supplyEntry.offerSlug ?? agent.key,
    openApiUrl:
      agent.supplyEntry.openApiUrl ??
      (agent.directExecution ? "/openapi/agents-v1.json" : undefined),
    ownerActorKind: agent.identity.actorKind,
    ownerDisplayName: agent.identity.displayName,
    ownerExternalId: agent.identity.externalId,
    ownerHandle: agent.identity.handle,
    outputTypes: agent.supplyEntry.outputTypes,
    paymentNetworkHints:
      paymentNetworkHints.length > 0 ? paymentNetworkHints : undefined,
    paymentProtocol:
      agent.supplyEntry.paymentProtocol ??
      (supportsDirectInvoke && agent.settlement ? "x402" : undefined),
    priceAmount: agent.supplyEntry.priceAmount,
    priceType: agent.supplyEntry.priceType,
    protocolDescriptorJson:
      agent.supplyEntry.protocolDescriptorJson ??
      (agent.directExecution
        ? JSON.stringify(
            buildDirectExecutionProtocolDescriptor(
              agent,
              agent.directExecution,
            ),
          )
        : undefined),
    responseSlaMinutes:
      agent.supplyEntry.responseSlaMinutes ?? inferResponseSlaMinutes(agent),
    scenarioTypes: agent.supplyEntry.scenarioTypes,
    sourceCapabilityId:
      agent.supplyEntry.sourceCapabilityId ?? `autonomous-agent:${agent.key}`,
    sourceProviderKey:
      agent.supplyEntry.sourceProviderKey ?? "manual",
    supplyType: agent.supplyEntry.supplyType,
    supportsEvidencePush:
      agent.supplyEntry.supportsEvidencePush ?? !agent.directExecution,
    supportsDirectInvoke,
    supportsPrivyWallet: agent.supplyEntry.supportsPrivyWallet,
    supportsStatusUpdates:
      agent.supplyEntry.supportsStatusUpdates ??
      Boolean(
        agent.directExecution?.outputKinds.includes("video_generation"),
      ),
    title: agent.supplyEntry.title,
  };
}

function inferEstimatedDeliveryLabel(agent: AutonomousAgentDefinition) {
  switch (agent.supplyEntry.deliveryType) {
    case "instant":
      return "Instant";
    case "scheduled":
      return "Scheduled";
    case "async":
    default:
      return "Within 4 hours";
  }
}

export function hasPendingQueuedArtifact(detail: RequestDetail) {
  return (
    detail.artifact?.artifactKind === "video" &&
    (detail.artifact.status === "queued" || detail.artifact.status === "in_progress")
  );
}

type AgentArtifactDelivery = {
  artifact:
    | {
        base64: string;
        kind: "image";
        mediaType: string;
        prompt: string;
        title: string;
      }
    | {
        base64: string;
        format: string;
        kind: "audio";
        mediaType: string;
        title: string;
        transcript: string;
        voice: string;
      }
    | {
        jobId: string;
        kind: "video";
        model: string;
        progress: number;
        prompt: string;
        seconds: string;
        size: string;
        status: "completed" | "failed" | "in_progress" | "queued";
        title: string;
      };
  deliverablesBody: string;
  subtitle: string;
};

export async function maybeRunDirectArtifactDelivery(input: {
  agent: AutonomousAgentDefinition;
  detail: RequestDetail;
  modelId: string;
}): Promise<AgentArtifactDelivery | null> {
  if (!input.detail.intent || !input.agent.directExecution) {
    return null;
  }

  const outputKinds = input.agent.directExecution.outputKinds;
  const usesArtifactPath = outputKinds.some((kind) => kind !== "text");

  if (!usesArtifactPath) {
    return null;
  }

  const result = await input.agent.directExecution.invoke({
    modelId: input.modelId,
    payload: buildLegacyMediaDirectExecutionPayload({
      agentKey: input.agent.key,
      detail: input.detail.intent,
    }),
  });

  return toAgentArtifactDelivery(result);
}

export function buildLegacyMediaDirectExecutionPayload(input: {
  agentKey: string;
  detail: Pick<
    NonNullable<RequestDetail["intent"]>,
    "body" | "responseInstructions" | "summary" | "title" | "videoSeconds" | "videoSize"
  >;
}) {
  const promptText = [
    input.detail.title,
    input.detail.summary,
    input.detail.body,
  ]
    .map((value) => value.trim())
    .filter(Boolean)
    .join("\n");

  switch (input.agentKey) {
    case "image-studio":
      return {
        prompt: promptText,
        title: input.detail.title,
      };
    case "voiceover-studio":
      return {
        instructions:
          input.detail.responseInstructions.trim().length > 0
            ? input.detail.responseInstructions
            : "Clear, concise, product-ready delivery.",
        text: input.detail.body.trim().length > 0 ? input.detail.body : promptText,
        title: input.detail.title,
        voice: "alloy",
      };
    case "motion-video-studio":
      return {
        prompt: promptText,
        seconds: input.detail.videoSeconds,
        size: input.detail.videoSize,
        title: input.detail.title,
      };
    default:
      return {
        prompt: promptText,
        title: input.detail.title,
      };
  }
}

export function toAgentArtifactDelivery(
  result: AgentExecutionResult,
): AgentArtifactDelivery | null {
  if (result.kind === "image_generation") {
    return {
      artifact: {
        base64: result.base64,
        kind: "image",
        mediaType: result.mediaType,
        prompt: result.prompt,
        title: result.title,
      },
      deliverablesBody:
        "Generated image asset delivered. The image is attached in this request.",
      subtitle: "Generated image output",
    };
  }

  if (result.kind === "speech_generation") {
    return {
      artifact: {
        base64: result.base64,
        format: result.format,
        kind: "audio",
        mediaType: result.mediaType,
        title: result.title,
        transcript: result.transcript,
        voice: result.voice,
      },
      deliverablesBody:
        "Generated voiceover delivered. The audio artifact is attached in this request.",
      subtitle: `Voice: ${result.voice}`,
    };
  }

  if (result.kind === "video_generation") {
    return {
      artifact: {
        jobId: result.jobId,
        kind: "video",
        model: result.model,
        progress: result.progress,
        prompt: result.prompt,
        seconds: result.seconds,
        size: result.size,
        status: result.status,
        title: result.title,
      },
      deliverablesBody:
        result.status === "completed"
          ? "Generated video delivered. Playback and download attach in this request."
          : "Video generation started. The artifact is attached in this request and will update as the render progresses.",
      subtitle: `Video ${result.seconds}s • ${result.size}`,
    };
  }

  return null;
}

function normalizeArtifactStatus(
  artifact: AgentArtifactDelivery["artifact"],
) {
  if (artifact.kind !== "video") {
    return "ready" as const;
  }

  if (artifact.status === "completed") {
    return "ready" as const;
  }

  return artifact.status;
}

function inferMaxConcurrentJobs(agent: AutonomousAgentDefinition) {
  return agent.directExecution ? 6 : 3;
}

function inferResponseSlaMinutes(agent: AutonomousAgentDefinition) {
  switch (agent.supplyEntry.deliveryType) {
    case "instant":
      return 5;
    case "scheduled":
      return 1440;
    case "async":
    default:
      return 240;
  }
}
