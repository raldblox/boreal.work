"use client"

import {
  CheckIcon,
  CircleDotIcon,
  Clock3Icon,
  SparklesIcon,
} from "lucide-react"

export function getRequestStatusLabel(status: string) {
  if (status === "proposed") {
    return "Waiting for approval"
  }

  if (status === "open") {
    return "Waiting for team"
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
