"use client";

import {
  useDeferredValue,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import { useQuery } from "convex/react";
import {
  BotIcon,
  DownloadIcon,
  LoaderIcon,
  PackageIcon,
  SearchIcon,
  ShoppingCartIcon,
  UserIcon,
} from "lucide-react";

import { BorealProfileView } from "@/components/profiles/boreal-profile-view";
import { ProfileView } from "@/components/profiles/profile-view";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  type CatalogEntry,
  convexFunctionRefs,
  type SidebarIntentPreview,
  type WorkerProfileDetail,
} from "@/lib/boreal/integrations/convex/function-refs";

export type WorkspaceTab = "requests" | "workers";

type WorkspacePanelProps = {
  activeTab: WorkspaceTab;
  onAddToCart: (supplyId: string) => Promise<void>;
  onSelectRequest: (request: SidebarIntentPreview) => void;
  onTabChange: (value: WorkspaceTab) => void;
  ownerExternalId?: string;
};

const staticBorealProfile: NonNullable<WorkerProfileDetail> = {
  analytics: {
    activeCount: 0,
    activityBuckets: Array.from({ length: 10 }).map((_, index) => ({
      count: 0,
      label: `${index + 1}`,
    })),
    averageCompletionHours: null,
    averageRating: null,
    blockedCount: 0,
    fulfilledCount: 0,
    openCount: 0,
    recentRequests: [],
    reviewCount: 0,
    totalHandledCount: 0,
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
};

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
    () => false,
  );
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search.trim());
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [isBorealProfileOpen, setIsBorealProfileOpen] = useState(false);

  const searchedSupplyListings = useQuery(
    convexFunctionRefs.searchCatalog,
    activeTab === "workers" && deferredSearch
      ? {
          limit: 36,
          query: deferredSearch,
        }
      : "skip",
  );
  const defaultSupplyListings = useQuery(
    convexFunctionRefs.listCatalog,
    activeTab === "workers" && !deferredSearch
      ? {
          limit: 36,
        }
      : "skip",
  );
  const supplyListings =
    ((deferredSearch ? searchedSupplyListings : defaultSupplyListings) ?? []) as CatalogEntry[];
  const publicRequests =
    (useQuery(convexFunctionRefs.listMarketplaceIntents, {
      limit: 48,
      ownerExternalId,
      query: activeTab === "requests" && deferredSearch ? deferredSearch : undefined,
    }) ?? []) as SidebarIntentPreview[];
  const borealStats = useQuery(convexFunctionRefs.getBorealAgentStats, {});
  const selectedProfile = useQuery(
    convexFunctionRefs.getPublicProfile,
    selectedProfileId && selectedProfileId !== "boreal-agent"
      ? { ownerExternalId, profileId: selectedProfileId }
      : "skip",
  ) as WorkerProfileDetail;

  const selectedProfileDetail = useMemo(() => {
    if (selectedProfileId === "boreal-agent") {
      return staticBorealProfile;
    }

    return selectedProfile;
  }, [selectedProfile, selectedProfileId]);

  if (!isMounted) {
    return (
      <aside className="flex min-h-0 flex-col overflow-hidden border border-border">
        <div className="border-b border-border px-4 py-4">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
            Directory
          </p>
          <h2 className="mt-2 text-sm font-medium">Loading public surface</h2>
        </div>
      </aside>
    );
  }

  return (
    <>
      <aside className="flex h-full flex-col overflow-hidden border border-border">
        <Tabs
          className="min-h-0 flex-1 gap-0"
          onValueChange={(value) => onTabChange(value as WorkspaceTab)}
          value={activeTab}
        >
          <div className="space-y-4 p-3">
            <div className="space-y-1 px-1">
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                Market
              </p>
              <h2 className="text-sm font-medium">Public supply and requests</h2>
              <p className="text-xs text-muted-foreground">
                Discovery stays here. Execution stays in the center workspace.
              </p>
            </div>

            <TabsList className="w-full" variant="line">
              <TabsTrigger value="workers">Supply</TabsTrigger>
              <TabsTrigger value="requests">Requests</TabsTrigger>
            </TabsList>

            <div className="relative">
              <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="h-9 pl-9"
                onChange={(event) => setSearch(event.target.value)}
                placeholder={
                  activeTab === "workers"
                    ? "Search products, services, capabilities, or tools"
                    : "Search requests, asks, or unresolved work"
                }
                value={search}
              />
            </div>
          </div>

          <TabsContent className="min-h-0" value="workers">
            <ScrollArea className="h-full">
              <div className="space-y-0.5 p-1">
                {supplyListings.length === 0 ? (
                  <EmptyBlock
                    subtitle="Listings will appear here once public supply is published."
                    title="No public supply yet"
                  />
                ) : (
                  supplyListings.map((listing) => (
                    <SupplyCard
                      key={listing._id}
                      listing={listing}
                      onAddToCart={onAddToCart}
                      onOpenSellerProfile={(profileId) => {
                        setSelectedProfileId(profileId);
                        setIsBorealProfileOpen(profileId === "boreal-agent");
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
                {publicRequests.length === 0 ? (
                  <EmptyBlock
                    subtitle="Public asks, open requests, and unresolved intents will appear here."
                    title="No public requests found"
                  />
                ) : (
                  publicRequests.map((request) => (
                    <RequestCard key={request._id} onSelect={onSelectRequest} request={request} />
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
            setSelectedProfileId(null);
            setIsBorealProfileOpen(false);
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
              <div className="flex items-center gap-2 p-6 text-sm text-muted-foreground">
                <LoaderIcon className="size-4 animate-spin" />
                <span>Loading profile</span>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function SupplyCard({
  listing,
  onAddToCart,
  onOpenSellerProfile,
}: {
  listing: CatalogEntry;
  onAddToCart: (supplyId: string) => Promise<void>;
  onOpenSellerProfile: (profileId: string) => void;
}) {
  const Icon = listing.actorKind === "agent" ? BotIcon : UserIcon;

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
              <span className="text-[11px] uppercase tracking-[0.16em] text-teal-700 dark:text-teal-300">
                {listing.matchScore}% match
              </span>
            ) : null}
            <span className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
              {listing.fulfillmentKind}
            </span>
          </div>
          {listing.subtitle ? <p className="mt-1 text-xs">{listing.subtitle}</p> : null}
          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{listing.description}</p>
          {listing.seller?.displayName ? (
            <p className="mt-2 text-xs text-muted-foreground">By {listing.seller.displayName}</p>
          ) : null}
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
            <span>{listing.category}</span>
            <span>{listing.deliveryType}</span>
            <span>
              {listing.priceAmount === null
                ? "Custom"
                : `${listing.currency} ${listing.priceAmount}/${listing.priceType}`}
            </span>
            {listing.estimatedDeliveryLabel ? <span>{listing.estimatedDeliveryLabel}</span> : null}
            {typeof listing.averageRating === "number" ? (
              <span>
                {listing.averageRating.toFixed(1)} stars
                {listing.reviewCount > 0 ? ` · ${listing.reviewCount} reviews` : ""}
              </span>
            ) : null}
          </div>
          {listing.matchReasons.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {listing.matchReasons.map((reason) => (
                <span
                  className="inline-flex items-center border border-border px-2 py-1 text-[11px] uppercase tracking-[0.16em] text-muted-foreground"
                  key={reason}
                >
                  {reason}
                </span>
              ))}
            </div>
          ) : null}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {listing.isCartEnabled ? (
              <Button onClick={() => void onAddToCart(listing._id)} size="sm" type="button">
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
  );
}

function RequestCard({
  onSelect,
  request,
}: {
  onSelect: (request: SidebarIntentPreview) => void;
  request: SidebarIntentPreview;
}) {
  return (
    <button
      className="w-full border border-transparent p-3 text-left transition-colors hover:border-border hover:bg-foreground/5"
      onClick={() => onSelect(request)}
      type="button"
    >
      <div className="flex items-start gap-3">
        <PackageIcon className="mt-0.5 size-4 text-muted-foreground" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">{request.title}</p>
          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{request.summary}</p>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
            <span>{request.category}</span>
            <span>{request.status.replaceAll("_", " ")}</span>
            <span>{request.isOwner ? "owner" : "open to propose"}</span>
          </div>
        </div>
      </div>
    </button>
  );
}

function EmptyBlock({
  subtitle,
  title,
}: {
  subtitle: string;
  title: string;
}) {
  return (
    <div className="border border-dashed border-border p-6 text-center">
      <div className="mx-auto flex size-9 items-center justify-center border border-border">
        <SearchIcon className="size-4 text-muted-foreground" />
      </div>
      <p className="mt-4 text-sm font-medium">{title}</p>
      <p className="mt-2 text-xs text-muted-foreground">{subtitle}</p>
    </div>
  );
}
