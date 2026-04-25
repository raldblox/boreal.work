"use client"

import {
  useDeferredValue,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react"
import { useQuery } from "convex/react"
import {
  BotIcon,
  DownloadIcon,
  LoaderIcon,
  SearchIcon,
  ShoppingCartIcon,
  UserIcon,
} from "lucide-react"

import { BorealProfileView } from "@/components/profiles/boreal-profile-view"
import { ProfileView } from "@/components/profiles/profile-view"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  type CatalogEntry,
  convexFunctionRefs,
  type SidebarIntentPreview,
  type WorkerProfileDetail,
} from "@/lib/boreal/integrations/convex/function-refs"
import { cn } from "@/lib/utils"

import { RequestListCard } from "./request-list-card"
import type { RequestNavigationView } from "./request-notifications"

export type WorkspaceTab = "requests" | "workers"

type WorkspacePanelProps = {
  activeTab: WorkspaceTab
  onAddToCart: (supplyId: string) => Promise<void>
  onSelectRequest: (
    request: SidebarIntentPreview,
    view?: RequestNavigationView
  ) => void
  onTabChange: (value: WorkspaceTab) => void
  ownerExternalId?: string
}

const staticBorealProfile: NonNullable<WorkerProfileDetail> = {
  analytics: {
    activeCount: 0,
    activeSupplyCount: 0,
    activityBuckets: Array.from({ length: 10 }).map((_, index) => ({
      count: 0,
      label: `${index + 1}`,
    })),
    averageCompletionHours: null,
    averageRating: null,
    blockedCount: 0,
    buyerCheckoutCount: 0,
    fulfilledCount: 0,
    grossEarned: 0,
    grossSpend: 0,
    openCount: 0,
    productSupplyCount: 0,
    recentRequests: [],
    requestCount: 0,
    reviewCount: 0,
    sellerOrderCount: 0,
    supplyCount: 0,
    totalHandledCount: 0,
    totalProposalCount: 0,
    updatedAt: 0,
  },
  profile: {
    _id: "boreal-agent",
    actorKind: "agent",
    availabilityStatus: "available",
    avatarUrl: null,
    bio: "Boreal Agent is the default orchestration worker. It extracts intent, routes tools, manages approvals, and fulfills supported requests through one unified runtime.",
    capabilityTags: [
      "intent extraction",
      "chat assistance",
      "catalog search",
      "image generation",
      "speech generation",
      "video job orchestration",
    ],
    displayName: "Boreal Agent",
    handle: "boreal",
    headline: "Default orchestration worker",
    isMine: false,
    isPublic: true,
    productLabels: ["routing", "content generation", "request ops"],
    skillTags: ["llm routing", "tool orchestration", "asset generation"],
  },
  supplies: [],
}

export function WorkspacePanel({
  activeTab,
  onAddToCart,
  onSelectRequest,
  onTabChange,
  ownerExternalId,
}: WorkspacePanelProps) {
  const isMounted = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false
  )
  const [search, setSearch] = useState("")
  const deferredSearch = useDeferredValue(search.trim())
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(
    null
  )
  const [isBorealProfileOpen, setIsBorealProfileOpen] = useState(false)

  const searchedSupplyListings = useQuery(
    convexFunctionRefs.searchCatalog,
    activeTab === "workers" && deferredSearch
      ? {
          limit: 36,
          query: deferredSearch,
        }
      : "skip"
  )
  const defaultSupplyListings = useQuery(
    convexFunctionRefs.listCatalog,
    activeTab === "workers" && !deferredSearch
      ? {
          limit: 36,
        }
      : "skip"
  )
  const supplyListings = ((deferredSearch
    ? searchedSupplyListings
    : defaultSupplyListings) ?? []) as CatalogEntry[]
  const isWorkersLoading =
    activeTab === "workers" &&
    (deferredSearch
      ? searchedSupplyListings === undefined
      : defaultSupplyListings === undefined)
  const publicRequestsResult = useQuery(
    convexFunctionRefs.listMarketplaceIntents,
    {
      limit: 48,
      ownerExternalId,
      query:
        activeTab === "requests" && deferredSearch ? deferredSearch : undefined,
    }
  ) as SidebarIntentPreview[] | undefined
  const publicRequests = useMemo(
    () => publicRequestsResult ?? [],
    [publicRequestsResult]
  )
  const visiblePublicRequests = useMemo(
    () =>
      publicRequests.filter(
        (request) =>
          request.status !== "closed" && request.status !== "fulfilled"
      ),
    [publicRequests]
  )
  const isRequestsLoading =
    activeTab === "requests" && publicRequestsResult === undefined
  const borealStats = useQuery(convexFunctionRefs.getBorealAgentStats, {})
  const selectedProfile = useQuery(
    convexFunctionRefs.getPublicProfile,
    selectedProfileId && selectedProfileId !== "boreal-agent"
      ? { ownerExternalId, profileId: selectedProfileId }
      : "skip"
  ) as WorkerProfileDetail | undefined

  const selectedProfileDetail = useMemo(() => {
    if (selectedProfileId === "boreal-agent") {
      return staticBorealProfile
    }

    return selectedProfile
  }, [selectedProfile, selectedProfileId])

  if (!isMounted) {
    return (
      <aside className="flex min-h-0 flex-col overflow-hidden border border-border bg-background">
        <div className="flex h-16 items-center border-b border-border px-4">
          <div className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-lg border border-border bg-background">
              <SearchIcon className="size-4 text-muted-foreground" />
            </span>
            <h2 className="text-sm font-medium">Discovery</h2>
          </div>
        </div>
      </aside>
    )
  }

  return (
    <>
      <aside className="flex h-full flex-col overflow-hidden border border-border bg-background">
        <Tabs
          className="min-h-0 flex-1 gap-0"
          onValueChange={(value) => onTabChange(value as WorkspaceTab)}
          value={activeTab}
        >
          <div className="flex h-16 items-center border-b border-border px-4">
            <div className="flex items-center gap-3">
              <span className="flex size-9 items-center justify-center rounded-lg border border-border bg-background">
                <SearchIcon className="size-4 text-muted-foreground" />
              </span>
              <h2 className="text-sm font-medium">Discovery</h2>
            </div>
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
                      key={listing._id}
                      listing={listing}
                      onAddToCart={onAddToCart}
                      onOpenSellerProfile={(profileId) => {
                        setSelectedProfileId(profileId)
                        setIsBorealProfileOpen(profileId === "boreal-agent")
                      }}
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

      <Dialog
        onOpenChange={(open) => {
          if (!open) {
            setSelectedProfileId(null)
            setIsBorealProfileOpen(false)
          }
        }}
        open={Boolean(selectedProfileId)}
      >
        <DialogContent className="h-[min(88svh,54rem)] max-w-[min(68rem,calc(100vw-2rem))] gap-0 overflow-hidden border border-border bg-background p-0 text-foreground shadow-2xl sm:max-w-[min(68rem,calc(100vw-2rem))]">
          <DialogHeader className="sr-only">
            <DialogTitle>Worker profile</DialogTitle>
          </DialogHeader>
          <div className="h-full overflow-auto bg-background">
            {selectedProfileDetail ? (
              isBorealProfileOpen ? (
                <BorealProfileView stats={borealStats} />
              ) : (
                <ProfileView
                  detail={selectedProfileDetail}
                  showProfileLink={!isBorealProfileOpen}
                />
              )
            ) : (
              <ProfileDialogLoader />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
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
  listing,
  onAddToCart,
  onOpenSellerProfile,
}: {
  listing: CatalogEntry
  onAddToCart: (supplyId: string) => Promise<void>
  onOpenSellerProfile: (profileId: string) => void
}) {
  const Icon = listing.actorKind === "agent" ? BotIcon : UserIcon

  return (
    <div className="space-y-3 border border-transparent p-3 transition-colors hover:border-border hover:bg-foreground/5">
      <div className="flex items-start gap-3">
        <div className="flex size-10 items-center justify-center border border-border">
          <Icon className="size-4 text-muted-foreground" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-medium">{listing.title}</p>
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
          {listing.subtitle ? (
            <p className="mt-1 text-xs">{listing.subtitle}</p>
          ) : null}
          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
            {listing.description}
          </p>
          {listing.seller?.displayName ? (
            <p className="mt-2 text-xs text-muted-foreground">
              By {listing.seller.displayName}
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
            {listing.isCartEnabled ? (
              <Button
                onClick={() => void onAddToCart(listing._id)}
                size="sm"
                type="button"
              >
                <ShoppingCartIcon />
                Add to cart
              </Button>
            ) : null}
            {listing.executorUrl && listing.fulfillmentKind === "digital" ? (
              <Button asChild size="sm" type="button" variant="outline">
                <a href={listing.executorUrl} rel="noreferrer" target="_blank">
                  <DownloadIcon />
                  Preview
                </a>
              </Button>
            ) : null}
            {listing.seller?.profileId ? (
              <Button
                onClick={() => onOpenSellerProfile(listing.seller!.profileId!)}
                size="sm"
                type="button"
                variant="ghost"
              >
                View seller
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
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
        <LoaderIcon className="size-4 animate-spin" />
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

function ProfileDialogLoader() {
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <LoaderIcon className="size-4 animate-spin" />
        <span>Loading profile</span>
      </div>
      <div className="space-y-4">
        <div className="h-16 w-16 animate-pulse rounded-2xl border border-border bg-muted/50" />
        <div className="space-y-2">
          <div className="h-7 w-48 animate-pulse bg-muted/55" />
          <div className="h-4 w-5/6 animate-pulse bg-muted/40" />
          <div className="h-4 w-2/3 animate-pulse bg-muted/30" />
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            className="space-y-2 border border-border/60 bg-background px-4 py-4"
            key={index}
          >
            <div className="h-3 w-24 animate-pulse bg-muted/35" />
            <div className="h-6 w-20 animate-pulse bg-muted/55" />
          </div>
        ))}
      </div>
    </div>
  )
}
