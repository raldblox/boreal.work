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
  const supplier = createWalletIdentity("supplier");
  const buyerExternalId = getWalletExternalId(buyer.walletAddress);
  const supplierExternalId = getWalletExternalId(supplier.walletAddress);

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
    capabilityTags: ["solana", "analysis", "capacity", "brief"],
    category: "research",
    currency: "USD",
    deliveryType: "async",
    description: "Single-slot supplier capacity smoke listing.",
    estimatedDeliveryLabel: "4 hours",
    isCartEnabled: true,
    maxConcurrentJobs: 1,
    ownerActorKind: "agent",
    ownerDisplayName: supplier.displayName,
    ownerExternalId: supplierExternalId,
    outputTypes: ["text"],
    priceAmount: 50,
    priceType: "fixed",
    subtitle: "Single concurrency slot",
    supplyType: "capability",
    title: `Supplier Capacity Smoke ${now}`,
  });

  assert.equal(supplyResult.created, true, "expected capacity smoke supply");
  assert.ok(supplyResult.supplyId, "expected supply id");

  const firstRequest = await openRequest(client, {
    buyerDisplayName: buyer.displayName,
    buyerExternalId,
    conversationId: crypto.randomUUID(),
    label: `capacity-first-${now}`,
    message: "Create the first Solana capacity smoke brief.",
  });
  const secondRequest = await openRequest(client, {
    buyerDisplayName: buyer.displayName,
    buyerExternalId,
    conversationId: crypto.randomUUID(),
    label: `capacity-second-${now}`,
    message: "Create the second Solana capacity smoke brief.",
  });

  const ownedBefore = await client.query(api.supplies.getOwnedSupply, {
    ownerExternalId: supplierExternalId,
    supplyId: supplyResult.supplyId as Id<"supplies">,
  });
  assert.equal(ownedBefore?.supply.activeReservations, 0, "expected zero reservations");

  const firstClaim = await client.mutation(api.inboxApi.claimMatchedRequest, {
    ownerDisplayName: supplier.displayName,
    ownerExternalId: supplierExternalId,
    requestToken: firstRequest.requestToken,
    supplyId: supplyResult.supplyId as Id<"supplies">,
  });
  assert.equal(firstClaim.claimed, true, "expected first request to claim");

  const ownedAfterFirstClaim = await client.query(api.supplies.getOwnedSupply, {
    ownerExternalId: supplierExternalId,
    supplyId: supplyResult.supplyId as Id<"supplies">,
  });
  assert.equal(
    ownedAfterFirstClaim?.supply.activeReservations,
    1,
    "expected one active reservation after first claim",
  );

  const blockedSecondClaim = await client.mutation(api.inboxApi.claimMatchedRequest, {
    ownerDisplayName: supplier.displayName,
    ownerExternalId: supplierExternalId,
    requestToken: secondRequest.requestToken,
    supplyId: supplyResult.supplyId as Id<"supplies">,
  });
  assert.equal(blockedSecondClaim.claimed, false, "expected second claim to be blocked");
  assert.equal(
    blockedSecondClaim.reason,
    "capacity_exhausted",
    "expected capacity-exhausted rejection",
  );

  const delivery = await client.mutation(api.fulfillments.submitWork, {
    deliverablesBody: [
      "# Capacity smoke brief",
      "",
      "- Deliver first request.",
      "- Release the single concurrency slot.",
    ].join("\n"),
    intentId: firstRequest.intentId,
    workerDisplayName: supplier.displayName,
    workerExternalId: supplierExternalId,
  });
  assert.equal(delivery.submitted, true, "expected first request delivery");

  const ownedAfterRelease = await client.query(api.supplies.getOwnedSupply, {
    ownerExternalId: supplierExternalId,
    supplyId: supplyResult.supplyId as Id<"supplies">,
  });
  assert.equal(
    ownedAfterRelease?.supply.activeReservations,
    0,
    "expected reservation release after delivery",
  );

  const secondClaim = await client.mutation(api.inboxApi.claimMatchedRequest, {
    ownerDisplayName: supplier.displayName,
    ownerExternalId: supplierExternalId,
    requestToken: secondRequest.requestToken,
    supplyId: supplyResult.supplyId as Id<"supplies">,
  });
  assert.equal(secondClaim.claimed, true, "expected second claim after release");

  const ownedAfterSecondClaim = await client.query(api.supplies.getOwnedSupply, {
    ownerExternalId: supplierExternalId,
    supplyId: supplyResult.supplyId as Id<"supplies">,
  });
  assert.equal(
    ownedAfterSecondClaim?.supply.activeReservations,
    1,
    "expected reservation count to return to one after second claim",
  );

  console.log(
    JSON.stringify(
      {
        activeReservationsAfterFirstClaim: ownedAfterFirstClaim?.supply.activeReservations,
        activeReservationsAfterRelease: ownedAfterRelease?.supply.activeReservations,
        activeReservationsAfterSecondClaim: ownedAfterSecondClaim?.supply.activeReservations,
        blockedReason: blockedSecondClaim.reason,
        secondClaimedAfterRelease: secondClaim.claimed,
        supplyId: supplyResult.supplyId,
      },
      null,
      2,
    ),
  );
}

async function openRequest(
  client: ReturnType<typeof createAgentConvexClient>,
  input: {
    buyerDisplayName: string;
    buyerExternalId: string;
    conversationId: string;
    label: string;
    message: string;
  },
) {
  const extractedIntent = normalizeIntentExtraction(
    {
      body: input.message,
      capabilityTags: ["solana", "analysis", "capacity", "brief"],
      catalogQuery: "solana analysis capacity brief",
      category: "research",
      confidence: 0.97,
      extractionNotes: ["deterministic supplier capacity smoke"],
      intentType: "demand",
      keywords: ["solana", "analysis", "capacity", "brief"],
      needsClarification: false,
      requestedOutputTypes: ["text"],
      routeTarget: "general_assistance",
      routing: {
        resolutionTier: "open",
        shouldCreateFulfillmentRequest: true,
        shouldPersistToBoard: true,
      },
      shouldSearchCatalog: true,
      summary: `Need supplier capacity smoke request for ${input.label}.`,
      title: `Supplier capacity ${input.label}`,
      voice: "alloy",
    },
    input.message,
    [{ kind: "text", score: 0.98 }],
  );
  const persistedIntent = buildIntentPersistencePayload({
    assistantMessageId: crypto.randomUUID(),
    conversationId: input.conversationId,
    embedding: [],
    embeddingModel: "smoke-supplier-capacity",
    intent: extractedIntent,
    intentModel: "gpt-4.1-mini",
    modalityScores: [{ kind: "text", score: 0.98 }],
    provider: "boreal-agent",
    userMessageId: crypto.randomUUID(),
  });
  const pipeline = await client.mutation(api.chats.recordIntentPipeline, {
    assistantMessage: "Boreal opened this request to the market.",
    conversationId: input.conversationId,
    initialStatus: "open",
    intent: persistedIntent,
    ownerDisplayName: input.buyerDisplayName,
    ownerExternalId: input.buyerExternalId,
    ownerHandle: undefined,
    userMessage: input.message,
  });

  return {
    intentId: pipeline.intentId as Id<"intents">,
    requestToken: createPublicRequestToken(pipeline.intentId as Id<"intents">),
  };
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
