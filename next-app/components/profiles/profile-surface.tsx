"use client"

import type { ReactNode } from "react"
import type { LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"

export type SurfaceTone = "brand" | "info" | "neutral" | "success" | "warm"

const surfaceToneStyles: Record<
  SurfaceTone,
  {
    bar: string
    frame: string
    pill: string
  }
> = {
  brand: {
    bar: "bg-primary/55",
    frame: "border-primary/30 bg-primary/10 text-primary",
    pill: "border-primary/30 bg-primary/10 text-primary",
  },
  info: {
    bar: "bg-primary/35",
    frame: "border-primary/20 bg-accent text-primary",
    pill: "border-primary/20 bg-accent/70 text-primary",
  },
  neutral: {
    bar: "bg-border",
    frame: "border-border bg-background/90 text-foreground",
    pill: "border-border text-muted-foreground",
  },
  success: {
    bar: "bg-primary/55",
    frame: "border-primary/30 bg-primary/10 text-primary",
    pill: "border-primary/25 text-primary",
  },
  warm: {
    bar: "bg-secondary/70",
    frame: "border-secondary/35 bg-secondary/25 text-secondary-foreground",
    pill: "border-secondary/35 bg-secondary/20 text-secondary-foreground",
  },
}

export function SurfacePanel({
  children,
  className,
  subtitle,
  title,
}: {
  children: ReactNode
  className?: string
  subtitle: string
  title: string
}) {
  return (
    <section
      className={cn(
        "space-y-4 rounded-xl border border-border/90 bg-background/90 p-4 backdrop-blur-sm",
        className
      )}
    >
      <div className="space-y-1">
        <p className="font-heading text-lg font-medium tracking-tight">
          {title}
        </p>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </div>
      {children}
    </section>
  )
}

export function SurfaceMetricCard({
  icon: Icon,
  label,
  tone,
  value,
}: {
  icon: LucideIcon
  label: string
  tone: Exclude<SurfaceTone, "neutral">
  value: string
}) {
  return (
    <div
      className={cn(
        "space-y-2 rounded-xl border p-3 shadow-[0_18px_38px_-34px_rgba(15,23,42,0.28)]",
        surfaceToneStyles[tone].frame
      )}
    >
      <div className="flex items-center gap-2">
        <Icon className="size-4" />
        <span className="text-[11px] tracking-[0.16em] uppercase">{label}</span>
      </div>
      <p className="font-heading text-xl font-medium tracking-tight">{value}</p>
    </div>
  )
}

export function SurfaceDistributionRow({
  label,
  tone,
  total,
  value,
}: {
  label: string
  tone: SurfaceTone
  total: number
  value: number
}) {
  const width = total > 0 ? Math.max(6, Math.round((value / total) * 100)) : 6

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span>{label}</span>
        <span className="text-muted-foreground">{value}</span>
      </div>
      <div className="h-3 rounded-full border border-border p-0.5">
        <div
          className={cn("h-full rounded-full", surfaceToneStyles[tone].bar)}
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  )
}

export function SurfaceInsight({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="rounded-xl border border-border p-3">
      <p className="text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
        {label}
      </p>
      <p className="mt-2 leading-6">{value}</p>
    </div>
  )
}

export function SurfacePill({
  children,
  className,
  tone = "neutral",
}: {
  children: ReactNode
  className?: string
  tone?: SurfaceTone
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-1 text-[11px] tracking-[0.16em] uppercase",
        surfaceToneStyles[tone].pill,
        className
      )}
    >
      {children}
    </span>
  )
}

export function getAvailabilityTone(
  status: "available" | "limited" | "unavailable"
): SurfaceTone {
  if (status === "available") {
    return "success"
  }

  if (status === "limited") {
    return "warm"
  }

  return "neutral"
}

export function getRequestStatusTone(status: string): SurfaceTone {
  if (status === "active" || status === "accepted" || status === "fulfilled") {
    return "success"
  }

  if (status === "claimed" || status === "in_progress") {
    return "brand"
  }

  if (status === "blocked") {
    return "warm"
  }

  return "neutral"
}

export function formatMoney(amount: number) {
  return new Intl.NumberFormat(undefined, {
    currency: "USD",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(amount)
}

export function formatProfileDate(timestamp: number) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(timestamp)
}
