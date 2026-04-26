import assert from "node:assert/strict";
import { generateKeyPairSync, sign } from "node:crypto";

import type { Id } from "../convex/_generated/dataModel.js";
import { normalizeIntentExtraction } from "../lib/boreal/schemas/intent.ts";
import { buildIntentPersistencePayload } from "../lib/boreal/tools/ui/build-intent-response.ts";
import { api, createAgentConvexClient } from "../agents/shared/convex-client.ts";
import { directExecutionAgents } from "../agents/index.ts";
import { syncAgentPresence } from "../agents/shared/runtime.ts";
import {
  buildPaymentAuthorizationMessage,
  createOpaqueToken,
  createRequestFingerprint,
  createSiwxChallenge,
  getWalletDisplayName,
  getWalletExternalId,
  verifyPaymentReceipt,
  verifySessionToken,
  verifySiwxChallenge,
} from "../lib/boreal/one-request/auth.ts";
import { buildAutoRoutePlan, executeAutoRoute } from "../lib/boreal/one-request/routing.ts";

const now = Date.now();
const idempotencyKey = `smoke-one-request-${now}`;
const message = [
  "Pressure test this startup idea and design the smallest two-week MVP for it.",
  "Idea: Boreal is request-native agentic commerce where one request routes demand across agents, providers, products, and freelancers until the work is done.",
].join(" ");

async function main() {
  const client = createAgentConvexClient();

  for (const agent of directExecutionAgents) {
    if (agent.settlement) {
      await syncAgentPresence(agent);
    }
  }

  const { privateKey, publicKey } = generateKeyPairSync("ed25519");
  const walletAddress = encodeBase58(publicKey.export({ format: "der", type: "spki" }).subarray(-32));
  const ownerExternalId = getWalletExternalId(walletAddress);
  const ownerDisplayName = getWalletDisplayName(walletAddress);

  const challenge = createSiwxChallenge({ walletAddress });
  const challengeSignature = sign(
    null,
    Buffer.from(challenge.message, "utf8"),
    privateKey,
  ).toString("hex");
  const verified = verifySiwxChallenge({
    challengeToken: challenge.challengeToken,
    signature: challengeSignature,
    walletAddress,
  });
  const session = verifySessionToken(verified.sessionToken);

  assert.equal(session.walletAddress, walletAddress, "session token should bind the wallet");

  await client.mutation(api.wallets.syncWalletAccount, {
    chainFamily: "solana",
    environment: "devnet",
    networkKey: "solana:devnet",
    ownerDisplayName,
    ownerExternalId,
    roles: ["connected", "buyer"],
    setAsDefaultBuyer: true,
    setAsDefaultPayout: false,
    walletAddress,
    walletProvider: "siwx",
  });

  const extractedIntent = normalizeIntentExtraction(
    {
      body: message,
      capabilityTags: ["startup", "pressure test", "mvp", "strategy"],
      catalogQuery: "startup pressure test mvp architect",
      category: "advisory",
      confidence: 0.98,
      extractionNotes: ["deterministic one-request smoke"],
      intentType: "demand",
      keywords: ["startup", "mvp", "pressure test", "idea", "founder"],
      needsClarification: false,
      requestedOutputTypes: ["text"],
      routeTarget: "general_assistance",
      routing: {
        resolutionTier: "auto",
        shouldCreateFulfillmentRequest: true,
        shouldPersistToBoard: true,
      },
      shouldSearchCatalog: false,
      summary:
        "Need a brutal startup pressure test and a two-week MVP plan for Boreal's one-request commerce thesis.",
      title: "Pressure test Boreal and design the MVP",
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
    embeddingModel: "smoke-one-request",
    intent: extractedIntent,
    intentModel: "gpt-4.1-mini",
    modalityScores: [{ kind: "text", score: 0.99 }],
    provider: "boreal-agent",
    userMessageId: crypto.randomUUID(),
  });
  const routePlan = buildAutoRoutePlan({
    intent: persistedIntent,
    message,
  });

  assert.ok(routePlan, "expected an auto route for the advisory smoke request");
  assert.deepEqual(
    routePlan!.selected.map((selection) => selection.agent.key).sort(),
    ["mvp-architect", "startup-pressure-test"],
    "expected the advisory auto route to pick both seeded startup agents",
  );

  const pipeline = await client.mutation(api.chats.recordIntentPipeline, {
    assistantMessage:
      "Boreal locked the fastest automatable route and is waiting for payment.",
    conversationId,
    initialStatus: "open",
    intent: persistedIntent,
    ownerDisplayName,
    ownerExternalId,
    ownerHandle: undefined,
    userMessage: message,
  });

  const requestToken = createOpaqueToken("req", `${walletAddress}:${idempotencyKey}`);
  const quoteToken = createOpaqueToken("quote", requestToken);
  const quoteAuthorizationMessage = buildPaymentAuthorizationMessage({
    amount: routePlan!.totalQuoteUsd,
    currency: routePlan!.currency,
    quoteToken,
    requestToken,
  });

  await client.mutation(api.requestApi.createRequestSession, {
    chainFamily: "solana",
    conversationId,
    currency: "USD",
    idempotencyKey,
    intentId: pipeline.intentId as Id<"intents">,
    intentKey: pipeline.intentKey,
    message,
    networkKey: "solana:devnet",
    ownerDisplayName,
    ownerExternalId,
    paymentProtocol: "x402",
    quoteAmount: routePlan!.totalQuoteUsd,
    quoteAuthorizationMessage,
    quoteExpiresAt: Date.now() + 15 * 60 * 1000,
    quoteToken,
    requestFingerprint: createRequestFingerprint(message),
    requestToken,
    requestedOutputTypes: persistedIntent.requestedOutputTypes,
    routeJson: JSON.stringify({
      category: persistedIntent.category,
      estimatedMinutes: routePlan!.estimatedMinutes,
      networkKey: routePlan!.networkKey,
      paymentProtocol: routePlan!.paymentProtocol,
      selected: routePlan!.selected.map((selection) => ({
        agentDisplayName: selection.agent.identity.displayName,
        agentExternalId: selection.agent.identity.externalId,
        key: selection.agent.key,
        outputKinds: selection.outputKinds,
        payerSources: selection.agent.settlement?.payerSources ?? [],
        payoutAddress: selection.agent.settlement?.payoutAddress ?? "",
        quoteUsd: selection.quoteUsd,
        score: selection.score,
      })),
      summary: routePlan!.summary,
      title: routePlan!.title,
      totalQuoteUsd: routePlan!.totalQuoteUsd,
    }),
    status: "payment_required",
    summary: routePlan!.summary,
    title: routePlan!.title,
    walletAddress,
  });

  const paymentReceipt = {
    amount: routePlan!.totalQuoteUsd,
    currency: "USD" as const,
    networkKey: "solana:devnet" as const,
    payerSource: "agentcash" as const,
    quoteToken,
    requestToken,
    signature: sign(
      null,
      Buffer.from(quoteAuthorizationMessage, "utf8"),
      privateKey,
    ).toString("hex"),
    signedMessage: quoteAuthorizationMessage,
    txHash: `devnet-smoke-${now}`,
    walletAddress,
  };

  verifyPaymentReceipt({
    amount: routePlan!.totalQuoteUsd,
    currency: "USD",
    quoteToken,
    receipt: paymentReceipt,
    requestToken,
    walletAddress,
  });

  await client.mutation(api.requestApi.recordQuotePayment, {
    ownerExternalId,
    payerSource: paymentReceipt.payerSource,
    paymentReceiptJson: JSON.stringify(paymentReceipt),
    requestToken,
    txHash: paymentReceipt.txHash,
  });
  await client.mutation(api.requestApi.markExecutionStarted, {
    ownerExternalId,
    requestToken,
  });

  const results = await executeAutoRoute({
    intent: persistedIntent,
    routePlan: routePlan!,
  });

  assert.equal(results.length, 2, "expected both advisory agents to execute");
  assert.ok(
    results.every((result) => result.result.kind === "text"),
    "expected advisory execution to return markdown text results",
  );

  const completionMessage = `Delivered through ${results.map((result) => result.result.title).join(", ")}.`;
  await client.mutation(api.chats.appendRequestExecution, {
    activityPayload: JSON.stringify({
      completedAgentKeys: results.map((result) => result.agentKey),
      requestMode: "auto",
    }),
    activityType: "request.delivered",
    assignedAgent: "Boreal Agent",
    assignedToolNames: results.map((result) => result.agentKey),
    assistantMessage: completionMessage,
    intentId: pipeline.intentId as Id<"intents">,
    ownerExternalId,
    status: "fulfilled",
  });

  await client.mutation(api.requestApi.markRequestDelivered, {
    ownerExternalId,
    payoutTargets: routePlan!.selected.map((selection) => ({
      agentExternalId: selection.agent.identity.externalId,
      amount: selection.quoteUsd,
      walletAddress: selection.agent.settlement!.payoutAddress,
    })),
    requestToken,
    resultJson: JSON.stringify({
      completionMessage,
      results,
    }),
  });

  const storedSession = await client.query(api.requestApi.getRequestSession, {
    ownerExternalId,
    requestToken,
  });
  const financials = await client.query(api.requestApi.getRequestFinancials, {
    ownerExternalId,
    requestToken,
  });
  const events = await client.query(api.requestApi.listRequestEvents, {
    ownerExternalId,
    requestToken,
  });
  const thread = await client.query(api.chats.getConversationThread, {
    conversationId,
    ownerExternalId,
  });
  const detail = await client.query(api.intents.getRequestDetail, {
    intentId: pipeline.intentId as Id<"intents">,
    ownerExternalId,
  });
  const audits = await client.query(api.commerce.listTransactionAudits, {
    intentId: pipeline.intentId as Id<"intents">,
    limit: 20,
    transactionId: undefined,
  });

  assert.equal(storedSession?.status, "delivered", "session should be delivered");
  assert.equal(financials?.transactionStatus, "fulfilled", "transaction should be fulfilled");
  assert.equal(
    financials?.settlementStatus,
    "ready_for_payout",
    "settlement should be ready for payout",
  );
  assert.equal(financials?.payoutCount, 2, "expected one payout per selected advisory agent");
  assert.ok(
    events.some((event) => event.eventType === "request.payment_required"),
    "expected payment_required event",
  );
  assert.ok(
    events.some((event) => event.eventType === "request.paid"),
    "expected paid event",
  );
  assert.ok(
    events.some((event) => event.eventType === "request.delivered"),
    "expected delivered event",
  );
  assert.ok(thread?.messages.some((message) => message.body.includes("Delivered through")));
  assert.equal(detail.intent?.status, "fulfilled", "request detail should be fulfilled");
  assert.ok(
    audits.some((audit) => audit.stage === "payment" && audit.status === "passed"),
    "expected payment audit record",
  );
  assert.ok(
    audits.some((audit) => audit.stage === "delivery" && audit.status === "passed"),
    "expected delivery audit record",
  );
  assert.ok(
    audits.some((audit) => audit.stage === "settlement"),
    "expected settlement audit record",
  );

  console.log(
    JSON.stringify(
      {
        events: events.map((event) => event.eventType),
        payoutCount: financials?.payoutCount ?? 0,
        requestToken,
        routeAgents: routePlan!.selected.map((selection) => selection.agent.key),
        settlementStatus: financials?.settlementStatus,
        status: storedSession?.status,
        transactionStatus: financials?.transactionStatus,
      },
      null,
      2,
    ),
  );
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
