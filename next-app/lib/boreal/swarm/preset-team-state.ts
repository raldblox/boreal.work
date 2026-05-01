import type { PresetTeamDefinition } from "./preset-teams"
import type { PresetTeamState } from "./team-blueprint"

type PresetRoomMessage = {
  createdAt: number
  sender: {
    externalId: string | null
    isCurrentUser?: boolean
  }
}

export function inferPresetRoomStateFromMessages(input: {
  cycleNumber?: number | null
  definition: PresetTeamDefinition
  messages: PresetRoomMessage[]
}) {
  const presetMemberByExternalId = new Map(
    input.definition.members.map((member) => [member.senderExternalId, member])
  )
  const ownerMessages = input.messages.filter((message) => message.sender.isCurrentUser)
  const cycleStartedAt =
    ownerMessages[ownerMessages.length - 1]?.createdAt ??
    input.messages[0]?.createdAt ??
    null
  const cycleMessages = input.messages.filter((message) => {
    if (
      cycleStartedAt !== null &&
      Number.isFinite(cycleStartedAt) &&
      message.createdAt < cycleStartedAt
    ) {
      return false
    }

    const externalId = message.sender.externalId
    return Boolean(externalId && presetMemberByExternalId.has(externalId))
  })

  let matchedTurnCount = 0

  for (const message of cycleMessages) {
    const expectedTurn = input.definition.turns[matchedTurnCount]
    const externalId = message.sender.externalId
    const member = externalId ? presetMemberByExternalId.get(externalId) : null

    if (!expectedTurn || !member || member.memberKey !== expectedTurn.memberKey) {
      break
    }

    matchedTurnCount += 1
  }

  const runStatus =
    matchedTurnCount >= input.definition.turns.length ? "awaiting_owner" : "running"
  const nextTurnIndex = runStatus === "awaiting_owner" ? 0 : matchedTurnCount
  const nextTurn = input.definition.turns[nextTurnIndex]
  const currentSpeakerKey =
    runStatus === "running"
      ? input.definition.members.find(
          (member) => member.memberKey === nextTurn?.memberKey
        )?.agentKey ?? null
      : null

  return {
    currentSpeakerKey,
    cycleNumber: Math.max(1, input.cycleNumber ?? 1),
    cycleStartedAt,
    lastError: null,
    lastAdvanceAt: cycleMessages[cycleMessages.length - 1]?.createdAt ?? null,
    nextTurnIndex,
    retryAttempt: 0,
    retryScheduledAt: null,
    runStatus,
  } satisfies PresetTeamState
}
