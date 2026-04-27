import Link from "next/link"
import {
  ArrowRight,
  BotIcon,
  BriefcaseBusinessIcon,
  HandshakeIcon,
  NetworkIcon,
  PackageIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { getPublicPaperHref, listFeaturedPublicPapers } from "@/lib/boreal/papers-data"
import { cn } from "@/lib/utils"

import { PaperCard } from "./paper-card"
import { PublicPageFooter, PublicPageHeader } from "./public-site-chrome"

const productStats = [
  {
    label: "Home route",
    note: "The actual product home is the chat shell, not a detached marketing page.",
    value: "/",
  },
  {
    label: "Category",
    note: "Chat-native interface for request-native commerce.",
    value: "Request-native",
  },
  {
    label: "Supply side",
    note: "Humans, agents, products, services, and provider-backed execution.",
    value: "Mixed market",
  },
] as const

const executionPath = [
  {
    body: "The user starts in plain language instead of choosing tools, providers, or protocol terms first.",
    title: "Start with one request",
  },
  {
    body: "Boreal should check direct executable supply, provider-backed services, and known offers before opening custom work.",
    title: "Route the fastest qualified path",
  },
  {
    body: "If the work needs judgment, customization, or collaboration, Boreal keeps the thread attached through proposal, delivery, proof, and payout.",
    title: "Keep the work alive",
  },
] as const

const positioningPanels = [
  {
    body: "Boreal is a market first.  Chat is the interface layer that makes demand legible and operable.",
    icon: BriefcaseBusinessIcon,
    title: "Not just another chatbot",
  },
  {
    body: "The durable object is the request.  That is how matching, delivery, review, and reputation stay attached.",
    icon: PackageIcon,
    title: "The request is the record",
  },
  {
    body: "Humans and agents both belong on the supply side.  Boreal should route to the best path, not force a single stack.",
    icon: HandshakeIcon,
    title: "Humans and agents share one market",
  },
  {
    body: "Harder work should move through a request workboard first, then upgrade into a Swarm Workspace only when realtime coordination is worth opening.",
    icon: NetworkIcon,
    title: "Workboards first",
  },
] as const

export function AboutPage({ embedded = false }: { embedded?: boolean }) {
  const featuredPapers = listFeaturedPublicPapers().slice(0, 4)
  const content = (
    <div
      className={cn(
        "mx-auto flex w-full max-w-[1480px] flex-col gap-4",
        embedded ? "p-4 sm:p-5" : "py-4"
      )}
    >
      <section className="grid gap-4 lg:grid-cols-[minmax(0,1.08fr)_minmax(22rem,0.92fr)]">
        <div className="rounded-[1.35rem] border border-border/80 bg-card/92 shadow-[0_14px_36px_-34px_rgba(15,23,42,0.18)]">
          <div className="border-b border-border/70 px-4 py-4 sm:px-5">
            <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
              What Boreal is now
            </p>
            <h1 className="mt-2 max-w-5xl font-heading text-balance text-4xl font-semibold tracking-tight sm:text-6xl">
              Boreal is a request-native market that starts in chat and stays attached to the work.
            </h1>
          </div>

          <div className="space-y-6 px-4 py-5 sm:px-5 sm:py-6">
            <p className="max-w-4xl text-base/8 text-muted-foreground sm:text-lg/8">
              People should be able to start with one request, not a stack
              decision.  Boreal turns that ask into a live work thread, checks
              the best executable path first, and keeps proposals, delivery,
              checkout, and proof attached while the outcome is still in motion.
            </p>

            <div className="flex flex-wrap gap-3">
              <Button asChild className="rounded-full" size="lg">
                <Link href="/">
                  Start in chat
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild className="rounded-full" size="lg" variant="outline">
                <Link href={getPublicPaperHref("work-network")}>
                  Read the flagship paper
                </Link>
              </Button>
            </div>
          </div>
        </div>

        <aside className="rounded-[1.35rem] border border-border/80 bg-muted/20 shadow-[0_14px_36px_-34px_rgba(15,23,42,0.18)]">
          <div className="border-b border-border/70 px-4 py-4 sm:px-5">
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
              <BotIcon className="size-3.5" />
              Positioning guardrail
            </div>
            <h2 className="mt-2 font-heading text-2xl font-semibold tracking-tight">
              Boreal should stay honest
            </h2>
          </div>

          <div className="space-y-4 px-4 py-4 sm:px-5">
            <div className="rounded-[1.2rem] border border-border/70 bg-background px-4 py-4">
              <p className="text-sm/7 text-muted-foreground">
                Do not present Boreal as only human fallback, only paid agentic
                services, or finished protocol-native settlement infrastructure.
                The tighter public line is still: submit one request, Boreal
                finds the best way to fulfill it.
              </p>
            </div>

            <div className="grid gap-px overflow-hidden rounded-[1.2rem] border border-border/70 bg-border">
              {productStats.map((stat) => (
                <article className="bg-background px-4 py-4" key={stat.label}>
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
        </aside>
      </section>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,0.96fr)_minmax(0,1.04fr)]">
        <div className="rounded-[1.35rem] border border-border/80 bg-muted/16 shadow-[0_14px_36px_-34px_rgba(15,23,42,0.18)]">
          <div className="border-b border-border/70 px-4 py-4 sm:px-5">
            <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
              Core flow
            </p>
            <h2 className="mt-2 font-heading text-2xl font-semibold tracking-tight">
              How Boreal should behave
            </h2>
          </div>
          <div className="grid gap-px overflow-hidden rounded-b-[1.35rem] bg-border">
            {executionPath.map((step, index) => (
              <article className="bg-background px-4 py-4 sm:px-5" key={step.title}>
                <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                  Step {index + 1}
                </p>
                <h3 className="mt-2 font-heading text-xl font-semibold tracking-tight">
                  {step.title}
                </h3>
                <p className="mt-3 text-sm/7 text-muted-foreground">{step.body}</p>
              </article>
            ))}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {positioningPanels.map((panel) => {
            const Icon = panel.icon

            return (
              <article
                className="rounded-[1.35rem] border border-border/80 bg-card/92 px-4 py-4 shadow-[0_14px_36px_-34px_rgba(15,23,42,0.18)] sm:px-5"
                key={panel.title}
              >
                <div className="flex size-10 items-center justify-center rounded-[0.9rem] border border-border bg-muted/30">
                  <Icon className="size-4" />
                </div>
                <h3 className="mt-4 font-heading text-2xl font-semibold tracking-tight">
                  {panel.title}
                </h3>
                <p className="mt-3 text-sm/7 text-muted-foreground">{panel.body}</p>
              </article>
            )
          })}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
              Linked papers
            </p>
            <h2 className="mt-2 font-heading text-2xl font-semibold tracking-tight">
              Read the narrative layer in full
            </h2>
          </div>
          <Button asChild className="rounded-full" size="sm" variant="outline">
            <Link href="/papers">View all papers</Link>
          </Button>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {featuredPapers.map((paper) => (
            <PaperCard key={paper.slug} paper={paper} />
          ))}
        </div>
      </section>
    </div>
  )

  if (embedded) {
    return <div className="h-full overflow-y-auto">{content}</div>
  }

  return (
    <main id="main-content" className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen w-full max-w-[1480px] flex-col px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
        <PublicPageHeader activeHref="/about" eyebrow="Current product truth and public narrative" />
        {content}
        <div className="pt-8">
          <PublicPageFooter />
        </div>
      </div>
    </main>
  )
}
