import assert from "node:assert/strict";

import type { Id } from "../convex/_generated/dataModel.js";
import { normalizeIntentExtraction } from "../lib/boreal/schemas/intent.ts";
import { buildIntentPersistencePayload } from "../lib/boreal/tools/ui/build-intent-response.ts";
import { api, createAgentConvexClient } from "../agents/shared/convex-client.ts";
import { createPublicRequestToken } from "../lib/boreal/one-inbox/tokens.ts";
import { verifySessionToken } from "../lib/boreal/one-request/auth.ts";
import { createSmokeWalletIdentity } from "./lib/smoke-wallet-identities.ts";

const SUPPLY_TITLE = "Smoke One Inbox Solana Research Brief";

async function main() {
  const now = Date.now();
  const client = createAgentConvexClient();

  const buyer = createSmokeWalletIdentity("one-inbox-buyer", "buyer");
  const supplier = createSmokeWalletIdentity("one-inbox-supplier", "supplier");
  const buyerExternalId = buyer.externalId;
  const supplierExternalId = supplier.externalId;

  assert.equal(verifySessionToken(buyer.sessionToken).walletAddress, buyer.walletAddress);
  assert.equal(
    verifySessionToken(supplier.sessionToken).walletAddress,
    supplier.walletAddress,
  );

  await client.mutation(api.wallets.syncWalletAccount, {
    chainFamily: "solana",
    environment: "devnet",
    networkKey: "solana:devnet",
    ownerDisplayName: buyer.displayName,
    ownerExternalId: buyerExternalId,
    roles: ["connected", "buyer"],
    setAsDefaultBuyer: true,
    setAsDefaultPayout: false,
    walletAddress: buyer.walletAddress,
    walletProvider: "siwx",
  });
  await client.mutation(api.wallets.syncWalletAccount, {
    chainFamily: "solana",
    environment: "devnet",
    networkKey: "solana:devnet",
    ownerDisplayName: supplier.displayName,
    ownerExternalId: supplierExternalId,
    roles: ["connected", "payout"],
    setAsDefaultBuyer: false,
    setAsDefaultPayout: true,
    walletAddress: supplier.walletAddress,
    walletProvider: "siwx",
  });

  const supplyResult = await client.mutation(api.supplies.createSupplyEntry, {
    capabilityTags: ["solana", "research", "brief", "analysis"],
    category: "research",
    currency: "USD",
    deliveryType: "async",
    description:
      "Structured Solana research briefs with crisp synthesis, links, and action points.",
    estimatedDeliveryLabel: "24 hours",
    isCartEnabled: true,
    ownerActorKind: "agent",
    ownerDisplayName: supplier.displayName,
    ownerExternalId: supplierExternalId,
    outputTypes: ["text"],
    priceAmount: 180,
    priceType: "fixed",
    subtitle: "Text-based Solana market research",
    supplyType: "capability",
    title: SUPPLY_TITLE,
  });

  assert.equal(supplyResult.created, true, "expected paid supplier listing to be published");
  assert.ok(supplyResult.supplyId, "expected supply id");

  const message = [
    "Create a concise Solana ecosystem research brief for a founder update.",
    "Need the key trends, current risks, and what to watch next.",
  ].join(" ");
  const extractedIntent = normalizeIntentExtraction(
    {
      body: message,
      capabilityTags: ["solana", "research", "brief", "analysis"],
      catalogQuery: "solana research brief analysis",
      category: "research",
      confidence: 0.97,
      extractionNotes: ["deterministic one-inbox smoke"],
      intentType: "demand",
      keywords: ["solana", "research", "brief", "analysis", "founder"],
      needsClarification: false,
      requestedOutputTypes: ["text"],
      routeTarget: "general_assistance",
      routing: {
        resolutionTier: "open",
        shouldCreateFulfillmentRequest: true,
        shouldPersistToBoard: true,
      },
      shouldSearchCatalog: true,
      summary: "Need a supplier to produce a concise Solana research brief.",
      title: `Solana research brief ${now}`,
      voice: "alloy",
    },
    message,
    [{ kind: "text", score: 0.98 }],
  );
  const conversationId = crypto.randomUUID();
  const persistedIntent = buildIntentPersistencePayload({
    assistantMessageId: crypto.randomUUID(),
    conversationId,
    embedding: [],
    embeddingModel: "smoke-one-inbox",
    intent: extractedIntent,
    intentModel: "gpt-4.1-mini",
    modalityScores: [{ kind: "text", score: 0.98 }],
    provider: "boreal-agent",
    userMessageId: crypto.randomUUID(),
  });
  const pipeline = await client.mutation(api.chats.recordIntentPipeline, {
    assistantMessage: "Boreal opened this request to the market.",
    conversationId,
    initialStatus: "open",
    intent: persistedIntent,
    ownerDisplayName: buyer.displayName,
    ownerExternalId: buyerExternalId,
    ownerHandle: undefined,
    userMessage: message,
  });
  const requestToken = createPublicRequestToken(pipeline.intentId as Id<"intents">);

  const inbox = await client.query(api.inboxApi.listInbox, {
    ownerExternalId: supplierExternalId,
  });
  const matchedEntry = inbox.find((entry) => entry.requestToken === requestToken);

  assert.ok(matchedEntry, "expected supplier inbox to include the public request");
  assert.equal(matchedEntry?.actions.canClaim, true, "expected fixed-price request to be claimable");

  const claim = await client.mutation(api.inboxApi.claimMatchedRequest, {
    ownerDisplayName: supplier.displayName,
    ownerExternalId: supplierExternalId,
    requestToken,
    supplyId: supplyResult.supplyId as Id<"supplies">,
  });

  assert.equal(claim.claimed, true, "expected supplier to claim the request");
  assert.ok(claim.proposalId, "expected accepted proposal id after claim");

  const supplierView = await client.query(api.inboxApi.getSupplierRequestView, {
    ownerExternalId: supplierExternalId,
    requestToken,
  });

  assert.equal(supplierView?.inbox.status, "claimed", "expected inbox state to move to claimed");
  assert.equal(
    supplierView?.inbox.actions.canDeliver,
    true,
    "expected claimed supplier request to allow delivery",
  );

  const delivery = await client.mutation(api.fulfillments.submitWork, {
    deliverablesBody: [
      "# Solana ecosystem brief",
      "",
      "- Core trend: wallet-linked agentic coordination is getting more real.",
      "- Main risk: fragmented payment and delivery rails still slow fulfillment.",
      "- Watch next: agent marketplaces that can settle and route on-chain.",
    ].join("\n"),
    intentId: pipeline.intentId as Id<"intents">,
    workerDisplayName: supplier.displayName,
    workerExternalId: supplierExternalId,
  });

  assert.equal(delivery.submitted, true, "expected supplier delivery to submit");

  const payouts = await client.query(api.inboxApi.listPayouts, {
    ownerExternalId: supplierExternalId,
  });
  const payout = payouts.find((entry) => entry.request?.requestToken === requestToken);

  assert.ok(payout, "expected payout record for claimed request");
  assert.equal(
    payout?.settlementStatus,
    "ready_for_payout",
    "expected settlement to move to ready_for_payout after delivery",
  );
  assert.equal(payout?.status, "pending", "expected payout row to exist and stay pending");

  const requestEvents = await client.query(api.inboxApi.listSupplierRequestEvents, {
    ownerExternalId: supplierExternalId,
    requestToken,
  });

  assert.ok(
    requestEvents.some((event) => event.status === "claimed"),
    "expected claimed event in supplier request feed",
  );
  assert.ok(
    requestEvents.some((event) => event.status === "delivered"),
    "expected delivered event in supplier request feed",
  );
  assert.ok(
    requestEvents.some((event) => event.status === "payout_ready"),
    "expected payout_ready event in supplier request feed",
  );

  console.log(
    JSON.stringify(
      {
        inboxStatus: supplierView?.inbox.status,
        payoutStatus: payout?.status,
        requestEvents: requestEvents.map((event) => event.eventType),
        requestToken,
        settlementStatus: payout?.settlementStatus,
      },
      null,
      2,
    ),
  );
}

main();
