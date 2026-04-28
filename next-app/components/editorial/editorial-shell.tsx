import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

export type EditorialMetaItem = {
  label: string
  value: ReactNode
}

export function EditorialShell({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <main
      id="main-content"
      className="relative min-h-screen overflow-x-hidden bg-[linear-gradient(180deg,rgba(247,250,252,0.98)_0%,rgba(245,248,250,0.92)_42%,rgba(249,250,251,0.98)_100%)] text-foreground"
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute inset-x-0 top-0 h-[24rem] bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.12),transparent_52%),radial-gradient(circle_at_top_right,rgba(45,212,191,0.12),transparent_42%)]" />
        <div className="absolute inset-y-0 left-1/2 hidden w-px -translate-x-[28rem] bg-gradient-to-b from-transparent via-border/40 to-transparent lg:block" />
      </div>
      <div
        className={cn(
          "relative mx-auto flex min-h-screen w-full max-w-[1560px] flex-col px-4 py-5 sm:px-6 sm:py-6 lg:px-10 xl:px-12",
          className
        )}
      >
        {children}
      </div>
    </main>
  )
}

export function EditorialSplitLayout({
  children,
  className,
  contentClassName,
  rail,
  railClassName,
}: {
  children: ReactNode
  className?: string
  contentClassName?: string
  rail: ReactNode
  railClassName?: string
}) {
  return (
    <section
      className={cn(
        "grid gap-10 py-8 lg:grid-cols-[minmax(18rem,22rem)_minmax(0,1fr)] lg:items-start lg:gap-16 lg:py-12 xl:grid-cols-[minmax(19rem,23rem)_minmax(0,1fr)] xl:gap-20",
        className
      )}
    >
      <aside
        className={cn(
          "space-y-8 lg:sticky lg:top-24 lg:self-start",
          railClassName
        )}
      >
        {rail}
      </aside>
      <div
        className={cn(
          "min-w-0 border-t border-border/70 pt-8 lg:border-t-0 lg:border-l lg:border-border/65 lg:pt-0 lg:pl-12 xl:pl-16",
          contentClassName
        )}
      >
        {children}
      </div>
    </section>
  )
}

export function EditorialSectionHeader({
  description,
  eyebrow,
  title,
}: {
  description?: string
  eyebrow: string
  title: string
}) {
  return (
    <div className="max-w-3xl space-y-3">
      <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
        {eyebrow}
      </p>
      <h2 className="text-balance font-editorial text-3xl leading-[1.02] font-semibold tracking-[-0.035em] text-foreground sm:text-4xl">
        {title}
      </h2>
      {description ? (
        <p className="max-w-2xl text-base/8 text-muted-foreground">
          {description}
        </p>
      ) : null}
    </div>
  )
}

export function EditorialMetaList({
  items,
  title,
}: {
  items: EditorialMetaItem[]
  title?: string
}) {
  if (items.length === 0) {
    return null
  }

  return (
    <div className="overflow-hidden rounded-[1.55rem] border border-border/80 bg-background/92 shadow-[0_26px_80px_-56px_rgba(15,23,42,0.3)] backdrop-blur-sm">
      {title ? (
        <p className="border-b border-border/80 px-5 py-4 text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
          {title}
        </p>
      ) : null}
      <dl className="divide-y divide-border/70 px-5">
        {items.map((item) => (
          <div
            className="grid gap-1 py-4 sm:grid-cols-[minmax(0,7rem)_1fr] sm:gap-4"
            key={item.label}
          >
            <dt className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              {item.label}
            </dt>
            <dd className="text-sm/7 text-foreground/88">{item.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
