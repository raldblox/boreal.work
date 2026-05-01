"use client"

import type {
  PresetTeamAccentTone,
  PresetTeamMemberPreview,
} from "@/lib/boreal/swarm/preset-teams"
import { cn } from "@/lib/utils"

export function PresetTeamMemberIcons({
  className,
  countLabel,
  members,
  size = "md",
}: {
  className?: string
  countLabel?: string | null
  members: PresetTeamMemberPreview[]
  size?: "md" | "sm"
}) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="-space-x-2 flex items-center">
        {members.map((member) => (
          <span
            className={cn(
              "inline-flex items-center justify-center rounded-full border font-medium",
              size === "sm" ? "size-6 text-[9px]" : "size-7 text-[10px]",
              getPresetTeamMemberAccentClasses(member.accentTone)
            )}
            key={member.memberKey}
            title={`${member.displayName} / ${member.roleLabel}`}
          >
            {member.initials}
          </span>
        ))}
      </div>
      {countLabel ? (
        <span className="text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
          {countLabel}
        </span>
      ) : null}
    </div>
  )
}

export function getPresetTeamMemberAccentClasses(tone?: PresetTeamAccentTone) {
  switch (tone) {
    case "emerald":
      return "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
    case "amber":
      return "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300"
    case "violet":
      return "border-violet-500/30 bg-violet-500/10 text-violet-700 dark:text-violet-300"
    case "sky":
    default:
      return "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300"
  }
}
