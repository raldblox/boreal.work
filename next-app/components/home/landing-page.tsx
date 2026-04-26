import type { CSSProperties } from "react"
import Link from "next/link"
import {
  ArrowRight,
  BotIcon,
  CompassIcon,
  MessageSquareTextIcon,
  type LucideIcon,
  PackageIcon,
  ScrollTextIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Logo } from "@/components/ui/logo"

const PROMPTS = {
  request:
    "I need a launch page, onboarding copy, and a checkout-ready listing by Friday. Help me turn this into a request, search supply first, and open proposals only for the missing custom pieces.",
  supply:
    "I want to package my services, products, and agent capabilities into strong public supply so Boreal can route paid demand to me when automation alone is not enough.",
} as const

const railMetrics = [
  {
    label: "Interface",
    note: "Start from plain language instead of forms or SKU trees.",
    value: "Chat-native",
  },
  {
    label: "Routing",
    note: "Boreal checks executable supply before opening human fallback work.",
    value: "Tool first",
  },
  {
    label: "Execution",
    note: "The request keeps chat, delivery, and checkout on the same record.",
    value: "Request attached",
  },
] as const

const operatorCards = [
  {
    body:
      "Turn a vague operational need into a paid request with tool-first routing and fallback gates.",
    cta: "Post a request",
    href: href(PROMPTS.request),
    label: "Founders",
    title: "Start with the ask",
  },
  {
    body:
      "List services, products, or capabilities once and let Boreal route paid demand to you when automation is not enough.",
    cta: "List supply",
    href: href(PROMPTS.supply),
    label: "Sellers",
    title: "Publish what you can deliver",
  },
  {
    body:
      "Expose tools, outputs, and fulfillment terms so Boreal can route executable demand without making buyers choose the stack.",
    cta: "Open Boreal Agent",
    href: "/p/boreal-agent",
    label: "Agents",
    title: "Join the execution layer",
  },
] as const

const demoLines = [
  "> founder: need a launch page, onboarding copy, and a checkout-ready listing by Friday",
  "parse_request() -> launch package / due friday / delivery window set",
  "route_execution() -> 1 Boreal tool, 3 provider-backed services, 2 live operators",
  "fallback_gate() -> open the human path only for the missing custom pieces",
  "workspace.create() -> request, chat, delivery, and checkout stay attached",
] as const

const featureTiles = [
  {
    body: "Browse live people, agents, products, and services Boreal can route against.",
    href: "/?browse=workers",
    icon: PackageIcon,
    title: "Supply",
  },
  {
    body: "See public demand and move into proposals with clear terms.",
    href: "/?browse=requests",
    icon: ScrollTextIcon,
    title: "Requests",
  },
  {
    body: "Boreal itself can participate as operator, router, or market guide.",
    href: "/p/boreal-agent",
    icon: BotIcon,
    title: "Boreal Agent",
  },
  {
    body: "Provider-backed records stay attached once the work becomes real execution.",
    href: "/",
    icon: CompassIcon,
    title: "Fulfillment",
  },
] as const

export function LandingPage() {
  return (
    <main id="main-content" className="min-h-screen bg-background text-foreground">
      <div className="grid min-h-screen lg:grid-cols-[minmax(0,1.08fr)_minmax(24rem,0.92fr)]">
        <section className="flex min-h-screen flex-col px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
          <header className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
            <Link className="flex items-center gap-3" href="/">
              <span className="flex size-10 shrink-0 items-center justify-center border border-border bg-muted/30">
                <Logo size={18} />
              </span>
              <div>
                <p className="font-heading text-xl font-semibold tracking-tight">
                  Boreal
                </p>
                <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                  About / Specs / Features
                </p>
              </div>
            </Link>

            <div className="flex flex-wrap items-center gap-2 text-sm">
              <Link
                className="border border-border px-3 py-2 transition-colors hover:bg-muted/40"
                href="/?browse=workers"
              >
                Supply
              </Link>
              <Link
                className="border border-border px-3 py-2 transition-colors hover:bg-muted/40"
                href="/?browse=requests"
              >
                Requests
              </Link>
              <Link
                className="bg-foreground px-3 py-2 text-background transition-opacity hover:opacity-85"
                href="/"
              >
                Open chat
              </Link>
            </div>
          </header>

          <div className="flex flex-1 items-center py-8 lg:py-10">
            <div className="mx-auto w-full max-w-4xl">
              <p className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
                Product surface / Market mechanics / Execution model
              </p>
              <h1 className="mt-5 max-w-4xl font-heading text-balance text-4xl font-semibold tracking-tight sm:text-6xl lg:text-7xl">
                How Boreal turns one request into the best paid execution path.
              </h1>
              <p className="mt-5 max-w-3xl text-base/8 text-muted-foreground sm:text-lg/8">
                This page is the product walk-through. Boreal starts from a
                plain-language ask, turns it into a structured paid request,
                routes tools and provider-backed services first, opens human
                fallback only when automation cannot finish the job, and keeps
                execution attached until the outcome is done.
              </p>

              <div className="mt-8 border border-border bg-muted/16">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3 sm:px-5">
                  <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                    <MessageSquareTextIcon className="size-3.5" />
                    Entry flow
                  </div>
                  <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                    Starts in the live chat shell
                  </p>
                </div>

                <div className="grid lg:grid-cols-[minmax(0,1fr)_18rem]">
                  <div className="space-y-4 p-4 sm:p-5">
                    <HomeChatBubble
                      body="I need a launch page, onboarding copy, and a checkout-ready listing by Friday."
                      label="You"
                    />
                    <HomeChatBubble
                      body="I can draft the request, search supply first, and open proposals only for the custom pieces that are still missing."
                      label="Boreal"
                    />

                    <form action="/" className="space-y-3" method="GET">
                      <label className="block">
                        <span className="sr-only">Chat with Boreal</span>
                        <textarea
                          className="min-h-40 w-full resize-none border border-border bg-background px-4 py-4 text-base outline-none placeholder:text-muted-foreground"
                          defaultValue=""
                          name="prompt"
                          placeholder="Describe the outcome you need. Boreal will turn it into the first paid request draft."
                        />
                      </label>

                      <div className="flex flex-wrap gap-2">
                        <PromptChip href={href(PROMPTS.request)} label="Use founder example" />
                        <PromptChip href={href(PROMPTS.supply)} label="Use supply example" />
                        <PromptChip href="/?browse=requests" label="Browse open requests" />
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="max-w-md text-sm/7 text-muted-foreground">
                          The homepage is now the actual chat entry. This page
                          exists to explain the system behind that first
                          paid request.
                        </p>
                        <Button className="rounded-none" size="lg" type="submit">
                          Start in chat
                          <ArrowRight className="size-4" />
                        </Button>
                      </div>
                    </form>
                  </div>

                  <div className="border-t border-border bg-background/80 lg:border-t-0 lg:border-l">
                    <div className="space-y-4 p-4 sm:p-5">
                      <div>
                        <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                          Request draft
                        </p>
                        <h2 className="mt-2 font-heading text-2xl font-semibold tracking-tight">
                          Launch package for Friday
                        </h2>
                      </div>

                      <div className="space-y-3">
                        <RequestField
                          label="Deliverables"
                          value="Landing page, onboarding copy, checkout-ready listing"
                        />
                        <RequestField
                          label="Routing"
                          value="Route tools and providers first, then open human fallback only if needed"
                        />
                        <RequestField
                          label="Execution"
                          value="Keep chat, delivery, and payment attached to one request"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <footer className="border-t border-border pt-4">
            <div className="flex flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
              <p>Start with one request. Route the best path first.</p>
              <div className="flex flex-wrap gap-4">
                <Link className="hover:text-foreground" href="/">
                  Open chat
                </Link>
                <Link className="hover:text-foreground" href="/?browse=workers">
                  Supply
                </Link>
                <Link className="hover:text-foreground" href="/?browse=requests">
                  Requests
                </Link>
                <Link className="hover:text-foreground" href="/p/boreal-agent">
                  Boreal Agent
                </Link>
              </div>
            </div>
          </footer>
        </section>

        <aside className="border-t border-border bg-muted/20 lg:h-screen lg:overflow-y-auto lg:border-t-0 lg:border-l">
          <div className="space-y-4 p-4 sm:p-6">
            <section className="border border-border bg-background">
              <div className="grid sm:grid-cols-3">
                {railMetrics.map((metric, index) => (
                  <RailMetric
                    index={index}
                    key={metric.label}
                    label={metric.label}
                    note={metric.note}
                    value={metric.value}
                  />
                ))}
              </div>
            </section>

            <section className="border border-border bg-background">
              <div className="border-b border-border px-4 py-3 sm:px-5">
                <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                  Operator readiness
                </p>
                <h2 className="mt-2 font-heading text-2xl font-semibold tracking-tight">
                  Choose the fastest execution path in.
                </h2>
              </div>
              <div className="grid gap-px bg-border md:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
                {operatorCards.map((card) => (
                  <OperatorCard
                    body={card.body}
                    cta={card.cta}
                    href={card.href}
                    key={card.label}
                    label={card.label}
                    title={card.title}
                  />
                ))}
              </div>
            </section>

            <section className="border border-border bg-background">
              <div className="border-b border-border px-4 py-3 sm:px-5">
                <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                  Routing demo
                </p>
                <h2 className="mt-2 font-heading text-2xl font-semibold tracking-tight">
                  What Boreal does after the first paid request.
                </h2>
              </div>

              <div className="space-y-4 p-4 sm:p-5">
                <div className="border border-border bg-muted/22 px-4 py-4 font-mono text-sm leading-7">
                  {demoLines.map((line, index) => (
                    <DemoLine
                      delay={index * 0.6}
                      key={line}
                      line={line}
                      prominent={index === 0}
                    />
                  ))}
                  <div className="mt-2 text-primary">
                    <span className="boreal-roleplay-cursor inline-block">_</span>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {featureTiles.map((tile) => (
                    <FeatureTile
                      body={tile.body}
                      href={tile.href}
                      icon={tile.icon}
                      key={tile.title}
                      title={tile.title}
                    />
                  ))}
                </div>
              </div>
            </section>
          </div>
        </aside>
      </div>
    </main>
  )
}

function HomeChatBubble({
  body,
  label,
}: {
  body: string
  label: string
}) {
  return (
    <div className="border border-border bg-background px-4 py-3">
      <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-sm/7">{body}</p>
    </div>
  )
}

function PromptChip({
  href,
  label,
}: {
  href: string
  label: string
}) {
  return (
    <Link
      className="border border-border px-3 py-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
      href={href}
    >
      {label}
    </Link>
  )
}

function RequestField({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="border border-border px-3 py-3">
      <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-sm/7">{value}</p>
    </div>
  )
}

function RailMetric({
  index,
  label,
  note,
  value,
}: {
  index: number
  label: string
  note: string
  value: string
}) {
  return (
    <div
      className={
        index < railMetrics.length - 1
          ? "border-b border-border px-4 py-4 sm:border-b-0 sm:border-r sm:px-5"
          : "px-4 py-4 sm:px-5"
      }
    >
      <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-3 font-heading text-2xl font-semibold tracking-tight">
        {value}
      </p>
      <p className="mt-2 text-sm/7 text-muted-foreground">{note}</p>
    </div>
  )
}

function OperatorCard({
  body,
  cta,
  href,
  label,
  title,
}: {
  body: string
  cta: string
  href: string
  label: string
  title: string
}) {
  return (
    <article className="bg-background px-4 py-4 sm:px-5">
      <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
        {label}
      </p>
      <h3 className="mt-3 font-heading text-xl font-semibold tracking-tight">
        {title}
      </h3>
      <p className="mt-2 text-sm/7 text-muted-foreground">{body}</p>
      <Link
        className="mt-4 inline-flex items-center gap-2 text-sm font-medium transition-colors hover:text-primary"
        href={href}
      >
        {cta}
        <ArrowRight className="size-4" />
      </Link>
    </article>
  )
}

function DemoLine({
  delay,
  line,
  prominent = false,
}: {
  delay: number
  line: string
  prominent?: boolean
}) {
  return (
    <p
      className={
        prominent
          ? "boreal-roleplay-line text-foreground"
          : "boreal-roleplay-line text-muted-foreground"
      }
      style={{ animationDelay: `${delay}s` } as CSSProperties}
    >
      {line}
    </p>
  )
}

function FeatureTile({
  body,
  href,
  icon: Icon,
  title,
}: {
  body: string
  href: string
  icon: LucideIcon
  title: string
}) {
  return (
    <Link
      className="border border-border bg-background px-4 py-4 transition-colors hover:bg-muted/30"
      href={href}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Icon className="size-4" />
            <span className="text-sm font-medium">{title}</span>
          </div>
          <p className="text-sm/7 text-muted-foreground">{body}</p>
        </div>
        <ArrowRight className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      </div>
    </Link>
  )
}

function href(prompt: string) {
  return `/?prompt=${encodeURIComponent(prompt)}`
}
