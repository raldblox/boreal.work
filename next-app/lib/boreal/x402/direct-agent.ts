import "server-only";

import { NextResponse } from "next/server";

import { getDirectExecutionAgent } from "@/agents";
import { validateDirectExecutionPayload } from "@/agents/shared/registry";
import {
  buildPaymentAuthorizationMessage,
  buildPaymentReferenceMemo,
  createRequestFingerprint,
} from "@/lib/boreal/one-request/auth";
import { getOneRequestSellerMetadata } from "@/lib/boreal/one-request/seller";
import { getDefaultSolanaNetworkKey } from "@/lib/boreal/solana-network";

import { BOREAL_X402_PAYMENT_SIGNATURE_HEADER } from "./constants";
import { BOREAL_X402_FLAT_PRICE_USDC } from "./config";
import {
  attachBorealX402SettlementHeaders,
  createBorealX402Challenge,
  createBorealX402RequiredResponse,
  verifyAndSettleBorealX402,
} from "./server";

export async function handleBorealDirectExecutionRoute(input: {
  agentKey: string;
  request: Request;
}) {
  const agent = getDirectExecutionAgent(input.agentKey);
  const body = await input.request.json();

  if (!body || typeof body !== "object") {
    return NextResponse.json(
      { error: "Execution payload must be a JSON object." },
      { status: 400 },
    );
  }

  validateDirectExecutionPayload(agent, body as Record<string, unknown>);

  const quote = buildDirectExecutionQuote({
    agentKey: agent.key,
    payload: body as Record<string, unknown>,
  });
  const paymentBody = {
    agent: agent.key,
    quote: {
      amount: BOREAL_X402_FLAT_PRICE_USDC,
      authorizationMessage: quote.authorizationMessage,
      currency: "USDC",
      networkKey: getDefaultSolanaNetworkKey(),
      payerSources: ["openwallet", "agentcash"],
      paymentProtocol: "x402",
      quoteToken: quote.quoteToken,
      requestToken: quote.requestToken,
      seller: getOneRequestSellerMetadata(),
    },
    version: "boreal-agent-registry/v1",
  };
  const challenge = await createBorealX402Challenge({
    memo: quote.paymentReference,
    request: input.request,
    resourceDescription: `${agent.identity.displayName} direct execution`,
    resourcePath: new URL(input.request.url).pathname,
  });

  if (!input.request.headers.has(BOREAL_X402_PAYMENT_SIGNATURE_HEADER)) {
    return createBorealX402RequiredResponse({
      body: paymentBody,
      challenge,
    });
  }

  const paidX402 = await verifyAndSettleBorealX402({
    challenge,
  });
  const settledWalletAddress = paidX402.verification.payer?.trim();
  const settledNetwork = paidX402.settlement.network?.trim();
  const settledTransaction = paidX402.settlement.transaction?.trim();
  const settledPayer = paidX402.settlement.payer?.trim() || settledWalletAddress;

  if (!settledWalletAddress || !settledNetwork || !settledTransaction || !settledPayer) {
    throw new Error("Boreal could not finalize this x402 payment.");
  }

  const result = await agent.directExecution!.invoke({
    payload: body as Record<string, unknown>,
  });

  return attachBorealX402SettlementHeaders(
    NextResponse.json({
      agent: agent.key,
      result,
      version: "boreal-agent-registry/v1",
    }),
    {
      network: settledNetwork,
      payer: settledPayer,
      success: true,
      transaction: settledTransaction,
    },
  );
}

function buildDirectExecutionQuote(input: {
  agentKey: string;
  payload: Record<string, unknown>;
}) {
  const fingerprint = createRequestFingerprint(
    JSON.stringify({
      agentKey: input.agentKey,
      payload: input.payload,
    }),
  );
  const requestToken = `dirreq_${fingerprint.slice(0, 32)}`;
  const quoteToken = `dirquote_${fingerprint.slice(32, 64)}`;
  const paymentReference = buildPaymentReferenceMemo({
    quoteToken,
    requestToken,
  });

  return {
    authorizationMessage: buildPaymentAuthorizationMessage({
      amount: BOREAL_X402_FLAT_PRICE_USDC,
      currency: "USDC",
      quoteToken,
      requestToken,
    }),
    paymentReference,
    quoteToken,
    requestToken,
  };
}
