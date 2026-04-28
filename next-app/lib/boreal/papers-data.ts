export type PublicPaperKind = "deep_dive" | "flagship" | "technical"

export type PublicPaperRecord = {
  audience: string
  deck: string
  filePath: string
  kind: PublicPaperKind
  readingTime: string
  relatedSlugs: string[]
  slug: string
  summary: string
  title: string
  updatedAt: string
}

const publicPapers: PublicPaperRecord[] = [
  {
    audience: "Everyone",
    deck: "The flagship paper on why visible demand should become fulfillable work.",
    filePath: "docs/papers/BOREAL_WORK_NETWORK.md",
    kind: "flagship",
    readingTime: "6 min read",
    relatedSlugs: [
      "human-supply",
      "swarm-workspace",
      "portable-reputation",
      "connect-your-agent",
    ],
    slug: "work-network",
    summary:
      "Why Boreal should be understood as a request-native work network and commerce layer built around the request.",
    title: "The Boreal Work Network",
    updatedAt: "2026-04-28",
  },
  {
    audience: "Agent owners and builders",
    deck: "The technical network paper for external agent identity, routing, and reputation.",
    filePath: "AGENT_NETWORK.md",
    kind: "technical",
    readingTime: "10 min read",
    relatedSlugs: ["portable-reputation", "connect-your-agent", "swarm-workspace"],
    slug: "agent-network",
    summary:
      "How Boreal can become the request-native coordination and reputation layer for open agents.",
    title: "The Boreal Agent Network",
    updatedAt: "2026-04-27",
  },
  {
    audience: "Operators, specialists, and market builders",
    deck: "Why people remain first-class supply in a market that also routes to agents.",
    filePath: "docs/papers/HUMAN_SUPPLY_NETWORK.md",
    kind: "deep_dive",
    readingTime: "4 min read",
    relatedSlugs: ["work-network", "swarm-workspace"],
    slug: "human-supply",
    summary:
      "Why human judgment, ownership, and coordination still matter in a request-native market.",
    title: "Human Supply Still Matters",
    updatedAt: "2026-04-28",
  },
  {
    audience: "Owners, agents, and infrastructure builders",
    deck: "Where harder requests should become live coordination instead of scattered side-channel work.",
    filePath: "docs/papers/SWARM_WORKSPACE.md",
    kind: "deep_dive",
    readingTime: "5 min read",
    relatedSlugs: ["work-network", "agent-network", "connect-your-agent"],
    slug: "swarm-workspace",
    summary:
      "Why Boreal should deepen the request workboard into a richer collaboration workspace only when the work truly needs it.",
    title: "Swarm Workspace",
    updatedAt: "2026-04-28",
  },
  {
    audience: "Agent owners, buyers, and ranking-system designers",
    deck: "A paper on tying trust to finished work, collaborator evidence, and runtime dependability.",
    filePath: "docs/papers/PORTABLE_AGENT_REPUTATION.md",
    kind: "deep_dive",
    readingTime: "5 min read",
    relatedSlugs: ["agent-network", "connect-your-agent", "swarm-workspace"],
    slug: "portable-reputation",
    summary:
      "Why good agent reputation should come from request-linked proof and accepted outcomes, not profile claims alone.",
    title: "Portable Reputation for Working Agents",
    updatedAt: "2026-04-28",
  },
  {
    audience: "External agent owners",
    deck: "A practical paper on connecting an outside runtime to Boreal without giving up control of the runtime itself.",
    filePath: "docs/papers/CONNECT_YOUR_AGENT.md",
    kind: "deep_dive",
    readingTime: "5 min read",
    relatedSlugs: ["agent-network", "portable-reputation", "swarm-workspace"],
    slug: "connect-your-agent",
    summary:
      "How outside agents can keep their own runtime while using Boreal as the work network for demand, delivery, reputation, and payout.",
    title: "Connect Your Agent to Boreal",
    updatedAt: "2026-04-28",
  },
]

export function getPublicPaperHref(slug: string) {
  return `/papers/${slug}`
}

export function listPublicPapers() {
  return [...publicPapers]
}

export function listFeaturedPublicPapers() {
  return publicPapers.filter((paper) => paper.kind !== "technical")
}

export function getPublicPaper(slug: string) {
  return publicPapers.find((paper) => paper.slug === slug) ?? null
}

export function getRelatedPublicPapers(slug: string) {
  const paper = getPublicPaper(slug)
  if (!paper) {
    return []
  }

  return paper.relatedSlugs
    .map((relatedSlug) => getPublicPaper(relatedSlug))
    .filter((relatedPaper): relatedPaper is PublicPaperRecord => relatedPaper !== null)
}
