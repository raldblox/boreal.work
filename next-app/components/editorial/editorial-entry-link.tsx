import Link from "next/link"
import { ArrowUpRight } from "@/components/ui/static-icons"

import { cn } from "@/lib/utils"

const toneClasses = {
  amber: "bg-amber-500/75",
  emerald: "bg-emerald-500/75",
  neutral: "bg-foreground/24",
  sky: "bg-sky-500/75",
} as const

const toneSurfaceClasses = {
  amber: "from-amber-500/10 via-transparent to-transparent",
  emerald: "from-emerald-500/12 via-transparent to-transparent",
  neutral: "from-foreground/8 via-transparent to-transparent",
  sky: "from-sky-500/12 via-transparent to-transparent",
} as const

export function EditorialEntryLink({
  className,
  compact = false,
  excerpt,
  featured = false,
  href,
  lede,
  meta = [],
  onClick,
  title,
  tone = "neutral",
}: {
  className?: string
  compact?: boolean
  excerpt?: string
  featured?: boolean
  href: string
  lede?: string
  meta?: string[]
  onClick?: () => void
  title: string
  tone?: keyof typeof toneClasses
}) {
  const content = (
    <div
      className={cn(
        "group relative block overflow-hidden rounded-[1.8rem] border border-border/80 bg-background/94 p-5 text-left shadow-[0_24px_80px_-56px_rgba(15,23,42,0.32)] transition duration-200 hover:-translate-y-0.5 hover:border-foreground/12 hover:shadow-[0_28px_80px_-48px_rgba(15,23,42,0.38)] sm:p-6",
        compact && "rounded-[1.55rem] p-4 sm:p-5",
        featured && "rounded-[2rem] p-6 sm:p-7",
        className
      )}
    >
      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-br opacity-100",
          toneSurfaceClasses[tone]
        )}
      />
      <div className="relative flex items-start justify-between gap-4">
        {meta.length > 0 ? (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
            <span className={cn("size-1.5 rounded-full", toneClasses[tone])} />
            {meta.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
        ) : (
          <span className={cn("size-1.5 rounded-full", toneClasses[tone])} />
        )}
        <ReadPaperHint compact={compact} />
      </div>

      <div
        className={cn(
          "relative mt-5 grid gap-5 sm:gap-6",
          compact
            ? "lg:grid-cols-[minmax(0,1fr)_minmax(14rem,0.42fr)]"
            : "lg:grid-cols-[minmax(0,0.98fr)_minmax(15rem,0.48fr)] lg:gap-10"
        )}
      >
        <div className="space-y-4">
          <h3
            className={cn(
              "max-w-4xl text-balance font-editorial text-3xl leading-[1.02] font-semibold tracking-[-0.035em] text-foreground transition-colors group-hover:text-foreground/82 sm:text-4xl",
              compact && "text-2xl sm:text-3xl",
              featured && "sm:text-5xl"
            )}
          >
            {title}
          </h3>
          {lede ? (
            <p
              className={cn(
                "max-w-3xl text-base/8 text-foreground/74",
                compact && "text-sm/7 text-muted-foreground"
              )}
            >
              {lede}
            </p>
          ) : null}
        </div>

        <div className="flex items-start justify-between gap-4 lg:pt-1">
          {excerpt ? (
            <p
              className={cn(
                "max-w-md text-sm/7 text-muted-foreground",
                compact && "max-w-sm"
              )}
            >
              {excerpt}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">Read document</p>
          )}
        </div>
      </div>
    </div>
  )

  if (onClick) {
    return (
      <button onClick={onClick} type="button">
        {content}
      </button>
    )
  }

  return <Link href={href}>{content}</Link>
}

function ReadPaperHint({ compact }: { compact: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-border/80 bg-background/86 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-muted-foreground",
        compact && "px-2.5 py-0.5 text-[9px]"
      )}
    >
      Read
      <ArrowUpRight className="size-3 shrink-0 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
    </span>
  )
}
