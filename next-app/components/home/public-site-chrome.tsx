"use client"

import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Logo } from "@/components/ui/logo"
import { cn } from "@/lib/utils"

import { publicSiteLinks } from "./public-site-nav-data"

export function PublicPageHeader({
  activeHref,
  eyebrow,
}: {
  activeHref?: string
  eyebrow: string
}) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
      <Link className="flex items-center gap-3" href="/">
        <span className="flex size-10 shrink-0 items-center justify-center border border-border bg-muted/30">
          <Logo size={18} />
        </span>
        <div>
          <p className="font-heading text-xl font-semibold tracking-tight">
            Boreal
          </p>
          <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
            {eyebrow}
          </p>
        </div>
      </Link>

      <div className="flex flex-wrap items-center gap-2 text-sm">
        {publicSiteLinks.map((link) => (
          <Link
            className={cn(
              "border border-border px-3 py-2 transition-colors hover:bg-muted/40",
              activeHref === link.href ? "bg-muted/45 text-foreground" : ""
            )}
            href={link.href}
            key={link.href}
          >
            {link.label}
          </Link>
        ))}
        <Button asChild className="rounded-none" size="sm">
          <Link href="/">Open chat</Link>
        </Button>
      </div>
    </header>
  )
}

export function PublicPageFooter() {
  return (
    <footer className="border-t border-border pt-4">
      <div className="flex flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>One request in.  Best fulfillment path out.</p>
        <div className="flex flex-wrap gap-4">
          {publicSiteLinks.map((link) => (
            <Link className="hover:text-foreground" href={link.href} key={link.href}>
              {link.label}
            </Link>
          ))}
          <Link className="hover:text-foreground" href="/">
            Open chat
          </Link>
        </div>
      </div>
    </footer>
  )
}
