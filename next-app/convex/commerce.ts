import { mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { v } from "convex/values";

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

    const now = Date.now();
    const currency = cartItems[0]?.currency ?? "USD";
    const subtotalAmount = cartItems.reduce(
      (sum, item) => sum + (item.unitPriceAmount ?? 0) * item.quantity,
      0,
    );
    const checkoutId = await ctx.db.insert("checkouts", {
      cartId: cart._id,
      createdAt: now,
      currency,
      itemCount: cartItems.reduce((sum, item) => sum + item.quantity, 0),
      ownerUserId: owner._id,
      sourceIntentId: args.sourceIntentId ?? cart.sourceIntentId,
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

    for (const line of cartItems) {
      const supply = await ctx.db.get(line.supplyId);
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
        serviceInvocationId: undefined,
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
          errorMessage: undefined,
          network: derivePrimaryNetworkHint(supply.paymentNetworkHints),
          paymentProtocol: supply.paymentProtocol ?? "x402",
          providerKey: supply.sourceProviderKey!,
          receiptJson: undefined,
          status: supply.requiresHumanApproval ? "pending_approval" : "ready_to_pay",
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
          txHash: undefined,
          updatedAt: now,
        });
        await ctx.db.patch(checkoutItemId, {
          serviceInvocationId,
        });
      }

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
      status: checkoutStatus,
      updatedAt: now,
    });
    await ctx.db.patch(cart._id, {
      status: "checked_out",
      updatedAt: now,
    });

    const sourceIntentId = args.sourceIntentId ?? cart.sourceIntentId;

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
