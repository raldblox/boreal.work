"use client"

import {
  clearDraftSessions as clearStoredDraftSessions,
  readDraftSessions as readStoredDraftSessions,
  writeDraftSessions as writeStoredDraftSessions,
} from "./client"
import type { CacheOwnerScope, DraftSessionRecord } from "./types"

export async function listDraftSessions(ownerScope: CacheOwnerScope) {
  const sessions = await readStoredDraftSessions(ownerScope)

  return sessions
    .slice()
    .sort((left, right) => left.updatedAt - right.updatedAt)
}

export async function upsertDraftSession(
  ownerScope: CacheOwnerScope,
  session: DraftSessionRecord,
) {
  const current = await readStoredDraftSessions(ownerScope)
  const next = [
    session,
    ...current.filter((entry) => entry.draftSessionId !== session.draftSessionId),
  ]

  await writeStoredDraftSessions(ownerScope, next)
}

export async function removeDraftSession(
  ownerScope: CacheOwnerScope,
  draftSessionId: string,
) {
  const current = await readStoredDraftSessions(ownerScope)
  const next = current.filter((entry) => entry.draftSessionId !== draftSessionId)

  await writeStoredDraftSessions(ownerScope, next)
}

export function clearDraftSessions(ownerScope: CacheOwnerScope) {
  clearStoredDraftSessions(ownerScope)
}
