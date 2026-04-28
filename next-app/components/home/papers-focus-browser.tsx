"use client"

import { useEffect, useMemo, useState, type MouseEvent } from "react"
import { ArrowLeft, ArrowRight, LoaderIcon } from "lucide-react"

import { EditorialMarkdown } from "@/components/editorial/editorial-markdown"
import { Button } from "@/components/ui/button"
import { FocusSheetFrame } from "@/components/workboard/focus-sheet-frame"
import {
  extractEditorialDocument,
  getEditorialLeadValue,
} from "@/lib/boreal/editorial"
import type { PublicPaperRecord } from "@/lib/boreal/papers-data"
import { cn } from "@/lib/utils"

type PublicPaperPayload = {
  body: string
  paper: PublicPaperRecord
  relatedPapers: PublicPaperRecord[]
}

const kindLabels = {
  deep_dive: "Deep dive",
  flagship: "Flagship paper",
  technical: "Technical note",
} as const

export function PapersFocusBrowser({
  activePaperSlug,
  onOpenOverview,
  onSelectPaper,
  papers,
}: {
  activePaperSlug: string | null
  onOpenOverview: () => void
  onSelectPaper: (slug: string) => void
  papers: PublicPaperRecord[]
}) {
  const [paperCache, setPaperCache] = useState<Record<string, PublicPaperPayload>>(
    {}
  )
  const [loadingSlug, setLoadingSlug] = useState<string | null>(null)
  const [loadErrorState, setLoadErrorState] = useState<{
    message: string
    slug: string
  } | null>(null)

  const activePaper = useMemo(
    () => papers.find((paper) => paper.slug === activePaperSlug) ?? null,
    [activePaperSlug, papers]
  )
  const activePayload =
    activePaperSlug && paperCache[activePaperSlug]
      ? paperCache[activePaperSlug]
      : null
  const visibleLoadError =
    activePaperSlug &&
    loadingSlug !== activePaperSlug &&
    loadErrorState?.slug === activePaperSlug
      ? loadErrorState.message
      : null

  useEffect(() => {
    if (!activePaperSlug || activePayload) {
      return
    }

    const controller = new AbortController()
    let cancelled = false

    queueMicrotask(() => {
      if (cancelled) {
        return
      }

      setLoadingSlug(activePaperSlug)
    })

    void fetch(`/api/public-papers/${activePaperSlug}`, {
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("Could not load this paper.")
        }

        return (await response.json()) as PublicPaperPayload
      })
      .then((payload) => {
        setPaperCache((current) => ({
          ...current,
          [payload.paper.slug]: payload,
        }))
        setLoadErrorState((current) =>
          current?.slug === payload.paper.slug ? null : current
        )
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") {
          return
        }

        setLoadErrorState({
          message:
            error instanceof Error ? error.message : "Could not load this paper.",
          slug: activePaperSlug,
        })
      })
      .finally(() => {
        setLoadingSlug((current) =>
          current === activePaperSlug ? null : current
        )
      })

    return () => {
      cancelled = true
      controller.abort()
    }
  }, [activePaperSlug, activePayload])

  const flagshipPaper = papers.find((paper) => paper.kind === "flagship") ?? papers[0]
  const technicalPaper =
    papers.find((paper) => paper.kind === "technical") ?? null
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
  const document = activePayload
    ? extractEditorialDocument(activePayload.body)
    : null
  const subtitle = document
    ? getEditorialLeadValue(document.leadFields, "Subtitle")
    : activePaper?.deck ?? null

  return (
    <FocusSheetFrame>
      <div className="grid gap-8 lg:grid-cols-[18rem_minmax(0,1fr)] xl:grid-cols-[19rem_minmax(0,1fr)] xl:gap-10">
        <aside className="lg:sticky lg:top-4 lg:self-start">
          <div className="space-y-4 lg:max-h-[calc(100svh-11rem)] lg:overflow-y-auto lg:pr-2">
            <div className="rounded-[1.4rem] border border-border/80 bg-muted/20 p-4">
              <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                Series map
              </p>
              <div className="mt-4 space-y-2">
                <button
                  className={cn(
                    "flex w-full items-start justify-between gap-3 rounded-2xl border px-3 py-3 text-left transition-colors",
                    !activePaperSlug
                      ? "border-foreground/15 bg-background text-foreground"
                      : "border-border/70 bg-background/70 text-muted-foreground hover:border-border hover:text-foreground"
                  )}
                  onClick={onOpenOverview}
                  type="button"
                >
                  <div className="space-y-1">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                      Overview
                    </p>
                    <p className="text-sm font-medium">
                      Reading order and entry points
                    </p>
                  </div>
                  <ArrowRight className="mt-0.5 size-4 shrink-0" />
                </button>

                {papers.map((paper, index) => (
                  <button
                    className={cn(
                      "flex w-full items-start justify-between gap-3 rounded-2xl border px-3 py-3 text-left transition-colors",
                      activePaperSlug === paper.slug
                        ? "border-foreground/15 bg-background text-foreground"
                        : "border-border/70 bg-background/70 text-muted-foreground hover:border-border hover:text-foreground"
                    )}
                    key={paper.slug}
                    onClick={() => onSelectPaper(paper.slug)}
                    type="button"
                  >
                    <div className="min-w-0 space-y-1">
                      <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                        {String(index + 1).padStart(2, "0")} /{" "}
                        {kindLabels[paper.kind]}
                      </p>
                      <p className="text-sm font-medium text-foreground">
                        {paper.title}
                      </p>
                      <p className="line-clamp-1 text-xs/5 text-muted-foreground">
                        {paper.summary}
                      </p>
                    </div>
                    <ArrowRight className="mt-0.5 size-4 shrink-0" />
                  </button>
                ))}
              </div>
            </div>

            <p className="rounded-[1.2rem] border border-border/70 bg-background px-3 py-3 text-xs/6 text-muted-foreground">
              Start with the flagship. Then move into the operator or builder notes based on why you are here.
            </p>
          </div>
        </aside>

        <div className="min-w-0">
          {activePaper ? (
            <PaperFocusArticleView
              isLoading={loadingSlug === activePaper.slug && !activePayload}
              loadError={visibleLoadError}
              onOpenOverview={onOpenOverview}
              onPaperLinkSelect={onSelectPaper}
              onSelectPaper={onSelectPaper}
              paper={activePaper}
              payload={activePayload}
              relatedPapers={activePayload?.relatedPapers ?? []}
              subtitle={subtitle}
            />
          ) : (
            <PaperFocusOverview
              builderPapers={builderPapers}
              flagshipPaper={flagshipPaper}
              onSelectPaper={onSelectPaper}
              operatorPapers={operatorPapers}
              papers={papers}
              technicalPaper={technicalPaper}
            />
          )}
        </div>
      </div>
    </FocusSheetFrame>
  )
}

function PaperFocusOverview({
  builderPapers,
  flagshipPaper,
  onSelectPaper,
  operatorPapers,
  papers,
  technicalPaper,
}: {
  builderPapers: PublicPaperRecord[]
  flagshipPaper: PublicPaperRecord | undefined
  onSelectPaper: (slug: string) => void
  operatorPapers: PublicPaperRecord[]
  papers: PublicPaperRecord[]
  technicalPaper: PublicPaperRecord | null
}) {
  return (
    <div className="space-y-10 pb-8">
      <section className="rounded-[1.8rem] border border-border/80 bg-background px-5 py-6 shadow-[0_24px_80px_-52px_rgba(15,23,42,0.42)] sm:px-7 sm:py-7">
        <div className="max-w-4xl space-y-4">
          <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
            Boreal papers
          </p>
          <h1 className="font-editorial text-balance text-4xl leading-[0.98] font-semibold tracking-[-0.04em] text-foreground sm:text-5xl">
            Read Boreal in a deliberate order, not as a pile of disconnected notes.
          </h1>
          <p className="max-w-3xl text-base/8 text-foreground/72 sm:text-lg/8">
            The paper suite should answer three questions fast: what Boreal is,
            why humans and agents belong in one market, and why outside agent
            owners should care. Start with the flagship. Then follow the track
            that matches why you are here.
          </p>
          {flagshipPaper ? (
            <div className="flex flex-wrap gap-3 pt-2">
              <Button onClick={() => onSelectPaper(flagshipPaper.slug)} size="sm" type="button">
                Start with {flagshipPaper.title}
              </Button>
              {technicalPaper ? (
                <Button
                  onClick={() => onSelectPaper(technicalPaper.slug)}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  Jump to the network note
                </Button>
              ) : null}
            </div>
          ) : null}
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <TrackCard
          body="The shortest path if you want the broad product and market definition first."
          onSelectPaper={onSelectPaper}
          papers={papers.filter((paper) =>
            paper.slug === "work-network" ||
            paper.slug === "human-supply" ||
            paper.slug === "swarm-workspace"
          )}
          title="Understand the market"
        />
        <TrackCard
          body="The right path if you care about accountable delivery, collaboration, and why high-judgment work still matters."
          onSelectPaper={onSelectPaper}
          papers={operatorPapers}
          title="Understand execution"
        />
        <TrackCard
          body="The right path if you care about external agents, trust, and the adapter layer."
          onSelectPaper={onSelectPaper}
          papers={builderPapers}
          title="Understand the open-agent path"
        />
      </section>

      <PaperCollectionSection
        description="One broad paper that frames the whole suite before you drop into specialized notes."
        eyebrow="Start here"
        onSelectPaper={onSelectPaper}
        papers={flagshipPaper ? [flagshipPaper] : []}
        title="Read the main claim first"
      />

      <PaperCollectionSection
        description="These explain how Boreal handles real work once the request leaves pure chat: people, accountability, and collaboration."
        eyebrow="Operator path"
        onSelectPaper={onSelectPaper}
        papers={operatorPapers}
        title="Then move into supply and workspace depth"
      />

      <PaperCollectionSection
        description="These explain how outside agents join, how trust should compound, and where the deeper network architecture fits."
        eyebrow="Builder path"
        onSelectPaper={onSelectPaper}
        papers={builderPapers}
        title="Finish with the agent-owner and infrastructure layer"
      />
    </div>
  )
}

function PaperFocusArticleView({
  isLoading,
  loadError,
  onOpenOverview,
  onPaperLinkSelect,
  onSelectPaper,
  paper,
  payload,
  relatedPapers,
  subtitle,
}: {
  isLoading: boolean
  loadError: string | null
  onOpenOverview: () => void
  onPaperLinkSelect: (slug: string) => void
  onSelectPaper: (slug: string) => void
  paper: PublicPaperRecord
  payload: PublicPaperPayload | null
  relatedPapers: PublicPaperRecord[]
  subtitle: string | null
}) {
  const document = payload ? extractEditorialDocument(payload.body) : null

  function handleDocumentClick(event: MouseEvent<HTMLElement>) {
    const target =
      event.target instanceof HTMLElement ? event.target : null
    const anchor = target?.closest("a")

    if (!anchor) {
      return
    }

    const next = parseEmbeddedPaperHref(anchor.getAttribute("href"))

    if (!next) {
      return
    }

    event.preventDefault()

    if (next === "overview") {
      onOpenOverview()
      return
    }

    onPaperLinkSelect(next)
  }

  return (
    <div className="space-y-8 pb-8">
      <section className="rounded-[1.8rem] border border-border/80 bg-background px-5 py-6 shadow-[0_24px_80px_-52px_rgba(15,23,42,0.42)] sm:px-7 sm:py-7">
        <button
          className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          onClick={onOpenOverview}
          type="button"
        >
          <ArrowLeft className="size-4" />
          Back to paper overview
        </button>
        <div className="mt-5 max-w-4xl space-y-4">
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
          <div className="flex flex-wrap gap-2 pt-2">
            <MetaChip>{paper.readingTime}</MetaChip>
            <MetaChip>{paper.updatedAt}</MetaChip>
            <MetaChip>{paper.audience}</MetaChip>
          </div>
        </div>
      </section>

      {isLoading ? (
        <div className="rounded-[1.6rem] border border-border/80 bg-background px-5 py-8 text-sm text-muted-foreground sm:px-7">
          <div className="flex items-center gap-3">
            <LoaderIcon className="size-4 animate-spin" />
            Loading paper body
          </div>
        </div>
      ) : null}

      {loadError ? (
        <div className="rounded-[1.6rem] border border-destructive/20 bg-destructive/5 px-5 py-6 text-sm text-destructive sm:px-7">
          {loadError}
        </div>
      ) : null}

      {document ? (
        <article
          className="rounded-[1.8rem] border border-border/80 bg-background px-5 py-6 sm:px-7 sm:py-7"
          onClickCapture={handleDocumentClick}
        >
          <EditorialMarkdown>{document.body}</EditorialMarkdown>
        </article>
      ) : null}

      {relatedPapers.length > 0 ? (
        <section className="space-y-4 rounded-[1.8rem] border border-border/80 bg-muted/18 px-5 py-6 sm:px-7">
          <div className="space-y-2">
            <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
              Read next
            </p>
            <h2 className="font-editorial text-3xl leading-[1.02] font-semibold tracking-[-0.03em] text-foreground">
              Stay in the same thread
            </h2>
            <p className="max-w-2xl text-sm/7 text-muted-foreground">
              Move to the adjacent paper instead of dropping back into a flat
              index.
            </p>
          </div>
          <div className="space-y-3">
            {relatedPapers.map((relatedPaper) => (
              <button
                className="flex w-full items-start justify-between gap-4 rounded-2xl border border-border/80 bg-background px-4 py-4 text-left transition-colors hover:border-border hover:bg-background/90"
                key={relatedPaper.slug}
                onClick={() => onSelectPaper(relatedPaper.slug)}
                type="button"
              >
                <div className="min-w-0 space-y-1">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                    {kindLabels[relatedPaper.kind]}
                  </p>
                  <p className="text-base font-medium text-foreground">
                    {relatedPaper.title}
                  </p>
                  <p className="text-sm/7 text-muted-foreground">
                    {relatedPaper.summary}
                  </p>
                </div>
                <ArrowRight className="mt-1 size-4 shrink-0 text-muted-foreground" />
              </button>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  )
}

function TrackCard({
  body,
  onSelectPaper,
  papers,
  title,
}: {
  body: string
  onSelectPaper: (slug: string) => void
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
          <button
            className="flex w-full items-center justify-between gap-3 rounded-2xl border border-border/80 px-3 py-3 text-left transition-colors hover:bg-muted/20"
            key={paper.slug}
            onClick={() => onSelectPaper(paper.slug)}
            type="button"
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
          </button>
        ))}
      </div>
    </section>
  )
}

function PaperCollectionSection({
  description,
  eyebrow,
  onSelectPaper,
  papers,
  title,
}: {
  description: string
  eyebrow: string
  onSelectPaper: (slug: string) => void
  papers: PublicPaperRecord[]
  title: string
}) {
  if (papers.length === 0) {
    return null
  }

  return (
    <section className="space-y-4">
      <div className="max-w-3xl space-y-3">
        <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
          {eyebrow}
        </p>
        <h2 className="font-editorial text-3xl leading-[1.02] font-semibold tracking-[-0.03em] text-foreground sm:text-4xl">
          {title}
        </h2>
        <p className="text-base/8 text-muted-foreground">{description}</p>
      </div>
      <div className="space-y-3">
        {papers.map((paper) => (
          <button
            className="flex w-full items-start justify-between gap-4 rounded-[1.6rem] border border-border/80 bg-background px-5 py-5 text-left transition-colors hover:bg-muted/18"
            key={paper.slug}
            onClick={() => onSelectPaper(paper.slug)}
            type="button"
          >
            <div className="min-w-0 space-y-2">
              <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                {kindLabels[paper.kind]} / {paper.readingTime}
              </p>
              <h3 className="font-editorial text-2xl leading-[1.04] font-semibold tracking-[-0.025em] text-foreground">
                {paper.title}
              </h3>
              <p className="text-sm/7 text-foreground/76">{paper.deck}</p>
              <p className="text-sm/7 text-muted-foreground">{paper.summary}</p>
            </div>
            <ArrowRight className="mt-1 size-4 shrink-0 text-muted-foreground" />
          </button>
        ))}
      </div>
    </section>
  )
}

function MetaChip({ children }: { children: string }) {
  return (
    <span className="rounded-full border border-border/80 px-2.5 py-1 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
      {children}
    </span>
  )
}

function parseEmbeddedPaperHref(href: string | null) {
  if (!href) {
    return null
  }

  const candidate = href.trim()

  if (!candidate.startsWith("/")) {
    return null
  }

  if (candidate === "/papers") {
    return "overview" as const
  }

  if (!candidate.startsWith("/papers/")) {
    return null
  }

  const slug = candidate.slice("/papers/".length).split(/[?#]/, 1)[0]
  return slug || null
}

