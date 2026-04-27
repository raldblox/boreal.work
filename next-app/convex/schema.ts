import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

import {
  agentPaymentSourceValidator,
  agentRequestStatusValidator,
  agentConnectionRoleValidator,
  agentControlModeValidator,
  actorKindValidator,
  artifactKindValidator,
  artifactStatusValidator,
  capabilityRoutingTierValidator,
  chainFamilyValidator,
  chainEnvironmentValidator,
  cartStatusValidator,
  checkoutItemStatusValidator,
  checkoutProtocolValidator,
  checkoutStatusValidator,
  deliveryTypeValidator,
  disputeStatusValidator,
  executionSurfaceValidator,
  fulfillmentKindValidator,
  fulfillmentStatusValidator,
  generationSignalsValidator,
  intentStatusValidator,
  intentTypeValidator,
  matchCandidateStageValidator,
  paymentAttemptStatusValidator,
  paymentProtocolValidator,
  networkKeyValidator,
  payoutStatusValidator,
  proposalStatusValidator,
  profileAvailabilityValidator,
  requestedOutputTypeValidator,
  refundStatusValidator,
  resolutionTierValidator,
  routingValidator,
  settlementStatusValidator,
  serviceInvocationStatusValidator,
  serviceProviderKeyValidator,
  serviceProviderSyncStatusValidator,
  connectorHealthStatusValidator,
  supplyStatusValidator,
  transactionAuditSourceValidator,
  transactionAuditStageValidator,
  transactionAuditStatusValidator,
  transactionScenarioValidator,
  transactionApprovalStatusValidator,
  transactionScenarioRunStatusValidator,
  transactionStatusValidator,
  toolRouteValidator,
  walletAccountRoleValidator,
  walletExecutionModeValidator,
  walletProviderValidator,
  walletSyncStatusValidator,
  webhookDeliveryStatusValidator,
  webhookStreamValidator,
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
    activeAgentRole: v.optional(agentConnectionRoleValidator),
    activeAgentSupplyId: v.optional(v.id("supplies")),
    agentControlMode: v.optional(agentControlModeValidator),
    agentControlUpdatedAt: v.optional(v.number()),
    analytics: v.optional(v.object({
      activeCount: v.number(),
      activeSupplyCount: v.number(),
      activityBuckets: v.array(
        v.object({
          count: v.number(),
          label: v.string(),
        }),
      ),
      averageCompletionHours: v.optional(v.number()),
      averageRating: v.optional(v.number()),
      blockedCount: v.number(),
      buyerCheckoutCount: v.number(),
      fulfilledCount: v.number(),
      grossEarned: v.number(),
      grossSpend: v.number(),
      openCount: v.number(),
      productSupplyCount: v.number(),
      recentRequests: v.array(
        v.object({
          _id: v.string(),
          requestedOutputTypes: v.array(requestedOutputTypeValidator),
          status: v.string(),
          summary: v.string(),
          title: v.string(),
          updatedAt: v.number(),
        }),
      ),
      requestCount: v.number(),
      reviewCount: v.number(),
      sellerOrderCount: v.number(),
      supplyCount: v.number(),
      totalHandledCount: v.number(),
      totalProposalCount: v.number(),
      updatedAt: v.number(),
    })),
    availabilityStatus: profileAvailabilityValidator,
    avatarUrl: v.optional(v.string()),
    bio: v.optional(v.string()),
    capabilityTags: v.array(v.string()),
    createdAt: v.number(),
    defaultPayoutWalletAccountId: v.optional(v.id("walletAccounts")),
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
    walletChainFamily: v.optional(chainFamilyValidator),
    walletEnvironment: v.optional(chainEnvironmentValidator),
    walletNetworkKey: v.optional(networkKeyValidator),
    walletSyncStatus: v.optional(walletSyncStatusValidator),
  })
    .index("by_externalId", ["externalId"])
    .index("by_isPublic_and_updatedAt", ["isPublic", "updatedAt"])
    .index("by_userId", ["userId"])
    .searchIndex("search_public", {
      searchField: "searchText",
      filterFields: ["availabilityStatus", "isPublic"],
    }),

  walletAccounts: defineTable({
    actorExternalId: v.optional(v.string()),
    chainId: v.optional(v.string()),
    chainFamily: v.optional(chainFamilyValidator),
    createdAt: v.number(),
    environment: chainEnvironmentValidator,
    isDefaultBuyer: v.boolean(),
    isDefaultPayout: v.boolean(),
    lastSyncedAt: v.number(),
    metadataJson: v.optional(v.string()),
    networkKey: v.optional(networkKeyValidator),
    profileId: v.optional(v.id("profiles")),
    roles: v.array(walletAccountRoleValidator),
    userId: v.optional(v.string()),
    walletAddress: v.string(),
    walletProvider: walletProviderValidator,
  })
    .index("by_actorExternalId_and_lastSyncedAt", ["actorExternalId", "lastSyncedAt"])
    .index("by_profileId", ["profileId"])
    .index("by_userId_and_lastSyncedAt", ["userId", "lastSyncedAt"])
    .index("by_walletAddress", ["walletAddress"]),

  conversations: defineTable({
    conversationId: v.string(),
    intentCount: v.number(),
    lastMessageBody: v.optional(v.string()),
    lastMessageRole: v.optional(
      v.union(v.literal("assistant"), v.literal("system"), v.literal("user"))
    ),
    latestMessageAt: v.number(),
    messageCount: v.optional(v.number()),
    ownerExternalId: v.optional(v.string()),
    ownerHandle: v.optional(v.string()),
    ownerUserId: v.optional(v.string()),
    provider: v.string(),
    source: v.string(),
    status: v.string(),
    title: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_conversationId", ["conversationId"])
    .index("by_ownerExternalId_and_latestMessageAt", [
      "ownerExternalId",
      "latestMessageAt",
    ])
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
    videoSeconds: v.optional(v.string()),
    videoSize: v.optional(v.string()),
    visibility: v.union(v.literal("private"), v.literal("public")),
    voice: v.optional(v.string()),
  })
    .index("by_intentKey", ["intentKey"])
    .index("by_conversationId", ["conversationId"])
    .index("by_ownerUserId_and_updatedAt", ["ownerUserId", "updatedAt"])
    .index("by_provider_and_updatedAt", ["provider", "updatedAt"])
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
    agentReady: v.optional(v.boolean()),
    a2aEndpoint: v.optional(v.string()),
    acpCheckoutUrl: v.optional(v.string()),
    availabilityStatus: v.optional(profileAvailabilityValidator),
    brand: v.optional(v.string()),
    capabilityTags: v.array(v.string()),
    category: v.string(),
    checkoutProtocol: v.optional(checkoutProtocolValidator),
    checkoutProvider: v.optional(v.string()),
    currency: v.string(),
    connectorHealthStatus: v.optional(connectorHealthStatusValidator),
    connectorLastHeartbeatAt: v.optional(v.number()),
    connectorLastTestedAt: v.optional(v.number()),
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
    protocolDescriptorJson: v.optional(v.string()),
    responseSlaMinutes: v.optional(v.number()),
    requiresHumanApproval: v.optional(v.boolean()),
    routingTier: v.optional(capabilityRoutingTierValidator),
    schemaUrl: v.optional(v.string()),
    scenarioTypes: v.optional(v.array(transactionScenarioValidator)),
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
    offerSlug: v.optional(v.string()),
    maxConcurrentJobs: v.optional(v.number()),
    nextAvailableAt: v.optional(v.number()),
    mcpToolName: v.optional(v.string()),
    outputTypes: v.optional(v.array(requestedOutputTypeValidator)),
    supportsEvidencePush: v.optional(v.boolean()),
    supportsDirectInvoke: v.optional(v.boolean()),
    supportsPrivyWallet: v.optional(v.boolean()),
    supportsStatusUpdates: v.optional(v.boolean()),
    supplierUserId: v.optional(v.string()),
    title: v.string(),
    trustScore: v.number(),
    ucpCatalogUrl: v.optional(v.string()),
    ucpCheckoutUrl: v.optional(v.string()),
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
    environment: v.optional(chainEnvironmentValidator),
    itemCount: v.number(),
    ownerUserId: v.optional(v.string()),
    scenarioId: v.optional(v.string()),
    scenarioType: v.optional(transactionScenarioValidator),
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
    chainFamily: v.optional(chainFamilyValidator),
    environment: v.optional(chainEnvironmentValidator),
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
    networkKey: v.optional(networkKeyValidator),
    scenarioId: v.optional(v.string()),
    sellerDisplayName: v.optional(v.string()),
    sellerProfileId: v.optional(v.id("profiles")),
    sellerUserId: v.optional(v.string()),
    serviceInvocationId: v.optional(v.id("serviceInvocations")),
    transactionId: v.optional(v.id("transactions")),
    scenarioType: v.optional(transactionScenarioValidator),
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
    .index("by_sellerUserId_and_createdAt", ["sellerUserId", "createdAt"])
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
    chainFamily: v.optional(chainFamilyValidator),
    endpointMethod: v.optional(v.string()),
    endpointUrl: v.optional(v.string()),
    environment: v.optional(chainEnvironmentValidator),
    executionSurface: executionSurfaceValidator,
    externalJobId: v.optional(v.string()),
    externalRequestId: v.optional(v.string()),
    network: v.optional(v.string()),
    networkKey: v.optional(networkKeyValidator),
    paymentAttemptId: v.optional(v.id("paymentAttempts")),
    paymentProtocol: paymentProtocolValidator,
    requestJson: v.optional(v.string()),
    responseJson: v.optional(v.string()),
    resultUrl: v.optional(v.string()),
    sourceCapabilityId: v.optional(v.string()),
    sourceProviderKey: serviceProviderKeyValidator,
    status: serviceInvocationStatusValidator,
    supplyId: v.id("supplies"),
    transactionId: v.optional(v.id("transactions")),
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
    chainFamily: v.optional(chainFamilyValidator),
    environment: v.optional(chainEnvironmentValidator),
    errorMessage: v.optional(v.string()),
    network: v.optional(v.string()),
    networkKey: v.optional(networkKeyValidator),
    paymentProtocol: paymentProtocolValidator,
    providerKey: serviceProviderKeyValidator,
    receiptJson: v.optional(v.string()),
    status: paymentAttemptStatusValidator,
    transactionId: v.optional(v.id("transactions")),
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
    environment: v.optional(chainEnvironmentValidator),
    paymentAttemptId: v.id("paymentAttempts"),
    status: transactionApprovalStatusValidator,
    transactionId: v.optional(v.id("transactions")),
    updatedAt: v.number(),
    walletAddress: v.optional(v.string()),
  })
    .index("by_paymentAttemptId_and_createdAt", ["paymentAttemptId", "createdAt"])
    .index("by_checkoutItemId_and_createdAt", ["checkoutItemId", "createdAt"]),

  walletSessions: defineTable({
    actorExternalId: v.optional(v.string()),
    chainId: v.optional(v.string()),
    chainFamily: v.optional(chainFamilyValidator),
    createdAt: v.number(),
    environment: v.optional(chainEnvironmentValidator),
    lastUsedAt: v.number(),
    metadataJson: v.optional(v.string()),
    networkKey: v.optional(networkKeyValidator),
    walletAddress: v.string(),
    walletProvider: walletProviderValidator,
  })
    .index("by_actorExternalId_and_lastUsedAt", ["actorExternalId", "lastUsedAt"])
    .index("by_walletAddress", ["walletAddress"]),

  agentRequestSessions: defineTable({
    chainFamily: chainFamilyValidator,
    conversationId: v.optional(v.string()),
    createdAt: v.number(),
    currency: v.string(),
    deliveredAt: v.optional(v.number()),
    environment: chainEnvironmentValidator,
    errorCode: v.optional(v.string()),
    errorMessage: v.optional(v.string()),
    idempotencyKey: v.string(),
    intentId: v.optional(v.id("intents")),
    intentKey: v.optional(v.string()),
    lastEventAt: v.number(),
    lockedAt: v.number(),
    message: v.string(),
    mode: v.literal("auto"),
    networkKey: networkKeyValidator,
    ownerDisplayName: v.optional(v.string()),
    ownerExternalId: v.string(),
    paidAt: v.optional(v.number()),
    payerSource: v.optional(agentPaymentSourceValidator),
    paymentProtocol: paymentProtocolValidator,
    paymentReceiptJson: v.optional(v.string()),
    paymentVerificationJson: v.optional(v.string()),
    paymentVerifiedAt: v.optional(v.number()),
    quoteAmount: v.number(),
    quoteAuthorizationMessage: v.string(),
    quoteExpiresAt: v.number(),
    quoteRefreshCount: v.optional(v.number()),
    quoteToken: v.string(),
    requestFingerprint: v.string(),
    requestToken: v.string(),
    requestedOutputTypes: v.array(requestedOutputTypeValidator),
    resultJson: v.optional(v.string()),
    routeJson: v.string(),
    settlementId: v.optional(v.id("settlements")),
    startedAt: v.optional(v.number()),
    status: agentRequestStatusValidator,
    summary: v.string(),
    title: v.string(),
    transactionId: v.optional(v.id("transactions")),
    txHash: v.optional(v.string()),
    updatedAt: v.number(),
    walletAddress: v.string(),
  })
    .index("by_requestToken", ["requestToken"])
    .index("by_quoteToken", ["quoteToken"])
    .index("by_txHash", ["txHash"])
    .index("by_ownerExternalId_and_idempotencyKey", ["ownerExternalId", "idempotencyKey"])
    .index("by_ownerExternalId_and_requestFingerprint", ["ownerExternalId", "requestFingerprint"])
    .index("by_ownerExternalId_and_updatedAt", ["ownerExternalId", "updatedAt"]),

  agentRequestEvents: defineTable({
    createdAt: v.number(),
    dataJson: v.optional(v.string()),
    eventType: v.string(),
    message: v.string(),
    requestSessionId: v.id("agentRequestSessions"),
    requestToken: v.string(),
    status: agentRequestStatusValidator,
  })
    .index("by_requestSessionId_and_createdAt", ["requestSessionId", "createdAt"])
    .index("by_requestToken_and_createdAt", ["requestToken", "createdAt"]),

  supplierRequestDecisions: defineTable({
    createdAt: v.number(),
    intentId: v.id("intents"),
    reason: v.optional(v.string()),
    requestToken: v.string(),
    status: v.literal("declined"),
    supplierUserId: v.string(),
    supplyId: v.optional(v.id("supplies")),
    updatedAt: v.number(),
  })
    .index("by_supplierUserId_and_createdAt", ["supplierUserId", "createdAt"])
    .index("by_supplierUserId_and_intentId", ["supplierUserId", "intentId"])
    .index("by_requestToken_and_createdAt", ["requestToken", "createdAt"]),

  webhookSubscriptions: defineTable({
    active: v.boolean(),
    createdAt: v.number(),
    endpointUrl: v.string(),
    eventStreams: v.array(webhookStreamValidator),
    ownerDisplayName: v.optional(v.string()),
    ownerExternalId: v.string(),
    secret: v.string(),
    updatedAt: v.number(),
    walletAddress: v.optional(v.string()),
    webhookToken: v.string(),
  })
    .index("by_ownerExternalId_and_createdAt", ["ownerExternalId", "createdAt"])
    .index("by_webhookToken", ["webhookToken"]),

  webhookDeliveries: defineTable({
    attemptCount: v.number(),
    createdAt: v.number(),
    deliveredAt: v.optional(v.number()),
    deliveryToken: v.string(),
    endpointUrl: v.string(),
    entryToken: v.optional(v.string()),
    eventType: v.string(),
    lastAttemptAt: v.optional(v.number()),
    lastError: v.optional(v.string()),
    ownerExternalId: v.string(),
    payloadJson: v.string(),
    payoutToken: v.optional(v.string()),
    requestToken: v.optional(v.string()),
    responseStatus: v.optional(v.number()),
    secret: v.string(),
    status: webhookDeliveryStatusValidator,
    stream: webhookStreamValidator,
    subscriptionToken: v.string(),
    updatedAt: v.number(),
  })
    .index("by_deliveryToken", ["deliveryToken"])
    .index("by_ownerExternalId_and_createdAt", ["ownerExternalId", "createdAt"])
    .index("by_status_and_createdAt", ["status", "createdAt"])
    .index("by_subscriptionToken_and_createdAt", ["subscriptionToken", "createdAt"]),

  transactions: defineTable({
    amount: v.optional(v.number()),
    buyerUserId: v.optional(v.string()),
    buyerWalletAccountId: v.optional(v.id("walletAccounts")),
    checkoutId: v.optional(v.id("checkouts")),
    checkoutItemId: v.optional(v.id("checkoutItems")),
    createdAt: v.number(),
    currency: v.optional(v.string()),
    chainFamily: v.optional(chainFamilyValidator),
    environment: chainEnvironmentValidator,
    fulfillmentId: v.optional(v.id("fulfillments")),
    intentId: v.optional(v.id("intents")),
    intentKey: v.optional(v.string()),
    paymentAttemptId: v.optional(v.id("paymentAttempts")),
    paymentProtocol: v.optional(paymentProtocolValidator),
    paymentStatus: paymentAttemptStatusValidator,
    networkKey: v.optional(networkKeyValidator),
    proposalId: v.optional(v.id("proposals")),
    scenarioId: v.string(),
    scenarioType: transactionScenarioValidator,
    sellerProfileId: v.optional(v.id("profiles")),
    sellerUserId: v.optional(v.string()),
    settlementStatus: settlementStatusValidator,
    serviceInvocationId: v.optional(v.id("serviceInvocations")),
    sourceProviderKey: v.optional(serviceProviderKeyValidator),
    status: transactionStatusValidator,
    supplyId: v.optional(v.id("supplies")),
    titleSnapshot: v.optional(v.string()),
    updatedAt: v.number(),
  })
    .index("by_buyerUserId_and_createdAt", ["buyerUserId", "createdAt"])
    .index("by_checkoutItemId", ["checkoutItemId"])
    .index("by_intentKey_and_createdAt", ["intentKey", "createdAt"])
    .index("by_proposalId", ["proposalId"])
    .index("by_scenarioType_and_createdAt", ["scenarioType", "createdAt"])
    .index("by_sellerUserId_and_createdAt", ["sellerUserId", "createdAt"])
    .index("by_status_and_createdAt", ["status", "createdAt"]),

  settlements: defineTable({
    amount: v.optional(v.number()),
    buyerWalletAccountId: v.optional(v.id("walletAccounts")),
    chainFamily: v.optional(chainFamilyValidator),
    createdAt: v.number(),
    currency: v.optional(v.string()),
    environment: chainEnvironmentValidator,
    networkKey: v.optional(networkKeyValidator),
    payoutWalletAccountId: v.optional(v.id("walletAccounts")),
    settlementProtocol: v.optional(paymentProtocolValidator),
    status: settlementStatusValidator,
    transactionId: v.id("transactions"),
    txHash: v.optional(v.string()),
    updatedAt: v.number(),
  })
    .index("by_status_and_createdAt", ["status", "createdAt"])
    .index("by_transactionId", ["transactionId"]),

  payouts: defineTable({
    amount: v.number(),
    chainFamily: v.optional(chainFamilyValidator),
    createdAt: v.number(),
    currency: v.string(),
    environment: chainEnvironmentValidator,
    failureReason: v.optional(v.string()),
    networkKey: v.optional(networkKeyValidator),
    paidAt: v.optional(v.number()),
    payeeProfileId: v.optional(v.id("profiles")),
    payeeUserId: v.optional(v.string()),
    processingStartedAt: v.optional(v.number()),
    processor: v.optional(v.string()),
    status: payoutStatusValidator,
    settlementId: v.optional(v.id("settlements")),
    transactionId: v.id("transactions"),
    txHash: v.optional(v.string()),
    updatedAt: v.number(),
    walletAccountId: v.optional(v.id("walletAccounts")),
  })
    .index("by_payeeUserId_and_createdAt", ["payeeUserId", "createdAt"])
    .index("by_status_and_createdAt", ["status", "createdAt"])
    .index("by_transactionId", ["transactionId"]),

  transactionAuditEvents: defineTable({
    checkoutId: v.optional(v.id("checkouts")),
    checkoutItemId: v.optional(v.id("checkoutItems")),
    createdAt: v.number(),
    fulfillmentId: v.optional(v.id("fulfillments")),
    intentId: v.optional(v.id("intents")),
    message: v.string(),
    metadataJson: v.optional(v.string()),
    paymentAttemptId: v.optional(v.id("paymentAttempts")),
    proposalId: v.optional(v.id("proposals")),
    scenarioId: v.string(),
    scenarioType: transactionScenarioValidator,
    settlementId: v.optional(v.id("settlements")),
    source: transactionAuditSourceValidator,
    stage: transactionAuditStageValidator,
    status: transactionAuditStatusValidator,
    supplyId: v.optional(v.id("supplies")),
    transactionId: v.optional(v.id("transactions")),
    verificationRunId: v.optional(v.id("transactionScenarioRuns")),
  })
    .index("by_intentId_and_createdAt", ["intentId", "createdAt"])
    .index("by_scenarioType_and_createdAt", ["scenarioType", "createdAt"])
    .index("by_transactionId_and_createdAt", ["transactionId", "createdAt"])
    .index("by_verificationRunId_and_createdAt", ["verificationRunId", "createdAt"]),

  transactionScenarioRuns: defineTable({
    completedAt: v.optional(v.number()),
    createdAt: v.number(),
    errorMessage: v.optional(v.string()),
    intentId: v.optional(v.id("intents")),
    metadataJson: v.optional(v.string()),
    notes: v.optional(v.string()),
    runKey: v.string(),
    scenarioId: v.string(),
    scenarioType: transactionScenarioValidator,
    status: transactionScenarioRunStatusValidator,
    transactionId: v.optional(v.id("transactions")),
    updatedAt: v.number(),
  })
    .index("by_runKey_and_createdAt", ["runKey", "createdAt"])
    .index("by_scenarioType_and_createdAt", ["scenarioType", "createdAt"])
    .index("by_status_and_createdAt", ["status", "createdAt"]),

  refunds: defineTable({
    amount: v.number(),
    chainFamily: v.optional(chainFamilyValidator),
    checkoutId: v.optional(v.id("checkouts")),
    createdAt: v.number(),
    currency: v.string(),
    environment: chainEnvironmentValidator,
    networkKey: v.optional(networkKeyValidator),
    reason: v.string(),
    status: refundStatusValidator,
    transactionId: v.id("transactions"),
    updatedAt: v.number(),
  })
    .index("by_status_and_createdAt", ["status", "createdAt"])
    .index("by_transactionId", ["transactionId"]),

  disputes: defineTable({
    chainFamily: v.optional(chainFamilyValidator),
    checkoutId: v.optional(v.id("checkouts")),
    createdAt: v.number(),
    environment: chainEnvironmentValidator,
    networkKey: v.optional(networkKeyValidator),
    openedByUserId: v.optional(v.string()),
    reason: v.string(),
    resolutionSummary: v.optional(v.string()),
    status: disputeStatusValidator,
    transactionId: v.id("transactions"),
    updatedAt: v.number(),
  })
    .index("by_openedByUserId_and_createdAt", ["openedByUserId", "createdAt"])
    .index("by_status_and_createdAt", ["status", "createdAt"])
    .index("by_transactionId", ["transactionId"]),

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
    environment: v.optional(chainEnvironmentValidator),
    etaAt: v.number(),
    intentKey: v.string(),
    isCollective: v.boolean(),
    memberRoles: v.optional(v.array(v.object({ memberId: v.string(), role: v.string() }))),
    price: v.number(),
    proposerKind: actorKindValidator,
    proposerUserId: v.optional(v.string()),
    scenarioId: v.optional(v.string()),
    scenarioType: v.optional(transactionScenarioValidator),
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
    environment: v.optional(chainEnvironmentValidator),
    fulfillerUserId: v.optional(v.string()),
    intentKey: v.string(),
    ownerUserId: v.optional(v.string()),
    scenarioId: v.optional(v.string()),
    scenarioType: v.optional(transactionScenarioValidator),
    settlementStatus: v.optional(settlementStatusValidator),
    supplyId: v.optional(v.id("supplies")),
    status: fulfillmentStatusValidator,
    transactionId: v.optional(v.id("transactions")),
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
