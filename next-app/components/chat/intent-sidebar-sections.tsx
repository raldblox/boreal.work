"use client"

import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import type {
  ConversationSidebarPreview,
  SidebarIntentPreview,
} from "@/lib/boreal/integrations/convex/function-refs"
import type { RequestNavigationView } from "@/components/chat/request-notifications"

import { RequestListCard } from "./request-list-card"

type ConversationSidebarSectionProps = {
  conversations: ConversationSidebarPreview[]
  onOpenConversationRequest?: (conversation: ConversationSidebarPreview) => void
  onSelectConversation?: (conversation: ConversationSidebarPreview) => void
  selectedConversationId: string | null
  selectedIntentId: string | null
}

type RequestSidebarSectionProps = {
  intents: SidebarIntentPreview[]
  onSelect: (intent: SidebarIntentPreview, view?: RequestNavigationView) => void
  selectedIntentId: string | null
}

export function ConversationSidebarSection({
  conversations,
  onOpenConversationRequest,
  onSelectConversation,
  selectedConversationId,
  selectedIntentId,
}: ConversationSidebarSectionProps) {
  return (
    <>
      <div className="px-4 py-3">
        <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
          History
        </p>
      </div>

      <ScrollArea className="max-h-64 shrink-0">
        <div className="space-y-2 px-4 pb-4">
          {conversations.length === 0 ? (
            <SidebarEmptyState copy="Your recent home chats will appear here." />
          ) : (
            conversations.map((conversation) => {
              const isActive =
                !selectedIntentId &&
                conversation.conversationId === selectedConversationId
              const latestOpenableRequest =
                conversation.linkedRequests.find(
                  (linkedRequest) => linkedRequest.status !== "proposed"
                ) ?? null

              return (
                <div
                  className={`rounded-xl border transition-colors ${
                    isActive
                      ? "border-foreground/20 bg-foreground/5"
                      : "border-border bg-background hover:bg-muted/30"
                  }`}
                  key={conversation.conversationId}
                >
                  <button
                    className="w-full px-4 py-3 text-left"
                    onClick={() => onSelectConversation?.(conversation)}
                    type="button"
                  >
                    <div className="space-y-1.5">
                      <p className="truncate text-sm font-medium">
                        {conversation.title}
                      </p>
                      <p className="line-clamp-2 text-xs text-muted-foreground">
                        {conversation.lastMessageBody ?? "Conversation thread"}
                      </p>
                    </div>
                  </button>
                  {conversation.linkedRequests.length > 0 ? (
                    <div className="flex items-center justify-between gap-2 border-t border-border px-4 py-2">
                      <p className="truncate text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                        History · {conversation.linkedRequests.length} work{" "}
                        {conversation.linkedRequests.length === 1 ? "item" : "items"}
                      </p>
                      {latestOpenableRequest ? (
                        <Button
                          onClick={() =>
                            onOpenConversationRequest?.(conversation)
                          }
                          size="sm"
                          type="button"
                          variant="ghost"
                        >
                          Open latest
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          Pending draft
                        </span>
                      )}
                    </div>
                  ) : null}
                </div>
              )
            })
          )}
        </div>
      </ScrollArea>
    </>
  )
}

export function RequestSidebarSection({
  intents,
  onSelect,
  selectedIntentId,
}: RequestSidebarSectionProps) {
  return (
    <>
      <div className="px-4 py-3">
        <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
          Your requests
        </p>
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <div className="space-y-2 px-4 pb-4">
          {intents.length === 0 ? (
            <SidebarEmptyState copy="Active requests appear here once Boreal turns a live ask into tracked work." />
          ) : (
            intents.map((intent) => (
              <RequestListCard
                intent={intent}
                key={intent._id}
                onOpen={onSelect}
                selected={intent._id === selectedIntentId}
              />
            ))
          )}
        </div>
      </ScrollArea>
    </>
  )
}

function SidebarEmptyState({ copy }: { copy: string }) {
  return (
    <div className="rounded-xl border border-dashed border-border px-4 py-4 text-sm text-muted-foreground">
      {copy}
    </div>
  )
}
