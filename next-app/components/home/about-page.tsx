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
import { FocusSheetFrame } from "@/components/workboard/focus-sheet-frame"
import { getPublicPaperHref, listFeaturedPublicPapers } from "@/lib/boreal/papers-data"
import { cn } from "@/lib/utils"

import { PaperCard } from "./paper-card"
import { PublicPageFooter, PublicPageHeader } from "./public-site-chrome"

const productStats = [
  {
    label: "Home route",
    note: "The real front door is the chat shell, where a request can start before the user chooses a stack.",
    value: "/",
  },
  {
    label: "Category",
    note: "Chat-native interface for request-native commerce.",
    value: "Work network",
  },
  {
    label: "Supply side",
    note: "Humans, agents, products, services, and provider-backed execution live in the same market.",
    value: "Mixed supply",
  },
] as const

const executionPath = [
  {
    body: "The user starts with the outcome they need, not a premature decision about tools, providers, or workflows.",
    title: "Start with one request",
  },
  {
    body: "Boreal checks the best path forward first: direct offers, known supply, provider-backed services, or specialist agents before custom work opens.",
    title: "Route the best path forward",
  },
  {
    body: "If the work needs judgment, customization, or a team, Boreal keeps the request alive through proposal, delivery, proof, payout, and reputation.",
    title: "Let completion compound",
  },
] as const

const positioningPanels = [
  {
    body: "Boreal is not another chatbot with a glossy shell. Chat is only the interface layer around a real work network and commerce system.",
    icon: BriefcaseBusinessIcon,
    title: "Not just another chatbot",
  },
  {
    body: "Most systems preserve conversation, listings, or analytics. Boreal preserves the request, so the work itself can stay attached from start to finish.",
    icon: PackageIcon,
    title: "The request is the record",
  },
  {
    body: "Humans and agents both belong on the supply side. The market should route to the best mix instead of forcing one execution model too early.",
    icon: HandshakeIcon,
    title: "Humans and agents share one market",
  },
  {
    body: "Harder work should begin in a request workboard, then deepen into richer collaboration only when the request truly needs it.",
    icon: NetworkIcon,
    title: "Workboards before swarm theater",
  },
] as const
export function AboutPage({
  embedded = false,
  onOpenPaper,
  onOpenPapers,
  onStartChat,
}: {
  embedded?: boolean
  onOpenPaper?: (slug: string) => void
  onOpenPapers?: () => void
  onStartChat?: () => void
}) {
  const featuredPapers = listFeaturedPublicPapers().slice(0, 4)
  const canOpenEmbeddedPapers = embedded && Boolean(onOpenPaper)
  const canStartEmbeddedChat = embedded && Boolean(onStartChat)
  const content = (
    <div
      className={cn(
        "mx-auto flex w-full max-w-[1480px] flex-col gap-4",
        embedded ? "" : "py-4"
      )}
    >
      <section className="grid gap-4 lg:grid-cols-[minmax(0,1.08fr)_minmax(22rem,0.92fr)]">
        <div className="rounded-[1.35rem] border border-border/80 bg-card/92 shadow-[0_14px_36px_-34px_rgba(15,23,42,0.18)]">
          <div className="border-b border-border/70 px-4 py-4 sm:px-5">
            <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
              Open early access
            </p>
            <h1 className="mt-2 max-w-5xl font-heading text-balance text-4xl font-semibold tracking-tight sm:text-6xl">
              Boreal turns visible demand into fulfillable work.
            </h1>
          </div>

          <div className="space-y-6 px-4 py-5 sm:px-5 sm:py-6">
            <p className="max-w-4xl text-base/8 text-muted-foreground sm:text-lg/8">
              Boreal is in open early access today. A request can begin in
              chat, in a doc, in a thread, in a terminal, or in an agent
              workflow. Too often it stops at discussion, fragments across
              tools, or gets reduced to analytics instead of becoming
              accountable execution. Boreal starts with the request, routes the
              best path forward, and keeps proof, payout, and reputation
              attached to the same work thread.
            </p>

            <div className="flex flex-wrap gap-3">
              {canStartEmbeddedChat && onStartChat ? (
                <Button
                  className="rounded-full"
                  onClick={onStartChat}
                  size="lg"
                  type="button"
                >
                  Start in chat
                  <ArrowRight className="size-4" />
                </Button>
              ) : (
                <Button asChild className="rounded-full" size="lg">
                  <Link href="/">
                    Start in chat
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
              )}
              {canOpenEmbeddedPapers && onOpenPaper ? (
                <Button
                  className="rounded-full"
                  onClick={() => onOpenPaper("work-network")}
                  size="lg"
                  type="button"
                  variant="outline"
                >
                  Read the flagship paper
                </Button>
              ) : (
                <Button asChild className="rounded-full" size="lg" variant="outline">
                  <Link href={getPublicPaperHref("work-network")}>
                    Read the flagship paper
                  </Link>
                </Button>
              )}
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
              Keep the public story honest
            </h2>
          </div>

          <div className="space-y-4 px-4 py-4 sm:px-5">
            <div className="rounded-[1.2rem] border border-border/70 bg-background px-4 py-4">
              <p className="text-sm/7 text-muted-foreground">
                Do not frame Boreal as only a chatbot, only human fallback, or
                already-finished settlement infrastructure. The clearest public
                line is simpler: visible demand should become requests, and
                requests should become completed work. Public browsing and
                intake are already open; paid execution still starts only after
                the supported payment or funded-work boundary is met.
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
          {embedded && onOpenPapers ? (
            <Button
              className="rounded-full"
              onClick={onOpenPapers}
              size="sm"
              type="button"
              variant="outline"
            >
              View all papers
            </Button>
          ) : (
            <Button asChild className="rounded-full" size="sm" variant="outline">
              <Link href="/papers">View all papers</Link>
            </Button>
          )}
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {featuredPapers.map((paper) => (
            <PaperCard
              key={paper.slug}
              onOpen={canOpenEmbeddedPapers && onOpenPaper ? () => onOpenPaper(paper.slug) : null}
              paper={paper}
            />
          ))}
        </div>
      </section>
    </div>
  )

  if (embedded) {
    return <FocusSheetFrame>{content}</FocusSheetFrame>
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
