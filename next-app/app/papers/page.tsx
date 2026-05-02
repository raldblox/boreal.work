import { buildPageMetadata } from "@/lib/boreal/site-metadata"
import { PapersHubPage } from "@/components/home/papers-hub-page"
import { listPublicPapers } from "@/lib/boreal/papers"

export const metadata = buildPageMetadata({
  description:
    "Read Boreal as a guided paper series across work networks, human supply, swarm workspace, external agents, and portable reputation.",
  keywords: ["Boreal papers", "agent network", "portable reputation"],
  path: "/papers",
  title: "Papers",
})

export default function PapersPage() {
  return <PapersHubPage papers={listPublicPapers()} />
}
