import assert from "node:assert/strict";

import { api, createAgentConvexClient } from "../agents/shared/convex-client.ts";
import {
  assertOneRequestIntakeAllowed,
  ONE_REQUEST_GUARD_WINDOW_MS,
  ONE_REQUEST_MAX_ACTIVE_UNPAID_QUOTES,
  ONE_REQUEST_MAX_REQUESTS_PER_WINDOW,
} from "../lib/boreal/one-request/guards.ts";
import {
  buildPaymentAuthorizationMessage,
  createOpaqueToken,
} from "../lib/boreal/one-request/auth.ts";

async function main() {
  const client = createAgentConvexClient();
  const now = Date.now();
  const activeQuoteOwner = `wallet:guard-active-${now}`;
  const burstOwner = `wallet:guard-burst-${now}`;

  for (let index = 0; index < ONE_REQUEST_MAX_ACTIVE_UNPAID_QUOTES; index += 1) {
    await createSession(client, {
      idempotencyKey: `active-quote-${index}-${now}`,
      ownerExternalId: activeQuoteOwner,
      quoteAmount: 0.01,
      quoteExpiresAt: now + 15 * 60 * 1000,
      status: "payment_required",
    });
  }

  const activeQuoteState = await client.query(api.requestApi.getRequestIntakeGuardState, {
    ownerExternalId: activeQuoteOwner,
    windowStartedAt: now - ONE_REQUEST_GUARD_WINDOW_MS,
  });

  assert.equal(
    activeQuoteState.activeUnpaidQuoteCount,
    ONE_REQUEST_MAX_ACTIVE_UNPAID_QUOTES,
    "expected the active unpaid quote cap to be reached",
  );
  assert.throws(
    () => assertOneRequestIntakeAllowed(activeQuoteState),
    /Too many active unpaid quotes/,
    "expected the request guard to block on active unpaid quotes",
  );

  for (let index = 0; index < ONE_REQUEST_MAX_REQUESTS_PER_WINDOW; index += 1) {
    await createSession(client, {
      idempotencyKey: `burst-${index}-${now}`,
      ownerExternalId: burstOwner,
      quoteAmount: 0,
      quoteExpiresAt: now + 60 * 1000,
      status: "delivered",
    });
  }

  const burstState = await client.query(api.requestApi.getRequestIntakeGuardState, {
    ownerExternalId: burstOwner,
    windowStartedAt: now - ONE_REQUEST_GUARD_WINDOW_MS,
  });

  assert.equal(
    burstState.recentRequestCount,
    ONE_REQUEST_MAX_REQUESTS_PER_WINDOW,
    "expected the recent request cap to be reached",
  );
  assert.throws(
    () => assertOneRequestIntakeAllowed(burstState),
    /Too many recent Boreal requests/,
    "expected the request guard to block on request bursts",
  );

  console.log(
    JSON.stringify(
      {
        activeUnpaidQuoteCount: activeQuoteState.activeUnpaidQuoteCount,
        recentRequestCount: burstState.recentRequestCount,
        status: "ok",
      },
      null,
      2,
    ),
  );
}

async function createSession(
  client: ReturnType<typeof createAgentConvexClient>,
  input: {
    idempotencyKey: string;
    ownerExternalId: string;
    quoteAmount: number;
    quoteExpiresAt: number;
    status:
      | "clarification_required"
      | "delivered"
      | "executing"
      | "failed"
      | "fallback_required"
      | "paid"
      | "payment_required";
  },
) {
  const requestToken = createOpaqueToken("req", `${input.ownerExternalId}:${input.idempotencyKey}`);
  const quoteToken = createOpaqueToken("quote", requestToken);

  await client.mutation(api.requestApi.createRequestSession, {
    chainFamily: "solana",
    conversationId: crypto.randomUUID(),
    currency: "USD",
    idempotencyKey: input.idempotencyKey,
    intentId: undefined,
    intentKey: undefined,
    message: `Smoke guard session ${input.idempotencyKey}`,
    networkKey: "solana:mainnet",
    ownerDisplayName: input.ownerExternalId,
    ownerExternalId: input.ownerExternalId,
    paymentProtocol: "x402",
    quoteAmount: input.quoteAmount,
    quoteAuthorizationMessage: buildPaymentAuthorizationMessage({
      amount: input.quoteAmount,
      currency: "USD",
      quoteToken,
      requestToken,
    }),
    quoteExpiresAt: input.quoteExpiresAt,
    quoteToken,
    requestFingerprint: input.idempotencyKey,
    requestToken,
    requestedOutputTypes: ["text"],
    routeJson: JSON.stringify({
      category: "guard-test",
      selected: [],
      summary: "Guard smoke request",
      title: "Guard smoke request",
      totalQuoteUsd: input.quoteAmount,
    }),
    status: input.status,
    summary: "Guard smoke request",
    title: "Guard smoke request",
    walletAddress: input.ownerExternalId,
  });
}

main();
