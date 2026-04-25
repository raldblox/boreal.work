"use client"

import Link from "next/link"
import { useState } from "react"
import { useWallets } from "@privy-io/react-auth"
import { signIn, signOut, useSession } from "next-auth/react"
import {
  LoaderIcon,
  LogInIcon,
  LogOutIcon,
  MessageSquarePlusIcon,
  PanelLeftCloseIcon,
  ShieldAlertIcon,
  UserIcon,
} from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/ui/logo"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { SidebarIntentPreview } from "@/lib/boreal/integrations/convex/function-refs"
import type { RequestNavigationView } from "@/components/chat/request-notifications"

import { RequestListCard } from "./request-list-card"

type IntentSidebarProps = {
  intents: SidebarIntentPreview[]
  onCollapse?: () => void
  onDeselect: () => void
  onOpenPendingApprovals?: () => void
  onSelect: (intent: SidebarIntentPreview, view?: RequestNavigationView) => void
  pendingApprovalCount: number
  selectedIntentId: string | null
}

export function IntentSidebar({
  intents,
  onCollapse,
  onDeselect,
  onOpenPendingApprovals,
  onSelect,
  pendingApprovalCount,
  selectedIntentId,
}: IntentSidebarProps) {
  const { data: session, status } = useSession()
  const { wallets } = useWallets()
  const [isLoading, setIsLoading] = useState(false)

  async function handleSignIn() {
    setIsLoading(true)
    try {
      await signIn("twitter", { callbackUrl: "/chat" })
    } finally {
      setIsLoading(false)
    }
  }

  async function handleSignOut() {
    setIsLoading(true)
    try {
      await signOut({ callbackUrl: "/" })
    } finally {
      setIsLoading(false)
    }
  }

  const user = session?.user
  const isAuthenticated = status === "authenticated"
  const connectedAddress = wallets[0]?.address ?? null

  return (
    <aside className="flex h-full min-h-0 flex-col bg-foreground/5 text-foreground">
      <div className="flex h-16 items-center border-b border-border px-4">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <span className="flex size-10 shrink-0 items-center border justify-center rounded-lg">
            <Logo size={24} />
          </span>
        </div>
        {onCollapse ? (
          <button
            aria-label="Collapse requests sidebar"
            className="flex size-10 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground"
            onClick={onCollapse}
            type="button"
          >
            <PanelLeftCloseIcon className="size-4" />
          </button>
        ) : null}
      </div>

      <div className="space-y-2 px-4 py-4">
        <Button
          size={"lg"}
          className="w-full justify-start"
          onClick={onDeselect}
          type="button"
        >
          <MessageSquarePlusIcon />
          New chat
        </Button>
        {pendingApprovalCount > 0 ? (
          <Button
            size={"lg"}
            className="w-full justify-between"
            onClick={onOpenPendingApprovals}
            type="button"
            variant="ghost"
          >
            <span className="flex items-center gap-2">
              <ShieldAlertIcon className="size-4" />
              Pending approvals
            </span>
            <span className="font-mono text-xs text-primary">
              {pendingApprovalCount}
            </span>
          </Button>
        ) : null}
      </div>

      <div className=" px-4 py-3">
        <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
          Your requests
        </p>
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <div className="space-y-2 px-4 pb-4">
          {intents.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border px-4 py-5 text-sm text-muted-foreground">
              Active requests appear here once Boreal turns a live ask into
              tracked work.
            </div>
          ) : (
            intents.map((intent) => {
              const isActive = intent._id === selectedIntentId

              return (
                <RequestListCard
                  intent={intent}
                  key={intent._id}
                  onOpen={onSelect}
                  selected={isActive}
                />
              )
            })
          )}
        </div>
      </ScrollArea>

      <div className="border-t border-border px-4 py-4">
        {isAuthenticated && user ? (
          <div className="flex items-center gap-3">
            <Avatar className="size-10 rounded-lg border border-border bg-background">
              {user.image ? (
                <AvatarImage alt={user.name ?? "X user"} src={user.image} />
              ) : null}
              <AvatarFallback className="rounded-lg">
                <UserIcon className="size-4" />
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">
                {user.name ?? "X user"}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {connectedAddress
                  ? formatAddress(connectedAddress)
                  : "Wallet not connected"}
              </p>
            </div>
            <Button
              disabled={isLoading}
              onClick={handleSignOut}
              size="icon-sm"
              type="button"
              variant="outline"
            >
              {isLoading ? (
                <LoaderIcon className="animate-spin" />
              ) : (
                <LogOutIcon />
              )}
            </Button>
          </div>
        ) : (
          <Button
            className="w-full"
            disabled={isLoading}
            onClick={handleSignIn}
            type="button"
          >
            {isLoading ? (
              <LoaderIcon className="mr-2 animate-spin" />
            ) : (
              <LogInIcon className="mr-2" />
            )}
            Sign in with X
          </Button>
        )}
      </div>
    </aside>
  )
}

function formatAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}
