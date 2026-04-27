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
  body,
  paper,
  relatedPapers,
}: {
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
          <div className="space-y-8">
            <div className="space-y-5">
              <Link
                className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                href="/papers"
              >
                <ArrowLeft className="size-4" />
                Back to papers
              </Link>
              <div className="space-y-4">
                <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                  {kindLabels[paper.kind]}
                </p>
                <h1 className="font-editorial text-balance text-5xl leading-[0.98] font-semibold tracking-[-0.045em] text-foreground sm:text-6xl">
                  {paper.title}
                </h1>
                <p className="text-lg/8 text-foreground/72">
                  {subtitle ?? paper.deck}
                </p>
                <p className="text-sm/7 text-muted-foreground">{paper.summary}</p>
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

            <div className="space-y-3">
              <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                Continue in product
              </p>
              <div className="flex flex-col gap-2 text-sm/7 text-foreground">
                <Link className="hover:text-muted-foreground" href="/">
                  Open chat
                </Link>
                <Link className="hover:text-muted-foreground" href="/about">
                  View product context
                </Link>
              </div>
            </div>
          </div>
        }
      >
        <div className="space-y-16">
          <article className="space-y-8">
            <div className="border-b border-border/80 pb-6">
              <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                Document body
              </p>
            </div>
            <EditorialMarkdown>{document.body}</EditorialMarkdown>
          </article>

          {relatedPapers.length > 0 ? (
            <section className="space-y-6 border-t border-border/80 pt-10">
              <EditorialSectionHeader
                description="Same public narrative, different angle.  Keep moving through the set without dropping back into a crowded hub."
                eyebrow="Read next"
                title="Linked papers in the same story"
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
