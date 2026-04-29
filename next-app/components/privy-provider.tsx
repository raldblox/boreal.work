"use client";

import type { ReactNode } from "react";
import { PrivyProvider as PrivyReactProvider } from "@privy-io/react-auth";

import { borealPrivyConfig } from "@/lib/boreal/integrations/service-providers/wallets/privy-modal";

const privyAppId = process.env.NEXT_PUBLIC_PRIVY_APP_ID ?? "";

export function PrivyProvider({ children }: { children: ReactNode }) {
  if (!privyAppId) {
    console.warn("Privy App ID not configured");
    return children;
  }

  return (
    <PrivyReactProvider appId={privyAppId} config={borealPrivyConfig}>
      {children}
    </PrivyReactProvider>
  );
}
