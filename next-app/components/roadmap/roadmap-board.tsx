"use client"

import { useMemo, useState, type ReactNode } from "react"
import Link from "next/link"
import {
  CalendarDaysIcon,
  CheckCircle2Icon,
  CircleIcon,
  FileTextIcon,
  Link2Icon,
  LoaderCircleIcon,
  PauseIcon,
} from "lucide-react"

import type { WorkboardTagTone } from "@/components/workboard/workboard-card"
import { FocusSheetFrame } from "@/components/workboard/focus-sheet-frame"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import {
  type BoardStatus,
  type BoardTicket,
  type RoadmapHighlight,
  type RoadmapPhaseReadout,
  roadmapHighlights,
  roadmapPhaseReadout,
  roadmapSourceLinks,
  roadmapTickets,
} from "./roadmap-board-data"

type RoadmapBoardProps = {
  embedded?: boolean
  sourceLinks?: readonly {
    href: string
    label: string
    note: string
  }[]
  tickets?: BoardTicket[]
}

const laneOrder = [
  {
    description: "Completed milestones that are safe to present as current Boreal product truth.",
    key: "live",
    label: "Live now",
  },
  {
    description: "Work Boreal is actively hardening across payment depth, team execution, supply structure, and release operations.",
    key: "in_progress",
    label: "In Progress",
  },
  {
    description: "Near-term milestones that are clearly queued after the current hardening work.",
    key: "next",
    label: "Coming next",
  },
  {
    description: "Important later-stage bets that should stay outside the current public claim boundary.",
    key: "later",
    label: "Later",
  },
] as const satisfies readonly {
  description: string
  key: BoardStatus
  label: string
}[]

const laneSurfaceStyles: Record<
  BoardStatus,
  {
    badge: string
    card: string
    icon: string
    lane: string
    laneHeader: string
    tagTone: WorkboardTagTone
  }
> = {
  in_progress: {
    badge:
      "border-sky-500/20 bg-sky-500/[0.12] text-sky-700 dark:text-sky-200",
    card:
      "border-sky-500/16 bg-sky-500/[0.045] hover:bg-sky-500/[0.075] dark:border-sky-400/16 dark:bg-sky-400/[0.08] dark:hover:bg-sky-400/[0.11]",
    icon: "text-sky-500 dark:text-sky-300",
    lane: "border-sky-500/15 bg-sky-500/[0.035] dark:border-sky-400/18 dark:bg-sky-400/[0.06]",
    laneHeader:
      "border-sky-500/12 bg-sky-500/[0.08] dark:border-sky-400/14 dark:bg-sky-400/[0.08]",
    tagTone: "sky",
  },
  later: {
    badge:
      "border-amber-500/20 bg-amber-500/[0.12] text-amber-700 dark:text-amber-200",
    card:
      "border-amber-500/16 bg-amber-500/[0.04] hover:bg-amber-500/[0.07] dark:border-amber-300/16 dark:bg-amber-300/[0.08] dark:hover:bg-amber-300/[0.11]",
    icon: "text-amber-500 dark:text-amber-300",
    lane: "border-amber-500/15 bg-amber-500/[0.035] dark:border-amber-300/18 dark:bg-amber-300/[0.06]",
    laneHeader:
      "border-amber-500/12 bg-amber-500/[0.08] dark:border-amber-300/14 dark:bg-amber-300/[0.08]",
    tagTone: "amber",
  },
  live: {
    badge:
      "border-emerald-500/20 bg-emerald-500/[0.12] text-emerald-700 dark:text-emerald-200",
    card:
      "border-emerald-500/16 bg-emerald-500/[0.045] hover:bg-emerald-500/[0.075] dark:border-emerald-400/16 dark:bg-emerald-400/[0.08] dark:hover:bg-emerald-400/[0.11]",
    icon: "text-emerald-500 dark:text-emerald-300",
    lane: "border-emerald-500/15 bg-emerald-500/[0.035] dark:border-emerald-400/18 dark:bg-emerald-400/[0.06]",
    laneHeader:
      "border-emerald-500/12 bg-emerald-500/[0.08] dark:border-emerald-400/14 dark:bg-emerald-400/[0.08]",
    tagTone: "emerald",
  },
  next: {
    badge:
      "border-border bg-background/80 text-foreground dark:bg-background/20",
    card:
      "border-border/80 bg-background/72 hover:bg-background/88 dark:bg-card/65 dark:hover:bg-card/82",
    icon: "text-foreground/80 dark:text-foreground/70",
    lane: "border-border/80 bg-background/65 dark:bg-card/35",
    laneHeader: "border-border/70 bg-muted/45 dark:bg-background/35",
    tagTone: "violet",
  },
}

export function RoadmapBoard({
  embedded = false,
  sourceLinks,
  tickets,
}: RoadmapBoardProps) {
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null)
  const safeSourceLinks = useMemo(
    () => sourceLinks ?? (Array.isArray(roadmapSourceLinks) ? roadmapSourceLinks : []),
    [sourceLinks]
  )
  const safeTickets = useMemo(
    () => tickets ?? (Array.isArray(roadmapTickets) ? roadmapTickets : []),
    [tickets]
  )
  const safeHighlights = useMemo(
    () => (Array.isArray(roadmapHighlights) ? roadmapHighlights : []),
    []
  )
  const safePhaseReadout = useMemo(
    () => (Array.isArray(roadmapPhaseReadout) ? roadmapPhaseReadout : []),
    []
  )

  const selectedTicket = useMemo(
    () => safeTickets.find((ticket) => ticket.id === selectedTicketId) ?? null,
    [selectedTicketId, safeTickets]
  )

  const boardSync = useMemo(() => {
    const dates = safeTickets
      .map((ticket) => ticket.updatedAt)
      .filter((value) => /^\d{4}-\d{2}-\d{2}$/.test(value))
      .sort()

    return dates.at(-1) ?? null
  }, [safeTickets])

  const boardHighlightsStrip = (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {safeHighlights.map((highlight) => (
        <RoadmapOverviewCard highlight={highlight} key={highlight.label} />
      ))}
    </div>
  )

  const phaseReadoutStrip = (
    <section className="rounded-[1.25rem] border border-border/80 bg-card/88 p-4 shadow-[0_18px_42px_-34px_rgba(15,23,42,0.22)]">
      <div className="space-y-1">
        <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
          Release track
        </p>
        <p className="text-sm text-muted-foreground">
          Milestone-level readout from the current early-access checklist.
        </p>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {safePhaseReadout.map((entry) => (
          <RoadmapPhaseChip entry={entry} key={entry.phase} />
        ))}
      </div>
    </section>
  )

  const boardLanes = (
    <div className="grid min-w-[1280px] grid-cols-4 gap-4">
      {laneOrder.map((lane) => {
        const laneTickets = safeTickets.filter((ticket) => ticket.status === lane.key)
        const laneStyles = laneSurfaceStyles[lane.key]

        return (
          <section
            className={cn(
              "flex min-h-[60rem] flex-col rounded-[1.35rem] border border-border/80 bg-card/72 p-4",
              embedded
                ? "shadow-[0_18px_42px_-34px_rgba(15,23,42,0.38)]"
                : "shadow-[0_14px_36px_-34px_rgba(15,23,42,0.16)]"
            )}
            key={lane.key}
          >
            <header className="border-b border-border/70 pb-4">
              <div className="flex items-center gap-2">
                <LaneIcon className={laneStyles.icon} status={lane.key} />
                <p className="text-base font-medium tracking-tight">{lane.label}</p>
                <span className="text-sm text-muted-foreground">
                  {laneTickets.length}
                </span>
              </div>
              <p className="mt-2 max-w-sm text-sm/6 text-muted-foreground">
                {lane.description}
              </p>
            </header>

            <div className="flex flex-1 flex-col gap-3.5 pt-4">
              {laneTickets.map((ticket) => (
                <RoadmapTicketCard
                  className={laneStyles.card}
                  key={ticket.id}
                  onClick={() => setSelectedTicketId(ticket.id)}
                  statusBadge={<RoadmapStatusPill status={ticket.status} />}
                  tagTone={laneStyles.tagTone}
                  ticket={ticket}
                />
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )

  return (
    <>
      {embedded ? (
        <FocusSheetFrame className="min-h-full">
          <section className="rounded-[1.35rem] border border-border/80 bg-card/92 px-4 py-4 shadow-[0_18px_42px_-34px_rgba(15,23,42,0.22)] sm:px-5">
            <div className="space-y-2">
              <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                Public roadmap
              </p>
              <h1 className="font-heading text-2xl font-semibold tracking-tight">
                Feature showcase, hardening tracks, and what comes next.
              </h1>
              <p className="max-w-3xl text-sm/7 text-muted-foreground">
                This board compresses the larger roadmap into milestone-sized
                product truth. Open a card when you need the exact scope behind
                a public claim.
              </p>
            </div>
          </section>
          {boardHighlightsStrip}
          {phaseReadoutStrip}
          <div className="w-full overflow-x-auto">
            {boardLanes}
          </div>
        </FocusSheetFrame>
      ) : (
        <main id="main-content" className="min-h-screen bg-background text-foreground">
          <section className="border-b border-border/70 px-4 py-4 sm:px-6 lg:px-10 xl:px-12">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-1.5">
                <p className="text-lg font-medium tracking-tight">Roadmap</p>
                <p className="text-sm text-muted-foreground">
                  {boardSync
                    ? `Synced ${formatLongDate(boardSync)} / milestone-sized public truth for what is live, what is hardening, and what comes next.`
                    : "Repo-grounded public board"}
                </p>
              </div>

              <div className="flex flex-wrap gap-x-4 gap-y-2">
                  {safeSourceLinks.map((entry) => (
                    <Link
                      className="text-sm text-foreground/80 underline decoration-border underline-offset-4 transition-colors hover:text-foreground"
                      href={entry.href}
                      key={entry.href}
                    >
                      {entry.label}
                    </Link>
                  ))}
              </div>
            </div>
          </section>

          <section className="space-y-4 px-4 py-4 sm:px-6 lg:px-10 xl:px-12">
            {boardHighlightsStrip}
            {phaseReadoutStrip}
          </section>

          <section className="overflow-x-auto px-4 pb-4 sm:px-6 lg:px-10 xl:px-12">
            {boardLanes}
          </section>
        </main>
      )}

      <RoadmapReportDialog
        onOpenChange={(open) => {
          if (!open) {
            setSelectedTicketId(null)
          }
        }}
        ticket={selectedTicket}
      />
    </>
  )
}

function RoadmapTicketCard({
  className,
  onClick,
  statusBadge,
  tagTone,
  ticket,
}: {
  className?: string
  onClick: () => void
  statusBadge: ReactNode
  tagTone: WorkboardTagTone
  ticket: BoardTicket
}) {
  return (
    <button
      className={cn(
        "flex w-full flex-col overflow-hidden rounded-[1.05rem] border text-left shadow-[0_16px_36px_-30px_rgba(15,23,42,0.34)] transition-colors",
        className
      )}
      onClick={onClick}
      type="button"
    >
      <div className="space-y-3 px-4 py-4">
        <div className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          <span>{ticket.id}</span>
          <span>/</span>
          <span>{titleCase(ticket.area)}</span>
        </div>
        <h3 className="text-[1.05rem] font-medium leading-6 tracking-tight text-foreground">
          {ticket.title}
        </h3>
        <p className="text-sm/6 text-muted-foreground">{ticket.summary}</p>
        <div className="flex flex-wrap gap-2">
          <RoadmapTag label={titleCase(ticket.area)} tone={tagTone} />
          <RoadmapTag
            icon={<CalendarDaysIcon className="size-3" />}
            label={formatCardDate(ticket.updatedAt)}
            tone="neutral"
          />
        </div>
      </div>
      <div className="flex items-center justify-between gap-3 border-t border-border/70 px-4 py-3 text-xs text-muted-foreground">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <span className="inline-flex items-center gap-1.5">
            <FileTextIcon className="size-3" />
            report
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Link2Icon className="size-3" />
            {ticket.routes.length} routes
          </span>
        </div>
        {statusBadge}
      </div>
    </button>
  )
}

function RoadmapTag({
  icon,
  label,
  tone = "neutral",
}: {
  icon?: ReactNode
  label: string
  tone?: WorkboardTagTone
}) {
  const tagStyles: Record<WorkboardTagTone, string> = {
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

  return (
    <Badge
      className={cn("h-6 rounded-md px-2.5 text-[11px]", tagStyles[tone])}
      variant="outline"
    >
      {icon}
      {label}
    </Badge>
  )
}

function RoadmapStatusPill({ status }: { status: BoardStatus }) {
  return (
    <Badge
      className={cn(
        "h-6 rounded-full px-2.5 text-[11px]",
        laneSurfaceStyles[status].badge
      )}
      variant="outline"
    >
      {statusLabel(status)}
    </Badge>
  )
}

function RoadmapReportDialog({
  onOpenChange,
  ticket,
}: {
  onOpenChange: (open: boolean) => void
  ticket: BoardTicket | null
}) {
  return (
    <Dialog onOpenChange={onOpenChange} open={Boolean(ticket)}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto rounded-[1.7rem] border border-border bg-background p-0 shadow-[0_42px_120px_-44px_rgba(15,23,42,0.55)] dark:bg-[#131418]">
        {ticket ? (
          <>
            <div
              className={cn(
                "border-b border-border px-5 py-5",
                laneSurfaceStyles[ticket.status].laneHeader
              )}
            >
              <DialogHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                      {ticket.id}
                    </p>
                    <DialogTitle className="font-heading text-2xl font-semibold tracking-tight">
                      {ticket.title}
                    </DialogTitle>
                  </div>
                  <RoadmapStatusPill status={ticket.status} />
                </div>
                <DialogDescription className="text-sm/7">
                  {ticket.summary}
                </DialogDescription>
              </DialogHeader>
            </div>

            <div className="grid gap-4 px-5 py-5 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
              <div className="space-y-4">
                <MetaPanel title="Area">{titleCase(ticket.area)}</MetaPanel>
                <MetaPanel title="Evidence">{ticket.evidence}</MetaPanel>
                <MetaPanel title="Routes">
                  <div className="flex flex-wrap gap-2">
                    {ticket.routes.map((route) => (
                      <Badge
                        className="h-6 rounded-md px-2.5 text-[11px]"
                        key={route}
                        variant="outline"
                      >
                        {route}
                      </Badge>
                    ))}
                  </div>
                </MetaPanel>
                <MetaPanel title="Updated">
                  {formatLongDate(ticket.updatedAt)}
                </MetaPanel>
              </div>

              <div className="space-y-4">
                <Card className="rounded-[1.2rem] border border-border/80 bg-card/95 py-0 ring-0">
                  <CardHeader className="border-b border-border/70 px-4 py-4">
                    <CardTitle className="text-sm font-medium">
                      Public report
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 py-4">
                    <p className="text-sm/7 text-muted-foreground">
                      {ticket.report}
                    </p>
                  </CardContent>
                </Card>

                <Card className="rounded-[1.2rem] border border-border/80 bg-muted/30 py-0 ring-0 dark:bg-white/[0.03]">
                  <CardHeader className="border-b border-border/70 px-4 py-4">
                    <CardTitle className="text-sm font-medium">
                      Board meaning
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 py-4">
                    <p className="text-sm/7 text-muted-foreground">
                      This expanded card is still public-safe. It explains why a
                      ticket is in its current lane without exposing private task
                      choreography, branch work, or internal blockers.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>

            <DialogFooter
              className="border-t border-border px-5 py-4"
              showCloseButton
            />
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}

function MetaPanel({
  children,
  title,
}: {
  children: ReactNode
  title: string
}) {
  return (
    <Card className="rounded-[1.2rem] border border-border/80 bg-card/95 py-0 ring-0 dark:bg-card/85">
      <CardHeader className="border-b border-border/70 px-4 py-4">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent className="px-4 py-4">
        <div className="text-sm/7 text-muted-foreground">{children}</div>
      </CardContent>
    </Card>
  )
}

function RoadmapOverviewCard({
  highlight,
}: {
  highlight: RoadmapHighlight
}) {
  return (
    <Card className="rounded-[1.2rem] border border-border/80 bg-card/92 py-0 ring-0">
      <CardHeader className="border-b border-border/70 px-4 py-4">
        <CardTitle className="text-sm font-medium">{highlight.label}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 px-4 py-4">
        <p className="text-xl font-semibold tracking-tight text-foreground">
          {highlight.value}
        </p>
        <p className="text-sm/6 text-muted-foreground">{highlight.note}</p>
      </CardContent>
    </Card>
  )
}

function RoadmapPhaseChip({
  entry,
}: {
  entry: RoadmapPhaseReadout
}) {
  return (
    <div
      className={cn(
        "rounded-full border px-3 py-2 text-xs",
        laneSurfaceStyles[entry.status].badge
      )}
    >
      <div className="flex items-center gap-2">
        <span className="font-medium">Phase {entry.phase}</span>
        <span className="opacity-75">{entry.label}</span>
      </div>
    </div>
  )
}

function LaneIcon({
  className,
  status,
}: {
  className?: string
  status: BoardStatus
}) {
  if (status === "live") {
    return <CheckCircle2Icon className={cn("size-4", className)} />
  }

  if (status === "in_progress") {
    return <LoaderCircleIcon className={cn("size-4", className)} />
  }

  if (status === "later") {
    return <PauseIcon className={cn("size-4", className)} />
  }

  return <CircleIcon className={cn("size-4", className)} />
}

function statusLabel(status: BoardStatus) {
  if (status === "live") {
    return "Live"
  }

  if (status === "in_progress") {
    return "In progress"
  }

  if (status === "later") {
    return "Later"
  }

  return "Next"
}

function formatCardDate(value: string) {
  if (value === "next") {
    return "Queued next"
  }

  if (value === "later") {
    return "Later lane"
  }

  return formatLongDate(value)
}

function formatLongDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value
  }

  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`))
}

function titleCase(value: string) {
  return value
    .split(" ")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

