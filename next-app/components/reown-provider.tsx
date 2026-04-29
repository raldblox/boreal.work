"use client"

import { useMemo, type ReactNode } from "react"
import { AppKitProvider } from "@reown/appkit/react"
import { solana } from "@reown/appkit/networks"
import { SolanaAdapter } from "@reown/appkit-adapter-solana/react"

const reownProjectId = process.env.NEXT_PUBLIC_REOWN_PROJECT_ID ?? ""
const solanaAdapter = new SolanaAdapter()

export function ReownProvider({ children }: { children: ReactNode }) {
  const metadata = useMemo(() => {
    const origin =
      typeof window !== "undefined"
        ? window.location.origin
        : "http://localhost:3000"

    return {
      description: "Chat-native market for request-native commerce.",
      icons: [`${origin}/favicon.ico`],
      name: "Boreal",
      url: origin,
    }
  }, [])

  if (!reownProjectId) {
    return children
  }

  return (
    <AppKitProvider
      adapters={[solanaAdapter]}
      defaultNetwork={solana}
      features={{
        allWallets: true,
        analytics: false,
        email: false,
        history: false,
        onramp: false,
        pay: false,
        receive: false,
        reownAuthentication: false,
        send: false,
        socials: false,
        swaps: false,
      }}
      metadata={metadata}
      networks={[solana]}
      projectId={reownProjectId}
    >
      {children}
    </AppKitProvider>
  )
}
