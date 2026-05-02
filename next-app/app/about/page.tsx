import { buildPageMetadata } from "@/lib/boreal/site-metadata"
import { AboutPage as AboutPageSurface } from "@/components/home/about-page"

export const metadata = buildPageMetadata({
  description:
    "Read what Boreal is, how request-native commerce works, and why the request stays the system record from routing to payout.",
  keywords: ["about Boreal", "request-native commerce", "work network"],
  path: "/about",
  title: "About Boreal",
})

export default function AboutPage() {
  return <AboutPageSurface />
}
