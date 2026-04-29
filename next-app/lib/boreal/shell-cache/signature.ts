import type { CacheKey, CacheOwnerScope, SignedCacheEnvelope } from "./types"

export function serializeEnvelopeForSignature<T>(input: {
  cacheKey: CacheKey
  cachedAt: number
  keyId: string
  ownerScope: CacheOwnerScope
  payload: T
  schemaVersion: number
  signedAt: number
}) {
  return [
    input.cacheKey,
    input.ownerScope,
    String(input.schemaVersion),
    input.keyId,
    String(input.signedAt),
    String(input.cachedAt),
    JSON.stringify(input.payload),
  ].join("\n")
}

export function serializeSignedEnvelopeForVerification<T>(
  envelope: SignedCacheEnvelope<T>,
) {
  return serializeEnvelopeForSignature({
    cacheKey: envelope.cacheKey,
    cachedAt: envelope.cachedAt,
    keyId: envelope.keyId,
    ownerScope: envelope.ownerScope,
    payload: envelope.payload,
    schemaVersion: envelope.schemaVersion,
    signedAt: envelope.signedAt,
  })
}
