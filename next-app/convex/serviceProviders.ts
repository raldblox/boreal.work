import { mutation, type MutationCtx } from "./_generated/server";
import { v } from "convex/values";

import { normalizedCapabilityToSupply } from "../lib/boreal/integrations/service-providers/normalization/to-supply";
import {
  ensureSettlementForTransaction,
  getCommerceEnvironment,
  getCommerceNetworkSelection,
  updateTransactionById,
} from "./commerceCore";
import { refreshProfileAnalyticsForUser } from "./profileAnalytics";
import { recordTransactionAuditEvent } from "./transactionScenarios";
import { syncWalletAccountRecord } from "./wallets";

import {
  capabilityRoutingTierValidator,
  executionSurfaceValidator,
  paymentProtocolValidator,
  serviceProviderKeyValidator,
  walletExecutionModeValidator,
} from "./validators";

const capabilityInputValidator = v.object({
  acceptedCurrencies: v.array(v.string()),
  capabilityTags: v.array(v.string()),
  category: v.string(),
  description: v.string(),
  endpoint: v.optional(
    v.object({
      bodyType: v.optional(v.union(v.literal("json"), v.literal("none"))),
      jsonRpcMethod: v.optional(v.string()),
      mcpServerUrl: v.optional(v.string()),
      method: v.optional(v.string()),
      toolName: v.optional(v.string()),
      url: v.optional(v.string()),
    }),
  ),
  evidence: v.object({
    returnsReceipt: v.boolean(),
    returnsTxHash: v.boolean(),
    supportsSchemaMetadata: v.boolean(),
  }),
  executionSurface: executionSurfaceValidator,
  keywords: v.array(v.string()),
  paymentNetworkHints: v.array(v.string()),
  paymentProtocol: paymentProtocolValidator,
  pricing: v.object({
    amount: v.optional(v.number()),
    currency: v.optional(v.string()),
    rawJson: v.optional(v.string()),
    type: v.union(
      v.literal("fixed"),
      v.literal("free"),
      v.literal("metered"),
      v.literal("quote-required"),
    ),
  }),
  rawJson: v.optional(v.string()),
  requiresHumanApproval: v.boolean(),
  routingTier: capabilityRoutingTierValidator,
  sourceCapabilityId: v.string(),
  sourceId: v.string(),
  sourceProvider: serviceProviderKeyValidator,
  sourceProviderUrl: v.optional(v.string()),
  sourceUrl: v.optional(v.string()),
  subtitle: v.optional(v.string()),
  supportsDirectInvoke: v.boolean(),
  supportsPrivyWallet: v.boolean(),
  title: v.string(),
  walletModes: v.array(walletExecutionModeValidator),
});

export const syncCatalogCapabilities = mutation({
  args: {
    capabilities: v.array(capabilityInputValidator),
    provider: v.object({
      description: v.optional(v.string()),
      displayName: v.string(),
      key: serviceProviderKeyValidator,
      providerUrl: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const syncId = await ctx.db.insert("serviceProviderSyncs", {
      completedAt: undefined,
      createdAt: now,
      errorMessage: undefined,
      insertedCount: 0,
      providerKey: args.provider.key,
      startedAt: now,
      status: "started",
      updatedCount: 0,
    });

    let insertedCount = 0;
    let updatedCount = 0;

    try {
      const existingProvider = await ctx.db
        .query("serviceProviders")
        .withIndex("by_key", (queryBuilder) => queryBuilder.eq("key", args.provider.key))
        .unique();

      if (existingProvider) {
        await ctx.db.patch(existingProvider._id, {
          capabilitiesCount: args.capabilities.length,
          description: args.provider.description,
          displayName: args.provider.displayName,
          isEnabled: true,
          providerUrl: args.provider.providerUrl,
          updatedAt: now,
        });
      } else {
        await ctx.db.insert("serviceProviders", {
          capabilitiesCount: args.capabilities.length,
          createdAt: now,
          description: args.provider.description,
          displayName: args.provider.displayName,
          isEnabled: true,
          key: args.provider.key,
          providerUrl: args.provider.providerUrl,
          updatedAt: now,
        });
      }

      for (const capability of args.capabilities) {
        const normalizedCapability = {
          acceptedCurrencies: capability.acceptedCurrencies,
          capabilityTags: capability.capabilityTags,
          category: capability.category,
          description: capability.description,
          endpoint: capability.endpoint,
          evidence: capability.evidence,
          executionSurface: capability.executionSurface,
          keywords: capability.keywords,
          paymentNetworkHints: capability.paymentNetworkHints,
          paymentProtocol: capability.paymentProtocol,
          pricing: {
            amount: capability.pricing.amount,
            currency: capability.pricing.currency,
            raw: parseOptionalJson(capability.pricing.rawJson),
            type: capability.pricing.type,
          },
          raw: parseOptionalJson(capability.rawJson),
          requiresHumanApproval: capability.requiresHumanApproval,
          routingTier: capability.routingTier,
          sourceCapabilityId: capability.sourceCapabilityId,
          sourceId: capability.sourceId,
          sourceProvider: capability.sourceProvider,
          sourceProviderUrl: capability.sourceProviderUrl,
          sourceUrl: capability.sourceUrl,
          subtitle: capability.subtitle,
          supportsDirectInvoke: capability.supportsDirectInvoke,
          supportsPrivyWallet: capability.supportsPrivyWallet,
          title: capability.title,
          walletRequirements: {
            supportedWalletModes: capability.walletModes,
          },
        } as const;
        const supplyPayload = normalizedCapabilityToSupply(normalizedCapability);
        const existingSupply = await ctx.db
          .query("supplies")
          .withIndex("by_sourceProviderKey_and_sourceCapabilityId", (queryBuilder) =>
            queryBuilder
              .eq("sourceProviderKey", capability.sourceProvider)
              .eq("sourceCapabilityId", capability.sourceCapabilityId),
          )
          .unique();

        const supplyDocument = {
          ...supplyPayload,
          activeReservations: existingSupply?.activeReservations ?? supplyPayload.activeReservations,
          availabilityStatus: existingSupply?.availabilityStatus ?? supplyPayload.availabilityStatus,
          createdAt: existingSupply?.createdAt ?? now,
          matchCount: existingSupply?.matchCount ?? 0,
          searchText: buildSupplySearchText({
            ...supplyPayload,
            availabilityStatus:
              existingSupply?.availabilityStatus ?? supplyPayload.availabilityStatus,
            createdAt: existingSupply?.createdAt ?? now,
            matchCount: existingSupply?.matchCount ?? 0,
            metadataJson: supplyPayload.metadataJson,
            supplierUserId: existingSupply?.supplierUserId,
            trustScore: existingSupply?.trustScore ?? supplyPayload.trustScore,
            updatedAt: now,
          }),
          supplierUserId: existingSupply?.supplierUserId,
          trustScore: existingSupply?.trustScore ?? supplyPayload.trustScore,
          updatedAt: now,
        };

        let supplyId = existingSupply?._id;

        if (existingSupply) {
          await ctx.db.patch(existingSupply._id, supplyDocument);
          updatedCount += 1;
        } else {
          supplyId = await ctx.db.insert("supplies", {
            ...supplyDocument,
          });
          insertedCount += 1;
        }

        const existingCapability = await ctx.db
          .query("serviceCapabilities")
          .withIndex("by_providerKey_and_sourceCapabilityId", (queryBuilder) =>
            queryBuilder
              .eq("providerKey", capability.sourceProvider)
              .eq("sourceCapabilityId", capability.sourceCapabilityId),
          )
          .unique();

        const capabilityDocument = {
          acceptedCurrencies: capability.acceptedCurrencies,
          capabilityTags: capability.capabilityTags,
          category: capability.category,
          createdAt: existingCapability?.createdAt ?? now,
          description: capability.description,
          endpointJson: capability.endpoint ? JSON.stringify(capability.endpoint) : undefined,
          executionSurface: capability.executionSurface,
          isActive: true,
          keywords: capability.keywords,
          paymentNetworkHints: capability.paymentNetworkHints,
          paymentProtocol: capability.paymentProtocol,
          pricingAmount: capability.pricing.amount,
          pricingCurrency: capability.pricing.currency,
          pricingRawJson: capability.pricing.rawJson,
          pricingType: capability.pricing.type,
          providerKey: capability.sourceProvider,
          rawJson: capability.rawJson,
          requiresHumanApproval: capability.requiresHumanApproval,
          routingTier: capability.routingTier,
          sourceCapabilityId: capability.sourceCapabilityId,
          sourceUrl: capability.sourceUrl,
          subtitle: capability.subtitle,
          supplyId,
          supportsDirectInvoke: capability.supportsDirectInvoke,
          supportsPrivyWallet: capability.supportsPrivyWallet,
          title: capability.title,
          updatedAt: now,
          walletModes: capability.walletModes,
        };

        if (existingCapability) {
          await ctx.db.patch(existingCapability._id, capabilityDocument);
        } else {
          await ctx.db.insert("serviceCapabilities", capabilityDocument);
        }
      }

      await ctx.db.patch(syncId, {
        completedAt: Date.now(),
        insertedCount,
        status: "completed",
        updatedCount,
      });

      return {
        insertedCount,
        synced: true,
        updatedCount,
      };
    } catch (error) {
      await ctx.db.patch(syncId, {
        completedAt: Date.now(),
        errorMessage: error instanceof Error ? error.message : "Unknown sync failure.",
        insertedCount,
        status: "failed",
        updatedCount,
      });
      throw error;
    }
  },
});

export const beginPaymentAttempt = mutation({
  args: {
    checkoutItemId: v.id("checkoutItems"),
    ownerExternalId: v.optional(v.string()),
    walletAddress: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const item = await ctx.db.get(args.checkoutItemId);

    if (!item || !item.paymentAttemptId) {
      return { started: false };
    }

    await ctx.db.patch(item.paymentAttemptId, {
      errorMessage: undefined,
      status: "processing",
      updatedAt: now,
      walletAddress: args.walletAddress,
    });

    await ctx.db.insert("transactionApprovals", {
      actorExternalId: args.ownerExternalId,
      approvalJson: undefined,
      checkoutItemId: item._id,
      createdAt: now,
      environment: getCommerceEnvironment(),
      paymentAttemptId: item.paymentAttemptId,
      status: "approved",
      transactionId: item.transactionId,
      updatedAt: now,
      walletAddress: args.walletAddress,
    });

    if (args.walletAddress) {
      await syncWalletAccountRecord(ctx, {
        environment: getCommerceEnvironment(),
        ownerExternalId: args.ownerExternalId,
        roles: ["connected", "buyer"],
        setAsDefaultBuyer: true,
        setAsDefaultPayout: false,
        walletAddress: args.walletAddress,
      });
    }

    if (item.transactionId) {
      await updateTransactionById(ctx, item.transactionId, {
        paymentAttemptId: item.paymentAttemptId,
        paymentStatus: "processing",
        status: "awaiting_payment",
      });

      await recordTransactionAuditEvent(ctx, {
        checkoutId: item.checkoutId,
        checkoutItemId: item._id,
        message: "Payment execution started for this provider-backed item.",
        paymentAttemptId: item.paymentAttemptId,
        scenarioType:
          item.scenarioType === "provider_handoff_service"
            ? "provider_handoff_service"
            : "provider_paid_service",
        source: "payment",
        stage: "payment",
        status: "info",
        supplyId: item.supplyId,
        transactionId: item.transactionId,
      });
    }

    return { started: true };
  },
});

export const completePaymentAttempt = mutation({
  args: {
    accessLabel: v.optional(v.string()),
    accessUrl: v.optional(v.string()),
    checkoutItemId: v.id("checkoutItems"),
    errorMessage: v.optional(v.string()),
    ownerExternalId: v.optional(v.string()),
    paymentReceiptJson: v.optional(v.string()),
    responseJson: v.optional(v.string()),
    status: v.union(v.literal("completed"), v.literal("failed"), v.literal("submitted")),
    txHash: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const item = await ctx.db.get(args.checkoutItemId);

    if (!item) {
      return { completed: false };
    }

    if (item.paymentAttemptId) {
      await ctx.db.patch(item.paymentAttemptId, {
        environment: getCommerceEnvironment(),
        errorMessage: args.status === "failed" ? args.errorMessage : undefined,
        receiptJson: args.paymentReceiptJson,
        status: args.status === "failed" ? "failed" : "paid",
        txHash: args.txHash,
        updatedAt: now,
      });
    }

    if (item.serviceInvocationId) {
      await ctx.db.patch(item.serviceInvocationId, {
        environment: getCommerceEnvironment(),
        responseJson: args.responseJson,
        resultUrl: args.accessUrl,
        status:
          args.status === "failed"
            ? "failed"
            : args.status === "completed"
              ? "completed"
              : "submitted",
        txHash: args.txHash,
        updatedAt: now,
      });
    }

    await ctx.db.patch(item._id, {
      accessLabel: args.accessLabel,
      accessUrl: args.accessUrl,
      metadataJson: args.responseJson,
      status:
        args.status === "failed"
          ? "failed"
          : args.status === "completed"
            ? "fulfilled"
            : "submitted",
      updatedAt: now,
    });

    if (item.transactionId) {
      await updateTransactionById(ctx, item.transactionId, {
        paymentAttemptId: item.paymentAttemptId,
        paymentStatus: args.status === "failed" ? "failed" : "paid",
        serviceInvocationId: item.serviceInvocationId,
        settlementStatus: "not_applicable",
        status:
          args.status === "failed"
            ? "failed"
            : args.status === "completed"
              ? "fulfilled"
              : "active",
      });

      const transaction = await ctx.db.get(item.transactionId);
      const settlementId = await ensureSettlementForTransaction(ctx, {
        amount: transaction?.amount,
        chainFamily: transaction?.chainFamily,
        currency: transaction?.currency,
        environment: transaction?.environment,
        networkKey: transaction?.networkKey
          ? getCommerceNetworkSelection({
              chainFamily: transaction?.chainFamily,
              environment: transaction?.environment,
              networkKey: transaction?.networkKey,
            }).networkKey
          : undefined,
        protocol: transaction?.paymentProtocol,
        status: "not_applicable",
        transactionId: item.transactionId,
        txHash: args.txHash,
      });

      await recordTransactionAuditEvent(ctx, {
        checkoutId: item.checkoutId,
        checkoutItemId: item._id,
        message:
          args.status === "failed"
            ? args.errorMessage ?? "Provider payment failed."
            : "Provider payment completed successfully.",
        metadata: {
          txHash: args.txHash,
        },
        paymentAttemptId: item.paymentAttemptId ?? undefined,
        scenarioType:
          item.scenarioType === "provider_handoff_service"
            ? "provider_handoff_service"
            : "provider_paid_service",
        source: "payment",
        stage: "payment",
        status: args.status === "failed" ? "failed" : "passed",
        supplyId: item.supplyId,
        transactionId: item.transactionId,
      });

      await recordTransactionAuditEvent(ctx, {
        checkoutId: item.checkoutId,
        checkoutItemId: item._id,
        message:
          args.status === "completed"
            ? "Provider execution returned a completed result."
            : args.status === "submitted"
              ? "Provider execution accepted the request and is now active."
              : "Provider execution failed.",
        metadata: {
          accessUrl: args.accessUrl,
        },
        paymentAttemptId: item.paymentAttemptId ?? undefined,
        scenarioType:
          item.scenarioType === "provider_handoff_service"
            ? "provider_handoff_service"
            : "provider_paid_service",
        source: "provider",
        stage: "provider",
        status: args.status === "failed" ? "failed" : "passed",
        supplyId: item.supplyId,
        transactionId: item.transactionId,
      });

      await recordTransactionAuditEvent(ctx, {
        checkoutId: item.checkoutId,
        checkoutItemId: item._id,
        message: "Settlement remains not applicable for provider-backed execution.",
        metadata: {
          settlementStatus: "not_applicable",
        },
        scenarioType:
          item.scenarioType === "provider_handoff_service"
            ? "provider_handoff_service"
            : "provider_paid_service",
        settlementId,
        source: "provider",
        stage: "settlement",
        status: "info",
        supplyId: item.supplyId,
        transactionId: item.transactionId,
      });
    }

    await updateCheckoutStatus(ctx, item.checkoutId);

    const checkout = await ctx.db.get(item.checkoutId);
    await refreshProfileAnalyticsForUser(ctx, checkout?.ownerUserId);
    await refreshProfileAnalyticsForUser(ctx, item.sellerUserId);

    return { completed: true };
  },
});

async function updateCheckoutStatus(
  ctx: MutationCtx,
  checkoutId: string,
) {
  const items = await ctx.db
    .query("checkoutItems")
    .withIndex("by_checkoutId_and_createdAt", (queryBuilder) =>
      queryBuilder.eq("checkoutId", checkoutId as never),
    )
    .collect();
  const statuses = items.map((item) => item.status);
  let status: "cancelled" | "failed" | "fulfilled" | "in_progress" | "pending_payment" | "submitted";

  if (statuses.length > 0 && statuses.every((itemStatus) => itemStatus === "fulfilled")) {
    status = "fulfilled";
  } else if (statuses.some((itemStatus) => itemStatus === "failed")) {
    status = "failed";
  } else if (statuses.some((itemStatus) => itemStatus === "awaiting_payment")) {
    status = "pending_payment";
  } else if (
    statuses.some(
      (itemStatus) =>
        itemStatus === "submitted" ||
        itemStatus === "in_progress" ||
        itemStatus === "paid",
    )
  ) {
    status = "in_progress";
  } else {
    status = "submitted";
  }

  await ctx.db.patch(checkoutId as never, {
    status,
    updatedAt: Date.now(),
  });
}

function buildSupplySearchText(input: {
  activeReservations?: number;
  actorKind: "agent" | "human" | "tool";
  availabilityStatus?: "available" | "limited" | "unavailable";
  brand?: string;
  capabilityTags: string[];
  category: string;
  checkoutProtocol?: "ucp" | "acp" | "custom";
  checkoutProvider?: string;
  currency: string;
  createdAt?: number;
  deliveryType: "async" | "instant" | "scheduled";
  description: string;
  estimatedDeliveryLabel?: string;
  evidenceMode?: "none" | "receipt" | "response";
  exampleIntents?: string[];
  exclusions?: string[];
  executionSurface?: "desktop" | "handoff" | "http" | "jsonrpc" | "mcp" | "registry" | "sdk" | "widget";
  executorUrl?: string;
  fulfillmentKind: "digital" | "hybrid" | "physical" | "service";
  fulfillmentRate: number;
  isCartEnabled: boolean;
  keywords: string[];
  maxConcurrentJobs?: number;
  matchCount: number;
  mcpServerUrl?: string;
  metadataJson?: string;
  nextAvailableAt?: number;
  openApiUrl?: string;
  outputTypes?: Array<"image_generation" | "speech_generation" | "text" | "video_generation">;
  paymentNetworkHints?: string[];
  paymentProtocol?: "direct-solana" | "mpp" | "none" | "widget" | "x402";
  priceAmount?: number;
  priceMax?: number;
  priceMin?: number;
  priceRawJson?: string;
  priceType: "fixed" | "hourly" | "scoped";
  responseSlaMinutes?: number;
  requiresHumanApproval?: boolean;
  routingTier?: "A-delegated" | "A-direct" | "B-ingest-handoff" | "C-manual";
  schemaUrl?: string;
  sourceCapabilityId?: string;
  sourceListingUrl?: string;
  sourceProviderKey?: string;
  sourceProviderUrl?: string;
  status: "active";
  subtitle?: string;
  supplierUserId?: string;
  supplyType: "agent_tool" | "capability" | "collective" | "product";
  supportsDirectInvoke?: boolean;
  supportsPrivyWallet?: boolean;
  title: string;
  trustScore: number;
  updatedAt?: number;
}) {
  return [
    input.title,
    input.subtitle,
    input.brand,
    input.category,
    input.description,
    input.deliveryType,
    input.fulfillmentKind,
    input.supplyType,
    input.currency,
    input.checkoutProtocol,
    input.checkoutProvider,
    input.availabilityStatus,
    input.estimatedDeliveryLabel,
    input.executorUrl,
    input.actorKind,
    input.priceType,
    input.paymentProtocol,
    input.sourceProviderKey,
    input.sourceProviderUrl,
    input.sourceListingUrl,
    input.executionSurface,
    input.evidenceMode,
    input.routingTier,
    input.supportsDirectInvoke ? "direct invoke" : "handoff",
    input.supportsPrivyWallet ? "privy wallet x402" : "manual payment",
    input.requiresHumanApproval ? "approval required" : "auto payable",
    String(input.priceAmount ?? ""),
    String(input.priceMin ?? ""),
    String(input.priceMax ?? ""),
    String(input.responseSlaMinutes ?? ""),
    String(input.maxConcurrentJobs ?? ""),
    String(input.activeReservations ?? ""),
    String(input.nextAvailableAt ?? ""),
    String(input.createdAt ?? ""),
    String(input.updatedAt ?? ""),
    String(input.trustScore),
    String(input.fulfillmentRate),
    String(input.matchCount),
    input.isCartEnabled ? "cart checkout buy purchase order payable" : "tool capability",
    ...(input.paymentNetworkHints ?? []),
    ...(input.outputTypes ?? []),
    ...input.capabilityTags,
    ...(input.exampleIntents ?? []),
    ...(input.exclusions ?? []),
    ...input.keywords,
    input.metadataJson,
    input.priceRawJson,
    input.schemaUrl,
    input.openApiUrl,
    input.mcpServerUrl,
    input.sourceCapabilityId,
  ]
    .filter(Boolean)
    .join(" ");
}

function parseOptionalJson(value?: string) {
  if (!value) {
    return undefined;
  }

  try {
    return JSON.parse(value) as unknown;
  } catch {
    return value;
  }
}
