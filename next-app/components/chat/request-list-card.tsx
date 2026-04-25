"use client"

import { BotIcon, PackageIcon, UserIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import type { SidebarIntentPreview } from "@/lib/boreal/integrations/convex/function-refs"
import { cn } from "@/lib/utils"

import {
  formatNotificationCount,
  getDefaultRequestNavigationView,
  getPreviewRequestNotificationCounts,
  getRequestNotificationTotal,
  type RequestNavigationView,
} from "./request-notifications"

type RequestListCardProps = {
  intent: SidebarIntentPreview
  onOpen: (intent: SidebarIntentPreview, view?: RequestNavigationView) => void
  selected?: boolean
}

export function RequestListCard({
  intent,
  onOpen,
  selected = false,
}: RequestListCardProps) {
  const counts = getPreviewRequestNotificationCounts(intent)
  const total = getRequestNotificationTotal(counts)
  const defaultView = getDefaultRequestNavigationView(counts)

  return (
    <div
      className={cn(
        "space-y-3 rounded-xl border p-3 transition-colors",
        selected
          ? "border-primary/20 bg-accent/40"
          : "border-transparent hover:border-border hover:bg-foreground/5"
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-border bg-background/80 text-muted-foreground">
          <PackageIcon className="size-4" />
        </div>
        <button
          className="min-w-0 flex-1 text-left"
          onClick={() => onOpen(intent, defaultView)}
          type="button"
        >
          <p className="line-clamp-1 text-sm font-medium">{intent.title}</p>
          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
            {intent.summary}
          </p>
        </button>
        {total > 0 ? (
          <button
            aria-label={`Open request updates for ${intent.title}`}
            className="inline-flex size-7 shrink-0 items-center justify-center rounded-full border border-primary/20 bg-primary/10 text-[11px] font-medium text-primary transition-colors hover:bg-primary/15"
            onClick={() => onOpen(intent, defaultView)}
            type="button"
          >
            {formatNotificationCount(total)}
          </button>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <ParticipantAvatarRow participants={intent.participants} />
        <div className="flex flex-wrap items-center gap-1.5">
          {counts.participants > 0 ? (
            <Button
              className="h-6 rounded-full px-2.5 text-[11px] tracking-[0.16em] uppercase"
              onClick={() => onOpen(intent, "participants")}
              size="sm"
              type="button"
              variant="ghost"
            >
              Participants
              {formatNotificationCount(counts.participants)}
            </Button>
          ) : null}
          {counts.workspace > 0 ? (
            <Button
              className="h-6 rounded-full px-2.5 text-[11px] tracking-[0.16em] uppercase"
              onClick={() => onOpen(intent, "workspace")}
              size="sm"
              type="button"
              variant="outline"
            >
              Pending
              <span className="text-primary">
                {formatNotificationCount(counts.workspace)}
              </span>
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  )
}

function ParticipantAvatarRow({
  participants,
}: {
  participants?: SidebarIntentPreview["participants"]
}) {
  const safeParticipants = participants ?? []

  if (safeParticipants.length === 0) {
    return null
  }

  return (
    <TooltipProvider>
      <div className="flex items-center">
        {safeParticipants.slice(0, 4).map((participant, index) => {
          const Icon = participant.kind === "agent" ? BotIcon : UserIcon

          return (
            <Tooltip key={`${participant.displayName}-${index}`}>
              <TooltipTrigger asChild>
                <span
                  className={cn(
                    "relative -ml-1.5 flex size-7 items-center justify-center rounded-full border border-border bg-background text-muted-foreground first:ml-0"
                  )}
                >
                  <Icon className="size-3.5" />
                </span>
              </TooltipTrigger>
              <TooltipContent side="top">
                {participant.displayName}
              </TooltipContent>
            </Tooltip>
          )
        })}
      </div>
    </TooltipProvider>
  )
}
