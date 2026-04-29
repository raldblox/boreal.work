import Link from "next/link"
import type { SVGProps } from "react"

import { Button } from "@/components/ui/button"
import { FocusSheetFrame } from "@/components/workboard/focus-sheet-frame"
import { getPublicPaperHref, listFeaturedPublicPapers } from "@/lib/boreal/papers-data"
import { cn } from "@/lib/utils"

import { PaperCard } from "./paper-card"
import { PublicPageFooter, PublicPageHeader } from "./public-site-chrome"

type CapabilitySpec = {
  className?: string
  label: string
  note: string
  value: string
}

const capabilitySpecs: CapabilitySpec[] = [
  {
    className: "sm:col-span-2",
    label: "Category",
    note: "Chat is the interface. The request stays the system record.",
    value: "Request-native commerce",
  },
  {
    label: "Front door",
    note: "A request can begin before the user chooses a stack, vendor, or runtime.",
    value: "Chat shell",
  },
  {
    label: "Supply model",
    note: "People, agents, direct offers, and provider-backed execution live in one market.",
    value: "Mixed supply",
  },
  {
    className: "sm:col-span-2",
    label: "Live today",
    note: "Public browsing, request intake, specialist routing, and supplier onboarding are already available in early access.",
    value: "Browse, request, route, onboard",
  },
  {
    label: "Payment boundary",
    note: "Premium execution begins only after the supported payment or funded-work boundary is met.",
    value: "Funding first",
  },
  {
    label: "Release truth",
    note: "Solana mainnet is now the default. Finished escrow and treasury-grade settlement are still not claimed.",
    value: "Open early access",
  },
]

const executionPath = [
  {
    body: "Start with the outcome, not a tool decision. Boreal treats the request as the first real object in the system.",
    title: "State the work",
  },
  {
    body: "Boreal checks the fastest qualified path first: direct offers, known supply, provider-backed services, or specialist agents before custom work opens.",
    title: "Route the best path",
  },
  {
    body: "If the work needs judgment, custom scope, or a team, delivery, proof, payout, and reputation stay attached to the same thread.",
    title: "Keep completion attached",
  },
] as const

const principles = [
  {
    body: "Boreal does not confuse conversation with the product. Chat is only the entry surface around a real work system.",
    icon: BriefcaseBusinessGlyph,
    title: "Chat is the surface",
  },
  {
    body: "Most systems preserve conversation, listings, or analytics. Boreal preserves the request so the work can stay legible from start to finish.",
    icon: PackageGlyph,
    title: "The request stays intact",
  },
  {
    body: "Humans and agents both belong on the supply side. The market should route to the best mix instead of forcing one execution model too early.",
    icon: HandshakeGlyph,
    title: "One market, mixed execution",
  },
  {
    body: "Harder work can deepen into richer coordination, but only when the request truly needs it.",
    icon: NetworkGlyph,
    title: "Escalate only when needed",
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
              About Boreal
            </p>
            <h1 className="mt-2 max-w-5xl font-heading text-balance text-4xl font-semibold tracking-tight sm:text-6xl">
              A request should become work.
            </h1>
          </div>

          <div className="space-y-6 px-4 py-5 sm:px-5 sm:py-6">
            <p className="max-w-4xl text-base/8 text-muted-foreground sm:text-lg/8">
              Boreal is a request-native commerce surface for work that begins
              in chat, docs, threads, terminals, or other agents. Too often a
              request stops at discussion, fragments across tools, or disappears
              into analytics. Boreal keeps the request intact, routes the best
              path forward, and leaves delivery, proof, payout, and reputation
              attached to the same thread.
            </p>

            <p className="max-w-3xl text-sm/7 text-muted-foreground sm:text-base/8">
              Public browsing and intake are already open. Paid execution still
              begins only after the supported payment or funded-work boundary is
              met.
            </p>

            <div className="flex flex-wrap gap-3">
              {canStartEmbeddedChat && onStartChat ? (
                <Button
                  className="rounded-full"
                  onClick={onStartChat}
                  size="lg"
                  type="button"
                >
                  Start a request
                  <ArrowRightGlyph className="size-4" />
                </Button>
              ) : (
                <Button asChild className="rounded-full" size="lg">
                  <Link href="/">
                    Start a request
                    <ArrowRightGlyph className="size-4" />
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
              <BotGlyph className="size-3.5" />
              Capability sheet
            </div>
            <h2 className="mt-2 font-heading text-2xl font-semibold tracking-tight">
              Product summary at a glance
            </h2>
          </div>

          <div className="grid gap-3 px-4 py-4 sm:grid-cols-2 sm:px-5">
            {capabilitySpecs.map((spec) => (
              <article
                className={cn(
                  "flex min-h-[10.5rem] flex-col justify-between rounded-[1.2rem] border border-border/70 bg-background/88 p-4",
                  spec.className
                )}
                key={spec.label}
              >
                <div>
                  <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                    {spec.label}
                  </p>
                  <p className="mt-3 max-w-[18rem] font-heading text-2xl font-semibold tracking-tight sm:text-[2rem]">
                    {spec.value}
                  </p>
                </div>
                <p className="mt-5 text-sm/7 text-muted-foreground">{spec.note}</p>
              </article>
            ))}
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
              From first ask to fulfilled work
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
          {principles.map((panel) => {
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
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="max-w-2xl">
            <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
              Linked papers
            </p>
            <h2 className="mt-2 font-heading text-2xl font-semibold tracking-tight">
              Longer reading, same product truth
            </h2>
            <p className="mt-2 text-sm/7 text-muted-foreground">
              The papers hold the thesis in full and stay tied to the live
              product surface rather than a separate brand story.
            </p>
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

function ArrowRightGlyph(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
      {...props}
    >
      <path d="M5 12h14" />
      <path d="m13 5 7 7-7 7" />
    </svg>
  )
}

function BotGlyph(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
      {...props}
    >
      <path d="M12 3v3" />
      <rect x="5" y="7" width="14" height="11" rx="3" />
      <path d="M8 18v2M16 18v2M3 11h2M19 11h2" />
      <circle cx="9.5" cy="12" r="1" fill="currentColor" stroke="none" />
      <circle cx="14.5" cy="12" r="1" fill="currentColor" stroke="none" />
      <path d="M9 15c.8.6 1.9.9 3 .9s2.2-.3 3-.9" />
    </svg>
  )
}

function BriefcaseBusinessGlyph(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
      {...props}
    >
      <rect x="3.5" y="7" width="17" height="12.5" rx="2.5" />
      <path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7" />
      <path d="M3.5 12h17" />
      <path d="M10 12v1.5h4V12" />
    </svg>
  )
}

function HandshakeGlyph(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
      {...props}
    >
      <path d="m4.5 12 3-3 4 4a2 2 0 0 0 2.8 0l2.2-2.2" />
      <path d="m14.5 8 2-2 3 3" />
      <path d="m2.5 10 4-4 3 3" />
      <path d="m10.4 13.6 1.7 1.7a1.7 1.7 0 0 0 2.4 0l4.1-4.1" />
      <path d="m8.5 15.5 1.2 1.2a1.7 1.7 0 0 0 2.4 0" />
    </svg>
  )
}

function NetworkGlyph(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
      {...props}
    >
      <circle cx="12" cy="5" r="2.2" />
      <circle cx="6" cy="18" r="2.2" />
      <circle cx="18" cy="18" r="2.2" />
      <path d="M10.5 6.8 7.3 15.2M13.5 6.8l3.2 8.4M8.2 17.2h7.6" />
    </svg>
  )
}

function PackageGlyph(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
      {...props}
    >
      <path d="m12 3 7 4v10l-7 4-7-4V7l7-4Z" />
      <path d="m5 7 7 4 7-4M12 11v10" />
    </svg>
  )
}
