import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

import {
  actorKindValidator,
  artifactKindValidator,
  artifactStatusValidator,
  capabilityRoutingTierValidator,
  cartStatusValidator,
  checkoutItemStatusValidator,
  checkoutProtocolValidator,
  checkoutStatusValidator,
  deliveryTypeValidator,
  executionSurfaceValidator,
  fulfillmentKindValidator,
  fulfillmentStatusValidator,
  generationSignalsValidator,
  intentStatusValidator,
  intentTypeValidator,
  matchCandidateStageValidator,
  paymentAttemptStatusValidator,
  paymentProtocolValidator,
  proposalStatusValidator,
  profileAvailabilityValidator,
  requestedOutputTypeValidator,
  resolutionTierValidator,
  routingValidator,
  serviceInvocationStatusValidator,
  serviceProviderKeyValidator,
  serviceProviderSyncStatusValidator,
  supplyStatusValidator,
  transactionApprovalStatusValidator,
  toolRouteValidator,
  walletExecutionModeValidator,
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

  profiles: defineTable({
    availabilityStatus: profileAvailabilityValidator,
    avatarUrl: v.optional(v.string()),
    bio: v.optional(v.string()),
    capabilityTags: v.array(v.string()),
    createdAt: v.number(),
    displayName: v.string(),
    externalId: v.optional(v.string()),
    handle: v.optional(v.string()),
    headline: v.optional(v.string()),
    isPublic: v.boolean(),
    productLabels: v.array(v.string()),
    searchText: v.string(),
    skillTags: v.array(v.string()),
    updatedAt: v.number(),
    userId: v.optional(v.string()),
  })
    .index("by_externalId", ["externalId"])
    .index("by_isPublic_and_updatedAt", ["isPublic", "updatedAt"])
    .index("by_userId", ["userId"])
    .searchIndex("search_public", {
      searchField: "searchText",
      filterFields: ["availabilityStatus", "isPublic"],
    }),

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
    senderActorKind: v.optional(actorKindValidator),
    senderDisplayName: v.optional(v.string()),
    senderExternalId: v.optional(v.string()),
    senderHandle: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_conversationId_and_createdAt", ["conversationId", "createdAt"])
    .index("by_messageId", ["messageId"]),

  intents: defineTable({
    acceptsProposals: v.boolean(),
    actorKind: actorKindValidator,
    approvalRequestedAt: v.optional(v.number()),
    approvedAt: v.optional(v.number()),
    assignedAgent: v.optional(v.string()),
    assignedToolNames: v.optional(v.array(v.string())),
    assetPrompt: v.optional(v.string()),
    body: v.string(),
    budgetFixed: v.optional(v.number()),
    budgetMax: v.optional(v.number()),
    budgetMin: v.optional(v.number()),
    budgetType: v.optional(v.union(v.literal("fixed"), v.literal("range"), v.literal("open"))),
    capabilityTags: v.array(v.string()),
    catalogQuery: v.optional(v.string()),
    category: v.string(),
    cancelledAt: v.optional(v.number()),
    closedReason: v.optional(v.string()),
    completedAt: v.optional(v.number()),
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
    pinnedSupplyIds: v.optional(v.array(v.id("supplies"))),
    persistence: v.optional(v.object({
      isUnresolved: v.boolean(),
      reason: v.string(),
      shouldPersist: v.boolean(),
    })),
    provider: v.string(),
    responseInstructions: v.optional(v.string()),
    requestedOutputTypes: v.array(requestedOutputTypeValidator),
    resolutionTier: resolutionTierValidator,
    reviewComment: v.optional(v.string()),
    reviewRating: v.optional(v.number()),
    reviewedAt: v.optional(v.number()),
    routeTarget: v.optional(toolRouteValidator),
    routing: routingValidator,
    shouldSearchCatalog: v.optional(v.boolean()),
    speechText: v.optional(v.string()),
    startedAt: v.optional(v.number()),
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
      filterFields: ["status", "category", "resolutionTier", "visibility"],
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
    activeReservations: v.optional(v.number()),
    actorKind: actorKindValidator,
    availabilityStatus: v.optional(profileAvailabilityValidator),
    brand: v.optional(v.string()),
    capabilityTags: v.array(v.string()),
    category: v.string(),
    checkoutProtocol: v.optional(checkoutProtocolValidator),
    checkoutProvider: v.optional(v.string()),
    currency: v.string(),
    createdAt: v.optional(v.number()),
    deliveryType: deliveryTypeValidator,
    description: v.string(),
    embedding: v.array(v.number()),
    evidenceMode: v.optional(v.union(v.literal("none"), v.literal("receipt"), v.literal("response"))),
    estimatedDeliveryLabel: v.optional(v.string()),
    exampleIntents: v.optional(v.array(v.string())),
    exclusions: v.optional(v.array(v.string())),
    executionSurface: v.optional(executionSurfaceValidator),
    executorUrl: v.optional(v.string()),
    fulfillmentKind: fulfillmentKindValidator,
    fulfillmentRate: v.number(),
    isCartEnabled: v.boolean(),
    keywords: v.array(v.string()),
    metadataJson: v.optional(v.string()),
    mcpServerUrl: v.optional(v.string()),
    matchCount: v.number(),
    openApiUrl: v.optional(v.string()),
    paymentNetworkHints: v.optional(v.array(v.string())),
    paymentProtocol: v.optional(paymentProtocolValidator),
    priceAmount: v.optional(v.number()),
    priceMax: v.optional(v.number()),
    priceMin: v.optional(v.number()),
    priceRawJson: v.optional(v.string()),
    priceType: v.union(v.literal("fixed"), v.literal("hourly"), v.literal("scoped")),
    responseSlaMinutes: v.optional(v.number()),
    requiresHumanApproval: v.optional(v.boolean()),
    routingTier: v.optional(capabilityRoutingTierValidator),
    schemaUrl: v.optional(v.string()),
    searchText: v.string(),
    sourceCapabilityId: v.optional(v.string()),
    sourceListingUrl: v.optional(v.string()),
    sourceProviderKey: v.optional(serviceProviderKeyValidator),
    sourceProviderUrl: v.optional(v.string()),
    status: supplyStatusValidator,
    subtitle: v.optional(v.string()),
    supplyType: v.union(
      v.literal("product"),
      v.literal("capability"),
      v.literal("agent_tool"),
      v.literal("collective"),
    ),
    maxConcurrentJobs: v.optional(v.number()),
    nextAvailableAt: v.optional(v.number()),
    outputTypes: v.optional(v.array(requestedOutputTypeValidator)),
    supportsDirectInvoke: v.optional(v.boolean()),
    supportsPrivyWallet: v.optional(v.boolean()),
    supplierUserId: v.optional(v.string()),
    title: v.string(),
    trustScore: v.number(),
    updatedAt: v.optional(v.number()),
  })
    .index("by_title", ["title"])
    .index("by_category", ["category"])
    .index("by_supplierUserId", ["supplierUserId"])
    .index("by_supplierUserId_and_status", ["supplierUserId", "status"])
    .index("by_sourceProviderKey_and_sourceCapabilityId", [
      "sourceProviderKey",
      "sourceCapabilityId",
    ])
    .index("by_status_and_trustScore", ["status", "trustScore"])
    .index("by_status_and_supplyType", ["status", "supplyType"])
    .searchIndex("search_market", {
      searchField: "searchText",
      filterFields: ["category", "fulfillmentKind", "isCartEnabled", "status", "supplyType"],
    }),

  carts: defineTable({
    createdAt: v.number(),
    ownerUserId: v.optional(v.string()),
    sourceIntentId: v.optional(v.id("intents")),
    status: cartStatusValidator,
    updatedAt: v.number(),
  })
    .index("by_ownerUserId_and_status", ["ownerUserId", "status"])
    .index("by_status_and_updatedAt", ["status", "updatedAt"]),

  cartLineItems: defineTable({
    addedAt: v.number(),
    cartId: v.id("carts"),
    category: v.string(),
    currency: v.string(),
    deliveryType: deliveryTypeValidator,
    fulfillmentKind: fulfillmentKindValidator,
    priceType: v.union(v.literal("fixed"), v.literal("hourly"), v.literal("scoped")),
    quantity: v.number(),
    sellerDisplayName: v.optional(v.string()),
    sellerProfileId: v.optional(v.id("profiles")),
    sellerUserId: v.optional(v.string()),
    subtitleSnapshot: v.optional(v.string()),
    supplyId: v.id("supplies"),
    titleSnapshot: v.string(),
    unitPriceAmount: v.optional(v.number()),
    updatedAt: v.number(),
  })
    .index("by_cartId_and_updatedAt", ["cartId", "updatedAt"])
    .index("by_cartId_and_supplyId", ["cartId", "supplyId"])
    .index("by_supplyId", ["supplyId"]),

  checkouts: defineTable({
    cartId: v.id("carts"),
    createdAt: v.number(),
    currency: v.string(),
    itemCount: v.number(),
    ownerUserId: v.optional(v.string()),
    sourceIntentId: v.optional(v.id("intents")),
    status: checkoutStatusValidator,
    subtotalAmount: v.number(),
    updatedAt: v.number(),
  })
    .index("by_ownerUserId_and_createdAt", ["ownerUserId", "createdAt"])
    .index("by_ownerUserId_and_status", ["ownerUserId", "status"])
    .index("by_sourceIntentId", ["sourceIntentId"]),

  checkoutItems: defineTable({
    accessLabel: v.optional(v.string()),
    accessUrl: v.optional(v.string()),
    category: v.string(),
    checkoutId: v.id("checkouts"),
    createdAt: v.number(),
    currency: v.string(),
    deliveryType: deliveryTypeValidator,
    executionSurface: v.optional(executionSurfaceValidator),
    fulfillmentKind: fulfillmentKindValidator,
    metadataJson: v.optional(v.string()),
    paymentAttemptId: v.optional(v.id("paymentAttempts")),
    paymentProtocol: v.optional(paymentProtocolValidator),
    priceType: v.union(v.literal("fixed"), v.literal("hourly"), v.literal("scoped")),
    quantity: v.number(),
    reviewComment: v.optional(v.string()),
    reviewRating: v.optional(v.number()),
    reviewedAt: v.optional(v.number()),
    sellerDisplayName: v.optional(v.string()),
    sellerProfileId: v.optional(v.id("profiles")),
    sellerUserId: v.optional(v.string()),
    serviceInvocationId: v.optional(v.id("serviceInvocations")),
    sourceListingUrl: v.optional(v.string()),
    sourceProviderKey: v.optional(serviceProviderKeyValidator),
    status: checkoutItemStatusValidator,
    subtitleSnapshot: v.optional(v.string()),
    supplyId: v.id("supplies"),
    titleSnapshot: v.string(),
    unitPriceAmount: v.optional(v.number()),
    updatedAt: v.number(),
  })
    .index("by_checkoutId_and_createdAt", ["checkoutId", "createdAt"])
    .index("by_paymentAttemptId", ["paymentAttemptId"])
    .index("by_serviceInvocationId", ["serviceInvocationId"])
    .index("by_supplyId_and_createdAt", ["supplyId", "createdAt"])
    .index("by_supplyId_and_reviewedAt", ["supplyId", "reviewedAt"]),

  serviceProviders: defineTable({
    capabilitiesCount: v.number(),
    createdAt: v.number(),
    description: v.optional(v.string()),
    displayName: v.string(),
    isEnabled: v.boolean(),
    key: serviceProviderKeyValidator,
    providerUrl: v.optional(v.string()),
    updatedAt: v.number(),
  }).index("by_key", ["key"]),

  serviceCapabilities: defineTable({
    acceptedCurrencies: v.array(v.string()),
    capabilityTags: v.array(v.string()),
    category: v.string(),
    createdAt: v.number(),
    description: v.string(),
    endpointJson: v.optional(v.string()),
    executionSurface: executionSurfaceValidator,
    isActive: v.boolean(),
    keywords: v.array(v.string()),
    paymentNetworkHints: v.array(v.string()),
    paymentProtocol: paymentProtocolValidator,
    pricingAmount: v.optional(v.number()),
    pricingCurrency: v.optional(v.string()),
    pricingRawJson: v.optional(v.string()),
    pricingType: v.union(
      v.literal("fixed"),
      v.literal("metered"),
      v.literal("quote-required"),
      v.literal("free"),
    ),
    providerKey: serviceProviderKeyValidator,
    rawJson: v.optional(v.string()),
    requiresHumanApproval: v.boolean(),
    routingTier: capabilityRoutingTierValidator,
    sourceCapabilityId: v.string(),
    sourceUrl: v.optional(v.string()),
    subtitle: v.optional(v.string()),
    supplyId: v.optional(v.id("supplies")),
    supportsDirectInvoke: v.boolean(),
    supportsPrivyWallet: v.boolean(),
    title: v.string(),
    updatedAt: v.number(),
    walletModes: v.array(walletExecutionModeValidator),
  })
    .index("by_providerKey_and_sourceCapabilityId", ["providerKey", "sourceCapabilityId"])
    .index("by_supplyId", ["supplyId"]),

  serviceProviderSyncs: defineTable({
    completedAt: v.optional(v.number()),
    createdAt: v.number(),
    errorMessage: v.optional(v.string()),
    insertedCount: v.number(),
    providerKey: serviceProviderKeyValidator,
    startedAt: v.number(),
    status: serviceProviderSyncStatusValidator,
    updatedCount: v.number(),
  }).index("by_providerKey_and_createdAt", ["providerKey", "createdAt"]),

  serviceInvocations: defineTable({
    amount: v.optional(v.number()),
    checkoutId: v.id("checkouts"),
    checkoutItemId: v.id("checkoutItems"),
    createdAt: v.number(),
    currency: v.optional(v.string()),
    endpointMethod: v.optional(v.string()),
    endpointUrl: v.optional(v.string()),
    executionSurface: executionSurfaceValidator,
    externalJobId: v.optional(v.string()),
    externalRequestId: v.optional(v.string()),
    network: v.optional(v.string()),
    paymentAttemptId: v.optional(v.id("paymentAttempts")),
    paymentProtocol: paymentProtocolValidator,
    requestJson: v.optional(v.string()),
    responseJson: v.optional(v.string()),
    resultUrl: v.optional(v.string()),
    sourceCapabilityId: v.optional(v.string()),
    sourceProviderKey: serviceProviderKeyValidator,
    status: serviceInvocationStatusValidator,
    supplyId: v.id("supplies"),
    txHash: v.optional(v.string()),
    updatedAt: v.number(),
  })
    .index("by_checkoutItemId", ["checkoutItemId"])
    .index("by_paymentAttemptId", ["paymentAttemptId"])
    .index("by_sourceProviderKey_and_createdAt", ["sourceProviderKey", "createdAt"]),

  paymentAttempts: defineTable({
    amount: v.optional(v.number()),
    checkoutId: v.id("checkouts"),
    checkoutItemId: v.id("checkoutItems"),
    createdAt: v.number(),
    currency: v.string(),
    errorMessage: v.optional(v.string()),
    network: v.optional(v.string()),
    paymentProtocol: paymentProtocolValidator,
    providerKey: serviceProviderKeyValidator,
    receiptJson: v.optional(v.string()),
    status: paymentAttemptStatusValidator,
    txHash: v.optional(v.string()),
    updatedAt: v.number(),
    walletAddress: v.optional(v.string()),
  })
    .index("by_checkoutItemId", ["checkoutItemId"])
    .index("by_checkoutId_and_createdAt", ["checkoutId", "createdAt"]),

  transactionApprovals: defineTable({
    actorExternalId: v.optional(v.string()),
    approvalJson: v.optional(v.string()),
    checkoutItemId: v.id("checkoutItems"),
    createdAt: v.number(),
    paymentAttemptId: v.id("paymentAttempts"),
    status: transactionApprovalStatusValidator,
    updatedAt: v.number(),
    walletAddress: v.optional(v.string()),
  })
    .index("by_paymentAttemptId_and_createdAt", ["paymentAttemptId", "createdAt"])
    .index("by_checkoutItemId_and_createdAt", ["checkoutItemId", "createdAt"]),

  walletSessions: defineTable({
    actorExternalId: v.optional(v.string()),
    chainId: v.optional(v.string()),
    createdAt: v.number(),
    lastUsedAt: v.number(),
    metadataJson: v.optional(v.string()),
    walletAddress: v.string(),
    walletProvider: v.literal("privy"),
  })
    .index("by_actorExternalId_and_lastUsedAt", ["actorExternalId", "lastUsedAt"])
    .index("by_walletAddress", ["walletAddress"]),

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
    .index("by_intentKey_and_createdAt", ["intentKey", "createdAt"])
    .index("by_remoteId", ["remoteId"]),

  proposals: defineTable({
    collectiveMembers: v.optional(v.array(v.string())),
    createdAt: v.number(),
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
  })
    .index("by_proposerUserId_and_createdAt", ["proposerUserId", "createdAt"])
    .index("by_proposerUserId_and_status", ["proposerUserId", "status"])
    .index("by_intentKey_and_status", ["intentKey", "status"])
    .index("by_intentKey_and_createdAt", ["intentKey", "createdAt"]),

  fulfillments: defineTable({
    acceptedProposalId: v.optional(v.string()),
    completedSummary: v.optional(v.string()),
    escrowAddress: v.optional(v.string()),
    escrowAmount: v.optional(v.number()),
    fulfillerUserId: v.optional(v.string()),
    intentKey: v.string(),
    ownerUserId: v.optional(v.string()),
    status: fulfillmentStatusValidator,
  })
    .index("by_intentKey_and_status", ["intentKey", "status"])
    .index("by_fulfillerUserId", ["fulfillerUserId"])
    .index("by_fulfillerUserId_and_status", ["fulfillerUserId", "status"]),

  evidences: defineTable({
    attachments: v.optional(
      v.array(
        v.union(
          v.object({
            fileName: v.string(),
            mediaType: v.string(),
            sizeBytes: v.number(),
            storageId: v.id("_storage"),
          }),
          v.object({
            base64: v.string(),
            fileName: v.string(),
            mediaType: v.string(),
            sizeBytes: v.number(),
          }),
        ),
      ),
    ),
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

  matchCandidates: defineTable({
    availabilityFit: v.number(),
    calibratedSuccessProb: v.optional(v.number()),
    capabilityFit: v.number(),
    createdAt: v.number(),
    deadlineFit: v.number(),
    evidenceFit: v.number(),
    freshnessFit: v.number(),
    gatedOutReasons: v.array(v.string()),
    heuristicScore: v.number(),
    intentId: v.id("intents"),
    intentKey: v.string(),
    lexicalFit: v.number(),
    lexicalRank: v.optional(v.number()),
    matchReasons: v.array(v.string()),
    priceFit: v.number(),
    relationshipFit: v.number(),
    rrfScore: v.number(),
    semanticFit: v.number(),
    stage: matchCandidateStageValidator,
    supplyId: v.id("supplies"),
    titleSnapshot: v.string(),
    trustFit: v.number(),
    updatedAt: v.number(),
    vectorRank: v.optional(v.number()),
  })
    .index("by_intentId_and_createdAt", ["intentId", "createdAt"])
    .index("by_intentId_and_heuristicScore", ["intentId", "heuristicScore"])
    .index("by_intentId_and_stage", ["intentId", "stage"])
    .index("by_supplyId_and_createdAt", ["supplyId", "createdAt"]),

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
