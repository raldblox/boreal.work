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
    <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-6 text-center">
      <div className="space-y-3">
        <p className="font-mono text-[11px] tracking-[0.18em] text-muted-foreground uppercase">
          One request. No tool switching.
        </p>
        <h1 className="text-balance text-4xl font-medium tracking-tight sm:text-5xl">
          Submit one request. Boreal finds the best way to fulfill it.
        </h1>
        <p className="mx-auto max-w-2xl text-sm/7 text-muted-foreground sm:text-base/7">
          It checks executable supply first, routes to the right provider,
          product, agent, or human team, and keeps delivery, payment, and proof
          in one thread.
        </p>
      </div>

      <div className="w-full text-left">{composer}</div>
      <div className="flex w-full flex-wrap items-center justify-center gap-2">
        {quickActions}
      </div>

      {starterPrompts.length > 0 ? (
        <div className="grid w-full gap-3 text-left md:grid-cols-2">
          {starterPrompts.map((prompt) => (
            <button
              className="group rounded-2xl border border-border bg-card px-4 py-4 transition-colors hover:bg-accent/40"
              key={prompt.title}
              onClick={prompt.onSelect}
              type="button"
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-full border border-border p-2 text-muted-foreground transition-colors group-hover:text-foreground">
                  {prompt.icon}
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">
                    {prompt.title}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {prompt.description}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
