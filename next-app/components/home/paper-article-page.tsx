import Link from "next/link"
import { ArrowLeft, ArrowRight, FileTextIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import type { PublicPaperRecord } from "@/lib/boreal/papers"

import { ArticleMarkdown } from "./article-markdown"
import { PaperCard } from "./paper-card"
import { PublicPageFooter, PublicPageHeader } from "./public-site-chrome"

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
  return (
    <main id="main-content" className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen w-full max-w-[1480px] flex-col px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
        <PublicPageHeader activeHref="/papers" eyebrow="Public papers and network notes" />

        <section className="grid gap-4 py-8 lg:grid-cols-[minmax(0,1.08fr)_minmax(20rem,0.92fr)] lg:py-10">
          <div className="border border-border bg-background">
            <div className="border-b border-border px-4 py-3 sm:px-5">
              <div className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                <span>{kindLabels[paper.kind]}</span>
                <span>/</span>
                <span>{paper.readingTime}</span>
                <span>/</span>
                <span>{paper.updatedAt}</span>
              </div>
              <h1 className="mt-3 max-w-5xl font-heading text-balance text-4xl font-semibold tracking-tight sm:text-6xl">
                {paper.title}
              </h1>
              <p className="mt-4 max-w-4xl text-base/8 text-muted-foreground sm:text-lg/8">
                {paper.deck}
              </p>
            </div>

            <div className="flex flex-wrap gap-3 px-4 py-5 sm:px-5 sm:py-6">
              <Button asChild className="rounded-none" size="lg">
                <Link href="/">Open chat</Link>
              </Button>
              <Button asChild className="rounded-none" size="lg" variant="outline">
                <Link href="/papers">
                  <ArrowLeft className="size-4" />
                  Back to papers
                </Link>
              </Button>
            </div>
          </div>

          <aside className="border border-border bg-muted/18">
            <div className="border-b border-border px-4 py-3 sm:px-5">
              <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                <FileTextIcon className="size-3.5" />
                Paper metadata
              </div>
              <h2 className="mt-2 font-heading text-2xl font-semibold tracking-tight">
                Why this paper exists
              </h2>
            </div>

            <div className="space-y-4 px-4 py-4 sm:px-5">
              <div className="border border-border bg-background px-4 py-4">
                <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                  Audience
                </p>
                <p className="mt-2 text-sm/7 text-foreground">{paper.audience}</p>
              </div>
              <div className="border border-border bg-background px-4 py-4">
                <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                  Position in the set
                </p>
                <p className="mt-2 text-sm/7 text-foreground">{kindLabels[paper.kind]}</p>
              </div>
              <div className="border border-border bg-background px-4 py-4">
                <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                  Summary
                </p>
                <p className="mt-2 text-sm/7 text-foreground">{paper.summary}</p>
              </div>
            </div>
          </aside>
        </section>

        <section className="border border-border bg-background px-4 py-6 sm:px-6 sm:py-8">
          <ArticleMarkdown>{body}</ArticleMarkdown>
        </section>

        {relatedPapers.length > 0 ? (
          <section className="space-y-6 pt-8">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                  Read next
                </p>
                <h2 className="mt-2 font-heading text-2xl font-semibold tracking-tight">
                  Linked papers in the same story
                </h2>
              </div>
              <Link
                className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                href="/papers"
              >
                View all papers
                <ArrowRight className="size-4" />
              </Link>
            </div>
            <div className="grid gap-4 lg:grid-cols-3">
              {relatedPapers.map((relatedPaper) => (
                <PaperCard compact key={relatedPaper.slug} paper={relatedPaper} />
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
