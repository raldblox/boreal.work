import { streamText } from "ai"
import { withRetry } from "@/lib/boreal/utils/retry"

import type { BorealProviderAdapter } from "@/lib/boreal/integrations/providers/types"
import type {
  RequestDetail,
  RequestExecutionContext,
} from "@/lib/boreal/integrations/convex/function-refs"
import {
  buildPresetTeamThreadGreeting,
  renderPresetTeamCycleMessage,
  type PresetTeamTurnResult,
} from "@/lib/boreal/swarm/preset-team-presenter"
import type {
  PresetTeamDefinition,
  PresetTeamMember,
} from "@/lib/boreal/swarm/preset-teams"
import type { ChatAssistantStreamEvent } from "@/lib/boreal/schemas/chat"
import type {
  PresetTeamRunStatus,
  PresetTeamState,
} from "@/lib/boreal/swarm/team-blueprint"

type RuntimeConfigShape = {
  assistantModel: string
}

export type PresetTeamCycleResult = {
  currentSpeakerKey: string | null
  cycleNumber: number
  cycleStartedAt: number | null
  finalAssistantMessage: string
  lastAdvanceAt: number | null
  nextTurnIndex: number | null
  runStatusAfter: PresetTeamRunStatus
  transcript: PresetTeamTurnResult[]
}

type RoomLedgerEntry = {
  createdAt: number
  displayName: string
  handle: string | null
  isOwner: boolean
  memberKey: string | null
  role: string
  text: string
}

const CLEARLY_NON_PROFESSIONAL_SCOPE_HINTS = [
  "abortion",
  "celebrity",
  "dating",
  "democrat",
  "election",
  "faith",
  "immigration",
  "marriage",
  "palestine",
  "president",
  "race",
  "republican",
  "religion",
  "war",
] as const

const PROFESSIONAL_SCOPE_HINTS = [
  "architecture",
  "base",
  "business",
  "chain",
  "company",
  "customer",
  "engineering",
  "go-to-market",
  "launch",
  "model",
  "office",
  "open source",
  "payments",
  "pricing",
  "product",
  "remote",
  "revenue",
  "saas",
  "solana",
  "startup",
  "strategy",
  "stripe",
  "team",
  "technology",
  "workflow",
  "work",
] as const

const PRESET_TEAM_GENERATION_RETRYABLE_STATUS_CODES = [
  408, 409, 425, 429, 500, 502, 503, 504,
] as const

export async function runPresetTeamRequestCycleDetailed(input: {
  definition: PresetTeamDefinition
  latestOwnerMessage?: string | null
  onStreamEvent?: (event: ChatAssistantStreamEvent) => void | Promise<void>
  provider: BorealProviderAdapter
  request: NonNullable<RequestExecutionContext>
  requestDetail?: RequestDetail | null
  runtimeConfig: RuntimeConfigShape
  roomState?: PresetTeamState | null
  startTurnIndex?: number
  turnLimit?: number
}): Promise<PresetTeamCycleResult> {
  const startTurnIndex = Math.max(
    0,
    input.startTurnIndex ?? input.roomState?.nextTurnIndex ?? 0
  )
  const turnLimit = Math.max(1, input.turnLimit ?? 1)
  const cycleNumber = Math.max(1, input.roomState?.cycleNumber ?? 1)
  const cycleStartedAt = input.roomState?.cycleStartedAt ?? null
  const ownerScenario = normalizeDebateRequest(
    input.latestOwnerMessage ?? buildLatestOwnerScenario(input.requestDetail)
  )
  const cycleLedger = buildCycleRoomLedger({
    cycleStartedAt,
    definition: input.definition,
    requestDetail: input.requestDetail,
  })
  const initialOwnerMessage =
    cycleLedger.find((entry) => entry.isOwner)?.text ?? ownerScenario
  const latestOwnerNote =
    [...cycleLedger].reverse().find((entry) => entry.isOwner)?.text ?? ownerScenario
  const moderator = input.definition.members.find(
    (member) => member.memberKey === "moderator"
  )

  if (!initialOwnerMessage) {
    const greeting = buildPresetTeamThreadGreeting(input.definition)

    return {
      currentSpeakerKey: moderator?.agentKey ?? null,
      cycleNumber,
      cycleStartedAt,
      finalAssistantMessage: greeting,
      lastAdvanceAt: null,
      nextTurnIndex: startTurnIndex,
      runStatusAfter: "awaiting_owner",
      transcript: moderator
        ? [buildPresetGreetingTurn({ cycleNumber, member: moderator, turnIndex: 0, greeting })]
        : [],
    }
  }

  const scheduledTurns = input.definition.turns.slice(
    startTurnIndex,
    startTurnIndex + turnLimit
  )
  const transcript: PresetTeamTurnResult[] = []

  for (const [offset, turn] of scheduledTurns.entries()) {
    const turnIndex = startTurnIndex + offset
    const member = input.definition.members.find(
      (candidate) => candidate.memberKey === turn.memberKey
    )

    if (!member) {
      continue
    }

    const isLeadTurn = turn.turnKey === "moderator_frame"
    const moderatorFrame = buildLatestModeratorFrame({
      definition: input.definition,
      requestDetail: input.requestDetail,
      transcript,
      cycleStartedAt,
    })

    if (
      isLeadTurn &&
      (isGreetingLikePresetTeamMessage(initialOwnerMessage) ||
        isGreetingLikePresetTeamMessage(ownerScenario))
    ) {
      const greeting = buildPresetTeamThreadGreeting(input.definition)

      transcript.push(
        buildPresetGreetingTurn({
          cycleNumber,
          member,
          turnIndex,
          greeting,
        })
      )
      continue
    }

    if (
      isLeadTurn &&
      isClearlyOutsideProfessionalDebateScope(initialOwnerMessage)
    ) {
      transcript.push(
        buildPresetTurnResult({
          content: input.definition.professionalScopeRefusal,
          cycleNumber,
          member,
          turnIndex,
        })
      )

      return {
        currentSpeakerKey: moderator?.agentKey ?? null,
        cycleNumber,
        cycleStartedAt,
        finalAssistantMessage: input.definition.professionalScopeRefusal,
        lastAdvanceAt: Date.now(),
        nextTurnIndex: 0,
        runStatusAfter: "awaiting_owner",
        transcript,
      }
    }

    const roomLedger = renderRoomLedger(cycleLedger)
    const cycleTranscript = renderCycleTranscript(transcript)
    const ownerGuidance =
      isLeadTurn
        ? `Owner scenario to frame: ${initialOwnerMessage}`
        : latestOwnerNote
          ? `Latest owner note to account for: ${latestOwnerNote}`
          : "Latest owner note to account for: none"
    const leadRules = [
      "First line must be exactly: Scope: proceed or Scope: refuse.",
      "Do not ask a follow-up question as your first move.",
      "If the owner gives a broad but usable X versus Y prompt, choose the most practical comparison frame and state your assumption clearly.",
      "If you refuse, explain briefly how the owner can narrow it into a professional or commercially useful decision debate.",
      "If you proceed, define one clear motion or comparison, assign Side A and Side B, define decision criteria, and set debate rules for the room.",
    ]
    const judgeRules = [
      "Start with: Verdict: <winner or recommendation>.",
      "Then include short labeled lines for Why, Strongest point for, Strongest point against, Unknowns, and Recommendation.",
    ]
    const workerRules = [
      "Stay inside Mara's motion and criteria.",
      "Reference earlier speakers by name when useful.",
      "Do not reinterpret the owner's request from scratch.",
      "Speak for your assigned side only, even if the labels are not explicitly positive or negative.",
    ]
    const prompt = [
      `Preset room: ${input.definition.teamDisplayName}`,
      `Room scope: ${input.definition.professionalScopeDescription}`,
      `Cycle number: ${cycleNumber}`,
      `Turn number: ${turnIndex + 1} of ${input.definition.turns.length}`,
      `Request title: ${input.request.title}`,
      `Request summary: ${input.request.summary}`,
      ownerGuidance,
      isLeadTurn
        ? "Lead responsibility: frame the motion, criteria, and rules for the entire room."
        : "Speaker responsibility: respond within Mara's frame and the current room history.",
      moderatorFrame && !isLeadTurn
        ? `Mara's operating brief:\n${moderatorFrame}`
        : null,
      roomLedger ? `Current room ledger:\n${roomLedger}` : "Current room ledger: none",
      cycleTranscript
        ? `Turns already generated this call:\n${cycleTranscript}`
        : "Turns already generated this call: none",
      `Turn instruction: ${turn.turnPrompt}`,
      "Output rules:",
      "- speak only as your named role",
      "- do not mention Boreal Agent",
      "- keep it concise and professional",
      "- do not produce transcript formatting or stage directions",
      ...(isLeadTurn ? leadRules : turn.turnKey === "judge_verdict" ? judgeRules : workerRules),
    ]
      .filter((value): value is string => Boolean(value))
      .join("\n\n")
    const systemPrompt = [
      `You are ${member.displayName}, the ${member.roleLabel} in Boreal's ${input.definition.teamDisplayName} debate room.`,
      member.systemPrompt,
    ].join(" ")
    const content = await withRetry(
      async () => {
        await emitPresetTeamTurnEvent({
          content: null,
          definition: input.definition,
          member,
          onStreamEvent: input.onStreamEvent,
          state: "pending",
          turnIndex,
        })

        const result = streamText({
          model: input.provider.getAssistantModel(input.runtimeConfig.assistantModel),
          prompt,
          system: systemPrompt,
        })

        let streamedText = ""

        for await (const part of result.fullStream) {
          if (part.type !== "text-delta" || !part.text) {
            continue
          }

          streamedText += part.text
          const partialContent = sanitizeTurnContent(
            streamedText,
            member.displayName
          )

          await emitPresetTeamTurnEvent({
            content: partialContent.length > 0 ? partialContent : null,
            definition: input.definition,
            member,
            onStreamEvent: input.onStreamEvent,
            state: "pending",
            turnIndex,
          })
        }

        const finalContent = sanitizeTurnContent(
          await result.text,
          member.displayName
        )

        if (!finalContent) {
          throw new Error("Preset room turn returned empty content.")
        }

        return finalContent
      },
      {
        attempts: 3,
        baseDelayMs: 2000,
        shouldRetry: (error) => isRetryablePresetTeamGenerationError(error),
      }
    )

    if (!content) {
      continue
    }

    const turnResult = buildPresetTurnResult({
      content,
      cycleNumber,
      member,
      turnIndex,
    })

    transcript.push(turnResult)

    await emitPresetTeamTurnEvent({
      content,
      definition: input.definition,
      member,
      onStreamEvent: input.onStreamEvent,
      state: "complete",
      turnIndex,
    })

    if (isLeadTurn && !moderatorAllowsProceed(content)) {
      return {
        currentSpeakerKey: moderator?.agentKey ?? null,
        cycleNumber,
        cycleStartedAt,
        finalAssistantMessage: content,
        lastAdvanceAt: Date.now(),
        nextTurnIndex: 0,
        runStatusAfter: "awaiting_owner",
        transcript,
      }
    }
  }

  const lastAdvanceAt = Date.now()
  const nextTurnIndex = startTurnIndex + transcript.length
  const runStatusAfter =
    nextTurnIndex >= input.definition.turns.length ? "awaiting_owner" : "running"
  const normalizedNextTurnIndex =
    runStatusAfter === "awaiting_owner" ? 0 : nextTurnIndex
  const currentSpeakerKey =
    runStatusAfter === "running"
      ? input.definition.members.find(
          (member) =>
            member.memberKey === input.definition.turns[normalizedNextTurnIndex]?.memberKey
        )?.agentKey ?? null
      : null

  return {
    currentSpeakerKey,
    cycleNumber,
    cycleStartedAt,
    finalAssistantMessage:
      transcript[transcript.length - 1]?.content ??
      buildPresetTeamThreadGreeting(input.definition),
    lastAdvanceAt,
    nextTurnIndex: normalizedNextTurnIndex,
    runStatusAfter,
    transcript,
  }
}

export async function runPresetTeamRequestCycle(input: {
  definition: PresetTeamDefinition
  latestOwnerMessage?: string | null
  onStreamEvent?: (event: ChatAssistantStreamEvent) => void | Promise<void>
  provider: BorealProviderAdapter
  request: NonNullable<RequestExecutionContext>
  requestDetail?: RequestDetail | null
  runtimeConfig: RuntimeConfigShape
  roomState?: PresetTeamState | null
}) {
  const result = await runPresetTeamRequestCycleDetailed(input)

  return result.transcript.length > 0
    ? renderPresetTeamCycleMessage({
        definition: input.definition,
        transcript: result.transcript,
      })
    : result.finalAssistantMessage
}

export { buildPresetTeamThreadGreeting, renderPresetTeamCycleMessage }

async function emitPresetTeamTurnEvent(input: {
  content: string | null
  definition: PresetTeamDefinition
  member: PresetTeamMember
  onStreamEvent?: (event: ChatAssistantStreamEvent) => void | Promise<void>
  state: "complete" | "pending"
  turnIndex: number
}) {
  await input.onStreamEvent?.({
    payload: {
      content: input.content,
      displayName: input.member.displayName,
      memberKey: input.member.memberKey,
      roleLabel: input.member.roleLabel,
      state: input.state,
      teamDisplayName: input.definition.teamDisplayName,
      totalTurns: input.definition.turns.length,
      turnIndex: input.turnIndex,
    },
    type: "preset-team-turn",
  })
}

function buildPresetGreetingTurn(input: {
  cycleNumber: number
  greeting: string
  member: PresetTeamMember
  turnIndex: number
}) {
  return buildPresetTurnResult({
    content: input.greeting,
    cycleNumber: input.cycleNumber,
    member: input.member,
    turnIndex: input.turnIndex,
  })
}

function buildPresetTurnResult(input: {
  content: string
  cycleNumber: number
  member: PresetTeamMember
  turnIndex: number
}): PresetTeamTurnResult {
  return {
    content: input.content,
    cycleNumber: input.cycleNumber,
    displayName: input.member.displayName,
    memberKey: input.member.memberKey,
    roleLabel: input.member.roleLabel,
    senderExternalId: input.member.senderExternalId,
    senderHandle: input.member.senderHandle,
    turnIndex: input.turnIndex,
  }
}

function buildCycleRoomLedger(input: {
  cycleStartedAt: number | null
  definition: PresetTeamDefinition
  requestDetail?: RequestDetail | null
}) {
  const cycleBoundary = input.cycleStartedAt ?? 0
  const presetMemberLookup = new Map(
    input.definition.members.map((member) => [member.senderExternalId, member])
  )

  return (input.requestDetail?.messages ?? [])
    .filter((message) => message.createdAt >= cycleBoundary && message.role !== "system")
    .map((message) => {
      const presetMember =
        message.sender.externalId
          ? presetMemberLookup.get(message.sender.externalId)
          : null

      return {
        createdAt: message.createdAt,
        displayName: message.sender.displayName,
        handle: message.sender.handle,
        isOwner: Boolean(message.sender.isCurrentUser),
        memberKey: presetMember?.memberKey ?? null,
        role: presetMember?.roleLabel ?? (message.sender.isCurrentUser ? "Owner" : "Participant"),
        text: message.body.trim(),
      } satisfies RoomLedgerEntry
    })
    .filter((entry) => entry.text.length > 0)
}

function buildLatestModeratorFrame(input: {
  cycleStartedAt: number | null
  definition: PresetTeamDefinition
  requestDetail?: RequestDetail | null
  transcript: PresetTeamTurnResult[]
}) {
  const liveModeratorTurn =
    [...input.transcript].reverse().find((entry) => entry.memberKey === "moderator")

  if (liveModeratorTurn) {
    return liveModeratorTurn.content.trim()
  }

  const moderatorExternalId =
    input.definition.members.find((member) => member.memberKey === "moderator")
      ?.senderExternalId ?? null

  if (!moderatorExternalId) {
    return ""
  }

  return (
    [...(input.requestDetail?.messages ?? [])]
      .reverse()
      .find(
        (message) =>
          message.createdAt >= (input.cycleStartedAt ?? 0) &&
          message.sender.externalId === moderatorExternalId
      )
      ?.body.trim() ?? ""
  )
}

function buildLatestOwnerScenario(requestDetail?: RequestDetail | null) {
  return (
    [...(requestDetail?.messages ?? [])]
      .reverse()
      .find((message) => message.sender.isCurrentUser)
      ?.body.trim() ?? ""
  )
}

function moderatorAllowsProceed(content: string) {
  return /^scope:\s*proceed\b/i.test(content.trim())
}

function renderCycleTranscript(transcript: PresetTeamTurnResult[]) {
  return transcript
    .map(
      (entry) =>
        `${entry.displayName} (${entry.roleLabel})\n${entry.content.trim()}`
    )
    .join("\n\n")
}

function renderRoomLedger(entries: RoomLedgerEntry[]) {
  return entries
    .map((entry) => `${entry.displayName} (${entry.role})\n${entry.text}`)
    .join("\n\n")
}

function sanitizeTurnContent(value: string, displayName: string) {
  return value.trim().replace(new RegExp(`^${displayName}:\\s*`, "i"), "")
}

function normalizeDebateRequest(message: string) {
  return message.trim().replace(/^debate[:\s-]*/i, "")
}

function isClearlyOutsideProfessionalDebateScope(message: string) {
  const normalized = message.trim().toLowerCase()

  if (!normalized) {
    return false
  }

  const hasProfessionalHint = PROFESSIONAL_SCOPE_HINTS.some((hint) =>
    normalized.includes(hint)
  )

  if (hasProfessionalHint) {
    return false
  }

  return CLEARLY_NON_PROFESSIONAL_SCOPE_HINTS.some((hint) =>
    normalized.includes(hint)
  )
}

function isGreetingLikePresetTeamMessage(message: string) {
  const normalized = message.trim().toLowerCase()

  if (!normalized) {
    return true
  }

  return /^(hi|hello|hey|yo|sup|hola|good morning|good afternoon|good evening)[!.?\s]*$/.test(
    normalized
  )
}

function isRetryablePresetTeamGenerationError(error: unknown) {
  const message =
    error instanceof Error
      ? error.message.toLowerCase()
      : String(error).toLowerCase()
  const status =
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    typeof (error as { status?: unknown }).status === "number"
      ? ((error as { status: number }).status as number)
      : null

  if (
    status !== null &&
    PRESET_TEAM_GENERATION_RETRYABLE_STATUS_CODES.includes(
      status as (typeof PRESET_TEAM_GENERATION_RETRYABLE_STATUS_CODES)[number]
    )
  ) {
    return true
  }

  return /429|limit|rate|quota|timeout|temporar|unavailable|overloaded|fetch failed|network|try again/i.test(
    message
  )
}
