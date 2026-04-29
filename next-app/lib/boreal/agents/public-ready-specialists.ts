export type PublicReadySpecialistKey =
  | "motion-video-studio"
  | "solana-operator"
  | "startup-pressure-test"
  | "voiceover-studio"

export type PublicReadySpecialistMeta = {
  displayName: string
  headline: string
  key: PublicReadySpecialistKey
  liveScope: string
  model: string
  profileBio: string
  providerCompany: string
  supplyDescription: string
}

export const PUBLIC_READY_SPECIALIST_KEYS: ReadonlyArray<PublicReadySpecialistKey> =
  [
    "voiceover-studio",
    "motion-video-studio",
    "solana-operator",
    "startup-pressure-test",
  ] as const

const PUBLIC_READY_SPECIALIST_META: Record<
  PublicReadySpecialistKey,
  PublicReadySpecialistMeta
> = {
  "motion-video-studio": {
    displayName: "Video Generation",
    headline: "Direct short video generation",
    key: "motion-video-studio",
    liveScope:
      "Starts a short video-generation job and keeps the request updated until the render is ready.",
    model: "sora-2",
    profileBio:
      "Starts short video-generation jobs for product shots, visual loops, and launch visuals. It is not a full motion studio or edit suite.",
    providerCompany: "OpenAI",
    supplyDescription:
      "Direct short video generation for product shots, loops, and launch visuals.",
  },
  "solana-operator": {
    displayName: "Solana Operator",
    headline: "Planning-first Solana specialist",
    key: "solana-operator",
    liveScope:
      "Plans non-custodial Solana work, and in mounted threads can do wallet-approved message signing, memo recording, and simple SOL transfer.",
    model: "gpt-4.1-mini",
    profileBio:
      "Plans non-custodial Solana work, wallet approvals, and risk checks. Mounted request threads can also do explicit wallet-approved message signing, memo recording, and simple SOL transfer.",
    providerCompany: "OpenAI",
    supplyDescription:
      "Planning-first Solana specialist for non-custodial execution plans, approval steps, and risk notes.",
  },
  "startup-pressure-test": {
    displayName: "Startup Pressure Test",
    headline: "Direct early-stage idea pressure test",
    key: "startup-pressure-test",
    liveScope:
      "Returns a direct early-stage pressure test in markdown with assumptions, failure modes, and a blunt verdict.",
    model: "gpt-4.1-mini",
    profileBio:
      "Pressure tests early startup ideas against one core assumption, likely failure modes, and whether the problem is painful enough to pay for.",
    providerCompany: "OpenAI",
    supplyDescription:
      "Direct early-stage pressure test for startup ideas before a founder spends time building the wrong thing.",
  },
  "voiceover-studio": {
    displayName: "Voiceover Studio",
    headline: "Direct voice generation for finished narration",
    key: "voiceover-studio",
    liveScope:
      "Turns a script into an MP3 voiceover in the same request thread.",
    model: "gpt-4o-mini-tts",
    profileBio:
      "Turns scripts into MP3 voiceovers for demos, explainers, and launch narration with a clear, controllable read.",
    providerCompany: "OpenAI",
    supplyDescription:
      "Direct voice generation for demo narration, explainers, and short product voiceovers.",
  },
}

export function getAutonomousAgentKeyFromSourceCapabilityId(
  sourceCapabilityId?: string | null,
) {
  if (
    typeof sourceCapabilityId !== "string" ||
    !sourceCapabilityId.startsWith("autonomous-agent:")
  ) {
    return null
  }

  return sourceCapabilityId.slice("autonomous-agent:".length) || null
}

export function getPublicReadySpecialistMeta(
  agentKey?: string | null,
): PublicReadySpecialistMeta | null {
  if (!agentKey) {
    return null
  }

  return (
    PUBLIC_READY_SPECIALIST_META[agentKey as PublicReadySpecialistKey] ?? null
  )
}

export function getPublicReadySpecialistMetaByHandle(
  handle?: string | null,
) {
  return getPublicReadySpecialistMeta(handle)
}

export function getPublicReadySpecialistMetaBySourceCapabilityId(
  sourceCapabilityId?: string | null,
) {
  return getPublicReadySpecialistMeta(
    getAutonomousAgentKeyFromSourceCapabilityId(sourceCapabilityId),
  )
}

export function isPublicReadySpecialistKey(agentKey?: string | null) {
  return Boolean(getPublicReadySpecialistMeta(agentKey))
}

export function getPublicReadySpecialistDisplayName(
  agentKey?: string | null,
  fallback?: string | null,
) {
  return getPublicReadySpecialistMeta(agentKey)?.displayName ?? fallback ?? null
}
