import Link from "next/link"
import { ArrowRight, FileTextIcon, NetworkIcon, WorkflowIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import type { PublicPaperRecord } from "@/lib/boreal/papers"
import { getPublicPaperHref } from "@/lib/boreal/papers"

import { PaperCard } from "./paper-card"
import { PublicPageFooter, PublicPageHeader } from "./public-site-chrome"

const readingPath = [
  {
    body: "Start with the broad thesis for humans, agents, workspaces, and reputation.",
    label: "01",
    title: "Read the flagship",
  },
  {
    body: "Jump into the focused papers for supply, collaboration, trust, and adapters.",
    label: "02",
    title: "Go deeper by topic",
  },
  {
    body: "Use the technical note when you want the more detailed open-agent architecture.",
    label: "03",
    title: "Finish with the network note",
  },
] as const

export function PapersHubPage({
  papers,
}: {
  papers: PublicPaperRecord[]
}) {
  const flagshipPaper = papers.find((paper) => paper.kind === "flagship") ?? papers[0]
  const deepDivePapers = papers.filter((paper) => paper.kind === "deep_dive")
  const technicalPapers = papers.filter((paper) => paper.kind === "technical")

  return (
    <main id="main-content" className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen w-full max-w-[1480px] flex-col px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
        <PublicPageHeader activeHref="/papers" eyebrow="Flagship paper and linked deep dives" />

        <section className="grid gap-4 py-8 lg:grid-cols-[minmax(0,1.12fr)_minmax(22rem,0.88fr)] lg:py-10">
          <div className="border border-border bg-background">
            <div className="border-b border-border px-4 py-3 sm:px-5">
              <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                Public paper suite
              </p>
              <h1 className="mt-2 max-w-5xl font-heading text-balance text-4xl font-semibold tracking-tight sm:text-6xl">
                One flagship thesis.  Several linked papers.  One connected story.
              </h1>
            </div>

            <div className="space-y-6 px-4 py-5 sm:px-5 sm:py-6">
              <p className="max-w-4xl text-base/8 text-muted-foreground sm:text-lg/8">
                These papers are the public narrative layer for Boreal.  They are
                written for people who want more than a landing page but less than
                a full source dive.  Start with the flagship, then jump into the
                topic that matters most.
              </p>

              {flagshipPaper ? (
                <div className="border border-border bg-emerald-500/[0.08] p-4 sm:p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                        Suggested first read
                      </p>
                      <h2 className="mt-2 font-heading text-3xl font-semibold tracking-tight">
                        {flagshipPaper.title}
                      </h2>
                      <p className="mt-3 max-w-3xl text-sm/7 text-muted-foreground">
                        {flagshipPaper.summary}
                      </p>
                    </div>
                    <Button asChild className="rounded-none" size="lg">
                      <Link href={getPublicPaperHref(flagshipPaper.slug)}>
                        Read the flagship
                        <ArrowRight className="size-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          <aside className="border border-border bg-muted/18">
            <div className="border-b border-border px-4 py-3 sm:px-5">
              <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                <WorkflowIcon className="size-3.5" />
                Reading path
              </div>
              <h2 className="mt-2 font-heading text-2xl font-semibold tracking-tight">
                Best way to move through the set
              </h2>
            </div>

            <div className="grid gap-px bg-border">
              {readingPath.map((item) => (
                <article className="bg-background px-4 py-4 sm:px-5" key={item.label}>
                  <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                    {item.label}
                  </p>
                  <p className="mt-2 text-sm font-medium">{item.title}</p>
                  <p className="mt-2 text-sm/7 text-muted-foreground">{item.body}</p>
                </article>
              ))}
            </div>
          </aside>
        </section>

        <section className="space-y-6">
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
            <NetworkIcon className="size-3.5" />
            Core papers
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            {deepDivePapers.map((paper) => (
              <PaperCard key={paper.slug} paper={paper} />
            ))}
          </div>
        </section>

        {technicalPapers.length > 0 ? (
          <section className="space-y-6 pt-8">
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
              <FileTextIcon className="size-3.5" />
              Technical notes
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              {technicalPapers.map((paper) => (
                <PaperCard key={paper.slug} paper={paper} />
              ))}
            </div>
          </section>
        ) : null}

        <div className="pt-8">
          <PublicPageFooter />
        </div>
      </div>
    </main>
  )
}
