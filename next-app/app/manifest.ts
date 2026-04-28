import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    background_color: "#fbfbfb",
    description: "Chat-native market for request-native commerce.",
    display: "standalone",
    icons: [
      {
        sizes: "any",
        src: "/favicon.ico",
        type: "image/x-icon",
      },
    ],
    name: "Boreal",
    scope: "/",
    short_name: "Boreal",
    start_url: "/",
    theme_color: "#01fdff",
  }
}
