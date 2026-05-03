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
import type { Connection } from "@reown/appkit-utils/solana";

import {
  buildNormalizedReownSolanaWallet,
} from "@/lib/boreal/integrations/service-providers/wallets/reown";
import { payWithSolanaX402 } from "@/lib/boreal/x402/client";

const reownProjectId = process.env.NEXT_PUBLIC_REOWN_PROJECT_ID ?? "";

export function usePayment() {
  if (!reownProjectId) {
    return {
      connectedWallets: [],
      defaultWallet: null,
      defaultWalletAddress: null,
      disconnectWallet: async () => undefined,
      isAuthenticated: false,
      isReady: false,
      isWalletConnected: false,
      isWalletConnecting: false,
      isWalletReady: false,
      openWalletModal: async () => undefined,
      payWithX402: async (_input: {
        connection?: Connection | null;
        fetcher?: typeof fetch;
        init?: RequestInit;
        maxAmountUsd?: number | null;
        url: string;
        walletAddress?: string | null;
      }): Promise<Response> => {
        throw new Error(
          "Reown wallet is not configured in this environment. Set NEXT_PUBLIC_REOWN_PROJECT_ID before using wallet flows."
        );
      },
      solanaConnection: null,
      walletConnectionStatus: "disconnected" as const,
      walletProvider: null,
    };
  }

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
      connection?: Connection | null
      fetcher?: typeof fetch;
      init?: RequestInit;
      maxAmountUsd?: number | null;
      url: string;
      walletAddress?: string | null;
    }): Promise<Response> => {
      const connection = _input.connection ?? solanaConnection ?? null
      const payerWalletAddress = _input.walletAddress ?? defaultWalletAddress

      if (!connection) {
        throw new Error(
          "Solana connection is not ready yet. Wait a moment, then try the x402 payment again."
        )
      }

      if (!payerWalletAddress || !walletProvider) {
        throw new Error(
          "Connect a Solana wallet before paying with x402."
        )
      }

      return payWithSolanaX402({
        connection,
        fetcher: _input.fetcher,
        init: _input.init,
        maxAmountUsd: _input.maxAmountUsd ?? null,
        url: _input.url,
        walletAddress: payerWalletAddress,
        walletProvider,
      })
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
