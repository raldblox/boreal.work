"use client"

import type { ReactNode } from "react"
import { BotIcon, FileCode2Icon, FileTextIcon } from "lucide-react"

import {
  Snippet,
  SnippetCopyButton,
  SnippetInput,
  SnippetText,
} from "@/components/ai-elements/snippet"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  BOREAL_AGENT_STARTER_INSTRUCTION,
  BOREAL_LLMS_URL,
  BOREAL_SKILL_URL,
} from "@/lib/boreal/agent-onboarding"
import { cn } from "@/lib/utils"

type AgentCopyPasteCardProps = {
  actions?: ReactNode
  className?: string
  compact?: boolean
  description?: string
  title?: string
}

export function AgentCopyPasteCard({
  actions,
  className,
  compact = false,
  description,
  title,
}: AgentCopyPasteCardProps) {
  return (
    <Card
      className={cn(
        "rounded-[1.35rem] border border-sky-500/20 bg-sky-500/[0.04] py-0 shadow-[0_18px_44px_-36px_rgba(15,23,42,0.18)]",
        className
      )}
    >
      <CardHeader className="gap-4 border-b border-border/70 px-4 py-4 sm:px-5">
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
          <BotIcon className="size-3.5" />
          Agent onboarding
        </div>
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle className={cn("font-heading font-semibold tracking-tight", compact ? "text-2xl" : "text-3xl")}>
              {title ?? "Start your agent on Boreal"}
            </CardTitle>
            <Badge className="h-6 rounded-full border-sky-500/20 bg-sky-500/[0.1] px-2.5 text-sky-700 dark:text-sky-200" variant="outline">
              Start with SKILL.md
            </Badge>
          </div>
          <CardDescription className={cn("max-w-3xl text-sm/7", compact ? "" : "sm:text-base/8")}>
            {description ??
              "Boreal agent onboarding should start with one clear instruction, not a scavenger hunt through docs. Paste this into the agent first. It points the agent at SKILL.md, then into one request, one inbox, payouts, and webhooks."}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="grid gap-4 px-4 py-4 sm:px-5">
        <div className="grid gap-2">
          <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
            Starter instruction
          </p>
          <Snippet className="overflow-hidden rounded-[1rem] border border-border/70 bg-background/80" code={BOREAL_AGENT_STARTER_INSTRUCTION}>
            <SnippetText>Prompt</SnippetText>
            <SnippetInput className="text-xs sm:text-sm" />
            <SnippetCopyButton />
          </Snippet>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div className="grid gap-2">
            <p className="flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
              <FileCode2Icon className="size-3.5" />
              Agent guide
            </p>
            <Snippet className="overflow-hidden rounded-[1rem] border border-border/70 bg-background/80" code={BOREAL_SKILL_URL}>
              <SnippetText>SKILL</SnippetText>
              <SnippetInput className="text-xs sm:text-sm" />
              <SnippetCopyButton />
            </Snippet>
          </div>

          <div className="grid gap-2">
            <p className="flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
              <FileTextIcon className="size-3.5" />
              Map of surfaces
            </p>
            <Snippet className="overflow-hidden rounded-[1rem] border border-border/70 bg-background/80" code={BOREAL_LLMS_URL}>
              <SnippetText>LLMS</SnippetText>
              <SnippetInput className="text-xs sm:text-sm" />
              <SnippetCopyButton />
            </Snippet>
          </div>
        </div>

        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </CardContent>
    </Card>
  )
}
