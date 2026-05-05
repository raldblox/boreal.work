"use client";

import { Buffer } from "buffer";
import {
  ComputeBudgetProgram,
  Connection,
  PublicKey,
  TransactionInstruction,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";
import type {
  PaymentPayload,
  PaymentRequired,
  PaymentRequirements,
} from "@x402/core/types";
import {
  decodePaymentRequiredHeader,
  encodePaymentSignatureHeader,
} from "@x402/core/http";
import {
  DEFAULT_COMPUTE_UNIT_LIMIT,
  DEFAULT_COMPUTE_UNIT_PRICE_MICROLAMPORTS,
  MAX_MEMO_BYTES,
  MEMO_PROGRAM_ADDRESS,
} from "@x402/svm";

import {
  BOREAL_X402_PAYMENT_REQUIRED_HEADER,
  BOREAL_X402_PAYMENT_RESPONSE_HEADER,
  BOREAL_X402_PAYMENT_SIGNATURE_HEADER,
} from "./constants";
import type { ProviderRouteQuote } from "../provider-routing/types";
import {
  createTransferCheckedInstruction,
  deriveAssociatedTokenAddress,
  getDefaultSolanaUsdcDecimals,
  getDefaultSolanaUsdcMintAddress,
  getDefaultSolanaUsdcTokenProgramAddress,
  toTokenAmountAtomic,
} from "../one-request/solana-usdc";
import {
  getDefaultSolanaCaip2,
  getDefaultSolanaNetworkKey,
} from "../solana-network";

type SolanaWalletProvider = {
  signTransaction: <T extends VersionedTransaction>(transaction: T) => Promise<T>;
};

type PayWithX402Input = {
  connection: Connection;
  fetcher?: typeof fetch;
  init?: RequestInit;
  maxAmountUsd?: number | null;
  url: string;
  walletAddress: string;
  walletProvider: SolanaWalletProvider;
};

const BOREAL_X402_FALLBACK_REQUIREMENT_KEY = "borealX402FallbackRequirement";
const BOREAL_X402_FALLBACK_QUOTE_KEY = "borealX402FallbackQuote";

export type BorealX402FallbackRequirement = {
  asset: string | null;
  destinationTokenAccountAddress: string | null;
  memo: string | null;
  payToAddress: string | null;
  tokenDecimals: number | null;
  tokenProgramAddress: string | null;
};

export async function payWithSolanaX402(input: PayWithX402Input) {
  const fetcher = input.fetcher ?? fetch;
  const firstResponse = await fetcher(input.url, input.init);

  if (firstResponse.status !== 402) {
    return firstResponse;
  }

  const paymentRequired = await readPaymentRequired(firstResponse);
  const selectedRequirement = selectBorealPaymentRequirement(paymentRequired.accepts);
  const body =
    firstResponse.headers.get("content-type")?.includes("application/json")
      ? await safeReadJson(firstResponse.clone())
      : null;
  const maxAmountUsd = input.maxAmountUsd ?? null;

  if (
    maxAmountUsd !== null &&
    body &&
    typeof body === "object" &&
    typeof (body as { session?: { payment?: { amount?: unknown } } }).session?.payment?.amount ===
      "number" &&
    (body as { session: { payment: { amount: number } } }).session.payment.amount >
      maxAmountUsd
  ) {
    throw new Error(
      `Boreal x402 quote exceeds the allowed ${maxAmountUsd.toFixed(2)} USDC cap.`,
    );
  }

  let paymentPayload: PaymentPayload;

  try {
    paymentPayload = await createSolanaExactPaymentPayload({
      connection: input.connection,
      paymentRequired,
      paymentRequirement: selectedRequirement,
      walletAddress: input.walletAddress,
      walletProvider: input.walletProvider,
    });
  } catch (error) {
    throw attachBorealX402FallbackMetadata(error, selectedRequirement, body);
  }
  const paymentHeaders = {
    [BOREAL_X402_PAYMENT_SIGNATURE_HEADER]: encodePaymentSignatureHeader(paymentPayload),
  };
  const retryResponse = await fetcher(input.url, {
    ...input.init,
    headers: {
      ...(input.init?.headers ? normalizeHeaders(input.init.headers) : {}),
      ...paymentHeaders,
    },
  });

  if (retryResponse.status === 402) {
    const payload = await safeReadJson(retryResponse.clone());
    const message =
      payload &&
      typeof payload === "object" &&
      typeof (payload as { error?: unknown }).error === "string"
        ? (payload as { error: string }).error
        : "Boreal x402 payment was rejected by the resource server.";

    throw attachBorealX402FallbackMetadata(
      new Error(message),
      selectedRequirement,
      payload,
    );
  }

  retryResponse.headers.get(BOREAL_X402_PAYMENT_RESPONSE_HEADER);

  return retryResponse;
}

export function getBorealX402FallbackRequirement(error: unknown) {
  if (!error || typeof error !== "object") {
    return null;
  }

  const requirement = (
    error as {
      [BOREAL_X402_FALLBACK_REQUIREMENT_KEY]?: BorealX402FallbackRequirement | null;
    }
  )[BOREAL_X402_FALLBACK_REQUIREMENT_KEY];

  return requirement ?? null;
}

export function getBorealX402FallbackQuote(error: unknown) {
  if (!error || typeof error !== "object") {
    return null;
  }

  const quote = (
    error as {
      [BOREAL_X402_FALLBACK_QUOTE_KEY]?: ProviderRouteQuote | null;
    }
  )[BOREAL_X402_FALLBACK_QUOTE_KEY];

  return quote ?? null;
}

async function readPaymentRequired(response: Response) {
  const headerValue = response.headers.get(BOREAL_X402_PAYMENT_REQUIRED_HEADER)?.trim();

  if (!headerValue) {
    throw new Error("Boreal did not return a standard PAYMENT-REQUIRED header.");
  }

  return decodePaymentRequiredHeader(headerValue);
}

function selectBorealPaymentRequirement(accepts: PaymentRequirements[]) {
  const supportedNetwork = getDefaultSolanaCaip2();

  return (
    accepts.find(
      (requirement) =>
        requirement.scheme === "exact" &&
        requirement.network === supportedNetwork &&
        requirement.asset === getDefaultSolanaUsdcMintAddress(getDefaultSolanaNetworkKey()),
    ) ?? accepts[0]
  );
}

async function createSolanaExactPaymentPayload(input: {
  connection: Connection;
  paymentRequired: PaymentRequired;
  paymentRequirement: PaymentRequirements;
  walletAddress: string;
  walletProvider: SolanaWalletProvider;
}): Promise<PaymentPayload> {
  const feePayer = String(input.paymentRequirement.extra?.feePayer ?? "").trim();

  if (!feePayer) {
    throw new Error("Boreal x402 quote is missing the facilitator fee payer.");
  }

  const memo = String(input.paymentRequirement.extra?.memo ?? "").trim();
  const memoBuffer = Buffer.from(memo, "utf8");

  if (memoBuffer.byteLength > MAX_MEMO_BYTES) {
    throw new Error("Boreal x402 memo exceeds Solana limits.");
  }

  const latestBlockhash = await input.connection.getLatestBlockhash();
  const mintAddress = input.paymentRequirement.asset;
  const tokenProgramAddress =
    String(input.paymentRequirement.extra?.tokenProgramAddress ?? "").trim() ||
    getDefaultSolanaUsdcTokenProgramAddress();
  const decimals =
    typeof input.paymentRequirement.extra?.tokenDecimals === "number"
      ? input.paymentRequirement.extra.tokenDecimals
      : getDefaultSolanaUsdcDecimals();
  const destinationTokenAccountAddress =
    String(input.paymentRequirement.extra?.destinationTokenAccountAddress ?? "").trim() ||
    deriveAssociatedTokenAddress({
      mintAddress,
      ownerAddress: input.paymentRequirement.payTo,
      tokenProgramAddress,
    });
  const sourceTokenAccountAddress = deriveAssociatedTokenAddress({
    mintAddress,
    ownerAddress: input.walletAddress,
    tokenProgramAddress,
  });
  const instructions = [
    ComputeBudgetProgram.setComputeUnitLimit({
      units: DEFAULT_COMPUTE_UNIT_LIMIT,
    }),
    ComputeBudgetProgram.setComputeUnitPrice({
      microLamports: DEFAULT_COMPUTE_UNIT_PRICE_MICROLAMPORTS,
    }),
    createTransferCheckedInstruction({
      amount: Number(
        Number(BigInt(input.paymentRequirement.amount)) /
          Number(BigInt(10 ** decimals)),
      ),
      authorityAddress: input.walletAddress,
      decimals,
      destinationTokenAccountAddress,
      mintAddress,
      sourceTokenAccountAddress,
      tokenProgramAddress,
    }),
    new TransactionInstruction({
      data: memoBuffer,
      keys: [],
      programId: new PublicKey(MEMO_PROGRAM_ADDRESS),
    }),
  ];
  const message = new TransactionMessage({
    instructions,
    payerKey: new PublicKey(feePayer),
    recentBlockhash: latestBlockhash.blockhash,
  }).compileToV0Message();
  const unsignedTransaction = new VersionedTransaction(message);
  const signedTransaction =
    await input.walletProvider.signTransaction(unsignedTransaction);

  return {
    accepted: input.paymentRequirement,
    payload: {
      transaction: Buffer.from(signedTransaction.serialize()).toString("base64"),
    },
    resource: input.paymentRequired.resource,
    x402Version: input.paymentRequired.x402Version,
    ...(input.paymentRequired.extensions
      ? { extensions: input.paymentRequired.extensions }
      : {}),
  };
}

function normalizeHeaders(headers: HeadersInit) {
  if (headers instanceof Headers) {
    return Object.fromEntries(headers.entries());
  }

  if (Array.isArray(headers)) {
    return Object.fromEntries(headers);
  }

  return headers;
}

async function safeReadJson(response: Response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function attachBorealX402FallbackMetadata(
  error: unknown,
  requirement: PaymentRequirements,
  body?: unknown,
) {
  const target =
    error instanceof Error ? error : new Error(String(error ?? "x402 payment failed."));
  (
    target as {
      [BOREAL_X402_FALLBACK_REQUIREMENT_KEY]?: BorealX402FallbackRequirement;
    }
  )[BOREAL_X402_FALLBACK_REQUIREMENT_KEY] =
    buildBorealX402FallbackRequirement(requirement);
  (
    target as {
      [BOREAL_X402_FALLBACK_QUOTE_KEY]?: ProviderRouteQuote | null;
    }
  )[BOREAL_X402_FALLBACK_QUOTE_KEY] = extractFallbackQuote(body);

  return target;
}

function buildBorealX402FallbackRequirement(
  requirement: PaymentRequirements,
): BorealX402FallbackRequirement {
  return {
    asset: typeof requirement.asset === "string" ? requirement.asset.trim() : null,
    destinationTokenAccountAddress:
      typeof requirement.extra?.destinationTokenAccountAddress === "string"
        ? requirement.extra.destinationTokenAccountAddress.trim()
        : null,
    memo:
      typeof requirement.extra?.memo === "string"
        ? requirement.extra.memo.trim()
        : null,
    payToAddress:
      typeof requirement.payTo === "string" ? requirement.payTo.trim() : null,
    tokenDecimals:
      typeof requirement.extra?.tokenDecimals === "number"
        ? requirement.extra.tokenDecimals
        : null,
    tokenProgramAddress:
      typeof requirement.extra?.tokenProgramAddress === "string"
        ? requirement.extra.tokenProgramAddress.trim()
        : null,
  };
}

function extractFallbackQuote(body: unknown): ProviderRouteQuote | null {
  if (!body || typeof body !== "object") {
    return null;
  }

  const workspace = (body as { workspace?: unknown }).workspace;

  if (!workspace || typeof workspace !== "object") {
    return null;
  }

  if ((workspace as { kind?: unknown }).kind !== "provider_selection") {
    return null;
  }

  const selection = (workspace as { selection?: unknown }).selection;

  if (!selection || typeof selection !== "object") {
    return null;
  }

  const options = (selection as { options?: unknown }).options;

  if (!Array.isArray(options)) {
    return null;
  }

  for (const option of options) {
    if (
      option &&
      typeof option === "object" &&
      "quote" in option &&
      option.quote &&
      typeof option.quote === "object"
    ) {
      return option.quote as ProviderRouteQuote;
    }
  }

  return null;
}
