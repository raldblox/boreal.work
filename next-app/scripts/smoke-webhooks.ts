import assert from "node:assert/strict";
import { createServer } from "node:http";

import type { Id } from "../convex/_generated/dataModel.js";
import { normalizeIntentExtraction } from "../lib/boreal/schemas/intent.ts";
import { buildIntentPersistencePayload } from "../lib/boreal/tools/ui/build-intent-response.ts";
import { api, createAgentConvexClient } from "../agents/shared/convex-client.ts";
import { createWebhookSignature } from "../lib/boreal/webhooks/security.ts";
import { flushWebhookDeliveriesWithClient } from "../lib/boreal/webhooks/dispatcher.ts";
import { createPublicRequestToken } from "../lib/boreal/one-inbox/tokens.ts";
import {
  createOpaqueToken,
  createRequestFingerprint,
  verifySessionToken,
} from "../lib/boreal/one-request/auth.ts";
import { createSmokeWalletIdentity } from "./lib/smoke-wallet-identities.ts";

const SUPPLY_TITLE = "Smoke Webhook Supplier Listing";

type ReceivedWebhook = {
  body: Record<string, unknown>;
  eventType: string;
  stream: string;
  webhookToken: string;
};

async function main() {
  const client = createAgentConvexClient();
  const buyer = createSmokeWalletIdentity("webhooks-buyer", "buyer");
  const supplier = createSmokeWalletIdentity("webhooks-supplier", "supplier");
  const buyerExternalId = buyer.externalId;
  const supplierExternalId = supplier.externalId;

  assert.equal(verifySessionToken(buyer.sessionToken).walletAddress, buyer.walletAddress);
  assert.equal(
    verifySessionToken(supplier.sessionToken).walletAddress,
    supplier.walletAddress,
  );

  await client.mutation(api.wallets.syncWalletAccount, {
    chainFamily: "solana",
    environment: "mainnet",
    networkKey: "solana:mainnet",
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
    environment: "mainnet",
    networkKey: "solana:mainnet",
    ownerDisplayName: supplier.displayName,
    ownerExternalId: supplierExternalId,
    roles: ["connected", "payout"],
    setAsDefaultBuyer: false,
    setAsDefaultPayout: true,
    walletAddress: supplier.walletAddress,
    walletProvider: "siwx",
  });

  const secrets = new Map<string, string>();
  const received: ReceivedWebhook[] = [];
  const server = createServer((request, response) => {
    const chunks: Buffer[] = [];
    request.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    request.on("end", () => {
      void (async () => {
        try {
        const bodyText = Buffer.concat(chunks).toString("utf8");
        const webhookToken = `${request.headers["x-boreal-webhook"] ?? ""}`;
        const eventType = `${request.headers["x-boreal-event"] ?? ""}`;
        const stream = `${request.headers["x-boreal-stream"] ?? ""}`;
        const timestamp = `${request.headers["x-boreal-timestamp"] ?? ""}`;
        const signature = `${request.headers["x-boreal-signature"] ?? ""}`;
        const secret = secrets.get(webhookToken);

        assert.ok(secret, `missing webhook secret for ${webhookToken}`);
        assert.equal(
          signature,
          `t=${timestamp},v1=${await createWebhookSignature({
            payload: bodyText,
            secret: secret!,
            timestamp,
          })}`,
          "expected Boreal webhook signature to match the payload",
        );

        received.push({
          body: JSON.parse(bodyText) as Record<string, unknown>,
          eventType,
          stream,
          webhookToken,
        });

        response.writeHead(200, { "content-type": "application/json" });
        response.end(JSON.stringify({ ok: true }));
        } catch (error) {
          response.writeHead(500, { "content-type": "application/json" });
          response.end(
            JSON.stringify({
              error: error instanceof Error ? error.message : "receiver verification failed",
            }),
          );
        }
      })();
    });
  });
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => resolve());
  });
  const address = server.address();

  if (!address || typeof address === "string") {
    throw new Error("Unable to start local webhook receiver.");
  }

  const endpointUrl = `http://127.0.0.1:${address.port}/`;
  const buyerWebhook = await client.mutation(api.webhooks.createWebhookSubscription, {
    endpointUrl,
    eventStreams: ["requests"],
    ownerDisplayName: buyer.displayName,
    ownerExternalId: buyerExternalId,
    walletAddress: buyer.walletAddress,
  });
  const supplierWebhook = await client.mutation(api.webhooks.createWebhookSubscription, {
    endpointUrl,
    eventStreams: ["inbox", "payouts"],
    ownerDisplayName: supplier.displayName,
    ownerExternalId: supplierExternalId,
    walletAddress: supplier.walletAddress,
  });
  secrets.set(buyerWebhook.webhookToken, buyerWebhook.secret);
  secrets.set(supplierWebhook.webhookToken, supplierWebhook.secret);

  const requestNow = Date.now();
  const requestToken = createOpaqueToken("req", `${buyer.walletAddress}:${requestNow}`);
  const quoteToken = createOpaqueToken("quote", requestToken);

  await client.mutation(api.requestApi.createRequestSession, {
    chainFamily: "solana",
    conversationId: crypto.randomUUID(),
    currency: "USD",
    idempotencyKey: `smoke-webhooks-request-${requestNow}`,
    message: "Create a webhook smoke request for Boreal one-request lifecycle delivery.",
    networkKey: "solana:mainnet",
    ownerDisplayName: buyer.displayName,
    ownerExternalId: buyerExternalId,
    paymentProtocol: "x402",
    quoteAmount: 0.01,
    quoteAuthorizationMessage: "smoke webhook authorization",
    quoteExpiresAt: requestNow + 15 * 60 * 1000,
    quoteToken,
    requestFingerprint: createRequestFingerprint("smoke webhook request"),
    requestToken,
    requestedOutputTypes: ["text"],
    routeJson: JSON.stringify({
      selectedAgents: ["startup-pressure-test"],
      summary: "Webhook smoke request.",
    }),
    status: "payment_required",
    summary: "Webhook smoke request.",
    title: "Webhook smoke request",
    walletAddress: buyer.walletAddress,
  });
  await client.mutation(api.requestApi.recordQuotePayment, {
    ownerExternalId: buyerExternalId,
    payerSource: "agentcash",
    paymentReceiptJson: JSON.stringify({ requestToken, txHash: `smoke-request-${requestNow}` }),
    paymentVerificationJson: JSON.stringify({ verified: true }),
    requestToken,
    txHash: `smoke-request-${requestNow}`,
  });
  await client.mutation(api.requestApi.markExecutionStarted, {
    ownerExternalId: buyerExternalId,
    requestToken,
  });
  await client.mutation(api.requestApi.markRequestDelivered, {
    ownerExternalId: buyerExternalId,
    payoutTargets: [],
    requestToken,
    resultJson: JSON.stringify({
      completedAgentKeys: ["startup-pressure-test"],
      kind: "text",
      title: "Webhook smoke result",
    }),
  });
  await flushWebhookDeliveriesWithClient(client, {
    ownerExternalId: buyerExternalId,
  });

  const supplyResult = await client.mutation(api.supplies.createSupplyEntry, {
    capabilityTags: ["solana", "research", "delivery", "webhooks"],
    category: "research",
    currency: "USD",
    deliveryType: "async",
    description: "Supplier webhook smoke listing.",
    estimatedDeliveryLabel: "24 hours",
    isCartEnabled: true,
    ownerActorKind: "agent",
    ownerDisplayName: supplier.displayName,
    ownerExternalId: supplierExternalId,
    outputTypes: ["text"],
    priceAmount: 0.01,
    priceType: "fixed",
    subtitle: "Webhook supplier smoke",
    supplyType: "capability",
    title: SUPPLY_TITLE,
  });

  const message = [
    "Create a webhook-enabled supplier payout brief.",
    "Need a deterministic public request so Boreal can emit inbox and payout events.",
  ].join(" ");
  const extractedIntent = normalizeIntentExtraction(
    {
      body: message,
      capabilityTags: ["solana", "research", "delivery", "webhooks"],
      catalogQuery: "webhook supplier payout brief",
      category: "research",
      confidence: 0.97,
      extractionNotes: ["deterministic webhook smoke"],
      intentType: "demand",
      keywords: ["webhook", "supplier", "payout", "brief"],
      needsClarification: false,
      requestedOutputTypes: ["text"],
      routeTarget: "general_assistance",
      routing: {
        resolutionTier: "open",
        shouldCreateFulfillmentRequest: true,
        shouldPersistToBoard: true,
      },
      shouldSearchCatalog: true,
      summary: "Need a supplier webhook smoke request.",
      title: `Webhook supplier request ${requestNow}`,
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
    embeddingModel: "smoke-webhooks",
    intent: extractedIntent,
    intentModel: "gpt-4.1-mini",
    modalityScores: [{ kind: "text", score: 0.98 }],
    provider: "boreal-agent",
    userMessageId: crypto.randomUUID(),
  });
  const pipeline = await client.mutation(api.chats.recordIntentPipeline, {
    assistantMessage: "Boreal opened this webhook smoke request to the market.",
    conversationId,
    initialStatus: "open",
    intent: persistedIntent,
    ownerDisplayName: buyer.displayName,
    ownerExternalId: buyerExternalId,
    ownerHandle: undefined,
    userMessage: message,
  });
  const publicRequestToken = createPublicRequestToken(pipeline.intentId as Id<"intents">);

  const claim = await client.mutation(api.inboxApi.claimMatchedRequest, {
    ownerDisplayName: supplier.displayName,
    ownerExternalId: supplierExternalId,
    requestToken: publicRequestToken,
    supplyId: supplyResult.supplyId as Id<"supplies">,
  });

  assert.equal(claim.claimed, true, "expected webhook smoke supplier claim");

  await flushWebhookDeliveriesWithClient(client, {
    ownerExternalId: supplierExternalId,
  });

  const delivery = await client.mutation(api.fulfillments.submitWork, {
    deliverablesBody: [
      "# Webhook supplier brief",
      "",
      "- Inbox claimed event should already exist.",
      "- Delivery should create inbox.delivered and payout.ready.",
    ].join("\n"),
    intentId: pipeline.intentId as Id<"intents">,
    workerDisplayName: supplier.displayName,
    workerExternalId: supplierExternalId,
  });

  assert.equal(delivery.submitted, true, "expected webhook smoke delivery");

  await flushWebhookDeliveriesWithClient(client, {
    ownerExternalId: supplierExternalId,
  });

  const payouts = await client.query(api.inboxApi.listPayouts, {
    ownerExternalId: supplierExternalId,
  });
  const payout = payouts.find((entry) => entry.request?.requestToken === publicRequestToken);

  assert.ok(payout, "expected payout row for webhook smoke supplier flow");

  await client.mutation(api.payouts.markPayoutProcessing, {
    payoutToken: payout!.payoutToken,
    processor: "smoke-webhooks",
  });
  await flushWebhookDeliveriesWithClient(client, {
    ownerExternalId: supplierExternalId,
  });

  await client.mutation(api.payouts.markPayoutPaid, {
    payoutToken: payout!.payoutToken,
    processor: "smoke-webhooks",
    txHash: `smoke-payout-${requestNow}`,
  });
  await flushWebhookDeliveriesWithClient(client, {
    ownerExternalId: supplierExternalId,
  });

  const buyerDeliveries = await waitForDeliveredTypes(client, buyerExternalId, [
    "request.received",
    "request.routed",
    "request.payment_required",
    "request.paid",
    "request.execution_started",
    "request.delivered",
  ]);
  const supplierDeliveries = await waitForDeliveredTypes(client, supplierExternalId, [
    "inbox.claimed",
    "inbox.delivered",
    "inbox.payout_ready",
    "inbox.payout_processing",
    "inbox.settled",
    "payout.ready",
    "payout.processing",
    "payout.paid",
  ]);

  assert.ok(
    received.some(
      (event) => event.webhookToken === buyerWebhook.webhookToken && event.eventType === "request.delivered",
    ),
    "expected buyer receiver to get request.delivered",
  );
  assert.ok(
    received.some(
      (event) => event.webhookToken === supplierWebhook.webhookToken && event.eventType === "payout.paid",
    ),
    "expected supplier receiver to get payout.paid",
  );

  server.close();

  console.log(
    JSON.stringify(
      {
        buyerDeliveredTypes: buyerDeliveries.map((delivery) => delivery.eventType),
        receivedCount: received.length,
        requestToken,
        supplierDeliveredTypes: supplierDeliveries.map((delivery) => delivery.eventType),
        supplierRequestToken: publicRequestToken,
      },
      null,
      2,
    ),
  );
}

async function waitForDeliveredTypes(
  client: ReturnType<typeof createAgentConvexClient>,
  ownerExternalId: string,
  expectedEventTypes: string[],
) {
  let lastSnapshot: Array<{
    attemptCount: number;
    eventType: string;
    lastError: string | null;
    status: string;
    stream: string;
  }> = [];

  for (let attempt = 0; attempt < 20; attempt += 1) {
    const deliveries = await client.query(api.webhooks.listWebhookDeliveries, {
      limit: 64,
      ownerExternalId,
    });
    lastSnapshot = deliveries.map((delivery) => ({
      attemptCount: delivery.attemptCount,
      eventType: delivery.eventType,
      lastError: delivery.lastError,
      status: delivery.status,
      stream: delivery.stream,
    }));
    const deliveredTypes = new Set(
      deliveries
        .filter((delivery) => delivery.status === "delivered")
        .map((delivery) => delivery.eventType),
    );

    if (expectedEventTypes.every((eventType) => deliveredTypes.has(eventType))) {
      return deliveries.filter(
        (delivery) =>
          delivery.status === "delivered" && expectedEventTypes.includes(delivery.eventType),
      );
    }

    await flushWebhookDeliveriesWithClient(client, {
      ownerExternalId,
    });
    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  throw new Error(
    `Timed out waiting for webhook deliveries: ${expectedEventTypes.join(", ")}. Observed: ${JSON.stringify(lastSnapshot)}`,
  );
}

main();
