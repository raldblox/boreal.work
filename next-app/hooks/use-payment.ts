"use client";

import { useMemo } from "react";
import {
  useAppKit,
  useAppKitAccount,
  useAppKitProvider,
  useAppKitState,
  useDisconnect,
  useWalletInfo,
} from "@reown/appkit/react";
import {
  type Provider as SolanaWalletProvider,
  useAppKitConnection,
} from "@reown/appkit-adapter-solana/react";

import {
  buildNormalizedReownSolanaWallet,
} from "@/lib/boreal/integrations/service-providers/wallets/reown";

export function usePayment() {
  const { open } = useAppKit();
  const { disconnect } = useDisconnect();
  const { address, isConnected, status } = useAppKitAccount({
    namespace: "solana",
  });
  const { walletInfo } = useWalletInfo("solana");
  const { walletProvider } = useAppKitProvider<SolanaWalletProvider>("solana");
  const { connection: solanaConnection } = useAppKitConnection();
  const { initialized, loading } = useAppKitState();
  const defaultWallet = useMemo(
    () =>
      buildNormalizedReownSolanaWallet({
        address,
        providerLabel: walletInfo?.name ?? null,
      }),
    [address, walletInfo?.name],
  );
  const connectedWallets = defaultWallet ? [defaultWallet] : [];
  const defaultWalletAddress = defaultWallet?.address ?? null;

  return {
    connectedWallets,
    defaultWallet,
    defaultWalletAddress,
    disconnectWallet: async () => disconnect({ namespace: "solana" }),
    isAuthenticated: isConnected,
    isReady: initialized && !loading,
    isWalletConnected: Boolean(isConnected && defaultWalletAddress),
    isWalletConnecting:
      loading || status === "connecting" || status === "reconnecting",
    payWithX402: async (_input: {
      fetcher?: typeof fetch;
      init?: RequestInit;
      maxAmountUsd?: number | null;
      url: string;
      walletAddress?: string | null;
    }): Promise<Response> => {
      throw new Error(
        "Automatic x402 payment is not migrated to Reown yet. Use the connected Solana wallet for request-thread actions while Boreal finishes the provider-payment bridge."
      );
    },
    openWalletModal: () =>
      open({
        namespace: "solana",
        view: defaultWalletAddress ? "Account" : "Connect",
      }),
    solanaConnection,
    walletConnectionStatus: status,
    walletProvider,
    isWalletReady: Boolean(isConnected && defaultWalletAddress && walletProvider),
  };
}
