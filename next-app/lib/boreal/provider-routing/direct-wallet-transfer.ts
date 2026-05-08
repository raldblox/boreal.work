"use client";

import { Buffer } from "buffer";
import {
  Connection,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";

import { buildPaymentAuthorizationMessage } from "@/lib/boreal/one-request/payment-authorization";
import {
  formatSolPriceLabel,
  SPECIALIST_FRONTEND_WALLET_SOL_AMOUNT,
} from "@/lib/boreal/one-request/pricing";
import { getSolanaMemoProgramAddress } from "@/lib/boreal/solana-thread-actions";
import type { BorealX402FallbackRequirement } from "@/lib/boreal/x402/client";

import type {
  ProviderRoutePaymentReceipt,
  ProviderRouteQuote,
} from "./types";

type DirectWalletTransferProvider = {
  sendTransaction?: (
    transaction: Transaction,
    connection: Connection,
  ) => Promise<string>;
};

const FACILITATOR_BOOTSTRAP_ERROR_MARKERS = [
  "no supported payment kinds loaded from any facilitator",
  "could not load supported payment kinds from any facilitator",
  "x402 quote is missing the facilitator fee payer",
  "facilitator does not support exact",
  "transaction simulation failed",
  "transaction_simulation_failed",
  "invalid account data for instruction",
];
const SOLANA_TRANSFER_FEE_FALLBACK_LAMPORTS = 5_000;
const DIRECT_WALLET_FALLBACK_SOL_LAMPORTS = Math.round(
  SPECIALIST_FRONTEND_WALLET_SOL_AMOUNT * LAMPORTS_PER_SOL,
);
const SOLANA_EMPTY_SYSTEM_ACCOUNT_RENT_DATA_LEN = 0;
const DIRECT_WALLET_TRANSFER_MAX_ATTEMPTS = 2;

export function isDirectWalletFallbackPaymentFailure(error: unknown) {
  const message =
    error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();

  return FACILITATOR_BOOTSTRAP_ERROR_MARKERS.some((marker) =>
    message.includes(marker),
  );
}

export async function payProviderRouteQuoteByDirectWalletTransfer(input: {
  connection: Connection;
  fallbackRequirement?: BorealX402FallbackRequirement | null;
  quote: ProviderRouteQuote;
  walletAddress: string;
  walletProvider: DirectWalletTransferProvider;
}) {
  if (typeof input.walletProvider.sendTransaction !== "function") {
    throw new Error(
      "Connected wallet does not support direct Solana payment fallback.",
    );
  }

  const payToAddress =
    input.quote.payToAddress?.trim() ||
    input.fallbackRequirement?.payToAddress?.trim() ||
    null;

  if (!payToAddress) {
    throw new Error(
      "This locked route and x402 challenge are both missing the Solana destination address needed for direct wallet fallback.",
    );
  }

  const authorizationMessage = buildPaymentAuthorizationMessage({
    amount: SPECIALIST_FRONTEND_WALLET_SOL_AMOUNT,
    currency: "SOL",
    quoteToken: input.quote.quoteToken,
    requestToken: input.quote.requestToken,
  });
  const destinationAccountPublicKey = new PublicKey(payToAddress);
  const [payerBalanceLamports, rentExemptMinimumLamports, destinationAccount] = await Promise.all([
    input.connection.getBalance(new PublicKey(input.walletAddress), "confirmed"),
    input.connection.getMinimumBalanceForRentExemption(
      SOLANA_EMPTY_SYSTEM_ACCOUNT_RENT_DATA_LEN,
    ),
    input.connection.getAccountInfo(destinationAccountPublicKey, "confirmed"),
  ]);

  if (
    !destinationAccount &&
    DIRECT_WALLET_FALLBACK_SOL_LAMPORTS < rentExemptMinimumLamports
  ) {
    throw new Error(
      `Boreal's pay-to wallet ${payToAddress} is not activated onchain yet. A first incoming transfer must fund at least ${formatLamportsAsSol(
        rentExemptMinimumLamports,
      )} SOL, so the 0.0001 SOL fallback cannot land there yet.`,
    );
  }

  for (let attempt = 0; attempt < DIRECT_WALLET_TRANSFER_MAX_ATTEMPTS; attempt += 1) {
    const latestBlockhash = await input.connection.getLatestBlockhash("confirmed");
    const transaction = buildDirectWalletFallbackTransaction({
      blockhash: latestBlockhash.blockhash,
      destinationAccountPublicKey,
      paymentReference: input.quote.paymentReference,
      walletAddress: input.walletAddress,
    });
    const feeResponse = await input.connection.getFeeForMessage(
      transaction.compileMessage(),
      "confirmed",
    );
    const estimatedFeeLamports = Math.max(
      feeResponse.value ?? SOLANA_TRANSFER_FEE_FALLBACK_LAMPORTS,
      SOLANA_TRANSFER_FEE_FALLBACK_LAMPORTS,
    );
    const insufficientFundsMessage = buildDirectWalletFallbackBalanceError({
      balanceLamports: payerBalanceLamports,
      estimatedFeeLamports,
      rentExemptMinimumLamports,
    });

    if (insufficientFundsMessage) {
      throw new Error(insufficientFundsMessage);
    }

    let txHash: string;

    try {
      txHash = await input.walletProvider.sendTransaction(
        transaction,
        input.connection,
      );
    } catch (error) {
      throw await normalizeDirectWalletTransferError(input.connection, error, {
        estimatedFeeLamports,
        walletAddress: input.walletAddress,
      });
    }

    const confirmationResult = await confirmDirectWalletTransfer({
      connection: input.connection,
      latestBlockhash,
      txHash,
    });

    if (confirmationResult === "confirmed") {
      return {
        amount: SPECIALIST_FRONTEND_WALLET_SOL_AMOUNT,
        currency: "SOL",
        networkKey: input.quote.networkKey,
        payerSource: "openwallet" as const,
        quoteToken: input.quote.quoteToken,
        requestToken: input.quote.requestToken,
        signature: "transaction-only",
        signedMessage: authorizationMessage,
        txHash,
        walletAddress: input.walletAddress,
      } satisfies ProviderRoutePaymentReceipt;
    }

    if (attempt + 1 < DIRECT_WALLET_TRANSFER_MAX_ATTEMPTS) {
      continue;
    }

    throw new Error(
      "The signed Solana transfer expired before it landed. Click Sign payment and start again. Boreal will reuse this same work thread.",
    );
  }

  throw new Error("Direct Solana wallet fallback could not be completed.");
}

function buildDirectWalletFallbackTransaction(input: {
  blockhash: string;
  destinationAccountPublicKey: PublicKey;
  paymentReference: string;
  walletAddress: string;
}) {
  const transaction = new Transaction({
    feePayer: new PublicKey(input.walletAddress),
    recentBlockhash: input.blockhash,
  });

  transaction.add(
    SystemProgram.transfer({
      fromPubkey: new PublicKey(input.walletAddress),
      lamports: DIRECT_WALLET_FALLBACK_SOL_LAMPORTS,
      toPubkey: input.destinationAccountPublicKey,
    }),
  );
  transaction.add(
    new TransactionInstruction({
      data: Buffer.from(new TextEncoder().encode(input.paymentReference)),
      keys: [],
      programId: new PublicKey(getSolanaMemoProgramAddress()),
    }),
  );

  return transaction;
}

async function waitForTransactionVisibility(
  connection: Connection,
  txHash: string,
) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const transaction = await connection.getTransaction(txHash, {
      commitment: "confirmed",
      maxSupportedTransactionVersion: 0,
    });

    if (transaction) {
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, 750));
  }
}

async function confirmDirectWalletTransfer(input: {
  connection: Connection;
  latestBlockhash: {
    blockhash: string;
    lastValidBlockHeight: number;
  };
  txHash: string;
}) {
  try {
    const confirmation = await input.connection.confirmTransaction(
      {
        ...input.latestBlockhash,
        signature: input.txHash,
      },
      "confirmed",
    );

    if (confirmation.value.err) {
      throw new Error("Direct Solana wallet fallback failed on chain.");
    }

    await waitForTransactionVisibility(input.connection, input.txHash);
    return "confirmed" as const;
  } catch (error) {
    if (!isExpiredBlockhashError(error)) {
      throw error;
    }

    const landed = await didTransactionLand(input.connection, input.txHash);

    return landed ? ("confirmed" as const) : ("expired" as const);
  }
}

async function normalizeDirectWalletTransferError(
  connection: Connection,
  error: unknown,
  input: {
    estimatedFeeLamports: number;
    walletAddress: string;
  },
) {
  const baseError =
    error instanceof Error
      ? error
      : new Error(String(error ?? "Direct Solana wallet fallback failed."));
  const rawMessage = baseError.message.toLowerCase();
  const logs = await readSolanaSendErrorLogs(connection, error);
  const normalizedLogs = logs.join("\n").toLowerCase();
  const combined = `${rawMessage}\n${normalizedLogs}`;

  if (combined.includes("insufficient funds")) {
    const [balanceLamports, rentExemptMinimumLamports] = await Promise.all([
      connection.getBalance(new PublicKey(input.walletAddress), "confirmed"),
      connection.getMinimumBalanceForRentExemption(
        SOLANA_EMPTY_SYSTEM_ACCOUNT_RENT_DATA_LEN,
      ),
    ]);

    return new Error(
      buildDirectWalletFallbackBalanceError({
        balanceLamports,
        estimatedFeeLamports: input.estimatedFeeLamports,
        rentExemptMinimumLamports,
      }) ??
        "Connected wallet does not have enough SOL to complete Boreal's 0.0001 SOL fallback payment.",
    );
  }

  if (logs.length > 0) {
    return new Error(logs[logs.length - 1] ?? baseError.message);
  }

  return baseError;
}

async function didTransactionLand(connection: Connection, txHash: string) {
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const [transaction, signatureStatuses] = await Promise.all([
      connection.getTransaction(txHash, {
        commitment: "confirmed",
        maxSupportedTransactionVersion: 0,
      }),
      connection.getSignatureStatuses([txHash], {
        searchTransactionHistory: true,
      }),
    ]);
    const status = signatureStatuses.value[0];

    if (
      transaction ||
      (status &&
        !status.err &&
        (status.confirmationStatus === "confirmed" ||
          status.confirmationStatus === "finalized"))
    ) {
      return true;
    }

    await new Promise((resolve) => setTimeout(resolve, 600));
  }

  return false;
}

function buildDirectWalletFallbackBalanceError(input: {
  balanceLamports: number;
  estimatedFeeLamports: number;
  rentExemptMinimumLamports: number;
}) {
  const transferAndFeesLamports =
    DIRECT_WALLET_FALLBACK_SOL_LAMPORTS + input.estimatedFeeLamports;

  if (input.balanceLamports < transferAndFeesLamports) {
    return `Connected wallet has ${formatLamportsAsSol(
      input.balanceLamports,
    )} SOL, but Boreal needs about ${formatLamportsAsSol(
      transferAndFeesLamports,
    )} SOL to cover the 0.0001 SOL fallback payment and network fees.`;
  }

  const postBalanceLamports = input.balanceLamports - transferAndFeesLamports;

  if (
    postBalanceLamports !== 0 &&
    postBalanceLamports < input.rentExemptMinimumLamports
  ) {
    return `Connected wallet has ${formatLamportsAsSol(
      input.balanceLamports,
    )} SOL. After sending 0.0001 SOL and fees, the fee payer would drop below Solana's rent-exempt minimum of ${formatLamportsAsSol(
      input.rentExemptMinimumLamports,
    )} SOL, so this fallback needs about ${formatLamportsAsSol(
      transferAndFeesLamports + input.rentExemptMinimumLamports,
    )} SOL total.`;
  }

  return null;
}

function formatLamportsAsSol(lamports: number) {
  return formatSolPriceLabel(lamports / LAMPORTS_PER_SOL);
}

function isExpiredBlockhashError(error: unknown) {
  const message =
    error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();

  return (
    message.includes("block height exceeded") ||
    message.includes("signature") && message.includes("has expired") ||
    message.includes("blockhash not found") ||
    message.includes("transaction expired")
  );
}

async function readSolanaSendErrorLogs(
  connection: Connection,
  error: unknown,
) {
  if (
    !error ||
    typeof error !== "object" ||
    !("getLogs" in error) ||
    typeof error.getLogs !== "function"
  ) {
    return [];
  }

  try {
    const logs = await error.getLogs(connection);

    return Array.isArray(logs)
      ? logs.filter((value): value is string => typeof value === "string")
      : [];
  } catch {
    return [];
  }
}
