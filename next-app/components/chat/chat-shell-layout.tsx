"use client"

import type { CSSProperties, ReactNode } from "react"
import Link from "next/link"
import {
  ArrowLeftIcon,
  CircleUserRoundIcon,
  HistoryIcon,
  MessagesSquareIcon,
  PackageIcon,
  PanelLeftOpenIcon,
  PanelRightCloseIcon,
  SearchIcon,
} from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/ui/logo"
import { Spinner as LoaderIcon } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"
import { publicSiteLinks } from "@/components/home/public-site-nav-data"

export function DesktopIntentRail({
  collapsedContent,
  collapsedWidth,
  containerStyle,
  expandedContent,
  expandedWidth,
  showExpanded,
}: {
  collapsedContent: ReactNode
  collapsedWidth: string
  containerStyle: CSSProperties
  expandedContent: ReactNode
  expandedWidth: string
  showExpanded: boolean
}) {
  return (
    <div
      className="relative hidden min-h-0 shrink-0 overflow-hidden transition-[width,min-width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] lg:block"
      style={containerStyle}
    >
      <div
        aria-hidden={!showExpanded}
        className={cn(
          "absolute inset-y-0 left-0 transition-opacity duration-200 ease-out",
          showExpanded ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        inert={!showExpanded}
        style={{ width: expandedWidth }}
      >
        {expandedContent}
      </div>
      <div
        aria-hidden={showExpanded}
        className={cn(
          "absolute inset-y-0 left-0 transition-opacity duration-200 ease-out",
          showExpanded ? "pointer-events-none opacity-0" : "opacity-100"
        )}
        inert={showExpanded}
        style={{ width: collapsedWidth }}
      >
        {collapsedContent}
      </div>
    </div>
  )
}

export function DesktopDiscoveryRail({
  children,
  open,
  width,
}: {
  children: ReactNode
  open: boolean
  width: string
}) {
  return (
    <div
      aria-hidden={!open}
      className={cn(
        "hidden shrink-0 overflow-hidden transition-[width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] lg:block",
        open ? "pointer-events-auto" : "pointer-events-none"
      )}
      inert={!open}
      style={{
        width: open ? width : "0px",
        willChange: "width",
      }}
    >
      <div
        className={cn(
          "h-full origin-right transform-gpu border-l border-border bg-background transition-[transform,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
          open ? "translate-x-0 opacity-100" : "translate-x-6 opacity-0"
        )}
        style={{
          width,
          willChange: "transform,opacity",
        }}
      >
        {children}
      </div>
    </div>
  )
}

export function ChatShellHeader({
  activeNavHref,
  hideIntentMenu = false,
  hideWorkspaceToggle = false,
  inlineNavHrefs = [],
  isRequestSelected,
  isSubmitting,
  onOpenMobileDiscovery,
  onOpenMobileIntentSidebar,
  onSelectInlineNav,
  onReturnHome,
  onToggleWorkspace,
  requestTitle,
  showWorkspace,
}: {
  activeNavHref?: string | null
  hideIntentMenu?: boolean
  hideWorkspaceToggle?: boolean
  inlineNavHrefs?: readonly string[]
  isRequestSelected: boolean
  isSubmitting: boolean
  onOpenMobileDiscovery: () => void
  onOpenMobileIntentSidebar: () => void
  onSelectInlineNav?: (href: string) => void
  onReturnHome: () => void
  onToggleWorkspace: () => void
  requestTitle?: string | null
  showWorkspace: boolean
}) {
  const inlineLinks = publicSiteLinks.filter((link) =>
    inlineNavHrefs.includes(link.href)
  )

  return (
    <div className="flex h-16 items-center border-b border-border px-4">
      <div className="flex w-full items-center justify-between gap-4">
        <div className="min-w-0 flex flex-1 items-center gap-3 overflow-hidden">
          {isRequestSelected ? (
            <>
              <button
                className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground"
                onClick={onReturnHome}
                type="button"
              >
                <ArrowLeftIcon className="size-4" />
              </button>
              <div className="min-w-0 flex-1">
                <h1 className="truncate text-base font-medium">
                  {requestTitle ?? "Request"}
                </h1>
              </div>
            </>
          ) : (
            <div className="flex min-w-0 flex-1 items-center">
              <nav className="hidden min-w-0 flex-1 items-center gap-1 overflow-x-auto lg:flex">
                {publicSiteLinks.map((link) => (
                  inlineNavHrefs.includes(link.href) && onSelectInlineNav ? (
                    <button
                      aria-pressed={activeNavHref === link.href}
                      className={cn(
                        "shrink-0 rounded-md px-2.5 py-1.5 text-sm transition-colors",
                        activeNavHref === link.href
                          ? "bg-muted/45 text-foreground"
                          : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                      )}
                      key={link.href}
                      onClick={() => onSelectInlineNav(link.href)}
                      type="button"
                    >
                      {link.label}
                    </button>
                  ) : (
                    <Link
                      className="shrink-0 rounded-md px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground"
                      href={link.href}
                      key={link.href}
                    >
                      {link.label}
                    </Link>
                  )
                ))}
              </nav>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex min-w-0 items-center gap-2 lg:hidden">
            {!hideIntentMenu ? (
              <Button
                aria-label="Open requests menu"
                onClick={onOpenMobileIntentSidebar}
                size="sm"
                type="button"
                variant="outline"
              >
                <PanelLeftOpenIcon />
                Menu
              </Button>
            ) : null}
            <div className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto">
              {inlineLinks.map((link) => (
                <Button
                  aria-pressed={activeNavHref === link.href}
                  className={cn(
                    "shrink-0",
                    activeNavHref === link.href && "bg-muted text-foreground"
                  )}
                  key={link.href}
                  onClick={() => onSelectInlineNav?.(link.href)}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  {link.label}
                </Button>
              ))}
            </div>
            <Button
              aria-label="Open discovery drawer"
              onClick={onOpenMobileDiscovery}
              size="sm"
              type="button"
              variant="outline"
            >
              <SearchIcon />
              Discovery
            </Button>
          </div>
          <div className="hidden items-center gap-2 lg:flex">
            {!hideWorkspaceToggle ? (
              showWorkspace ? (
                <button
                  aria-label="Hide market"
                  className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground"
                  onClick={onToggleWorkspace}
                  type="button"
                >
                  <PanelRightCloseIcon className="size-4" />
                </button>
              ) : (
                <Button
                  aria-label="Open market"
                  onClick={onToggleWorkspace}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  <PackageIcon />
                  Market
                </Button>
              )
            ) : null}
          </div>
          {isSubmitting ? (
            <LoaderIcon className="size-4 animate-spin text-muted-foreground" />
          ) : null}
        </div>
      </div>
    </div>
  )
}

export function FooterComposerRegion({
  centerPanelClass,
  children,
  errorMessage,
  show,
}: {
  centerPanelClass: string
  children: ReactNode
  errorMessage: string | null
  show: boolean
}) {
  return (
    <>
      <div
        aria-hidden={!show}
        className={cn(
          "overflow-hidden transition-[max-height,opacity,transform] duration-200 ease-out",
          show
            ? "max-h-[40rem] opacity-100"
            : "pointer-events-none max-h-0 -translate-y-2 opacity-0"
        )}
        inert={!show}
      >
        <div className="py-4">{children}</div>
      </div>

      {errorMessage ? (
        <div className="pb-4">
          <div className={centerPanelClass}>
            <p className="text-xs text-destructive">{errorMessage}</p>
          </div>
        </div>
      ) : null}
    </>
  )
}

export function CollapsedRequestsRail({
  accountImageUrl,
  accountName,
  borealChatActive,
  borealChatSessionCount,
  isSessionsActive,
  onOpenBorealChat,
  onOpenAccount,
  onOpenProfile,
  onExpand,
  onOpenSessions,
  requestCount,
}: {
  accountImageUrl: string | null
  accountName: string | null
  borealChatActive: boolean
  borealChatSessionCount: number
  isSessionsActive: boolean
  onOpenBorealChat: () => void
  onOpenAccount: () => void
  onOpenProfile?: () => void
  onExpand: () => void
  onOpenSessions: () => void
  requestCount: number
}) {
  const requestBadge = requestCount > 99 ? "99+" : String(requestCount)
  const borealBadge =
    borealChatSessionCount > 99 ? "99+" : String(borealChatSessionCount)
  const avatarInitial = accountName?.trim().charAt(0).toUpperCase() ?? "U"

  return (
    <aside className="flex h-full w-full flex-col bg-foreground/[0.05] text-foreground">
      <div className="flex h-16 items-center justify-center border-b border-border px-4">
        <button
          aria-label="Expand requests sidebar"
          className="group relative flex size-10 shrink-0 items-center justify-center rounded-lg border border-border text-foreground transition-colors hover:bg-background/70"
          onClick={onExpand}
          type="button"
        >
          <span className="flex size-full items-center justify-center rounded-lg transition-opacity duration-150 group-hover:opacity-0">
            <Logo size={24} />
          </span>
          <span className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-150 group-hover:opacity-100">
            <PanelLeftOpenIcon className="size-4" />
          </span>
        </button>
      </div>

      <div className="flex flex-col items-center gap-2 px-4 py-4">
        <button
          aria-label="Open Boreal chat"
          className={cn(
            "relative flex size-10 shrink-0 items-center justify-center rounded-lg border border-border bg-background/70 text-foreground transition-colors hover:bg-background",
            borealChatActive && "border-primary/30 bg-primary/10 text-primary",
          )}
          onClick={onOpenBorealChat}
          type="button"
        >
          <MessagesSquareIcon className="size-4" />
        </button>
        <button
          aria-label={`Open sessions with ${borealChatSessionCount} prior sessions`}
          className={cn(
            "relative flex size-10 shrink-0 items-center justify-center rounded-lg border border-border bg-background/70 text-foreground transition-colors hover:bg-background",
            isSessionsActive && "border-primary/30 bg-primary/10 text-primary",
          )}
          onClick={onOpenSessions}
          type="button"
        >
          <HistoryIcon className="size-4" />
          <span className="absolute -top-1.5 -right-1.5 min-w-5 rounded-full bg-primary px-1.5 py-0.5 text-[0.55rem] leading-none font-semibold text-primary-foreground">
            {borealBadge}
          </span>
        </button>
        <button
          aria-label={`Open requests sidebar with ${requestCount} tracked requests`}
          className="relative flex size-10 shrink-0 items-center justify-center rounded-lg border border-border bg-background/70 text-foreground transition-colors hover:bg-background"
          onClick={onExpand}
          type="button"
        >
          <PackageIcon className="size-4" />
          <span className="absolute -top-1.5 -right-1.5 min-w-5 rounded-full bg-primary px-1.5 py-0.5 text-[0.55rem] leading-none font-semibold text-primary-foreground">
            {requestBadge}
          </span>
        </button>
      </div>

      <div className="mt-auto border-t border-border px-4 py-4">
        <button
          aria-label="Open profile"
          className="flex size-10 items-center justify-center rounded-lg transition-colors hover:bg-background/70"
          onClick={onOpenProfile ?? onOpenAccount}
          type="button"
        >
          <Avatar className="size-10 rounded-lg border border-border bg-background">
            {accountImageUrl ? (
              <AvatarImage alt={accountName ?? "Account"} src={accountImageUrl} />
            ) : null}
            <AvatarFallback className="rounded-lg">
              {accountName ? (
                avatarInitial
              ) : (
                <CircleUserRoundIcon className="size-4" />
              )}
            </AvatarFallback>
          </Avatar>
        </button>
      </div>
    </aside>
  )
}
