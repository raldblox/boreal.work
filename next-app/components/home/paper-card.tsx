import Link from "next/link"
import type { SVGProps } from "react"

import type { PublicPaperRecord } from "@/lib/boreal/papers-data"
import { getPublicPaperHref } from "@/lib/boreal/papers-data"
import { cn } from "@/lib/utils"

const cardStylesByKind = {
  deep_dive: "border-sky-500/25 bg-sky-500/[0.06] hover:bg-sky-500/[0.11]",
  flagship: "border-emerald-500/25 bg-emerald-500/[0.08] hover:bg-emerald-500/[0.12]",
  technical: "border-amber-500/25 bg-amber-500/[0.07] hover:bg-amber-500/[0.11]",
} as const

const labelByKind = {
  deep_dive: "Deep dive",
  flagship: "Flagship paper",
  technical: "Technical note",
} as const

export function PaperCard({
  compact = false,
  onOpen,
  paper,
}: {
  compact?: boolean
  onOpen?: (() => void) | null
  paper: PublicPaperRecord
}) {
  const content = (
    <div className="flex items-start justify-between gap-4">
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
          <span>{labelByKind[paper.kind]}</span>
          <span className="hidden sm:inline">/</span>
          <span>{paper.readingTime}</span>
        </div>
        <div className="space-y-2">
          <h3
            className={cn(
              "font-heading font-semibold tracking-tight",
              compact ? "text-xl" : "text-2xl"
            )}
          >
            {paper.title}
          </h3>
          <p className="text-sm/7 text-muted-foreground">{paper.deck}</p>
        </div>
        <p className="text-sm/7 text-foreground/88">{paper.summary}</p>
      </div>
      <ArrowRightGlyph className="mt-1 size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
    </div>
  )

  if (onOpen) {
    return (
      <button
        className={cn(
          "group block w-full border p-4 text-left transition-colors sm:p-5",
          cardStylesByKind[paper.kind]
        )}
        onClick={onOpen}
        type="button"
      >
        {content}
      </button>
    )
  }

  return (
    <Link
      className={cn(
        "group block border p-4 transition-colors sm:p-5",
        cardStylesByKind[paper.kind]
      )}
      href={getPublicPaperHref(paper.slug)}
    >
      {content}
    </Link>
  )
}

function ArrowRightGlyph(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
      {...props}
    >
      <path d="M5 12h14" />
      <path d="m13 5 7 7-7 7" />
    </svg>
  )
}
