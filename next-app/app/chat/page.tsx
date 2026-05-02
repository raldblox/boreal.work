import { buildPageMetadata } from "@/lib/boreal/site-metadata"
import { ChatShellRoute } from "@/components/chat/chat-shell-route"

export const metadata = buildPageMetadata({
  canonicalPath: "/",
  description:
    "Legacy Boreal chat route. The canonical public request surface is the homepage.",
  noIndex: true,
  path: "/chat",
  title: "Boreal chat",
})

export default function ChatPage() {
  return <ChatShellRoute />
}
