"use client";

import { useEffect, useMemo, useState } from "react";
import { makeFunctionReference } from "convex/server";
import { useMutation, useQuery } from "convex/react";
import { usePrivy } from "@privy-io/react-auth";
import {
  BotIcon,
  LoaderIcon,
  PackageIcon,
  PanelRightCloseIcon,
  PanelRightOpenIcon,
  SparklesIcon,
  WalletIcon,
} from "lucide-react";

import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputBody,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
} from "@/components/ai-elements/prompt-input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  CatalogEntry,
  RequestDetail,
  SidebarIntentPreview,
} from "@/lib/boreal/integrations/convex/function-refs";
import type {
  CatalogItem,
  ChatAssistantResponse,
  WorkspaceState,
} from "@/lib/boreal/schemas/chat";
import type { PersistedIntent } from "@/lib/boreal/schemas/intent";

import { IntentSidebar } from "./intent-sidebar";
import { WorkspacePanel, type WorkspaceTab } from "./workspace-panel";

type ChatMessage = {
  content: string;
  id: string;
  intent?: PersistedIntent;
  role: "user" | "assistant";
  workspace?: WorkspaceState;
};

type ProviderOption = {
  description: string;
  disabled?: boolean;
  label: string;
  value: string;
};

const sidebarIntentQuery = makeFunctionReference<
  "query",
  { limit: number },
  SidebarIntentPreview[]
>("intents:listSidebar");

const requestDetailQuery = makeFunctionReference<
  "query",
  { intentId: string },
  RequestDetail
>("intents:getRequestDetail");

const deleteIntentMutation = makeFunctionReference<
  "mutation",
  { intentId: string },
  { deleted: boolean }
>("intents:deleteIntent");

const updateArtifactMutation = makeFunctionReference<
  "mutation",
  {
    artifactId: string;
    mediaType?: string;
    metadataJson?: string;
    remoteId?: string;
    status: "ready" | "queued" | "in_progress" | "failed";
    subtitle?: string;
    title?: string;
  },
  { updated: boolean }
>("artifacts:updateArtifactMetadata");

const catalogQuery = makeFunctionReference<
  "query",
  { limit: number },
  CatalogEntry[]
>("supplies:listCatalog");

const starterPrompts = [
  "What can Boreal do for chat, catalog routing, and media generation?",
  "Create a cinematic product hero image for Boreal's launch page.",
  "Generate a short voiceover for a product announcement in a warm tone.",
  "Show me the supply catalog and explain which Boreal tool fits each use case.",
];

const providerOptions: ProviderOption[] = [
  {
    description: "Default routed assistant with OpenAI-backed generation.",
    label: "Boreal Agent",
    value: "boreal-agent",
  },
  {
    description: "Coming later",
    disabled: true,
    label: "agentcash",
    value: "agentcash",
  },
  {
    description: "Coming later",
    disabled: true,
    label: "frames.gg",
    value: "frames-gg",
  },
  {
    description: "Coming later",
    disabled: true,
    label: "agentic.market",
    value: "agentic-market",
  },
  {
    description: "Coming later",
    disabled: true,
    label: "venice",
    value: "venice",
  },
];

const emptyWorkspace: WorkspaceState = {
  kind: "empty",
  subtitle:
    "Catalog matches, asset outputs, clarifying forms, and async generation jobs will appear here.",
  title: "Workspace",
};

export function ChatShell() {
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  const [workspace, setWorkspace] = useState<WorkspaceState>(emptyWorkspace);
  const [workspaceTab, setWorkspaceTab] = useState<WorkspaceTab>("workspace");
  const [showWorkspace, setShowWorkspace] = useState(true);
  const [selectedIntentId, setSelectedIntentId] = useState<string | null>(null);
  const [selectedCatalogItem, setSelectedCatalogItem] = useState<CatalogItem | null>(null);
  const [selectedProvider, setSelectedProvider] = useState("boreal-agent");
  const [sessionIntentIds, setSessionIntentIds] = useState<string[]>([]);
  const [isRefreshingVideo, setIsRefreshingVideo] = useState(false);

  const { ready: privyReady, authenticated: privyAuthenticated, login } = usePrivy();

  const sidebarIntents =
    (useQuery(sidebarIntentQuery, {
      limit: 24,
    }) ?? []) as SidebarIntentPreview[];

  const activeIntentId = selectedIntentId ?? sidebarIntents[0]?._id ?? null;
  const selectedIntent =
    sidebarIntents.find((intent) => intent._id === activeIntentId) ?? null;

  const requestDetail = (useQuery(
    requestDetailQuery,
    activeIntentId ? { intentId: activeIntentId } : "skip",
  ) ?? null) as RequestDetail | null;

  const catalogEntries =
    (useQuery(catalogQuery, {
      limit: 16,
    }) ?? []) as CatalogEntry[];

  const catalogItems = catalogEntries.map(mapCatalogEntry);

  const deleteIntent = useMutation(deleteIntentMutation);
  const updateArtifact = useMutation(updateArtifactMutation);

  const requestWorkspace = useMemo(
    () => buildWorkspaceFromRequestDetail(requestDetail),
    [requestDetail],
  );

  const activeConversationId = conversationId ?? requestDetail?.conversationId ?? undefined;

  const effectiveWorkspace =
    activeIntentId && !sessionIntentIds.includes(activeIntentId)
      ? requestWorkspace
      : workspace;

  const displayedMessages: ChatMessage[] =
    messages.length > 0
      ? messages
      : requestDetail?.messages.map((message) => ({
          content: message.body,
          id: message._id,
          role: message.role === "system" ? "assistant" : message.role,
        })) ?? [];

  const effectiveSelectedCatalogItem =
    selectedCatalogItem ??
    (isCatalogWorkspace(effectiveWorkspace) ? effectiveWorkspace.items[0] ?? null : null) ??
    catalogItems[0] ??
    null;

  async function refreshVideoJob(jobId?: string | null, artifactId?: string | null) {
    if (!jobId || !artifactId) {
      return;
    }

    setIsRefreshingVideo(true);
    setErrorMessage(null);

    try {
      const response = await fetch(`/api/video-jobs/${jobId}`, {
        method: "GET",
      });
      const payload = (await response.json()) as
        | {
            completedAt?: number;
            createdAt?: number;
            errorMessage?: string;
            expiresAt?: number;
            jobId: string;
            mediaType?: string;
            model: string;
            progress: number;
            prompt?: string;
            seconds: string;
            size: string;
            status: "queued" | "in_progress" | "completed" | "failed";
          }
        | { error?: string };

      if (!response.ok || !("jobId" in payload)) {
        throw new Error(
          "error" in payload && payload.error ? payload.error : "Failed to refresh video job.",
        );
      }

      await updateArtifact({
        artifactId,
        mediaType: payload.mediaType ?? "video/mp4",
        metadataJson: JSON.stringify({
          ...payload,
          downloadUrl:
            payload.status === "completed"
              ? `/api/video-jobs/${payload.jobId}/content`
              : undefined,
        }),
        remoteId: payload.jobId,
        status: payload.status === "completed" ? "ready" : payload.status,
      });
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to refresh video job.",
      );
    } finally {
      setIsRefreshingVideo(false);
    }
  }

  useEffect(() => {
    const artifact = requestDetail?.artifact;
    const metadata = artifact?.metadata;

    if (!artifact || artifact.artifactKind !== "video") {
      return;
    }

    const currentStatus =
      typeof metadata?.status === "string" ? metadata.status : artifact.status;

    if (currentStatus !== "queued" && currentStatus !== "in_progress") {
      return;
    }

    const jobId =
      (typeof metadata?.jobId === "string" ? metadata.jobId : null) ??
      artifact.remoteId;

    if (!jobId) {
      return;
    }

    const refreshCurrentVideo = async () => {
      setIsRefreshingVideo(true);
      setErrorMessage(null);

      try {
        const response = await fetch(`/api/video-jobs/${jobId}`, {
          method: "GET",
        });
        const payload = (await response.json()) as
          | {
              completedAt?: number;
              createdAt?: number;
              errorMessage?: string;
              expiresAt?: number;
              jobId: string;
              mediaType?: string;
              model: string;
              progress: number;
              prompt?: string;
              seconds: string;
              size: string;
              status: "queued" | "in_progress" | "completed" | "failed";
            }
          | { error?: string };

        if (!response.ok || !("jobId" in payload)) {
          throw new Error(
            "error" in payload && payload.error
              ? payload.error
              : "Failed to refresh video job.",
          );
        }

        await updateArtifact({
          artifactId: artifact._id,
          mediaType: payload.mediaType ?? "video/mp4",
          metadataJson: JSON.stringify({
            ...payload,
            downloadUrl:
              payload.status === "completed"
                ? `/api/video-jobs/${payload.jobId}/content`
                : undefined,
          }),
          remoteId: payload.jobId,
          status: payload.status === "completed" ? "ready" : payload.status,
        });
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : "Failed to refresh video job.",
        );
      } finally {
        setIsRefreshingVideo(false);
      }
    };

    const timer = window.setInterval(() => {
      void refreshCurrentVideo();
    }, 12000);

    return () => window.clearInterval(timer);
  }, [requestDetail?.artifact, updateArtifact]);

  async function submitMessage(message: string) {
    const trimmed = message.trim();

    if (!trimmed || isSubmitting) {
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);

    setMessages((current) => [
      ...current,
      {
        content: trimmed,
        id: crypto.randomUUID(),
        role: "user",
      },
    ]);

    try {
      const response = await fetch("/api/chat", {
        body: JSON.stringify({
          conversationId: activeConversationId,
          message: trimmed,
          provider: selectedProvider,
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });

      const payload = (await response.json()) as
        | ChatAssistantResponse
        | { error?: string };

      if (!response.ok) {
        throw new Error(
          "error" in payload && payload.error ? payload.error : "Chat request failed.",
        );
      }

      if (!("assistantMessage" in payload)) {
        throw new Error("Chat response was incomplete.");
      }

      setConversationId(payload.conversationId);
      setMessages((current) => [
        ...current,
        {
          content: payload.assistantMessage,
          id: payload.intentId ?? crypto.randomUUID(),
          intent: payload.intent,
          role: "assistant",
          workspace: payload.workspace,
        },
      ]);
      setWorkspace(payload.workspace);
      setWorkspaceTab("workspace");
      setShowWorkspace(true);
      setSelectedIntentId(payload.intentId ?? null);

      if (payload.intentId) {
        setSessionIntentIds((current) => Array.from(new Set([...current, payload.intentId!])));
      }

      if (payload.workspace.kind === "catalog" && payload.workspace.items[0]) {
        setSelectedCatalogItem(payload.workspace.items[0]);
      } else if (payload.relatedCatalogItems[0]) {
        setSelectedCatalogItem(payload.relatedCatalogItems[0]);
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Chat request failed.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDeleteIntent(intentId: string) {
    setErrorMessage(null);
    setIsDeletingId(intentId);

    try {
      await deleteIntent({ intentId });

      setSessionIntentIds((current) => current.filter((value) => value !== intentId));

      if (activeIntentId === intentId) {
        setSelectedIntentId(null);
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to delete intent.",
      );
    } finally {
      setIsDeletingId(null);
    }
  }

  function handleSidebarSelect(intent: SidebarIntentPreview) {
    setSelectedIntentId(intent._id);
    setWorkspaceTab("details");
    setShowWorkspace(true);
    setMessages([]);
  }

  function handleDownloadVideo(videoId: string) {
    window.open(`/api/video-jobs/${videoId}/content`, "_blank", "noopener,noreferrer");
  }

  const providerLabel =
    providerOptions.find((provider) => provider.value === selectedProvider)?.label ??
    "Boreal Agent";

  return (
    <div className="mx-auto flex h-[100svh] w-full max-w-[1600px] flex-col overflow-hidden px-4 py-4 sm:px-6">
      <div
        className={
          showWorkspace
            ? "grid min-h-0 flex-1 gap-4 lg:grid-cols-[18rem_minmax(0,1fr)] xl:grid-cols-[18rem_minmax(0,1fr)_25rem]"
            : "grid min-h-0 flex-1 gap-4 lg:grid-cols-[18rem_minmax(0,1fr)]"
        }
      >
        <IntentSidebar
          intents={sidebarIntents}
          isDeletingId={isDeletingId}
          onDelete={handleDeleteIntent}
          onSelect={handleSidebarSelect}
          selectedIntentId={activeIntentId}
        />

        <section className="flex min-h-0 flex-col overflow-hidden border border-border">
          <div className="border-b border-border px-4 py-4">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                  Boreal Chat
                </p>
                <h1 className="text-base font-medium">
                  Helpful chat first, tracked request execution after intent detection.
                </h1>
                <p className="text-xs text-muted-foreground">
                  Active provider: {providerLabel}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {isSubmitting ? (
                  <LoaderIcon className="size-4 animate-spin text-muted-foreground" />
                ) : (
                  <BotIcon className="size-4 text-muted-foreground" />
                )}
                <Button
                  aria-label={showWorkspace ? "Hide workspace" : "Show workspace"}
                  onClick={() => setShowWorkspace((current) => !current)}
                  size="icon-sm"
                  type="button"
                  variant="ghost"
                >
                  {showWorkspace ? <PanelRightCloseIcon /> : <PanelRightOpenIcon />}
                </Button>
              </div>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {displayedMessages.length === 0 ? (
              <div className="mx-auto flex h-full w-full max-w-3xl flex-col justify-center px-4 py-8">
                <div className="space-y-4">
                  <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                    Intent-driven assistant
                  </p>
                  <h2 className="text-3xl font-medium tracking-tight">
                    Ask anything. Boreal answers directly, then tracks generation requests as first-class jobs.
                  </h2>
                  <p className="max-w-2xl text-sm text-muted-foreground">
                    Refresh-safe request history, catalog listing, asset playback, and tracked video progress all live in the same interface.
                  </p>
                </div>

                <div className="mt-8 grid gap-3 md:grid-cols-2">
                  {starterPrompts.map((prompt) => (
                    <button
                      className="border border-border p-4 text-left text-sm"
                      key={prompt}
                      onClick={() => {
                        void submitMessage(prompt);
                      }}
                      type="button"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="mx-auto flex w-full flex-col gap-6 px-4 py-6">
                {displayedMessages.map((message) => (
                  <Message from={message.role} key={message.id}>
                    <MessageContent>
                      <MessageResponse>{message.content}</MessageResponse>
                      {message.workspace && message.workspace.kind !== "empty" ? (
                        <p className="mt-3 text-xs text-muted-foreground">
                          Opened in workspace: {message.workspace.title}
                        </p>
                      ) : null}
                    </MessageContent>
                  </Message>
                ))}

                {isSubmitting ? (
                  <Message from="assistant">
                    <MessageContent>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <LoaderIcon className="size-4 animate-spin" />
                        <span>Routing request</span>
                      </div>
                    </MessageContent>
                  </Message>
                ) : null}
              </div>
            )}
          </div>

          <div className="border-t border-border p-4">
            <PromptInput
              onSubmit={async (input) => {
                await submitMessage(input.text);
              }}
            >
              <PromptInputBody>
                <PromptInputTextarea placeholder="Ask a question, request an asset, or ask Boreal to find the right product or capability." />
              </PromptInputBody>
              <PromptInputFooter>
                <PromptInputTools>
                  <Select onValueChange={setSelectedProvider} value={selectedProvider}>
                    <SelectTrigger className="min-w-24" size="sm">
                      <SelectValue placeholder="Provider" />
                    </SelectTrigger>
                    <SelectContent>
                      {providerOptions.map((provider) => (
                        <SelectItem
                          disabled={provider.disabled}
                          key={provider.value}
                          value={provider.value}
                        >
                          {provider.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={() => {
                      setWorkspaceTab("catalog");
                      setShowWorkspace(true);
                    }}
                    size="sm"
                    type="button"
                    variant="ghost"
                  >
                    <PackageIcon />
                    Catalog
                  </Button>
                  <Button
                    onClick={() => {
                      setWorkspaceTab("workspace");
                      setShowWorkspace(true);
                    }}
                    size="sm"
                    type="button"
                    variant="ghost"
                  >
                    <SparklesIcon />
                    Workspace
                  </Button>
                  <Button
                    onClick={login}
                    size="sm"
                    type="button"
                    variant={privyAuthenticated ? "secondary" : "ghost"}
                  >
                    <WalletIcon />
                    {privyReady
                      ? privyAuthenticated
                        ? "Connected"
                        : "Connect Wallet"
                      : "Wallet"}
                  </Button>
                </PromptInputTools>
                <PromptInputSubmit
                  disabled={isSubmitting}
                  status={isSubmitting ? "submitted" : undefined}
                />
              </PromptInputFooter>
            </PromptInput>

            {errorMessage ? (
              <p className="mt-3 text-xs text-destructive">{errorMessage}</p>
            ) : null}
          </div>
        </section>

        {showWorkspace ? (
          <div className="min-h-0 lg:col-span-2 xl:col-span-1">
            <WorkspacePanel
              activeTab={workspaceTab}
              catalogItems={catalogItems}
              isRefreshingVideo={isRefreshingVideo}
              onAskCatalogItem={(item) => {
                void submitMessage(
                  `Tell me more about ${item.title}. Include best use cases, what it delivers, and whether it fits my request.`,
                );
              }}
              onDownloadVideo={handleDownloadVideo}
              onQuickReply={(value) => {
                void submitMessage(value);
              }}
              onRefreshVideo={() => {
                const artifact = requestDetail?.artifact;
                const metadata = artifact?.metadata;
                const jobId =
                  (typeof metadata?.jobId === "string" ? metadata.jobId : null) ??
                  artifact?.remoteId;
                void refreshVideoJob(jobId, artifact?._id);
              }}
              onSelectCatalogItem={(item) => {
                setSelectedCatalogItem(item);
                setWorkspaceTab("details");
              }}
              onTabChange={setWorkspaceTab}
              requestDetail={requestDetail}
              selectedCatalogItem={effectiveSelectedCatalogItem}
              selectedIntent={selectedIntent}
              workspace={effectiveWorkspace}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}

function mapCatalogEntry(entry: CatalogEntry): CatalogItem {
  return {
    capabilityTags: entry.capabilityTags,
    category: entry.category,
    deliveryType: entry.deliveryType,
    description: entry.description,
    id: entry._id,
    priceLabel:
      entry.priceAmount === null
        ? "Custom"
        : entry.priceAmount === 0
          ? "Included"
          : `$${entry.priceAmount}/${entry.priceType}`,
    supplyType: entry.supplyType,
    title: entry.title,
  };
}

function buildWorkspaceFromRequestDetail(detail: RequestDetail | null): WorkspaceState {
  if (!detail?.intent) {
    return emptyWorkspace;
  }

  if (detail.artifact?.artifactKind === "image" && detail.artifact.metadata) {
    const metadata = detail.artifact.metadata;
    const base64 = typeof metadata.base64 === "string" ? metadata.base64 : null;
    const mediaType = typeof metadata.mediaType === "string" ? metadata.mediaType : null;
    const prompt = typeof metadata.prompt === "string" ? metadata.prompt : detail.intent.summary;

    if (base64 && mediaType) {
      return {
        artifact: {
          base64,
          kind: "image",
          mediaType,
          prompt,
          title: detail.artifact.title,
        },
        kind: "artifact",
        subtitle: detail.artifact.subtitle,
        title: detail.artifact.title,
      };
    }
  }

  if (detail.artifact?.artifactKind === "audio" && detail.artifact.metadata) {
    const metadata = detail.artifact.metadata;
    const base64 = typeof metadata.base64 === "string" ? metadata.base64 : null;
    const mediaType = typeof metadata.mediaType === "string" ? metadata.mediaType : null;
    const transcript =
      typeof metadata.transcript === "string" ? metadata.transcript : detail.intent.summary;
    const format = typeof metadata.format === "string" ? metadata.format : "mp3";
    const voice = typeof metadata.voice === "string" ? metadata.voice : "alloy";

    if (base64 && mediaType) {
      return {
        artifact: {
          base64,
          format,
          kind: "audio",
          mediaType,
          title: detail.artifact.title,
          transcript,
          voice,
        },
        kind: "artifact",
        subtitle: detail.artifact.subtitle,
        title: detail.artifact.title,
      };
    }
  }

  if (detail.artifact?.artifactKind === "video" && detail.artifact.metadata) {
    const metadata = detail.artifact.metadata;
    const jobId =
      (typeof metadata.jobId === "string" ? metadata.jobId : null) ??
      detail.artifact.remoteId ??
      "";

    return {
      artifact: {
        downloadUrl:
          typeof metadata.downloadUrl === "string" ? metadata.downloadUrl : undefined,
        errorMessage:
          typeof metadata.errorMessage === "string" ? metadata.errorMessage : undefined,
        expiresAt:
          typeof metadata.expiresAt === "number" ? metadata.expiresAt : undefined,
        jobId,
        kind: "video",
        model: typeof metadata.model === "string" ? metadata.model : "sora-2",
        progress: typeof metadata.progress === "number" ? metadata.progress : 0,
        prompt:
          typeof metadata.prompt === "string" ? metadata.prompt : detail.intent.summary,
        seconds: typeof metadata.seconds === "string" ? metadata.seconds : "8",
        size: typeof metadata.size === "string" ? metadata.size : "1280x720",
        status: normalizeVideoStatus(detail.artifact.status, metadata.status),
        title: detail.artifact.title,
      },
      kind: "artifact",
      subtitle: detail.artifact.subtitle,
      title: detail.artifact.title,
    };
  }

  if (detail.intent.needsClarification && detail.intent.missingDetails.length > 0) {
    return {
      kind: "clarification",
      questions: detail.intent.missingDetails,
      subtitle: "This request is still missing information before it can run cleanly.",
      suggestions: detail.intent.suggestedReplies,
      title: detail.intent.title,
    };
  }

  return {
    kind: "empty",
    subtitle:
      "Select catalog entries, refresh tracked jobs, or keep chatting to open more workspace content.",
    title: detail.intent.title,
  };
}

function normalizeVideoStatus(
  artifactStatus: "failed" | "in_progress" | "queued" | "ready",
  metadataStatus: unknown,
): "queued" | "in_progress" | "completed" | "failed" {
  if (metadataStatus === "queued" || metadataStatus === "in_progress") {
    return metadataStatus;
  }

  if (metadataStatus === "completed" || metadataStatus === "ready") {
    return "completed";
  }

  if (metadataStatus === "failed") {
    return "failed";
  }

  if (artifactStatus === "ready") {
    return "completed";
  }

  if (artifactStatus === "queued" || artifactStatus === "in_progress") {
    return artifactStatus;
  }

  return "failed";
}
