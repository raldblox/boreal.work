import Link from "next/link"
import { ArrowRight } from "@/components/ui/static-icons"

import {
  getPublicPaperHref,
  getPublicPaperSeriesMeta,
  getTotalPublicPaperReadingMinutes,
  listPublicPapersByGroup,
  publicPaperKindLabels,
} from "@/lib/boreal/papers-data"
import type { PublicPaperRecord } from "@/lib/boreal/papers-data"
import { cn } from "@/lib/utils"

import { EditorialEntryLink } from "@/components/editorial/editorial-entry-link"
import {
  EditorialMetaList,
  EditorialSectionHeader,
  EditorialShell,
  EditorialSplitLayout,
} from "@/components/editorial/editorial-shell"
import { Button } from "@/components/ui/button"

export function PapersHubPage({
  embedded = false,
  onSelectPaper,
  papers,
  showRail = true,
}: {
  embedded?: boolean
  onSelectPaper?: (slug: string) => void
  papers: PublicPaperRecord[]
  showRail?: boolean
}) {
  const flagshipPaper = listPublicPapersByGroup("flagship")[0] ?? papers[0]
  const operatorPapers = listPublicPapersByGroup("operator")
  const builderPapers = listPublicPapersByGroup("builder")
  const technicalPaper = listPublicPapersByGroup("technical")[0] ?? null
  const totalMinutes = getTotalPublicPaperReadingMinutes()

  const body = (
    <div className={cn("space-y-16", embedded ? "space-y-14" : "")}>
      <section className="overflow-hidden rounded-[2.1rem] border border-border/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(240,249,255,0.84)_58%,rgba(236,253,245,0.72))] px-5 py-6 shadow-[0_30px_90px_-54px_rgba(15,23,42,0.34)] sm:px-7 sm:py-8">
        <div className="max-w-4xl space-y-5">
          <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
            Public paper suite
          </p>
          <h1 className="font-editorial text-balance text-4xl leading-[0.97] font-semibold tracking-[-0.045em] text-foreground sm:text-5xl">
            Read Boreal as a guided series, not a flat stack of files.
          </h1>
          <p className="max-w-3xl text-base/8 text-foreground/74 sm:text-lg/8">
            Start with one broad framing paper. Then move into the operator path
            or builder path. Keep the network note for the technical finish. The
            suite should feel like one editorial room with clear doors, not a
            raw markdown index.
          </p>
          <div className="flex flex-wrap gap-3 pt-1">
            {flagshipPaper ? (
              <OpenPaperButton
                onSelectPaper={onSelectPaper}
                paper={flagshipPaper}
                size="sm"
              >
                Start with {flagshipPaper.title}
              </OpenPaperButton>
            ) : null}
            {technicalPaper ? (
              <OpenPaperButton
                onSelectPaper={onSelectPaper}
                paper={technicalPaper}
                size="sm"
                variant="outline"
              >
                Save {technicalPaper.title} for last
              </OpenPaperButton>
            ) : null}
          </div>
        </div>

        <div className="mt-8 grid gap-3 md:grid-cols-3">
          <HeroStat label="Documents" value={`${papers.length} chapters`} />
          <HeroStat label="Reading time" value={`About ${totalMinutes} minutes`} />
          <HeroStat
            label="Best use"
            value="Flagship, operator, builder, and technical routes"
          />
        </div>
      </section>

      <section className="space-y-6">
        <EditorialSectionHeader
          description="This is the cleanest route through the suite. Read straight through if you want the full picture without doubling back."
          eyebrow="Series order"
          title="A calmer way through the papers"
        />
        <div className="grid gap-4 xl:grid-cols-2">
          {papers.map((paper, index) => (
            <SequenceCard
              index={index}
              key={paper.slug}
              onSelectPaper={onSelectPaper}
              paper={paper}
            />
          ))}
        </div>
      </section>

      <section className="space-y-6">
        <EditorialSectionHeader
          description="You do not need every paper on the first pass. Pick the doorway that matches what you need from Boreal right now."
          eyebrow="Entry paths"
          title="Choose the reading door that fits why you are here"
        />
        <div className="grid gap-4 xl:grid-cols-2">
          {flagshipPaper ? (
            <PathCard
              body="The shortest honest definition of the product and market. Start here if you only read one paper today."
              label="Flagship"
              onSelectPaper={onSelectPaper}
              papers={[flagshipPaper]}
            />
          ) : null}
          <PathCard
            body="The practical path for readers who care about judgment, accountability, human supply, and live collaboration."
            label="Operator path"
            onSelectPaper={onSelectPaper}
            papers={operatorPapers}
          />
          <PathCard
            body="The practical path for agent owners who want demand, delivery history, reputation, and adapter reality."
            label="Builder path"
            onSelectPaper={onSelectPaper}
            papers={builderPapers}
          />
          {technicalPaper ? (
            <PathCard
              body="The deepest architectural note. Read this after the rest if you want the full coordination and reputation frame."
              label="Technical note"
              onSelectPaper={onSelectPaper}
              papers={[technicalPaper]}
            />
          ) : null}
        </div>
      </section>

      {flagshipPaper ? (
        <section className="space-y-6">
          <EditorialSectionHeader
            description="One paper should still carry the broad product and market definition before the suite branches into role-specific depth."
            eyebrow="Start here"
            title="Read the flagship first"
          />
          <EditorialEntryLink
            excerpt={flagshipPaper.summary}
            featured
            href={getPublicPaperHref(flagshipPaper.slug)}
            lede={flagshipPaper.deck}
            meta={[
              publicPaperKindLabels[flagshipPaper.kind],
              flagshipPaper.readingTime,
              flagshipPaper.updatedAt,
            ]}
            onClick={
              onSelectPaper
                ? () => onSelectPaper(flagshipPaper.slug)
                : undefined
            }
            title={flagshipPaper.title}
            tone={getPublicPaperSeriesMeta(flagshipPaper.slug).tone}
          />
        </section>
      ) : null}

      <PaperGroupSection
        description="These papers explain how Boreal moves from visible demand into accountable work, collaboration, and delivery."
        eyebrow="Operator path"
        onSelectPaper={onSelectPaper}
        papers={operatorPapers}
        title="Then move into supply and workspace depth"
      />

      <PaperGroupSection
        description="These papers explain why outside runtimes still need a work network, and how trust should grow from accepted work."
        eyebrow="Builder path"
        onSelectPaper={onSelectPaper}
        papers={builderPapers}
        title="Then move into the agent-owner layer"
      />

      {technicalPaper ? (
        <PaperGroupSection
          description="This is the longest and most technical paper in the suite. It works best as the final frame once the product story is already in place."
          eyebrow="Technical note"
          onSelectPaper={onSelectPaper}
          papers={[technicalPaper]}
          title="Finish with the network architecture note"
        />
      ) : null}
    </div>
  )

  const content = showRail ? (
    <EditorialSplitLayout
      className={cn(embedded ? "gap-8 py-0 lg:gap-10 lg:py-0 xl:gap-12" : "")}
      contentClassName={cn(embedded ? "pt-6 lg:pl-8 xl:pl-10" : "")}
      rail={
        <PapersHubRail
          flagshipPaper={flagshipPaper}
          onSelectPaper={onSelectPaper}
          papers={papers}
          totalMinutes={totalMinutes}
        />
      }
      railClassName={cn(embedded ? "lg:top-6" : "")}
    >
      {body}
    </EditorialSplitLayout>
  ) : (
    body
  )

  if (embedded && showRail) {
    return (
      <div className="mx-auto w-full max-w-[1480px] px-4 py-4 sm:px-5">
        {content}
      </div>
    )
  }

  if (embedded) {
    return content
  }

  return <EditorialShell>{content}</EditorialShell>
}

function PapersHubRail({
  flagshipPaper,
  onSelectPaper,
  papers,
  totalMinutes,
}: {
  flagshipPaper: PublicPaperRecord | undefined
  onSelectPaper?: (slug: string) => void
  papers: PublicPaperRecord[]
  totalMinutes: number
}) {
  return (
    <div className="space-y-6">
      <div className="rounded-[1.65rem] border border-border/80 bg-background/88 p-5 shadow-[0_26px_80px_-60px_rgba(15,23,42,0.28)]">
        <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
          Series guide
        </p>
        <p className="mt-3 text-sm/7 text-muted-foreground">
          Start broad. Choose the operator or builder path next. Keep the
          technical note last if you want the deepest architecture frame.
        </p>
        <div className="mt-5 space-y-2">
          {papers.map((paper, index) => (
            <SeriesMapAction
              index={index}
              key={paper.slug}
              onSelectPaper={onSelectPaper}
              paper={paper}
            />
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
            label: "Reading time",
            value: `About ${totalMinutes} minutes`,
          },
          {
            label: "Start here",
            value: flagshipPaper?.title ?? "Flagship paper",
          },
          {
            label: "Layout",
            value: "Flagship, operator path, builder path, then technical note",
          },
        ]}
        title="At a glance"
      />

      <div className="rounded-[1.55rem] border border-border/80 bg-muted/18 p-5">
        <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
          Reader doors
        </p>
        <div className="mt-4 space-y-4 text-sm/7 text-muted-foreground">
          <div>
            <p className="font-medium text-foreground">Founders and first-time readers</p>
            <p>Read the flagship, then human supply.</p>
          </div>
          <div>
            <p className="font-medium text-foreground">Operators and specialists</p>
            <p>Read human supply, then swarm workspace.</p>
          </div>
          <div>
            <p className="font-medium text-foreground">Agent owners and builders</p>
            <p>Read connect your agent, then portable reputation.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function SequenceCard({
  index,
  onSelectPaper,
  paper,
}: {
  index: number
  onSelectPaper?: (slug: string) => void
  paper: PublicPaperRecord
}) {
  const seriesMeta = getPublicPaperSeriesMeta(paper.slug)

  return (
    <PaperSurface
      className={cn(index === 0 && "xl:col-span-2")}
      onSelectPaper={onSelectPaper}
      paper={paper}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="inline-flex size-9 items-center justify-center rounded-full border border-border/80 bg-background text-[11px] font-medium tracking-[0.2em] text-muted-foreground">
            {String(index + 1).padStart(2, "0")}
          </span>
          <div className="space-y-1">
            <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
              {seriesMeta.stageLabel}
            </p>
            <p className="text-sm font-medium text-foreground">
              {publicPaperKindLabels[paper.kind]}
            </p>
          </div>
        </div>
        <ArrowRight className="mt-1 size-4 shrink-0 text-muted-foreground" />
      </div>

      <div className="mt-5 space-y-3">
        <h3 className="font-editorial text-3xl leading-[1.02] font-semibold tracking-[-0.03em] text-foreground">
          {paper.title}
        </h3>
        <p className="text-sm/7 text-foreground/76">{paper.deck}</p>
        <p className="text-sm/7 text-muted-foreground">{paper.summary}</p>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <RailChip>{paper.readingTime}</RailChip>
        <RailChip>{paper.audience}</RailChip>
      </div>
    </PaperSurface>
  )
}

function PathCard({
  body,
  label,
  onSelectPaper,
  papers,
}: {
  body: string
  label: string
  onSelectPaper?: (slug: string) => void
  papers: PublicPaperRecord[]
}) {
  if (papers.length === 0) {
    return null
  }

  return (
    <section className="rounded-[1.75rem] border border-border/80 bg-background/90 p-5 shadow-[0_22px_70px_-60px_rgba(15,23,42,0.28)] sm:p-6">
      <div className="space-y-3">
        <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
          {label}
        </p>
        <h2 className="font-editorial text-3xl leading-[1.02] font-semibold tracking-[-0.03em] text-foreground">
          {papers.length === 1 ? "One essential read" : `${papers.length} connected reads`}
        </h2>
        <p className="text-sm/7 text-muted-foreground">{body}</p>
      </div>
      <div className="mt-5 space-y-2">
        {papers.map((paper) => (
          <SeriesMapAction
            key={paper.slug}
            onSelectPaper={onSelectPaper}
            paper={paper}
          />
        ))}
      </div>
    </section>
  )
}

function PaperGroupSection({
  description,
  eyebrow,
  onSelectPaper,
  papers,
  title,
}: {
  description: string
  eyebrow: string
  onSelectPaper?: (slug: string) => void
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
      <div className="space-y-3">
        {papers.map((paper) => (
          <EditorialEntryLink
            excerpt={paper.summary}
            href={getPublicPaperHref(paper.slug)}
            key={paper.slug}
            lede={paper.deck}
            meta={[
              publicPaperKindLabels[paper.kind],
              paper.readingTime,
              paper.updatedAt,
            ]}
            onClick={onSelectPaper ? () => onSelectPaper(paper.slug) : undefined}
            title={paper.title}
            tone={getPublicPaperSeriesMeta(paper.slug).tone}
          />
        ))}
      </div>
    </section>
  )
}

function PaperSurface({
  children,
  className,
  onSelectPaper,
  paper,
}: {
  children: React.ReactNode
  className?: string
  onSelectPaper?: (slug: string) => void
  paper: PublicPaperRecord
}) {
  const classes = cn(
    "block rounded-[1.8rem] border border-border/80 bg-background/90 p-5 text-left shadow-[0_24px_80px_-60px_rgba(15,23,42,0.28)] transition duration-200 hover:-translate-y-0.5 hover:border-foreground/12 hover:shadow-[0_28px_80px_-52px_rgba(15,23,42,0.34)] sm:p-6",
    className
  )

  if (onSelectPaper) {
    return (
      <button
        className={classes}
        onClick={() => onSelectPaper(paper.slug)}
        type="button"
      >
        {children}
      </button>
    )
  }

  return (
    <Link className={classes} href={getPublicPaperHref(paper.slug)}>
      {children}
    </Link>
  )
}

function SeriesMapAction({
  index,
  onSelectPaper,
  paper,
}: {
  index?: number
  onSelectPaper?: (slug: string) => void
  paper: PublicPaperRecord
}) {
  const seriesMeta = getPublicPaperSeriesMeta(paper.slug)
  const content = (
    <>
      <div className="min-w-0 space-y-1">
        <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          {typeof index === "number"
            ? `${String(index + 1).padStart(2, "0")} / ${seriesMeta.stageLabel}`
            : seriesMeta.stageLabel}
        </p>
        <p className="text-sm font-medium text-foreground">{paper.title}</p>
      </div>
      <ArrowRight className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
    </>
  )

  const className =
    "flex items-start justify-between gap-3 rounded-2xl border border-border/80 bg-background px-3 py-3 text-left transition-colors hover:bg-muted/20"

  if (onSelectPaper) {
    return (
      <button
        className={className}
        onClick={() => onSelectPaper(paper.slug)}
        type="button"
      >
        {content}
      </button>
    )
  }

  return (
    <Link className={className} href={getPublicPaperHref(paper.slug)}>
      {content}
    </Link>
  )
}

function OpenPaperButton({
  children,
  onSelectPaper,
  paper,
  size,
  variant,
}: {
  children: React.ReactNode
  onSelectPaper?: (slug: string) => void
  paper: PublicPaperRecord
  size: "sm"
  variant?: "default" | "outline"
}) {
  if (onSelectPaper) {
    return (
      <Button
        onClick={() => onSelectPaper(paper.slug)}
        size={size}
        type="button"
        variant={variant}
      >
        {children}
      </Button>
    )
  }

  return (
    <Button asChild size={size} variant={variant}>
      <Link href={getPublicPaperHref(paper.slug)}>{children}</Link>
    </Button>
  )
}

function HeroStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.45rem] border border-border/80 bg-background/76 px-4 py-4 backdrop-blur-sm">
      <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-sm/7 text-foreground">{value}</p>
    </div>
  )
}

function RailChip({ children }: { children: string }) {
  return (
    <span className="rounded-full border border-border/80 px-2.5 py-1 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
      {children}
    </span>
  )
}
