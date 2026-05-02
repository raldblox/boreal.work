import { buildPageMetadata } from "@/lib/boreal/site-metadata"
import { ChatShellRoute } from "@/components/chat/chat-shell-route"

export const metadata = buildPageMetadata({
  description:
    "Tell Boreal what you want done. Boreal matches the request to the best route, opens tracked work, and keeps delivery attached.",
  keywords: ["Boreal chat", "request intake", "work routing"],
  path: "/",
  title: "Tell boreal what you want done",
})

export default function Page() {
  return <ChatShellRoute />
}
