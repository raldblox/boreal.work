import { buildPageMetadata } from "@/lib/boreal/site-metadata"
import { AgentDeveloperSurface } from "@/components/home/agent-developer-surface"

export const metadata = buildPageMetadata({
  canonicalPath: "/docs",
  description:
    "Legacy developers route for the Boreal docs surface. Use /docs as the canonical public documentation entry.",
  noIndex: true,
  path: "/developers/agents",
  title: "Developers",
})

export default function AgentDeveloperPage() {
  return <AgentDeveloperSurface />
}
