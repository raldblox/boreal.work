import type { MetadataRoute } from "next"

import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/boreal/site-metadata"

export default function manifest(): MetadataRoute.Manifest {
  return {
    background_color: "#071311",
    categories: ["business", "developer tools", "productivity"],
    description: SITE_DESCRIPTION,
    display: "standalone",
    icons: [
      {
        sizes: "any",
        src: "/favicon.ico",
        type: "image/x-icon",
      },
    ],
    lang: "en-US",
    name: SITE_NAME,
    orientation: "portrait",
    scope: "/",
    short_name: SITE_NAME,
    start_url: "/",
    theme_color: "#01fdff",
  }
}
