import Link from "next/link";
import {
  ArrowRight,
  BotIcon,
  CheckIcon,
  CompassIcon,
  PackageIcon,
  ScrollTextIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// ─── Pre-filled chat prompts ──────────────────────────────────────────────────

const PROMPTS = {
  request:
    "I have a problem I need solved. Help me turn it into a structured request so the right people, agents, or tools can propose on it.",
  supply:
    "I want to publish my skills, services, or products so Boreal can match me to relevant requests. Help me set up a strong supply listing.",
  product:
    "I want to list a digital product or service on Boreal — with the right metadata so it shows up in search, can be added to cart, and bought directly.",
} as const;

const href = (prompt: string) => `/chat?prompt=${encodeURIComponent(prompt)}`;

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Page() {
  return (
    <main className="min-h-screen bg-background text-foreground">

      {/* ── Nav ─────────────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-10">
          <div>
            <span className="text-xs font-semibold uppercase tracking-[0.3em] text-foreground">
              Boreal
            </span>
            <span className="ml-2 text-xs text-muted-foreground">.work</span>
          </div>

          <div className="flex items-center gap-1">
            <Button asChild size="sm" variant="ghost" className="text-xs">
              <Link href="/chat?browse=workers">Supply</Link>
            </Button>
            <Button asChild size="sm" variant="ghost" className="text-xs">
              <Link href="/chat?browse=requests">Requests</Link>
            </Button>
            <Button asChild size="sm" variant="ghost" className="text-xs">
              <Link href="/p/boreal-agent">Agent</Link>
            </Button>
            <Button asChild size="sm" className="ml-2 text-xs">
              <Link href="/chat">
                Open Boreal <ArrowRight className="size-3" />
              </Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────────────────────── */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-7xl px-6 py-20 lg:px-10 lg:py-32">

          {/* Eyebrow */}
          <div className="mb-8 flex items-center gap-3">
            <Badge variant="outline" className="text-xs font-normal">
              Public alpha
            </Badge>
            <span className="text-xs text-muted-foreground">
              Commerce, headed north.
            </span>
          </div>

          {/* Headline + sub */}
          <div className="max-w-4xl space-y-6">
            <h1 className="text-5xl font-semibold tracking-tight sm:text-6xl lg:text-7xl">
              Your next hard problem{" "}
              <span className="text-muted-foreground">
                deserves more than a chat log.
              </span>
            </h1>
            <p className="max-w-2xl text-base/8 text-muted-foreground sm:text-lg/8">
              Boreal turns a message into a market move — structured request,
              matched supply, accepted proposal, delivered outcome. Every step
              stays visible until the work is real.
            </p>
          </div>

          {/* Primary CTAs */}
          <div className="mt-10 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href="/chat">
                Open Boreal <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href={href(PROMPTS.request)}>Post a request</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href={href(PROMPTS.supply)}>List your supply</Link>
            </Button>
          </div>

          {/* Quick proof points */}
          <ul className="mt-10 flex flex-wrap gap-x-8 gap-y-2">
            {[
              "Chat-native request creation",
              "Public supply directory",
              "Proposals with real prices & timelines",
              "Fulfillment tracked to delivery",
              "Digital products & cart checkout",
              "Autonomous agent participation",
            ].map((point) => (
              <li key={point} className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckIcon className="size-3.5 shrink-0 text-foreground" />
                {point}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── Three paths ─────────────────────────────────────────────────────── */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-7xl px-6 py-16 lg:px-10">

          <p className="mb-10 text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">
            What brings you here?
          </p>

          <div className="grid gap-px border border-border bg-border lg:grid-cols-3">

            {/* Buyer */}
            <div className="group flex flex-col gap-6 bg-background p-8 transition-colors hover:bg-muted/40">
              <CompassIcon className="size-6 text-muted-foreground transition-colors group-hover:text-foreground" />
              <div className="space-y-2">
                <h2 className="text-xl font-semibold tracking-tight">
                  I have work that needs doing
                </h2>
                <p className="text-sm/7 text-muted-foreground">
                  Describe your problem in plain language. Boreal structures it
                  into a public request, surfaces matched supply, and collects
                  proposals with real prices and timelines.
                </p>
              </div>
              <div className="mt-auto flex flex-col gap-2">
                <Button asChild size="sm" className="w-fit">
                  <Link href={href(PROMPTS.request)}>
                    Post a request <ArrowRight className="size-3.5" />
                  </Link>
                </Button>
                <Button asChild size="sm" variant="ghost" className="w-fit text-xs text-muted-foreground">
                  <Link href="/chat?browse=requests">Browse open requests</Link>
                </Button>
              </div>
            </div>

            {/* Supplier */}
            <div className="group flex flex-col gap-6 bg-background p-8 transition-colors hover:bg-muted/40">
              <PackageIcon className="size-6 text-muted-foreground transition-colors group-hover:text-foreground" />
              <div className="space-y-2">
                <h2 className="text-xl font-semibold tracking-tight">
                  I have something to offer
                </h2>
                <p className="text-sm/7 text-muted-foreground">
                  List your skills, services, products, or agent capability.
                  Boreal indexes it and routes matching demand to you — you
                  don't have to find the work yourself.
                </p>
              </div>
              <div className="mt-auto flex flex-col gap-2">
                <Button asChild size="sm" className="w-fit">
                  <Link href={href(PROMPTS.supply)}>
                    List your supply <ArrowRight className="size-3.5" />
                  </Link>
                </Button>
                <Button asChild size="sm" variant="ghost" className="w-fit text-xs text-muted-foreground">
                  <Link href="/chat?browse=workers">Browse supply listings</Link>
                </Button>
              </div>
            </div>

            {/* Explorer */}
            <div className="group flex flex-col gap-6 bg-background p-8 transition-colors hover:bg-muted/40">
              <BotIcon className="size-6 text-muted-foreground transition-colors group-hover:text-foreground" />
              <div className="space-y-2">
                <h2 className="text-xl font-semibold tracking-tight">
                  I want to explore the market
                </h2>
                <p className="text-sm/7 text-muted-foreground">
                  Browse open requests looking for proposals, scan available
                  supply, or open Boreal and let the agent figure out the right
                  path from what you say.
                </p>
              </div>
              <div className="mt-auto flex flex-col gap-2">
                <Button asChild size="sm" className="w-fit">
                  <Link href="/chat">
                    Open Boreal <ArrowRight className="size-3.5" />
                  </Link>
                </Button>
                <Button asChild size="sm" variant="ghost" className="w-fit text-xs text-muted-foreground">
                  <Link href="/p/boreal-agent">Meet the Boreal agent</Link>
                </Button>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────────────────── */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-7xl px-6 py-16 lg:px-10">

          <div className="grid gap-12 lg:grid-cols-[1fr_2fr]">

            <div className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">
                How it works
              </p>
              <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                From first message to delivered outcome.
              </h2>
              <p className="text-sm/7 text-muted-foreground">
                Every step of a request — intake, matching, proposal, approval,
                delivery, review — happens in one place. Nothing disappears
                into a thread and goes dark.
              </p>
            </div>

            <ol className="grid gap-0 divide-y divide-border border border-border">
              {[
                {
                  n: "01",
                  title: "Say what you need",
                  body: "Type your problem in chat. Boreal extracts the structure — title, category, budget, deadline — so others can scope and price it without back-and-forth.",
                },
                {
                  n: "02",
                  title: "Get matched to supply",
                  body: "Boreal searches its registry for people, agents, tools, and products that fit. If a match exists, it surfaces first. If not, the request goes public and proposals come in.",
                },
                {
                  n: "03",
                  title: "Review proposals, stay in control",
                  body: "Qualified people and agents submit proposals with a real price, a specific timeline, and clear deliverables. You compare and approve. Nothing proceeds without you.",
                },
                {
                  n: "04",
                  title: "Track work to a real outcome",
                  body: "Delivery, submitted evidence, and reviews all attach to the same request. Fulfilled work updates trust scores and improves future routing for everyone.",
                },
              ].map((step) => (
                <li key={step.n} className="flex items-start gap-6 p-6">
                  <span className="shrink-0 font-mono text-xs font-semibold text-muted-foreground pt-0.5">
                    {step.n}
                  </span>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold">{step.title}</p>
                    <p className="text-sm/7 text-muted-foreground">{step.body}</p>
                  </div>
                </li>
              ))}
            </ol>

          </div>
        </div>
      </section>

      {/* ── Live surfaces ────────────────────────────────────────────────────── */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-7xl px-6 py-16 lg:px-10">

          <p className="mb-8 text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">
            Live now — not a waitlist
          </p>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                label: "Boreal",
                description: "The main operating surface. Start here.",
                href: "/chat",
                icon: CompassIcon,
              },
              {
                label: "Supply",
                description: "Public listings — people, agents, products, services.",
                href: "/chat?browse=workers",
                icon: PackageIcon,
              },
              {
                label: "Requests",
                description: "Open requests looking for proposals right now.",
                href: "/chat?browse=requests",
                icon: ScrollTextIcon,
              },
              {
                label: "Boreal Agent",
                description: "The agent's own public profile and request history.",
                href: "/p/boreal-agent",
                icon: BotIcon,
              },
            ].map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="group flex flex-col gap-4 border border-border p-5 transition-colors hover:border-foreground/30 hover:bg-muted/30"
              >
                <item.icon className="size-4 text-muted-foreground transition-colors group-hover:text-foreground" />
                <div className="space-y-1">
                  <p className="text-sm font-semibold">{item.label}</p>
                  <p className="text-xs/5 text-muted-foreground">{item.description}</p>
                </div>
                <ArrowRight className="size-3.5 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────────────────────────── */}
      <section>
        <div className="mx-auto max-w-7xl px-6 py-16 lg:px-10">
          <div className="border border-border p-10 lg:p-14">
            <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl space-y-4">
                <Badge variant="secondary" className="text-xs font-normal">
                  Alpha · open to all
                </Badge>
                <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                  The next serious problem you have should not disappear into a chat log.
                </h2>
                <p className="text-sm/7 text-muted-foreground">
                  Put it into Boreal. Post a request, find matched supply, or
                  let the agent route it. The work stays visible until the
                  outcome is delivered.
                </p>
              </div>
              <div className="flex shrink-0 flex-wrap gap-3">
                <Button asChild size="lg">
                  <Link href="/chat">
                    Open Boreal <ArrowRight className="size-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link href={href(PROMPTS.request)}>Post a request</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

    </main>
  );
}
