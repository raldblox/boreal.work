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
    capabilityTags: ["solana", "editing", "brief", "delivery"],
    category: "research",
    currency: "USD",
    deliveryType: "async",
    description:
      "Structured Solana strategy briefs with a deterministic supplier smoke payout path.",
    estimatedDeliveryLabel: "24 hours",
    isCartEnabled: true,
    ownerActorKind: "agent",
    ownerDisplayName: supplier.displayName,
    ownerExternalId: supplierExternalId,
    outputTypes: ["text"],
    priceAmount: 75,
    priceType: "fixed",
    subtitle: "Supplier payout smoke listing",
    supplyType: "capability",
    title: `Supplier Payout Smoke ${now}`,
  });

  assert.equal(supplyResult.created, true, "expected payout smoke supply to be published");
  assert.ok(supplyResult.supplyId, "expected payout smoke supply id");

  const message = [
    "Create a concise Solana supplier payout brief for an operator.",
    "Need a deterministic fixed-price request so Boreal can push the payout lifecycle.",
  ].join(" ");
  const extractedIntent = normalizeIntentExtraction(
    {
      body: message,
      capabilityTags: ["solana", "editing", "brief", "delivery"],
      catalogQuery: "solana supplier payout brief",
      category: "research",
      confidence: 0.97,
      extractionNotes: ["deterministic payout smoke"],
      intentType: "demand",
      keywords: ["solana", "supplier", "payout", "brief"],
      needsClarification: false,
      requestedOutputTypes: ["text"],
      routeTarget: "general_assistance",
      routing: {
        resolutionTier: "open",
        shouldCreateFulfillmentRequest: true,
        shouldPersistToBoard: true,
      },
      shouldSearchCatalog: true,
      summary: "Need a supplier payout smoke request.",
      title: `Supplier payout smoke ${now}`,
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
    embeddingModel: "smoke-payouts",
    intent: extractedIntent,
    intentModel: "gpt-4.1-mini",
    modalityScores: [{ kind: "text", score: 0.98 }],
    provider: "boreal-agent",
    userMessageId: crypto.randomUUID(),
  });
  const pipeline = await client.mutation(api.chats.recordIntentPipeline, {
    assistantMessage: "Boreal opened this payout smoke request to the market.",
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

  assert.ok(matchedEntry, "expected supplier inbox to include payout smoke request");
  assert.equal(matchedEntry?.actions.canClaim, true, "expected payout smoke request to be claimable");

  const claim = await client.mutation(api.inboxApi.claimMatchedRequest, {
    ownerDisplayName: supplier.displayName,
    ownerExternalId: supplierExternalId,
    requestToken,
    supplyId: supplyResult.supplyId as Id<"supplies">,
  });

  assert.equal(claim.claimed, true, "expected supplier to claim payout smoke request");

  const delivery = await client.mutation(api.fulfillments.submitWork, {
    deliverablesBody: [
      "# Supplier payout smoke brief",
      "",
      "- Ready-for-payout should exist after delivery.",
      "- Processing should transition to paid.",
      "- Settlement should end at paid_out.",
    ].join("\n"),
    intentId: pipeline.intentId as Id<"intents">,
    workerDisplayName: supplier.displayName,
    workerExternalId: supplierExternalId,
  });

  assert.equal(delivery.submitted, true, "expected payout smoke delivery to submit");

  const pendingPayout = await client.query(api.inboxApi.listPayouts, {
    ownerExternalId: supplierExternalId,
  });
  const payout = pendingPayout.find((entry) => entry.request?.requestToken === requestToken);

  assert.ok(payout, "expected payout row after delivery");
  assert.equal(payout?.status, "pending", "expected payout row to start pending");
  assert.equal(
    payout?.settlementStatus,
    "ready_for_payout",
    "expected settlement to start at ready_for_payout",
  );

  const processing = await client.mutation(api.payouts.markPayoutProcessing, {
    payoutToken: payout!.payoutToken,
    processor: "smoke-payouts",
  });

  assert.equal(processing.updated, true, "expected payout to move into processing");

  const processingPayout = await client.query(api.inboxApi.getPayout, {
    ownerExternalId: supplierExternalId,
    payoutToken: payout!.payoutToken,
  });

  assert.equal(processingPayout?.status, "processing", "expected payout status processing");
  assert.equal(
    processingPayout?.settlementStatus,
    "ready_for_payout",
    "expected settlement to stay ready_for_payout while processing",
  );

  const paid = await client.mutation(api.payouts.markPayoutPaid, {
    payoutToken: payout!.payoutToken,
    processor: "smoke-payouts",
    txHash: `devnet-payout-${now}`,
  });

  assert.equal(paid.updated, true, "expected payout to complete");

  const paidPayout = await client.query(api.inboxApi.getPayout, {
    ownerExternalId: supplierExternalId,
    payoutToken: payout!.payoutToken,
  });
  const settledView = await client.query(api.inboxApi.getSupplierRequestView, {
    ownerExternalId: supplierExternalId,
    requestToken,
  });
  const requestEvents = await client.query(api.inboxApi.listSupplierRequestEvents, {
    ownerExternalId: supplierExternalId,
    requestToken,
  });

  assert.equal(paidPayout?.status, "paid", "expected payout status paid");
  assert.equal(paidPayout?.settlementStatus, "paid_out", "expected settlement paid_out");
  assert.equal(settledView?.inbox.status, "settled", "expected supplier inbox to settle");
  assert.ok(
    requestEvents.some((event) => event.status === "settled"),
    "expected settled event in supplier request feed",
  );

  console.log(
    JSON.stringify(
      {
        payoutStatus: paidPayout?.status,
        processingStartedAt: processingPayout?.processingStartedAt,
        requestToken,
        settlementStatus: paidPayout?.settlementStatus,
        supplierInboxStatus: settledView?.inbox.status,
        txHash: paidPayout?.txHash,
      },
      null,
      2,
    ),
  );
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
