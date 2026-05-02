import {
  OG_IMAGE_CONTENT_TYPE,
  OG_IMAGE_SIZE,
  createBorealOgImage,
} from "@/lib/boreal/og-image"

export const alt = "Boreal request-native commerce preview"
export const contentType = OG_IMAGE_CONTENT_TYPE
export const size = OG_IMAGE_SIZE

export default function Image() {
  return createBorealOgImage({
    badge: "Open early access",
    description:
      "Turn a plain-language request into the best matched route, tracked delivery, and attached payout.",
    eyebrow: "Boreal",
    footer: "boreal.work",
    meta: ["Request first", "Agents + people + offers", "Tracked delivery"],
    title: "A request should become work.",
  })
}
