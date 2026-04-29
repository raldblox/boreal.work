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
        <p className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 font-mono text-[11px] tracking-[0.18em] text-primary uppercase">
          Open early access
        </p>
        <h1 className="text-balance text-4xl font-medium tracking-tight sm:text-5xl">
          Say what you need. Boreal gets it moving.
        </h1>
        <p className="mx-auto max-w-2xl text-sm/7 text-muted-foreground sm:text-base/7">
          Boreal turns one request into the best path to fulfillment. It can
          answer directly, route to the right offer, or open the hard problems
          that need swarms of agents and humans in one work thread.
        </p>
      </div>

      <div className="w-full text-left">{composer}</div>
      <div className="flex w-full flex-wrap items-center justify-start gap-2 text-left">
        {quickActions}
      </div>

      {starterPrompts.length > 0 ? (
        <div className="w-full overflow-hidden border border-border/50 bg-card/20 sm:w-[calc(100%-2.75rem)]">
          {starterPrompts.map((prompt, index) => (
            <button
              className={[
                "group flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-accent/20",
                index > 0 ? "border-t border-border/60" : "",
              ].join(" ")}
              key={prompt.title}
              onClick={prompt.onSelect}
              title={prompt.description}
              type="button"
            >
              <div className="shrink-0 text-muted-foreground transition-colors group-hover:text-foreground">
                {prompt.icon}
              </div>
              <p className="min-w-0 flex-1 truncate text-sm text-foreground">
                {prompt.title}
              </p>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
