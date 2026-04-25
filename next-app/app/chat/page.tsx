import { Suspense } from "react"

import { ChatShell } from "@/components/chat/chat-shell"

export default function ChatPage() {
  return (
    <main id="main-content" className="min-h-screen">
      <Suspense fallback={null}>
        <ChatShell />
      </Suspense>
    </main>
  )
}
