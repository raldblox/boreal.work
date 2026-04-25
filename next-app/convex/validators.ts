import { v } from "convex/values";

export const actorKindValidator = v.union(
  v.literal("human"),
  v.literal("agent"),
  v.literal("tool"),
);

export const intentTypeValidator = v.union(
  v.literal("demand"),
  v.literal("supply"),
  v.literal("informational"),
);

export const requestedOutputTypeValidator = v.union(
  v.literal("text"),
  v.literal("image_generation"),
  v.literal("speech_generation"),
  v.literal("video_generation"),
);

export const toolRouteValidator = v.union(
  v.literal("general_assistance"),
  v.literal("catalog_lookup"),
  v.literal("profile_update"),
  v.literal("image_generation"),
  v.literal("speech_generation"),
  v.literal("video_generation"),
  v.literal("clarification"),
);

export const resolutionTierValidator = v.union(
  v.literal("auto"),
  v.literal("fast"),
  v.literal("open"),
  v.literal("pending"),
);

export const intentStatusValidator = v.union(
  v.literal("open"),
  v.literal("proposed"),
  v.literal("claimed"),
  v.literal("in_progress"),
  v.literal("blocked"),
  v.literal("fulfilled"),
  v.literal("closed"),
);

export const fulfillmentStatusValidator = v.union(
  v.literal("active"),
  v.literal("submitted"),
  v.literal("approved"),
  v.literal("fulfilled"),
  v.literal("blocked"),
  v.literal("closed"),
);

export const proposalStatusValidator = v.union(
  v.literal("submitted"),
  v.literal("accepted"),
  v.literal("declined"),
  v.literal("withdrawn"),
  v.literal("revision_requested"),
);

export const supplyStatusValidator = v.union(
  v.literal("active"),
  v.literal("inactive"),
  v.literal("suspended"),
);

export const profileAvailabilityValidator = v.union(
  v.literal("available"),
  v.literal("limited"),
  v.literal("unavailable"),
);

export const deliveryTypeValidator = v.union(
  v.literal("instant"),
  v.literal("async"),
  v.literal("scheduled"),
);

export const fulfillmentKindValidator = v.union(
  v.literal("digital"),
  v.literal("service"),
  v.literal("physical"),
  v.literal("hybrid"),
);

export const checkoutProtocolValidator = v.union(
  v.literal("ucp"),
  v.literal("acp"),
  v.literal("custom"),
);

export const serviceProviderKeyValidator = v.union(
  v.literal("agentic-market"),
  v.literal("agentcash"),
  v.literal("frames"),
  v.literal("moonpay"),
  v.literal("solana-agent-kit"),
  v.literal("manual"),
);

export const paymentProtocolValidator = v.union(
  v.literal("x402"),
  v.literal("mpp"),
  v.literal("direct-solana"),
  v.literal("widget"),
  v.literal("none"),
);

export const executionSurfaceValidator = v.union(
  v.literal("registry"),
  v.literal("http"),
  v.literal("mcp"),
  v.literal("jsonrpc"),
  v.literal("sdk"),
  v.literal("widget"),
  v.literal("handoff"),
);

export const walletExecutionModeValidator = v.union(
  v.literal("client-sign"),
  v.literal("server-execute-with-user-authorization"),
  v.literal("external-wallet"),
  v.literal("provider-managed"),
);

export const capabilityRoutingTierValidator = v.union(
  v.literal("A-direct"),
  v.literal("A-delegated"),
  v.literal("B-ingest-handoff"),
  v.literal("C-manual"),
);

export const cartStatusValidator = v.union(
  v.literal("active"),
  v.literal("checked_out"),
  v.literal("abandoned"),
);

export const checkoutStatusValidator = v.union(
  v.literal("submitted"),
  v.literal("pending_payment"),
  v.literal("in_progress"),
  v.literal("fulfilled"),
  v.literal("cancelled"),
  v.literal("failed"),
);

export const checkoutItemStatusValidator = v.union(
  v.literal("submitted"),
  v.literal("awaiting_payment"),
  v.literal("paid"),
  v.literal("in_progress"),
  v.literal("fulfilled"),
  v.literal("cancelled"),
  v.literal("failed"),
);

export const paymentAttemptStatusValidator = v.union(
  v.literal("pending_approval"),
  v.literal("ready_to_pay"),
  v.literal("processing"),
  v.literal("paid"),
  v.literal("failed"),
  v.literal("cancelled"),
);

export const serviceInvocationStatusValidator = v.union(
  v.literal("awaiting_payment"),
  v.literal("handoff_required"),
  v.literal("submitted"),
  v.literal("in_progress"),
  v.literal("completed"),
  v.literal("failed"),
  v.literal("cancelled"),
);

export const transactionApprovalStatusValidator = v.union(
  v.literal("pending"),
  v.literal("approved"),
  v.literal("rejected"),
  v.literal("expired"),
  v.literal("executed"),
);

export const serviceProviderSyncStatusValidator = v.union(
  v.literal("started"),
  v.literal("completed"),
  v.literal("failed"),
);

export const matchCandidateStageValidator = v.union(
  v.literal("retrieved"),
  v.literal("feasible"),
  v.literal("ranked"),
  v.literal("notified"),
  v.literal("reserved"),
);

export const messageRoleValidator = v.union(
  v.literal("user"),
  v.literal("assistant"),
  v.literal("system"),
);

export const generationSignalsValidator = v.object({
  primaryMode: requestedOutputTypeValidator,
  requestsImageGeneration: v.boolean(),
  requestsSpeechGeneration: v.optional(v.boolean()),
  requestsText: v.boolean(),
  requestsVideoGeneration: v.boolean(),
});

export const routingValidator = v.object({
  resolutionTier: resolutionTierValidator,
  shouldCreateFulfillmentRequest: v.boolean(),
  shouldPersistToBoard: v.boolean(),
});

export const modalityScoreValidator = v.object({
  kind: requestedOutputTypeValidator,
  score: v.number(),
});

export const persistedIntentValidator = v.object({
  assistantMessageId: v.string(),
  assetPrompt: v.string(),
  body: v.string(),
  capabilityTags: v.array(v.string()),
  catalogQuery: v.string(),
  category: v.string(),
  confidence: v.number(),
  conversationId: v.string(),
  embedding: v.array(v.number()),
  embeddingModel: v.string(),
  extractionNotes: v.array(v.string()),
  generationSignals: generationSignalsValidator,
  intentModel: v.string(),
  intentType: intentTypeValidator,
  keywords: v.array(v.string()),
  missingDetails: v.array(v.string()),
  modalityScores: v.array(modalityScoreValidator),
  needsClarification: v.boolean(),
  persistence: v.object({
    isUnresolved: v.boolean(),
    reason: v.string(),
    shouldPersist: v.boolean(),
  }),
  provider: v.string(),
  responseInstructions: v.string(),
  routeTarget: toolRouteValidator,
  shouldSearchCatalog: v.boolean(),
  speechText: v.string(),
  suggestedReplies: v.array(v.string()),
  requestedOutputTypes: v.array(requestedOutputTypeValidator),
  routing: routingValidator,
  summary: v.string(),
  title: v.string(),
  userMessageId: v.string(),
  voice: v.string(),
});

export const artifactKindValidator = v.union(
  v.literal("image"),
  v.literal("audio"),
  v.literal("video"),
);

export const artifactStatusValidator = v.union(
  v.literal("ready"),
  v.literal("queued"),
  v.literal("in_progress"),
  v.literal("failed"),
);
