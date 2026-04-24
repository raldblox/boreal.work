"use client";

import { useState } from "react";
import { useWallets } from "@privy-io/react-auth";
import { signIn, signOut, useSession } from "next-auth/react";
import {
  LoaderIcon,
  LogInIcon,
  LogOutIcon,
  MessageSquarePlusIcon,
  UserIcon,
  XIcon,
} from "lucide-react";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import type { SidebarIntentPreview } from "@/lib/boreal/integrations/convex/function-refs";

import {
  formatOutputTypes,
  RequestStageRail,
} from "./request-ui";

type IntentSidebarProps = {
  intents: SidebarIntentPreview[];
  isDeletingId: string | null;
  onDelete: (intentId: string) => void;
  onDeselect: () => void;
  onSelect: (intent: SidebarIntentPreview) => void;
  selectedIntentId: string | null;
};

export function IntentSidebar({
  intents,
  isDeletingId,
  onDelete,
  onDeselect,
  onSelect,
  selectedIntentId,
}: IntentSidebarProps) {
  const { data: session, status } = useSession();
  const { wallets } = useWallets();
  const [isLoading, setIsLoading] = useState(false);

  async function handleSignIn() {
    setIsLoading(true);
    try {
      await signIn("twitter", { callbackUrl: "/chat" });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSignOut() {
    setIsLoading(true);
    try {
      await signOut({ callbackUrl: "/" });
    } finally {
      setIsLoading(false);
    }
  }

  const user = session?.user;
  const isAuthenticated = status === "authenticated";
  const connectedAddress = wallets[0]?.address ?? null;

  return (
    <aside className="flex min-h-0 flex-col overflow-hidden border border-border">
      <div className="space-y-4 border-b border-border px-4 py-4">
        <div className="space-y-2">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
            Requests
          </p>
          <h2 className="text-sm font-medium">Tracked asks and active deliveries</h2>
          <p className="text-xs text-muted-foreground">
            X identity anchors request ownership. Wallet stays separate for payment later.
          </p>
        </div>
        <Button className="w-full justify-start" onClick={onDeselect} type="button" variant="outline">
          <MessageSquarePlusIcon />
          New chat
        </Button>
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <div className="flex flex-col">
          {intents.length === 0 ? (
            <div className="px-4 py-5 text-sm text-muted-foreground">
              Approved or pending requests will appear here after the first tracked ask.
            </div>
          ) : (
            intents.map((intent) => {
              const isActive = intent._id === selectedIntentId;
              const isDeleting = intent._id === isDeletingId;

              return (
                <div
                  className="border-b border-border px-4 py-4"
                  key={intent._id}
                >
                  <div className="flex items-start gap-3">
                    <button
                      className={
                        isActive
                          ? "min-w-0 flex-1 border border-border bg-foreground/5 p-3 text-left"
                          : "min-w-0 flex-1 border border-transparent p-3 text-left"
                      }
                      onClick={() => onSelect(intent)}
                      type="button"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="line-clamp-1 text-sm font-medium">
                            {intent.title}
                          </p>
                          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                            {intent.summary}
                          </p>
                        </div>
                      </div>

                      <RequestStageRail status={intent.status} />

                      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                        <span>{formatOutputTypes(intent.requestedOutputTypes)}</span>
                        <span>{intent.assignedAgent ?? intent.routeTarget.replaceAll("_", " ")}</span>
                        {intent.reviewRating ? <span>{intent.reviewRating}/5</span> : null}
                      </div>
                    </button>

                    {/* <Button
                      aria-label="Delete request"
                      disabled={isDeleting}
                      onClick={() => onDelete(intent._id)}
                      size="icon-sm"
                      type="button"
                      variant="ghost"
                    >
                      {isDeleting ? (
                        <LoaderIcon className="animate-spin" />
                      ) : (
                        <XIcon />
                      )}
                    </Button> */}
                  </div>
                </div>
              );
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
              <p className="truncate text-sm font-medium">{user.name ?? "X user"}</p>
              <p className="truncate text-xs text-muted-foreground">
                {connectedAddress ? formatAddress(connectedAddress) : "Wallet not connected"}
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
          <Button className="w-full" disabled={isLoading} onClick={handleSignIn} type="button">
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
  );
}

function formatAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}
