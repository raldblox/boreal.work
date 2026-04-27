"use client"

import { cjk } from "@streamdown/cjk"
import { code } from "@streamdown/code"
import { math } from "@streamdown/math"
import { mermaid } from "@streamdown/mermaid"
import { Streamdown } from "streamdown"

const plugins = { cjk, code, math, mermaid }

export function ArticleMarkdown({ children }: { children: string }) {
  return (
    <Streamdown
      className="text-[15px] text-foreground [&_a]:font-medium [&_a]:text-foreground [&_a]:underline [&_a]:decoration-border [&_a]:underline-offset-4 [&_blockquote]:border-l-2 [&_blockquote]:border-border [&_blockquote]:pl-4 [&_blockquote]:text-muted-foreground [&_code]:rounded-sm [&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-[0.92em] [&_em]:text-muted-foreground [&_h1]:mt-0 [&_h1]:font-heading [&_h1]:text-4xl [&_h1]:font-semibold [&_h1]:tracking-tight sm:[&_h1]:text-5xl [&_h2]:mt-10 [&_h2]:font-heading [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:tracking-tight sm:[&_h2]:text-3xl [&_h3]:mt-8 [&_h3]:font-heading [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:tracking-tight [&_hr]:my-8 [&_hr]:border-border [&_li]:leading-8 [&_ol]:mt-4 [&_ol]:list-decimal [&_ol]:space-y-2 [&_ol]:pl-6 [&_p]:my-4 [&_p]:text-base/8 [&_p]:text-foreground/92 [&_pre]:mt-4 [&_pre]:overflow-x-auto [&_pre]:border [&_pre]:border-border [&_pre]:bg-muted/30 [&_pre]:p-4 [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_strong]:font-semibold [&_ul]:mt-4 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-6"
      plugins={plugins}
    >
      {children}
    </Streamdown>
  )
}
