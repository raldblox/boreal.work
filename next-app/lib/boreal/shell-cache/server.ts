import { createHash } from "node:crypto"

import { auth } from "@/lib/auth"
import { convexFunctionRefs } from "@/lib/boreal/integrations/convex/function-refs"
import { createConvexServerClient } from "@/lib/boreal/integrations/convex/server-client"

import { encodeBase64Url, encodeUtf8 } from "./base64"
import { serializeEnvelopeForSignature } from "./signature"
import type {
  CacheKey,
  CacheOwnerScope,
  CacheVerifyKeyRecord,
  PublicMarketCacheKey,
  PublicMarketPayloadByTab,
  PublicMarketTab,
  ShellBootstrapPayload,
  ShellCachePayloadByKey,
  SignedCacheEnvelope,
  StaticShellCacheKey,
} from "./types"
import { SHELL_CACHE_SCHEMA_VERSION } from "./types"

type CacheSigner = {
  keyId: string
  privateKey: CryptoKey
  verifyKey: CacheVerifyKeyRecord
}

const signerPromise = loadShellCacheSigner()

export async function getSignedBootstrapEnvelopes() {
  const session = await auth()
  const ownerExternalId = session?.user?.id

  if (!ownerExternalId) {
    throw new Error("Unauthorized")
  }

  const payload = await loadShellBootstrapPayload(ownerExternalId)
  const signer = await signerPromise

  return {
    envelopes: {
      "cart-summary": await signEnvelope({
        cacheKey: "cart-summary",
        ownerScope: `user:${ownerExternalId}`,
        payload: payload.cartSummary,
        signer,
      }),
      "checkout-history-summary": await signEnvelope({
        cacheKey: "checkout-history-summary",
        ownerScope: `user:${ownerExternalId}`,
        payload: payload.checkoutHistorySummary,
        signer,
      }),
      "profile-summary": await signEnvelope({
        cacheKey: "profile-summary",
        ownerScope: `user:${ownerExternalId}`,
        payload: payload.profileSummary,
        signer,
      }),
      "wallet-summary": await signEnvelope({
        cacheKey: "wallet-summary",
        ownerScope: `user:${ownerExternalId}`,
        payload: payload.walletSummary,
        signer,
      }),
    },
    verifyKey: signer.verifyKey,
  }
}

export async function getSignedRefreshEnvelopes(keys: CacheKey[]) {
  const session = await auth()
  const ownerExternalId = session?.user?.id ?? null
  const signer = await signerPromise
  const envelopes: Partial<Record<CacheKey, SignedCacheEnvelope<unknown>>> = {}

  for (const key of keys) {
    if (isStaticShellCacheKey(key)) {
      if (!ownerExternalId) {
        throw new Error("Unauthorized")
      }

      const payload = await loadStaticShellPayload(key, ownerExternalId)
      envelopes[key] = await signEnvelope({
        cacheKey: key,
        ownerScope: `user:${ownerExternalId}`,
        payload,
        signer,
      })
      continue
    }

    const parsedMarketKey = parsePublicMarketCacheKey(key)

    if (!parsedMarketKey) {
      continue
    }

    const payload = await loadPublicMarketPayload(parsedMarketKey, ownerExternalId)
    envelopes[key] = await signEnvelope({
      cacheKey: key,
      ownerScope: "public",
      payload,
      signer,
    })
  }

  return {
    envelopes,
    verifyKey: signer.verifyKey,
  }
}

export async function getSignedPublicMarketEnvelope(input: {
  limit: number
  ownerExternalId?: string | null
  query?: string | null
  tab: PublicMarketTab
}) {
  const signer = await signerPromise
  const normalized = normalizePublicMarketQuery(input.query)
  const cacheKey = buildPublicMarketCacheKey({
    limit: input.limit,
    query: normalized,
    tab: input.tab,
  })
  const payload = await loadPublicMarketPayload(
    {
      limit: input.limit,
      query: normalized,
      tab: input.tab,
    },
    input.ownerExternalId ?? null,
  )

  return {
    envelope: await signEnvelope({
      cacheKey,
      ownerScope: "public",
      payload,
      signer,
    }),
    verifyKey: signer.verifyKey,
  }
}

export function buildPublicMarketCacheKey(input: {
  limit: number
  query: string
  tab: PublicMarketTab
}): PublicMarketCacheKey {
  return `public-market:${input.tab}:${encodeURIComponent(input.query)}:${input.limit}`
}

export function parsePublicMarketCacheKey(key: CacheKey) {
  if (!key.startsWith("public-market:")) {
    return null
  }

  const [, tab, encodedQuery, limitValue] = key.split(":")

  if ((tab !== "requests" && tab !== "workers") || !limitValue) {
    return null
  }

  const limit = Number(limitValue)

  if (!Number.isFinite(limit) || limit <= 0) {
    return null
  }

  return {
    limit,
    query: decodeURIComponent(encodedQuery ?? ""),
    tab,
  } satisfies {
    limit: number
    query: string
    tab: PublicMarketTab
  }
}

export function isStaticShellCacheKey(key: CacheKey): key is StaticShellCacheKey {
  return (
    key === "cart-summary" ||
    key === "checkout-history-summary" ||
    key === "profile-summary" ||
    key === "wallet-summary"
  )
}

export function normalizePublicMarketQuery(query?: string | null) {
  return query?.trim().toLowerCase() ?? ""
}

async function loadShellBootstrapPayload(
  ownerExternalId: string,
): Promise<ShellBootstrapPayload> {
  return {
    cartSummary: await loadStaticShellPayload("cart-summary", ownerExternalId),
    checkoutHistorySummary: await loadStaticShellPayload(
      "checkout-history-summary",
      ownerExternalId,
    ),
    profileSummary: await loadStaticShellPayload("profile-summary", ownerExternalId),
    walletSummary: await loadStaticShellPayload("wallet-summary", ownerExternalId),
  }
}

async function loadStaticShellPayload<K extends StaticShellCacheKey>(
  key: K,
  ownerExternalId: string,
): Promise<ShellCachePayloadByKey[K]> {
  const convex = createConvexServerClient()

  switch (key) {
    case "cart-summary":
      return convex.query(convexFunctionRefs.getActiveCart, {
        ownerExternalId,
      }) as Promise<ShellCachePayloadByKey[K]>
    case "checkout-history-summary":
      return convex.query(convexFunctionRefs.listCheckoutHistory, {
        limit: 12,
        ownerExternalId,
      }) as Promise<ShellCachePayloadByKey[K]>
    case "profile-summary":
      return convex.query(convexFunctionRefs.getMyProfile, {
        ownerExternalId,
      }) as Promise<ShellCachePayloadByKey[K]>
    case "wallet-summary":
      return convex.query(convexFunctionRefs.getMyWalletAccounts, {
        ownerExternalId,
      }) as Promise<ShellCachePayloadByKey[K]>
  }
}

async function loadPublicMarketPayload<T extends PublicMarketTab>(
  input: {
    limit: number
    query: string
    tab: T
  },
  ownerExternalId: string | null,
): Promise<PublicMarketPayloadByTab[T]> {
  const convex = createConvexServerClient()

  if (input.tab === "workers") {
    return (
      input.query.length > 0
        ? convex.query(convexFunctionRefs.searchCatalog, {
            limit: input.limit,
            query: input.query,
          })
        : convex.query(convexFunctionRefs.listCatalog, {
            limit: input.limit,
          })
    ) as Promise<PublicMarketPayloadByTab[T]>
  }

  return convex.query(convexFunctionRefs.listMarketplaceIntents, {
    limit: input.limit,
    ownerExternalId: ownerExternalId ?? undefined,
    query: input.query.length > 0 ? input.query : undefined,
  }) as Promise<PublicMarketPayloadByTab[T]>
}

async function signEnvelope<T>(input: {
  cacheKey: CacheKey
  ownerScope: CacheOwnerScope
  payload: T
  signer: CacheSigner
}): Promise<SignedCacheEnvelope<T>> {
  const signedAt = Date.now()
  const envelopeWithoutSignature = {
    cacheKey: input.cacheKey,
    cachedAt: signedAt,
    keyId: input.signer.keyId,
    ownerScope: input.ownerScope,
    payload: input.payload,
    schemaVersion: SHELL_CACHE_SCHEMA_VERSION,
    signedAt,
  }
  const signature = await crypto.subtle.sign(
    {
      hash: "SHA-256",
      name: "ECDSA",
    },
    input.signer.privateKey,
    encodeUtf8(serializeEnvelopeForSignature(envelopeWithoutSignature)),
  )

  return {
    ...envelopeWithoutSignature,
    signature: encodeBase64Url(signature),
  }
}

async function loadShellCacheSigner(): Promise<CacheSigner> {
  const globalScope = globalThis as typeof globalThis & {
    __borealShellCacheSigner?: Promise<CacheSigner>
  }

  if (!globalScope.__borealShellCacheSigner) {
    globalScope.__borealShellCacheSigner = createShellCacheSigner()
  }

  return globalScope.__borealShellCacheSigner
}

async function createShellCacheSigner(): Promise<CacheSigner> {
  const configuredPrivateJwk = process.env.BOREAL_SHELL_CACHE_SIGNING_PRIVATE_JWK?.trim()

  if (configuredPrivateJwk) {
    const privateJwk = JSON.parse(configuredPrivateJwk) as JsonWebKey
    const privateKey = await crypto.subtle.importKey(
      "jwk",
      privateJwk,
      {
        name: "ECDSA",
        namedCurve: "P-256",
      },
      false,
      ["sign"],
    )
    const publicJwk = {
      crv: privateJwk.crv,
      key_ops: ["verify"],
      kty: privateJwk.kty,
      x: privateJwk.x,
      y: privateJwk.y,
    } satisfies JsonWebKey
    const keyId = buildJwkKeyId(publicJwk)

    return {
      keyId,
      privateKey,
      verifyKey: {
        keyId,
        publicJwk,
      },
    }
  }

  const keyPair = await crypto.subtle.generateKey(
    {
      name: "ECDSA",
      namedCurve: "P-256",
    },
    true,
    ["sign", "verify"],
  )
  const publicJwk = (await crypto.subtle.exportKey(
    "jwk",
    keyPair.publicKey,
  )) as JsonWebKey
  const keyId = `ephemeral-${buildJwkKeyId(publicJwk)}`

  return {
    keyId,
    privateKey: keyPair.privateKey,
    verifyKey: {
      keyId,
      publicJwk,
    },
  }
}

function buildJwkKeyId(jwk: JsonWebKey) {
  return createHash("sha256")
    .update(JSON.stringify(jwk))
    .digest("hex")
    .slice(0, 16)
}
