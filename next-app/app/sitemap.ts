import type { MetadataRoute } from "next"

import { roadmapTickets } from "@/components/roadmap/roadmap-board-data"
import { listPublicPapers } from "@/lib/boreal/papers-data"
import { toAbsoluteUrl } from "@/lib/boreal/site-metadata"

const publicRoutes = [
  {
    changeFrequency: "weekly" as const,
    lastModified: "2026-04-30",
    path: "/",
    priority: 1,
  },
  {
    changeFrequency: "monthly" as const,
    lastModified: "2026-04-30",
    path: "/about",
    priority: 0.8,
  },
  {
    changeFrequency: "weekly" as const,
    lastModified: "2026-04-30",
    path: "/roadmap",
    priority: 0.9,
  },
  {
    changeFrequency: "weekly" as const,
    lastModified: "2026-04-30",
    path: "/agents",
    priority: 0.8,
  },
  {
    changeFrequency: "weekly" as const,
    lastModified: "2026-04-30",
    path: "/docs",
    priority: 0.78,
  },
  {
    changeFrequency: "weekly" as const,
    lastModified: "2026-04-28",
    path: "/papers",
    priority: 0.82,
  },
]

function getRoadmapLastModified() {
  return roadmapTickets
    .map((ticket) => ticket.updatedAt)
    .filter((value) => /^\d{4}-\d{2}-\d{2}$/.test(value))
    .sort()
    .at(-1)
}

export default function sitemap(): MetadataRoute.Sitemap {
  const roadmapLastModified = getRoadmapLastModified() ?? "2026-04-30"

  const paperEntries = listPublicPapers().map((paper) => ({
    changeFrequency: "monthly" as const,
    lastModified: paper.updatedAt,
    priority: paper.kind === "flagship" ? 0.8 : 0.72,
    url: toAbsoluteUrl(`/papers/${paper.slug}`).toString(),
  }))

  return [
    ...publicRoutes.map((route) => ({
      changeFrequency: route.changeFrequency,
      lastModified:
        route.path === "/" ||
        route.path === "/about" ||
        route.path === "/agents" ||
        route.path === "/docs"
          ? roadmapLastModified
          : route.lastModified,
      priority: route.priority,
      url: toAbsoluteUrl(route.path).toString(),
    })),
    ...paperEntries,
  ]
}
