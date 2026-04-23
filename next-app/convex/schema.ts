import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

import {
  actorKindValidator,
  artifactKindValidator,
  artifactStatusValidator,
  deliveryTypeValidator,
  fulfillmentStatusValidator,
  generationSignalsValidator,
  intentStatusValidator,
  intentTypeValidator,
  proposalStatusValidator,
  requestedOutputTypeValidator,
  resolutionTierValidator,
  routingValidator,
  supplyStatusValidator,
  toolRouteValidator,
} from "./validators";

export default defineSchema({
  users: defineTable({
    actorKind: actorKindValidator,
    displayName: v.string(),
    externalId: v.optional(v.string()),
    handle: v.optional(v.string()),
    trustScore: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_externalId", ["externalId"]),

  conversations: defineTable({
    conversationId: v.string(),
    intentCount: v.number(),
    latestMessageAt: v.number(),
    provider: v.string(),
    source: v.string(),
    status: v.string(),
    title: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_conversationId", ["conversationId"])
    .index("by_status_and_latestMessageAt", ["status", "latestMessageAt"]),

  chatMessages: defineTable({
    body: v.string(),
    conversationId: v.string(),
    intentKey: v.optional(v.string()),
    messageId: v.string(),
    provider: v.optional(v.string()),
    role: v.union(v.literal("user"), v.literal("assistant"), v.literal("system")),
    createdAt: v.number(),
  })
    .index("by_conversationId_and_createdAt", ["conversationId", "createdAt"])
    .index("by_messageId", ["messageId"]),

  intents: defineTable({
    acceptsProposals: v.boolean(),
    actorKind: actorKindValidator,
    assetPrompt: v.optional(v.string()),
    body: v.string(),
    budgetFixed: v.optional(v.number()),
    budgetMax: v.optional(v.number()),
    budgetMin: v.optional(v.number()),
    budgetType: v.optional(v.union(v.literal("fixed"), v.literal("range"), v.literal("open"))),
    capabilityTags: v.array(v.string()),
    catalogQuery: v.optional(v.string()),
    category: v.string(),
    confidence: v.number(),
    conversationId: v.optional(v.string()),
    createdAt: v.number(),
    currency: v.optional(v.string()),
    deadlineAt: v.optional(v.number()),
    embedding: v.array(v.number()),
    embeddingModel: v.string(),
    extractionNotes: v.array(v.string()),
    generationSignals: generationSignalsValidator,
    intentKey: v.string(),
    intentModel: v.string(),
    intentType: intentTypeValidator,
    keywords: v.array(v.string()),
    matchAttempts: v.number(),
    missingDetails: v.optional(v.array(v.string())),
    needsClarification: v.optional(v.boolean()),
    ownerUserId: v.optional(v.string()),
    persistence: v.optional(v.object({
      isUnresolved: v.boolean(),
      reason: v.string(),
      shouldPersist: v.boolean(),
    })),
    provider: v.string(),
    responseInstructions: v.optional(v.string()),
    requestedOutputTypes: v.array(requestedOutputTypeValidator),
    resolutionTier: resolutionTierValidator,
    routeTarget: v.optional(toolRouteValidator),
    routing: routingValidator,
    shouldSearchCatalog: v.optional(v.boolean()),
    speechText: v.optional(v.string()),
    status: intentStatusValidator,
    suggestedReplies: v.optional(v.array(v.string())),
    summary: v.string(),
    title: v.string(),
    updatedAt: v.number(),
    urgencyScore: v.number(),
    visibility: v.union(v.literal("private"), v.literal("public")),
    voice: v.optional(v.string()),
  })
    .index("by_intentKey", ["intentKey"])
    .index("by_conversationId", ["conversationId"])
    .index("by_status", ["status"])
    .index("by_category", ["category"])
    .index("by_resolutionTier", ["resolutionTier"])
    .index("by_status_and_resolutionTier", ["status", "resolutionTier"])
    .index("by_deadlineAt", ["deadlineAt"])
    .searchIndex("search_body", {
      searchField: "body",
      filterFields: ["status", "category", "resolutionTier"],
    }),

  intentRuns: defineTable({
    conversationId: v.string(),
    createdAt: v.number(),
    embeddingModel: v.string(),
    inputBody: v.string(),
    intentKey: v.string(),
    intentModel: v.string(),
    modalityScores: v.array(
      v.object({
        kind: requestedOutputTypeValidator,
        score: v.number(),
      }),
    ),
    provider: v.string(),
  }).index("by_intentKey_and_createdAt", ["intentKey", "createdAt"]),

  supplies: defineTable({
    acceptanceRate: v.number(),
    actorKind: actorKindValidator,
    capabilityTags: v.array(v.string()),
    category: v.string(),
    deliveryType: deliveryTypeValidator,
    description: v.string(),
    embedding: v.array(v.number()),
    executorUrl: v.optional(v.string()),
    fulfillmentRate: v.number(),
    keywords: v.array(v.string()),
    matchCount: v.number(),
    priceAmount: v.optional(v.number()),
    priceType: v.union(v.literal("fixed"), v.literal("hourly"), v.literal("scoped")),
    status: supplyStatusValidator,
    supplyType: v.union(
      v.literal("product"),
      v.literal("capability"),
      v.literal("agent_tool"),
      v.literal("collective"),
    ),
    supplierUserId: v.optional(v.string()),
    title: v.string(),
    trustScore: v.number(),
  })
    .index("by_title", ["title"])
    .index("by_category", ["category"])
    .index("by_status_and_trustScore", ["status", "trustScore"])
    .searchIndex("search_description", {
      searchField: "description",
      filterFields: ["category", "status"],
    }),

  artifacts: defineTable({
    artifactKind: artifactKindValidator,
    conversationId: v.string(),
    createdAt: v.number(),
    intentKey: v.optional(v.string()),
    mediaType: v.optional(v.string()),
    metadataJson: v.optional(v.string()),
    provider: v.string(),
    remoteId: v.optional(v.string()),
    status: artifactStatusValidator,
    subtitle: v.string(),
    title: v.string(),
    updatedAt: v.number(),
  })
    .index("by_conversationId_and_createdAt", ["conversationId", "createdAt"])
    .index("by_intentKey_and_createdAt", ["intentKey", "createdAt"]),

  proposals: defineTable({
    collectiveMembers: v.optional(v.array(v.string())),
    currency: v.string(),
    deliverablesBody: v.string(),
    deliverablesType: v.union(v.literal("markdown"), v.literal("file"), v.literal("link")),
    etaAt: v.number(),
    intentKey: v.string(),
    isCollective: v.boolean(),
    price: v.number(),
    proposerKind: actorKindValidator,
    proposerUserId: v.optional(v.string()),
    splitPlan: v.optional(v.array(v.object({ memberId: v.string(), percent: v.number() }))),
    status: proposalStatusValidator,
  }).index("by_intentKey_and_status", ["intentKey", "status"]),

  fulfillments: defineTable({
    acceptedProposalId: v.optional(v.string()),
    completedSummary: v.optional(v.string()),
    escrowAddress: v.optional(v.string()),
    escrowAmount: v.optional(v.number()),
    fulfillerUserId: v.optional(v.string()),
    intentKey: v.string(),
    ownerUserId: v.optional(v.string()),
    status: fulfillmentStatusValidator,
  }).index("by_intentKey_and_status", ["intentKey", "status"]),

  evidences: defineTable({
    body: v.string(),
    fulfillmentId: v.string(),
    mediaType: v.string(),
    url: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_fulfillmentId_and_createdAt", ["fulfillmentId", "createdAt"]),

  activityEvents: defineTable({
    entityId: v.string(),
    entityType: v.string(),
    payload: v.optional(v.string()),
    type: v.string(),
    createdAt: v.number(),
  }).index("by_entityType_and_entityId", ["entityType", "entityId"]),

  matchEvents: defineTable({
    intentKey: v.string(),
    outcome: v.union(
      v.literal("auto_delivered"),
      v.literal("proposed"),
      v.literal("accepted"),
      v.literal("declined"),
      v.literal("expired"),
    ),
    resolutionTier: resolutionTierValidator,
    scoreBudget: v.number(),
    scoreDeadline: v.number(),
    scoreKeyword: v.number(),
    scoreSemantic: v.number(),
    scoreTotal: v.number(),
    scoreTrust: v.number(),
    supplyId: v.string(),
  })
    .index("by_intentKey_and_scoreTotal", ["intentKey", "scoreTotal"])
    .index("by_supplyId_and_scoreTotal", ["supplyId", "scoreTotal"]),
});
