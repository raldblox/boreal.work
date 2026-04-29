"use client"

import {
  decodeBase64Url,
  decodeUtf8,
  encodeBase64Url,
  encodeUtf8,
} from "./base64"
import {
  SHELL_CACHE_SCHEMA_VERSION,
  type CacheKey,
  type CacheOwnerScope,
  type CacheVerifyKeyRecord,
  type DraftSessionRecord,
  type SignedCacheEnvelope,
} from "./types"
import { serializeSignedEnvelopeForVerification } from "./signature"

const DEVICE_KEY_DATABASE = "boreal-shell-cache"
const DEVICE_KEY_STORE = "keys"
const DEVICE_KEY_ID = "device-encryption-key"
const VERIFY_KEYS_STORAGE_KEY = "boreal.shell-cache.verify-keys.v1"
const MAX_DRAFT_SESSIONS = 20

type EncryptedStorageRecord = {
  ciphertext: string
  iv: string
  version: number
}

type VerifyKeyMap = Record<string, JsonWebKey>

export async function readSignedEnvelope<T>(
  cacheKey: CacheKey,
  ownerScope: CacheOwnerScope,
) {
  const encrypted = readEncryptedStorageRecord(buildSignedEnvelopeStorageKey(cacheKey))

  if (!encrypted) {
    return null
  }

  const decrypted = await decryptJson<SignedCacheEnvelope<T>>(encrypted)

  if (
    !decrypted ||
    decrypted.schemaVersion !== SHELL_CACHE_SCHEMA_VERSION ||
    decrypted.ownerScope !== ownerScope
  ) {
    removeStorageValue(buildSignedEnvelopeStorageKey(cacheKey))
    return null
  }

  const verified = await verifySignedEnvelope(decrypted)

  if (!verified) {
    removeStorageValue(buildSignedEnvelopeStorageKey(cacheKey))
    return null
  }

  return decrypted
}

export async function writeSignedEnvelope<T>(
  envelope: SignedCacheEnvelope<T>,
  verifyKey: CacheVerifyKeyRecord,
) {
  writeVerifyKey(verifyKey)
  const encrypted = await encryptJson(envelope)
  writeEncryptedStorageRecord(
    buildSignedEnvelopeStorageKey(envelope.cacheKey),
    encrypted,
  )
}

export async function readDraftSessions(ownerScope: CacheOwnerScope) {
  const encrypted = readEncryptedStorageRecord(buildDraftSessionsStorageKey(ownerScope))

  if (!encrypted) {
    return [] as DraftSessionRecord[]
  }

  const decrypted = await decryptJson<DraftSessionRecord[]>(encrypted)

  if (!Array.isArray(decrypted)) {
    removeStorageValue(buildDraftSessionsStorageKey(ownerScope))
    return [] as DraftSessionRecord[]
  }

  return decrypted
}

export async function writeDraftSessions(
  ownerScope: CacheOwnerScope,
  sessions: DraftSessionRecord[],
) {
  const trimmed = sessions
    .slice()
    .sort((left, right) => right.updatedAt - left.updatedAt)
    .slice(0, MAX_DRAFT_SESSIONS)
  const encrypted = await encryptJson(trimmed)
  writeEncryptedStorageRecord(buildDraftSessionsStorageKey(ownerScope), encrypted)
}

export function clearDraftSessions(ownerScope: CacheOwnerScope) {
  removeStorageValue(buildDraftSessionsStorageKey(ownerScope))
}

export function clearSignedCacheForOwner(ownerScope: CacheOwnerScope) {
  if (typeof window === "undefined") {
    return
  }

  const prefix = "boreal.shell-cache.v1:"

  for (const key of Object.keys(window.localStorage)) {
    if (!key.startsWith(prefix)) {
      continue
    }

    const storageValue = window.localStorage.getItem(key)

    if (!storageValue) {
      continue
    }

    try {
      const parsed = JSON.parse(storageValue) as EncryptedStorageRecord
      void decryptJson<{ ownerScope?: string }>(parsed).then((decrypted) => {
        if (decrypted?.ownerScope === ownerScope) {
          removeStorageValue(key)
        }
      })
    } catch {
      removeStorageValue(key)
    }
  }
}

export function clearPublicMarketCaches(tabs?: Array<"requests" | "workers">) {
  if (typeof window === "undefined") {
    return
  }

  const prefix = "boreal.shell-cache.v1:public-market:"

  for (const key of Object.keys(window.localStorage)) {
    if (!key.startsWith(prefix)) {
      continue
    }

    if (
      tabs &&
      tabs.length > 0 &&
      !tabs.some((tab) => key.startsWith(`${prefix}${tab}:`))
    ) {
      continue
    }

    removeStorageValue(key)
  }
}

export function buildDraftSessionsStorageKey(ownerScope: CacheOwnerScope) {
  return `boreal.shell-cache.v1:draft-sessions:${ownerScope}`
}

export function buildSignedEnvelopeStorageKey(cacheKey: CacheKey) {
  return `boreal.shell-cache.v1:${cacheKey}`
}

async function verifySignedEnvelope<T>(envelope: SignedCacheEnvelope<T>) {
  const verifyKeys = readVerifyKeys()
  const publicJwk = verifyKeys[envelope.keyId]

  if (!publicJwk) {
    return false
  }

  try {
    const verifyKey = await crypto.subtle.importKey(
      "jwk",
      publicJwk,
      {
        name: "ECDSA",
        namedCurve: "P-256",
      },
      false,
      ["verify"],
    )

    return crypto.subtle.verify(
      {
        hash: "SHA-256",
        name: "ECDSA",
      },
      verifyKey,
      decodeBase64Url(envelope.signature),
      encodeUtf8(serializeSignedEnvelopeForVerification(envelope)),
    )
  } catch {
    return false
  }
}

function writeVerifyKey(record: CacheVerifyKeyRecord) {
  if (typeof window === "undefined") {
    return
  }

  const current = readVerifyKeys()
  current[record.keyId] = record.publicJwk
  window.localStorage.setItem(VERIFY_KEYS_STORAGE_KEY, JSON.stringify(current))
}

function readVerifyKeys() {
  if (typeof window === "undefined") {
    return {} as VerifyKeyMap
  }

  try {
    const raw = window.localStorage.getItem(VERIFY_KEYS_STORAGE_KEY)
    return raw ? (JSON.parse(raw) as VerifyKeyMap) : ({} as VerifyKeyMap)
  } catch {
    return {} as VerifyKeyMap
  }
}

async function encryptJson<T>(value: T) {
  const key = await getOrCreateDeviceKey()
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const plaintext = encodeUtf8(JSON.stringify(value))
  const ciphertext = await crypto.subtle.encrypt(
    {
      iv,
      name: "AES-GCM",
    },
    key,
    plaintext,
  )

  return {
    ciphertext: encodeBase64Url(ciphertext),
    iv: encodeBase64Url(iv),
    version: SHELL_CACHE_SCHEMA_VERSION,
  } satisfies EncryptedStorageRecord
}

async function decryptJson<T>(value: EncryptedStorageRecord) {
  try {
    const key = await getOrCreateDeviceKey()
    const decrypted = await crypto.subtle.decrypt(
      {
        iv: decodeBase64Url(value.iv),
        name: "AES-GCM",
      },
      key,
      decodeBase64Url(value.ciphertext),
    )

    return JSON.parse(decodeUtf8(new Uint8Array(decrypted))) as T
  } catch {
    return null
  }
}

function writeEncryptedStorageRecord(key: string, value: EncryptedStorageRecord) {
  if (typeof window === "undefined") {
    return
  }

  window.localStorage.setItem(key, JSON.stringify(value))
}

function readEncryptedStorageRecord(key: string) {
  if (typeof window === "undefined") {
    return null
  }

  try {
    const raw = window.localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as EncryptedStorageRecord) : null
  } catch {
    removeStorageValue(key)
    return null
  }
}

function removeStorageValue(key: string) {
  if (typeof window === "undefined") {
    return
  }

  window.localStorage.removeItem(key)
}

async function getOrCreateDeviceKey() {
  const existing = await readDeviceKey()

  if (existing) {
    return existing
  }

  const generated = await crypto.subtle.generateKey(
    {
      length: 256,
      name: "AES-GCM",
    },
    true,
    ["encrypt", "decrypt"],
  )
  const exported = (await crypto.subtle.exportKey("jwk", generated)) as JsonWebKey
  const database = await openDeviceKeyDatabase()

  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(DEVICE_KEY_STORE, "readwrite")
    const store = transaction.objectStore(DEVICE_KEY_STORE)
    const request = store.put(exported, DEVICE_KEY_ID)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve()
  })

  return generated
}

async function readDeviceKey() {
  const database = await openDeviceKeyDatabase()
  const jwk = await new Promise<JsonWebKey | null>((resolve, reject) => {
    const transaction = database.transaction(DEVICE_KEY_STORE, "readonly")
    const store = transaction.objectStore(DEVICE_KEY_STORE)
    const request = store.get(DEVICE_KEY_ID)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve((request.result as JsonWebKey | undefined) ?? null)
  })

  if (!jwk) {
    return null
  }

  return crypto.subtle.importKey(
    "jwk",
    jwk,
    {
      length: 256,
      name: "AES-GCM",
    },
    false,
    ["encrypt", "decrypt"],
  )
}

async function openDeviceKeyDatabase() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = window.indexedDB.open(DEVICE_KEY_DATABASE, 1)

    request.onerror = () => reject(request.error)
    request.onupgradeneeded = () => {
      const database = request.result

      if (!database.objectStoreNames.contains(DEVICE_KEY_STORE)) {
        database.createObjectStore(DEVICE_KEY_STORE)
      }
    }
    request.onsuccess = () => resolve(request.result)
  })
}
