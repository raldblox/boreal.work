import Link from "next/link"
import { ArrowUpRight } from "lucide-react"

import { cn } from "@/lib/utils"

const toneClasses = {
  amber: "bg-amber-500/70",
  emerald: "bg-emerald-500/70",
  neutral: "bg-foreground/24",
  sky: "bg-sky-500/70",
} as const

export function EditorialEntryLink({
  className,
  compact = false,
  excerpt,
  featured = false,
  href,
  lede,
  meta = [],
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
  title: string
  tone?: keyof typeof toneClasses
}) {
  return (
    <Link
      className={cn(
        "group block border-t border-border/80 py-8 transition-colors duration-200 hover:bg-muted/18 sm:py-10",
        compact && "py-6 sm:py-7",
        featured && "py-10 sm:py-12",
        className
      )}
      href={href}
    >
      <div
        className={cn(
          "grid gap-5 sm:gap-6",
          compact
            ? "lg:grid-cols-[minmax(0,1fr)_auto]"
            : "lg:grid-cols-[minmax(0,0.95fr)_minmax(14rem,0.48fr)] lg:gap-10"
        )}
      >
        <div className="space-y-4">
          {meta.length > 0 ? (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
              <span className={cn("size-1.5 rounded-full", toneClasses[tone])} />
              {meta.map((item) => (
                <span key={item}>{item}</span>
              ))}
            </div>
          ) : null}
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
          <ArrowUpRight className="mt-1 size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </div>
      </div>
    </Link>
  )
}
