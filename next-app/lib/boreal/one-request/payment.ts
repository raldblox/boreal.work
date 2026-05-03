import {
  buildPaymentReferenceMemo,
  verifyPaymentReceipt,
} from "./auth.ts";
import type { OneRequestPaymentReceipt } from "./types.ts";
import {
  getDefaultSolanaNetworkKey,
  getDefaultSolanaRpcUrl,
  type BorealSolanaNetworkKey,
} from "../solana-network.ts";
import { toTokenAmountAtomic } from "./solana-usdc.ts";

type SolanaRpcResponse<T> = {
  error?: {
    code: number;
    message: string;
  };
  result: T;
};

type SolanaParsedAccountKey =
  | string
  | {
      pubkey?: string;
      signer?: boolean;
      writable?: boolean;
    };

type SolanaInstruction = {
  data?: string;
  parsed?: unknown;
  program?: string;
  programId?: string;
};

type SolanaTransaction = {
  blockTime?: number | null;
  meta?: {
    err?: unknown;
    logMessages?: string[] | null;
    postTokenBalances?: SolanaTokenBalance[] | null;
    preTokenBalances?: SolanaTokenBalance[] | null;
  } | null;
  slot?: number;
  transaction?: {
    message?: {
      accountKeys?: SolanaParsedAccountKey[];
      instructions?: SolanaInstruction[];
    };
    signatures?: string[];
  } | null;
};

type SolanaTokenBalance = {
  accountIndex?: number;
  mint?: string;
  owner?: string;
  programId?: string;
  uiTokenAmount?: {
    amount?: string;
    decimals?: number;
    uiAmount?: number | null;
    uiAmountString?: string;
  } | null;
};

type SolanaSignatureStatus = {
  confirmationStatus?: string | null;
  confirmations?: number | null;
  err?: unknown;
  slot?: number;
};

export type OneRequestPaymentVerification = {
  blockTime: number | null;
  confirmationStatus: string | null;
  memo: string;
  networkKey: BorealSolanaNetworkKey;
  payToAddress: string | null;
  payToAsset: string | null;
  payToMintAddress: string | null;
  payToTokenAccountAddress: string | null;
  rpcUrl: string;
  slot: number | null;
  txHash: string;
  verificationMethod:
    | "solana_memo"
    | "solana_memo_payto"
    | "solana_usdc_memo_payto";
  verifiedAt: number;
  walletAddress: string;
};

const SOLANA_MEMO_PROGRAM_ID = "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr";

export async function verifyOneRequestPayment(input: {
  amount: number;
  authorizationMessage: string;
  currency: string;
  payToAsset?: string | null;
  payToAddress?: string | null;
  payToMintAddress?: string | null;
  payToTokenAccountAddress?: string | null;
  payToTokenDecimals?: number | null;
  payToTokenProgramAddress?: string | null;
  quoteExpiresAt: number;
  quoteToken: string;
  receipt: OneRequestPaymentReceipt;
  requestToken: string;
  walletAddress: string;
}): Promise<OneRequestPaymentVerification> {
  if (input.quoteExpiresAt <= Date.now()) {
    throw new Error("Locked quote expired. Request a fresh quote before paying.");
  }

  verifyPaymentReceipt({
    amount: input.amount,
    authorizationMessage: input.authorizationMessage,
    currency: input.currency,
    quoteToken: input.quoteToken,
    receipt: input.receipt,
    requestToken: input.requestToken,
    walletAddress: input.walletAddress,
  });

  const txHash = input.receipt.txHash.trim();
  const paymentReference = buildPaymentReferenceMemo({
    quoteToken: input.quoteToken,
    requestToken: input.requestToken,
  });
  const networkKey = getDefaultSolanaNetworkKey();
  const rpcUrl = getDefaultSolanaRpcUrl();
  const transaction = await getConfirmedTransaction({
    rpcUrl,
    txHash,
  });

  if (transaction.meta?.err) {
    throw new Error("Solana transaction failed on chain.");
  }

  const signatures = transaction.transaction?.signatures ?? [];

  if (!signatures.includes(txHash)) {
    throw new Error("Transaction hash does not match the submitted Solana transaction proof.");
  }

  const signerMatched = (transaction.transaction?.message?.accountKeys ?? []).some(
    (accountKey, index) => {
      if (typeof accountKey === "string") {
        return accountKey === input.walletAddress && index === 0;
      }

      return accountKey.pubkey === input.walletAddress && Boolean(accountKey.signer);
    },
  );

  if (!signerMatched) {
    throw new Error("Verified Solana transaction is not signed by the authenticated wallet.");
  }

  const memos = extractMemoStrings(transaction);
  const matchedMemo = memos.find((memo) => memo.includes(paymentReference));

  if (!matchedMemo) {
    throw new Error("Verified Solana transaction is missing Boreal's payment reference memo.");
  }

  const payToAddress = input.payToAddress?.trim() || null;
  const payToAsset = input.payToAsset?.trim() || null;
  const payToMintAddress = input.payToMintAddress?.trim() || null;
  const payToTokenAccountAddress =
    input.payToTokenAccountAddress?.trim() || null;
  const payToTokenProgramAddress =
    input.payToTokenProgramAddress?.trim() || null;
  const payToTokenDecimals =
    typeof input.payToTokenDecimals === "number"
      ? input.payToTokenDecimals
      : null;

  if (
    payToAddress &&
    payToAsset === "USDC" &&
    payToMintAddress &&
    payToTokenAccountAddress &&
    payToTokenDecimals !== null
  ) {
    verifySplTokenPayment({
      amount: input.amount,
      destinationTokenAccountAddress: payToTokenAccountAddress,
      ownerAddress: payToAddress,
      payToMintAddress,
      payToTokenDecimals,
      payToTokenProgramAddress,
      transaction,
    });
  } else if (payToAddress && !transactionMentionsAddress(transaction, payToAddress)) {
    throw new Error("Verified Solana transaction is not linked to Boreal's configured pay-to address.");
  }

  const confirmationStatus = await getConfirmationStatus({
    rpcUrl,
    txHash,
  });

  if (
    confirmationStatus &&
    !["confirmed", "finalized"].includes(confirmationStatus)
  ) {
    throw new Error(
      `Solana transaction is not confirmed yet (status: ${confirmationStatus}).`,
    );
  }

  return {
    blockTime: transaction.blockTime ?? null,
    confirmationStatus,
    memo: matchedMemo,
    networkKey,
    payToAddress,
    payToAsset,
    payToMintAddress,
    payToTokenAccountAddress,
    rpcUrl,
    slot: transaction.slot ?? null,
    txHash,
    verificationMethod:
      payToAddress &&
      payToAsset === "USDC" &&
      payToMintAddress &&
      payToTokenAccountAddress
        ? "solana_usdc_memo_payto"
        : payToAddress
          ? "solana_memo_payto"
          : "solana_memo",
    verifiedAt: Date.now(),
    walletAddress: input.walletAddress,
  };
}

async function getConfirmedTransaction(input: {
  rpcUrl: string;
  txHash: string;
}) {
  const result = await callSolanaRpc<SolanaTransaction | null>({
    method: "getTransaction",
    params: [
      input.txHash,
      {
        commitment: "confirmed",
        encoding: "jsonParsed",
        maxSupportedTransactionVersion: 0,
      },
    ],
    rpcUrl: input.rpcUrl,
  });

  if (!result) {
    throw new Error("Solana transaction proof could not be found.");
  }

  return result;
}

async function getConfirmationStatus(input: {
  rpcUrl: string;
  txHash: string;
}) {
  const result = await callSolanaRpc<{ value?: Array<SolanaSignatureStatus | null> }>({
    method: "getSignatureStatuses",
    params: [[input.txHash], { searchTransactionHistory: true }],
    rpcUrl: input.rpcUrl,
  });
  const status = result.value?.[0];

  if (!status) {
    return null;
  }

  if (status.err) {
    throw new Error("Solana transaction proof failed during signature status verification.");
  }

  return status.confirmationStatus ?? null;
}

async function callSolanaRpc<T>(input: {
  method: string;
  params: unknown[];
  rpcUrl: string;
}) {
  const response = await fetch(input.rpcUrl, {
    body: JSON.stringify({
      id: 1,
      jsonrpc: "2.0",
      method: input.method,
      params: input.params,
    }),
    headers: {
      "content-type": "application/json",
    },
    method: "POST",
  });

  if (!response.ok) {
    throw new Error(`Solana RPC returned ${response.status}.`);
  }

  const payload = (await response.json()) as SolanaRpcResponse<T>;

  if (payload.error) {
    throw new Error(`Solana RPC error: ${payload.error.message}`);
  }

  return payload.result;
}

function extractMemoStrings(transaction: SolanaTransaction) {
  const memos = new Set<string>();
  const instructions = transaction.transaction?.message?.instructions ?? [];

  for (const instruction of instructions) {
    if (
      instruction.programId === SOLANA_MEMO_PROGRAM_ID ||
      instruction.program?.toLowerCase().includes("memo")
    ) {
      collectInstructionStrings(instruction).forEach((value) => memos.add(value));
    }
  }

  for (const logMessage of transaction.meta?.logMessages ?? []) {
    const match = logMessage.match(/Memo(?: \(len \d+\))?:\s*(.+)$/i);

    if (match?.[1]) {
      memos.add(match[1].trim());
    }
  }

  return [...memos];
}

function transactionMentionsAddress(
  transaction: SolanaTransaction,
  address: string,
) {
  const normalizedAddress = address.trim();

  if (!normalizedAddress) {
    return false;
  }

  const accountKeyMatch = (transaction.transaction?.message?.accountKeys ?? []).some(
    (accountKey) =>
      typeof accountKey === "string"
        ? accountKey === normalizedAddress
        : accountKey.pubkey === normalizedAddress,
  );

  if (accountKeyMatch) {
    return true;
  }

  const instructionMatch = (transaction.transaction?.message?.instructions ?? []).some(
    (instruction) =>
      collectInstructionStrings(instruction).some(
        (value) => value === normalizedAddress || value.includes(normalizedAddress),
      ),
  );

  if (instructionMatch) {
    return true;
  }

  return (transaction.meta?.logMessages ?? []).some((logMessage) =>
    logMessage.includes(normalizedAddress),
  );
}

function verifySplTokenPayment(input: {
  amount: number;
  destinationTokenAccountAddress: string;
  ownerAddress: string;
  payToMintAddress: string;
  payToTokenDecimals: number;
  payToTokenProgramAddress: string | null;
  transaction: SolanaTransaction;
}) {
  const destinationAccountIndex = findTransactionAccountIndex(
    input.transaction,
    input.destinationTokenAccountAddress,
  );

  if (destinationAccountIndex === null) {
    throw new Error("Verified Solana transaction is missing Boreal's USDC destination account.");
  }

  const postBalance = findTokenBalanceByAccountIndex(
    input.transaction.meta?.postTokenBalances ?? [],
    destinationAccountIndex,
    input.payToMintAddress,
  );

  if (!postBalance) {
    throw new Error("Verified Solana transaction is missing the USDC destination balance update.");
  }

  if (
    postBalance.owner &&
    postBalance.owner !== input.ownerAddress
  ) {
    throw new Error("Verified Solana transaction targets the wrong USDC owner.");
  }

  if (
    input.payToTokenProgramAddress &&
    postBalance.programId &&
    postBalance.programId !== input.payToTokenProgramAddress
  ) {
    throw new Error("Verified Solana transaction uses the wrong USDC token program.");
  }

  if (
    typeof postBalance.uiTokenAmount?.decimals === "number" &&
    postBalance.uiTokenAmount.decimals !== input.payToTokenDecimals
  ) {
    throw new Error("Verified Solana transaction reported the wrong USDC decimals.");
  }

  const preBalance = findTokenBalanceByAccountIndex(
    input.transaction.meta?.preTokenBalances ?? [],
    destinationAccountIndex,
    input.payToMintAddress,
  );
  const expectedAmount = toTokenAmountAtomic(
    input.amount,
    input.payToTokenDecimals,
  );
  const receivedAmount =
    readTokenAmount(postBalance) - readTokenAmount(preBalance);

  if (receivedAmount !== expectedAmount) {
    throw new Error("Verified Solana transaction amount does not match Boreal's locked USDC quote.");
  }
}

function findTransactionAccountIndex(
  transaction: SolanaTransaction,
  address: string,
) {
  const normalizedAddress = address.trim();

  if (!normalizedAddress) {
    return null;
  }

  const accountKeys = transaction.transaction?.message?.accountKeys ?? [];

  for (const [index, accountKey] of accountKeys.entries()) {
    if (
      (typeof accountKey === "string" && accountKey === normalizedAddress) ||
      (typeof accountKey === "object" && accountKey.pubkey === normalizedAddress)
    ) {
      return index;
    }
  }

  return null;
}

function findTokenBalanceByAccountIndex(
  balances: SolanaTokenBalance[],
  accountIndex: number,
  mintAddress: string,
) {
  return (
    balances.find(
      (balance) =>
        balance.accountIndex === accountIndex &&
        balance.mint === mintAddress,
    ) ?? null
  );
}

function readTokenAmount(balance: SolanaTokenBalance | null) {
  const amount = balance?.uiTokenAmount?.amount;

  if (typeof amount !== "string" || !/^\d+$/.test(amount)) {
    return BigInt(0);
  }

  return BigInt(amount);
}

function collectInstructionStrings(value: unknown): string[] {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed ? [trimmed] : [];
  }

  if (Array.isArray(value)) {
    return value.flatMap((entry) => collectInstructionStrings(entry));
  }

  if (value && typeof value === "object") {
    return Object.values(value).flatMap((entry) => collectInstructionStrings(entry));
  }

  return [];
}
