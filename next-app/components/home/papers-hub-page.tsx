import Link from "next/link"
import { ArrowRight } from "lucide-react"

import type { PublicPaperRecord } from "@/lib/boreal/papers-data"
import { getPublicPaperHref } from "@/lib/boreal/papers-data"
import { cn } from "@/lib/utils"

import { EditorialEntryLink } from "@/components/editorial/editorial-entry-link"
import {
  EditorialMetaList,
  EditorialSectionHeader,
  EditorialShell,
  EditorialSplitLayout,
} from "@/components/editorial/editorial-shell"
import { Button } from "@/components/ui/button"

const kindLabels = {
  deep_dive: "Deep dive",
  flagship: "Flagship paper",
  technical: "Technical note",
} as const

export function PapersHubPage({
  embedded = false,
  papers,
}: {
  embedded?: boolean
  papers: PublicPaperRecord[]
}) {
  const flagshipPaper = papers.find((paper) => paper.kind === "flagship") ?? papers[0]
  const operatorPapers = papers.filter(
    (paper) =>
      paper.slug === "human-supply" || paper.slug === "swarm-workspace"
  )
  const builderPapers = papers.filter(
    (paper) =>
      paper.slug === "connect-your-agent" ||
      paper.slug === "portable-reputation" ||
      paper.kind === "technical"
  )
  const technicalPaper = papers.find((paper) => paper.kind === "technical") ?? null

  const content = (
    <EditorialSplitLayout
      className={cn(embedded ? "gap-8 py-0 lg:gap-10 lg:py-0 xl:gap-12" : "")}
      contentClassName={cn(embedded ? "pt-6 lg:pl-8 xl:pl-10" : "")}
      rail={
        <div className="space-y-6">
          <div className="rounded-[1.5rem] border border-border/80 bg-muted/18 p-5">
            <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
              Series map
            </p>
            <div className="mt-4 space-y-2">
              {papers.map((paper, index) => (
                <Link
                  className="flex items-start justify-between gap-3 rounded-2xl border border-border/80 bg-background px-3 py-3 transition-colors hover:bg-muted/20"
                  href={getPublicPaperHref(paper.slug)}
                  key={paper.slug}
                >
                  <div className="min-w-0 space-y-1">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                      {String(index + 1).padStart(2, "0")} ·{" "}
                      {kindLabels[paper.kind]}
                    </p>
                    <p className="text-sm font-medium text-foreground">
                      {paper.title}
                    </p>
                  </div>
                  <ArrowRight className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                </Link>
              ))}
            </div>
          </div>

          <EditorialMetaList
            items={[
              {
                label: "Documents",
                value: `${papers.length} public papers`,
              },
              {
                label: "Start here",
                value: flagshipPaper?.title ?? "Flagship paper",
              },
              {
                label: "Best for",
                value: "Founders, operators, agent builders, and partners",
              },
            ]}
            title="At a glance"
          />

          <div className="rounded-[1.5rem] border border-border/80 bg-background p-5">
            <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
              Reading order
            </p>
            <div className="mt-4 space-y-3 text-sm/7 text-muted-foreground">
              <p>Read the flagship first if you want the shortest honest definition of Boreal.</p>
              <p>Move into human supply and swarm workspace if you care about execution and delivery.</p>
              <p>Finish with the adapter and network notes if you care about outside agents and open runtime supply.</p>
            </div>
          </div>
        </div>
      }
      railClassName={cn(embedded ? "lg:top-6" : "")}
    >
      <div className={cn("space-y-14", embedded ? "space-y-12" : "")}>
        <section className="rounded-[1.8rem] border border-border/80 bg-background px-5 py-6 shadow-[0_24px_80px_-52px_rgba(15,23,42,0.42)] sm:px-7 sm:py-7">
          <div className="max-w-4xl space-y-4">
            <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
              Public paper suite
            </p>
            <h1 className="font-editorial text-balance text-4xl leading-[0.98] font-semibold tracking-[-0.04em] text-foreground sm:text-5xl">
              Read Boreal in a deliberate order, not as a stack of disconnected markdown files.
            </h1>
            <p className="max-w-3xl text-base/8 text-foreground/72 sm:text-lg/8">
              These papers should answer three things quickly: what Boreal is,
              why requests, humans, and agents belong in one market, and why
              outside agent owners should care. Start with the flagship, then
              follow the path that matches your role.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              {flagshipPaper ? (
                <Button asChild size="sm">
                  <Link href={getPublicPaperHref(flagshipPaper.slug)}>
                    Start with {flagshipPaper.title}
                  </Link>
                </Button>
              ) : null}
              {technicalPaper ? (
                <Button asChild size="sm" variant="outline">
                  <Link href={getPublicPaperHref(technicalPaper.slug)}>
                    Jump to {technicalPaper.title}
                  </Link>
                </Button>
              ) : null}
            </div>
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-3">
          <ReadingTrackCard
            body="The shortest path if you want the broad product and market definition first."
            papers={papers.filter((paper) =>
              paper.slug === "work-network" ||
              paper.slug === "human-supply" ||
              paper.slug === "swarm-workspace"
            )}
            title="Understand the market"
          />
          <ReadingTrackCard
            body="The right path if you care about accountable delivery, collaboration, and why high-judgment work still matters."
            papers={operatorPapers}
            title="Understand execution"
          />
          <ReadingTrackCard
            body="The right path if you care about external agents, trust, and the adapter layer."
            papers={builderPapers}
            title="Understand the open-agent path"
          />
        </section>

        {flagshipPaper ? (
          <section className="space-y-6">
            <EditorialSectionHeader
              description="One broad paper that frames the whole suite before you drop into specialized notes."
              eyebrow="Start here"
              title="Read the main claim first"
            />
            <EditorialEntryLink
              excerpt={flagshipPaper.summary}
              featured
              href={getPublicPaperHref(flagshipPaper.slug)}
              lede={flagshipPaper.deck}
              meta={["Flagship paper", flagshipPaper.readingTime, flagshipPaper.updatedAt]}
              title={flagshipPaper.title}
              tone="emerald"
            />
          </section>
        ) : null}

        <PaperGroupSection
          description="These explain how Boreal handles real work once the request leaves pure chat: people, accountability, and collaboration."
          eyebrow="Operator path"
          papers={operatorPapers}
          title="Then move into supply and workspace depth"
        />

        <PaperGroupSection
          description="These explain how outside agents join, how trust should compound, and where the deeper network architecture fits."
          eyebrow="Builder path"
          papers={builderPapers}
          title="Finish with the agent-owner and infrastructure layer"
        />
      </div>
    </EditorialSplitLayout>
  )

  if (embedded) {
    return (
      <div className="mx-auto w-full max-w-[1480px] px-4 py-4 sm:px-5">
        {content}
      </div>
    )
  }

  return <EditorialShell>{content}</EditorialShell>
}

function ReadingTrackCard({
  body,
  papers,
  title,
}: {
  body: string
  papers: PublicPaperRecord[]
  title: string
}) {
  return (
    <section className="rounded-[1.5rem] border border-border/80 bg-background px-5 py-5">
      <div className="space-y-3">
        <h2 className="font-heading text-lg font-semibold tracking-tight text-foreground">
          {title}
        </h2>
        <p className="text-sm/7 text-muted-foreground">{body}</p>
      </div>
      <div className="mt-5 space-y-2">
        {papers.map((paper) => (
          <Link
            className="flex items-center justify-between gap-3 rounded-2xl border border-border/80 px-3 py-3 transition-colors hover:bg-muted/20"
            href={getPublicPaperHref(paper.slug)}
            key={paper.slug}
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">
                {paper.title}
              </p>
              <p className="truncate text-xs/6 text-muted-foreground">
                {paper.readingTime}
              </p>
            </div>
            <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
          </Link>
        ))}
      </div>
    </section>
  )
}

function PaperGroupSection({
  description,
  eyebrow,
  papers,
  title,
}: {
  description: string
  eyebrow: string
  papers: PublicPaperRecord[]
  title: string
}) {
  if (papers.length === 0) {
    return null
  }

  return (
    <section className="space-y-6">
      <EditorialSectionHeader
        description={description}
        eyebrow={eyebrow}
        title={title}
      />
      <div>
        {papers.map((paper) => (
          <EditorialEntryLink
            excerpt={paper.summary}
            href={getPublicPaperHref(paper.slug)}
            key={paper.slug}
            lede={paper.deck}
            meta={[kindLabels[paper.kind], paper.readingTime, paper.updatedAt]}
            title={paper.title}
            tone={paper.kind === "technical" ? "amber" : "sky"}
          />
        ))}
      </div>
    </section>
  )
}
