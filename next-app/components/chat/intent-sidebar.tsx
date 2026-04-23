"use client";

import { useState } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import { LoaderIcon, LogInIcon, LogOutIcon, UserIcon, XIcon } from "lucide-react";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import type { SidebarIntentPreview } from "@/lib/boreal/integrations/convex/function-refs";

type IntentSidebarProps = {
  intents: SidebarIntentPreview[];
  isDeletingId: string | null;
  onDelete: (intentId: string) => void;
  onSelect: (intent: SidebarIntentPreview) => void;
  selectedIntentId: string | null;
};

export function IntentSidebar({
  intents,
  isDeletingId,
  onDelete,
  onSelect,
  selectedIntentId,
}: IntentSidebarProps) {
  const { data: session, status } = useSession();
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

  return (
    <aside className="flex min-h-0 flex-col overflow-hidden border border-border">
      <div className="border-b border-border px-4 py-4">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
          Request Queue
        </p>
        <h2 className="mt-2 text-sm font-medium">Tracked requests and product asks</h2>
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <div className="flex flex-col">
          {intents.length === 0 ? (
            <div className="px-4 py-5 text-sm text-muted-foreground">
              Saved intents will appear here after the first routed request.
            </div>
          ) : (
            intents.map((intent) => {
              const isActive = intent._id === selectedIntentId;
              const isDeleting = intent._id === isDeletingId;

              return (
                <div className="border-b border-border px-4 py-4" key={intent._id}>
                  <div className="flex items-start justify-between gap-3">
                    <button
                      className="min-w-0 flex-1 text-left"
                      onClick={() => onSelect(intent)}
                      type="button"
                    >
                      <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                        <span>{intent.routeTarget.replaceAll("_", " ")}</span>
                        <span>{intent.status}</span>
                        <span>{intent.provider}</span>
                        {isActive ? <span>active</span> : null}
                      </div>
                      <p className="mt-2 line-clamp-1 text-sm font-medium">
                        {intent.title}
                      </p>
                      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                        {intent.summary}
                      </p>
                      <p className="mt-3 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                        {intent.requestedOutputTypes
                          .map((value) => value.replaceAll("_", " "))
                          .join(" / ")}
                      </p>
                    </button>
                    <Button
                      aria-label="Delete intent"
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
                    </Button>
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
                <AvatarImage alt={user.name ?? "User"} src={user.image} />
              ) : null}
              <AvatarFallback>
                <UserIcon />
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{user.name}</p>
              <p className="truncate text-xs text-muted-foreground">
                {user.email ?? "𝕏/Twitter"}
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
            Sign in with 𝕏
          </Button>
        )}
      </div>
    </aside>
  );
}