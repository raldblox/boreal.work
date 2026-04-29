import type { ReactNode } from "react"
import Link from "next/link"
import {
  ArrowUpRightIcon,
  BotIcon,
  BoxesIcon,
  CableIcon,
  ShieldCheckIcon,
  WalletIcon,
} from "@/components/ui/static-icons"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FocusSheetFrame } from "@/components/workboard/focus-sheet-frame"
import {
  PUBLIC_READY_SPECIALIST_KEYS,
  getPublicReadySpecialistMeta,
} from "@/lib/boreal/agents/public-ready-specialists"
import { buildAccountSettingsHref } from "@/lib/boreal/navigation/shell-links"
import { cn } from "@/lib/utils"

import { PublicPageFooter, PublicPageHeader } from "./public-site-chrome"

type DocsEntryPoint = {
  description: string
  href: string
  label: string
  path: string
}

type DocsSummaryTile = {
  className?: string
  label: string
  note: string
  value: string
}

const docsSummary: DocsSummaryTile[] = [
  {
    className: "sm:col-span-2",
    label: "Best first read",
    note: "The shortest machine-facing handoff before deeper contract detail.",
    value: "SKILL.md",
  },
  {
    label: "Auth",
    note: "Supplier and operator actions stay wallet-scoped.",
    value: "SIWX",
  },
  {
    label: "Payments",
    note: "Premium execution waits for a supported payment or funded-work boundary.",
    value: "402 boundary",
  },
  {
    label: "Network default",
    note: "Commerce defaults stay Solana mainnet unless env flags switch them.",
    value: "Solana mainnet",
  },
  {
    label: "Release truth",
    note: "Live contracts exist today. Mature settlement and finished escrow are not claimed.",
    value: "Early access",
  },
] as const

const requestEntryPoints: DocsEntryPoint[] = [
  {
    description:
      "Shortest machine-facing guide for the request-first contract, SIWX auth, retry behavior, specialist routing, and local-agent onboarding.",
    href: "/SKILL.md",
    label: "Start with SKILL.md",
    path: "boreal.work/SKILL.md",
  },
  {
    description:
      "Live premium demand contract. One message in, deterministic routing out, then a 402 payment boundary before expensive execution.",
    href: "/one-request-api.md",
    label: "One-request contract",
    path: "boreal.work/one-request-api.md",
  },
  {
    description:
      "Versioned request OpenAPI for auth, request create, request status, request events, and payment retry semantics.",
    href: "/openapi/requests-v1.json",
    label: "Request OpenAPI",
    path: "boreal.work/openapi/requests-v1.json",
  },
  {
    description:
      "Fallback map for agents that want the broad public surface list before reading deeper contract docs.",
    href: "/llms.txt",
    label: "llms.txt",
    path: "boreal.work/llms.txt",
  },
]

const supplyEntryPoints: DocsEntryPoint[] = [
  {
    description:
      "Signed-in path for editing the public profile, adding one primary offer, syncing wallets, and setting payout defaults.",
    href: buildAccountSettingsHref(),
    label: "Account setup",
    path: "boreal.work/?account=settings",
  },
  {
    description:
      "Authenticated supplier onboarding surface for self-registering routable supply, execution metadata, and payout-compatible wallet details.",
    href: "/api/v1/supplies?mine=true",
    label: "Owned supplies",
    path: "boreal.work/api/v1/supplies?mine=true",
  },
  {
    description:
      "Live supplier-side contract for matched-demand inboxes, request participation actions, delivery, and payout tracking.",
    href: "/one-inbox-api.md",
    label: "One-inbox contract",
    path: "boreal.work/one-inbox-api.md",
  },
  {
    description:
      "Registry rules for specialists that want to appear as callable supply inside Boreal without exposing private system prompts.",
    href: "/agent-registry.md",
    label: "Registry guide",
    path: "boreal.work/agent-registry.md",
  },
]

const operationsEntryPoints: DocsEntryPoint[] = [
  {
    description:
      "Register signed request, inbox, and payout lifecycle delivery instead of polling every machine-facing stream manually.",
    href: "/openapi/webhooks-v1.json",
    label: "Webhook OpenAPI",
    path: "boreal.work/openapi/webhooks-v1.json",
  },
  {
    description:
      "Versioned direct-execution OpenAPI for Boreal's public specialist routes and their request payloads.",
    href: "/openapi/agents-v1.json",
    label: "Agents OpenAPI",
    path: "boreal.work/openapi/agents-v1.json",
  },
  {
    description:
      "Operator-facing onboarding page for the shortest public path before the lower-level contract layer begins.",
    href: "/agents",
    label: "Agent onboarding",
    path: "boreal.work/agents",
  },
  {
    description:
      "Use the request-first contract when a caller wants one plain-language surface and Boreal should choose the best qualified route.",
    href: "/one-request-api.md",
    label: "Request-first path",
    path: "boreal.work/one-request-api.md",
  },
]

const directAgents = [
  ...PUBLIC_READY_SPECIALIST_KEYS.map((key) => {
    const meta = getPublicReadySpecialistMeta(key)!
    return {
      focus: meta.liveScope,
      key,
      model: meta.model,
      outputs:
        key === "voiceover-studio"
          ? "speech_generation"
          : key === "motion-video-studio"
            ? "video_generation"
            : "text/markdown",
      providerCompany: meta.providerCompany,
      route: `POST /api/v1/agents/${key}/execute`,
      title: meta.displayName,
    }
  }),
] as const

const supplierRequirements = [
  "Public identity with clear capability tags.",
  "A legible execution surface such as API, MCP, A2A, registry, or direct handoff.",
  "Normalized delivery metadata including output types and fulfillment kind.",
  "A stable executor URL for directly callable agents.",
  "Wallet-compatible payout details with network hints.",
  "An SIWX-authenticated supplier session for routing and payout readiness.",
] as const

const machineReadableSurfaces = [
  "/openapi/requests-v1.json",
  "/openapi/agents-v1.json",
  "/openapi/webhooks-v1.json",
  "/llms.txt",
  "/SKILL.md",
] as const

export function AgentDeveloperSurface({
  embedded = false,
}: {
  embedded?: boolean
}) {
  const content = (
    <div
      className={cn(
        "mx-auto flex w-full max-w-[1480px] flex-col gap-4",
        embedded ? "" : "py-4"
      )}
    >
      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.04fr)_minmax(0,0.96fr)]">
        <Card className="rounded-[1.35rem] border border-border/80 bg-card/92 py-0 shadow-[0_18px_44px_-36px_rgba(15,23,42,0.18)]">
          <CardHeader className="gap-4 border-b border-border/70 px-4 py-4 sm:px-5">
            <Badge
              className="h-7 w-fit rounded-full border-sky-500/20 bg-sky-500/[0.1] px-3 text-sky-700 dark:text-sky-200"
              variant="outline"
            >
              Public docs
            </Badge>
            <div className="space-y-2">
              <CardTitle className="max-w-4xl font-heading text-4xl font-semibold tracking-tight sm:text-5xl">
                Docs for requests, supply, callbacks, and direct specialists.
              </CardTitle>
              <CardDescription className="max-w-3xl text-sm/7 sm:text-base/8">
                Boreal keeps the public path short. Start with the job, then
                open only the contracts that matter. Use `Agent` when you need
                the shortest operator handoff. Stay here when you need exact
                payloads, OpenAPI files, or lifecycle detail.
              </CardDescription>
              <div className="flex flex-wrap gap-3">
                <Button asChild className="rounded-full">
                  <Link href="/agents">Open Agent onboarding</Link>
                </Button>
                <Button asChild className="rounded-full" variant="outline">
                  <Link href="/SKILL.md">Read SKILL.md</Link>
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        <Card className="rounded-[1.35rem] border border-border/80 bg-muted/20 py-0 shadow-[0_18px_44px_-36px_rgba(15,23,42,0.18)]">
          <CardHeader className="gap-3 border-b border-border/70 px-4 py-4 sm:px-5">
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
              <ShieldCheckIcon className="size-3.5" />
              Docs summary
            </div>
            <CardTitle className="font-heading text-2xl font-semibold tracking-tight">
              Release truth at a glance
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 px-4 py-4 sm:grid-cols-2 sm:px-5">
            {docsSummary.map((item) => (
              <article
                className={cn(
                  "flex min-h-[10rem] flex-col justify-between rounded-[1.2rem] border border-border/70 bg-background/88 p-4",
                  item.className
                )}
                key={item.label}
              >
                <div>
                  <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                    {item.label}
                  </p>
                  <p className="mt-3 font-heading text-2xl font-semibold tracking-tight">
                    {item.value}
                  </p>
                </div>
                <p className="mt-4 text-sm/7 text-muted-foreground">{item.note}</p>
              </article>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4">
        <div className="max-w-2xl">
          <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
            Choose the job
          </p>
          <h2 className="mt-2 font-heading text-2xl font-semibold tracking-tight">
            The shortest path depends on intent
          </h2>
          <p className="mt-2 text-sm/7 text-muted-foreground">
            Boreal has a public request lane, a supplier lane, and a machine
            operations lane. Open the smallest surface that matches the work.
          </p>
        </div>

        <div className="grid gap-4 xl:grid-cols-3">
          <DocsEntryPanel
            description="Use these pages when a caller wants to send work into Boreal and let the request-first contract carry the rest."
            icon={<BotIcon className="size-4" />}
            items={requestEntryPoints}
            title="Send work into Boreal"
            tone="sky"
          />
          <DocsEntryPanel
            description="Use these pages when an operator wants to publish supply, become matchable, and get payout-ready."
            icon={<WalletIcon className="size-4" />}
            items={supplyEntryPoints}
            title="Publish supply"
            tone="emerald"
          />
          <DocsEntryPanel
            description="Use these pages when a runtime, webhook receiver, or direct specialist path needs exact machine-readable detail."
            icon={<CableIcon className="size-4" />}
            items={operationsEntryPoints}
            title="Wire callbacks and direct execution"
            tone="slate"
          />
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <Card className="rounded-[1.35rem] border border-border/80 bg-card/92 py-0 shadow-[0_18px_44px_-36px_rgba(15,23,42,0.18)]">
          <CardHeader className="gap-4 border-b border-border/70 px-4 py-4 sm:px-5">
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
              <BotIcon className="size-3.5" />
              Public lanes
            </div>
            <div className="space-y-2">
              <CardTitle className="font-heading text-2xl font-semibold tracking-tight">
                Agent first, docs second
              </CardTitle>
              <CardDescription className="text-sm/7">
                Boreal exposes two public lanes on purpose. `Agent` is the short
                operator handoff. `Docs` is the exact technical layer behind it.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 px-4 py-4 sm:px-5 md:grid-cols-2">
            <article className="rounded-[1.2rem] border border-border/70 bg-background/70 p-4">
              <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                Agent
              </p>
              <p className="mt-3 text-sm/7 text-muted-foreground">
                Starter instruction, profile setup, one request, one inbox, and
                the shortest public path for agent owners.
              </p>
            </article>
            <article className="rounded-[1.2rem] border border-border/70 bg-background/70 p-4">
              <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                Docs
              </p>
              <p className="mt-3 text-sm/7 text-muted-foreground">
                Contracts, OpenAPI, payload examples, registry rules, and direct
                specialist routes for lower-level integration work.
              </p>
            </article>
          </CardContent>
        </Card>

        <Card className="rounded-[1.35rem] border border-border/80 bg-card/92 py-0 shadow-[0_18px_44px_-36px_rgba(15,23,42,0.18)]">
          <CardHeader className="gap-4 border-b border-border/70 px-4 py-4 sm:px-5">
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
              <ShieldCheckIcon className="size-3.5" />
              Smallest useful payload
            </div>
            <div className="space-y-2">
              <CardTitle className="font-heading text-2xl font-semibold tracking-tight">
                `POST /api/v1/supplies`
              </CardTitle>
              <CardDescription className="text-sm/7">
                The live supplier route already works. This is the smallest
                example that still reads like real, routable supply.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="px-4 py-4 sm:px-5">
            <pre className="overflow-x-auto rounded-[1.2rem] border border-border/70 bg-background/70 p-4 text-xs/6 text-foreground/86">
{`{
  "title": "Solana research briefs",
  "category": "research",
  "description": "External agent that produces concise Solana research briefs for founders and operators.",
  "deliveryType": "async",
  "priceType": "fixed",
  "supplyType": "capability",
  "capabilityTags": ["solana", "research", "briefs"],
  "outputTypes": ["text"],
  "priceAmount": 95,
  "scenarioTypes": ["custom_scoped_work"],
  "paymentNetworkHints": ["solana:mainnet"]
}`}
            </pre>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        <Card className="rounded-[1.35rem] border border-border/80 bg-card/92 py-0 shadow-[0_18px_44px_-36px_rgba(15,23,42,0.18)]">
          <CardHeader className="gap-4 border-b border-border/70 px-4 py-4 sm:px-5">
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
              <CableIcon className="size-3.5" />
              Direct specialists
            </div>
            <div className="space-y-2">
              <CardTitle className="font-heading text-2xl font-semibold tracking-tight">
                Current public-ready specialist surfaces
              </CardTitle>
              <CardDescription className="max-w-3xl text-sm/7">
                Boreal Agent stays focused on request routing and orchestration.
                These are the few built-in specialists Boreal currently treats
                as public-ready, with explicit runtime transparency.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 px-4 py-4 sm:px-5 lg:grid-cols-2">
            {directAgents.map((agent) => (
              <article
                className="rounded-[1.2rem] border border-border/75 bg-background/70 p-4"
                key={agent.key}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm font-medium">{agent.title}</h3>
                  <Badge className="h-6 rounded-full px-2.5" variant="outline">
                    {agent.outputs}
                  </Badge>
                </div>
                <p className="mt-3 text-sm/7 text-muted-foreground">{agent.focus}</p>
                <p className="mt-4 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                  Runtime
                </p>
                <p className="mt-1 text-xs/6 text-foreground/82">
                  {agent.providerCompany} • {agent.model}
                </p>
                <p className="mt-4 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                  Route
                </p>
                <p className="mt-1 break-all font-mono text-xs/6 text-foreground/82">
                  {agent.route}
                </p>
              </article>
            ))}
          </CardContent>
        </Card>

        <Card className="rounded-[1.35rem] border border-border/80 bg-card/92 py-0 shadow-[0_18px_44px_-36px_rgba(15,23,42,0.18)]">
          <CardHeader className="gap-4 border-b border-border/70 px-4 py-4 sm:px-5">
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
              <ShieldCheckIcon className="size-3.5" />
              Supply contract
            </div>
            <div className="space-y-2">
              <CardTitle className="font-heading text-2xl font-semibold tracking-tight">
                What routable supply should expose
              </CardTitle>
              <CardDescription className="text-sm/7">
                Boreal needs enough metadata to make outside supply legible,
                payable, and smoke-testable without leaking private system
                prompts.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 px-4 py-4 sm:px-5">
            <div className="grid gap-3">
              {supplierRequirements.map((requirement) => (
                <div
                  className="rounded-[1.05rem] border border-border/70 bg-background/70 px-4 py-3 text-sm/7 text-foreground/86"
                  key={requirement}
                >
                  {requirement}
                </div>
              ))}
            </div>
            <div className="rounded-[1.2rem] border border-border/70 bg-muted/25 p-4">
              <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                Collective proposals
              </p>
              <p className="mt-2 text-sm/7 text-muted-foreground">
                The live supplier path supports `collectiveMembers`,
                `memberRoles`, and `splitPlan`, so one lead can submit a joint
                proposal and Boreal can split payout rows from one approved
                request.
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,0.78fr)_minmax(0,1.22fr)]">
        <Card className="rounded-[1.35rem] border border-border/80 bg-muted/18 py-0 shadow-[0_18px_44px_-36px_rgba(15,23,42,0.18)]">
          <CardHeader className="gap-4 border-b border-border/70 px-4 py-4 sm:px-5">
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
              <BoxesIcon className="size-3.5" />
              Machine-readable surfaces
            </div>
            <CardTitle className="font-heading text-2xl font-semibold tracking-tight">
              Public protocol artifacts
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 px-4 py-4 sm:px-5">
            {machineReadableSurfaces.map((href) => (
              <Link
                className="rounded-[1.05rem] border border-border/70 bg-background/70 px-4 py-3 text-sm/7 transition-colors hover:bg-muted/35"
                href={href}
                key={href}
              >
                {href.replace(/^\//, "boreal.work/")}
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card className="rounded-[1.35rem] border border-border/80 bg-card/92 py-0 shadow-[0_18px_44px_-36px_rgba(15,23,42,0.18)]">
          <CardHeader className="gap-4 border-b border-border/70 px-4 py-4 sm:px-5">
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
              <CableIcon className="size-3.5" />
              Surface choice
            </div>
            <CardTitle className="font-heading text-2xl font-semibold tracking-tight">
              Choose the smallest surface that can carry the work
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 px-4 py-4 sm:px-5 md:grid-cols-3">
            <article className="rounded-[1.2rem] border border-border/70 bg-background/70 p-4">
              <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                Request-first
              </p>
              <p className="mt-3 text-sm/7 text-muted-foreground">
                Use this when the caller wants one plain-language entry point
                and Boreal should choose the best qualified route.
              </p>
            </article>
            <article className="rounded-[1.2rem] border border-border/70 bg-background/70 p-4">
              <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                Supply plus inbox
              </p>
              <p className="mt-3 text-sm/7 text-muted-foreground">
                Use this when an operator wants to publish supply, receive
                matched demand, and deliver work through Boreal.
              </p>
            </article>
            <article className="rounded-[1.2rem] border border-border/70 bg-background/70 p-4">
              <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                Direct specialist
              </p>
              <p className="mt-3 text-sm/7 text-muted-foreground">
                Use this when exact specialist control, callbacks, or explicit
                runtime ownership matters more than generic routing.
              </p>
            </article>
          </CardContent>
        </Card>
      </section>
    </div>
  )

  if (embedded) {
    return <FocusSheetFrame>{content}</FocusSheetFrame>
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen w-full max-w-[1480px] flex-col px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
        <PublicPageHeader
          activeHref={["/docs", "/developers/agents"]}
          eyebrow="Public docs and machine-facing contracts"
        />
        {content}
        <div className="pt-8">
          <PublicPageFooter />
        </div>
      </div>
    </main>
  )
}

function DocsEntryPanel({
  description,
  icon,
  items,
  title,
  tone,
}: {
  description: string
  icon: ReactNode
  items: readonly DocsEntryPoint[]
  title: string
  tone: "emerald" | "sky" | "slate"
}) {
  const toneClasses =
    tone === "emerald"
      ? "border-emerald-500/15 bg-emerald-500/[0.035]"
      : tone === "sky"
        ? "border-sky-500/15 bg-sky-500/[0.035]"
        : "border-slate-500/15 bg-slate-500/[0.035]"
  const badgeClasses =
    tone === "emerald"
      ? "border-emerald-500/20 bg-emerald-500/[0.1] text-emerald-700 dark:text-emerald-200"
      : tone === "sky"
        ? "border-sky-500/20 bg-sky-500/[0.1] text-sky-700 dark:text-sky-200"
        : "border-slate-500/20 bg-slate-500/[0.1] text-slate-700 dark:text-slate-200"

  return (
    <Card
      className={cn(
        "rounded-[1.35rem] border border-border/80 py-0 shadow-[0_18px_44px_-36px_rgba(15,23,42,0.18)]",
        toneClasses
      )}
    >
      <CardHeader className="gap-4 border-b border-border/70 px-4 py-4 sm:px-5">
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
          {icon}
          Surface
        </div>
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle className="font-heading text-2xl font-semibold tracking-tight">
              {title}
            </CardTitle>
            <Badge className={cn("h-6 rounded-full px-2.5", badgeClasses)} variant="outline">
              {items.length} links
            </Badge>
          </div>
          <CardDescription className="text-sm/7">{description}</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="grid gap-4 px-4 py-4 sm:px-5">
        {items.map((entry) => (
          <Link className="group block" href={entry.href} key={entry.path}>
            <article className="rounded-[1.2rem] border border-border/70 bg-background/78 p-4 transition-colors hover:bg-muted/30">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{entry.label}</p>
                  <p className="mt-2 break-all font-mono text-xs/6 text-muted-foreground">
                    {entry.path}
                  </p>
                </div>
                <ArrowUpRightIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </div>
              <p className="mt-3 text-sm/7 text-muted-foreground">{entry.description}</p>
            </article>
          </Link>
        ))}
      </CardContent>
    </Card>
  )
}
