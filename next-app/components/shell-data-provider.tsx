"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"
import { useMutation } from "convex/react"
import { useSession } from "next-auth/react"

import { convexFunctionRefs } from "@/lib/boreal/integrations/convex/function-refs"
import { usePayment } from "@/hooks/use-payment"
import {
  buildPublicMarketCacheKey,
  normalizePublicMarketQuery,
} from "@/lib/boreal/shell-cache/server"
import {
  readSignedEnvelope,
  writeSignedEnvelope,
  clearPublicMarketCaches,
} from "@/lib/boreal/shell-cache/client"
import type {
  ActiveCart,
  CatalogEntry,
  CheckoutRecord,
  MyProfileRecord,
  SidebarIntentPreview,
  WalletAccountRecord,
} from "@/lib/boreal/integrations/convex/function-refs"
import type {
  CacheKey,
  PublicMarketTab,
  PublicMarketResponse,
  ShellCacheBootstrapResponse,
  ShellCacheRefreshRequest,
  ShellCacheRefreshResponse,
  SignedCacheEnvelope,
  StaticShellCacheKey,
} from "@/lib/boreal/shell-cache/types"

const BOOTSTRAP_KEYS = [
  "cart-summary",
  "checkout-history-summary",
  "profile-summary",
  "sidebar-summary",
  "wallet-summary",
] as const satisfies StaticShellCacheKey[]

type ShellDataState = {
  activeCart: ActiveCart
  checkoutHistory: CheckoutRecord[]
  myProfileRecord: MyProfileRecord | null
  sidebarIntents: SidebarIntentPreview[]
  walletAccounts: WalletAccountRecord
}

type ShellDataContextValue = ShellDataState & {
  isReady: boolean
  purgePublicMarket: (tabs?: PublicMarketTab[]) => void
  refreshShellData: (keys: CacheKey[]) => Promise<void>
}

const emptyShellDataState: ShellDataState = {
  activeCart: null,
  checkoutHistory: [],
  myProfileRecord: null,
  sidebarIntents: [],
  walletAccounts: [],
}

const ShellDataContext = createContext<ShellDataContextValue | null>(null)

export function ShellDataProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession()
  const ownerExternalId = session?.user?.id ?? null
  const ownerScope = ownerExternalId ? (`user:${ownerExternalId}` as const) : null
  const [state, setState] = useState<ShellDataState>(emptyShellDataState)
  const [isReady, setIsReady] = useState(false)
  const syncWalletAccount = useMutation(convexFunctionRefs.syncWalletAccount)
  const {
    connectedWallets,
    defaultWallet,
    isWalletReady,
  } = usePayment()
  const walletSyncSignatureRef = useRef<string | null>(null)

  const applyEnvelopes = useCallback(
    (
      envelopes:
        | Partial<ShellCacheBootstrapResponse["envelopes"]>
        | ShellCacheRefreshResponse["envelopes"],
    ) => {
      setState((current) => {
        const next = { ...current }

        for (const [key, envelope] of Object.entries(envelopes)) {
          if (!envelope) {
            continue
          }

          switch (key as StaticShellCacheKey) {
            case "cart-summary":
              next.activeCart = envelope.payload as ActiveCart
              break
            case "checkout-history-summary":
              next.checkoutHistory = envelope.payload as CheckoutRecord[]
              break
            case "profile-summary":
              next.myProfileRecord = envelope.payload as MyProfileRecord | null
              break
            case "sidebar-summary":
              next.sidebarIntents = envelope.payload as SidebarIntentPreview[]
              break
            case "wallet-summary":
              next.walletAccounts = envelope.payload as WalletAccountRecord
              break
          }
        }

        return next
      })
    },
    [],
  )

  const refreshShellData = useCallback(
    async (keys: CacheKey[]) => {
      if (keys.length === 0) {
        return
      }

      const response = await fetch("/api/cache/refresh", {
        body: JSON.stringify({
          keys,
        } satisfies ShellCacheRefreshRequest),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      })
      const payload = (await response.json()) as ShellCacheRefreshResponse & {
        error?: string
      }

      if (!response.ok) {
        throw new Error(payload.error ?? "Could not refresh shell cache.")
      }

      await Promise.all(
        Object.values(payload.envelopes)
          .filter(Boolean)
          .map((envelope) =>
            writeSignedEnvelope(
              envelope!,
              payload.verifyKey,
            ),
          ),
      )
      applyEnvelopes(payload.envelopes)
    },
    [applyEnvelopes],
  )

  const purgePublicMarket = useCallback((tabs?: PublicMarketTab[]) => {
    clearPublicMarketCaches(tabs)
  }, [])

  useEffect(() => {
    if (status === "loading") {
      return
    }

    if (!ownerScope) {
      setState(emptyShellDataState)
      setIsReady(true)
      return
    }

    const cacheOwnerScope = ownerScope

    let cancelled = false

    async function hydrateFromCache() {
      setIsReady(false)
      const cachedEntries = await Promise.all(
        BOOTSTRAP_KEYS.map(async (key) => [
          key,
          await readSignedEnvelope(key, cacheOwnerScope),
        ] as const),
      )

      if (cancelled) {
        return
      }

      const cachedEnvelopes = Object.fromEntries(
        cachedEntries.filter(([, envelope]) => Boolean(envelope)),
      ) as Partial<ShellCacheBootstrapResponse["envelopes"]>
      applyEnvelopes(cachedEnvelopes)
      setIsReady(true)

      const hasAllKeys = BOOTSTRAP_KEYS.every((key) => Boolean(cachedEnvelopes[key]))

      if (hasAllKeys) {
        return
      }

      const response = await fetch("/api/cache/bootstrap", {
        cache: "no-store",
      })
      const payload = (await response.json()) as ShellCacheBootstrapResponse & {
        error?: string
      }

      if (!response.ok) {
        throw new Error(payload.error ?? "Could not load shell bootstrap cache.")
      }

      await Promise.all(
        BOOTSTRAP_KEYS.flatMap((key) => {
          const envelope = payload.envelopes[key]
          return envelope
            ? [
                writeSignedEnvelope(
                  envelope as SignedCacheEnvelope<unknown>,
                  payload.verifyKey,
                ),
              ]
            : []
        }),
      )

      if (cancelled) {
        return
      }

      applyEnvelopes(payload.envelopes)
    }

    void hydrateFromCache().catch(() => {
      if (!cancelled) {
        setState(emptyShellDataState)
        setIsReady(true)
      }
    })

    return () => {
      cancelled = true
    }
  }, [applyEnvelopes, ownerScope, status])

  useEffect(() => {
    if (!ownerExternalId || connectedWallets.length === 0 || !isWalletReady) {
      walletSyncSignatureRef.current = ownerExternalId ? walletSyncSignatureRef.current : null
      return
    }

    const preferredWalletAddress = defaultWallet?.address.toLowerCase() ?? null
    const syncSignature = JSON.stringify({
      ownerExternalId,
      preferredWalletAddress,
      wallets: connectedWallets.map((wallet) => ({
        address: wallet.address,
        chainFamily: wallet.chainFamily,
        chainId: wallet.chainId ?? null,
        networkKey: wallet.networkKey,
      })),
    })

    if (walletSyncSignatureRef.current === syncSignature) {
      return
    }

    walletSyncSignatureRef.current = syncSignature
    let cancelled = false

    async function syncWallets() {
      await Promise.all(
        connectedWallets.map((wallet) =>
          syncWalletAccount({
            chainFamily: wallet.chainFamily,
            chainId: wallet.chainId ?? undefined,
            networkKey: wallet.networkKey ?? undefined,
            ownerDisplayName: session?.user?.name ?? undefined,
            ownerExternalId: ownerExternalId ?? undefined,
            roles: ["connected", "buyer", "payout"],
            setAsDefaultBuyer:
              preferredWalletAddress !== null &&
              wallet.address.toLowerCase() === preferredWalletAddress,
            setAsDefaultPayout:
              preferredWalletAddress !== null &&
              wallet.address.toLowerCase() === preferredWalletAddress,
            walletAddress: wallet.address,
            walletProvider: "reown",
          }),
        ),
      )

      if (!cancelled) {
        await refreshShellData(["profile-summary", "wallet-summary"])
      }
    }

    void syncWallets().catch(() => {
      walletSyncSignatureRef.current = null
    })

    return () => {
      cancelled = true
    }
  }, [
    connectedWallets,
    defaultWallet,
    isWalletReady,
    ownerExternalId,
    refreshShellData,
    session?.user?.name,
    syncWalletAccount,
  ])

  const value = useMemo(
    () => ({
      ...state,
      isReady,
      purgePublicMarket,
      refreshShellData,
    }),
    [isReady, purgePublicMarket, refreshShellData, state],
  )

  return (
    <ShellDataContext.Provider value={value}>
      {children}
    </ShellDataContext.Provider>
  )
}

export function useShellData() {
  const context = useContext(ShellDataContext)

  if (!context) {
    throw new Error("useShellData must be used within ShellDataProvider.")
  }

  return context
}

export function usePublicMarketCache<T extends PublicMarketTab>(input: {
  enabled: boolean
  limit: number
  query?: string
  tab: T
}) {
  const normalizedQuery = normalizePublicMarketQuery(input.query)
  const cacheKey = useMemo(
    () =>
      buildPublicMarketCacheKey({
        limit: input.limit,
        query: normalizedQuery,
        tab: input.tab,
      }),
    [input.limit, input.tab, normalizedQuery],
  )
  const [data, setData] = useState<T extends "workers" ? CatalogEntry[] : SidebarIntentPreview[]>(
    [] as unknown as T extends "workers" ? CatalogEntry[] : SidebarIntentPreview[],
  )
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!input.enabled) {
      setIsLoading(false)
      return
    }

    let cancelled = false

    async function hydrate() {
      const cached = await readSignedEnvelope<
        T extends "workers" ? CatalogEntry[] : SidebarIntentPreview[]
      >(cacheKey, "public")

      if (cancelled) {
        return
      }

      if (cached) {
        setData(cached.payload)
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      const response = await fetch(
        `/api/cache/public-market?tab=${encodeURIComponent(input.tab)}&limit=${input.limit}&query=${encodeURIComponent(normalizedQuery)}`,
        {
          cache: "no-store",
        },
      )
      const payload = (await response.json()) as (PublicMarketResponse & {
        error?: string
      })

      if (!response.ok || !payload.envelope || !payload.verifyKey) {
        throw new Error(payload.error ?? "Could not load market cache.")
      }

      const envelope =
        payload.envelope as SignedCacheEnvelope<
          T extends "workers" ? CatalogEntry[] : SidebarIntentPreview[]
        >

      await writeSignedEnvelope(envelope, payload.verifyKey)

      if (cancelled) {
        return
      }

      setData(envelope.payload)
      setIsLoading(false)
    }

    void hydrate().catch(() => {
      if (!cancelled) {
        setData(
          [] as unknown as T extends "workers"
            ? CatalogEntry[]
            : SidebarIntentPreview[],
        )
        setIsLoading(false)
      }
    })

    return () => {
      cancelled = true
    }
  }, [cacheKey, input.enabled, input.limit, input.tab, normalizedQuery])

  return {
    data,
    isLoading,
  }
}
