"use client";

import {
  useDeferredValue,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import Link from "next/link";
import { useMutation, useQuery } from "convex/react";
import {
  BotIcon,
  LoaderIcon,
  PackageIcon,
  SearchIcon,
  SparklesIcon,
  UserIcon,
} from "lucide-react";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  convexFunctionRefs,
  type MyProfileRecord,
  type PublicProfilePreview,
  type SidebarIntentPreview,
  type WorkerProfileDetail,
} from "@/lib/boreal/integrations/convex/function-refs";

export type WorkspaceTab = "profile" | "requests" | "workers";

type WorkspacePanelProps = {
  activeTab: WorkspaceTab;
  onSelectRequest: (request: SidebarIntentPreview) => void;
  onTabChange: (value: WorkspaceTab) => void;
  ownerDisplayName?: string;
  ownerExternalId?: string;
  ownerHandle?: string;
};

const staticBorealProfile: NonNullable<WorkerProfileDetail> = {
  profile: {
    _id: "boreal-agent",
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
  onSelectRequest,
  onTabChange,
  ownerDisplayName,
  ownerExternalId,
  ownerHandle,
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

  const publicProfiles =
    (useQuery(convexFunctionRefs.listPublicProfiles, {
      limit: 36,
      ownerExternalId,
      query: activeTab === "workers" && deferredSearch ? deferredSearch : undefined,
    }) ?? []) as PublicProfilePreview[];
  const publicRequests =
    (useQuery(convexFunctionRefs.listMarketplaceIntents, {
      limit: 48,
      ownerExternalId,
      query: activeTab === "requests" && deferredSearch ? deferredSearch : undefined,
    }) ?? []) as SidebarIntentPreview[];
  const myProfile = useQuery(
    convexFunctionRefs.getMyProfile,
    ownerExternalId ? { ownerExternalId } : "skip",
  );
  const selectedProfile = useQuery(
    convexFunctionRefs.getPublicProfile,
    selectedProfileId && selectedProfileId !== "boreal-agent"
      ? { ownerExternalId, profileId: selectedProfileId }
      : "skip",
  ) as WorkerProfileDetail;

  const upsertMyProfile = useMutation(convexFunctionRefs.upsertMyProfile);
  const createSupplyEntry = useMutation(convexFunctionRefs.createSupplyEntry);

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
                Directory
              </p>
              <h2 className="text-sm font-medium">Public workers and open work</h2>
              <p className="text-xs text-muted-foreground">
                Discovery stays here. Request execution stays in the center workspace.
              </p>
            </div>



            <TabsList className="w-full" variant="line">
              <TabsTrigger value="workers">All workers</TabsTrigger>
              <TabsTrigger value="requests">All requests</TabsTrigger>
              <TabsTrigger value="profile">My profile</TabsTrigger>
            </TabsList>

            {activeTab !== "profile" ? (
              <div className="relative">
                <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="h-9 pl-9"
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder={
                    activeTab === "workers"
                      ? "Search workers, skills, or products"
                      : "Search public requests and unresolved intents"
                  }
                  value={search}
                />
              </div>
            ) : null}
          </div>

          <TabsContent className="min-h-0" value="workers">
            <ScrollArea className="h-full">
              <div className="space-y-0.5 p-1">
                <WorkerCard
                  onOpen={() => {
                    setSelectedProfileId("boreal-agent");
                    setIsBorealProfileOpen(true);
                  }}
                  profile={{
                    _id: "boreal-agent",
                    availabilityStatus: "available",
                    bio: staticBorealProfile.profile.bio,
                    capabilityTags: staticBorealProfile.profile.capabilityTags,
                    displayName: "Boreal Agent",
                    handle: "boreal",
                    headline: "Default orchestration worker",
                    isMine: false,
                    productLabels: staticBorealProfile.profile.productLabels,
                    skillTags: staticBorealProfile.profile.skillTags,
                    supplyCount: 0,
                  }}
                />
                {publicProfiles.length === 0 ? (
                  <EmptyBlock
                    subtitle="Worker profiles will appear here once people publish their public capabilities."
                    title="No public workers yet"
                  />
                ) : (
                  publicProfiles.map((profile) => (
                    <WorkerCard
                      key={profile._id}
                      onOpen={() => {
                        setSelectedProfileId(profile._id);
                        setIsBorealProfileOpen(false);
                      }}
                      profile={profile}
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

          <TabsContent className="min-h-0" value="profile">
            <ScrollArea className="h-full">
              <MyProfileTab
                createSupplyEntry={createSupplyEntry}
                key={buildProfileEditorKey(myProfile)}
                myProfile={myProfile}
                ownerDisplayName={ownerDisplayName}
                ownerExternalId={ownerExternalId}
                ownerHandle={ownerHandle}
                upsertMyProfile={upsertMyProfile}
              />
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
        <DialogContent className="max-w-4xl overflow-hidden p-0">
          <DialogHeader className="sr-only">
            <DialogTitle>Worker profile</DialogTitle>
          </DialogHeader>
          <div className="max-h-[85svh] overflow-auto">
            {selectedProfileDetail ? (
              <ProfileView
                detail={selectedProfileDetail}
                showProfileLink={!isBorealProfileOpen}
              />
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

function WorkerCard({
  onOpen,
  profile,
}: {
  onOpen: () => void;
  profile: PublicProfilePreview;
}) {
  return (
    <button
      className="w-full border border-transparent p-3 text-left transition-colors hover:border-border hover:bg-foreground/5"
      onClick={onOpen}
      type="button"
    >
      <div className="flex items-start gap-3">
        <div className="flex size-10 items-center justify-center border border-border">
          <BotIcon className="size-4 text-muted-foreground" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-medium">{profile.displayName}</p>
            <span className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
              {profile.availabilityStatus}
            </span>
            {profile.isMine ? (
              <span className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                me
              </span>
            ) : null}
          </div>
          {profile.headline ? <p className="mt-1 text-xs">{profile.headline}</p> : null}
          {profile.bio ? (
            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{profile.bio}</p>
          ) : null}
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
            <span>{profile.capabilityTags.slice(0, 2).join(" / ") || "worker"}</span>
            <span>{profile.supplyCount} entries</span>
          </div>
        </div>
      </div>
    </button>
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

function MyProfileTab({
  createSupplyEntry,
  myProfile,
  ownerDisplayName,
  ownerExternalId,
  ownerHandle,
  upsertMyProfile,
}: {
  createSupplyEntry: (args: {
    capabilityTags: string[];
    category: string;
    deliveryType: "async" | "instant" | "scheduled";
    description: string;
    ownerDisplayName?: string;
    ownerExternalId?: string;
    ownerHandle?: string;
    priceAmount?: number;
    priceType: "fixed" | "hourly" | "scoped";
    supplyType: "capability" | "collective" | "product";
    title: string;
  }) => Promise<{ created: boolean; supplyId: string | null }>;
  myProfile: MyProfileRecord | undefined;
  ownerDisplayName?: string;
  ownerExternalId?: string;
  ownerHandle?: string;
  upsertMyProfile: (args: {
    availabilityStatus: "available" | "limited" | "unavailable";
    bio?: string;
    capabilityTags: string[];
    headline?: string;
    isPublic: boolean;
    ownerDisplayName?: string;
    ownerExternalId?: string;
    ownerHandle?: string;
    productLabels: string[];
    skillTags: string[];
  }) => Promise<{ profileId: string | null; saved: boolean }>;
}) {
  const profile = myProfile?.profile;
  const [headline, setHeadline] = useState(profile?.headline ?? "");
  const [bio, setBio] = useState(profile?.bio ?? "");
  const [capabilityInput, setCapabilityInput] = useState(
    profile?.capabilityTags.join(", ") ?? "",
  );
  const [skillInput, setSkillInput] = useState(profile?.skillTags.join(", ") ?? "");
  const [productInput, setProductInput] = useState(
    profile?.productLabels.join(", ") ?? "",
  );
  const [availabilityStatus, setAvailabilityStatus] =
    useState<"available" | "limited" | "unavailable">(
      profile?.availabilityStatus ?? "available",
    );
  const [isPublic, setIsPublic] = useState(profile?.isPublic ?? true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileNotice, setProfileNotice] = useState<string | null>(null);

  const [supplyTitle, setSupplyTitle] = useState("");
  const [supplyDescription, setSupplyDescription] = useState("");
  const [supplyCategory, setSupplyCategory] = useState("services");
  const [supplyCapabilities, setSupplyCapabilities] = useState("");
  const [supplyDeliveryType, setSupplyDeliveryType] =
    useState<"async" | "instant" | "scheduled">("async");
  const [supplyPriceAmount, setSupplyPriceAmount] = useState("");
  const [supplyPriceType, setSupplyPriceType] =
    useState<"fixed" | "hourly" | "scoped">("fixed");
  const [supplyType, setSupplyType] =
    useState<"capability" | "collective" | "product">("capability");
  const [isSavingSupply, setIsSavingSupply] = useState(false);
  const [supplyNotice, setSupplyNotice] = useState<string | null>(null);

  async function handleSaveProfile() {
    if (!ownerExternalId) {
      setProfileNotice("Sign in with X first.");
      return;
    }

    setIsSavingProfile(true);
    setProfileNotice(null);

    try {
      await upsertMyProfile({
        availabilityStatus,
        bio: bio.trim() || undefined,
        capabilityTags: parseTagInput(capabilityInput),
        headline: headline.trim() || undefined,
        isPublic,
        ownerDisplayName,
        ownerExternalId,
        ownerHandle,
        productLabels: parseTagInput(productInput),
        skillTags: parseTagInput(skillInput),
      });
      setProfileNotice("Profile saved.");
    } catch (error) {
      setProfileNotice(
        error instanceof Error ? error.message : "Failed to save profile.",
      );
    } finally {
      setIsSavingProfile(false);
    }
  }

  async function handleCreateSupply() {
    if (!ownerExternalId) {
      setSupplyNotice("Sign in with X first.");
      return;
    }

    if (!supplyTitle.trim() || !supplyDescription.trim()) {
      setSupplyNotice("Title and description are required.");
      return;
    }

    setIsSavingSupply(true);
    setSupplyNotice(null);

    try {
      await createSupplyEntry({
        capabilityTags: parseTagInput(supplyCapabilities),
        category: supplyCategory.trim(),
        deliveryType: supplyDeliveryType,
        description: supplyDescription.trim(),
        ownerDisplayName,
        ownerExternalId,
        ownerHandle,
        priceAmount: supplyPriceAmount.trim() ? Number(supplyPriceAmount) : undefined,
        priceType: supplyPriceType,
        supplyType,
        title: supplyTitle.trim(),
      });

      setSupplyTitle("");
      setSupplyDescription("");
      setSupplyCategory("services");
      setSupplyCapabilities("");
      setSupplyPriceAmount("");
      setSupplyNotice("Supply entry created.");
    } catch (error) {
      setSupplyNotice(
        error instanceof Error ? error.message : "Failed to create supply entry.",
      );
    } finally {
      setIsSavingSupply(false);
    }
  }

  return (
    <div className="space-y-4 p-3">
      <section className="space-y-4 border border-border p-4">
        <div className="space-y-1">
          <p className="text-sm font-medium">Worker profile</p>
          <p className="text-xs text-muted-foreground">
            Publish what you can do so Boreal can match requests and proposals to your profile.
          </p>
        </div>

        <div className="space-y-3">
          <Input onChange={(event) => setHeadline(event.target.value)} placeholder="Headline" value={headline} />
          <Textarea onChange={(event) => setBio(event.target.value)} placeholder="Short bio" rows={4} value={bio} />
          <Input
            onChange={(event) => setCapabilityInput(event.target.value)}
            placeholder="Capabilities, comma separated"
            value={capabilityInput}
          />
          <Input
            onChange={(event) => setSkillInput(event.target.value)}
            placeholder="Skills, comma separated"
            value={skillInput}
          />
          <Input
            onChange={(event) => setProductInput(event.target.value)}
            placeholder="Products or offers, comma separated"
            value={productInput}
          />

          <div className="grid gap-3 md:grid-cols-2">
            <Select
              onValueChange={(value) =>
                setAvailabilityStatus(value as "available" | "limited" | "unavailable")
              }
              value={availabilityStatus}
            >
              <SelectTrigger>
                <SelectValue placeholder="Availability" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="limited">Limited</SelectItem>
                <SelectItem value="unavailable">Unavailable</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex h-9 items-center justify-between border border-border px-3">
              <span className="text-xs text-muted-foreground">Public profile</span>
              <Switch checked={isPublic} onCheckedChange={setIsPublic} />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            disabled={isSavingProfile}
            onClick={() => void handleSaveProfile()}
            size="sm"
            type="button"
          >
            {isSavingProfile ? <LoaderIcon className="animate-spin" /> : <UserIcon />}
            Save profile
          </Button>
          {profile?._id ? (
            <Button asChild size="sm" type="button" variant="outline">
              <Link href={`/p/${profile._id}`}>Open public view</Link>
            </Button>
          ) : null}
        </div>
        {profileNotice ? <p className="text-xs text-muted-foreground">{profileNotice}</p> : null}
      </section>

      <section className="space-y-4 border border-border p-4">
        <div className="space-y-1">
          <p className="text-sm font-medium">Supply-side entry</p>
          <p className="text-xs text-muted-foreground">
            Add a concrete product, capability, or scoped offer for public discovery.
          </p>
        </div>

        <div className="space-y-3">
          <Input onChange={(event) => setSupplyTitle(event.target.value)} placeholder="Entry title" value={supplyTitle} />
          <Textarea
            onChange={(event) => setSupplyDescription(event.target.value)}
            placeholder="Describe what you deliver"
            rows={4}
            value={supplyDescription}
          />
          <div className="grid gap-3 md:grid-cols-2">
            <Input onChange={(event) => setSupplyCategory(event.target.value)} placeholder="Category" value={supplyCategory} />
            <Input
              onChange={(event) => setSupplyCapabilities(event.target.value)}
              placeholder="Capability tags, comma separated"
              value={supplyCapabilities}
            />
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <Select
              onValueChange={(value) =>
                setSupplyType(value as "capability" | "collective" | "product")
              }
              value={supplyType}
            >
              <SelectTrigger>
                <SelectValue placeholder="Supply type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="capability">Capability</SelectItem>
                <SelectItem value="product">Product</SelectItem>
                <SelectItem value="collective">Collective</SelectItem>
              </SelectContent>
            </Select>

            <Select
              onValueChange={(value) =>
                setSupplyDeliveryType(value as "async" | "instant" | "scheduled")
              }
              value={supplyDeliveryType}
            >
              <SelectTrigger>
                <SelectValue placeholder="Delivery type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="instant">Instant</SelectItem>
                <SelectItem value="async">Async</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
              </SelectContent>
            </Select>

            <Select
              onValueChange={(value) =>
                setSupplyPriceType(value as "fixed" | "hourly" | "scoped")
              }
              value={supplyPriceType}
            >
              <SelectTrigger>
                <SelectValue placeholder="Price type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fixed">Fixed</SelectItem>
                <SelectItem value="hourly">Hourly</SelectItem>
                <SelectItem value="scoped">Scoped</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Input
            inputMode="decimal"
            onChange={(event) => setSupplyPriceAmount(event.target.value)}
            placeholder="Price amount"
            value={supplyPriceAmount}
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            disabled={isSavingSupply}
            onClick={() => void handleCreateSupply()}
            size="sm"
            type="button"
          >
            {isSavingSupply ? <LoaderIcon className="animate-spin" /> : <SparklesIcon />}
            Publish entry
          </Button>
        </div>
        {supplyNotice ? <p className="text-xs text-muted-foreground">{supplyNotice}</p> : null}

        {myProfile?.supplies?.length ? (
          <div className="space-y-2 border-t border-border pt-4">
            <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
              Published entries
            </p>
            {myProfile.supplies.map((supply) => (
              <div className="border border-border p-3" key={supply._id}>
                <p className="text-sm font-medium">{supply.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">{supply.description}</p>
              </div>
            ))}
          </div>
        ) : null}
      </section>
    </div>
  );
}

function parseTagInput(value: string) {
  return Array.from(
    new Set(
      value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  );
}

function buildProfileEditorKey(
  profile: MyProfileRecord | undefined,
) {
  if (!profile?.profile) {
    return "profile-editor-empty";
  }

  return JSON.stringify({
    availabilityStatus: profile.profile.availabilityStatus,
    bio: profile.profile.bio,
    capabilities: profile.profile.capabilityTags,
    headline: profile.profile.headline,
    id: profile.profile._id ?? "draft",
    isPublic: profile.profile.isPublic,
    products: profile.profile.productLabels,
    skills: profile.profile.skillTags,
  });
}
