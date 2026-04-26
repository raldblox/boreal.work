import type { Id } from "../../convex/_generated/dataModel.js";

import { api, createAgentConvexClient } from "./convex-client.ts";
import { buildDirectExecutionProtocolDescriptor } from "./registry.ts";
import type { AgentRequestDetail, AutonomousAgentDefinition } from "./types.ts";

const MATCH_THRESHOLD = 30;

export async function syncAgentPresence(agent: AutonomousAgentDefinition) {
  const client = createAgentConvexClient();

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

  await client.mutation(api.supplies.createSupplyEntry, {
    agentReady:
      agent.supplyEntry.agentReady ?? Boolean(agent.directExecution),
    capabilityTags: agent.supplyEntry.capabilityTags,
    category: agent.supplyEntry.category,
    checkoutProtocol: agent.supplyEntry.checkoutProtocol,
    deliveryType: agent.supplyEntry.deliveryType,
    description: agent.supplyEntry.description,
    executorUrl:
      agent.supplyEntry.executorUrl ??
      agent.directExecution?.routePath,
    fulfillmentKind: agent.supplyEntry.fulfillmentKind,
    isCartEnabled: agent.supplyEntry.isCartEnabled,
    ownerActorKind: agent.identity.actorKind,
    ownerDisplayName: agent.identity.displayName,
    ownerExternalId: agent.identity.externalId,
    ownerHandle: agent.identity.handle,
    outputTypes: agent.supplyEntry.outputTypes,
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
    scenarioTypes: agent.supplyEntry.scenarioTypes,
    supplyType: agent.supplyEntry.supplyType,
    title: agent.supplyEntry.title,
  });

  if (agent.settlement) {
    await client.mutation(api.wallets.syncWalletAccount, {
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
    })) as AgentRequestDetail;

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
