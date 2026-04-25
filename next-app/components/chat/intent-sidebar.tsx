"use client"

import { useState } from "react"
import { useWallets } from "@privy-io/react-auth"
import { signIn, signOut, useSession } from "next-auth/react"
import {
  LoaderIcon,
  LogInIcon,
  LogOutIcon,
  MessageSquarePlusIcon,
  ShieldAlertIcon,
  UserIcon,
} from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import type { SidebarIntentPreview } from "@/lib/boreal/integrations/convex/function-refs"
import type { RequestNavigationView } from "@/components/chat/request-notifications"

import { RequestListCard } from "./request-list-card"

type IntentSidebarProps = {
  intents: SidebarIntentPreview[]
  onDeselect: () => void
  onOpenPendingApprovals?: () => void
  onSelect: (intent: SidebarIntentPreview, view?: RequestNavigationView) => void
  pendingApprovalCount: number
  selectedIntentId: string | null
}

export function IntentSidebar({
  intents,
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
    <aside className="flex h-full min-h-0 flex-col overflow-hidden border border-border">
      <div className="space-y-3 border-b border-border px-4 py-4">
        <div className="space-y-1">
          <p className="font-mono text-[11px] tracking-[0.2em] text-muted-foreground uppercase">
            Requests
          </p>
          <h2 className="text-sm font-medium">Active work</h2>
        </div>
        <Button
          className="w-full justify-start"
          onClick={onDeselect}
          type="button"
          variant="outline"
        >
          <MessageSquarePlusIcon />
          New chat
        </Button>
        {pendingApprovalCount > 0 ? (
          <Button
            className="w-full justify-between"
            onClick={onOpenPendingApprovals}
            type="button"
            variant="secondary"
          >
            <span className="flex items-center gap-2">
              <ShieldAlertIcon />
              Pending approvals
            </span>
            <span className="text-primary">{pendingApprovalCount}</span>
          </Button>
        ) : null}
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <div className="space-y-1 p-1">
          {intents.length === 0 ? (
            <div className="px-4 py-5 text-sm text-muted-foreground">
              Active requests appear here after the first tracked ask.
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

      <Separator />

      <div className="p-4">
        {isAuthenticated && user ? (
          <div className="flex items-center gap-3">
            <Avatar size="sm">
              {user.image ? (
                <AvatarImage alt={user.name ?? "X user"} src={user.image} />
              ) : null}
              <AvatarFallback>
                <UserIcon />
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
              variant="ghost"
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
