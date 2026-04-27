import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { EditorialEntryLink } from "@/components/editorial/editorial-entry-link"
import { EditorialMarkdown } from "@/components/editorial/editorial-markdown"
import {
  EditorialMetaList,
  EditorialSectionHeader,
  EditorialShell,
  EditorialSplitLayout,
} from "@/components/editorial/editorial-shell"
import {
  extractEditorialDocument,
  getEditorialLeadValue,
} from "@/lib/boreal/editorial"
import type { PublicPaperRecord } from "@/lib/boreal/papers-data"
import { getPublicPaperHref } from "@/lib/boreal/papers-data"

const kindLabels = {
  deep_dive: "Deep dive",
  flagship: "Flagship paper",
  technical: "Technical note",
} as const

export function PaperArticlePage({
  allPapers,
  body,
  paper,
  relatedPapers,
}: {
  allPapers: PublicPaperRecord[]
  body: string
  paper: PublicPaperRecord
  relatedPapers: PublicPaperRecord[]
}) {
  const document = extractEditorialDocument(body)
  const subtitle = getEditorialLeadValue(document.leadFields, "Subtitle")
  const leadMetaItems = document.leadFields
    .filter((field) => field.label !== "Subtitle")
    .map((field) => ({
      label: field.label,
      value: field.value,
    }))

  return (
    <EditorialShell>
      <EditorialSplitLayout
        rail={
          <div className="space-y-6">
            <div className="rounded-[1.5rem] border border-border/80 bg-muted/18 p-5">
              <Link
                className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                href="/papers"
              >
                <ArrowLeft className="size-4" />
                Back to papers
              </Link>
              <div className="mt-5 space-y-2">
                <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                  Series map
                </p>
                {allPapers.map((entry, index) => (
                  <Link
                    className={`block rounded-2xl border px-3 py-3 transition-colors ${
                      entry.slug === paper.slug
                        ? "border-foreground/15 bg-background text-foreground"
                        : "border-border/80 bg-background/70 text-muted-foreground hover:bg-background hover:text-foreground"
                    }`}
                    href={getPublicPaperHref(entry.slug)}
                    key={entry.slug}
                  >
                    <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                      {String(index + 1).padStart(2, "0")} ·{" "}
                      {kindLabels[entry.kind]}
                    </p>
                    <p className="mt-1 text-sm font-medium text-foreground">
                      {entry.title}
                    </p>
                  </Link>
                ))}
              </div>
            </div>

            <EditorialMetaList
              items={[
                { label: "Type", value: kindLabels[paper.kind] },
                { label: "Read time", value: paper.readingTime },
                { label: "Updated", value: paper.updatedAt },
                { label: "Audience", value: paper.audience },
                ...leadMetaItems,
              ]}
              title="Paper details"
            />

            <div className="rounded-[1.5rem] border border-border/80 bg-background p-5">
              <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                Continue in product
              </p>
              <div className="mt-4 flex flex-col gap-2 text-sm/7 text-foreground">
                <Link className="hover:text-muted-foreground" href="/">
                  Open Boreal chat
                </Link>
                <Link className="hover:text-muted-foreground" href="/about">
                  View product context
                </Link>
                <Link className="hover:text-muted-foreground" href="/roadmap">
                  Check what is live now
                </Link>
              </div>
            </div>
          </div>
        }
      >
        <div className="space-y-12">
          <section className="rounded-[1.8rem] border border-border/80 bg-background px-5 py-6 shadow-[0_24px_80px_-52px_rgba(15,23,42,0.42)] sm:px-7 sm:py-7">
            <div className="max-w-4xl space-y-4">
              <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                {kindLabels[paper.kind]}
              </p>
              <h1 className="font-editorial text-balance text-4xl leading-[0.98] font-semibold tracking-[-0.04em] text-foreground sm:text-5xl">
                {paper.title}
              </h1>
              <p className="text-base/8 text-foreground/72 sm:text-lg/8">
                {subtitle ?? paper.deck}
              </p>
              <p className="max-w-3xl text-sm/7 text-muted-foreground">
                {paper.summary}
              </p>
            </div>
          </section>

          <article className="rounded-[1.8rem] border border-border/80 bg-background px-5 py-6 sm:px-7 sm:py-7">
            <EditorialMarkdown>{document.body}</EditorialMarkdown>
          </article>

          {relatedPapers.length > 0 ? (
            <section className="space-y-6 rounded-[1.8rem] border border-border/80 bg-muted/18 px-5 py-6 sm:px-7">
              <EditorialSectionHeader
                description="Same narrative, different angle.  Stay in the same thread instead of dropping back into a flat index."
                eyebrow="Read next"
                title="Move through the next connected paper"
              />
              <div>
                {relatedPapers.map((relatedPaper) => (
                  <EditorialEntryLink
                    compact
                    excerpt={relatedPaper.summary}
                    href={getPublicPaperHref(relatedPaper.slug)}
                    key={relatedPaper.slug}
                    lede={relatedPaper.deck}
                    meta={[
                      kindLabels[relatedPaper.kind],
                      relatedPaper.readingTime,
                      relatedPaper.updatedAt,
                    ]}
                    title={relatedPaper.title}
                    tone={
                      relatedPaper.kind === "flagship"
                        ? "emerald"
                        : relatedPaper.kind === "technical"
                          ? "amber"
                          : "sky"
                    }
                  />
                ))}
              </div>
            </section>
          ) : null}
        </div>
      </EditorialSplitLayout>
    </EditorialShell>
  )
}
