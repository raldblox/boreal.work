"use client";

import {
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
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
  CircleUserRoundIcon,
  CopyIcon,
  ClapperboardIcon,
  DownloadIcon,
  ExternalLinkIcon,
  FileIcon,
  LoaderIcon,
  MessageSquarePlusIcon,
  MessagesSquareIcon,
  MicIcon,
  MinusIcon,
  PackageIcon,
  PanelLeftCloseIcon,
  PanelLeftOpenIcon,
  PanelRightCloseIcon,
  PinIcon,
  PlusIcon,
  RefreshCwIcon,
  SearchIcon,
  ShoppingCartIcon,
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
  ProfileBuilderDialog,
  ProfileBuilderWorkspaceCard,
} from "@/components/chat/profile-builder";
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
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type {
  ActiveCart,
  CatalogEntry,
  CheckoutRecord,
  MyProfileRecord,
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
  getRequestHandlingLabel,
  getRequestHandlingMode,
} from "@/lib/boreal/routing/request-handling";
import {
  buildProfileBuilderDraftFromRecord,
  cloneProfileBuilderDraft,
  createEmptyProfileBuilderDraft,
  hasPublishableSupplyListing,
  hasSavableProfileBuilderDraft,
  mergeProfileBuilderDraft,
  profileBuilderToProfileMutationInput,
  profileBuilderToSupplyMutationInput,
  type ProfileBuilderDraft,
} from "@/lib/boreal/schemas/profile-builder";
import {
  normalizeProposalDraft,
  type ProposalDraft,
} from "@/lib/boreal/schemas/proposal";
import { cn } from "@/lib/utils";
import { usePayment } from "@/hooks/use-payment";
import {
  inferInvocationAccess,
  parsePaymentResponseHeader,
} from "@/lib/boreal/integrations/service-providers/payments/x402";

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

const REQUEST_SIDEBAR_WIDTH = "clamp(15.5rem, 18vw, 18rem)";
const DISCOVERY_SIDEBAR_WIDTH = "clamp(21rem, 24vw, 25rem)";
const COLLAPSED_SIDEBAR_WIDTH = "4.25rem";
const DESKTOP_STAGE_GAP = "1rem";

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
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeIntentId = searchParams.get("request");
  const seededPrompt = searchParams.get("prompt");
  const selectedCenterTab = normalizeCenterViewTab(searchParams.get("view"));
  const workspaceTab = normalizeWorkspaceTab(searchParams.get("browse"));

  const [conversationId, setConversationId] = useState<string | undefined>();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isApprovingRequest, setIsApprovingRequest] = useState(false);
  const [isCancellingRequest, setIsCancellingRequest] = useState(false);
  const [isRetryingRequest, setIsRetryingRequest] = useState(false);
  const [isRefreshingRequest, setIsRefreshingRequest] = useState(false);
  const [isRefiningMatches, setIsRefiningMatches] = useState(false);
  const [isMarkingRequestFulfilled, setIsMarkingRequestFulfilled] = useState(false);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [optimisticReviewRating, setOptimisticReviewRating] = useState<number | null>(null);
  const [workspace, setWorkspace] = useState<WorkspaceState>(emptyWorkspace);
  const [showIntentSidebar, setShowIntentSidebar] = useState(true);
  const [showWorkspace, setShowWorkspace] = useState(false);
  const [isMobileIntentSidebarOpen, setIsMobileIntentSidebarOpen] = useState(false);
  const [isMobileWorkspaceOpen, setIsMobileWorkspaceOpen] = useState(false);
  const [isRefreshingVideo, setIsRefreshingVideo] = useState(false);
  const [composerText, setComposerText] = useState(() => seededPrompt ?? "");
  const [matchQueryDraft, setMatchQueryDraft] = useState<string | null>(null);
  const [pinningSupplyId, setPinningSupplyId] = useState<string | null>(null);
  const [isBorealProfileOpen, setIsBorealProfileOpen] = useState(false);
  const [proposalMessage, setProposalMessage] = useState("");
  const [proposalDraft, setProposalDraft] = useState<ProposalDraft>(emptyProposalDraft);
  const [isDraftingProposal, setIsDraftingProposal] = useState(false);
  const [isSubmittingProposal, setIsSubmittingProposal] = useState(false);
  const [approvingProposalId, setApprovingProposalId] = useState<string | null>(null);
  const [deliveryDraft, setDeliveryDraft] = useState<DeliveryDraft>(emptyDeliveryDraft);
  const [isSubmittingDelivery, setIsSubmittingDelivery] = useState(false);
  const [isArchivingRequest, setIsArchivingRequest] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckingOutCart, setIsCheckingOutCart] = useState(false);
  const [cartNotice, setCartNotice] = useState<string | null>(null);
  const [activePaymentItemId, setActivePaymentItemId] = useState<string | null>(null);
  const [isProfileBuilderOpen, setIsProfileBuilderOpen] = useState(false);
  const [isDraftingProfileBuilder, setIsDraftingProfileBuilder] = useState(false);
  const [isSavingProfileBuilder, setIsSavingProfileBuilder] = useState(false);
  const [profileBuilderMessage, setProfileBuilderMessage] = useState("");
  const [profileBuilderDraft, setProfileBuilderDraft] = useState<ProfileBuilderDraft>(
    createEmptyProfileBuilderDraft(),
  );

  const { data: session } = useSession();
  const ownerExternalId = session?.user?.id;
  const { ready: privyReady, authenticated: privyAuthenticated, login } = usePrivy();
  const { defaultWalletAddress, isWalletReady, payWithX402 } = usePayment();

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
  const activeCartResult = useQuery(
    convexFunctionRefs.getActiveCart,
    ownerExternalId ? { ownerExternalId } : "skip",
  );
  const checkoutHistoryResult = useQuery(
    convexFunctionRefs.listCheckoutHistory,
    ownerExternalId ? { limit: 12, ownerExternalId } : "skip",
  );
  const myProfileResult = useQuery(
    convexFunctionRefs.getMyProfile,
    ownerExternalId ? { ownerExternalId } : "skip",
  );
  const isRequestLoading = Boolean(activeIntentId) && requestDetailResult === undefined;
  const requestDetail = (requestDetailResult ?? null) as RequestDetail | null;
  const activeCart = (activeCartResult ?? null) as ActiveCart;
  const checkoutHistory = (checkoutHistoryResult ?? []) as CheckoutRecord[];
  const myProfileRecord = (myProfileResult ?? null) as MyProfileRecord;
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
  const isAnyMobileSidebarOpen = isMobileIntentSidebarOpen || isMobileWorkspaceOpen;
  const desktopIntentSidebarStyle = {
    minWidth: showIntentSidebar ? REQUEST_SIDEBAR_WIDTH : COLLAPSED_SIDEBAR_WIDTH,
    overflow: "hidden",
    width: showIntentSidebar ? REQUEST_SIDEBAR_WIDTH : COLLAPSED_SIDEBAR_WIDTH,
    willChange: "width",
  } as CSSProperties;
  const desktopWorkspaceStyle = {
    width: DISCOVERY_SIDEBAR_WIDTH,
  } as CSSProperties;
  const desktopCenterShellStyle = {
    maxWidth: showWorkspace
      ? `calc(100% - ${DISCOVERY_SIDEBAR_WIDTH} - ${DESKTOP_STAGE_GAP})`
      : "100%",
    width: showWorkspace
      ? `calc(100% - ${DISCOVERY_SIDEBAR_WIDTH} - ${DESKTOP_STAGE_GAP})`
      : "100%",
    willChange: "width",
  } as CSSProperties;
  const desktopWorkspaceContentStyle = {
    width: "100%",
    willChange: "transform",
  } as CSSProperties;
  const desktopWorkspacePanelStyle = {
    width: "100%",
    willChange: "transform",
  } as CSSProperties;
  const desktopWorkspaceMotionStyle = {
    transitionDelay: showWorkspace ? "0ms" : "0ms",
  } as CSSProperties;

  const deleteIntent = useMutation(deleteIntentMutation);
  const generateUploadUrl = useMutation(generateUploadUrlMutation);
  const refineRequestMatches = useMutation(convexFunctionRefs.refineRequestMatches);
  const togglePinnedSupplyMatch = useMutation(convexFunctionRefs.togglePinnedSupplyMatch);
  const borealAgentStats = useQuery(convexFunctionRefs.getBorealAgentStats, {});
  const addToCart = useMutation(convexFunctionRefs.addToCart);
  const updateCartLineQuantity = useMutation(convexFunctionRefs.updateCartLineQuantity);
  const removeFromCart = useMutation(convexFunctionRefs.removeFromCart);
  const clearActiveCart = useMutation(convexFunctionRefs.clearActiveCart);
  const checkoutCart = useMutation(convexFunctionRefs.checkoutCart);
  const beginPaymentAttempt = useMutation(convexFunctionRefs.beginPaymentAttempt);
  const completePaymentAttempt = useMutation(convexFunctionRefs.completePaymentAttempt);
  const upsertMyProfile = useMutation(convexFunctionRefs.upsertMyProfile);
  const createSupplyEntry = useMutation(convexFunctionRefs.createSupplyEntry);

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
  const resolvedMatchQueryDraft =
    matchQueryDraft ??
    requestDetail?.intent?.catalogQuery ??
    requestDetail?.intent?.summary ??
    requestDetail?.intent?.title ??
    "";
  const activeProfileBuilderWorkspace =
    effectiveWorkspace.kind === "profile_builder" ? effectiveWorkspace : null;

  function buildInitialProfileBuilderDraft() {
    const base = myProfileRecord
      ? buildProfileBuilderDraftFromRecord(myProfileRecord)
      : createEmptyProfileBuilderDraft(session?.user?.name ?? "");

    if (!activeProfileBuilderWorkspace) {
      return base;
    }

    return mergeProfileBuilderDraft(base, activeProfileBuilderWorkspace.draft);
  }

  function openProfileBuilder() {
    setProfileBuilderDraft(buildInitialProfileBuilderDraft());
    setProfileBuilderMessage(
      activeProfileBuilderWorkspace?.sourceBrief ?? composerText.trim(),
    );
    setIsProfileBuilderOpen(true);
  }

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
    if (!seededPrompt) {
      return;
    }

    const params = new URLSearchParams(searchParams.toString());
    params.delete("prompt");
    const nextQuery = params.toString();
    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, {
      scroll: false,
    });
  }, [pathname, router, searchParams, seededPrompt]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 1024px)");

    const handleViewportChange = (event: MediaQueryList | MediaQueryListEvent) => {
      if (event.matches) {
        setIsMobileIntentSidebarOpen(false);
        setIsMobileWorkspaceOpen(false);
      }
    };

    handleViewportChange(mediaQuery);
    mediaQuery.addEventListener("change", handleViewportChange);

    return () => {
      mediaQuery.removeEventListener("change", handleViewportChange);
    };
  }, []);

  useEffect(() => {
    if (!isAnyMobileSidebarOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isAnyMobileSidebarOpen]);

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

  async function handleAddToCart(supplyId: string) {
    if (!ownerExternalId) {
      setErrorMessage("Sign in with X first before adding items to cart.");
      return;
    }

    setCartNotice(null);

    try {
      const result = await addToCart({
        ownerDisplayName: session?.user?.name ?? undefined,
        ownerExternalId,
        sourceIntentId: activeIntentId ?? undefined,
        supplyId,
      });

      if (!result.added) {
        throw new Error("Could not add this listing to cart.");
      }

      setIsCartOpen(true);
      setCartNotice("Added to cart.");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Could not add to cart.");
    }
  }

  async function handleUpdateCartQuantity(cartLineItemId: string, quantity: number) {
    if (!ownerExternalId) {
      return;
    }

    setCartNotice(null);

    try {
      await updateCartLineQuantity({
        cartLineItemId,
        ownerExternalId,
        quantity,
      });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Could not update cart.");
    }
  }

  async function handleRemoveFromCart(cartLineItemId: string) {
    if (!ownerExternalId) {
      return;
    }

    setCartNotice(null);

    try {
      await removeFromCart({
        cartLineItemId,
        ownerExternalId,
      });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Could not remove cart item.");
    }
  }

  async function handleClearCart() {
    if (!ownerExternalId) {
      return;
    }

    setCartNotice(null);

    try {
      await clearActiveCart({ ownerExternalId });
      setCartNotice("Cart cleared.");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Could not clear cart.");
    }
  }

  async function handleCheckoutCart() {
    if (!ownerExternalId || isCheckingOutCart) {
      return;
    }

    setIsCheckingOutCart(true);
    setCartNotice(null);

    try {
      const result = await checkoutCart({
        ownerDisplayName: session?.user?.name ?? undefined,
        ownerExternalId,
        sourceIntentId: activeIntentId ?? activeCart?.sourceIntentId ?? undefined,
      });

      if (!result.placed) {
        throw new Error("Could not place checkout.");
      }

      setCartNotice("Checkout placed. Payable provider items now show wallet actions below.");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Could not place checkout.");
    } finally {
      setIsCheckingOutCart(false);
    }
  }

  async function handleExecuteCheckoutItemPayment(
    checkout: CheckoutRecord,
    item: CheckoutRecord["items"][number],
  ) {
    if (!ownerExternalId) {
      setErrorMessage("Sign in with X first before paying for provider-backed items.");
      return;
    }

    if (!privyAuthenticated) {
      login();
      return;
    }

    if (!isWalletReady || !defaultWalletAddress) {
      setErrorMessage("Connect a Privy wallet with a funded address before paying.");
      return;
    }

    const endpointUrl =
      item.serviceInvocation?.endpointUrl ??
      item.sourceListingUrl ??
      item.accessUrl;

    if (!endpointUrl || !item.payment) {
      setErrorMessage("This checkout item does not have a payable invocation attached.");
      return;
    }

    setActivePaymentItemId(item._id);
    setCartNotice(null);
    setErrorMessage(null);

    try {
      await beginPaymentAttempt({
        checkoutItemId: item._id,
        ownerExternalId,
        walletAddress: defaultWalletAddress,
      });

      const response = await payWithX402({
        init: {
          method: item.serviceInvocation?.endpointMethod ?? "GET",
        },
        maxAmountUsd: item.payment.amount,
        url: endpointUrl,
        walletAddress: defaultWalletAddress,
      });
      const paymentReceipt = parsePaymentResponseHeader(response.headers.get("PAYMENT-RESPONSE"));
      const contentType = response.headers.get("content-type") ?? "";
      const responsePayload = contentType.includes("application/json")
        ? ((await response.json()) as unknown)
        : { rawText: await response.text() };

      if (!response.ok) {
        await completePaymentAttempt({
          checkoutItemId: item._id,
          errorMessage:
            responsePayload && typeof responsePayload === "object" && "rawText" in responsePayload
              ? String(responsePayload.rawText)
              : `Invocation failed with ${response.status}.`,
          ownerExternalId,
          paymentReceiptJson: paymentReceipt ? JSON.stringify(paymentReceipt) : undefined,
          responseJson: JSON.stringify(responsePayload),
          status: "failed",
          txHash: pickTxHash(paymentReceipt),
        });
        throw new Error(`Provider invocation failed with ${response.status}.`);
      }

      const invocationAccess = inferInvocationAccess(responsePayload);
      await completePaymentAttempt({
        accessLabel: invocationAccess.accessLabel,
        accessUrl: invocationAccess.accessUrl,
        checkoutItemId: item._id,
        ownerExternalId,
        paymentReceiptJson: paymentReceipt ? JSON.stringify(paymentReceipt) : undefined,
        responseJson: JSON.stringify(responsePayload),
        status: invocationAccess.accessUrl ? "completed" : "submitted",
        txHash: pickTxHash(paymentReceipt),
      });

      setCartNotice(
        invocationAccess.accessUrl
          ? `Payment settled. ${item.title} is now available.`
          : `Payment settled. ${item.title} has been invoked and is now tracked in checkout history.`,
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Could not complete this provider payment.",
      );
    } finally {
      setActivePaymentItemId(null);
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

  async function handleRefineMatches() {
    if (!activeIntentId || !resolvedMatchQueryDraft.trim() || isRefiningMatches) {
      return;
    }

    setErrorMessage(null);
    setIsRefiningMatches(true);

    try {
      const result = await refineRequestMatches({
        intentId: activeIntentId,
        ownerExternalId,
        query: resolvedMatchQueryDraft.trim(),
      });

      if (!result.refined) {
        throw new Error("Could not refresh request matches.");
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Could not refresh request matches.",
      );
    } finally {
      setIsRefiningMatches(false);
    }
  }

  async function handleTogglePinnedMatch(supplyId: string) {
    if (!activeIntentId || pinningSupplyId) {
      return;
    }

    setErrorMessage(null);
    setPinningSupplyId(supplyId);

    try {
      const result = await togglePinnedSupplyMatch({
        intentId: activeIntentId,
        ownerExternalId,
        supplyId,
      });

      if (!result.updated) {
        throw new Error("Could not update pinned match.");
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Could not update pinned match.",
      );
    } finally {
      setPinningSupplyId(null);
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

  async function handleDraftProfileBuilder() {
    if (!profileBuilderMessage.trim() || isDraftingProfileBuilder) {
      return;
    }

    setErrorMessage(null);
    setIsDraftingProfileBuilder(true);

    try {
      const response = await fetch("/api/profile-builder/draft", {
        body: JSON.stringify({
          message: profileBuilderMessage,
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });
      const payload = (await response.json()) as {
        draft?: ProfileBuilderDraft;
        error?: string;
      };

      const draftedProfile = payload.draft;

      if (!response.ok || !draftedProfile) {
        throw new Error(payload.error ?? "Could not draft the profile builder.");
      }

      setProfileBuilderDraft((current) => mergeProfileBuilderDraft(current, draftedProfile));
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Could not draft the profile builder.",
      );
    } finally {
      setIsDraftingProfileBuilder(false);
    }
  }

  async function saveProfileBuilder(includeListing: boolean) {
    if (!ownerExternalId || isSavingProfileBuilder) {
      if (!ownerExternalId) {
        setErrorMessage("Sign in with X first before saving your profile.");
      }
      return;
    }

    if (!hasSavableProfileBuilderDraft(profileBuilderDraft)) {
      setErrorMessage("Add at least a headline or bio before saving the profile.");
      return;
    }

    if (includeListing && !hasPublishableSupplyListing(profileBuilderDraft)) {
      setErrorMessage("Complete the listing title, category, and description before publishing.");
      return;
    }

    setErrorMessage(null);
    setIsSavingProfileBuilder(true);

    try {
      const profileResult = await upsertMyProfile(
        profileBuilderToProfileMutationInput(profileBuilderDraft, {
          displayName:
            (profileBuilderDraft.profile.displayName || session?.user?.name) ?? undefined,
          externalId: ownerExternalId,
          handle: undefined,
        }),
      );

      if (!profileResult.saved) {
        throw new Error("Could not save the profile.");
      }

      if (includeListing) {
        const supplyInput = profileBuilderToSupplyMutationInput(profileBuilderDraft, {
          displayName:
            (profileBuilderDraft.profile.displayName || session?.user?.name) ?? undefined,
          externalId: ownerExternalId,
          handle: undefined,
        });

        if (!supplyInput) {
          throw new Error("Could not publish the listing.");
        }

        const supplyResult = await createSupplyEntry(supplyInput);

        if (!supplyResult.created) {
          throw new Error("Could not publish the listing.");
        }
      }

      if (activeIntentId && requestDetail?.intent?.routeTarget === "profile_update") {
        const response = await fetch(`/api/requests/${activeIntentId}/fulfill`, {
          method: "POST",
        });
        const payload = (await response.json()) as { error?: string; fulfilled?: boolean };

        if (!response.ok || !payload.fulfilled) {
          throw new Error(payload.error ?? "Profile was saved, but the request could not be marked fulfilled.");
        }
      } else {
        setWorkspace({
          draft: cloneProfileBuilderDraft(profileBuilderDraft),
          kind: "profile_builder",
          sourceBrief: profileBuilderMessage,
          subtitle: includeListing
            ? "Your public profile was saved and the first listing is now published."
            : "Your public profile was saved. Publish a listing whenever you are ready.",
          title: "Profile and supply builder",
        });
      }

      setIsProfileBuilderOpen(false);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Could not save the profile builder.",
      );
    } finally {
      setIsSavingProfileBuilder(false);
    }
  }

  function handleSidebarSelect(intent: SidebarIntentPreview) {
    updateWorkspaceUrl({
      browse: "workers",
      request: intent._id,
      view: "chat",
    });
    setMatchQueryDraft(null);
    setProposalDraft(emptyProposalDraft());
    setProposalMessage("");
    setDeliveryDraft(emptyDeliveryDraft());
    setOptimisticReviewRating(null);
    setIsMobileIntentSidebarOpen(false);
    setIsMobileWorkspaceOpen(false);
    setShowWorkspace(true);
    setMessages([]);
  }

  function handleMarketplaceSelect(intent: SidebarIntentPreview) {
    updateWorkspaceUrl({
      browse: "requests",
      request: intent._id,
      view: intent.isOwner ? "chat" : "workspace",
    });
    setMatchQueryDraft(null);
    setProposalDraft(emptyProposalDraft());
    setProposalMessage("");
    setDeliveryDraft(emptyDeliveryDraft());
    setOptimisticReviewRating(null);
    setIsMobileIntentSidebarOpen(false);
    setIsMobileWorkspaceOpen(false);
    setShowWorkspace(true);
    setMessages([]);
  }

  function handleClearSelection() {
    updateWorkspaceUrl({
      request: null,
      view: null,
    });
    setMatchQueryDraft(null);
    setProposalDraft(emptyProposalDraft());
    setProposalMessage("");
    setDeliveryDraft(emptyDeliveryDraft());
    setOptimisticReviewRating(null);
    setMessages([]);
    setConversationId(undefined);
    setIsMobileIntentSidebarOpen(false);
    setIsMobileWorkspaceOpen(false);
    setWorkspace(emptyWorkspace);
  }

  function handleDownloadVideo(videoId: string) {
    window.open(
      `/api/video-jobs/${videoId}/content?download=1`,
      "_blank",
      "noopener,noreferrer",
    );
  }

  function openMobileIntentSidebar() {
    if (window.matchMedia("(min-width: 1024px)").matches) {
      return;
    }

    setIsMobileWorkspaceOpen(false);
    setIsMobileIntentSidebarOpen(true);
  }

  function openMobileDiscovery() {
    if (window.matchMedia("(min-width: 1024px)").matches) {
      return;
    }

    setIsMobileIntentSidebarOpen(false);
    setIsMobileWorkspaceOpen(true);
  }

  const isHomeView = !activeIntentId && displayedMessages.length === 0;

  return (
    <>
      <div className="mx-auto flex h-svh w-full max-w-450 flex-col overflow-hidden px-4 py-4 sm:px-4">
        <div className="flex min-h-0 flex-1 flex-col gap-4 lg:flex-row">
          <div
            className="relative hidden min-h-0 shrink-0 overflow-hidden transition-[width,min-width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] lg:block"
            style={desktopIntentSidebarStyle}
          >
            <div
              aria-hidden={!showIntentSidebar}
              className={cn(
                "absolute inset-y-0 left-0 transition-opacity duration-200 ease-out",
                showIntentSidebar
                  ? "opacity-100"
                  : "pointer-events-none opacity-0",
              )}
              inert={!showIntentSidebar}
              style={{ width: REQUEST_SIDEBAR_WIDTH }}
            >
              <>
                <IntentSidebar
                  intents={sidebarIntents}
                  onDeselect={handleClearSelection}
                  onSelect={handleSidebarSelect}
                  selectedIntentId={activeIntentId}
                />
                <Button
                  aria-label="Minimize requests sidebar"
                  className="absolute top-3 right-3 z-20 bg-background/90 backdrop-blur"
                  onClick={() => setShowIntentSidebar(false)}
                  size="icon-sm"
                  type="button"
                  variant="outline"
                >
                  <PanelLeftCloseIcon />
                </Button>
              </>
            </div>
            <div
              aria-hidden={showIntentSidebar}
              className={cn(
                "absolute inset-y-0 left-0 transition-opacity duration-200 ease-out",
                showIntentSidebar
                  ? "pointer-events-none opacity-0"
                  : "opacity-100",
              )}
              inert={showIntentSidebar}
              style={{ width: COLLAPSED_SIDEBAR_WIDTH }}
            >
              <CollapsedRequestsRail
                accountImageUrl={session?.user?.image ?? null}
                accountName={session?.user?.name ?? null}
                onExpand={() => setShowIntentSidebar(true)}
                onNewChat={handleClearSelection}
                requestCount={sidebarIntents.length}
              />
            </div>
          </div>

          <div className="relative flex min-h-0 min-w-0 flex-1">
            <div
              aria-hidden={!showWorkspace}
              className={cn(
                "absolute inset-y-0 right-0 hidden overflow-hidden lg:block",
                showWorkspace ? "pointer-events-auto" : "pointer-events-none",
              )}
              inert={!showWorkspace}
              style={desktopWorkspaceStyle}
            >
              <div
                className={cn(
                  "absolute inset-0 origin-right transform-gpu bg-background/98 transition-transform duration-100 ease-[cubic-bezier(0.22,1,0.36,1)] shadow-[0_18px_40px_-34px_rgba(15,23,42,0.24)]",
                  showWorkspace ? "scale-100" : "scale-[0.95]",
                )}
                style={{ ...desktopWorkspacePanelStyle, ...desktopWorkspaceMotionStyle }}
              >
                <div className="h-full" style={desktopWorkspaceContentStyle}>
                  <WorkspacePanel
                    activeTab={workspaceTab}
                    onAddToCart={handleAddToCart}
                    onSelectRequest={handleMarketplaceSelect}
                    onTabChange={(value) => updateWorkspaceUrl({ browse: value })}
                    ownerExternalId={ownerExternalId}
                  />
                </div>
              </div>
            </div>

            <section
              className="relative z-10 flex h-full min-h-0 min-w-0 flex-col overflow-hidden border border-border bg-background transition-[width] duration-320 ease-[cubic-bezier(0.22,1,0.36,1)] shadow-[0_18px_40px_-34px_rgba(15,23,42,0.4)]"
              style={desktopCenterShellStyle}
            >
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
                <div className="flex items-center gap-2 lg:hidden">
                  <Button
                    aria-label="Open requests menu"
                    onClick={openMobileIntentSidebar}
                    size="sm"
                    type="button"
                    variant="outline"
                  >
                    <PanelLeftOpenIcon />
                    Menu
                  </Button>
                  <Button
                    aria-label="Open discovery drawer"
                    onClick={openMobileDiscovery}
                    size="sm"
                    type="button"
                    variant="outline"
                  >
                    <SearchIcon />
                    Discovery
                  </Button>
                </div>
                <div className="hidden items-center gap-2 lg:flex">
                  {showWorkspace ? (
                    <Button
                      aria-label="Hide market"
                      onClick={() => setShowWorkspace(false)}
                      size="icon-sm"
                      type="button"
                      variant="ghost"
                    >
                      <PanelRightCloseIcon />
                    </Button>
                  ) : (
                    <Button
                      aria-label="Open market"
                      className="shadow-[0_0_0_1px_rgba(15,23,42,0.08)]"
                      onClick={() => setShowWorkspace(true)}
                      size="sm"
                      type="button"
                      variant="outline"
                    >
                      <PackageIcon />
                      Market
                    </Button>
                  )}
                </div>
                {isSubmitting ? (
                  <LoaderIcon className="size-4 animate-spin text-muted-foreground" />
                ) : null}
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
                          openMobileDiscovery();
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
                        isRefiningMatches={isRefiningMatches}
                        isSubmittingDelivery={isSubmittingDelivery}
                        isSubmittingProposal={isSubmittingProposal}
                        matchQueryDraft={resolvedMatchQueryDraft}
                        onAddToCart={handleAddToCart}
                        proposalDraft={proposalDraft}
                        proposalMessage={proposalMessage}
                        onApproveProposal={handleApproveProposal}
                        onDeliveryFilesSelected={handleDeliveryFilesSelected}
                        onDraftProposal={handleDraftProposal}
                        onOpenProfileBuilder={openProfileBuilder}
                        onRefineMatches={handleRefineMatches}
                        onRemoveDeliveryAttachment={handleRemoveDeliveryAttachment}
                        onSubmitDelivery={handleSubmitDelivery}
                        onSubmitProposal={handleSubmitProposal}
                        onTogglePinnedMatch={handleTogglePinnedMatch}
                        pinningSupplyId={pinningSupplyId}
                        setDeliveryDraft={setDeliveryDraft}
                        setMatchQueryDraft={setMatchQueryDraft}
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
                          onAddToCart={handleAddToCart}
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
                          onOpenProfileBuilder={openProfileBuilder}
                          requestDetail={requestDetail}
                          review={effectiveReview}
                          shouldPromptReview={shouldPromptReview}
                          workspace={effectiveWorkspace}
                        />
                      ) : (
                        <>
                          {displayedMessages.map((message) => (
                            <Message from={message.role} key={message.id}>
                              <MessageContent>
                                <MessageResponse className="[&_a]:inline-flex [&_a]:items-center [&_a]:rounded-full [&_a]:border [&_a]:border-border [&_a]:px-2.5 [&_a]:py-1 [&_a]:text-xs [&_a]:uppercase [&_a]:tracking-[0.16em]">
                                  {message.content}
                                </MessageResponse>
                              </MessageContent>
                            </Message>
                          ))}
                          {hasRenderableInlineWorkspace(effectiveWorkspace) ? (
                            <InlineWorkspaceCard
                              isRefreshingVideo={isRefreshingVideo}
                              onAddToCart={handleAddToCart}
                              onAskCatalogItem={(item) => {
                                void submitMessage(
                                  `Tell me more about ${item.title}. Include best use cases, what it delivers, and whether it fits my request.`,
                                );
                              }}
                              onDownloadVideo={handleDownloadVideo}
                              onOpenProfileBuilder={openProfileBuilder}
                              onQuickReply={(value) => {
                                setComposerText(value);
                              }}
                              onRefreshVideo={() => undefined}
                              workspace={effectiveWorkspace}
                            />
                          ) : null}
                        </>
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
                    <Button onClick={openProfileBuilder} size="sm" type="button" variant="outline">
                      <CircleUserRoundIcon />
                      Profile update
                    </Button>
                    <Button
                      onClick={() => setIsCartOpen(true)}
                      size="sm"
                      type="button"
                      variant="outline"
                    >
                      <ShoppingCartIcon />
                      Cart
                      {activeCart?.itemCount ? ` (${activeCart.itemCount})` : ""}
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
          </div>
        </div>
      </div>
      <MobileSidebarDrawer
        label="Requests"
        onOpenChange={setIsMobileIntentSidebarOpen}
        open={isMobileIntentSidebarOpen}
        side="left"
      >
        <IntentSidebar
          intents={sidebarIntents}
          onDeselect={handleClearSelection}
          onSelect={handleSidebarSelect}
          selectedIntentId={activeIntentId}
        />
      </MobileSidebarDrawer>
      <MobileSidebarDrawer
        label="Discovery"
        onOpenChange={setIsMobileWorkspaceOpen}
        open={isMobileWorkspaceOpen}
        side="right"
      >
        <WorkspacePanel
          activeTab={workspaceTab}
          onAddToCart={handleAddToCart}
          onSelectRequest={handleMarketplaceSelect}
          onTabChange={(value) => updateWorkspaceUrl({ browse: value })}
          ownerExternalId={ownerExternalId}
        />
      </MobileSidebarDrawer>
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
      <ProfileBuilderDialog
        draft={profileBuilderDraft}
        isDrafting={isDraftingProfileBuilder}
        isOpen={isProfileBuilderOpen}
        isSaving={isSavingProfileBuilder}
        onDraftWithBoreal={handleDraftProfileBuilder}
        onOpenChange={setIsProfileBuilderOpen}
        onSaveProfile={() => saveProfileBuilder(false)}
        onSaveProfileAndListing={() => saveProfileBuilder(true)}
        setDraft={setProfileBuilderDraft}
        setSourceMessage={setProfileBuilderMessage}
        sourceMessage={profileBuilderMessage}
      />
      <CartDialog
        activeCart={activeCart}
        activePaymentItemId={activePaymentItemId}
        checkoutHistory={checkoutHistory}
        isCheckingOutCart={isCheckingOutCart}
        isOpen={isCartOpen}
        isWalletReady={isWalletReady}
        notice={cartNotice}
        onCheckout={handleCheckoutCart}
        onClearCart={handleClearCart}
        onOpenChange={setIsCartOpen}
        onPayItem={handleExecuteCheckoutItemPayment}
        onRemoveItem={handleRemoveFromCart}
        onUpdateQuantity={handleUpdateCartQuantity}
      />
    </>
  );
}

function CollapsedRequestsRail({
  accountImageUrl,
  accountName,
  onNewChat,
  onExpand,
  requestCount,
}: {
  accountImageUrl: string | null;
  accountName: string | null;
  onNewChat: () => void;
  onExpand: () => void;
  requestCount: number;
}) {
  const requestBadge = requestCount > 99 ? "99+" : String(requestCount);
  const avatarInitial = accountName?.trim().charAt(0).toUpperCase() ?? "U";

  return (
    <aside className="flex h-full w-full flex-col items-center border border-border bg-[linear-gradient(180deg,rgba(15,23,42,0.02),transparent_18%,rgba(15,23,42,0.04)_100%)] px-3 py-3">
      <button
        aria-label="Expand requests sidebar"
        className="group relative flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-background shadow-sm transition-[background-color,box-shadow] duration-200 hover:bg-foreground/5 hover:shadow-[0_10px_24px_rgba(15,23,42,0.12)]"
        onClick={onExpand}
        type="button"
      >
        <span className="absolute inset-0 flex items-center justify-center text-sm font-semibold uppercase tracking-[0.18em] text-foreground transition-all duration-200 group-hover:scale-90 group-hover:opacity-0">
          B
        </span>
        <PanelLeftOpenIcon className="absolute size-4 scale-90 opacity-0 text-foreground transition-all duration-200 group-hover:scale-100 group-hover:opacity-100" />
      </button>

      <div className="mt-5 flex flex-col items-center gap-3">
        <Button
          aria-label="Start new chat"
          className="size-11 rounded-xl shadow-[0_10px_18px_rgba(15,23,42,0.18)]"
          onClick={onNewChat}
          size="icon"
          type="button"
        >
          <MessageSquarePlusIcon className="size-4" />
        </Button>

        <button
          aria-label={`Open requests sidebar with ${requestCount} tracked requests`}
          className="relative flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-background text-foreground shadow-sm transition-[background-color,box-shadow] duration-200 hover:bg-foreground/5 hover:shadow-[0_10px_24px_rgba(15,23,42,0.12)]"
          onClick={onExpand}
          type="button"
        >
          <MessagesSquareIcon className="size-4" />
          <span className="absolute -top-1.5 -right-1.5 min-w-5 rounded-full bg-primary px-1.5 py-0.5 text-[0.55rem] font-semibold leading-none text-primary-foreground">
            {requestBadge}
          </span>
        </button>
      </div>

      <div className="mt-auto flex flex-col items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-background shadow-sm">
          <Avatar className="size-7">
            {accountImageUrl ? (
              <AvatarImage alt={accountName ?? "Account"} src={accountImageUrl} />
            ) : null}
            <AvatarFallback>
              {accountName ? avatarInitial : <CircleUserRoundIcon className="size-4" />}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </aside>
  );
}

function MobileSidebarDrawer({
  children,
  label,
  onOpenChange,
  open,
  side,
}: {
  children: ReactNode;
  label: string;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  side: "left" | "right";
}) {
  useEffect(() => {
    if (!open) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onOpenChange(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onOpenChange, open]);

  return (
    <div className="lg:hidden">
      <button
        aria-hidden={!open}
        aria-label={`Close ${label.toLowerCase()}`}
        className={cn(
          "fixed inset-0 z-40 bg-background/72 backdrop-blur-[2px] transition-opacity duration-300 ease-out",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={() => onOpenChange(false)}
        type="button"
      />
      <div
        aria-hidden={!open}
        aria-label={label}
        aria-modal="true"
        className={cn(
          "fixed inset-y-0 z-50 w-[min(24rem,calc(100vw-1rem))] transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
          side === "left" ? "left-0" : "right-0",
          open
            ? "translate-x-0"
            : side === "left"
              ? "-translate-x-full"
              : "translate-x-full",
          open ? "pointer-events-auto" : "pointer-events-none",
        )}
        inert={!open}
        role="dialog"
      >
        <div
          className={cn(
            "relative h-full bg-background shadow-2xl",
            side === "left" ? "border-r border-border" : "border-l border-border",
          )}
        >
          <Button
            aria-label={`Close ${label.toLowerCase()}`}
            className="absolute top-3 right-3 z-10 bg-background/90 backdrop-blur"
            onClick={() => onOpenChange(false)}
            size="icon-sm"
            type="button"
            variant="outline"
          >
            {side === "left" ? <PanelLeftCloseIcon /> : <PanelRightCloseIcon />}
          </Button>
          <div className="h-full">{children}</div>
        </div>
      </div>
    </div>
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
  onOpenProfileBuilder,
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
  onOpenProfileBuilder: () => void;
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
  const handlingMode = getRequestHandlingMode(intent);
  const isProfileUpdate = intent.routeTarget === "profile_update";

  if (actionState.kind === "none" || actionState.kind === "review") {
    return null;
  }

  if (access?.canApproveProposals && submittedProposals.length > 0) {
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
      {actionState.kind === "approval" ? (
        <div className="space-y-3 border border-border p-4">
          <div className="flex items-start gap-3">
            <div className="flex size-9 items-center justify-center border border-border">
              {handlingMode === "workers" ? (
                <UserIcon className="size-4 text-muted-foreground" />
              ) : (
                <BotIcon className="size-4 text-muted-foreground" />
              )}
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">
                {handlingMode === "clarify"
                  ? "No executor should start yet"
                  : handlingMode === "workers"
                    ? "Approval target: worker market"
                    : isProfileUpdate
                      ? "Approval target: Boreal profile drafting"
                      : "Approval target: Boreal Agent"}
              </p>
              <p className="text-xs text-muted-foreground">
                {handlingMode === "clarify"
                  ? "Boreal is waiting for a clearer brief before anyone gets approved."
                  : handlingMode === "workers"
                    ? "Approving this will publish the request for proposals and matching."
                    : isProfileUpdate
                      ? "Approving this will let Boreal draft your editable public profile and first listing. You can also open the builder form and fill it manually."
                      : "Approving this will let Boreal Agent take the first execution pass."}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
            <span className="border border-border px-2 py-1">
              {getRequestHandlingLabel(handlingMode)}
            </span>
            <span className="border border-border px-2 py-1">
              {intent.requestedOutputTypes.map((type) => type.replaceAll("_", " ")).join(" / ")}
            </span>
            <span className="border border-border px-2 py-1">
              {intent.routeTarget.replaceAll("_", " ")}
            </span>
          </div>
        </div>
      ) : null}
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
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
            Missing details
          </p>
          <div className="space-y-1 text-xs text-muted-foreground">
            {intent.missingDetails.map((detail) => (
              <p key={detail}>- {detail}</p>
            ))}
          </div>
        </div>
      ) : null}
      {actionState.kind === "approval" && intent.suggestedReplies.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {intent.suggestedReplies.map((reply) => (
            <span
              className="inline-flex items-center rounded-full border border-border px-2.5 py-1 text-[11px] uppercase tracking-[0.16em] text-muted-foreground"
              key={reply}
            >
              {reply}
            </span>
          ))}
        </div>
      ) : null}
      <div className="flex flex-wrap gap-2">
        {actionState.kind === "approval" ? (
          <>
            {isProfileUpdate ? (
              <Button onClick={onOpenProfileBuilder} size="sm" type="button" variant="outline">
                <CircleUserRoundIcon />
                Open builder form
              </Button>
            ) : null}
            {handlingMode !== "clarify" ? (
              <Button disabled={isApprovingRequest} onClick={onApproveRequest} size="sm" type="button">
                {isApprovingRequest ? <LoaderIcon className="animate-spin" /> : <CheckIcon />}
                {handlingMode === "workers"
                  ? "Open for proposals"
                  : isProfileUpdate
                    ? "Approve Boreal draft"
                    : "Approve Boreal Agent"}
              </Button>
            ) : null}
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
        {actionState.kind === "waiting_workers" ? (
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
            {isProfileUpdate ? (
              <Button onClick={onOpenProfileBuilder} size="sm" type="button">
                <CircleUserRoundIcon />
                Open builder form
              </Button>
            ) : null}
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
            {isProfileUpdate ? (
              <Button onClick={onOpenProfileBuilder} size="sm" type="button" variant="outline">
                <CircleUserRoundIcon />
                Open builder form
              </Button>
            ) : null}
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
  onAddToCart,
  onArchiveRequest,
  onApproveProposal,
  onApproveRequest,
  onAskCatalogItem,
  onCancelRequest,
  onDeleteIntent,
  onDownloadVideo,
  onMarkRequestFulfilled,
  onOpenProfileBuilder,
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
  onAddToCart: (supplyId: string) => Promise<void>;
  onArchiveRequest: () => Promise<void>;
  onApproveProposal: (proposalId: string) => Promise<void>;
  onApproveRequest: (intentId?: string | null) => Promise<void>;
  onAskCatalogItem: (item: CatalogItem) => void;
  onCancelRequest: (intentId?: string | null) => Promise<void>;
  onDeleteIntent: () => void;
  onDownloadVideo: (videoId: string) => void;
  onMarkRequestFulfilled: () => Promise<void>;
  onOpenProfileBuilder: () => void;
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
                <MessageResponse className="[&_a]:inline-flex [&_a]:items-center [&_a]:rounded-full [&_a]:border [&_a]:border-border [&_a]:px-2.5 [&_a]:py-1 [&_a]:text-xs [&_a]:uppercase [&_a]:tracking-[0.16em]">
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
                <MessageResponse className="[&_a]:inline-flex [&_a]:items-center [&_a]:rounded-full [&_a]:border [&_a]:border-border [&_a]:px-2.5 [&_a]:py-1 [&_a]:text-xs [&_a]:uppercase [&_a]:tracking-[0.16em]">
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
            onAddToCart={onAddToCart}
            onDownloadVideo={onDownloadVideo}
            onOpenProfileBuilder={onOpenProfileBuilder}
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
          onOpenProfileBuilder={onOpenProfileBuilder}
          onRefreshRequest={onRefreshRequest}
          onRetryRequest={onRetryRequest}
          participants={requestDetail.participants}
          onSubmitReview={onSubmitReview}
          proposals={requestDetail.proposals}
          shouldPromptReview={shouldPromptReview}
        />
      ) : null}

      {workspace.kind === "catalog" ||
      workspace.kind === "profile_builder" ||
      (timeline.length === 0 && hasRenderableInlineWorkspace(workspace)) ? (
        <InlineWorkspaceCard
          isRefreshingVideo={isRefreshingVideo}
          onAddToCart={onAddToCart}
          onAskCatalogItem={onAskCatalogItem}
          onDownloadVideo={onDownloadVideo}
          onOpenProfileBuilder={onOpenProfileBuilder}
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
  onAddToCart,
  onDownloadVideo,
  onOpenProfileBuilder,
  onRefreshVideo,
  workspace,
}: {
  artifact: NonNullable<RequestDetail["artifact"]>;
  isRefreshingVideo: boolean;
  onAddToCart: (supplyId: string) => Promise<void>;
  onDownloadVideo: (videoId: string) => void;
  onOpenProfileBuilder: () => void;
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
        onAddToCart={onAddToCart}
        onAskCatalogItem={() => undefined}
        onDownloadVideo={onDownloadVideo}
        onOpenProfileBuilder={onOpenProfileBuilder}
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
  isRefiningMatches,
  isSubmittingDelivery,
  isSubmittingProposal,
  matchQueryDraft,
  onAddToCart,
  onApproveProposal,
  onDeliveryFilesSelected,
  onDraftProposal,
  onOpenProfileBuilder,
  onRefineMatches,
  onRemoveDeliveryAttachment,
  onSubmitDelivery,
  onSubmitProposal,
  onTogglePinnedMatch,
  pinningSupplyId,
  proposalDraft,
  proposalMessage,
  requestDetail,
  setDeliveryDraft,
  setMatchQueryDraft,
  setProposalDraft,
  setProposalMessage,
}: {
  approvingProposalId: string | null;
  canSubmitDelivery: boolean;
  deliveryDraft: DeliveryDraft;
  deliverySubmitted: boolean;
  hasSubmittedProposal: boolean;
  isDraftingProposal: boolean;
  isRefiningMatches: boolean;
  isSubmittingDelivery: boolean;
  isSubmittingProposal: boolean;
  matchQueryDraft: string;
  onAddToCart: (supplyId: string) => Promise<void>;
  onApproveProposal: (proposalId: string) => Promise<void>;
  onDeliveryFilesSelected: (files: File[]) => Promise<void>;
  onDraftProposal: () => Promise<void>;
  onOpenProfileBuilder: () => void;
  onRefineMatches: () => Promise<void>;
  onRemoveDeliveryAttachment: (attachmentId: string) => void;
  onSubmitDelivery: () => Promise<void>;
  onSubmitProposal: () => Promise<void>;
  onTogglePinnedMatch: (supplyId: string) => Promise<void>;
  pinningSupplyId: string | null;
  proposalDraft: ProposalDraft;
  proposalMessage: string;
  requestDetail: RequestDetail | null;
  setDeliveryDraft: Dispatch<SetStateAction<DeliveryDraft>>;
  setMatchQueryDraft: Dispatch<SetStateAction<string | null>>;
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
  const matchCandidates = requestDetail?.matchCandidates.map(mapCatalogEntryToItem) ?? [];
  const isProfileUpdateRequest = requestDetail?.intent?.routeTarget === "profile_update";
  const hasMatchingWorkspace = Boolean(
    matchCandidates.length > 0 ||
      requestDetail?.intent?.matchAttempts ||
      requestDetail?.intent?.shouldSearchCatalog ||
      requestDetail?.intent?.routeTarget === "catalog_lookup",
  );

  return (
    <div className="space-y-4">
      {hasMatchingWorkspace ? (
        <RequestMatchingPanel
          isOwner={isOwner}
          isRefiningMatches={isRefiningMatches}
          matchAttempts={requestDetail?.intent?.matchAttempts ?? 0}
          matchCandidates={matchCandidates}
          matchQueryDraft={matchQueryDraft}
          onAddToCart={onAddToCart}
          onRefineMatches={onRefineMatches}
          onTogglePinnedMatch={onTogglePinnedMatch}
          pinningSupplyId={pinningSupplyId}
          setMatchQueryDraft={setMatchQueryDraft}
        />
      ) : null}

      {isProfileUpdateRequest ? (
        <div className="space-y-4 border border-border p-4">
          <div className="space-y-1">
            <p className="text-sm font-medium">Profile onboarding workspace</p>
            <p className="text-xs text-muted-foreground">
              Use the builder to save your public profile and publish the first listing. Boreal drafting is optional and only runs when you ask for it.
            </p>
          </div>
          <ProfileBuilderWorkspaceCard
            draft={buildWorkspaceProfileBuilderDraft(requestDetail)}
            onOpen={onOpenProfileBuilder}
            sourceBrief={requestDetail?.intent?.body ?? ""}
          />
        </div>
      ) : null}

      {!isProfileUpdateRequest && isOwner ? (
        <div className="space-y-3 border border-border p-4">
          <p className="text-sm font-medium">Proposal approvals</p>
          <p className="text-xs text-muted-foreground">
            Review who is asking to take this request, what they will deliver, and the quoted
            price before approving.
          </p>
        </div>
      ) : !isProfileUpdateRequest && canSubmitDelivery ? (
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
      ) : !isProfileUpdateRequest && requestDetail?.access?.canSubmitProposal && !hasSubmittedProposal ? (
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
      ) : !isProfileUpdateRequest && requestDetail?.access?.canSubmitProposal && hasSubmittedProposal ? (
        <div className="space-y-4 border border-border p-4">
          <div className="space-y-1">
            <p className="text-sm font-medium">Proposal submitted</p>
            <p className="text-xs text-muted-foreground">
              Your proposal is now in review. This workspace will update when the owner accepts or
              declines it.
            </p>
          </div>
        </div>
      ) : !isProfileUpdateRequest ? (
        <div className="space-y-3 border border-border p-4">
          <p className="text-sm font-medium">Proposal submission unavailable</p>
          <p className="text-xs text-muted-foreground">
            This workspace is not accepting proposals right now.
          </p>
        </div>
      ) : null}

      {!isProfileUpdateRequest ? (
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
      ) : null}
    </div>
  );
}

function RequestMatchingPanel({
  isOwner,
  isRefiningMatches,
  matchAttempts,
  matchCandidates,
  matchQueryDraft,
  onAddToCart,
  onRefineMatches,
  onTogglePinnedMatch,
  pinningSupplyId,
  setMatchQueryDraft,
}: {
  isOwner: boolean;
  isRefiningMatches: boolean;
  matchAttempts: number;
  matchCandidates: CatalogItem[];
  matchQueryDraft: string;
  onAddToCart: (supplyId: string) => Promise<void>;
  onRefineMatches: () => Promise<void>;
  onTogglePinnedMatch: (supplyId: string) => Promise<void>;
  pinningSupplyId: string | null;
  setMatchQueryDraft: Dispatch<SetStateAction<string | null>>;
}) {
  const feasibleMatches = matchCandidates.filter((candidate) => candidate.gatedOutReasons.length === 0);
  const blockedMatches = matchCandidates.filter((candidate) => candidate.gatedOutReasons.length > 0);
  const pinnedCount = feasibleMatches.filter((candidate) => candidate.isPinned).length;

  return (
    <div className="space-y-4 border border-border p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium">Matching workspace</p>
          <p className="text-xs text-muted-foreground">
            Ranked supply stays attached to this request so discovery, pinning, and checkout remain
            auditable in one place.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
          <span className="inline-flex items-center border border-border px-2 py-1">
            {feasibleMatches.length} ready
          </span>
          <span className="inline-flex items-center border border-border px-2 py-1">
            {blockedMatches.length} gated
          </span>
          <span className="inline-flex items-center border border-border px-2 py-1">
            {pinnedCount} pinned
          </span>
          <span className="inline-flex items-center border border-border px-2 py-1">
            {matchAttempts} runs
          </span>
        </div>
      </div>

      {isOwner ? (
        <div className="space-y-3 border border-border p-4">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
              Refine request search
            </p>
            <p className="text-sm text-muted-foreground">
              Tighten the catalog query when the first pass is too broad or too weak.
            </p>
          </div>
          <div className="flex flex-col gap-2 md:flex-row">
            <Input
              className="h-10"
              onChange={(event) => setMatchQueryDraft(event.currentTarget.value)}
              placeholder="Refine the request with product, capability, or service keywords"
              value={matchQueryDraft}
            />
            <Button
              disabled={isRefiningMatches || matchQueryDraft.trim().length === 0}
              onClick={() => void onRefineMatches()}
              type="button"
            >
              {isRefiningMatches ? <LoaderIcon className="animate-spin" /> : <RefreshCwIcon />}
              Refresh matches
            </Button>
          </div>
        </div>
      ) : null}

      {feasibleMatches.length > 0 ? (
        <div className="space-y-3">
          <div className="space-y-1">
            <p className="text-sm font-medium">Ready matches</p>
            <p className="text-xs text-muted-foreground">
              These listings passed the current gates and can move into cart or checkout now.
            </p>
          </div>
          <div className="space-y-3">
            {feasibleMatches.map((item) => (
              <RequestMatchCard
                isOwner={isOwner}
                item={item}
                key={item.id}
                onAddToCart={onAddToCart}
                onTogglePinnedMatch={onTogglePinnedMatch}
                pinningSupplyId={pinningSupplyId}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="border border-dashed border-border p-4 text-sm text-muted-foreground">
          No ready matches yet. Refine the query or wait for new supply to appear.
        </div>
      )}

      {blockedMatches.length > 0 ? (
        <div className="space-y-3">
          <div className="space-y-1">
            <p className="text-sm font-medium">Needs refinement</p>
            <p className="text-xs text-muted-foreground">
              These candidates were retrieved but gated out by pricing, availability, exclusions, or
              deadline fit.
            </p>
          </div>
          <div className="space-y-3">
            {blockedMatches.map((item) => (
              <RequestMatchCard
                isOwner={false}
                item={item}
                key={item.id}
                onAddToCart={onAddToCart}
                onTogglePinnedMatch={onTogglePinnedMatch}
                pinningSupplyId={pinningSupplyId}
              />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function RequestMatchCard({
  isOwner,
  item,
  onAddToCart,
  onTogglePinnedMatch,
  pinningSupplyId,
}: {
  isOwner: boolean;
  item: CatalogItem;
  onAddToCart: (supplyId: string) => Promise<void>;
  onTogglePinnedMatch: (supplyId: string) => Promise<void>;
  pinningSupplyId: string | null;
}) {
  const isBlocked = item.gatedOutReasons.length > 0;
  const confidence = item.successProbability ?? item.matchScore ?? 0;

  return (
    <div
      className={cn(
        "space-y-4 border p-4",
        item.isPinned && "border-teal-500/40 bg-teal-500/5",
        isBlocked && "border-amber-500/30 bg-amber-500/5",
      )}
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-medium">{item.title}</p>
            {item.isPinned ? (
              <span className="inline-flex items-center border border-teal-500/30 px-2 py-1 text-[11px] uppercase tracking-[0.16em] text-teal-700 dark:text-teal-300">
                pinned
              </span>
            ) : null}
            {item.matchScore !== null ? (
              <span
                className={cn(
                  "inline-flex items-center border px-2 py-1 text-[11px] uppercase tracking-[0.16em]",
                  getMatchScoreTone(item.matchScore),
                )}
              >
                {item.matchScore}% match
              </span>
            ) : null}
            {item.matchStage ? (
              <span className="inline-flex items-center border border-border px-2 py-1 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                {item.matchStage}
              </span>
            ) : null}
          </div>
          {item.subtitle ? <p className="text-sm">{item.subtitle}</p> : null}
          <p className="text-sm text-muted-foreground">{item.description}</p>
          <div className="flex flex-wrap gap-x-4 gap-y-2 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
            <span>{item.category}</span>
            <span>{item.deliveryType}</span>
            <span>{item.priceLabel}</span>
            {item.estimatedDeliveryLabel ? <span>{item.estimatedDeliveryLabel}</span> : null}
            {item.seller?.displayName ? <span>By {item.seller.displayName}</span> : null}
          </div>
        </div>
        {isOwner && !isBlocked ? (
          <Button
            disabled={pinningSupplyId === item.id}
            onClick={() => void onTogglePinnedMatch(item.id)}
            size="sm"
            type="button"
            variant={item.isPinned ? "default" : "outline"}
          >
            {pinningSupplyId === item.id ? (
              <LoaderIcon className="animate-spin" />
            ) : (
              <PinIcon />
            )}
            {item.isPinned ? "Pinned" : "Pin match"}
          </Button>
        ) : null}
      </div>

      {!isBlocked ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
            <span>Why it matched</span>
            <span>{confidence}% confidence</span>
          </div>
          <Progress value={confidence} />
          {item.matchReasons.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {item.matchReasons.map((reason) => (
                <span
                  className="inline-flex items-center border border-border px-2 py-1 text-[11px] uppercase tracking-[0.16em] text-muted-foreground"
                  key={`${item.id}-${reason}`}
                >
                  {reason}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
            <span>Blocked by</span>
            <span>{confidence}% confidence</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {item.gatedOutReasons.map((reason) => (
              <span
                className="inline-flex items-center border border-amber-500/30 px-2 py-1 text-[11px] uppercase tracking-[0.16em] text-amber-700 dark:text-amber-300"
                key={`${item.id}-${reason}`}
              >
                {reason}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {!isBlocked && item.isCartEnabled ? (
          <Button onClick={() => void onAddToCart(item.id)} size="sm" type="button">
            <ShoppingCartIcon />
            Add to cart
          </Button>
        ) : null}
        {item.executorUrl ? (
          <Button asChild size="sm" type="button" variant="outline">
            <a href={item.executorUrl} rel="noreferrer" target="_blank">
              <DownloadIcon />
              {item.supportsDirectInvoke ? "Open endpoint" : "Preview"}
            </a>
          </Button>
        ) : null}
        {item.sourceListingUrl ? (
          <Button asChild size="sm" type="button" variant="outline">
            <a href={item.sourceListingUrl} rel="noreferrer" target="_blank">
              <ExternalLinkIcon />
              Provider page
            </a>
          </Button>
        ) : null}
        {item.seller?.profileId ? (
          <Button asChild size="sm" type="button" variant="outline">
            <Link href={`/p/${item.seller.profileId}`}>View seller</Link>
          </Button>
        ) : null}
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

function CartDialog({
  activeCart,
  activePaymentItemId,
  checkoutHistory,
  isCheckingOutCart,
  isOpen,
  isWalletReady,
  notice,
  onCheckout,
  onClearCart,
  onOpenChange,
  onPayItem,
  onRemoveItem,
  onUpdateQuantity,
}: {
  activeCart: ActiveCart;
  activePaymentItemId: string | null;
  checkoutHistory: CheckoutRecord[];
  isCheckingOutCart: boolean;
  isOpen: boolean;
  isWalletReady: boolean;
  notice: string | null;
  onCheckout: () => Promise<void>;
  onClearCart: () => Promise<void>;
  onOpenChange: (open: boolean) => void;
  onPayItem: (checkout: CheckoutRecord, item: CheckoutRecord["items"][number]) => Promise<void>;
  onRemoveItem: (cartLineItemId: string) => Promise<void>;
  onUpdateQuantity: (cartLineItemId: string, quantity: number) => Promise<void>;
}) {
  const cartItems = activeCart?.items ?? [];
  const hasCartItems = cartItems.length > 0;

  return (
    <Dialog onOpenChange={onOpenChange} open={isOpen}>
      <DialogContent className="max-w-5xl p-0 sm:max-w-5xl">
        <div className="flex max-h-[88svh] min-h-[72svh] flex-col overflow-hidden">
          <DialogHeader className="border-b border-border px-6 py-4">
            <DialogTitle>Cart and checkout</DialogTitle>
            <DialogDescription>
              Compare selected supply, adjust quantities, then check out. Instant digital goods unlock immediately. Async services stay tracked as submitted orders.
            </DialogDescription>
          </DialogHeader>

          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
            <div className="space-y-6">
              <section className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Active cart</p>
                    <p className="text-xs text-muted-foreground">
                      This cart stays tied to your signed-in X account and can also be linked to the current request.
                    </p>
                  </div>
                  {hasCartItems ? (
                    <span className="inline-flex items-center border border-border px-2 py-1 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                      {activeCart?.itemCount ?? 0} item{(activeCart?.itemCount ?? 0) === 1 ? "" : "s"}
                    </span>
                  ) : null}
                </div>

                {notice ? (
                  <div className="border border-teal-500/30 bg-teal-500/5 px-3 py-2 text-xs text-teal-700 dark:text-teal-300">
                    {notice}
                  </div>
                ) : null}

                {!hasCartItems ? (
                  <div className="border border-dashed border-border p-6 text-sm text-muted-foreground">
                    Your cart is empty. Add a product or service from matched supply or the public market.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {cartItems.map((item) => (
                      <CartLineItemCard
                        item={item}
                        key={item._id}
                        onRemoveItem={onRemoveItem}
                        onUpdateQuantity={onUpdateQuantity}
                      />
                    ))}

                    <div className="flex flex-wrap items-center justify-between gap-3 border border-border px-4 py-3">
                      <div className="space-y-1">
                        <p className="text-sm font-medium">Subtotal</p>
                        <p className="text-xs text-muted-foreground">
                          Provider-backed items preserve their payment and invocation state after checkout.
                        </p>
                      </div>
                      <p className="text-sm font-medium">
                        {formatMoney(activeCart?.subtotalAmount ?? 0, activeCart?.currency ?? "USD")}
                      </p>
                    </div>
                  </div>
                )}
              </section>

              <section className="space-y-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Recent checkouts</p>
                  <p className="text-xs text-muted-foreground">
                    Instant downloads, payable provider calls, and submitted service orders stay visible here.
                  </p>
                </div>

                {checkoutHistory.length === 0 ? (
                  <div className="border border-dashed border-border p-6 text-sm text-muted-foreground">
                    No checkout history yet.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {checkoutHistory.map((checkout) => (
                      <div className="space-y-4 border border-border p-4" key={checkout._id}>
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="space-y-1">
                            <p className="text-sm font-medium">
                              Checkout {formatRequestDate(checkout.createdAt)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {checkout.itemCount} item{checkout.itemCount === 1 ? "" : "s"} · {formatMoney(checkout.subtotalAmount, checkout.currency)}
                            </p>
                          </div>
                          <CheckoutStatusPill status={checkout.status} />
                        </div>

                        <div className="space-y-3">
                          {checkout.items.map((item) => (
                            <div
                              className="flex flex-wrap items-center justify-between gap-3 border border-border px-3 py-3"
                              key={item._id}
                            >
                              <div className="min-w-0 flex-1 space-y-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className="text-sm font-medium">{item.title}</p>
                                  <span className="inline-flex items-center border border-border px-2 py-1 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                                    {item.status.replaceAll("_", " ")}
                                  </span>
                                </div>
                                {item.subtitle ? (
                                  <p className="text-xs text-muted-foreground">{item.subtitle}</p>
                                ) : null}
                                <div className="flex flex-wrap gap-x-4 gap-y-2 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                                  <span>{item.fulfillmentKind}</span>
                                  <span>{item.deliveryType}</span>
                                  <span>Qty {item.quantity}</span>
                                  <span>
                                    {formatMoney((item.unitPriceAmount ?? 0) * item.quantity, checkout.currency)}
                                  </span>
                                  {item.sellerDisplayName ? <span>By {item.sellerDisplayName}</span> : null}
                                  {item.payment ? <span>{item.payment.protocol}</span> : null}
                                  {item.payment?.network ? <span>{item.payment.network}</span> : null}
                                  {item.serviceInvocation?.executionSurface ? (
                                    <span>{item.serviceInvocation.executionSurface}</span>
                                  ) : null}
                                </div>
                                {item.payment ? (
                                  <div className="mt-2 flex flex-wrap gap-2">
                                    <span className="inline-flex items-center rounded-full border border-border px-2.5 py-1 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                                      {item.payment.status.replaceAll("_", " ")}
                                    </span>
                                    {item.payment.errorMessage ? (
                                      <span className="inline-flex items-center rounded-full border border-amber-500/30 px-2.5 py-1 text-[11px] uppercase tracking-[0.16em] text-amber-700 dark:text-amber-300">
                                        {item.payment.errorMessage}
                                      </span>
                                    ) : null}
                                  </div>
                                ) : null}
                              </div>

                              <div className="flex flex-wrap gap-2">
                                {item.payment &&
                                (item.payment.status === "ready_to_pay" ||
                                  item.payment.status === "pending_approval" ||
                                  item.payment.status === "failed") &&
                                item.serviceInvocation?.endpointUrl ? (
                                  <Button
                                    disabled={!isWalletReady || activePaymentItemId === item._id}
                                    onClick={() => void onPayItem(checkout, item)}
                                    size="sm"
                                    type="button"
                                  >
                                    {activePaymentItemId === item._id ? (
                                      <LoaderIcon className="animate-spin" />
                                    ) : (
                                      <WalletIcon />
                                    )}
                                    {activePaymentItemId === item._id
                                      ? "Paying..."
                                      : item.payment.status === "failed"
                                        ? "Retry payment"
                                        : "Pay & invoke"}
                                  </Button>
                                ) : null}
                                {item.accessUrl ? (
                                  <Button asChild size="sm" type="button" variant="outline">
                                    <a href={item.accessUrl} rel="noreferrer" target="_blank">
                                      <DownloadIcon />
                                      {item.accessLabel ?? "Open"}
                                    </a>
                                  </Button>
                                ) : null}
                                {item.sourceListingUrl && !item.accessUrl ? (
                                  <Button asChild size="sm" type="button" variant="outline">
                                    <a href={item.sourceListingUrl} rel="noreferrer" target="_blank">
                                      <ExternalLinkIcon />
                                      Open provider
                                    </a>
                                  </Button>
                                ) : null}
                                {item.sellerProfileId ? (
                                  <Button asChild size="sm" type="button" variant="ghost">
                                    <Link href={`/p/${item.sellerProfileId}`}>View seller</Link>
                                  </Button>
                                ) : null}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          </div>

          <DialogFooter className="border-t border-border px-6 py-4 sm:justify-between">
            <Button
              disabled={!hasCartItems || isCheckingOutCart}
              onClick={() => void onClearCart()}
              size="sm"
              type="button"
              variant="ghost"
            >
              Clear cart
            </Button>
            <Button
              disabled={!hasCartItems || isCheckingOutCart}
              onClick={() => void onCheckout()}
              size="sm"
              type="button"
            >
              {isCheckingOutCart ? <LoaderIcon className="animate-spin" /> : <ShoppingCartIcon />}
              {isCheckingOutCart ? "Placing checkout..." : "Checkout now"}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CartLineItemCard({
  item,
  onRemoveItem,
  onUpdateQuantity,
}: {
  item: NonNullable<ActiveCart>["items"][number];
  onRemoveItem: (cartLineItemId: string) => Promise<void>;
  onUpdateQuantity: (cartLineItemId: string, quantity: number) => Promise<void>;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border border-border p-4">
      <div className="min-w-0 flex-1 space-y-1">
        <p className="text-sm font-medium">{item.title}</p>
        {item.subtitle ? <p className="text-xs text-muted-foreground">{item.subtitle}</p> : null}
        <div className="flex flex-wrap gap-x-4 gap-y-2 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
          <span>{item.fulfillmentKind}</span>
          <span>{item.deliveryType}</span>
          <span>
            {item.unitPriceAmount === null
              ? "Custom"
              : formatMoney(item.unitPriceAmount, item.currency)}
          </span>
          {item.sellerDisplayName ? <span>By {item.sellerDisplayName}</span> : null}
          {item.paymentProtocol ? <span>{item.paymentProtocol}</span> : null}
          {item.sourceProviderKey ? <span>{item.sourceProviderKey}</span> : null}
          {item.paymentNetworkHints[0] ? <span>{item.paymentNetworkHints[0]}</span> : null}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1 border border-border px-2 py-1">
          <Button
            onClick={() => void onUpdateQuantity(item._id, item.quantity - 1)}
            size="icon-sm"
            type="button"
            variant="ghost"
          >
            <MinusIcon />
          </Button>
          <span className="min-w-6 text-center text-sm font-medium">{item.quantity}</span>
          <Button
            onClick={() => void onUpdateQuantity(item._id, item.quantity + 1)}
            size="icon-sm"
            type="button"
            variant="ghost"
          >
            <PlusIcon />
          </Button>
        </div>
        <div className="min-w-20 text-right text-sm font-medium">
          {formatMoney(item.lineTotalAmount, item.currency)}
        </div>
        <Button
          onClick={() => void onRemoveItem(item._id)}
          size="icon-sm"
          type="button"
          variant="ghost"
        >
          <Trash2Icon />
        </Button>
      </div>
    </div>
  );
}

function CheckoutStatusPill({ status }: { status: string }) {
  const tone =
    status === "fulfilled"
      ? "border-teal-500/30 text-teal-700 dark:text-teal-300"
      : status === "pending_payment"
        ? "border-sky-500/30 text-sky-700 dark:text-sky-300"
        : status === "failed"
          ? "border-amber-500/30 text-amber-700 dark:text-amber-300"
          : "border-border text-muted-foreground";

  return (
    <span
      className={cn("inline-flex items-center border px-2 py-1 text-[11px] uppercase tracking-[0.16em]", tone)}
    >
      {status.replaceAll("_", " ")}
    </span>
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

function formatMoney(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat("en-US", {
      currency,
      maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
      style: "currency",
    }).format(amount);
  } catch {
    return `${currency} ${amount}`;
  }
}

function pickTxHash(receipt: Record<string, unknown> | null) {
  if (!receipt) {
    return undefined;
  }

  const candidates = [
    receipt.txHash,
    receipt.transactionHash,
    receipt.hash,
    receipt.transaction_id,
  ];
  const match = candidates.find((value) => typeof value === "string" && value.trim());

  return typeof match === "string" ? match : undefined;
}

function getRequestActionState(
  intent: NonNullable<RequestDetail["intent"]>,
  access: RequestDetail["access"],
  reviewPending: boolean,
) {
  const status = intent.status;
  const handlingMode = getRequestHandlingMode(intent);

  if (reviewPending) {
    return {
      description: "The work is delivered. Capture a quick rating inline before moving on.",
      kind: "review" as const,
      title: "Delivery finished",
    };
  }

  if (status === "proposed" && access?.canApproveProposals) {
    return {
      description:
        handlingMode === "clarify"
          ? "The request is drafted, but the scope is still too vague to approve safely."
          : handlingMode === "workers"
            ? "Approve to publish this request for workers and proposals. No one is assigned yet."
            : "Approve to let Boreal Agent take the first pass on this request.",
      kind: "approval" as const,
      title:
        handlingMode === "clarify"
          ? "Clarify before approval"
          : handlingMode === "workers"
            ? "Open for workers"
            : "Approve Boreal Agent",
    };
  }

  if (status === "open" && access?.isOwner) {
    return {
      description:
        "This request is approved and waiting for proposals or matches. Share it, browse supply, or keep refining the scope.",
      kind: "waiting_workers" as const,
      title: "Waiting for workers",
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

function getMatchScoreTone(score: number | null) {
  if (score === null) {
    return "border-border text-muted-foreground";
  }

  if (score >= 80) {
    return "border-emerald-500/30 text-emerald-700 dark:text-emerald-300";
  }

  if (score >= 65) {
    return "border-amber-500/30 text-amber-700 dark:text-amber-300";
  }

  if (score >= 50) {
    return "border-orange-500/30 text-orange-700 dark:text-orange-300";
  }

  return "border-rose-500/30 text-rose-700 dark:text-rose-300";
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
  onAddToCart,
  onAskCatalogItem,
  onDownloadVideo,
  onOpenProfileBuilder,
  onQuickReply,
  onRefreshVideo,
  workspace,
}: {
  isRefreshingVideo: boolean;
  onAddToCart: (supplyId: string) => Promise<void>;
  onAskCatalogItem: (item: CatalogItem) => void;
  onDownloadVideo: (videoId: string) => void;
  onOpenProfileBuilder: () => void;
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
            <CatalogWorkspaceCard
              item={item}
              key={item.id}
              onAddToCart={onAddToCart}
              onAskCatalogItem={onAskCatalogItem}
            />
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

  if (workspace.kind === "profile_builder") {
    return (
      <ProfileBuilderWorkspaceCard
        draft={workspace.draft}
        onOpen={onOpenProfileBuilder}
        sourceBrief={workspace.sourceBrief}
      />
    );
  }

  return null;
}

function CatalogWorkspaceCard({
  item,
  onAddToCart,
  onAskCatalogItem,
}: {
  item: CatalogItem;
  onAddToCart: (supplyId: string) => Promise<void>;
  onAskCatalogItem: (item: CatalogItem) => void;
}) {
  return (
    <div className="space-y-4 border border-border p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-medium">{item.title}</p>
            {item.matchScore !== null ? (
              <span
                className={cn(
                  "inline-flex items-center border px-2 py-1 text-[11px] uppercase tracking-[0.16em]",
                  getMatchScoreTone(item.matchScore),
                )}
              >
                {item.matchScore}% match
              </span>
            ) : null}
            <span className="inline-flex items-center border border-border px-2 py-1 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
              {item.fulfillmentKind}
            </span>
          </div>
          {item.subtitle ? <p className="text-sm">{item.subtitle}</p> : null}
          <p className="text-sm text-muted-foreground">{item.description}</p>
          <div className="flex flex-wrap gap-x-4 gap-y-2 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
            <span>{item.category}</span>
            <span>{item.deliveryType}</span>
            <span>{item.priceLabel}</span>
            {item.estimatedDeliveryLabel ? <span>{item.estimatedDeliveryLabel}</span> : null}
            {item.seller?.displayName ? <span>By {item.seller.displayName}</span> : null}
            {item.paymentProtocol ? <span>{item.paymentProtocol}</span> : null}
            {item.sourceProviderKey ? <span>{item.sourceProviderKey}</span> : null}
            {item.paymentNetworkHints[0] ? <span>{item.paymentNetworkHints[0]}</span> : null}
          </div>
        </div>
      </div>

      {item.matchReasons.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {item.matchReasons.map((reason) => (
            <span
              className="inline-flex items-center border border-border px-2 py-1 text-[11px] uppercase tracking-[0.16em] text-muted-foreground"
              key={`${item.id}-${reason}`}
            >
              {reason}
            </span>
          ))}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {item.isCartEnabled ? (
          <Button onClick={() => void onAddToCart(item.id)} size="sm" type="button">
            <ShoppingCartIcon />
            Add to cart
          </Button>
        ) : null}
        {item.executorUrl ? (
          <Button asChild size="sm" type="button" variant="outline">
            <a href={item.executorUrl} rel="noreferrer" target="_blank">
              <DownloadIcon />
              {item.supportsDirectInvoke ? "Open endpoint" : "Preview"}
            </a>
          </Button>
        ) : null}
        {item.sourceListingUrl ? (
          <Button asChild size="sm" type="button" variant="outline">
            <a href={item.sourceListingUrl} rel="noreferrer" target="_blank">
              <ExternalLinkIcon />
              Provider page
            </a>
          </Button>
        ) : null}
        {item.seller?.profileId ? (
          <Button asChild size="sm" type="button" variant="outline">
            <Link href={`/p/${item.seller.profileId}`}>View seller</Link>
          </Button>
        ) : null}
        <Button onClick={() => onAskCatalogItem(item)} size="sm" type="button" variant="ghost">
          Ask more
        </Button>
      </div>
    </div>
  );
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

  if (detail.intent.routeTarget === "profile_update") {
    const draftActivity = extractProfileBuilderActivity(detail.activity);

    return {
      draft:
        draftActivity?.draft ??
        buildProfileBuilderSeedFromIntent(detail.intent),
      kind: "profile_builder",
      sourceBrief: draftActivity?.sourceBrief ?? detail.intent.body,
      subtitle:
        detail.intent.status === "fulfilled"
          ? "The profile onboarding request is complete. You can still reopen the builder and refine the record later."
          : detail.intent.status === "in_progress" || detail.intent.status === "claimed"
            ? "Boreal delivered an editable draft. Review it, then save the profile and publish the listing when ready."
            : "Open the builder form manually, or approve Boreal to draft a stronger profile and first listing from this brief.",
      title: "Profile and supply builder",
    };
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

  if (detail.catalogItems.length > 0) {
    return {
      highlightedId: detail.catalogItems[0]?._id,
      items: detail.catalogItems.map(mapCatalogEntryToItem),
      kind: "catalog",
      subtitle:
        "Matched supply stays attached to this request so products and services remain actionable after refresh.",
      title: "Matched supply",
    };
  }

  return emptyWorkspace;
}

function buildWorkspaceProfileBuilderDraft(requestDetail: RequestDetail | null) {
  if (!requestDetail?.intent) {
    return createEmptyProfileBuilderDraft();
  }

  const activityDraft = extractProfileBuilderActivity(requestDetail.activity);
  return activityDraft?.draft ?? buildProfileBuilderSeedFromIntent(requestDetail.intent);
}

function extractProfileBuilderActivity(activity: RequestDetail["activity"]) {
  const latest = [...activity]
    .reverse()
    .find((entry) => entry.type === "profile.builder_drafted");

  if (!latest?.payload) {
    return null;
  }

  const draft = latest.payload.draft;
  const sourceBrief = latest.payload.sourceBrief;

  return {
    draft: isRecord(draft)
      ? mergeProfileBuilderDraft(
          createEmptyProfileBuilderDraft(),
          draft as Partial<ProfileBuilderDraft>,
        )
      : createEmptyProfileBuilderDraft(),
    sourceBrief: typeof sourceBrief === "string" ? sourceBrief : "",
  };
}

function buildProfileBuilderSeedFromIntent(intent: NonNullable<RequestDetail["intent"]>): ProfileBuilderDraft {
  const draft = createEmptyProfileBuilderDraft();

  draft.profile.headline = intent.title.slice(0, 120);
  draft.profile.bio = intent.summary.slice(0, 320);
  draft.listing.title = intent.title.slice(0, 120);
  draft.listing.description = intent.summary.slice(0, 320);
  draft.listing.enabled = true;

  return draft;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function mapCatalogEntryToItem(entry: CatalogEntry): CatalogItem {
  return {
    actorKind: entry.actorKind,
    averageRating: entry.averageRating,
    brand: entry.brand,
    capabilityTags: entry.capabilityTags,
    category: entry.category,
    checkoutProtocol: entry.checkoutProtocol,
    currency: entry.currency,
    deliveryType: entry.deliveryType,
    description: entry.description,
    estimatedDeliveryLabel: entry.estimatedDeliveryLabel,
    executionSurface: entry.executionSurface,
    executorUrl: entry.executorUrl,
    fulfillmentKind: entry.fulfillmentKind,
    gatedOutReasons: entry.gatedOutReasons,
    id: entry._id,
    isCartEnabled: entry.isCartEnabled,
    isPinned: entry.isPinned,
    matchReasons: entry.matchReasons,
    matchScore: entry.matchScore,
    matchStage: entry.matchStage,
    paymentNetworkHints: entry.paymentNetworkHints,
    paymentProtocol: entry.paymentProtocol,
    priceAmount: entry.priceAmount,
    priceLabel:
      entry.priceAmount === null
        ? "Custom"
        : entry.priceAmount === 0
          ? "Included"
          : `${entry.currency} ${entry.priceAmount}/${entry.priceType}`,
    requiresHumanApproval: entry.requiresHumanApproval,
    reviewCount: entry.reviewCount,
    seller: entry.seller,
    sourceListingUrl: entry.sourceListingUrl,
    sourceProviderKey: entry.sourceProviderKey,
    subtitle: entry.subtitle,
    supplyType: entry.supplyType,
    supportsDirectInvoke: entry.supportsDirectInvoke,
    supportsPrivyWallet: entry.supportsPrivyWallet,
    successProbability: entry.successProbability,
    title: entry.title,
  };
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
