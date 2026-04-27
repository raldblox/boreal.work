"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import {
  ArrowRight,
  CheckCircle2Icon,
  Clock3Icon,
  FileTextIcon,
  FlagIcon,
  Layers3Icon,
  RadarIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { PublicPageFooter, PublicPageHeader } from "./public-site-chrome"

type BoardStatus = "in_progress" | "later" | "live" | "next"

type BoardTicket = {
  area: string
  evidence: string
  id: string
  report: string
  routes: string[]
  status: BoardStatus
  summary: string
  title: string
  updatedAt: string
}

const boardTickets: BoardTicket[] = [
  {
    area: "request surface",
    evidence:
      "Live in chat shell, request workspaces, proposals, delivery, and attached checkout records.",
    id: "BRL-101",
    report:
      "This lane is safe to describe publicly because the request thread, proposal flow, delivery path, and attached checkout states are all already present in the current app surface.",
    routes: ["/", "/chat"],
    status: "live",
    summary:
      "One request becomes one attached work thread with chat, proposals, delivery, checkout, and proof on the same record.",
    title: "Request-native workspaces",
    updatedAt: "2026-04-27",
  },
  {
    area: "market discovery",
    evidence:
      "Public requests, public supply, profile pages, and request-driven catalog results already render in the product surface.",
    id: "BRL-102",
    report:
      "The current product already supports public discovery across supply, requests, and profile routes. This remains a safe public claim as long as the page avoids suggesting finished ranking depth or fully autonomous fulfillment.",
    routes: ["/?browse=requests", "/?browse=workers", "/p/[id]"],
    status: "live",
    summary:
      "Buyers can browse public offers and unresolved requests while Boreal keeps supply, operators, and agent surfaces routable from the same shell.",
    title: "Public supply and request discovery",
    updatedAt: "2026-04-27",
  },
  {
    area: "premium demand API",
    evidence:
      "Backed by the live one-request contract, SIWX wallet auth, the 402 payment boundary, and machine-readable request tracking.",
    id: "BRL-103",
    report:
      "The one-request contract is live and public-safe to present as a premium demand entrypoint. The report should still avoid implying treasury-grade settlement or mainnet-ready proof beyond the current boundary.",
    routes: ["/api/v1/requests", "/one-request-api.md"],
    status: "live",
    summary:
      "The live premium surface now runs through SIWX wallet auth, a 402 payment boundary, and machine-readable request tracking.",
    title: "One-request API",
    updatedAt: "2026-04-27",
  },
  {
    area: "supplier surface",
    evidence:
      "External suppliers can self-register, watch matched demand through one inbox, participate on requests, and track payout readiness.",
    id: "BRL-104",
    report:
      "Supplier onboarding and inbox participation are already real product surfaces. That makes them safe public board items, while more advanced marketplace automation still stays in later lanes.",
    routes: ["/api/v1/inbox", "/api/v1/supplies", "/one-inbox-api.md"],
    status: "live",
    summary:
      "Suppliers can self-register supply, watch matched demand through one inbox, participate on requests, and track payout readiness.",
    title: "Supplier inbox and onboarding",
    updatedAt: "2026-04-27",
  },
  {
    area: "specialists",
    evidence:
      "Registry entries already expose canonical v1 routes, normalized pricing labels, and machine-readable schemas.",
    id: "BRL-105",
    report:
      "The specialist registry is already concrete and machine-facing. The public board can safely present it as live as long as it stays clear that request-first demand remains the main front door.",
    routes: ["/api/v1/agents", "/agent-registry.md"],
    status: "live",
    summary:
      "Specialized direct agents already expose canonical v1 routes, normalized pricing labels, and machine-readable schemas.",
    title: "Specialist registry",
    updatedAt: "2026-04-27",
  },
  {
    area: "matching",
    evidence:
      "Roadmap truth says matching is real today, but deeper retrieval, reranking, and fast-route quality are still ahead.",
    id: "BRL-201",
    report:
      "This work is active, visible, and important, but not done. The board should present it as hardening work rather than a fully solved matching engine.",
    routes: ["/roadmap", "/chat"],
    status: "in_progress",
    summary:
      "Matching is real today, but Boreal is still deepening retrieval quality, reranking, and stronger fast-route behavior.",
    title: "Matching quality hardening",
    updatedAt: "2026-04-27",
  },
  {
    area: "commerce depth",
    evidence:
      "The commerce spine is live, but refund, dispute, split-settlement, and richer paid transaction scenarios still need stronger coverage.",
    id: "BRL-202",
    report:
      "The payment and payout foundation is already there. This card stays in progress because the transaction matrix still needs broader lifecycle depth before stronger public claims are justified.",
    routes: ["/roadmap", "/one-request-api.md", "/one-inbox-api.md"],
    status: "in_progress",
    summary:
      "Boreal is hardening the transaction matrix beyond current payout progression and request payment verification.",
    title: "Commerce hardening",
    updatedAt: "2026-04-27",
  },
  {
    area: "distribution",
    evidence:
      "The external publication plan exists, but x402 seller hardening, MCP publication, and broader app-surface discovery are still ahead.",
    id: "BRL-203",
    report:
      "This is active roadmap work with a defined direction, but the distribution surfaces are not broad enough yet to move into the live lane.",
    routes: ["/roadmap", "/developers/agents"],
    status: "in_progress",
    summary:
      "External distribution work is defined, but public discovery surfaces still need more shipping work.",
    title: "Distribution surfaces",
    updatedAt: "2026-04-27",
  },
  {
    area: "protocol shape",
    evidence:
      "Listing and checkout metadata are moving toward cleaner ACP and UCP alignment without claiming full interoperability yet.",
    id: "BRL-204",
    report:
      "This card exists to show protocol-facing work without overstating completion. The board should keep the phrasing careful and specific.",
    routes: ["/roadmap", "/about"],
    status: "in_progress",
    summary:
      "Public listing and checkout metadata are being tightened without overclaiming finished protocol support.",
    title: "Protocol-facing listing surfaces",
    updatedAt: "2026-04-27",
  },
  {
    area: "retrieval",
    evidence:
      "Explicit next-step in the roadmap: historical analog retrieval and LLM reranking over top candidates.",
    id: "BRL-301",
    report:
      "This is the clearest named next step for routing depth. It belongs in the next lane because the direction is explicit and near-term, but it is not shipped today.",
    routes: ["/roadmap"],
    status: "next",
    summary:
      "Add historical analog retrieval and LLM reranking over top candidates to improve routing confidence.",
    title: "Retrieval depth pass",
    updatedAt: "next",
  },
  {
    area: "open agent network",
    evidence:
      "The live supply, inbox, and request surfaces already exist; the next layer is Agent Card ingestion, runtime metadata, and connector health on top of them.",
    id: "BRL-306",
    report:
      "This belongs in the next lane because the network paper now names a concrete extension path grounded in shipped routes, but the identity and connector layer is not implemented yet.",
    routes: ["/papers/agent-network", "/developers/agents", "/roadmap"],
    status: "next",
    summary:
      "Extend external agent supply with Agent Card sync, runtime metadata, and connector capabilities without changing the request-first market object.",
    title: "Agent identity and connector base",
    updatedAt: "next",
  },
  {
    area: "portable reputation",
    evidence:
      "Owner reviews and collective trust primitives exist today, but collaborator feedback, validator outcomes, and category-specific snapshots are still ahead.",
    id: "BRL-307",
    report:
      "This is near-term because the trust base already exists in request outcomes and profile analytics. The missing layer is explicit request-linked feedback and derived reputation surfaces for connected agents.",
    routes: ["/papers/portable-reputation", "/roadmap"],
    status: "next",
    summary:
      "Move from simple review and trust inputs toward request-linked collaborator feedback, validator signals, and category-specific reputation.",
    title: "Portable reputation base",
    updatedAt: "next",
  },
  {
    area: "public commerce APIs",
    evidence:
      "Stable public catalog and checkout-capability endpoints are still planned, not fully shipped.",
    id: "BRL-302",
    report:
      "This board item is appropriate for the next lane because the need is concrete and already visible in the roadmap, but the public contract is not complete yet.",
    routes: ["/roadmap", "/developers/agents"],
    status: "next",
    summary:
      "Expose cleaner public catalog and checkout-capability endpoints for supply and offer discovery.",
    title: "Public catalog endpoints",
    updatedAt: "next",
  },
  {
    area: "post-payment lifecycle",
    evidence:
      "Refund, cancellation, and dispute handling across paid transaction types still remain roadmap work.",
    id: "BRL-303",
    report:
      "This remains a strong next-lane card because the lifecycle gap is clear and product-significant, even though the underlying payout and settlement base already exists.",
    routes: ["/roadmap"],
    status: "next",
    summary:
      "Deepen the transaction lifecycle past current execution, payout, and settlement readiness states.",
    title: "Refund and dispute coverage",
    updatedAt: "next",
  },
  {
    area: "routing signals",
    evidence:
      "Roadmap still calls for stronger supplier and request health signals feeding back into routing.",
    id: "BRL-304",
    report:
      "This is important, but it remains later-stage work because it depends on stronger marketplace data, stronger matching depth, and more maturity in the routing loop.",
    routes: ["/roadmap", "/chat"],
    status: "later",
    summary:
      "Use richer supplier and request health signals to improve routing, deadlines, and marketplace quality.",
    title: "Marketplace health signals",
    updatedAt: "later",
  },
  {
    area: "protocol depth",
    evidence:
      "On-chain escrow, full ACP and UCP interoperability, trust-score routing, and collective settlement remain future work.",
    id: "BRL-305",
    report:
      "This card exists mainly as a public honesty boundary. It reminds the board not to collapse future protocol depth into current live messaging.",
    routes: ["/roadmap", "/about"],
    status: "later",
    summary:
      "Do not market Boreal as finished protocol-native settlement infrastructure yet.",
    title: "Protocol depth boundary",
    updatedAt: "later",
  },
  {
    area: "workspace upgrades",
    evidence:
      "The standard request workspace is live. The paid Swarm Workspace upgrade path, realtime coordination plane, and validator lane are still future work.",
    id: "BRL-308",
    report:
      "This belongs in the later lane because Boreal already has the durable workspace object, but richer multi-agent collaboration should only ship after the connector and reputation base is stronger.",
    routes: ["/papers/swarm-workspace", "/papers/agent-network", "/roadmap"],
    status: "later",
    summary:
      "Upgrade selected requests into richer human-plus-agent coordination workspaces with assignments, validation, and realtime collaboration.",
    title: "Swarm Workspace",
    updatedAt: "later",
  },
  {
    area: "recommendation",
    evidence:
      "The roadmap now explicitly calls for agent affinity edges and collaborative filtering over shared outcomes, but those signals are not computed yet.",
    id: "BRL-309",
    report:
      "This stays later because it depends on more completed work, stronger feedback capture, and clearer connector identity before collaborative filtering is worth trusting.",
    routes: ["/papers/agent-network", "/roadmap"],
    status: "later",
    summary:
      "Use shared outcomes, repeat hires, and supplier affinity to recommend better execution teams over time.",
    title: "Agent affinity and recommendation",
    updatedAt: "later",
  },
] as const

const boardLanes = [
  {
    description: "Shipped and safe to describe as current public product surface.",
    key: "live",
    label: "Live",
    value: "05",
  },
  {
    description: "Actively hardening now. Real direction, not yet complete.",
    key: "in_progress",
    label: "In progress",
    value: "04",
  },
  {
    description: "Near-term work already named in the roadmap.",
    key: "next",
    label: "Next",
    value: "03",
  },
  {
    description:
      "Important future layers still outside the current public claim boundary.",
    key: "later",
    label: "Later",
    value: "02",
  },
] as const satisfies readonly {
  description: string
  key: BoardStatus
  label: string
  value: string
}[]

const sourceLinks = [
  {
    href: "/about",
    label: "About / product truth",
    note: "Current product definition and public positioning guardrails.",
  },
  {
    href: "/papers",
    label: "Papers",
    note: "Flagship thesis plus linked deep dives for humans, agents, and workspaces.",
  },
  {
    href: "/one-request-api.md",
    label: "One-request contract",
    note: "Live premium demand contract and request lifecycle.",
  },
  {
    href: "/one-inbox-api.md",
    label: "One-inbox contract",
    note: "Supplier-side demand watch, participation, delivery, and payout tracking.",
  },
  {
    href: "/developers/agents",
    label: "Developer guide",
    note: "Public integration surfaces for agent customers and suppliers.",
  },
] as const

const overviewStats = [
  {
    label: "Board route",
    note: "Public-safe Jira-style readout. Internal task assignment stays private.",
    value: "/roadmap",
  },
  {
    label: "Board sync",
    note: "Aligned to repo truth and docs, not aspirational copy.",
    value: "2026-04-27",
  },
  {
    label: "Lane model",
    note: "Live, in progress, next, later.",
    value: "4 lanes",
  },
] as const

const statusStyles: Record<
  BoardStatus,
  {
    card: string
    chip: string
    lane: string
    laneHeader: string
    modalAccent: string
  }
> = {
  in_progress: {
    card: "border-amber-500/25 bg-amber-500/[0.07] hover:bg-amber-500/[0.12]",
    chip: "border-amber-500/35 bg-amber-500/[0.12] text-amber-700 dark:text-amber-300",
    lane: "border-amber-500/25 bg-amber-500/[0.05]",
    laneHeader: "border-amber-500/25 bg-amber-500/[0.08]",
    modalAccent: "bg-amber-500/[0.08]",
  },
  later: {
    card: "border-slate-500/25 bg-slate-500/[0.07] hover:bg-slate-500/[0.11]",
    chip: "border-slate-500/35 bg-slate-500/[0.12] text-slate-700 dark:text-slate-300",
    lane: "border-slate-500/25 bg-slate-500/[0.05]",
    laneHeader: "border-slate-500/25 bg-slate-500/[0.08]",
    modalAccent: "bg-slate-500/[0.08]",
  },
  live: {
    card: "border-emerald-500/25 bg-emerald-500/[0.07] hover:bg-emerald-500/[0.12]",
    chip: "border-emerald-500/35 bg-emerald-500/[0.12] text-emerald-700 dark:text-emerald-300",
    lane: "border-emerald-500/25 bg-emerald-500/[0.05]",
    laneHeader: "border-emerald-500/25 bg-emerald-500/[0.08]",
    modalAccent: "bg-emerald-500/[0.08]",
  },
  next: {
    card: "border-sky-500/25 bg-sky-500/[0.07] hover:bg-sky-500/[0.12]",
    chip: "border-sky-500/35 bg-sky-500/[0.12] text-sky-700 dark:text-sky-300",
    lane: "border-sky-500/25 bg-sky-500/[0.05]",
    laneHeader: "border-sky-500/25 bg-sky-500/[0.08]",
    modalAccent: "bg-sky-500/[0.08]",
  },
}

export function RoadmapPage() {
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null)

  const selectedTicket = useMemo(
    () => boardTickets.find((ticket) => ticket.id === selectedTicketId) ?? null,
    [selectedTicketId]
  )

  return (
    <>
      <main
        id="main-content"
        className="min-h-screen bg-background text-foreground"
      >
        <div className="mx-auto flex min-h-screen w-full max-w-[1600px] flex-col px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
          <PublicPageHeader activeHref="/roadmap" eyebrow="Public roadmap board" />

          <section className="grid gap-4 py-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(22rem,0.9fr)] lg:py-10">
            <div className="border border-border bg-background">
              <div className="border-b border-border px-4 py-3 sm:px-5">
                <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                  Public-safe status board
                </p>
                <h1 className="mt-2 max-w-5xl font-heading text-balance text-4xl font-semibold tracking-tight sm:text-6xl">
                  Boreal roadmap as a public Jira-style board.
                </h1>
              </div>

              <div className="space-y-6 px-4 py-5 sm:px-5 sm:py-6">
                <p className="max-w-4xl text-base/8 text-muted-foreground sm:text-lg/8">
                  This route is the public project board. It shows what is live,
                  what is actively hardening, what is next, and what is still
                  later-stage roadmap work. It should stay strict, repo-grounded,
                  and free of private agent coordination details.
                </p>

                <div className="flex flex-wrap gap-3">
                  <Button asChild className="rounded-none" size="lg">
                    <Link href="/">
                      Start in chat
                      <ArrowRight className="size-4" />
                    </Link>
                  </Button>
                  <Button
                    asChild
                    className="rounded-none"
                    size="lg"
                    variant="outline"
                  >
                    <Link href="/about">Read the feature surface</Link>
                  </Button>
                </div>

                <div className="grid gap-px bg-border lg:grid-cols-3">
                  {overviewStats.map((stat) => (
                    <article
                      className="bg-background px-4 py-4 sm:px-5"
                      key={stat.label}
                    >
                      <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                        {stat.label}
                      </p>
                      <p className="mt-3 font-heading text-2xl font-semibold tracking-tight">
                        {stat.value}
                      </p>
                      <p className="mt-2 text-sm/7 text-muted-foreground">
                        {stat.note}
                      </p>
                    </article>
                  ))}
                </div>
              </div>
            </div>

            <aside className="border border-border bg-muted/18">
              <div className="border-b border-border px-4 py-3 sm:px-5">
                <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                  <FileTextIcon className="size-3.5" />
                  Board rules
                </div>
                <h2 className="mt-2 font-heading text-2xl font-semibold tracking-tight">
                  Public-safe lane logic
                </h2>
              </div>

              <div className="space-y-4 px-4 py-4 sm:px-5">
                <div className="border border-border bg-background px-4 py-4">
                  <p className="text-sm/7 text-muted-foreground">
                    `Live` means shipped and safe to claim publicly. `In
                    progress` means active hardening. `Next` means named
                    near-term work. `Later` means still outside the current
                    public claim boundary.
                  </p>
                </div>

                <div className="grid gap-px bg-border">
                  {sourceLinks.map((entry) => (
                    <Link
                      className="bg-background px-4 py-4 transition-colors hover:bg-muted/30"
                      href={entry.href}
                      key={entry.label}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-sm font-medium">{entry.label}</p>
                          <p className="mt-2 text-sm/7 text-muted-foreground">
                            {entry.note}
                          </p>
                        </div>
                        <ArrowRight className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </aside>
          </section>

          <section className="border border-border bg-muted/16">
            <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3 sm:px-5">
              <div>
                <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                  <Layers3Icon className="size-3.5" />
                  Board view
                </div>
                <h2 className="mt-2 font-heading text-2xl font-semibold tracking-tight">
                  Current board snapshot
                </h2>
              </div>
              <p className="text-sm text-muted-foreground">
                Public route:{" "}
                <span className="font-medium text-foreground">/roadmap</span>
              </p>
            </div>

            <div className="overflow-x-auto">
              <div className="grid min-w-[1180px] gap-4 p-4 lg:grid-cols-4">
                {boardLanes.map((lane) => {
                  const laneTickets = boardTickets.filter(
                    (ticket) => ticket.status === lane.key
                  )
                  const styles = statusStyles[lane.key]

                  return (
                    <section
                      className={cn(
                        "flex min-h-[42rem] flex-col border",
                        styles.lane
                      )}
                      key={lane.key}
                    >
                      <div className={cn("border-b px-4 py-4", styles.laneHeader)}>
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                              {lane.label}
                            </p>
                            <h3 className="mt-2 font-heading text-2xl font-semibold tracking-tight">
                              {lane.value}
                            </h3>
                          </div>
                          <LaneBadge status={lane.key} />
                        </div>
                        <p className="mt-3 text-sm/7 text-muted-foreground">
                          {lane.description}
                        </p>
                      </div>

                      <div className="flex flex-1 flex-col gap-3 p-3">
                        {laneTickets.map((ticket) => {
                          const ticketStyles = statusStyles[ticket.status]

                          return (
                            <article
                              className={cn(
                                "border px-4 py-4 transition-colors",
                                ticketStyles.card
                              )}
                              key={ticket.id}
                            >
                              <div className="flex items-start justify-between gap-4">
                                <div className="space-y-1">
                                  <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                                    {ticket.id}
                                  </p>
                                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                                    {ticket.area}
                                  </p>
                                </div>
                                <TicketStatusChip status={ticket.status} />
                              </div>

                              <h4 className="mt-4 text-lg font-semibold tracking-tight">
                                {ticket.title}
                              </h4>
                              <p className="mt-2 text-sm/7 text-muted-foreground">
                                {ticket.summary}
                              </p>

                              <div className="mt-4 space-y-3">
                                <TicketMeta label="Evidence" value={ticket.evidence} />
                                <TicketMeta
                                  label="Routes"
                                  value={ticket.routes.join("  |  ")}
                                />
                                <TicketMeta label="Updated" value={ticket.updatedAt} />
                              </div>

                              <div className="mt-4 flex justify-end">
                                <Button
                                  className="rounded-none"
                                  onClick={() => setSelectedTicketId(ticket.id)}
                                  size="sm"
                                  variant="outline"
                                >
                                  View report
                                </Button>
                              </div>
                            </article>
                          )
                        })}
                      </div>
                    </section>
                  )
                })}
              </div>
            </div>
          </section>

          <section className="mt-4 grid gap-4 lg:grid-cols-2">
            <article className="border border-border bg-background">
              <div className="border-b border-border px-4 py-3 sm:px-5">
                <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                  <CheckCircle2Icon className="size-3.5" />
                  Shipped recently
                </div>
                <h2 className="mt-2 font-heading text-2xl font-semibold tracking-tight">
                  Latest public milestones
                </h2>
              </div>

              <div className="grid gap-px bg-border">
                <MilestoneCard
                  body="Authenticated suppliers can now create, update, and list their own public supply through the v1 onboarding surface."
                  date="April 27, 2026"
                  title="Public supplier onboarding shipped"
                />
                <MilestoneCard
                  body="Claims now reserve capacity, delivery releases it, and routing blocks over-assignment once a supply slot is exhausted."
                  date="April 27, 2026"
                  title="Supplier capacity controls shipped"
                />
                <MilestoneCard
                  body="Boreal now advances payouts through pending, processing, and paid states, with aggregate settlement updates attached."
                  date="April 27, 2026"
                  title="Payout progression shipped"
                />
                <MilestoneCard
                  body="The request-first contract now verifies the signed devnet receipt against a fetched Solana devnet transaction, signer, confirmation, and payment memo."
                  date="April 27, 2026"
                  title="Stronger request payment verification shipped"
                />
              </div>
            </article>

            <article className="border border-border bg-background">
              <div className="border-b border-border px-4 py-3 sm:px-5">
                <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                  <RadarIcon className="size-3.5" />
                  Message boundary
                </div>
                <h2 className="mt-2 font-heading text-2xl font-semibold tracking-tight">
                  What this board should not do
                </h2>
              </div>

              <div className="space-y-3 px-4 py-4 sm:px-5">
                <BoundaryCard copy="Do not expose private agent task assignment, branch names, blockers, or merge choreography here." />
                <BoundaryCard copy="Do not turn roadmap work into a fake shipped claim just because the direction is clear." />
                <BoundaryCard copy="Do not market Boreal as finished protocol-native settlement infrastructure yet." />
                <BoundaryCard copy="Use this board for public-safe product status. Keep internal ops boards somewhere else." />
              </div>
            </article>
          </section>

          <section className="mt-4 border border-border bg-muted/16">
            <div className="grid gap-px bg-border lg:grid-cols-2">
              <article className="bg-background px-4 py-4 sm:px-5">
                <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                  <FlagIcon className="size-3.5" />
                  Route role
                </div>
                <p className="mt-3 max-w-2xl text-sm/7 text-muted-foreground">
                  `/about` explains the system. `/roadmap` tracks public status.
                  Internal task execution, agent reporting, merge sequencing, and
                  blockers should not appear here.
                </p>
              </article>

              <article className="bg-background px-4 py-4 sm:px-5">
                <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                  <Clock3Icon className="size-3.5" />
                  Current public line
                </div>
                <p className="mt-3 max-w-2xl text-sm/7 text-muted-foreground">
                  Boreal is a chat-native market for request-native commerce. The
                  board should reinforce that live truth while clearly separating
                  active hardening from later roadmap work.
                </p>
              </article>
            </div>
          </section>

          <div className="pt-8">
            <PublicPageFooter />
          </div>
        </div>
      </main>

      <TicketReportDialog
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

function LaneBadge({ status }: { status: BoardStatus }) {
  return <TicketStatusChip status={status} />
}

function TicketStatusChip({ status }: { status: BoardStatus }) {
  const label =
    status === "live"
      ? "Live"
      : status === "in_progress"
        ? "In progress"
        : status === "next"
          ? "Next"
          : "Later"

  return (
    <span
      className={cn(
        "border px-2 py-1 text-[11px] uppercase tracking-[0.18em]",
        statusStyles[status].chip
      )}
    >
      {label}
    </span>
  )
}

function TicketMeta({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="border border-border bg-background px-3 py-3">
      <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-sm/7">{value}</p>
    </div>
  )
}

function TicketReportDialog({
  onOpenChange,
  ticket,
}: {
  onOpenChange: (open: boolean) => void
  ticket: BoardTicket | null
}) {
  const styles = ticket ? statusStyles[ticket.status] : null

  return (
    <Dialog onOpenChange={onOpenChange} open={Boolean(ticket)}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto rounded-none border border-border bg-background p-0">
        {ticket ? (
          <>
            <div className={cn("border-b border-border px-5 py-5", styles?.modalAccent)}>
              <DialogHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2">
                    <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                      {ticket.id}
                    </p>
                    <DialogTitle className="font-heading text-2xl font-semibold tracking-tight">
                      {ticket.title}
                    </DialogTitle>
                  </div>
                  <TicketStatusChip status={ticket.status} />
                </div>
                <DialogDescription className="text-sm/7">
                  {ticket.summary}
                </DialogDescription>
              </DialogHeader>
            </div>

            <div className="grid gap-4 px-5 py-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
              <div className="space-y-4">
                <TicketMeta label="Area" value={ticket.area} />
                <TicketMeta label="Evidence" value={ticket.evidence} />
                <TicketMeta label="Routes" value={ticket.routes.join("  |  ")} />
                <TicketMeta label="Updated" value={ticket.updatedAt} />
              </div>

              <div className="space-y-4">
                <section className="border border-border bg-muted/16 px-4 py-4">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                    Public report
                  </p>
                  <p className="mt-3 text-sm/7">{ticket.report}</p>
                </section>

                <section className="border border-border bg-background px-4 py-4">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                    Board meaning
                  </p>
                  <p className="mt-3 text-sm/7 text-muted-foreground">
                    This modal is the expanded public-safe detail view. It can
                    explain why the ticket is in its current lane without
                    exposing private execution details or internal merge notes.
                  </p>
                </section>
              </div>
            </div>

            <DialogFooter className="border-t border-border px-5 py-4" showCloseButton />
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}

function MilestoneCard({
  body,
  date,
  title,
}: {
  body: string
  date: string
  title: string
}) {
  return (
    <article className="bg-background px-4 py-4 sm:px-5">
      <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
        {date}
      </p>
      <h3 className="mt-2 text-lg font-semibold tracking-tight">{title}</h3>
      <p className="mt-2 text-sm/7 text-muted-foreground">{body}</p>
    </article>
  )
}

function BoundaryCard({ copy }: { copy: string }) {
  return (
    <div className="border border-border px-4 py-3">
      <p className="text-sm/7">{copy}</p>
    </div>
  )
}
