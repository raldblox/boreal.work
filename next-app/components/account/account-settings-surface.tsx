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
import type {
  MyProfileRecord,
  WalletAccountRecord,
} from "@/lib/boreal/integrations/convex/function-refs"
import { cn } from "@/lib/utils"

export function AccountSettingsSurface({
  accountName,
  builderSlot,
  defaultWalletAddress,
  isEditingPublicSetup,
  isPayoutWalletUpdating,
  isPrivyAuthenticated,
  isWalletReady,
  myProfileRecord,
  notice,
  onCloseProfileBuilder,
  onConnectWallet,
  onOpenProfileBuilder,
  onSetDefaultPayoutWallet,
  runtimeDefaultNetworkKey,
  runtimeEnvironment,
  runtimePrimaryChainFamily,
  walletAccounts,
}: {
  accountName: string | null
  builderSlot?: ReactNode
  defaultWalletAddress: string | null
  isEditingPublicSetup: boolean
  isPayoutWalletUpdating: string | null
  isPrivyAuthenticated: boolean
  isWalletReady: boolean
  myProfileRecord: MyProfileRecord
  notice: string | null
  onCloseProfileBuilder: () => void
  onConnectWallet: () => void
  onOpenProfileBuilder: () => void
  onSetDefaultPayoutWallet: (walletAccountId: string) => Promise<void>
  runtimeDefaultNetworkKey: string
  runtimeEnvironment: "devnet" | "mainnet" | "testnet"
  runtimePrimaryChainFamily: "evm" | "solana"
  walletAccounts: WalletAccountRecord
}) {
  const profile = myProfileRecord?.profile ?? null
  const primarySupply = myProfileRecord?.supplies[0] ?? null
  const hasPublicProfile = Boolean(profile?._id && profile.isPublic)
  const hasProfileSetup = hasPublicProfile || Boolean(primarySupply)
  const payoutWalletCount = walletAccounts.filter((account) =>
    account.roles.includes("payout")
  ).length
  const connectWalletLabel =
    runtimePrimaryChainFamily === "solana"
      ? "Connect Solana wallet"
      : "Connect EVM wallet"

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-border bg-muted/15 p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="text-base font-medium">
              {accountName ?? "Your account"}
            </p>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Your X account owns your requests, public identity, primary offer,
              and payout settings.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <StatusChip
              label={runtimeEnvironment}
              tone={runtimeEnvironment === "mainnet" ? "default" : "muted"}
            />
            <StatusChip
              label={`${formatChainFamilyLabel(runtimePrimaryChainFamily)} default`}
              tone="muted"
            />
            <Button
              onClick={
                isEditingPublicSetup ? onCloseProfileBuilder : onOpenProfileBuilder
              }
              size="sm"
              type="button"
              variant={isEditingPublicSetup ? "outline" : "default"}
            >
              <CircleUserRoundIcon />
              {isEditingPublicSetup
                ? "Done"
                : hasProfileSetup
                  ? "Edit profile"
                  : "Set up profile"}
            </Button>
          </div>
        </div>
      </section>

      {notice ? (
        <section className="rounded-2xl border border-border bg-muted/15 px-4 py-3 text-sm text-muted-foreground">
          {notice}
        </section>
      ) : null}

      {isEditingPublicSetup ? <section>{builderSlot}</section> : null}

      {!isEditingPublicSetup ? (
        <>
          <section className="space-y-4">
            <div className="grid gap-4 xl:grid-cols-2">
              <div className="rounded-2xl border border-border p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Public profile</p>
                    <p className="text-sm text-muted-foreground">
                      This is how Boreal introduces you to buyers and collaborators.
                    </p>
                  </div>
                  {hasPublicProfile ? (
                    <Button asChild size="sm" type="button" variant="outline">
                      <Link href={`/p/${profile!._id}`}>
                        <ExternalLinkIcon />
                        View profile
                      </Link>
                    </Button>
                  ) : null}
                </div>
                <div className="mt-4 rounded-xl border border-border bg-background p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium">
                      {profile?.displayName ?? accountName ?? "No public profile yet"}
                    </p>
                    {profile ? (
                      <StatusChip
                        label={profile.isPublic ? "public" : "private"}
                        tone={profile.isPublic ? "success" : "muted"}
                      />
                    ) : null}
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {profile?.headline
                      ? profile.headline
                      : "Set a headline and short bio so Boreal can explain what you are good at."}
                  </p>
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
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-border p-5">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Primary offer</p>
                  <p className="text-sm text-muted-foreground">
                    Package one clear ability first, then add more later.
                  </p>
                </div>
                <div className="mt-4 rounded-xl border border-border bg-background p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium">
                      {primarySupply?.title ?? "No public offer yet"}
                    </p>
                    <StatusChip
                      label={primarySupply ? "published" : "not published"}
                      tone={primarySupply ? "success" : "muted"}
                    />
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {primarySupply?.description
                      ? truncateCopy(primarySupply.description, 170)
                      : "Start with one offer buyers can understand in one glance: what it is, who it is for, and what outcome they get."}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {primarySupply?.category ? (
                      <StatusChip label={primarySupply.category} tone="muted" />
                    ) : null}
                    {primarySupply?.supplyType ? (
                      <StatusChip
                        label={primarySupply.supplyType.replaceAll("_", " ")}
                        tone="muted"
                      />
                    ) : null}
                    {primarySupply ? (
                      <StatusChip
                        label={formatPricingLabel(
                          primarySupply.priceAmount,
                          primarySupply.priceType
                        )}
                        tone="muted"
                      />
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-border p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-1">
                <p className="text-sm font-medium">Wallets and payouts</p>
                <p className="text-sm text-muted-foreground">
                  Paid checkout and paid work approvals use these wallets. Your
                  payout default is where Boreal expects seller or worker proceeds
                  to land.
                </p>
              </div>
              {!isPrivyAuthenticated || !isWalletReady ? (
                <Button
                  onClick={onConnectWallet}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  <WalletIcon />
                  {connectWalletLabel}
                </Button>
              ) : null}
            </div>

            {walletAccounts.length === 0 ? (
              <div className="mt-4 rounded-xl border border-dashed border-border px-4 py-5 text-sm text-muted-foreground">
                No wallet is synced yet. Connect a{" "}
                {runtimePrimaryChainFamily === "solana" ? "Solana" : "compatible"}{" "}
                wallet so Boreal can route paid work and payouts safely.
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                <div className="flex flex-wrap gap-2">
                  <StatusChip
                    label={`${walletAccounts.length} synced`}
                    tone="muted"
                  />
                  <StatusChip
                    label={`${payoutWalletCount} payout-ready`}
                    tone="muted"
                  />
                  {defaultWalletAddress ? (
                    <StatusChip
                      label={`active ${formatAddress(defaultWalletAddress)}`}
                      tone="success"
                    />
                  ) : null}
                </div>

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
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-medium">
                              {formatAddress(account.walletAddress)}
                            </p>
                            {isActiveWallet ? (
                              <StatusChip label="active wallet" tone="success" />
                            ) : null}
                            {account.isDefaultBuyer ? (
                              <StatusChip label="buyer default" tone="muted" />
                            ) : null}
                            {account.isDefaultPayout ? (
                              <StatusChip label="payout default" tone="success" />
                            ) : null}
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <StatusChip
                              label={formatNetworkKeyLabel(account.networkKey)}
                              tone={networkMatchesRuntime ? "success" : "warning"}
                            />
                            <StatusChip
                              label={formatChainFamilyLabel(account.chainFamily)}
                              tone="muted"
                            />
                            <StatusChip
                              label={account.environment}
                              tone={
                                account.environment === runtimeEnvironment
                                  ? "success"
                                  : "warning"
                              }
                            />
                          </div>
                          <div className="flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                            {account.roles.map((role) => (
                              <span key={`${account._id}-${role}`}>{role}</span>
                            ))}
                          </div>
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
                                Set as payout wallet
                              </Button>
                            )
                          ) : (
                            <Button disabled size="sm" type="button" variant="outline">
                              Payout role missing
                            </Button>
                          )}
                        </div>
                      </div>

                      {!networkMatchesRuntime ? (
                        <p className="mt-3 text-xs text-muted-foreground">
                          This wallet is synced, but it does not match the active
                          network defaults for this deployment. Boreal will block
                          paid checkout or paid work approval if buyer and payout
                          wallets do not line up on the same supported network.
                        </p>
                      ) : null}
                    </div>
                  )
                })}
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-border/80 bg-muted/15 p-5">
            <div className="space-y-1">
              <p className="text-sm font-medium">Network defaults</p>
              <p className="text-sm text-muted-foreground">
                This deployment is currently routing payments and payouts through{" "}
                {formatNetworkKeyLabel(runtimeDefaultNetworkKey)}.
              </p>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <RuntimeStatCard label="Environment" value={runtimeEnvironment} />
              <RuntimeStatCard
                label="Primary chain"
                value={formatChainFamilyLabel(runtimePrimaryChainFamily)}
              />
              <RuntimeStatCard
                label="Default route"
                value={formatNetworkKeyLabel(runtimeDefaultNetworkKey)}
              />
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              Mainnet is a deployment setting, not a per-user toggle. Local and dev
              environments default to Solana devnet unless deployment flags change
              it.
            </p>
          </section>
        </>
      ) : null}
    </div>
  )
}

function RuntimeStatCard({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="rounded-xl border border-border bg-background/55 p-4">
      <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-sm font-medium">{value}</p>
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

export function formatAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

export function formatChainFamilyLabel(chainFamily: "evm" | "solana") {
  return chainFamily === "evm" ? "EVM" : "Solana"
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

function formatPricingLabel(priceAmount: number | null, priceType: string) {
  if (typeof priceAmount === "number" && Number.isFinite(priceAmount)) {
    return `$${priceAmount}${priceType === "hourly" ? "/hr" : ""}`
  }

  if (priceType === "fixed") {
    return "fixed price"
  }

  if (priceType === "hourly") {
    return "hourly"
  }

  return "scoped quote"
}

function truncateCopy(value: string, maxLength: number) {
  const trimmed = value.trim()

  if (trimmed.length <= maxLength) {
    return trimmed
  }

  return `${trimmed.slice(0, maxLength).trimEnd()}...`
}
