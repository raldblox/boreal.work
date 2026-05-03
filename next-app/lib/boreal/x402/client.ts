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

  const paymentPayload = await createSolanaExactPaymentPayload({
    connection: input.connection,
    paymentRequired,
    paymentRequirement: selectedRequirement,
    walletAddress: input.walletAddress,
    walletProvider: input.walletProvider,
  });
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
    throw new Error("Boreal x402 payment was rejected by the resource server.");
  }

  retryResponse.headers.get(BOREAL_X402_PAYMENT_RESPONSE_HEADER);

  return retryResponse;
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
