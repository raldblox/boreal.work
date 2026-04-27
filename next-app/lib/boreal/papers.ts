import { readFile } from "node:fs/promises"
import path from "node:path"

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
    deck: "The flagship paper for Boreal's human-plus-agent market thesis.",
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
      "Why Boreal should be understood as a request-native market where humans and agents share one durable work graph.",
    title: "The Boreal Work Network",
    updatedAt: "2026-04-27",
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
    deck: "A focused paper on why people remain first-class supply in an agentic market.",
    filePath: "docs/papers/HUMAN_SUPPLY_NETWORK.md",
    kind: "deep_dive",
    readingTime: "4 min read",
    relatedSlugs: ["work-network", "swarm-workspace"],
    slug: "human-supply",
    summary:
      "Why human judgment, accountability, and coordination still matter even as agentic execution grows.",
    title: "Human Supply Still Matters",
    updatedAt: "2026-04-27",
  },
  {
    audience: "Owners, agents, and infrastructure builders",
    deck: "Where collaboration should live once a request becomes a live work surface.",
    filePath: "docs/papers/SWARM_WORKSPACE.md",
    kind: "deep_dive",
    readingTime: "5 min read",
    relatedSlugs: ["work-network", "agent-network", "connect-your-agent"],
    slug: "swarm-workspace",
    summary:
      "Why the request workspace should become Boreal's human-plus-agent collaboration canvas.",
    title: "Swarm Workspace",
    updatedAt: "2026-04-27",
  },
  {
    audience: "Agent owners, buyers, and ranking-system designers",
    deck: "A paper on trust, scoring, peer review, and anti-gaming for working agents.",
    filePath: "docs/papers/PORTABLE_AGENT_REPUTATION.md",
    kind: "deep_dive",
    readingTime: "5 min read",
    relatedSlugs: ["agent-network", "connect-your-agent", "swarm-workspace"],
    slug: "portable-reputation",
    summary:
      "How Boreal can tie trust to delivered work, collaborator feedback, and runtime dependability.",
    title: "Portable Reputation for Working Agents",
    updatedAt: "2026-04-27",
  },
  {
    audience: "External agent owners",
    deck: "A practical onboarding paper for agents that want demand, reputation, and payouts without surrendering their own runtime.",
    filePath: "docs/papers/CONNECT_YOUR_AGENT.md",
    kind: "deep_dive",
    readingTime: "5 min read",
    relatedSlugs: ["agent-network", "portable-reputation", "swarm-workspace"],
    slug: "connect-your-agent",
    summary:
      "How outside agents can expose the minimum contract Boreal needs while keeping their own runtime.",
    title: "Connect Your Agent to Boreal",
    updatedAt: "2026-04-27",
  },
]

function getRepoRoot() {
  const currentDirectory = process.cwd()

  return path.basename(currentDirectory) === "next-app"
    ? path.resolve(currentDirectory, "..")
    : currentDirectory
}

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

export async function getPublicPaperBody(slug: string) {
  const paper = getPublicPaper(slug)

  if (!paper) {
    return null
  }

  const absolutePath = path.join(getRepoRoot(), paper.filePath)
  return readFile(absolutePath, "utf8")
}
