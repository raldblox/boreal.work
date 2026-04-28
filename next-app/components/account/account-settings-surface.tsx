"use client"

import type { ReactNode } from "react"
import Link from "next/link"
import {
  CheckIcon,
  CircleUserRoundIcon,
  ExternalLinkIcon,
  LoaderIcon,
  WalletIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import type {
  MyProfileRecord,
  WalletAccountRecord,
} from "@/lib/boreal/integrations/convex/function-refs"
import { buildProfileSheetHref } from "@/lib/boreal/navigation/shell-links"
import { cn } from "@/lib/utils"

export function AccountSettingsSurface({
  accountName,
  builderSlot,
  defaultWalletAddress,
  isEditingPublicSetup,
  isProfileAvailabilityUpdating,
  isPayoutWalletUpdating,
  isPrivyAuthenticated,
  isWalletReady,
  myProfileRecord,
  notice,
  onConnectWallet,
  onOpenProfileBuilder,
  onToggleProfileAvailability,
  onSetDefaultPayoutWallet,
  runtimeDefaultNetworkKey,
  walletAccounts,
}: {
  accountName: string | null
  builderSlot?: ReactNode
  defaultWalletAddress: string | null
  isEditingPublicSetup: boolean
  isProfileAvailabilityUpdating: boolean
  isPayoutWalletUpdating: string | null
  isPrivyAuthenticated: boolean
  isWalletReady: boolean
  myProfileRecord: MyProfileRecord
  notice: string | null
  onConnectWallet: () => void
  onOpenProfileBuilder: () => void
  onToggleProfileAvailability: (checked: boolean) => Promise<void> | void
  onSetDefaultPayoutWallet: (walletAccountId: string) => Promise<void>
  runtimeDefaultNetworkKey: string
  walletAccounts: WalletAccountRecord
}) {
  const profile = myProfileRecord?.profile ?? null
  const primarySupply = myProfileRecord?.supplies[0] ?? null
  const hasPublicProfile = Boolean(profile?._id && profile.isPublic)
  const isAvailableForWork = Boolean(
    profile?.isPublic && profile.availabilityStatus === "available"
  )
  const connectWalletLabel = isWalletReady
    ? "Connect wallet"
    : "Connect Solana"
  const profileName = profile?.displayName ?? accountName ?? "No work profile yet"
  const profileHeadline =
    profile?.headline || "Set a headline so Boreal can introduce your work fast."
  const profileBio =
    profile?.bio ||
    "Add a short bio, a few skills, and one clear offer so people know what to hire you for."

  return (
    <div className="space-y-6">
      {notice ? (
        <section className="rounded-2xl border border-border bg-muted/15 px-4 py-3 text-sm text-muted-foreground">
          {notice}
        </section>
      ) : null}

      {isEditingPublicSetup ? <section>{builderSlot}</section> : null}

      {!isEditingPublicSetup ? (
        <>
          <section className="rounded-2xl border border-border p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-2">
                <p className="text-base font-medium">Work profile overview</p>
                <div className="space-y-1">
                  <p className="text-lg font-medium">{profileName}</p>
                  <p className="text-sm text-muted-foreground">
                    {profileHeadline}
                  </p>
                </div>
              </div>
              <AvailabilityToggle
                checked={isAvailableForWork}
                disabled={isProfileAvailabilityUpdating}
                onCheckedChange={(checked) => void onToggleProfileAvailability(checked)}
              />
            </div>

            <p className="mt-4 text-sm text-muted-foreground">{profileBio}</p>

            <div className="mt-4 flex flex-wrap gap-2">
              <StatusChip
                label={`${profile?.capabilityTags.length ?? 0} capabilities`}
                tone="muted"
              />
              <StatusChip
                label={`${profile?.skillTags.length ?? 0} skills`}
                tone="muted"
              />
              <StatusChip
                label={`${myProfileRecord?.supplies.length ?? 0} offers`}
                tone="muted"
              />
              {primarySupply?.title ? (
                <StatusChip label={primarySupply.title} tone="muted" />
              ) : null}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                onClick={onOpenProfileBuilder}
                size="sm"
                type="button"
                variant="default"
              >
                <CircleUserRoundIcon />
                Update profile
              </Button>
              {hasPublicProfile ? (
                <Button asChild size="sm" type="button" variant="outline">
                  <Link href={buildProfileSheetHref(profile!._id!)}>
                    <ExternalLinkIcon />
                    View profile
                  </Link>
                </Button>
              ) : null}
            </div>
          </section>

          <section className="rounded-2xl border border-border p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-1">
                <p className="text-base font-medium">Wallets</p>
              </div>
              <Button
                onClick={onConnectWallet}
                size="sm"
                type="button"
                variant={!isPrivyAuthenticated || !isWalletReady ? "default" : "outline"}
              >
                <WalletIcon />
                {connectWalletLabel}
              </Button>
            </div>

            {walletAccounts.length === 0 ? (
              <div className="mt-4 rounded-xl border border-dashed border-border px-4 py-5 text-sm text-muted-foreground">
                No Solana wallet is synced yet.
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {walletAccounts.map((account) => {
                  const isActiveWallet =
                    defaultWalletAddress?.toLowerCase() ===
                    account.walletAddress.toLowerCase()
                  const networkMatchesRuntime =
                    account.networkKey === runtimeDefaultNetworkKey

                  return (
                    <div
                      className="rounded-xl border border-border bg-background p-4"
                      key={account._id}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="space-y-2">
                          <p className="text-sm font-medium">Wallet address</p>
                          <p className="break-all font-mono text-xs text-muted-foreground">
                            {account.walletAddress}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {account.isDefaultPayout
                              ? "Default payout wallet."
                              : isActiveWallet
                                ? "Connected and ready."
                                : "Synced to this account."}
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {account.roles.includes("payout") ? (
                            account.isDefaultPayout ? (
                              <Button disabled size="sm" type="button" variant="outline">
                                <CheckIcon />
                                Payout default
                              </Button>
                            ) : (
                              <Button
                                disabled={isPayoutWalletUpdating === account._id}
                                onClick={() =>
                                  void onSetDefaultPayoutWallet(account._id)
                                }
                                size="sm"
                                type="button"
                                variant="outline"
                              >
                                {isPayoutWalletUpdating === account._id ? (
                                  <LoaderIcon className="animate-spin" />
                                ) : (
                                  <WalletIcon />
                                )}
                                Use for payouts
                              </Button>
                            )
                          ) : (
                            <Button disabled size="sm" type="button" variant="outline">
                              Not payout-ready
                            </Button>
                          )}
                        </div>
                      </div>

                      {!networkMatchesRuntime ? (
                        <p className="mt-3 text-xs text-muted-foreground">
                          This wallet is synced, but it does not match Boreal's
                          active Solana network:{" "}
                          {formatNetworkKeyLabel(runtimeDefaultNetworkKey)}.
                        </p>
                      ) : null}
                    </div>
                  )
                })}
              </div>
            )}
          </section>
        </>
      ) : null}
    </div>
  )
}

function AvailabilityToggle({
  checked,
  disabled,
  onCheckedChange,
}: {
  checked: boolean
  disabled: boolean
  onCheckedChange: (checked: boolean) => void
}) {
  return (
    <div className="inline-flex items-center gap-3 rounded-full border border-border bg-background px-3 py-2">
      <span
        className={cn(
          "text-xs font-medium",
          checked ? "text-foreground" : "text-muted-foreground"
        )}
      >
        Available for work
      </span>
      {disabled ? (
        <LoaderIcon className="size-4 animate-spin text-muted-foreground" />
      ) : (
        <Switch checked={checked} onCheckedChange={onCheckedChange} />
      )}
    </div>
  )
}

function StatusChip({
  label,
  tone,
}: {
  label: string
  tone: "default" | "muted" | "success" | "warning"
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] uppercase tracking-[0.18em]",
        tone === "default" && "border-primary/25 bg-primary/10 text-primary",
        tone === "muted" && "border-border bg-muted/20 text-muted-foreground",
        tone === "success" && "border-primary/25 bg-primary/10 text-primary",
        tone === "warning" &&
          "border-destructive/25 bg-destructive/10 text-destructive"
      )}
    >
      {label}
    </span>
  )
}

export function formatNetworkKeyLabel(networkKey: string) {
  return networkKey
    .split(":")
    .map((part) => {
      if (part === "evm") {
        return "EVM"
      }

      if (part === "mainnet") {
        return "Mainnet"
      }

      if (part === "devnet") {
        return "Devnet"
      }

      if (part === "testnet") {
        return "Testnet"
      }

      return part.charAt(0).toUpperCase() + part.slice(1)
    })
    .join(" ")
}
