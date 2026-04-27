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
    <main id="main-content" className="min-h-screen bg-background text-foreground">
      <div
        className={cn(
          "flex min-h-screen w-full flex-col px-4 py-5 sm:px-6 sm:py-6 lg:px-10 xl:px-12",
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
        "grid gap-10 py-8 lg:grid-cols-[minmax(17rem,22rem)_minmax(0,1fr)] lg:gap-14 lg:py-10 xl:gap-16",
        className
      )}
    >
      <aside
        className={cn("space-y-8 lg:sticky lg:top-24 lg:self-start", railClassName)}
      >
        {rail}
      </aside>
      <div
        className={cn(
          "min-w-0 border-t border-border/80 pt-8 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-10 xl:pl-14",
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
      <h2 className="font-editorial text-3xl leading-[1.02] font-semibold tracking-[-0.035em] text-balance text-foreground sm:text-4xl">
        {title}
      </h2>
      {description ? (
        <p className="max-w-2xl text-base/8 text-muted-foreground">{description}</p>
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
    <div className="border-y border-border/80">
      {title ? (
        <p className="border-b border-border/80 py-3 text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
          {title}
        </p>
      ) : null}
      <dl className="divide-y divide-border/70">
        {items.map((item) => (
          <div
            className="grid gap-1 py-4 sm:grid-cols-[minmax(0,6.5rem)_1fr] sm:gap-4"
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
