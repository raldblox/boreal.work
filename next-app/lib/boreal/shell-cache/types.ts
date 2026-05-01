import type {
  ActiveCart,
  CatalogEntry,
  CheckoutRecord,
  MyProfileRecord,
  SidebarIntentPreview,
  WalletAccountRecord,
} from "@/lib/boreal/integrations/convex/function-refs"

export const SHELL_CACHE_SCHEMA_VERSION = 1

export type CacheOwnerScope = "public" | `user:${string}`

export type StaticShellCacheKey =
  | "cart-summary"
  | "checkout-history-summary"
  | "profile-summary"
  | "wallet-summary"

export type PublicMarketTab = "requests" | "workers"

export type PublicMarketCacheKey =
  `public-market:${PublicMarketTab}:${string}:${number}`

export type CacheKey = PublicMarketCacheKey | StaticShellCacheKey

export type ShellBootstrapPayload = {
  cartSummary: ActiveCart
  checkoutHistorySummary: CheckoutRecord[]
  profileSummary: MyProfileRecord | null
  walletSummary: WalletAccountRecord
}

export type ShellCachePayloadByKey = {
  "cart-summary": ActiveCart
  "checkout-history-summary": CheckoutRecord[]
  "profile-summary": MyProfileRecord | null
  "wallet-summary": WalletAccountRecord
}

export type PublicMarketPayloadByTab = {
  requests: SidebarIntentPreview[]
  workers: CatalogEntry[]
}

export type SignedCacheEnvelope<T> = {
  cacheKey: CacheKey
  cachedAt: number
  keyId: string
  ownerScope: CacheOwnerScope
  payload: T
  schemaVersion: number
  signature: string
  signedAt: number
}

export type CacheVerifyKeyRecord = {
  keyId: string
  publicJwk: JsonWebKey
}

export type SignedCacheEnvelopeMap = Partial<{
  [K in CacheKey]: SignedCacheEnvelope<unknown>
}>

export type ShellCacheBootstrapResponse = {
  envelopes: Partial<{
    [K in StaticShellCacheKey]: SignedCacheEnvelope<ShellCachePayloadByKey[K]>
  }>
  verifyKey: CacheVerifyKeyRecord
}

export type ShellCacheRefreshRequest = {
  keys: CacheKey[]
}

export type ShellCacheRefreshResponse = {
  envelopes: SignedCacheEnvelopeMap
  verifyKey: CacheVerifyKeyRecord
}

export type PublicMarketResponse =
  | {
      envelope: SignedCacheEnvelope<PublicMarketPayloadByTab["requests"]>
      verifyKey: CacheVerifyKeyRecord
    }
  | {
      envelope: SignedCacheEnvelope<PublicMarketPayloadByTab["workers"]>
      verifyKey: CacheVerifyKeyRecord
    }

export type DraftSessionMessage = {
  content: string
  createdAt: number
  id: string
  role: "assistant" | "user"
}

export type DraftMountedAgent = {
  actorKind: "agent" | "human" | "tool"
  directAgentKey: string | null
  kind?: "direct_agent" | "preset_team"
  memberPreview?: Array<{
    displayName: string
    initials: string
    memberKey: string
    roleLabel: string
  }>
  presetTeamKey?: string | null
  sourceCapabilityId: string | null
  supplyId: string
  title: string
}

export type DraftSessionRecord = {
  createdAt: number
  draftSessionId: string
  messages: DraftSessionMessage[]
  mountedAgents: DraftMountedAgent[]
  updatedAt: number
}
