import {
  getBorealChainEnvironment,
  getBorealNetworkDescriptor,
  getDefaultBorealNetworkKey,
  type BorealChainEnvironment,
  type BorealSupportedNetworkKey,
} from "./commerce/networks.ts";

export type BorealSolanaNetworkKey = Extract<
  BorealSupportedNetworkKey,
  "solana:mainnet" | "solana:testnet"
>;

export type BorealSolanaSettlementMode =
  | "mainnet_quote_locked"
  | "testnet_quote_locked";

const DEFAULT_SOLANA_RPC_URLS: Record<BorealSolanaNetworkKey, string> = {
  "solana:mainnet": "https://api.mainnet-beta.solana.com",
  "solana:testnet": "https://api.testnet.solana.com",
};

export function getDefaultSolanaEnvironment(): BorealChainEnvironment {
  return getBorealChainEnvironment();
}

export function getDefaultSolanaNetworkKey(): BorealSolanaNetworkKey {
  const key = getDefaultBorealNetworkKey({ chainFamily: "solana" });

  if (key === "solana:mainnet" || key === "solana:testnet") {
    return key;
  }

  return "solana:mainnet";
}

export function getDefaultSolanaNetworkLabel() {
  return getBorealNetworkDescriptor(getDefaultSolanaNetworkKey()).label;
}

export function getDefaultSolanaCaip2() {
  return getBorealNetworkDescriptor(getDefaultSolanaNetworkKey()).caip2 as
    | "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp"
    | "solana:4uhcVJyU9pJkvQyS88uRDiswHXSCkY3z";
}

export function getDefaultSolanaSettlementMode(): BorealSolanaSettlementMode {
  switch (getDefaultSolanaNetworkKey()) {
    case "solana:testnet":
      return "testnet_quote_locked";
    case "solana:mainnet":
    default:
      return "mainnet_quote_locked";
  }
}

export function getDefaultSolanaRpcUrl() {
  const networkKey = getDefaultSolanaNetworkKey();

  switch (networkKey) {
    case "solana:testnet":
      return (
        process.env.BOREAL_SOLANA_TESTNET_RPC_URL?.trim() ||
        DEFAULT_SOLANA_RPC_URLS[networkKey]
      );
    case "solana:mainnet":
    default:
      return (
        process.env.BOREAL_SOLANA_MAINNET_RPC_URL?.trim() ||
        DEFAULT_SOLANA_RPC_URLS[networkKey]
      );
  }
}

export function getDefaultSolanaPayToAddress() {
  const networkKey = getDefaultSolanaNetworkKey();

  switch (networkKey) {
    case "solana:testnet":
      return process.env.BOREAL_ONE_REQUEST_PAYTO_SOLANA_TESTNET?.trim() || null;
    case "solana:mainnet":
    default:
      return process.env.BOREAL_ONE_REQUEST_PAYTO_SOLANA_MAINNET?.trim() || null;
  }
}
