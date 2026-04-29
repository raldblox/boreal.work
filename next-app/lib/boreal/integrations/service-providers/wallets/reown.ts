import {
  type BorealSupportedNetworkKey,
  getBorealChainEnvironment,
} from "@/lib/boreal/commerce/networks";

export type NormalizedConnectedWallet = {
  address: string;
  chainFamily: "solana";
  chainId: null;
  networkKey: BorealSupportedNetworkKey;
  providerLabel?: string | null;
  type: "solana";
};

export function buildNormalizedReownSolanaWallet(input: {
  address?: string | null;
  providerLabel?: string | null;
}): NormalizedConnectedWallet | null {
  const normalizedAddress = input.address?.trim() ?? "";

  if (!looksLikeSolanaAddress(normalizedAddress)) {
    return null;
  }

  return {
    address: normalizedAddress,
    chainFamily: "solana",
    chainId: null,
    networkKey: `solana:${getBorealChainEnvironment()}`,
    providerLabel: input.providerLabel ?? null,
    type: "solana",
  };
}

function looksLikeSolanaAddress(address: string) {
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
}
