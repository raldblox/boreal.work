import {
  type BorealChainEnvironment,
  type BorealSupportedNetworkKey,
  getBorealChainEnvironment,
  getBorealPrimaryChainFamily,
  inferBorealNetworkSelection,
} from "@/lib/boreal/commerce/networks";

type ConnectedWalletLike = {
  address?: string;
  chainId?: string;
  type?: "ethereum" | "solana";
  walletClientType?: string;
};

export function getDefaultPrivyWallet(
  wallets: ConnectedWalletLike[],
): {
  address: string;
  chainFamily: "evm" | "solana";
  chainId: string | null;
  networkKey: BorealSupportedNetworkKey;
  type: "ethereum" | "solana";
  walletClientType?: string;
} | null {
  const chainEnvironment = getBorealChainEnvironment();
  const primaryFamily = getBorealPrimaryChainFamily();

  const normalizedWallets = wallets
    .filter((wallet): wallet is Required<Pick<ConnectedWalletLike, "address">> & ConnectedWalletLike =>
      Boolean(wallet.address),
    )
    .map((wallet) => {
      const selection = inferBorealNetworkSelection({
        chainFamily:
          wallet.type === "ethereum"
            ? "evm"
            : wallet.type === "solana"
              ? "solana"
              : undefined,
        chainId: wallet.chainId,
        environment: chainEnvironment,
      });

      return {
        address: wallet.address!,
        chainFamily: selection.chainFamily,
        chainId: wallet.chainId ?? null,
        networkKey: selection.networkKey,
        type: wallet.type ?? (selection.chainFamily === "evm" ? "ethereum" : "solana"),
        walletClientType: wallet.walletClientType,
      };
    });

  const preferred =
    normalizedWallets.find(
      (wallet) =>
        wallet.chainFamily === primaryFamily &&
        selectionMatchesEnvironment(wallet.networkKey, chainEnvironment),
    ) ??
    normalizedWallets.find((wallet) => wallet.chainFamily === primaryFamily) ??
    normalizedWallets[0];

  return preferred ?? null;
}

export function getDefaultPrivyWalletAddress(wallets: ConnectedWalletLike[]) {
  return getDefaultPrivyWallet(wallets)?.address ?? null;
}

function selectionMatchesEnvironment(
  networkKey: BorealSupportedNetworkKey,
  environment: BorealChainEnvironment,
) {
  if (networkKey.startsWith("solana:")) {
    return networkKey === `solana:${environment}`;
  }

  if (environment === "mainnet") {
    return networkKey.endsWith(":mainnet");
  }

  if (environment === "testnet") {
    return (
      networkKey.endsWith(":sepolia") ||
      networkKey.endsWith(":amoy") ||
      networkKey.endsWith(":testnet")
    );
  }

  return false;
}
