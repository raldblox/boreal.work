"use client";

import { useMemo } from "react";
import { usePrivy, useWallets, useX402Fetch } from "@privy-io/react-auth";

import { toUsdcMicros } from "@/lib/boreal/integrations/service-providers/payments/x402";
import { getDefaultPrivyWalletAddress } from "@/lib/boreal/integrations/service-providers/wallets/privy";

export function usePayment() {
  const { login, logout, user, ready, authenticated } = usePrivy();
  const { wallets, ready: walletsReady } = useWallets();
  const { wrapFetchWithPayment } = useX402Fetch();
  const defaultWalletAddress = useMemo(
    () => getDefaultPrivyWalletAddress(wallets),
    [wallets],
  );

  return {
    defaultWalletAddress,
    payWithX402: async (input: {
      fetcher?: typeof fetch;
      init?: RequestInit;
      maxAmountUsd?: number | null;
      url: string;
      walletAddress?: string | null;
    }) => {
      const fetchWithPayment = wrapFetchWithPayment({
        fetch: input.fetcher ?? fetch,
        maxValue: toUsdcMicros(input.maxAmountUsd),
        walletAddress: input.walletAddress ?? defaultWalletAddress ?? undefined,
      });

      return fetchWithPayment(input.url, input.init);
    },
    login,
    logout,
    user,
    isReady: ready,
    isAuthenticated: authenticated,
    isWalletReady: walletsReady && Boolean(defaultWalletAddress),
    wallets,
  };
}
