"use client"

import {
  useDeferredValue,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react"
import {
  PackageIcon,
  SearchIcon,
  BotIcon,
} from "lucide-react"

import { AgentIdentityIcon } from "@/components/ui/agent-identity-icon"
import { Button } from "@/components/ui/button"
import { DotMatrixSpinner } from "@/components/ui/dotmatrix-spinner"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { usePublicMarketCache } from "@/components/shell-data-provider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  type CatalogEntry,
  type SidebarIntentPreview,
} from "@/lib/boreal/integrations/convex/function-refs"
import {
  BOREAL_AGENT_BIO,
  BOREAL_AGENT_CAPABILITY_TAGS,
  BOREAL_AGENT_DIRECT_SUPPLY_ID,
  BOREAL_AGENT_DISCOVERY_ALIASES,
  BOREAL_AGENT_DISPLAY_NAME,
  BOREAL_AGENT_HEADLINE,
  BOREAL_AGENT_PROFILE_ID,
} from "@/lib/boreal/boreal-agent"
import {
  getAutonomousAgentKeyFromSourceCapabilityId,
  getPublicReadySpecialistMetaBySourceCapabilityId,
  isPublicReadySpecialistKey,
} from "@/lib/boreal/agents/public-ready-specialists"
import { cn } from "@/lib/utils"

import { RequestListCard } from "./request-list-card"
import type { RequestNavigationView } from "./request-notifications"

export type WorkspaceTab = "requests" | "workers"

type WorkspacePanelProps = {
  activeTab: WorkspaceTab
  isBorealDefaultMounted?: boolean
  mountedAgentSupplyIds?: string[]
  onInviteLocalRuntime?: () => void
  onInvokeListing?: (listing: CatalogEntry) => void
  onSelectRequest: (
    request: SidebarIntentPreview,
    view?: RequestNavigationView
  ) => void
  onTabChange: (value: WorkspaceTab) => void
  onViewProfile: (profileId: string) => void
  ownerExternalId?: string
  showInviteLocalRuntime?: boolean
}

export function WorkspacePanel({
  activeTab,
  isBorealDefaultMounted = true,
  mountedAgentSupplyIds = [],
  onInviteLocalRuntime,
  onInvokeListing,
  onSelectRequest,
  onTabChange,
  onViewProfile,
  ownerExternalId,
  showInviteLocalRuntime = false,
}: WorkspacePanelProps) {
  const isMounted = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false
  )
  const [search, setSearch] = useState("")
  const deferredSearch = useDeferredValue(search.trim())

  const workersMarket = usePublicMarketCache({
    enabled: activeTab === "workers",
    limit: 36,
    query: deferredSearch,
    tab: "workers",
  })
  const supplyListings = useMemo(() => {
    const fetchedListings = (workersMarket.data ?? []) as CatalogEntry[]
    const normalizedQuery = deferredSearch.toLowerCase()
    const spotlightMatches =
      normalizedQuery.length === 0 ||
      matchesCatalogListing(BOREAL_AGENT_HUMAN_OPTIMIZER, normalizedQuery)
    const mergedListings = spotlightMatches
      ? [
          BOREAL_AGENT_HUMAN_OPTIMIZER,
          ...fetchedListings.filter(
            (listing) => listing._id !== BOREAL_AGENT_HUMAN_OPTIMIZER._id
          ),
        ]
      : fetchedListings

    return mergedListings
      .filter(shouldSurfaceMarketListing)
      .sort(compareDiscoverySupplyListings)
  }, [deferredSearch, workersMarket.data])
  const isWorkersLoading = activeTab === "workers" && workersMarket.isLoading
  const requestsMarket = usePublicMarketCache({
    enabled: activeTab === "requests",
    limit: 48,
    query: deferredSearch,
    tab: "requests",
  })
  const publicRequests = useMemo(
    () => (requestsMarket.data ?? []) as SidebarIntentPreview[],
    [requestsMarket.data]
  )
  const visiblePublicRequests = useMemo(
    () =>
      publicRequests.filter(
        (request) =>
          request.status !== "closed" && request.status !== "fulfilled"
      ),
    [publicRequests]
  )
  const isRequestsLoading = activeTab === "requests" && requestsMarket.isLoading

  if (!isMounted) {
    return (
      <aside className="flex min-h-0 flex-col overflow-hidden border border-border bg-background">
        <div className="flex h-16 items-center border-b border-border px-4">
          <MarketHeaderPill />
        </div>
      </aside>
    )
  }

  return (
    <aside className="flex h-full flex-col overflow-hidden border border-border bg-background">
        <Tabs
          className="min-h-0 flex-1 gap-0"
          onValueChange={(value) => onTabChange(value as WorkspaceTab)}
          value={activeTab}
        >
          <div className="flex h-16 items-center border-b border-border px-4">
            <MarketHeaderPill />
          </div>

          <div className="space-y-3 border-b border-border p-3">
            <TabsList className="h-auto w-full" variant="button">
              <TabsTrigger className="flex-1" value="workers">
                Offers
              </TabsTrigger>
              <TabsTrigger className="flex-1" value="requests">
                Requests
              </TabsTrigger>
            </TabsList>

            <div className="relative">
              <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="h-9 pl-9"
                onChange={(event) => setSearch(event.target.value)}
                placeholder={
                  activeTab === "workers"
                    ? "Search offers, services, products, or workers"
                    : "Search requests, asks, or unresolved work"
                }
                value={search}
              />
            </div>

            {activeTab === "workers" && showInviteLocalRuntime ? (
              <Button
                className="w-full"
                onClick={onInviteLocalRuntime}
                size="sm"
                type="button"
                variant="outline"
              >
                <BotIcon className="size-4" />
                Invite local runtime
              </Button>
            ) : null}
          </div>

          <TabsContent className="min-h-0" value="workers">
            <ScrollArea className="h-full">
              <div className="space-y-0.5 p-1">
                {isWorkersLoading ? (
                  <DiscoveryPanelLoader
                    subtitle={
                      deferredSearch
                        ? "Searching public offers..."
                        : "Loading public offers..."
                    }
                    variant="workers"
                  />
                ) : supplyListings.length === 0 ? (
                  <EmptyBlock
                    subtitle="Offers will appear here once people publish services, products, or packaged capabilities."
                    title="No public offers yet"
                  />
                ) : (
                  supplyListings.map((listing) => (
                    <SupplyCard
                      isBorealDefaultMounted={isBorealDefaultMounted}
                      isMounted={mountedAgentSupplyIds.includes(listing._id)}
                      key={listing._id}
                      listing={listing}
                      onInvokeListing={onInvokeListing}
                      onViewProfile={onViewProfile}
                    />
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent className="min-h-0" value="requests">
            <ScrollArea className="h-full">
              <div className="space-y-0.5 p-1">
                {isRequestsLoading ? (
                  <DiscoveryPanelLoader
                    subtitle={
                      deferredSearch
                        ? "Searching public requests..."
                        : "Loading public requests..."
                    }
                    variant="requests"
                  />
                ) : visiblePublicRequests.length === 0 ? (
                  <EmptyBlock
                    subtitle="Open public asks and unresolved work will appear here."
                    title="No public requests found"
                  />
                ) : (
                  visiblePublicRequests.map((request) => (
                    <RequestListCard
                      key={request._id}
                      intent={request}
                      onOpen={onSelectRequest}
                    />
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
    </aside>
  )
}

function MarketHeaderPill() {
  return (
    <div className="inline-flex items-center gap-2 text-sm font-medium text-foreground">
      <PackageIcon className="size-4 text-muted-foreground" />
      <span>Market</span>
    </div>
  )
}

function getMatchScoreTone(score: number | null) {
  if (score === null) {
    return "text-muted-foreground"
  }

  if (score >= 80) {
    return "text-primary"
  }

  if (score >= 65) {
    return "text-primary/80"
  }

  if (score >= 50) {
    return "text-primary"
  }

  return "text-muted-foreground"
}

function SupplyCard({
  isBorealDefaultMounted,
  isMounted,
  listing,
  onInvokeListing,
  onViewProfile,
}: {
  isBorealDefaultMounted: boolean
  isMounted: boolean
  listing: CatalogEntry
  onInvokeListing?: (listing: CatalogEntry) => void
  onViewProfile: (profileId: string) => void
}) {
  const profileId = listing.seller?.profileId ?? null
  const specialistMeta = getPublicReadySpecialistMetaBySourceCapabilityId(
    listing.sourceCapabilityId
  )
  const supportsTeamSelect = canSelectAgentListing(listing) && !!onInvokeListing
  const isProfileClickable = Boolean(profileId)
  const isDefaultBorealCard =
    listing._id === BOREAL_AGENT_DIRECT_SUPPLY_ID && isBorealDefaultMounted
  const displayTitle = specialistMeta?.displayName ?? listing.title
  const displaySubtitle = specialistMeta?.headline ?? listing.subtitle
  const displayDescription =
    specialistMeta?.supplyDescription ?? listing.description
  const displaySellerName =
    specialistMeta?.displayName ?? listing.seller?.displayName ?? null
  const runtimeLabel = specialistMeta
    ? `${specialistMeta.providerCompany} • ${specialistMeta.model}`
    : null
  const selectionLabel = isDefaultBorealCard
    ? "Default in chat"
    : isMounted
      ? "Selected in chat"
      : null
  const selectionButtonLabel = isDefaultBorealCard
    ? "Default"
    : listing._id === BOREAL_AGENT_DIRECT_SUPPLY_ID
      ? "Switch to Boreal"
      : isMounted
        ? "Remove"
        : "Select"

  return (
    <div
      aria-label={isProfileClickable ? `Open ${displayTitle} profile` : undefined}
      className={cn(
        "space-y-3 border border-transparent p-3 transition-colors",
        (isMounted || isDefaultBorealCard) && "border-accent bg-accent/5",
        isProfileClickable && "cursor-pointer hover:border-border hover:bg-foreground/5 focus-visible:border-border focus-visible:bg-foreground/5 focus-visible:outline-none"
      )}
      onClick={isProfileClickable ? () => onViewProfile(profileId!) : undefined}
      onKeyDown={
        isProfileClickable
          ? (event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault()
                onViewProfile(profileId!)
              }
            }
          : undefined
      }
      role={isProfileClickable ? "button" : undefined}
      tabIndex={isProfileClickable ? 0 : undefined}
    >
      <div className="flex items-start gap-3">
        <div className="flex size-10 items-center justify-center border border-border">
          <AgentIdentityIcon
            actorKind={listing.actorKind}
            className="size-4 text-muted-foreground"
            displayName={displaySellerName ?? displayTitle}
            title={displayTitle}
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-medium">{displayTitle}</p>
            {selectionLabel ? (
              <span className="text-[11px] tracking-[0.16em] text-accent-foreground uppercase">
                {selectionLabel}
              </span>
            ) : null}
            {listing.matchScore !== null ? (
              <span
                className={cn(
                  "text-[11px] tracking-[0.16em] uppercase",
                  getMatchScoreTone(listing.matchScore)
                )}
              >
                {listing.matchScore}% match
              </span>
            ) : null}
            <span className="text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
              {listing.fulfillmentKind}
            </span>
          </div>
          {displaySubtitle ? (
            <p className="mt-1 text-xs">{displaySubtitle}</p>
          ) : null}
          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
            {displayDescription}
          </p>
          {runtimeLabel ? (
            <p className="mt-2 text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
              Runtime: {runtimeLabel}
            </p>
          ) : null}
          {displaySellerName ? (
            <p className="mt-2 text-xs text-muted-foreground">
              By {displaySellerName}
            </p>
          ) : null}
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
            <span>{listing.category}</span>
            <span>{listing.deliveryType}</span>
            <span>
              {listing.priceAmount === null
                ? "Custom"
                : `${listing.currency} ${listing.priceAmount}/${listing.priceType}`}
            </span>
            {listing.estimatedDeliveryLabel ? (
              <span>{listing.estimatedDeliveryLabel}</span>
            ) : null}
            {typeof listing.averageRating === "number" ? (
              <span>
                {listing.averageRating.toFixed(1)} stars
                {listing.reviewCount > 0
                  ? ` · ${listing.reviewCount} reviews`
                  : ""}
              </span>
            ) : null}
          </div>
          {listing.matchReasons.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {listing.matchReasons.map((reason) => (
                <span
                  className="inline-flex items-center border border-border px-2 py-1 text-[11px] tracking-[0.16em] text-muted-foreground uppercase"
                  key={reason}
                >
                  {reason}
                </span>
              ))}
            </div>
          ) : null}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {supportsTeamSelect ? (
              <Button
                onClick={(event) => {
                  event.stopPropagation()
                  onInvokeListing?.(listing)
                }}
                size="sm"
                type="button"
                variant={isMounted || isDefaultBorealCard ? "default" : "outline"}
              >
                {selectionButtonLabel}
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}

const BOREAL_AGENT_HUMAN_OPTIMIZER: CatalogEntry = {
  _id: BOREAL_AGENT_DIRECT_SUPPLY_ID,
  actorKind: "agent",
  averageRating: null,
  brand: "Boreal",
  capabilityTags: [...BOREAL_AGENT_CAPABILITY_TAGS],
  category: "operations",
  checkoutProtocol: null,
  currency: "USD",
  deliveryType: "instant",
  description: BOREAL_AGENT_BIO,
  estimatedDeliveryLabel: "Instant draft",
  executionSurface: "sdk",
  executorUrl: null,
  fulfillmentKind: "service",
  gatedOutReasons: [],
  isCartEnabled: false,
  isPinned: true,
  matchReasons: [],
  matchScore: null,
  matchStage: null,
  paymentNetworkHints: [],
  paymentProtocol: "none",
  priceAmount: 0,
  priceType: "fixed",
  requiresHumanApproval: false,
  reviewCount: 0,
  seller: {
    actorKind: "agent",
    displayName: BOREAL_AGENT_DISPLAY_NAME,
    handle: null,
    profileId: BOREAL_AGENT_PROFILE_ID,
  },
  sourceCapabilityId: "autonomous-agent:boreal-agent",
  sourceListingUrl: null,
  sourceProviderKey: "manual",
  subtitle: BOREAL_AGENT_HEADLINE,
  supplyType: "capability",
  supportsDirectInvoke: true,
  supportsPrivyWallet: true,
  successProbability: 100,
  title: BOREAL_AGENT_DISPLAY_NAME,
  trustScore: 96,
}

const SOLANA_OPERATOR_DISCOVERY_ALIASES = [
  "solana operator",
  "solana specialist",
  "swap plan",
  "staking checklist",
  "wallet approvals",
] as const

function compareDiscoverySupplyListings(left: CatalogEntry, right: CatalogEntry) {
  const leftPriority = getDiscoverySupplyPriority(left)
  const rightPriority = getDiscoverySupplyPriority(right)

  if (leftPriority !== rightPriority) {
    return leftPriority - rightPriority
  }

  if (left.matchScore !== right.matchScore) {
    return (right.matchScore ?? -1) - (left.matchScore ?? -1)
  }

  return left.title.localeCompare(right.title)
}

function getDiscoverySupplyPriority(listing: CatalogEntry) {
  if (listing._id === BOREAL_AGENT_DIRECT_SUPPLY_ID) {
    return 0
  }

  if (isSolanaOperatorListing(listing)) {
    return 1
  }

  if (listing.seller?.profileId === BOREAL_AGENT_PROFILE_ID) {
    return 2
  }

  return 3
}

function matchesCatalogListing(listing: CatalogEntry, normalizedQuery: string) {
  const aliases =
    listing._id === BOREAL_AGENT_DIRECT_SUPPLY_ID
      ? BOREAL_AGENT_DISCOVERY_ALIASES
      : isSolanaOperatorListing(listing)
        ? SOLANA_OPERATOR_DISCOVERY_ALIASES
        : []
  const haystack = [
    listing.title,
    listing.subtitle,
    listing.description,
    listing.category,
    listing.seller?.displayName,
    ...listing.capabilityTags,
    ...aliases,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()

  return haystack.includes(normalizedQuery)
}

function isSolanaOperatorListing(listing: CatalogEntry) {
  const haystack = [
    listing.title,
    listing.subtitle,
    listing.description,
    listing.category,
    listing.seller?.displayName,
    listing.seller?.handle,
    ...listing.capabilityTags,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()

  return (
    haystack.includes("solana operator") ||
    haystack.includes("agent:solana-operator") ||
    (haystack.includes("solana") &&
      (haystack.includes("swap") ||
        haystack.includes("stake") ||
        haystack.includes("staking") ||
        haystack.includes("wallet")))
  )
}

function canSelectAgentListing(listing: CatalogEntry) {
  if (listing._id === BOREAL_AGENT_DIRECT_SUPPLY_ID) {
    return true
  }

  return (
    listing.actorKind === "agent" &&
    listing.supportsDirectInvoke &&
    typeof listing.sourceCapabilityId === "string" &&
    listing.sourceCapabilityId.startsWith("autonomous-agent:")
  )
}

function shouldSurfaceMarketListing(listing: CatalogEntry) {
  if (listing._id === BOREAL_AGENT_DIRECT_SUPPLY_ID) {
    return true
  }

  const directAgentKey = getAutonomousAgentKeyFromSourceCapabilityId(
    listing.sourceCapabilityId
  )

  if (!directAgentKey) {
    return true
  }

  return isPublicReadySpecialistKey(directAgentKey)
}

function EmptyBlock({ subtitle, title }: { subtitle: string; title: string }) {
  return (
    <div className="border border-dashed border-border p-6 text-center">
      <div className="mx-auto flex size-9 items-center justify-center border border-border">
        <SearchIcon className="size-4 text-muted-foreground" />
      </div>
      <p className="mt-4 text-sm font-medium">{title}</p>
      <p className="mt-2 text-xs text-muted-foreground">{subtitle}</p>
    </div>
  )
}

function DiscoveryPanelLoader({
  subtitle,
  variant,
}: {
  subtitle: string
  variant: WorkspaceTab
}) {
  return (
    <div className="space-y-3 p-2">
      <div className="flex items-center gap-2 border border-border/70 bg-background px-3 py-2.5 text-xs text-muted-foreground">
        <DotMatrixSpinner className="text-muted-foreground" />
        <span>{subtitle}</span>
      </div>

      {Array.from({ length: 4 }).map((_, index) => (
        <div
          className="space-y-3 border border-border/40 bg-background px-3 py-3"
          key={`${variant}-${index}`}
        >
          <div className="flex items-start gap-3">
            <div className="size-10 shrink-0 animate-pulse border border-border bg-muted/50" />
            <div className="min-w-0 flex-1 space-y-2.5">
              <div className="flex flex-wrap gap-2">
                <div className="h-4 w-32 animate-pulse bg-muted/60" />
                <div className="h-4 w-[4.5rem] animate-pulse bg-muted/40" />
              </div>
              <div className="h-3 w-5/6 animate-pulse bg-muted/45" />
              <div className="h-3 w-2/3 animate-pulse bg-muted/35" />
              {variant === "workers" ? (
                <>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <div className="h-3 w-16 animate-pulse bg-muted/35" />
                    <div className="h-3 w-20 animate-pulse bg-muted/35" />
                    <div className="h-3 w-24 animate-pulse bg-muted/35" />
                  </div>
                  <div className="flex gap-2 pt-1">
                    <div className="h-8 w-24 animate-pulse border border-border bg-muted/35" />
                    <div className="h-8 w-20 animate-pulse border border-border bg-muted/25" />
                  </div>
                </>
              ) : (
                <div className="flex flex-wrap gap-2 pt-1">
                  <div className="h-3 w-[4.5rem] animate-pulse bg-muted/35" />
                  <div className="h-3 w-24 animate-pulse bg-muted/35" />
                  <div className="h-3 w-14 animate-pulse bg-muted/35" />
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
