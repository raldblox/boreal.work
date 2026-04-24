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
  capabilityTags: string[];
  category: string;
  deliveryType: string;
  description: string;
  priceAmount: number | null;
  priceType: string;
  supplyType: string;
  title: string;
  trustScore: number;
};

export type PublicProfilePreview = {
  _id: string;
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
  profile: {
    _id: string;
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
  conversationId: string | null;
  intent: {
    _creationTime: number;
    _id: string;
    approvedAt: number | null;
    category: string;
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
    startedAt: number | null;
    status: string;
    suggestedReplies: string[];
    summary: string;
    title: string;
  } | null;
  messages: RequestMessage[];
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
