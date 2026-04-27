import assert from "node:assert/strict";
import { generateKeyPairSync, sign } from "node:crypto";

import type { Id } from "../convex/_generated/dataModel.js";
import { normalizeIntentExtraction } from "../lib/boreal/schemas/intent.ts";
import { buildIntentPersistencePayload } from "../lib/boreal/tools/ui/build-intent-response.ts";
import { api, createAgentConvexClient } from "../agents/shared/convex-client.ts";
import { createPublicRequestToken } from "../lib/boreal/one-inbox/tokens.ts";
import {
  createSiwxChallenge,
  getWalletDisplayName,
  getWalletExternalId,
  verifySessionToken,
  verifySiwxChallenge,
} from "../lib/boreal/one-request/auth.ts";

async function main() {
  const now = Date.now();
  const client = createAgentConvexClient();

  const buyer = createWalletIdentity("buyer");
  const lead = createWalletIdentity("lead");
  const collaborator = createWalletIdentity("collab");
  const buyerExternalId = getWalletExternalId(buyer.walletAddress);
  const leadExternalId = getWalletExternalId(lead.walletAddress);
  const collaboratorExternalId = getWalletExternalId(collaborator.walletAddress);

  assert.equal(verifySessionToken(buyer.sessionToken).walletAddress, buyer.walletAddress);
  assert.equal(verifySessionToken(lead.sessionToken).walletAddress, lead.walletAddress);
  assert.equal(
    verifySessionToken(collaborator.sessionToken).walletAddress,
    collaborator.walletAddress,
  );

  await syncWallet(client, {
    displayName: buyer.displayName,
    externalId: buyerExternalId,
    roles: ["connected", "buyer"],
    setAsDefaultBuyer: true,
    setAsDefaultPayout: false,
    walletAddress: buyer.walletAddress,
  });
  await syncWallet(client, {
    displayName: lead.displayName,
    externalId: leadExternalId,
    roles: ["connected", "payout"],
    setAsDefaultBuyer: false,
    setAsDefaultPayout: true,
    walletAddress: lead.walletAddress,
  });
  await syncWallet(client, {
    displayName: collaborator.displayName,
    externalId: collaboratorExternalId,
    roles: ["connected", "payout"],
    setAsDefaultBuyer: false,
    setAsDefaultPayout: true,
    walletAddress: collaborator.walletAddress,
  });

  const leadSupply = await registerSupply(client, {
    capabilityTags: ["multi-agent", "research", "brief", "coordination"],
    description:
      "Lead supplier for a coordinated research and synthesis request.",
    externalId: leadExternalId,
    ownerDisplayName: lead.displayName,
    priceAmount: 100,
    title: `Collective Lead Supply ${now}`,
  });
  const collaboratorSupply = await registerSupply(client, {
    capabilityTags: ["multi-agent", "research", "brief", "coordination"],
    description:
      "Collaborator supplier for the same coordinated research request.",
    externalId: collaboratorExternalId,
    ownerDisplayName: collaborator.displayName,
    priceAmount: 100,
    title: `Collective Collaborator Supply ${now}`,
  });

  const message = [
    "Need a coordinated multi-agent research brief for the current agent-commerce stack.",
    "Want one lead supplier plus a collaborator on the same request.",
  ].join(" ");
  const extractedIntent = normalizeIntentExtraction(
    {
      body: message,
      capabilityTags: ["multi-agent", "research", "brief", "coordination"],
      catalogQuery: "multi agent research brief coordination",
      category: "research",
      confidence: 0.98,
      extractionNotes: ["deterministic collective proposal smoke"],
      intentType: "demand",
      keywords: ["multi-agent", "research", "brief", "coordination"],
      needsClarification: false,
      requestedOutputTypes: ["text"],
      routeTarget: "general_assistance",
      routing: {
        resolutionTier: "open",
        shouldCreateFulfillmentRequest: true,
        shouldPersistToBoard: true,
      },
      shouldSearchCatalog: true,
      summary: "Need a coordinated collective proposal and split payout path.",
      title: `Collective proposal smoke ${now}`,
      voice: "alloy",
    },
    message,
    [{ kind: "text", score: 0.99 }],
  );
  const conversationId = crypto.randomUUID();
  const persistedIntent = buildIntentPersistencePayload({
    assistantMessageId: crypto.randomUUID(),
    conversationId,
    embedding: [],
    embeddingModel: "smoke-collective-proposals",
    intent: extractedIntent,
    intentModel: "gpt-4.1-mini",
    modalityScores: [{ kind: "text", score: 0.99 }],
    provider: "boreal-agent",
    userMessageId: crypto.randomUUID(),
  });
  const pipeline = await client.mutation(api.chats.recordIntentPipeline, {
    assistantMessage: "Boreal opened this collective request to the market.",
    conversationId,
    initialStatus: "open",
    intent: persistedIntent,
    ownerDisplayName: buyer.displayName,
    ownerExternalId: buyerExternalId,
    ownerHandle: undefined,
    userMessage: message,
  });
  const requestToken = createPublicRequestToken(pipeline.intentId as Id<"intents">);

  const leadInbox = await client.query(api.inboxApi.listInbox, {
    ownerExternalId: leadExternalId,
  });
  assert.ok(
    leadInbox.some((entry) => entry.requestToken === requestToken),
    "expected lead supplier inbox to include the public request",
  );

  const proposal = await client.mutation(api.proposals.submitProposal, {
    collectiveMembers: [leadExternalId, collaboratorExternalId],
    currency: "USD",
    deliverablesBody:
      "Lead handles synthesis and delivery. Collaborator handles source gathering and notes.",
    deliverablesType: "markdown",
    etaAt: Date.now() + 24 * 60 * 60 * 1000,
    intentId: pipeline.intentId as Id<"intents">,
    ownerDisplayName: lead.displayName,
    ownerExternalId: leadExternalId,
    ownerHandle: undefined,
    price: 100,
    proposerKind: "agent",
    memberRoles: [
      { memberId: leadExternalId, role: "synthesis lead" },
      { memberId: collaboratorExternalId, role: "research collaborator" },
    ],
    splitPlan: [
      { memberId: leadExternalId, percent: 60 },
      { memberId: collaboratorExternalId, percent: 40 },
    ],
  });

  assert.equal(proposal.submitted, true, "expected collective proposal to submit");
  assert.ok(proposal.proposalId, "expected collective proposal id");

  const approved = await client.mutation(api.proposals.approveProposal, {
    intentId: pipeline.intentId as Id<"intents">,
    ownerExternalId: buyerExternalId,
    proposalId: proposal.proposalId as Id<"proposals">,
  });

  assert.equal(approved.approved, true, "expected collective proposal approval");

  const collaboratorView = await client.query(api.inboxApi.getSupplierRequestView, {
    ownerExternalId: collaboratorExternalId,
    requestToken,
  });

  assert.equal(
    collaboratorView?.inbox.status,
    "claimed",
    "expected collaborator inbox view to move to claimed",
  );
  assert.ok(
    collaboratorView?.request.participants.some(
      (participant) =>
        participant.externalId === collaboratorExternalId &&
        participant.role === "research collaborator",
    ),
    "expected collaborator to appear as a request participant",
  );
  assert.ok(
    collaboratorView?.request.participants.some(
      (participant) =>
        participant.externalId === leadExternalId &&
        participant.role === "synthesis lead",
    ),
    "expected lead role assignment on the accepted collective request",
  );

  const collaboratorMessage = await client.mutation(api.chats.postThreadMessage, {
    body: "Collaborator joined the request thread and is gathering source notes.",
    intentId: pipeline.intentId as Id<"intents">,
    ownerDisplayName: collaborator.displayName,
    ownerExternalId: collaboratorExternalId,
    ownerHandle: undefined,
  });

  assert.equal(
    collaboratorMessage.sent,
    true,
    "expected collaborator to post inside the request thread",
  );

  const delivery = await client.mutation(api.fulfillments.submitWork, {
    deliverablesBody: [
      "# Coordinated multi-agent brief",
      "",
      "- Lead: synthesized the operator view.",
      "- Collaborator: gathered and summarized the supporting sources.",
      "- Result: one delivered brief with two payout targets.",
    ].join("\n"),
    intentId: pipeline.intentId as Id<"intents">,
    workerDisplayName: collaborator.displayName,
    workerExternalId: collaboratorExternalId,
  });

  assert.equal(
    delivery.submitted,
    true,
    "expected collaborator delivery on the accepted collective request",
  );
  const postDeliveryView = await client.query(api.inboxApi.getSupplierRequestView, {
    ownerExternalId: collaboratorExternalId,
    requestToken,
  });
  const collaboratorContribution = postDeliveryView?.request.contributions.find(
    (entry) => entry.externalId === collaboratorExternalId,
  );
  const collectiveTrust = postDeliveryView?.request.collectiveTrust;

  assert.equal(
    collaboratorContribution?.role,
    "research collaborator",
    "expected collaborator contribution role",
  );
  assert.equal(
    collaboratorContribution?.deliveryCount,
    1,
    "expected one recorded collaborator delivery contribution",
  );
  assert.ok(
    (collaboratorContribution?.messageCount ?? 0) >= 1,
    "expected at least one recorded collaborator thread contribution",
  );
  assert.equal(
    collectiveTrust?.memberCount,
    2,
    "expected two members in the collective trust summary",
  );
  assert.ok(
    (collectiveTrust?.averageTrustScore ?? 0) > 0,
    "expected a non-zero collective trust score",
  );
  assert.ok(
    collectiveTrust?.members.some(
      (member) =>
        member.externalId === collaboratorExternalId &&
        member.role === "research collaborator",
    ),
    "expected collaborator trust entry with the assigned role",
  );

  const leadPayouts = await client.query(api.inboxApi.listPayouts, {
    ownerExternalId: leadExternalId,
  });
  const collaboratorPayouts = await client.query(api.inboxApi.listPayouts, {
    ownerExternalId: collaboratorExternalId,
  });
  const leadPayout = leadPayouts.find(
    (entry) => entry.request?.requestToken === requestToken,
  );
  const collaboratorPayout = collaboratorPayouts.find(
    (entry) => entry.request?.requestToken === requestToken,
  );

  assert.ok(leadPayout, "expected lead payout row");
  assert.ok(collaboratorPayout, "expected collaborator payout row");
  assert.equal(leadPayout?.amount, 60, "expected 60 percent payout for lead");
  assert.equal(
    collaboratorPayout?.amount,
    40,
    "expected 40 percent payout for collaborator",
  );
  assert.equal(leadPayout?.status, "pending", "expected lead payout pending");
  assert.equal(
    collaboratorPayout?.status,
    "pending",
    "expected collaborator payout pending",
  );
  assert.equal(
    collaboratorPayout?.settlementStatus,
    "ready_for_payout",
    "expected collaborator payout settlement ready",
  );

}

async function syncWallet(
  client: ReturnType<typeof createAgentConvexClient>,
  input: {
    displayName: string;
    externalId: string;
    roles: Array<"buyer" | "connected" | "payout">;
    setAsDefaultBuyer: boolean;
    setAsDefaultPayout: boolean;
    walletAddress: string;
  },
) {
  await client.mutation(api.wallets.syncWalletAccount, {
    chainFamily: "solana",
    environment: "devnet",
    networkKey: "solana:devnet",
    ownerDisplayName: input.displayName,
    ownerExternalId: input.externalId,
    roles: input.roles,
    setAsDefaultBuyer: input.setAsDefaultBuyer,
    setAsDefaultPayout: input.setAsDefaultPayout,
    walletAddress: input.walletAddress,
    walletProvider: "siwx",
  });
}

async function registerSupply(
  client: ReturnType<typeof createAgentConvexClient>,
  input: {
    capabilityTags: string[];
    description: string;
    externalId: string;
    ownerDisplayName: string;
    priceAmount: number;
    title: string;
  },
) {
  const result = await client.mutation(api.supplies.createSupplyEntry, {
    capabilityTags: input.capabilityTags,
    category: "research",
    currency: "USD",
    deliveryType: "async",
    description: input.description,
    estimatedDeliveryLabel: "24 hours",
    isCartEnabled: true,
    ownerActorKind: "agent",
    ownerDisplayName: input.ownerDisplayName,
    ownerExternalId: input.externalId,
    outputTypes: ["text"],
    priceAmount: input.priceAmount,
    priceType: "fixed",
    subtitle: "Collective proposal smoke listing",
    supplyType: "capability",
    title: input.title,
  });

  assert.equal(result.created, true, "expected collective smoke supply to publish");
  assert.ok(result.supplyId, "expected supply id");

  return result;
}

function createWalletIdentity(label: string) {
  const { privateKey, publicKey } = generateKeyPairSync("ed25519");
  const walletAddress = encodeBase58(
    publicKey.export({ format: "der", type: "spki" }).subarray(-32),
  );
  const challenge = createSiwxChallenge({ walletAddress });
  const signature = sign(
    null,
    Buffer.from(challenge.message, "utf8"),
    privateKey,
  ).toString("hex");
  const verified = verifySiwxChallenge({
    challengeToken: challenge.challengeToken,
    signature,
    walletAddress,
  });

  return {
    displayName: `${label}-${getWalletDisplayName(walletAddress)}`,
    sessionToken: verified.sessionToken,
    walletAddress,
  };
}

function encodeBase58(buffer: Uint8Array) {
  const alphabet = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  const digits = [0];

  for (const byte of buffer) {
    let carry = byte;

    for (let index = 0; index < digits.length; index += 1) {
      carry += digits[index] << 8;
      digits[index] = carry % 58;
      carry = (carry / 58) | 0;
    }

    while (carry > 0) {
      digits.push(carry % 58);
      carry = (carry / 58) | 0;
    }
  }

  for (const byte of buffer) {
    if (byte === 0) {
      digits.push(0);
    } else {
      break;
    }
  }

  return digits
    .reverse()
    .map((digit) => alphabet[digit])
    .join("");
}

main();
