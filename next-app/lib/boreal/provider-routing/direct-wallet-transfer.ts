"use client";

import { Buffer } from "buffer";
import {
  Connection,
  PublicKey,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";

import {
  createTransferCheckedInstruction,
  deriveAssociatedTokenAddress,
  getDefaultSolanaUsdcTokenProgramAddress,
} from "@/lib/boreal/one-request/solana-usdc";
import { encodeBase58, getSolanaMemoProgramAddress } from "@/lib/boreal/solana-thread-actions";

import type {
  ProviderRoutePaymentReceipt,
  ProviderRouteQuote,
} from "./types";

type DirectWalletTransferProvider = {
  sendTransaction?: (
    transaction: Transaction,
    connection: Connection,
  ) => Promise<string>;
  signMessage?: (message: Uint8Array) => Promise<Uint8Array>;
};

const FACILITATOR_BOOTSTRAP_ERROR_MARKERS = [
  "no supported payment kinds loaded from any facilitator",
  "could not load supported payment kinds from any facilitator",
  "x402 quote is missing the facilitator fee payer",
  "facilitator does not support exact",
];

export function isFacilitatorBootstrapFailure(error: unknown) {
  const message =
    error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();

  return FACILITATOR_BOOTSTRAP_ERROR_MARKERS.some((marker) =>
    message.includes(marker),
  );
}

export async function payProviderRouteQuoteByDirectWalletTransfer(input: {
  connection: Connection;
  quote: ProviderRouteQuote;
  walletAddress: string;
  walletProvider: DirectWalletTransferProvider;
}) {
  const signMessage = input.walletProvider.signMessage;
  const sendTransaction = input.walletProvider.sendTransaction;

  if (typeof signMessage !== "function" || typeof sendTransaction !== "function") {
    throw new Error(
      "Connected wallet does not support direct Solana payment fallback.",
    );
  }

  const payToAddress = input.quote.payToAddress?.trim() || null;
  const mintAddress = input.quote.payToMintAddress?.trim() || null;
  const tokenProgramAddress =
    input.quote.payToTokenProgramAddress?.trim() ||
    getDefaultSolanaUsdcTokenProgramAddress();
  const decimals = input.quote.payToTokenDecimals;

  if (!payToAddress || !mintAddress || typeof decimals !== "number") {
    throw new Error(
      "This locked route is missing the USDC destination metadata needed for direct wallet fallback.",
    );
  }

  const destinationTokenAccountAddress =
    input.quote.payToTokenAccountAddress?.trim() ||
    deriveAssociatedTokenAddress({
      mintAddress,
      ownerAddress: payToAddress,
      tokenProgramAddress,
    });
  const sourceTokenAccountAddress = deriveAssociatedTokenAddress({
    mintAddress,
    ownerAddress: input.walletAddress,
    tokenProgramAddress,
  });
  const signatureBytes = await signMessage(
    new TextEncoder().encode(input.quote.authorizationMessage),
  );
  const signature = encodeBase58(signatureBytes);
  const latestBlockhash = await input.connection.getLatestBlockhash("confirmed");
  const transaction = new Transaction({
    feePayer: new PublicKey(input.walletAddress),
    recentBlockhash: latestBlockhash.blockhash,
  });

  transaction.add(
    createTransferCheckedInstruction({
      amount: input.quote.amount,
      authorityAddress: input.walletAddress,
      decimals,
      destinationTokenAccountAddress,
      mintAddress,
      sourceTokenAccountAddress,
      tokenProgramAddress,
    }),
    new TransactionInstruction({
      data: Buffer.from(new TextEncoder().encode(input.quote.paymentReference)),
      keys: [],
      programId: new PublicKey(getSolanaMemoProgramAddress()),
    }),
  );

  const txHash = await sendTransaction(transaction, input.connection);
  const confirmation = await input.connection.confirmTransaction(
    {
      ...latestBlockhash,
      signature: txHash,
    },
    "confirmed",
  );

  if (confirmation.value.err) {
    throw new Error("Direct Solana wallet fallback failed on chain.");
  }

  await waitForTransactionVisibility(input.connection, txHash);

  return {
    amount: input.quote.amount,
    currency: input.quote.currency,
    networkKey: input.quote.networkKey,
    payerSource: "openwallet" as const,
    quoteToken: input.quote.quoteToken,
    requestToken: input.quote.requestToken,
    signature,
    signedMessage: input.quote.authorizationMessage,
    txHash,
    walletAddress: input.walletAddress,
  } satisfies ProviderRoutePaymentReceipt;
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
