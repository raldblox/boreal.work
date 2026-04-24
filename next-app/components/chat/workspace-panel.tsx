"use client";

import { useSyncExternalStore } from "react";
import {
  BotIcon,
  ClapperboardIcon,
  Layers3Icon,
  MicIcon,
  PackageIcon,
  SearchIcon,
  SparklesIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type {
  RequestDetail,
  SidebarIntentPreview,
} from "@/lib/boreal/integrations/convex/function-refs";
import type { CatalogItem, WorkspaceState } from "@/lib/boreal/schemas/chat";

export type WorkspaceTab = "capabilities" | "catalog" | "workers";

type WorkspacePanelProps = {
  activeTab: WorkspaceTab;
  catalogItems: CatalogItem[];
  onAskCatalogItem: (item: CatalogItem) => void;
  onSelectCatalogItem: (item: CatalogItem) => void;
  onTabChange: (value: WorkspaceTab) => void;
  requestDetail: RequestDetail | null;
  selectedCatalogItem: CatalogItem | null;
  selectedIntent: SidebarIntentPreview | null;
  workspace: WorkspaceState;
};

export function WorkspacePanel({
  activeTab,
  catalogItems,
  onAskCatalogItem,
  onSelectCatalogItem,
  onTabChange,
  requestDetail,
  selectedCatalogItem,
  selectedIntent,
}: WorkspacePanelProps) {
  const isMounted = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );

  if (!isMounted) {
    return (
      <aside className="flex min-h-0 flex-col overflow-hidden border border-border">
        <div className="border-b border-border px-4 py-4">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
            Browse
          </p>
          <h2 className="mt-2 text-sm font-medium">Loading market surface</h2>
        </div>
        <div className="min-h-0 flex-1 p-4">
          <EmptyBlock
            subtitle="Preparing worker matches, catalog browsing, and capability discovery."
            title="Loading"
          />
        </div>
      </aside>
    );
  }

  const requestTitle = requestDetail?.intent?.title ?? selectedIntent?.title ?? "Boreal";

  return (
    <aside className="flex h-full flex-col overflow-hidden border border-border">
      <Tabs
        className="min-h-0 flex-1 gap-0"
        onValueChange={(value) => onTabChange(value as WorkspaceTab)}
        value={activeTab}
      >
        <div className="border-b border-border px-4 py-4">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
            Browse
          </p>
          <h2 className="mt-2 text-sm font-medium">{requestTitle}</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Workers, catalog inventory, and future account capabilities live here.
          </p>
          <TabsList className="mt-4 w-full" variant="line">
            <TabsTrigger value="workers">Workers</TabsTrigger>
            <TabsTrigger value="catalog">Catalog</TabsTrigger>
            <TabsTrigger value="capabilities">Capabilities</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent className="min-h-0" value="workers">
          <ScrollArea className="h-full">
            <div className="space-y-3 p-4">
              <WorkersPanel requestDetail={requestDetail} selectedIntent={selectedIntent} />
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent className="min-h-0" value="catalog">
          <ScrollArea className="h-full">
            <div className="space-y-3 p-4">
              {catalogItems.length === 0 ? (
                <EmptyBlock
                  subtitle="The catalog is empty. Seeded supplies will show up here."
                  title="No catalog entries"
                />
              ) : selectedCatalogItem ? (
                <CatalogDetail
                  item={selectedCatalogItem}
                  onAsk={() => onAskCatalogItem(selectedCatalogItem)}
                />
              ) : (
                catalogItems.map((item) => (
                  <CatalogCard
                    item={item}
                    key={item.id}
                    onAsk={() => onAskCatalogItem(item)}
                    onOpen={() => onSelectCatalogItem(item)}
                  />
                ))
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent className="min-h-0" value="capabilities">
          <ScrollArea className="h-full">
            <div className="space-y-3 p-4">
              <CapabilityCard
                icon={Layers3Icon}
                subtitle="Your capability profile will eventually advertise what work you can receive, automate, or fulfill."
                title="Receive jobs and matches"
                wip
              />
              <CapabilityCard
                icon={SparklesIcon}
                subtitle="Provider-level routing, budgets, and preferences will be configurable per account."
                title="Personal routing controls"
                wip
              />
              <CapabilityCard
                icon={PackageIcon}
                subtitle="Supply-side listings and fulfillment preferences will plug into the same request graph."
                title="Supply-side catalog participation"
                wip
              />
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </aside>
  );
}

function WorkersPanel({
  requestDetail,
  selectedIntent,
}: {
  requestDetail: RequestDetail | null;
  selectedIntent: SidebarIntentPreview | null;
}) {
  const requestedOutputTypes =
    requestDetail?.intent?.requestedOutputTypes ?? selectedIntent?.requestedOutputTypes ?? ["text"];
  const routeTarget =
    requestDetail?.intent?.routeTarget ?? selectedIntent?.routeTarget ?? "general_assistance";
  const assignedAgent = requestDetail?.assignment?.agent ?? "Boreal Agent";
  const assignedTools = requestDetail?.assignment?.tools ?? [];
  const cards = buildWorkerCards(requestedOutputTypes, routeTarget);

  return (
    <>
      <div className="space-y-3 border border-border p-4">
        <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
          Assigned worker
        </p>
        <WorkerCard
          description={
            assignedTools.length > 0
              ? `Currently routed through ${assignedTools.join(" / ")}.`
              : "Boreal handles this request directly until additional worker routing is available."
          }
          icon={cards[0]?.icon ?? BotIcon}
          meta={requestDetail?.intent?.status ?? "available"}
          title={assignedAgent}
        />
      </div>

      <div className="space-y-3 border border-border p-4">
        <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
          Suggested workers
        </p>
        <div className="space-y-3">
          {cards.map((card) => (
            <WorkerCard
              description={card.description}
              icon={card.icon}
              key={card.title}
              meta={card.meta}
              title={card.title}
            />
          ))}
        </div>
      </div>
    </>
  );
}

function WorkerCard({
  description,
  icon: Icon,
  meta,
  title,
}: {
  description: string;
  icon: typeof BotIcon;
  meta: string;
  title: string;
}) {
  return (
    <div className="border border-border p-4">
      <div className="flex items-start gap-3">
        <div className="flex size-9 items-center justify-center border border-border">
          <Icon className="size-4 text-muted-foreground" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-medium">{title}</p>
            <span className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
              {meta.replaceAll("_", " ")}
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
    </div>
  );
}

function CapabilityCard({
  icon: Icon,
  subtitle,
  title,
  wip,
}: {
  icon: typeof BotIcon;
  subtitle: string;
  title: string;
  wip?: boolean;
}) {
  return (
    <div className="border border-border p-4">
      <div className="flex items-start gap-3">
        <div className="flex size-9 items-center justify-center border border-border">
          <Icon className="size-4 text-muted-foreground" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-medium">{title}</p>
            {wip ? (
              <span className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                WIP
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
        </div>
      </div>
    </div>
  );
}

function CatalogCard({
  item,
  onAsk,
  onOpen,
}: {
  item: CatalogItem;
  onAsk: () => void;
  onOpen: () => void;
}) {
  return (
    <div className="border border-border p-4">
      <div className="flex items-start gap-3">
        <PackageIcon className="mt-0.5 size-4 text-muted-foreground" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">{item.title}</p>
          <p className="mt-1 text-xs text-muted-foreground">{item.description}</p>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
            <span>{item.category}</span>
            <span>{item.deliveryType}</span>
            <span>{item.priceLabel}</span>
          </div>
          <div className="mt-4 flex gap-2">
            <Button onClick={onOpen} size="sm" type="button" variant="outline">
              Open
            </Button>
            <Button onClick={onAsk} size="sm" type="button" variant="ghost">
              Ask more
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CatalogDetail({
  item,
  onAsk,
}: {
  item: CatalogItem;
  onAsk: () => void;
}) {
  return (
    <div className="space-y-4">
      <header className="space-y-1">
        <div className="flex items-center gap-2">
          <PackageIcon className="size-4 text-muted-foreground" />
          <p className="text-sm font-medium">{item.title}</p>
        </div>
        <p className="text-xs text-muted-foreground">
          {item.category} | {item.deliveryType} | {item.priceLabel}
        </p>
      </header>
      <div className="border border-border p-4">
        <p className="text-sm">{item.description}</p>
        <p className="mt-4 text-xs uppercase tracking-[0.16em] text-muted-foreground">
          {item.capabilityTags.join(" / ")}
        </p>
      </div>
      <Button onClick={onAsk} type="button" variant="outline">
        Ask for more info
      </Button>
    </div>
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

function buildWorkerCards(requestedOutputTypes: string[], routeTarget: string) {
  const cards = [
    {
      description: "General routed assistant for text answers, orchestration, and fallback handling.",
      icon: BotIcon,
      meta: "default",
      title: "Boreal Agent",
    },
  ];

  if (requestedOutputTypes.includes("image_generation") || routeTarget === "image_generation") {
    cards.unshift({
      description: "Handles image prompts, revisions, and visual asset generation.",
      icon: SparklesIcon,
      meta: "image",
      title: "Image Worker",
    });
  }

  if (requestedOutputTypes.includes("speech_generation") || routeTarget === "speech_generation") {
    cards.unshift({
      description: "Handles speech rendering, voice selection, and audio delivery.",
      icon: MicIcon,
      meta: "speech",
      title: "Speech Worker",
    });
  }

  if (requestedOutputTypes.includes("video_generation") || routeTarget === "video_generation") {
    cards.unshift({
      description: "Tracks queued renders, refreshes progress, and delivers final video files.",
      icon: ClapperboardIcon,
      meta: "video",
      title: "Video Worker",
    });
  }

  if (routeTarget === "catalog_lookup") {
    cards.unshift({
      description: "Searches the supply catalog, compares offers, and surfaces matched products.",
      icon: PackageIcon,
      meta: "catalog",
      title: "Catalog Worker",
    });
  }

  return cards.slice(0, 4);
}
