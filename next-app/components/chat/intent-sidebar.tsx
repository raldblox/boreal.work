"use client"

import { useState } from "react"
import { useWallets } from "@privy-io/react-auth"
import { signIn, signOut, useSession } from "next-auth/react"
import {
  LoaderIcon,
  LogInIcon,
  LogOutIcon,
  MessagesSquareIcon,
  PanelLeftCloseIcon,
  Settings2Icon,
  ShieldAlertIcon,
  UserIcon,
} from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/ui/logo"
import type { SidebarIntentPreview } from "@/lib/boreal/integrations/convex/function-refs"
import type { RequestNavigationView } from "@/components/chat/request-notifications"

import { RequestSidebarSection } from "./intent-sidebar-sections"

type IntentSidebarProps = {
  borealChatSessionCount: number
  isBorealChatActive: boolean
  intents: SidebarIntentPreview[]
  onOpenAccount?: () => void
  onOpenBorealChat: () => void
  onCollapse?: () => void
  onOpenPendingApprovals?: () => void
  onSelect: (intent: SidebarIntentPreview, view?: RequestNavigationView) => void
  pendingApprovalCount: number
  selectedIntentId: string | null
}

export function IntentSidebar({
  borealChatSessionCount,
  isBorealChatActive,
  intents,
  onOpenAccount,
  onOpenBorealChat,
  onCollapse,
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
          className="w-full justify-between"
          onClick={onOpenBorealChat}
          type="button"
          variant={isBorealChatActive ? "default" : "outline"}
        >
          <span className="flex items-center gap-2">
            <MessagesSquareIcon />
            Boreal chat
          </span>
          <span className="font-mono text-xs">
            {borealChatSessionCount}
          </span>
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

      <RequestSidebarSection
        intents={intents}
        onSelect={onSelect}
        selectedIntentId={selectedIntentId}
      />

      <div className="border-t border-border px-4 py-4">
        {isAuthenticated && user ? (
          <div className="flex items-center gap-3">
            <button
              className="flex min-w-0 flex-1 items-center gap-3 rounded-xl border border-transparent px-1 py-1 text-left transition-colors hover:border-border hover:bg-background/70"
              onClick={onOpenAccount}
              type="button"
            >
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
            </button>
            {onOpenAccount ? (
              <Button
                onClick={onOpenAccount}
                size="icon-sm"
                type="button"
                variant="outline"
              >
                <Settings2Icon />
              </Button>
            ) : null}
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
