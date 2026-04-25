import { mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { v } from "convex/values";

import {
  deriveCheckoutScenario,
  deriveCheckoutSettlementStatus,
  deriveCheckoutTransactionStatus,
  ensureSettlementForTransaction,
  ensureTransactionForCheckoutItem,
  getCommerceEnvironment,
  getDefaultBuyerWalletAccountId,
  getDefaultPayoutWalletAccountId,
} from "./commerceCore";
import { refreshProfileAnalyticsForUser } from "./profileAnalytics";
import {
  completeTransactionScenarioRun,
  getScenarioDefinition,
  getScenarioId,
  listScenarioDefinitions,
  recordTransactionAuditEvent,
  scenarioNeedsBuyerWallet,
  startTransactionScenarioRun,
} from "./transactionScenarios";
import {
  transactionScenarioRunStatusValidator,
  transactionScenarioValidator,
} from "./validators";

export const getActiveCart = query({
  args: {
    ownerExternalId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const owner = await getUserByExternalId(ctx, args.ownerExternalId);

    if (!owner) {
      return null;
    }

    const cart = await ctx.db
      .query("carts")
      .withIndex("by_ownerUserId_and_status", (queryBuilder) =>
        queryBuilder.eq("ownerUserId", owner._id).eq("status", "active"),
      )
      .unique();

    if (!cart) {
      return null;
    }

    return buildCartDetail(ctx, cart);
  },
});

export const listCheckoutHistory = query({
  args: {
    limit: v.number(),
    ownerExternalId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const owner = await getUserByExternalId(ctx, args.ownerExternalId);

    if (!owner) {
      return [];
    }

    const checkouts = await ctx.db
      .query("checkouts")
      .withIndex("by_ownerUserId_and_createdAt", (queryBuilder) =>
        queryBuilder.eq("ownerUserId", owner._id),
      )
      .order("desc")
      .take(args.limit);

    return Promise.all(checkouts.map((checkout) => buildCheckoutDetail(ctx, checkout)));
  },
});

export const listTransactionScenarioDefinitions = query({
  args: {},
  handler: async () => {
    return listScenarioDefinitions();
  },
});

export const listTransactionAudits = query({
  args: {
    intentId: v.optional(v.id("intents")),
    limit: v.number(),
    transactionId: v.optional(v.id("transactions")),
  },
  handler: async (ctx, args) => {
    const rows = args.transactionId
      ? await ctx.db
          .query("transactionAuditEvents")
          .withIndex("by_transactionId_and_createdAt", (queryBuilder) =>
            queryBuilder.eq("transactionId", args.transactionId),
          )
          .order("desc")
          .take(args.limit)
      : args.intentId
        ? await ctx.db
            .query("transactionAuditEvents")
            .withIndex("by_intentId_and_createdAt", (queryBuilder) =>
              queryBuilder.eq("intentId", args.intentId),
            )
            .order("desc")
            .take(args.limit)
        : [];

    return rows.map((row) => ({
      ...row,
      metadata: row.metadataJson ? JSON.parse(row.metadataJson) : null,
      scenario: getScenarioDefinition(row.scenarioType),
    }));
  },
});

export const startScenarioVerificationRun = mutation({
  args: {
    intentId: v.optional(v.id("intents")),
    notes: v.optional(v.string()),
    runKey: v.string(),
    scenarioType: transactionScenarioValidator,
  },
  handler: async (ctx, args) => {
    const runId = await startTransactionScenarioRun(ctx, args);

    await recordTransactionAuditEvent(ctx, {
      intentId: args.intentId,
      message: `Verification run started for ${args.runKey}.`,
      metadata: {
        runKey: args.runKey,
      },
      scenarioType: args.scenarioType,
      source: "verification",
      stage: "verification",
      status: "info",
      verificationRunId: runId,
    });

    return { runId, started: true };
  },
});

export const finishScenarioVerificationRun = mutation({
  args: {
    errorMessage: v.optional(v.string()),
    metadataJson: v.optional(v.string()),
    runId: v.id("transactionScenarioRuns"),
    status: transactionScenarioRunStatusValidator,
    transactionId: v.optional(v.id("transactions")),
  },
  handler: async (ctx, args) => {
    const run = await ctx.db.get(args.runId);

    if (!run) {
      return { finished: false };
    }

    const metadata = args.metadataJson ? JSON.parse(args.metadataJson) : undefined;

    await completeTransactionScenarioRun(ctx, {
      errorMessage: args.errorMessage,
      metadata,
      runId: args.runId,
      status: args.status,
      transactionId: args.transactionId,
    });

    await recordTransactionAuditEvent(ctx, {
      intentId: run.intentId,
      message:
        args.status === "passed"
          ? `Verification run ${run.runKey} passed.`
          : args.errorMessage ?? `Verification run ${run.runKey} ended with status ${args.status}.`,
      metadata: {
        runKey: run.runKey,
        ...(metadata ?? {}),
      },
      scenarioType: run.scenarioType,
      source: "verification",
      stage: "verification",
      status: args.status === "passed" ? "passed" : "failed",
      transactionId: args.transactionId,
      verificationRunId: args.runId,
    });

    return { finished: true };
  },
});

export const addToCart = mutation({
  args: {
    ownerDisplayName: v.optional(v.string()),
    ownerExternalId: v.optional(v.string()),
    sourceIntentId: v.optional(v.id("intents")),
    supplyId: v.id("supplies"),
  },
  handler: async (ctx, args) => {
    const owner = await upsertCommerceUser(ctx, {
      displayName: args.ownerDisplayName,
      externalId: args.ownerExternalId,
    });
    const supply = await ctx.db.get(args.supplyId);

    if (!owner || !supply || supply.status !== "active" || !supply.isCartEnabled) {
      return { added: false, cartId: null, itemCount: 0 };
    }

    const now = Date.now();
    let cart = await ctx.db
      .query("carts")
      .withIndex("by_ownerUserId_and_status", (queryBuilder) =>
        queryBuilder.eq("ownerUserId", owner._id).eq("status", "active"),
      )
      .unique();

    if (!cart) {
      const cartId = await ctx.db.insert("carts", {
        createdAt: now,
        ownerUserId: owner._id,
        sourceIntentId: args.sourceIntentId,
        status: "active",
        updatedAt: now,
      });
      cart = await ctx.db.get(cartId);
    }

    if (!cart) {
      return { added: false, cartId: null, itemCount: 0 };
    }

    const seller = await getSupplySellerSnapshot(ctx, supply.supplierUserId);
    const existingLine = await ctx.db
      .query("cartLineItems")
      .withIndex("by_cartId_and_supplyId", (queryBuilder) =>
        queryBuilder.eq("cartId", cart._id).eq("supplyId", supply._id),
      )
      .unique();

    if (existingLine) {
      await ctx.db.patch(existingLine._id, {
        quantity: existingLine.quantity + 1,
        updatedAt: now,
      });
    } else {
      await ctx.db.insert("cartLineItems", {
        addedAt: now,
        cartId: cart._id,
        category: supply.category,
        currency: supply.currency,
        deliveryType: supply.deliveryType,
        fulfillmentKind: supply.fulfillmentKind,
        priceType: supply.priceType,
        quantity: 1,
        sellerDisplayName: seller?.displayName,
        sellerProfileId: seller?.profileId,
        sellerUserId: supply.supplierUserId,
        subtitleSnapshot: supply.subtitle,
        supplyId: supply._id,
        titleSnapshot: supply.title,
        unitPriceAmount: supply.priceAmount,
        updatedAt: now,
      });
    }

    await ctx.db.patch(cart._id, {
      sourceIntentId: args.sourceIntentId ?? cart.sourceIntentId,
      updatedAt: now,
    });

    const lines = await ctx.db
      .query("cartLineItems")
      .withIndex("by_cartId_and_updatedAt", (queryBuilder) =>
        queryBuilder.eq("cartId", cart._id),
      )
      .collect();

    return {
      added: true,
      cartId: cart._id,
      itemCount: lines.reduce((sum, line) => sum + line.quantity, 0),
    };
  },
});

export const updateCartLineQuantity = mutation({
  args: {
    cartLineItemId: v.id("cartLineItems"),
    ownerExternalId: v.optional(v.string()),
    quantity: v.number(),
  },
  handler: async (ctx, args) => {
    const owner = await getUserByExternalId(ctx, args.ownerExternalId);
    const line = await ctx.db.get(args.cartLineItemId);

    if (!owner || !line) {
      return { updated: false };
    }

    const cart = await ctx.db.get(line.cartId);

    if (!cart || cart.ownerUserId !== owner._id || cart.status !== "active") {
      return { updated: false };
    }

    if (args.quantity <= 0) {
      await ctx.db.delete(line._id);
    } else {
      await ctx.db.patch(line._id, {
        quantity: Math.max(1, Math.round(args.quantity)),
        updatedAt: Date.now(),
      });
    }

    await ctx.db.patch(cart._id, { updatedAt: Date.now() });

    return { updated: true };
  },
});

export const removeFromCart = mutation({
  args: {
    cartLineItemId: v.id("cartLineItems"),
    ownerExternalId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const owner = await getUserByExternalId(ctx, args.ownerExternalId);
    const line = await ctx.db.get(args.cartLineItemId);

    if (!owner || !line) {
      return { removed: false };
    }

    const cart = await ctx.db.get(line.cartId);

    if (!cart || cart.ownerUserId !== owner._id || cart.status !== "active") {
      return { removed: false };
    }

    await ctx.db.delete(line._id);
    await ctx.db.patch(cart._id, { updatedAt: Date.now() });

    return { removed: true };
  },
});

export const clearActiveCart = mutation({
  args: {
    ownerExternalId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const owner = await getUserByExternalId(ctx, args.ownerExternalId);

    if (!owner) {
      return { cleared: false };
    }

    const cart = await ctx.db
      .query("carts")
      .withIndex("by_ownerUserId_and_status", (queryBuilder) =>
        queryBuilder.eq("ownerUserId", owner._id).eq("status", "active"),
      )
      .unique();

    if (!cart) {
      return { cleared: true };
    }

    const lines = await ctx.db
      .query("cartLineItems")
      .withIndex("by_cartId_and_updatedAt", (queryBuilder) =>
        queryBuilder.eq("cartId", cart._id),
      )
      .collect();

    for (const line of lines) {
      await ctx.db.delete(line._id);
    }

    await ctx.db.patch(cart._id, { updatedAt: Date.now() });

    return { cleared: true };
  },
});

export const checkoutCart = mutation({
  args: {
    ownerDisplayName: v.optional(v.string()),
    ownerExternalId: v.optional(v.string()),
    sourceIntentId: v.optional(v.id("intents")),
  },
  handler: async (ctx, args) => {
    const owner = await upsertCommerceUser(ctx, {
      displayName: args.ownerDisplayName,
      externalId: args.ownerExternalId,
    });

    if (!owner) {
      return { checkoutId: null, placed: false };
    }

    const cart = await ctx.db
      .query("carts")
      .withIndex("by_ownerUserId_and_status", (queryBuilder) =>
        queryBuilder.eq("ownerUserId", owner._id).eq("status", "active"),
      )
      .unique();

    if (!cart) {
      return { checkoutId: null, placed: false };
    }

    const cartItems = await ctx.db
      .query("cartLineItems")
      .withIndex("by_cartId_and_updatedAt", (queryBuilder) =>
        queryBuilder.eq("cartId", cart._id),
      )
      .collect();

    if (cartItems.length === 0) {
      return { checkoutId: null, placed: false };
    }

    const sourceIntentId = args.sourceIntentId ?? cart.sourceIntentId;
    const cartSupplies = await Promise.all(
      cartItems.map((item) => ctx.db.get(item.supplyId)),
    );
    const payableScenarios = cartItems
      .map((item, index) => {
        const supply = cartSupplies[index];
        const scenarioType = deriveCheckoutScenario({
          deliveryType: item.deliveryType,
          fulfillmentKind: item.fulfillmentKind,
          sourceProviderKey: supply?.sourceProviderKey,
          supportsDirectInvoke: supply?.supportsDirectInvoke,
        });

        return {
          amount: item.unitPriceAmount ?? supply?.priceAmount ?? undefined,
          scenarioType,
          supplyId: item.supplyId,
        };
      })
      .filter((entry) =>
        scenarioNeedsBuyerWallet(entry.scenarioType, entry.amount),
      );

    const buyerWalletAccountId =
      payableScenarios.length > 0
        ? await getDefaultBuyerWalletAccountId(ctx, owner._id)
        : undefined;

    if (payableScenarios.length > 0 && !buyerWalletAccountId) {
      if (sourceIntentId) {
        await recordTransactionAuditEvent(ctx, {
          intentId: sourceIntentId,
          message:
            "Buyer wallet is required before checking out paid listings.",
          metadata: {
            payableScenarioIds: payableScenarios.map((entry) =>
              getScenarioId(entry.scenarioType),
            ),
            payableSupplyIds: payableScenarios.map((entry) => entry.supplyId),
          },
          scenarioType: payableScenarios[0]!.scenarioType,
          source: "wallet",
          stage: "wallet",
          status: "blocked",
        });
      }

      return {
        checkoutId: null,
        placed: false,
        reason: "missing_buyer_wallet" as const,
      };
    }

    const now = Date.now();
    const environment = getCommerceEnvironment();
    const currency = cartItems[0]?.currency ?? "USD";
    const subtotalAmount = cartItems.reduce(
      (sum, item) => sum + (item.unitPriceAmount ?? 0) * item.quantity,
      0,
    );
    const checkoutId = await ctx.db.insert("checkouts", {
      cartId: cart._id,
      createdAt: now,
      currency,
      environment,
      itemCount: cartItems.reduce((sum, item) => sum + item.quantity, 0),
      ownerUserId: owner._id,
      scenarioId: undefined,
      scenarioType: undefined,
      sourceIntentId,
      status: "submitted",
      subtotalAmount,
      updatedAt: now,
    });

    const itemSnapshots: Array<{
      accessLabel?: string;
      accessUrl?: string;
      quantity: number;
      status:
        | "awaiting_payment"
        | "fulfilled"
        | "submitted";
      title: string;
    }> = [];
    const checkoutItemStatuses: string[] = [];

    for (const [index, line] of cartItems.entries()) {
      const supply = cartSupplies[index];
      const instantAccess = Boolean(
        supply &&
          !supply.sourceProviderKey &&
          supply.fulfillmentKind === "digital" &&
          supply.deliveryType === "instant" &&
          supply.executorUrl,
      );
      const directExternalInvoke = Boolean(
        supply &&
          supply.sourceProviderKey &&
          supply.paymentProtocol === "x402" &&
          supply.supportsDirectInvoke &&
          supply.executorUrl,
      );
      const handoffExternalInvoke = Boolean(
        supply &&
          supply.sourceProviderKey &&
          (!supply.supportsDirectInvoke || supply.paymentProtocol !== "x402"),
      );
      const scenarioType = deriveCheckoutScenario({
        deliveryType: line.deliveryType,
        fulfillmentKind: line.fulfillmentKind,
        sourceProviderKey: supply?.sourceProviderKey,
        supportsDirectInvoke: supply?.supportsDirectInvoke,
      });
      const scenarioId = getScenarioId(scenarioType);
      const checkoutItemStatus = instantAccess
        ? "fulfilled"
        : directExternalInvoke
          ? "awaiting_payment"
          : "submitted";
      const checkoutItemId = await ctx.db.insert("checkoutItems", {
        accessLabel: instantAccess
          ? "Open file"
          : handoffExternalInvoke
            ? "Open provider"
            : undefined,
        accessUrl: instantAccess
          ? supply?.executorUrl
          : handoffExternalInvoke
            ? supply?.sourceListingUrl ?? supply?.sourceProviderUrl ?? supply?.executorUrl
            : undefined,
        category: line.category,
        checkoutId,
        createdAt: now,
        currency: line.currency,
        deliveryType: line.deliveryType,
        environment,
        executionSurface: supply?.executionSurface,
        fulfillmentKind: line.fulfillmentKind,
        metadataJson: supply?.metadataJson,
        paymentAttemptId: undefined,
        paymentProtocol: supply?.paymentProtocol,
        priceType: line.priceType,
        quantity: line.quantity,
        sellerDisplayName: line.sellerDisplayName,
        sellerProfileId: line.sellerProfileId,
        sellerUserId: line.sellerUserId,
        scenarioId,
        serviceInvocationId: undefined,
        scenarioType,
        sourceListingUrl: supply?.sourceListingUrl,
        sourceProviderKey: supply?.sourceProviderKey,
        status: checkoutItemStatus,
        subtitleSnapshot: line.subtitleSnapshot,
        supplyId: line.supplyId,
        titleSnapshot: line.titleSnapshot,
        unitPriceAmount: line.unitPriceAmount,
        updatedAt: now,
      });
      let paymentAttemptId: Id<"paymentAttempts"> | undefined;
      let serviceInvocationId: Id<"serviceInvocations"> | undefined;

      if (directExternalInvoke && supply) {
        paymentAttemptId = await ctx.db.insert("paymentAttempts", {
          amount: supply.priceAmount,
          checkoutId,
          checkoutItemId,
          createdAt: now,
          currency: supply.currency,
          environment,
          errorMessage: undefined,
          network: derivePrimaryNetworkHint(supply.paymentNetworkHints),
          paymentProtocol: supply.paymentProtocol ?? "x402",
          providerKey: supply.sourceProviderKey!,
          receiptJson: undefined,
          status: supply.requiresHumanApproval ? "pending_approval" : "ready_to_pay",
          transactionId: undefined,
          txHash: undefined,
          updatedAt: now,
          walletAddress: undefined,
        });
        serviceInvocationId = await ctx.db.insert("serviceInvocations", {
          amount: supply.priceAmount,
          checkoutId,
          checkoutItemId,
          createdAt: now,
          currency: supply.currency,
          endpointMethod: deriveEndpointMethod(supply),
          endpointUrl: supply.executorUrl,
          environment,
          executionSurface: supply.executionSurface ?? "http",
          externalJobId: undefined,
          externalRequestId: undefined,
          network: derivePrimaryNetworkHint(supply.paymentNetworkHints),
          paymentAttemptId,
          paymentProtocol: supply.paymentProtocol ?? "x402",
          requestJson: undefined,
          responseJson: undefined,
          resultUrl: undefined,
          sourceCapabilityId: supply.sourceCapabilityId,
          sourceProviderKey: supply.sourceProviderKey!,
          status: "awaiting_payment",
          supplyId: supply._id,
          transactionId: undefined,
          txHash: undefined,
          updatedAt: now,
        });
        await ctx.db.patch(checkoutItemId, {
          paymentAttemptId,
          serviceInvocationId,
        });
      } else if (handoffExternalInvoke && supply?.sourceProviderKey) {
        serviceInvocationId = await ctx.db.insert("serviceInvocations", {
          amount: supply.priceAmount,
          checkoutId,
          checkoutItemId,
          createdAt: now,
          currency: supply.currency,
          endpointMethod: deriveEndpointMethod(supply),
          endpointUrl: supply.executorUrl,
          environment,
          executionSurface: supply.executionSurface ?? "handoff",
          externalJobId: undefined,
          externalRequestId: undefined,
          network: derivePrimaryNetworkHint(supply.paymentNetworkHints),
          paymentAttemptId: undefined,
          paymentProtocol: supply.paymentProtocol ?? "none",
          requestJson: undefined,
          responseJson: undefined,
          resultUrl: supply.sourceListingUrl ?? supply.sourceProviderUrl ?? supply.executorUrl,
          sourceCapabilityId: supply.sourceCapabilityId,
          sourceProviderKey: supply.sourceProviderKey!,
          status: "handoff_required",
          supplyId: supply._id,
          transactionId: undefined,
          txHash: undefined,
          updatedAt: now,
        });
        await ctx.db.patch(checkoutItemId, {
          serviceInvocationId,
        });
      }

      const transactionId = await ensureTransactionForCheckoutItem(ctx, {
        amount: line.unitPriceAmount ?? supply?.priceAmount ?? undefined,
        buyerUserId: owner._id,
        buyerWalletAccountId,
        checkoutId,
        checkoutItemId,
        currency: line.currency,
        environment,
        intentId: sourceIntentId ?? undefined,
        intentKey: undefined,
        paymentAttemptId,
        paymentProtocol: supply?.paymentProtocol ?? null,
        paymentStatus:
          directExternalInvoke && supply?.requiresHumanApproval
            ? "pending_approval"
            : directExternalInvoke
              ? "ready_to_pay"
              : "paid",
        scenarioType,
        sellerProfileId: line.sellerProfileId ?? undefined,
        sellerUserId: line.sellerUserId,
        serviceInvocationId,
        settlementStatus: deriveCheckoutSettlementStatus({
          amount: line.unitPriceAmount ?? supply?.priceAmount,
          itemStatus: checkoutItemStatus,
          scenarioType,
          sellerUserId: line.sellerUserId,
          sourceProviderKey: supply?.sourceProviderKey,
        }),
        sourceProviderKey: supply?.sourceProviderKey ?? null,
        status: deriveCheckoutTransactionStatus({
          itemStatus: checkoutItemStatus,
        }),
        supplyId: line.supplyId,
        titleSnapshot: line.titleSnapshot,
      });

      await ctx.db.patch(checkoutItemId, {
        transactionId,
      });

      if (paymentAttemptId) {
        await ctx.db.patch(paymentAttemptId, {
          transactionId,
        });
      }

      if (serviceInvocationId) {
        await ctx.db.patch(serviceInvocationId, {
          transactionId,
        });
      }

      const settlementId = await ensureSettlementForTransaction(ctx, {
        amount: line.unitPriceAmount ?? supply?.priceAmount ?? undefined,
        buyerWalletAccountId,
        currency: line.currency,
        environment,
        payoutWalletAccountId: await getDefaultPayoutWalletAccountId(
          ctx,
          line.sellerUserId,
        ),
        protocol: supply?.paymentProtocol ?? null,
        status: deriveCheckoutSettlementStatus({
          amount: line.unitPriceAmount ?? supply?.priceAmount,
          itemStatus: checkoutItemStatus,
          scenarioType,
          sellerUserId: line.sellerUserId,
          sourceProviderKey: supply?.sourceProviderKey,
        }),
        transactionId,
      });

      await recordTransactionAuditEvent(ctx, {
        checkoutId,
        checkoutItemId,
        intentId: sourceIntentId ?? undefined,
        message: `Checkout item created for ${line.titleSnapshot}.`,
        metadata: {
          checkoutItemStatus,
          title: line.titleSnapshot,
        },
        scenarioType,
        source: "checkout",
        stage: "checkout",
        status: "passed",
        supplyId: line.supplyId,
        transactionId,
      });

      if (paymentAttemptId) {
        await recordTransactionAuditEvent(ctx, {
          checkoutId,
          checkoutItemId,
          intentId: sourceIntentId ?? undefined,
          message:
            directExternalInvoke && supply?.requiresHumanApproval
              ? "Payment approval created and awaiting buyer confirmation."
              : "Payment attempt created and ready for buyer action.",
          paymentAttemptId,
          scenarioType,
          source: "payment",
          stage: "payment",
          status: "info",
          supplyId: line.supplyId,
          transactionId,
        });
      }

      if (serviceInvocationId) {
        await recordTransactionAuditEvent(ctx, {
          checkoutId,
          checkoutItemId,
          intentId: sourceIntentId ?? undefined,
          message: handoffExternalInvoke
            ? "Provider handoff was attached to this checkout item."
            : "Provider invocation is linked to this checkout item.",
          metadata: {
            executionSurface: supply?.executionSurface,
            supportsDirectInvoke: Boolean(supply?.supportsDirectInvoke),
          },
          scenarioType,
          source: "provider",
          stage: "provider",
          status: "info",
          supplyId: line.supplyId,
          transactionId,
        });
      } else if (instantAccess) {
        await recordTransactionAuditEvent(ctx, {
          checkoutId,
          checkoutItemId,
          intentId: sourceIntentId ?? undefined,
          message: "Instant digital access was attached immediately at checkout.",
          scenarioType,
          source: "checkout",
          stage: "fulfillment",
          status: "passed",
          supplyId: line.supplyId,
          transactionId,
        });
      }

      await recordTransactionAuditEvent(ctx, {
        checkoutId,
        checkoutItemId,
        intentId: sourceIntentId ?? undefined,
        message: "Settlement state was synchronized for this checkout item.",
        metadata: {
          settlementStatus: deriveCheckoutSettlementStatus({
            amount: line.unitPriceAmount ?? supply?.priceAmount,
            itemStatus: checkoutItemStatus,
            scenarioType,
            sellerUserId: line.sellerUserId,
            sourceProviderKey: supply?.sourceProviderKey,
          }),
        },
        scenarioType,
        settlementId,
        source: "checkout",
        stage: "settlement",
        status: "info",
        supplyId: line.supplyId,
        transactionId,
      });

      itemSnapshots.push({
        accessLabel: instantAccess
          ? "Open file"
          : handoffExternalInvoke
            ? "Open provider"
            : undefined,
        accessUrl: instantAccess
          ? supply?.executorUrl
          : handoffExternalInvoke
            ? supply?.sourceListingUrl ?? supply?.sourceProviderUrl ?? supply?.executorUrl
            : undefined,
        quantity: line.quantity,
        status: checkoutItemStatus,
        title: line.titleSnapshot,
      });
      checkoutItemStatuses.push(checkoutItemStatus);
    }

    const checkoutStatus = determineCheckoutStatus(checkoutItemStatuses);

    await ctx.db.patch(checkoutId, {
      scenarioId:
        itemSnapshots.length === 1
          ? getScenarioId(
              deriveCheckoutScenario({
                deliveryType: cartItems[0]?.deliveryType,
                fulfillmentKind: cartItems[0]?.fulfillmentKind,
                sourceProviderKey: cartSupplies[0]?.sourceProviderKey,
                supportsDirectInvoke: cartSupplies[0]?.supportsDirectInvoke,
              }),
            )
          : undefined,
      scenarioType:
        itemSnapshots.length === 1
          ? deriveCheckoutScenario({
              deliveryType: cartItems[0]?.deliveryType,
              fulfillmentKind: cartItems[0]?.fulfillmentKind,
              sourceProviderKey: cartSupplies[0]?.sourceProviderKey,
              supportsDirectInvoke: cartSupplies[0]?.supportsDirectInvoke,
            })
          : undefined,
      status: checkoutStatus,
      updatedAt: now,
    });
    await ctx.db.patch(cart._id, {
      status: "checked_out",
      updatedAt: now,
    });

    if (sourceIntentId) {
      const intent = await ctx.db.get(sourceIntentId);

      if (intent) {
        await ctx.db.insert("activityEvents", {
          createdAt: now,
          entityId: intent.intentKey,
          entityType: "intent",
          payload: JSON.stringify({
            checkoutId,
            itemCount: itemSnapshots.reduce((sum, item) => sum + item.quantity, 0),
            status: checkoutStatus,
          }),
          type: "commerce.checkout_submitted",
        });

        if (intent.conversationId) {
          await ctx.db.insert("chatMessages", {
            body: buildCheckoutMessage(itemSnapshots, checkoutStatus),
            conversationId: intent.conversationId,
            createdAt: now,
            intentKey: intent.intentKey,
            messageId: crypto.randomUUID(),
            provider: "boreal-agent",
            role: "system",
            senderActorKind: "tool",
            senderDisplayName: "Boreal Commerce",
            senderExternalId: undefined,
            senderHandle: "boreal-commerce",
          });
        }
      }
    }

    const sellerUserIds = Array.from(
      new Set(cartItems.map((item) => item.sellerUserId).filter(Boolean)),
    );

    await refreshProfileAnalyticsForUser(ctx, owner._id);
    for (const sellerUserId of sellerUserIds) {
      await refreshProfileAnalyticsForUser(ctx, sellerUserId);
    }

    return { checkoutId, placed: true };
  },
});

async function buildCartDetail(
  ctx: QueryCtx,
  cart: {
    _id: string;
    createdAt: number;
    sourceIntentId?: string;
    status: "active" | "abandoned" | "checked_out";
    updatedAt: number;
  },
) {
  const items = await ctx.db
    .query("cartLineItems")
    .withIndex("by_cartId_and_updatedAt", (queryBuilder) =>
      queryBuilder.eq("cartId", cart._id as never),
    )
    .order("desc")
    .collect();
  const itemDetails = await Promise.all(
    items.map(async (item) => {
      const supply = await ctx.db.get(item.supplyId);

      return {
        _id: item._id,
        category: item.category,
        currency: item.currency,
        deliveryType: item.deliveryType,
        fulfillmentKind: item.fulfillmentKind,
        lineTotalAmount: (item.unitPriceAmount ?? 0) * item.quantity,
        paymentNetworkHints: supply?.paymentNetworkHints ?? [],
        paymentProtocol: supply?.paymentProtocol ?? null,
        priceType: item.priceType,
        quantity: item.quantity,
        sellerDisplayName: item.sellerDisplayName ?? null,
        sellerProfileId: item.sellerProfileId ?? null,
        sourceProviderKey: supply?.sourceProviderKey ?? null,
        subtitle: item.subtitleSnapshot ?? null,
        supplyId: item.supplyId,
        supportsDirectInvoke: supply?.supportsDirectInvoke ?? false,
        title: item.titleSnapshot,
        unitPriceAmount: item.unitPriceAmount ?? null,
        updatedAt: item.updatedAt,
      };
    }),
  );

  return {
    _id: cart._id,
    createdAt: cart.createdAt,
    currency: items[0]?.currency ?? "USD",
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    items: itemDetails,
    sourceIntentId: cart.sourceIntentId ?? null,
    status: cart.status,
    subtotalAmount: items.reduce(
      (sum, item) => sum + (item.unitPriceAmount ?? 0) * item.quantity,
      0,
    ),
    updatedAt: cart.updatedAt,
  };
}

async function buildCheckoutDetail(
  ctx: QueryCtx,
  checkout: {
    _id: string;
    createdAt: number;
    currency: string;
    itemCount: number;
    status: "cancelled" | "failed" | "fulfilled" | "in_progress" | "pending_payment" | "submitted";
    subtotalAmount: number;
    updatedAt: number;
  },
) {
  const items = await ctx.db
    .query("checkoutItems")
    .withIndex("by_checkoutId_and_createdAt", (queryBuilder) =>
      queryBuilder.eq("checkoutId", checkout._id as never),
    )
    .order("asc")
    .collect();

  const itemDetails = await Promise.all(
    items.map(async (item) => {
      const paymentAttempt = item.paymentAttemptId
        ? await ctx.db.get(item.paymentAttemptId)
        : null;
      const serviceInvocation = item.serviceInvocationId
        ? await ctx.db.get(item.serviceInvocationId)
        : null;

      return {
        _id: item._id,
        accessLabel: item.accessLabel ?? null,
        accessUrl: item.accessUrl ?? null,
        category: item.category,
        deliveryType: item.deliveryType,
        fulfillmentKind: item.fulfillmentKind,
        payment: paymentAttempt
          ? {
              amount: paymentAttempt.amount ?? null,
              attemptId: paymentAttempt._id,
              currency: paymentAttempt.currency,
              errorMessage: paymentAttempt.errorMessage ?? null,
              network: paymentAttempt.network ?? null,
              protocol: paymentAttempt.paymentProtocol,
              providerKey: paymentAttempt.providerKey,
              receiptJson: paymentAttempt.receiptJson ?? null,
              status: paymentAttempt.status,
              txHash: paymentAttempt.txHash ?? null,
              walletAddress: paymentAttempt.walletAddress ?? null,
            }
          : null,
        priceType: item.priceType,
        quantity: item.quantity,
        reviewRating: item.reviewRating ?? null,
        sellerDisplayName: item.sellerDisplayName ?? null,
        sellerProfileId: item.sellerProfileId ?? null,
        serviceInvocation: serviceInvocation
          ? {
              endpointMethod: serviceInvocation.endpointMethod ?? null,
              endpointUrl: serviceInvocation.endpointUrl ?? null,
              executionSurface: serviceInvocation.executionSurface,
              providerKey: serviceInvocation.sourceProviderKey,
              resultUrl: serviceInvocation.resultUrl ?? null,
              responseJson: serviceInvocation.responseJson ?? null,
              status: serviceInvocation.status,
              updatedAt: serviceInvocation.updatedAt,
            }
          : null,
        sourceListingUrl: item.sourceListingUrl ?? null,
        sourceProviderKey: item.sourceProviderKey ?? null,
        status: item.status,
        subtitle: item.subtitleSnapshot ?? null,
        supplyId: item.supplyId,
        title: item.titleSnapshot,
        unitPriceAmount: item.unitPriceAmount ?? null,
      };
    }),
  );

  return {
    _id: checkout._id,
    createdAt: checkout.createdAt,
    currency: checkout.currency,
    itemCount: checkout.itemCount,
    items: itemDetails,
    status: checkout.status,
    subtotalAmount: checkout.subtotalAmount,
    updatedAt: checkout.updatedAt,
  };
}

async function getUserByExternalId(
  ctx: MutationCtx | QueryCtx,
  externalId?: string,
) {
  if (!externalId) {
    return null;
  }

  return ctx.db
    .query("users")
    .withIndex("by_externalId", (queryBuilder) =>
      queryBuilder.eq("externalId", externalId),
    )
    .unique();
}

async function getUserById(
  ctx: MutationCtx | QueryCtx,
  userId?: string,
) {
  if (!userId) {
    return null;
  }

  return (await ctx.db.get(userId as never)) as
    | {
        _id: string;
        actorKind: "agent" | "human" | "tool";
        displayName: string;
        handle?: string;
      }
    | null;
}

async function upsertCommerceUser(
  ctx: MutationCtx,
  input: {
    displayName?: string;
    externalId?: string;
  },
) {
  if (!input.externalId) {
    return null;
  }

  const existing = await getUserByExternalId(ctx, input.externalId);

  if (existing) {
    await ctx.db.patch(existing._id, {
      displayName: input.displayName ?? existing.displayName,
      updatedAt: Date.now(),
    });

    return {
      ...existing,
      displayName: input.displayName ?? existing.displayName,
    };
  }

  const now = Date.now();
  const userId = await ctx.db.insert("users", {
    actorKind: "human",
    createdAt: now,
    displayName: input.displayName ?? "Boreal user",
    externalId: input.externalId,
    handle: undefined,
    trustScore: 50,
    updatedAt: now,
  });

  return {
    _id: userId,
    actorKind: "human" as const,
    displayName: input.displayName ?? "Boreal user",
    externalId: input.externalId,
    trustScore: 50,
  };
}

async function getSupplySellerSnapshot(
  ctx: MutationCtx,
  supplierUserId?: string,
) {
  if (!supplierUserId) {
    return null;
  }

  const user = await getUserById(ctx, supplierUserId);

  if (!user) {
    return null;
  }

  const profile = await ctx.db
    .query("profiles")
    .withIndex("by_userId", (queryBuilder) =>
      queryBuilder.eq("userId", supplierUserId),
    )
    .unique();

  return {
    displayName: user.displayName,
    profileId: profile?._id,
  };
}

function buildCheckoutMessage(
  items: Array<{
    accessLabel?: string;
    accessUrl?: string;
    quantity: number;
    status: "awaiting_payment" | "fulfilled" | "submitted";
    title: string;
  }>,
  checkoutStatus: "cancelled" | "failed" | "fulfilled" | "in_progress" | "pending_payment" | "submitted",
) {
  const lines = items
    .map(
      (item) =>
        `- ${item.quantity}x ${item.title} [${item.status.replaceAll("_", " ")}]${item.accessUrl ? ` (${item.accessLabel})` : ""}`,
    )
    .join("\n");

  return [
    checkoutStatus === "fulfilled"
      ? "Checkout completed. Instant access is ready."
      : checkoutStatus === "pending_payment"
        ? "Checkout placed. Some items now require wallet payment before Boreal can invoke them."
        : "Checkout submitted. Some items now require supplier fulfillment or provider handoff.",
    "",
    lines,
  ].join("\n");
}

function determineCheckoutStatus(statuses: string[]) {
  if (statuses.length > 0 && statuses.every((status) => status === "fulfilled")) {
    return "fulfilled" as const;
  }

  if (statuses.some((status) => status === "awaiting_payment")) {
    return "pending_payment" as const;
  }

  return "submitted" as const;
}

function derivePrimaryNetworkHint(networkHints?: string[]) {
  return networkHints?.[0];
}

function deriveEndpointMethod(supply: {
  metadataJson?: string;
}) {
  if (!supply.metadataJson) {
    return "GET";
  }

  try {
    const metadata = JSON.parse(supply.metadataJson) as {
      endpoint?: {
        method?: string;
      } | null;
    };

    return metadata.endpoint?.method ?? "GET";
  } catch {
    return "GET";
  }
}
