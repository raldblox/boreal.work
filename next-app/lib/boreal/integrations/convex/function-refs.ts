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
  isCartEnabled: boolean;
  matchReasons: string[];
  matchScore: number | null;
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
  category: string;
  deliveryType?: string;
  description: string;
  priceAmount: number | null;
  priceType: string;
  status: string;
  supplyType: string;
  title: string;
};

export type MyProfileRecord = {
  profile: {
    _id: string | null;
    actorKind: "agent" | "human" | "tool";
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

export type WorkerProfileDetail = {
  analytics: {
    activeCount: number;
    activityBuckets: Array<{
      count: number;
      label: string;
    }>;
    averageCompletionHours: number | null;
    averageRating: number | null;
    blockedCount: number;
    fulfilledCount: number;
    openCount: number;
    recentRequests: Array<{
      _id: string;
      requestedOutputTypes: PersistedIntent["requestedOutputTypes"];
      status: string;
      summary: string;
      title: string;
      updatedAt: number;
    }>;
    reviewCount: number;
    totalHandledCount: number;
  };
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

export type BorealAgentStats = {
  activeCount: number;
  activityBuckets: Array<{
    count: number;
    label: string;
  }>;
  averageCompletionHours: number | null;
  averageRating: number | null;
  blockedCount: number;
  fulfilledCount: number;
  openCount: number;
  recentRequests: Array<{
    _id: string;
    requestedOutputTypes: PersistedIntent["requestedOutputTypes"];
    status: string;
    summary: string;
    title: string;
    updatedAt: number;
  }>;
  reviewCount: number;
  totalHandledCount: number;
};

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
    needsClarification: boolean;
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
  } | null;
  messages: RequestMessage[];
  participants: Array<{
    displayName: string;
    externalId: string | null;
    handle: string | null;
    kind: string;
    profileId: string | null;
    status: string;
  }>;
  proposals: Array<{
    _id: string;
    createdAt: number;
    currency: string;
    deliverablesBody: string;
    etaAt: number;
    isMine: boolean;
    price: number;
    proposer: {
      displayName: string;
      handle: string | null;
      kind: string;
      profileId: string | null;
    };
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
  catalogQuery: string;
  conversationId: string | null;
  generationSignals: PersistedIntent["generationSignals"];
  intentKey: string;
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
  approveRequest: makeFunctionReference<
    "mutation",
    {
      assignedAgent: string;
      assignedToolNames: string[];
      intentId: string;
      ownerExternalId?: string;
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
  getPublicProfile: makeFunctionReference<
    "query",
    { ownerExternalId?: string; profileId: string },
    WorkerProfileDetail
  >("profiles:getPublicProfile"),
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
    { approved: boolean }
  >("proposals:approveProposal"),
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
    { checkoutId: string | null; placed: boolean }
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
  createSupplyEntry: makeFunctionReference<
    "mutation",
    {
      capabilityTags: string[];
      category: string;
      deliveryType: "async" | "instant" | "scheduled";
      description: string;
      ownerDisplayName?: string;
      ownerExternalId?: string;
      ownerHandle?: string;
      priceAmount?: number;
      priceType: "fixed" | "hourly" | "scoped";
      supplyType: "agent_tool" | "capability" | "collective" | "product";
      title: string;
    },
    { created: boolean; supplyId: string | null }
  >("supplies:createSupplyEntry"),
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
