"use client"

import { BotIcon } from "lucide-react"

import { cn } from "@/lib/utils"

export function BorealAgentCue({
  className,
}: {
  className?: string
}) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5 text-xs text-muted-foreground",
        className
      )}
    >
      <BotIcon className="size-3.5 text-foreground" />
      <span className="font-medium text-foreground">Boreal Agent</span>
    </div>
  )
}
