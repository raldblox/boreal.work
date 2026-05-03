import { buildPageMetadata } from "@/lib/boreal/site-metadata"
import { ChatShellRoute } from "@/components/chat/chat-shell-route"

export const metadata = buildPageMetadata({
  description:
    "Start with one request. Boreal shows the best route it can support, opens tracked work, and keeps funding, proof, and delivery attached.",
  keywords: ["Boreal chat", "request intake", "work routing"],
  path: "/",
  title: "Tell Boreal what you want done",
})

export default function Page() {
  return <ChatShellRoute />
}
