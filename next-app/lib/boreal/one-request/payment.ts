import {
  buildPaymentReferenceMemo,
  verifyPaymentReceipt,
} from "./auth.ts";
import type { OneRequestPaymentReceipt } from "./types.ts";

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
  networkKey: "solana:devnet";
  rpcUrl: string;
  slot: number | null;
  txHash: string;
  verificationMethod: "solana_devnet_memo";
  verifiedAt: number;
  walletAddress: string;
};

const SOLANA_MEMO_PROGRAM_ID = "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr";
const DEFAULT_SOLANA_DEVNET_RPC_URL = "https://api.devnet.solana.com";

export async function verifyOneRequestPayment(input: {
  amount: number;
  authorizationMessage: string;
  currency: string;
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
  const rpcUrl = getSolanaDevnetRpcUrl();
  const transaction = await getConfirmedTransaction({
    rpcUrl,
    txHash,
  });

  if (transaction.meta?.err) {
    throw new Error("Solana devnet transaction failed on chain.");
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

  const confirmationStatus = await getConfirmationStatus({
    rpcUrl,
    txHash,
  });

  if (
    confirmationStatus &&
    !["confirmed", "finalized"].includes(confirmationStatus)
  ) {
    throw new Error(
      `Solana devnet transaction is not confirmed yet (status: ${confirmationStatus}).`,
    );
  }

  return {
    blockTime: transaction.blockTime ?? null,
    confirmationStatus,
    memo: matchedMemo,
    networkKey: "solana:devnet",
    rpcUrl,
    slot: transaction.slot ?? null,
    txHash,
    verificationMethod: "solana_devnet_memo",
    verifiedAt: Date.now(),
    walletAddress: input.walletAddress,
  };
}

function getSolanaDevnetRpcUrl() {
  return process.env.BOREAL_SOLANA_DEVNET_RPC_URL?.trim() || DEFAULT_SOLANA_DEVNET_RPC_URL;
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
    throw new Error("Solana devnet transaction proof could not be found.");
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
    throw new Error("Solana devnet transaction proof failed during signature status verification.");
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
    throw new Error(`Solana devnet RPC returned ${response.status}.`);
  }

  const payload = (await response.json()) as SolanaRpcResponse<T>;

  if (payload.error) {
    throw new Error(`Solana devnet RPC error: ${payload.error.message}`);
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
