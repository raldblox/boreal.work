import { makeFunctionReference } from "convex/server";

import type { PersistedIntent } from "@/lib/boreal/schemas/intent";

export type RecordIntentPipelineArgs = {
  conversationId?: string;
  userMessage: string;
  assistantMessage: string;
  intent: PersistedIntent;
};

export type RecordIntentPipelineResult = {
  conversationId: string;
  intentId: string;
  intentKey: string;
  userMessageId: string;
  assistantMessageId: string;
};

export type RecentIntentPreview = {
  _id: string;
  _creationTime: number;
  title: string;
  summary: string;
  category: string;
  requestedOutputTypes: PersistedIntent["requestedOutputTypes"];
  routing: PersistedIntent["routing"];
  generationSignals: PersistedIntent["generationSignals"];
};

export type SidebarIntentPreview = {
  _id: string;
  _creationTime: number;
  category: string;
  confidence: number;
  conversationId: string | null;
  needsClarification: boolean;
  provider: string;
  requestedOutputTypes: PersistedIntent["requestedOutputTypes"];
  routeTarget: PersistedIntent["routeTarget"];
  status: string;
  summary: string;
  title: string;
};

export type CatalogEntry = {
  _id: string;
  category: string;
  capabilityTags: string[];
  deliveryType: string;
  description: string;
  priceAmount: number | null;
  priceType: string;
  supplyType: string;
  title: string;
  trustScore: number;
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

export type RequestDetail = {
  artifact: RequestArtifact | null;
  conversationId: string | null;
  intent: {
    _creationTime: number;
    _id: string;
    category: string;
    confidence: number;
    missingDetails: string[];
    needsClarification: boolean;
    provider: string;
    requestedOutputTypes: PersistedIntent["requestedOutputTypes"];
    responseInstructions: string;
    routeTarget: PersistedIntent["routeTarget"];
    status: string;
    suggestedReplies: string[];
    summary: string;
    title: string;
  } | null;
  messages: RequestMessage[];
};

export const convexFunctionRefs = {
  recordIntentPipeline: makeFunctionReference<
    "mutation",
    RecordIntentPipelineArgs,
    RecordIntentPipelineResult
  >("chats:recordIntentPipeline"),
  listRecentIntents: makeFunctionReference<
    "query",
    { limit: number },
    RecentIntentPreview[]
  >("intents:listRecent"),
  listSidebarIntents: makeFunctionReference<
    "query",
    { limit: number },
    SidebarIntentPreview[]
  >("intents:listSidebar"),
  getRequestDetail: makeFunctionReference<
    "query",
    { intentId: string },
    RequestDetail
  >("intents:getRequestDetail"),
  deleteIntent: makeFunctionReference<
    "mutation",
    { intentId: string },
    { deleted: boolean }
  >("intents:deleteIntent"),
  ensureDefaultCatalog: makeFunctionReference<
    "mutation",
    Record<string, never>,
    { created: number }
  >("supplies:ensureDefaultCatalog"),
  listCatalog: makeFunctionReference<
    "query",
    { limit: number },
    CatalogEntry[]
  >("supplies:listCatalog"),
  searchCatalog: makeFunctionReference<
    "query",
    { limit: number; query: string },
    CatalogEntry[]
  >("supplies:searchCatalog"),
  recordArtifactMetadata: makeFunctionReference<
    "mutation",
    ArtifactMetadataArgs,
    { artifactId: string }
  >("artifacts:recordArtifactMetadata"),
  updateArtifactMetadata: makeFunctionReference<
    "mutation",
    UpdateArtifactMetadataArgs,
    { updated: boolean }
  >("artifacts:updateArtifactMetadata"),
};
