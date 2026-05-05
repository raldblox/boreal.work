import "server-only";

import { NextResponse } from "next/server";
import {
  decodePaymentSignatureHeader,
  encodePaymentRequiredHeader,
  encodePaymentResponseHeader,
} from "@x402/core/http";
import { x402ResourceServer } from "@x402/core/server";
import type {
  PaymentPayload,
  PaymentRequirements,
  ResourceInfo,
} from "@x402/core/types";
import { registerExactSvmScheme } from "@x402/svm/exact/server";

import {
  BOREAL_X402_FLAT_PRICE_USDC,
  getBorealX402SupportedSolanaNetworks,
  isBorealX402Enabled,
} from "./config";
import {
  BOREAL_X402_PAYMENT_REQUIRED_HEADER,
  BOREAL_X402_PAYMENT_RESPONSE_HEADER,
  BOREAL_X402_PAYMENT_SIGNATURE_HEADER,
  BOREAL_X402_RESOURCE_VERSION,
} from "./constants";
import { createBorealX402FacilitatorClient } from "./facilitator-client";
import { getOneRequestSellerMetadata } from "../one-request/seller";

let resourceServerPromise: Promise<x402ResourceServer> | null = null;

export type BorealX402Challenge = {
  paymentPayload: PaymentPayload | null;
  paymentRequired: Record<string, unknown>;
  paymentRequirements: PaymentRequirements[];
  resourceInfo: ResourceInfo;
};

export async function getBorealX402ResourceServer() {
  if (!resourceServerPromise) {
    resourceServerPromise = initializeBorealX402ResourceServer().catch((error) => {
      resourceServerPromise = null;
      throw error;
    });
  }

  return resourceServerPromise;
}

export async function createBorealX402Challenge(input: {
  error?: string;
  extra?: Record<string, unknown>;
  memo: string;
  request: Request;
  resourceDescription: string;
  resourcePath: string;
}) {
  if (!isBorealX402Enabled()) {
    throw new Error("Boreal x402 is disabled in this environment.");
  }

  const seller = getOneRequestSellerMetadata();

  if (!seller.payToAddress) {
    throw new Error("Boreal x402 seller pay-to address is not configured.");
  }

  const server = await getBorealX402ResourceServer();
  const payToAddress = seller.payToAddress;
  const candidateNetworks = getBorealX402SupportedSolanaNetworks() as Array<
    `${string}:${string}`
  >;
  const paymentRequirements = await server.buildPaymentRequirementsFromOptions(
    candidateNetworks.map((network) => ({
      extra: {
        memo: input.memo,
        destinationTokenAccountAddress: seller.payToTokenAccountAddress,
        tokenDecimals: seller.payToTokenDecimals,
        tokenProgramAddress: seller.payToTokenProgramAddress,
        ...input.extra,
      },
      network,
      payTo: payToAddress,
      price: `$${BOREAL_X402_FLAT_PRICE_USDC.toFixed(2)}`,
      scheme: "exact",
    })),
    {},
  );
  const resourceInfo: ResourceInfo = {
    description: input.resourceDescription,
    mimeType: "application/json",
    url: new URL(input.resourcePath, input.request.url).toString(),
  };
  const paymentRequired = await server.createPaymentRequiredResponse(
    paymentRequirements,
    resourceInfo,
    input.error ?? "x402 payment required",
  );
  const paymentPayload = parsePaymentPayloadHeader(input.request);

  return {
    paymentPayload,
    paymentRequired,
    paymentRequirements,
    resourceInfo,
  };
}

export async function verifyAndSettleBorealX402(input: {
  challenge: BorealX402Challenge;
}) {
  const server = await getBorealX402ResourceServer();
  const paymentPayload = input.challenge.paymentPayload;

  if (!paymentPayload) {
    throw new Error("Missing standard PAYMENT-SIGNATURE header.");
  }

  const matchingRequirements = server.findMatchingRequirements(
    input.challenge.paymentRequirements,
    paymentPayload,
  );

  if (!matchingRequirements) {
    throw new Error("Submitted x402 payment does not match Boreal's locked quote.");
  }

  const verification = await server.verifyPayment(paymentPayload, matchingRequirements);

  if (!verification.isValid) {
    throw new Error(
      verification.invalidMessage ||
        verification.invalidReason ||
        "x402 payment verification failed.",
    );
  }

  const settlement = await server.settlePayment(paymentPayload, matchingRequirements);

  if (!settlement.success) {
    throw new Error(
      settlement.errorMessage || settlement.errorReason || "x402 settlement failed.",
    );
  }

  return {
    paymentPayload,
    paymentRequirements: matchingRequirements,
    settlement,
    verification,
  };
}

export function createBorealX402RequiredResponse(input: {
  body: Record<string, unknown>;
  challenge: BorealX402Challenge;
  status?: number;
}) {
  return NextResponse.json(input.body, {
    headers: {
      [BOREAL_X402_PAYMENT_REQUIRED_HEADER]: encodePaymentRequiredHeader(
        input.challenge.paymentRequired as never,
      ),
      "X-Boreal-Payment-Protocol": "x402",
      "X-Boreal-Resource-Version": BOREAL_X402_RESOURCE_VERSION,
    },
    status: input.status ?? 402,
  });
}

export function attachBorealX402SettlementHeaders(
  response: NextResponse,
  settlement: Record<string, unknown>,
) {
  response.headers.set(
    BOREAL_X402_PAYMENT_RESPONSE_HEADER,
    encodePaymentResponseHeader(settlement as never),
  );
  response.headers.set("X-Boreal-Payment-Protocol", "x402");
  response.headers.set("X-Boreal-X402-Verified", "true");

  return response;
}

function parsePaymentPayloadHeader(request: Request) {
  const headerValue =
    request.headers.get(BOREAL_X402_PAYMENT_SIGNATURE_HEADER)?.trim() || null;

  if (!headerValue) {
    return null;
  }

  return decodePaymentSignatureHeader(headerValue);
}

async function initializeBorealX402ResourceServer() {
  const server = new x402ResourceServer(createBorealX402FacilitatorClient());
  registerExactSvmScheme(server, {
    networks: getBorealX402SupportedSolanaNetworks() as Array<`${string}:${string}`>,
  });
  await server.initialize();

  return server;
}
