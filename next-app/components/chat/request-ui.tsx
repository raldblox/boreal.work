"use client"

import {
  CheckIcon,
  CircleDotIcon,
  Clock3Icon,
  PackageIcon,
  SearchIcon,
  SparklesIcon,
} from "lucide-react"

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

export function getRequestStage(status: string) {
  if (status === "fulfilled") {
    return 3
  }

  if (
    status === "open" ||
    status === "claimed" ||
    status === "in_progress" ||
    status === "blocked"
  ) {
    return 2
  }

  if (status === "proposed" || status === "closed") {
    return 1
  }

  return 0
}

export function getRequestStatusLabel(status: string) {
  if (status === "proposed") {
    return "Waiting for approval"
  }

  if (status === "open") {
    return "Waiting for workers"
  }

  if (status === "claimed") {
    return "Assigned"
  }

  if (status === "in_progress") {
    return "Working"
  }

  if (status === "blocked") {
    return "Blocked"
  }

  if (status === "fulfilled") {
    return "Delivered"
  }

  if (status === "closed") {
    return "Closed"
  }

  return status.replaceAll("_", " ")
}

export function RequestStatusBadge({ status }: { status: string }) {
  const label = getRequestStatusLabel(status)
  const Icon =
    status === "fulfilled"
      ? CheckIcon
      : status === "claimed" || status === "in_progress"
        ? SparklesIcon
        : status === "proposed"
          ? Clock3Icon
          : CircleDotIcon

  return (
    <span className="inline-flex items-center gap-1 border border-border px-2 py-1 text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
      <Icon className="size-3" />
      {label}
    </span>
  )
}

export function RequestStageRail({ status }: { status: string }) {
  const stage = getRequestStage(status)
  const stages = [
    { icon: SearchIcon, label: "Scope" },
    { icon: CheckIcon, label: "Approve" },
    { icon: SparklesIcon, label: "Active" },
    { icon: PackageIcon, label: "Deliver" },
  ] as const
  const isWorking = status === "claimed" || status === "in_progress"

  return (
    <TooltipProvider>
      <div className="w-full max-w-xs">
        <div className="grid w-full grid-cols-[1fr_1fr_1fr_1fr] items-center">
          {stages.map((stageItem, index) => {
            const isComplete = index < stage
            const isCurrent = index === stage
            const shouldPulse = isCurrent && index === 2 && isWorking
            const Icon = stageItem.icon

            return (
              <div className="relative flex items-center" key={stageItem.label}>
                {index < stages.length - 1 ? (
                  <div
                    className={cn(
                      "absolute top-1/2 right-0 left-1/2 h-0.5 -translate-y-1/2 bg-border",
                      (isComplete || isCurrent) && "bg-primary/70"
                    )}
                  />
                ) : null}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      aria-label={stageItem.label}
                      className={cn(
                        "relative z-10 mx-auto flex size-5 items-center justify-center rounded-full border-2 bg-background transition-colors",
                        isComplete || isCurrent
                          ? "border-primary text-primary"
                          : "border-foreground/20 text-muted-foreground",
                        shouldPulse &&
                          "animate-pulse shadow-[0_0_0_6px_rgba(34,211,238,0.12)]"
                      )}
                    >
                      <Icon className="size-2.5" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top" sideOffset={1}>
                    {stageItem.label}
                  </TooltipContent>
                </Tooltip>
              </div>
            )
          })}
        </div>
      </div>
    </TooltipProvider>
  )
}

export function formatRequestDate(value: number | null | undefined) {
  if (!value) {
    return null
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value)
}

export function formatOutputTypes(values: string[]) {
  return values.map((value) => value.replaceAll("_", " ")).join(" / ")
}
