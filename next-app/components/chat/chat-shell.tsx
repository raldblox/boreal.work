"use client";

import { useEffect, useMemo, useState, type Dispatch, type SetStateAction } from "react";
import Image from "next/image";
import Link from "next/link";
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
  DownloadIcon,
  ExternalLinkIcon,
  FileIcon,
  LoaderIcon,
  MicIcon,
  PackageIcon,
  PanelRightCloseIcon,
  PanelRightOpenIcon,
  RefreshCwIcon,
  SparklesIcon,
  StarIcon,
  Trash2Icon,
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
  BorealProfileView,
} from "@/components/profiles/boreal-profile-view";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type {
  RequestDetail,
  SidebarIntentPreview,
} from "@/lib/boreal/integrations/convex/function-refs";
import { convexFunctionRefs } from "@/lib/boreal/integrations/convex/function-refs";
import type {
  CatalogItem,
  ChatAssistantResponse,
  ChatUiContext,
  WorkspaceState,
} from "@/lib/boreal/schemas/chat";
import {
  normalizeProposalDraft,
  type ProposalDraft,
} from "@/lib/boreal/schemas/proposal";
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
  createdAt: number;
  id: string;
  role: "assistant" | "user";
};

type CenterViewTab = "activity" | "chat" | "participants" | "workspace";

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
  "Help me package my capabilities into a strong public worker profile with skills, offers, and products.",
  "Turn this into a public request for a problem nobody has solved for me yet, and prepare it for proposals first.",
  "Generate a short voiceover for a product announcement in a warm tone.",
  "Show me the supply catalog and explain which Boreal tool fits each use case.",
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

type DeliveryAttachmentDraft = {
  fileName: string;
  fileSize: number;
  id: string;
  mediaType: string;
  progress: number;
  status: "error" | "uploaded" | "uploading";
  storageId: string | null;
};

type DeliveryDraft = {
  attachments: DeliveryAttachmentDraft[];
  deliverablesBody: string;
};

const emptyProposalDraft = (): ProposalDraft => ({
  currency: "USD",
  deliverablesBody: "",
  deliverablesType: "markdown",
  etaDays: 7,
  price: 100,
  summary: "",
});

const emptyDeliveryDraft = (): DeliveryDraft => ({
  attachments: [],
  deliverablesBody: "",
});

const generateUploadUrlMutation = makeFunctionReference<
  "mutation",
  Record<string, never>,
  string
>("fulfillments:generateUploadUrl");

export function ChatShell() {
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isApprovingRequest, setIsApprovingRequest] = useState(false);
  const [isCancellingRequest, setIsCancellingRequest] = useState(false);
  const [isRetryingRequest, setIsRetryingRequest] = useState(false);
  const [isRefreshingRequest, setIsRefreshingRequest] = useState(false);
  const [isMarkingRequestFulfilled, setIsMarkingRequestFulfilled] = useState(false);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [optimisticReviewRating, setOptimisticReviewRating] = useState<number | null>(null);
  const [workspace, setWorkspace] = useState<WorkspaceState>(emptyWorkspace);
  const [showWorkspace, setShowWorkspace] = useState(true);
  const [isRefreshingVideo, setIsRefreshingVideo] = useState(false);
  const [composerText, setComposerText] = useState("");
  const [isBorealProfileOpen, setIsBorealProfileOpen] = useState(false);
  const [proposalMessage, setProposalMessage] = useState("");
  const [proposalDraft, setProposalDraft] = useState<ProposalDraft>(emptyProposalDraft);
  const [isDraftingProposal, setIsDraftingProposal] = useState(false);
  const [isSubmittingProposal, setIsSubmittingProposal] = useState(false);
  const [approvingProposalId, setApprovingProposalId] = useState<string | null>(null);
  const [deliveryDraft, setDeliveryDraft] = useState<DeliveryDraft>(emptyDeliveryDraft);
  const [isSubmittingDelivery, setIsSubmittingDelivery] = useState(false);
  const [isArchivingRequest, setIsArchivingRequest] = useState(false);

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
  const isArchivedTranscript = Boolean(
    requestDetail?.intent?.status === "closed" &&
      requestDetail.intent.closedReason === "archived_by_user",
  );
  const myProposal = requestDetail?.proposals.find((proposal) => proposal.isMine) ?? null;
  const hasSubmittedProposal = Boolean(myProposal);
  const canSubmitDelivery = requestDetail?.access?.canSubmitWork ?? false;
  const canViewRequestChat = requestDetail?.access?.canViewChat ?? false;
  const isBorealAssignedToActiveRequest = Boolean(
    activeIntentId &&
      isBorealAssigned({
        assignedAgent: requestDetail?.assignment?.agent ?? selectedIntent?.assignedAgent ?? null,
        participants: requestDetail?.participants,
      }),
  );
  const shouldShowHomeBorealButton = !activeIntentId;
  const shouldShowAssignedBorealButton = Boolean(activeIntentId && isBorealAssignedToActiveRequest);
  const effectiveBorealEnabled = !activeIntentId || isBorealAssignedToActiveRequest;

  const deleteIntent = useMutation(deleteIntentMutation);
  const generateUploadUrl = useMutation(generateUploadUrlMutation);
  const borealAgentStats = useQuery(convexFunctionRefs.getBorealAgentStats, {});

  const requestWorkspace = requestDetail?.intent
    ? buildWorkspaceFromRequestDetail(requestDetail)
    : null;

  const requestMessages: ChatMessage[] =
    requestDetail?.messages.map((message) => ({
      content: message.body,
      createdAt: message.createdAt,
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
    params.set("view", "participants");

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
    const now = Date.now();

    if (activeIntentId) {
      try {
        const threadResponse = await fetch(`/api/requests/${activeIntentId}/messages`, {
          body: JSON.stringify({ body: trimmed }),
          headers: {
            "Content-Type": "application/json",
          },
          method: "POST",
        });
        const threadPayload = (await threadResponse.json()) as { error?: string; sent?: boolean };

        if (!threadResponse.ok || !threadPayload.sent) {
          throw new Error(threadPayload.error ?? "Failed to send request message.");
        }

        setComposerText("");

        if (!effectiveBorealEnabled) {
          setIsSubmitting(false);
          return;
        }
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : "Failed to send request message.",
        );
        setIsSubmitting(false);
        return;
      }
    }

    if (!activeIntentId && !effectiveBorealEnabled) {
      try {
        const response = await fetch("/api/conversations/messages", {
          body: JSON.stringify({
            body: trimmed,
            conversationId: activeConversationId,
          }),
          headers: {
            "Content-Type": "application/json",
          },
          method: "POST",
        });
        const payload = (await response.json()) as {
          conversationId?: string;
          error?: string;
          posted?: boolean;
        };

        if (!response.ok || !payload.posted || !payload.conversationId) {
          throw new Error(payload.error ?? "Failed to save conversation message.");
        }

        setConversationId(payload.conversationId);
        setMessages((current) => [
          ...current,
          {
            content: trimmed,
            createdAt: now,
            id: crypto.randomUUID(),
            role: "user",
          },
        ]);
        setComposerText("");
        return;
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : "Failed to save conversation message.",
        );
        return;
      } finally {
        setIsSubmitting(false);
      }
    }

    const assistantMessageId = crypto.randomUUID();
    setMessages((current) => [
      ...current,
      ...(!activeIntentId
        ? [
            {
              content: trimmed,
              createdAt: now,
              id: crypto.randomUUID(),
              role: "user" as const,
            },
          ]
        : []),
      {
        content: "",
        createdAt: now,
        id: assistantMessageId,
        role: "assistant",
      },
    ]);

    try {
      const response = await fetch("/api/chat", {
        body: JSON.stringify({
          conversationId: activeConversationId,
          context: buildChatUiContext({
            activeIntentId,
            requestDetail,
            selectedCenterTab,
            workspaceTab,
          }),
          message: trimmed,
          provider: "boreal-agent",
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
      setComposerText("");
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
          (currentMessage) => currentMessage.id !== assistantMessageId,
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

    try {
      await deleteIntent({ intentId, ownerExternalId });

      if (activeIntentId === intentId) {
        handleClearSelection();
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to delete request.",
      );
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

  async function handleRefreshRequest() {
    if (isRefreshingRequest) {
      return;
    }

    setErrorMessage(null);
    setIsRefreshingRequest(true);

    try {
      const artifact = requestDetail?.artifact;
      const metadata = artifact?.metadata;
      const jobId =
        artifact?.artifactKind === "video"
          ? ((typeof metadata?.jobId === "string" ? metadata.jobId : null) ?? artifact.remoteId)
          : null;

      if (jobId) {
        await refreshVideoJob(jobId);
      }

      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to refresh request.",
      );
    } finally {
      setIsRefreshingRequest(false);
    }
  }

  async function handleMarkRequestFulfilled() {
    if (!activeIntentId || isMarkingRequestFulfilled) {
      return;
    }

    setErrorMessage(null);
    setIsMarkingRequestFulfilled(true);

    try {
      const response = await fetch(`/api/requests/${activeIntentId}/fulfill`, {
        method: "POST",
      });
      const payload = (await response.json()) as { error?: string; fulfilled?: boolean };

      if (!response.ok || !payload.fulfilled) {
        throw new Error(payload.error ?? "Failed to mark request as fulfilled.");
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to mark request as fulfilled.",
      );
    } finally {
      setIsMarkingRequestFulfilled(false);
    }
  }

  async function handleArchiveRequest() {
    if (!activeIntentId || isArchivingRequest) {
      return;
    }

    setErrorMessage(null);
    setIsArchivingRequest(true);

    try {
      const response = await fetch(`/api/requests/${activeIntentId}/archive`, {
        method: "POST",
      });
      const payload = (await response.json()) as { archived?: boolean; error?: string };

      if (!response.ok || !payload.archived) {
        throw new Error(payload.error ?? "Failed to archive request.");
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to archive request.",
      );
    } finally {
      setIsArchivingRequest(false);
    }
  }

  async function handleDraftProposal() {
    if (!activeIntentId || !proposalMessage.trim() || isDraftingProposal) {
      return;
    }

    setErrorMessage(null);
    setIsDraftingProposal(true);

    try {
      const response = await fetch(`/api/requests/${activeIntentId}/proposals`, {
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

      setProposalDraft(normalizeProposalDraft(payload.draft, proposalMessage));
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to draft proposal.",
      );
    } finally {
      setIsDraftingProposal(false);
    }
  }

  async function handleSubmitProposal() {
    if (!activeIntentId || isSubmittingProposal) {
      return;
    }

    setErrorMessage(null);
    setIsSubmittingProposal(true);

    try {
      const draft = normalizeProposalDraft(proposalDraft, proposalMessage);
      const response = await fetch(`/api/requests/${activeIntentId}/proposals`, {
        body: JSON.stringify({
          action: "submit",
          draft,
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

      setProposalDraft(emptyProposalDraft());
      setProposalMessage("");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to submit proposal.",
      );
    } finally {
      setIsSubmittingProposal(false);
    }
  }

  async function handleApproveProposal(proposalId: string) {
    if (!activeIntentId || approvingProposalId) {
      return;
    }

    setErrorMessage(null);
    setApprovingProposalId(proposalId);

    try {
      const response = await fetch(
        `/api/requests/${activeIntentId}/proposals/${proposalId}/approve`,
        { method: "POST" },
      );
      const payload = (await response.json()) as { approved?: boolean; error?: string };

      if (!response.ok || !payload.approved) {
        throw new Error(payload.error ?? "Failed to approve proposal.");
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to approve proposal.",
      );
    } finally {
      setApprovingProposalId(null);
    }
  }

  async function handleDeliveryFilesSelected(files: File[]) {
    if (files.length === 0) {
      return;
    }

    const drafts = files.map((file) => ({
      fileName: file.name,
      fileSize: file.size,
      id: crypto.randomUUID(),
      mediaType: file.type || "application/octet-stream",
      progress: 0,
      status: "uploading" as const,
      storageId: null,
    }));

    setDeliveryDraft((current) => ({
      ...current,
      attachments: [...current.attachments, ...drafts],
    }));

    await Promise.all(
      files.map(async (file, index) => {
        const draft = drafts[index];

        try {
          const uploadUrl = await generateUploadUrl({});
          const storageId = await uploadFileToConvex(uploadUrl, file, (progress) => {
            setDeliveryDraft((current) => ({
              ...current,
              attachments: current.attachments.map((attachment) =>
                attachment.id === draft.id ? { ...attachment, progress } : attachment,
              ),
            }));
          });

          setDeliveryDraft((current) => ({
            ...current,
            attachments: current.attachments.map((attachment) =>
              attachment.id === draft.id
                ? { ...attachment, progress: 100, status: "uploaded", storageId }
                : attachment,
            ),
          }));
        } catch {
          setDeliveryDraft((current) => ({
            ...current,
            attachments: current.attachments.map((attachment) =>
              attachment.id === draft.id
                ? { ...attachment, progress: 0, status: "error", storageId: null }
                : attachment,
            ),
          }));
        }
      }),
    );
  }

  function handleRemoveDeliveryAttachment(attachmentId: string) {
    setDeliveryDraft((current) => ({
      ...current,
      attachments: current.attachments.filter((attachment) => attachment.id !== attachmentId),
    }));
  }

  async function handleSubmitDelivery() {
    if (
      !activeIntentId ||
      !deliveryDraft.deliverablesBody.trim() ||
      isSubmittingDelivery ||
      deliveryDraft.attachments.some((attachment) => attachment.status !== "uploaded")
    ) {
      return;
    }

    setErrorMessage(null);
    setIsSubmittingDelivery(true);

    try {
      const response = await fetch(`/api/requests/${activeIntentId}/deliver`, {
        body: JSON.stringify({
          attachments: deliveryDraft.attachments
            .filter((attachment) => attachment.storageId)
            .map((attachment) => ({
              fileName: attachment.fileName,
              mediaType: attachment.mediaType,
              sizeBytes: attachment.fileSize,
              storageId: attachment.storageId,
            })),
          deliverablesBody: deliveryDraft.deliverablesBody,
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });
      const payload = (await response.json()) as { error?: string; submitted?: boolean };

      if (!response.ok || !payload.submitted) {
        throw new Error(payload.error ?? "Failed to submit work.");
      }

      setDeliveryDraft(emptyDeliveryDraft());
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to submit work.",
      );
    } finally {
      setIsSubmittingDelivery(false);
    }
  }

  function handleSidebarSelect(intent: SidebarIntentPreview) {
    updateWorkspaceUrl({
      browse: "workers",
      request: intent._id,
      view: "chat",
    });
    setProposalDraft(emptyProposalDraft());
    setProposalMessage("");
    setDeliveryDraft(emptyDeliveryDraft());
    setOptimisticReviewRating(null);
    setShowWorkspace(true);
    setMessages([]);
  }

  function handleMarketplaceSelect(intent: SidebarIntentPreview) {
    updateWorkspaceUrl({
      browse: "requests",
      request: intent._id,
      view: intent.isOwner ? "chat" : "workspace",
    });
    setProposalDraft(emptyProposalDraft());
    setProposalMessage("");
    setDeliveryDraft(emptyDeliveryDraft());
    setOptimisticReviewRating(null);
    setShowWorkspace(true);
    setMessages([]);
  }

  function handleClearSelection() {
    updateWorkspaceUrl({
      request: null,
      view: null,
    });
    setProposalDraft(emptyProposalDraft());
    setProposalMessage("");
    setDeliveryDraft(emptyDeliveryDraft());
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
    <>
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
                      selectedCenterTab === "participants" && "text-foreground",
                    )}
                    onClick={() => updateWorkspaceUrl({ view: "participants" })}
                    type="button"
                  >
                    Participants
                  </button>
                  <button
                    className={cn(
                      "px-3 py-2 text-sm text-muted-foreground transition-colors",
                      selectedCenterTab === "workspace" && "text-foreground",
                    )}
                    onClick={() => updateWorkspaceUrl({ view: "workspace" })}
                    type="button"
                  >
                    Workspace
                  </button>
                </div>

                {requestDetail?.intent ? (
                  <div className="p-1 ">
                    <div className="flex items-center justify-between px-3 py-3 border rounded-md border-border">
                      {activeIntentId && requestDetail?.intent && (
                        <RequestHeaderMeta
                          status={requestDetail.intent.status}
                          participants={requestDetail.participants}
                        />
                      )}
                      <RequestStageRail status={requestDetail.intent.status} />
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
                            setComposerText(prompt);
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
                ) : activeIntentId && selectedCenterTab === "participants" ? (
                  <ScrollArea className="h-full">
                    <div className="mx-auto flex min-h-full w-full max-w-3xl flex-col gap-6 px-4 py-6">
                      <RequestWorkersPanel
                        onBrowseWorkers={() => {
                          updateWorkspaceUrl({ browse: "workers" });
                          setShowWorkspace(true);
                        }}
                        requestDetail={requestDetail}
                        shareUrl={selectedRequestShareUrl}
                      />
                    </div>
                  </ScrollArea>
                ) : activeIntentId && selectedCenterTab === "workspace" ? (
                  <ScrollArea className="h-full">
                    <div className="mx-auto flex min-h-full w-full max-w-3xl flex-col gap-6 px-4 py-6">
                      <ProposalViewerPanel
                        approvingProposalId={approvingProposalId}
                        canSubmitDelivery={canSubmitDelivery}
                        deliveryDraft={deliveryDraft}
                        deliverySubmitted={requestDetail?.fulfillment?.status === "fulfilled"}
                        hasSubmittedProposal={hasSubmittedProposal}
                        isDraftingProposal={isDraftingProposal}
                        isSubmittingDelivery={isSubmittingDelivery}
                        isSubmittingProposal={isSubmittingProposal}
                        proposalDraft={proposalDraft}
                        proposalMessage={proposalMessage}
                        onApproveProposal={handleApproveProposal}
                        onDeliveryFilesSelected={handleDeliveryFilesSelected}
                        onDraftProposal={handleDraftProposal}
                        onRemoveDeliveryAttachment={handleRemoveDeliveryAttachment}
                        onSubmitDelivery={handleSubmitDelivery}
                        onSubmitProposal={handleSubmitProposal}
                        setDeliveryDraft={setDeliveryDraft}
                        setProposalDraft={setProposalDraft}
                        setProposalMessage={setProposalMessage}
                        key={activeIntentId}
                        requestDetail={requestDetail}
                      />
                    </div>
                  </ScrollArea>
                ) : activeIntentId && !canViewRequestChat ? (
                  <div className="mx-auto flex h-full w-full max-w-3xl items-center px-4 py-8">
                    <div className="w-full border border-border p-6">
                      <p className="text-sm font-medium">Chat opens after acceptance</p>
                      <p className="mt-2 text-xs text-muted-foreground">
                        Only the owner and accepted participants can use the request chat thread.
                        Use the workspace tab to submit or review proposals first.
                      </p>
                    </div>
                  </div>
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
                          onRefreshRequest={handleRefreshRequest}
                          onRefreshVideo={() => {
                            const artifact = requestDetail?.artifact;
                            const metadata = artifact?.metadata;
                            const jobId =
                              (typeof metadata?.jobId === "string" ? metadata.jobId : null) ??
                              artifact?.remoteId;
                            void refreshVideoJob(jobId);
                          }}
                          isArchivingRequest={isArchivingRequest}
                          isApprovingRequest={isApprovingRequest}
                          isCancellingRequest={isCancellingRequest}
                          isMarkingRequestFulfilled={isMarkingRequestFulfilled}
                          isRefreshingRequest={isRefreshingRequest}
                          isSubmittingReview={isSubmittingReview}
                          approvingProposalId={approvingProposalId}
                          onApproveProposal={handleApproveProposal}
                          onApproveRequest={handleApproveRequest}
                          onCancelRequest={handleCancelRequest}
                          onMarkRequestFulfilled={handleMarkRequestFulfilled}
                          onRetryRequest={handleRetryRequest}
                          liveMessages={messages}
                          onSubmitReview={handleSubmitReview}
                          onArchiveRequest={handleArchiveRequest}
                          onDeleteIntent={() => handleDeleteIntent(activeIntentId)}
                          requestDetail={requestDetail}
                          review={effectiveReview}
                          shouldPromptReview={shouldPromptReview}
                          workspace={effectiveWorkspace}
                        />
                      ) : (
                        displayedMessages.map((message) => (
                          <Message from={message.role} key={message.id}>
                            <MessageContent>
                              <MessageResponse className="[&_a]:inline-flex [&_a]:items-center [&_a]:border [&_a]:border-border [&_a]:px-2 [&_a]:py-1 [&_a]:text-xs [&_a]:uppercase [&_a]:tracking-[0.16em]">
                                {message.content}
                              </MessageResponse>
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
            {isArchivedTranscript ? (
              <div className="border border-border px-4 py-3 text-xs text-muted-foreground">
                This request has been archived. The chat is now read-only.
              </div>
            ) : (
              <PromptInput
                onSubmit={async (input) => {
                  if (!input.text.trim()) {
                    return;
                  }

                  await submitMessage(input.text);
                }}
              >
                <PromptInputBody>
                  <PromptInputTextarea
                    onChange={(event) => setComposerText(event.currentTarget.value)}
                    placeholder="Ask a question, coordinate on a request, or ask Boreal for help."
                    value={composerText}
                  />
                </PromptInputBody>
                <PromptInputFooter>
                  <PromptInputTools>
                    {shouldShowHomeBorealButton ? (
                      <Button
                        className="border-teal-500/40 text-teal-700 shadow-[0_0_0_1px_rgba(13,148,136,0.18),0_0_18px_rgba(13,148,136,0.12)] transition-shadow dark:text-teal-300"
                        onClick={() => setIsBorealProfileOpen(true)}
                        size="sm"
                        type="button"
                        variant="outline"
                      >
                        <BotIcon />
                        Boreal Agent
                      </Button>
                    ) : null}
                    {shouldShowAssignedBorealButton ? (
                      <Button
                        className="border-teal-500/40 text-teal-700 shadow-[0_0_0_1px_rgba(13,148,136,0.18),0_0_18px_rgba(13,148,136,0.12)] transition-shadow dark:text-teal-300"
                        onClick={() => setIsBorealProfileOpen(true)}
                        size="sm"
                        type="button"
                        variant="outline"
                      >
                        <BotIcon className="size-4" />
                        Boreal Agent
                      </Button>
                    ) : null}
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
                    disabled={isSubmitting || composerText.trim().length === 0}
                    status={isSubmitting ? "submitted" : undefined}
                  />
                </PromptInputFooter>
              </PromptInput>
            )}

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
              ownerExternalId={ownerExternalId}
            />
          </div>
        ) : null}
        </div>
      </div>
      <Dialog onOpenChange={setIsBorealProfileOpen} open={isBorealProfileOpen}>
        <DialogContent className="h-[min(88svh,54rem)] max-w-[min(72rem,calc(100vw-2rem))] gap-0 overflow-hidden border border-border bg-background p-0 text-foreground shadow-2xl sm:max-w-[min(72rem,calc(100vw-2rem))]">
          <DialogHeader className="sr-only">
            <DialogTitle>Boreal Agent</DialogTitle>
          </DialogHeader>
          <div className="h-full overflow-auto bg-background">
            <BorealProfileView stats={borealAgentStats} />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function RequestHeaderMeta({
  status,
  participants,
}: {
  status: NonNullable<RequestDetail["intent"]>["status"];
  participants?: RequestDetail["participants"];
}) {
  const assignedWorkers = dedupeParticipantList(
    (participants ?? []).filter((participant) => participant.status !== "owner"),
  );

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
      <div className="flex flex-wrap items-center gap-2">
        <span>Assigned to</span>
        <AssignedWorkerPills participants={assignedWorkers} status={status} />
      </div>
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
  access,
  approvingProposalId,
  intent,
  isArchivingRequest,
  isApprovingRequest,
  isCancellingRequest,
  isMarkingRequestFulfilled,
  isRefreshingRequest,
  isSubmittingReview,
  onArchiveRequest,
  onApproveProposal,
  onApproveRequest,
  onCancelRequest,
  onDeleteIntent,
  onMarkRequestFulfilled,
  onRefreshRequest,
  onRetryRequest,
  onSubmitReview,
  participants,
  proposals,
  shouldPromptReview,
}: {
  access: RequestDetail["access"];
  approvingProposalId: string | null;
  intent: NonNullable<RequestDetail["intent"]>;
  isArchivingRequest: boolean;
  isApprovingRequest: boolean;
  isCancellingRequest: boolean;
  isMarkingRequestFulfilled: boolean;
  isRefreshingRequest: boolean;
  isSubmittingReview: boolean;
  onArchiveRequest: () => Promise<void>;
  onApproveProposal: (proposalId: string) => Promise<void>;
  onApproveRequest: () => void;
  onCancelRequest: () => void;
  onDeleteIntent: () => void;
  onMarkRequestFulfilled: () => Promise<void>;
  onRefreshRequest: () => Promise<void>;
  onRetryRequest: () => Promise<void>;
  onSubmitReview: (rating: number) => void;
  participants: RequestDetail["participants"];
  proposals: RequestDetail["proposals"];
  shouldPromptReview: boolean;
}) {
  const actionState = getRequestActionState(intent, access, shouldPromptReview);
  const submittedProposals = (proposals ?? []).filter((proposal) => proposal.status === "submitted");
  const acceptedProposal = (proposals ?? []).find((proposal) => proposal.status === "accepted") ?? null;
  const workingParticipants = (participants ?? []).filter((participant) => participant.status !== "owner");

  if (actionState.kind === "none" || actionState.kind === "review") {
    return null;
  }

  if (actionState.kind === "approval" && access?.canApproveProposals && submittedProposals.length > 0) {
    return (
      <div className="space-y-4 border border-border p-4">
        <div className="space-y-1">
          <p className="text-sm font-medium">Waiting for approval</p>
          <p className="text-xs text-muted-foreground">
            Review who is asking to take this request before work starts.
          </p>
        </div>
        <div className="space-y-3">
          {submittedProposals.map((proposal) => (
            <div className="space-y-4 border border-border p-4" key={proposal._id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="flex size-9 items-center justify-center border border-border">
                    {proposal.proposer.kind === "agent" ? (
                      <BotIcon className="size-4 text-muted-foreground" />
                    ) : (
                      <UserIcon className="size-4 text-muted-foreground" />
                    )}
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{proposal.proposer.displayName}</p>
                    <p className="text-xs text-muted-foreground">
                      {proposal.proposer.handle
                        ? `@${proposal.proposer.handle}`
                        : proposal.proposer.kind}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatRequestDate(proposal.createdAt)}
                </p>
              </div>
              <ProposalCardBody proposal={proposal} />
              <div className="flex flex-wrap gap-2">
                <Button
                  disabled={approvingProposalId === proposal._id}
                  onClick={() => void onApproveProposal(proposal._id)}
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
                {proposal.proposer.profileId ? (
                  <Button asChild size="sm" type="button" variant="outline">
                    <Link href={`/p/${proposal.proposer.profileId}`}>View profile</Link>
                  </Button>
                ) : null}
                <Button
                  disabled={isCancellingRequest}
                  onClick={onCancelRequest}
                  size="sm"
                  type="button"
                  variant="ghost"
                >
                  {isCancellingRequest ? <LoaderIcon className="animate-spin" /> : <XCircleIcon />}
                  Cancel request
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 border border-border p-4">
      <p className="text-sm font-medium">{actionState.title}</p>
      <p className="text-xs text-muted-foreground">{actionState.description}</p>
      {actionState.kind === "in_flight" ? (
        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          {acceptedProposal?.etaAt ? (
            <span className="border border-border px-2 py-1">
              Est. delivery {formatRequestDate(acceptedProposal.etaAt)}
            </span>
          ) : null}
          {workingParticipants.length > 0 ? (
            <span className="border border-border px-2 py-1">
              Working now {workingParticipants.map((participant) => participant.displayName).join(", ")}
            </span>
          ) : null}
        </div>
      ) : null}
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
        {actionState.kind === "in_flight" ? (
          <>
            <Button
              disabled={isRefreshingRequest}
              onClick={() => void onRefreshRequest()}
              size="sm"
              type="button"
              variant="outline"
            >
              {isRefreshingRequest ? <LoaderIcon className="animate-spin" /> : <RefreshCwIcon />}
              Refresh
            </Button>
            <Button
              disabled={isMarkingRequestFulfilled}
              onClick={() => void onMarkRequestFulfilled()}
              size="sm"
              type="button"
            >
              {isMarkingRequestFulfilled ? <LoaderIcon className="animate-spin" /> : <CheckIcon />}
              Mark as fulfilled
            </Button>
          </>
        ) : null}
        {actionState.kind === "blocked" ? (
          <>
            <Button
              disabled={isApprovingRequest || isCancellingRequest}
              onClick={() => void onRetryRequest()}
              size="sm"
              type="button"
            >
              {isApprovingRequest ? <LoaderIcon className="animate-spin" /> : <RefreshCwIcon />}
              Retry
            </Button>
            <Button
              disabled={isArchivingRequest}
              onClick={() => void onArchiveRequest()}
              size="sm"
              type="button"
              variant="outline"
            >
              {isArchivingRequest ? <LoaderIcon className="animate-spin" /> : <PackageIcon />}
              Archive
            </Button>
            <Button onClick={onDeleteIntent} size="sm" type="button" variant="ghost">
              Delete
            </Button>
          </>
        ) : null}
        {actionState.kind === "archive" ? (
          <>
            <Button
              disabled={isArchivingRequest}
              onClick={() => void onArchiveRequest()}
              size="sm"
              type="button"
              variant="outline"
            >
              {isArchivingRequest ? <LoaderIcon className="animate-spin" /> : <PackageIcon />}
              Archive
            </Button>
            <Button onClick={onDeleteIntent} size="sm" type="button" variant="ghost">
              Delete
            </Button>
          </>
        ) : null}
        {actionState.kind === "closed" ? (
          <>
            <Button disabled={isApprovingRequest} onClick={onApproveRequest} size="sm" type="button">
              {isApprovingRequest ? <LoaderIcon className="animate-spin" /> : <RefreshCwIcon />}
              Continue
            </Button>
            <Button onClick={onDeleteIntent} size="sm" type="button" variant="outline">
              Delete
            </Button>
          </>
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
  | { item: ChatMessage; key: string; kind: "live"; timestamp: number }
  | { item: NonNullable<RequestDetail["artifact"]>; key: string; kind: "artifact"; timestamp: number }
  | { item: NonNullable<RequestDetail["fulfillment"]>; key: string; kind: "fulfillment"; timestamp: number }
  | { item: NonNullable<RequestDetail["review"]>; key: string; kind: "review"; timestamp: number };

function RequestChatTimeline({
  approvingProposalId,
  liveMessages,
  isArchivingRequest,
  isApprovingRequest,
  isCancellingRequest,
  isMarkingRequestFulfilled,
  isRefreshingRequest,
  isRefreshingVideo,
  isSubmittingReview,
  onArchiveRequest,
  onApproveProposal,
  onApproveRequest,
  onAskCatalogItem,
  onCancelRequest,
  onDeleteIntent,
  onDownloadVideo,
  onMarkRequestFulfilled,
  onQuickReply,
  onRefreshRequest,
  onRefreshVideo,
  onRetryRequest,
  onSubmitReview,
  requestDetail,
  review,
  shouldPromptReview,
  workspace,
}: {
  approvingProposalId: string | null;
  liveMessages: ChatMessage[];
  isArchivingRequest: boolean;
  isApprovingRequest: boolean;
  isCancellingRequest: boolean;
  isMarkingRequestFulfilled: boolean;
  isRefreshingRequest: boolean;
  isRefreshingVideo: boolean;
  isSubmittingReview: boolean;
  onArchiveRequest: () => Promise<void>;
  onApproveProposal: (proposalId: string) => Promise<void>;
  onApproveRequest: (intentId?: string | null) => Promise<void>;
  onAskCatalogItem: (item: CatalogItem) => void;
  onCancelRequest: (intentId?: string | null) => Promise<void>;
  onDeleteIntent: () => void;
  onDownloadVideo: (videoId: string) => void;
  onMarkRequestFulfilled: () => Promise<void>;
  onQuickReply: (value: string) => void;
  onRefreshRequest: () => Promise<void>;
  onRefreshVideo: () => void;
  onRetryRequest: () => Promise<void>;
  onSubmitReview: (rating: number) => void;
  requestDetail: RequestDetail;
  review: RequestDetail["review"];
  shouldPromptReview: boolean;
  workspace: WorkspaceState;
}) {
  const timeline = buildRequestTimeline(requestDetail, review, liveMessages);

  return (
    <>
      {timeline.map((entry) => {
        if (entry.kind === "message") {
          const role = entry.item.sender.isCurrentUser
            ? "user"
            : entry.item.sender.actorKind === "agent"
              ? "assistant"
              : "assistant";

          return (
            <Message from={role} key={entry.key}>
              {!entry.item.sender.isCurrentUser ? (
                <p className="mb-1 flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                  <SenderIcon actorKind={entry.item.sender.actorKind} />
                  <span>{entry.item.sender.displayName}</span>
                </p>
              ) : null}
              <MessageContent>
                <MessageResponse className="[&_a]:inline-flex [&_a]:items-center [&_a]:border [&_a]:border-border [&_a]:px-2 [&_a]:py-1 [&_a]:text-xs [&_a]:uppercase [&_a]:tracking-[0.16em]">
                  {entry.item.body}
                </MessageResponse>
              </MessageContent>
            </Message>
          );
        }

        if (entry.kind === "live") {
          return (
            <Message from={entry.item.role} key={entry.key}>
              <p className="mb-1 flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                <BotIcon className="size-3" />
                <span>Boreal Agent</span>
              </p>
              <MessageContent>
                <MessageResponse className="[&_a]:inline-flex [&_a]:items-center [&_a]:border [&_a]:border-border [&_a]:px-2 [&_a]:py-1 [&_a]:text-xs [&_a]:uppercase [&_a]:tracking-[0.16em]">
                  {entry.item.content}
                </MessageResponse>
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

        if (entry.kind === "fulfillment") {
          return <InlineFulfillmentEvent fulfillment={entry.item} key={entry.key} />;
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
          access={requestDetail.access}
          approvingProposalId={approvingProposalId}
          intent={requestDetail.intent}
          isArchivingRequest={isArchivingRequest}
          isApprovingRequest={isApprovingRequest}
          isCancellingRequest={isCancellingRequest}
          isMarkingRequestFulfilled={isMarkingRequestFulfilled}
          isRefreshingRequest={isRefreshingRequest}
          isSubmittingReview={isSubmittingReview}
          onArchiveRequest={onArchiveRequest}
          onApproveProposal={onApproveProposal}
          onApproveRequest={() => onApproveRequest(requestDetail.intent?._id)}
          onCancelRequest={() => onCancelRequest(requestDetail.intent?._id)}
          onDeleteIntent={onDeleteIntent}
          onMarkRequestFulfilled={onMarkRequestFulfilled}
          onRefreshRequest={onRefreshRequest}
          onRetryRequest={onRetryRequest}
          participants={requestDetail.participants}
          onSubmitReview={onSubmitReview}
          proposals={requestDetail.proposals}
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
  liveMessages: ChatMessage[],
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

  if (requestDetail.fulfillment?.evidence) {
    items.push({
      item: requestDetail.fulfillment,
      key: `fulfillment-${requestDetail.fulfillment.evidence.createdAt}`,
      kind: "fulfillment",
      timestamp: requestDetail.fulfillment.evidence.createdAt,
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

  for (const liveMessage of liveMessages) {
    items.push({
      item: liveMessage,
      key: `live-${liveMessage.id}`,
      kind: "live",
      timestamp: liveMessage.createdAt,
    });
  }

  return items.sort((left, right) => {
    if (left.timestamp !== right.timestamp) {
      return left.timestamp - right.timestamp;
    }

    const order = { message: 0, live: 1, fulfillment: 2, artifact: 3, review: 4 };

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

function InlineFulfillmentEvent({
  fulfillment,
}: {
  fulfillment: NonNullable<RequestDetail["fulfillment"]>;
}) {
  if (!fulfillment.evidence) {
    return null;
  }

  return (
    <div className="space-y-2">
      <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
        {formatRequestDate(fulfillment.evidence.createdAt)}
      </p>
      <WorkSubmissionCard fulfillment={fulfillment} />
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

function WorkSubmissionCard({
  fulfillment,
}: {
  fulfillment: NonNullable<RequestDetail["fulfillment"]>;
}) {
  if (!fulfillment.evidence) {
    return null;
  }

  return (
    <div className="space-y-4 border border-border p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-sm font-medium">Work submission</p>
          <p className="text-xs text-muted-foreground">
            Final delivery submitted for review and download.
          </p>
        </div>
        <span className="inline-flex items-center border border-border px-2 py-1 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
          {fulfillment.status.replaceAll("_", " ")}
        </span>
      </div>
      <div className="border border-border p-4">
        <MessageResponse className="text-sm">{fulfillment.evidence.body}</MessageResponse>
      </div>
      {fulfillment.evidence.attachments.length > 0 ? (
        <div className="grid gap-3 md:grid-cols-2">
          {fulfillment.evidence.attachments.map((attachment) => (
            <div className="flex items-center justify-between gap-3 border border-border p-3" key={`${attachment.fileName}-${attachment.url ?? attachment.sizeBytes}`}>
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex size-9 items-center justify-center border border-border text-muted-foreground">
                  <FileIcon className="size-4" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{attachment.fileName}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(attachment.sizeBytes)}
                  </p>
                </div>
              </div>
              {attachment.url ? (
                <Button asChild size="sm" type="button" variant="outline">
                  <a download={attachment.fileName} href={attachment.url} rel="noreferrer" target="_blank">
                    <DownloadIcon />
                    Download
                  </a>
                </Button>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}
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

function SenderIcon({
  actorKind,
}: {
  actorKind: "agent" | "human" | "tool";
}) {
  if (actorKind === "agent") {
    return <BotIcon className="size-3" />;
  }

  return <UserIcon className="size-3" />;
}

function InlineTierPill({ tier }: { tier: string }) {
  return (
    <span className="inline-flex items-center border border-border px-2 py-1 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
      Tier {tier.replaceAll("_", " ")}
    </span>
  );
}

function AssignedWorkerPills({
  participants,
  status,
}: {
  participants?: Array<{
    displayName: string;
    externalId: string | null;
    handle: string | null;
    kind: string;
    profileId: string | null;
    status: string;
  }>;
  status: NonNullable<RequestDetail["intent"]>["status"];
}) {
  const workers = participants ?? [];

  return (
    <div className="flex items-center gap-1">
      {workers.length === 0 ? (
        <span className="border border-border px-2 py-1 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
          {status === "open" || status === "proposed" || status === "blocked"
            ? "Waiting for workers"
            : "Not assigned yet"}
        </span>
      ) : (
        workers.slice(0, 4).map((worker) => (
          <WorkerPill
            icon={worker.kind === "agent" ? BotIcon : UserIcon}
            key={`${worker.displayName}-${worker.status}`}
            label={worker.displayName}
          />
        ))
      )}
    </div>
  );
}

function dedupeParticipantList<
  T extends { displayName: string; externalId?: string | null; handle?: string | null },
>(participants: T[]) {
  const deduped = new Map<string, T>();

  for (const participant of participants) {
    const externalId = participant.externalId?.trim().toLowerCase();
    const handle = participant.handle?.trim().toLowerCase();
    const name = participant.displayName.trim().toLowerCase();
    const key = externalId
      ? externalId.includes("boreal")
        ? "agent:boreal"
        : `external:${externalId}`
      : handle
        ? handle === "boreal"
          ? "agent:boreal"
          : `handle:${handle}`
        : name.includes("boreal")
          ? "agent:boreal"
          : `name:${name}`;

    if (!deduped.has(key)) {
      deduped.set(key, participant);
    }
  }

  return Array.from(deduped.values());
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
  shareUrl,
}: {
  onBrowseWorkers: () => void;
  requestDetail: RequestDetail | null;
  shareUrl: string | null;
}) {
  const [copied, setCopied] = useState(false);
  const intent = requestDetail?.intent;
  const participants = requestDetail?.participants ?? [];
  const isWaitingForWorkers =
    participants.filter((participant) => participant.status !== "owner").length === 0 &&
    (intent?.status === "open" || intent?.status === "proposed");

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
          <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Participants</p>
        <div className="space-y-3">
          {participants.map((participant) => (
            <div className="border border-border p-3" key={`${participant.displayName}-${participant.status}`}>
              <div className="flex items-start gap-3">
                <div className="flex size-9 items-center justify-center border border-border">
                  {participant.kind === "agent" ? (
                    <BotIcon className="size-4 text-muted-foreground" />
                  ) : (
                    <UserIcon className="size-4 text-muted-foreground" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium">{participant.displayName}</p>
                    <span className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                      {participant.status}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {participant.handle ? `@${participant.handle}` : participant.kind}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {participant.profileId ? (
                      <Button asChild size="sm" type="button" variant="outline">
                        <Link href={`/p/${participant.profileId}`}>View profile</Link>
                      </Button>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ProposalViewerPanel({
  approvingProposalId,
  canSubmitDelivery,
  deliveryDraft,
  deliverySubmitted,
  hasSubmittedProposal,
  isDraftingProposal,
  isSubmittingDelivery,
  isSubmittingProposal,
  onApproveProposal,
  onDeliveryFilesSelected,
  onDraftProposal,
  onRemoveDeliveryAttachment,
  onSubmitDelivery,
  onSubmitProposal,
  proposalDraft,
  proposalMessage,
  requestDetail,
  setDeliveryDraft,
  setProposalDraft,
  setProposalMessage,
}: {
  approvingProposalId: string | null;
  canSubmitDelivery: boolean;
  deliveryDraft: DeliveryDraft;
  deliverySubmitted: boolean;
  hasSubmittedProposal: boolean;
  isDraftingProposal: boolean;
  isSubmittingDelivery: boolean;
  isSubmittingProposal: boolean;
  onApproveProposal: (proposalId: string) => Promise<void>;
  onDeliveryFilesSelected: (files: File[]) => Promise<void>;
  onDraftProposal: () => Promise<void>;
  onRemoveDeliveryAttachment: (attachmentId: string) => void;
  onSubmitDelivery: () => Promise<void>;
  onSubmitProposal: () => Promise<void>;
  proposalDraft: ProposalDraft;
  proposalMessage: string;
  requestDetail: RequestDetail | null;
  setDeliveryDraft: Dispatch<SetStateAction<DeliveryDraft>>;
  setProposalDraft: Dispatch<SetStateAction<ProposalDraft>>;
  setProposalMessage: Dispatch<SetStateAction<string>>;
}) {
  const isOwner = requestDetail?.access?.isOwner ?? false;
  const proposals = requestDetail?.proposals ?? [];
  const visibleProposals = isOwner ? proposals : proposals.filter((proposal) => proposal.isMine);
  const [isProposalDialogOpen, setIsProposalDialogOpen] = useState(false);
  const [isDeliveryDialogOpen, setIsDeliveryDialogOpen] = useState(false);
  const proposalDialogOpen = isProposalDialogOpen && !hasSubmittedProposal;
  const deliveryDialogOpen = isDeliveryDialogOpen && !deliverySubmitted;

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
      ) : canSubmitDelivery ? (
        <div className="space-y-4 border border-border p-4">
          <div className="space-y-1">
            <p className="text-sm font-medium">Delivery workspace</p>
            <p className="text-xs text-muted-foreground">
              Your proposal was accepted. Submit the finished work here so the owner can review it.
            </p>
          </div>
          {requestDetail?.fulfillment?.completedSummary ? (
            <WorkSubmissionCard fulfillment={requestDetail.fulfillment} />
          ) : null}
          <div className="flex flex-wrap gap-2">
            <Button
              disabled={deliverySubmitted}
              onClick={() => setIsDeliveryDialogOpen(true)}
              size="sm"
              type="button"
            >
              <PackageIcon />
              {deliverySubmitted ? "Work submitted" : "Open submission form"}
            </Button>
          </div>
          <DeliverySubmissionDialog
            deliveryDraft={deliveryDraft}
            isOpen={deliveryDialogOpen}
            isSubmittingDelivery={isSubmittingDelivery}
            isUploadingDeliveryFiles={deliveryDraft.attachments.some(
              (attachment) => attachment.status === "uploading",
            )}
            onOpenChange={setIsDeliveryDialogOpen}
            onRemoveAttachment={onRemoveDeliveryAttachment}
            onSelectFiles={onDeliveryFilesSelected}
            onSubmitDelivery={onSubmitDelivery}
            setDeliveryDraft={setDeliveryDraft}
          />
        </div>
      ) : requestDetail?.access?.canSubmitProposal && !hasSubmittedProposal ? (
        <div className="space-y-4 border border-border p-4">
          <div className="space-y-1">
            <p className="text-sm font-medium">Proposal workspace</p>
            <p className="text-xs text-muted-foreground">
              Build your proposal in a form, refine it if useful, then send only when you are ready.
            </p>
          </div>
          <div className="space-y-4 border border-border p-4">
            <p className="text-sm font-medium">Current proposal draft</p>
            <ProposalCardBody proposal={mapDraftProposal(proposalDraft)} />
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => setIsProposalDialogOpen(true)} size="sm" type="button">
                <SparklesIcon />
                Open proposal form
              </Button>
            </div>
          </div>
          <ProposalSubmissionDialog
            isDraftingProposal={isDraftingProposal}
            isOpen={proposalDialogOpen}
            isSubmittingProposal={isSubmittingProposal}
            onDraftProposal={onDraftProposal}
            onOpenChange={setIsProposalDialogOpen}
            onSubmitProposal={onSubmitProposal}
            proposalDraft={proposalDraft}
            proposalMessage={proposalMessage}
            setProposalDraft={setProposalDraft}
            setProposalMessage={setProposalMessage}
          />
        </div>
      ) : requestDetail?.access?.canSubmitProposal && hasSubmittedProposal ? (
        <div className="space-y-4 border border-border p-4">
          <div className="space-y-1">
            <p className="text-sm font-medium">Proposal submitted</p>
            <p className="text-xs text-muted-foreground">
              Your proposal is now in review. This workspace will update when the owner accepts or
              declines it.
            </p>
          </div>
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
              {proposal.proposer.profileId ? (
                <div className="mt-4">
                  <Button asChild size="sm" type="button" variant="outline">
                    <Link href={`/p/${proposal.proposer.profileId}`}>View profile</Link>
                  </Button>
                </div>
              ) : null}
              {isOwner && proposal.status === "submitted" ? (
                  <div className="mt-4 flex gap-2">
                    <Button
                      disabled={approvingProposalId === proposal._id}
                      onClick={() => void onApproveProposal(proposal._id)}
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

function ProposalSubmissionDialog({
  isDraftingProposal,
  isOpen,
  isSubmittingProposal,
  onDraftProposal,
  onOpenChange,
  onSubmitProposal,
  proposalDraft,
  proposalMessage,
  setProposalDraft,
  setProposalMessage,
}: {
  isDraftingProposal: boolean;
  isOpen: boolean;
  isSubmittingProposal: boolean;
  onDraftProposal: () => Promise<void>;
  onOpenChange: (open: boolean) => void;
  onSubmitProposal: () => Promise<void>;
  proposalDraft: ProposalDraft;
  proposalMessage: string;
  setProposalDraft: Dispatch<SetStateAction<ProposalDraft>>;
  setProposalMessage: Dispatch<SetStateAction<string>>;
}) {
  return (
    <Dialog onOpenChange={onOpenChange} open={isOpen}>
      <DialogContent className="max-w-4xl p-0 sm:max-w-4xl">
        <div className="flex max-h-[85vh] min-h-[70vh] flex-col overflow-hidden">
          <DialogHeader className="border-b border-border px-6 py-4">
            <DialogTitle>Proposal submission</DialogTitle>
            <DialogDescription>
              Shape the proposal here. Improve uses Boreal to refine the draft. Send now submits
              exactly what is in the form.
            </DialogDescription>
          </DialogHeader>
          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
            <div className="space-y-5">
              <label className="space-y-2">
                <span className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                  Source description
                </span>
                <textarea
                  className="min-h-32 w-full border border-border bg-transparent p-3 text-sm outline-none"
                  onChange={(event) => setProposalMessage(event.target.value)}
                  placeholder="Describe how you would handle this request. Boreal will only use this when you choose Improve proposal."
                  value={proposalMessage}
                />
              </label>
              <ProposalDraftFields proposalDraft={proposalDraft} setProposalDraft={setProposalDraft} />
              <div className="space-y-2 border border-border p-4">
                <p className="text-sm font-medium">Preview</p>
                <ProposalCardBody proposal={mapDraftProposal(proposalDraft)} />
              </div>
            </div>
          </div>
          <DialogFooter className="border-t border-border px-6 py-4 sm:justify-between">
            <Button
              onClick={() => {
                setProposalDraft(emptyProposalDraft());
                setProposalMessage("");
              }}
              size="sm"
              type="button"
              variant="ghost"
            >
              Reset
            </Button>
            <div className="flex flex-wrap gap-2">
              <Button
                disabled={isDraftingProposal || proposalMessage.trim().length === 0}
                onClick={() => void onDraftProposal()}
                size="sm"
                type="button"
                variant="outline"
              >
                {isDraftingProposal ? <LoaderIcon className="animate-spin" /> : <SparklesIcon />}
                Improve proposal
              </Button>
              <Button
                disabled={
                  isSubmittingProposal ||
                  !canSubmitProposalForm({ proposalDraft, proposalMessage })
                }
                onClick={() => void onSubmitProposal()}
                size="sm"
                type="button"
              >
                {isSubmittingProposal ? <LoaderIcon className="animate-spin" /> : <CheckIcon />}
                Send now
              </Button>
            </div>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ProposalDraftFields({
  proposalDraft,
  setProposalDraft,
}: {
  proposalDraft: ProposalDraft;
  setProposalDraft: Dispatch<SetStateAction<ProposalDraft>>;
}) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <label className="space-y-2">
        <span className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Summary</span>
        <input
          className="w-full border border-border bg-transparent px-3 py-2 text-sm outline-none"
          onChange={(event) =>
            setProposalDraft((current) => ({ ...current, summary: event.target.value }))
          }
          placeholder="Short summary of your offer"
          value={proposalDraft.summary ?? ""}
        />
      </label>
      <label className="space-y-2">
        <span className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
          Deliverable type
        </span>
        <select
          className="w-full border border-border bg-transparent px-3 py-2 text-sm outline-none"
          onChange={(event) =>
            setProposalDraft((current) => ({
              ...current,
              deliverablesType:
                event.target.value === "file" || event.target.value === "link"
                  ? event.target.value
                  : "markdown",
            }))
          }
          value={proposalDraft.deliverablesType ?? "markdown"}
        >
          <option value="markdown">Markdown</option>
          <option value="file">File</option>
          <option value="link">Link</option>
        </select>
      </label>
      <label className="space-y-2 md:col-span-2">
        <span className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
          Deliverables
        </span>
        <textarea
          className="min-h-32 w-full border border-border bg-transparent p-3 text-sm outline-none"
          onChange={(event) =>
            setProposalDraft((current) => ({
              ...current,
              deliverablesBody: event.target.value,
            }))
          }
          placeholder="What exactly will you deliver?"
          value={proposalDraft.deliverablesBody ?? ""}
        />
      </label>
      <label className="space-y-2">
        <span className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Quote</span>
        <input
          className="w-full border border-border bg-transparent px-3 py-2 text-sm outline-none"
          inputMode="decimal"
          onChange={(event) =>
            setProposalDraft((current) => ({
              ...current,
              price: Number.parseFloat(event.target.value) || 0,
            }))
          }
          placeholder="100"
          type="number"
          value={proposalDraft.price > 0 ? proposalDraft.price : ""}
        />
      </label>
      <label className="space-y-2">
        <span className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Currency</span>
        <input
          className="w-full border border-border bg-transparent px-3 py-2 text-sm outline-none"
          maxLength={6}
          onChange={(event) =>
            setProposalDraft((current) => ({
              ...current,
              currency: event.target.value.toUpperCase(),
            }))
          }
          placeholder="USD"
          value={proposalDraft.currency ?? "USD"}
        />
      </label>
      <label className="space-y-2">
        <span className="text-xs uppercase tracking-[0.16em] text-muted-foreground">ETA days</span>
        <input
          className="w-full border border-border bg-transparent px-3 py-2 text-sm outline-none"
          inputMode="numeric"
          min={1}
          onChange={(event) =>
            setProposalDraft((current) => ({
              ...current,
              etaDays: Number.parseInt(event.target.value, 10) || 0,
            }))
          }
          placeholder="7"
          type="number"
          value={proposalDraft.etaDays > 0 ? proposalDraft.etaDays : ""}
        />
      </label>
    </div>
  );
}

function DeliverySubmissionDialog({
  deliveryDraft,
  isOpen,
  isSubmittingDelivery,
  isUploadingDeliveryFiles,
  onOpenChange,
  onRemoveAttachment,
  onSelectFiles,
  onSubmitDelivery,
  setDeliveryDraft,
}: {
  deliveryDraft: DeliveryDraft;
  isOpen: boolean;
  isSubmittingDelivery: boolean;
  isUploadingDeliveryFiles: boolean;
  onOpenChange: (open: boolean) => void;
  onRemoveAttachment: (attachmentId: string) => void;
  onSelectFiles: (files: File[]) => Promise<void>;
  onSubmitDelivery: () => Promise<void>;
  setDeliveryDraft: Dispatch<SetStateAction<DeliveryDraft>>;
}) {
  return (
    <Dialog onOpenChange={onOpenChange} open={isOpen}>
      <DialogContent className="max-w-4xl p-0 sm:max-w-4xl">
        <div className="flex max-h-[85vh] min-h-[68vh] flex-col overflow-hidden">
          <DialogHeader className="border-b border-border px-6 py-4">
            <DialogTitle>Work submission</DialogTitle>
            <DialogDescription>
              Prepare the final delivery here. Files upload immediately, and send stays locked until every attachment is uploaded.
            </DialogDescription>
          </DialogHeader>
          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
            <div className="space-y-5">
              <DeliveryDraftFields
                deliveryDraft={deliveryDraft}
                onRemoveAttachment={onRemoveAttachment}
                onSelectFiles={onSelectFiles}
                setDeliveryDraft={setDeliveryDraft}
              />
            </div>
          </div>
          <DialogFooter className="border-t border-border px-6 py-4 sm:justify-between">
            <Button
              onClick={() => setDeliveryDraft(emptyDeliveryDraft())}
              size="sm"
              type="button"
              variant="ghost"
            >
              Reset
            </Button>
            <Button
              disabled={
                isSubmittingDelivery ||
                isUploadingDeliveryFiles ||
                !canSubmitDeliveryForm(deliveryDraft)
              }
              onClick={() => void onSubmitDelivery()}
              size="sm"
              type="button"
            >
              {isSubmittingDelivery ? <LoaderIcon className="animate-spin" /> : <PackageIcon />}
              {isUploadingDeliveryFiles ? "Uploading files..." : "Send work"}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function DeliveryDraftFields({
  deliveryDraft,
  onRemoveAttachment,
  onSelectFiles,
  setDeliveryDraft,
}: {
  deliveryDraft: DeliveryDraft;
  onRemoveAttachment: (attachmentId: string) => void;
  onSelectFiles: (files: File[]) => Promise<void>;
  setDeliveryDraft: Dispatch<SetStateAction<DeliveryDraft>>;
}) {
  return (
    <div className="space-y-4">
      <label className="space-y-2 md:col-span-2">
        <span className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
          Body message
        </span>
        <textarea
          className="min-h-48 w-full border border-border bg-transparent p-3 text-sm outline-none"
          onChange={(event) =>
            setDeliveryDraft((current) => ({
              ...current,
              deliverablesBody: event.target.value,
            }))
          }
          placeholder="Submit the completed work, result link, or markdown deliverable."
          value={deliveryDraft.deliverablesBody}
        />
      </label>
      <label className="space-y-2">
        <span className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
          Attach files
        </span>
        <input
          className="block w-full border border-border bg-transparent px-3 py-2 text-sm outline-none file:mr-3 file:border-0 file:bg-transparent file:text-sm"
          multiple
          onChange={(event) => {
            const files = Array.from(event.target.files ?? []);
            event.currentTarget.value = "";
            void onSelectFiles(files);
          }}
          type="file"
        />
      </label>
      {deliveryDraft.attachments.length > 0 ? (
        <div className="space-y-3">
          {deliveryDraft.attachments.map((attachment) => (
            <div className="space-y-2 border border-border p-3" key={attachment.id}>
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex size-9 items-center justify-center border border-border text-muted-foreground">
                    <FileIcon className="size-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{attachment.fileName}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(attachment.fileSize)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {attachment.status === "uploaded"
                      ? "Uploaded"
                      : attachment.status === "error"
                        ? "Failed"
                        : `${attachment.progress}%`}
                  </span>
                  <Button
                    onClick={() => onRemoveAttachment(attachment.id)}
                    size="icon-sm"
                    type="button"
                    variant="ghost"
                  >
                    <Trash2Icon />
                  </Button>
                </div>
              </div>
              <Progress value={attachment.progress} />
            </div>
          ))}
        </div>
      ) : null}
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

function canSubmitProposalForm({
  proposalDraft,
  proposalMessage,
}: {
  proposalDraft: ProposalDraft;
  proposalMessage: string;
}) {
  return Boolean(
    proposalMessage.trim().length > 0 ||
      proposalDraft.summary.trim().length > 0 ||
      proposalDraft.deliverablesBody.trim().length > 0,
  );
}

function canSubmitDeliveryForm(deliveryDraft: DeliveryDraft) {
  return (
    deliveryDraft.deliverablesBody.trim().length > 0 &&
    deliveryDraft.attachments.every((attachment) => attachment.status === "uploaded")
  );
}

function uploadFileToConvex(
  uploadUrl: string,
  file: File,
  onProgress: (progress: number) => void,
) {
  return new Promise<string>((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.open("POST", uploadUrl);

    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable) {
        return;
      }

      onProgress(Math.min(99, Math.round((event.loaded / event.total) * 100)));
    };

    xhr.onload = () => {
      if (xhr.status < 200 || xhr.status >= 300) {
        reject(new Error("File upload failed."));
        return;
      }

      try {
        const payload = JSON.parse(xhr.responseText) as { storageId?: string };

        if (!payload.storageId) {
          reject(new Error("Convex upload did not return a storage id."));
          return;
        }

        resolve(payload.storageId);
      } catch {
        reject(new Error("Failed to parse Convex upload response."));
      }
    };

    xhr.onerror = () => reject(new Error("File upload failed."));
    xhr.send(file);
  });
}

function formatFileSize(sizeBytes: number) {
  if (sizeBytes < 1024) {
    return `${sizeBytes} B`;
  }

  if (sizeBytes < 1024 * 1024) {
    return `${(sizeBytes / 1024).toFixed(1)} KB`;
  }

  return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getRequestActionState(
  intent: NonNullable<RequestDetail["intent"]>,
  access: RequestDetail["access"],
  reviewPending: boolean,
) {
  const status = intent.status;

  if (reviewPending) {
    return {
      description: "The work is delivered. Capture a quick rating inline before moving on.",
      kind: "review" as const,
      title: "Delivery finished",
    };
  }

  if ((status === "proposed" || status === "open") && access?.canApproveProposals) {
    return {
      description:
        "Boreal has identified the request but has not started any worker or generator yet.",
      kind: "approval" as const,
      title: status === "open" ? "Waiting for approval" : "Approve to start",
    };
  }

  if ((status === "claimed" || status === "in_progress") && access?.isOwner) {
    return {
      description:
        "Work is active. Refresh the workspace when you need the latest state, or mark it fulfilled when the final delivery happened in chat.",
      kind: "in_flight" as const,
      title: "Work in flight",
    };
  }

  if (status === "blocked" && access?.isOwner) {
    return {
      description:
        "Automatic execution hit an error. Retry if you want another pass, or archive/delete it if this request should stop here.",
      kind: "blocked" as const,
      title: "Needs intervention",
    };
  }

  if (status === "fulfilled" && access?.isOwner) {
    return {
      description:
        "Delivery is complete. Archive finished work or keep it active for more follow-up.",
      kind: "archive" as const,
      title: "Completed request",
    };
  }

  if (status === "closed" && access?.isOwner) {
    return {
      description:
        intent.closedReason === "cancelled_by_user"
          ? "This request was cancelled. Continue it or delete it if you no longer need the record."
          : "This request was archived or paused. Continue it or remove it from your list.",
      kind: "closed" as const,
      title: "Request paused",
    };
  }

  return {
    description: "This request is complete. No further action is required here.",
    kind: "none" as const,
    title: "Complete",
  };
}

function humanizeToolLabel(value: string) {
  return value.replaceAll("-", " ").replaceAll("_", " ");
}

function normalizeCenterViewTab(value: string | null): CenterViewTab {
  if (value === "activity" || value === "participants" || value === "workspace") {
    return value;
  }

  return "chat";
}

function isBorealAssigned(input: {
  assignedAgent: string | null;
  participants?: RequestDetail["participants"];
}) {
  if (input.assignedAgent?.toLowerCase().includes("boreal")) {
    return true;
  }

  return (input.participants ?? []).some((participant) => {
    const name = participant.displayName.toLowerCase();
    const externalId = participant.externalId?.toLowerCase() ?? "";
    const handle = participant.handle?.toLowerCase() ?? "";

    return (
      externalId === "agent:boreal" ||
      handle === "boreal" ||
      name.includes("boreal")
    );
  });
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

function buildChatUiContext(input: {
  activeIntentId: string | null;
  requestDetail: RequestDetail | null;
  selectedCenterTab: CenterViewTab;
  workspaceTab: WorkspaceTab;
}): ChatUiContext {
  const isOwner = input.requestDetail?.access?.canApproveProposals ?? false;
  const canSubmitProposal = input.requestDetail?.access?.canSubmitProposal ?? false;

  return {
    browseTab: input.workspaceTab,
    canApproveProposals: isOwner,
    canSubmitProposal,
    centerTab: input.activeIntentId ? input.selectedCenterTab : null,
    requestId: input.activeIntentId,
    requestRole: input.activeIntentId
      ? isOwner
        ? "owner"
        : canSubmitProposal
          ? "supplier"
          : "viewer"
      : "none",
    requestStatus: input.requestDetail?.intent?.status ?? null,
    surface: input.activeIntentId ? "request" : "home",
  };
}

function normalizeWorkspaceTab(value: string | null): WorkspaceTab {
  if (value === "requests" || value === "workers") {
    return value;
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
            <p>Agent: {requestDetail.assignment.agent ?? "Waiting for workers"}</p>
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
