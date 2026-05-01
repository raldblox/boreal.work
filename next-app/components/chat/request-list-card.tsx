"use client"

import { PresetTeamMemberIcons } from "@/components/chat/preset-team-member-icons"
import { AgentIdentityIcon } from "@/components/ui/agent-identity-icon"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import type { SidebarIntentPreview } from "@/lib/boreal/integrations/convex/function-refs"
import {
  inferPresetTeamDefinitionFromRequestLike,
  resolvePresetTeamDefinitionFromParticipants,
} from "@/lib/boreal/swarm/preset-teams"
import { cn } from "@/lib/utils"

import {
  getDefaultRequestNavigationView,
  getPreviewRequestNotificationCounts,
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
  const nonOwnerParticipants = intent.participants.filter(
    (participant) => participant.status !== "owner"
  )
  const presetDefinition =
    resolvePresetTeamDefinitionFromParticipants(nonOwnerParticipants) ??
    inferPresetTeamDefinitionFromRequestLike({
      assignedAgent: intent.assignedAgent,
      summary: intent.summary,
      title: intent.title,
    })
  const counts = getPreviewRequestNotificationCounts(intent)
  const defaultView = getDefaultRequestNavigationView(counts)

  return (
    <div
      className={cn(
        "space-y-3 rounded-xl px-3 py-3 transition-colors",
        selected
          ? "border-foreground/20 bg-foreground/5"
          : "border-border/80 hover:bg-background"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            <span>{formatSidebarStatus(intent.status)}</span>
            <span className="inline-block h-1 w-1 bg-border" />
            <span>{formatRelativeUpdate(intent.updatedAt)}</span>
          </div>
          <button
            className="mt-2 block w-full text-left"
            onClick={() => onOpen(intent, defaultView)}
            type="button"
          >
            <p className="line-clamp-1 text-sm font-medium">{intent.title}</p>
            <p className="mt-1 line-clamp-1 text-xs leading-5 text-muted-foreground">
              {intent.summary}
            </p>
          </button>
        </div>

      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <ParticipantAvatarRow
          onOpenParticipants={() => onOpen(intent, "participants")}
          participants={nonOwnerParticipants}
          presetDefinition={presetDefinition}
        />
      </div>
    </div>
  )
}

function ParticipantAvatarRow({
  onOpenParticipants,
  participants,
  presetDefinition,
}: {
  onOpenParticipants: () => void
  participants?: SidebarIntentPreview["participants"]
  presetDefinition?: ReturnType<typeof resolvePresetTeamDefinitionFromParticipants>
}) {
  const safeParticipants = participants ?? []

  if (safeParticipants.length === 0 && !presetDefinition) {
    return null
  }

  return (
    <TooltipProvider>
      <button
        className="flex items-center gap-2"
        onClick={onOpenParticipants}
        type="button"
      >
        {presetDefinition ? (
          <PresetTeamMemberIcons
            countLabel={`${presetDefinition.memberPreview.length} voices`}
            members={presetDefinition.memberPreview}
            size="sm"
          />
        ) : (
          safeParticipants.slice(0, 4).map((participant, index) => {
            return (
              <Tooltip key={`${participant.displayName}-${index}`}>
                <TooltipTrigger asChild>
                  <span
                    className={cn(
                      "relative -ml-1.5 flex size-7 items-center justify-center rounded-full border border-border bg-background text-muted-foreground first:ml-0"
                    )}
                  >
                    <AgentIdentityIcon
                      actorKind={participant.kind}
                      className="size-3.5"
                      displayName={participant.displayName}
                      externalId={participant.externalId}
                      handle={participant.handle}
                    />
                  </span>
                </TooltipTrigger>
                <TooltipContent side="top">
                  {participant.displayName}
                </TooltipContent>
              </Tooltip>
            )
          })
        )}
      </button>
    </TooltipProvider>
  )
}

function formatSidebarStatus(status: string) {
  return status.replaceAll("_", " ")
}

function formatRelativeUpdate(updatedAt: number) {
  const diff = Math.max(0, Date.now() - updatedAt)
  const minute = 60_000
  const hour = 60 * minute
  const day = 24 * hour

  if (diff < hour) {
    return `${Math.max(1, Math.round(diff / minute))}m`
  }

  if (diff < day) {
    return `${Math.max(1, Math.round(diff / hour))}h`
  }

  if (diff < 7 * day) {
    return `${Math.max(1, Math.round(diff / day))}d`
  }

  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
  }).format(new Date(updatedAt))
}
