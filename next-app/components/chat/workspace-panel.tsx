"use client";

import { useSyncExternalStore } from "react";
import Image from "next/image";
import {
  AlertTriangleIcon,
  ClapperboardIcon,
  DownloadIcon,
  ImageIcon,
  MicIcon,
  PackageIcon,
  RefreshCwIcon,
} from "lucide-react";

import {
  AudioPlayer,
  AudioPlayerControlBar,
  AudioPlayerDurationDisplay,
  AudioPlayerElement,
  AudioPlayerMuteButton,
  AudioPlayerPlayButton,
  AudioPlayerSeekBackwardButton,
  AudioPlayerSeekForwardButton,
  AudioPlayerTimeDisplay,
  AudioPlayerTimeRange,
  AudioPlayerVolumeRange,
} from "@/components/ai-elements/audio-player";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type {
  RequestDetail,
  RequestArtifact,
  SidebarIntentPreview,
} from "@/lib/boreal/integrations/convex/function-refs";
import type {
  CatalogItem,
  MediaArtifact,
  WorkspaceState,
} from "@/lib/boreal/schemas/chat";

export type WorkspaceTab = "workspace" | "catalog" | "details";

type WorkspacePanelProps = {
  activeTab: WorkspaceTab;
  catalogItems: CatalogItem[];
  isRefreshingVideo: boolean;
  onAskCatalogItem: (item: CatalogItem) => void;
  onDownloadVideo: (videoId: string) => void;
  onQuickReply: (value: string) => void;
  onRefreshVideo: () => void;
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
  isRefreshingVideo,
  onAskCatalogItem,
  onDownloadVideo,
  onQuickReply,
  onRefreshVideo,
  onSelectCatalogItem,
  onTabChange,
  requestDetail,
  selectedCatalogItem,
  selectedIntent,
  workspace,
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
            Workspace
          </p>
          <h2 className="mt-2 text-sm font-medium">Canvas, forms, and catalog</h2>
        </div>
        <div className="min-h-0 flex-1 p-4">
          <EmptyBlock
            subtitle="Loading the workspace interface."
            title="Preparing workspace"
          />
        </div>
      </aside>
    );
  }

  return (
    <aside className="flex h-full flex-col overflow-hidden border border-border">
      <Tabs
        className="min-h-0 flex-1 gap-0"
        onValueChange={(value) => onTabChange(value as WorkspaceTab)}
        value={activeTab}
      >
        <div className="border-b border-border px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                Workspace
              </p>
              <h2 className="mt-2 text-sm font-medium">Requests, assets, and catalog</h2>
            </div>
          </div>
          <TabsList className="mt-4 w-full" variant="line">
            <TabsTrigger value="workspace">Workspace</TabsTrigger>
            <TabsTrigger value="catalog">Catalog</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent className="min-h-0" value="workspace">
          <ScrollArea className="h-full">
            <div className="space-y-4 p-4">
              <WorkspaceView
                isRefreshingVideo={isRefreshingVideo}
                onAskCatalogItem={onAskCatalogItem}
                onDownloadVideo={onDownloadVideo}
                onQuickReply={onQuickReply}
                onRefreshVideo={onRefreshVideo}
                onSelectCatalogItem={onSelectCatalogItem}
                workspace={workspace}
              />
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
              ) : (
                catalogItems.map((item) => (
                  <CatalogCard
                    item={item}
                    key={item.id}
                    onAsk={() => onAskCatalogItem(item)}
                    onOpen={() => {
                      onSelectCatalogItem(item);
                      onTabChange("details");
                    }}
                  />
                ))
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent className="min-h-0" value="details">
          <ScrollArea className="h-full">
            <div className="space-y-4 p-4">
              {selectedCatalogItem ? (
                <CatalogDetail
                  item={selectedCatalogItem}
                  onAsk={() => onAskCatalogItem(selectedCatalogItem)}
                />
              ) : requestDetail?.intent ? (
                <RequestDetailPanel
                  detail={requestDetail}
                  isRefreshingVideo={isRefreshingVideo}
                  onDownloadVideo={onDownloadVideo}
                  onRefreshVideo={onRefreshVideo}
                />
              ) : selectedIntent ? (
                <IntentDetail intent={selectedIntent} />
              ) : (
                <EmptyBlock
                  subtitle="Select a request or a catalog item to inspect it here."
                  title="Nothing selected"
                />
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </aside>
  );
}

function WorkspaceView({
  isRefreshingVideo,
  onAskCatalogItem,
  onDownloadVideo,
  onQuickReply,
  onRefreshVideo,
  onSelectCatalogItem,
  workspace,
}: {
  isRefreshingVideo: boolean;
  onAskCatalogItem: (item: CatalogItem) => void;
  onDownloadVideo: (videoId: string) => void;
  onQuickReply: (value: string) => void;
  onRefreshVideo: () => void;
  onSelectCatalogItem: (item: CatalogItem) => void;
  workspace: WorkspaceState;
}) {
  if (workspace.kind === "artifact") {
    if (workspace.artifact.kind === "image") {
      return (
        <div className="space-y-4">
          <header className="space-y-1">
            <p className="text-sm font-medium">{workspace.title}</p>
            <p className="text-xs text-muted-foreground">{workspace.subtitle}</p>
          </header>
          <Image
            alt={workspace.artifact.title}
            className="h-auto w-full border border-border object-cover"
            height={900}
            src={`data:${workspace.artifact.mediaType};base64,${workspace.artifact.base64}`}
            unoptimized
            width={1600}
          />
          <p className="text-xs text-muted-foreground">{workspace.artifact.prompt}</p>
        </div>
      );
    }

    if (workspace.artifact.kind === "audio") {
      return (
        <div className="space-y-4">
          <header className="space-y-1">
            <div className="flex items-center gap-2">
              <MicIcon className="size-4 text-muted-foreground" />
              <p className="text-sm font-medium">{workspace.title}</p>
            </div>
            <p className="text-xs text-muted-foreground">{workspace.subtitle}</p>
          </header>
          <AudioPlayer className="w-full border border-border p-3">
            <AudioPlayerElement
              src={`data:${workspace.artifact.mediaType};base64,${workspace.artifact.base64}`}
            />
            <AudioPlayerControlBar>
              <AudioPlayerPlayButton />
              <AudioPlayerSeekBackwardButton />
              <AudioPlayerSeekForwardButton />
              <AudioPlayerTimeDisplay showDuration />
              <AudioPlayerTimeRange className="mx-2 min-w-0 flex-1" />
              <AudioPlayerDurationDisplay />
              <AudioPlayerMuteButton />
              <AudioPlayerVolumeRange className="w-16" />
            </AudioPlayerControlBar>
          </AudioPlayer>
          <div className="space-y-2 text-xs text-muted-foreground">
            <p>Voice: {workspace.artifact.voice}</p>
            <p>{workspace.artifact.transcript}</p>
          </div>
        </div>
      );
    }

    return (
      <VideoWorkspace
        artifact={workspace.artifact}
        isRefreshingVideo={isRefreshingVideo}
        onDownloadVideo={onDownloadVideo}
        onRefreshVideo={onRefreshVideo}
        subtitle={workspace.subtitle}
        title={workspace.title}
      />
    );
  }

  if (workspace.kind === "catalog") {
    return (
      <div className="space-y-3">
        <header className="space-y-1">
          <p className="text-sm font-medium">{workspace.title}</p>
          <p className="text-xs text-muted-foreground">{workspace.subtitle}</p>
        </header>
        {workspace.items.map((item) => (
          <CatalogCard
            item={item}
            key={item.id}
            onAsk={() => onAskCatalogItem(item)}
            onOpen={() => onSelectCatalogItem(item)}
          />
        ))}
      </div>
    );
  }

  if (workspace.kind === "clarification") {
    return (
      <div className="space-y-4">
        <header className="space-y-1">
          <p className="text-sm font-medium">{workspace.title}</p>
          <p className="text-xs text-muted-foreground">{workspace.subtitle}</p>
        </header>
        <div className="border border-border p-4">
          <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
            Needed
          </p>
          <ul className="mt-3 space-y-2 text-sm">
            {workspace.questions.map((question) => (
              <li key={question}>{question}</li>
            ))}
          </ul>
        </div>
        {workspace.suggestions.length > 0 ? (
          <div className="space-y-2">
            {workspace.suggestions.map((suggestion) => (
              <Button
                className="w-full justify-start"
                key={suggestion}
                onClick={() => onQuickReply(suggestion)}
                type="button"
                variant="outline"
              >
                {suggestion}
              </Button>
            ))}
          </div>
        ) : null}
      </div>
    );
  }

  return <EmptyBlock subtitle={workspace.subtitle} title={workspace.title} />;
}

function VideoWorkspace({
  artifact,
  isRefreshingVideo,
  onDownloadVideo,
  onRefreshVideo,
  subtitle,
  title,
}: {
  artifact: Extract<MediaArtifact, { kind: "video" }>;
  isRefreshingVideo: boolean;
  onDownloadVideo: (videoId: string) => void;
  onRefreshVideo: () => void;
  subtitle: string;
  title: string;
}) {
  const isCompleted = artifact.status === "completed";
  const isFailed = artifact.status === "failed";

  return (
    <div className="space-y-4">
      <header className="space-y-1">
        <div className="flex items-center gap-2">
          <ClapperboardIcon className="size-4 text-muted-foreground" />
          <p className="text-sm font-medium">{title}</p>
        </div>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </header>

      <div className="border border-border p-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
              Status
            </p>
            <p className="mt-2 text-sm font-medium">
              {artifact.status.replaceAll("_", " ")}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              disabled={isRefreshingVideo}
              onClick={onRefreshVideo}
              size="sm"
              type="button"
              variant="outline"
            >
              <RefreshCwIcon className={isRefreshingVideo ? "animate-spin" : ""} />

            </Button>
            <Button
              disabled={!isCompleted}
              onClick={() => onDownloadVideo(artifact.jobId)}
              size="sm"
              type="button"
              variant="outline"
            >
              <DownloadIcon />

            </Button>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Progress</span>
            <span>{artifact.progress}%</span>
          </div>
          <Progress className="h-2" value={artifact.progress} />
        </div>

        <div className="mt-4 grid gap-3 text-xs text-muted-foreground overflow-x-scroll">
          <p className="">Job: {artifact.jobId.slice(0, 20)}...{artifact.jobId.slice(-10)}</p>
          <p>Model: {artifact.model}</p>
          <p>Size: {artifact.size}</p>
          <p>Duration: {artifact.seconds}s</p>
          {artifact.expiresAt ? (
            <p>Expires: {formatUnixDate(artifact.expiresAt)}</p>
          ) : null}
          <p>{artifact.prompt}</p>
        </div>

        {isFailed && artifact.errorMessage ? (
          <div className="mt-4 flex items-start gap-2 border border-border p-3 text-xs text-destructive">
            <AlertTriangleIcon className="mt-0.5 size-4" />
            <p>{artifact.errorMessage}</p>
          </div>
        ) : null}
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

function RequestDetailPanel({
  detail,
  isRefreshingVideo,
  onDownloadVideo,
  onRefreshVideo,
}: {
  detail: RequestDetail;
  isRefreshingVideo: boolean;
  onDownloadVideo: (videoId: string) => void;
  onRefreshVideo: () => void;
}) {
  if (!detail.intent) {
    return null;
  }

  const artifactMetadata = detail.artifact?.metadata;
  const videoArtifact =
    detail.artifact?.artifactKind === "video" && artifactMetadata
      ? {
        kind: "video" as const,
        errorMessage: readString(artifactMetadata.errorMessage),
        expiresAt: readNumber(artifactMetadata.expiresAt),
        jobId: readString(artifactMetadata.jobId) ?? detail.artifact.remoteId ?? "",
        model: readString(artifactMetadata.model) ?? "sora-2",
        progress: readNumber(artifactMetadata.progress) ?? 0,
        prompt: readString(artifactMetadata.prompt) ?? detail.intent.summary,
        seconds: readString(artifactMetadata.seconds) ?? "8",
        size: readString(artifactMetadata.size) ?? "1280x720",
        status: normalizeVideoStatus(detail.artifact.status, artifactMetadata.status),
        title: detail.artifact.title,
      }
      : null;

  return (
    <div className="space-y-4">
      <header className="space-y-1">
        <p className="text-sm font-medium">{detail.intent.title}</p>
        <p className="text-xs text-muted-foreground">
          {detail.intent.routeTarget.replaceAll("_", " ")} | {detail.intent.status} | {detail.intent.provider}
        </p>
      </header>

      <div className="border border-border p-4">
        <p className="text-sm">{detail.intent.summary}</p>
        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
          {detail.intent.requestedOutputTypes.map((value) => (
            <span key={value}>{value.replaceAll("_", " ")}</span>
          ))}
        </div>
      </div>

      {videoArtifact ? (
        <VideoWorkspace
          artifact={videoArtifact}
          isRefreshingVideo={isRefreshingVideo}
          onDownloadVideo={onDownloadVideo}
          onRefreshVideo={onRefreshVideo}
          subtitle={detail.artifact?.subtitle ?? "Tracked video request"}
          title={detail.artifact?.title ?? detail.intent.title}
        />
      ) : null}

      {detail.intent.needsClarification && detail.intent.missingDetails.length > 0 ? (
        <div className="border border-border p-4">
          <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
            Missing details
          </p>
          <ul className="mt-3 space-y-2 text-sm">
            {detail.intent.missingDetails.map((detailItem) => (
              <li key={detailItem}>{detailItem}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {detail.intent.suggestedReplies.length > 0 ? (
        <div className="border border-border p-4">
          <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
            Suggested replies
          </p>
          <div className="mt-3 space-y-2">
            {detail.intent.suggestedReplies.map((reply) => (
              <p className="text-sm" key={reply}>
                {reply}
              </p>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function IntentDetail({ intent }: { intent: SidebarIntentPreview }) {
  return (
    <div className="space-y-4">
      <header className="space-y-1">
        <p className="text-sm font-medium">{intent.title}</p>
        <p className="text-xs text-muted-foreground">
          {intent.routeTarget.replaceAll("_", " ")} | {intent.status} | {intent.provider}
        </p>
      </header>
      <div className="border border-border p-4">
        <p className="text-sm">{intent.summary}</p>
        <p className="mt-4 text-xs uppercase tracking-[0.16em] text-muted-foreground">
          {intent.requestedOutputTypes
            .map((value) => value.replaceAll("_", " "))
            .join(" / ")}
        </p>
      </div>
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
        <ImageIcon className="size-4 text-muted-foreground" />
      </div>
      <p className="mt-4 text-sm font-medium">{title}</p>
      <p className="mt-2 text-xs text-muted-foreground">{subtitle}</p>
    </div>
  );
}

function formatUnixDate(value: number) {
  return new Date(value * 1000).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function readNumber(value: unknown) {
  return typeof value === "number" ? value : undefined;
}

function readString(value: unknown) {
  return typeof value === "string" ? value : undefined;
}

function normalizeVideoStatus(
  artifactStatus: RequestArtifact["status"],
  metadataStatus: unknown,
): "queued" | "in_progress" | "completed" | "failed" {
  if (typeof metadataStatus === "string") {
    if (metadataStatus === "queued" || metadataStatus === "in_progress") {
      return metadataStatus;
    }
    if (metadataStatus === "completed" || metadataStatus === "ready") {
      return "completed";
    }
    if (metadataStatus === "failed") {
      return "failed";
    }
  }

  if (artifactStatus === "ready") {
    return "completed";
  }

  if (artifactStatus === "queued" || artifactStatus === "in_progress") {
    return artifactStatus;
  }

  return "failed";
}
