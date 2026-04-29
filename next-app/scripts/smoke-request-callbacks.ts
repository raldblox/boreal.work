import assert from "node:assert/strict";

import { api, createAgentConvexClient } from "../agents/shared/convex-client.ts";
import { buildPaymentAuthorizationMessage, createOpaqueToken } from "../lib/boreal/one-request/auth.ts";
import {
  handleOneRequestEvidenceCallback,
  handleOneRequestHeartbeatCallback,
  handleOneRequestStatusCallback,
} from "../lib/boreal/one-request/callbacks.ts";
import { createSmokeWalletIdentity } from "./lib/smoke-wallet-identities.ts";

async function main() {
  const client = createAgentConvexClient();
  const buyer = createSmokeWalletIdentity("payouts-buyer", "callback-buyer");
  const supplier = createSmokeWalletIdentity("payouts-supplier", "callback-supplier");
  const now = Date.now();
  const requestToken = createOpaqueToken("req", `callbacks:${now}`);
  const quoteToken = createOpaqueToken("quote", requestToken);

  await client.mutation(api.wallets.syncWalletAccount, {
    chainFamily: "solana",
    environment: "mainnet",
    networkKey: "solana:mainnet",
    ownerDisplayName: buyer.displayName,
    ownerExternalId: buyer.externalId,
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
    ownerExternalId: supplier.externalId,
    roles: ["connected", "payout"],
    setAsDefaultBuyer: false,
    setAsDefaultPayout: true,
    walletAddress: supplier.walletAddress,
    walletProvider: "siwx",
  });

  await client.mutation(api.requestApi.createRequestSession, {
    chainFamily: "solana",
    conversationId: `callbacks-conversation-${now}`,
    currency: "USD",
    idempotencyKey: `callbacks-${now}`,
    message: "Connected agent callback smoke request",
    networkKey: "solana:mainnet",
    ownerDisplayName: buyer.displayName,
    ownerExternalId: buyer.externalId,
    paymentProtocol: "x402",
    quoteAmount: 0.01,
    quoteAuthorizationMessage: buildPaymentAuthorizationMessage({
      amount: 0.01,
      currency: "USD",
      quoteToken,
      requestToken,
    }),
    quoteExpiresAt: now + 15 * 60 * 1000,
    quoteToken,
    requestFingerprint: `callbacks-fingerprint-${now}`,
    requestToken,
    requestedOutputTypes: ["text"],
    routeJson: JSON.stringify({
      selectedAgents: ["hermes"],
      summary: "Connected callback smoke",
    }),
    status: "payment_required",
    summary: "Connected callback smoke",
    title: "Connected callback smoke",
    walletAddress: buyer.walletAddress,
  });

  await client.mutation(api.requestApi.recordQuotePayment, {
    ownerExternalId: buyer.externalId,
    payerSource: "agentcash",
    paymentReceiptJson: JSON.stringify({
      amount: 0.01,
      status: "paid",
      txHash: `tx-callbacks-${now}`,
    }),
    paymentVerificationJson: JSON.stringify({
      confirmed: true,
      memoMatched: true,
      networkKey: "solana:mainnet",
    }),
    requestToken,
    txHash: `tx-callbacks-${now}`,
  });

  const caller = { externalId: buyer.externalId };

  const executingResponse = await handleOneRequestStatusCallback({
    body: {
      message: "Hermes started the connected execution.",
      status: "executing",
    },
    caller,
    requestToken,
  });
  assert.equal(executingResponse.accepted, true, "expected executing callback to succeed");

  const evidenceResponse = await handleOneRequestEvidenceCallback({
    body: {
      data: {
        attachmentUrl: "https://example.com/proof.md",
      },
      kind: "artifact_bundle",
      message: "Connected agent attached an evidence bundle.",
    },
    caller,
    requestToken,
  });
  assert.equal(evidenceResponse.accepted, true, "expected evidence callback to succeed");

  const heartbeatResponse = await handleOneRequestHeartbeatCallback({
    body: {
      data: {
        stage: "drafting",
      },
      message: "Connected agent heartbeat arrived.",
    },
    caller,
    requestToken,
  });
  assert.equal(heartbeatResponse.accepted, true, "expected heartbeat callback to succeed");

  const deliveredResponse = await handleOneRequestStatusCallback({
    body: {
      payoutTargets: [
        {
          agentExternalId: supplier.externalId,
          amount: 0.01,
          walletAddress: supplier.walletAddress,
        },
      ],
      result: {
        summary: "Hermes delivered the connected request result.",
      },
      status: "delivered",
    },
    caller,
    requestToken,
  });
  assert.equal(deliveredResponse.accepted, true, "expected delivered callback to succeed");

  const events = await client.query(api.requestApi.listRequestEvents, {
    ownerExternalId: buyer.externalId,
    requestToken,
  });
  const financials = await client.query(api.requestApi.getRequestFinancials, {
    ownerExternalId: buyer.externalId,
    requestToken,
  });

  assert.ok(
    events.some((event) => event.eventType === "request.agent_status"),
    "expected agent status event",
  );
  assert.ok(
    events.some((event) => event.eventType === "request.evidence"),
    "expected evidence event",
  );
  assert.ok(
    events.some((event) => event.eventType === "request.heartbeat"),
    "expected heartbeat event",
  );
  assert.ok(
    events.some((event) => event.eventType === "request.delivered"),
    "expected delivered event",
  );
  assert.equal(
    financials?.settlementStatus,
    "ready_for_payout",
    "expected delivered callback to move settlement into ready_for_payout",
  );
  assert.equal(financials?.payoutCount, 1, "expected one payout after delivered callback");

  console.log(
    JSON.stringify(
      {
        eventTypes: events.map((event) => event.eventType),
        payoutCount: financials?.payoutCount ?? 0,
        requestToken,
        settlementStatus: financials?.settlementStatus ?? null,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
