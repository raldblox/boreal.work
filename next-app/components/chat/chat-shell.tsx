"use client"

import {
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react"
import Image from "next/image"
import Link from "next/link"
import { makeFunctionReference } from "convex/server"
import { useMutation, useQuery } from "convex/react"
import { usePrivy } from "@privy-io/react-auth"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { signIn, useSession } from "next-auth/react"
import {
  BotIcon,
  CheckIcon,
  CircleUserRoundIcon,
  CopyIcon,
  ClapperboardIcon,
  DownloadIcon,
  ExternalLinkIcon,
  FileIcon,
  LoaderIcon,
  MessagesSquareIcon,
  MicIcon,
  MinusIcon,
  PackageIcon,
  PanelLeftCloseIcon,
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
} from "lucide-react"

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
} from "@/components/ai-elements/audio-player"
import { AccountSettingsSurface } from "@/components/account/account-settings-surface"
import {
  ProfileBuilderDialog,
  ProfileBuilderWorkspaceCard,
} from "@/components/chat/profile-builder"
import { AgentDeveloperSurface } from "@/components/home/agent-developer-surface"
import { AboutPage } from "@/components/home/about-page"
import { PapersFocusBrowser } from "@/components/home/papers-focus-browser"
import {
  type DeliveryDraft,
  DeliverySubmissionDialog,
  ProposalSubmissionDialog,
} from "@/components/chat/request-workflow-dialogs"
import { HomeChatSurface } from "@/components/chat/chat-home-surface"
import { RoadmapBoard } from "@/components/roadmap/roadmap-board"
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation"
import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message"
import {
  PromptInput,
  PromptInputBody,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
} from "@/components/ai-elements/prompt-input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  ChatShellHeader,
  CollapsedRequestsRail,
  DesktopDiscoveryRail,
  DesktopIntentRail,
  FooterComposerRegion,
} from "./chat-shell-layout"
import type {
  ActiveCart,
  BorealChatSessionRecord,
  CatalogEntry,
  CheckoutRecord,
  MyProfileRecord,
  RequestDetail,
  SidebarIntentPreview,
  WalletAccountRecord,
} from "@/lib/boreal/integrations/convex/function-refs"
import { convexFunctionRefs } from "@/lib/boreal/integrations/convex/function-refs"
import type {
  CatalogItem,
  ChatAssistantResponse,
  ChatUiContext,
  WorkspaceState,
} from "@/lib/boreal/schemas/chat"
import {
  getRequestHandlingLabel,
  getRequestHandlingMode,
} from "@/lib/boreal/routing/request-handling"
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
} from "@/lib/boreal/schemas/profile-builder"
import {
  normalizeProposalDraft,
  type ProposalDraft,
} from "@/lib/boreal/schemas/proposal"
import {
  getBorealChainEnvironment,
  getBorealPrimaryChainFamily,
  getDefaultBorealNetworkKey,
} from "@/lib/boreal/commerce/networks"
import { cn } from "@/lib/utils"
import { usePayment } from "@/hooks/use-payment"
import {
  inferInvocationAccess,
  parsePaymentResponseHeader,
} from "@/lib/boreal/integrations/service-providers/payments/x402"
import {
  getPublicPaper,
  listPublicPapers,
  type PublicPaperRecord,
} from "@/lib/boreal/papers-data"

import { IntentSidebar } from "./intent-sidebar"
import {
  formatNotificationCount,
  getDefaultRequestNavigationView,
  getDetailRequestNotificationCounts,
  getPreviewRequestNotificationCounts,
  type RequestNavigationView,
} from "./request-notifications"
import {
  formatOutputTypes,
  formatRequestDate,
  RequestStatusBadge,
} from "./request-ui"
import { WorkspacePanel, type WorkspaceTab } from "./workspace-panel"
import {
  FocusSheet,
  FOCUS_SHEET_EXIT_MS,
} from "@/components/workboard/focus-sheet"

type ChatMessage = {
  content: string
  createdAt: number
  id: string
  role: "assistant" | "user"
}

type BorealTimelineSession = BorealChatSessionRecord[number]

type CenterViewTab = "activity" | "chat" | "participants" | "workspace"
type CenterSheetView = "about" | "developers" | "papers" | "roadmap"

const centerSheetViewByHref = {
  "/about": "about",
  "/developers/agents": "developers",
  "/papers": "papers",
  "/roadmap": "roadmap",
} as const satisfies Record<string, CenterSheetView>

const centerSheetHrefByView: Record<CenterSheetView, string> = {
  about: "/about",
  developers: "/developers/agents",
  papers: "/papers",
  roadmap: "/roadmap",
}

const centerSheetTitleByView: Record<CenterSheetView, string> = {
  about: "About",
  developers: "Developers",
  papers: "Papers",
  roadmap: "Roadmap",
}

const centerSheetNavHrefs = Object.keys(centerSheetViewByHref)

const sidebarIntentQuery = makeFunctionReference<
  "query",
  { limit: number; ownerExternalId?: string },
  SidebarIntentPreview[]
>("intents:listSidebar")

const requestDetailQuery = makeFunctionReference<
  "query",
  { intentId: string; ownerExternalId?: string },
  RequestDetail
>("intents:getRequestDetail")

const deleteIntentMutation = makeFunctionReference<
  "mutation",
  { intentId: string; ownerExternalId?: string },
  { deleted: boolean }
>("intents:deleteIntent")

const starterPrompts = [
  {
    description:
      "Turn skills, services, and products into a stronger public offer.",
    icon: CircleUserRoundIcon,
    prompt:
      "Help me package my capabilities into a strong public worker profile with skills, offers, and products.",
    title: "Package my capabilities",
  },
  {
    description:
      "Open a request for something that still needs the right people.",
    icon: MessagesSquareIcon,
    prompt:
      "Turn this into a public request for a problem nobody has solved for me yet, and prepare it for proposals first.",
    title: "Post a hard problem",
  },
  {
    description:
      "Find what already exists before opening a custom request.",
    icon: SearchIcon,
    prompt:
      "Show me the offers catalog and explain which Boreal tool fits each use case.",
    title: "Search the market",
  },
  {
    description:
      "Draft launch-ready media and route it into the right execution path.",
    icon: ClapperboardIcon,
    prompt:
      "Generate a short voiceover for a product announcement in a warm tone.",
    title: "Make launch media",
  },
] as const

const emptyWorkspace: WorkspaceState = {
  kind: "empty",
  subtitle:
    "When work is approved, Boreal renders assets, catalog cards, forms, or job tracking here.",
  title: "Workboard",
}

const REQUEST_SIDEBAR_WIDTH = "clamp(15.5rem, 18vw, 18rem)"
const DISCOVERY_SIDEBAR_WIDTH = "clamp(21rem, 24vw, 25rem)"
const COLLAPSED_SIDEBAR_WIDTH = "4.5rem"
const CENTER_PANEL_CLASS = "mx-auto w-full max-w-4xl px-4"
const CONTENT_RAIL_CLASS = `${CENTER_PANEL_CLASS} flex min-h-full flex-col gap-6 py-6`
const CHAT_RAIL_CLASS = `${CENTER_PANEL_CLASS} flex min-h-full flex-col gap-6 pt-6 pb-6`
const HOME_PANEL_CLASS = `${CENTER_PANEL_CLASS} flex h-full flex-col justify-center py-8`
const CHAT_COMPOSER_CLASS = `${CENTER_PANEL_CLASS} flex flex-col gap-3`

const emptyProposalDraft = (): ProposalDraft => ({
  currency: "USD",
  deliverablesBody: "",
  deliverablesType: "markdown",
  etaDays: 7,
  price: 100,
  summary: "",
})

const emptyDeliveryDraft = (): DeliveryDraft => ({
  attachments: [],
  deliverablesBody: "",
})

const generateUploadUrlMutation = makeFunctionReference<
  "mutation",
  Record<string, never>,
  string
>("fulfillments:generateUploadUrl")

export function ChatShell() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const publicPapers = useMemo(() => listPublicPapers(), [])
  const activeIntentId = searchParams.get("request")
  const seededPrompt = searchParams.get("prompt")
  const requestedCenterTab = searchParams.get("view")
  const requestedCenterSheet = normalizeCenterSheetView(searchParams.get("sheet"))
  const requestedPaperSlug = normalizePublicPaperSlug(
    searchParams.get("paper"),
    publicPapers
  )
  const selectedCenterTab = normalizeCenterViewTab(requestedCenterTab)
  const workspaceTab = normalizeWorkspaceTab(searchParams.get("browse"))

  const [conversationId, setConversationId] = useState<string | undefined>()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isApprovingRequest, setIsApprovingRequest] = useState(false)
  const [isCancellingRequest, setIsCancellingRequest] = useState(false)
  const [isRetryingRequest, setIsRetryingRequest] = useState(false)
  const [isRefreshingRequest, setIsRefreshingRequest] = useState(false)
  const [isRefiningMatches, setIsRefiningMatches] = useState(false)
  const [isMarkingRequestFulfilled, setIsMarkingRequestFulfilled] =
    useState(false)
  const [isSubmittingReview, setIsSubmittingReview] = useState(false)
  const [optimisticReviewRating, setOptimisticReviewRating] = useState<
    number | null
  >(null)
  const [workspace, setWorkspace] = useState<WorkspaceState>(emptyWorkspace)
  const [showIntentSidebar, setShowIntentSidebar] = useState(true)
  const [showWorkspace, setShowWorkspace] = useState(false)
  const [borealChatSessionLimit, setBorealChatSessionLimit] = useState(6)
  const [isPublicMarketDismissed, setIsPublicMarketDismissed] = useState(false)
  const [isAccountDialogOpen, setIsAccountDialogOpen] = useState(false)
  const [isMobileIntentSidebarOpen, setIsMobileIntentSidebarOpen] =
    useState(false)
  const [isMobileWorkspaceOpen, setIsMobileWorkspaceOpen] = useState(false)
  const [isRefreshingVideo, setIsRefreshingVideo] = useState(false)
  const [composerText, setComposerText] = useState(() => seededPrompt ?? "")
  const [pendingApprovalIntentId, setPendingApprovalIntentId] = useState<
    string | null
  >(null)
  const [matchQueryDraft, setMatchQueryDraft] = useState<string | null>(null)
  const [pinningSupplyId, setPinningSupplyId] = useState<string | null>(null)
  const [proposalMessage, setProposalMessage] = useState("")
  const [proposalDraft, setProposalDraft] =
    useState<ProposalDraft>(emptyProposalDraft)
  const [isDraftingProposal, setIsDraftingProposal] = useState(false)
  const [isSubmittingProposal, setIsSubmittingProposal] = useState(false)
  const [approvingProposalId, setApprovingProposalId] = useState<string | null>(
    null
  )
  const [deliveryDraft, setDeliveryDraft] =
    useState<DeliveryDraft>(emptyDeliveryDraft)
  const [isSubmittingDelivery, setIsSubmittingDelivery] = useState(false)
  const [isArchivingRequest, setIsArchivingRequest] = useState(false)
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [isCheckingOutCart, setIsCheckingOutCart] = useState(false)
  const [cartNotice, setCartNotice] = useState<string | null>(null)
  const [activePaymentItemId, setActivePaymentItemId] = useState<string | null>(
    null
  )
  const [isProfileBuilderOpen, setIsProfileBuilderOpen] = useState(false)
  const [isSettingDefaultPayoutWalletId, setIsSettingDefaultPayoutWalletId] =
    useState<string | null>(null)
  const [isDraftingProfileBuilder, setIsDraftingProfileBuilder] =
    useState(false)
  const [isSavingProfileBuilder, setIsSavingProfileBuilder] = useState(false)
  const [accountNotice, setAccountNotice] = useState<string | null>(null)
  const [profileBuilderMessage, setProfileBuilderMessage] = useState("")
  const [profileBuilderDraft, setProfileBuilderDraft] =
    useState<ProfileBuilderDraft>(createEmptyProfileBuilderDraft())
  const [centerSheetView, setCenterSheetView] =
    useState<CenterSheetView | null>(null)
  const [centerSheetPaperSlug, setCenterSheetPaperSlug] = useState<string | null>(
    null
  )
  const [isCenterSheetOpen, setIsCenterSheetOpen] = useState(false)

  const { data: session, status: sessionStatus } = useSession()
  const ownerExternalId = session?.user?.id
  const isXAuthenticated =
    sessionStatus === "authenticated" && Boolean(ownerExternalId)
  const isPublicDiscoveryOnly = !isXAuthenticated
  const {
    ready: privyReady,
    authenticated: privyAuthenticated,
    login,
  } = usePrivy()
  const { defaultWallet, defaultWalletAddress, isWalletReady, payWithX402 } =
    usePayment()

  const sidebarIntentsResult = useQuery(
    sidebarIntentQuery,
    isXAuthenticated
      ? {
        limit: 24,
        ownerExternalId,
      }
      : "skip"
  ) as SidebarIntentPreview[] | undefined
  const conversationSidebarResult = useQuery(
    convexFunctionRefs.listBorealChatSessions,
    isXAuthenticated && ownerExternalId
      ? {
        limit: borealChatSessionLimit,
        messageLimit: 24,
        ownerExternalId,
      }
      : "skip"
  )
  const sidebarIntents = useMemo(
    () => sidebarIntentsResult ?? [],
    [sidebarIntentsResult]
  )
  const borealChatSessions = useMemo(
    () => (conversationSidebarResult ?? []) as BorealChatSessionRecord,
    [conversationSidebarResult]
  )
  const visibleSidebarIntents = useMemo(
    () => sidebarIntents.filter((intent) => intent.status !== "closed"),
    [sidebarIntents]
  )
  const selectedIntent =
    visibleSidebarIntents.find((intent) => intent._id === activeIntentId) ??
    sidebarIntents.find((intent) => intent._id === activeIntentId) ??
    null

  const requestDetailResult = useQuery(
    requestDetailQuery,
    isXAuthenticated && activeIntentId
      ? { intentId: activeIntentId, ownerExternalId }
      : "skip"
  )
  const activeCartResult = useQuery(
    convexFunctionRefs.getActiveCart,
    ownerExternalId ? { ownerExternalId } : "skip"
  )
  const checkoutHistoryResult = useQuery(
    convexFunctionRefs.listCheckoutHistory,
    ownerExternalId ? { limit: 12, ownerExternalId } : "skip"
  )
  const myProfileResult = useQuery(
    convexFunctionRefs.getMyProfile,
    ownerExternalId ? { ownerExternalId } : "skip"
  )
  const walletAccountsResult = useQuery(
    convexFunctionRefs.getMyWalletAccounts,
    ownerExternalId ? { ownerExternalId } : "skip"
  )
  const isRequestLoading =
    isXAuthenticated &&
    Boolean(activeIntentId) &&
    requestDetailResult === undefined
  const requestDetail = (requestDetailResult ?? null) as RequestDetail | null
  const requestNotificationCounts = useMemo(
    () => getDetailRequestNotificationCounts(requestDetail),
    [requestDetail]
  )
  const activeCenterTab =
    activeIntentId && !requestedCenterTab
      ? normalizeCenterViewTab(
        getDefaultRequestNavigationView(requestNotificationCounts)
      )
      : selectedCenterTab
  const activeCart = (activeCartResult ?? null) as ActiveCart
  const checkoutHistory = (checkoutHistoryResult ?? []) as CheckoutRecord[]
  const myProfileRecord = (myProfileResult ?? null) as MyProfileRecord
  const walletAccounts = (walletAccountsResult ?? []) as WalletAccountRecord
  const isConversationLoading =
    isXAuthenticated &&
    Boolean(!activeIntentId) &&
    conversationSidebarResult === undefined &&
    messages.length === 0
  const isMissingConversation = false
  const isArchivedTranscript = Boolean(
    requestDetail?.intent?.status === "closed" &&
    requestDetail.intent.closedReason === "archived_by_user"
  )
  const myProposal =
    requestDetail?.proposals.find((proposal) => proposal.isMine) ?? null
  const hasSubmittedProposal = Boolean(myProposal)
  const canSubmitDelivery = requestDetail?.access?.canSubmitWork ?? false
  const canViewRequestChat = requestDetail?.access?.canViewChat ?? false
  const runtimeEnvironment = getBorealChainEnvironment()
  const runtimePrimaryChainFamily = getBorealPrimaryChainFamily()
  const runtimeDefaultNetworkKey = getDefaultBorealNetworkKey({
    chainFamily: runtimePrimaryChainFamily,
    environment: runtimeEnvironment,
  })
  const isChatSurfaceActive = !activeIntentId || activeCenterTab === "chat"
  const shouldShowChatComposer =
    isXAuthenticated && isChatSurfaceActive && (!activeIntentId || canViewRequestChat)
  const effectiveBorealEnabled = Boolean(isXAuthenticated)
  const isDiscoveryRailOpen = isPublicDiscoveryOnly
    ? !isPublicMarketDismissed
    : showWorkspace
  const isAnyMobileSidebarOpen =
    isMobileIntentSidebarOpen || isMobileWorkspaceOpen
  const desktopIntentSidebarStyle = {
    minWidth: showIntentSidebar
      ? REQUEST_SIDEBAR_WIDTH
      : COLLAPSED_SIDEBAR_WIDTH,
    overflow: "hidden",
    width: showIntentSidebar ? REQUEST_SIDEBAR_WIDTH : COLLAPSED_SIDEBAR_WIDTH,
    willChange: "width",
  } as CSSProperties
  const deleteIntent = useMutation(deleteIntentMutation)
  const generateUploadUrl = useMutation(generateUploadUrlMutation)
  const refineRequestMatches = useMutation(
    convexFunctionRefs.refineRequestMatches
  )
  const togglePinnedSupplyMatch = useMutation(
    convexFunctionRefs.togglePinnedSupplyMatch
  )
  const addToCart = useMutation(convexFunctionRefs.addToCart)
  const updateCartLineQuantity = useMutation(
    convexFunctionRefs.updateCartLineQuantity
  )
  const removeFromCart = useMutation(convexFunctionRefs.removeFromCart)
  const clearActiveCart = useMutation(convexFunctionRefs.clearActiveCart)
  const checkoutCart = useMutation(convexFunctionRefs.checkoutCart)
  const beginPaymentAttempt = useMutation(
    convexFunctionRefs.beginPaymentAttempt
  )
  const completePaymentAttempt = useMutation(
    convexFunctionRefs.completePaymentAttempt
  )
  const upsertMyProfile = useMutation(convexFunctionRefs.upsertMyProfile)
  const createSupplyEntry = useMutation(convexFunctionRefs.createSupplyEntry)
  const syncWalletAccount = useMutation(convexFunctionRefs.syncWalletAccount)
  const setDefaultPayoutWalletAccount = useMutation(
    convexFunctionRefs.setDefaultPayoutWalletAccount
  )

  const requestWorkspace = requestDetail?.intent
    ? buildWorkspaceFromRequestDetail(requestDetail)
    : null

  const requestMessages: ChatMessage[] =
    requestDetail?.messages.map((message) => ({
      content: message.body,
      createdAt: message.createdAt,
      id: message._id,
      role:
        message.role === "user" ? ("user" as const) : ("assistant" as const),
    })) ?? []

  const mergedRequestMessages = activeIntentId
    ? [
      ...requestMessages,
      ...messages.slice(
        getMessageSequenceOverlap(
          requestMessages.map((message) => ({
            content: message.content,
            role: message.role,
          })),
          messages.map((message) => ({
            content: message.content,
            role: message.role,
          }))
        )
      ),
    ]
    : messages

  const displayedMessages: ChatMessage[] = activeIntentId
    ? mergedRequestMessages
    : messages

  const activeConversationId =
    conversationId ??
    requestDetail?.conversationId ??
    undefined

  const persistedCurrentSession =
    !activeIntentId && activeConversationId
      ? borealChatSessions.find(
        (session) =>
          session.conversation.conversationId === activeConversationId
      ) ?? null
      : null
  const archivedBorealSessions = useMemo(() => {
    const withoutCurrentLiveSession =
      !activeIntentId && messages.length > 0 && activeConversationId
        ? borealChatSessions.filter(
          (session) =>
            session.conversation.conversationId !== activeConversationId
        )
        : borealChatSessions

    return withoutCurrentLiveSession.slice().reverse()
  }, [activeConversationId, activeIntentId, borealChatSessions, messages.length])
  const liveBorealSession =
    !activeIntentId && messages.length > 0
      ? {
        conversation: {
          _id: activeConversationId ?? "current-session",
          conversationId: activeConversationId ?? "current-session",
          intentCount: persistedCurrentSession?.conversation.intentCount ?? 0,
          lastMessageBody:
            messages[messages.length - 1]?.content ??
            persistedCurrentSession?.conversation.lastMessageBody ??
            null,
          lastMessageRole:
            messages[messages.length - 1]?.role ??
            persistedCurrentSession?.conversation.lastMessageRole ??
            null,
          latestMessageAt:
            messages[messages.length - 1]?.createdAt ??
            persistedCurrentSession?.conversation.latestMessageAt ??
            Date.now(),
          messageCount:
            (persistedCurrentSession?.conversation.messageCount ?? 0) +
            messages.length,
          title: persistedCurrentSession?.conversation.title ?? "Current session",
          updatedAt:
            messages[messages.length - 1]?.createdAt ??
            persistedCurrentSession?.conversation.updatedAt ??
            Date.now(),
        },
        linkedRequests: persistedCurrentSession?.linkedRequests ?? [],
        messages: mergeOptimisticSessionMessages(
          persistedCurrentSession?.messages ?? [],
          messages
        ),
      }
      : null
  const borealTimelineSessions = liveBorealSession
    ? [...archivedBorealSessions, liveBorealSession]
    : archivedBorealSessions
  const hasMoreBorealSessions = borealChatSessions.length >= borealChatSessionLimit

  const effectiveWorkspace =
    activeIntentId && requestWorkspace ? requestWorkspace : workspace
  const effectiveReview =
    requestDetail?.review ??
    (optimisticReviewRating !== null
      ? {
        comment: "",
        rating: optimisticReviewRating,
        reviewedAt: Date.now(),
      }
      : null)
  const shouldPromptReview = Boolean(
    requestDetail?.intent?.reviewPending &&
    !effectiveReview &&
    !isSubmittingReview
  )
  const pendingApprovalIntents = visibleSidebarIntents.filter(
    (intent) => intent.status === "proposed"
  )
  const selectedRequestShareUrl = useMemo(() => {
    if (!activeIntentId || typeof window === "undefined") {
      return null
    }

    const params = new URLSearchParams(searchParams.toString())
    params.set("request", activeIntentId)
    params.set("view", "participants")

    return `${window.location.origin}${pathname}?${params.toString()}`
  }, [activeIntentId, pathname, searchParams])
  const resolvedMatchQueryDraft =
    matchQueryDraft ??
    requestDetail?.intent?.catalogQuery ??
    requestDetail?.intent?.summary ??
    requestDetail?.intent?.title ??
    ""
  const activeProfileBuilderWorkspace =
    effectiveWorkspace.kind === "profile_builder" ? effectiveWorkspace : null
  const activeCenterSheetPaper =
    centerSheetView === "papers" && centerSheetPaperSlug
      ? getPublicPaper(centerSheetPaperSlug)
      : null

  function buildInitialProfileBuilderDraft() {
    const base = myProfileRecord
      ? buildProfileBuilderDraftFromRecord(myProfileRecord)
      : createEmptyProfileBuilderDraft(session?.user?.name ?? "")

    if (!activeProfileBuilderWorkspace) {
      return base
    }

    return mergeProfileBuilderDraft(base, activeProfileBuilderWorkspace.draft)
  }

  function openProfileBuilder() {
    setProfileBuilderDraft(buildInitialProfileBuilderDraft())
    setProfileBuilderMessage(
      activeProfileBuilderWorkspace?.sourceBrief ?? composerText.trim()
    )
    setIsProfileBuilderOpen(true)
  }

  async function handleSetDefaultPayoutWallet(walletAccountId: string) {
    if (!ownerExternalId) {
      setAccountNotice("Sign in with X first so Boreal can save wallet settings.")
      return
    }

    setIsSettingDefaultPayoutWalletId(walletAccountId)
    setAccountNotice(null)

    try {
      const result = await setDefaultPayoutWalletAccount({
        ownerExternalId,
        walletAccountId,
      })

      setAccountNotice(
        result.updated
          ? "Default payout wallet updated."
          : "Boreal could not update the payout wallet right now."
      )
    } catch {
      setAccountNotice("Boreal could not update the payout wallet right now.")
    } finally {
      setIsSettingDefaultPayoutWalletId(null)
    }
  }

  function updateWorkspaceUrl(next: {
    browse?: WorkspaceTab | null
    chat?: string | null
    paper?: string | null
    request?: string | null
    sheet?: CenterSheetView | null
    view?: CenterViewTab | null
  }) {
    const params = new URLSearchParams(searchParams.toString())

    if (next.chat === null) {
      params.delete("chat")
    } else if (next.chat) {
      params.set("chat", next.chat)
    }

    if (next.request === null) {
      params.delete("request")
      params.delete("view")
    } else if (next.request) {
      setIsCenterSheetOpen(false)
      params.delete("sheet")
      params.delete("paper")
      params.set("request", next.request)
    }

    if (next.view === null) {
      params.delete("view")
    } else if (next.view) {
      params.set("view", next.view)
    }

    if (next.browse === null) {
      params.delete("browse")
    } else if (next.browse) {
      params.set("browse", next.browse)
    }

    if (next.sheet === null) {
      params.delete("sheet")
      params.delete("paper")
    } else if (next.sheet) {
      params.set("sheet", next.sheet)

      if (next.sheet !== "papers") {
        params.delete("paper")
      }
    }

    if (next.paper === null) {
      params.delete("paper")
    } else if (next.paper) {
      params.set("sheet", "papers")
      params.set("paper", next.paper)
    }

    const nextQuery = params.toString()
    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, {
      scroll: false,
    })
  }

  useEffect(() => {
    if (!seededPrompt) {
      return
    }

    const params = new URLSearchParams(searchParams.toString())
    params.delete("prompt")
    const nextQuery = params.toString()
    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, {
      scroll: false,
    })
  }, [pathname, router, searchParams, seededPrompt])

  useEffect(() => {
    if (!ownerExternalId || !defaultWallet || !isWalletReady) {
      return
    }

    void syncWalletAccount({
      chainFamily:
        defaultWallet.chainFamily === "evm" ? "evm" : "solana",
      chainId: defaultWallet.chainId ?? undefined,
      networkKey: defaultWallet.networkKey,
      ownerDisplayName: session?.user?.name ?? undefined,
      ownerExternalId,
      roles: ["connected", "buyer", "payout"],
      setAsDefaultBuyer: true,
      setAsDefaultPayout: true,
      walletAddress: defaultWallet.address,
    })
  }, [
    defaultWallet,
    isWalletReady,
    ownerExternalId,
    session?.user?.name,
    syncWalletAccount,
  ])

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 1024px)")

    const handleViewportChange = (
      event: MediaQueryList | MediaQueryListEvent
    ) => {
      if (event.matches) {
        setIsMobileIntentSidebarOpen(false)
        setIsMobileWorkspaceOpen(false)
      }
    }

    handleViewportChange(mediaQuery)
    mediaQuery.addEventListener("change", handleViewportChange)

    return () => {
      mediaQuery.removeEventListener("change", handleViewportChange)
    }
  }, [])

  useEffect(() => {
    if (!isAnyMobileSidebarOpen) {
      return
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [isAnyMobileSidebarOpen])

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      if (requestedCenterSheet) {
        setCenterSheetView(requestedCenterSheet)
        if (requestedCenterSheet === "papers") {
          setCenterSheetPaperSlug(requestedPaperSlug)
        }
        setIsCenterSheetOpen(true)
        return
      }

      setIsCenterSheetOpen(false)
    })

    return () => window.cancelAnimationFrame(frame)
  }, [requestedCenterSheet, requestedPaperSlug])

  useEffect(() => {
    if (isCenterSheetOpen || !centerSheetView) {
      return
    }

    const timeout = window.setTimeout(() => {
      setCenterSheetView(null)
    }, FOCUS_SHEET_EXIT_MS + 40)

    return () => window.clearTimeout(timeout)
  }, [centerSheetView, isCenterSheetOpen])

  useEffect(() => {
    const artifact = requestDetail?.artifact
    const metadata = artifact?.metadata

    if (!artifact || artifact.artifactKind !== "video") {
      return
    }

    const currentStatus =
      typeof metadata?.status === "string" ? metadata.status : artifact.status

    if (currentStatus !== "queued" && currentStatus !== "in_progress") {
      return
    }

    const jobId =
      (typeof metadata?.jobId === "string" ? metadata.jobId : null) ??
      artifact.remoteId

    if (!jobId) {
      return
    }

    const timer = window.setInterval(() => {
      void refreshVideoJob(jobId)
    }, 12000)

    return () => window.clearInterval(timer)
  }, [requestDetail?.artifact])

  async function refreshVideoJob(jobId?: string | null) {
    if (!jobId) {
      return
    }

    setIsRefreshingVideo(true)
    setErrorMessage(null)

    try {
      const response = await fetch(`/api/video-jobs/${jobId}`, {
        method: "GET",
      })

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string }
        throw new Error(payload.error ?? "Failed to refresh video job.")
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to refresh video job."
      )
    } finally {
      setIsRefreshingVideo(false)
    }
  }

  async function handleAddToCart(supplyId: string) {
    if (!ownerExternalId) {
      setErrorMessage("Sign in with X first before adding items to cart.")
      return
    }

    setCartNotice(null)

    try {
      const result = await addToCart({
        ownerDisplayName: session?.user?.name ?? undefined,
        ownerExternalId,
        sourceIntentId: activeIntentId ?? undefined,
        supplyId,
      })

      if (!result.added) {
        throw new Error("Could not add this listing to cart.")
      }

      setIsCartOpen(true)
      setCartNotice("Added to cart.")
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Could not add to cart."
      )
    }
  }

  async function handleUpdateCartQuantity(
    cartLineItemId: string,
    quantity: number
  ) {
    if (!ownerExternalId) {
      return
    }

    setCartNotice(null)

    try {
      await updateCartLineQuantity({
        cartLineItemId,
        ownerExternalId,
        quantity,
      })
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Could not update cart."
      )
    }
  }

  async function handleRemoveFromCart(cartLineItemId: string) {
    if (!ownerExternalId) {
      return
    }

    setCartNotice(null)

    try {
      await removeFromCart({
        cartLineItemId,
        ownerExternalId,
      })
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Could not remove cart item."
      )
    }
  }

  async function handleClearCart() {
    if (!ownerExternalId) {
      return
    }

    setCartNotice(null)

    try {
      await clearActiveCart({ ownerExternalId })
      setCartNotice("Cart cleared.")
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Could not clear cart."
      )
    }
  }

  async function handleCheckoutCart() {
    if (!ownerExternalId || isCheckingOutCart) {
      return
    }

    setIsCheckingOutCart(true)
    setCartNotice(null)

    try {
      const result = await checkoutCart({
        ownerDisplayName: session?.user?.name ?? undefined,
        ownerExternalId,
        sourceIntentId:
          activeIntentId ?? activeCart?.sourceIntentId ?? undefined,
      })

      if (!result.placed) {
        throw new Error(
          result.reason === "missing_buyer_wallet"
            ? "Connect a buyer wallet before placing paid checkout items."
            : result.reason === "wallet_network_mismatch"
              ? "Your connected wallet network does not match the selected listing's settlement network."
            : "Could not place checkout."
        )
      }

      setCartNotice(
        "Checkout placed. Payable provider items now show wallet actions below."
      )
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Could not place checkout."
      )
    } finally {
      setIsCheckingOutCart(false)
    }
  }

  async function handleExecuteCheckoutItemPayment(
    checkout: CheckoutRecord,
    item: CheckoutRecord["items"][number]
  ) {
    if (!ownerExternalId) {
      setErrorMessage(
        "Sign in with X first before paying for provider-backed items."
      )
      return
    }

    if (!privyAuthenticated) {
      login()
      return
    }

    if (!isWalletReady || !defaultWalletAddress) {
      setErrorMessage(
        "Connect a Privy wallet with a funded address before paying."
      )
      return
    }

    const endpointUrl =
      item.serviceInvocation?.endpointUrl ??
      item.sourceListingUrl ??
      item.accessUrl

    if (!endpointUrl || !item.payment) {
      setErrorMessage(
        "This checkout item does not have a payable invocation attached."
      )
      return
    }

    setActivePaymentItemId(item._id)
    setCartNotice(null)
    setErrorMessage(null)

    try {
      await beginPaymentAttempt({
        checkoutItemId: item._id,
        ownerExternalId,
        walletAddress: defaultWalletAddress,
      })

      const response = await payWithX402({
        init: {
          method: item.serviceInvocation?.endpointMethod ?? "GET",
        },
        maxAmountUsd: item.payment.amount,
        url: endpointUrl,
        walletAddress: defaultWalletAddress,
      })
      const paymentReceipt = parsePaymentResponseHeader(
        response.headers.get("PAYMENT-RESPONSE")
      )
      const contentType = response.headers.get("content-type") ?? ""
      const responsePayload = contentType.includes("application/json")
        ? ((await response.json()) as unknown)
        : { rawText: await response.text() }

      if (!response.ok) {
        await completePaymentAttempt({
          checkoutItemId: item._id,
          errorMessage:
            responsePayload &&
              typeof responsePayload === "object" &&
              "rawText" in responsePayload
              ? String(responsePayload.rawText)
              : `Invocation failed with ${response.status}.`,
          ownerExternalId,
          paymentReceiptJson: paymentReceipt
            ? JSON.stringify(paymentReceipt)
            : undefined,
          responseJson: JSON.stringify(responsePayload),
          status: "failed",
          txHash: pickTxHash(paymentReceipt),
        })
        throw new Error(`Provider invocation failed with ${response.status}.`)
      }

      const invocationAccess = inferInvocationAccess(responsePayload)
      await completePaymentAttempt({
        accessLabel: invocationAccess.accessLabel,
        accessUrl: invocationAccess.accessUrl,
        checkoutItemId: item._id,
        ownerExternalId,
        paymentReceiptJson: paymentReceipt
          ? JSON.stringify(paymentReceipt)
          : undefined,
        responseJson: JSON.stringify(responsePayload),
        status: invocationAccess.accessUrl ? "completed" : "submitted",
        txHash: pickTxHash(paymentReceipt),
      })

      setCartNotice(
        invocationAccess.accessUrl
          ? `Payment settled. ${item.title} is now available.`
          : `Payment settled. ${item.title} has been invoked and is now tracked in checkout history.`
      )
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Could not complete this provider payment."
      )
    } finally {
      setActivePaymentItemId(null)
    }
  }

  async function submitMessage(message: string) {
    const trimmed = message.trim()

    if (!trimmed || isSubmitting) {
      return
    }

    if (!isXAuthenticated) {
      setErrorMessage("Sign in with X to chat with Boreal Agent.")
      return
    }

    setErrorMessage(null)
    setIsSubmitting(true)
    setPendingApprovalIntentId(null)
    const now = Date.now()

    if (activeIntentId) {
      try {
        const threadResponse = await fetch(
          `/api/requests/${activeIntentId}/messages`,
          {
            body: JSON.stringify({ body: trimmed }),
            headers: {
              "Content-Type": "application/json",
            },
            method: "POST",
          }
        )
        const threadPayload = (await threadResponse.json()) as {
          error?: string
          sent?: boolean
        }

        if (!threadResponse.ok || !threadPayload.sent) {
          throw new Error(
            threadPayload.error ?? "Failed to send request message."
          )
        }

        setComposerText("")

        if (!effectiveBorealEnabled) {
          setIsSubmitting(false)
          return
        }
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Failed to send request message."
        )
        setIsSubmitting(false)
        return
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
        })
        const payload = (await response.json()) as {
          conversationId?: string
          error?: string
          posted?: boolean
        }

        if (!response.ok || !payload.posted || !payload.conversationId) {
          throw new Error(
            payload.error ?? "Failed to save conversation message."
          )
        }

        setConversationId(payload.conversationId)
        setMessages((current) => [
          ...current,
          {
            content: trimmed,
            createdAt: now,
            id: crypto.randomUUID(),
            role: "user",
          },
        ])
        setComposerText("")
        return
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Failed to save conversation message."
        )
        return
      } finally {
        setIsSubmitting(false)
      }
    }

    const assistantMessageId = crypto.randomUUID()
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
    ])

    try {
      const response = await fetch("/api/chat", {
        body: JSON.stringify({
          conversationId: activeConversationId,
          context: buildChatUiContext({
            activeIntentId,
            requestDetail,
            selectedCenterTab: activeCenterTab,
            workspaceTab,
          }),
          message: trimmed,
          provider: "boreal-agent",
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      })

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string }
        throw new Error(payload.error ?? "Chat request failed.")
      }

      if (!response.body) {
        throw new Error("Chat stream was unavailable.")
      }

      const finalPayload = await consumeChatStream({
        assistantMessageId,
        response,
        setMessages,
      })

      setConversationId(finalPayload.conversationId)
      setWorkspace(finalPayload.workspace)
      setComposerText("")
      updateWorkspaceUrl({
        browse:
          finalPayload.workspace.kind === "empty" ? null : "workers",
      })
      setShowWorkspace(finalPayload.workspace.kind !== "empty")

      if (finalPayload.requiresApproval && finalPayload.intentId) {
        setOptimisticReviewRating(null)
        setPendingApprovalIntentId(finalPayload.intentId)
        return
      }

      setPendingApprovalIntentId(null)
    } catch (error) {
      setMessages((current) =>
        current.filter(
          (currentMessage) => currentMessage.id !== assistantMessageId
        )
      )
      setErrorMessage(
        error instanceof Error ? error.message : "Chat request failed."
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleApproveRequest(intentId = activeIntentId) {
    if (!intentId || isApprovingRequest) {
      return
    }

    setErrorMessage(null)
    setIsApprovingRequest(true)

    try {
      const response = await fetch(`/api/requests/${intentId}/approve`, {
        method: "POST",
      })
      const payload = (await response.json()) as
        | {
          assistantMessage: string
          relatedCatalogItems: CatalogItem[]
          workspace: WorkspaceState
        }
        | { error?: string }

      if (!response.ok || !("workspace" in payload)) {
        throw new Error(
          "error" in payload && payload.error
            ? payload.error
            : "Failed to approve request."
        )
      }

      updateWorkspaceUrl({
        browse: "workers",
        chat: null,
        request: intentId,
        view: "chat",
      })
      if (intentId) {
        setPendingApprovalIntentId((current) =>
          current === intentId ? null : current
        )
      }
      setConversationId(undefined)
      setMessages([])
      setWorkspace(payload.workspace)
      setShowWorkspace(true)
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to approve request."
      )
    } finally {
      setIsApprovingRequest(false)
    }
  }

  async function handleCancelRequest(intentId = activeIntentId) {
    if (!intentId || isCancellingRequest) {
      return
    }

    setErrorMessage(null)
    setIsCancellingRequest(true)

    try {
      const response = await fetch(`/api/requests/${intentId}/cancel`, {
        method: "POST",
      })
      const payload = (await response.json()) as {
        cancelled?: boolean
        error?: string
      }

      if (!response.ok || !payload.cancelled) {
        throw new Error(payload.error ?? "Failed to cancel request.")
      }

      if (activeIntentId === intentId) {
        handleClearSelection()
      }

      setPendingApprovalIntentId((current) =>
        current === intentId ? null : current
      )
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to cancel request."
      )
    } finally {
      setIsCancellingRequest(false)
    }
  }

  async function handleSubmitReview(rating: number) {
    if (!activeIntentId || isSubmittingReview || effectiveReview) {
      return
    }

    setErrorMessage(null)
    setIsSubmittingReview(true)
    setOptimisticReviewRating(rating)

    try {
      const response = await fetch(`/api/requests/${activeIntentId}/review`, {
        body: JSON.stringify({ rating }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      })
      const payload = (await response.json()) as { error?: string }

      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to submit review.")
      }
    } catch (error) {
      setOptimisticReviewRating(null)
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to submit review."
      )
    } finally {
      setIsSubmittingReview(false)
    }
  }

  async function handleDeleteIntent(intentId: string) {
    setErrorMessage(null)

    try {
      await deleteIntent({ intentId, ownerExternalId })

      if (activeIntentId === intentId) {
        handleClearSelection()
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to delete request."
      )
    }
  }

  async function handleRefineMatches() {
    if (
      !activeIntentId ||
      !resolvedMatchQueryDraft.trim() ||
      isRefiningMatches
    ) {
      return
    }

    setErrorMessage(null)
    setIsRefiningMatches(true)

    try {
      const result = await refineRequestMatches({
        intentId: activeIntentId,
        ownerExternalId,
        query: resolvedMatchQueryDraft.trim(),
      })

      if (!result.refined) {
        throw new Error("Could not refresh request matches.")
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Could not refresh request matches."
      )
    } finally {
      setIsRefiningMatches(false)
    }
  }

  async function handleTogglePinnedMatch(supplyId: string) {
    if (!activeIntentId || pinningSupplyId) {
      return
    }

    setErrorMessage(null)
    setPinningSupplyId(supplyId)

    try {
      const result = await togglePinnedSupplyMatch({
        intentId: activeIntentId,
        ownerExternalId,
        supplyId,
      })

      if (!result.updated) {
        throw new Error("Could not update pinned match.")
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Could not update pinned match."
      )
    } finally {
      setPinningSupplyId(null)
    }
  }

  async function handleRetryRequest() {
    if (!activeIntentId || isRetryingRequest) {
      return
    }

    setErrorMessage(null)
    setIsRetryingRequest(true)

    try {
      const response = await fetch(`/api/requests/${activeIntentId}/retry`, {
        method: "POST",
      })
      const payload = (await response.json()) as
        | {
          assistantMessage: string
          relatedCatalogItems: CatalogItem[]
          workspace: WorkspaceState
        }
        | { error?: string }

      if (!response.ok || !("workspace" in payload)) {
        throw new Error(
          "error" in payload && payload.error
            ? payload.error
            : "Failed to retry request."
        )
      }

      setMessages([])
      setWorkspace(payload.workspace)
      updateWorkspaceUrl({ browse: "workers" })
      setShowWorkspace(true)
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to retry request."
      )
    } finally {
      setIsRetryingRequest(false)
    }
  }

  async function handleOpenRequestForWorkers() {
    if (!activeIntentId || isApprovingRequest) {
      return
    }

    setErrorMessage(null)
    setIsApprovingRequest(true)

    try {
      const response = await fetch(`/api/requests/${activeIntentId}/open`, {
        method: "POST",
      })
      const payload = (await response.json()) as
        | {
          assistantMessage: string
          relatedCatalogItems: CatalogItem[]
          workspace: WorkspaceState
        }
        | { error?: string }

      if (!response.ok || !("workspace" in payload)) {
        throw new Error(
          "error" in payload && payload.error
            ? payload.error
            : "Failed to open request for workers."
        )
      }

      setMessages([])
      setWorkspace(payload.workspace)
      updateWorkspaceUrl({ browse: "workers" })
      setShowWorkspace(true)
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Failed to open request for workers."
      )
    } finally {
      setIsApprovingRequest(false)
    }
  }

  async function handleRefreshRequest() {
    if (isRefreshingRequest) {
      return
    }

    setErrorMessage(null)
    setIsRefreshingRequest(true)

    try {
      const artifact = requestDetail?.artifact
      const metadata = artifact?.metadata
      const jobId =
        artifact?.artifactKind === "video"
          ? ((typeof metadata?.jobId === "string" ? metadata.jobId : null) ??
            artifact.remoteId)
          : null

      if (jobId) {
        await refreshVideoJob(jobId)
      }

      router.refresh()
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to refresh request."
      )
    } finally {
      setIsRefreshingRequest(false)
    }
  }

  async function handleMarkRequestFulfilled() {
    if (!activeIntentId || isMarkingRequestFulfilled) {
      return
    }

    setErrorMessage(null)
    setIsMarkingRequestFulfilled(true)

    try {
      const response = await fetch(`/api/requests/${activeIntentId}/fulfill`, {
        method: "POST",
      })
      const payload = (await response.json()) as {
        error?: string
        fulfilled?: boolean
      }

      if (!response.ok || !payload.fulfilled) {
        throw new Error(payload.error ?? "Failed to mark request as fulfilled.")
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Failed to mark request as fulfilled."
      )
    } finally {
      setIsMarkingRequestFulfilled(false)
    }
  }

  async function handleArchiveRequest() {
    if (!activeIntentId || isArchivingRequest) {
      return
    }

    setErrorMessage(null)
    setIsArchivingRequest(true)

    try {
      const response = await fetch(`/api/requests/${activeIntentId}/archive`, {
        method: "POST",
      })
      const payload = (await response.json()) as {
        archived?: boolean
        error?: string
      }

      if (!response.ok || !payload.archived) {
        throw new Error(payload.error ?? "Failed to archive request.")
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to archive request."
      )
    } finally {
      setIsArchivingRequest(false)
    }
  }

  async function handleDraftProposal() {
    if (!activeIntentId || !proposalMessage.trim() || isDraftingProposal) {
      return
    }

    setErrorMessage(null)
    setIsDraftingProposal(true)

    try {
      const response = await fetch(
        `/api/requests/${activeIntentId}/proposals`,
        {
          body: JSON.stringify({
            action: "draft",
            message: proposalMessage,
          }),
          headers: {
            "Content-Type": "application/json",
          },
          method: "POST",
        }
      )
      const payload = (await response.json()) as {
        draft?: Record<string, unknown>
        error?: string
      }

      if (!response.ok || !payload.draft) {
        throw new Error(payload.error ?? "Failed to draft proposal.")
      }

      setProposalDraft(normalizeProposalDraft(payload.draft, proposalMessage))
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to draft proposal."
      )
    } finally {
      setIsDraftingProposal(false)
    }
  }

  async function handleSubmitProposal() {
    if (!activeIntentId || isSubmittingProposal) {
      return
    }

    setErrorMessage(null)
    setIsSubmittingProposal(true)

    try {
      const draft = normalizeProposalDraft(proposalDraft, proposalMessage)
      const response = await fetch(
        `/api/requests/${activeIntentId}/proposals`,
        {
          body: JSON.stringify({
            action: "submit",
            draft,
            message: proposalMessage,
          }),
          headers: {
            "Content-Type": "application/json",
          },
          method: "POST",
        }
      )
      const payload = (await response.json()) as {
        error?: string
        submitted?: boolean
      }

      if (!response.ok || !payload.submitted) {
        throw new Error(payload.error ?? "Failed to submit proposal.")
      }

      setProposalDraft(emptyProposalDraft())
      setProposalMessage("")
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to submit proposal."
      )
    } finally {
      setIsSubmittingProposal(false)
    }
  }

  async function handleApproveProposal(proposalId: string) {
    if (!activeIntentId || approvingProposalId) {
      return
    }

    setErrorMessage(null)
    setApprovingProposalId(proposalId)

    try {
      const response = await fetch(
        `/api/requests/${activeIntentId}/proposals/${proposalId}/approve`,
        { method: "POST" }
      )
      const payload = (await response.json()) as {
        approved?: boolean
        error?: string
      }

      if (!response.ok || !payload.approved) {
        throw new Error(payload.error ?? "Failed to approve proposal.")
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to approve proposal."
      )
    } finally {
      setApprovingProposalId(null)
    }
  }

  async function handleDeliveryFilesSelected(files: File[]) {
    if (files.length === 0) {
      return
    }

    const drafts = files.map((file) => ({
      fileName: file.name,
      fileSize: file.size,
      id: crypto.randomUUID(),
      mediaType: file.type || "application/octet-stream",
      progress: 0,
      status: "uploading" as const,
      storageId: null,
    }))

    setDeliveryDraft((current) => ({
      ...current,
      attachments: [...current.attachments, ...drafts],
    }))

    await Promise.all(
      files.map(async (file, index) => {
        const draft = drafts[index]

        try {
          const uploadUrl = await generateUploadUrl({})
          const storageId = await uploadFileToConvex(
            uploadUrl,
            file,
            (progress) => {
              setDeliveryDraft((current) => ({
                ...current,
                attachments: current.attachments.map((attachment) =>
                  attachment.id === draft.id
                    ? { ...attachment, progress }
                    : attachment
                ),
              }))
            }
          )

          setDeliveryDraft((current) => ({
            ...current,
            attachments: current.attachments.map((attachment) =>
              attachment.id === draft.id
                ? {
                  ...attachment,
                  progress: 100,
                  status: "uploaded",
                  storageId,
                }
                : attachment
            ),
          }))
        } catch {
          setDeliveryDraft((current) => ({
            ...current,
            attachments: current.attachments.map((attachment) =>
              attachment.id === draft.id
                ? {
                  ...attachment,
                  progress: 0,
                  status: "error",
                  storageId: null,
                }
                : attachment
            ),
          }))
        }
      })
    )
  }

  function handleRemoveDeliveryAttachment(attachmentId: string) {
    setDeliveryDraft((current) => ({
      ...current,
      attachments: current.attachments.filter(
        (attachment) => attachment.id !== attachmentId
      ),
    }))
  }

  async function handleSubmitDelivery() {
    if (
      !activeIntentId ||
      !deliveryDraft.deliverablesBody.trim() ||
      isSubmittingDelivery ||
      deliveryDraft.attachments.some(
        (attachment) => attachment.status !== "uploaded"
      )
    ) {
      return
    }

    setErrorMessage(null)
    setIsSubmittingDelivery(true)

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
      })
      const payload = (await response.json()) as {
        error?: string
        submitted?: boolean
      }

      if (!response.ok || !payload.submitted) {
        throw new Error(payload.error ?? "Failed to submit work.")
      }

      setDeliveryDraft(emptyDeliveryDraft())
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to submit work."
      )
    } finally {
      setIsSubmittingDelivery(false)
    }
  }

  async function handleDraftProfileBuilder() {
    if (!profileBuilderMessage.trim() || isDraftingProfileBuilder) {
      return
    }

    setErrorMessage(null)
    setIsDraftingProfileBuilder(true)

    try {
      const response = await fetch("/api/profile-builder/draft", {
        body: JSON.stringify({
          message: profileBuilderMessage,
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      })
      const payload = (await response.json()) as {
        draft?: ProfileBuilderDraft
        error?: string
      }

      const draftedProfile = payload.draft

      if (!response.ok || !draftedProfile) {
        throw new Error(payload.error ?? "Could not draft the profile builder.")
      }

      setProfileBuilderDraft((current) =>
        mergeProfileBuilderDraft(current, draftedProfile)
      )
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Could not draft the profile builder."
      )
    } finally {
      setIsDraftingProfileBuilder(false)
    }
  }

  async function saveProfileBuilder(includeListing: boolean) {
    if (!ownerExternalId || isSavingProfileBuilder) {
      if (!ownerExternalId) {
        setErrorMessage("Sign in with X first before saving your profile.")
      }
      return
    }

    if (!hasSavableProfileBuilderDraft(profileBuilderDraft)) {
      setErrorMessage(
        "Add at least a headline or bio before saving the profile."
      )
      return
    }

    if (includeListing && !hasPublishableSupplyListing(profileBuilderDraft)) {
      setErrorMessage(
        "Complete the offer title, category, and description before publishing."
      )
      return
    }

    setErrorMessage(null)
    setIsSavingProfileBuilder(true)

    try {
      const profileResult = await upsertMyProfile(
        profileBuilderToProfileMutationInput(profileBuilderDraft, {
          displayName:
            (profileBuilderDraft.profile.displayName || session?.user?.name) ??
            undefined,
          externalId: ownerExternalId,
          handle: undefined,
        })
      )

      if (!profileResult.saved) {
        throw new Error("Could not save the profile.")
      }

      if (includeListing) {
        const supplyInput = profileBuilderToSupplyMutationInput(
          profileBuilderDraft,
          {
            displayName:
              (profileBuilderDraft.profile.displayName ||
                session?.user?.name) ??
              undefined,
            externalId: ownerExternalId,
            handle: undefined,
          }
        )

        if (!supplyInput) {
          throw new Error("Could not publish the offer.")
        }

        const supplyResult = await createSupplyEntry(supplyInput)

        if (!supplyResult.created) {
          throw new Error(
            supplyResult.reason === "missing_payout_wallet"
              ? "Connect a wallet first before publishing a paid offer so Boreal knows where payouts should go."
              : "Could not publish the offer."
          )
        }
      }

      if (
        activeIntentId &&
        requestDetail?.intent?.routeTarget === "profile_update"
      ) {
        const response = await fetch(
          `/api/requests/${activeIntentId}/fulfill`,
          {
            method: "POST",
          }
        )
        const payload = (await response.json()) as {
          error?: string
          fulfilled?: boolean
        }

        if (!response.ok || !payload.fulfilled) {
          throw new Error(
            payload.error ??
            "Profile was saved, but the request could not be marked fulfilled."
          )
        }
      } else {
        setWorkspace({
          draft: cloneProfileBuilderDraft(profileBuilderDraft),
          kind: "profile_builder",
          sourceBrief: profileBuilderMessage,
          subtitle: includeListing
            ? "Your public profile was saved and the first offer is now published."
            : "Your public profile was saved. Publish an offer whenever you are ready.",
          title: "Profile and offer setup",
        })
      }

      setIsProfileBuilderOpen(false)
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Could not save the profile builder."
      )
    } finally {
      setIsSavingProfileBuilder(false)
    }
  }

  function handleSidebarSelect(
    intent: SidebarIntentPreview,
    view?: RequestNavigationView
  ) {
    setErrorMessage(null)
    updateWorkspaceUrl({
      browse: "workers",
      request: intent._id,
      view:
        view ??
        normalizeCenterViewTab(
          getDefaultRequestNavigationView(
            getPreviewRequestNotificationCounts(intent)
          )
        ),
    })
    setMatchQueryDraft(null)
    setProposalDraft(emptyProposalDraft())
    setProposalMessage("")
    setDeliveryDraft(emptyDeliveryDraft())
    setOptimisticReviewRating(null)
    setIsMobileIntentSidebarOpen(false)
    setIsMobileWorkspaceOpen(false)
    setShowWorkspace(true)
    setMessages([])
  }

  function openConversationRequestById(requestId: string) {
    setErrorMessage(null)
    updateWorkspaceUrl({
      browse: "workers",
      chat: null,
      request: requestId,
      view: "chat",
    })
    setMatchQueryDraft(null)
    setProposalDraft(emptyProposalDraft())
    setProposalMessage("")
    setDeliveryDraft(emptyDeliveryDraft())
    setOptimisticReviewRating(null)
    setIsMobileIntentSidebarOpen(false)
    setIsMobileWorkspaceOpen(false)
    setShowWorkspace(true)
    setMessages([])
  }

  function handleMarketplaceSelect(
    intent: SidebarIntentPreview,
    view?: RequestNavigationView
  ) {
    setErrorMessage(null)
    updateWorkspaceUrl({
      browse: "requests",
      request: intent._id,
      view:
        view ??
        normalizeCenterViewTab(
          getDefaultRequestNavigationView(
            getPreviewRequestNotificationCounts(intent)
          )
        ),
    })
    setMatchQueryDraft(null)
    setProposalDraft(emptyProposalDraft())
    setProposalMessage("")
    setDeliveryDraft(emptyDeliveryDraft())
    setOptimisticReviewRating(null)
    setIsMobileIntentSidebarOpen(false)
    setIsMobileWorkspaceOpen(false)
    setShowWorkspace(true)
    setMessages([])
  }

  function handleClearSelection() {
    setErrorMessage(null)
    updateWorkspaceUrl({
      chat: null,
      paper: null,
      request: null,
      sheet: null,
      view: null,
    })
    setMatchQueryDraft(null)
    setProposalDraft(emptyProposalDraft())
    setProposalMessage("")
    setDeliveryDraft(emptyDeliveryDraft())
    setOptimisticReviewRating(null)
    setMessages([])
    setConversationId(undefined)
    setPendingApprovalIntentId(null)
    setIsMobileIntentSidebarOpen(false)
    setIsMobileWorkspaceOpen(false)
    setWorkspace(emptyWorkspace)
  }

  function handleReturnHome() {
    setErrorMessage(null)
    updateWorkspaceUrl({
      chat: null,
      paper: null,
      request: null,
      sheet: null,
      view: null,
    })
    setMatchQueryDraft(null)
    setProposalDraft(emptyProposalDraft())
    setProposalMessage("")
    setDeliveryDraft(emptyDeliveryDraft())
    setOptimisticReviewRating(null)
    setMessages([])
    setConversationId(undefined)
    setIsMobileIntentSidebarOpen(false)
    setIsMobileWorkspaceOpen(false)
    setWorkspace(emptyWorkspace)
  }

  function handleDownloadVideo(videoId: string) {
    window.open(
      `/api/video-jobs/${videoId}/content?download=1`,
      "_blank",
      "noopener,noreferrer"
    )
  }

  function openMobileIntentSidebar() {
    if (!isXAuthenticated) {
      return
    }

    if (window.matchMedia("(min-width: 1024px)").matches) {
      return
    }

    setIsMobileWorkspaceOpen(false)
    setIsMobileIntentSidebarOpen(true)
  }

  function openMobileDiscovery() {
    if (window.matchMedia("(min-width: 1024px)").matches) {
      return
    }

    setIsMobileIntentSidebarOpen(false)
    setIsMobileWorkspaceOpen(true)
  }

  function openCenterSheet(view: CenterSheetView) {
    updateWorkspaceUrl({
      paper: null,
      sheet: view,
    })
  }

  function closeCenterSheet() {
    updateWorkspaceUrl({
      paper: null,
      sheet: null,
    })
  }

  function handleInlineNavSelect(href: string) {
    const nextView = centerSheetViewByHref[href as keyof typeof centerSheetViewByHref]
    if (!nextView) {
      return
    }

    if (requestedCenterSheet === nextView && isCenterSheetOpen) {
      closeCenterSheet()
      return
    }

    openCenterSheet(nextView)
  }

  function openPapersOverview() {
    updateWorkspaceUrl({
      paper: null,
      sheet: "papers",
    })
  }

  function openEmbeddedPaper(slug: string) {
    updateWorkspaceUrl({
      paper: slug,
      sheet: "papers",
    })
  }

  function openXSignIn() {
    void signIn("twitter", {
      callbackUrl: pathname || "/",
    })
  }

  function openMarketplaceTab(tab: WorkspaceTab) {
    updateWorkspaceUrl({ browse: tab })

    if (isPublicDiscoveryOnly) {
      setIsPublicMarketDismissed(false)
    } else {
      setShowWorkspace(true)
    }

    if (window.matchMedia("(max-width: 1023px)").matches) {
      setIsMobileIntentSidebarOpen(false)
      setIsMobileWorkspaceOpen(true)
    }
  }

  function handleToggleWorkspace() {
    if (isPublicDiscoveryOnly) {
      setIsPublicMarketDismissed((current) => !current)
      return
    }

    setShowWorkspace((current) => !current)
  }

  useEffect(() => {
    if (!errorMessage) {
      return
    }

    const timeout = window.setTimeout(() => {
      setErrorMessage((current) =>
        current === errorMessage ? null : current
      )
    }, 4200)

    return () => window.clearTimeout(timeout)
  }, [errorMessage])

  const isHomeView =
    !activeIntentId &&
    displayedMessages.length === 0 &&
    borealTimelineSessions.length === 0
  const shouldShowFooterComposer =
    isXAuthenticated && shouldShowChatComposer && !isHomeView

  return (
      <>
      <div className="flex h-svh w-full max-w-none flex-col overflow-hidden">
        <div className="flex min-h-0 flex-1 flex-col gap-0 lg:flex-row">
          <DesktopIntentRail
            collapsedContent={
              <CollapsedRequestsRail
                accountImageUrl={session?.user?.image ?? null}
                accountName={session?.user?.name ?? null}
                borealChatActive={!activeIntentId}
                borealChatSessionCount={borealChatSessions.length}
                onOpenBorealChat={handleClearSelection}
                onOpenAccount={() => {
                  if (!isXAuthenticated) {
                    openXSignIn()
                    return
                  }

                  setIsAccountDialogOpen(true)
                }}
                onExpand={() => setShowIntentSidebar(true)}
                requestCount={visibleSidebarIntents.length}
              />
            }
            collapsedWidth={COLLAPSED_SIDEBAR_WIDTH}
            containerStyle={desktopIntentSidebarStyle}
            expandedContent={
              <IntentSidebar
                borealChatSessionCount={borealChatSessions.length}
                isBorealChatActive={!activeIntentId}
                intents={visibleSidebarIntents}
                onOpenAccount={() => setIsAccountDialogOpen(true)}
                onOpenBorealChat={handleClearSelection}
                onCollapse={() => setShowIntentSidebar(false)}
                onOpenPendingApprovals={() => {
                  const nextIntent = pendingApprovalIntents[0]
                  if (nextIntent) {
                    handleSidebarSelect(nextIntent, "workspace")
                  }
                }}
                onSelect={handleSidebarSelect}
                pendingApprovalCount={pendingApprovalIntents.length}
                selectedIntentId={activeIntentId}
              />
            }
            expandedWidth={REQUEST_SIDEBAR_WIDTH}
            showExpanded={showIntentSidebar}
          />

          <div className="relative flex min-h-0 min-w-0 flex-1">
            <section
              className={cn(
                "relative z-10 flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-background",
                isXAuthenticated
                  ? isDiscoveryRailOpen
                    ? "border-l border-border"
                    : "border-x border-border"
                  : "border-x border-border"
              )}
            >
              <ChatShellHeader
                activeNavHref={
                  requestedCenterSheet
                    ? centerSheetHrefByView[requestedCenterSheet]
                    : null
                }
                hideIntentMenu={false}
                hideWorkspaceToggle={false}
                inlineNavHrefs={centerSheetNavHrefs}
                isRequestSelected={isXAuthenticated && Boolean(activeIntentId)}
                isSubmitting={isSubmitting}
                onOpenMobileDiscovery={openMobileDiscovery}
                onOpenMobileIntentSidebar={openMobileIntentSidebar}
                onSelectInlineNav={handleInlineNavSelect}
                onReturnHome={handleReturnHome}
                onToggleWorkspace={handleToggleWorkspace}
                requestTitle={
                  requestDetail?.intent?.title ?? selectedIntent?.title ?? "Request"
                }
                showWorkspace={isDiscoveryRailOpen}
              />

              {centerSheetView ? (
                <FocusSheet
                  onClose={closeCenterSheet}
                  open={isCenterSheetOpen}
                  title={
                    centerSheetView === "papers" && activeCenterSheetPaper
                      ? activeCenterSheetPaper.title
                      : centerSheetTitleByView[centerSheetView]
                  }
                >
                  {centerSheetView === "about" ? (
                    <AboutPage embedded />
                  ) : centerSheetView === "developers" ? (
                    <AgentDeveloperSurface embedded />
                  ) : centerSheetView === "papers" ? (
                    <PapersFocusBrowser
                      activePaperSlug={centerSheetPaperSlug}
                      onOpenOverview={openPapersOverview}
                      onSelectPaper={openEmbeddedPaper}
                      papers={publicPapers}
                    />
                  ) : centerSheetView === "roadmap" ? (
                    <RoadmapBoard embedded />
                  ) : null}
                </FocusSheet>
              ) : null}

              {isPublicDiscoveryOnly ? (
                <div className="min-h-0 flex-1 overflow-hidden">
                  <div className={HOME_PANEL_CLASS}>
                    <HomeChatSurface
                      composer={
                        <PromptInput className="w-full" onSubmit={async () => {}}>
                          <PromptInputBody>
                              <PromptInputTextarea
                                className="min-h-[140px] text-base"
                                disabled
                                placeholder="Sign in with X to submit a request, publish an offer, or tell Boreal what should happen."
                                value=""
                              />
                          </PromptInputBody>
                          <PromptInputFooter className="justify-end">
                            <PromptInputSubmit disabled />
                          </PromptInputFooter>
                        </PromptInput>
                      }
                      quickActions={
                        <>
                          <Button onClick={openXSignIn} size="sm" type="button">
                            Sign in with X
                          </Button>
                          <Button
                            onClick={() => openMarketplaceTab("workers")}
                            size="sm"
                            type="button"
                            variant="outline"
                          >
                            Browse offers
                          </Button>
                          <Button
                            onClick={() => openMarketplaceTab("requests")}
                            size="sm"
                            type="button"
                            variant="outline"
                          >
                            Browse requests
                          </Button>
                          <Button
                            onClick={openPapersOverview}
                            size="sm"
                            type="button"
                            variant="outline"
                          >
                            Read papers
                          </Button>
                        </>
                      }
                      starterPrompts={[]}
                    />
                  </div>
                </div>
              ) : activeIntentId ? (
                <Tabs
                  className="min-h-0 flex-1 gap-0"
                  onValueChange={(value) =>
                    updateWorkspaceUrl({
                      view: normalizeCenterViewTab(value),
                    })
                  }
                  value={activeCenterTab}
                >
                  <div className="flex flex-col gap-0">
                    <div className="border-b border-border px-3 py-2">
                      <div className="flex flex-wrap items-start justify-between gap-3 md:flex-nowrap md:items-center">
                        <div className="min-w-0 flex-1 basis-full md:basis-auto">
                          <TabsList
                            className="h-auto w-max max-w-full justify-start overflow-x-auto"
                            variant="button"
                          >
                            <RequestViewTabTrigger label="Chat" value="chat" />
                            <RequestViewTabTrigger
                              count={requestNotificationCounts.activity}
                              label="Activity"
                              value="activity"
                            />
                            <RequestViewTabTrigger
                              count={requestNotificationCounts.participants}
                              label="Team"
                              value="participants"
                            />
                            <RequestViewTabTrigger
                              count={requestNotificationCounts.workspace}
                              label="Workboard"
                              value="workspace"
                            />
                          </TabsList>
                        </div>

                        {requestDetail?.intent ? (
                          <div className="w-full md:w-auto md:shrink-0">
                            <RequestHeaderMeta
                              status={requestDetail.intent.status}
                            />
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  <div className="min-h-0 flex-1 overflow-hidden">
                    {isRequestLoading ? (
                      <div className="flex h-full items-center justify-center">
                        <div
                          className={cn(
                            CONTENT_RAIL_CLASS,
                            "items-center justify-center"
                          )}
                        >
                          <LoadingRequestPanel />
                        </div>
                      </div>
                    ) : !requestDetail ? (
                      <div
                        className={cn(
                          CONTENT_RAIL_CLASS,
                          "h-full items-center py-8"
                        )}
                      >
                          <div className="w-full rounded-xl border border-border p-6">
                            <p className="text-sm font-medium">
                              Request workboard unavailable
                            </p>
                            <p className="mt-2 text-xs text-muted-foreground">
                              This request is not available in the current session
                              yet. Use a valid shared request link or browse
                              from your request list.
                            </p>
                          </div>
                      </div>
                    ) : (
                      <>
                        <TabsContent
                          className="mt-0 h-full min-h-0 overflow-hidden"
                          value="activity"
                        >
                          <ScrollArea className="h-full">
                            <div className={CONTENT_RAIL_CLASS}>
                              <ActivityThreadPanel
                                requestDetail={requestDetail}
                                selectedIntent={selectedIntent}
                              />
                            </div>
                          </ScrollArea>
                        </TabsContent>

                        <TabsContent
                          className="mt-0 h-full min-h-0 overflow-hidden"
                          value="participants"
                        >
                          <ScrollArea className="h-full">
                            <div className={CONTENT_RAIL_CLASS}>
                              <RequestWorkersPanel
                                onBrowseWorkers={() => {
                                  openMarketplaceTab("workers")
                                }}
                                requestDetail={requestDetail}
                                shareUrl={selectedRequestShareUrl}
                              />
                            </div>
                          </ScrollArea>
                        </TabsContent>

                        <TabsContent
                          className="mt-0 h-full min-h-0 overflow-hidden"
                          value="workspace"
                        >
                          <ScrollArea className="h-full">
                            <div className={CONTENT_RAIL_CLASS}>
                              <ProposalViewerPanel
                                approvingProposalId={approvingProposalId}
                                canSubmitDelivery={canSubmitDelivery}
                                deliveryDraft={deliveryDraft}
                                deliverySubmitted={
                                  requestDetail.fulfillment?.status ===
                                  "fulfilled"
                                }
                                hasSubmittedProposal={hasSubmittedProposal}
                                isDraftingProposal={isDraftingProposal}
                                isRefiningMatches={isRefiningMatches}
                                isSubmittingDelivery={isSubmittingDelivery}
                                isSubmittingProposal={isSubmittingProposal}
                                key={activeIntentId}
                                matchQueryDraft={resolvedMatchQueryDraft}
                                onAddToCart={handleAddToCart}
                                onApproveProposal={handleApproveProposal}
                                onDeliveryFilesSelected={
                                  handleDeliveryFilesSelected
                                }
                                onDraftProposal={handleDraftProposal}
                                onOpenProfileBuilder={openProfileBuilder}
                                onRefineMatches={handleRefineMatches}
                                onRemoveDeliveryAttachment={
                                  handleRemoveDeliveryAttachment
                                }
                                onSubmitDelivery={handleSubmitDelivery}
                                onSubmitProposal={handleSubmitProposal}
                                onTogglePinnedMatch={handleTogglePinnedMatch}
                                pinningSupplyId={pinningSupplyId}
                                proposalDraft={proposalDraft}
                                proposalMessage={proposalMessage}
                                requestDetail={requestDetail}
                                setDeliveryDraft={setDeliveryDraft}
                                setMatchQueryDraft={setMatchQueryDraft}
                                setProposalDraft={setProposalDraft}
                                setProposalMessage={setProposalMessage}
                              />
                            </div>
                          </ScrollArea>
                        </TabsContent>

                        <TabsContent
                          className="mt-0 h-full min-h-0 overflow-hidden"
                          value="chat"
                        >
                          {!canViewRequestChat ? (
                            <div
                              className={cn(
                                CONTENT_RAIL_CLASS,
                                "h-full items-center py-8"
                              )}
                            >
                              <div className="w-full rounded-xl border border-border p-6">
                                <p className="text-sm font-medium">
                                  Chat opens after acceptance
                                </p>
                                <p className="mt-2 text-xs text-muted-foreground">
                                  Only the owner and accepted participants can
                                  use the request chat thread. Use the workboard
                                  tab to submit or review proposals first.
                                </p>
                              </div>
                            </div>
                          ) : (
                            <Conversation className="h-full min-h-0">
                              <ConversationContent className={CHAT_RAIL_CLASS}>
                                <RequestChatTimeline
                                  approvingProposalId={approvingProposalId}
                                  isApprovingRequest={isApprovingRequest}
                                  isArchivingRequest={isArchivingRequest}
                                  isCancellingRequest={isCancellingRequest}
                                  isMarkingRequestFulfilled={
                                    isMarkingRequestFulfilled
                                  }
                                  isRefreshingRequest={isRefreshingRequest}
                                  isRefreshingVideo={isRefreshingVideo}
                                  isSubmittingReview={isSubmittingReview}
                                  liveMessages={messages}
                                  onAddToCart={handleAddToCart}
                                  onApproveProposal={handleApproveProposal}
                                  onApproveRequest={handleApproveRequest}
                                  onArchiveRequest={handleArchiveRequest}
                                  onAskCatalogItem={(item) => {
                                    void submitMessage(
                                      `Tell me more about ${item.title}. Include best use cases, what it delivers, and whether it fits my request.`
                                    )
                                  }}
                                  onCancelRequest={handleCancelRequest}
                                  onDeleteIntent={() =>
                                    handleDeleteIntent(activeIntentId)
                                  }
                                  onDownloadVideo={handleDownloadVideo}
                                  onMarkRequestFulfilled={
                                    handleMarkRequestFulfilled
                                  }
                                  onOpenProfileBuilder={openProfileBuilder}
                                  onOpenRequestForWorkers={
                                    handleOpenRequestForWorkers
                                  }
                                  onQuickReply={(value) => {
                                    void submitMessage(value)
                                  }}
                                  onRefreshRequest={handleRefreshRequest}
                                  onRefreshVideo={() => {
                                    const artifact = requestDetail.artifact
                                    const metadata = artifact?.metadata
                                    const jobId =
                                      (typeof metadata?.jobId === "string"
                                        ? metadata.jobId
                                        : null) ?? artifact?.remoteId
                                    void refreshVideoJob(jobId)
                                  }}
                                  onRetryRequest={handleRetryRequest}
                                  onSubmitReview={handleSubmitReview}
                                  requestDetail={requestDetail}
                                  review={effectiveReview}
                                  shouldPromptReview={shouldPromptReview}
                                  workspace={effectiveWorkspace}
                                />

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
                        </TabsContent>
                      </>
                    )}
                  </div>
                </Tabs>
              ) : (
                <div className="min-h-0 flex-1 overflow-hidden">
                  {isConversationLoading ? (
                    <div className={HOME_PANEL_CLASS}>
                      <div className="flex items-center justify-center py-16">
                        <LoaderIcon className="size-5 animate-spin text-muted-foreground" />
                      </div>
                    </div>
                  ) : isMissingConversation ? (
                    <div className={HOME_PANEL_CLASS}>
                      <div className="mx-auto flex w-full max-w-xl flex-col items-center gap-3 text-center">
                        <p className="text-lg font-medium">
                          This chat thread is no longer available.
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Start a fresh chat or pick another thread from the
                          sidebar.
                        </p>
                        <Button onClick={handleClearSelection} type="button">
                          Start new chat
                        </Button>
                      </div>
                    </div>
                  ) : isHomeView ? (
                    <div className={HOME_PANEL_CLASS}>
                      <HomeChatSurface
                        composer={
                          <PromptInput
                            className="w-full"
                            onSubmit={async (input) => {
                              if (!input.text.trim()) {
                                return
                              }

                              setComposerText("")
                              await submitMessage(input.text)
                            }}
                          >
                            <PromptInputBody>
                              <PromptInputTextarea
                                className="min-h-[140px] text-base"
                                onChange={(event) =>
                                  setComposerText(event.currentTarget.value)
                                }
                                placeholder="Submit a request, publish an offer, or tell Boreal what should happen."
                                value={composerText}
                              />
                            </PromptInputBody>
                            <PromptInputFooter className="justify-end gap-2">
                              <PromptInputSubmit
                                disabled={
                                  isSubmitting || composerText.trim().length === 0
                                }
                                status={isSubmitting ? "submitted" : undefined}
                              />
                            </PromptInputFooter>
                          </PromptInput>
                        }
                        quickActions={
                          <>
                            <Button
                              onClick={() => openMarketplaceTab("workers")}
                              size="sm"
                              type="button"
                              variant="outline"
                            >
                              Browse offers
                            </Button>
                            <Button
                              onClick={() => openMarketplaceTab("requests")}
                              size="sm"
                              type="button"
                              variant="outline"
                            >
                              Browse requests
                            </Button>
                            <Button
                              onClick={openPapersOverview}
                              size="sm"
                              type="button"
                              variant="outline"
                            >
                              Read papers
                            </Button>
                            <Button
                              onClick={() => {
                                if (privyAuthenticated) {
                                  setIsAccountDialogOpen(true)
                                  return
                                }

                                login()
                              }}
                              size="sm"
                              type="button"
                              variant={privyAuthenticated ? "secondary" : "outline"}
                            >
                              <WalletIcon className="size-4" />
                              {privyReady
                                ? privyAuthenticated
                                  ? "Wallet connected"
                                  : runtimePrimaryChainFamily === "solana"
                                    ? "Connect Solana"
                                    : "Connect wallet"
                                : "Wallet"}
                            </Button>
                          </>
                        }
                        starterPrompts={starterPrompts.map((prompt) => {
                          const Icon = prompt.icon

                          return {
                            description: prompt.description,
                            icon: <Icon className="size-4" />,
                            onSelect: () => {
                              setComposerText(prompt.prompt)
                            },
                            title: prompt.title,
                          }
                        })}
                      />
                    </div>
                  ) : (
                    <Conversation className="h-full min-h-0">
                      <ConversationContent className={CHAT_RAIL_CLASS}>
                        {!activeIntentId && hasMoreBorealSessions ? (
                          <div className="flex justify-center">
                            <Button
                              onClick={() =>
                                setBorealChatSessionLimit((current) => current + 6)
                              }
                              size="sm"
                              type="button"
                              variant="outline"
                            >
                              Load more sessions
                            </Button>
                          </div>
                        ) : null}
                        {activeIntentId
                          ? displayedMessages.map((message) => (
                            <Message from={message.role} key={message.id}>
                              <MessageContent>
                                {message.content.trim().length > 0 ? (
                                  <MessageResponse className="[&_a]:inline-flex [&_a]:items-center [&_a]:rounded-full [&_a]:border [&_a]:border-border [&_a]:px-2.5 [&_a]:py-1 [&_a]:text-xs [&_a]:tracking-[0.16em] [&_a]:uppercase">
                                    {message.content}
                                  </MessageResponse>
                                ) : (
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <LoaderIcon className="size-4 animate-spin" />
                                    <span>Routing request</span>
                                  </div>
                                )}
                              </MessageContent>
                            </Message>
                          ))
                          : borealTimelineSessions.map((session, index) => (
                            <BorealTimelineSessionBlock
                              key={`${session.conversation.conversationId}-${session.conversation.latestMessageAt}-${index}`}
                              activeApprovalIntentId={pendingApprovalIntentId}
                              onApproveRequest={handleApproveRequest}
                              onDiscardRequest={handleCancelRequest}
                              onOpenRequest={openConversationRequestById}
                              session={session}
                            />
                          ))}
                        {hasRenderableInlineWorkspace(effectiveWorkspace) ? (
                          <InlineWorkspaceCard
                            approvalIntentId={pendingApprovalIntentId}
                            isRefreshingVideo={isRefreshingVideo}
                            onAddToCart={handleAddToCart}
                            onApproveRoute={handleApproveRequest}
                            onAskCatalogItem={(item) => {
                              void submitMessage(
                                `Tell me more about ${item.title}. Include best use cases, what it delivers, and whether it fits my request.`
                              )
                            }}
                            onDownloadVideo={handleDownloadVideo}
                            isApprovingRoute={isApprovingRequest}
                            onOpenProfileBuilder={openProfileBuilder}
                            onQuickReply={(value) => {
                              setComposerText(value)
                            }}
                            onRefreshVideo={() => undefined}
                            workspace={effectiveWorkspace}
                          />
                        ) : null}

                      </ConversationContent>
                      <ConversationScrollButton />
                    </Conversation>
                  )}
                </div>
              )}

              <FooterComposerRegion
                centerPanelClass={CENTER_PANEL_CLASS}
                errorMessage={null}
                show={shouldShowFooterComposer}
              >
                <div className={CHAT_COMPOSER_CLASS}>
                  <PromptInputTools className="w-full flex-wrap justify-start gap-2">
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
                          : runtimePrimaryChainFamily === "solana"
                            ? "Connect Solana"
                            : "Connect Wallet"
                        : "Wallet"}
                    </Button>
                  </PromptInputTools>

                  {isArchivedTranscript ? (
                    <div className="border border-border px-4 py-3 text-xs text-muted-foreground">
                      This request has been archived. The chat is now read-only.
                    </div>
                  ) : (
                    <PromptInput
                      className="w-full"
                      onSubmit={async (input) => {
                        if (!input.text.trim()) {
                          return
                        }

                        setComposerText("")
                        await submitMessage(input.text)
                      }}
                    >
                      <PromptInputBody>
                        <PromptInputTextarea
                          onChange={(event) =>
                            setComposerText(event.currentTarget.value)
                          }
                          placeholder="Ask a question, coordinate on a request, or ask Boreal for help."
                          value={composerText}
                        />
                      </PromptInputBody>
                      <PromptInputFooter className="justify-end">
                        <PromptInputSubmit
                          disabled={isSubmitting || composerText.trim().length === 0}
                          status={isSubmitting ? "submitted" : undefined}
                        />
                      </PromptInputFooter>
                    </PromptInput>
                  )}
                </div>
              </FooterComposerRegion>
            </section>

            <DesktopDiscoveryRail
              open={isDiscoveryRailOpen}
              width={DISCOVERY_SIDEBAR_WIDTH}
            >
              <WorkspacePanel
                activeTab={workspaceTab}
                onAddToCart={handleAddToCart}
                onSelectRequest={handleMarketplaceSelect}
                onTabChange={(value) => updateWorkspaceUrl({ browse: value })}
                ownerExternalId={ownerExternalId}
              />
            </DesktopDiscoveryRail>
          </div>
        </div>
      </div>
      {errorMessage ? (
        <div className="pointer-events-none fixed top-20 left-1/2 z-50 -translate-x-1/2 px-4">
          <div className="pointer-events-auto min-w-[18rem] max-w-[min(32rem,calc(100vw-2rem))] rounded-2xl border border-destructive/25 bg-background/95 px-4 py-3 shadow-2xl backdrop-blur-sm">
            <p className="text-sm text-destructive">{errorMessage}</p>
          </div>
        </div>
      ) : null}
      <MobileSidebarDrawer
        label="Requests"
        onOpenChange={setIsMobileIntentSidebarOpen}
        open={isMobileIntentSidebarOpen}
        side="left"
      >
        <IntentSidebar
          borealChatSessionCount={borealChatSessions.length}
          isBorealChatActive={!activeIntentId}
          intents={visibleSidebarIntents}
          onOpenAccount={() => setIsAccountDialogOpen(true)}
          onOpenBorealChat={handleClearSelection}
          onCollapse={() => setIsMobileIntentSidebarOpen(false)}
          onOpenPendingApprovals={() => {
            const nextIntent = pendingApprovalIntents[0]
            if (nextIntent) {
              handleSidebarSelect(nextIntent, "workspace")
            }
          }}
          onSelect={handleSidebarSelect}
          pendingApprovalCount={pendingApprovalIntents.length}
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
      <AccountSettingsDialog
        accountName={session?.user?.name ?? null}
        defaultWalletAddress={defaultWalletAddress}
        isOpen={isAccountDialogOpen}
        isPayoutWalletUpdating={isSettingDefaultPayoutWalletId}
        isPrivyAuthenticated={privyAuthenticated}
        isWalletReady={isWalletReady}
        myProfileRecord={myProfileRecord}
        notice={accountNotice}
        onConnectWallet={login}
        onOpenChange={setIsAccountDialogOpen}
        onOpenProfileBuilder={() => {
          setIsAccountDialogOpen(false)
          openProfileBuilder()
        }}
        onSetDefaultPayoutWallet={handleSetDefaultPayoutWallet}
        runtimeDefaultNetworkKey={runtimeDefaultNetworkKey}
        runtimeEnvironment={runtimeEnvironment}
        runtimePrimaryChainFamily={runtimePrimaryChainFamily}
        walletAccounts={walletAccounts}
      />
      <ProfileBuilderDialog
        connectWalletLabel={
          runtimePrimaryChainFamily === "solana"
            ? "Connect Solana wallet"
            : "Connect EVM wallet"
        }
        draft={profileBuilderDraft}
        isDrafting={isDraftingProfileBuilder}
        isOpen={isProfileBuilderOpen}
        isSaving={isSavingProfileBuilder}
        isWalletReady={isWalletReady}
        onConnectWallet={login}
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
  )
}

function AccountSettingsDialog({
  accountName,
  defaultWalletAddress,
  isOpen,
  isPayoutWalletUpdating,
  isPrivyAuthenticated,
  isWalletReady,
  myProfileRecord,
  notice,
  onConnectWallet,
  onOpenChange,
  onOpenProfileBuilder,
  onSetDefaultPayoutWallet,
  runtimeDefaultNetworkKey,
  runtimeEnvironment,
  runtimePrimaryChainFamily,
  walletAccounts,
}: {
  accountName: string | null
  defaultWalletAddress: string | null
  isOpen: boolean
  isPayoutWalletUpdating: string | null
  isPrivyAuthenticated: boolean
  isWalletReady: boolean
  myProfileRecord: MyProfileRecord
  notice: string | null
  onConnectWallet: () => void
  onOpenChange: (open: boolean) => void
  onOpenProfileBuilder: () => void
  onSetDefaultPayoutWallet: (walletAccountId: string) => Promise<void>
  runtimeDefaultNetworkKey: string
  runtimeEnvironment: "devnet" | "mainnet" | "testnet"
  runtimePrimaryChainFamily: "evm" | "solana"
  walletAccounts: WalletAccountRecord
}) {

  return (
    <Dialog onOpenChange={onOpenChange} open={isOpen}>
      <DialogContent className="max-h-[min(88svh,52rem)] max-w-[min(48rem,calc(100vw-2rem))] overflow-hidden border border-border bg-background p-0 text-foreground shadow-2xl sm:max-w-[min(48rem,calc(100vw-2rem))]">
        <DialogHeader className="border-b border-border px-6 py-5">
          <DialogTitle>Account settings</DialogTitle>
          <DialogDescription>
            Boreal binds wallet identity, payout routing, and public offers to
            your signed-in X account.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[calc(88svh-8.5rem)]">
          <div className="px-6 py-6">
            <AccountSettingsSurface
              accountName={accountName}
              defaultWalletAddress={defaultWalletAddress}
              isPayoutWalletUpdating={isPayoutWalletUpdating}
              isPrivyAuthenticated={isPrivyAuthenticated}
              isWalletReady={isWalletReady}
              myProfileRecord={myProfileRecord}
              notice={notice}
              onConnectWallet={onConnectWallet}
              onOpenProfileBuilder={onOpenProfileBuilder}
              onSetDefaultPayoutWallet={onSetDefaultPayoutWallet}
              runtimeDefaultNetworkKey={runtimeDefaultNetworkKey}
              runtimeEnvironment={runtimeEnvironment}
              runtimePrimaryChainFamily={runtimePrimaryChainFamily}
              walletAccounts={walletAccounts}
            />
          </div>
        </ScrollArea>
        <DialogFooter className="border-t border-border px-6 py-4">
          <div className="flex w-full items-center justify-between gap-3 text-xs text-muted-foreground">
            <p>
              Deploy with <code>BOREAL_CHAIN_ENV=mainnet</code> to switch the
              commerce layer out of devnet defaults.
            </p>
            <div className="flex items-center gap-2">
              <Button asChild size="sm" type="button" variant="outline">
                <Link href="/account" onClick={() => onOpenChange(false)}>
                  Full settings
                </Link>
              </Button>
              <Button onClick={() => onOpenChange(false)} size="sm" type="button" variant="outline">
                Close
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function MobileSidebarDrawer({
  children,
  label,
  onOpenChange,
  open,
  side,
}: {
  children: ReactNode
  label: string
  onOpenChange: (open: boolean) => void
  open: boolean
  side: "left" | "right"
}) {
  useEffect(() => {
    if (!open) {
      return
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onOpenChange(false)
      }
    }

    window.addEventListener("keydown", handleKeyDown)

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [onOpenChange, open])

  return (
    <div className="lg:hidden">
      <button
        aria-hidden={!open}
        aria-label={`Close ${label.toLowerCase()}`}
        className={cn(
          "fixed inset-0 z-40 bg-background/72 backdrop-blur-[2px] transition-opacity duration-300 ease-out",
          open ? "opacity-100" : "pointer-events-none opacity-0"
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
          open ? "pointer-events-auto" : "pointer-events-none"
        )}
        inert={!open}
        role="dialog"
      >
        <div
          className={cn(
            "relative h-full bg-background shadow-2xl",
            side === "left"
              ? "border-r border-border"
              : "border-l border-border"
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
  )
}

function BorealTimelineSessionBlock({
  activeApprovalIntentId,
  onApproveRequest,
  onDiscardRequest,
  onOpenRequest,
  session,
}: {
  activeApprovalIntentId: string | null
  onApproveRequest: (intentId?: string | null) => Promise<void>
  onDiscardRequest: (intentId: string) => Promise<void>
  onOpenRequest: (requestId: string) => void
  session: BorealTimelineSession
}) {
  const sortedRequests = session.linkedRequests
    .slice()
    .sort((left, right) => left.updatedAt - right.updatedAt)

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="shrink-0 text-[11px] tracking-[0.18em] text-muted-foreground uppercase">
          Session · {formatBorealSessionTime(session.conversation.latestMessageAt)}
        </span>
        <div className="h-px flex-1 bg-border" />
      </div>

      {session.messages.map((message) => (
        <Message
          from={message.role === "user" ? "user" : "assistant"}
          key={message._id}
        >
          <MessageContent>
            {message.body.trim().length > 0 ? (
              <MessageResponse className="[&_a]:inline-flex [&_a]:items-center [&_a]:rounded-full [&_a]:border [&_a]:border-border [&_a]:px-2.5 [&_a]:py-1 [&_a]:text-xs [&_a]:tracking-[0.16em] [&_a]:uppercase">
                {message.body}
              </MessageResponse>
            ) : (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <LoaderIcon className="size-4 animate-spin" />
                <span>Routing request</span>
              </div>
            )}
          </MessageContent>
        </Message>
      ))}

      {sortedRequests.map((linkedRequest) => (
        <div
          className="rounded-2xl border border-border bg-card px-4 py-3"
          key={linkedRequest.id}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-medium">{linkedRequest.title}</p>
              <p className="mt-1 text-xs tracking-[0.16em] text-muted-foreground uppercase">
                {linkedRequest.status === "proposed"
                  ? linkedRequest.needsClarification
                    ? "Needs scope"
                    : linkedRequest.id === activeApprovalIntentId
                      ? "Review matched routes"
                      : "Awaiting approval"
                  : linkedRequest.status.replaceAll("_", " ")}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {linkedRequest.status === "proposed" &&
              !linkedRequest.needsClarification &&
              linkedRequest.id !== activeApprovalIntentId ? (
                <>
                  <Button
                    onClick={() => void onApproveRequest(linkedRequest.id)}
                    size="sm"
                    type="button"
                  >
                    Approve route
                  </Button>
                  <Button
                    onClick={() => void onDiscardRequest(linkedRequest.id)}
                    size="sm"
                    type="button"
                    variant="outline"
                  >
                    Discard
                  </Button>
                </>
              ) : (
                <Button
                  onClick={() => onOpenRequest(linkedRequest.id)}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  {linkedRequest.status === "proposed" &&
                  linkedRequest.id === activeApprovalIntentId
                    ? "Open draft"
                    : "Open request"}
                </Button>
              )}
            </div>
          </div>
          {linkedRequest.status === "proposed" ? (
            <p className="mt-3 text-xs text-muted-foreground">
              {linkedRequest.needsClarification
                ? "This draft still needs clearer scope. Open it and reply in chat before Boreal turns it into tracked work."
                : linkedRequest.id === activeApprovalIntentId
                  ? "The best matched routes are already expanded below. Approve the highlighted route card when you want Boreal to open tracked work."
                  : "Approve only when you want Boreal to open tracked work and run the matched route."}
            </p>
          ) : null}
        </div>
      ))}
    </div>
  )
}

function formatBorealSessionTime(value: number) {
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    month: "short",
  }).format(new Date(value))
}

function mergeOptimisticSessionMessages(
  persistedMessages: BorealTimelineSession["messages"],
  optimisticMessages: ChatMessage[]
) {
  const overlapCount = getMessageSequenceOverlap(
    persistedMessages.map((message) => ({
      content: message.body,
      role:
        message.role === "user" ? ("user" as const) : ("assistant" as const),
    })),
    optimisticMessages.map((message) => ({
      content: message.content,
      role: message.role,
    }))
  )

  return [
    ...persistedMessages,
    ...optimisticMessages.slice(overlapCount).map((message) => ({
      _id: message.id,
      body: message.content,
      createdAt: message.createdAt,
      role: message.role,
      sender: {
        actorKind: message.role === "user" ? ("human" as const) : ("agent" as const),
        displayName: message.role === "user" ? "You" : "Boreal",
        externalId: null,
        handle: null,
      },
    })),
  ]
}

function getMessageSequenceOverlap(
  persistedMessages: Array<{ content: string; role: ChatMessage["role"] }>,
  optimisticMessages: Array<{ content: string; role: ChatMessage["role"] }>
) {
  if (persistedMessages.length === 0 || optimisticMessages.length === 0) {
    return 0
  }

  const maxOverlap = Math.min(persistedMessages.length, optimisticMessages.length)

  for (let overlap = maxOverlap; overlap >= 1; overlap -= 1) {
    const persistedSlice = persistedMessages.slice(-overlap)
    const optimisticSlice = optimisticMessages.slice(0, overlap)
    const matches = optimisticSlice.every((message, index) => {
      const persisted = persistedSlice[index]

      return (
        persisted?.role === message.role &&
        persisted.content.trim() === message.content.trim()
      )
    })

    if (matches) {
      return overlap
    }
  }

  return 0
}

function RequestViewTabTrigger({
  count = 0,
  label,
  value,
}: {
  count?: number
  label: string
  value: CenterViewTab
}) {
  const hasCount = count > 0

  return (
    <TabsTrigger className="flex-none" value={value}>
      <span>{label}</span>
      <Badge
        aria-hidden={!hasCount}
        className={cn(
          "h-5 w-6 shrink-0 justify-center border-transparent px-0 text-[10px] font-medium tabular-nums",
          hasCount
            ? "bg-primary/10 text-primary"
            : "bg-transparent text-transparent opacity-0"
        )}
        variant="outline"
      >
        {hasCount ? formatNotificationCount(count) : "0"}
      </Badge>
    </TabsTrigger>
  )
}

function RequestHeaderMeta({
  status,
}: {
  status: NonNullable<RequestDetail["intent"]>["status"]
}) {
  const progressStage = getRequestHeaderStage(status)
  const isWorking = status === "claimed" || status === "in_progress"
  const progressItems = [
    { icon: SearchIcon, label: "Scope" },
    { icon: CheckIcon, label: "Approve" },
    { icon: SparklesIcon, label: "Active" },
    { icon: PackageIcon, label: "Deliver" },
  ] as const

  return (
    <div className="w-full md:w-auto">
      <TooltipProvider>
        <div className="flex justify-end">
          <div className="flex min-w-0 items-center py-1.5">
            {progressItems.map((item, index) => {
              const isComplete = index < progressStage
              const isCurrent = index === progressStage
              const shouldPulse = isCurrent && index === 2 && isWorking
              const Icon = item.icon

              return (
                <div className="contents" key={item.label}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div
                        aria-label={item.label}
                        className={cn(
                          "relative z-10 flex size-5 shrink-0 items-center justify-center rounded-full border bg-background transition-colors",
                          isComplete || isCurrent
                            ? "border-primary bg-primary/5 text-primary"
                            : "border-foreground/20 text-muted-foreground",
                          shouldPulse &&
                            "animate-pulse shadow-[0_0_0_4px_rgba(20,184,166,0.14)]"
                        )}
                      >
                        <Icon className="size-2.5" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="top" sideOffset={2}>
                      {item.label}
                    </TooltipContent>
                  </Tooltip>
                  {index < progressItems.length - 1 ? (
                    <div
                      className={cn(
                        "h-px min-w-3 flex-1 sm:min-w-4",
                        isComplete || isCurrent
                          ? "bg-primary/75"
                          : "bg-border"
                      )}
                    />
                  ) : null}
                </div>
              )
            })}
          </div>
        </div>
      </TooltipProvider>
    </div>
  )
}

function getRequestHeaderStage(status: string) {
  if (status === "fulfilled") {
    return 3
  }

  if (
    status === "open" ||
    status === "claimed" ||
    status === "in_progress" ||
    status === "blocked"
  ) {
    return 2
  }

  if (status === "proposed" || status === "closed") {
    return 1
  }

  return 0
}

function InlineRequestActionEvent({
  access,
  activity,
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
  onOpenRequestForWorkers,
  onRefreshRequest,
  onRetryRequest,
  onSubmitReview,
  participants,
  proposals,
  shouldPromptReview,
}: {
  access: RequestDetail["access"]
  activity: RequestDetail["activity"]
  approvingProposalId: string | null
  intent: NonNullable<RequestDetail["intent"]>
  isArchivingRequest: boolean
  isApprovingRequest: boolean
  isCancellingRequest: boolean
  isMarkingRequestFulfilled: boolean
  isRefreshingRequest: boolean
  isSubmittingReview: boolean
  onArchiveRequest: () => Promise<void>
  onApproveProposal: (proposalId: string) => Promise<void>
  onApproveRequest: () => void
  onCancelRequest: () => void
  onDeleteIntent: () => void
  onMarkRequestFulfilled: () => Promise<void>
  onOpenProfileBuilder: () => void
  onOpenRequestForWorkers: () => Promise<void>
  onRefreshRequest: () => Promise<void>
  onRetryRequest: () => Promise<void>
  onSubmitReview: (rating: number) => void
  participants: RequestDetail["participants"]
  proposals: RequestDetail["proposals"]
  shouldPromptReview: boolean
}) {
  const actionState = getRequestActionState(intent, access, shouldPromptReview)
  const submittedProposals = (proposals ?? []).filter(
    (proposal) => proposal.status === "submitted"
  )
  const acceptedProposal =
    (proposals ?? []).find((proposal) => proposal.status === "accepted") ?? null
  const workingParticipants = (participants ?? []).filter(
    (participant) => participant.status !== "owner"
  )
  const handlingMode = getRequestHandlingMode(intent)
  const isProfileUpdate = intent.routeTarget === "profile_update"
  const isMatchedCatalogRoute =
    handlingMode === "boreal" && intent.shouldSearchCatalog
  const blockedErrorMessage = getLatestBlockedErrorMessage(activity)

  if (actionState.kind === "none" || actionState.kind === "review") {
    return null
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
            <div
              className="space-y-4 border border-border p-4"
              key={proposal._id}
            >
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
                    <p className="text-sm font-medium">
                      {proposal.proposer.displayName}
                    </p>
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
                    <Link href={`/p/${proposal.proposer.profileId}`}>
                      View profile
                    </Link>
                  </Button>
                ) : null}
                <Button
                  disabled={isCancellingRequest}
                  onClick={onCancelRequest}
                  size="sm"
                  type="button"
                  variant="ghost"
                >
                  {isCancellingRequest ? (
                    <LoaderIcon className="animate-spin" />
                  ) : (
                    <XCircleIcon />
                  )}
                  Cancel request
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
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
                      : isMatchedCatalogRoute
                        ? "Approval target: best matched route"
                        : "Approval target: Boreal Agent"}
              </p>
              <p className="text-xs text-muted-foreground">
                {handlingMode === "clarify"
                  ? "Boreal is waiting for a clearer brief before anyone gets approved."
                  : handlingMode === "workers"
                    ? "Approving this will publish the request for proposals and matching."
                    : isProfileUpdate
                      ? "Approving this will let Boreal draft your editable public profile and first listing. You can also open the builder form and fill it manually."
                      : isMatchedCatalogRoute
                        ? "Approving this will let Boreal run the strongest matched specialist route first."
                        : "Approving this will let Boreal Agent take the first execution pass."}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
            <span className="border border-border px-2 py-1">
              {getRequestHandlingLabel(handlingMode)}
            </span>
            <span className="border border-border px-2 py-1">
              {intent.requestedOutputTypes
                .map((type) => type.replaceAll("_", " "))
                .join(" / ")}
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
              Working now{" "}
              {workingParticipants
                .map((participant) => participant.displayName)
                .join(", ")}
            </span>
          ) : null}
        </div>
      ) : null}
      {intent.missingDetails.length > 0 ? (
        <div className="space-y-2">
          <p className="text-xs tracking-[0.16em] text-muted-foreground uppercase">
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
              className="inline-flex items-center rounded-full border border-border px-2.5 py-1 text-[11px] tracking-[0.16em] text-muted-foreground uppercase"
              key={reply}
            >
              {reply}
            </span>
          ))}
        </div>
      ) : null}
      {actionState.kind === "approval" && isMatchedCatalogRoute ? (
        <p className="text-xs text-muted-foreground">
          Approve the highlighted route card below when you want Boreal to lock
          the strongest match and start tracked work.
        </p>
      ) : null}
      {actionState.kind === "blocked" && blockedErrorMessage ? (
        <div className="border border-destructive/20 bg-destructive/5 px-3 py-2 text-xs text-muted-foreground">
          Last error: {blockedErrorMessage}
        </div>
      ) : null}
      <div className="flex flex-wrap gap-2">
        {actionState.kind === "approval" ? (
          <>
            {isProfileUpdate ? (
              <Button
                onClick={onOpenProfileBuilder}
                size="sm"
                type="button"
                variant="outline"
              >
                <CircleUserRoundIcon />
                Open builder form
              </Button>
            ) : null}
            {handlingMode !== "clarify" && !isMatchedCatalogRoute ? (
              <Button
                disabled={isApprovingRequest}
                onClick={onApproveRequest}
                size="sm"
                type="button"
              >
                {isApprovingRequest ? (
                  <LoaderIcon className="animate-spin" />
                ) : (
                  <CheckIcon />
                )}
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
              {isCancellingRequest ? (
                <LoaderIcon className="animate-spin" />
              ) : (
                <XCircleIcon />
              )}
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
              {isRefreshingRequest ? (
                <LoaderIcon className="animate-spin" />
              ) : (
                <RefreshCwIcon />
              )}
              Refresh
            </Button>
            <Button
              disabled={isCancellingRequest}
              onClick={onCancelRequest}
              size="sm"
              type="button"
              variant="outline"
            >
              {isCancellingRequest ? (
                <LoaderIcon className="animate-spin" />
              ) : (
                <XCircleIcon />
              )}
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
              {isRefreshingRequest ? (
                <LoaderIcon className="animate-spin" />
              ) : (
                <RefreshCwIcon />
              )}
              Refresh
            </Button>
            <Button
              disabled={isMarkingRequestFulfilled}
              onClick={() => void onMarkRequestFulfilled()}
              size="sm"
              type="button"
            >
              {isMarkingRequestFulfilled ? (
                <LoaderIcon className="animate-spin" />
              ) : (
                <CheckIcon />
              )}
              Mark as fulfilled
            </Button>
          </>
        ) : null}
        {actionState.kind === "blocked" ? (
          <>
            {isProfileUpdate ? (
              <Button
                onClick={onOpenProfileBuilder}
                size="sm"
                type="button"
                variant="outline"
              >
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
              {isApprovingRequest ? (
                <LoaderIcon className="animate-spin" />
              ) : (
                <RefreshCwIcon />
              )}
              Retry
            </Button>
            <Button
              disabled={isApprovingRequest}
              onClick={() => void onOpenRequestForWorkers()}
              size="sm"
              type="button"
              variant="outline"
            >
              {isApprovingRequest ? (
                <LoaderIcon className="animate-spin" />
              ) : (
                <MessagesSquareIcon />
              )}
              Open for workers
            </Button>
            <Button
              disabled={isArchivingRequest}
              onClick={() => void onArchiveRequest()}
              size="sm"
              type="button"
              variant="outline"
            >
              {isArchivingRequest ? (
                <LoaderIcon className="animate-spin" />
              ) : (
                <PackageIcon />
              )}
              Archive
            </Button>
            <Button
              onClick={onDeleteIntent}
              size="sm"
              type="button"
              variant="ghost"
            >
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
              {isArchivingRequest ? (
                <LoaderIcon className="animate-spin" />
              ) : (
                <PackageIcon />
              )}
              Archive
            </Button>
            <Button
              onClick={onDeleteIntent}
              size="sm"
              type="button"
              variant="ghost"
            >
              Delete
            </Button>
          </>
        ) : null}
        {actionState.kind === "closed" ? (
          <>
            <Button
              disabled={isApprovingRequest}
              onClick={onApproveRequest}
              size="sm"
              type="button"
            >
              {isApprovingRequest ? (
                <LoaderIcon className="animate-spin" />
              ) : (
                <RefreshCwIcon />
              )}
              Continue
            </Button>
            <Button
              onClick={onDeleteIntent}
              size="sm"
              type="button"
              variant="outline"
            >
              Delete
            </Button>
          </>
        ) : null}
      </div>
      {shouldPromptReview ? (
        <InlineReviewActions
          disabled={isSubmittingReview}
          onSubmitReview={onSubmitReview}
        />
      ) : null}
    </div>
  )
}

type RequestTimelineItem =
  | {
    item: RequestDetail["messages"][number]
    key: string
    kind: "message"
    timestamp: number
  }
  | { item: ChatMessage; key: string; kind: "live"; timestamp: number }
  | {
    item: RequestDetail["activity"][number]
    key: string
    kind: "activity"
    timestamp: number
  }
  | {
    item: NonNullable<RequestDetail["artifact"]>
    key: string
    kind: "artifact"
    timestamp: number
  }
  | {
    item: NonNullable<RequestDetail["fulfillment"]>
    key: string
    kind: "fulfillment"
    timestamp: number
  }
  | {
    item: NonNullable<RequestDetail["review"]>
    key: string
    kind: "review"
    timestamp: number
  }

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
  onOpenRequestForWorkers,
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
  approvingProposalId: string | null
  liveMessages: ChatMessage[]
  isArchivingRequest: boolean
  isApprovingRequest: boolean
  isCancellingRequest: boolean
  isMarkingRequestFulfilled: boolean
  isRefreshingRequest: boolean
  isRefreshingVideo: boolean
  isSubmittingReview: boolean
  onAddToCart: (supplyId: string) => Promise<void>
  onArchiveRequest: () => Promise<void>
  onApproveProposal: (proposalId: string) => Promise<void>
  onApproveRequest: (intentId?: string | null) => Promise<void>
  onAskCatalogItem: (item: CatalogItem) => void
  onCancelRequest: (intentId?: string | null) => Promise<void>
  onDeleteIntent: () => void
  onDownloadVideo: (videoId: string) => void
  onMarkRequestFulfilled: () => Promise<void>
  onOpenProfileBuilder: () => void
  onOpenRequestForWorkers: () => Promise<void>
  onQuickReply: (value: string) => void
  onRefreshRequest: () => Promise<void>
  onRefreshVideo: () => void
  onRetryRequest: () => Promise<void>
  onSubmitReview: (rating: number) => void
  requestDetail: RequestDetail
  review: RequestDetail["review"]
  shouldPromptReview: boolean
  workspace: WorkspaceState
}) {
  const timeline = buildRequestTimeline(requestDetail, review, liveMessages)
  const catalogApprovalIntentId =
    requestDetail.intent &&
    requestDetail.access?.isOwner &&
    requestDetail.intent.status === "proposed" &&
    !requestDetail.intent.needsClarification
      ? requestDetail.intent._id
      : null

  return (
    <>
      {timeline.map((entry) => {
        if (entry.kind === "message") {
          const role = entry.item.sender.isCurrentUser
            ? "user"
            : entry.item.sender.actorKind === "agent"
              ? "assistant"
              : "assistant"

          return (
            <Message from={role} key={entry.key}>
              {!entry.item.sender.isCurrentUser ? (
                <p className="mb-1 flex items-center gap-2 text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
                  <SenderIcon actorKind={entry.item.sender.actorKind} />
                  <span>{entry.item.sender.displayName}</span>
                </p>
              ) : null}
              <MessageContent>
                <MessageResponse className="[&_a]:inline-flex [&_a]:items-center [&_a]:rounded-full [&_a]:border [&_a]:border-border [&_a]:px-2.5 [&_a]:py-1 [&_a]:text-xs [&_a]:tracking-[0.16em] [&_a]:uppercase">
                  {entry.item.body}
                </MessageResponse>
              </MessageContent>
            </Message>
          )
        }

        if (entry.kind === "live") {
          return (
            <Message from={entry.item.role} key={entry.key}>
              <p className="mb-1 flex items-center gap-2 text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
                <BotIcon className="size-3" />
                <span>Boreal Agent</span>
              </p>
              <MessageContent>
                <MessageResponse className="[&_a]:inline-flex [&_a]:items-center [&_a]:rounded-full [&_a]:border [&_a]:border-border [&_a]:px-2.5 [&_a]:py-1 [&_a]:text-xs [&_a]:tracking-[0.16em] [&_a]:uppercase">
                  {entry.item.content}
                </MessageResponse>
              </MessageContent>
            </Message>
          )
        }

        if (entry.kind === "activity") {
          return <InlineActivityEvent activity={entry.item} key={entry.key} />
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
          )
        }

        if (entry.kind === "fulfillment") {
          return (
            <InlineFulfillmentEvent fulfillment={entry.item} key={entry.key} />
          )
        }

        return <InlineReviewEvent key={entry.key} review={entry.item} />
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
          activity={requestDetail.activity}
          onCancelRequest={() => onCancelRequest(requestDetail.intent?._id)}
          onDeleteIntent={onDeleteIntent}
          onMarkRequestFulfilled={onMarkRequestFulfilled}
          onOpenProfileBuilder={onOpenProfileBuilder}
          onOpenRequestForWorkers={onOpenRequestForWorkers}
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
          approvalIntentId={catalogApprovalIntentId}
          isRefreshingVideo={isRefreshingVideo}
          onAddToCart={onAddToCart}
          onApproveRoute={onApproveRequest}
          onAskCatalogItem={onAskCatalogItem}
          onDownloadVideo={onDownloadVideo}
          isApprovingRoute={isApprovingRequest}
          onOpenProfileBuilder={onOpenProfileBuilder}
          onQuickReply={onQuickReply}
          onRefreshVideo={onRefreshVideo}
          workspace={workspace}
        />
      ) : null}
    </>
  )
}

function buildRequestTimeline(
  requestDetail: RequestDetail,
  review: RequestDetail["review"],
  liveMessages: ChatMessage[]
): RequestTimelineItem[] {
  const items: RequestTimelineItem[] = []

  for (const message of requestDetail.messages) {
    items.push({
      item: message,
      key: `message-${message._id}`,
      kind: "message",
      timestamp: message.createdAt,
    })
  }

  for (const activity of requestDetail.activity) {
    items.push({
      item: activity,
      key: `activity-${activity._id}`,
      kind: "activity",
      timestamp: activity.createdAt,
    })
  }

  if (requestDetail.artifact) {
    items.push({
      item: requestDetail.artifact,
      key: `artifact-${requestDetail.artifact._id}`,
      kind: "artifact",
      timestamp:
        requestDetail.artifact.updatedAt || requestDetail.artifact.createdAt,
    })
  }

  if (requestDetail.fulfillment?.evidence) {
    items.push({
      item: requestDetail.fulfillment,
      key: `fulfillment-${requestDetail.fulfillment.evidence.createdAt}`,
      kind: "fulfillment",
      timestamp: requestDetail.fulfillment.evidence.createdAt,
    })
  }

  if (review?.reviewedAt) {
    items.push({
      item: review,
      key: `review-${review.reviewedAt}`,
      kind: "review",
      timestamp: review.reviewedAt,
    })
  }

  for (const liveMessage of liveMessages) {
    items.push({
      item: liveMessage,
      key: `live-${liveMessage.id}`,
      kind: "live",
      timestamp: liveMessage.createdAt,
    })
  }

  return items.sort((left, right) => {
    if (left.timestamp !== right.timestamp) {
      return left.timestamp - right.timestamp
    }

    const order = {
      activity: 0,
      message: 1,
      live: 2,
      fulfillment: 3,
      artifact: 4,
      review: 5,
    }

    return order[left.kind] - order[right.kind]
  })
}

function InlineActivityEvent({
  activity,
}: {
  activity: RequestDetail["activity"][number]
}) {
  return (
    <div className="space-y-2 border-l border-border pl-4">
      <p className="text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
        {formatRequestDate(activity.createdAt)}
      </p>
      <div className="space-y-1">
        <p className="text-sm font-medium">{labelActivity(activity.type)}</p>
        {activity.payload ? (
          <p className="text-xs text-muted-foreground">
            {describeActivityPayload(activity.payload)}
          </p>
        ) : null}
      </div>
    </div>
  )
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
  artifact: NonNullable<RequestDetail["artifact"]>
  isRefreshingVideo: boolean
  onAddToCart: (supplyId: string) => Promise<void>
  onDownloadVideo: (videoId: string) => void
  onOpenProfileBuilder: () => void
  onRefreshVideo: () => void
  workspace: WorkspaceState
}) {
  if (!hasRenderableInlineWorkspace(workspace)) {
    return null
  }

  return (
    <div className="space-y-2">
      <p className="text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
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
  )
}

function InlineFulfillmentEvent({
  fulfillment,
}: {
  fulfillment: NonNullable<RequestDetail["fulfillment"]>
}) {
  if (!fulfillment.evidence) {
    return null
  }

  return (
    <div className="space-y-2">
      <p className="text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
        {formatRequestDate(fulfillment.evidence.createdAt)}
      </p>
      <WorkSubmissionCard fulfillment={fulfillment} />
    </div>
  )
}

function InlineReviewEvent({
  review,
}: {
  review: NonNullable<RequestDetail["review"]>
}) {
  return (
    <div className="space-y-3 border border-border p-4">
      <p className="text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
        {review.reviewedAt ? formatRequestDate(review.reviewedAt) : "Review"}
      </p>
      <div className="flex items-center gap-1">
        {Array.from({ length: 5 }).map((_, index) => (
          <StarIcon
            className={cn(
              "size-4",
              index < review.rating ? "fill-current" : "text-muted-foreground"
            )}
            key={index}
          />
        ))}
      </div>
      {review.comment ? <p className="text-sm">{review.comment}</p> : null}
      <p className="text-xs text-muted-foreground">Review submitted.</p>
    </div>
  )
}

function WorkSubmissionCard({
  fulfillment,
}: {
  fulfillment: NonNullable<RequestDetail["fulfillment"]>
}) {
  if (!fulfillment.evidence) {
    return null
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
        <span className="inline-flex items-center border border-border px-2 py-1 text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
          {fulfillment.status.replaceAll("_", " ")}
        </span>
      </div>
      <div className="border border-border p-4">
        <MessageResponse className="text-sm">
          {fulfillment.evidence.body}
        </MessageResponse>
      </div>
      {fulfillment.evidence.attachments.length > 0 ? (
        <div className="grid gap-3 md:grid-cols-2">
          {fulfillment.evidence.attachments.map((attachment) => (
            <div
              className="flex items-center justify-between gap-3 border border-border p-3"
              key={`${attachment.fileName}-${attachment.url ?? attachment.sizeBytes}`}
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex size-9 items-center justify-center border border-border text-muted-foreground">
                  <FileIcon className="size-4" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {attachment.fileName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(attachment.sizeBytes)}
                  </p>
                </div>
              </div>
              {attachment.url ? (
                <Button asChild size="sm" type="button" variant="outline">
                  <a
                    download={attachment.fileName}
                    href={attachment.url}
                    rel="noreferrer"
                    target="_blank"
                  >
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
  )
}

function InlinePendingReviewEvent({
  disabled,
  onSubmitReview,
}: {
  disabled: boolean
  onSubmitReview: (rating: number) => void
}) {
  return (
    <div className="space-y-3 border border-border p-4">
      <p className="text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
        Awaiting review
      </p>
      <p className="text-sm font-medium">Rate this delivery</p>
      <p className="text-xs text-muted-foreground">
        The request is complete. Leave a quick score here so performance stays
        visible.
      </p>
      <InlineReviewActions
        disabled={disabled}
        onSubmitReview={onSubmitReview}
      />
    </div>
  )
}

function InlineReviewActions({
  compact,
  disabled,
  onSubmitReview,
}: {
  compact?: boolean
  disabled?: boolean
  onSubmitReview: (rating: number) => void
}) {
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 5 }).map((_, index) => {
          const rating = index + 1

          return (
            <Button
              disabled={disabled}
              key={rating}
              onClick={() => onSubmitReview(rating)}
              size={compact ? "icon-sm" : "icon-sm"}
              type="button"
              variant="outline"
            >
              {disabled ? (
                <LoaderIcon className="animate-spin" />
              ) : (
                <StarIcon />
              )}
            </Button>
          )
        })}
      </div>
      {!compact ? (
        <p className="text-xs text-muted-foreground">
          Rate the delivery once it is complete so worker quality stays visible.
        </p>
      ) : null}
    </div>
  )
}

function SenderIcon({ actorKind }: { actorKind: "agent" | "human" | "tool" }) {
  if (actorKind === "agent") {
    return <BotIcon className="size-3" />
  }

  return <UserIcon className="size-3" />
}

function LoadingRequestPanel() {
  return (
    <div className="flex items-center justify-center">
      <LoaderIcon className="size-5 animate-spin text-muted-foreground" />
    </div>
  )
}

function RequestWorkersPanel({
  onBrowseWorkers,
  requestDetail,
  shareUrl,
}: {
  onBrowseWorkers: () => void
  requestDetail: RequestDetail | null
  shareUrl: string | null
}) {
  const [copied, setCopied] = useState(false)
  const intent = requestDetail?.intent
  const participants = requestDetail?.participants ?? []
  const isWaitingForWorkers =
    participants.filter((participant) => participant.status !== "owner")
      .length === 0 &&
    (intent?.status === "open" || intent?.status === "proposed")

  async function handleCopyShare() {
    if (!shareUrl) {
      return
    }

    await navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1600)
  }

  return (
    <div className="space-y-4">
      {isWaitingForWorkers ? (
        <div className="space-y-3 border border-border p-4">
          <p className="text-sm font-medium">Waiting for team</p>
          <p className="text-xs text-muted-foreground">
            No collaborator is assigned yet. Share this request so human or
            agent talent can review it and start a proposal flow.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={onBrowseWorkers}
              size="sm"
              type="button"
              variant="outline"
            >
              Find collaborators
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
            Collaborators can review this request from the public directory and
            submit proposals into the same workboard.
          </p>
        </div>
      ) : null}

      <div className="space-y-3 border border-border p-4">
        <p className="text-xs tracking-[0.16em] text-muted-foreground uppercase">
          Team
        </p>
        <div className="space-y-3">
          {participants.map((participant) => (
            <div
              className="border border-border p-3"
              key={`${participant.displayName}-${participant.status}`}
            >
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
                    <p className="text-sm font-medium">
                      {participant.displayName}
                    </p>
                    <span className="text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
                      {participant.status}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {participant.handle
                      ? `@${participant.handle}`
                      : participant.kind}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {participant.profileId ? (
                      <Button asChild size="sm" type="button" variant="outline">
                        <Link href={`/p/${participant.profileId}`}>
                          View profile
                        </Link>
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
  )
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
  approvingProposalId: string | null
  canSubmitDelivery: boolean
  deliveryDraft: DeliveryDraft
  deliverySubmitted: boolean
  hasSubmittedProposal: boolean
  isDraftingProposal: boolean
  isRefiningMatches: boolean
  isSubmittingDelivery: boolean
  isSubmittingProposal: boolean
  matchQueryDraft: string
  onAddToCart: (supplyId: string) => Promise<void>
  onApproveProposal: (proposalId: string) => Promise<void>
  onDeliveryFilesSelected: (files: File[]) => Promise<void>
  onDraftProposal: () => Promise<void>
  onOpenProfileBuilder: () => void
  onRefineMatches: () => Promise<void>
  onRemoveDeliveryAttachment: (attachmentId: string) => void
  onSubmitDelivery: () => Promise<void>
  onSubmitProposal: () => Promise<void>
  onTogglePinnedMatch: (supplyId: string) => Promise<void>
  pinningSupplyId: string | null
  proposalDraft: ProposalDraft
  proposalMessage: string
  requestDetail: RequestDetail | null
  setDeliveryDraft: Dispatch<SetStateAction<DeliveryDraft>>
  setMatchQueryDraft: Dispatch<SetStateAction<string | null>>
  setProposalDraft: Dispatch<SetStateAction<ProposalDraft>>
  setProposalMessage: Dispatch<SetStateAction<string>>
}) {
  const isOwner = requestDetail?.access?.isOwner ?? false
  const proposals = requestDetail?.proposals ?? []
  const visibleProposals = isOwner
    ? proposals
    : proposals.filter((proposal) => proposal.isMine)
  const [isProposalDialogOpen, setIsProposalDialogOpen] = useState(false)
  const [isDeliveryDialogOpen, setIsDeliveryDialogOpen] = useState(false)
  const proposalDialogOpen = isProposalDialogOpen && !hasSubmittedProposal
  const deliveryDialogOpen = isDeliveryDialogOpen && !deliverySubmitted
  const matchCandidates =
    requestDetail?.matchCandidates.map(mapCatalogEntryToItem) ?? []
  const isProfileUpdateRequest =
    requestDetail?.intent?.routeTarget === "profile_update"
  const hasMatchingWorkspace = Boolean(
    matchCandidates.length > 0 ||
    requestDetail?.intent?.matchAttempts ||
    requestDetail?.intent?.shouldSearchCatalog ||
    requestDetail?.intent?.routeTarget === "catalog_lookup"
  )

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
            <p className="text-sm font-medium">Profile onboarding</p>
            <p className="text-xs text-muted-foreground">
              Use the builder to save your public profile and publish the first
              listing. Boreal drafting is optional and only runs when you ask
              for it.
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
            Review who is asking to take this request, what they will deliver,
            and the quoted price before approving.
          </p>
        </div>
      ) : !isProfileUpdateRequest && canSubmitDelivery ? (
        <div className="space-y-4 border border-border p-4">
          <div className="space-y-1">
            <p className="text-sm font-medium">Delivery</p>
            <p className="text-xs text-muted-foreground">
              Your proposal was accepted. Submit the finished work here so the
              owner can review it.
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
            canSubmit={canSubmitDeliveryForm(deliveryDraft)}
            deliveryDraft={deliveryDraft}
            isOpen={deliveryDialogOpen}
            isSubmittingDelivery={isSubmittingDelivery}
            isUploadingDeliveryFiles={deliveryDraft.attachments.some(
              (attachment) => attachment.status === "uploading"
            )}
            onOpenChange={setIsDeliveryDialogOpen}
            onRemoveAttachment={onRemoveDeliveryAttachment}
            onReset={() => setDeliveryDraft(emptyDeliveryDraft())}
            onSelectFiles={onDeliveryFilesSelected}
            onSubmitDelivery={onSubmitDelivery}
            setDeliveryDraft={setDeliveryDraft}
          />
        </div>
      ) : !isProfileUpdateRequest &&
        requestDetail?.access?.canSubmitProposal &&
        !hasSubmittedProposal ? (
        <div className="space-y-4 border border-border p-4">
          <div className="space-y-1">
            <p className="text-sm font-medium">Proposal</p>
            <p className="text-xs text-muted-foreground">
              Build your proposal in a form, refine it if useful, then send only
              when you are ready.
            </p>
          </div>
          <div className="space-y-4 border border-border p-4">
            <p className="text-sm font-medium">Current proposal draft</p>
            <ProposalCardBody proposal={mapDraftProposal(proposalDraft)} />
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => setIsProposalDialogOpen(true)}
                size="sm"
                type="button"
              >
                <SparklesIcon />
                Open proposal form
              </Button>
            </div>
          </div>
          <ProposalSubmissionDialog
            canSubmit={canSubmitProposalForm({
              proposalDraft,
              proposalMessage,
            })}
            isDraftingProposal={isDraftingProposal}
            isOpen={proposalDialogOpen}
            isSubmittingProposal={isSubmittingProposal}
            onDraftProposal={onDraftProposal}
            onOpenChange={setIsProposalDialogOpen}
            onReset={() => {
              setProposalDraft(emptyProposalDraft())
              setProposalMessage("")
            }}
            onSubmitProposal={onSubmitProposal}
            preview={
              <ProposalCardBody proposal={mapDraftProposal(proposalDraft)} />
            }
            proposalDraft={proposalDraft}
            proposalMessage={proposalMessage}
            setProposalDraft={setProposalDraft}
            setProposalMessage={setProposalMessage}
          />
        </div>
      ) : !isProfileUpdateRequest &&
        requestDetail?.access?.canSubmitProposal &&
        hasSubmittedProposal ? (
        <div className="space-y-4 border border-border p-4">
          <div className="space-y-1">
            <p className="text-sm font-medium">Proposal submitted</p>
            <p className="text-xs text-muted-foreground">
              Your proposal is now in review. This workboard will update when
              the owner accepts or declines it.
            </p>
          </div>
        </div>
      ) : !isProfileUpdateRequest ? (
        <div className="space-y-3 border border-border p-4">
          <p className="text-sm font-medium">Proposal submission unavailable</p>
          <p className="text-xs text-muted-foreground">
            This workboard is not accepting proposals right now.
          </p>
        </div>
      ) : null}

      {!isProfileUpdateRequest ? (
        <div className="space-y-3 border border-border p-4">
          <p className="text-sm font-medium">
            {isOwner ? "Received proposals" : "My proposals"}
          </p>
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
                        <p className="text-sm font-medium">
                          {proposal.proposer.displayName}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {proposal.proposer.handle
                            ? `@${proposal.proposer.handle}`
                            : proposal.proposer.kind}
                        </p>
                      </div>
                    </div>
                    <div className="text-right text-xs text-muted-foreground">
                      <p>{proposal.status.replaceAll("_", " ")}</p>
                      <p className="mt-1">
                        {formatRequestDate(proposal.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <ProposalCardBody proposal={proposal} />
                  </div>
                  {proposal.proposer.profileId ? (
                    <div className="mt-4">
                      <Button asChild size="sm" type="button" variant="outline">
                        <Link href={`/p/${proposal.proposer.profileId}`}>
                          View profile
                        </Link>
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
  )
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
  isOwner: boolean
  isRefiningMatches: boolean
  matchAttempts: number
  matchCandidates: CatalogItem[]
  matchQueryDraft: string
  onAddToCart: (supplyId: string) => Promise<void>
  onRefineMatches: () => Promise<void>
  onTogglePinnedMatch: (supplyId: string) => Promise<void>
  pinningSupplyId: string | null
  setMatchQueryDraft: Dispatch<SetStateAction<string | null>>
}) {
  const feasibleMatches = matchCandidates.filter(
    (candidate) => candidate.gatedOutReasons.length === 0
  )
  const blockedMatches = matchCandidates.filter(
    (candidate) => candidate.gatedOutReasons.length > 0
  )
  const pinnedCount = feasibleMatches.filter(
    (candidate) => candidate.isPinned
  ).length

  return (
    <div className="space-y-4 border border-border p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium">Matching</p>
          <p className="text-xs text-muted-foreground">
            Ranked supply stays attached to this request so discovery, pinning,
            and checkout remain auditable in one place.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
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
            <p className="text-xs tracking-[0.16em] text-muted-foreground uppercase">
              Refine request search
            </p>
            <p className="text-sm text-muted-foreground">
              Tighten the catalog query when the first pass is too broad or too
              weak.
            </p>
          </div>
          <div className="flex flex-col gap-2 md:flex-row">
            <Input
              className="h-10"
              onChange={(event) =>
                setMatchQueryDraft(event.currentTarget.value)
              }
              placeholder="Refine the request with product, capability, or service keywords"
              value={matchQueryDraft}
            />
            <Button
              disabled={
                isRefiningMatches || matchQueryDraft.trim().length === 0
              }
              onClick={() => void onRefineMatches()}
              type="button"
            >
              {isRefiningMatches ? (
                <LoaderIcon className="animate-spin" />
              ) : (
                <RefreshCwIcon />
              )}
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
              These listings passed the current gates and can move into cart or
              checkout now.
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
          No ready matches yet. Refine the query or wait for new supply to
          appear.
        </div>
      )}

      {blockedMatches.length > 0 ? (
        <div className="space-y-3">
          <div className="space-y-1">
            <p className="text-sm font-medium">Needs refinement</p>
            <p className="text-xs text-muted-foreground">
              These candidates were retrieved but gated out by pricing,
              availability, exclusions, or deadline fit.
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
  )
}

function RequestMatchCard({
  isOwner,
  item,
  onAddToCart,
  onTogglePinnedMatch,
  pinningSupplyId,
}: {
  isOwner: boolean
  item: CatalogItem
  onAddToCart: (supplyId: string) => Promise<void>
  onTogglePinnedMatch: (supplyId: string) => Promise<void>
  pinningSupplyId: string | null
}) {
  const isBlocked = item.gatedOutReasons.length > 0
  const confidence = item.successProbability ?? item.matchScore ?? 0

  return (
    <div
      className={cn(
        "space-y-4 border p-4",
        item.isPinned && "border-primary/35 bg-primary/10",
        isBlocked && "border-primary/20 bg-accent/40"
      )}
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-medium">{item.title}</p>
            {item.isPinned ? (
              <span className="inline-flex items-center border border-primary/30 px-2 py-1 text-[11px] tracking-[0.16em] text-primary uppercase">
                pinned
              </span>
            ) : null}
            {item.matchScore !== null ? (
              <span
                className={cn(
                  "inline-flex items-center border px-2 py-1 text-[11px] tracking-[0.16em] uppercase",
                  getMatchScoreTone(item.matchScore)
                )}
              >
                {item.matchScore}% match
              </span>
            ) : null}
            {item.matchStage ? (
              <span className="inline-flex items-center border border-border px-2 py-1 text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
                {item.matchStage}
              </span>
            ) : null}
          </div>
          {item.subtitle ? <p className="text-sm">{item.subtitle}</p> : null}
          <p className="text-sm text-muted-foreground">{item.description}</p>
          <div className="flex flex-wrap gap-x-4 gap-y-2 text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
            <span>{item.category}</span>
            <span>{item.deliveryType}</span>
            <span>{item.priceLabel}</span>
            {item.estimatedDeliveryLabel ? (
              <span>{item.estimatedDeliveryLabel}</span>
            ) : null}
            {item.seller?.displayName ? (
              <span>By {item.seller.displayName}</span>
            ) : null}
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
          <div className="flex items-center justify-between text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
            <span>Why it matched</span>
            <span>{confidence}% confidence</span>
          </div>
          <Progress value={confidence} />
          {item.matchReasons.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {item.matchReasons.map((reason) => (
                <span
                  className="inline-flex items-center border border-border px-2 py-1 text-[11px] tracking-[0.16em] text-muted-foreground uppercase"
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
          <div className="flex items-center justify-between text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
            <span>Blocked by</span>
            <span>{confidence}% confidence</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {item.gatedOutReasons.map((reason) => (
              <span
                className="inline-flex items-center border border-primary/20 bg-accent/70 px-2 py-1 text-[11px] tracking-[0.16em] text-primary uppercase"
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
          <Button
            onClick={() => void onAddToCart(item.id)}
            size="sm"
            type="button"
          >
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
  )
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
  activeCart: ActiveCart
  activePaymentItemId: string | null
  checkoutHistory: CheckoutRecord[]
  isCheckingOutCart: boolean
  isOpen: boolean
  isWalletReady: boolean
  notice: string | null
  onCheckout: () => Promise<void>
  onClearCart: () => Promise<void>
  onOpenChange: (open: boolean) => void
  onPayItem: (
    checkout: CheckoutRecord,
    item: CheckoutRecord["items"][number]
  ) => Promise<void>
  onRemoveItem: (cartLineItemId: string) => Promise<void>
  onUpdateQuantity: (cartLineItemId: string, quantity: number) => Promise<void>
}) {
  const cartItems = activeCart?.items ?? []
  const hasCartItems = cartItems.length > 0

  return (
    <Dialog onOpenChange={onOpenChange} open={isOpen}>
      <DialogContent className="max-w-5xl p-0 sm:max-w-5xl">
        <div className="flex max-h-[88svh] min-h-[72svh] flex-col overflow-hidden">
          <DialogHeader className="border-b border-border px-6 py-4">
            <DialogTitle>Cart and checkout</DialogTitle>
            <DialogDescription>
              Compare selected supply, adjust quantities, then check out.
              Instant digital goods unlock immediately. Async services stay
              tracked as submitted orders.
            </DialogDescription>
          </DialogHeader>

          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
            <div className="space-y-6">
              <section className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Active cart</p>
                    <p className="text-xs text-muted-foreground">
                      This cart stays tied to your signed-in X account and can
                      also be linked to the current request.
                    </p>
                  </div>
                  {hasCartItems ? (
                    <span className="inline-flex items-center border border-border px-2 py-1 text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
                      {activeCart?.itemCount ?? 0} item
                      {(activeCart?.itemCount ?? 0) === 1 ? "" : "s"}
                    </span>
                  ) : null}
                </div>

                {notice ? (
                  <div className="border border-primary/30 bg-primary/10 px-3 py-2 text-xs text-primary">
                    {notice}
                  </div>
                ) : null}

                {!hasCartItems ? (
                  <div className="border border-dashed border-border p-6 text-sm text-muted-foreground">
                    Your cart is empty. Add a product or service from matched
                    supply or the public market.
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
                          Provider-backed items preserve their payment and
                          invocation state after checkout.
                        </p>
                      </div>
                      <p className="text-sm font-medium">
                        {formatMoney(
                          activeCart?.subtotalAmount ?? 0,
                          activeCart?.currency ?? "USD"
                        )}
                      </p>
                    </div>
                  </div>
                )}
              </section>

              <section className="space-y-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Recent checkouts</p>
                  <p className="text-xs text-muted-foreground">
                    Instant downloads, payable provider calls, and submitted
                    service orders stay visible here.
                  </p>
                </div>

                {checkoutHistory.length === 0 ? (
                  <div className="border border-dashed border-border p-6 text-sm text-muted-foreground">
                    No checkout history yet.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {checkoutHistory.map((checkout) => (
                      <div
                        className="space-y-4 border border-border p-4"
                        key={checkout._id}
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="space-y-1">
                            <p className="text-sm font-medium">
                              Checkout {formatRequestDate(checkout.createdAt)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {checkout.itemCount} item
                              {checkout.itemCount === 1 ? "" : "s"} ·{" "}
                              {formatMoney(
                                checkout.subtotalAmount,
                                checkout.currency
                              )}
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
                                  <p className="text-sm font-medium">
                                    {item.title}
                                  </p>
                                  <span className="inline-flex items-center border border-border px-2 py-1 text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
                                    {item.status.replaceAll("_", " ")}
                                  </span>
                                </div>
                                {item.subtitle ? (
                                  <p className="text-xs text-muted-foreground">
                                    {item.subtitle}
                                  </p>
                                ) : null}
                                <div className="flex flex-wrap gap-x-4 gap-y-2 text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
                                  <span>{item.fulfillmentKind}</span>
                                  <span>{item.deliveryType}</span>
                                  <span>Qty {item.quantity}</span>
                                  <span>
                                    {formatMoney(
                                      (item.unitPriceAmount ?? 0) *
                                      item.quantity,
                                      checkout.currency
                                    )}
                                  </span>
                                  {item.sellerDisplayName ? (
                                    <span>By {item.sellerDisplayName}</span>
                                  ) : null}
                                  {item.payment ? (
                                    <span>{item.payment.protocol}</span>
                                  ) : null}
                                  {item.payment?.network ? (
                                    <span>{item.payment.network}</span>
                                  ) : null}
                                  {item.serviceInvocation?.executionSurface ? (
                                    <span>
                                      {item.serviceInvocation.executionSurface}
                                    </span>
                                  ) : null}
                                </div>
                                {item.payment ? (
                                  <div className="mt-2 flex flex-wrap gap-2">
                                    <span className="inline-flex items-center rounded-full border border-border px-2.5 py-1 text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
                                      {item.payment.status.replaceAll("_", " ")}
                                    </span>
                                    {item.payment.errorMessage ? (
                                      <span className="inline-flex items-center rounded-full border border-destructive/30 px-2.5 py-1 text-[11px] tracking-[0.16em] text-destructive uppercase">
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
                                    disabled={
                                      !isWalletReady ||
                                      activePaymentItemId === item._id
                                    }
                                    onClick={() =>
                                      void onPayItem(checkout, item)
                                    }
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
                                  <Button
                                    asChild
                                    size="sm"
                                    type="button"
                                    variant="outline"
                                  >
                                    <a
                                      href={item.accessUrl}
                                      rel="noreferrer"
                                      target="_blank"
                                    >
                                      <DownloadIcon />
                                      {item.accessLabel ?? "Open"}
                                    </a>
                                  </Button>
                                ) : null}
                                {item.sourceListingUrl && !item.accessUrl ? (
                                  <Button
                                    asChild
                                    size="sm"
                                    type="button"
                                    variant="outline"
                                  >
                                    <a
                                      href={item.sourceListingUrl}
                                      rel="noreferrer"
                                      target="_blank"
                                    >
                                      <ExternalLinkIcon />
                                      Open provider
                                    </a>
                                  </Button>
                                ) : null}
                                {item.sellerProfileId ? (
                                  <Button
                                    asChild
                                    size="sm"
                                    type="button"
                                    variant="ghost"
                                  >
                                    <Link href={`/p/${item.sellerProfileId}`}>
                                      View seller
                                    </Link>
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
              {isCheckingOutCart ? (
                <LoaderIcon className="animate-spin" />
              ) : (
                <ShoppingCartIcon />
              )}
              {isCheckingOutCart ? "Placing checkout..." : "Checkout now"}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function CartLineItemCard({
  item,
  onRemoveItem,
  onUpdateQuantity,
}: {
  item: NonNullable<ActiveCart>["items"][number]
  onRemoveItem: (cartLineItemId: string) => Promise<void>
  onUpdateQuantity: (cartLineItemId: string, quantity: number) => Promise<void>
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border border-border p-4">
      <div className="min-w-0 flex-1 space-y-1">
        <p className="text-sm font-medium">{item.title}</p>
        {item.subtitle ? (
          <p className="text-xs text-muted-foreground">{item.subtitle}</p>
        ) : null}
        <div className="flex flex-wrap gap-x-4 gap-y-2 text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
          <span>{item.fulfillmentKind}</span>
          <span>{item.deliveryType}</span>
          <span>
            {item.unitPriceAmount === null
              ? "Custom"
              : formatMoney(item.unitPriceAmount, item.currency)}
          </span>
          {item.sellerDisplayName ? (
            <span>By {item.sellerDisplayName}</span>
          ) : null}
          {item.paymentProtocol ? <span>{item.paymentProtocol}</span> : null}
          {item.sourceProviderKey ? (
            <span>{item.sourceProviderKey}</span>
          ) : null}
          {item.paymentNetworkHints[0] ? (
            <span>{item.paymentNetworkHints[0]}</span>
          ) : null}
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
          <span className="min-w-6 text-center text-sm font-medium">
            {item.quantity}
          </span>
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
  )
}

function CheckoutStatusPill({ status }: { status: string }) {
  const tone =
    status === "fulfilled"
      ? "border-primary/30 text-primary"
      : status === "pending_payment"
        ? "border-primary/20 text-primary/80"
        : status === "failed"
          ? "border-destructive/30 text-destructive"
          : "border-border text-muted-foreground"

  return (
    <span
      className={cn(
        "inline-flex items-center border px-2 py-1 text-[11px] tracking-[0.16em] uppercase",
        tone
      )}
    >
      {status.replaceAll("_", " ")}
    </span>
  )
}

function ProposalCardBody({
  proposal,
}: {
  proposal: {
    currency: string
    deliverablesBody: string
    etaAt: number
    price: number
  }
}) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-x-4 gap-y-2 text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
        <span>
          Quote {proposal.price} {proposal.currency}
        </span>
        <span>ETA {formatRequestDate(proposal.etaAt)}</span>
      </div>
      <p className="text-sm">{proposal.deliverablesBody}</p>
    </div>
  )
}

function mapDraftProposal(draft: Record<string, unknown>) {
  return {
    currency: typeof draft.currency === "string" ? draft.currency : "USD",
    deliverablesBody:
      typeof draft.deliverablesBody === "string" ? draft.deliverablesBody : "",
    etaAt:
      Date.now() +
      (typeof draft.etaDays === "number" ? draft.etaDays : 7) *
      24 *
      60 *
      60 *
      1000,
    price: typeof draft.price === "number" ? draft.price : 0,
  }
}

function canSubmitProposalForm({
  proposalDraft,
  proposalMessage,
}: {
  proposalDraft: ProposalDraft
  proposalMessage: string
}) {
  return Boolean(
    proposalMessage.trim().length > 0 ||
    proposalDraft.summary.trim().length > 0 ||
    proposalDraft.deliverablesBody.trim().length > 0
  )
}

function canSubmitDeliveryForm(deliveryDraft: DeliveryDraft) {
  return (
    deliveryDraft.deliverablesBody.trim().length > 0 &&
    deliveryDraft.attachments.every(
      (attachment) => attachment.status === "uploaded"
    )
  )
}

function uploadFileToConvex(
  uploadUrl: string,
  file: File,
  onProgress: (progress: number) => void
) {
  return new Promise<string>((resolve, reject) => {
    const xhr = new XMLHttpRequest()

    xhr.open("POST", uploadUrl)

    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable) {
        return
      }

      onProgress(Math.min(99, Math.round((event.loaded / event.total) * 100)))
    }

    xhr.onload = () => {
      if (xhr.status < 200 || xhr.status >= 300) {
        reject(new Error("File upload failed."))
        return
      }

      try {
        const payload = JSON.parse(xhr.responseText) as { storageId?: string }

        if (!payload.storageId) {
          reject(new Error("Convex upload did not return a storage id."))
          return
        }

        resolve(payload.storageId)
      } catch {
        reject(new Error("Failed to parse Convex upload response."))
      }
    }

    xhr.onerror = () => reject(new Error("File upload failed."))
    xhr.send(file)
  })
}

function formatFileSize(sizeBytes: number) {
  if (sizeBytes < 1024) {
    return `${sizeBytes} B`
  }

  if (sizeBytes < 1024 * 1024) {
    return `${(sizeBytes / 1024).toFixed(1)} KB`
  }

  return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatMoney(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat("en-US", {
      currency,
      maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
      style: "currency",
    }).format(amount)
  } catch {
    return `${currency} ${amount}`
  }
}

function pickTxHash(receipt: Record<string, unknown> | null) {
  if (!receipt) {
    return undefined
  }

  const candidates = [
    receipt.txHash,
    receipt.transactionHash,
    receipt.hash,
    receipt.transaction_id,
  ]
  const match = candidates.find(
    (value) => typeof value === "string" && value.trim()
  )

  return typeof match === "string" ? match : undefined
}

function getRequestActionState(
  intent: NonNullable<RequestDetail["intent"]>,
  access: RequestDetail["access"],
  reviewPending: boolean
) {
  const status = intent.status
  const handlingMode = getRequestHandlingMode(intent)

  if (reviewPending) {
    return {
      description:
        "The work is delivered. Capture a quick rating inline before moving on.",
      kind: "review" as const,
      title: "Delivery finished",
    }
  }

  if (status === "proposed" && access?.canApproveProposals) {
    const isMatchedCatalogRoute =
      handlingMode === "boreal" &&
      intent.shouldSearchCatalog

    return {
      description:
        handlingMode === "clarify"
          ? "The draft still needs clearer scope before Boreal can open or run it safely."
          : handlingMode === "workers"
            ? "Approve to publish this request for workers and proposals. No one is assigned yet."
            : isMatchedCatalogRoute
              ? "Approve to let Boreal run the best matched specialist route for this request."
              : "Approve to let Boreal Agent take the first pass on this request.",
      kind: "approval" as const,
      title:
        handlingMode === "clarify"
          ? "Needs scope"
          : handlingMode === "workers"
            ? "Open for workers"
            : isMatchedCatalogRoute
              ? "Approve matched route"
              : "Approve Boreal Agent",
    }
  }

  if (status === "open" && access?.isOwner) {
    return {
      description:
        "This request is approved and waiting for proposals or matches. Share it, browse supply, or keep refining the scope.",
      kind: "waiting_workers" as const,
      title: "Waiting for team",
    }
  }

  if ((status === "claimed" || status === "in_progress") && access?.isOwner) {
    return {
      description:
        "Work is active. Refresh the workboard when you need the latest state, or mark it fulfilled when the final delivery happened in chat.",
      kind: "in_flight" as const,
      title: "Work in flight",
    }
  }

  if (status === "blocked" && access?.isOwner) {
    return {
      description:
        "Automatic execution hit an error. Retry it, or reopen it for workers if you want people or external agents to take over.",
      kind: "blocked" as const,
      title: "Needs intervention",
    }
  }

  if (status === "fulfilled" && access?.isOwner) {
    return {
      description:
        "Delivery is complete. Archive finished work or keep it active for more follow-up.",
      kind: "archive" as const,
      title: "Completed request",
    }
  }

  if (status === "closed" && access?.isOwner) {
    return {
      description:
        intent.closedReason === "cancelled_by_user"
          ? "This request was cancelled. Continue it or delete it if you no longer need the record."
          : "This request was archived or paused. Continue it or remove it from your list.",
      kind: "closed" as const,
      title: "Request paused",
    }
  }

  return {
    description:
      "This request is complete. No further action is required here.",
    kind: "none" as const,
    title: "Complete",
  }
}

function getMatchScoreTone(score: number | null) {
  if (score === null) {
    return "border-border text-muted-foreground"
  }

  if (score >= 80) {
    return "border-primary/30 text-primary"
  }

  if (score >= 65) {
    return "border-primary/20 text-primary/80"
  }

  if (score >= 50) {
    return "border-primary/30 text-primary"
  }

  return "border-border text-muted-foreground"
}

function normalizeCenterViewTab(value: string | null): CenterViewTab {
  if (
    value === "activity" ||
    value === "participants" ||
    value === "workspace"
  ) {
    return value
  }

  return "chat"
}

function normalizeCenterSheetView(value: string | null): CenterSheetView | null {
  if (
    value === "about" ||
    value === "developers" ||
    value === "papers" ||
    value === "roadmap"
  ) {
    return value
  }

  return null
}

function normalizePublicPaperSlug(
  value: string | null,
  papers: PublicPaperRecord[]
) {
  if (!value) {
    return null
  }

  return papers.some((paper) => paper.slug === value) ? value : null
}

async function consumeChatStream(input: {
  assistantMessageId: string
  response: Response
  setMessages: Dispatch<SetStateAction<ChatMessage[]>>
}) {
  const reader = input.response.body?.getReader()

  if (!reader) {
    throw new Error("Chat stream reader was unavailable.")
  }

  const decoder = new TextDecoder()
  let buffer = ""
  let finalPayload: ChatAssistantResponse | null = null

  while (true) {
    const { done, value } = await reader.read()

    if (done) {
      break
    }

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split("\n")
    buffer = lines.pop() ?? ""

    for (const line of lines) {
      const trimmed = line.trim()

      if (!trimmed) {
        continue
      }

      const event = JSON.parse(trimmed) as
        | { delta: string; type: "assistant-delta" }
        | { message: string; type: "error" }
        | { payload: ChatAssistantResponse; type: "final" }

      if (event.type === "assistant-delta") {
        input.setMessages((current) =>
          current.map((message) =>
            message.id === input.assistantMessageId
              ? { ...message, content: `${message.content}${event.delta}` }
              : message
          )
        )
        continue
      }

      if (event.type === "error") {
        throw new Error(event.message)
      }

      finalPayload = event.payload
    }
  }

  if (!finalPayload) {
    throw new Error("Chat response was incomplete.")
  }

  input.setMessages((current) =>
    current.map((message) =>
      message.id === input.assistantMessageId
        ? {
          ...message,
          content: message.content || finalPayload.assistantMessage,
        }
        : message
    )
  )

  return finalPayload
}

function buildChatUiContext(input: {
  activeIntentId: string | null
  requestDetail: RequestDetail | null
  selectedCenterTab: CenterViewTab
  workspaceTab: WorkspaceTab
}): ChatUiContext {
  const isOwner = input.requestDetail?.access?.canApproveProposals ?? false
  const canSubmitProposal =
    input.requestDetail?.access?.canSubmitProposal ?? false

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
  }
}

function normalizeWorkspaceTab(value: string | null): WorkspaceTab {
  if (value === "requests" || value === "workers") {
    return value
  }

  return "workers"
}

function hasRenderableInlineWorkspace(workspaceState: WorkspaceState) {
  return workspaceState.kind !== "empty"
}

function InlineWorkspaceCard({
  approvalIntentId,
  isApprovingRoute,
  isRefreshingVideo,
  onAddToCart,
  onApproveRoute,
  onAskCatalogItem,
  onDownloadVideo,
  onOpenProfileBuilder,
  onQuickReply,
  onRefreshVideo,
  workspace,
}: {
  approvalIntentId?: string | null
  isApprovingRoute?: boolean
  isRefreshingVideo: boolean
  onAddToCart: (supplyId: string) => Promise<void>
  onApproveRoute?: (intentId?: string | null) => Promise<void>
  onAskCatalogItem: (item: CatalogItem) => void
  onDownloadVideo: (videoId: string) => void
  onOpenProfileBuilder: () => void
  onQuickReply: (value: string) => void
  onRefreshVideo: () => void
  workspace: WorkspaceState
}) {
  if (workspace.kind === "artifact") {
    if (workspace.artifact.kind === "image") {
      return (
        <div className="space-y-4 border border-border p-4">
          <div className="space-y-1">
            <p className="text-sm font-medium">{workspace.title}</p>
            <p className="text-xs text-muted-foreground">
              {workspace.subtitle}
            </p>
          </div>
          <Image
            alt={workspace.artifact.title}
            className="h-auto w-full border border-border object-cover"
            height={900}
            src={`data:${workspace.artifact.mediaType};base64,${workspace.artifact.base64}`}
            unoptimized
            width={1600}
          />
          <p className="text-xs text-muted-foreground">
            {workspace.artifact.prompt}
          </p>
        </div>
      )
    }

    if (workspace.artifact.kind === "audio") {
      return (
        <div className="space-y-4 border border-border p-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <MicIcon className="size-4 text-muted-foreground" />
              <p className="text-sm font-medium">{workspace.title}</p>
            </div>
            <p className="text-xs text-muted-foreground">
              {workspace.subtitle}
            </p>
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
      )
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
    )
  }

  if (workspace.kind === "catalog") {
    const highlightedId = workspace.highlightedId ?? workspace.items[0]?.id

    return (
      <div className="space-y-4 border border-border p-4">
        <div className="space-y-1">
          <p className="text-sm font-medium">{workspace.title}</p>
          <p className="text-xs text-muted-foreground">{workspace.subtitle}</p>
        </div>
        <div className="space-y-3">
          {workspace.items.map((item) => (
            <CatalogWorkspaceCard
              approvalIntentId={approvalIntentId}
              highlighted={item.id === highlightedId}
              isApprovingRoute={Boolean(isApprovingRoute)}
              item={item}
              key={item.id}
              onAddToCart={onAddToCart}
              onApproveRoute={onApproveRoute}
              onAskCatalogItem={onAskCatalogItem}
            />
          ))}
        </div>
      </div>
    )
  }

  if (workspace.kind === "clarification") {
    return (
      <div className="space-y-4 border border-border p-4">
        <div className="space-y-1">
          <p className="text-sm font-medium">{workspace.title}</p>
          <p className="text-xs text-muted-foreground">{workspace.subtitle}</p>
        </div>
        <div className="border border-border p-3">
          <p className="text-xs tracking-[0.16em] text-muted-foreground uppercase">
            Needed
          </p>
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
    )
  }

  if (workspace.kind === "profile_builder") {
    return (
      <ProfileBuilderWorkspaceCard
        draft={workspace.draft}
        onOpen={onOpenProfileBuilder}
        sourceBrief={workspace.sourceBrief}
      />
    )
  }

  return null
}

function CatalogWorkspaceCard({
  approvalIntentId,
  highlighted,
  isApprovingRoute,
  item,
  onAddToCart,
  onApproveRoute,
  onAskCatalogItem,
}: {
  approvalIntentId?: string | null
  highlighted: boolean
  isApprovingRoute: boolean
  item: CatalogItem
  onAddToCart: (supplyId: string) => Promise<void>
  onApproveRoute?: (intentId?: string | null) => Promise<void>
  onAskCatalogItem: (item: CatalogItem) => void
}) {
  const canApproveRoute =
    Boolean(approvalIntentId) && highlighted && typeof onApproveRoute === "function"

  return (
    <div className="space-y-4 border border-border p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-medium">{item.title}</p>
            {highlighted ? (
              <span className="inline-flex items-center border border-primary/30 px-2 py-1 text-[11px] tracking-[0.16em] text-primary uppercase">
                Top route
              </span>
            ) : null}
            {item.matchScore !== null ? (
              <span
                className={cn(
                  "inline-flex items-center border px-2 py-1 text-[11px] tracking-[0.16em] uppercase",
                  getMatchScoreTone(item.matchScore)
                )}
              >
                {item.matchScore}% match
              </span>
            ) : null}
            <span className="inline-flex items-center border border-border px-2 py-1 text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
              {item.fulfillmentKind}
            </span>
          </div>
          {item.subtitle ? <p className="text-sm">{item.subtitle}</p> : null}
          <p className="text-sm text-muted-foreground">{item.description}</p>
          <div className="flex flex-wrap gap-x-4 gap-y-2 text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
            <span>{item.category}</span>
            <span>{item.deliveryType}</span>
            <span>{item.priceLabel}</span>
            {item.estimatedDeliveryLabel ? (
              <span>{item.estimatedDeliveryLabel}</span>
            ) : null}
            {item.seller?.displayName ? (
              <span>By {item.seller.displayName}</span>
            ) : null}
            {item.paymentProtocol ? <span>{item.paymentProtocol}</span> : null}
            {item.sourceProviderKey ? (
              <span>{item.sourceProviderKey}</span>
            ) : null}
            {item.paymentNetworkHints[0] ? (
              <span>{item.paymentNetworkHints[0]}</span>
            ) : null}
          </div>
        </div>
      </div>

      {item.matchReasons.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {item.matchReasons.map((reason) => (
            <span
              className="inline-flex items-center border border-border px-2 py-1 text-[11px] tracking-[0.16em] text-muted-foreground uppercase"
              key={`${item.id}-${reason}`}
            >
              {reason}
            </span>
          ))}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {canApproveRoute ? (
          <Button
            disabled={isApprovingRoute}
            onClick={() => void onApproveRoute?.(approvalIntentId)}
            size="sm"
            type="button"
          >
            {isApprovingRoute ? (
              <LoaderIcon className="animate-spin" />
            ) : (
              <CheckIcon />
            )}
            Approve route
          </Button>
        ) : null}
        {item.isCartEnabled ? (
          <Button
            onClick={() => void onAddToCart(item.id)}
            size="sm"
            type="button"
          >
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
        <Button
          onClick={() => onAskCatalogItem(item)}
          size="sm"
          type="button"
          variant="ghost"
        >
          Ask more
        </Button>
      </div>
    </div>
  )
}

function InlineVideoCard({
  artifact,
  isRefreshingVideo,
  onDownloadVideo,
  onRefreshVideo,
  subtitle,
  title,
}: {
  artifact: Extract<WorkspaceState, { kind: "artifact" }>["artifact"] & {
    kind: "video"
  }
  isRefreshingVideo: boolean
  onDownloadVideo: (videoId: string) => void
  onRefreshVideo: () => void
  subtitle: string
  title: string
}) {
  const isCompleted = artifact.status === "completed"

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
            <RefreshCwIcon
              className={isRefreshingVideo ? "animate-spin" : ""}
            />
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
  )
}

function ActivityThreadPanel({
  requestDetail,
  selectedIntent,
}: {
  requestDetail: RequestDetail | null
  selectedIntent: SidebarIntentPreview | null
}) {
  if (!requestDetail?.intent && !selectedIntent) {
    return null
  }

  const intent = requestDetail?.intent
  const reopenedAfterFailure =
    intent?.status === "open" &&
    Boolean(requestDetail && getLatestBlockedErrorMessage(requestDetail.activity))

  return (
    <div className="space-y-4">
      {intent ? (
        <div className="space-y-3 border border-border p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium">{intent.title}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {intent.summary}
              </p>
            </div>
            <RequestStatusBadge status={intent.status} />
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-2 text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
            <span>{formatOutputTypes(intent.requestedOutputTypes)}</span>
            <span>{intent.routeTarget.replaceAll("_", " ")}</span>
            <span>{intent.resolutionTier.replaceAll("_", " ")}</span>
          </div>
        </div>
      ) : null}

      {requestDetail?.assignment ? (
        <div className="space-y-3 border border-border p-4">
          <p className="text-xs tracking-[0.16em] text-muted-foreground uppercase">
            {reopenedAfterFailure ? "Last automatic route" : "Assignment"}
          </p>
          <div className="space-y-2 text-sm">
            <p>
              Agent: {requestDetail.assignment.agent ?? "Waiting for team"}
            </p>
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
          <p className="text-xs tracking-[0.16em] text-muted-foreground uppercase">
            Activity
          </p>
          <div className="space-y-3">
            {requestDetail.activity.map((activity) => (
              <div className="border-l border-border pl-3" key={activity._id}>
                <p className="text-sm font-medium">
                  {labelActivity(activity.type)}
                </p>
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
          <p className="text-xs tracking-[0.16em] text-muted-foreground uppercase">
            Review
          </p>
          <div className="flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, index) => (
              <StarIcon
                className={cn(
                  "size-4",
                  index < requestDetail.review!.rating
                    ? "fill-current"
                    : "text-muted-foreground"
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
  )
}

function labelActivity(type: string) {
  const labels: Record<string, string> = {
    "request.approved": "Request approved",
    "request.awaiting_approval": "Awaiting approval",
    "request.blocked": "Execution blocked",
    "request.delivered": "Route delivered",
    "request.execution_started": "Execution started",
    "request.fulfilled": "Request fulfilled",
    "request.opened_for_workers": "Opened for workers",
    "request.retrying": "Retry started",
  }

  return labels[type] ?? type.replace("request.", "").replaceAll("_", " ")
}

function describeActivityPayload(payload: Record<string, unknown>) {
  const parts: string[] = []

  if (typeof payload.assignedAgent === "string") {
    parts.push(`Agent: ${payload.assignedAgent}`)
  }

  if (
    Array.isArray(payload.assignedToolNames) &&
    payload.assignedToolNames.length > 0
  ) {
    parts.push(`Tools: ${payload.assignedToolNames.join(", ")}`)
  }

  if (typeof payload.progress === "number") {
    parts.push(`Progress: ${payload.progress}%`)
  }

  if (typeof payload.status === "string") {
    parts.push(`Status: ${payload.status.replaceAll("_", " ")}`)
  }

  if (typeof payload.rating === "number") {
    parts.push(`Rating: ${payload.rating}/5`)
  }

  if (typeof payload.routeTarget === "string") {
    parts.push(`Route: ${payload.routeTarget.replaceAll("_", " ")}`)
  }

  if (typeof payload.error === "string" && payload.error.trim().length > 0) {
    parts.push(`Error: ${payload.error}`)
  }

  return parts.join(" | ")
}

function getLatestBlockedErrorMessage(activity: RequestDetail["activity"]) {
  const latestBlocked = [...activity]
    .reverse()
    .find((entry) => entry.type === "request.blocked")

  const error = latestBlocked?.payload?.error

  return typeof error === "string" && error.trim().length > 0
    ? error
    : null
}

function buildWorkspaceFromRequestDetail(
  detail: RequestDetail | null
): WorkspaceState {
  if (!detail?.intent) {
    return emptyWorkspace
  }

  if (detail.intent.routeTarget === "profile_update") {
    const draftActivity = extractProfileBuilderActivity(detail.activity)

    return {
      draft:
        draftActivity?.draft ??
        buildProfileBuilderSeedFromIntent(detail.intent),
      kind: "profile_builder",
      sourceBrief: draftActivity?.sourceBrief ?? detail.intent.body,
          subtitle:
            detail.intent.status === "fulfilled"
              ? "The profile onboarding request is complete. You can still reopen the setup and refine the record later."
              : detail.intent.status === "in_progress" ||
                detail.intent.status === "claimed"
                ? "Boreal delivered an editable draft. Review it, then save the profile and publish the offer when ready."
                : "Open the setup form manually, or approve Boreal to draft a stronger profile and first offer from this brief.",
      title: "Profile and offer setup",
    }
  }

  if (detail.artifact?.artifactKind === "image" && detail.artifact.metadata) {
    const metadata = detail.artifact.metadata
    const base64 = typeof metadata.base64 === "string" ? metadata.base64 : null
    const mediaType =
      typeof metadata.mediaType === "string" ? metadata.mediaType : null
    const prompt =
      typeof metadata.prompt === "string"
        ? metadata.prompt
        : detail.intent.summary

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
      }
    }
  }

  if (detail.artifact?.artifactKind === "audio" && detail.artifact.metadata) {
    const metadata = detail.artifact.metadata
    const base64 = typeof metadata.base64 === "string" ? metadata.base64 : null
    const mediaType =
      typeof metadata.mediaType === "string" ? metadata.mediaType : null
    const transcript =
      typeof metadata.transcript === "string"
        ? metadata.transcript
        : detail.intent.summary
    const voice = typeof metadata.voice === "string" ? metadata.voice : "alloy"

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
      }
    }
  }

  if (detail.artifact?.artifactKind === "video") {
    const metadata = detail.artifact.metadata
    const jobId =
      (typeof metadata?.jobId === "string" ? metadata.jobId : null) ??
      detail.artifact.remoteId ??
      ""
    const prompt =
      typeof metadata?.prompt === "string"
        ? metadata.prompt
        : detail.intent.summary
    const status = normalizeVideoStatus(
      detail.artifact.status,
      metadata?.status
    )

    if (jobId) {
      return {
        artifact: {
          errorMessage:
            typeof metadata?.errorMessage === "string"
              ? metadata.errorMessage
              : undefined,
          expiresAt:
            typeof metadata?.expiresAt === "number"
              ? metadata.expiresAt
              : undefined,
          jobId,
          kind: "video",
          model:
            typeof metadata?.model === "string" ? metadata.model : "sora-2",
          progress:
            typeof metadata?.progress === "number" ? metadata.progress : 0,
          prompt,
          seconds:
            typeof metadata?.seconds === "string" ? metadata.seconds : "8",
          size: typeof metadata?.size === "string" ? metadata.size : "1280x720",
          status,
          title: detail.artifact.title,
        },
        kind: "artifact",
        subtitle: detail.artifact.subtitle,
        title: detail.artifact.title,
      }
    }
  }

  if (
    detail.intent.needsClarification &&
    detail.intent.missingDetails.length > 0
  ) {
    return {
      kind: "clarification",
      questions: detail.intent.missingDetails,
      subtitle:
        "This request is blocked until the missing details are provided.",
      suggestions: detail.intent.suggestedReplies,
      title: "Blocked request",
    }
  }

  if (detail.catalogItems.length > 0) {
    const blockedErrorMessage = getLatestBlockedErrorMessage(detail.activity)

    return {
      highlightedId: detail.catalogItems[0]?._id,
      items: detail.catalogItems.map(mapCatalogEntryToItem),
      kind: "catalog",
      subtitle:
        detail.intent.status === "blocked"
          ? blockedErrorMessage
            ? `Automatic route failed: ${blockedErrorMessage} You can retry it or reopen it for workers.`
            : "Automatic route failed. You can retry it or reopen it for workers."
          : detail.intent.status === "open" && blockedErrorMessage
            ? "This request was reopened for workers after an automatic route failed. The matched offers stay attached so you can compare and wait for proposals."
            : "Matched offers stay attached to this request so products and services remain actionable after refresh.",
      title: "Matched offers",
    }
  }

  return emptyWorkspace
}

function buildWorkspaceProfileBuilderDraft(
  requestDetail: RequestDetail | null
) {
  if (!requestDetail?.intent) {
    return createEmptyProfileBuilderDraft()
  }

  const activityDraft = extractProfileBuilderActivity(requestDetail.activity)
  return (
    activityDraft?.draft ??
    buildProfileBuilderSeedFromIntent(requestDetail.intent)
  )
}

function extractProfileBuilderActivity(activity: RequestDetail["activity"]) {
  const latest = [...activity]
    .reverse()
    .find((entry) => entry.type === "profile.builder_drafted")

  if (!latest?.payload) {
    return null
  }

  const draft = latest.payload.draft
  const sourceBrief = latest.payload.sourceBrief

  return {
    draft: isRecord(draft)
      ? mergeProfileBuilderDraft(
        createEmptyProfileBuilderDraft(),
        draft as Partial<ProfileBuilderDraft>
      )
      : createEmptyProfileBuilderDraft(),
    sourceBrief: typeof sourceBrief === "string" ? sourceBrief : "",
  }
}

function buildProfileBuilderSeedFromIntent(
  intent: NonNullable<RequestDetail["intent"]>
): ProfileBuilderDraft {
  const draft = createEmptyProfileBuilderDraft()

  draft.profile.headline = intent.title.slice(0, 120)
  draft.profile.bio = intent.summary.slice(0, 320)
  draft.listing.title = intent.title.slice(0, 120)
  draft.listing.description = intent.summary.slice(0, 320)
  draft.listing.enabled = true

  return draft
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value)
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
  }
}

function normalizeVideoStatus(
  artifactStatus: NonNullable<RequestDetail["artifact"]>["status"],
  metadataStatus: unknown
): "completed" | "failed" | "in_progress" | "queued" {
  if (typeof metadataStatus === "string") {
    if (metadataStatus === "queued" || metadataStatus === "in_progress") {
      return metadataStatus
    }

    if (metadataStatus === "completed" || metadataStatus === "ready") {
      return "completed"
    }

    if (metadataStatus === "failed") {
      return "failed"
    }
  }

  if (artifactStatus === "ready") {
    return "completed"
  }

  if (artifactStatus === "queued" || artifactStatus === "in_progress") {
    return artifactStatus
  }

  return "failed"
}
