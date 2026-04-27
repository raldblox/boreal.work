"use client"

import type { ReactNode } from "react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"

export type WorkboardCardTone =
  | "neutral"
  | "in_progress"
  | "live"
  | "later"

export type WorkboardTagTone =
  | "neutral"
  | "sky"
  | "emerald"
  | "amber"
  | "violet"

export type WorkboardCardTag = {
  icon?: ReactNode
  label: string
  tone?: WorkboardTagTone
}

export type WorkboardCardStat = {
  icon?: ReactNode
  label: string
}

type WorkboardCardProps = {
  className?: string
  description?: ReactNode
  eyebrow?: ReactNode
  footer?: ReactNode
  leadingIcon?: ReactNode
  onClick?: () => void
  stats?: WorkboardCardStat[]
  tags?: WorkboardCardTag[]
  title: ReactNode
  tone?: WorkboardCardTone
  trailing?: ReactNode
}

const toneStyles: Record<WorkboardCardTone, string> = {
  in_progress:
    "border-sky-500/20 bg-sky-500/[0.06] hover:bg-sky-500/[0.1] dark:border-sky-400/20 dark:bg-sky-400/[0.08]",
  later:
    "border-amber-500/20 bg-amber-500/[0.06] hover:bg-amber-500/[0.1] dark:border-amber-300/20 dark:bg-amber-300/[0.08]",
  live:
    "border-emerald-500/20 bg-emerald-500/[0.06] hover:bg-emerald-500/[0.1] dark:border-emerald-400/20 dark:bg-emerald-400/[0.08]",
  neutral:
    "border-border/80 bg-card/95 hover:bg-accent/25 dark:bg-card/90 dark:hover:bg-accent/18",
}

const tagToneStyles: Record<WorkboardTagTone, string> = {
  amber:
    "border-amber-500/20 bg-amber-500/[0.12] text-amber-800 dark:text-amber-200",
  emerald:
    "border-emerald-500/20 bg-emerald-500/[0.12] text-emerald-800 dark:text-emerald-200",
  neutral:
    "border-border bg-background/70 text-muted-foreground dark:bg-background/20",
  sky: "border-sky-500/20 bg-sky-500/[0.12] text-sky-800 dark:text-sky-200",
  violet:
    "border-violet-500/20 bg-violet-500/[0.12] text-violet-800 dark:text-violet-200",
}

export function WorkboardCard({
  className,
  description,
  eyebrow,
  footer,
  leadingIcon,
  onClick,
  stats,
  tags,
  title,
  tone = "neutral",
  trailing,
}: WorkboardCardProps) {
  const Root = onClick ? "button" : "div"

  return (
    <Card
      className={cn(
        "rounded-[1.2rem] border py-0 shadow-[0_16px_32px_-24px_rgba(15,23,42,0.28)] ring-0 transition-colors",
        toneStyles[tone],
        className
      )}
      size="sm"
    >
      <Root
        className="h-full w-full text-left"
        {...(onClick ? { onClick, type: "button" as const } : {})}
      >
        <CardHeader className="gap-4 px-4 pt-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-start gap-4">
              {leadingIcon ? (
                <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-xl border border-border/70 bg-background/70 dark:bg-background/20">
                  {leadingIcon}
                </span>
              ) : null}
              <div className="min-w-0">
                {eyebrow ? (
                  <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                    {eyebrow}
                  </p>
                ) : null}
                <CardTitle className="mt-1 line-clamp-2 text-base font-medium tracking-tight">
                  {title}
                </CardTitle>
              </div>
            </div>
            {trailing ? <CardAction>{trailing}</CardAction> : null}
          </div>
        </CardHeader>

        {description || tags?.length ? (
          <CardContent className="space-y-4 px-4 pb-0">
            {description ? (
              <p className="text-sm/6 text-muted-foreground">{description}</p>
            ) : null}

            {tags?.length ? (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <Badge
                    className={cn("h-6 rounded-md px-2.5 text-[11px]", tagToneStyles[tag.tone ?? "neutral"])}
                    key={`${tag.label}-${tag.tone ?? "neutral"}`}
                    variant="outline"
                  >
                    {tag.icon}
                    {tag.label}
                  </Badge>
                ))}
              </div>
            ) : null}
          </CardContent>
        ) : null}

        {stats?.length || footer ? (
          <CardFooter className="border-t border-border/70 px-4 py-4">
            <div className="flex w-full items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-muted-foreground">
                {stats?.map((stat) => (
                  <span
                    className="inline-flex items-center gap-1.5"
                    key={`${stat.label}`}
                  >
                    {stat.icon}
                    {stat.label}
                  </span>
                ))}
              </div>
              {footer}
            </div>
          </CardFooter>
        ) : null}
      </Root>
    </Card>
  )
}
