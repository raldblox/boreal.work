import { makeFunctionReference } from "convex/server";

import type { PersistedIntent } from "@/lib/boreal/schemas/intent";

export type RecordIntentPipelineArgs = {
  assistantMessage: string;
  conversationId?: string;
  initialStatus?: string;
  intent: PersistedIntent;
  ownerDisplayName?: string;
  ownerExternalId?: string;
  ownerHandle?: string;
  userMessage: string;
};

export type RecordIntentPipelineResult = {
  assistantMessageId: string;
  conversationId: string;
  intentId: string;
  intentKey: string;
  userMessageId: string;
};

export type RecentIntentPreview = {
  _creationTime: number;
  _id: string;
  category: string;
  generationSignals: PersistedIntent["generationSignals"];
  requestedOutputTypes: PersistedIntent["requestedOutputTypes"];
  routing: PersistedIntent["routing"];
  summary: string;
  title: string;
};

export type SidebarIntentPreview = {
  _creationTime: number;
  _id: string;
  assignedAgent: string | null;
  category: string;
  conversationId: string | null;
  isOwner?: boolean;
  needsClarification: boolean;
  participants: Array<{
    displayName: string;
    externalId: string | null;
    handle: string | null;
    kind: string;
    status: string;
  }>;
  provider: string;
  requestedOutputTypes: PersistedIntent["requestedOutputTypes"];
  reviewRating: number | null;
  routeTarget: PersistedIntent["routeTarget"];
  status: string;
  summary: string;
  title: string;
  updatedAt: number;
  visibility?: "private" | "public";
};

export type ConversationSidebarPreview = {
  _id: string;
  conversationId: string;
  intentCount: number;
  lastMessageBody: string | null;
  lastMessageRole: "assistant" | "system" | "user" | null;
  latestMessageAt: number;
  linkedRequests: Array<{
    id: string;
    needsClarification: boolean;
    routeTarget: string;
    status: string;
    title: string;
    updatedAt: number;
  }>;
  messageCount: number;
  title: string;
  updatedAt: number;
};

export type ConversationThreadRecord = {
  conversation: {
    _id: string;
    conversationId: string;
    intentCount: number;
    lastMessageBody: string | null;
    lastMessageRole: "assistant" | "system" | "user" | null;
    latestMessageAt: number;
    messageCount: number;
    title: string;
    updatedAt: number;
  };
  linkedRequests: Array<{
    id: string;
    needsClarification: boolean;
    routeTarget: string;
    status: string;
    title: string;
    updatedAt: number;
  }>;
  messages: Array<{
    _id: string;
    body: string;
    createdAt: number;
    role: "assistant" | "system" | "user";
    sender: {
      actorKind: "agent" | "human" | "tool";
      displayName: string;
      externalId: string | null;
      handle: string | null;
    };
  }>;
} | null;

export type BorealChatSessionRecord = Array<{
  conversation: {
    _id: string;
    conversationId: string;
    intentCount: number;
    lastMessageBody: string | null;
    lastMessageRole: "assistant" | "system" | "user" | null;
    latestMessageAt: number;
    messageCount: number;
    title: string;
    updatedAt: number;
  };
  linkedRequests: Array<{
    id: string;
    needsClarification: boolean;
    routeTarget: string;
    status: string;
    title: string;
    updatedAt: number;
  }>;
  messages: Array<{
    _id: string;
    body: string;
    createdAt: number;
    role: "assistant" | "system" | "user";
    sender: {
      actorKind: "agent" | "human" | "tool";
      displayName: string;
      externalId: string | null;
      handle: string | null;
    };
  }>;
}>;

export type CatalogEntry = {
  _id: string;
  actorKind: "agent" | "human" | "tool";
  averageRating: number | null;
  brand: string | null;
  capabilityTags: string[];
  category: string;
  checkoutProtocol: "acp" | "custom" | "ucp" | null;
  currency: string;
  deliveryType: string;
  description: string;
  estimatedDeliveryLabel: string | null;
  executionSurface: "handoff" | "http" | "jsonrpc" | "mcp" | "registry" | "sdk" | "widget" | null;
  executorUrl: string | null;
  fulfillmentKind: string;
  gatedOutReasons: string[];
  isCartEnabled: boolean;
  isPinned: boolean;
  matchReasons: string[];
  matchScore: number | null;
  matchStage: "feasible" | "notified" | "ranked" | "reserved" | "retrieved" | null;
  paymentNetworkHints: string[];
  paymentProtocol: "direct-solana" | "mpp" | "none" | "widget" | "x402" | null;
  priceAmount: number | null;
  priceType: string;
  requiresHumanApproval: boolean;
  reviewCount: number;
  seller: {
    actorKind: "agent" | "human" | "tool";
    displayName: string;
    handle: string | null;
    profileId: string | null;
  } | null;
  sourceListingUrl: string | null;
  sourceProviderKey: "agentcash" | "agentic-market" | "frames" | "manual" | "moonpay" | "solana-agent-kit" | null;
  subtitle: string | null;
  supplyType: string;
  supportsDirectInvoke: boolean;
  supportsPrivyWallet: boolean;
  successProbability: number | null;
  title: string;
  trustScore: number;
};

export type ActiveCart = {
  _id: string;
  createdAt: number;
  currency: string;
  itemCount: number;
  items: Array<{
    _id: string;
    category: string;
    currency: string;
    deliveryType: string;
    fulfillmentKind: string;
    lineTotalAmount: number;
    paymentNetworkHints: string[];
    paymentProtocol: "direct-solana" | "mpp" | "none" | "widget" | "x402" | null;
    priceType: string;
    quantity: number;
    sellerDisplayName: string | null;
    sellerProfileId: string | null;
    sourceProviderKey: "agentcash" | "agentic-market" | "frames" | "manual" | "moonpay" | "solana-agent-kit" | null;
    subtitle: string | null;
    supplyId: string;
    supportsDirectInvoke: boolean;
    title: string;
    unitPriceAmount: number | null;
    updatedAt: number;
  }>;
  sourceIntentId: string | null;
  status: string;
  subtotalAmount: number;
  updatedAt: number;
} | null;

export type CheckoutRecord = {
  _id: string;
  createdAt: number;
  currency: string;
  itemCount: number;
  items: Array<{
    _id: string;
    accessLabel: string | null;
    accessUrl: string | null;
    category: string;
    deliveryType: string;
    fulfillmentKind: string;
    payment: {
      amount: number | null;
      attemptId: string;
      currency: string;
      errorMessage: string | null;
      network: string | null;
      protocol: "direct-solana" | "mpp" | "none" | "widget" | "x402";
      providerKey: "agentcash" | "agentic-market" | "frames" | "manual" | "moonpay" | "solana-agent-kit";
      receiptJson: string | null;
      status: "cancelled" | "failed" | "paid" | "pending_approval" | "processing" | "ready_to_pay";
      txHash: string | null;
      walletAddress: string | null;
    } | null;
    priceType: string;
    quantity: number;
    reviewRating: number | null;
    sellerDisplayName: string | null;
    sellerProfileId: string | null;
    serviceInvocation: {
      endpointMethod: string | null;
      endpointUrl: string | null;
      executionSurface: "handoff" | "http" | "jsonrpc" | "mcp" | "registry" | "sdk" | "widget";
      providerKey: "agentcash" | "agentic-market" | "frames" | "manual" | "moonpay" | "solana-agent-kit";
      responseJson: string | null;
      resultUrl: string | null;
      status: "awaiting_payment" | "cancelled" | "completed" | "failed" | "handoff_required" | "in_progress" | "submitted";
      updatedAt: number;
    } | null;
    sourceListingUrl: string | null;
    sourceProviderKey: "agentcash" | "agentic-market" | "frames" | "manual" | "moonpay" | "solana-agent-kit" | null;
    status: string;
    subtitle: string | null;
    supplyId: string;
    title: string;
    unitPriceAmount: number | null;
  }>;
  status: string;
  subtotalAmount: number;
  updatedAt: number;
};

export type PublicProfilePreview = {
  _id: string;
  actorKind: "agent" | "human" | "tool";
  availabilityStatus: "available" | "limited" | "unavailable";
  bio: string;
  capabilityTags: string[];
  displayName: string;
  handle: string | null;
  headline: string;
  isMine: boolean;
  productLabels: string[];
  skillTags: string[];
  supplyCount: number;
};

export type ProfileSupplyEntry = {
  _id: string;
  availabilityStatus: "available" | "limited" | "unavailable" | null;
  capabilityTags: string[];
  category: string;
  connectorHealthStatus: "failing" | "healthy" | "unknown" | null;
  connectorLastHeartbeatAt: number | null;
  connectorLastTestedAt: number | null;
  deliveryType?: string;
  description: string;
  executionSurface: "handoff" | "http" | "jsonrpc" | "mcp" | "registry" | "sdk" | "widget" | null;
  executorUrl: string | null;
  maxConcurrentJobs: number | null;
  mcpServerUrl: string | null;
  mcpToolName: string | null;
  openApiUrl: string | null;
  outputTypes: Array<"image_generation" | "speech_generation" | "text" | "video_generation">;
  priceAmount: number | null;
  priceType: string;
  responseSlaMinutes: number | null;
  status: string;
  supplyType: string;
  supportsEvidencePush: boolean;
  supportsDirectInvoke: boolean;
  supportsStatusUpdates: boolean;
  title: string;
};

export type MyProfileRecord = {
  analytics: ProfileAnalytics;
  profile: {
    _id: string | null;
    activeAgentRole: "agent" | "both" | "supply" | null;
    activeAgentSupplyId: string | null;
    actorKind: "agent" | "human" | "tool";
    agentControlMode: "auto_fallback" | "boreal" | "connected" | "none";
    availabilityStatus: "available" | "limited" | "unavailable";
    avatarUrl: string | null;
    bio: string;
    capabilityTags: string[];
    displayName: string;
    handle: string | null;
    headline: string;
    isPublic: boolean;
    productLabels: string[];
    skillTags: string[];
  };
  supplies: ProfileSupplyEntry[];
  user: {
    _id: string;
    displayName: string;
    handle: string | null;
  };
} | null;

export type ConnectedAgentControlRecord = {
  activeSupply: {
    _id: string;
    capabilityTags: string[];
    connectorHealthStatus: "failing" | "healthy" | "unknown" | null;
    deliveryType: string;
    executionSurface: "handoff" | "http" | "jsonrpc" | "mcp" | "registry" | "sdk" | "widget" | null;
    executorUrl: string | null;
    mcpServerUrl: string | null;
    mcpToolName: string | null;
    openApiUrl: string | null;
    outputTypes: Array<"image_generation" | "speech_generation" | "text" | "video_generation">;
    responseSlaMinutes: number | null;
    supportsEvidencePush: boolean;
    supportsDirectInvoke: boolean;
    supportsStatusUpdates: boolean;
    title: string;
  } | null;
  mode: "auto_fallback" | "boreal" | "connected" | "none";
  role: "agent" | "both" | "supply" | null;
};

export type WalletAccountRecord = Array<{
  _id: string;
  chainFamily: "evm" | "solana";
  chainId: string | null;
  environment: "devnet" | "mainnet" | "testnet";
  isDefaultBuyer: boolean;
  isDefaultPayout: boolean;
  networkKey:
    | "base:mainnet"
    | "base:sepolia"
    | "ethereum:mainnet"
    | "ethereum:sepolia"
    | "polygon:amoy"
    | "polygon:mainnet"
    | "solana:devnet"
    | "solana:mainnet"
    | "solana:testnet";
  roles: Array<"buyer" | "connected" | "payout">;
  walletAddress: string;
  walletProvider: "agentcash" | "manual" | "openwallet" | "privy" | "siwx";
}>;

export type ProfileAnalytics = {
  activeCount: number;
  activeSupplyCount: number;
  activityBuckets: Array<{
    count: number;
    label: string;
  }>;
  averageCompletionHours: number | null;
  averageRating: number | null;
  blockedCount: number;
  buyerCheckoutCount: number;
  fulfilledCount: number;
  grossEarned: number;
  grossSpend: number;
  openCount: number;
  productSupplyCount: number;
  recentRequests: Array<{
    _id: string;
    requestedOutputTypes: PersistedIntent["requestedOutputTypes"];
    status: string;
    summary: string;
    title: string;
    updatedAt: number;
  }>;
  requestCount: number;
  reviewCount: number;
  sellerOrderCount: number;
  supplyCount: number;
  totalHandledCount: number;
  totalProposalCount: number;
  updatedAt: number;
};

export type WorkerProfileDetail = {
  analytics: ProfileAnalytics;
  profile: {
    _id: string;
    actorKind: "agent" | "human" | "tool";
    availabilityStatus: "available" | "limited" | "unavailable";
    avatarUrl: string | null;
    bio: string;
    capabilityTags: string[];
    displayName: string;
    handle: string | null;
    headline: string;
    isMine: boolean;
    isPublic: boolean;
    productLabels: string[];
    skillTags: string[];
  };
  supplies: ProfileSupplyEntry[];
} | null;

export type BorealAgentStats = ProfileAnalytics;

export type ArtifactMetadataArgs = {
  artifactKind: "image" | "audio" | "video";
  conversationId: string;
  intentKey?: string;
  mediaType?: string;
  metadataJson?: string;
  provider: string;
  remoteId?: string;
  status: "ready" | "queued" | "in_progress" | "failed";
  subtitle: string;
  title: string;
};

export type UpdateArtifactMetadataArgs = {
  artifactId: string;
  mediaType?: string;
  metadataJson?: string;
  remoteId?: string;
  status: "ready" | "queued" | "in_progress" | "failed";
  subtitle?: string;
  title?: string;
};

export type SyncVideoArtifactArgs = {
  mediaType?: string;
  metadataJson?: string;
  remoteId: string;
  status: "ready" | "queued" | "in_progress" | "failed";
};

export type RequestMessage = {
  _id: string;
  body: string;
  createdAt: number;
  role: "assistant" | "system" | "user";
  sender: {
    actorKind: "agent" | "human" | "tool";
    displayName: string;
    externalId: string | null;
    handle: string | null;
    isCurrentUser: boolean;
    profileId: string | null;
  };
};

export type RequestArtifact = {
  _id: string;
  artifactKind: "audio" | "image" | "video";
  createdAt: number;
  mediaType: string | null;
  metadata: Record<string, unknown> | null;
  provider: string;
  remoteId: string | null;
  status: "failed" | "in_progress" | "queued" | "ready";
  subtitle: string;
  title: string;
  updatedAt: number;
};

export type RequestActivity = {
  _id: string;
  createdAt: number;
  payload: Record<string, unknown> | null;
  type: string;
};

export type RequestDetail = {
  access: {
    canApproveProposals: boolean;
    canSubmitProposal: boolean;
    canSubmitWork: boolean;
    canViewChat: boolean;
    isOwner: boolean;
    visibility: "private" | "public";
  } | null;
  activity: RequestActivity[];
  artifact: RequestArtifact | null;
  assignment: {
    agent: string | null;
    provider: string;
    tools: string[];
  } | null;
  catalogItems: CatalogEntry[];
  conversationId: string | null;
  fulfillment: {
    acceptedProposalId: string | null;
    completedSummary: string;
    evidence: {
      attachments: Array<{
        fileName: string;
        mediaType: string;
        sizeBytes: number;
        url: string | null;
      }>;
      body: string;
      createdAt: number;
      mediaType: string;
      url: string | null;
    } | null;
    fulfillerUserId: string | null;
    status: string;
  } | null;
  intent: {
    _creationTime: number;
    _id: string;
    approvedAt: number | null;
    body: string;
    catalogQuery: string;
    cancelledAt: number | null;
    category: string;
    closedReason: string | null;
    completedAt: number | null;
    confidence: number;
    missingDetails: string[];
    matchAttempts: number;
    needsClarification: boolean;
    pinnedSupplyIds: string[];
    provider: string;
    requestedOutputTypes: PersistedIntent["requestedOutputTypes"];
    responseInstructions: string;
    resolutionTier: string;
    reviewPending: boolean;
    routeTarget: PersistedIntent["routeTarget"];
    shouldSearchCatalog: boolean;
    startedAt: number | null;
    status: string;
    suggestedReplies: string[];
    summary: string;
    title: string;
    videoSeconds: string;
    videoSize: string;
  } | null;
  matchCandidates: CatalogEntry[];
  collectiveTrust: {
    averageRating: number | null;
    averageTrustScore: number;
    fulfilledCount: number;
    memberCount: number;
    members: Array<{
      averageRating: number | null;
      displayName: string;
      externalId: string;
      fulfilledCount: number;
      role: string | null;
      totalHandledCount: number;
      trustScore: number;
    }>;
    totalHandledCount: number;
  } | null;
  messages: RequestMessage[];
  contributions: Array<{
    delivered: boolean;
    deliveryCount: number;
    displayName: string;
    externalId: string;
    handle: string | null;
    lastActivityAt: number | null;
    messageCount: number;
    role: string | null;
    userId: string;
  }>;
  participants: Array<{
    displayName: string;
    externalId: string | null;
    handle: string | null;
    kind: string;
    profileId: string | null;
    role: string | null;
    status: string;
  }>;
  proposals: Array<{
    _id: string;
    collectiveMembers: string[];
    createdAt: number;
    currency: string;
    deliverablesBody: string;
    etaAt: number;
    isCollective: boolean;
    isMine: boolean;
    memberRoles: Array<{
      memberId: string;
      role: string;
    }>;
    price: number;
    proposer: {
      displayName: string;
      handle: string | null;
      kind: string;
      profileId: string | null;
    };
    splitPlan: Array<{
      memberId: string;
      percent: number;
    }>;
    status: string;
  }>;
  review: {
    comment: string;
    rating: number;
    reviewedAt: number | null;
  } | null;
};

export type RequestExecutionContext = {
  _id: string;
  assetPrompt: string;
  body: string;
  capabilityTags: string[];
  catalogQuery: string;
  category: string;
  conversationId: string | null;
  generationSignals: PersistedIntent["generationSignals"];
  intentKey: string;
  keywords: string[];
  missingDetails: string[];
  needsClarification: boolean;
  provider: string;
  requestedOutputTypes: PersistedIntent["requestedOutputTypes"];
  responseInstructions: string;
  routeTarget: PersistedIntent["routeTarget"];
  speechText: string;
  status: string;
  suggestedReplies: string[];
  summary: string;
  title: string;
  videoSeconds: string;
  videoSize: string;
  voice: string;
} | null;

export const convexFunctionRefs = {
  archiveRequest: makeFunctionReference<
    "mutation",
    {
      intentId: string;
      ownerExternalId?: string;
    },
    { archived: boolean }
  >("chats:archiveRequest"),
  appendRequestExecution: makeFunctionReference<
    "mutation",
    {
      activityPayload?: string;
      activityType: string;
      assignedAgent?: string;
      assignedToolNames?: string[];
      assistantMessage: string;
      intentId: string;
      ownerExternalId?: string;
      status: string;
    },
    { appended: boolean }
  >("chats:appendRequestExecution"),
  getConversationThread: makeFunctionReference<
    "query",
    {
      conversationId: string;
      ownerExternalId?: string;
    },
    ConversationThreadRecord
  >("chats:getConversationThread"),
  postConversationMessage: makeFunctionReference<
    "mutation",
    {
      body: string;
      conversationId?: string;
      ownerDisplayName?: string;
      ownerExternalId?: string;
      ownerHandle?: string;
    },
    { conversationId: string; messageId: string; posted: boolean }
  >("chats:postConversationMessage"),
  recordConversationExchange: makeFunctionReference<
    "mutation",
    {
      assistantDisplayName?: string;
      assistantExternalId?: string;
      assistantHandle?: string;
      assistantMessage: string;
      assistantProvider?: string;
      conversationId?: string;
      ownerDisplayName?: string;
      ownerExternalId?: string;
      ownerHandle?: string;
      userMessage: string;
    },
    {
      assistantMessageId: string;
      conversationId: string;
      posted: boolean;
      userMessageId: string;
    }
  >("chats:recordConversationExchange"),
  appendConversationAssistantMessage: makeFunctionReference<
    "mutation",
    {
      assistantDisplayName?: string;
      assistantExternalId?: string;
      assistantHandle?: string;
      assistantMessage: string;
      assistantProvider?: string;
      conversationId: string;
      ownerExternalId?: string;
    },
    {
      assistantMessageId: string;
      conversationId: string;
      posted: boolean;
    }
  >("chats:appendConversationAssistantMessage"),
  approveRequest: makeFunctionReference<
    "mutation",
    {
      assignedAgent?: string;
      assignedToolNames?: string[];
      assistantMessage?: string;
      intentId: string;
      ownerExternalId?: string;
      status?: "blocked" | "claimed" | "closed" | "fulfilled" | "in_progress" | "open" | "proposed";
    },
    { approved: boolean }
  >("chats:approveRequest"),
  cancelRequest: makeFunctionReference<
    "mutation",
    {
      intentId: string;
      ownerExternalId?: string;
    },
    { cancelled: boolean }
  >("chats:cancelRequest"),
  deleteIntent: makeFunctionReference<
    "mutation",
    { intentId: string; ownerExternalId?: string },
    { deleted: boolean }
  >("intents:deleteIntent"),
  refineRequestMatches: makeFunctionReference<
    "mutation",
    { intentId: string; ownerExternalId?: string; query: string },
    { query: string; refined: boolean }
  >("intents:refineRequestMatches"),
  togglePinnedSupplyMatch: makeFunctionReference<
    "mutation",
    { intentId: string; ownerExternalId?: string; supplyId: string },
    { isPinned: boolean; pinnedSupplyIds: string[]; updated: boolean }
  >("intents:togglePinnedSupplyMatch"),
  ensureDefaultCatalog: makeFunctionReference<
    "mutation",
    Record<string, never>,
    { created: number }
  >("supplies:ensureDefaultCatalog"),
  getExecutionContext: makeFunctionReference<
    "query",
    { intentId: string; ownerExternalId?: string },
    RequestExecutionContext
  >("intents:getExecutionContext"),
  getRequestDetail: makeFunctionReference<
    "query",
    { intentId: string; ownerExternalId?: string },
    RequestDetail
  >("intents:getRequestDetail"),
  listCatalog: makeFunctionReference<
    "query",
    { limit: number },
    CatalogEntry[]
  >("supplies:listCatalog"),
  listConversationSidebar: makeFunctionReference<
    "query",
    { limit: number; ownerExternalId?: string },
    ConversationSidebarPreview[]
  >("chats:listConversationSidebar"),
  listBorealChatSessions: makeFunctionReference<
    "query",
    { limit: number; messageLimit?: number; ownerExternalId?: string },
    BorealChatSessionRecord
  >("chats:listBorealChatSessions"),
  getActiveCart: makeFunctionReference<
    "query",
    { ownerExternalId?: string },
    ActiveCart
  >("commerce:getActiveCart"),
  listCheckoutHistory: makeFunctionReference<
    "query",
    { limit: number; ownerExternalId?: string },
    CheckoutRecord[]
  >("commerce:listCheckoutHistory"),
  listRecentIntents: makeFunctionReference<
    "query",
    { limit: number },
    RecentIntentPreview[]
  >("intents:listRecent"),
  listMarketplaceIntents: makeFunctionReference<
    "query",
    { limit: number; ownerExternalId?: string; query?: string },
    SidebarIntentPreview[]
  >("intents:listMarketplace"),
  listPublicProfiles: makeFunctionReference<
    "query",
    { limit: number; ownerExternalId?: string; query?: string },
    PublicProfilePreview[]
  >("profiles:listPublicProfiles"),
  listSidebarIntents: makeFunctionReference<
    "query",
    { limit: number; ownerExternalId?: string },
    SidebarIntentPreview[]
  >("intents:listSidebar"),
  getMyProfile: makeFunctionReference<
    "query",
    { ownerExternalId?: string },
    MyProfileRecord
  >("profiles:getMyProfile"),
  getConnectedAgentControl: makeFunctionReference<
    "query",
    { ownerExternalId?: string },
    ConnectedAgentControlRecord
  >("profiles:getConnectedAgentControl"),
  getMyWalletAccounts: makeFunctionReference<
    "query",
    { ownerExternalId?: string },
    WalletAccountRecord
  >("wallets:getMyWalletAccounts"),
  getPublicProfile: makeFunctionReference<
    "query",
    { ownerExternalId?: string; profileId: string },
    WorkerProfileDetail
  >("profiles:getPublicProfile"),
  getPublicProfileByExternalId: makeFunctionReference<
    "query",
    { externalId: string; ownerExternalId?: string },
    WorkerProfileDetail
  >("profiles:getPublicProfileByExternalId"),
  getBorealAgentStats: makeFunctionReference<
    "query",
    Record<string, never>,
    BorealAgentStats
  >("profiles:getBorealAgentStats"),
  submitProposal: makeFunctionReference<
    "mutation",
    {
      currency: string;
      deliverablesBody: string;
      deliverablesType: "file" | "link" | "markdown";
      etaAt: number;
      intentId: string;
      ownerDisplayName?: string;
      ownerExternalId?: string;
      ownerHandle?: string;
      price: number;
      proposerKind?: "agent" | "human";
    },
    { proposalId: string | null; submitted: boolean }
  >("proposals:submitProposal"),
  approveProposal: makeFunctionReference<
    "mutation",
    { intentId: string; ownerExternalId?: string; proposalId: string },
    {
      approved: boolean;
      reason?:
        | "missing_buyer_wallet"
        | "missing_payout_wallet"
        | "wallet_network_mismatch";
    }
  >("proposals:approveProposal"),
  approveMatchedSupply: makeFunctionReference<
    "mutation",
    { intentId: string; ownerExternalId?: string; supplyId: string },
    {
      approved: boolean;
      fulfillmentId?: string;
      proposalId?: string;
      reason?:
        | "capacity_exhausted"
        | "gated_out"
        | "missing_buyer_wallet"
        | "missing_payout_wallet"
        | "request_not_open"
        | "supplier_unavailable"
        | "wallet_network_mismatch";
      transactionId?: string;
    }
  >("proposals:approveMatchedSupply"),
  rateRequest: makeFunctionReference<
    "mutation",
    { comment?: string; intentId: string; ownerExternalId?: string; rating: number },
    { rated: boolean }
  >("chats:rateRequest"),
  recordArtifactMetadata: makeFunctionReference<
    "mutation",
    ArtifactMetadataArgs,
    { artifactId: string }
  >("artifacts:recordArtifactMetadata"),
  recordIntentPipeline: makeFunctionReference<
    "mutation",
    RecordIntentPipelineArgs,
    RecordIntentPipelineResult
  >("chats:recordIntentPipeline"),
  searchCatalog: makeFunctionReference<
    "query",
    { limit: number; query: string },
    CatalogEntry[]
  >("supplies:searchCatalog"),
  syncCatalogCapabilities: makeFunctionReference<
    "mutation",
    {
      capabilities: Array<{
        acceptedCurrencies: string[];
        capabilityTags: string[];
        category: string;
        description: string;
        endpoint?: {
          bodyType?: "json" | "none";
          jsonRpcMethod?: string;
          mcpServerUrl?: string;
          method?: string;
          toolName?: string;
          url?: string;
        };
        evidence: {
          returnsReceipt: boolean;
          returnsTxHash: boolean;
          supportsSchemaMetadata: boolean;
        };
        executionSurface: "handoff" | "http" | "jsonrpc" | "mcp" | "registry" | "sdk" | "widget";
        keywords: string[];
        paymentNetworkHints: string[];
        paymentProtocol: "direct-solana" | "mpp" | "none" | "widget" | "x402";
        pricing: {
          amount?: number;
          currency?: string;
          rawJson?: string;
          type: "fixed" | "free" | "metered" | "quote-required";
        };
        rawJson?: string;
        requiresHumanApproval: boolean;
        routingTier: "A-delegated" | "A-direct" | "B-ingest-handoff" | "C-manual";
        sourceCapabilityId: string;
        sourceId: string;
        sourceProvider: "agentcash" | "agentic-market" | "frames" | "manual" | "moonpay" | "solana-agent-kit";
        sourceProviderUrl?: string;
        sourceUrl?: string;
        subtitle?: string;
        supportsDirectInvoke: boolean;
        supportsPrivyWallet: boolean;
        title: string;
        walletModes: Array<
          "client-sign" | "external-wallet" | "provider-managed" | "server-execute-with-user-authorization"
        >;
      }>;
      provider: {
        description?: string;
        displayName: string;
        key: "agentcash" | "agentic-market" | "frames" | "manual" | "moonpay" | "solana-agent-kit";
        providerUrl?: string;
      };
    },
    { insertedCount: number; synced: boolean; updatedCount: number }
  >("serviceProviders:syncCatalogCapabilities"),
  addToCart: makeFunctionReference<
    "mutation",
    {
      ownerDisplayName?: string;
      ownerExternalId?: string;
      sourceIntentId?: string;
      supplyId: string;
    },
    { added: boolean; cartId: string | null; itemCount: number }
  >("commerce:addToCart"),
  updateCartLineQuantity: makeFunctionReference<
    "mutation",
    { cartLineItemId: string; ownerExternalId?: string; quantity: number },
    { updated: boolean }
  >("commerce:updateCartLineQuantity"),
  removeFromCart: makeFunctionReference<
    "mutation",
    { cartLineItemId: string; ownerExternalId?: string },
    { removed: boolean }
  >("commerce:removeFromCart"),
  clearActiveCart: makeFunctionReference<
    "mutation",
    { ownerExternalId?: string },
    { cleared: boolean }
  >("commerce:clearActiveCart"),
  checkoutCart: makeFunctionReference<
    "mutation",
    { ownerDisplayName?: string; ownerExternalId?: string; sourceIntentId?: string },
    {
      checkoutId: string | null;
      placed: boolean;
      reason?: "missing_buyer_wallet" | "wallet_network_mismatch";
    }
  >("commerce:checkoutCart"),
  beginPaymentAttempt: makeFunctionReference<
    "mutation",
    { checkoutItemId: string; ownerExternalId?: string; walletAddress?: string },
    { started: boolean }
  >("serviceProviders:beginPaymentAttempt"),
  completePaymentAttempt: makeFunctionReference<
    "mutation",
    {
      accessLabel?: string;
      accessUrl?: string;
      checkoutItemId: string;
      errorMessage?: string;
      ownerExternalId?: string;
      paymentReceiptJson?: string;
      responseJson?: string;
      status: "completed" | "failed" | "submitted";
      txHash?: string;
    },
    { completed: boolean }
  >("serviceProviders:completePaymentAttempt"),
  submitWork: makeFunctionReference<
    "mutation",
    {
      attachments?: Array<{
        fileName: string;
        mediaType: string;
        sizeBytes: number;
        storageId: string;
      }>;
      deliverablesBody: string;
      intentId: string;
      workerDisplayName?: string;
      workerExternalId?: string;
    },
    { submitted: boolean }
  >("fulfillments:submitWork"),
  generateUploadUrl: makeFunctionReference<
    "mutation",
    Record<string, never>,
    string
  >("fulfillments:generateUploadUrl"),
  markRequestFulfilled: makeFunctionReference<
    "mutation",
    { intentId: string; ownerExternalId?: string },
    { fulfilled: boolean }
  >("fulfillments:markRequestFulfilled"),
  upsertMyProfile: makeFunctionReference<
    "mutation",
    {
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
    },
    { profileId: string | null; saved: boolean }
  >("profiles:upsertMyProfile"),
  syncWalletAccount: makeFunctionReference<
    "mutation",
    {
      chainFamily?: "evm" | "solana";
      chainId?: string;
      environment?: "devnet" | "mainnet" | "testnet";
      networkKey?:
        | "base:mainnet"
        | "base:sepolia"
        | "ethereum:mainnet"
        | "ethereum:sepolia"
        | "polygon:amoy"
        | "polygon:mainnet"
        | "solana:devnet"
        | "solana:mainnet"
        | "solana:testnet";
      ownerDisplayName?: string;
      ownerExternalId?: string;
      roles?: Array<"buyer" | "connected" | "payout">;
      setAsDefaultBuyer?: boolean;
      setAsDefaultPayout?: boolean;
      walletAddress: string;
    },
    { synced: boolean; walletAccountId: string | null }
  >("wallets:syncWalletAccount"),
  setDefaultPayoutWalletAccount: makeFunctionReference<
    "mutation",
    { ownerExternalId?: string; walletAccountId: string },
    { updated: boolean }
  >("wallets:setDefaultPayoutWalletAccount"),
  createSupplyEntry: makeFunctionReference<
    "mutation",
    {
      acpCheckoutUrl?: string;
      a2aEndpoint?: string;
      agentReady?: boolean;
      availabilityStatus?: "available" | "limited" | "unavailable";
      brand?: string;
      capabilityTags: string[];
      category: string;
      connectorHealthStatus?: "failing" | "healthy" | "unknown";
      connectorLastHeartbeatAt?: number;
      connectorLastTestedAt?: number;
      currency?: string;
      deliveryType: "async" | "instant" | "scheduled";
      description: string;
      estimatedDeliveryLabel?: string;
      exampleIntents?: string[];
      executionSurface?: "handoff" | "http" | "jsonrpc" | "mcp" | "registry" | "sdk" | "widget";
      executorUrl?: string;
      exclusions?: string[];
      fulfillmentKind?: "digital" | "hybrid" | "physical" | "service";
      isCartEnabled?: boolean;
      maxConcurrentJobs?: number;
      metadataJson?: string;
      mcpServerUrl?: string;
      mcpToolName?: string;
      nextAvailableAt?: number;
      ownerActorKind?: "agent" | "human" | "tool";
      ownerDisplayName?: string;
      ownerExternalId?: string;
      ownerHandle?: string;
      offerSlug?: string;
      openApiUrl?: string;
      outputTypes?: Array<"image_generation" | "speech_generation" | "text" | "video_generation">;
      paymentNetworkHints?: string[];
      paymentProtocol?: "direct-solana" | "mpp" | "none" | "widget" | "x402";
      priceAmount?: number;
      priceMax?: number;
      priceMin?: number;
      priceRawJson?: string;
      priceType: "fixed" | "hourly" | "scoped";
      protocolDescriptorJson?: string;
      responseSlaMinutes?: number;
      requiresHumanApproval?: boolean;
      routingTier?: "A-direct" | "B-ingest-handoff" | "C-marketplace" | "D-queue";
      scenarioTypes?: Array<
        | "chat_only_fulfillment"
        | "consultation"
        | "custom_scoped_work"
        | "instant_digital_purchase"
        | "milestone_project"
        | "physical_service"
        | "provider_handoff_service"
        | "provider_paid_service"
        | "supply_publish"
      >;
      schemaUrl?: string;
      sourceCapabilityId?: string;
      sourceListingUrl?: string;
      sourceProviderKey?:
        | "agentic-market"
        | "agentcash"
        | "frames"
        | "manual"
        | "moonpay"
        | "solana-agent-kit";
      sourceProviderUrl?: string;
      subtitle?: string;
      supportsEvidencePush?: boolean;
      supportsDirectInvoke?: boolean;
      supportsPrivyWallet?: boolean;
      supportsStatusUpdates?: boolean;
      supplyType: "agent_tool" | "capability" | "collective" | "product";
      title: string;
      ucpCatalogUrl?: string;
      ucpCheckoutUrl?: string;
    },
    { created: boolean; reason?: string; supplyId: string | null }
  >("supplies:createSupplyEntry"),
  setAgentControlState: makeFunctionReference<
    "mutation",
    {
      activeAgentRole?: "agent" | "both" | "supply";
      activeSupplyId?: string;
      mode: "auto_fallback" | "boreal" | "connected" | "none";
      ownerExternalId?: string;
    },
    {
      activeAgentRole: "agent" | "both" | "supply" | null;
      activeSupplyId: string | null;
      mode: "auto_fallback" | "boreal" | "connected" | "none";
      saved: boolean;
    }
  >("profiles:setAgentControlState"),
  postThreadMessage: makeFunctionReference<
    "mutation",
    {
      body: string;
      intentId: string;
      ownerDisplayName?: string;
      ownerExternalId?: string;
      ownerHandle?: string;
    },
    { sent: boolean }
  >("chats:postThreadMessage"),
  syncVideoArtifactByRemoteId: makeFunctionReference<
    "mutation",
    SyncVideoArtifactArgs,
    { synced: boolean }
  >("artifacts:syncVideoArtifactByRemoteId"),
  updateArtifactMetadata: makeFunctionReference<
    "mutation",
    UpdateArtifactMetadataArgs,
    { updated: boolean }
  >("artifacts:updateArtifactMetadata"),
};
