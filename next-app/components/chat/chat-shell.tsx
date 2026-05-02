"use client"

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type CSSProperties,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react"
import Image from "next/image"
import { makeFunctionReference } from "convex/server"
import { useMutation, useQuery } from "convex/react"
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
  MessagesSquareIcon,
  MicIcon,
  MinusIcon,
  PackageIcon,
  PanelLeftCloseIcon,
  PanelRightCloseIcon,
  PlusIcon,
  RefreshCwIcon,
  SearchIcon,
  ShoppingCartIcon,
  SparklesIcon,
  StarIcon,
  Trash2Icon,
  UserIcon,
  UsersIcon,
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
import { BorealAgentCue } from "@/components/chat/boreal-agent-cue"
import { PresetTeamMemberIcons } from "@/components/chat/preset-team-member-icons"
import {
  ProviderSelectionCard,
  type ProviderSelectionWalletProvider,
} from "@/components/chat/provider-selection-card"
import {
  ProfileBuilderDialog,
  ProfileBuilderWorkspaceCard,
} from "@/components/chat/profile-builder"
import { RequestReceiptCard } from "@/components/chat/request-receipt-card"
import { SolanaThreadActionCard } from "@/components/chat/solana-thread-action-card"
import { BorealProfileView } from "@/components/profiles/boreal-profile-view"
import { ProfileView } from "@/components/profiles/profile-view"
import { AgentOnboardingSurface } from "@/components/home/agent-onboarding-surface"
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
  Tool,
  ToolContent,
  ToolHeader,
  ToolInput,
  ToolOutput,
} from "@/components/ai-elements/tool"
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
  AgentIdentityIcon,
  isSolanaOperatorIdentity,
} from "@/components/ui/agent-identity-icon"
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
import { DotMatrixSpinner } from "@/components/ui/dotmatrix-spinner"
import { Spinner as LoaderIcon } from "@/components/ui/spinner"
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
  WorkerProfileDetail,
} from "@/lib/boreal/integrations/convex/function-refs"
import { convexFunctionRefs } from "@/lib/boreal/integrations/convex/function-refs"
import type {
  NormalizedRequestReceipt,
  ProviderRoutePaymentReceipt,
  ProviderSelectionState,
} from "@/lib/boreal/provider-routing/types"
import type {
  ChatAssistantDebugEvent,
  CatalogItem,
  ChatAssistantResponse,
  ChatAssistantStreamEvent,
  ChatUiContext,
  PresetTeamStreamTurn,
  WorkspaceState,
} from "@/lib/boreal/schemas/chat"
import {
  getRequestHandlingLabel,
  getRequestHandlingMode,
} from "@/lib/boreal/routing/request-handling"
import { isVideoProviderAccessUnavailableError } from "@/lib/boreal/request-route-errors"
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
import {
  buildLocalRuntimeCapabilityTags,
  getRuntimeHealthUrl,
  isLocalRuntimeSupply,
} from "@/lib/boreal/external-agents/local-runtime"
import type {
  DesktopNodeAssignment,
  DesktopNodeEnvelope,
  DesktopNodeRuntimeFamily,
} from "@/lib/boreal/desktop-nodes/contracts"
import {
  buildAccountSettingsHref,
  type BorealShellAccountView,
  type BorealShellModal,
} from "@/lib/boreal/navigation/shell-links"
import {
  BOREAL_AGENT_DIRECT_SUPPLY_ID,
  BOREAL_AGENT_DISPLAY_NAME,
  BOREAL_AGENT_EXTERNAL_ID,
} from "@/lib/boreal/boreal-agent"
import { getMountedAgentStarterPrompts } from "@/lib/boreal/agents/mounted-agent-starter-prompts"
import {
  getAutonomousAgentKeyFromSourceCapabilityId,
  getPublicReadySpecialistDisplayName,
  getPublicReadySpecialistMeta,
} from "@/lib/boreal/agents/public-ready-specialists"
import {
  buildPresetTeamSourceCapabilityId,
  getPresetTeamDefinition,
  getPresetTeamDefinitionFromSourceCapabilityId,
  getPresetTeamStarterPromptInventory,
  inferPresetTeamDefinitionFromRequestLike,
  resolvePresetTeamDefinitionFromParticipants,
  resolvePresetTeamDefinitionFromBlueprint,
} from "@/lib/boreal/swarm/preset-teams"
import {
  getPresetRoomRetryDelayMs,
  PRESET_ROOM_ADVANCE_DELAY_MS,
} from "@/lib/boreal/swarm/preset-room-control"
import { inferPresetRoomStateFromMessages } from "@/lib/boreal/swarm/preset-team-state"
import type { PresetTeamState } from "@/lib/boreal/swarm/team-blueprint"
import type { NormalizedConnectedWallet } from "@/lib/boreal/integrations/service-providers/wallets/reown"
import {
  compactHexLike,
  parseSolanaThreadMessage,
} from "@/lib/boreal/solana-thread-actions"
import { cn } from "@/lib/utils"
import { usePayment } from "@/hooks/use-payment"
import { useShellData } from "@/components/shell-data-provider"
import {
  inferInvocationAccess,
  parsePaymentResponseHeader,
} from "@/lib/boreal/integrations/service-providers/payments/x402"
import {
  getPublicPaper,
  listPublicPapers,
  type PublicPaperRecord,
} from "@/lib/boreal/papers-data"
import {
  clearDraftSessions as clearStoredDraftSessions,
  listDraftSessions,
  removeDraftSession,
  upsertDraftSession,
} from "@/lib/boreal/shell-cache/draft-sessions"
import type { DraftSessionRecord } from "@/lib/boreal/shell-cache/types"

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
import { FocusSheet } from "@/components/workboard/focus-sheet"

type ChatMessage = {
  content: string
  createdAt: number
  debugEvents?: ChatAssistantDebugEvent[]
  id: string
  presetTeamTurns?: PresetTeamStreamTurn[]
  role: "assistant" | "user"
}

type BorealTimelineSession = BorealChatSessionRecord[number]

type CenterViewTab = "activity" | "chat" | "participants" | "workspace"
type CenterSheetView = "about" | "agent" | "developers" | "papers" | "roadmap"
type MountedComposerAgent = {
  actorKind: CatalogEntry["actorKind"]
  directAgentKey: string | null
  kind?: "direct_agent" | "preset_team"
  memberPreview?: Array<{
    accentTone?: "amber" | "emerald" | "sky" | "violet"
    displayName: string
    initials: string
    memberKey: string
    roleLabel: string
  }>
  presetTeamKey?: string | null
  sourceCapabilityId: string | null
  supplyId: string
  title: string
}

type LocalRuntimeDraft = {
  description: string
  executorUrl: string
  runtimeKind: "custom" | "lmstudio" | "ollama"
  title: string
}

type RequestDesktopEnvelope = {
  assignment: DesktopNodeAssignment | null
  created?: boolean
  node: DesktopNodeEnvelope["node"] | null
  requestToken: string | null
}

const DEFAULT_MOUNTED_COMPOSER_AGENT: MountedComposerAgent = {
  actorKind: "agent",
  directAgentKey: null,
  sourceCapabilityId: "autonomous-agent:boreal-agent",
  supplyId: BOREAL_AGENT_DIRECT_SUPPLY_ID,
  title: BOREAL_AGENT_DISPLAY_NAME,
}

const centerSheetViewByHref = {
  "/about": "about",
  "/agents": "agent",
  "/docs": "developers",
  "/developers/agents": "developers",
  "/papers": "papers",
  "/roadmap": "roadmap",
} as const satisfies Record<string, CenterSheetView>

const centerSheetHrefByView: Record<CenterSheetView, string> = {
  about: "/about",
  agent: "/agents",
  developers: "/docs",
  papers: "/papers",
  roadmap: "/roadmap",
}

const centerSheetTitleByView: Record<CenterSheetView, string> = {
  about: "About",
  agent: "Agent",
  developers: "Docs",
  papers: "Papers",
  roadmap: "Roadmap",
}

const centerSheetNavHrefs = Object.keys(centerSheetViewByHref)

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
      "Let Boreal draft a stronger work profile and one primary offer.",
    icon: CircleUserRoundIcon,
    prompt:
      "Help me optimize my Boreal work profile and draft one strong primary offer for the kind of work I want.",
    title: "Improve my profile",
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
    title: "Show me the market",
  },
  {
    description:
      "Route Solana work into the specialist that handles wallet checks, approval steps, and risk notes.",
    icon: WalletIcon,
    prompt:
      "I need Solana help. Plan a mainnet swap or staking flow with wallet requirements, approval steps, and risk notes.",
    title: "Plan a Solana swap or stake",
  },
  {
    description:
      "Draft launch-ready media and route it into the right execution path.",
    icon: ClapperboardIcon,
    prompt:
      "Generate a short voiceover for a product announcement in a warm tone.",
    title: "Draft a launch voiceover",
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
const SHOULD_USE_CLIENT_PRESET_ROOM_FALLBACK =
  process.env.NODE_ENV !== "production"
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

const emptyLocalRuntimeDraft = (): LocalRuntimeDraft => ({
  description: "Private local runtime for this request.",
  executorUrl: "http://127.0.0.1:8790/boreal/chat",
  runtimeKind: "ollama",
  title: "Ollama Runtime",
})

function getRenderableChatMessageContent(input: {
  content: string
  presetTeamTurns?: PresetTeamStreamTurn[]
}) {
  const streamedTurnContent =
    [...(input.presetTeamTurns ?? [])]
      .reverse()
      .find((turn) => turn.content?.trim())
      ?.content?.trim() ?? ""

  return streamedTurnContent || input.content.trim()
}

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
  const chatMode = normalizeChatMode(searchParams.get("chat"))
  const pipelineTraceEnabled =
    searchParams.get("trace") === "1" || searchParams.get("debug") === "1"
  const requestedAccountView = normalizeShellAccountView(
    searchParams.get("account")
  )
  const requestedCenterTab = searchParams.get("view")
  const requestedCenterSheet = normalizeCenterSheetView(searchParams.get("sheet"))
  const requestedModal = normalizeShellModal(searchParams.get("modal"))
  const requestedPaperSlug = normalizePublicPaperSlug(
    searchParams.get("paper"),
    publicPapers
  )
  const requestedProfileId = normalizeProfileQuery(searchParams.get("profile"))
  const requestedDeepLinkedSheet =
    requestedProfileId ? null : requestedPaperSlug ? "papers" : requestedCenterSheet
  const selectedCenterTab = normalizeCenterViewTab(requestedCenterTab)
  const workspaceTab = normalizeWorkspaceTab(searchParams.get("browse"))

  const [conversationId, setConversationId] = useState<string | undefined>()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [draftSessions, setDraftSessions] = useState<DraftSessionRecord[]>([])
  const [isDraftSessionsReady, setIsDraftSessionsReady] = useState(false)
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
  const [isAccountSheetOpen, setIsAccountSheetOpen] = useState(false)
  const [isMobileIntentSidebarOpen, setIsMobileIntentSidebarOpen] =
    useState(false)
  const [isMobileWorkspaceOpen, setIsMobileWorkspaceOpen] = useState(false)
  const [isRefreshingVideo, setIsRefreshingVideo] = useState(false)
  const [composerText, setComposerText] = useState(() => seededPrompt ?? "")
  const [mountedComposerAgents, setMountedComposerAgents] = useState<
    MountedComposerAgent[]
  >([])
  const [pendingApprovalIntentId, setPendingApprovalIntentId] = useState<
    string | null
  >(null)
  const [matchQueryDraft, setMatchQueryDraft] = useState<string | null>(null)
  const [proposalMessage, setProposalMessage] = useState("")
  const [proposalDraft, setProposalDraft] =
    useState<ProposalDraft>(emptyProposalDraft)
  const [isDraftingProposal, setIsDraftingProposal] = useState(false)
  const [isSubmittingProposal, setIsSubmittingProposal] = useState(false)
  const [approvingProposalId, setApprovingProposalId] = useState<string | null>(
    null
  )
  const [approvingMatchedSupplyId, setApprovingMatchedSupplyId] = useState<
    string | null
  >(null)
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
  const [isProfileAvailabilityUpdating, setIsProfileAvailabilityUpdating] =
    useState(false)
  const [isSettingDefaultPayoutWalletId, setIsSettingDefaultPayoutWalletId] =
    useState<string | null>(null)
  const [isDraftingProfileBuilder, setIsDraftingProfileBuilder] =
    useState(false)
  const [isSavingProfileBuilder, setIsSavingProfileBuilder] = useState(false)
  const [isDesktopConnectLaunching, setIsDesktopConnectLaunching] =
    useState(false)
  const [accountNotice, setAccountNotice] = useState<string | null>(null)
  const [profileBuilderMessage, setProfileBuilderMessage] = useState("")
  const [profileBuilderDraft, setProfileBuilderDraft] =
    useState<ProfileBuilderDraft>(createEmptyProfileBuilderDraft())
  const [isLocalRuntimeDialogOpen, setIsLocalRuntimeDialogOpen] =
    useState(false)
  const [isCreatingLocalRuntime, setIsCreatingLocalRuntime] = useState(false)
  const [invitingLocalRuntimeSupplyId, setInvitingLocalRuntimeSupplyId] =
    useState<string | null>(null)
  const [localRuntimeDraft, setLocalRuntimeDraft] =
    useState<LocalRuntimeDraft>(emptyLocalRuntimeDraft())
  const composerTextareaRef = useRef<HTMLTextAreaElement | null>(null)
  const presetRoomAdvanceTimeoutRef = useRef<number | null>(null)
  const presetRoomRetryTimeoutRef = useRef<number | null>(null)
  const lastPresetRoomAdvanceKeyRef = useRef<string | null>(null)
  const activeChatAbortControllerRef = useRef<AbortController | null>(null)
  const [centerSheetView, setCenterSheetView] =
    useState<CenterSheetView | null>(null)
  const [centerSheetPaperSlug, setCenterSheetPaperSlug] = useState<string | null>(
    null
  )
  const [isCenterSheetOpen, setIsCenterSheetOpen] = useState(false)
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null)
  const [activePresetRoomTurn, setActivePresetRoomTurn] =
    useState<PresetTeamStreamTurn | null>(null)
  const [clientPresetRoomRetryStatus, setClientPresetRoomRetryStatus] = useState<{
    attempt: number
    delayMs: number
    displayName: string
    turnIndex: number
  } | null>(null)
  const [hasHydrated, setHasHydrated] = useState(false)
  const hasPromptedAccountSignInRef = useRef(false)
  const previousRequestedModalRef = useRef<BorealShellModal | null>(null)

  const { data: session, status: sessionStatus } = useSession()
  const ownerExternalId = session?.user?.id
  const isXAuthenticated =
    sessionStatus === "authenticated" && Boolean(ownerExternalId)
  const draftOwnerScope =
    isXAuthenticated && ownerExternalId
      ? (`user:${ownerExternalId}` as const)
      : ("public" as const)
  const isPublicDiscoveryOnly = !isXAuthenticated
  const {
    connectedWallets,
    defaultWallet,
    defaultWalletAddress,
    isWalletConnected,
    isWalletConnecting,
    isWalletReady,
    openWalletModal,
    payWithX402,
    solanaConnection,
    walletProvider,
  } = usePayment()
  const {
    activeCart,
    checkoutHistory,
    isReady: isShellDataReady,
    myProfileRecord,
    purgePublicMarket,
    refreshShellData,
    walletAccounts,
  } = useShellData()

  useEffect(() => {
    setHasHydrated(true)
  }, [])

  function handleOpenWalletModal() {
    void openWalletModal()
  }

  const walletUiReady = hasHydrated ? isWalletReady : false
  const walletUiConnecting = hasHydrated ? isWalletConnecting : false
  const walletUiAddress = hasHydrated ? defaultWalletAddress : null
  const walletButtonLabel = walletUiConnecting
    ? "Connecting..."
    : walletUiAddress
      ? "Manage wallet"
      : "Connect Solana"

  function clearPresetRoomAdvanceTimeout() {
    if (presetRoomAdvanceTimeoutRef.current !== null) {
      window.clearTimeout(presetRoomAdvanceTimeoutRef.current)
      presetRoomAdvanceTimeoutRef.current = null
    }
  }

  function clearPresetRoomRetryTimeout() {
    if (presetRoomRetryTimeoutRef.current !== null) {
      window.clearTimeout(presetRoomRetryTimeoutRef.current)
      presetRoomRetryTimeoutRef.current = null
    }
  }

  function stopActivePresetRoomRun() {
    clearPresetRoomAdvanceTimeout()
    clearPresetRoomRetryTimeout()
    lastPresetRoomAdvanceKeyRef.current = null
    activeChatAbortControllerRef.current?.abort()
    activeChatAbortControllerRef.current = null
    setActivePresetRoomTurn(null)
    setClientPresetRoomRetryStatus(null)
    setMessages((current) =>
      current.filter(
        (message) =>
          !(
            message.role === "assistant" &&
            message.presetTeamTurns &&
            message.presetTeamTurns.length > 0
        )
      )
    )
  }

  async function advancePresetRoomTurn(
    turn: PresetTeamStreamTurn,
    input: {
      cycleNumber: number
      expectedTurnIndex: number
    },
    options?: {
      assistantMessageId?: string
      retryAttempt?: number
    }
  ) {
    if (!activeIntentId) {
      return
    }

    clearPresetRoomAdvanceTimeout()
    clearPresetRoomRetryTimeout()
    setErrorMessage(null)
    setClientPresetRoomRetryStatus(null)
    setIsSubmitting(true)
    setActivePresetRoomTurn(turn)
    lastPresetRoomAdvanceKeyRef.current = `${input.cycleNumber}:${input.expectedTurnIndex}`
    const assistantMessageId = options?.assistantMessageId ?? crypto.randomUUID()
    const retryAttempt = options?.retryAttempt ?? 0
    const createdAt = Date.now()
    const abortController = new AbortController()

    activeChatAbortControllerRef.current?.abort()
    activeChatAbortControllerRef.current = abortController

    if (!options?.assistantMessageId) {
      setMessages((current) => [
        ...current,
        {
          content: "",
          createdAt,
          id: assistantMessageId,
          presetTeamTurns: [{ ...turn, state: "pending" }],
          role: "assistant",
        },
      ])
    }

    try {
      const response = await fetch("/api/chat", {
        body: JSON.stringify({
          conversationId:
            activeConversationId ?? requestDetail?.conversationId ?? crypto.randomUUID(),
          context: buildChatUiContext({
            activeIntentId,
            composerAgents: activeComposerAgents,
            pendingProviderSelection:
              effectiveWorkspace.kind === "provider_selection"
                ? effectiveWorkspace.selection
                : null,
            requestDetail,
            selectedCenterTab: activeCenterTab,
            walletAddress: defaultWalletAddress,
            workspaceTab,
            presetRoomCommand: {
              command: "advance_next_turn",
              cycleNumber: input.cycleNumber,
              expectedTurnIndex: input.expectedTurnIndex,
            },
          }),
          debugPipeline: pipelineTraceEnabled,
          message: "__preset_room_advance__",
          provider: "boreal-agent",
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
        signal: abortController.signal,
      })

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string }
        const failure = new Error(payload.error ?? "Chat request failed.")
        ;(failure as Error & { status?: number }).status = response.status
        throw failure
      }

      await consumeChatStream({
        assistantMessageId,
        response,
        setMessages,
      })
    } catch (error) {
      if (isAbortError(error)) {
        return
      }

      const retryDelayMs = getPresetRoomRetryDelayMs(retryAttempt, error)

      if (retryDelayMs !== null) {
        setClientPresetRoomRetryStatus({
          attempt: retryAttempt + 1,
          delayMs: retryDelayMs,
          displayName: turn.displayName,
          turnIndex: turn.turnIndex,
        })
        setErrorMessage(
          `${turn.displayName} hit a temporary API limit. borealizing again in ${Math.round(
            retryDelayMs / 1000
          )}s (attempt ${retryAttempt + 1}).`
        )
        presetRoomRetryTimeoutRef.current = window.setTimeout(() => {
          void advancePresetRoomTurn(turn, input, {
            assistantMessageId,
            retryAttempt: retryAttempt + 1,
          })
        }, retryDelayMs)
        return
      }

      setClientPresetRoomRetryStatus(null)
      setMessages((current) =>
        current.filter((message) => message.id !== assistantMessageId)
      )
      setErrorMessage(
        error instanceof Error
          ? `${turn.displayName} could not continue automatically. ${error.message}`
          : `${turn.displayName} could not continue automatically.`
      )
    } finally {
      if (activeChatAbortControllerRef.current === abortController) {
        activeChatAbortControllerRef.current = null
      }
      if (presetRoomRetryTimeoutRef.current === null) {
        setActivePresetRoomTurn(null)
      }
      setIsSubmitting(false)
    }
  }
  const sidebarIntentsResult = useQuery(
    convexFunctionRefs.listSidebarIntents,
    isXAuthenticated ? { limit: 24, ownerExternalId } : "skip"
  )
  const sidebarIntents = (sidebarIntentsResult ?? []) as SidebarIntentPreview[]
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
  const activeProfileLookup = activeProfileId
    ? activeProfileId === "boreal-agent"
      ? {
        externalId: BOREAL_AGENT_EXTERNAL_ID,
        kind: "externalId" as const,
      }
      : parseProfileLookup(activeProfileId)
    : null
  const profileSheetDetail = useQuery(
    convexFunctionRefs.getPublicProfile,
    activeProfileLookup?.kind === "profileId"
      ? {
        ownerExternalId,
        profileId: activeProfileLookup.profileId,
      }
      : "skip"
  ) as WorkerProfileDetail | undefined
  const profileSheetDetailByExternalId = useQuery(
    convexFunctionRefs.getPublicProfileByExternalId,
    activeProfileLookup?.kind === "externalId"
      ? {
        externalId: activeProfileLookup.externalId,
        ownerExternalId,
      }
      : "skip"
  ) as WorkerProfileDetail | undefined
  const borealAgentStats = useQuery(
    convexFunctionRefs.getBorealAgentStats,
    activeProfileId === "boreal-agent" ? {} : "skip"
  )
  const isRequestLoading =
    isXAuthenticated &&
    Boolean(activeIntentId) &&
    requestDetailResult === undefined
  const requestDetail = (requestDetailResult ?? null) as RequestDetail | null
  useEffect(() => {
    if (
      !activeIntentId ||
      requestDetailResult === undefined ||
      requestDetail ||
      selectedIntent
    ) {
      return
    }

    updateWorkspaceUrl({
      request: null,
      view: null,
    })
    setErrorMessage("That request is no longer available.")
  }, [
    activeIntentId,
    requestDetail,
    requestDetailResult,
    selectedIntent,
  ])
  const resolvedProfileSheetDetail =
    activeProfileLookup?.kind === "externalId"
      ? profileSheetDetailByExternalId
      : profileSheetDetail
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
  const localRuntimeSupplies = useMemo(
    () =>
      (myProfileRecord?.supplies ?? []).filter((supply) =>
        isLocalRuntimeSupply(supply)
      ),
    [myProfileRecord?.supplies]
  )
  const invitedRuntimeSupplyIds = requestDetail?.assignment?.runtimeSupplyIds ?? []
  const canInviteLocalRuntime = Boolean(
    activeIntentId && requestDetail?.access?.isOwner
  )
  const isConversationLoading =
    isXAuthenticated &&
    Boolean(!activeIntentId) &&
    (!isShellDataReady || !isDraftSessionsReady) &&
    messages.length === 0
  const isMissingConversation = false
  const isArchivedTranscript = Boolean(
    requestDetail?.intent?.status === "closed" &&
    requestDetail.intent.closedReason === "archived_by_user"
  )
  const requestComposerAgents = useMemo(
    () => deriveRequestComposerAgents(requestDetail),
    [requestDetail]
  )
  const activePresetDefinition = useMemo(
    () => resolveRequestPresetDefinition(requestDetail, selectedIntent),
    [requestDetail, selectedIntent]
  )
  const activePresetRoomState = useMemo(() => {
    if (!activePresetDefinition || !requestDetail) {
      return null
    }

    return (
      requestDetail.assignment?.team?.presetState ??
      inferPresetRoomStateFromMessages({
        cycleNumber: requestDetail.assignment?.team?.presetState?.cycleNumber ?? 1,
        definition: activePresetDefinition,
        messages: requestDetail.messages.map((message) => ({
          createdAt: message.createdAt,
          sender: {
            externalId: message.sender.externalId ?? null,
            isCurrentUser: message.sender.isCurrentUser,
          },
        })),
      })
    )
  }, [activePresetDefinition, requestDetail])
  const isBorealDefaultMounted =
    !activeIntentId && mountedComposerAgents.length === 0
  const activeComposerAgents = activeIntentId
    ? requestComposerAgents
    : mountedComposerAgents.length > 0
      ? mountedComposerAgents
      : [DEFAULT_MOUNTED_COMPOSER_AGENT]
  const pendingPresetRoomTurn = useMemo(
    () =>
      buildPendingPresetTeamTurns({
        activeIntentId,
        presetDefinition: activePresetDefinition,
        presetState: activePresetRoomState,
      })?.[0] ?? null,
    [activeIntentId, activePresetDefinition, activePresetRoomState]
  )
  const presetRoomRetryStatus = useMemo(() => {
    if (clientPresetRoomRetryStatus) {
      return {
        attempt: clientPresetRoomRetryStatus.attempt,
        displayName: clientPresetRoomRetryStatus.displayName,
        lastError: null,
        turnIndex: clientPresetRoomRetryStatus.turnIndex,
      }
    }

    if (
      !pendingPresetRoomTurn ||
      !activePresetRoomState ||
      activePresetRoomState.runStatus !== "running" ||
      !activePresetRoomState.retryScheduledAt ||
      activePresetRoomState.retryAttempt <= 0
    ) {
      return null
    }

    return {
      attempt: activePresetRoomState.retryAttempt,
      displayName: pendingPresetRoomTurn.displayName,
      lastError: activePresetRoomState.lastError,
      turnIndex: pendingPresetRoomTurn.turnIndex,
    }
  }, [activePresetRoomState, clientPresetRoomRetryStatus, pendingPresetRoomTurn])
  const mountedComposerStarterPromptOptions = getMountedComposerStarterPrompts(
    activeComposerAgents
  )
  const mountedTeamLabel = formatMountedComposerTeamLabel(activeComposerAgents)
  const homeComposerPlaceholder =
    !activeIntentId && mountedComposerAgents.length > 0
      ? `Describe the task for ${mountedTeamLabel}. Boreal will create the request and start that team right away.`
      : "I'm afraid you can also ask me anything. Boreal can answer first, then match and route the work."
  const threadComposerPlaceholder =
    activeIntentId && requestComposerAgents.length > 0
      ? `Reply to ${mountedTeamLabel}, coordinate on the request, or keep the team moving.`
      : "Ask a question, coordinate on a request, or ask Boreal for help."
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
  const connectedRuntimeWalletAddress =
    connectedWallets.find(
      (wallet) => wallet.networkKey === runtimeDefaultNetworkKey
    )?.address ?? null
  const desktopConnectWalletAddress =
    connectedRuntimeWalletAddress ??
    walletAccounts.find(
      (account) =>
        account.networkKey === runtimeDefaultNetworkKey && account.isDefaultBuyer
    )?.walletAddress ??
    walletAccounts.find(
      (account) =>
        account.networkKey === runtimeDefaultNetworkKey && account.isDefaultPayout
    )?.walletAddress ??
    walletAccounts.find(
      (account) => account.networkKey === runtimeDefaultNetworkKey
    )?.walletAddress ??
    null
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
  const inviteRuntimeToRequest = useMutation(
    convexFunctionRefs.inviteRuntimeToRequest
  )
  const setDefaultPayoutWalletAccount = useMutation(
    convexFunctionRefs.setDefaultPayoutWalletAccount
  )

  const requestWorkspace = requestDetail?.intent
    ? buildWorkspaceFromRequestDetail(requestDetail)
    : null

  const requestMessages: ChatMessage[] =
    requestDetail?.messages
      .filter((message) => shouldRenderRequestMessageInChat(message))
      .map((message) => ({
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

  useEffect(() => {
    if (!SHOULD_USE_CLIENT_PRESET_ROOM_FALLBACK) {
      return
    }

    clearPresetRoomAdvanceTimeout()
    clearPresetRoomRetryTimeout()

    if (
      !activeIntentId ||
      isMarkingRequestFulfilled ||
      !requestDetail?.access?.isOwner ||
      (requestDetail.intent?.status !== "claimed" &&
        requestDetail.intent?.status !== "in_progress") ||
      !pendingPresetRoomTurn
    ) {
      return
    }

    const presetState = activePresetRoomState

    if (
      !presetState ||
      presetState.runStatus !== "running" ||
      isSubmitting ||
      activePresetRoomTurn
    ) {
      if (!presetState || presetState.runStatus !== "running") {
        lastPresetRoomAdvanceKeyRef.current = null
      }
      return
    }

    if ((presetState.retryAttempt ?? 0) > 0 && presetState.retryScheduledAt) {
      return
    }

    const advanceKey = `${presetState.cycleNumber}:${presetState.nextTurnIndex ?? 0}`

    if (lastPresetRoomAdvanceKeyRef.current === advanceKey) {
      return
    }

    presetRoomAdvanceTimeoutRef.current = window.setTimeout(() => {
      void advancePresetRoomTurn(pendingPresetRoomTurn, {
        cycleNumber: presetState.cycleNumber,
        expectedTurnIndex: presetState.nextTurnIndex ?? 0,
      })
    }, PRESET_ROOM_ADVANCE_DELAY_MS)

    return () => {
      clearPresetRoomAdvanceTimeout()
      clearPresetRoomRetryTimeout()
    }
  }, [
    activeIntentId,
    activePresetRoomTurn,
    activePresetRoomState,
    isMarkingRequestFulfilled,
    isSubmitting,
    pendingPresetRoomTurn,
    requestDetail,
  ])

  useEffect(() => {
    if (activeIntentId) {
      return
    }

    clearPresetRoomAdvanceTimeout()
    clearPresetRoomRetryTimeout()
    lastPresetRoomAdvanceKeyRef.current = null
    setActivePresetRoomTurn(null)
    setClientPresetRoomRetryStatus(null)
  }, [activeIntentId])

  const borealChatSessions = useMemo(
    () =>
      draftSessions.map((session) =>
        mapDraftSessionToTimelineSession(session),
      ),
    [draftSessions],
  )
  const borealTimelineSessions = useMemo(
    () => borealChatSessions.slice(-borealChatSessionLimit),
    [borealChatSessionLimit, borealChatSessions],
  )
  const hasMoreBorealSessions = borealChatSessions.length > borealChatSessionLimit

  const effectiveWorkspace = activeIntentId
    ? workspace.kind === "provider_selection"
      ? workspace
      : requestWorkspace ?? workspace
    : workspace
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

  function buildHumanProfileOptimizerBrief() {
    const profile = myProfileRecord?.profile ?? null
    const primarySupply = myProfileRecord?.supplies[0] ?? null
    const lines = [
      "Optimize my human work profile for Boreal.",
      "Rewrite it for sharper discovery, better matching, and clearer public positioning.",
      "Keep it specific, honest, and ready for paid work.",
    ]

    if (profile?.displayName) {
      lines.push(`Display name: ${profile.displayName}`)
    }

    if (profile?.headline) {
      lines.push(`Current headline: ${profile.headline}`)
    }

    if (profile?.bio) {
      lines.push(`Current bio: ${profile.bio}`)
    }

    if (profile?.capabilityTags.length) {
      lines.push(`Capabilities: ${profile.capabilityTags.join(", ")}`)
    }

    if (profile?.skillTags.length) {
      lines.push(`Skills: ${profile.skillTags.join(", ")}`)
    }

    if (primarySupply?.title) {
      lines.push(`Primary offer: ${primarySupply.title}`)
    }

    if (primarySupply?.description) {
      lines.push(`Offer description: ${primarySupply.description}`)
    }

    return lines.join("\n")
  }

  async function reloadDraftSessions() {
    const storedSessions = await listDraftSessions(draftOwnerScope)
    setDraftSessions(storedSessions)
    return storedSessions
  }

  async function refreshRequestShellData() {
    purgePublicMarket(["requests"])
  }

  function openAccountSheet() {
    if (!isXAuthenticated) {
      openXSignIn(buildAccountSettingsHref())
      return
    }

    setCenterSheetView(null)
    setCenterSheetPaperSlug(null)
    setIsCenterSheetOpen(false)
    setActiveProfileId(null)
    setIsAccountSheetOpen(true)
    updateWorkspaceUrl({
      account: "settings",
    })
  }

  function closeAccountSheet() {
    setIsAccountSheetOpen(false)
    updateWorkspaceUrl({
      account: null,
    })
  }

  function openMyProfileSurface() {
    const myProfileId = myProfileRecord?.profile?._id ?? null

    if (myProfileId) {
      openProfileSheet(myProfileId)
      return
    }

    openProfileBuilder()
  }

  function openProfileBuilder(options?: {
    draft?: ProfileBuilderDraft
    sourceMessage?: string
  }) {
    setProfileBuilderDraft(options?.draft ?? buildInitialProfileBuilderDraft())
    setProfileBuilderMessage(
      options?.sourceMessage ??
      activeProfileBuilderWorkspace?.sourceBrief ??
      composerText.trim()
    )
    setIsProfileBuilderOpen(true)
    setIsAccountSheetOpen(false)
    updateWorkspaceUrl({
      modal: "profile-builder",
    })
  }

  function closeProfileBuilder() {
    setIsProfileBuilderOpen(false)
    updateWorkspaceUrl({
      modal: null,
    })
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

      if (result.updated) {
        await refreshShellData(["profile-summary", "wallet-summary"])
      }

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

  async function handleToggleProfileAvailability(checked: boolean) {
    if (!ownerExternalId) {
      setAccountNotice("Sign in with X first before updating your profile.")
      return
    }

    setIsProfileAvailabilityUpdating(true)
    setAccountNotice(null)

    try {
      const draft = myProfileRecord
        ? buildProfileBuilderDraftFromRecord(myProfileRecord)
        : createEmptyProfileBuilderDraft(session?.user?.name ?? "")

      draft.profile.availabilityStatus = checked ? "available" : "unavailable"
      draft.profile.isPublic = checked

      const result = await upsertMyProfile(
        profileBuilderToProfileMutationInput(draft, {
          displayName:
            (draft.profile.displayName || session?.user?.name) ?? undefined,
          externalId: ownerExternalId,
          handle: undefined,
        })
      )

      if (!result.saved) {
        throw new Error("Could not update profile availability.")
      }

      await refreshShellData(["profile-summary"])

      setAccountNotice(
        checked
          ? "Profile is now available for work."
          : "Profile is now hidden from Boreal work discovery."
      )
    } catch (error) {
      setAccountNotice(
        error instanceof Error
          ? error.message
          : "Could not update profile availability."
      )
    } finally {
      setIsProfileAvailabilityUpdating(false)
    }
  }

  async function handleConnectDesktop() {
    if (!ownerExternalId) {
      setAccountNotice("Sign in with X first so Boreal can link Boreal Desktop.")
      return
    }

    if (!desktopConnectWalletAddress) {
      setAccountNotice(
        "Connect a Solana mainnet wallet first so Boreal Desktop can inherit this account identity."
      )
      return
    }

    setIsDesktopConnectLaunching(true)
    setAccountNotice(null)

    try {
      const response = await fetch("/api/account/desktop-connect", {
        body: JSON.stringify({
          walletAddress: connectedRuntimeWalletAddress ?? undefined,
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      })
      const payload = (await response.json()) as {
        error?: string
        launchUrl?: string
      }

      if (!response.ok || !payload.launchUrl) {
        throw new Error(
          payload.error ?? "Could not prepare the Boreal Desktop connect flow."
        )
      }

      setAccountNotice(
        "Opening Boreal Desktop. Allow the browser protocol prompt if it appears."
      )
      window.location.assign(payload.launchUrl)
    } catch (error) {
      setAccountNotice(
        error instanceof Error
          ? error.message
          : "Could not prepare the Boreal Desktop connect flow."
      )
    } finally {
      setIsDesktopConnectLaunching(false)
    }
  }

  async function handleDraftProfileBuilder(
    message: string,
    baseDraft?: ProfileBuilderDraft
  ) {
    const trimmedMessage = message.trim()

    if (!trimmedMessage || isDraftingProfileBuilder) {
      return
    }

    setErrorMessage(null)
    setProfileBuilderMessage(trimmedMessage)
    setIsDraftingProfileBuilder(true)

    try {
      const response = await fetch("/api/profile-builder/draft", {
        body: JSON.stringify({
          message: trimmedMessage,
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
        throw new Error(payload.error ?? "Could not draft the public setup.")
      }

      setProfileBuilderDraft((current) =>
        mergeProfileBuilderDraft(baseDraft ?? current, draftedProfile)
      )
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Could not draft the public setup."
      )
    } finally {
      setIsDraftingProfileBuilder(false)
    }
  }

  async function invokeHumanProfileOptimizer() {
    if (!isXAuthenticated) {
      openXSignIn(buildAccountSettingsHref())
      return
    }

    const baseDraft = buildInitialProfileBuilderDraft()
    const sourceMessage = buildHumanProfileOptimizerBrief()

    closeProfileSheet()
    openProfileBuilder({
      draft: baseDraft,
      sourceMessage,
    })
    await handleDraftProfileBuilder(sourceMessage, baseDraft)
  }

  async function handleInvokeListing(listing: CatalogEntry) {
    const mountedAgent = resolveMountedComposerAgent(listing)

    if (!mountedAgent) {
      return
    }

    const nextMountedComposerAgents =
      mountedAgent.supplyId === DEFAULT_MOUNTED_COMPOSER_AGENT.supplyId
        ? []
        : isMountedPresetTeam(mountedAgent)
          ? mountedComposerAgents.some(
              (agent) => agent.supplyId === mountedAgent.supplyId
            )
            ? []
            : [mountedAgent]
          : toggleMountedComposerAgents(
              mountedComposerAgents.filter(
                (agent) => !isMountedPresetTeam(agent)
              ),
              mountedAgent
            )

    setMountedComposerAgents(nextMountedComposerAgents)
    updateWorkspaceUrl({
      chat: null,
    })

    if (!activeIntentId) {
      setConversationId(undefined)
      setPendingApprovalIntentId(null)
      setWorkspace(emptyWorkspace)

      if (nextMountedComposerAgents.length > 0) {
        setMessages([buildMountedTeamIntroMessage(nextMountedComposerAgents)])
      } else if (
        messages.length === 1 &&
        messages[0]?.id === MOUNTED_TEAM_THREAD_MESSAGE_ID
      ) {
        setMessages([])
      }
    }

    if (window.matchMedia("(max-width: 1023px)").matches) {
      setIsMobileWorkspaceOpen(false)
    }

    focusComposer()
  }

  function updateWorkspaceUrl(next: {
    account?: BorealShellAccountView | null
    browse?: WorkspaceTab | null
    chat?: string | null
    modal?: BorealShellModal | null
    paper?: string | null
    profile?: string | null
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
      params.delete("account")
      params.delete("modal")
      params.delete("profile")
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
      params.delete("account")
      params.delete("profile")
      params.set("sheet", next.sheet)

      if (next.sheet !== "papers") {
        params.delete("paper")
      }
    }

    if (next.paper === null) {
      params.delete("paper")
    } else if (next.paper) {
      params.delete("account")
      params.delete("profile")
      params.set("sheet", "papers")
      params.set("paper", next.paper)
    }

    if (next.account === null) {
      params.delete("account")
    } else if (next.account) {
      params.delete("modal")
      params.delete("profile")
      params.delete("sheet")
      params.delete("paper")
      params.set("account", next.account)
    }

    if (next.profile === null) {
      params.delete("profile")
    } else if (next.profile) {
      params.delete("account")
      params.delete("modal")
      params.delete("sheet")
      params.delete("paper")
      params.set("profile", next.profile)
    }

    if (next.modal === null) {
      params.delete("modal")
    } else if (next.modal) {
      params.delete("account")
      params.delete("profile")
      params.set("modal", next.modal)
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
    let cancelled = false

    async function hydrateDraftSessions() {
      setIsDraftSessionsReady(false)
      const storedSessions = await listDraftSessions(draftOwnerScope)

      if (cancelled) {
        return
      }

      setDraftSessions(storedSessions)
      setIsDraftSessionsReady(true)
    }

    void hydrateDraftSessions()

    return () => {
      cancelled = true
    }
  }, [draftOwnerScope])

  useEffect(() => {
    if (
      activeIntentId ||
      pendingApprovalIntentId ||
      !isDraftSessionsReady ||
      !conversationId ||
      messages.length === 0
    ) {
      return
    }

    const nextDraftSession: DraftSessionRecord = {
      createdAt: draftSessions.find(
        (session) => session.draftSessionId === conversationId,
      )?.createdAt ?? messages[0]?.createdAt ?? Date.now(),
      draftSessionId: conversationId,
      messages: messages.map((message) => ({
        content: message.content,
        createdAt: message.createdAt,
        id: message.id,
        role: message.role,
      })),
      mountedAgents: mountedComposerAgents,
      updatedAt: messages[messages.length - 1]?.createdAt ?? Date.now(),
      workspace,
    }

    void upsertDraftSession(draftOwnerScope, nextDraftSession).then(async () => {
      const storedSessions = await listDraftSessions(draftOwnerScope)
      setDraftSessions(storedSessions)
    })
  }, [
    activeIntentId,
    conversationId,
    draftOwnerScope,
    draftSessions,
    isDraftSessionsReady,
    messages,
    mountedComposerAgents,
    pendingApprovalIntentId,
    workspace,
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
      if (requestedDeepLinkedSheet) {
        setCenterSheetView(requestedDeepLinkedSheet)
        setCenterSheetPaperSlug(
          requestedDeepLinkedSheet === "papers" ? requestedPaperSlug : null
        )
        setIsCenterSheetOpen(true)
        return
      }

      setIsCenterSheetOpen(false)
      setCenterSheetView(null)
      setCenterSheetPaperSlug(null)
    })

    return () => window.cancelAnimationFrame(frame)
  }, [requestedDeepLinkedSheet, requestedPaperSlug])

  useEffect(() => {
    setActiveProfileId(requestedProfileId)
  }, [requestedProfileId])

  useEffect(() => {
    if (requestedAccountView !== "settings") {
      hasPromptedAccountSignInRef.current = false
      setIsAccountSheetOpen(false)
      return
    }

    if (sessionStatus === "loading") {
      return
    }

    if (!isXAuthenticated) {
      if (!hasPromptedAccountSignInRef.current) {
        hasPromptedAccountSignInRef.current = true
        openXSignIn(buildAccountSettingsHref())
      }
      return
    }

    hasPromptedAccountSignInRef.current = false
    setCenterSheetView(null)
    setCenterSheetPaperSlug(null)
    setIsCenterSheetOpen(false)
    setActiveProfileId(null)
    setIsAccountSheetOpen(true)
  }, [isXAuthenticated, requestedAccountView, sessionStatus])

  useEffect(() => {
    const previousRequestedModal = previousRequestedModalRef.current

    if (requestedModal === "profile-builder") {
      if (previousRequestedModal !== "profile-builder") {
        setProfileBuilderDraft(buildInitialProfileBuilderDraft())
        setProfileBuilderMessage(
          activeProfileBuilderWorkspace?.sourceBrief ?? composerText.trim()
        )
      }
      setIsProfileBuilderOpen(true)
    } else {
      setIsProfileBuilderOpen(false)
    }

    previousRequestedModalRef.current = requestedModal
  }, [
    activeProfileBuilderWorkspace,
    composerText,
    requestedModal,
    session?.user?.name,
  ])

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
      await refreshShellData(["cart-summary"])
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
      await refreshShellData(["cart-summary"])
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
      await refreshShellData(["cart-summary"])
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

      await refreshShellData(["cart-summary", "checkout-history-summary"])
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

    if (!isWalletReady || !defaultWalletAddress) {
      setErrorMessage(
        "Connect a funded Solana wallet before paying."
      )
      handleOpenWalletModal()
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

      await refreshShellData(["checkout-history-summary"])
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

  async function handleConfirmProviderRoute(input: {
    paymentReceipt?: ProviderRoutePaymentReceipt | null
    routeKey: string
    selection: ProviderSelectionState
  }) {
    if (isSubmitting) {
      return
    }

    if (!isXAuthenticated) {
      setErrorMessage("Sign in with X to chat with Boreal Agent.")
      return
    }

    setErrorMessage(null)
    clearPresetRoomAdvanceTimeout()
    clearPresetRoomRetryTimeout()
    setClientPresetRoomRetryStatus(null)

    if (
      activeIntentId &&
      requestDetail?.intent?.status === "payment_required" &&
      requestDetail.pendingPayment?.selection
    ) {
      setIsSubmitting(true)

      try {
        const response = await fetch(`/api/requests/${activeIntentId}/fund`, {
          body: JSON.stringify({
            paymentReceipt: input.paymentReceipt ?? null,
            routeKey: input.routeKey,
          }),
          headers: {
            "Content-Type": "application/json",
          },
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
              : "Failed to fund request."
          )
        }

        await refreshRequestShellData()
        setWorkspace(payload.workspace)
        setShowWorkspace(true)
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : "Failed to fund request."
        )
      } finally {
        setIsSubmitting(false)
      }

      return
    }

    setIsSubmitting(true)
    setPendingApprovalIntentId(null)

    const assistantMessageId = crypto.randomUUID()
    const now = Date.now()
    const nextConversationId = activeIntentId
      ? activeConversationId ?? requestDetail?.conversationId ?? crypto.randomUUID()
      : activeConversationId ?? crypto.randomUUID()
    const abortController = new AbortController()

    if (!activeIntentId && !activeConversationId) {
      setConversationId(nextConversationId)
    }

    activeChatAbortControllerRef.current?.abort()
    activeChatAbortControllerRef.current = abortController

    setMessages((current) => [
      ...current,
      {
        content: "",
        createdAt: now,
        id: assistantMessageId,
        role: "assistant" as const,
      },
    ])

    try {
      const response = await fetch("/api/chat", {
        body: JSON.stringify({
          conversationId: nextConversationId,
          context: buildChatUiContext({
            activeIntentId,
            composerAgents: activeComposerAgents,
            pendingProviderSelection: input.selection,
            providerSelectionCommand: {
              command: "confirm_provider_route",
              paymentReceipt: input.paymentReceipt ?? null,
              promptHash: input.selection.promptHash,
              routeKey: input.routeKey,
            },
            requestDetail,
            selectedCenterTab: activeCenterTab,
            walletAddress:
              input.paymentReceipt?.walletAddress ?? defaultWalletAddress ?? null,
            workspaceTab,
          }),
          debugPipeline: pipelineTraceEnabled,
          message: activeIntentId
            ? "__confirm_provider_route__"
            : input.selection.promptText,
          provider: "boreal-agent",
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
        signal: abortController.signal,
      })

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string }
        throw new Error(payload.error ?? "Chat request failed.")
      }

      let streamedRequestIntentId: string | null = null
      const finalPayload = await consumeChatStream({
        assistantMessageId,
        onRequestOpened: (intentId) => {
          streamedRequestIntentId = intentId

          if (activeIntentId) {
            return
          }

          updateWorkspaceUrl({
            browse: "workers",
            chat: null,
            request: intentId,
            view: "chat",
          })
          setConversationId(undefined)
          setShowWorkspace(true)
          setPendingApprovalIntentId(null)
        },
        response,
        setMessages,
      })

      setConversationId(finalPayload.conversationId)
      setWorkspace(finalPayload.workspace)

      if (!finalPayload.assistantMessage.trim()) {
        setMessages((current) =>
          current.filter((message) => message.id !== assistantMessageId)
        )
      }

      if (!activeIntentId && finalPayload.intentId && nextConversationId) {
        await removeDraftSession(draftOwnerScope, nextConversationId)
        await reloadDraftSessions()
        await refreshRequestShellData()
      }

      if (
        !activeIntentId &&
        finalPayload.intentId &&
        streamedRequestIntentId !== finalPayload.intentId
      ) {
        updateWorkspaceUrl({
          browse: "workers",
          chat: null,
          request: finalPayload.intentId,
          view: "chat",
        })
        setConversationId(undefined)
      }

      if (activeIntentId) {
        await refreshRequestShellData()
      }

      updateWorkspaceUrl({
        browse: finalPayload.workspace.kind === "empty" ? null : "workers",
      })
      setShowWorkspace(finalPayload.workspace.kind !== "empty")
      setPendingApprovalIntentId(null)
    } catch (error) {
      if (isAbortError(error)) {
        return
      }

      setMessages((current) =>
        current.filter((message) => message.id !== assistantMessageId)
      )
      setErrorMessage(
        error instanceof Error ? error.message : "Could not start this route."
      )
    } finally {
      if (activeChatAbortControllerRef.current === abortController) {
        activeChatAbortControllerRef.current = null
      }
      setIsSubmitting(false)
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
    clearPresetRoomAdvanceTimeout()
    clearPresetRoomRetryTimeout()
    setClientPresetRoomRetryStatus(null)
    setIsSubmitting(true)
    setPendingApprovalIntentId(null)
    const now = Date.now()
    const isRequestThreadSubmit = Boolean(activeIntentId)
    const nextConversationId = isRequestThreadSubmit
      ? activeConversationId
      : activeConversationId ?? crypto.randomUUID()

    if (!isRequestThreadSubmit && !activeConversationId) {
      setConversationId(nextConversationId)
    }

    if (!activeIntentId && !effectiveBorealEnabled) {
      try {
        const response = await fetch("/api/conversations/messages", {
          body: JSON.stringify({
            body: trimmed,
            conversationId: nextConversationId,
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

    const optimisticUserMessageId = crypto.randomUUID()
    const assistantMessageId = crypto.randomUUID()
    const abortController = new AbortController()
    const pendingPresetTeamTurns = buildPendingPresetTeamTurns({
      activeIntentId,
      presetDefinition: activePresetDefinition,
      presetState: activePresetRoomState,
    })

    activeChatAbortControllerRef.current?.abort()
    activeChatAbortControllerRef.current = abortController

    if (activeIntentId && pendingPresetTeamTurns?.[0]) {
      setActivePresetRoomTurn(pendingPresetTeamTurns[0])
    }
    setMessages((current) => [
      ...current,
      {
        content: trimmed,
        createdAt: now,
        id: optimisticUserMessageId,
        role: "user" as const,
      },
      {
        content: "",
        createdAt: now,
        id: assistantMessageId,
        presetTeamTurns: pendingPresetTeamTurns,
        role: "assistant" as const,
      },
    ])
    setComposerText("")

    try {
      const response = await fetch("/api/chat", {
        body: JSON.stringify({
          conversationId: nextConversationId,
          context: buildChatUiContext({
            activeIntentId,
            composerAgents: activeComposerAgents,
            pendingProviderSelection:
              effectiveWorkspace.kind === "provider_selection"
                ? effectiveWorkspace.selection
                : null,
            requestDetail,
            selectedCenterTab: activeCenterTab,
            walletAddress: defaultWalletAddress,
            workspaceTab,
          }),
          debugPipeline: pipelineTraceEnabled,
          message: trimmed,
          provider: "boreal-agent",
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
        signal: abortController.signal,
      })

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string }
        throw new Error(payload.error ?? "Chat request failed.")
      }

      if (!response.body) {
        throw new Error("Chat stream was unavailable.")
      }

      let streamedRequestIntentId: string | null = null
      const finalPayload = await consumeChatStream({
        assistantMessageId,
        onRequestOpened: (intentId) => {
          streamedRequestIntentId = intentId

          if (activeIntentId) {
            return
          }

          updateWorkspaceUrl({
            browse: "workers",
            chat: null,
            request: intentId,
            view: "chat",
          })
          setConversationId(undefined)
          setShowWorkspace(true)
          setPendingApprovalIntentId(null)
        },
        response,
        setMessages,
      })

      setConversationId(finalPayload.conversationId)
      setWorkspace(finalPayload.workspace)

      if (!finalPayload.assistantMessage.trim() && !pendingPresetTeamTurns?.length) {
        setMessages((current) =>
          current.filter((message) => message.id !== assistantMessageId)
        )
      }

      if (!activeIntentId && finalPayload.intentId && nextConversationId) {
        await removeDraftSession(draftOwnerScope, nextConversationId)
        await reloadDraftSessions()
        await refreshRequestShellData()
      }

      if (!activeIntentId && mountedComposerAgents.length > 0 && finalPayload.intentId) {
        if (streamedRequestIntentId !== finalPayload.intentId) {
          updateWorkspaceUrl({
            browse: "workers",
            chat: null,
            request: finalPayload.intentId,
            view: "chat",
          })
          setConversationId(undefined)
        }
        if (
          !pendingPresetTeamTurns?.length &&
          !mountedComposerAgents.some(isMountedPresetTeam)
        ) {
          setMessages([])
        }
        setShowWorkspace(true)
        setPendingApprovalIntentId(null)
        return
      }
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
      if (isAbortError(error)) {
        return
      }

      setMessages((current) =>
        current.filter(
          (currentMessage) =>
            currentMessage.id !== optimisticUserMessageId &&
            currentMessage.id !== assistantMessageId
        )
      )
      setErrorMessage(
        error instanceof Error ? error.message : "Chat request failed."
      )
    } finally {
      if (activeChatAbortControllerRef.current === abortController) {
        activeChatAbortControllerRef.current = null
      }
      if (activeIntentId) {
        setActivePresetRoomTurn(null)
      }
      setIsSubmitting(false)
    }
  }

  function fillComposerAndFocus(value: string) {
    setComposerText(value)

    focusComposer()
  }

  function focusComposer() {
    requestAnimationFrame(() => {
      const textarea = composerTextareaRef.current

      if (!textarea) {
        return
      }

      textarea.focus()
      const cursor = textarea.value.length
      textarea.setSelectionRange(cursor, cursor)
    })
  }

  function handleClearMountedComposerAgent(supplyId: string) {
    const nextMountedComposerAgents = mountedComposerAgents.filter(
      (agent) => agent.supplyId !== supplyId
    )

    setMountedComposerAgents(nextMountedComposerAgents)

    if (!activeIntentId && messages[0]?.id === MOUNTED_TEAM_THREAD_MESSAGE_ID) {
      if (nextMountedComposerAgents.length === 0) {
        setMessages([])
      } else {
        setMessages([buildMountedTeamIntroMessage(nextMountedComposerAgents)])
      }
    }
  }

  function handleOpenDraftSession(draftSessionId: string) {
    const draftSession = draftSessions.find(
      (session) => session.draftSessionId === draftSessionId
    )

    if (!draftSession) {
      return
    }

    setErrorMessage(null)
    updateWorkspaceUrl({
      account: null,
      chat: null,
      modal: null,
      paper: null,
      profile: null,
      request: null,
      sheet: null,
      view: null,
    })
    setMatchQueryDraft(null)
    setProposalDraft(emptyProposalDraft())
    setProposalMessage("")
    setDeliveryDraft(emptyDeliveryDraft())
    setOptimisticReviewRating(null)
    setPendingApprovalIntentId(null)
    setWorkspace(draftSession.workspace ?? emptyWorkspace)
    setMountedComposerAgents(
      draftSession.mountedAgents as MountedComposerAgent[]
    )
    setConversationId(draftSession.draftSessionId)
    setMessages(
      draftSession.messages.map((message) => ({
        content: message.content,
        createdAt: message.createdAt,
        id: message.id,
        role: message.role,
      }))
    )
    setIsMobileIntentSidebarOpen(false)
    setIsMobileWorkspaceOpen(false)
    focusComposer()
  }

  async function handleResetDraftSessions() {
    clearStoredDraftSessions(draftOwnerScope)
    purgePublicMarket(["requests"])
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("boreal.shell-cache.v1:sidebar-summary")
    }
    setDraftSessions([])
    setBorealChatSessionLimit(6)

    if (!activeIntentId) {
      setMessages([])
      setConversationId(undefined)
      setMountedComposerAgents([])
      setPendingApprovalIntentId(null)
      setWorkspace(emptyWorkspace)
    }
  }

  async function handleApproveRequest(intentId = activeIntentId) {
    if (!intentId || isApprovingRequest) {
      return
    }

    if (!ownerExternalId) {
      setErrorMessage("Sign in with X before approving tracked work.")
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

      await refreshRequestShellData()
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

      await refreshRequestShellData()
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

      await refreshRequestShellData()
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
      await refreshRequestShellData()

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
      await refreshRequestShellData()
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

    if (!ownerExternalId) {
      setErrorMessage("Sign in with X before opening tracked work to workers.")
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
      await refreshRequestShellData()
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
    stopActivePresetRoomRun()
    setIsSubmitting(false)
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

      await refreshRequestShellData()
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

      await refreshRequestShellData()
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
      await refreshRequestShellData()
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

      await refreshRequestShellData()
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to approve proposal."
      )
    } finally {
      setApprovingProposalId(null)
    }
  }

  async function handleApproveMatchedSupply(
    supplyId: string,
    intentId = activeIntentId ?? pendingApprovalIntentId
  ) {
    if (!intentId || approvingMatchedSupplyId) {
      return
    }

    if (!ownerExternalId) {
      setErrorMessage("Sign in with X before approving a worker.")
      return
    }

    setErrorMessage(null)
    setApprovingMatchedSupplyId(supplyId)

    try {
      const response = await fetch(`/api/requests/${intentId}/team`, {
        body: JSON.stringify({ supplyId }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      })
      const payload = (await response.json()) as
        | {
          approved?: boolean
          assistantMessage?: string
          intentId?: string
          workspace?: WorkspaceState
        }
        | { error?: string }

      if (!response.ok || !("approved" in payload) || !payload.approved) {
        throw new Error(
          "error" in payload && payload.error
            ? payload.error
            : "Failed to approve this worker."
        )
      }

      updateWorkspaceUrl({
        browse: "workers",
        chat: null,
        request: intentId,
        view: "chat",
      })
      setPendingApprovalIntentId((current) =>
        current === intentId ? null : current
      )
      setConversationId(undefined)
      setMessages([])
      await refreshRequestShellData()
      if (payload.workspace) {
        setWorkspace(payload.workspace)
        setShowWorkspace(true)
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to approve this worker."
      )
    } finally {
      setApprovingMatchedSupplyId(null)
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
      await refreshRequestShellData()
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to submit work."
      )
    } finally {
      setIsSubmittingDelivery(false)
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
              ? "Connect a Solana wallet first before publishing a paid offer so Boreal knows where payouts should go."
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
          sourceBrief: activeProfileBuilderWorkspace?.sourceBrief ?? "",
          subtitle: includeListing
            ? "Your work profile was saved and the primary offer is now published."
            : "Your work profile was saved. Publish the primary offer whenever you are ready.",
          title: "Work profile and primary offer",
        })
      }

      await refreshShellData(["profile-summary"])
      if (activeIntentId) {
        await refreshRequestShellData()
      }
      if (includeListing) {
        purgePublicMarket(["workers"])
      }
      setIsProfileBuilderOpen(false)
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Could not save the public setup."
      )
    } finally {
      setIsSavingProfileBuilder(false)
    }
  }

  async function handleInviteRuntimeToActiveRequest(supplyId: string) {
    if (!activeIntentId || !ownerExternalId || invitingLocalRuntimeSupplyId) {
      return false
    }

    setErrorMessage(null)
    setInvitingLocalRuntimeSupplyId(supplyId)

    try {
      const result = await inviteRuntimeToRequest({
        intentId: activeIntentId,
        ownerExternalId,
        supplyId,
      })

      if (!result.invited) {
        throw new Error(
          result.reason === "not_local_runtime"
            ? "Only local direct runtimes can join this request."
            : result.reason === "supply_not_owned"
              ? "You can only invite your own local runtime here."
              : result.reason === "supply_not_found"
                ? "That runtime is not available right now."
                : "Could not invite this runtime into the request."
        )
      }

      await refreshRequestShellData()
      return true
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Could not invite this runtime into the request."
      )
      return false
    } finally {
      setInvitingLocalRuntimeSupplyId(null)
    }
  }

  async function handleCreateAndInviteLocalRuntime() {
    if (!ownerExternalId || !activeIntentId || isCreatingLocalRuntime) {
      return
    }

    const trimmedTitle = localRuntimeDraft.title.trim()
    const trimmedExecutorUrl = localRuntimeDraft.executorUrl.trim()
    const trimmedDescription = localRuntimeDraft.description.trim()

    if (!trimmedTitle || !trimmedExecutorUrl) {
      setErrorMessage("Add a runtime name and executor URL first.")
      return
    }

    if (
      !isLocalRuntimeSupply({
        executionSurface: "http",
        executorUrl: trimmedExecutorUrl,
        sourceProviderKey: "manual",
        supportsDirectInvoke: true,
        title: trimmedTitle,
      })
    ) {
      setErrorMessage("Use a localhost runtime bridge URL for this request.")
      return
    }

    setErrorMessage(null)
    setIsCreatingLocalRuntime(true)

    try {
      const created = await createSupplyEntry({
        availabilityStatus: "available",
        capabilityTags: buildLocalRuntimeCapabilityTags(
          localRuntimeDraft.runtimeKind
        ),
        category: "automation",
        connectorHealthStatus: "unknown",
        deliveryType: "instant",
        description:
          trimmedDescription || "Private local runtime for Boreal requests.",
        executionSurface: "http",
        executorUrl: trimmedExecutorUrl,
        fulfillmentKind: "service",
        isCartEnabled: false,
        outputTypes: ["text"],
        ownerActorKind: "agent",
        ownerDisplayName: session?.user?.name ?? trimmedTitle,
        ownerExternalId,
        paymentProtocol: "none",
        priceType: "scoped",
        requiresHumanApproval: false,
        sourceCapabilityId: `local-runtime:${trimmedTitle
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "")}`,
        sourceProviderKey: "manual",
        subtitle: "Private local runtime",
        supportsDirectInvoke: true,
        supplyType: "capability",
        title: trimmedTitle,
      })

      if (!created.created || !created.supplyId) {
        throw new Error("Could not save this local runtime.")
      }

      await refreshShellData(["profile-summary"])
      const invited = await handleInviteRuntimeToActiveRequest(created.supplyId)

      if (invited) {
        setLocalRuntimeDraft(emptyLocalRuntimeDraft())
        setIsLocalRuntimeDialogOpen(false)
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Could not save this local runtime."
      )
    } finally {
      setIsCreatingLocalRuntime(false)
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
    setMountedComposerAgents([])
    updateWorkspaceUrl({
      account: null,
      chat: null,
      modal: null,
      paper: null,
      profile: null,
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

  function handleOpenSessions() {
    setErrorMessage(null)
    updateWorkspaceUrl({
      account: null,
      chat: "sessions",
      modal: null,
      paper: null,
      profile: null,
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
    setMountedComposerAgents([])
    setIsMobileIntentSidebarOpen(false)
    setIsMobileWorkspaceOpen(false)
    setWorkspace(emptyWorkspace)
  }

  function handleReturnHome() {
    setErrorMessage(null)
    updateWorkspaceUrl({
      account: null,
      chat: null,
      modal: null,
      paper: null,
      profile: null,
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
    setMountedComposerAgents([])
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
    setActiveProfileId(null)
    setIsAccountSheetOpen(false)
    setCenterSheetView(view)
    if (view !== "papers") {
      setCenterSheetPaperSlug(null)
    }
    setIsCenterSheetOpen(true)
    updateWorkspaceUrl({
      paper: null,
      sheet: view,
    })
  }

  function closeCenterSheet() {
    setCenterSheetView(null)
    setCenterSheetPaperSlug(null)
    setIsCenterSheetOpen(false)
    updateWorkspaceUrl({
      paper: null,
      sheet: null,
    })
  }

  function openProfileSheet(profileId: string) {
    setCenterSheetView(null)
    setCenterSheetPaperSlug(null)
    setIsCenterSheetOpen(false)
    setIsAccountSheetOpen(false)
    setActiveProfileId(profileId)
    updateWorkspaceUrl({
      profile: profileId,
    })
  }

  function closeProfileSheet() {
    setActiveProfileId(null)
    updateWorkspaceUrl({
      profile: null,
    })
  }

  function handleInlineNavSelect(href: string) {
    const nextView = centerSheetViewByHref[href as keyof typeof centerSheetViewByHref]
    if (!nextView) {
      return
    }

    if (centerSheetView === nextView && isCenterSheetOpen) {
      closeCenterSheet()
      return
    }

    openCenterSheet(nextView)
  }

  function openPapersOverview() {
    setActiveProfileId(null)
    setIsAccountSheetOpen(false)
    setCenterSheetView("papers")
    setCenterSheetPaperSlug(null)
    setIsCenterSheetOpen(true)
    updateWorkspaceUrl({
      paper: null,
      sheet: "papers",
    })
  }

  function openAgentOnboarding() {
    openCenterSheet("agent")
  }

  function openEmbeddedPaper(slug: string) {
    setActiveProfileId(null)
    setIsAccountSheetOpen(false)
    setCenterSheetView("papers")
    setCenterSheetPaperSlug(slug)
    setIsCenterSheetOpen(true)
    updateWorkspaceUrl({
      paper: slug,
      sheet: "papers",
    })
  }

  function openXSignIn(callbackUrl?: string) {
    void signIn("twitter", {
      callbackUrl: callbackUrl ?? pathname ?? "/",
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

  const isSessionsView = !activeIntentId && chatMode === "sessions"
  const isHomeView =
    !activeIntentId &&
    !isSessionsView &&
    displayedMessages.length === 0
  const isLiveBorealChatView =
    !activeIntentId &&
    !isSessionsView &&
    displayedMessages.length > 0
  const shouldShowFooterComposer =
    isXAuthenticated && shouldShowChatComposer && !isHomeView && !isSessionsView

  return (
    <>
      <div className="flex h-svh w-full max-w-none flex-col overflow-hidden">
        <div className="flex min-h-0 flex-1 flex-col gap-0 lg:flex-row">
          <DesktopIntentRail
            collapsedContent={
              <CollapsedRequestsRail
                accountImageUrl={session?.user?.image ?? null}
                accountName={session?.user?.name ?? null}
                borealChatActive={!activeIntentId && !isSessionsView}
                borealChatSessionCount={borealChatSessions.length}
                isSessionsActive={isSessionsView}
                onOpenBorealChat={handleClearSelection}
                onOpenAccount={openAccountSheet}
                onOpenProfile={openMyProfileSurface}
                onExpand={() => setShowIntentSidebar(true)}
                onOpenSessions={handleOpenSessions}
                requestCount={visibleSidebarIntents.length}
              />
            }
            collapsedWidth={COLLAPSED_SIDEBAR_WIDTH}
            containerStyle={desktopIntentSidebarStyle}
            expandedContent={
              <IntentSidebar
                borealChatSessionCount={borealChatSessions.length}
                isBorealChatActive={!activeIntentId && !isSessionsView}
                isSessionsActive={isSessionsView}
                intents={visibleSidebarIntents}
                onOpenAccount={openAccountSheet}
                onOpenProfile={openMyProfileSurface}
                onOpenBorealChat={handleClearSelection}
                onCollapse={() => setShowIntentSidebar(false)}
                onOpenSessions={handleOpenSessions}
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
                  isCenterSheetOpen && centerSheetView
                    ? centerSheetHrefByView[centerSheetView]
                    : null
                }
                hideIntentMenu={false}
                hideWorkspaceToggle={false}
                inlineNavHrefs={centerSheetNavHrefs}
                isRequestSelected={isXAuthenticated && Boolean(activeIntentId)}
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
                    <AboutPage
                      embedded
                      onOpenPaper={openEmbeddedPaper}
                      onOpenPapers={openPapersOverview}
                      onStartChat={handleClearSelection}
                    />
                  ) : centerSheetView === "agent" ? (
                    <AgentOnboardingSurface embedded />
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

              {activeProfileId ? (
                <FocusSheet
                  onClose={closeProfileSheet}
                  open={Boolean(activeProfileId)}
                  title={
                    activeProfileId === "boreal-agent"
                      ? "Boreal Agent"
                      : resolvedProfileSheetDetail?.profile.displayName ?? "Profile"
                  }
                >
                  {activeProfileId === "boreal-agent" ? (
                    <div className="min-h-full">
                      <BorealProfileView
                        showProfileLink={false}
                        stats={borealAgentStats}
                      />
                    </div>
                  ) : resolvedProfileSheetDetail === undefined ? (
                    <div className="flex min-h-[24rem] items-center justify-center text-sm text-muted-foreground">
                      <DotMatrixSpinner className="mr-2 text-muted-foreground" />
                      Loading profile
                    </div>
                  ) : !resolvedProfileSheetDetail ? (
                    <div className="flex min-h-[24rem] items-center justify-center px-6 text-center">
                      <div className="space-y-2 border border-border p-8">
                        <p className="text-lg font-medium">Profile not found</p>
                        <p className="text-sm text-muted-foreground">
                          This worker profile is not public or does not exist.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="min-h-full">
                      <ProfileView
                        actions={
                          resolvedProfileSheetDetail.profile.isMine &&
                            resolvedProfileSheetDetail.profile.actorKind === "human" ? (
                            <>
                              <Button
                                onClick={() => {
                                  closeProfileSheet()
                                  openProfileBuilder()
                                }}
                                size="sm"
                                type="button"
                                variant="outline"
                              >
                                <CircleUserRoundIcon />
                                Update profile
                              </Button>
                              <Button
                                onClick={() => void invokeHumanProfileOptimizer()}
                                size="sm"
                                type="button"
                              >
                                <SparklesIcon />
                                Optimize profile
                              </Button>
                            </>
                          ) : undefined
                        }
                        detail={resolvedProfileSheetDetail}
                        showProfileLink={false}
                      />
                    </div>
                  )}
                </FocusSheet>
              ) : null}

              {isAccountSheetOpen ? (
                <AccountSettingsSheet
                  accountName={session?.user?.name ?? null}
                  connectedWallets={connectedWallets}
                  desktopConnectWalletAddress={desktopConnectWalletAddress}
                  defaultWalletAddress={defaultWalletAddress}
                  isDesktopConnectLaunching={isDesktopConnectLaunching}
                  isOpen={isAccountSheetOpen}
                  isProfileAvailabilityUpdating={isProfileAvailabilityUpdating}
                  isPayoutWalletUpdating={isSettingDefaultPayoutWalletId}
                  isWalletConnected={isWalletConnected}
                  isWalletReady={isWalletReady}
                  myProfileRecord={myProfileRecord}
                  notice={accountNotice}
                  onConnectDesktop={handleConnectDesktop}
                  onConnectWallet={handleOpenWalletModal}
                  onOpenChange={(nextOpen) => {
                    if (nextOpen) {
                      openAccountSheet()
                      return
                    }

                    closeAccountSheet()
                  }}
                  onOpenProfileBuilder={() => {
                    closeAccountSheet()
                    openProfileBuilder()
                  }}
                  onToggleProfileAvailability={handleToggleProfileAvailability}
                  onSetDefaultPayoutWallet={handleSetDefaultPayoutWallet}
                  runtimeDefaultNetworkKey={runtimeDefaultNetworkKey}
                  walletAccounts={walletAccounts}
                />
              ) : null}

              {isPublicDiscoveryOnly ? (
                <div className="min-h-0 flex-1 overflow-hidden">
                  <div className={HOME_PANEL_CLASS}>
                    <HomeChatSurface
                      composer={
                        <PromptInput className="w-full" onSubmit={async () => { }}>
                          <PromptInputBody>
                            <PromptInputTextarea
                              className="min-h-[140px] text-base"
                              disabled
                              placeholder="I'm afraid you can also ask me anything. Sign in with X when you want Boreal to match and route real work."
                              value=""
                            />
                          </PromptInputBody>
                          <PromptInputFooter className="items-center justify-between gap-2">
                            <PromptInputTools className="w-full flex-wrap justify-start gap-2">
                              <BorealAgentCue />
                            </PromptInputTools>
                            <PromptInputSubmit disabled />
                          </PromptInputFooter>
                        </PromptInput>
                      }
                      quickActions={
                        <>
                          <Button onClick={() => openXSignIn()} size="sm" type="button">
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
                            onClick={openAgentOnboarding}
                            size="sm"
                            type="button"
                            variant="outline"
                          >
                            Agent
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
                              assignment={requestDetail.assignment}
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
                                activePresetRoomTurn={activePresetRoomTurn}
                                onBrowseWorkers={() => {
                                  openMarketplaceTab("workers")
                                }}
                                onInviteLocalRuntime={() =>
                                  setIsLocalRuntimeDialogOpen(true)
                                }
                                onRefreshRequest={refreshRequestShellData}
                                onViewProfile={openProfileSheet}
                                canInviteLocalRuntime={canInviteLocalRuntime}
                                isSolanaWalletReady={isWalletReady}
                                requestDetail={requestDetail}
                                selectedIntent={selectedIntent}
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
                                approvingMatchedSupplyId={
                                  approvingMatchedSupplyId
                                }
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
                                isApprovingMatchedSupply={Boolean(
                                  approvingMatchedSupplyId
                                )}
                                isSubmittingDelivery={isSubmittingDelivery}
                                isSubmittingProposal={isSubmittingProposal}
                                key={activeIntentId}
                                matchQueryDraft={resolvedMatchQueryDraft}
                                onApproveMatchedSupply={
                                  handleApproveMatchedSupply
                                }
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
                                proposalDraft={proposalDraft}
                                proposalMessage={proposalMessage}
                                requestDetail={requestDetail}
                                onViewProfile={openProfileSheet}
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
                                  isProviderRouteSubmitting={isSubmitting}
                                  presetRoomRetryStatus={presetRoomRetryStatus}
                                  isRefreshingRequest={isRefreshingRequest}
                                  isRetryingRequest={isRetryingRequest}
                                  isRefreshingVideo={isRefreshingVideo}
                                  isSubmittingReview={isSubmittingReview}
                                  isWalletReady={isWalletReady}
                                  liveMessages={messages}
                                  approvingMatchedSupplyId={
                                    approvingMatchedSupplyId
                                  }
                                  onApproveMatchedSupply={
                                    handleApproveMatchedSupply
                                  }
                                  onApproveProposal={handleApproveProposal}
                                  onApproveRequest={handleApproveRequest}
                                  onArchiveRequest={handleArchiveRequest}
                                  onCancelRequest={handleCancelRequest}
                                  onConfirmProviderRoute={
                                    handleConfirmProviderRoute
                                  }
                                  onConnectWallet={handleOpenWalletModal}
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
                                  onViewProfile={openProfileSheet}
                                  preferredWalletAddress={defaultWalletAddress}
                                  requestDetail={requestDetail}
                                  review={effectiveReview}
                                  shouldPromptReview={shouldPromptReview}
                                  walletAddress={defaultWalletAddress}
                                  walletConnection={solanaConnection}
                                  walletProvider={walletProvider}
                                  workspace={effectiveWorkspace}
                                />

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
                      <div className="flex items-center justify-center overflow-visible py-16">
                        <DotMatrixSpinner
                          className="text-muted-foreground"

                        />
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
                                onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
                                  setComposerText(event.currentTarget.value)
                                }
                                placeholder={homeComposerPlaceholder}
                                ref={composerTextareaRef}
                                value={composerText}
                              />
                            </PromptInputBody>
                            <PromptInputFooter className="items-center justify-between gap-2">
                              <PromptInputTools className="w-full flex-wrap justify-start gap-2">
                                <MountedComposerTeamCues
                                  agents={activeComposerAgents}
                                  canClear={!activeIntentId}
                                  onClear={handleClearMountedComposerAgent}
                                />
                              </PromptInputTools>
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
                              onClick={openAgentOnboarding}
                              size="sm"
                              type="button"
                              variant="outline"
                            >
                              Agent
                            </Button>
                            <Button
                              onClick={() =>
                                fillComposerAndFocus(
                                  "I need Solana help. Route this to Solana Operator and prepare a non-custodial mainnet plan."
                                )
                              }
                              size="sm"
                              type="button"
                              variant="outline"
                            >
                              Solana specialist
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
                              onClick={handleOpenWalletModal}
                              size="sm"
                              type="button"
                              variant={walletUiReady ? "secondary" : "outline"}
                            >
                              <WalletIcon className="size-4" />
                              {walletButtonLabel}
                            </Button>
                          </>
                        }
                        starterPrompts={starterPrompts.map((prompt) => {
                          const Icon = prompt.icon

                          return {
                            description: prompt.description,
                            icon: <Icon className="size-4" />,
                            onSelect: () => {
                              fillComposerAndFocus(prompt.prompt)
                            },
                            title: prompt.title,
                          }
                        })}
                      />
                    </div>
                  ) : isSessionsView ? (
                    <Conversation className="h-full min-h-0">
                      <ConversationContent className={CHAT_RAIL_CLASS}>
                        <div className="space-y-3 rounded-2xl border border-border bg-card px-4 py-4">
                        <div className="space-y-1">
                          <p className="text-sm font-medium">Sessions</p>
                          <p className="text-xs text-muted-foreground">
                              Local draft chats stay on this device until you
                              resume, promote them into requests, or reset
                              them.
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            onClick={handleClearSelection}
                              size="sm"
                              type="button"
                            >
                              Back to Boreal chat
                            </Button>
                            <Button
                              onClick={() => void handleResetDraftSessions()}
                              size="sm"
                              type="button"
                              variant="outline"
                            >
                              Reset sessions
                            </Button>
                            <Button
                              onClick={() => openMarketplaceTab("workers")}
                              size="sm"
                              type="button"
                              variant="outline"
                            >
                              Browse offers
                            </Button>
                          </div>
                        </div>
                        {hasMoreBorealSessions ? (
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
                        {borealTimelineSessions.length > 0 ? (
                          borealTimelineSessions.map((session, index) => (
                            <BorealTimelineSessionBlock
                              key={`${session.conversation.conversationId}-${session.conversation.latestMessageAt}-${index}`}
                              activeApprovalIntentId={pendingApprovalIntentId}
                              onDiscardRequest={handleCancelRequest}
                              onOpenRequest={openConversationRequestById}
                              onResumeSession={handleOpenDraftSession}
                              session={session}
                            />
                          ))
                        ) : (
                          <div className="rounded-2xl border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">
                            No local draft sessions yet. Start in Boreal chat
                            and resume them here until they become tracked
                            requests.
                          </div>
                        )}
                      </ConversationContent>
                      <ConversationScrollButton />
                    </Conversation>
                  ) : isLiveBorealChatView ? (
                    <Conversation className="h-full min-h-0">
                      <ConversationContent className={CHAT_RAIL_CLASS}>
                        {displayedMessages.map((message) => (
                          <Message from={message.role} key={message.id}>
                            <MessageContent>
                              {message.presetTeamTurns &&
                              message.presetTeamTurns.length > 0 ? (
                                <PresetTeamStreamingCard
                                  turns={message.presetTeamTurns}
                                />
                              ) : message.content.trim().length > 0 ? (
                                <MessageResponse className="[&_a]:inline-flex [&_a]:items-center [&_a]:rounded-full [&_a]:border [&_a]:border-border [&_a]:px-2.5 [&_a]:py-1 [&_a]:text-xs [&_a]:tracking-[0.16em] [&_a]:uppercase">
                                  {message.content}
                                </MessageResponse>
                              ) : (
                                <BorealizingInlineLoader />
                              )}

                              {message.role === "assistant" &&
                                message.debugEvents &&
                                message.debugEvents.length > 0 ? (
                                <AssistantDebugTools
                                  events={message.debugEvents}
                                />
                              ) : null}
                              {!activeIntentId &&
                                message.id === MOUNTED_TEAM_THREAD_MESSAGE_ID &&
                                mountedComposerStarterPromptOptions.length > 0 ? (
                                <div className="mt-3 flex flex-wrap gap-2">
                                  {mountedComposerStarterPromptOptions.map(
                                    (prompt) => (
                                      <Button
                                        key={prompt.title}
                                        onClick={() =>
                                          fillComposerAndFocus(prompt.prompt)
                                        }
                                        size="sm"
                                        type="button"
                                        variant="outline"
                                      >
                                        {prompt.title}
                                      </Button>
                                    )
                                  )}
                                </div>
                              ) : null}
                            </MessageContent>
                          </Message>
                        ))}
                        {hasRenderableInlineWorkspace(effectiveWorkspace) ? (
                          <InlineWorkspaceCard
                            approvalIntentId={pendingApprovalIntentId}
                            isRefreshingVideo={isRefreshingVideo}
                            isProviderRouteSubmitting={isSubmitting}
                            isWalletReady={isWalletReady}
                            approvingMatchedSupplyId={
                              approvingMatchedSupplyId
                            }
                            onApproveRoute={handleApproveRequest}
                            onApproveMatchedSupply={
                              handleApproveMatchedSupply
                            }
                            onConfirmProviderRoute={handleConfirmProviderRoute}
                            onConnectWallet={handleOpenWalletModal}
                            onDownloadVideo={handleDownloadVideo}
                            isApprovingRoute={isApprovingRequest}
                            onOpenProfileBuilder={openProfileBuilder}
                            onQuickReply={(value) => {
                              fillComposerAndFocus(value)
                            }}
                            onRefreshVideo={() => undefined}
                            onViewProfile={openProfileSheet}
                            walletAddress={defaultWalletAddress}
                            walletConnection={solanaConnection}
                            walletProvider={walletProvider}
                            workspace={effectiveWorkspace}
                          />
                        ) : null}
                      </ConversationContent>
                      <ConversationScrollButton />
                    </Conversation>
                  ) : (
                    <div className={HOME_PANEL_CLASS}>
                      <div className="mx-auto flex w-full max-w-xl flex-col items-center gap-3 text-center">
                        <p className="text-lg font-medium">
                          Boreal chat is ready for a fresh session.
                        </p>
                        <Button onClick={handleClearSelection} type="button">
                          Back to Boreal chat
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <FooterComposerRegion
                centerPanelClass={CENTER_PANEL_CLASS}
                errorMessage={null}
                show={shouldShowFooterComposer}
              >
                <div className={CHAT_COMPOSER_CLASS}>
                  {(activeCart?.itemCount ?? 0) > 0 ||
                    (!activeIntentId && !walletUiReady) ? (
                    <PromptInputTools className="w-full flex-wrap justify-start gap-2">
                      {(activeCart?.itemCount ?? 0) > 0 ? (
                        <Button
                          onClick={() => setIsCartOpen(true)}
                          size="sm"
                          type="button"
                          variant="outline"
                        >
                          <ShoppingCartIcon />
                          Cart
                          {activeCart?.itemCount
                            ? ` (${activeCart.itemCount})`
                            : ""}
                        </Button>
                      ) : null}
                      {!activeIntentId && !walletUiReady ? (
                        <Button
                          onClick={handleOpenWalletModal}
                          size="sm"
                          type="button"
                          variant={walletUiReady ? "secondary" : "ghost"}
                        >
                          <WalletIcon />
                          {walletButtonLabel}
                        </Button>
                      ) : null}
                    </PromptInputTools>
                  ) : null}

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
                          onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
                            setComposerText(event.currentTarget.value)
                          }
                          placeholder={threadComposerPlaceholder}
                          ref={composerTextareaRef}
                          value={composerText}
                        />
                      </PromptInputBody>
                      <PromptInputFooter className="items-center justify-between gap-2">
                        <PromptInputTools className="w-full flex-wrap justify-start gap-2">
                          <MountedComposerTeamCues
                            agents={activeComposerAgents}
                            canClear={!activeIntentId}
                            onClear={handleClearMountedComposerAgent}
                          />
                        </PromptInputTools>
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
                isBorealDefaultMounted={isBorealDefaultMounted}
                mountedAgentSupplyIds={mountedComposerAgents.map((agent) => agent.supplyId)}
                onInviteLocalRuntime={() => setIsLocalRuntimeDialogOpen(true)}
                onInvokeListing={(listing) => void handleInvokeListing(listing)}
                onSelectRequest={handleMarketplaceSelect}
                onTabChange={(value) => updateWorkspaceUrl({ browse: value })}
                onViewProfile={openProfileSheet}
                ownerExternalId={ownerExternalId}
                showInviteLocalRuntime={canInviteLocalRuntime}
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
          isBorealChatActive={!activeIntentId && !isSessionsView}
          isSessionsActive={isSessionsView}
          intents={visibleSidebarIntents}
          onOpenAccount={openAccountSheet}
          onOpenProfile={openMyProfileSurface}
          onOpenBorealChat={handleClearSelection}
          onCollapse={() => setIsMobileIntentSidebarOpen(false)}
          onOpenSessions={handleOpenSessions}
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
        label="Market"
        onOpenChange={setIsMobileWorkspaceOpen}
        open={isMobileWorkspaceOpen}
        side="right"
      >
        <WorkspacePanel
          activeTab={workspaceTab}
          isBorealDefaultMounted={isBorealDefaultMounted}
          mountedAgentSupplyIds={mountedComposerAgents.map((agent) => agent.supplyId)}
          onInviteLocalRuntime={() => setIsLocalRuntimeDialogOpen(true)}
          onInvokeListing={(listing) => void handleInvokeListing(listing)}
          onSelectRequest={handleMarketplaceSelect}
          onTabChange={(value) => updateWorkspaceUrl({ browse: value })}
          onViewProfile={openProfileSheet}
          ownerExternalId={ownerExternalId}
          showInviteLocalRuntime={canInviteLocalRuntime}
        />
      </MobileSidebarDrawer>
      <LocalRuntimeInviteDialog
        currentRequestTitle={requestDetail?.intent?.title ?? null}
        draft={localRuntimeDraft}
        invitedSupplyIds={invitedRuntimeSupplyIds}
        invitingSupplyId={invitingLocalRuntimeSupplyId}
        isCreating={isCreatingLocalRuntime}
        isOpen={isLocalRuntimeDialogOpen}
        localRuntimeSupplies={localRuntimeSupplies}
        onCreateAndInvite={handleCreateAndInviteLocalRuntime}
        onInvite={handleInviteRuntimeToActiveRequest}
        onOpenChange={setIsLocalRuntimeDialogOpen}
        setDraft={setLocalRuntimeDraft}
      />
      <ProfileBuilderDialog
        connectWalletLabel="Connect Solana mainnet wallet"
        draft={profileBuilderDraft}
        isDrafting={isDraftingProfileBuilder}
        isOpen={isProfileBuilderOpen}
        isSaving={isSavingProfileBuilder}
        isWalletReady={isWalletReady}
        onConnectWallet={handleOpenWalletModal}
        onDraftWithBoreal={handleDraftProfileBuilder}
        onOpenChange={(nextOpen) => {
          if (nextOpen) {
            openProfileBuilder()
            return
          }

          closeProfileBuilder()
        }}
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
        onViewProfile={openProfileSheet}
      />
    </>
  )
}

function AccountSettingsSheet({
  accountName,
  connectedWallets,
  desktopConnectWalletAddress,
  defaultWalletAddress,
  isDesktopConnectLaunching,
  isOpen,
  isProfileAvailabilityUpdating,
  isPayoutWalletUpdating,
  isWalletConnected,
  isWalletReady,
  myProfileRecord,
  notice,
  onConnectDesktop,
  onConnectWallet,
  onOpenChange,
  onOpenProfileBuilder,
  onToggleProfileAvailability,
  onSetDefaultPayoutWallet,
  runtimeDefaultNetworkKey,
  walletAccounts,
}: {
  accountName: string | null
  connectedWallets: NormalizedConnectedWallet[]
  desktopConnectWalletAddress: string | null
  defaultWalletAddress: string | null
  isDesktopConnectLaunching: boolean
  isOpen: boolean
  isProfileAvailabilityUpdating: boolean
  isPayoutWalletUpdating: string | null
  isWalletConnected: boolean
  isWalletReady: boolean
  myProfileRecord: MyProfileRecord
  notice: string | null
  onConnectDesktop: () => void
  onConnectWallet: () => void
  onOpenChange: (open: boolean) => void
  onOpenProfileBuilder: () => void
  onToggleProfileAvailability: (checked: boolean) => Promise<void>
  onSetDefaultPayoutWallet: (walletAccountId: string) => Promise<void>
  runtimeDefaultNetworkKey: string
  walletAccounts: WalletAccountRecord
}) {
  return (
    <FocusSheet
      onClose={() => onOpenChange(false)}
      open={isOpen}
      title="Settings"
    >
      <div className="px-4 py-4 sm:px-6 sm:py-6">
        <AccountSettingsSurface
          accountName={accountName}
          builderSlot={undefined}
          connectedWallets={connectedWallets}
          desktopConnectWalletAddress={desktopConnectWalletAddress}
          defaultWalletAddress={defaultWalletAddress}
          isDesktopConnectLaunching={isDesktopConnectLaunching}
          isEditingPublicSetup={false}
          isProfileAvailabilityUpdating={isProfileAvailabilityUpdating}
          isPayoutWalletUpdating={isPayoutWalletUpdating}
          isWalletConnected={isWalletConnected}
          isWalletReady={isWalletReady}
          myProfileRecord={myProfileRecord}
          notice={notice}
          onConnectDesktop={onConnectDesktop}
          onConnectWallet={onConnectWallet}
          onOpenProfileBuilder={onOpenProfileBuilder}
          onToggleProfileAvailability={onToggleProfileAvailability}
          onSetDefaultPayoutWallet={onSetDefaultPayoutWallet}
          runtimeDefaultNetworkKey={runtimeDefaultNetworkKey}
          walletAccounts={walletAccounts}
        />
      </div>
    </FocusSheet>
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
  onDiscardRequest,
  onOpenRequest,
  onResumeSession,
  session,
}: {
  activeApprovalIntentId: string | null
  onDiscardRequest: (intentId: string) => Promise<void>
  onOpenRequest: (requestId: string) => void
  onResumeSession?: (conversationId: string) => void
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
          Session / {formatBorealSessionTime(session.conversation.latestMessageAt)}
        </span>
        {sortedRequests.length === 0 && onResumeSession ? (
          <Button
            onClick={() => onResumeSession(session.conversation.conversationId)}
            size="sm"
            type="button"
            variant="outline"
          >
            Resume draft
          </Button>
        ) : null}
        <div className="h-px flex-1 bg-border" />
      </div>

      {session.messages.map((message) => {
        const parsedMessage = parseSolanaThreadMessage(message.body)

        return (
          <Message
            from={message.role === "user" ? "user" : "assistant"}
            key={message._id}
          >
            <MessageContent>
              {parsedMessage.text.trim().length > 0 ? (
                <MessageResponse className="[&_a]:inline-flex [&_a]:items-center [&_a]:rounded-full [&_a]:border [&_a]:border-border [&_a]:px-2.5 [&_a]:py-1 [&_a]:text-xs [&_a]:tracking-[0.16em] [&_a]:uppercase">
                  {parsedMessage.text}
                </MessageResponse>
              ) : (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <LoaderIcon className="size-4 animate-spin" />
                  <span>Routing request</span>
                </div>
              )}
            </MessageContent>
          </Message>
        )
      })}

      {sortedRequests.map((linkedRequest) => (
        (() => {
          const isProposedDraft = linkedRequest.status === "proposed"
          const isActiveDraft =
            isProposedDraft &&
            !linkedRequest.needsClarification &&
            linkedRequest.id === activeApprovalIntentId

          return (
            <div
              className="rounded-2xl border border-border bg-card px-4 py-3"
              key={linkedRequest.id}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium">{linkedRequest.title}</p>
                  <p className="mt-1 text-xs tracking-[0.16em] text-muted-foreground uppercase">
                    {isProposedDraft
                      ? linkedRequest.needsClarification
                        ? "Needs scope"
                        : isActiveDraft
                          ? "Draft open"
                          : "Awaiting approval"
                      : linkedRequest.status.replaceAll("_", " ")}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {isProposedDraft &&
                    !linkedRequest.needsClarification &&
                    !isActiveDraft ? (
                    <>
                      <Button
                        onClick={() => onOpenRequest(linkedRequest.id)}
                        size="sm"
                        type="button"
                      >
                        Open draft
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
                  ) : isActiveDraft ? (
                    <span className="inline-flex items-center rounded-full border border-border px-2.5 py-1 text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
                      Reviewing now
                    </span>
                  ) : (
                    <Button
                      onClick={() => onOpenRequest(linkedRequest.id)}
                      size="sm"
                      type="button"
                      variant="outline"
                    >
                      Open request
                    </Button>
                  )}
                </div>
              </div>
              {isProposedDraft ? (
                <p className="mt-3 text-xs text-muted-foreground">
                  {linkedRequest.needsClarification
                    ? "This draft still needs clearer scope. Open it and reply in chat before Boreal turns it into tracked work."
                    : isActiveDraft
                      ? "The top route is already expanded below. Invite the highlighted route when you want Boreal to start tracked work."
                      : "Open the draft, then invite the route you want Boreal to start with."}
                </p>
              ) : null}
            </div>
          )
        })()
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

function mapDraftSessionToTimelineSession(
  session: DraftSessionRecord
): BorealTimelineSession {
  const latestMessage = session.messages[session.messages.length - 1] ?? null
  const titleSource =
    session.messages.find((message) => message.role === "user")?.content?.trim() ??
    ""

  return {
    conversation: {
      _id: session.draftSessionId,
      conversationId: session.draftSessionId,
      intentCount: 0,
      lastMessageBody: latestMessage?.content ?? null,
      lastMessageRole: latestMessage?.role ?? null,
      latestMessageAt: latestMessage?.createdAt ?? session.updatedAt,
      messageCount: session.messages.length,
      title:
        titleSource.length > 0
          ? titleSource.slice(0, 72)
          : "Draft session",
      updatedAt: session.updatedAt,
    },
    linkedRequests: [],
    messages: session.messages.map((message) => ({
      _id: message.id,
      body: message.content,
      createdAt: message.createdAt,
      role: message.role,
      sender: {
        actorKind: message.role === "user" ? "human" : "agent",
        displayName: message.role === "user" ? "You" : "Boreal Agent",
        externalId: null,
        handle: null,
      },
    })),
  }
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
  assignment,
  status,
}: {
  assignment: RequestDetail["assignment"] | null | undefined
  status: NonNullable<RequestDetail["intent"]>["status"]
}) {
  const progressStage = getRequestHeaderStage(status)
  const isWorking = status === "claimed" || status === "in_progress"
  const assignmentSummary = getRequestAssignmentSummary(assignment)
  const progressItems = [
    { icon: SearchIcon, label: "Scope" },
    { icon: CheckIcon, label: "Approve" },
    { icon: SparklesIcon, label: "Active" },
    { icon: PackageIcon, label: "Deliver" },
  ] as const

  return (
    <div className="w-full space-y-2 md:w-auto">
      {assignmentSummary ? (
        <div className="flex flex-wrap items-center justify-end gap-2">
          <span className="inline-flex items-center rounded-full border border-border px-2 py-0.5 text-[10px] tracking-[0.16em] text-muted-foreground uppercase">
            {assignmentSummary.label}
          </span>
          <span className="text-xs font-medium">{assignmentSummary.title}</span>
          {assignmentSummary.meta ? (
            <span className="text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
              {assignmentSummary.meta}
            </span>
          ) : null}
        </div>
      ) : null}
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

function getRequestAssignmentSummary(
  assignment: RequestDetail["assignment"] | null | undefined
) {
  if (!assignment) {
    return null
  }

  const team = assignment.team
  const teamTitle = team?.teamDisplayName ?? assignment.agent ?? null

  if (team?.presetKey) {
    return {
      label: "Bundle",
      meta: `${team.members.length} voices`,
      title: teamTitle ?? "Preset bundle",
    }
  }

  if (team && team.members.length > 1) {
    return {
      label: "Team",
      meta: `${team.members.length} members`,
      title: teamTitle ?? "Assigned team",
    }
  }

  return {
    label: "Agent",
    meta: null,
    title: assignment.agent ?? "Waiting for team",
  }
}

function InlineRequestActionEvent({
  access,
  activity,
  assignedTeam,
  approvingProposalId,
  intent,
  isArchivingRequest,
  isApprovingRequest,
  isCancellingRequest,
  isRefreshingRequest,
  isRetryingRequest,
  isSubmittingReview,
  onArchiveRequest,
  onApproveProposal,
  onApproveRequest,
  onCancelRequest,
  onDeleteIntent,
  onOpenProfileBuilder,
  onOpenRequestForWorkers,
  onRefreshRequest,
  onRetryRequest,
  onSubmitReview,
  onViewProfile,
  proposals,
  shouldPromptReview,
}: {
  access: RequestDetail["access"]
  activity: RequestDetail["activity"]
  assignedTeam: NonNullable<RequestDetail["assignment"]>["team"] | null | undefined
  approvingProposalId: string | null
  intent: NonNullable<RequestDetail["intent"]>
  isArchivingRequest: boolean
  isApprovingRequest: boolean
  isCancellingRequest: boolean
  isRefreshingRequest: boolean
  isRetryingRequest: boolean
  isSubmittingReview: boolean
  onArchiveRequest: () => Promise<void>
  onApproveProposal: (proposalId: string) => Promise<void>
  onApproveRequest: () => void
  onCancelRequest: () => void
  onDeleteIntent: () => void
  onOpenProfileBuilder: () => void
  onOpenRequestForWorkers: () => Promise<void>
  onRefreshRequest: () => Promise<void>
  onRetryRequest: () => Promise<void>
  onSubmitReview: (rating: number) => void
  onViewProfile: (profileId: string) => void
  proposals: RequestDetail["proposals"]
  shouldPromptReview: boolean
}) {
  const actionState = getRequestActionState(
    intent,
    assignedTeam,
    access,
    shouldPromptReview,
    activity
  )
  const submittedProposals = (proposals ?? []).filter(
    (proposal) => proposal.status === "submitted"
  )
  const handlingMode = getRequestHandlingMode(intent)
  const isProfileUpdate = intent.routeTarget === "profile_update"
  const isMatchedCatalogRoute =
    handlingMode === "boreal" && intent.shouldSearchCatalog
  const blockedErrorMessage = getLatestBlockedErrorMessage(activity)

  if (
    actionState.kind === "none" ||
    actionState.kind === "review" ||
    actionState.kind === "in_flight"
  ) {
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
                  <Button
                    onClick={() => onViewProfile(proposal.proposer.profileId!)}
                    size="sm"
                    type="button"
                    variant="outline"
                  >
                    View profile
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

  if (actionState.kind === "clarification") {
    return (
      <div className="space-y-2 border border-border/70 bg-background/60 px-3 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-medium">{actionState.title}</p>
          <span className="inline-flex items-center rounded-full border border-border px-2 py-0.5 text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
            Reply in thread
          </span>
        </div>
        <p className="text-xs text-muted-foreground">{actionState.description}</p>
        {intent.suggestedReplies.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {intent.suggestedReplies.slice(0, 3).map((reply) => (
              <span
                className="inline-flex items-center rounded-full border border-border px-2.5 py-1 text-[11px] tracking-[0.16em] text-muted-foreground uppercase"
                key={reply}
              >
                {reply}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    )
  }

  return (
    <div className="space-y-3 border border-border p-4">
      <p className="text-sm font-medium">{actionState.title}</p>
      <p className="text-xs text-muted-foreground">{actionState.description}</p>
      {actionState.kind === "approval" && !isMatchedCatalogRoute ? (
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
                      ? "Approving this will let Boreal draft your editable work profile and first listing. You can also open the builder form and fill it manually."
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
              {isMatchedCatalogRoute
                ? "specialist route"
                : intent.routeTarget.replaceAll("_", " ")}
            </span>
          </div>
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
                Update profile
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
        {actionState.kind === "payment_required" ? (
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
        {actionState.kind === "awaiting_reply" ? (
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
          </>
        ) : null}
        {actionState.kind === "waiting_specialist" ? (
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
                Update profile
              </Button>
            ) : null}
            <Button
              disabled={
                isRetryingRequest ||
                isCancellingRequest
              }
              onClick={() => void onRetryRequest()}
              size="sm"
              type="button"
            >
              {isRetryingRequest ? (
                <LoaderIcon className="animate-spin" />
              ) : (
                <RefreshCwIcon />
              )}
              {isVideoProviderAccessUnavailableError(blockedErrorMessage)
                ? "Retry after fix"
                : "Retry"}
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
    item: NormalizedRequestReceipt
    key: string
    kind: "receipt"
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
  approvingMatchedSupplyId,
  liveMessages,
  isArchivingRequest,
  isApprovingRequest,
  isCancellingRequest,
  isMarkingRequestFulfilled,
  isProviderRouteSubmitting,
  presetRoomRetryStatus,
  isRefreshingRequest,
  isRetryingRequest,
  isRefreshingVideo,
  isSubmittingReview,
  isWalletReady,
  onApproveMatchedSupply,
  onArchiveRequest,
  onApproveProposal,
  onApproveRequest,
  onCancelRequest,
  onConfirmProviderRoute,
  onConnectWallet,
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
  onViewProfile,
  preferredWalletAddress,
  requestDetail,
  review,
  shouldPromptReview,
  walletAddress,
  walletConnection,
  walletProvider,
  workspace,
}: {
  approvingProposalId: string | null
  approvingMatchedSupplyId: string | null
  liveMessages: ChatMessage[]
  isArchivingRequest: boolean
  isApprovingRequest: boolean
  isCancellingRequest: boolean
  isMarkingRequestFulfilled: boolean
  isProviderRouteSubmitting: boolean
  presetRoomRetryStatus: {
    attempt: number
    displayName: string
    lastError: string | null
    turnIndex: number
  } | null
  isRefreshingRequest: boolean
  isRetryingRequest: boolean
  isRefreshingVideo: boolean
  isSubmittingReview: boolean
  isWalletReady: boolean
  onApproveMatchedSupply: (
    supplyId: string,
    intentId?: string | null
  ) => Promise<void>
  onArchiveRequest: () => Promise<void>
  onApproveProposal: (proposalId: string) => Promise<void>
  onApproveRequest: (intentId?: string | null) => Promise<void>
  onCancelRequest: (intentId?: string | null) => Promise<void>
  onConfirmProviderRoute: (input: {
    paymentReceipt?: ProviderRoutePaymentReceipt | null
    routeKey: string
    selection: ProviderSelectionState
  }) => Promise<void>
  onConnectWallet: () => void
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
  onViewProfile: (profileId: string) => void
  preferredWalletAddress?: string | null
  requestDetail: RequestDetail
  review: RequestDetail["review"]
  shouldPromptReview: boolean
  walletAddress?: string | null
  walletConnection?: ReturnType<typeof usePayment>["solanaConnection"]
  walletProvider?: ProviderSelectionWalletProvider | null
  workspace: WorkspaceState
}) {
  const timeline = buildRequestTimeline(requestDetail, review, liveMessages)
  const completedSolanaActionIds = collectCompletedSolanaActionIds(
    requestDetail.activity
  )
  const requestPresetDefinition = useMemo(
    () => resolveRequestPresetDefinition(requestDetail),
    [requestDetail]
  )
  const requestActionState = requestDetail.intent
    ? getRequestActionState(
      requestDetail.intent,
      requestDetail.assignment?.team ?? null,
      requestDetail.access,
      shouldPromptReview,
      requestDetail.activity
    )
    : null
  const catalogApprovalIntentId =
    requestDetail.intent &&
      requestDetail.access?.isOwner &&
      (requestDetail.intent.status === "proposed" ||
        requestDetail.intent.status === "open") &&
      !requestDetail.intent.needsClarification
      ? requestDetail.intent._id
      : null

  return (
    <>
      {requestDetail.intent && requestActionState?.kind === "in_flight" ? (
        <RequestInFlightBanner
          isMarkingRequestFulfilled={isMarkingRequestFulfilled}
          isProfileUpdate={requestDetail.intent.routeTarget === "profile_update"}
          isRefreshingRequest={isRefreshingRequest}
          onMarkRequestFulfilled={onMarkRequestFulfilled}
          onOpenProfileBuilder={onOpenProfileBuilder}
          onRefreshRequest={onRefreshRequest}
          proposals={requestDetail.proposals}
        />
      ) : null}

      {timeline.map((entry) => {
        if (entry.kind === "message") {
          const parsedMessage = parseSolanaThreadMessage(entry.item.body)
          const role = entry.item.sender.isCurrentUser
            ? "user"
            : entry.item.sender.actorKind === "agent"
              ? "assistant"
              : "assistant"

          return (
            <Message from={role} key={entry.key}>
              {!entry.item.sender.isCurrentUser ? (
                <p className="mb-1 flex items-center gap-2 text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
                  <ParticipantIdentityBadge
                    actorKind={entry.item.sender.actorKind}
                    className="size-3"
                    displayName={entry.item.sender.displayName}
                    externalId={entry.item.sender.externalId}
                    handle={entry.item.sender.handle}
                    presetDefinition={requestPresetDefinition}
                  />
                  <span>{entry.item.sender.displayName}</span>
                  <ParticipantRolePill
                    displayName={entry.item.sender.displayName}
                    externalId={entry.item.sender.externalId}
                    presetDefinition={requestPresetDefinition}
                  />
                </p>
              ) : null}
              <MessageContent>
                {parsedMessage.text.trim().length > 0 ? (
                  <MessageResponse className="[&_a]:inline-flex [&_a]:items-center [&_a]:rounded-full [&_a]:border [&_a]:border-border [&_a]:px-2.5 [&_a]:py-1 [&_a]:text-xs [&_a]:tracking-[0.16em] [&_a]:uppercase">
                    {parsedMessage.text}
                  </MessageResponse>
                ) : null}
                {parsedMessage.action && requestDetail.intent ? (
                  <SolanaThreadActionCard
                    action={parsedMessage.action}
                    intentId={requestDetail.intent._id}
                    isCompleted={completedSolanaActionIds.has(
                      parsedMessage.action.actionId
                    )}
                    onRecorded={onRefreshRequest}
                    preferredWalletAddress={preferredWalletAddress}
                  />
                ) : null}
                {parsedMessage.text.trim().length === 0 &&
                !parsedMessage.action ? (
                  entry.item.sender.actorKind === "agent" ? (
                    <PresetSpeakerInlineLoader
                      displayName={entry.item.sender.displayName}
                      presetDefinition={requestPresetDefinition}
                    />
                  ) : (
                    <BorealizingInlineLoader />
                  )
                ) : null}
              </MessageContent>
            </Message>
          )
        }

        if (entry.kind === "live") {
          const parsedMessage = parseSolanaThreadMessage(entry.item.content)
          const liveAssistantLabel = getLiveRequestAssistantLabel(requestDetail)
          const pendingTurn = entry.item.presetTeamTurns?.[0] ?? null
          const pendingRetryLabel =
            pendingTurn &&
            presetRoomRetryStatus &&
            presetRoomRetryStatus.turnIndex === pendingTurn.turnIndex &&
            presetRoomRetryStatus.displayName === pendingTurn.displayName
              ? `${pendingTurn.displayName} is borealizing again. Retry attempt ${presetRoomRetryStatus.attempt} is queued.`
              : null

          return (
            <Message from={entry.item.role} key={entry.key}>
              {entry.item.role === "assistant" && !pendingTurn ? (
                <p className="mb-1 flex items-center gap-2 text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
                  <BotIcon className="size-3" />
                  <span>{liveAssistantLabel}</span>
                </p>
              ) : null}
              <MessageContent>
                {pendingTurn ? (
                  <div className="space-y-2">
                    <p className="mb-1 flex items-center gap-2 text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
                      <ParticipantIdentityBadge
                        actorKind="agent"
                        className="size-3"
                        displayName={pendingTurn.displayName}
                        memberKey={pendingTurn.memberKey}
                        presetDefinition={requestPresetDefinition}
                      />
                      <span>{pendingTurn.displayName}</span>
                      <ParticipantRolePill
                        displayName={pendingTurn.displayName}
                        memberKey={pendingTurn.memberKey}
                        presetDefinition={requestPresetDefinition}
                        roleLabel={pendingTurn.roleLabel}
                      />
                    </p>
                    {pendingTurn.content?.trim() ? (
                      <MessageResponse className="[&_a]:inline-flex [&_a]:items-center [&_a]:rounded-full [&_a]:border [&_a]:border-border [&_a]:px-2.5 [&_a]:py-1 [&_a]:text-xs [&_a]:tracking-[0.16em] [&_a]:uppercase">
                        {pendingTurn.content}
                      </MessageResponse>
                    ) : (
                      <PresetSpeakerInlineLoader
                        displayName={pendingTurn.displayName}
                        label={pendingRetryLabel ?? undefined}
                        memberKey={pendingTurn.memberKey}
                        presetDefinition={requestPresetDefinition}
                      />
                    )}
                  </div>
                ) : parsedMessage.text.trim().length > 0 ? (
                  <MessageResponse className="[&_a]:inline-flex [&_a]:items-center [&_a]:rounded-full [&_a]:border [&_a]:border-border [&_a]:px-2.5 [&_a]:py-1 [&_a]:text-xs [&_a]:tracking-[0.16em] [&_a]:uppercase">
                    {parsedMessage.text}
                  </MessageResponse>
                ) : entry.item.role === "assistant" ? (
                  <BorealizingInlineLoader label={`${liveAssistantLabel} is replying...`} />
                ) : null}
                {parsedMessage.action && requestDetail.intent ? (
                  <SolanaThreadActionCard
                    action={parsedMessage.action}
                    intentId={requestDetail.intent._id}
                    isCompleted={completedSolanaActionIds.has(
                      parsedMessage.action.actionId
                    )}
                    onRecorded={onRefreshRequest}
                    preferredWalletAddress={preferredWalletAddress}
                  />
                ) : null}
              </MessageContent>
            </Message>
          )
        }

        if (entry.kind === "activity") {
          return <InlineActivityEvent activity={entry.item} key={entry.key} />
        }

        if (entry.kind === "receipt") {
          return (
            <RequestReceiptCard compact key={entry.key} receipt={entry.item} />
          )
        }

        if (entry.kind === "artifact") {
          return (
            <InlineArtifactEvent
              artifact={entry.item}
              isRefreshingVideo={isRefreshingVideo}
              onDownloadVideo={onDownloadVideo}
              onOpenProfileBuilder={onOpenProfileBuilder}
              onRefreshVideo={onRefreshVideo}
              onViewProfile={onViewProfile}
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
          assignedTeam={requestDetail.assignment?.team}
          approvingProposalId={approvingProposalId}
          intent={requestDetail.intent}
          isArchivingRequest={isArchivingRequest}
          isApprovingRequest={isApprovingRequest}
          isCancellingRequest={isCancellingRequest}
          isRefreshingRequest={isRefreshingRequest}
          isRetryingRequest={isRetryingRequest}
          isSubmittingReview={isSubmittingReview}
          onArchiveRequest={onArchiveRequest}
          onApproveProposal={onApproveProposal}
          onApproveRequest={() => onApproveRequest(requestDetail.intent?._id)}
          activity={requestDetail.activity}
          onCancelRequest={() => onCancelRequest(requestDetail.intent?._id)}
          onDeleteIntent={onDeleteIntent}
          onOpenProfileBuilder={onOpenProfileBuilder}
          onOpenRequestForWorkers={onOpenRequestForWorkers}
          onRefreshRequest={onRefreshRequest}
          onRetryRequest={onRetryRequest}
          onSubmitReview={onSubmitReview}
          onViewProfile={onViewProfile}
          proposals={requestDetail.proposals}
          shouldPromptReview={shouldPromptReview}
        />
      ) : null}

      {workspace.kind === "catalog" ||
        workspace.kind === "profile_builder" ||
        workspace.kind === "provider_selection" ||
        (timeline.length === 0 && hasRenderableInlineWorkspace(workspace)) ? (
        <InlineWorkspaceCard
          approvalIntentId={catalogApprovalIntentId}
          isRefreshingVideo={isRefreshingVideo}
          isProviderRouteSubmitting={isProviderRouteSubmitting}
          isWalletReady={isWalletReady}
          approvingMatchedSupplyId={approvingMatchedSupplyId}
          onApproveRoute={onApproveRequest}
          onApproveMatchedSupply={onApproveMatchedSupply}
          onConfirmProviderRoute={onConfirmProviderRoute}
          onConnectWallet={onConnectWallet}
          onDownloadVideo={onDownloadVideo}
          isApprovingRoute={isApprovingRequest}
          onOpenProfileBuilder={onOpenProfileBuilder}
          onQuickReply={onQuickReply}
          onRefreshVideo={onRefreshVideo}
          onViewProfile={onViewProfile}
          walletAddress={walletAddress}
          walletConnection={walletConnection}
          walletProvider={walletProvider}
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
  const persistedThreadMessages = requestDetail.messages.map((message) => ({
    content: message.body,
    role:
      message.role === "user" ? ("user" as const) : ("assistant" as const),
  }))
  const pendingLiveMessages = filterPersistedThreadLiveMessages(
    persistedThreadMessages,
    liveMessages,
  )

  for (const message of requestDetail.messages) {
    if (!shouldRenderRequestMessageInChat(message)) {
      continue
    }

    items.push({
      item: message,
      key: `message-${message._id}`,
      kind: "message",
      timestamp: message.createdAt,
    })
  }

  for (const activity of requestDetail.activity) {
    if (!shouldRenderActivityInRequestChat(activity.type)) {
      continue
    }

    items.push({
      item: activity,
      key: `activity-${activity._id}`,
      kind: "activity",
      timestamp: activity.createdAt,
    })
  }

  for (const receipt of requestDetail.receipts) {
    items.push({
      item: receipt,
      key: `receipt-${receipt.routeKey}-${receipt.requestToken ?? receipt.recordedAt}-${receipt.status}`,
      kind: "receipt",
      timestamp: receipt.verifiedAt ?? receipt.recordedAt,
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

  for (const liveMessage of pendingLiveMessages) {
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
      receipt: 1,
      message: 2,
      live: 3,
      fulfillment: 4,
      artifact: 5,
      review: 6,
    }

    return order[left.kind] - order[right.kind]
  })
}

function filterPersistedThreadLiveMessages(
  persistedMessages: Array<{ content: string; role: ChatMessage["role"] }>,
  liveMessages: ChatMessage[],
) {
  if (persistedMessages.length === 0 || liveMessages.length === 0) {
    return liveMessages
  }

  let persistedIndex = 0

  return liveMessages.filter((liveMessage) => {
    for (let index = persistedIndex; index < persistedMessages.length; index += 1) {
      const persisted = persistedMessages[index]
      const liveContent = getRenderableChatMessageContent(liveMessage)

      if (
        persisted?.role === liveMessage.role &&
        persisted.content.trim() === liveContent
      ) {
        persistedIndex = index + 1
        return false
      }
    }

    return true
  })
}

function shouldRenderRequestMessageInChat(
  message: RequestDetail["messages"][number]
) {
  if (message.role === "system") {
    return false
  }

  return !isMountedRequestSetupMessage(message)
}

function isMountedRequestSetupMessage(
  message: RequestDetail["messages"][number]
) {
  if (
    message.sender.externalId !== "agent:boreal" ||
    message.sender.displayName !== "Boreal Agent"
  ) {
    return false
  }

  const body = message.body.trim()

  return (
    (body.startsWith("Boreal opened ") &&
      (body.includes("work thread") || body.includes(" room")) &&
      (body.includes("started the request immediately") ||
        body.includes("Funding starts execution in this same request thread") ||
        body.includes("Funding starts that agent team in this same request thread") ||
        body.includes("started the debate immediately") ||
        body.includes("started that preset team immediately") ||
        body.includes("started that agent team immediately") ||
        body.includes("is framing the comparison now."))) ||
    body.endsWith("was selected from offers and is starting now.") ||
    body.endsWith("were selected from offers and are starting now.") ||
    body.startsWith("Funding required before ")
  )
}

function shouldRenderActivityInRequestChat(activityType: string) {
  void activityType
  return false
}

function RequestInFlightBanner({
  isMarkingRequestFulfilled,
  isProfileUpdate,
  isRefreshingRequest,
  onMarkRequestFulfilled,
  onOpenProfileBuilder,
  onRefreshRequest,
  proposals,
}: {
  isMarkingRequestFulfilled: boolean
  isProfileUpdate: boolean
  isRefreshingRequest: boolean
  onMarkRequestFulfilled: () => Promise<void>
  onOpenProfileBuilder: () => void
  onRefreshRequest: () => Promise<void>
  proposals: RequestDetail["proposals"]
}) {
  const acceptedProposal =
    (proposals ?? []).find((proposal) => proposal.status === "accepted") ?? null

  return (
    <div className="sticky top-3 z-20 flex justify-center px-3 pb-4">
      <div className="flex max-w-full flex-wrap items-center justify-center gap-2 border border-accent/30 bg-background/95 px-3 py-2 shadow-sm backdrop-blur">
        <span className="inline-flex items-center border border-accent bg-accent/5 px-2 py-1 text-[11px] tracking-[0.16em] text-accent-foreground uppercase">
          Work in flight
        </span>
        {acceptedProposal?.etaAt ? (
          <span className="border border-border px-2 py-1 text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
            Est. delivery {formatRequestDate(acceptedProposal.etaAt)}
          </span>
        ) : null}
        {isProfileUpdate ? (
          <Button onClick={onOpenProfileBuilder} size="sm" type="button">
            <CircleUserRoundIcon />
            Update profile
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
      </div>
    </div>
  )
}

function InlineActivityEvent({
  activity,
}: {
  activity: RequestDetail["activity"][number]
}) {
  return (
    <div className="space-y-2 border-l border-accent pl-4">
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
  onDownloadVideo,
  onOpenProfileBuilder,
  onRefreshVideo,
  onViewProfile,
  workspace,
}: {
  artifact: NonNullable<RequestDetail["artifact"]>
  isRefreshingVideo: boolean
  onDownloadVideo: (videoId: string) => void
  onOpenProfileBuilder: () => void
  onRefreshVideo: () => void
  onViewProfile: (profileId: string) => void
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
        approvingMatchedSupplyId={null}
        onApproveMatchedSupply={() => Promise.resolve()}
        onDownloadVideo={onDownloadVideo}
        onOpenProfileBuilder={onOpenProfileBuilder}
        onQuickReply={() => undefined}
        onRefreshVideo={onRefreshVideo}
        onViewProfile={onViewProfile}
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

function findPresetRoomMember(input: {
  displayName?: string | null
  externalId?: string | null
  memberKey?: string | null
  presetDefinition: ReturnType<typeof resolvePresetTeamDefinitionFromBlueprint>
}) {
  if (!input.presetDefinition) {
    return null
  }

  return (
    input.presetDefinition.members.find((member) => {
      if (input.memberKey && member.memberKey === input.memberKey) {
        return true
      }

      if (input.externalId && member.senderExternalId === input.externalId) {
        return true
      }

      if (input.displayName && member.displayName === input.displayName) {
        return true
      }

      return false
    }) ?? null
  )
}

function getPresetAccentClasses(
  tone?: "amber" | "emerald" | "sky" | "violet"
) {
  switch (tone) {
    case "emerald":
      return {
        badge: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
        label: "text-emerald-700 dark:text-emerald-300",
        pill: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
      }
    case "amber":
      return {
        badge: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
        label: "text-amber-700 dark:text-amber-300",
        pill: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
      }
    case "violet":
      return {
        badge: "border-violet-500/30 bg-violet-500/10 text-violet-700 dark:text-violet-300",
        label: "text-violet-700 dark:text-violet-300",
        pill: "border-violet-500/30 bg-violet-500/10 text-violet-700 dark:text-violet-300",
      }
    case "sky":
    default:
      return {
        badge: "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300",
        label: "text-sky-700 dark:text-sky-300",
        pill: "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300",
      }
  }
}

function ParticipantIdentityBadge(input: {
  actorKind: "agent" | "human" | "tool"
  className?: string
  displayName?: string | null
  externalId?: string | null
  handle?: string | null
  memberKey?: string | null
  presetDefinition: ReturnType<typeof resolvePresetTeamDefinitionFromBlueprint>
  title?: string | null
}) {
  const presetMember = findPresetRoomMember({
    displayName: input.displayName,
    externalId: input.externalId,
    memberKey: input.memberKey,
    presetDefinition: input.presetDefinition,
  })

  if (presetMember) {
    return (
      <span
        className={cn(
          "inline-flex size-5 items-center justify-center rounded-full border text-[10px] font-medium",
          getPresetAccentClasses(presetMember.accentTone).badge,
          input.className
        )}
        title={`${presetMember.displayName} / ${presetMember.roleLabel}`}
      >
        {presetMember.initials}
      </span>
    )
  }

  if (input.actorKind === "agent") {
    return (
      <AgentIdentityIcon
        actorKind={input.actorKind}
        className={input.className}
        displayName={input.displayName ?? undefined}
        externalId={input.externalId ?? undefined}
        handle={input.handle ?? undefined}
        title={input.title ?? undefined}
      />
    )
  }

  return input.actorKind === "human" ? (
    <UserIcon className={input.className} />
  ) : (
    <BotIcon className={input.className} />
  )
}

function ParticipantRolePill(input: {
  displayName?: string | null
  externalId?: string | null
  memberKey?: string | null
  presetDefinition: ReturnType<typeof resolvePresetTeamDefinitionFromBlueprint>
  roleLabel?: string | null
}) {
  const presetMember = findPresetRoomMember({
    displayName: input.displayName,
    externalId: input.externalId,
    memberKey: input.memberKey,
    presetDefinition: input.presetDefinition,
  })

  if (!presetMember && !input.roleLabel) {
    return null
  }

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] tracking-[0.16em] uppercase",
        presetMember
          ? getPresetAccentClasses(presetMember.accentTone).pill
          : "border-border text-muted-foreground"
      )}
    >
      {presetMember?.roleLabel ?? input.roleLabel}
    </span>
  )
}

function LoadingRequestPanel() {
  return (
    <div className="flex items-center justify-center overflow-visible py-2">
      <DotMatrixSpinner className="text-muted-foreground" size={34} />
    </div>
  )
}

function BorealizingInlineLoader({
  label = "borealizing...",
  size = 34,
}: {
  label?: string
  size?: number
}) {
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <DotMatrixSpinner className="shrink-0 text-muted-foreground" size={size} />
      <span>{label}</span>
    </div>
  )
}

function PresetSpeakerInlineLoader(input: {
  displayName: string
  label?: string
  memberKey?: string | null
  presetDefinition: ReturnType<typeof resolvePresetTeamDefinitionFromBlueprint>
}) {
  const presetMember = findPresetRoomMember({
    displayName: input.displayName,
    memberKey: input.memberKey,
    presetDefinition: input.presetDefinition,
  })
  const tone = getPresetAccentClasses(presetMember?.accentTone)

  return (
    <div className={tone.label}>
      <BorealizingInlineLoader
        label={input.label ?? `${input.displayName} is borealizing...`}
      />
    </div>
  )
}

function RequestWorkersPanel({
  activePresetRoomTurn,
  onBrowseWorkers,
  onInviteLocalRuntime,
  onRefreshRequest,
  onViewProfile,
  canInviteLocalRuntime,
  isSolanaWalletReady,
  requestDetail,
  selectedIntent,
  shareUrl,
}: {
  activePresetRoomTurn: PresetTeamStreamTurn | null
  onBrowseWorkers: () => void
  onInviteLocalRuntime: () => void
  onRefreshRequest: () => Promise<void>
  onViewProfile: (profileId: string) => void
  canInviteLocalRuntime: boolean
  isSolanaWalletReady: boolean
  requestDetail: RequestDetail | null
  selectedIntent: SidebarIntentPreview | null
  shareUrl: string | null
}) {
  const requestPresetDefinition = useMemo(
    () => resolveRequestPresetDefinition(requestDetail, selectedIntent),
    [requestDetail, selectedIntent]
  )
  const [copied, setCopied] = useState(false)
  const intent = requestDetail?.intent
  const participants = useMemo(
    () => requestDetail?.participants ?? [],
    [requestDetail?.participants]
  )
  const [runtimePresence, setRuntimePresence] = useState<
    Record<string, "active" | "checking" | "offline">
  >({})
  const [desktopRouting, setDesktopRouting] =
    useState<RequestDesktopEnvelope | null>(null)
  const [desktopRoutingStatus, setDesktopRoutingStatus] = useState<
    "idle" | "loading" | "ready"
  >("idle")
  const [desktopRoutingNotice, setDesktopRoutingNotice] = useState<string | null>(
    null
  )
  const [assigningDesktopRuntime, setAssigningDesktopRuntime] =
    useState<DesktopNodeRuntimeFamily | null>(null)
  const assignmentSummary = useMemo(
    () => getRequestAssignmentSummary(requestDetail?.assignment),
    [requestDetail?.assignment]
  )
  const desktopIntentId = intent?._id ?? null
  const desktopRequestToken = intent?.requestToken ?? null
  const canAssignDesktop = Boolean(requestDetail?.access?.isOwner && intent?._id)
  const isWaitingForWorkers =
    participants.filter((participant) => participant.status !== "owner")
      .length === 0 &&
    (intent?.status === "open" || intent?.status === "proposed")

  useEffect(() => {
    if (!canAssignDesktop || !desktopIntentId || !desktopRequestToken) {
      setDesktopRouting(null)
      setDesktopRoutingNotice(null)
      setDesktopRoutingStatus("idle")
      return
    }

    let cancelled = false
    setDesktopRoutingStatus("loading")
    setDesktopRoutingNotice(null)

    async function loadDesktopRouting() {
      try {
        const response = await fetch(`/api/requests/${desktopIntentId}/desktop`, {
          cache: "no-store",
          method: "GET",
        })
        const payload = (await response
          .json()
          .catch(() => null)) as
          | RequestDesktopEnvelope
          | { error?: string }
          | null

        if (!response.ok) {
          throw new Error(
            payload && "error" in payload && typeof payload.error === "string"
              ? payload.error
              : "Could not load Boreal Desktop routing."
          )
        }

        if (cancelled) {
          return
        }

        setDesktopRouting(payload as RequestDesktopEnvelope)
        setDesktopRoutingStatus("ready")
      } catch (error) {
        if (cancelled) {
          return
        }

        setDesktopRouting({
          assignment: null,
          node: null,
          requestToken: desktopRequestToken,
        })
        setDesktopRoutingNotice(
          error instanceof Error
            ? error.message
            : "Could not load Boreal Desktop routing."
        )
        setDesktopRoutingStatus("ready")
      }
    }

    void loadDesktopRouting()

    return () => {
      cancelled = true
    }
  }, [canAssignDesktop, desktopIntentId, desktopRequestToken])

  async function handleAssignDesktop(runtimeFamily: DesktopNodeRuntimeFamily) {
    if (!desktopIntentId || assigningDesktopRuntime) {
      return
    }

    setDesktopRoutingNotice(null)
    setAssigningDesktopRuntime(runtimeFamily)

    try {
      const response = await fetch(`/api/requests/${desktopIntentId}/desktop`, {
        body: JSON.stringify({ runtimeFamily }),
        headers: {
          "content-type": "application/json",
        },
        method: "POST",
      })
      const payload = (await response
        .json()
        .catch(() => null)) as
        | RequestDesktopEnvelope
        | { created?: boolean; error?: string }
        | null

      if (!response.ok) {
        throw new Error(
          payload && "error" in payload && typeof payload.error === "string"
            ? payload.error
            : "Could not assign this request into Boreal Desktop."
        )
      }

      setDesktopRouting(payload as RequestDesktopEnvelope)
      setDesktopRoutingStatus("ready")
      setDesktopRoutingNotice(
        payload && "created" in payload && payload.created === false
          ? "This request is already queued on Boreal Desktop."
          : `Queued on ${runtimeFamily === "codex" ? "Codex" : "QVAC"}.`
      )
      await onRefreshRequest()
    } catch (error) {
      setDesktopRoutingNotice(
        error instanceof Error
          ? error.message
          : "Could not assign this request into Boreal Desktop."
      )
    } finally {
      setAssigningDesktopRuntime(null)
    }
  }

  useEffect(() => {
    const runtimeTargets = participants
      .filter(
        (participant) =>
          Boolean(participant.runtimeSupplyId) &&
          Boolean(participant.executorUrl ?? participant.mcpServerUrl)
      )
      .map((participant) => ({
        endpoint: participant.executorUrl ?? participant.mcpServerUrl ?? "",
        supplyId: participant.runtimeSupplyId!,
      }))

    if (runtimeTargets.length === 0) {
      return
    }

    let cancelled = false

    async function refreshPresence() {
      setRuntimePresence((current) => {
        const next = { ...current }
        for (const target of runtimeTargets) {
          if (!next[target.supplyId] || next[target.supplyId] === "offline") {
            next[target.supplyId] = "checking"
          }
        }
        return next
      })

      const results = await Promise.all(
        runtimeTargets.map(async (target) => {
          const healthUrl = getRuntimeHealthUrl(target.endpoint) ?? target.endpoint
          const controller = new AbortController()
          const timer = window.setTimeout(() => controller.abort(), 4000)

          try {
            // Probe from the owner's browser so localhost resolves to the
            // owner's machine, not Boreal's server runtime.
            const response = await fetch(healthUrl, {
              cache: "no-store",
              headers: {
                Accept: "application/json",
              },
              method: "GET",
              mode: "cors",
              signal: controller.signal,
            })
            const payload = (await response
              .json()
              .catch(() => null)) as { ok?: boolean } | null

            return [
              target.supplyId,
              response.ok && payload?.ok !== false ? "active" : "offline",
            ] as const
          } catch {
            return [target.supplyId, "offline"] as const
          } finally {
            window.clearTimeout(timer)
          }
        })
      )

      if (cancelled) {
        return
      }

      setRuntimePresence(
        Object.fromEntries(results) as Record<
          string,
          "active" | "checking" | "offline"
        >
      )
    }

    void refreshPresence()
    const timer = window.setInterval(() => {
      void refreshPresence()
    }, 30000)

    return () => {
      cancelled = true
      window.clearInterval(timer)
    }
  }, [participants])

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
      {canAssignDesktop ? (
        <RequestDesktopAssignmentCard
          assignment={desktopRouting?.assignment ?? null}
          assigningRuntimeFamily={assigningDesktopRuntime}
          isLoading={desktopRoutingStatus === "loading"}
          node={desktopRouting?.node ?? null}
          notice={desktopRoutingNotice}
          onAssign={handleAssignDesktop}
        />
      ) : null}

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
            {canInviteLocalRuntime ? (
              <Button
                onClick={onInviteLocalRuntime}
                size="sm"
                type="button"
                variant="outline"
              >
                <BotIcon className="size-4" />
                Invite local runtime
              </Button>
            ) : null}
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
        {requestPresetDefinition ? (
          <PresetRoomTeamPanel
            activePresetRoomTurn={activePresetRoomTurn}
            assignmentSummary={assignmentSummary}
            canInviteLocalRuntime={canInviteLocalRuntime}
            onInviteLocalRuntime={onInviteLocalRuntime}
            participants={participants}
            presetDefinition={requestPresetDefinition}
          />
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="space-y-1">
                <p className="text-xs tracking-[0.16em] text-muted-foreground uppercase">
                  Team
                </p>
                {assignmentSummary ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center rounded-full border border-border px-2 py-0.5 text-[10px] tracking-[0.16em] text-muted-foreground uppercase">
                      {assignmentSummary.label}
                    </span>
                    <span className="text-sm font-medium">
                      {assignmentSummary.title}
                    </span>
                    {assignmentSummary.meta ? (
                      <span className="text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
                        {assignmentSummary.meta}
                      </span>
                    ) : null}
                  </div>
                ) : null}
              </div>
              {canInviteLocalRuntime ? (
                <Button
                  onClick={onInviteLocalRuntime}
                  size="sm"
                  type="button"
                  variant="ghost"
                >
                  <BotIcon className="size-4" />
                  Invite local runtime
                </Button>
              ) : null}
            </div>
            <div className="space-y-3">
              {participants.map((participant) => (
                <div
                  className="border border-border p-3"
                  key={`${participant.displayName}-${participant.status}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex size-9 items-center justify-center border border-border">
                      <ParticipantIdentityBadge
                        actorKind={
                          participant.kind === "human"
                            ? "human"
                            : participant.kind === "tool"
                              ? "tool"
                              : "agent"
                        }
                        className="size-4 text-muted-foreground"
                        displayName={participant.displayName}
                        externalId={participant.externalId}
                        handle={participant.handle}
                        presetDefinition={requestPresetDefinition}
                        title={participant.title}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-medium">
                          {participant.displayName}
                        </p>
                        <span
                          className={cn(
                            "text-[11px] tracking-[0.16em] uppercase",
                            getRequestParticipantPresenceTone(
                              participant,
                              activePresetRoomTurn?.displayName,
                              participant.runtimeSupplyId
                                ? runtimePresence[participant.runtimeSupplyId] ??
                                  "checking"
                                : undefined
                            )
                          )}
                        >
                          {getRequestParticipantPresenceLabel(
                            participant,
                            activePresetRoomTurn?.displayName,
                            participant.runtimeSupplyId
                              ? runtimePresence[participant.runtimeSupplyId] ??
                                "checking"
                              : undefined
                          )}
                        </span>
                        <span className="text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
                          {participant.status}
                        </span>
                        {participant.role ? (
                          <ParticipantRolePill
                            displayName={participant.displayName}
                            externalId={participant.externalId}
                            presetDefinition={requestPresetDefinition}
                            roleLabel={participant.role}
                          />
                        ) : null}
                        {isSolanaWalletReady &&
                          isSolanaOperatorIdentity({
                            displayName: participant.displayName,
                            externalId: participant.externalId,
                            handle: participant.handle,
                            title: participant.title,
                          }) ? (
                          <span className="text-[11px] tracking-[0.16em] text-emerald-600 uppercase">
                            Solana connected
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {participant.runtimeSupplyId
                          ? participant.executorUrl ??
                            participant.mcpServerUrl ??
                            participant.handle ??
                            participant.kind
                          : participant.handle
                            ? `@${participant.handle}`
                            : participant.kind}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {participant.profileId ? (
                          <Button
                            onClick={() => onViewProfile(participant.profileId!)}
                            size="sm"
                            type="button"
                            variant="outline"
                          >
                            View profile
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function RequestDesktopAssignmentCard(input: {
  assignment: DesktopNodeAssignment | null
  assigningRuntimeFamily: DesktopNodeRuntimeFamily | null
  isLoading: boolean
  node: DesktopNodeEnvelope["node"] | null
  notice: string | null
  onAssign: (runtimeFamily: DesktopNodeRuntimeFamily) => Promise<void>
}) {
  const runtimeFamilies = input.node?.runtimeFamilies ?? []
  const activeAssignment = Boolean(
    input.assignment && isDesktopAssignmentInFlight(input.assignment.status)
  )

  return (
    <div className="space-y-4 rounded-xl border border-border/80 bg-background/60 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
            <BotIcon className="size-3.5" />
            <span>Boreal Desktop</span>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium">
              {input.node?.machineLabel ?? "Private desktop execution"}
            </p>
            <p className="text-xs text-muted-foreground">
              Queue this request into your private desktop node and let Codex or
              QVAC deliver back into the same request thread.
            </p>
          </div>
        </div>
        {input.node ? (
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">
              {formatDesktopAvailabilityLabel(input.node.availabilityStatus)}
            </Badge>
            <Badge variant="outline">
              {formatDesktopHealthLabel(input.node.connectorHealthStatus)}
            </Badge>
          </div>
        ) : null}
      </div>

      {input.isLoading && !input.node ? (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <LoaderIcon className="size-4 animate-spin" />
          Checking Boreal Desktop routing...
        </div>
      ) : null}

      {!input.isLoading && !input.node ? (
        <div className="space-y-2 rounded-xl border border-dashed border-border px-4 py-3">
          <p className="text-sm font-medium">No desktop node linked yet</p>
          <p className="text-xs text-muted-foreground">
            Open Boreal Desktop, sign in with the same wallet linked to this
            Boreal account, and register the node first.
          </p>
        </div>
      ) : null}

      {input.node ? (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            {runtimeFamilies.map((runtimeFamily) => (
              <Badge key={runtimeFamily} variant="outline">
                {runtimeFamily === "codex" ? "Codex" : "QVAC"}
              </Badge>
            ))}
            {input.node.lastHeartbeatAt ? (
              <span className="text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
                Heartbeat {formatDesktopTimestamp(input.node.lastHeartbeatAt)}
              </span>
            ) : null}
          </div>

          {input.assignment ? (
            <div className="space-y-2 rounded-xl border border-border px-4 py-3">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={cn(
                    "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] tracking-[0.16em] uppercase",
                    getDesktopAssignmentTone(input.assignment.status)
                  )}
                >
                  {formatDesktopAssignmentStatus(input.assignment.status)}
                </span>
                <span className="text-sm font-medium">
                  {input.assignment.runtimeFamily === "codex" ? "Codex" : "QVAC"}
                </span>
                <span className="text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
                  Updated {formatDesktopTimestamp(input.assignment.updatedAt)}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {input.assignment.summary}
              </p>
              {!input.assignment.requestCallbacksEnabled ? (
                <p className="text-xs text-muted-foreground">
                  Desktop queue is linked to this request, but live callback
                  streaming is still limited to one-request API jobs.
                </p>
              ) : null}
            </div>
          ) : null}

          <div className="flex flex-wrap gap-2">
            {runtimeFamilies.map((runtimeFamily) => {
              const isAssigning = input.assigningRuntimeFamily === runtimeFamily
              const label =
                activeAssignment && input.assignment?.runtimeFamily === runtimeFamily
                  ? runtimeFamily === "codex"
                    ? "Queued on Codex"
                    : "Queued on QVAC"
                  : runtimeFamily === "codex"
                    ? "Assign via Codex"
                    : "Assign via QVAC"

              return (
                <Button
                  disabled={
                    input.node?.availabilityStatus !== "available" ||
                    activeAssignment ||
                    Boolean(input.assigningRuntimeFamily)
                  }
                  key={runtimeFamily}
                  onClick={() => void input.onAssign(runtimeFamily)}
                  size="sm"
                  type="button"
                  variant={
                    input.assignment?.runtimeFamily === runtimeFamily
                      ? "default"
                      : "outline"
                  }
                >
                  {isAssigning ? <LoaderIcon className="size-4 animate-spin" /> : null}
                  {label}
                </Button>
              )
            })}
          </div>
        </div>
      ) : null}

      {input.notice ? (
        <p className="text-xs text-muted-foreground">{input.notice}</p>
      ) : null}
    </div>
  )
}

function PresetRoomTeamPanel(input: {
  activePresetRoomTurn: PresetTeamStreamTurn | null
  assignmentSummary: ReturnType<typeof getRequestAssignmentSummary>
  canInviteLocalRuntime: boolean
  onInviteLocalRuntime: () => void
  participants: RequestDetail["participants"]
  presetDefinition: NonNullable<ReturnType<typeof resolveRequestPresetDefinition>>
}) {
  const ownerParticipant =
    input.participants.find((participant) => participant.status === "owner") ??
    null
  const orderedParticipants = input.presetDefinition.members.map((member) => ({
    member,
    participant:
      input.participants.find(
        (participant) =>
          participant.externalId === member.senderExternalId ||
          participant.displayName === member.displayName
      ) ?? null,
  }))
  const activeSpeakerLabel =
    input.activePresetRoomTurn?.displayName ??
    orderedParticipants.find(
      ({ participant }) => participant?.roomPresence === "speaking"
    )?.member.displayName ??
    null

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
            <UsersIcon className="size-3.5" />
            <span>Team</span>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium">
              {input.assignmentSummary?.title ?? input.presetDefinition.teamDisplayName}
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <PresetTeamMemberIcons
                countLabel={`${input.presetDefinition.memberPreview.length} voices`}
                members={input.presetDefinition.memberPreview}
              />
              <span className="text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
                One owner
              </span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
            {activeSpeakerLabel ? (
              <span className="inline-flex items-center rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-emerald-700 dark:text-emerald-300">
                {activeSpeakerLabel} on turn
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full border border-border px-2 py-1">
                Awaiting next turn
              </span>
            )}
          </div>
        </div>
        {input.canInviteLocalRuntime ? (
          <Button
            onClick={input.onInviteLocalRuntime}
            size="sm"
            type="button"
            variant="ghost"
          >
            <BotIcon className="size-4" />
            Invite local runtime
          </Button>
        ) : null}
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {ownerParticipant ? (
          <PresetRoomOwnerCard participant={ownerParticipant} />
        ) : null}
        {orderedParticipants.map(({ member, participant }) => (
          <PresetRoomMemberCard
            activePresetSpeakerName={input.activePresetRoomTurn?.displayName}
            key={member.memberKey}
            member={member}
            participant={participant}
            presetDefinition={input.presetDefinition}
          />
        ))}
      </div>
    </div>
  )
}

function PresetRoomOwnerCard({
  participant,
}: {
  participant: RequestDetail["participants"][number]
}) {
  return (
    <div className="rounded-xl border border-border/80 bg-background/60 p-3">
      <div className="flex items-start gap-3">
        <div className="flex size-9 items-center justify-center rounded-full border border-border text-muted-foreground">
          <UserIcon className="size-4" />
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-medium">{participant.displayName}</p>
            <span className="inline-flex items-center rounded-full border border-border px-2 py-0.5 text-[10px] tracking-[0.16em] text-muted-foreground uppercase">
              owner
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Can reply between turns and steer the next speaker.
          </p>
        </div>
      </div>
    </div>
  )
}

function PresetRoomMemberCard(input: {
  activePresetSpeakerName?: string | null
  member: NonNullable<ReturnType<typeof resolveRequestPresetDefinition>>["members"][number]
  presetDefinition: NonNullable<ReturnType<typeof resolveRequestPresetDefinition>>
  participant: RequestDetail["participants"][number] | null
}) {
  const presenceLabel = input.participant
    ? getRequestParticipantPresenceLabel(
        input.participant,
        input.activePresetSpeakerName
      )
    : input.activePresetSpeakerName === input.member.displayName
      ? "speaking"
      : "ready"
  const presenceTone = input.participant
    ? getRequestParticipantPresenceTone(
        input.participant,
        input.activePresetSpeakerName
      )
    : presenceLabel === "speaking"
      ? "text-emerald-600"
      : "text-muted-foreground"

  return (
    <div className="rounded-xl border border-border/80 bg-background/60 p-3">
      <div className="flex items-start gap-3">
        <span
          className={cn(
            "inline-flex size-9 items-center justify-center rounded-full border text-[10px] font-medium",
            getPresetAccentClasses(input.member.accentTone).badge
          )}
        >
          {input.member.initials}
        </span>
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-medium">{input.member.displayName}</p>
            <ParticipantRolePill
              displayName={input.member.displayName}
              externalId={input.member.senderExternalId}
              memberKey={input.member.memberKey}
              presetDefinition={input.presetDefinition}
              roleLabel={input.member.roleLabel}
            />
            <span
              className={cn(
                "text-[11px] tracking-[0.16em] uppercase",
                presenceTone
              )}
            >
              {formatPresetRoomPresenceLabel(presenceLabel)}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            {getPresetRoomMemberSummary(input.member.memberKey)}
          </p>
        </div>
      </div>
    </div>
  )
}

function getPresetRoomMemberSummary(memberKey: string) {
  switch (memberKey) {
    case "moderator":
      return "Frames the motion, sets the criteria, and keeps both sides aligned."
    case "affirmative":
      return "Builds the strongest serious case for the first option."
    case "negative":
      return "Presses the strongest serious case for the second option."
    case "judge":
      return "Closes the room with the verdict and recommendation."
    default:
      return "Participates as a named voice in the debate room."
  }
}

function formatPresetRoomPresenceLabel(label: string) {
  switch (label) {
    case "speaking":
      return "on turn"
    case "waiting":
      return "queued"
    case "ready":
      return "ready"
    case "active now":
      return "active"
    default:
      return label
  }
}

function formatDesktopAvailabilityLabel(
  status: DesktopNodeEnvelope["node"]["availabilityStatus"]
) {
  switch (status) {
    case "available":
      return "available"
    case "draining":
      return "draining"
    case "paused":
      return "paused"
    case "offline":
      return "offline"
    default:
      return status
  }
}

function formatDesktopAssignmentStatus(status: DesktopNodeAssignment["status"]) {
  switch (status) {
    case "queued_for_desktop":
      return "queued"
    case "accepted_by_desktop":
      return "accepted"
    case "executing_on_desktop":
      return "executing"
    case "waiting_for_owner_input":
      return "waiting"
    case "delivered_by_desktop":
      return "delivered"
    case "failed_on_desktop":
      return "failed"
    case "rejected_by_desktop":
      return "rejected"
    case "expired":
      return "expired"
  }

  return "queued"
}

function formatDesktopHealthLabel(
  status: DesktopNodeEnvelope["node"]["connectorHealthStatus"]
) {
  switch (status) {
    case "healthy":
      return "healthy"
    case "failing":
      return "offline"
    default:
      return "unknown"
  }
}

function formatDesktopTimestamp(timestamp: string) {
  const value = Date.parse(timestamp)

  if (Number.isNaN(value)) {
    return "just now"
  }

  return new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    month: "short",
  }).format(value)
}

function getDesktopAssignmentTone(status: DesktopNodeAssignment["status"]) {
  switch (status) {
    case "accepted_by_desktop":
    case "delivered_by_desktop":
    case "executing_on_desktop":
      return "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
    case "queued_for_desktop":
    case "waiting_for_owner_input":
      return "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300"
    case "failed_on_desktop":
    case "rejected_by_desktop":
    case "expired":
      return "border-destructive/30 bg-destructive/10 text-destructive"
    default:
      return "border-border text-muted-foreground"
  }
}

function isDesktopAssignmentInFlight(status: DesktopNodeAssignment["status"]) {
  return (
    status === "queued_for_desktop" ||
    status === "accepted_by_desktop" ||
    status === "executing_on_desktop" ||
    status === "waiting_for_owner_input"
  )
}

function getRequestParticipantPresenceLabel(
  participant: RequestDetail["participants"][number],
  activePresetSpeakerName?: string | null,
  runtimePresence?: "active" | "checking" | "offline"
) {
  if (activePresetSpeakerName && participant.displayName === activePresetSpeakerName) {
    return "speaking"
  }

  if (participant.roomPresence === "speaking") {
    return "speaking"
  }

  if (participant.roomPresence === "waiting") {
    return "waiting"
  }

  if (participant.roomPresence === "ready") {
    return "ready"
  }

  if (participant.runtimeSupplyId) {
    if (runtimePresence === "active") {
      return "active now"
    }

    if (runtimePresence === "checking") {
      return "checking"
    }

    if (runtimePresence === "offline") {
      return "offline"
    }

    if (participant.connectorHealthStatus === "healthy") {
      return "active now"
    }

    if (participant.connectorHealthStatus === "unknown") {
      return "assigned"
    }

    return "offline"
  }

  const lastActivityAgeMs = participant.lastActivityAt
    ? Date.now() - participant.lastActivityAt
    : null

  if (lastActivityAgeMs !== null && lastActivityAgeMs < 5 * 60 * 1000) {
    return "active now"
  }

  if (participant.status === "owner") {
    return "owner"
  }

  if (participant.lastActivityAt) {
    return "idle"
  }

  return "assigned"
}

function getRequestParticipantPresenceTone(
  participant: RequestDetail["participants"][number],
  activePresetSpeakerName?: string | null,
  runtimePresence?: "active" | "checking" | "offline"
) {
  const label = getRequestParticipantPresenceLabel(
    participant,
    activePresetSpeakerName,
    runtimePresence
  )

  if (label === "active now" || label === "speaking") {
    return "text-emerald-600"
  }

  if (label === "checking") {
    return "text-amber-600"
  }

  if (label === "offline") {
    return "text-destructive"
  }

  return "text-muted-foreground"
}

function LocalRuntimeInviteDialog({
  currentRequestTitle,
  draft,
  invitedSupplyIds,
  invitingSupplyId,
  isCreating,
  isOpen,
  localRuntimeSupplies,
  onCreateAndInvite,
  onInvite,
  onOpenChange,
  setDraft,
}: {
  currentRequestTitle: string | null
  draft: LocalRuntimeDraft
  invitedSupplyIds: string[]
  invitingSupplyId: string | null
  isCreating: boolean
  isOpen: boolean
  localRuntimeSupplies: NonNullable<MyProfileRecord>["supplies"]
  onCreateAndInvite: () => Promise<void>
  onInvite: (supplyId: string) => Promise<boolean>
  onOpenChange: (open: boolean) => void
  setDraft: Dispatch<SetStateAction<LocalRuntimeDraft>>
}) {
  const runtimeCount = localRuntimeSupplies.length

  function applyRuntimePreset(runtimeKind: LocalRuntimeDraft["runtimeKind"]) {
    setDraft((current) => ({
      ...current,
      description:
        runtimeKind === "ollama"
          ? "Private Ollama runtime for this request."
          : runtimeKind === "lmstudio"
            ? "Private LM Studio runtime for this request."
            : "Private local runtime for this request.",
      runtimeKind,
      title:
        runtimeKind === "ollama"
          ? "Ollama Runtime"
          : runtimeKind === "lmstudio"
            ? "LM Studio Runtime"
            : "Local Runtime",
    }))
  }

  return (
    <Dialog onOpenChange={onOpenChange} open={isOpen}>
      <DialogContent className="max-w-3xl p-0 sm:max-w-3xl">
        <div className="flex max-h-[85vh] flex-col overflow-hidden">
          <DialogHeader className="border-b border-border px-6 py-4">
            <DialogTitle>Invite local runtime</DialogTitle>
            <DialogDescription>
              Attach a localhost bridge runtime to this active request.{" "}
              {currentRequestTitle
                ? `Current request: ${currentRequestTitle}.`
                : "Only active request threads can use this flow."}
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="min-h-0 flex-1">
            <div className="space-y-6 px-6 py-5">
              <section className="space-y-3">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Saved local runtimes</p>
                  <p className="text-xs text-muted-foreground">
                    Only localhost HTTP or MCP bridges appear here. This does
                    not use Boreal Desktop or raw Codex directly.
                  </p>
                </div>
                {runtimeCount === 0 ? (
                  <div className="border border-dashed border-border p-4 text-sm text-muted-foreground">
                    No local runtimes saved yet. Start one bridge, then add it
                    below.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {localRuntimeSupplies.map((supply) => {
                      const isInvited = invitedSupplyIds.includes(supply._id)
                      const endpoint = supply.executorUrl ?? supply.mcpServerUrl

                      return (
                        <div
                          className="space-y-3 border border-border p-4"
                          key={supply._id}
                        >
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="space-y-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="text-sm font-medium">
                                  {supply.title}
                                </p>
                                <Badge variant="outline">
                                  {supply.executionSurface ?? "runtime"}
                                </Badge>
                                <Badge variant="outline">
                                  {supply.connectorHealthStatus ?? "unknown"}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {endpoint ?? "No runtime endpoint saved yet."}
                              </p>
                            </div>
                            <Button
                              disabled={isInvited || invitingSupplyId === supply._id}
                              onClick={() => void onInvite(supply._id)}
                              size="sm"
                              type="button"
                              variant={isInvited ? "ghost" : "outline"}
                            >
                              {isInvited
                                ? "In team"
                                : invitingSupplyId === supply._id
                                  ? "Inviting..."
                                  : "Invite"}
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </section>

              <section className="space-y-4 border-t border-border pt-5">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Add local runtime</p>
                  <p className="text-xs text-muted-foreground">
                    Boreal expects your local bridge URL, not the raw model
                    port. Examples: `npm run agent:bridge:ollama` or `npm run
                    agent:bridge:lmstudio`. After invite, send your next message
                    in this same request thread and Boreal will forward it to
                    the runtime directly.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={() => applyRuntimePreset("ollama")}
                    size="sm"
                    type="button"
                    variant={draft.runtimeKind === "ollama" ? "default" : "outline"}
                  >
                    Ollama
                  </Button>
                  <Button
                    onClick={() => applyRuntimePreset("lmstudio")}
                    size="sm"
                    type="button"
                    variant={draft.runtimeKind === "lmstudio" ? "default" : "outline"}
                  >
                    LM Studio
                  </Button>
                  <Button
                    onClick={() => applyRuntimePreset("custom")}
                    size="sm"
                    type="button"
                    variant={draft.runtimeKind === "custom" ? "default" : "outline"}
                  >
                    Custom
                  </Button>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">
                      Runtime name
                    </p>
                    <Input
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          title: event.currentTarget.value,
                        }))
                      }
                      placeholder="Ollama Runtime"
                      value={draft.title}
                    />
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">
                      Executor URL
                    </p>
                    <Input
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          executorUrl: event.currentTarget.value,
                        }))
                      }
                      placeholder="http://127.0.0.1:8790/boreal/chat"
                      value={draft.executorUrl}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">
                    Description
                  </p>
                  <Input
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        description: event.currentTarget.value,
                      }))
                    }
                    placeholder="Private local runtime for this request."
                    value={draft.description}
                  />
                </div>
              </section>
            </div>
          </ScrollArea>

          <DialogFooter className="border-t border-border px-6 py-4 sm:justify-between">
            <p className="text-xs text-muted-foreground">
              Invite is the owner approval for localhost bridges. Boreal Desktop
              uses the separate desktop-node flow.
            </p>
            <Button
              disabled={isCreating}
              onClick={() => void onCreateAndInvite()}
              type="button"
            >
              {isCreating ? "Saving..." : "Save and invite"}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function ProposalViewerPanel({
  approvingMatchedSupplyId,
  approvingProposalId,
  canSubmitDelivery,
  deliveryDraft,
  deliverySubmitted,
  hasSubmittedProposal,
  isApprovingMatchedSupply,
  isDraftingProposal,
  isRefiningMatches,
  isSubmittingDelivery,
  isSubmittingProposal,
  matchQueryDraft,
  onApproveMatchedSupply,
  onApproveProposal,
  onDeliveryFilesSelected,
  onDraftProposal,
  onOpenProfileBuilder,
  onRefineMatches,
  onRemoveDeliveryAttachment,
  onSubmitDelivery,
  onSubmitProposal,
  proposalDraft,
  proposalMessage,
  requestDetail,
  onViewProfile,
  setDeliveryDraft,
  setMatchQueryDraft,
  setProposalDraft,
  setProposalMessage,
}: {
  approvingMatchedSupplyId: string | null
  approvingProposalId: string | null
  canSubmitDelivery: boolean
  deliveryDraft: DeliveryDraft
  deliverySubmitted: boolean
  hasSubmittedProposal: boolean
  isApprovingMatchedSupply: boolean
  isDraftingProposal: boolean
  isRefiningMatches: boolean
  isSubmittingDelivery: boolean
  isSubmittingProposal: boolean
  matchQueryDraft: string
  onApproveMatchedSupply: (
    supplyId: string,
    intentId?: string | null
  ) => Promise<void>
  onApproveProposal: (proposalId: string) => Promise<void>
  onDeliveryFilesSelected: (files: File[]) => Promise<void>
  onDraftProposal: () => Promise<void>
  onOpenProfileBuilder: () => void
  onRefineMatches: () => Promise<void>
  onRemoveDeliveryAttachment: (attachmentId: string) => void
  onSubmitDelivery: () => Promise<void>
  onSubmitProposal: () => Promise<void>
  proposalDraft: ProposalDraft
  proposalMessage: string
  requestDetail: RequestDetail | null
  onViewProfile: (profileId: string) => void
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
          approvingMatchedSupplyId={approvingMatchedSupplyId}
          isOwner={isOwner}
          isApprovingMatchedSupply={isApprovingMatchedSupply}
          isRefiningMatches={isRefiningMatches}
          matchAttempts={requestDetail?.intent?.matchAttempts ?? 0}
          matchCandidates={matchCandidates}
          matchQueryDraft={matchQueryDraft}
          onApproveMatchedSupply={onApproveMatchedSupply}
          onRefineMatches={onRefineMatches}
          onViewProfile={onViewProfile}
          setMatchQueryDraft={setMatchQueryDraft}
        />
      ) : null}

      {isProfileUpdateRequest ? (
        <div className="space-y-4 border border-border p-4">
          <div className="space-y-1">
            <p className="text-sm font-medium">Profile onboarding</p>
            <p className="text-xs text-muted-foreground">
              Use the builder to save your work profile and publish the first
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
                      <Button
                        onClick={() => onViewProfile(proposal.proposer.profileId!)}
                        size="sm"
                        type="button"
                        variant="outline"
                      >
                        View profile
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
  approvingMatchedSupplyId,
  isOwner,
  isApprovingMatchedSupply,
  isRefiningMatches,
  matchAttempts,
  matchCandidates,
  matchQueryDraft,
  onApproveMatchedSupply,
  onRefineMatches,
  onViewProfile,
  setMatchQueryDraft,
}: {
  approvingMatchedSupplyId: string | null
  isOwner: boolean
  isApprovingMatchedSupply: boolean
  isRefiningMatches: boolean
  matchAttempts: number
  matchCandidates: CatalogItem[]
  matchQueryDraft: string
  onApproveMatchedSupply: (
    supplyId: string,
    intentId?: string | null
  ) => Promise<void>
  onRefineMatches: () => Promise<void>
  onViewProfile: (profileId: string) => void
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
            Ranked supply stays attached to this request so you can approve a
            team without losing the request timeline.
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
              These listings passed the current gates and can be approved
              directly into the team now.
            </p>
          </div>
          <div className="space-y-3">
            {feasibleMatches.map((item) => (
              <RequestMatchCard
                approvingMatchedSupplyId={approvingMatchedSupplyId}
                isOwner={isOwner}
                isApprovingMatchedSupply={isApprovingMatchedSupply}
                item={item}
                key={item.id}
                onApproveMatchedSupply={onApproveMatchedSupply}
                onViewProfile={onViewProfile}
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
                approvingMatchedSupplyId={approvingMatchedSupplyId}
                isOwner={false}
                isApprovingMatchedSupply={false}
                item={item}
                key={item.id}
                onApproveMatchedSupply={onApproveMatchedSupply}
                onViewProfile={onViewProfile}
              />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}

function RequestMatchCard({
  approvingMatchedSupplyId,
  isOwner,
  isApprovingMatchedSupply,
  item,
  onApproveMatchedSupply,
  onViewProfile,
}: {
  approvingMatchedSupplyId: string | null
  isOwner: boolean
  isApprovingMatchedSupply: boolean
  item: CatalogItem
  onApproveMatchedSupply: (
    supplyId: string,
    intentId?: string | null
  ) => Promise<void>
  onViewProfile: (profileId: string) => void
}) {
  const isBlocked = item.gatedOutReasons.length > 0
  const confidence = item.successProbability ?? item.matchScore ?? 0
  const isApprovingThisMatch =
    isApprovingMatchedSupply && approvingMatchedSupplyId === item.id

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
        {isOwner && item.isPinned ? (
          <span className="inline-flex items-center border border-primary/30 px-2 py-1 text-[11px] tracking-[0.16em] text-primary uppercase">
            pinned
          </span>
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
        {isOwner && !isBlocked ? (
          <Button
            disabled={isApprovingThisMatch}
            onClick={() => void onApproveMatchedSupply(item.id)}
            size="sm"
            type="button"
          >
            {isApprovingThisMatch ? (
              <LoaderIcon className="animate-spin" />
            ) : (
              <CheckIcon />
            )}
            Approve to team
          </Button>
        ) : null}
        {item.seller?.profileId ? (
          <Button
            onClick={() => onViewProfile(item.seller!.profileId!)}
            size="sm"
            type="button"
            variant="outline"
          >
            View profile
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
  onViewProfile,
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
  onViewProfile: (profileId: string) => void
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
                                {item.sellerProfileId ? (
                                  <Button
                                    onClick={() => onViewProfile(item.sellerProfileId!)}
                                    size="sm"
                                    type="button"
                                    variant="ghost"
                                  >
                                    View profile
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
  assignedTeam: NonNullable<RequestDetail["assignment"]>["team"] | null | undefined,
  access: RequestDetail["access"],
  reviewPending: boolean,
  activity: RequestDetail["activity"]
) {
  const status = intent.status
  const handlingMode = getRequestHandlingMode(intent)
  const awaitingSpecialistReply = isAwaitingSpecialistReply(activity, intent)
  const waitingOnSpecialistResponse = isWaitingOnSpecialistResponse(
    activity,
    intent
  )

  if (reviewPending) {
    return {
      description:
        "The work is delivered. Capture a quick rating inline before moving on.",
      kind: "review" as const,
      title: "Delivery finished",
    }
  }

  if (
    !assignedTeam?.presetKey &&
    intent.needsClarification &&
    intent.missingDetails.length > 0
  ) {
    return {
      description:
        status === "proposed"
          ? "This draft is still being scoped. Reply in chat or use the prompts below before Boreal opens it as tracked work."
          : "Reply in thread to steer the request or narrow the comparison if you want a more specific result.",
      kind: "clarification" as const,
      title: "Needs scope",
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
              ? "The strongest matched specialist is already highlighted below. Approve that route card when you want Boreal to start tracked work."
              : "Approve to let Boreal Agent take the first pass on this request.",
      kind: "approval" as const,
      title:
        handlingMode === "clarify"
          ? "Needs scope"
          : handlingMode === "workers"
            ? "Open for workers"
            : isMatchedCatalogRoute
              ? "Best route ready"
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

  if (status === "payment_required" && access?.isOwner) {
    return {
      description:
        "The route and quote are locked. Attach the wallet receipt below to start execution in this same request thread.",
      kind: "payment_required" as const,
      title: "Funding required",
    }
  }

  if (
    awaitingSpecialistReply &&
    (status === "claimed" || status === "in_progress") &&
    access?.isOwner
  ) {
    return {
      description:
        "The approved specialist is waiting on your reply in this same request thread.",
      kind: "awaiting_reply" as const,
      title: "Reply in thread",
    }
  }

  if (
    waitingOnSpecialistResponse &&
    (status === "claimed" || status === "in_progress") &&
    access?.isOwner
  ) {
    return {
      description:
        "Your reply is in. Boreal is waiting for the approved specialist to answer in this same request thread.",
      kind: "waiting_specialist" as const,
      title: "Waiting on specialist",
    }
  }

  if ((status === "claimed" || status === "in_progress") && access?.isOwner) {
    return {
      description:
        "Work is active. Refresh when you need the latest state, and only mark it fulfilled after the final delivery lands in chat.",
      kind: "in_flight" as const,
      title: "Work in flight",
    }
  }

  if (status === "blocked" && access?.isOwner) {
    return {
      description: isVideoProviderAccessUnavailableError(
        getLatestBlockedErrorMessage(activity)
      )
        ? "Video Generation cannot run under the current OpenAI project or key. Fix provider access, or reopen this request for workers now."
        : "Automatic execution hit an error. Retry it, or reopen it for workers if you want people or external agents to take over.",
      kind: "blocked" as const,
      title: "Needs intervention",
    }
  }

  if (status === "fulfilled" && access?.isOwner) {
    return {
      description:
        "This request is complete. No further action is required here.",
      kind: "none" as const,
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

function normalizeChatMode(value: string | null) {
  return value === "sessions" ? "sessions" : null
}

function normalizeShellAccountView(
  value: string | null
): BorealShellAccountView | null {
  if (value === "settings") {
    return value
  }

  return null
}

function normalizeShellModal(value: string | null): BorealShellModal | null {
  if (value === "profile-builder") {
    return value
  }

  return null
}

function normalizeProfileQuery(value: string | null) {
  if (!value) {
    return null
  }

  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function parseProfileLookup(value: string) {
  if (value.startsWith("external:")) {
    return {
      externalId: value.slice("external:".length),
      kind: "externalId" as const,
    }
  }

  return {
    kind: "profileId" as const,
    profileId: value,
  }
}

function normalizeCenterSheetView(value: string | null): CenterSheetView | null {
  if (
    value === "about" ||
    value === "agent" ||
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

function buildPendingPresetTeamTurns(input: {
  activeIntentId: string | null
  presetDefinition: ReturnType<typeof resolvePresetTeamDefinitionFromBlueprint>
  presetState: PresetTeamState | null | undefined
}): PresetTeamStreamTurn[] | undefined {
  if (
    !input.presetDefinition ||
    !input.presetState ||
    input.presetState.runStatus !== "running"
  ) {
    return undefined
  }

  const rawTurnIndex = input.activeIntentId
    ? input.presetState?.nextTurnIndex ?? 0
    : 0
  const turnIndex =
    rawTurnIndex >= input.presetDefinition.turns.length || rawTurnIndex < 0
      ? 0
      : rawTurnIndex
  const turn = input.presetDefinition.turns[turnIndex]

  if (!turn) {
    return undefined
  }

  const member =
    input.presetDefinition.members.find(
      (candidate) => candidate.memberKey === turn.memberKey
    ) ?? null

  if (!member) {
    return undefined
  }

  return [
    {
      content: null,
      displayName: member.displayName,
      memberKey: member.memberKey,
      roleLabel: member.roleLabel,
      state: "pending",
      teamDisplayName: input.presetDefinition.teamDisplayName,
      totalTurns: input.presetDefinition.turns.length,
      turnIndex,
    },
  ]
}

function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === "AbortError"
}

async function consumeChatStream(input: {
  assistantMessageId: string
  onRequestOpened?: (intentId: string) => void
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
        | { payload: ChatAssistantDebugEvent; type: "debug" }
        | { message: string; type: "error" }
        | ChatAssistantStreamEvent
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

      if (event.type === "debug") {
        input.setMessages((current) =>
          current.map((message) =>
            message.id === input.assistantMessageId
              ? {
                ...message,
                debugEvents: upsertAssistantDebugEvent(
                  message.debugEvents,
                  event.payload
                ),
              }
              : message
          )
        )
        continue
      }

      if (event.type === "request-opened") {
        input.onRequestOpened?.(event.payload.intentId)
        continue
      }

      if (event.type === "preset-team-turn") {
        input.setMessages((current) =>
          current.map((message) =>
            message.id === input.assistantMessageId
              ? {
                  ...message,
                  presetTeamTurns: upsertPresetTeamTurn(
                    message.presetTeamTurns,
                    event.payload
                  ),
                }
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
        ? finalPayload.assistantMessage.trim()
          ? {
              ...message,
              content: finalPayload.assistantMessage,
              presetTeamTurns: undefined,
            }
          : message
        : message
    )
  )

  return finalPayload
}

function upsertPresetTeamTurn(
  current: PresetTeamStreamTurn[] | undefined,
  nextTurn: PresetTeamStreamTurn
) {
  const turns = [...(current ?? [])]
  const existingIndex = turns.findIndex(
    (turn) => turn.turnIndex === nextTurn.turnIndex
  )

  if (existingIndex >= 0) {
    turns[existingIndex] = {
      ...turns[existingIndex],
      ...nextTurn,
    }
  } else {
    turns.push(nextTurn)
  }

  return turns.sort((left, right) => left.turnIndex - right.turnIndex)
}

function PresetTeamStreamingCard({
  turns,
}: {
  turns: PresetTeamStreamTurn[]
}) {
  const teamDisplayName = turns[0]?.teamDisplayName ?? "Preset team"
  const presetDefinition = getPresetTeamDefinition("debate-and-verdict")

  return (
    <div className="space-y-3 border border-border bg-card/60 p-3">
      <div className="flex items-center gap-2 text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
        <BotIcon className="size-3" />
        <span>{teamDisplayName} live</span>
      </div>
      <div className="space-y-3">
        {turns.map((turn) => (
          <div className="space-y-1" key={`${turn.memberKey}-${turn.turnIndex}`}>
            {(() => {
              const presetMember = findPresetRoomMember({
                displayName: turn.displayName,
                memberKey: turn.memberKey,
                presetDefinition,
              })

              return (
            <div className="flex items-center gap-2 text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
              <span
                className={cn(
                  "inline-flex size-5 items-center justify-center rounded-full border text-[10px] font-medium",
                  getPresetAccentClasses(presetMember?.accentTone).badge
                )}
              >
                {turn.displayName.slice(0, 1)}
              </span>
              <span>{turn.displayName}</span>
              <ParticipantRolePill
                displayName={turn.displayName}
                memberKey={turn.memberKey}
                presetDefinition={presetDefinition}
                roleLabel={turn.roleLabel}
              />
              {turn.state === "pending" ? (
                <span
                  className={cn(
                    "inline-flex items-center",
                    getPresetAccentClasses(presetMember?.accentTone).label
                  )}
                >
                  <span>borealizing</span>
                </span>
              ) : null}
            </div>
              )
            })()}
            {turn.content?.trim() ? (
              <MessageResponse className="[&_a]:inline-flex [&_a]:items-center [&_a]:rounded-full [&_a]:border [&_a]:border-border [&_a]:px-2.5 [&_a]:py-1 [&_a]:text-xs [&_a]:tracking-[0.16em] [&_a]:uppercase">
                {turn.content}
              </MessageResponse>
            ) : turn.state === "pending" ? (
              <PresetSpeakerInlineLoader
                displayName={turn.displayName}
                memberKey={turn.memberKey}
                presetDefinition={presetDefinition}
              />
            ) : null}
          </div>
        ))}
      </div>
    </div>
  )
}

function AssistantDebugTools({
  events,
}: {
  events: ChatAssistantDebugEvent[]
}) {
  return (
    <div className="space-y-2 pt-2">
      {events.map((event) => (
        <Tool defaultOpen key={event.id}>
          <ToolHeader
            state={event.state}
            title={event.title}
            type={event.type}
          />
          <ToolContent>
            {event.input !== undefined ? <ToolInput input={event.input} /> : null}
            {event.output !== undefined || event.errorText ? (
              <ToolOutput
                errorText={event.errorText ?? undefined}
                output={event.output}
              />
            ) : null}
          </ToolContent>
        </Tool>
      ))}
    </div>
  )
}

function upsertAssistantDebugEvent(
  events: ChatAssistantDebugEvent[] | undefined,
  nextEvent: ChatAssistantDebugEvent
) {
  const current = events ?? []
  const existingIndex = current.findIndex((event) => event.id === nextEvent.id)

  if (existingIndex === -1) {
    return [...current, nextEvent]
  }

  return current.map((event, index) =>
    index === existingIndex ? nextEvent : event
  )
}

function buildChatUiContext(input: {
  activeIntentId: string | null
  composerAgents: MountedComposerAgent[]
  pendingProviderSelection?: ProviderSelectionState | null
  presetRoomCommand?: ChatUiContext["presetRoomCommand"]
  providerSelectionCommand?: ChatUiContext["providerSelectionCommand"]
  requestDetail: RequestDetail | null
  selectedCenterTab: CenterViewTab
  walletAddress?: string | null
  workspaceTab: WorkspaceTab
}): ChatUiContext {
  const isOwner = input.requestDetail?.access?.canApproveProposals ?? false
  const canSubmitProposal =
    input.requestDetail?.access?.canSubmitProposal ?? false
  const mountedMarketAgents = input.composerAgents
  const primaryMountedAgent = mountedMarketAgents[0] ?? null

  return {
    browseTab: input.workspaceTab,
    canApproveProposals: isOwner,
    canSubmitProposal,
    centerTab: input.activeIntentId ? input.selectedCenterTab : null,
    mountedAgentKeys: mountedMarketAgents
      .map((agent) => agent.directAgentKey)
      .filter((value): value is string => Boolean(value)),
    mountedPresetTeamKey:
      primaryMountedAgent && isMountedPresetTeam(primaryMountedAgent)
        ? primaryMountedAgent.presetTeamKey ?? null
        : null,
    mountedPresetTeamTitle:
      primaryMountedAgent && isMountedPresetTeam(primaryMountedAgent)
        ? primaryMountedAgent.title
        : null,
    mountedSupplyActorKind: primaryMountedAgent?.actorKind ?? null,
    mountedSupplyId: primaryMountedAgent?.supplyId ?? null,
    mountedSupplyIds: mountedMarketAgents.map((agent) => agent.supplyId),
    mountedSupplyTitle: primaryMountedAgent?.title ?? null,
    mountedSupplyTitles: mountedMarketAgents.map((agent) => agent.title),
    pendingProviderSelection: input.pendingProviderSelection ?? null,
    presetRoomCommand: input.presetRoomCommand ?? null,
    providerSelectionCommand: input.providerSelectionCommand ?? null,
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
    walletAddress: input.walletAddress ?? null,
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

const MOUNTED_TEAM_THREAD_MESSAGE_ID = "mounted-team-thread-intro"

const DIRECT_AGENT_DISPLAY_NAMES: Record<string, string> = {
  copywriter: "Copywriter",
  "image-studio": "Image Studio",
  "math-expert": "Math Expert",
  "motion-video-studio": "Video Generation",
  "mvp-architect": "MVP Architect",
  "research-analyst": "Research Analyst",
  "solana-operator": "Solana Operator",
  "startup-pressure-test": "Startup Pressure Test",
  "voiceover-studio": "Voiceover Studio",
}

function getMountedAgentKeyFromSourceCapabilityId(
  sourceCapabilityId?: string | null
) {
  return getAutonomousAgentKeyFromSourceCapabilityId(sourceCapabilityId)
}

function isDirectAgentKey(value: string) {
  return value in DIRECT_AGENT_DISPLAY_NAMES
}

function getDirectAgentDisplayName(key: string) {
  return getPublicReadySpecialistDisplayName(
    key,
    DIRECT_AGENT_DISPLAY_NAMES[key] ?? key
  ) ?? key
}

function isMountedPresetTeam(agent: MountedComposerAgent | null | undefined) {
  return agent?.kind === "preset_team" || Boolean(agent?.presetTeamKey)
}

function buildMountedPresetTeamSelection(presetTeamKey: string) {
  const definition = getPresetTeamDefinition(presetTeamKey)

  if (!definition) {
    return null
  }

  return {
    actorKind: "agent" as const,
    directAgentKey: null,
    kind: "preset_team" as const,
    memberPreview: definition.memberPreview,
    presetTeamKey: definition.key,
    sourceCapabilityId: buildPresetTeamSourceCapabilityId(definition.key),
    supplyId: buildPresetTeamSourceCapabilityId(definition.key),
    title: definition.teamDisplayName,
  } satisfies MountedComposerAgent
}

function getLiveRequestAssistantLabel(requestDetail: RequestDetail) {
  const activeParticipants = requestDetail.participants
    .filter(
      (participant) =>
        participant.kind === "agent" && participant.status !== "owner"
    )
    .map((participant) => participant.displayName)
    .filter(Boolean)

  if (activeParticipants.length > 0) {
    return activeParticipants.join(", ")
  }

  if (requestDetail.assignment?.team?.teamDisplayName) {
    return requestDetail.assignment.team.teamDisplayName
  }

  const assignedTools = requestDetail.assignment?.tools ?? []
  const namedTools = assignedTools
    .map((toolName) =>
      isDirectAgentKey(toolName) ? getDirectAgentDisplayName(toolName) : toolName
    )
    .filter(Boolean)

  if (namedTools.length > 0) {
    return namedTools.join(", ")
  }

  return requestDetail.assignment?.agent ?? BOREAL_AGENT_DISPLAY_NAME
}

function resolveMountedComposerAgent(listing: CatalogEntry) {
  if (listing._id === DEFAULT_MOUNTED_COMPOSER_AGENT.supplyId) {
    return DEFAULT_MOUNTED_COMPOSER_AGENT
  }

  const presetTeam = getPresetTeamDefinitionFromSourceCapabilityId(
    listing.sourceCapabilityId
  )

  if (
    listing.actorKind === "agent" &&
    listing.supportsDirectInvoke &&
    presetTeam
  ) {
    return {
      actorKind: listing.actorKind,
      directAgentKey: null,
      kind: "preset_team",
      memberPreview: presetTeam.memberPreview,
      presetTeamKey: presetTeam.key,
      sourceCapabilityId: listing.sourceCapabilityId ?? null,
      supplyId: listing._id,
      title: presetTeam.teamDisplayName,
    } satisfies MountedComposerAgent
  }

  const directAgentKey = getMountedAgentKeyFromSourceCapabilityId(
    listing.sourceCapabilityId
  )

  if (
    listing.actorKind !== "agent" ||
    !listing.supportsDirectInvoke ||
    !directAgentKey
  ) {
    return null
  }

  return {
    actorKind: listing.actorKind,
    directAgentKey,
    sourceCapabilityId: listing.sourceCapabilityId ?? null,
    supplyId: listing._id,
    title: getDirectAgentDisplayName(directAgentKey),
  } satisfies MountedComposerAgent
}

function toggleMountedComposerAgents(
  current: MountedComposerAgent[],
  nextAgent: MountedComposerAgent
) {
  if (current.some((agent) => agent.supplyId === nextAgent.supplyId)) {
    return current.filter((agent) => agent.supplyId !== nextAgent.supplyId)
  }

  return [...current, nextAgent]
}

function formatMountedComposerTeamLabel(agents: MountedComposerAgent[]) {
  if (agents.length === 0) {
    return DEFAULT_MOUNTED_COMPOSER_AGENT.title
  }

  if (agents.length === 1) {
    return agents[0]!.title
  }

  return agents.map((agent) => agent.title).join(", ")
}

function getMountedComposerStarterPrompts(agents: MountedComposerAgent[]) {
  if (agents.length === 1 && isMountedPresetTeam(agents[0])) {
    return getPresetTeamStarterPromptInventory(agents[0]?.presetTeamKey)
  }

  return getMountedAgentStarterPrompts(
    agents.map((agent) => agent.directAgentKey),
  )
}

function buildMountedTeamIntroMessage(agents: MountedComposerAgent[]): ChatMessage {
  const soloSpecialistMeta =
    agents.length === 1
      ? getPublicReadySpecialistMeta(agents[0]!.directAgentKey)
      : null
  const presetTeam =
    agents.length === 1 && isMountedPresetTeam(agents[0])
      ? getPresetTeamDefinition(agents[0]?.presetTeamKey)
      : null

  if (presetTeam) {
    return {
      content: `${presetTeam.teamDisplayName} is selected. Send one professional comparison or tradeoff and Boreal will open the request and start the room right away.`,
      createdAt: Date.now(),
      id: MOUNTED_TEAM_THREAD_MESSAGE_ID,
      role: "assistant",
    }
  }

  return {
    content:
      agents.length === 1
        ? `${agents[0]!.title} is selected. ${soloSpecialistMeta ? `Runtime: ${soloSpecialistMeta.providerCompany} • ${soloSpecialistMeta.model}. ` : ""}Describe the task and Boreal will open the request and start that specialist right away.`
        : `${formatMountedComposerTeamLabel(agents)} are selected. Describe the task and Boreal will open one request for this agent team right away.`,
    createdAt: Date.now(),
    id: MOUNTED_TEAM_THREAD_MESSAGE_ID,
    role: "assistant",
  }
}

function deriveRequestComposerAgents(requestDetail: RequestDetail | null) {
  if (!requestDetail) {
    return []
  }

  const presetDefinition = resolveRequestPresetDefinition(requestDetail)
  const presetSelection = presetDefinition
    ? buildMountedPresetTeamSelection(presetDefinition.key)
    : null

  if (presetSelection) {
    return [presetSelection]
  }

  const participantAgents = requestDetail.participants
    .filter(
      (participant) =>
        participant.kind === "agent" && participant.status !== "owner",
    )
    .filter(
      (participant, index, collection) =>
        collection.findIndex(
          (candidate) =>
            candidate.externalId === participant.externalId &&
            candidate.displayName === participant.displayName
        ) === index
    )

  const nonBorealParticipantAgents = participantAgents.filter(
    (participant) => participant.externalId !== "agent:boreal"
  )
  const visibleParticipants =
    nonBorealParticipantAgents.length > 0
      ? nonBorealParticipantAgents
      : participantAgents

  if (visibleParticipants.length > 0) {
    return visibleParticipants.map((participant) => ({
      actorKind: "agent" as const,
      directAgentKey:
        participant.externalId?.startsWith("agent:")
          ? participant.externalId.slice("agent:".length)
          : null,
      sourceCapabilityId:
        participant.externalId?.startsWith("agent:")
          ? `autonomous-agent:${participant.externalId.slice("agent:".length)}`
          : null,
      supplyId: participant.externalId ?? participant.displayName,
      title:
        participant.externalId?.startsWith("agent:")
          ? getDirectAgentDisplayName(
              participant.externalId.slice("agent:".length)
            )
          : participant.displayName,
    }))
  }

  const assignedTools = (requestDetail.assignment?.tools ?? [])
    .filter((tool) => isDirectAgentKey(tool))
    .map((tool) => ({
      actorKind: "agent" as const,
      directAgentKey: tool,
      sourceCapabilityId: `autonomous-agent:${tool}`,
      supplyId: tool,
      title: getDirectAgentDisplayName(tool),
    }))

  if (assignedTools.length > 0) {
    return assignedTools
  }

  if (requestDetail.assignment?.agent) {
    return [
      {
        actorKind: "agent" as const,
        directAgentKey: null,
        sourceCapabilityId: null,
        supplyId: requestDetail.assignment.agent,
        title: requestDetail.assignment.agent,
      },
    ]
  }

  return [DEFAULT_MOUNTED_COMPOSER_AGENT]
}

function resolveRequestPresetDefinition(
  requestDetail: RequestDetail | null | undefined,
  fallbackPreview?: SidebarIntentPreview | null,
) {
  if (!requestDetail && !fallbackPreview) {
    return null
  }

  return (
    resolvePresetTeamDefinitionFromBlueprint({
      members: requestDetail?.assignment?.team?.members,
      presetKey: requestDetail?.assignment?.team?.presetKey,
      teamDisplayName:
        requestDetail?.assignment?.team?.teamDisplayName ??
        requestDetail?.assignment?.agent ??
        fallbackPreview?.assignedAgent ??
        undefined,
    }) ??
    resolvePresetTeamDefinitionFromParticipants(
      requestDetail?.participants ?? fallbackPreview?.participants ?? []
    ) ??
    inferPresetTeamDefinitionFromRequestLike({
      assignedAgent:
        requestDetail?.assignment?.agent ?? fallbackPreview?.assignedAgent,
      summary: requestDetail?.intent?.summary ?? fallbackPreview?.summary,
      title: requestDetail?.intent?.title ?? fallbackPreview?.title,
    })
  )
}

function MountedComposerTeamCues({
  agents,
  canClear,
  onClear,
}: {
  agents: MountedComposerAgent[]
  canClear: boolean
  onClear?: (supplyId: string) => void
}) {
  return (
    <>
      {agents.map((agent) => (
        <BorealAgentCue
          actorKind={agent.actorKind}
          agentKey={agent.directAgentKey}
          canClear={canClear && agent.supplyId !== DEFAULT_MOUNTED_COMPOSER_AGENT.supplyId}
          key={agent.supplyId}
          label={agent.title}
          onClear={() => onClear?.(agent.supplyId)}
        />
      ))}
    </>
  )
}

function InlineWorkspaceCard({
  approvalIntentId,
  approvingMatchedSupplyId,
  isApprovingRoute,
  isProviderRouteSubmitting,
  isRefreshingVideo,
  isWalletReady,
  onApproveMatchedSupply,
  onApproveRoute,
  onConfirmProviderRoute,
  onConnectWallet,
  onDownloadVideo,
  onOpenProfileBuilder,
  onQuickReply,
  onRefreshVideo,
  onViewProfile,
  walletAddress,
  walletConnection,
  walletProvider,
  workspace,
}: {
  approvalIntentId?: string | null
  approvingMatchedSupplyId?: string | null
  isApprovingRoute?: boolean
  isProviderRouteSubmitting?: boolean
  isRefreshingVideo: boolean
  isWalletReady?: boolean
  onApproveMatchedSupply: (
    supplyId: string,
    intentId?: string | null
  ) => Promise<void>
  onApproveRoute?: (intentId?: string | null) => Promise<void>
  onConfirmProviderRoute?: (input: {
    paymentReceipt?: ProviderRoutePaymentReceipt | null
    routeKey: string
    selection: ProviderSelectionState
  }) => Promise<void>
  onConnectWallet?: () => void
  onDownloadVideo: (videoId: string) => void
  onOpenProfileBuilder: () => void
  onQuickReply: (value: string) => void
  onRefreshVideo: () => void
  onViewProfile: (profileId: string) => void
  walletAddress?: string | null
  walletConnection?: ReturnType<typeof usePayment>["solanaConnection"]
  walletProvider?: ProviderSelectionWalletProvider | null
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
              approvingMatchedSupplyId={approvingMatchedSupplyId ?? null}
              highlighted={item.id === highlightedId}
              isApprovingRoute={Boolean(isApprovingRoute)}
              item={item}
              key={item.id}
              onApproveMatchedSupply={onApproveMatchedSupply}
              onApproveRoute={onApproveRoute}
              onViewProfile={onViewProfile}
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

  if (workspace.kind === "provider_selection") {
    return (
      <ProviderSelectionCard
        headingSubtitle={workspace.subtitle}
        headingTitle={workspace.title}
        isSubmitting={Boolean(isProviderRouteSubmitting)}
        isWalletReady={Boolean(isWalletReady)}
        onConfirmRoute={async ({ paymentReceipt, routeKey }) => {
          if (!onConfirmProviderRoute) {
            return
          }

          await onConfirmProviderRoute({
            paymentReceipt,
            routeKey,
            selection: workspace.selection,
          })
        }}
        onConnectWallet={() => onConnectWallet?.()}
        selection={workspace.selection}
        walletAddress={walletAddress}
        walletConnection={walletConnection}
        walletProvider={walletProvider}
      />
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
  approvingMatchedSupplyId,
  highlighted,
  isApprovingRoute,
  item,
  onApproveMatchedSupply,
  onApproveRoute,
  onViewProfile,
}: {
  approvalIntentId?: string | null
  approvingMatchedSupplyId: string | null
  highlighted: boolean
  isApprovingRoute: boolean
  item: CatalogItem
  onApproveMatchedSupply: (
    supplyId: string,
    intentId?: string | null
  ) => Promise<void>
  onApproveRoute?: (intentId?: string | null) => Promise<void>
  onViewProfile: (profileId: string) => void
}) {
  const canApproveRoute =
    Boolean(approvalIntentId) && highlighted && typeof onApproveRoute === "function"
  const canInviteMatchedSupply =
    Boolean(approvalIntentId) &&
    !isRoutePreviewCatalogItem(item) &&
    item.gatedOutReasons.length === 0
  const isInvitingMatchedSupply = approvingMatchedSupplyId === item.id

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
        {canInviteMatchedSupply ? (
          <Button
            disabled={isInvitingMatchedSupply}
            onClick={() =>
              void onApproveMatchedSupply(item.id, approvalIntentId)
            }
            size="sm"
            type="button"
          >
            {isInvitingMatchedSupply ? (
              <LoaderIcon className="animate-spin" />
            ) : (
              <CheckIcon />
            )}
            Invite
          </Button>
        ) : canApproveRoute ? (
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
            Invite
          </Button>
        ) : null}
        {item.seller?.profileId ? (
          <Button
            onClick={() => onViewProfile(item.seller!.profileId!)}
            size="sm"
            type="button"
            variant="outline"
          >
            View profile
          </Button>
        ) : null}
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
  const assignmentSummary = getRequestAssignmentSummary(requestDetail?.assignment)

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
            {assignmentSummary ? (
              <p>
                {assignmentSummary.label}: {assignmentSummary.title}
                {assignmentSummary.meta ? ` / ${assignmentSummary.meta}` : ""}
              </p>
            ) : (
              <p>Agent: Waiting for team</p>
            )}
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

      {requestDetail?.receipts?.length ? (
        <div className="space-y-3 border border-border p-4">
          <p className="text-xs tracking-[0.16em] text-muted-foreground uppercase">
            Receipts
          </p>
          <div className="space-y-3">
            {requestDetail.receipts.map((receipt) => (
              <RequestReceiptCard
                key={`${receipt.routeKey}-${receipt.requestToken ?? receipt.recordedAt}-${receipt.status}`}
                receipt={receipt}
              />
            ))}
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
              <div className="border-l border-accent pl-3" key={activity._id}>
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
    detected: "Intent detected",
    "matching.completed": "Matching updated",
    "matching.empty": "No matches found",
    "request.approved": "Request approved",
    "request.awaiting_approval": "Awaiting approval",
    "request.blocked": "Execution blocked",
    "request.desktop_assigned": "Desktop assigned",
    "request.delivered": "Route delivered",
    "request.execution_started": "Execution started",
    "request.follow_up": "Specialist follow-up",
    "request.fulfilled": "Request fulfilled",
    "request.opened_for_workers": "Opened for workers",
    "request.retrying": "Retry started",
    "request.solana_signature_captured": "Solana signature captured",
    "request.solana_transaction_submitted": "Solana transaction submitted",
    "request.team_assigned": "Team assigned",
    "thread.message_posted": "Reply posted",
    "thread.reply_posted": "Reply posted",
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

  if (typeof payload.title === "string") {
    parts.push(`Node: ${payload.title}`)
  }

  if (typeof payload.machineLabel === "string") {
    parts.push(`Machine: ${payload.machineLabel}`)
  }

  if (typeof payload.rating === "number") {
    parts.push(`Rating: ${payload.rating}/5`)
  }

  if (typeof payload.amountSol === "string") {
    parts.push(`Amount: ${payload.amountSol} SOL`)
  }

  if (typeof payload.destination === "string") {
    parts.push(`Destination: ${payload.destination}`)
  }

  if (typeof payload.memo === "string") {
    parts.push(`Memo: ${payload.memo}`)
  }

  if (typeof payload.message === "string") {
    parts.push(`Message: ${payload.message}`)
  }

  if (typeof payload.walletAddress === "string") {
    parts.push(`Wallet: ${compactHexLike(payload.walletAddress, 6)}`)
  }

  if (typeof payload.signature === "string") {
    parts.push(`Signature: ${compactHexLike(payload.signature)}`)
  }

  if (typeof payload.network === "string") {
    parts.push(`Network: ${payload.network}`)
  }

  if (typeof payload.routeLabel === "string" && payload.routeLabel.trim().length > 0) {
    parts.push(`Route: ${payload.routeLabel}`)
  } else if (typeof payload.routeTarget === "string") {
    parts.push(`Route: ${payload.routeTarget.replaceAll("_", " ")}`)
  }

  if (typeof payload.error === "string" && payload.error.trim().length > 0) {
    parts.push(`Error: ${payload.error}`)
  }

  return parts.join(" | ")
}

function collectCompletedSolanaActionIds(activity: RequestDetail["activity"]) {
  const actionIds = new Set<string>()

  for (const entry of activity) {
    if (
      entry.type !== "request.solana_signature_captured" &&
      entry.type !== "request.solana_transaction_submitted"
    ) {
      continue
    }

    if (typeof entry.payload?.actionId === "string") {
      actionIds.add(entry.payload.actionId)
    }
  }

  return actionIds
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

function isAwaitingSpecialistReply(
  activity: RequestDetail["activity"],
  intent: NonNullable<RequestDetail["intent"]>
) {
  const latestActivity = [...activity].reverse()[0]

  if (!latestActivity) {
    return false
  }

  return (
    (intent.status === "claimed" || intent.status === "in_progress") &&
    latestActivity.type === "request.follow_up"
  )
}

function isWaitingOnSpecialistResponse(
  activity: RequestDetail["activity"],
  intent: NonNullable<RequestDetail["intent"]>
) {
  if (intent.status !== "claimed" && intent.status !== "in_progress") {
    return false
  }

  let sawOwnerReplyAfterFollowUp = false

  for (let index = activity.length - 1; index >= 0; index -= 1) {
    const entry = activity[index]

    if (!entry) {
      continue
    }

    if (entry.type === "request.delivered" || entry.type === "request.blocked") {
      return false
    }

    if (entry.type === "request.follow_up") {
      return sawOwnerReplyAfterFollowUp
    }

    if (entry.type === "thread.message_posted") {
      sawOwnerReplyAfterFollowUp = true
    }
  }

  return false
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
            : "Open the profile editor manually, or approve Boreal to draft a stronger profile and primary offer from this brief.",
      title: "Profile editor",
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

  if (
    detail.intent.status === "payment_required" &&
    detail.pendingPayment?.selection
  ) {
    const routeLabel =
      detail.pendingPayment.selection.options[0]?.displayTitle ?? "specialist"

    return {
      kind: "provider_selection",
      selection: detail.pendingPayment.selection,
      subtitle:
        `Funding starts ${routeLabel} in this same request thread. Boreal records the signed receipt and verified Solana transaction before work begins.`,
      title: "Fund specialist",
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
            ? isVideoProviderAccessUnavailableError(blockedErrorMessage)
              ? `Video Generation is unavailable under the current OpenAI project or key. Fix provider access, then retry, or reopen this request for workers now.`
              : `Automatic route failed: ${blockedErrorMessage} You can retry it or reopen it for workers.`
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

function isRoutePreviewCatalogItem(item: CatalogItem) {
  return item.id.startsWith("route-preview:")
}
