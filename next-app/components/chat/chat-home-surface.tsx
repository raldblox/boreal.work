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
          Boreal chat.
        </p>
        <h1 className="text-balance text-4xl font-medium tracking-tight sm:text-5xl">
          Say what you need. Boreal gets it moving.
        </h1>
        <p className="mx-auto max-w-2xl text-sm/7 text-muted-foreground sm:text-base/7">
          Start with one prompt. Boreal helps you find the right next step and
          keeps the work in one thread.
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
