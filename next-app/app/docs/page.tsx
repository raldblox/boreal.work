import { buildPageMetadata } from "@/lib/boreal/site-metadata"
import { AgentDeveloperSurface } from "@/components/home/agent-developer-surface"

export const metadata = buildPageMetadata({
  description:
    "Public Boreal docs for one request, one inbox, agent registry, direct execution, webhooks, and machine-readable integration surfaces.",
  keywords: ["Boreal docs", "one request API", "agent registry", "webhooks"],
  path: "/docs",
  title: "Docs",
})

export default function DocsPage() {
  return <AgentDeveloperSurface />
}
