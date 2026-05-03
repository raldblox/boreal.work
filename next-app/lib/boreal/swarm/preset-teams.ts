import type { CatalogEntry } from "../integrations/convex/function-refs"

export type PresetTeamExecutionMode =
  | "fanout_merge"
  | "lead_only"
  | "sequential_handoff"

export type PresetTeamPattern = "debate_and_verdict"

export type PresetTeamKey = "debate-and-verdict"

export type PresetTeamAccentTone =
  | "amber"
  | "emerald"
  | "sky"
  | "violet"

export type PresetTeamMemberPreview = {
  accentTone: PresetTeamAccentTone
  displayName: string
  initials: string
  memberKey: string
  roleLabel: string
}

export type PresetTeamMember = PresetTeamMemberPreview & {
  agentKey: string
  replyPolicy: "lead_only" | "mention_only"
  role: "lead" | "validator" | "worker"
  senderExternalId: string
  senderHandle: string
  systemPrompt: string
}

export type PresetTeamTurn = {
  memberKey: string
  turnKey:
    | "affirmative_case"
    | "affirmative_rebuttal"
    | "judge_verdict"
    | "moderator_frame"
    | "negative_case"
    | "negative_rebuttal"
  turnPrompt: string
}

export type PresetTeamDefinition = {
  description: string
  executionMode: PresetTeamExecutionMode
  key: PresetTeamKey
  memberPreview: PresetTeamMemberPreview[]
  members: PresetTeamMember[]
  pattern: PresetTeamPattern
  professionalScopeDescription: string
  professionalScopeRefusal: string
  starterPrompts: Array<{
    prompt: string
    title: string
  }>
  subtitle: string
  summary: string
  teamDisplayName: string
  turns: PresetTeamTurn[]
}

const PRESET_TEAM_SOURCE_CAPABILITY_PREFIX = "preset-team:"
export const PRESET_TEAM_FUNDED_START_SOL_AMOUNT = 0.001

const DEBATE_AND_VERDICT: PresetTeamDefinition = {
  description:
    "Open a structured comparison room where Mara frames the decision, two named voices argue both paths, and Jordan closes with a verdict in the same request thread.",
  executionMode: "sequential_handoff",
  key: "debate-and-verdict",
  memberPreview: [
    {
      accentTone: "sky",
      displayName: "Mara",
      initials: "M",
      memberKey: "moderator",
      roleLabel: "Moderator",
    },
    {
      accentTone: "emerald",
      displayName: "Avery",
      initials: "A",
      memberKey: "affirmative",
      roleLabel: "Case A",
    },
    {
      accentTone: "amber",
      displayName: "Blake",
      initials: "B",
      memberKey: "negative",
      roleLabel: "Case B",
    },
    {
      accentTone: "violet",
      displayName: "Jordan",
      initials: "J",
      memberKey: "judge",
      roleLabel: "Judge",
    },
  ],
  members: [
    {
      agentKey: "preset:debate-and-verdict:moderator",
      accentTone: "sky",
      displayName: "Mara",
      initials: "M",
      memberKey: "moderator",
      replyPolicy: "lead_only",
      role: "lead",
      roleLabel: "Moderator",
      senderExternalId: "agent:debate-and-verdict:mara",
      senderHandle: "mara",
      systemPrompt:
        "You are Mara, the moderator of a professional debate simulation. Consume the owner's raw prompt first. Define the motion precisely, assign Side A and Side B, keep everyone debating the same question, force practical decision criteria, reject strawmen, and keep the scope on business, product, market, strategy, technology, operations, or commercially useful buyer decisions. If the owner gives a broad X versus Y prompt, choose the most useful comparison frame, state the assumption clearly, and proceed instead of bouncing back for more scope.",
    },
    {
      agentKey: "preset:debate-and-verdict:affirmative",
      accentTone: "emerald",
      displayName: "Avery",
      initials: "A",
      memberKey: "affirmative",
      replyPolicy: "mention_only",
      role: "worker",
      roleLabel: "Case A",
      senderExternalId: "agent:debate-and-verdict:avery",
      senderHandle: "avery",
      systemPrompt:
        "You are Avery. You argue for Side A exactly as Mara defines it. Make the strongest serious case for that side with steelman reasoning, practical upside, execution logic, and evidence-based tradeoffs. Never use hype or empty optimism, and never redefine the comparison on your own.",
    },
    {
      agentKey: "preset:debate-and-verdict:negative",
      accentTone: "amber",
      displayName: "Blake",
      initials: "B",
      memberKey: "negative",
      replyPolicy: "mention_only",
      role: "worker",
      roleLabel: "Case B",
      senderExternalId: "agent:debate-and-verdict:blake",
      senderHandle: "blake",
      systemPrompt:
        "You are Blake. You argue for Side B exactly as Mara defines it. Attack assumptions, second-order effects, incentive problems, execution risk, and hidden costs in Side A, while making the strongest serious case for Side B. Respond directly to Avery instead of arguing against a weaker version.",
    },
    {
      agentKey: "preset:debate-and-verdict:judge",
      accentTone: "violet",
      displayName: "Jordan",
      initials: "J",
      memberKey: "judge",
      replyPolicy: "mention_only",
      role: "validator",
      roleLabel: "Judge",
      senderExternalId: "agent:debate-and-verdict:jordan",
      senderHandle: "jordan",
      systemPrompt:
        "You are Jordan, the judge. Decide which side argued better on evidence quality, internal logic, practicality, and uncertainty handling. Deliver a clear verdict, strongest point on each side, unresolved unknowns, and a practical recommendation.",
    },
  ],
  pattern: "debate_and_verdict",
  professionalScopeDescription:
    "Only run professional or commercially useful decision debates about business, product, market, strategy, technology, operations, or buyer-tradeoff scenarios.",
  professionalScopeRefusal:
    "This debate bundle is limited to professional or commercially useful decision scenarios. Reframe it as a business, product, market, strategy, technology, operations, or buyer choice and I will run the debate.",
  starterPrompts: [
    {
      prompt: "Debate: Stripe vs Lemon Squeezy for a global SaaS launch.",
      title: "Payments stack tradeoff",
    },
    {
      prompt: "Debate: Solana vs Base for an agentic commerce product.",
      title: "Chain selection tradeoff",
    },
    {
      prompt: "Debate: remote-first vs office-first for a 12-person startup.",
      title: "Team operating model",
    },
    {
      prompt:
        "Debate: open source vs closed model strategy for early revenue.",
      title: "Go-to-market strategy",
    },
  ],
  subtitle: "Structured comparison room",
  summary:
    "Moderator, two option voices, and a final judge verdict in one request thread.",
  teamDisplayName: "Debate and Verdict",
  turns: [
    {
      memberKey: "moderator",
      turnKey: "moderator_frame",
      turnPrompt:
        "Frame the exact comparison or motion, assign Side A and Side B, define decision criteria, make any necessary assumptions explicit, and reject the request only if it is outside professional or commercially useful scope.",
    },
    {
      memberKey: "affirmative",
      turnKey: "affirmative_case",
      turnPrompt:
        "Argue the strongest serious case for Side A against the criteria that Mara defined.",
    },
    {
      memberKey: "negative",
      turnKey: "negative_case",
      turnPrompt:
        "Rebut Avery directly and make the strongest serious case for Side B.",
    },
    {
      memberKey: "affirmative",
      turnKey: "affirmative_rebuttal",
      turnPrompt:
        "Respond directly to Blake's strongest objections without repeating the opening case for Side A.",
    },
    {
      memberKey: "negative",
      turnKey: "negative_rebuttal",
      turnPrompt:
        "Respond directly to Avery's rebuttal and sharpen the best remaining case for Side B.",
    },
    {
      memberKey: "judge",
      turnKey: "judge_verdict",
      turnPrompt:
        "Issue the final verdict, strongest point on each side, unresolved uncertainty, and the practical recommendation.",
    },
  ],
}

const PRESET_TEAMS: Record<PresetTeamKey, PresetTeamDefinition> = {
  "debate-and-verdict": DEBATE_AND_VERDICT,
}

export function buildPresetTeamSourceCapabilityId(key: PresetTeamKey) {
  return `${PRESET_TEAM_SOURCE_CAPABILITY_PREFIX}${key}`
}

export function getPresetTeamDefinition(key?: string | null) {
  if (!key) {
    return null
  }

  return PRESET_TEAMS[key as PresetTeamKey] ?? null
}

export function resolvePresetTeamDefinitionFromBlueprint(input?: {
  members?: Array<{ agentKey: string }>
  presetKey?: string
  teamDisplayName?: string
} | null) {
  if (!input) {
    return null
  }

  const byKey = getPresetTeamDefinition(input.presetKey)

  if (byKey) {
    return byKey
  }

  if (typeof input.teamDisplayName === "string") {
    const byTitle = Object.values(PRESET_TEAMS).find(
      (definition) => definition.teamDisplayName === input.teamDisplayName
    )

    if (byTitle) {
      return byTitle
    }
  }

  const memberKeys = new Set(
    (input.members ?? [])
      .map((member) => member.agentKey?.trim())
      .filter((value): value is string => Boolean(value))
  )

  if (memberKeys.size === 0) {
    return null
  }

  return (
    Object.values(PRESET_TEAMS).find((definition) =>
      definition.members.every((member) => memberKeys.has(member.agentKey))
    ) ?? null
  )
}

export function getPresetTeamDefinitionFromSourceCapabilityId(
  sourceCapabilityId?: string | null
) {
  if (
    typeof sourceCapabilityId !== "string" ||
    !sourceCapabilityId.startsWith(PRESET_TEAM_SOURCE_CAPABILITY_PREFIX)
  ) {
    return null
  }

  return (
    PRESET_TEAMS[
      sourceCapabilityId.slice(PRESET_TEAM_SOURCE_CAPABILITY_PREFIX.length) as PresetTeamKey
    ] ?? null
  )
}

export function getPresetTeamStarterPromptInventory(key?: string | null) {
  return [...(getPresetTeamDefinition(key)?.starterPrompts ?? [])]
}

export function getPresetTeamMemberByKey(
  definition: PresetTeamDefinition,
  memberKey: string
) {
  return (
    definition.members.find((member) => member.memberKey === memberKey) ?? null
  )
}

export function getPresetTeamMemberByAgentKey(
  definition: PresetTeamDefinition,
  agentKey: string
) {
  return (
    definition.members.find((member) => member.agentKey === agentKey) ?? null
  )
}

export function resolvePresetTeamDefinitionFromParticipants(
  participants?: Array<{
    displayName?: string | null
    externalId?: string | null
  }> | null
) {
  const safeParticipants = participants ?? []

  if (safeParticipants.length === 0) {
    return null
  }

  return (
    Object.values(PRESET_TEAMS).find((definition) =>
      definition.members.every((member) =>
        safeParticipants.some(
          (participant) =>
            participant.externalId === member.senderExternalId ||
            participant.displayName === member.displayName
        )
      )
    ) ?? null
  )
}

export function inferPresetTeamDefinitionFromRequestLike(input?: {
  assignedAgent?: string | null
  summary?: string | null
  title?: string | null
} | null) {
  if (!input) {
    return null
  }

  if (input.assignedAgent === DEBATE_AND_VERDICT.teamDisplayName) {
    return DEBATE_AND_VERDICT
  }

  const normalizedTitle = input.title?.trim().toLowerCase() ?? ""
  const normalizedSummary = input.summary?.trim().toLowerCase() ?? ""

  if (/^debate(?::|\s|$)/i.test(normalizedTitle)) {
    return DEBATE_AND_VERDICT
  }

  if (
    normalizedSummary.includes("request for a debate") ||
    normalizedSummary.includes("comparative debate") ||
    normalizedSummary.includes("ends with a judge verdict")
  ) {
    return DEBATE_AND_VERDICT
  }

  return null
}

export function listPublicPresetTeamCatalogEntries(): CatalogEntry[] {
  return Object.values(PRESET_TEAMS).map((definition) => ({
    _id: buildPresetTeamSourceCapabilityId(definition.key),
    actorKind: "agent",
    averageRating: null,
    brand: "Boreal",
    capabilityTags: [
      "debate",
      "simulation",
      "strategy",
      "tradeoff",
      "verdict",
    ],
    category: "advisory",
    checkoutProtocol: "custom",
    currency: "SOL",
    deliveryType: "instant",
    description: definition.description,
    estimatedDeliveryLabel: "Starts after funding",
    executionSurface: "sdk",
    executorUrl: null,
    fulfillmentKind: "service",
    gatedOutReasons: [],
    isCartEnabled: false,
    isPinned: false,
    matchReasons: [],
    matchScore: null,
    matchStage: null,
    paymentNetworkHints: [],
    paymentProtocol: "x402",
    priceAmount: PRESET_TEAM_FUNDED_START_SOL_AMOUNT,
    priceType: "fixed",
    requiresHumanApproval: false,
    reviewCount: 0,
    seller: {
      actorKind: "agent",
      displayName: "Boreal",
      handle: null,
      profileId: null,
    },
    sourceCapabilityId: buildPresetTeamSourceCapabilityId(definition.key),
    sourceListingUrl: null,
    sourceProviderKey: "manual",
    subtitle: definition.subtitle,
    supplyType: "collective",
    supportsDirectInvoke: true,
    supportsPrivyWallet: false,
    successProbability: null,
    title: definition.teamDisplayName,
    trustScore: 86,
  }))
}
