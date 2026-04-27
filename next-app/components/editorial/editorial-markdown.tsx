"use client"

import { cjk } from "@streamdown/cjk"
import { code } from "@streamdown/code"
import { math } from "@streamdown/math"
import { mermaid } from "@streamdown/mermaid"
import { Streamdown } from "streamdown"

import { cn } from "@/lib/utils"

const plugins = { cjk, code, math, mermaid }

export function EditorialMarkdown({
  children,
  className,
}: {
  children: string
  className?: string
}) {
  return (
    <Streamdown
      className={cn(
        "text-[15px] text-foreground/94 sm:text-[17px]",
        "[&_a]:font-medium [&_a]:text-foreground [&_a]:underline [&_a]:decoration-border [&_a]:underline-offset-4",
        "[&_blockquote]:my-8 [&_blockquote]:border-l-[1.5px] [&_blockquote]:border-border [&_blockquote]:pl-5 [&_blockquote]:text-muted-foreground",
        "[&_code]:rounded-sm [&_code]:bg-muted/75 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-[0.92em]",
        "[&_em]:text-foreground/72",
        "[&_h1]:mt-0 [&_h1]:max-w-4xl [&_h1]:font-editorial [&_h1]:text-4xl [&_h1]:leading-[1.02] [&_h1]:font-semibold [&_h1]:tracking-[-0.035em] sm:[&_h1]:text-5xl",
        "[&_h2]:mt-16 [&_h2]:border-t [&_h2]:border-border/70 [&_h2]:pt-6 [&_h2]:max-w-4xl [&_h2]:font-editorial [&_h2]:text-3xl [&_h2]:leading-[1.08] [&_h2]:font-semibold [&_h2]:tracking-[-0.03em] sm:[&_h2]:text-[2.2rem]",
        "[&_h3]:mt-12 [&_h3]:max-w-4xl [&_h3]:font-heading [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:tracking-tight sm:[&_h3]:text-xl",
        "[&_hr]:my-10 [&_hr]:border-border/70",
        "[&_li]:leading-8 [&_li]:text-foreground/92 [&_li]:marker:text-muted-foreground",
        "[&_ol]:my-5 [&_ol]:max-w-[42rem] [&_ol]:list-decimal [&_ol]:space-y-2 [&_ol]:pl-6",
        "[&_p]:my-5 [&_p]:max-w-[42rem] [&_p]:text-[1.03rem]/8 [&_p]:text-foreground/92",
        "[&_pre]:my-6 [&_pre]:overflow-x-auto [&_pre]:border [&_pre]:border-border/80 [&_pre]:bg-muted/25 [&_pre]:p-4",
        "[&_pre_code]:bg-transparent [&_pre_code]:p-0",
        "[&_strong]:font-semibold [&_strong]:text-foreground",
        "[&_table]:my-8 [&_table]:w-full [&_table]:border-collapse [&_table]:text-left [&_table]:text-sm",
        "[&_tbody_tr]:border-t [&_tbody_tr]:border-border/70",
        "[&_td]:px-3 [&_td]:py-3 [&_td]:align-top",
        "[&_th]:border-b [&_th]:border-border/80 [&_th]:px-3 [&_th]:py-3 [&_th]:text-[11px] [&_th]:font-semibold [&_th]:uppercase [&_th]:tracking-[0.18em] [&_th]:text-muted-foreground",
        "[&_ul]:my-5 [&_ul]:max-w-[42rem] [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-6",
        className
      )}
      plugins={plugins}
    >
      {children}
    </Streamdown>
  )
}
