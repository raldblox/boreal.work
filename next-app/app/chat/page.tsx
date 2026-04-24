import { Suspense } from "react";

import { ChatShell } from "@/components/chat/chat-shell";

export default function ChatPage() {
  return (
    <Suspense fallback={null}>
      <ChatShell />
    </Suspense>
  );
}
