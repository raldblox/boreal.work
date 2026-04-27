import { createWebhookSignature, createWebhookDeliveryToken, createWebhookSecret, createWebhookToken } from "../lib/boreal/webhooks/security";
import { internal } from "./_generated/api";
import type { Doc } from "./_generated/dataModel";
import {
  action,
  internalAction,
  internalMutation,
  internalQuery,
  mutation,
  query,
  type MutationCtx,
} from "./_generated/server";
import { v } from "convex/values";

import { webhookStreamValidator } from "./validators";

const ALL_WEBHOOK_STREAMS = ["requests", "inbox", "payouts"] as const;

type WebhookStream = (typeof ALL_WEBHOOK_STREAMS)[number];

export const createWebhookSubscription = mutation({
  args: {
    endpointUrl: v.string(),
    eventStreams: v.optional(v.array(webhookStreamValidator)),
    ownerDisplayName: v.optional(v.string()),
    ownerExternalId: v.string(),
    walletAddress: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const eventStreams = normalizeWebhookStreams(args.eventStreams);
    const endpointUrl = normalizeWebhookEndpointUrl(args.endpointUrl);
    const webhookToken = createWebhookToken(`${args.ownerExternalId}:${endpointUrl}`);
    const secret = createWebhookSecret(webhookToken);

    await ctx.db.insert("webhookSubscriptions", {
      active: true,
      createdAt: now,
      endpointUrl,
      eventStreams,
      ownerDisplayName: args.ownerDisplayName,
      ownerExternalId: args.ownerExternalId,
      secret,
      updatedAt: now,
      walletAddress: args.walletAddress,
      webhookToken,
    });

    return {
      created: true,
      secret,
      subscription: {
        active: true,
        createdAt: now,
        endpointUrl,
        eventStreams,
        ownerDisplayName: args.ownerDisplayName ?? null,
        ownerExternalId: args.ownerExternalId,
        updatedAt: now,
        walletAddress: args.walletAddress ?? null,
        webhookToken,
      },
      webhookToken,
    };
  },
});

export const listWebhookSubscriptions = query({
  args: {
    ownerExternalId: v.string(),
  },
  handler: async (ctx, args) => {
    const subscriptions = await ctx.db
      .query("webhookSubscriptions")
      .withIndex("by_ownerExternalId_and_createdAt", (queryBuilder) =>
        queryBuilder.eq("ownerExternalId", args.ownerExternalId),
      )
      .order("desc")
      .take(32);

    return subscriptions.map((subscription) => ({
      active: subscription.active,
      createdAt: subscription.createdAt,
      endpointUrl: subscription.endpointUrl,
      eventStreams: subscription.eventStreams,
      ownerDisplayName: subscription.ownerDisplayName ?? null,
      ownerExternalId: subscription.ownerExternalId,
      secretPreview: `${subscription.secret.slice(0, 10)}...${subscription.secret.slice(-6)}`,
      updatedAt: subscription.updatedAt,
      walletAddress: subscription.walletAddress ?? null,
      webhookToken: subscription.webhookToken,
    }));
  },
});

export const deleteWebhookSubscription = mutation({
  args: {
    ownerExternalId: v.string(),
    webhookToken: v.string(),
  },
  handler: async (ctx, args) => {
    const subscription = await getWebhookSubscriptionByToken(ctx, args.webhookToken);

    if (!subscription || subscription.ownerExternalId !== args.ownerExternalId) {
      return { deleted: false, reason: "webhook_not_found" as const };
    }

    await ctx.db.patch(subscription._id, {
      active: false,
      updatedAt: Date.now(),
    });

    return { deleted: true };
  },
});

export const listWebhookDeliveries = query({
  args: {
    limit: v.optional(v.number()),
    ownerExternalId: v.string(),
  },
  handler: async (ctx, args) => {
    const safeLimit =
      typeof args.limit === "number" && Number.isFinite(args.limit)
        ? Math.max(1, Math.min(Math.trunc(args.limit), 100))
        : 32;
    const deliveries = await ctx.db
      .query("webhookDeliveries")
      .withIndex("by_ownerExternalId_and_createdAt", (queryBuilder) =>
        queryBuilder.eq("ownerExternalId", args.ownerExternalId),
      )
      .order("desc")
      .take(safeLimit);

    return deliveries.map((delivery) => ({
      attemptCount: delivery.attemptCount,
      createdAt: delivery.createdAt,
      deliveredAt: delivery.deliveredAt ?? null,
      deliveryToken: delivery.deliveryToken,
      endpointUrl: delivery.endpointUrl,
      entryToken: delivery.entryToken ?? null,
      eventType: delivery.eventType,
      lastAttemptAt: delivery.lastAttemptAt ?? null,
      lastError: delivery.lastError ?? null,
      payload: safeParseJson(delivery.payloadJson),
      payoutToken: delivery.payoutToken ?? null,
      requestToken: delivery.requestToken ?? null,
      responseStatus: delivery.responseStatus ?? null,
      status: delivery.status,
      stream: delivery.stream,
      subscriptionToken: delivery.subscriptionToken,
      updatedAt: delivery.updatedAt,
    }));
  },
});

export const flushPendingWebhookDeliveries = action({
  args: {
    limit: v.optional(v.number()),
    ownerExternalId: v.string(),
  },
  handler: async (ctx, args) => {
    return deliverPendingWebhookDeliveries(ctx, args);
  },
});

export const leasePendingWebhookDeliveries = action({
  args: {
    limit: v.optional(v.number()),
    ownerExternalId: v.string(),
    retryFailed: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const pending = (await ctx.runQuery(internal.webhooks.listPendingWebhookDeliveries, {
      limit: args.limit,
      ownerExternalId: args.ownerExternalId,
      retryFailed: args.retryFailed,
    })) as Array<Doc<"webhookDeliveries">>;
    const leased: Array<{
      deliveryToken: string;
      endpointUrl: string;
      eventType: string;
      payloadJson: string;
      secret: string;
      stream: WebhookStream;
      subscriptionToken: string;
    }> = [];

    for (const pendingDelivery of pending) {
      const claimed = (await ctx.runMutation(internal.webhooks.markWebhookDeliveryProcessing, {
        deliveryToken: pendingDelivery.deliveryToken,
      })) as
        | {
            deliveryToken: string;
            endpointUrl: string;
            eventType: string;
            payloadJson: string;
            secret: string;
            stream: WebhookStream;
            subscriptionToken: string;
          }
        | null;

      if (claimed) {
        leased.push(claimed);
      }
    }

    return leased;
  },
});

export const flushPendingWebhookDeliveriesInternal = internalAction({
  args: {
    limit: v.optional(v.number()),
    ownerExternalId: v.string(),
  },
  handler: async (ctx, args) => {
    return deliverPendingWebhookDeliveries(ctx, args);
  },
});

export const listPendingWebhookDeliveries = internalQuery({
  args: {
    limit: v.optional(v.number()),
    ownerExternalId: v.string(),
    retryFailed: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const safeLimit =
      typeof args.limit === "number" && Number.isFinite(args.limit)
        ? Math.max(1, Math.min(Math.trunc(args.limit), 100))
        : 16;

    const queued = await ctx.db
      .query("webhookDeliveries")
      .withIndex("by_status_and_createdAt", (queryBuilder) =>
        queryBuilder.eq("status", "queued"),
      )
      .order("asc")
      .filter((queryBuilder) => queryBuilder.eq(queryBuilder.field("ownerExternalId"), args.ownerExternalId))
      .take(safeLimit);

    if (!args.retryFailed) {
      return queued;
    }

    const failed = await ctx.db
      .query("webhookDeliveries")
      .withIndex("by_status_and_createdAt", (queryBuilder) =>
        queryBuilder.eq("status", "failed"),
      )
      .order("asc")
      .filter((queryBuilder) => queryBuilder.eq(queryBuilder.field("ownerExternalId"), args.ownerExternalId))
      .take(safeLimit);

    return [...queued, ...failed]
      .sort((left, right) => left.createdAt - right.createdAt)
      .slice(0, safeLimit);
  },
});

export const markWebhookDeliveryProcessing = internalMutation({
  args: {
    deliveryToken: v.string(),
  },
  handler: async (ctx, args) => {
    const delivery = await getWebhookDeliveryByToken(ctx, args.deliveryToken);

    if (!delivery || (delivery.status !== "queued" && delivery.status !== "failed")) {
      return null;
    }

    const now = Date.now();
    await ctx.db.patch(delivery._id, {
      attemptCount: delivery.attemptCount + 1,
      lastAttemptAt: now,
      lastError: undefined,
      responseStatus: undefined,
      status: "processing",
      updatedAt: now,
    });

    return {
      deliveryToken: delivery.deliveryToken,
      endpointUrl: delivery.endpointUrl,
      eventType: delivery.eventType,
      payloadJson: delivery.payloadJson,
      secret: delivery.secret,
      stream: delivery.stream,
      subscriptionToken: delivery.subscriptionToken,
    };
  },
});

export const markWebhookDeliveryDelivered = internalMutation({
  args: {
    deliveryToken: v.string(),
    responseStatus: v.number(),
  },
  handler: async (ctx, args) => {
    const delivery = await getWebhookDeliveryByToken(ctx, args.deliveryToken);

    if (!delivery) {
      return { updated: false };
    }

    const now = Date.now();
    await ctx.db.patch(delivery._id, {
      deliveredAt: now,
      responseStatus: args.responseStatus,
      status: "delivered",
      updatedAt: now,
    });

    return { updated: true };
  },
});

export const markWebhookDeliveryFailed = internalMutation({
  args: {
    deliveryToken: v.string(),
    errorMessage: v.string(),
    responseStatus: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const delivery = await getWebhookDeliveryByToken(ctx, args.deliveryToken);

    if (!delivery) {
      return { updated: false };
    }

    await ctx.db.patch(delivery._id, {
      lastError: args.errorMessage,
      responseStatus: args.responseStatus,
      status: "failed",
      updatedAt: Date.now(),
    });

    return { updated: true };
  },
});

export const markWebhookDeliveryDeliveredPublic = mutation({
  args: {
    deliveryToken: v.string(),
    responseStatus: v.number(),
  },
  handler: async (ctx, args) => {
    const delivery = await getWebhookDeliveryByToken(ctx, args.deliveryToken);

    if (!delivery) {
      return { updated: false };
    }

    const now = Date.now();
    await ctx.db.patch(delivery._id, {
      deliveredAt: now,
      responseStatus: args.responseStatus,
      status: "delivered",
      updatedAt: now,
    });

    return { updated: true };
  },
});

export const markWebhookDeliveryFailedPublic = mutation({
  args: {
    deliveryToken: v.string(),
    errorMessage: v.string(),
    responseStatus: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const delivery = await getWebhookDeliveryByToken(ctx, args.deliveryToken);

    if (!delivery) {
      return { updated: false };
    }

    await ctx.db.patch(delivery._id, {
      lastError: args.errorMessage,
      responseStatus: args.responseStatus,
      status: "failed",
      updatedAt: Date.now(),
    });

    return { updated: true };
  },
});

export async function queueWebhookDeliveries(
  ctx: MutationCtx,
  input: {
    data?: Record<string, unknown> | null;
    entryToken?: string;
    eventType: string;
    message: string;
    ownerExternalId?: string | null;
    payoutToken?: string;
    requestToken?: string;
    status: string;
    stream: WebhookStream;
  },
) {
  if (!input.ownerExternalId) {
    return { enqueued: 0 };
  }

  const subscriptions = await ctx.db
    .query("webhookSubscriptions")
    .withIndex("by_ownerExternalId_and_createdAt", (queryBuilder) =>
      queryBuilder.eq("ownerExternalId", input.ownerExternalId!),
    )
    .collect();
  const activeSubscriptions = subscriptions.filter(
    (subscription) =>
      subscription.active && subscription.eventStreams.includes(input.stream),
  );

  if (activeSubscriptions.length === 0) {
    return { enqueued: 0 };
  }

  const now = Date.now();

  for (const subscription of activeSubscriptions) {
    const deliveryToken = createWebhookDeliveryToken(
      `${subscription.webhookToken}:${input.stream}:${input.eventType}:${now}`,
    );
    const payload = {
      createdAt: now,
      data: input.data ?? null,
      deliveryToken,
      entryToken: input.entryToken ?? null,
      message: input.message,
      payoutToken: input.payoutToken ?? null,
      requestToken: input.requestToken ?? null,
      status: input.status,
      stream: input.stream,
      type: input.eventType,
      version: "boreal-webhook/v1",
      webhookToken: subscription.webhookToken,
    };

    await ctx.db.insert("webhookDeliveries", {
      attemptCount: 0,
      createdAt: now,
      deliveryToken,
      endpointUrl: subscription.endpointUrl,
      entryToken: input.entryToken,
      eventType: input.eventType,
      ownerExternalId: subscription.ownerExternalId,
      payloadJson: JSON.stringify(payload),
      payoutToken: input.payoutToken,
      requestToken: input.requestToken,
      secret: subscription.secret,
      status: "queued",
      stream: input.stream,
      subscriptionToken: subscription.webhookToken,
      updatedAt: now,
    });
  }

  await ctx.scheduler.runAfter(0, internal.webhooks.flushPendingWebhookDeliveriesInternal, {
    ownerExternalId: input.ownerExternalId,
  });

  return { enqueued: activeSubscriptions.length };
}

async function deliverPendingWebhookDeliveries(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ctx: any,
  input: {
    limit?: number;
    ownerExternalId: string;
  },
) {
  const pending = (await ctx.runQuery(internal.webhooks.listPendingWebhookDeliveries, {
    limit: input.limit,
    ownerExternalId: input.ownerExternalId,
  })) as Array<Doc<"webhookDeliveries">>;

  let attempted = 0;
  let delivered = 0;
  let failed = 0;

  for (const pendingDelivery of pending) {
    const claimed = (await ctx.runMutation(internal.webhooks.markWebhookDeliveryProcessing, {
      deliveryToken: pendingDelivery.deliveryToken,
    })) as
      | {
          deliveryToken: string;
          endpointUrl: string;
          eventType: string;
          payloadJson: string;
          secret: string;
          stream: WebhookStream;
          subscriptionToken: string;
        }
      | null;

    if (!claimed) {
      continue;
    }

    attempted += 1;
    const timestamp = Date.now().toString();
    const signature = await createWebhookSignature({
      payload: claimed.payloadJson,
      secret: claimed.secret,
      timestamp,
    });

    try {
      const response = await fetch(claimed.endpointUrl, {
        body: claimed.payloadJson,
        headers: {
          "content-type": "application/json",
          "user-agent": "Boreal-Webhook/1.0",
          "x-boreal-delivery": claimed.deliveryToken,
          "x-boreal-event": claimed.eventType,
          "x-boreal-signature": `t=${timestamp},v1=${signature}`,
          "x-boreal-stream": claimed.stream,
          "x-boreal-timestamp": timestamp,
          "x-boreal-webhook": claimed.subscriptionToken,
        },
        method: "POST",
      });

      if (response.ok) {
        await ctx.runMutation(internal.webhooks.markWebhookDeliveryDelivered, {
          deliveryToken: claimed.deliveryToken,
          responseStatus: response.status,
        });
        delivered += 1;
      } else {
        await ctx.runMutation(internal.webhooks.markWebhookDeliveryFailed, {
          deliveryToken: claimed.deliveryToken,
          errorMessage: `Webhook delivery returned HTTP ${response.status}.`,
          responseStatus: response.status,
        });
        failed += 1;
      }
    } catch (error) {
      await ctx.runMutation(internal.webhooks.markWebhookDeliveryFailed, {
        deliveryToken: claimed.deliveryToken,
        errorMessage:
          error instanceof Error ? error.message : "Webhook delivery failed.",
      });
      failed += 1;
    }
  }

  return {
    attempted,
    delivered,
    failed,
  };
}

async function getWebhookSubscriptionByToken(
  ctx: MutationCtx,
  webhookToken: string,
) {
  return ctx.db
    .query("webhookSubscriptions")
    .withIndex("by_webhookToken", (queryBuilder) =>
      queryBuilder.eq("webhookToken", webhookToken),
    )
    .unique();
}

async function getWebhookDeliveryByToken(
  ctx: MutationCtx,
  deliveryToken: string,
) {
  return ctx.db
    .query("webhookDeliveries")
    .withIndex("by_deliveryToken", (queryBuilder) =>
      queryBuilder.eq("deliveryToken", deliveryToken),
    )
    .unique();
}

function normalizeWebhookStreams(
  input?: WebhookStream[],
): WebhookStream[] {
  const streams = input && input.length > 0 ? input : [...ALL_WEBHOOK_STREAMS];
  return [...new Set(streams)];
}

function normalizeWebhookEndpointUrl(endpointUrl: string) {
  let parsed: URL;

  try {
    parsed = new URL(endpointUrl);
  } catch {
    throw new Error("endpointUrl must be a valid absolute URL.");
  }

  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    throw new Error("Webhook endpoints must use http or https.");
  }

  if (parsed.protocol === "http:") {
    const hostname = parsed.hostname.toLowerCase();
    const isLocal =
      hostname === "127.0.0.1" || hostname === "localhost" || hostname === "::1";

    if (!isLocal) {
      throw new Error("Non-local webhook endpoints must use https.");
    }
  }

  return parsed.toString();
}

function safeParseJson(value: string) {
  try {
    return JSON.parse(value) as Record<string, unknown>;
  } catch {
    return null;
  }
}
