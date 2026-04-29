"use client"

import type { ReactNode } from "react"
import Link from "next/link"
import {
  CheckIcon,
  CircleUserRoundIcon,
  ExternalLinkIcon,
  WalletIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Spinner as LoaderIcon } from "@/components/ui/spinner"
import { Switch } from "@/components/ui/switch"
import type {
  MyProfileRecord,
  WalletAccountRecord,
} from "@/lib/boreal/integrations/convex/function-refs"
import type { NormalizedConnectedWallet } from "@/lib/boreal/integrations/service-providers/wallets/reown"
import { buildProfileSheetHref } from "@/lib/boreal/navigation/shell-links"
import type { ProfileBuilderListingPath } from "@/lib/boreal/schemas/profile-builder"
import { cn } from "@/lib/utils"

export function AccountSettingsSurface({
  accountName,
  builderSlot,
  connectedWallets,
  defaultWalletAddress,
  isEditingPublicSetup,
  isProfileAvailabilityUpdating,
  isPayoutWalletUpdating,
  isWalletConnected,
  isWalletReady,
  myProfileRecord,
  notice,
  onConnectWallet,
  onEditSupplyListing = () => {},
  onOpenProfileBuilder,
  onToggleProfileAvailability,
  onSetDefaultPayoutWallet,
  runtimeDefaultNetworkKey,
  walletAccounts,
}: {
  accountName: string | null
  builderSlot?: ReactNode
  connectedWallets: NormalizedConnectedWallet[]
  defaultWalletAddress: string | null
  isEditingPublicSetup: boolean
  isProfileAvailabilityUpdating: boolean
  isPayoutWalletUpdating: string | null
  isWalletConnected: boolean
  isWalletReady: boolean
  myProfileRecord: MyProfileRecord
  notice: string | null
  onConnectWallet: () => void
  onEditSupplyListing?: (supplyId: string) => void
  onOpenProfileBuilder: (
    path?: Exclude<ProfileBuilderListingPath, "provider_sync">
  ) => void
  onToggleProfileAvailability: (checked: boolean) => Promise<void> | void
  onSetDefaultPayoutWallet: (walletAccountId: string) => Promise<void>
  runtimeDefaultNetworkKey: string
  walletAccounts: WalletAccountRecord
}) {
  const profile = myProfileRecord?.profile ?? null
  const editableSupplies =
    myProfileRecord?.supplies.filter((supply) => isEditableMerchantSupply(supply)) ??
    []
  const providerManagedSupplies =
    myProfileRecord?.supplies.filter(
      (supply) => !isEditableMerchantSupply(supply)
    ) ?? []
  const primarySupply = editableSupplies[0] ?? null
  const hasPublicProfile = Boolean(profile?._id && profile.isPublic)
  const isAvailableForWork = Boolean(
    profile?.isPublic && profile.availabilityStatus === "available"
  )
  const connectWalletLabel = isWalletReady
    ? "Manage wallets"
    : "Connect Solana mainnet"
  const profileName = profile?.displayName ?? accountName ?? "No work profile yet"
  const profileHeadline =
    profile?.headline || "Set a headline so Boreal can introduce your work fast."
  const profileBio =
    profile?.bio ||
    "Add a short bio, a few skills, and one clear offer so people know what to hire you for."
  const primarySupplyPath = primarySupply
    ? primarySupply.supplyType === "product"
      ? "product"
      : "service"
    : null
  const runtimeChainPrefix = runtimeDefaultNetworkKey.split(":")[0]
  const sortedConnectedWallets = [...connectedWallets].sort((left, right) => {
    const leftIsRuntimeChain = left.networkKey.startsWith(`${runtimeChainPrefix}:`)
    const rightIsRuntimeChain = right.networkKey.startsWith(`${runtimeChainPrefix}:`)

    if (leftIsRuntimeChain !== rightIsRuntimeChain) {
      return leftIsRuntimeChain ? -1 : 1
    }

    const leftIsActive =
      defaultWalletAddress?.toLowerCase() === left.address.toLowerCase()
    const rightIsActive =
      defaultWalletAddress?.toLowerCase() === right.address.toLowerCase()

    if (leftIsActive !== rightIsActive) {
      return leftIsActive ? -1 : 1
    }

    return left.address.localeCompare(right.address)
  })
  const runtimeConnectedWallets = sortedConnectedWallets.filter(
    (wallet) => wallet.networkKey === runtimeDefaultNetworkKey
  )
  const unsupportedConnectedWallets = sortedConnectedWallets.filter(
    (wallet) => wallet.networkKey !== runtimeDefaultNetworkKey
  )
  const sortedWalletAccounts = [...walletAccounts].sort((left, right) => {
    const leftIsRuntimeChain = left.networkKey.startsWith(`${runtimeChainPrefix}:`)
    const rightIsRuntimeChain = right.networkKey.startsWith(`${runtimeChainPrefix}:`)

    if (leftIsRuntimeChain !== rightIsRuntimeChain) {
      return leftIsRuntimeChain ? -1 : 1
    }

    const leftIsActive =
      defaultWalletAddress?.toLowerCase() === left.walletAddress.toLowerCase()
    const rightIsActive =
      defaultWalletAddress?.toLowerCase() === right.walletAddress.toLowerCase()

    if (leftIsActive !== rightIsActive) {
      return leftIsActive ? -1 : 1
    }

    if (left.isDefaultPayout !== right.isDefaultPayout) {
      return left.isDefaultPayout ? -1 : 1
    }

    return left.walletAddress.localeCompare(right.walletAddress)
  })
  const hasRuntimeWallet = sortedWalletAccounts.some((account) =>
    account.networkKey.startsWith(`${runtimeChainPrefix}:`)
  )

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
                onClick={() => onOpenProfileBuilder()}
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
            <div className="space-y-1">
              <p className="text-base font-medium">Selling paths</p>
              <p className="text-sm text-muted-foreground">
                Boreal has three different merchant routes. Pick the native
                editor for custom services or digital products. Use provider
                sync only for external x402 or partner-backed services.
              </p>
            </div>

            <div className="mt-4 grid gap-3 xl:grid-cols-3">
              <MerchantPathCard
                action={
                  <Button
                    onClick={() => onOpenProfileBuilder("service")}
                    size="sm"
                    type="button"
                    variant={primarySupplyPath === "service" ? "default" : "outline"}
                  >
                    Edit service offer
                  </Button>
                }
                body="Best for work that starts from a buyer brief, scope, or request thread."
                eyebrow="Request-based service"
                isActive={primarySupplyPath === "service"}
                title="Custom service offer"
              />
              <MerchantPathCard
                action={
                  <Button
                    onClick={() => onOpenProfileBuilder("product")}
                    size="sm"
                    type="button"
                    variant={primarySupplyPath === "product" ? "default" : "outline"}
                  >
                    Edit digital product
                  </Button>
                }
                body="Best for repeatable files, templates, downloads, or fixed deliverables a buyer can understand upfront."
                eyebrow="Catalog-first"
                isActive={primarySupplyPath === "product"}
                title="Digital product"
              />
              <MerchantPathCard
                action={
                  <Button disabled size="sm" type="button" variant="outline">
                    Operator sync today
                  </Button>
                }
                body="These listings are synced into Boreal through provider adapters today. They are not authored in the profile builder yet."
                eyebrow="Provider-backed service"
                isActive={false}
                title="Provider sync route"
              />
            </div>
          </section>

          <section className="rounded-2xl border border-border p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-1">
                <p className="text-base font-medium">Owned offers</p>
                <p className="text-sm text-muted-foreground">
                  Edit Boreal-native offers here. Provider-synced listings stay
                  visible but read-only so this editor does not overwrite the
                  external source path.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={() => onOpenProfileBuilder("service")}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  Add service offer
                </Button>
                <Button
                  onClick={() => onOpenProfileBuilder("product")}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  Add digital product
                </Button>
              </div>
            </div>

            {myProfileRecord?.supplies.length ? (
              <div className="mt-4 grid gap-3 xl:grid-cols-2">
                {editableSupplies.map((supply) => (
                  <OwnedOfferCard
                    action={
                      <Button
                        onClick={() => onEditSupplyListing(supply._id)}
                        size="sm"
                        type="button"
                        variant="outline"
                      >
                        Edit offer
                      </Button>
                    }
                    description={supply.description}
                    key={supply._id}
                    sourceLabel="Boreal native"
                    supply={supply}
                  />
                ))}
                {providerManagedSupplies.map((supply) => (
                  <OwnedOfferCard
                    action={
                      <Button disabled size="sm" type="button" variant="outline">
                        Provider-managed
                      </Button>
                    }
                    description={supply.description}
                    key={supply._id}
                    sourceLabel={`Synced from ${formatSourceProviderLabel(
                      supply.sourceProviderKey
                    )}`}
                    supply={supply}
                  />
                ))}
              </div>
            ) : (
              <div className="mt-4 rounded-xl border border-dashed border-border px-4 py-5 text-sm text-muted-foreground">
                No offers yet. Start with one custom service or one digital
                product.
              </div>
            )}
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
                variant={!isWalletConnected || !isWalletReady ? "default" : "outline"}
              >
                <WalletIcon />
                {connectWalletLabel}
              </Button>
            </div>

            {runtimeConnectedWallets.length > 0 ? (
              <div className="mt-4 space-y-3">
                {runtimeConnectedWallets.map((wallet) => {
                  const isActiveWallet =
                    defaultWalletAddress?.toLowerCase() ===
                    wallet.address.toLowerCase()
                  const networkMatchesRuntime =
                    wallet.networkKey === runtimeDefaultNetworkKey

                  return (
                    <div
                      className="rounded-xl border border-primary/20 bg-primary/5 p-4"
                      key={`connected-${wallet.address}`}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="space-y-2">
                          <p className="text-sm font-medium">Connected now</p>
                          <p className="break-all font-mono text-xs text-muted-foreground">
                            {wallet.address}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {isActiveWallet
                              ? "Boreal is using this wallet right now."
                              : "Connected in this browser session."}
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <StatusChip
                            label={formatNetworkKeyLabel(wallet.networkKey)}
                            tone={networkMatchesRuntime ? "success" : "muted"}
                          />
                          <StatusChip
                            label={
                              wallet.type === "solana" ? "Solana wallet" : "EVM wallet"
                            }
                            tone={networkMatchesRuntime ? "success" : "muted"}
                          />
                        </div>
                      </div>

                      {!networkMatchesRuntime ? (
                        <p className="mt-3 text-xs text-muted-foreground">
                          This wallet is connected, but it does not match Boreal&apos;s
                          active Solana network:{" "}
                          {formatNetworkKeyLabel(runtimeDefaultNetworkKey)}.
                        </p>
                      ) : (
                        <p className="mt-3 text-xs text-muted-foreground">
                          This wallet should appear below once Boreal finishes syncing
                          it to your account.
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : null}

            {runtimeConnectedWallets.length === 0 &&
            unsupportedConnectedWallets.length > 0 ? (
              <div className="mt-4 rounded-xl border border-dashed border-border px-4 py-5 text-sm text-muted-foreground">
                Boreal needs a {formatNetworkKeyLabel(runtimeDefaultNetworkKey)}{" "}
                wallet. Your current connected wallet
                {unsupportedConnectedWallets.length > 1 ? "s are" : " is"} on a
                different network, so Boreal will not use{" "}
                {unsupportedConnectedWallets.length > 1 ? "them" : "it"} for
                checkout or payouts.
              </div>
            ) : null}

            {walletAccounts.length === 0 ? (
              <div className="mt-4 rounded-xl border border-dashed border-border px-4 py-5 text-sm text-muted-foreground">
                {connectedWallets.length > 0
                  ? runtimeConnectedWallets.length > 0
                    ? "No Solana mainnet wallet is synced yet. Boreal is still syncing the connected wallet above."
                    : "No Solana mainnet wallet is connected or synced yet."
                  : "No Solana mainnet wallet is connected or synced yet."}
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {!hasRuntimeWallet ? (
                  <div className="rounded-xl border border-dashed border-border px-4 py-5 text-sm text-muted-foreground">
                    No Solana mainnet wallet is synced yet. Connected off-network wallets still appear below.
                  </div>
                ) : null}
                {sortedWalletAccounts.map((account) => {
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
                            {networkMatchesRuntime && account.isDefaultPayout
                              ? "Default payout wallet."
                              : networkMatchesRuntime && isActiveWallet
                                ? "Connected and ready."
                                : !networkMatchesRuntime
                                  ? "Saved on another network. Boreal will not use this for Solana work."
                                : "Synced to this account."}
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {networkMatchesRuntime && account.roles.includes("payout") ? (
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
                              {networkMatchesRuntime ? "Not payout-ready" : "Wrong network"}
                            </Button>
                          )}
                        </div>
                      </div>

                      {!networkMatchesRuntime ? (
                        <p className="mt-3 text-xs text-muted-foreground">
                          This wallet is synced, but it does not match Boreal&apos;s
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

function MerchantPathCard({
  action,
  body,
  eyebrow,
  isActive,
  title,
}: {
  action: ReactNode
  body: string
  eyebrow: string
  isActive: boolean
  title: string
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border p-4",
        isActive
          ? "border-primary/35 bg-primary/5"
          : "border-border bg-background"
      )}
    >
      <div className="space-y-3">
        <div className="space-y-1">
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            {eyebrow}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-medium">{title}</p>
            {isActive ? <StatusChip label="Current path" tone="default" /> : null}
          </div>
        </div>
        <p className="text-sm text-muted-foreground">{body}</p>
        <div>{action}</div>
      </div>
    </div>
  )
}

function OwnedOfferCard({
  action,
  description,
  sourceLabel,
  supply,
}: {
  action: ReactNode
  description: string
  sourceLabel: string
  supply: NonNullable<MyProfileRecord>["supplies"][number]
}) {
  return (
    <div className="rounded-2xl border border-border bg-background p-4">
      <div className="space-y-3">
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            <StatusChip label={sourceLabel} tone="muted" />
            <StatusChip
              label={supply.supplyType.replaceAll("_", " ")}
              tone="muted"
            />
            <StatusChip label={supply.status} tone="muted" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium">{supply.title}</p>
            {supply.subtitle ? (
              <p className="text-xs text-muted-foreground">{supply.subtitle}</p>
            ) : null}
          </div>
        </div>

        <p className="text-sm text-muted-foreground">
          {description || "No offer description yet."}
        </p>

        <div className="flex flex-wrap gap-2">
          <StatusChip label={supply.category} tone="muted" />
          {supply.priceAmount !== null ? (
            <StatusChip
              label={`$${supply.priceAmount.toFixed(0)} ${supply.priceType}`}
              tone="muted"
            />
          ) : (
            <StatusChip label={supply.priceType} tone="muted" />
          )}
          {supply.estimatedDeliveryLabel ? (
            <StatusChip label={supply.estimatedDeliveryLabel} tone="muted" />
          ) : null}
          {supply.executionSurface ? (
            <StatusChip label={supply.executionSurface} tone="muted" />
          ) : null}
        </div>

        <div>{action}</div>
      </div>
    </div>
  )
}

function isEditableMerchantSupply(
  supply: NonNullable<MyProfileRecord>["supplies"][number]
) {
  return !supply.sourceProviderKey || supply.sourceProviderKey === "manual"
}

function formatSourceProviderLabel(sourceProviderKey: string | null) {
  if (!sourceProviderKey) {
    return "manual"
  }

  return sourceProviderKey.replaceAll("-", " ")
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

      if (part === "testnet") {
        return "Testnet"
      }

      return part.charAt(0).toUpperCase() + part.slice(1)
    })
    .join(" ")
}
