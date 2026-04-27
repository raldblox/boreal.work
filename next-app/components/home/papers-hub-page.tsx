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
  embedded = false,
  papers,
}: {
  embedded?: boolean
  papers: PublicPaperRecord[]
}) {
  const flagshipPaper = papers.find((paper) => paper.kind === "flagship") ?? papers[0]
  const deepDivePapers = papers.filter((paper) => paper.kind === "deep_dive")
  const technicalPapers = papers.filter((paper) => paper.kind === "technical")
  const content = (
    <EditorialSplitLayout
      className={cn(embedded ? "gap-8 py-0 lg:gap-10 lg:py-0 xl:gap-12" : "")}
      contentClassName={cn(embedded ? "pt-6 lg:pl-8 xl:pl-10" : "")}
      rail={
        <div className="space-y-8">
          <div className="space-y-5">
            <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
              Public paper suite
            </p>
            <h1 className="font-editorial text-balance text-5xl leading-[0.98] font-semibold tracking-[-0.045em] text-foreground sm:text-6xl">
              Clean public reading layer for Boreal&apos;s market thesis.
            </h1>
            <p className="text-lg/8 text-foreground/72">
              Start with the flagship.  Move into supply, collaboration,
              reputation, and adapter notes next.  No campaign-style hero.
              Just the narrative layer, spaced clearly enough to read.
            </p>
          </div>

          <EditorialMetaList
            items={[
              {
                label: "Documents",
                value: `${papers.length} public notes`,
              },
              {
                label: "Start here",
                value: flagshipPaper?.title ?? "Flagship paper",
              },
              {
                label: "Format",
                value: "Repo-backed markdown rendered in app",
              },
            ]}
            title="At a glance"
          />

          <div className="space-y-4">
            <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
              Reading order
            </p>
            <div className="space-y-5">
              {readingPath.map((item) => (
                <article className="space-y-2" key={item.label}>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                    {item.label}
                  </p>
                  <h2 className="font-heading text-lg font-semibold tracking-tight text-foreground">
                    {item.title}
                  </h2>
                  <p className="text-sm/7 text-muted-foreground">{item.body}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      }
      railClassName={cn(embedded ? "lg:top-6" : "")}
    >
      <div className={cn("space-y-16", embedded ? "space-y-12" : "")}>
        {flagshipPaper ? (
          <section className="space-y-6">
            <EditorialSectionHeader
              description="One flagship thesis that frames Boreal as a request-native market for humans and agents."
              eyebrow="Start here"
              title="Read the broad claim first"
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

        {deepDivePapers.length > 0 ? (
          <section className="space-y-6">
            <EditorialSectionHeader
              description="Focused notes for the parts of the system that need more precision than the flagship alone."
              eyebrow="Deep dives"
              title="Then follow the thread that matters most"
            />
            <div>
              {deepDivePapers.map((paper) => (
                <EditorialEntryLink
                  excerpt={paper.summary}
                  href={getPublicPaperHref(paper.slug)}
                  key={paper.slug}
                  lede={paper.deck}
                  meta={["Deep dive", paper.readingTime, paper.updatedAt]}
                  title={paper.title}
                  tone="sky"
                />
              ))}
            </div>
          </section>
        ) : null}

        {technicalPapers.length > 0 ? (
          <section className="space-y-6">
            <EditorialSectionHeader
              description="Longer technical architecture notes for operators, agent owners, and open-runtime builders."
              eyebrow="Technical notes"
              title="Finish with the infrastructure view"
            />
            <div>
              {technicalPapers.map((paper) => (
                <EditorialEntryLink
                  excerpt={paper.summary}
                  href={getPublicPaperHref(paper.slug)}
                  key={paper.slug}
                  lede={paper.deck}
                  meta={["Technical note", paper.readingTime, paper.updatedAt]}
                  title={paper.title}
                  tone="amber"
                />
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </EditorialSplitLayout>
  )

  if (embedded) {
    return (
      <div className="h-full overflow-y-auto">
        <div className="mx-auto w-full max-w-[1480px] px-4 py-4 sm:px-5">
          {content}
        </div>
      </div>
    )
  }

  return <EditorialShell>{content}</EditorialShell>
}
