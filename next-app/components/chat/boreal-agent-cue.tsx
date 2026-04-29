"use client"

import { BotIcon, SparklesIcon, UserIcon, XIcon } from "lucide-react"

import { cn } from "@/lib/utils"

export function BorealAgentCue({
  actorKind = "agent",
  canClear = false,
  className,
  label = "Boreal Agent",
  onClear,
}: {
  actorKind?: "agent" | "human" | "tool"
  canClear?: boolean
  className?: string
  label?: string
  onClear?: () => void
}) {
  const Icon =
    actorKind === "human"
      ? UserIcon
      : actorKind === "tool"
        ? SparklesIcon
        : BotIcon

  return (
    <div
      className={cn(
        "group inline-flex max-w-full items-center gap-0 rounded-full border border-border bg-background px-2 py-1 text-xs text-muted-foreground transition-[border-color,background-color,box-shadow] duration-200 ease-out hover:border-border/80 hover:bg-muted/30",
        className
      )}
    >
      <span
        className={cn(
          "flex shrink-0 items-center justify-start overflow-hidden transition-[width] duration-200 ease-out",
          canClear ? "w-6 group-hover:w-0" : "w-6"
        )}
      >
        <Icon
          className={cn(
            "size-3.5 text-foreground transition-all duration-200 ease-out",
            canClear &&
              "group-hover:scale-0 group-hover:opacity-0"
          )}
        />
      </span>
      <span className="min-w-0 truncate font-medium text-foreground">
        {label}
      </span>
      {canClear ? (
        <button
          aria-label={`Clear ${label}`}
          className="inline-flex h-5 w-0 shrink-0 items-center justify-end overflow-hidden opacity-0 transition-[width,opacity] duration-200 ease-out pointer-events-none group-hover:w-6 group-hover:opacity-100 group-hover:pointer-events-auto focus-visible:w-6 focus-visible:opacity-100 focus-visible:pointer-events-auto focus-visible:outline-none"
          onClick={onClear}
          type="button"
        >
          <span className="flex size-5 items-center justify-center rounded-full bg-red-500/12 text-red-600 transition-[background-color,color,transform] duration-200 ease-out group-hover:bg-red-500/18 group-hover:text-red-700 focus-visible:bg-red-500/18 focus-visible:text-red-700 dark:bg-red-500/18 dark:text-red-300 dark:group-hover:bg-red-500/24 dark:group-hover:text-red-200 dark:focus-visible:bg-red-500/24 dark:focus-visible:text-red-200">
            <XIcon className="size-3 scale-75 transition-transform duration-200 ease-out group-hover:scale-100 focus-visible:scale-100" />
          </span>
        </button>
      ) : null}
    </div>
  )
}
