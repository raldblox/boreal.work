"use client"

import type { ReactNode } from "react"

type HomeStarterPrompt = {
  description: string
  icon: ReactNode
  onSelect: () => void
  title: string
}

type HomeChatSurfaceProps = {
  composer: ReactNode
  quickActions: ReactNode
  starterPrompts: HomeStarterPrompt[]
}

export function HomeChatSurface({
  composer,
  quickActions,
  starterPrompts,
}: HomeChatSurfaceProps) {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-6">
      <div className="space-y-3 text-center">
        <p className="font-mono text-[11px] tracking-[0.18em] text-muted-foreground uppercase">
          Open early access.
        </p>
        <h1 className="text-balance text-4xl font-medium tracking-tight sm:text-5xl">
          Submit one request. Boreal finds the best path to fulfillment.
        </h1>
        <p className="mx-auto max-w-2xl text-sm/7 text-muted-foreground sm:text-base/7">
          Browse, post requests, and publish offers now. From providers and
          products to agents and freelancers, Boreal keeps the work attached to
          one thread, and paid execution starts only after the supported
          funding boundary is met.
        </p>
      </div>

      <div className="w-full text-left">{composer}</div>
      <div className="flex w-full flex-wrap items-center justify-start gap-2 text-left">
        {quickActions}
      </div>

      {starterPrompts.length > 0 ? (
        <div className="w-full overflow-hidden border border-border/70 bg-card/40">
          {starterPrompts.map((prompt, index) => (
            <button
              className={[
                "group flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-accent/20",
                index > 0 ? "border-t border-border/60" : "",
              ].join(" ")}
              key={prompt.title}
              onClick={prompt.onSelect}
              type="button"
            >
              <div className="mt-0.5 text-muted-foreground transition-colors group-hover:text-foreground">
                {prompt.icon}
              </div>
              <div className="min-w-0 flex-1 space-y-1">
                <p className="text-sm font-medium text-foreground">
                  {prompt.title}
                </p>
                <p className="text-xs text-muted-foreground sm:text-sm">
                  {prompt.description}
                </p>
              </div>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
