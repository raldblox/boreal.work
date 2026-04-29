import assert from "node:assert/strict";
import { generateKeyPairSync, sign } from "node:crypto";
import { createServer } from "node:http";

import type { Id } from "../convex/_generated/dataModel.js";
import { normalizeIntentExtraction } from "../lib/boreal/schemas/intent.ts";
import { buildIntentPersistencePayload } from "../lib/boreal/tools/ui/build-intent-response.ts";
import { api, createAgentConvexClient } from "../agents/shared/convex-client.ts";
import { directExecutionAgents } from "../agents/index.ts";
import { syncAgentPresence } from "../agents/shared/runtime.ts";
import {
  buildPaymentAuthorizationMessage,
  buildPaymentReferenceMemo,
  createOpaqueToken,
  createRequestFingerprint,
  createSiwxChallenge,
  getWalletDisplayName,
  getWalletExternalId,
  verifySessionToken,
  verifySiwxChallenge,
} from "../lib/boreal/one-request/auth.ts";
import { verifyOneRequestPayment } from "../lib/boreal/one-request/payment.ts";
import { buildAutoRoutePlan, executeAutoRoute } from "../lib/boreal/one-request/routing.ts";
import { getOneRequestSellerMetadata } from "../lib/boreal/one-request/seller.ts";

const now = Date.now();
const idempotencyKey = `smoke-one-request-${now}`;
const message = [
  "Pressure test this startup idea and design the smallest two-week MVP for it.",
  "Idea: Boreal is request-native agentic commerce where one request routes demand across agents, providers, products, and freelancers until the work is done.",
].join(" ");

async function main() {
  const client = createAgentConvexClient();
  const quoteExpiresAt = Date.now() + 15 * 60 * 1000;
  const payoutKeyPair = generateKeyPairSync("ed25519");
  const payoutAddress = encodeBase58(
    payoutKeyPair.publicKey.export({ format: "der", type: "spki" }).subarray(-32),
  );

  process.env.BOREAL_ONE_REQUEST_PAYTO_SOLANA_MAINNET = payoutAddress;
  const seller = getOneRequestSellerMetadata();

  assert.equal(seller.paymentProtocol, "x402", "seller metadata should stay x402");
  assert.equal(
    seller.x402NetworkId,
    "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp",
    "seller metadata should expose the canonical x402 Solana mainnet network id",
  );
  assert.equal(
    seller.bazaar.category,
    "agentic-commerce",
    "seller metadata should expose the Bazaar category",
  );
  assert.ok(
    seller.bazaar.tags.includes("one-request"),
    "seller metadata should expose Bazaar tags for request-first discovery",
  );
  assert.equal(
    seller.payToAddress,
    payoutAddress,
    "seller metadata should expose the configured pay-to address in smoke",
  );
  assert.equal(
    seller.bazaar.discoverable,
    true,
    "seller metadata should mark Bazaar discovery as enabled when pay-to is configured",
  );

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
    environment: "mainnet",
    networkKey: "solana:mainnet",
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
    networkKey: "solana:mainnet",
    ownerDisplayName,
    ownerExternalId,
    paymentProtocol: "x402",
    quoteAmount: routePlan!.totalQuoteUsd,
    quoteAuthorizationMessage,
    quoteExpiresAt,
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

  const paymentReference = buildPaymentReferenceMemo({
    quoteToken,
    requestToken,
  });
  const rpcServer = createServer((request, response) => {
    const chunks: Buffer[] = [];
    request.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    request.on("end", () => {
      const payload = JSON.parse(Buffer.concat(chunks).toString("utf8")) as {
        method: string;
      };
      let result: unknown;

      if (payload.method === "getTransaction") {
        result = {
          blockTime: Math.floor(Date.now() / 1000),
          meta: {
            err: null,
            logMessages: [
              `Program log: Memo (len ${paymentReference.length}): ${paymentReference}`,
            ],
          },
          slot: 123456,
          transaction: {
            message: {
              accountKeys: [
                {
                  pubkey: walletAddress,
                  signer: true,
                  writable: true,
                },
                {
                  pubkey: payoutAddress,
                  signer: false,
                  writable: true,
                },
              ],
              instructions: [
                {
                  parsed: {
                    destination: payoutAddress,
                    memo: paymentReference,
                  },
                  program: "spl-memo",
                  programId: "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr",
                },
              ],
            },
            signatures: [paymentReceiptHash(now)],
          },
        };
      } else if (payload.method === "getSignatureStatuses") {
        result = {
          value: [
            {
              confirmationStatus: "confirmed",
              confirmations: 0,
              err: null,
              slot: 123456,
            },
          ],
        };
      } else {
        result = null;
      }

      response.writeHead(200, { "content-type": "application/json" });
      response.end(
        JSON.stringify({
          id: 1,
          jsonrpc: "2.0",
          result,
        }),
      );
    });
  });
  await new Promise<void>((resolve, reject) => {
    rpcServer.once("error", reject);
    rpcServer.listen(0, "127.0.0.1", () => resolve());
  });
  const rpcAddress = rpcServer.address();

  if (!rpcAddress || typeof rpcAddress === "string") {
    throw new Error("Unable to start local Solana RPC mock server.");
  }

  process.env.BOREAL_SOLANA_MAINNET_RPC_URL = `http://127.0.0.1:${rpcAddress.port}`;
  const txHash = paymentReceiptHash(now);
  const paymentReceipt = {
    amount: routePlan!.totalQuoteUsd,
    currency: "USD" as const,
    networkKey: "solana:mainnet" as const,
    payerSource: "agentcash" as const,
    quoteToken,
    requestToken,
    signature: sign(
      null,
      Buffer.from(quoteAuthorizationMessage, "utf8"),
      privateKey,
    ).toString("hex"),
    signedMessage: quoteAuthorizationMessage,
    txHash,
    walletAddress,
  };

  const paymentVerification = await verifyOneRequestPayment({
    amount: routePlan!.totalQuoteUsd,
    authorizationMessage: quoteAuthorizationMessage,
    currency: "USD",
    payToAddress: seller.payToAddress,
    quoteExpiresAt,
    quoteToken,
    receipt: paymentReceipt,
    requestToken,
    walletAddress,
  });

  assert.equal(
    paymentVerification.payToAddress,
    payoutAddress,
    "payment verification should retain the configured pay-to address",
  );
  assert.equal(
    paymentVerification.verificationMethod,
    "solana_memo_payto",
    "payment verification should switch to the pay-to-aware mode when configured",
  );

  await client.mutation(api.requestApi.recordQuotePayment, {
    ownerExternalId,
    payerSource: paymentReceipt.payerSource,
    paymentReceiptJson: JSON.stringify(paymentReceipt),
    paymentVerificationJson: JSON.stringify(paymentVerification),
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
  assert.ok(storedSession?.paymentVerificationJson, "expected stored payment verification payload");
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

  await new Promise<void>((resolve, reject) => {
    rpcServer.close((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
}

function paymentReceiptHash(seed: number) {
  return `mainnet-smoke-${seed}`;
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
