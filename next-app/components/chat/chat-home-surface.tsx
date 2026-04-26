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
          Request-native agentic commerce.
        </p>
        <h1 className="text-balance text-4xl font-medium tracking-tight sm:text-5xl">
          Submit one request. Boreal finds the best path to fulfillment.
        </h1>
        <p className="mx-auto max-w-2xl text-sm/7 text-muted-foreground sm:text-base/7">
          From offers and providers to agents and freelancers, Boreal keeps the
          work live until the job is done.
        </p>
      </div>

      <div className="w-full text-left">{composer}</div>
      <div className="flex w-full flex-wrap items-center justify-start gap-2 text-left">
        {quickActions}
      </div>

      {starterPrompts.length > 0 ? (
        <div className="grid w-full gap-3 md:grid-cols-2">
          {starterPrompts.map((prompt) => (
            <button
              className="group rounded-2xl border border-border bg-card px-4 py-4 text-left transition-colors hover:bg-accent/40"
              key={prompt.title}
              onClick={prompt.onSelect}
              type="button"
            >
              <div className="flex items-start justify-start gap-3 text-left">
                <div className="mt-0.5 rounded-full border border-border p-2 text-muted-foreground transition-colors group-hover:text-foreground">
                  {prompt.icon}
                </div>
                <div className="space-y-1 text-left">
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
