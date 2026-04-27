import assert from "node:assert/strict";

import type { Id } from "../convex/_generated/dataModel.js";
import { normalizeIntentExtraction } from "../lib/boreal/schemas/intent.ts";
import { buildIntentPersistencePayload } from "../lib/boreal/tools/ui/build-intent-response.ts";
import { api, createAgentConvexClient } from "../agents/shared/convex-client.ts";
import { createPublicRequestToken } from "../lib/boreal/one-inbox/tokens.ts";
import { verifySessionToken } from "../lib/boreal/one-request/auth.ts";
import { createSmokeWalletIdentity } from "./lib/smoke-wallet-identities.ts";

const SUPPLY_TITLE = "Smoke External Solana Briefs";

async function main() {
  const now = Date.now();
  const client = createAgentConvexClient();

  const buyer = createSmokeWalletIdentity("supplier-onboarding-buyer", "buyer");
  const supplier = createSmokeWalletIdentity("supplier-onboarding-supplier", "supplier");
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

  const created = await client.mutation(api.supplies.createSupplyEntry, {
    agentReady: true,
    availabilityStatus: "available",
    capabilityTags: ["solana", "research", "external-onboarding", "briefs"],
    category: "research",
    currency: "USD",
    deliveryType: "async",
    description:
      "External agent that produces crisp Solana research briefs for founders and operators.",
    estimatedDeliveryLabel: "24 hours",
    executionSurface: "http",
    executorUrl: "https://agents.example.com/solana-briefs/execute",
    isCartEnabled: false,
    mcpServerUrl: "https://agents.example.com/mcp",
    openApiUrl: "https://agents.example.com/openapi.json",
    outputTypes: ["text"],
    ownerActorKind: "agent",
    ownerDisplayName: supplier.displayName,
    ownerExternalId: supplierExternalId,
    ownerHandle: "supplier-bot",
    paymentNetworkHints: ["solana:devnet"],
    paymentProtocol: "x402",
    priceAmount: 95,
    priceType: "fixed",
    requiresHumanApproval: false,
    scenarioTypes: ["custom_scoped_work", "supply_publish"],
    schemaUrl: "https://agents.example.com/schema.json",
    sourceProviderKey: "manual",
    subtitle: "External agent research supply",
    supportsDirectInvoke: true,
    supplyType: "capability",
    title: SUPPLY_TITLE,
  });

  assert.equal(created.created, true, "expected supplier supply to be created");
  assert.ok(created.supplyId, "expected created supply id");

  const ownedAfterCreate = await client.query(api.supplies.getOwnedSupply, {
    ownerExternalId: supplierExternalId,
    supplyId: created.supplyId as Id<"supplies">,
  });

  assert.ok(ownedAfterCreate?.supply, "expected owned supply details");
  assert.equal(ownedAfterCreate?.supply.executionSurface, "http");
  assert.equal(ownedAfterCreate?.supply.paymentProtocol, "x402");
  assert.equal(ownedAfterCreate?.supply.supportsDirectInvoke, true);

  const updated = await client.mutation(api.supplies.createSupplyEntry, {
    capabilityTags: ["solana", "research", "external-onboarding", "briefs"],
    category: ownedAfterCreate!.supply.category,
    currency: ownedAfterCreate!.supply.currency,
    deliveryType: ownedAfterCreate!.supply.deliveryType,
    description: ownedAfterCreate!.supply.description,
    executionSurface: "mcp",
    executorUrl: "https://agents.example.com/solana-briefs/mcp-execute",
    isCartEnabled: ownedAfterCreate!.supply.isCartEnabled,
    mcpServerUrl: "https://agents.example.com/mcp/v2",
    openApiUrl: ownedAfterCreate!.supply.openApiUrl ?? undefined,
    ownerActorKind: "agent",
    ownerDisplayName: supplier.displayName,
    ownerExternalId: supplierExternalId,
    outputTypes: ["text"],
    paymentNetworkHints: ["solana:devnet"],
    paymentProtocol: "x402",
    priceAmount: ownedAfterCreate!.supply.priceAmount ?? 95,
    priceType: ownedAfterCreate!.supply.priceType,
    scenarioTypes: ["custom_scoped_work", "supply_publish"],
    subtitle: "External agent research supply v2",
    supportsDirectInvoke: true,
    supplyId: created.supplyId as Id<"supplies">,
    supplyType: "capability",
    title: ownedAfterCreate!.supply.title,
  });

  assert.equal(updated.created, true, "expected supplier supply update to succeed");
  assert.equal(updated.supplyId, created.supplyId, "expected in-place supply update");

  const ownedSupplies = await client.query(api.supplies.listOwnedSupplies, {
    ownerExternalId: supplierExternalId,
  });
  const owned = ownedSupplies.find((entry) => entry.supply._id === created.supplyId);

  assert.ok(owned, "expected owned supplies list to include the new supply");
  assert.equal(owned?.supply.executionSurface, "mcp");
  assert.equal(owned?.supply.mcpServerUrl, "https://agents.example.com/mcp/v2");
  assert.equal(owned?.supply.subtitle, "External agent research supply v2");

  const message = [
    "Need a concise Solana operator brief from an external research agent.",
    "Focus on near-term market structure, infra shifts, and what to watch next.",
  ].join(" ");
  const extractedIntent = normalizeIntentExtraction(
    {
      body: message,
      capabilityTags: ["solana", "research", "briefs", "external-onboarding"],
      catalogQuery: "solana research briefs external onboarding",
      category: "research",
      confidence: 0.96,
      extractionNotes: ["deterministic supplier-onboarding smoke"],
      intentType: "demand",
      keywords: ["solana", "research", "brief", "external", "operator"],
      needsClarification: false,
      requestedOutputTypes: ["text"],
      routeTarget: "general_assistance",
      routing: {
        resolutionTier: "open",
        shouldCreateFulfillmentRequest: true,
        shouldPersistToBoard: true,
      },
      shouldSearchCatalog: true,
      summary: "Need an external agent to produce a Solana operator brief.",
      title: `External supplier brief ${now}`,
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
    embeddingModel: "smoke-supplier-onboarding",
    intent: extractedIntent,
    intentModel: "gpt-4.1-mini",
    modalityScores: [{ kind: "text", score: 0.98 }],
    provider: "boreal-agent",
    userMessageId: crypto.randomUUID(),
  });
  const pipeline = await client.mutation(api.chats.recordIntentPipeline, {
    assistantMessage: "Boreal opened this request to matched external supply.",
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

  assert.ok(matchedEntry, "expected registered supplier to receive matched demand");
  assert.equal(
    matchedEntry?.match.matchedSupplyId,
    created.supplyId,
    "expected matched demand to route through the registered supply",
  );

  console.log(
    JSON.stringify(
      {
        matchedSupplyId: matchedEntry?.match.matchedSupplyId ?? null,
        ownedSupplyCount: ownedSupplies.length,
        requestToken,
        supplyId: created.supplyId,
        supplyExecutionSurface: owned?.supply.executionSurface ?? null,
      },
      null,
      2,
    ),
  );
}

await main();
