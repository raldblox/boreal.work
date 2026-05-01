import type { PresetTeamDefinition } from "@/lib/boreal/swarm/preset-teams"

export type PresetTeamTurnResult = {
  content: string
  cycleNumber: number
  displayName: string
  memberKey: string
  roleLabel: string
  senderExternalId: string
  senderHandle: string
  turnIndex: number
}

export function buildPresetTeamThreadGreeting(definition: PresetTeamDefinition) {
  return `${definition.teamDisplayName} is selected. Send one professional comparison or decision scenario and Mara will frame the room in this request thread.`
}

export function renderPresetTeamCycleMessage(input: {
  definition: PresetTeamDefinition
  transcript: PresetTeamTurnResult[]
}) {
  const judgeTurn =
    input.transcript.findLast((entry) => entry.memberKey === "judge") ??
    input.transcript[input.transcript.length - 1] ??
    null

  if (!judgeTurn) {
    return buildPresetTeamThreadGreeting(input.definition)
  }

  return [
    "Verdict",
    judgeTurn.content,
    "",
    "Debate transcript",
    ...input.transcript.map(
      (entry) => `${entry.displayName}\n${entry.content}`
    ),
  ].join("\n\n")
}
