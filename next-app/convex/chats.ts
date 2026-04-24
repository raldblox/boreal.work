import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

import { intentStatusValidator, persistedIntentValidator } from "./validators";

export const recordIntentPipeline = mutation({
  args: {
    assistantMessage: v.string(),
    conversationId: v.optional(v.string()),
    initialStatus: v.optional(intentStatusValidator),
    intent: persistedIntentValidator,
    ownerDisplayName: v.optional(v.string()),
    ownerExternalId: v.optional(v.string()),
    ownerHandle: v.optional(v.string()),
    userMessage: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const conversationId = args.conversationId ?? crypto.randomUUID();
    const existingConversation = await ctx.db
      .query("conversations")
      .withIndex("by_conversationId", (queryBuilder) =>
        queryBuilder.eq("conversationId", conversationId),
      )
      .unique();

    if (existingConversation) {
      await ctx.db.patch(existingConversation._id, {
        intentCount: existingConversation.intentCount + 1,
        latestMessageAt: now,
        title: args.intent.title,
        updatedAt: now,
      });
    } else {
      await ctx.db.insert("conversations", {
        conversationId,
        createdAt: now,
        intentCount: 1,
        latestMessageAt: now,
        provider: args.intent.provider,
        source: "chat",
        status: "active",
        title: args.intent.title,
        updatedAt: now,
      });
    }

    const intentKey = crypto.randomUUID();
    const ownerUserId: string | undefined = await upsertOwnerUser(ctx, {
      displayName: args.ownerDisplayName,
      externalId: args.ownerExternalId,
      handle: args.ownerHandle,
    });
    const status =
      args.initialStatus ??
      (args.intent.persistence.isUnresolved ? "open" : "fulfilled");

    await ctx.db.insert("chatMessages", {
      body: args.userMessage,
      conversationId,
      createdAt: now,
      intentKey,
      messageId: args.intent.userMessageId,
      provider: args.intent.provider,
      role: "user",
    });

    await ctx.db.insert("chatMessages", {
      body: args.assistantMessage,
      conversationId,
      createdAt: now,
      intentKey,
      messageId: args.intent.assistantMessageId,
      provider: args.intent.provider,
      role: "assistant",
    });

    const intentId: string = await ctx.db.insert("intents", {
      acceptsProposals: true,
      actorKind: "human",
      approvalRequestedAt: status === "proposed" ? now : undefined,
      assetPrompt: args.intent.assetPrompt,
      body: args.intent.body,
      budgetType: "open",
      capabilityTags: args.intent.capabilityTags,
      catalogQuery: args.intent.catalogQuery,
      category: args.intent.category,
      confidence: args.intent.confidence,
      conversationId,
      createdAt: now,
      embedding: args.intent.embedding,
      embeddingModel: args.intent.embeddingModel,
      extractionNotes: args.intent.extractionNotes,
      generationSignals: args.intent.generationSignals,
      intentKey,
      intentModel: args.intent.intentModel,
      intentType: args.intent.intentType,
      keywords: args.intent.keywords,
      matchAttempts: 0,
      missingDetails: args.intent.missingDetails,
      needsClarification: args.intent.needsClarification,
      ownerUserId,
      persistence: args.intent.persistence,
      provider: args.intent.provider,
      requestedOutputTypes: args.intent.requestedOutputTypes,
      resolutionTier: args.intent.routing.resolutionTier,
      responseInstructions: args.intent.responseInstructions,
      routeTarget: args.intent.routeTarget,
      routing: args.intent.routing,
      shouldSearchCatalog: args.intent.shouldSearchCatalog,
      speechText: args.intent.speechText,
      status,
      suggestedReplies: args.intent.suggestedReplies,
      summary: args.intent.summary,
      title: args.intent.title,
      updatedAt: now,
      urgencyScore: args.intent.persistence.isUnresolved ? 0.72 : 0.15,
      visibility: status === "proposed" || status === "open" ? "public" : "private",
      voice: args.intent.voice,
    });

    await ctx.db.insert("intentRuns", {
      conversationId,
      createdAt: now,
      embeddingModel: args.intent.embeddingModel,
      inputBody: args.userMessage,
      intentKey,
      intentModel: args.intent.intentModel,
      modalityScores: args.intent.modalityScores,
      provider: args.intent.provider,
    });

    await ctx.db.insert("activityEvents", {
      createdAt: now,
      entityId: intentKey,
      entityType: "intent",
      payload: JSON.stringify({
        category: args.intent.category,
        requestedOutputTypes: args.intent.requestedOutputTypes,
        routeTarget: args.intent.routeTarget,
      }),
      type: "request.detected",
    });

    if (status === "proposed") {
      await ctx.db.insert("activityEvents", {
        createdAt: now,
        entityId: intentKey,
        entityType: "intent",
        payload: JSON.stringify({
          provider: args.intent.provider,
          routeTarget: args.intent.routeTarget,
        }),
        type: "request.awaiting_approval",
      });
    }

    return {
      assistantMessageId: args.intent.assistantMessageId,
      conversationId,
      intentId: intentId as string,
      intentKey,
      userMessageId: args.intent.userMessageId,
    };
  },
});

export const approveRequest = mutation({
  args: {
    assignedAgent: v.string(),
    assignedToolNames: v.array(v.string()),
    intentId: v.id("intents"),
    ownerExternalId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const intent = await ctx.db.get(args.intentId);

    if (!intent || !(await hasRequestAccess(ctx, intent.ownerUserId, args.ownerExternalId))) {
      return { approved: false };
    }

    const now = Date.now();

    await ctx.db.patch(args.intentId, {
      approvedAt: now,
      assignedAgent: args.assignedAgent,
      assignedToolNames: args.assignedToolNames,
      startedAt: intent.startedAt ?? now,
      status: "claimed",
      updatedAt: now,
    });

    await ctx.db.insert("chatMessages", {
      body: "Request approved. Boreal assigned the work and started execution.",
      conversationId: intent.conversationId ?? crypto.randomUUID(),
      createdAt: now,
      intentKey: intent.intentKey,
      messageId: crypto.randomUUID(),
      provider: intent.provider,
      role: "system",
    });

    await ctx.db.insert("activityEvents", {
      createdAt: now,
      entityId: intent.intentKey,
      entityType: "intent",
      payload: JSON.stringify({
        assignedAgent: args.assignedAgent,
        assignedToolNames: args.assignedToolNames,
      }),
      type: "request.approved",
    });

    return { approved: true };
  },
});

export const cancelRequest = mutation({
  args: {
    intentId: v.id("intents"),
    ownerExternalId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const intent = await ctx.db.get(args.intentId);

    if (!intent || !(await hasRequestAccess(ctx, intent.ownerUserId, args.ownerExternalId))) {
      return { cancelled: false };
    }

    const now = Date.now();

    await ctx.db.patch(args.intentId, {
      cancelledAt: now,
      closedReason: "cancelled_by_user",
      status: "closed",
      updatedAt: now,
    });

    await ctx.db.insert("activityEvents", {
      createdAt: now,
      entityId: intent.intentKey,
      entityType: "intent",
      payload: JSON.stringify({
        reason: "cancelled_by_user",
      }),
      type: "request.cancelled",
    });

    return { cancelled: true };
  },
});

export const appendRequestExecution = mutation({
  args: {
    activityPayload: v.optional(v.string()),
    activityType: v.string(),
    assignedAgent: v.optional(v.string()),
    assignedToolNames: v.optional(v.array(v.string())),
    assistantMessage: v.string(),
    intentId: v.id("intents"),
    ownerExternalId: v.optional(v.string()),
    status: intentStatusValidator,
  },
  handler: async (ctx, args) => {
    const intent = await ctx.db.get(args.intentId);

    if (!intent || !(await hasRequestAccess(ctx, intent.ownerUserId, args.ownerExternalId))) {
      return { appended: false };
    }

    const now = Date.now();

    await ctx.db.insert("chatMessages", {
      body: args.assistantMessage,
      conversationId: intent.conversationId ?? crypto.randomUUID(),
      createdAt: now,
      intentKey: intent.intentKey,
      messageId: crypto.randomUUID(),
      provider: intent.provider,
      role: "assistant",
    });

    await ctx.db.patch(args.intentId, {
      assignedAgent: args.assignedAgent ?? intent.assignedAgent,
      assignedToolNames: args.assignedToolNames ?? intent.assignedToolNames,
      completedAt:
        args.status === "fulfilled" || args.status === "closed"
          ? now
          : intent.completedAt,
      startedAt: intent.startedAt ?? now,
      status: args.status,
      updatedAt: now,
    });

    await ctx.db.insert("activityEvents", {
      createdAt: now,
      entityId: intent.intentKey,
      entityType: "intent",
      payload: args.activityPayload,
      type: args.activityType,
    });

    return { appended: true };
  },
});

export const rateRequest = mutation({
  args: {
    comment: v.optional(v.string()),
    intentId: v.id("intents"),
    ownerExternalId: v.optional(v.string()),
    rating: v.number(),
  },
  handler: async (ctx, args) => {
    const intent = await ctx.db.get(args.intentId);

    if (!intent || !(await hasRequestAccess(ctx, intent.ownerUserId, args.ownerExternalId))) {
      return { rated: false };
    }

    const now = Date.now();

    await ctx.db.patch(args.intentId, {
      reviewComment: args.comment,
      reviewRating: args.rating,
      reviewedAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("activityEvents", {
      createdAt: now,
      entityId: intent.intentKey,
      entityType: "intent",
      payload: JSON.stringify({
        comment: args.comment ?? null,
        rating: args.rating,
      }),
      type: "request.reviewed",
    });

    return { rated: true };
  },
});

export const listConversationMessages = query({
  args: {
    conversationId: v.string(),
    limit: v.number(),
  },
  handler: async (ctx, args) => {
    return ctx.db
      .query("chatMessages")
      .withIndex("by_conversationId_and_createdAt", (queryBuilder) =>
        queryBuilder.eq("conversationId", args.conversationId),
      )
      .order("desc")
      .take(args.limit);
  },
});

async function upsertOwnerUser(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ctx: any,
  input: {
    displayName?: string;
    externalId?: string;
    handle?: string;
  },
): Promise<string | undefined> {
  if (!input.externalId) {
    return undefined;
  }

  const existingUser = await ctx.db
    .query("users")
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .withIndex("by_externalId", (queryBuilder: any) =>
      queryBuilder.eq("externalId", input.externalId),
    )
    .unique();

  if (existingUser) {
    await ctx.db.patch(existingUser._id, {
      displayName: input.displayName ?? existingUser.displayName,
      handle: input.handle ?? existingUser.handle,
      updatedAt: Date.now(),
    });

    return existingUser._id;
  }

  return ctx.db.insert("users", {
    actorKind: "human",
    createdAt: Date.now(),
    displayName: input.displayName ?? "X user",
    externalId: input.externalId,
    handle: input.handle,
    trustScore: 0.5,
    updatedAt: Date.now(),
  });
}

async function hasRequestAccess(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ctx: any,
  ownerUserId: string | undefined,
  ownerExternalId: string | undefined,
): Promise<boolean> {
  if (!ownerUserId || !ownerExternalId) {
    return true;
  }

  const owner = await ctx.db
    .query("users")
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .withIndex("by_externalId", (queryBuilder: any) =>
      queryBuilder.eq("externalId", ownerExternalId),
    )
    .unique();

  return owner?._id === ownerUserId;
}
