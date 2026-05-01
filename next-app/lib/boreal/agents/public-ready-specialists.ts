export type PublicReadySpecialistKey =
  | "copywriter"
  | "image-studio"
  | "motion-video-studio"
  | "mvp-architect"
  | "research-analyst"
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
    "copywriter",
    "image-studio",
    "voiceover-studio",
    "motion-video-studio",
    "mvp-architect",
    "research-analyst",
    "solana-operator",
    "startup-pressure-test",
  ] as const

const PUBLIC_READY_SPECIALIST_META: Record<
  PublicReadySpecialistKey,
  PublicReadySpecialistMeta
> = {
  copywriter: {
    displayName: "Copywriter",
    headline: "Direct product and launch copy",
    key: "copywriter",
    liveScope:
      "Returns structured landing-page, launch, email, and product copy in markdown through Boreal's direct text route.",
    model: "gpt-4.1-mini",
    profileBio:
      "Writes direct product, launch, and landing-page copy with clear structure, alternate hooks, and tone control.",
    providerCompany: "OpenAI",
    supplyDescription:
      "Direct product and launch copy for landing pages, emails, offer pages, and messaging drafts.",
  },
  "image-studio": {
    displayName: "Image Studio",
    headline: "Direct image generation",
    key: "image-studio",
    liveScope:
      "Generates one image asset directly in the request thread through Boreal's OpenAI-backed image route.",
    model: "gpt-image-1",
    profileBio:
      "Generates thumbnails, hero visuals, launch art, and product graphics through Boreal's direct image route.",
    providerCompany: "OpenAI",
    supplyDescription:
      "Direct image generation for thumbnails, hero visuals, product art, and launch graphics.",
  },
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
  "mvp-architect": {
    displayName: "MVP Architect",
    headline: "Direct MVP scoping and launch plan",
    key: "mvp-architect",
    liveScope:
      "Returns a smallest-possible MVP plan, one core assumption, and a two-week launch path in markdown.",
    model: "gpt-4.1-mini",
    profileBio:
      "Cuts a startup idea down to one testable assumption, minimum feature set, and two-week launch plan.",
    providerCompany: "OpenAI",
    supplyDescription:
      "Direct MVP scoping for founders who need one assumption, one launch path, and a sharply reduced feature set.",
  },
  "research-analyst": {
    displayName: "Research Analyst",
    headline: "Direct comparison and research memos",
    key: "research-analyst",
    liveScope:
      "Turns one research question into a concise memo with findings, comparison, recommendation, and unknowns.",
    model: "gpt-4.1-mini",
    profileBio:
      "Produces concise comparison briefs and decision-ready research memos for product, market, and operator questions.",
    providerCompany: "OpenAI",
    supplyDescription:
      "Direct research memos for comparisons, market scans, and decision support.",
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
