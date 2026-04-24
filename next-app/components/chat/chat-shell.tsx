"use client";

import { useEffect, useMemo, useState, type Dispatch, type SetStateAction } from "react";
import Image from "next/image";
import { makeFunctionReference } from "convex/server";
import { useMutation, useQuery } from "convex/react";
import { usePrivy } from "@privy-io/react-auth";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  ArrowLeftIcon,
  BotIcon,
  CheckIcon,
  CopyIcon,
  ClapperboardIcon,
  ExternalLinkIcon,
  LoaderIcon,
  MicIcon,
  PackageIcon,
  PanelRightCloseIcon,
  PanelRightOpenIcon,
  RefreshCwIcon,
  SparklesIcon,
  StarIcon,
  UserIcon,
  WalletIcon,
  XCircleIcon,
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
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
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
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type {
  RequestDetail,
  SidebarIntentPreview,
} from "@/lib/boreal/integrations/convex/function-refs";
import type {
  CatalogItem,
  ChatAssistantResponse,
  WorkspaceState,
} from "@/lib/boreal/schemas/chat";
import { cn } from "@/lib/utils";

import { IntentSidebar } from "./intent-sidebar";
import {
  formatOutputTypes,
  formatRequestDate,
  RequestStageRail,
  RequestStatusBadge,
} from "./request-ui";
import { WorkspacePanel, type WorkspaceTab } from "./workspace-panel";

type ChatMessage = {
  content: string;
  id: string;
  role: "assistant" | "user";
};

type CenterViewTab = "activity" | "chat" | "proposals" | "workers";

type ProviderOption = {
  description: string;
  disabled?: boolean;
  label: string;
  value: string;
};

const sidebarIntentQuery = makeFunctionReference<
  "query",
  { limit: number; ownerExternalId?: string },
  SidebarIntentPreview[]
>("intents:listSidebar");

const requestDetailQuery = makeFunctionReference<
  "query",
  { intentId: string; ownerExternalId?: string },
  RequestDetail
>("intents:getRequestDetail");

const deleteIntentMutation = makeFunctionReference<
  "mutation",
  { intentId: string; ownerExternalId?: string },
  { deleted: boolean }
>("intents:deleteIntent");

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
    "When work is approved, Boreal renders assets, catalog cards, forms, or job tracking here.",
  title: "Workboard",
};

type ApprovalQueueItem = {
  agentLabel: string;
  intentId: string;
  summary: string;
  title: string;
};

export function ChatShell() {
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  const [isApprovingRequest, setIsApprovingRequest] = useState(false);
  const [isCancellingRequest, setIsCancellingRequest] = useState(false);
  const [isRetryingRequest, setIsRetryingRequest] = useState(false);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [optimisticReviewRating, setOptimisticReviewRating] = useState<number | null>(null);
  const [workspace, setWorkspace] = useState<WorkspaceState>(emptyWorkspace);
  const [showWorkspace, setShowWorkspace] = useState(true);
  const [selectedProvider, setSelectedProvider] = useState("boreal-agent");
  const [isRefreshingVideo, setIsRefreshingVideo] = useState(false);

  const { data: session } = useSession();
  const ownerExternalId = session?.user?.id;
  const { ready: privyReady, authenticated: privyAuthenticated, login } = usePrivy();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const activeIntentId = searchParams.get("request");
  const selectedCenterTab = normalizeCenterViewTab(searchParams.get("view"));
  const workspaceTab = normalizeWorkspaceTab(searchParams.get("browse"));

  const sidebarIntents =
    (useQuery(sidebarIntentQuery, {
      limit: 24,
      ownerExternalId,
    }) ?? []) as SidebarIntentPreview[];
  const selectedIntent =
    sidebarIntents.find((intent) => intent._id === activeIntentId) ?? null;

  const requestDetailResult = useQuery(
    requestDetailQuery,
    activeIntentId ? { intentId: activeIntentId, ownerExternalId } : "skip",
  );
  const isRequestLoading = Boolean(activeIntentId) && requestDetailResult === undefined;
  const requestDetail = (requestDetailResult ?? null) as RequestDetail | null;

  const deleteIntent = useMutation(deleteIntentMutation);

  const requestWorkspace = requestDetail?.intent
    ? buildWorkspaceFromRequestDetail(requestDetail)
    : null;

  const requestMessages: ChatMessage[] =
    requestDetail?.messages.map((message) => ({
      content: message.body,
      id: message._id,
      role:
        message.role === "user" ? ("user" as const) : ("assistant" as const),
    })) ?? [];

  const displayedMessages: ChatMessage[] = activeIntentId
    ? [...requestMessages, ...messages]
    : messages;

  const activeConversationId = conversationId ?? requestDetail?.conversationId ?? undefined;

  const effectiveWorkspace =
    activeIntentId && requestWorkspace ? requestWorkspace : workspace;
  const effectiveReview =
    requestDetail?.review ??
    (optimisticReviewRating !== null
      ? {
        comment: "",
        rating: optimisticReviewRating,
        reviewedAt: Date.now(),
      }
      : null);
  const shouldPromptReview = Boolean(
    requestDetail?.intent?.reviewPending &&
      !effectiveReview &&
      !isSubmittingReview,
  );
  const pendingApprovals: ApprovalQueueItem[] = sidebarIntents
    .filter((intent) => intent.status === "proposed" || intent.status === "open")
    .slice(0, 3)
    .map((intent) => ({
      agentLabel: intent.assignedAgent ?? humanizeToolLabel(intent.routeTarget),
      intentId: intent._id,
      summary: intent.summary,
      title: intent.title,
    }));
  const selectedRequestShareUrl = useMemo(() => {
    if (!activeIntentId || typeof window === "undefined") {
      return null;
    }

    const params = new URLSearchParams(searchParams.toString());
    params.set("request", activeIntentId);
    params.set("view", "workers");

    return `${window.location.origin}${pathname}?${params.toString()}`;
  }, [activeIntentId, pathname, searchParams]);

  function updateWorkspaceUrl(next: {
    browse?: WorkspaceTab | null;
    request?: string | null;
    view?: CenterViewTab | null;
  }) {
    const params = new URLSearchParams(searchParams.toString());

    if (next.request === null) {
      params.delete("request");
      params.delete("view");
    } else if (next.request) {
      params.set("request", next.request);
    }

    if (next.view === null) {
      params.delete("view");
    } else if (next.view) {
      params.set("view", next.view);
    }

    if (next.browse === null) {
      params.delete("browse");
    } else if (next.browse) {
      params.set("browse", next.browse);
    }

    const nextQuery = params.toString();
    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, {
      scroll: false,
    });
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

    const timer = window.setInterval(() => {
      void refreshVideoJob(jobId);
    }, 12000);

    return () => window.clearInterval(timer);
  }, [requestDetail?.artifact]);

  async function refreshVideoJob(jobId?: string | null) {
    if (!jobId) {
      return;
    }

    setIsRefreshingVideo(true);
    setErrorMessage(null);

    try {
      const response = await fetch(`/api/video-jobs/${jobId}`, {
        method: "GET",
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error ?? "Failed to refresh video job.");
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to refresh video job.",
      );
    } finally {
      setIsRefreshingVideo(false);
    }
  }

  async function submitMessage(message: string) {
    const trimmed = message.trim();

    if (!trimmed || isSubmitting) {
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);
    const assistantMessageId = crypto.randomUUID();
    setMessages((current) => [
      ...current,
      {
        content: trimmed,
        id: crypto.randomUUID(),
        role: "user",
      },
      {
        content: "",
        id: assistantMessageId,
        role: "assistant",
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

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error ?? "Chat request failed.");
      }

      if (!response.body) {
        throw new Error("Chat stream was unavailable.");
      }

      const finalPayload = await consumeChatStream({
        assistantMessageId,
        response,
        setMessages,
      });

      setConversationId(finalPayload.conversationId);
      setWorkspace(finalPayload.workspace);
      updateWorkspaceUrl({ browse: "workers" });
      setShowWorkspace(true);

      if (finalPayload.requiresApproval && finalPayload.intentId) {
        updateWorkspaceUrl({
          browse: "workers",
          request: finalPayload.intentId,
          view: "chat",
        });
        setOptimisticReviewRating(null);
        setMessages([]);
        return;
      }
    } catch (error) {
      setMessages((current) =>
        current.filter(
          (currentMessage) =>
            !(currentMessage.id === assistantMessageId && currentMessage.content.length === 0),
        ),
      );
      setErrorMessage(
        error instanceof Error ? error.message : "Chat request failed.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleApproveRequest(intentId = activeIntentId) {
    if (!intentId || isApprovingRequest) {
      return;
    }

    setErrorMessage(null);
    setIsApprovingRequest(true);

    try {
      const response = await fetch(`/api/requests/${intentId}/approve`, {
        method: "POST",
      });
      const payload = (await response.json()) as
        | {
          assistantMessage: string;
          relatedCatalogItems: CatalogItem[];
          workspace: WorkspaceState;
        }
        | { error?: string };

      if (!response.ok || !("workspace" in payload)) {
        throw new Error(
          "error" in payload && payload.error
            ? payload.error
            : "Failed to approve request.",
        );
      }

      updateWorkspaceUrl({
        browse: "workers",
        request: intentId,
        view: "chat",
      });
      setMessages([]);
      setWorkspace(payload.workspace);
      setShowWorkspace(true);

    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to approve request.",
      );
    } finally {
      setIsApprovingRequest(false);
    }
  }

  async function handleCancelRequest(intentId = activeIntentId) {
    if (!intentId || isCancellingRequest) {
      return;
    }

    setErrorMessage(null);
    setIsCancellingRequest(true);

    try {
      const response = await fetch(`/api/requests/${intentId}/cancel`, {
        method: "POST",
      });
      const payload = (await response.json()) as { cancelled?: boolean; error?: string };

      if (!response.ok || !payload.cancelled) {
        throw new Error(payload.error ?? "Failed to cancel request.");
      }

      if (activeIntentId === intentId) {
        handleClearSelection();
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to cancel request.",
      );
    } finally {
      setIsCancellingRequest(false);
    }
  }

  async function handleSubmitReview(rating: number) {
    if (!activeIntentId || isSubmittingReview || effectiveReview) {
      return;
    }

    setErrorMessage(null);
    setIsSubmittingReview(true);
    setOptimisticReviewRating(rating);

    try {
      const response = await fetch(`/api/requests/${activeIntentId}/review`, {
        body: JSON.stringify({ rating }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });
      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to submit review.");
      }
    } catch (error) {
      setOptimisticReviewRating(null);
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to submit review.",
      );
    } finally {
      setIsSubmittingReview(false);
    }
  }

  async function handleDeleteIntent(intentId: string) {
    setErrorMessage(null);
    setIsDeletingId(intentId);

    try {
      await deleteIntent({ intentId, ownerExternalId });

      if (activeIntentId === intentId) {
        handleClearSelection();
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to delete request.",
      );
    } finally {
      setIsDeletingId(null);
    }
  }

  async function handleRetryRequest() {
    if (!activeIntentId || isRetryingRequest) {
      return;
    }

    setErrorMessage(null);
    setIsRetryingRequest(true);

    try {
      const response = await fetch(`/api/requests/${activeIntentId}/retry`, {
        method: "POST",
      });
      const payload = (await response.json()) as
        | {
          assistantMessage: string;
          relatedCatalogItems: CatalogItem[];
          workspace: WorkspaceState;
        }
        | { error?: string };

      if (!response.ok || !("workspace" in payload)) {
        throw new Error(
          "error" in payload && payload.error
            ? payload.error
            : "Failed to retry request.",
        );
      }

      setMessages([]);
      setWorkspace(payload.workspace);
      updateWorkspaceUrl({ browse: "workers" });
      setShowWorkspace(true);

    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to retry request.",
      );
    } finally {
      setIsRetryingRequest(false);
    }
  }

  function handleSidebarSelect(intent: SidebarIntentPreview) {
    updateWorkspaceUrl({
      browse: "workers",
      request: intent._id,
      view: "chat",
    });
    setOptimisticReviewRating(null);
    setShowWorkspace(true);
    setMessages([]);
  }

  function handleMarketplaceSelect(intent: SidebarIntentPreview) {
    updateWorkspaceUrl({
      browse: "requests",
      request: intent._id,
      view: intent.isOwner ? "chat" : "proposals",
    });
    setOptimisticReviewRating(null);
    setShowWorkspace(true);
    setMessages([]);
  }

  function handleClearSelection() {
    updateWorkspaceUrl({
      request: null,
      view: null,
    });
    setOptimisticReviewRating(null);
    setMessages([]);
    setConversationId(undefined);
    setWorkspace(emptyWorkspace);
  }

  function handleDownloadVideo(videoId: string) {
    window.open(
      `/api/video-jobs/${videoId}/content?download=1`,
      "_blank",
      "noopener,noreferrer",
    );
  }

  const isHomeView = !activeIntentId && displayedMessages.length === 0;

  return (
    <div className="mx-auto flex h-svh w-full max-w-450 flex-col overflow-hidden px-4 py-4 sm:px-4">
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
          onDeselect={handleClearSelection}
          onSelect={handleSidebarSelect}
          selectedIntentId={activeIntentId}
        />

        <section className="flex min-h-0 flex-col overflow-hidden border border-border">
          <div className="border-b border-border px-4 py-4">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                {activeIntentId ? (
                  <Button
                    className="h-auto px-0 text-[11px] uppercase tracking-[0.2em] text-muted-foreground"
                    onClick={handleClearSelection}
                    size="sm"
                    type="button"
                    variant="ghost"
                  >
                    <ArrowLeftIcon />
                    Boreal chat
                  </Button>
                ) : null}
                {/* <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                  {activeIntentId ? "Request thread" : "Boreal chat"}
                </p> */}
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-lg font-medium">
                    {activeIntentId
                      ? requestDetail?.intent?.title ?? selectedIntent?.title ?? "Request"
                      : "Helpful chat first. Tracked execution when work is approved."}
                  </h1>
                  {requestDetail?.intent ? (
                    <RequestStatusBadge status={requestDetail.intent.status} />
                  ) : null}
                  {requestDetail?.intent ? (
                    <InlineTierPill tier={requestDetail.intent.resolutionTier} />
                  ) : null}
                </div>

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

          {activeIntentId ? (
            <div className="">
              <div className="flex flex-col gap-0">

                <div className="flex border-b border-border items-center overflow-x-auto">
                  <button
                    className={cn(
                      "px-4 py-2 text-sm text-muted-foreground transition-colors",
                      selectedCenterTab === "chat" && "text-foreground",
                    )}
                    onClick={() => updateWorkspaceUrl({ view: "chat" })}
                    type="button"
                  >
                    Chat
                  </button>
                  <button
                    className={cn(
                      "px-3 py-2 text-sm text-muted-foreground transition-colors",
                      selectedCenterTab === "activity" && "text-foreground",
                    )}
                    onClick={() => updateWorkspaceUrl({ view: "activity" })}
                    type="button"
                  >
                    Activity
                  </button>
                  <button
                    className={cn(
                      "px-3 py-2 text-sm text-muted-foreground transition-colors",
                      selectedCenterTab === "workers" && "text-foreground",
                    )}
                    onClick={() => updateWorkspaceUrl({ view: "workers" })}
                    type="button"
                  >
                    Workers
                  </button>
                  <button
                    className={cn(
                      "px-3 py-2 text-sm text-muted-foreground transition-colors",
                      selectedCenterTab === "proposals" && "text-foreground",
                    )}
                    onClick={() => updateWorkspaceUrl({ view: "proposals" })}
                    type="button"
                  >
                    Proposals
                  </button>
                </div>

                {requestDetail?.intent ? (
                  <div className="p-1 ">
                    <div className="flex items-center justify-between px-3 py-3 border rounded-md border-border">
                      {activeIntentId && requestDetail?.intent && (
                        <RequestHeaderMeta
                          assignment={requestDetail.assignment}
                        />
                      )}
                      <RequestStageRail status={requestDetail.intent.status} />
                    </div>

                    <div className="flex flex-wrap gap-x-4 gap-y-2 px-3 pb-2 pt-3 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                        <span>{formatOutputTypes(requestDetail.intent.requestedOutputTypes)}</span>
                        <span>{requestDetail.intent.routeTarget.replaceAll("_", " ")}</span>
                        {requestDetail.intent.startedAt ? (
                          <span>Started {formatRequestDate(requestDetail.intent.startedAt)}</span>
                        ) : null}
                        {requestDetail.intent.completedAt ? (
                          <span>Done {formatRequestDate(requestDetail.intent.completedAt)}</span>
                        ) : null}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}

          <div className="min-h-0 flex-1 overflow-hidden">
            {isHomeView ? (
              <div className="mx-auto flex h-full w-full max-w-3xl flex-col justify-center px-4 py-8">
                <ConversationEmptyState
                  description="Ask anything directly. If Boreal detects a request worth tracking, it drafts it first, asks for approval, then hands it to the right tools or workers."
                  title="Start in chat"
                >
                  <div className="space-y-4 text-left">
                    <div className="space-y-2">
                      <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                        Request-aware assistant
                      </p>
                      <h2 className="text-3xl font-medium tracking-tight">
                        Chat first. Approve work only when you want Boreal to act.
                      </h2>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
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
                    {pendingApprovals.length > 0 ? (
                      <InlineApprovalQueue
                        isApprovingRequest={isApprovingRequest}
                        isCancellingRequest={isCancellingRequest}
                        onApproveRequest={handleApproveRequest}
                        onCancelRequest={handleCancelRequest}
                        onOpenRequest={(intentId) => {
                          const intent =
                            sidebarIntents.find((entry) => entry._id === intentId) ?? null;

                          if (intent) {
                            handleSidebarSelect(intent);
                          }
                        }}
                        requests={pendingApprovals}
                      />
                    ) : null}
                  </div>
                </ConversationEmptyState>
              </div>
            ) : activeIntentId && !isRequestLoading && !requestDetail ? (
              <div className="mx-auto flex h-full w-full max-w-3xl items-center px-4 py-8">
                <div className="w-full border border-border p-6">
                  <p className="text-sm font-medium">Request workspace unavailable</p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    This request is not available in the current session yet. Use a valid shared
                    workspace link or browse from your request list.
                  </p>
                </div>
              </div>
            ) : (
              <>
                {isRequestLoading ? (
                  <ScrollArea className="h-full">
                    <div className="mx-auto flex min-h-full w-full max-w-3xl flex-col gap-4 px-4 py-6">
                      <LoadingRequestPanel />
                    </div>
                  </ScrollArea>
                ) : activeIntentId && selectedCenterTab === "activity" ? (
                  <ScrollArea className="h-full">
                    <div className="mx-auto flex min-h-full w-full max-w-3xl flex-col gap-6 px-4 py-6">
                      <ActivityThreadPanel
                        requestDetail={requestDetail}
                        selectedIntent={selectedIntent}
                      />
                    </div>
                  </ScrollArea>
                ) : activeIntentId && selectedCenterTab === "workers" ? (
                  <ScrollArea className="h-full">
                    <div className="mx-auto flex min-h-full w-full max-w-3xl flex-col gap-6 px-4 py-6">
                      <RequestWorkersPanel
                        onBrowseWorkers={() => {
                          updateWorkspaceUrl({ browse: "workers" });
                          setShowWorkspace(true);
                        }}
                        requestDetail={requestDetail}
                        selectedIntent={selectedIntent}
                        shareUrl={selectedRequestShareUrl}
                      />
                    </div>
                  </ScrollArea>
                ) : activeIntentId && selectedCenterTab === "proposals" ? (
                  <ScrollArea className="h-full">
                    <div className="mx-auto flex min-h-full w-full max-w-3xl flex-col gap-6 px-4 py-6">
                      <ProposalViewerPanel
                        key={activeIntentId}
                        intentId={activeIntentId}
                        requestDetail={requestDetail}
                      />
                    </div>
                  </ScrollArea>
                ) : (
                  <Conversation className="h-full min-h-0">
                    <ConversationContent className="mx-auto flex min-h-full w-full max-w-3xl flex-col gap-6 px-4 py-6">
                      {activeIntentId && requestDetail ? (
                        <RequestChatTimeline
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
                            void refreshVideoJob(jobId);
                          }}
                          isApprovingRequest={isApprovingRequest}
                          isCancellingRequest={isCancellingRequest}
                          isSubmittingReview={isSubmittingReview}
                          onApproveRequest={handleApproveRequest}
                          onCancelRequest={handleCancelRequest}
                          onRetryRequest={handleRetryRequest}
                          onSubmitReview={handleSubmitReview}
                          requestDetail={requestDetail}
                          review={effectiveReview}
                          shouldPromptReview={shouldPromptReview}
                          workspace={effectiveWorkspace}
                        />
                      ) : (
                        displayedMessages.map((message) => (
                          <Message from={message.role} key={message.id}>
                            <MessageContent>
                              <MessageResponse>{message.content}</MessageResponse>
                            </MessageContent>
                          </Message>
                        ))
                      )}

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
                    </ConversationContent>
                    <ConversationScrollButton />
                  </Conversation>
                )}
              </>
            )}
          </div>

          <div className="border-t border-border p-4">
            <PromptInput
              onSubmit={async (input) => {
                await submitMessage(input.text);
              }}
            >
              <PromptInputBody>
                <PromptInputTextarea placeholder="Ask a question, draft a request, or ask Boreal to find the right product or capability." />
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
                  <Button
                    onClick={() => {
                      updateWorkspaceUrl({ browse: "requests" });
                      setShowWorkspace(true);
                    }}
                    size="sm"
                    type="button"
                    variant="ghost"
                  >
                    <PackageIcon />
                    Requests
                  </Button>
                  <Button
                    onClick={() => {
                      updateWorkspaceUrl({ browse: "workers" });
                      setShowWorkspace(true);
                    }}
                    size="sm"
                    type="button"
                    variant="ghost"
                  >
                    <BotIcon />
                    Workers
                  </Button>
                  <Button
                    disabled={isSubmitting}
                    onClick={() => {
                      void submitMessage(
                        "What can Boreal Agent do right now? Summarize your capabilities, the kinds of requests you can fulfill, and when approval or worker proposals are needed.",
                      );
                    }}
                    size="sm"
                    type="button"
                    variant="ghost"
                  >
                    <SparklesIcon />
                    Capabilities
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
              onSelectRequest={handleMarketplaceSelect}
              onTabChange={(value) => updateWorkspaceUrl({ browse: value })}
              ownerDisplayName={session?.user?.name ?? undefined}
              ownerExternalId={ownerExternalId}
              ownerHandle={undefined}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}

function RequestHeaderMeta({
  assignment,
}: {
  assignment: RequestDetail["assignment"];
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
      <span>Assigned to</span>
      <AssignedWorkerPills assignment={assignment} />
    </div>
  );
}

function InlineApprovalQueue({
  isApprovingRequest,
  isCancellingRequest,
  onApproveRequest,
  onCancelRequest,
  onOpenRequest,
  requests,
}: {
  isApprovingRequest: boolean;
  isCancellingRequest: boolean;
  onApproveRequest: (intentId?: string | null) => Promise<void>;
  onCancelRequest: (intentId?: string | null) => Promise<void>;
  onOpenRequest: (intentId: string) => void;
  requests: ApprovalQueueItem[];
}) {
  return (
    <div className="space-y-3 border border-border p-4">
      <div className="space-y-1">
        <p className="text-sm font-medium">Approval queue</p>
        <p className="text-xs text-muted-foreground">
          Up to three pending worker requests are shown here for quick triage.
        </p>
      </div>
      <div className="overflow-x-auto">
        <div className="min-w-[36rem] space-y-2">
          <div className="grid grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_auto] gap-3 border-b border-border pb-2 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
            <span>Request</span>
            <span>Agent</span>
            <span>Actions</span>
          </div>
          {requests.map((request) => (
            <div
              className="grid grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_auto] items-center gap-3 border border-border px-3 py-3"
              key={request.intentId}
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{request.title}</p>
                <p className="mt-1 truncate text-xs text-muted-foreground">{request.summary}</p>
              </div>
              <p className="truncate text-sm text-muted-foreground">{request.agentLabel}</p>
              <div className="flex items-center justify-end gap-2">
                <Button
                  onClick={() => onOpenRequest(request.intentId)}
                  size="sm"
                  type="button"
                  variant="ghost"
                >
                  View workers
                </Button>
                <Button
                  disabled={isApprovingRequest}
                  onClick={() => void onApproveRequest(request.intentId)}
                  size="sm"
                  type="button"
                >
                  {isApprovingRequest ? <LoaderIcon className="animate-spin" /> : <CheckIcon />}
                  Approve
                </Button>
                <Button
                  disabled={isCancellingRequest}
                  onClick={() => void onCancelRequest(request.intentId)}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  {isCancellingRequest ? <LoaderIcon className="animate-spin" /> : <XCircleIcon />}
                  Decline
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function InlineRequestActionEvent({
  intent,
  isApprovingRequest,
  isCancellingRequest,
  isSubmittingReview,
  onApproveRequest,
  onCancelRequest,
  onRetryRequest,
  onSubmitReview,
  shouldPromptReview,
}: {
  intent: NonNullable<RequestDetail["intent"]>;
  isApprovingRequest: boolean;
  isCancellingRequest: boolean;
  isSubmittingReview: boolean;
  onApproveRequest: () => void;
  onCancelRequest: () => void;
  onRetryRequest: () => Promise<void>;
  onSubmitReview: (rating: number) => void;
  shouldPromptReview: boolean;
}) {
  const actionState = getRequestActionState(intent.status, shouldPromptReview);

  if (actionState.kind === "none" || actionState.kind === "review") {
    return null;
  }

  return (
    <div className="space-y-3 border border-border p-4">
      <p className="text-sm font-medium">{actionState.title}</p>
      <p className="text-xs text-muted-foreground">{actionState.description}</p>
      {intent.missingDetails.length > 0 ? (
        <p className="text-xs text-muted-foreground">
          Missing details: {intent.missingDetails.join(" / ")}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        {actionState.kind === "approval" ? (
          <>
            <Button disabled={isApprovingRequest} onClick={onApproveRequest} size="sm" type="button">
              {isApprovingRequest ? <LoaderIcon className="animate-spin" /> : <CheckIcon />}
              Approve
            </Button>
            <Button
              disabled={isCancellingRequest}
              onClick={onCancelRequest}
              size="sm"
              type="button"
              variant="outline"
            >
              {isCancellingRequest ? <LoaderIcon className="animate-spin" /> : <XCircleIcon />}
              Cancel
            </Button>
          </>
        ) : null}
        {actionState.kind === "continue" ? (
          <Button disabled={isApprovingRequest} onClick={onApproveRequest} size="sm" type="button">
            {isApprovingRequest ? <LoaderIcon className="animate-spin" /> : <RefreshCwIcon />}
            Continue
          </Button>
        ) : null}
        {actionState.kind === "retry" ? (
          <Button disabled={isApprovingRequest} onClick={() => void onRetryRequest()} size="sm" type="button">
            {isApprovingRequest ? <LoaderIcon className="animate-spin" /> : <RefreshCwIcon />}
            Retry
          </Button>
        ) : null}
      </div>
      {shouldPromptReview ? (
        <InlineReviewActions disabled={isSubmittingReview} onSubmitReview={onSubmitReview} />
      ) : null}
    </div>
  );
}

type RequestTimelineItem =
  | { item: RequestDetail["messages"][number]; key: string; kind: "message"; timestamp: number }
  | { item: NonNullable<RequestDetail["artifact"]>; key: string; kind: "artifact"; timestamp: number }
  | { item: NonNullable<RequestDetail["review"]>; key: string; kind: "review"; timestamp: number };

function RequestChatTimeline({
  isApprovingRequest,
  isCancellingRequest,
  isRefreshingVideo,
  isSubmittingReview,
  onApproveRequest,
  onAskCatalogItem,
  onCancelRequest,
  onDownloadVideo,
  onQuickReply,
  onRefreshVideo,
  onRetryRequest,
  onSubmitReview,
  requestDetail,
  review,
  shouldPromptReview,
  workspace,
}: {
  isApprovingRequest: boolean;
  isCancellingRequest: boolean;
  isRefreshingVideo: boolean;
  isSubmittingReview: boolean;
  onApproveRequest: (intentId?: string | null) => Promise<void>;
  onAskCatalogItem: (item: CatalogItem) => void;
  onCancelRequest: (intentId?: string | null) => Promise<void>;
  onDownloadVideo: (videoId: string) => void;
  onQuickReply: (value: string) => void;
  onRefreshVideo: () => void;
  onRetryRequest: () => Promise<void>;
  onSubmitReview: (rating: number) => void;
  requestDetail: RequestDetail;
  review: RequestDetail["review"];
  shouldPromptReview: boolean;
  workspace: WorkspaceState;
}) {
  const timeline = buildRequestTimeline(requestDetail, review);

  return (
    <>
      {timeline.map((entry) => {
        if (entry.kind === "message") {
          const role = entry.item.role === "user" ? "user" : "assistant";

          return (
            <Message from={role} key={entry.key}>
              <MessageContent>
                <MessageResponse>{entry.item.body}</MessageResponse>
              </MessageContent>
            </Message>
          );
        }

        if (entry.kind === "artifact") {
          return (
            <InlineArtifactEvent
              artifact={entry.item}
              isRefreshingVideo={isRefreshingVideo}
              onDownloadVideo={onDownloadVideo}
              onRefreshVideo={onRefreshVideo}
              workspace={workspace}
              key={entry.key}
            />
          );
        }

        return (
          <InlineReviewEvent
            key={entry.key}
            review={entry.item}
          />
        );
      })}

      {shouldPromptReview ? (
        <InlinePendingReviewEvent
          disabled={isSubmittingReview}
          onSubmitReview={onSubmitReview}
        />
      ) : null}

      {requestDetail.intent ? (
        <InlineRequestActionEvent
          intent={requestDetail.intent}
          isApprovingRequest={isApprovingRequest}
          isCancellingRequest={isCancellingRequest}
          isSubmittingReview={isSubmittingReview}
          onApproveRequest={() => onApproveRequest(requestDetail.intent?._id)}
          onCancelRequest={() => onCancelRequest(requestDetail.intent?._id)}
          onRetryRequest={onRetryRequest}
          onSubmitReview={onSubmitReview}
          shouldPromptReview={shouldPromptReview}
        />
      ) : null}

      {timeline.length === 0 && hasRenderableInlineWorkspace(workspace) ? (
        <InlineWorkspaceCard
          isRefreshingVideo={isRefreshingVideo}
          onAskCatalogItem={onAskCatalogItem}
          onDownloadVideo={onDownloadVideo}
          onQuickReply={onQuickReply}
          onRefreshVideo={onRefreshVideo}
          workspace={workspace}
        />
      ) : null}
    </>
  );
}

function buildRequestTimeline(
  requestDetail: RequestDetail,
  review: RequestDetail["review"],
): RequestTimelineItem[] {
  const items: RequestTimelineItem[] = [];

  for (const message of requestDetail.messages) {
    items.push({
      item: message,
      key: `message-${message._id}`,
      kind: "message",
      timestamp: message.createdAt,
    });
  }

  if (requestDetail.artifact) {
    items.push({
      item: requestDetail.artifact,
      key: `artifact-${requestDetail.artifact._id}`,
      kind: "artifact",
      timestamp: requestDetail.artifact.updatedAt || requestDetail.artifact.createdAt,
    });
  }

  if (review?.reviewedAt) {
    items.push({
      item: review,
      key: `review-${review.reviewedAt}`,
      kind: "review",
      timestamp: review.reviewedAt,
    });
  }

  return items.sort((left, right) => {
    if (left.timestamp !== right.timestamp) {
      return left.timestamp - right.timestamp;
    }

    const order = { message: 0, artifact: 1, review: 2 };

    return order[left.kind] - order[right.kind];
  });
}

function InlineArtifactEvent({
  artifact,
  isRefreshingVideo,
  onDownloadVideo,
  onRefreshVideo,
  workspace,
}: {
  artifact: NonNullable<RequestDetail["artifact"]>;
  isRefreshingVideo: boolean;
  onDownloadVideo: (videoId: string) => void;
  onRefreshVideo: () => void;
  workspace: WorkspaceState;
}) {
  if (!hasRenderableInlineWorkspace(workspace)) {
    return null;
  }

  return (
    <div className="space-y-2">
      <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
        {formatRequestDate(artifact.updatedAt || artifact.createdAt)}
      </p>
      <InlineWorkspaceCard
        isRefreshingVideo={isRefreshingVideo}
        onAskCatalogItem={() => undefined}
        onDownloadVideo={onDownloadVideo}
        onQuickReply={() => undefined}
        onRefreshVideo={onRefreshVideo}
        workspace={workspace}
      />
    </div>
  );
}

function InlineReviewEvent({
  review,
}: {
  review: NonNullable<RequestDetail["review"]>;
}) {
  return (
    <div className="space-y-3 border border-border p-4">
      <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
        {review.reviewedAt ? formatRequestDate(review.reviewedAt) : "Review"}
      </p>
      <div className="flex items-center gap-1">
        {Array.from({ length: 5 }).map((_, index) => (
          <StarIcon
            className={cn(
              "size-4",
              index < review.rating ? "fill-current" : "text-muted-foreground",
            )}
            key={index}
          />
        ))}
      </div>
      {review.comment ? <p className="text-sm">{review.comment}</p> : null}
      <p className="text-xs text-muted-foreground">Review submitted.</p>
    </div>
  );
}

function InlinePendingReviewEvent({
  disabled,
  onSubmitReview,
}: {
  disabled: boolean;
  onSubmitReview: (rating: number) => void;
}) {
  return (
    <div className="space-y-3 border border-border p-4">
      <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
        Awaiting review
      </p>
      <p className="text-sm font-medium">Rate this delivery</p>
      <p className="text-xs text-muted-foreground">
        The request is complete. Leave a quick score here so performance stays visible.
      </p>
      <InlineReviewActions disabled={disabled} onSubmitReview={onSubmitReview} />
    </div>
  );
}

function InlineReviewActions({
  compact,
  disabled,
  onSubmitReview,
}: {
  compact?: boolean;
  disabled?: boolean;
  onSubmitReview: (rating: number) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 5 }).map((_, index) => {
          const rating = index + 1;

          return (
            <Button
              disabled={disabled}
              key={rating}
              onClick={() => onSubmitReview(rating)}
              size={compact ? "icon-sm" : "icon-sm"}
              type="button"
              variant="outline"
            >
              {disabled ? <LoaderIcon className="animate-spin" /> : <StarIcon />}
            </Button>
          );
        })}
      </div>
      {!compact ? (
        <p className="text-xs text-muted-foreground">
          Rate the delivery once it is complete so worker quality stays visible.
        </p>
      ) : null}
    </div>
  );
}

function InlineTierPill({ tier }: { tier: string }) {
  return (
    <span className="inline-flex items-center border border-border px-2 py-1 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
      Tier {tier.replaceAll("_", " ")}
    </span>
  );
}

function AssignedWorkerPills({
  assignment,
}: {
  assignment: RequestDetail["assignment"];
}) {
  const primaryWorker = getPrimaryWorker(assignment);

  return (
    <WorkerPill icon={primaryWorker.icon} label={primaryWorker.label} />
  );
}

function WorkerPill({
  icon: Icon,
  label,
}: {
  icon: typeof BotIcon;
  label: string;
}) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex items-center gap-2 border border-border px-2 py-1 text-muted-foreground">
            <Icon className="size-3.5" />
            <span className="text-[11px] uppercase tracking-[0.16em]">{label}</span>
          </span>
        </TooltipTrigger>
        <TooltipContent side="bottom">{label}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function LoadingRequestPanel() {
  return (
    <div className="space-y-4 border border-border p-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <LoaderIcon className="size-4 animate-spin" />
        <span>Loading request workspace</span>
      </div>
      <div className="space-y-2">
        <div className="h-10 animate-pulse bg-foreground/5" />
        <div className="h-24 animate-pulse bg-foreground/5" />
        <div className="h-16 animate-pulse bg-foreground/5" />
      </div>
    </div>
  );
}

function RequestWorkersPanel({
  onBrowseWorkers,
  requestDetail,
  selectedIntent,
  shareUrl,
}: {
  onBrowseWorkers: () => void;
  requestDetail: RequestDetail | null;
  selectedIntent: SidebarIntentPreview | null;
  shareUrl: string | null;
}) {
  const [copied, setCopied] = useState(false);
  const intent = requestDetail?.intent;
  const assignedAgent = requestDetail?.assignment?.agent;
  const assignedTools = requestDetail?.assignment?.tools ?? [];
  const requestedOutputTypes =
    intent?.requestedOutputTypes ?? selectedIntent?.requestedOutputTypes ?? ["text"];
  const routeTarget = intent?.routeTarget ?? selectedIntent?.routeTarget ?? "general_assistance";
  const workers = buildRequestWorkerCards(requestedOutputTypes, routeTarget, assignedAgent);
  const isWaitingForWorkers =
    !assignedAgent && (intent?.status === "open" || intent?.status === "proposed");

  async function handleCopyShare() {
    if (!shareUrl) {
      return;
    }

    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <div className="space-y-4">
      {isWaitingForWorkers ? (
        <div className="space-y-3 border border-border p-4">
          <p className="text-sm font-medium">Waiting for workers</p>
          <p className="text-xs text-muted-foreground">
            No worker is assigned yet. Share this workspace so human or agent talent can review it
            and start a proposal flow.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button onClick={onBrowseWorkers} size="sm" type="button" variant="outline">
              View workers
            </Button>
            <Button
              disabled={!shareUrl}
              onClick={() => void handleCopyShare()}
              size="sm"
              type="button"
              variant="outline"
            >
              <CopyIcon />
              {copied ? "Copied" : "Copy share link"}
            </Button>
            {shareUrl ? (
              <Button asChild size="sm" type="button" variant="ghost">
                <a href={shareUrl} rel="noreferrer" target="_blank">
                  <ExternalLinkIcon />
                  Open share link
                </a>
              </Button>
            ) : null}
          </div>
          <p className="text-xs text-muted-foreground">
            Workers can review this request from the public directory and submit proposals into the
            same workspace.
          </p>
        </div>
      ) : null}

      <div className="space-y-3 border border-border p-4">
        <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
          Participants
        </p>
        <div className="space-y-3">
          {workers.map((worker) => (
            <div className="border border-border p-3" key={worker.title}>
              <div className="flex items-start gap-3">
                <div className="flex size-9 items-center justify-center border border-border">
                  <worker.icon className="size-4 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium">{worker.title}</p>
                    <span className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                      {worker.meta}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{worker.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        {assignedTools.length > 0 ? (
          <p className="text-xs text-muted-foreground">
            Current tools: {assignedTools.join(" / ")}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function ProposalViewerPanel({
  intentId,
  requestDetail,
}: {
  intentId: string;
  requestDetail: RequestDetail | null;
}) {
  const [proposalMessage, setProposalMessage] = useState("");
  const [proposalDraft, setProposalDraft] = useState<Record<string, unknown> | null>(null);
  const [isDraftingProposal, setIsDraftingProposal] = useState(false);
  const [isSubmittingProposal, setIsSubmittingProposal] = useState(false);
  const [approvingProposalId, setApprovingProposalId] = useState<string | null>(null);
  const isOwner = requestDetail?.access?.isOwner ?? false;
  const proposals = requestDetail?.proposals ?? [];
  const visibleProposals = isOwner ? proposals : proposals.filter((proposal) => proposal.isMine);

  async function handleDraftProposal() {
    if (!proposalMessage.trim() || isDraftingProposal) {
      return;
    }

    setIsDraftingProposal(true);

    try {
      const response = await fetch(`/api/requests/${intentId}/proposals`, {
        body: JSON.stringify({
          action: "draft",
          message: proposalMessage,
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });
      const payload = (await response.json()) as {
        draft?: Record<string, unknown>;
        error?: string;
      };

      if (!response.ok || !payload.draft) {
        throw new Error(payload.error ?? "Failed to draft proposal.");
      }

      setProposalDraft(payload.draft);
    } finally {
      setIsDraftingProposal(false);
    }
  }

  async function handleSubmitProposal() {
    if (!proposalDraft || isSubmittingProposal) {
      return;
    }

    setIsSubmittingProposal(true);

    try {
      const response = await fetch(`/api/requests/${intentId}/proposals`, {
        body: JSON.stringify({
          action: "submit",
          draft: proposalDraft,
          message: proposalMessage,
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });
      const payload = (await response.json()) as { error?: string; submitted?: boolean };

      if (!response.ok || !payload.submitted) {
        throw new Error(payload.error ?? "Failed to submit proposal.");
      }

      setProposalDraft(null);
      setProposalMessage("");
    } finally {
      setIsSubmittingProposal(false);
    }
  }

  async function handleApproveProposal(proposalId: string) {
    if (approvingProposalId) {
      return;
    }

    setApprovingProposalId(proposalId);

    try {
      const response = await fetch(
        `/api/requests/${intentId}/proposals/${proposalId}/approve`,
        { method: "POST" },
      );
      const payload = (await response.json()) as { approved?: boolean; error?: string };

      if (!response.ok || !payload.approved) {
        throw new Error(payload.error ?? "Failed to approve proposal.");
      }
    } finally {
      setApprovingProposalId(null);
    }
  }

  return (
    <div className="space-y-4">
      {isOwner ? (
        <div className="space-y-3 border border-border p-4">
          <p className="text-sm font-medium">Proposal approvals</p>
          <p className="text-xs text-muted-foreground">
            Review who is asking to take this request, what they will deliver, and the quoted
            price before approving.
          </p>
        </div>
      ) : requestDetail?.access?.canSubmitProposal ? (
        <div className="space-y-4 border border-border p-4">
          <div className="space-y-1">
            <p className="text-sm font-medium">Submit a proposal</p>
            <p className="text-xs text-muted-foreground">
              Describe how you would handle the request, include your quote and ETA, then confirm
              before sending it to the owner.
            </p>
          </div>
          <textarea
            className="min-h-32 w-full border border-border bg-transparent p-3 text-sm outline-none"
            onChange={(event) => setProposalMessage(event.target.value)}
            placeholder="I can deliver a polished motion piece in 3 days for $450. Deliverables include..."
            value={proposalMessage}
          />
          {proposalDraft ? (
            <div className="space-y-3 border border-border p-4">
              <p className="text-sm font-medium">Confirm proposal</p>
              <ProposalCardBody proposal={mapDraftProposal(proposalDraft)} />
              <div className="flex flex-wrap gap-2">
                <Button disabled={isSubmittingProposal} onClick={() => void handleSubmitProposal()} size="sm" type="button">
                  {isSubmittingProposal ? <LoaderIcon className="animate-spin" /> : <CheckIcon />}
                  Send proposal
                </Button>
                <Button
                  onClick={() => setProposalDraft(null)}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <Button
              disabled={isDraftingProposal || proposalMessage.trim().length === 0}
              onClick={() => void handleDraftProposal()}
              size="sm"
              type="button"
            >
              {isDraftingProposal ? <LoaderIcon className="animate-spin" /> : <SparklesIcon />}
              Draft proposal
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-3 border border-border p-4">
          <p className="text-sm font-medium">Proposal submission unavailable</p>
          <p className="text-xs text-muted-foreground">
            This workspace is not accepting proposals right now.
          </p>
        </div>
      )}

      <div className="space-y-3 border border-border p-4">
        <p className="text-sm font-medium">{isOwner ? "Received proposals" : "My proposals"}</p>
        {visibleProposals.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            {isOwner
              ? "No proposals yet. Shared worker links and public visibility will drive incoming bids."
              : "You have not submitted a proposal to this request yet."}
          </p>
        ) : (
          <div className="space-y-3">
            {visibleProposals.map((proposal) => (
              <div className="border border-border p-4" key={proposal._id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="flex size-9 items-center justify-center border border-border">
                      {proposal.proposer.kind === "agent" ? (
                        <BotIcon className="size-4 text-muted-foreground" />
                      ) : (
                        <UserIcon className="size-4 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{proposal.proposer.displayName}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {proposal.proposer.handle
                          ? `@${proposal.proposer.handle}`
                          : proposal.proposer.kind}
                      </p>
                    </div>
                  </div>
                  <div className="text-right text-xs text-muted-foreground">
                    <p>{proposal.status.replaceAll("_", " ")}</p>
                    <p className="mt-1">{formatRequestDate(proposal.createdAt)}</p>
                  </div>
                </div>
                <div className="mt-4">
                  <ProposalCardBody proposal={proposal} />
                </div>
                {isOwner && proposal.status === "submitted" ? (
                  <div className="mt-4 flex gap-2">
                    <Button
                      disabled={approvingProposalId === proposal._id}
                      onClick={() => void handleApproveProposal(proposal._id)}
                      size="sm"
                      type="button"
                    >
                      {approvingProposalId === proposal._id ? (
                        <LoaderIcon className="animate-spin" />
                      ) : (
                        <CheckIcon />
                      )}
                      Approve proposal
                    </Button>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ProposalCardBody({
  proposal,
}: {
  proposal: {
    currency: string;
    deliverablesBody: string;
    etaAt: number;
    price: number;
  };
}) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-x-4 gap-y-2 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
        <span>
          Quote {proposal.price} {proposal.currency}
        </span>
        <span>ETA {formatRequestDate(proposal.etaAt)}</span>
      </div>
      <p className="text-sm">{proposal.deliverablesBody}</p>
    </div>
  );
}

function mapDraftProposal(draft: Record<string, unknown>) {
  return {
    currency: typeof draft.currency === "string" ? draft.currency : "USD",
    deliverablesBody:
      typeof draft.deliverablesBody === "string" ? draft.deliverablesBody : "",
    etaAt:
      Date.now() +
      (typeof draft.etaDays === "number" ? draft.etaDays : 7) * 24 * 60 * 60 * 1000,
    price: typeof draft.price === "number" ? draft.price : 0,
  };
}

function getRequestActionState(status: string, reviewPending: boolean) {
  if (reviewPending) {
    return {
      description: "The work is delivered. Capture a quick rating inline before moving on.",
      kind: "review" as const,
      title: "Delivery finished",
    };
  }

  if (status === "proposed" || status === "open") {
    return {
      description:
        "Boreal has identified the request but has not started any worker or generator yet.",
      kind: "approval" as const,
      title: status === "open" ? "Waiting room" : "Approve to start",
    };
  }

  if (status === "claimed" || status === "in_progress") {
    return {
      description:
        "Work is assigned. Retry if execution stalled, failed to start, or needs to be rerun.",
      kind: "retry" as const,
      title: "Work in flight",
    };
  }

  if (status === "blocked") {
    return {
      description:
        "Automatic execution hit an error. Retry to continue this request without starting over.",
      kind: "retry" as const,
      title: "Needs intervention",
    };
  }

  if (status === "closed") {
    return {
      description:
        "This request was stopped before delivery. Continue if you want Boreal to pick it back up.",
      kind: "continue" as const,
      title: "Request paused",
    };
  }

  return {
    description: "This request is complete. No further action is required here.",
    kind: "none" as const,
    title: "Complete",
  };
}

function getPrimaryWorker(
  assignment: RequestDetail["assignment"],
) {
  const label = assignment?.agent ?? "Boreal Agent";
  const icon = label.toLowerCase().includes("boreal") ? BotIcon : UserIcon;

  return {
    icon,
    label,
  };
}

function humanizeToolLabel(value: string) {
  return value.replaceAll("-", " ").replaceAll("_", " ");
}

function buildRequestWorkerCards(
  requestedOutputTypes: string[],
  routeTarget: string,
  assignedAgent?: string | null,
) {
  const cards = [
    {
      description: "General routed assistant for text answers, orchestration, and fallback handling.",
      icon: BotIcon,
      meta: assignedAgent ? "assigned" : "available",
      title: assignedAgent ?? "Boreal Agent",
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
      description: "Searches supply inventory, compares offers, and surfaces matched products.",
      icon: PackageIcon,
      meta: "catalog",
      title: "Catalog Worker",
    });
  }

  return cards.slice(0, 4);
}

function normalizeCenterViewTab(value: string | null): CenterViewTab {
  if (value === "activity" || value === "workers" || value === "proposals") {
    return value;
  }

  return "chat";
}

async function consumeChatStream(input: {
  assistantMessageId: string;
  response: Response;
  setMessages: Dispatch<SetStateAction<ChatMessage[]>>;
}) {
  const reader = input.response.body?.getReader();

  if (!reader) {
    throw new Error("Chat stream reader was unavailable.");
  }

  const decoder = new TextDecoder();
  let buffer = "";
  let finalPayload: ChatAssistantResponse | null = null;

  while (true) {
    const { done, value } = await reader.read();

    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const trimmed = line.trim();

      if (!trimmed) {
        continue;
      }

      const event = JSON.parse(trimmed) as
        | { delta: string; type: "assistant-delta" }
        | { message: string; type: "error" }
        | { payload: ChatAssistantResponse; type: "final" };

      if (event.type === "assistant-delta") {
        input.setMessages((current) =>
          current.map((message) =>
            message.id === input.assistantMessageId
              ? { ...message, content: `${message.content}${event.delta}` }
              : message,
          ),
        );
        continue;
      }

      if (event.type === "error") {
        throw new Error(event.message);
      }

      finalPayload = event.payload;
    }
  }

  if (!finalPayload) {
    throw new Error("Chat response was incomplete.");
  }

  input.setMessages((current) =>
    current.map((message) =>
      message.id === input.assistantMessageId
        ? {
            ...message,
            content: message.content || finalPayload.assistantMessage,
          }
        : message,
    ),
  );

  return finalPayload;
}

function normalizeWorkspaceTab(value: string | null): WorkspaceTab {
  if (value === "requests" || value === "workers" || value === "profile") {
    return value;
  }

  if (value === "capabilities") {
    return "profile";
  }

  return "workers";
}

function hasRenderableInlineWorkspace(workspaceState: WorkspaceState) {
  return workspaceState.kind !== "empty";
}

function InlineWorkspaceCard({
  isRefreshingVideo,
  onAskCatalogItem,
  onDownloadVideo,
  onQuickReply,
  onRefreshVideo,
  workspace,
}: {
  isRefreshingVideo: boolean;
  onAskCatalogItem: (item: CatalogItem) => void;
  onDownloadVideo: (videoId: string) => void;
  onQuickReply: (value: string) => void;
  onRefreshVideo: () => void;
  workspace: WorkspaceState;
}) {
  if (workspace.kind === "artifact") {
    if (workspace.artifact.kind === "image") {
      return (
        <div className="space-y-4 border border-border p-4">
          <div className="space-y-1">
            <p className="text-sm font-medium">{workspace.title}</p>
            <p className="text-xs text-muted-foreground">{workspace.subtitle}</p>
          </div>
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
        <div className="space-y-4 border border-border p-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <MicIcon className="size-4 text-muted-foreground" />
              <p className="text-sm font-medium">{workspace.title}</p>
            </div>
            <p className="text-xs text-muted-foreground">{workspace.subtitle}</p>
          </div>
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
          <div className="space-y-1 text-xs text-muted-foreground">
            <p>Voice: {workspace.artifact.voice}</p>
            <p>{workspace.artifact.transcript}</p>
          </div>
        </div>
      );
    }

    return (
      <InlineVideoCard
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
      <div className="space-y-4 border border-border p-4">
        <div className="space-y-1">
          <p className="text-sm font-medium">{workspace.title}</p>
          <p className="text-xs text-muted-foreground">{workspace.subtitle}</p>
        </div>
        <div className="space-y-3">
          {workspace.items.map((item) => (
            <div className="border border-border p-3" key={item.id}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{item.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{item.description}</p>
                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                    <span>{item.category}</span>
                    <span>{item.deliveryType}</span>
                    <span>{item.priceLabel}</span>
                  </div>
                </div>
                <Button
                  onClick={() => onAskCatalogItem(item)}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  Ask more
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (workspace.kind === "clarification") {
    return (
      <div className="space-y-4 border border-border p-4">
        <div className="space-y-1">
          <p className="text-sm font-medium">{workspace.title}</p>
          <p className="text-xs text-muted-foreground">{workspace.subtitle}</p>
        </div>
        <div className="border border-border p-3">
          <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Needed</p>
          <div className="mt-3 space-y-2 text-sm">
            {workspace.questions.map((question) => (
              <p key={question}>{question}</p>
            ))}
          </div>
        </div>
        {workspace.suggestions.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {workspace.suggestions.map((suggestion) => (
              <Button
                key={suggestion}
                onClick={() => onQuickReply(suggestion)}
                size="sm"
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

  return null;
}

function InlineVideoCard({
  artifact,
  isRefreshingVideo,
  onDownloadVideo,
  onRefreshVideo,
  subtitle,
  title,
}: {
  artifact: Extract<WorkspaceState, { kind: "artifact" }>["artifact"] & { kind: "video" };
  isRefreshingVideo: boolean;
  onDownloadVideo: (videoId: string) => void;
  onRefreshVideo: () => void;
  subtitle: string;
  title: string;
}) {
  const isCompleted = artifact.status === "completed";

  return (
    <div className="space-y-4 border border-border p-4">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <ClapperboardIcon className="size-4 text-muted-foreground" />
          <p className="text-sm font-medium">{title}</p>
        </div>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </div>

      {isCompleted ? (
        <video
          className="w-full border border-border"
          controls
          preload="metadata"
          src={`/api/video-jobs/${artifact.jobId}/content`}
        />
      ) : null}

      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>Status: {artifact.status.replaceAll("_", " ")}</span>
          <span>{artifact.progress}%</span>
        </div>
        <Progress className="h-2" value={artifact.progress} />
        <div className="flex flex-wrap gap-2">
          <Button
            disabled={isRefreshingVideo}
            onClick={onRefreshVideo}
            size="sm"
            type="button"
            variant="outline"
          >
            <RefreshCwIcon className={isRefreshingVideo ? "animate-spin" : ""} />
            Refresh
          </Button>
          <Button
            disabled={!isCompleted}
            onClick={() => onDownloadVideo(artifact.jobId)}
            size="sm"
            type="button"
            variant="outline"
          >
            Download
          </Button>
        </div>
      </div>
    </div>
  );
}

function ActivityThreadPanel({
  requestDetail,
  selectedIntent,
}: {
  requestDetail: RequestDetail | null;
  selectedIntent: SidebarIntentPreview | null;
}) {
  if (!requestDetail?.intent && !selectedIntent) {
    return null;
  }

  const intent = requestDetail?.intent;

  return (
    <div className="space-y-4">
      {intent ? (
        <div className="space-y-3 border border-border p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium">{intent.title}</p>
              <p className="mt-1 text-xs text-muted-foreground">{intent.summary}</p>
            </div>
            <RequestStatusBadge status={intent.status} />
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-2 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
            <span>{formatOutputTypes(intent.requestedOutputTypes)}</span>
            <span>{intent.routeTarget.replaceAll("_", " ")}</span>
            <span>{intent.resolutionTier.replaceAll("_", " ")}</span>
          </div>
        </div>
      ) : null}

      {requestDetail?.assignment ? (
        <div className="space-y-3 border border-border p-4">
          <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Assignment</p>
          <div className="space-y-2 text-sm">
            <p>Agent: {requestDetail.assignment.agent ?? "Boreal Agent"}</p>
            <p>Provider: {requestDetail.assignment.provider}</p>
            <p>
              Tools:{" "}
              {requestDetail.assignment.tools.length > 0
                ? requestDetail.assignment.tools.join(" / ")
                : "Not assigned yet"}
            </p>
          </div>
        </div>
      ) : null}

      {requestDetail?.activity?.length ? (
        <div className="space-y-3 border border-border p-4">
          <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Activity</p>
          <div className="space-y-3">
            {requestDetail.activity.map((activity) => (
              <div className="border-l border-border pl-3" key={activity._id}>
                <p className="text-sm font-medium">{labelActivity(activity.type)}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatRequestDate(activity.createdAt)}
                </p>
                {activity.payload ? (
                  <p className="mt-2 text-xs text-muted-foreground">
                    {describeActivityPayload(activity.payload)}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {requestDetail?.review ? (
        <div className="space-y-3 border border-border p-4">
          <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Review</p>
          <div className="flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, index) => (
              <StarIcon
                className={cn(
                  "size-4",
                  index < requestDetail.review!.rating
                    ? "fill-current"
                    : "text-muted-foreground",
                )}
                key={index}
              />
            ))}
          </div>
          {requestDetail.review.reviewedAt ? (
            <p className="text-xs text-muted-foreground">
              Submitted {formatRequestDate(requestDetail.review.reviewedAt)}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function labelActivity(type: string) {
  return type.replace("request.", "").replaceAll("_", " ");
}

function describeActivityPayload(payload: Record<string, unknown>) {
  const parts: string[] = [];

  if (typeof payload.assignedAgent === "string") {
    parts.push(`Agent: ${payload.assignedAgent}`);
  }

  if (Array.isArray(payload.assignedToolNames) && payload.assignedToolNames.length > 0) {
    parts.push(`Tools: ${payload.assignedToolNames.join(", ")}`);
  }

  if (typeof payload.progress === "number") {
    parts.push(`Progress: ${payload.progress}%`);
  }

  if (typeof payload.status === "string") {
    parts.push(`Status: ${payload.status.replaceAll("_", " ")}`);
  }

  if (typeof payload.rating === "number") {
    parts.push(`Rating: ${payload.rating}/5`);
  }

  if (typeof payload.routeTarget === "string") {
    parts.push(`Route: ${payload.routeTarget.replaceAll("_", " ")}`);
  }

  return parts.join(" | ");
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
    const voice = typeof metadata.voice === "string" ? metadata.voice : "alloy";

    if (base64 && mediaType) {
      return {
        artifact: {
          base64,
          format: mediaType.split("/")[1] ?? "mp3",
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

  if (detail.artifact?.artifactKind === "video") {
    const metadata = detail.artifact.metadata;
    const jobId =
      (typeof metadata?.jobId === "string" ? metadata.jobId : null) ??
      detail.artifact.remoteId ??
      "";
    const prompt =
      typeof metadata?.prompt === "string" ? metadata.prompt : detail.intent.summary;
    const status = normalizeVideoStatus(detail.artifact.status, metadata?.status);

    if (jobId) {
      return {
        artifact: {
          errorMessage:
            typeof metadata?.errorMessage === "string" ? metadata.errorMessage : undefined,
          expiresAt: typeof metadata?.expiresAt === "number" ? metadata.expiresAt : undefined,
          jobId,
          kind: "video",
          model: typeof metadata?.model === "string" ? metadata.model : "sora-2",
          progress: typeof metadata?.progress === "number" ? metadata.progress : 0,
          prompt,
          seconds: typeof metadata?.seconds === "string" ? metadata.seconds : "8",
          size: typeof metadata?.size === "string" ? metadata.size : "1280x720",
          status,
          title: detail.artifact.title,
        },
        kind: "artifact",
        subtitle: detail.artifact.subtitle,
        title: detail.artifact.title,
      };
    }
  }

  if (detail.intent.needsClarification && detail.intent.missingDetails.length > 0) {
    return {
      kind: "clarification",
      questions: detail.intent.missingDetails,
      subtitle: "This request is blocked until the missing details are provided.",
      suggestions: detail.intent.suggestedReplies,
      title: "Blocked request",
    };
  }

  return emptyWorkspace;
}

function normalizeVideoStatus(
  artifactStatus: NonNullable<RequestDetail["artifact"]>["status"],
  metadataStatus: unknown,
): "completed" | "failed" | "in_progress" | "queued" {
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
