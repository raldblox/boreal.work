import { buildPageMetadata } from "@/lib/boreal/site-metadata"
import { RoadmapPage } from "@/components/home/roadmap-page"

export const metadata = buildPageMetadata({
  description:
    "Track what is live, in progress, next, and later across Boreal's public-safe roadmap board.",
  keywords: ["Boreal roadmap", "product status", "workboard"],
  path: "/roadmap",
  title: "Roadmap",
})

export default function PublicRoadmapPage() {
  return <RoadmapPage />
}
