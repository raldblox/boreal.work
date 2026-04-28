import { Logo } from "@/components/ui/logo"
import { cn } from "@/lib/utils"

type AppShellSkeletonProps = {
  detail?: string
  statusLabel?: string
}

function SkeletonLine({
  className,
}: {
  className?: string
}) {
  return (
    <div
      className={cn(
        "h-3 rounded-full bg-muted/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.22)]",
        className
      )}
    />
  )
}

export function AppShellSkeleton({
  detail,
  statusLabel = "Loading Boreal",
}: AppShellSkeletonProps) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex min-h-screen">
        <aside className="hidden w-[clamp(15.5rem,18vw,18rem)] shrink-0 border-r border-border/80 bg-card/55 lg:flex">
          <div className="flex h-full w-full flex-col gap-6 px-4 py-5">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-2xl border border-border/80 bg-background shadow-[0_18px_45px_-28px_rgba(15,23,42,0.45)]">
                <Logo className="size-5" />
              </div>
              <div className="space-y-2">
                <SkeletonLine className="w-20" />
                <SkeletonLine className="w-28" />
              </div>
            </div>
            <div className="space-y-3">
              {Array.from({ length: 7 }).map((_, index) => (
                <div
                  className="rounded-[1.4rem] border border-border/75 bg-background/80 px-4 py-3"
                  key={index}
                >
                  <SkeletonLine className="w-24" />
                  <SkeletonLine className="mt-3 w-full" />
                  <SkeletonLine className="mt-2 w-2/3" />
                </div>
              ))}
            </div>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="border-b border-border/80 bg-background/92 backdrop-blur">
            <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-2xl border border-border/80 bg-card/80 lg:hidden">
                  <Logo className="size-5" />
                </div>
                <div className="hidden items-center gap-2 lg:flex">
                  <SkeletonLine className="h-8 w-18 rounded-xl" />
                  <SkeletonLine className="h-8 w-20 rounded-xl" />
                  <SkeletonLine className="h-8 w-16 rounded-xl" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <SkeletonLine className="h-9 w-24 rounded-xl" />
                <SkeletonLine className="hidden h-9 w-28 rounded-xl lg:block" />
              </div>
            </div>
          </header>

          <main className="flex-1">
            <div className="mx-auto flex min-h-full w-full max-w-4xl flex-col gap-6 px-4 py-6">
              <section className="overflow-hidden rounded-[2rem] border border-border/80 bg-card/90 shadow-[0_32px_90px_-52px_rgba(15,23,42,0.45)]">
                <div className="border-b border-border/75 bg-linear-to-r from-accent/55 via-background to-card px-5 py-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="rounded-full border border-primary/15 bg-primary/8 px-3 py-1 text-[11px] font-medium tracking-[0.24em] text-primary uppercase">
                      {statusLabel}
                    </span>
                    {detail ? (
                      <p className="text-sm text-muted-foreground">{detail}</p>
                    ) : null}
                  </div>
                </div>
                <div className="space-y-5 px-5 py-5">
                  <div className="max-w-xl rounded-[1.6rem] border border-border/80 bg-background/90 px-4 py-4">
                    <SkeletonLine className="w-24" />
                    <SkeletonLine className="mt-4 w-full" />
                    <SkeletonLine className="mt-2 w-10/12" />
                    <SkeletonLine className="mt-2 w-2/3" />
                  </div>
                  <div className="ml-auto max-w-lg rounded-[1.6rem] border border-primary/15 bg-primary/8 px-4 py-4">
                    <SkeletonLine className="w-20 bg-primary/15" />
                    <SkeletonLine className="mt-4 w-full bg-primary/15" />
                    <SkeletonLine className="mt-2 w-4/5 bg-primary/15" />
                  </div>
                  <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(18rem,0.9fr)]">
                    <div className="rounded-[1.7rem] border border-border/80 bg-background/90 px-4 py-4">
                      <SkeletonLine className="w-28" />
                      <SkeletonLine className="mt-4 w-full" />
                      <SkeletonLine className="mt-2 w-full" />
                      <SkeletonLine className="mt-2 w-3/4" />
                      <div className="mt-5 flex gap-2">
                        <SkeletonLine className="h-9 w-28 rounded-xl" />
                        <SkeletonLine className="h-9 w-24 rounded-xl" />
                      </div>
                    </div>
                    <div className="rounded-[1.7rem] border border-border/80 bg-card/75 px-4 py-4">
                      <SkeletonLine className="w-20" />
                      <SkeletonLine className="mt-4 w-full" />
                      <SkeletonLine className="mt-2 w-5/6" />
                      <SkeletonLine className="mt-2 w-2/3" />
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </main>

          <div className="border-t border-border/80 bg-background/94">
            <div className="mx-auto w-full max-w-4xl px-4 py-4">
              <div className="rounded-[1.8rem] border border-border/80 bg-card/90 p-4 shadow-[0_28px_70px_-44px_rgba(15,23,42,0.35)]">
                <SkeletonLine className="h-4 w-32" />
                <SkeletonLine className="mt-4 h-12 w-full rounded-2xl" />
                <div className="mt-4 flex items-center justify-between gap-3">
                  <div className="flex gap-2">
                    <SkeletonLine className="h-9 w-24 rounded-xl" />
                    <SkeletonLine className="h-9 w-24 rounded-xl" />
                  </div>
                  <SkeletonLine className="h-10 w-28 rounded-xl" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <aside className="hidden w-[clamp(21rem,24vw,25rem)] shrink-0 border-l border-border/80 bg-card/55 xl:flex">
          <div className="flex h-full w-full flex-col gap-4 px-4 py-5">
            {Array.from({ length: 5 }).map((_, index) => (
              <div
                className="rounded-[1.6rem] border border-border/80 bg-background/90 px-4 py-4"
                key={index}
              >
                <SkeletonLine className="w-28" />
                <SkeletonLine className="mt-4 w-full" />
                <SkeletonLine className="mt-2 w-11/12" />
                <SkeletonLine className="mt-2 w-3/4" />
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  )
}
