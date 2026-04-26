"use client"

import type { CSSProperties, ReactNode } from "react"
import Link from "next/link"
import {
  ArrowLeftIcon,
  CircleUserRoundIcon,
  LoaderIcon,
  MessagesSquareIcon,
  MessageSquarePlusIcon,
  PackageIcon,
  PanelLeftOpenIcon,
  PanelRightCloseIcon,
  SearchIcon,
} from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/ui/logo"
import { cn } from "@/lib/utils"

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
  hideIntentMenu = false,
  hideWorkspaceToggle = false,
  isRequestSelected,
  isSubmitting,
  onOpenMobileDiscovery,
  onOpenMobileIntentSidebar,
  onReturnHome,
  onToggleWorkspace,
  requestTitle,
  showWorkspace,
}: {
  hideIntentMenu?: boolean
  hideWorkspaceToggle?: boolean
  isRequestSelected: boolean
  isSubmitting: boolean
  onOpenMobileDiscovery: () => void
  onOpenMobileIntentSidebar: () => void
  onReturnHome: () => void
  onToggleWorkspace: () => void
  requestTitle?: string | null
  showWorkspace: boolean
}) {
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
            <p className="truncate text-sm font-medium">Boreal chat</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 lg:hidden">
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
            {!isRequestSelected ? (
              <Button asChild size="sm" type="button" variant="outline">
                <Link href="/about">About</Link>
              </Button>
            ) : null}
            {!hideWorkspaceToggle ? (
              showWorkspace ? (
                <Button
                  aria-label="Hide market"
                  onClick={onToggleWorkspace}
                  size="icon-sm"
                  type="button"
                  variant="ghost"
                >
                  <PanelRightCloseIcon />
                </Button>
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
  onOpenAccount,
  onNewChat,
  onExpand,
  requestCount,
}: {
  accountImageUrl: string | null
  accountName: string | null
  onOpenAccount: () => void
  onNewChat: () => void
  onExpand: () => void
  requestCount: number
}) {
  const requestBadge = requestCount > 99 ? "99+" : String(requestCount)
  const avatarInitial = accountName?.trim().charAt(0).toUpperCase() ?? "U"

  return (
    <aside className="flex h-full w-full flex-col items-center border-r border-border bg-foreground/[0.05] px-3 py-4">
      <button
        aria-label="Expand requests sidebar"
        className="group relative flex size-10 items-center justify-center rounded-xl border border-border bg-background p-2 transition-colors hover:bg-muted/40"
        onClick={onExpand}
        type="button"
      >
        <span className="flex size-full items-center justify-center rounded-lg bg-muted/30 transition-opacity duration-150 group-hover:opacity-0">
          <Logo size={13} />
        </span>
        <span className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-150 group-hover:opacity-100">
          <PanelLeftOpenIcon className="size-4" />
        </span>
      </button>

      <div className="mt-4 flex flex-col items-center gap-2">
        <Button
          aria-label="Start new chat"
          onClick={onNewChat}
          size="icon"
          type="button"
        >
          <MessageSquarePlusIcon className="size-4" />
        </Button>

        <button
          aria-label={`Open requests sidebar with ${requestCount} tracked requests`}
          className="relative flex size-10 items-center justify-center rounded-xl border border-border bg-background text-foreground transition-colors hover:bg-muted/40"
          onClick={onExpand}
          type="button"
        >
          <MessagesSquareIcon className="size-4" />
          <span className="absolute -top-1.5 -right-1.5 min-w-5 rounded-full bg-primary px-1.5 py-0.5 text-[0.55rem] leading-none font-semibold text-primary-foreground">
            {requestBadge}
          </span>
        </button>
      </div>

      <div className="mt-auto flex flex-col items-center gap-3">
        <button
          aria-label="Open account settings"
          className="flex size-10 items-center justify-center rounded-xl border border-border bg-background transition-colors hover:bg-muted/40"
          onClick={onOpenAccount}
          type="button"
        >
          <Avatar className="size-7 rounded-lg">
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
