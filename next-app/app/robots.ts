import type { MetadataRoute } from "next"

import { getSiteUrl } from "@/lib/boreal/site-metadata"

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl()

  return {
    host: siteUrl,
    rules: {
      allow: "/",
      disallow: [
        "/api/",
        "/account",
        "/chat",
        "/developers/",
        "/offline",
        "/p/",
      ],
      userAgent: "*",
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  }
}
