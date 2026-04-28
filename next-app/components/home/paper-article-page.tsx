import Link from "next/link"
import { ArrowLeft, ArrowRight } from "lucide-react"

import { EditorialEntryLink } from "@/components/editorial/editorial-entry-link"
import { EditorialMarkdown } from "@/components/editorial/editorial-markdown"
import {
  EditorialMetaList,
  EditorialSectionHeader,
  EditorialShell,
  EditorialSplitLayout,
} from "@/components/editorial/editorial-shell"
import { Button } from "@/components/ui/button"
import {
  extractEditorialDocument,
  extractEditorialOutline,
  getEditorialLeadValue,
} from "@/lib/boreal/editorial"
import type { PublicPaperRecord } from "@/lib/boreal/papers"
import {
  getNextPublicPaper,
  getPreviousPublicPaper,
  getPublicPaperHref,
  getPublicPaperSequencePosition,
  getPublicPaperSeriesMeta,
  publicPaperKindLabels,
} from "@/lib/boreal/papers"
import { cn } from "@/lib/utils"

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
  const outline = extractEditorialOutline(document.body, 2)
  const subtitle = getEditorialLeadValue(document.leadFields, "Subtitle")
  const leadMetaItems = document.leadFields
    .filter((field) => field.label !== "Subtitle")
    .map((field) => ({
      label: field.label,
      value: field.value,
    }))
  const seriesMeta = getPublicPaperSeriesMeta(paper.slug)
  const position = getPublicPaperSequencePosition(paper.slug)
  const previousPaper = getPreviousPublicPaper(paper.slug)
  const nextPaper = getNextPublicPaper(paper.slug)
  const extraOutlineCount = Math.max(outline.length - 6, 0)
  const relatedWithoutNext = relatedPapers.filter(
    (entry) => entry.slug !== nextPaper?.slug
  )

  return (
    <EditorialShell>
      <EditorialSplitLayout
        rail={
          <ArticleRail
            allPapers={allPapers}
            leadMetaItems={leadMetaItems}
            outline={outline}
            paper={paper}
            position={position}
          />
        }
      >
        <div className="space-y-12">
          <section className="overflow-hidden rounded-[2rem] border border-border/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.97),rgba(240,249,255,0.86)_58%,rgba(236,253,245,0.7))] px-5 py-6 shadow-[0_30px_90px_-56px_rgba(15,23,42,0.34)] sm:px-7 sm:py-8">
            <div className="flex flex-wrap gap-2">
              {position ? (
                <MetaChip>{`Chapter ${position.current} of ${position.total}`}</MetaChip>
              ) : null}
              <MetaChip>{seriesMeta.stageLabel}</MetaChip>
              <MetaChip>{paper.readingTime}</MetaChip>
            </div>

            <div className="mt-6 max-w-4xl space-y-4">
              <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                {publicPaperKindLabels[paper.kind]}
              </p>
              <h1 className="font-editorial text-balance text-4xl leading-[0.97] font-semibold tracking-[-0.045em] text-foreground sm:text-5xl">
                {paper.title}
              </h1>
              <p className="max-w-3xl text-base/8 text-foreground/74 sm:text-lg/8">
                {subtitle ?? paper.deck}
              </p>
              <p className="max-w-3xl text-sm/7 text-muted-foreground">
                {paper.summary}
              </p>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              {previousPaper ? (
                <Button asChild size="sm" variant="outline">
                  <Link href={getPublicPaperHref(previousPaper.slug)}>
                    <ArrowLeft className="size-3" />
                    Previous paper
                  </Link>
                </Button>
              ) : null}
              {nextPaper ? (
                <Button asChild size="sm">
                  <Link href={getPublicPaperHref(nextPaper.slug)}>
                    Next paper
                    <ArrowRight className="size-3" />
                  </Link>
                </Button>
              ) : null}
            </div>
          </section>

          <article className="rounded-[2rem] border border-border/80 bg-background/94 px-5 py-6 shadow-[0_24px_80px_-60px_rgba(15,23,42,0.2)] sm:px-7 sm:py-8">
            {outline.length > 0 ? (
              <div className="mb-8 rounded-[1.55rem] border border-border/80 bg-muted/18 p-5">
                <div className="space-y-2">
                  <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                    In this paper
                  </p>
                  <p className="text-sm/7 text-muted-foreground">
                    A quick scan before you settle into the full read.
                  </p>
                </div>
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  {outline.slice(0, 6).map((item) => (
                    <div
                      className="rounded-2xl border border-border/75 bg-background/76 px-3 py-3 text-sm/7 text-foreground/84"
                      key={`${item.depth}-${item.text}`}
                    >
                      {item.text}
                    </div>
                  ))}
                </div>
                {extraOutlineCount > 0 ? (
                  <p className="mt-4 text-xs/6 uppercase tracking-[0.18em] text-muted-foreground">
                    Plus {extraOutlineCount} more sections in the full paper
                  </p>
                ) : null}
              </div>
            ) : null}

            <EditorialMarkdown>{document.body}</EditorialMarkdown>
          </article>

          {(nextPaper || relatedWithoutNext.length > 0) ? (
            <section className="space-y-6">
              <EditorialSectionHeader
                description="Move forward without dropping back into a raw index."
                eyebrow="Read next"
                title="Stay in the same reading thread"
              />

              <div className="space-y-3">
                {nextPaper ? (
                  <EditorialEntryLink
                    excerpt={nextPaper.summary}
                    featured
                    href={getPublicPaperHref(nextPaper.slug)}
                    lede={nextPaper.deck}
                    meta={[
                      "Next in sequence",
                      publicPaperKindLabels[nextPaper.kind],
                      nextPaper.readingTime,
                    ]}
                    title={nextPaper.title}
                    tone={getPublicPaperSeriesMeta(nextPaper.slug).tone}
                  />
                ) : null}

                {relatedWithoutNext.map((relatedPaper) => (
                  <EditorialEntryLink
                    compact
                    excerpt={relatedPaper.summary}
                    href={getPublicPaperHref(relatedPaper.slug)}
                    key={relatedPaper.slug}
                    lede={relatedPaper.deck}
                    meta={[
                      publicPaperKindLabels[relatedPaper.kind],
                      relatedPaper.readingTime,
                      relatedPaper.updatedAt,
                    ]}
                    title={relatedPaper.title}
                    tone={getPublicPaperSeriesMeta(relatedPaper.slug).tone}
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

function ArticleRail({
  allPapers,
  leadMetaItems,
  outline,
  paper,
  position,
}: {
  allPapers: PublicPaperRecord[]
  leadMetaItems: Array<{ label: string; value: string }>
  outline: Array<{ depth: number; text: string }>
  paper: PublicPaperRecord
  position: { current: number; total: number } | null
}) {
  const seriesMeta = getPublicPaperSeriesMeta(paper.slug)

  return (
    <div className="space-y-6">
      <div className="rounded-[1.65rem] border border-border/80 bg-background/88 p-5 shadow-[0_26px_80px_-60px_rgba(15,23,42,0.28)]">
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
          {allPapers.map((entry, index) => {
            const isActive = entry.slug === paper.slug
            const entrySeriesMeta = getPublicPaperSeriesMeta(entry.slug)

            return (
              <Link
                className={cn(
                  "block rounded-2xl border px-3 py-3 transition-colors",
                  isActive
                    ? "border-foreground/15 bg-background text-foreground shadow-[0_18px_50px_-42px_rgba(15,23,42,0.4)]"
                    : "border-border/80 bg-background/72 text-muted-foreground hover:bg-background hover:text-foreground"
                )}
                href={getPublicPaperHref(entry.slug)}
                key={entry.slug}
              >
                <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                  {String(index + 1).padStart(2, "0")} / {entrySeriesMeta.stageLabel}
                </p>
                <p className="mt-1 text-sm font-medium text-foreground">
                  {entry.title}
                </p>
              </Link>
            )
          })}
        </div>
      </div>

      <EditorialMetaList
        items={[
          position
            ? {
                label: "Sequence",
                value: `${position.current} of ${position.total}`,
              }
            : null,
          { label: "Stage", value: seriesMeta.stageLabel },
          { label: "Type", value: publicPaperKindLabels[paper.kind] },
          { label: "Read time", value: paper.readingTime },
          { label: "Audience", value: paper.audience },
          { label: "Updated", value: paper.updatedAt },
          ...leadMetaItems,
        ].filter((item): item is { label: string; value: string } => item !== null)}
        title="Paper details"
      />

      {outline.length > 0 ? (
        <div className="rounded-[1.55rem] border border-border/80 bg-muted/18 p-5">
          <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
            Section view
          </p>
          <div className="mt-4 space-y-2">
            {outline.slice(0, 6).map((item) => (
              <div
                className="rounded-2xl border border-border/75 bg-background/76 px-3 py-3 text-sm/7 text-foreground/84"
                key={`${item.depth}-${item.text}`}
              >
                {item.text}
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}

function MetaChip({ children }: { children: string }) {
  return (
    <span className="rounded-full border border-border/80 bg-background/78 px-2.5 py-1 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
      {children}
    </span>
  )
}
