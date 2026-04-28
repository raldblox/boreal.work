"use client"

import { useEffect, useState, type MouseEvent } from "react"
import { ArrowLeft, ArrowRight, LoaderIcon } from "lucide-react"

import { EditorialMarkdown } from "@/components/editorial/editorial-markdown"
import { PapersHubPage } from "@/components/home/papers-hub-page"
import { Button } from "@/components/ui/button"
import { FocusSheetFrame } from "@/components/workboard/focus-sheet-frame"
import {
  extractEditorialDocument,
  extractEditorialOutline,
  getEditorialLeadValue,
} from "@/lib/boreal/editorial"
import {
  getNextPublicPaper,
  getPreviousPublicPaper,
  getPublicPaperSequencePosition,
  getPublicPaperSeriesMeta,
  publicPaperKindLabels,
} from "@/lib/boreal/papers-data"
import type { PublicPaperRecord } from "@/lib/boreal/papers-data"
import { cn } from "@/lib/utils"

type PublicPaperPayload = {
  body: string
  paper: PublicPaperRecord
  relatedPapers: PublicPaperRecord[]
}

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

  const activePaper = activePaperSlug
    ? papers.find((paper) => paper.slug === activePaperSlug) ?? null
    : null
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
      if (!cancelled) {
        setLoadingSlug(activePaperSlug)
      }
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

  return (
    <FocusSheetFrame>
      <div className="grid gap-8 lg:grid-cols-[18.5rem_minmax(0,1fr)] xl:grid-cols-[19.5rem_minmax(0,1fr)] xl:gap-10">
        <aside className="lg:sticky lg:top-4 lg:self-start">
          <SeriesNavigatorPanel
            activePaperSlug={activePaperSlug}
            onOpenOverview={onOpenOverview}
            onSelectPaper={onSelectPaper}
            papers={papers}
          />
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
            />
          ) : (
            <PapersHubPage
              embedded
              onSelectPaper={onSelectPaper}
              papers={papers}
              showRail={false}
            />
          )}
        </div>
      </div>
    </FocusSheetFrame>
  )
}

function SeriesNavigatorPanel({
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
  return (
    <div className="space-y-4 lg:max-h-[calc(100svh-11rem)] lg:overflow-y-auto lg:pr-2">
      <div className="rounded-[1.55rem] border border-border/80 bg-background/90 p-4 shadow-[0_22px_70px_-60px_rgba(15,23,42,0.28)]">
        <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
          Paper browser
        </p>
        <p className="mt-3 text-sm/7 text-muted-foreground">
          Stay in one reader. Move through the suite without dropping back into
          a file switcher.
        </p>

        <div className="mt-4 space-y-2">
          <button
            className={cn(
              "flex w-full items-start justify-between gap-3 rounded-2xl border px-3 py-3 text-left transition-colors",
              !activePaperSlug
                ? "border-foreground/15 bg-background text-foreground shadow-[0_18px_50px_-42px_rgba(15,23,42,0.35)]"
                : "border-border/80 bg-background/72 text-muted-foreground hover:bg-background hover:text-foreground"
            )}
            onClick={onOpenOverview}
            type="button"
          >
            <div className="space-y-1">
              <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                Overview
              </p>
              <p className="text-sm font-medium text-foreground">
                Reading order and entry paths
              </p>
            </div>
            <ArrowRight className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          </button>

          {papers.map((paper, index) => {
            const isActive = paper.slug === activePaperSlug
            const seriesMeta = getPublicPaperSeriesMeta(paper.slug)

            return (
              <button
                className={cn(
                  "flex w-full items-start justify-between gap-3 rounded-2xl border px-3 py-3 text-left transition-colors",
                  isActive
                    ? "border-foreground/15 bg-background text-foreground shadow-[0_18px_50px_-42px_rgba(15,23,42,0.35)]"
                    : "border-border/80 bg-background/72 text-muted-foreground hover:bg-background hover:text-foreground"
                )}
                key={paper.slug}
                onClick={() => onSelectPaper(paper.slug)}
                type="button"
              >
                <div className="min-w-0 space-y-1">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                    {String(index + 1).padStart(2, "0")} / {seriesMeta.stageLabel}
                  </p>
                  <p className="text-sm font-medium text-foreground">
                    {paper.title}
                  </p>
                  <p className="line-clamp-2 text-xs/6 text-muted-foreground">
                    {paper.summary}
                  </p>
                </div>
                <ArrowRight className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              </button>
            )
          })}
        </div>
      </div>

      <div className="rounded-[1.35rem] border border-border/75 bg-muted/18 px-4 py-4 text-sm/7 text-muted-foreground">
        Start with the flagship. Then choose the operator or builder path. Keep
        the technical note last if you want the full architecture frame.
      </div>
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
}: {
  isLoading: boolean
  loadError: string | null
  onOpenOverview: () => void
  onPaperLinkSelect: (slug: string) => void
  onSelectPaper: (slug: string) => void
  paper: PublicPaperRecord
  payload: PublicPaperPayload | null
  relatedPapers: PublicPaperRecord[]
}) {
  const document = payload ? extractEditorialDocument(payload.body) : null
  const outline = document ? extractEditorialOutline(document.body, 2) : []
  const subtitle = document
    ? getEditorialLeadValue(document.leadFields, "Subtitle")
    : paper.deck
  const seriesMeta = getPublicPaperSeriesMeta(paper.slug)
  const position = getPublicPaperSequencePosition(paper.slug)
  const previousPaper = getPreviousPublicPaper(paper.slug)
  const nextPaper = getNextPublicPaper(paper.slug)
  const extraOutlineCount = Math.max(outline.length - 6, 0)
  const relatedWithoutNext = relatedPapers.filter(
    (entry) => entry.slug !== nextPaper?.slug
  )

  function handleDocumentClick(event: MouseEvent<HTMLElement>) {
    const target = event.target instanceof HTMLElement ? event.target : null
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
      <section className="overflow-hidden rounded-[2rem] border border-border/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.97),rgba(240,249,255,0.86)_58%,rgba(236,253,245,0.7))] px-5 py-6 shadow-[0_30px_90px_-56px_rgba(15,23,42,0.34)] sm:px-7 sm:py-8">
        <button
          className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          onClick={onOpenOverview}
          type="button"
        >
          <ArrowLeft className="size-4" />
          Back to paper overview
        </button>

        <div className="mt-5 flex flex-wrap gap-2">
          {position ? (
            <MetaChip>{`Chapter ${position.current} of ${position.total}`}</MetaChip>
          ) : null}
          <MetaChip>{seriesMeta.stageLabel}</MetaChip>
          <MetaChip>{paper.readingTime}</MetaChip>
        </div>

        <div className="mt-5 max-w-4xl space-y-4">
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
            <Button
              onClick={() => onSelectPaper(previousPaper.slug)}
              size="sm"
              type="button"
              variant="outline"
            >
              <ArrowLeft className="size-3" />
              Previous paper
            </Button>
          ) : null}
          {nextPaper ? (
            <Button onClick={() => onSelectPaper(nextPaper.slug)} size="sm" type="button">
              Next paper
              <ArrowRight className="size-3" />
            </Button>
          ) : null}
        </div>
      </section>

      {isLoading ? (
        <div className="rounded-[1.6rem] border border-border/80 bg-background px-5 py-8 text-sm text-muted-foreground shadow-[0_18px_50px_-42px_rgba(15,23,42,0.2)] sm:px-7">
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
          className="rounded-[2rem] border border-border/80 bg-background/94 px-5 py-6 shadow-[0_24px_80px_-60px_rgba(15,23,42,0.2)] sm:px-7 sm:py-8"
          onClickCapture={handleDocumentClick}
        >
          {outline.length > 0 ? (
            <div className="mb-8 rounded-[1.55rem] border border-border/80 bg-muted/18 p-5">
              <div className="space-y-2">
                <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                  In this paper
                </p>
                <p className="text-sm/7 text-muted-foreground">
                  A quick scan before the full read.
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
      ) : null}

      {(nextPaper || relatedWithoutNext.length > 0) ? (
        <section className="space-y-4 rounded-[1.8rem] border border-border/80 bg-muted/18 px-5 py-6 sm:px-7">
          <div className="space-y-2">
            <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
              Read next
            </p>
            <h2 className="font-editorial text-3xl leading-[1.02] font-semibold tracking-[-0.03em] text-foreground">
              Stay in the same reading thread
            </h2>
            <p className="max-w-2xl text-sm/7 text-muted-foreground">
              Move forward without dropping back into a flat index.
            </p>
          </div>

          <div className="space-y-3">
            {nextPaper ? (
              <button
                className="w-full rounded-[1.7rem] border border-border/80 bg-background px-5 py-5 text-left shadow-[0_18px_50px_-42px_rgba(15,23,42,0.22)] transition duration-200 hover:-translate-y-0.5 hover:border-foreground/12"
                onClick={() => onSelectPaper(nextPaper.slug)}
                type="button"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                      <span>Next in sequence</span>
                      <span>{publicPaperKindLabels[nextPaper.kind]}</span>
                      <span>{nextPaper.readingTime}</span>
                    </div>
                    <h3 className="font-editorial text-3xl leading-[1.02] font-semibold tracking-[-0.035em] text-foreground">
                      {nextPaper.title}
                    </h3>
                    <p className="max-w-3xl text-sm/7 text-foreground/74">
                      {nextPaper.deck}
                    </p>
                    <p className="max-w-md text-sm/7 text-muted-foreground">
                      {nextPaper.summary}
                    </p>
                  </div>
                  <ArrowRight className="mt-1 size-4 shrink-0 text-muted-foreground" />
                </div>
              </button>
            ) : null}

            {relatedWithoutNext.map((relatedPaper) => (
              <button
                className="flex w-full items-start justify-between gap-4 rounded-2xl border border-border/80 bg-background px-4 py-4 text-left transition-colors hover:border-border hover:bg-background/90"
                key={relatedPaper.slug}
                onClick={() => onSelectPaper(relatedPaper.slug)}
                type="button"
              >
                <div className="min-w-0 space-y-1">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                    {publicPaperKindLabels[relatedPaper.kind]}
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

function MetaChip({ children }: { children: string }) {
  return (
    <span className="rounded-full border border-border/80 bg-background/78 px-2.5 py-1 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
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
