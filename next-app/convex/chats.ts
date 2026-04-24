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
      senderActorKind: "human",
      senderDisplayName: args.ownerDisplayName ?? "X user",
      senderExternalId: args.ownerExternalId,
      senderHandle: args.ownerHandle,
    });

    await ctx.db.insert("chatMessages", {
      body: args.assistantMessage,
      conversationId,
      createdAt: now,
      intentKey,
      messageId: args.intent.assistantMessageId,
      provider: args.intent.provider,
      role: "assistant",
      senderActorKind: "agent",
      senderDisplayName: "Boreal Agent",
      senderExternalId: "agent:boreal",
      senderHandle: "boreal",
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
      senderActorKind: "agent",
      senderDisplayName: "Boreal Agent",
      senderExternalId: "agent:boreal",
      senderHandle: "boreal",
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

export const postConversationMessage = mutation({
  args: {
    body: v.string(),
    conversationId: v.optional(v.string()),
    ownerDisplayName: v.optional(v.string()),
    ownerExternalId: v.optional(v.string()),
    ownerHandle: v.optional(v.string()),
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
        latestMessageAt: now,
        updatedAt: now,
      });
    } else {
      await ctx.db.insert("conversations", {
        conversationId,
        createdAt: now,
        intentCount: 0,
        latestMessageAt: now,
        provider: "boreal-agent",
        source: "chat",
        status: "active",
        title: "Chat thread",
        updatedAt: now,
      });
    }

    const messageId = crypto.randomUUID();
    await ctx.db.insert("chatMessages", {
      body: args.body.trim(),
      conversationId,
      createdAt: now,
      intentKey: undefined,
      messageId,
      provider: "boreal-agent",
      role: "user",
      senderActorKind: "human",
      senderDisplayName: args.ownerDisplayName ?? "X user",
      senderExternalId: args.ownerExternalId,
      senderHandle: args.ownerHandle,
    });

    return {
      conversationId,
      messageId,
      posted: true,
    };
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

export const archiveRequest = mutation({
  args: {
    intentId: v.id("intents"),
    ownerExternalId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const intent = await ctx.db.get(args.intentId);

    if (!intent || !(await hasRequestAccess(ctx, intent.ownerUserId, args.ownerExternalId))) {
      return { archived: false };
    }

    const now = Date.now();

    await ctx.db.patch(args.intentId, {
      closedReason: "archived_by_user",
      status: "closed",
      updatedAt: now,
    });

    await ctx.db.insert("activityEvents", {
      createdAt: now,
      entityId: intent.intentKey,
      entityType: "intent",
      payload: JSON.stringify({
        reason: "archived_by_user",
      }),
      type: "request.archived",
    });

    await ctx.db.insert("chatMessages", {
      body: "The owner archived this request.",
      conversationId: intent.conversationId ?? crypto.randomUUID(),
      createdAt: now,
      intentKey: intent.intentKey,
      messageId: crypto.randomUUID(),
      provider: intent.provider,
      role: "system",
      senderActorKind: "human",
      senderDisplayName: "Owner",
      senderExternalId: args.ownerExternalId,
    });

    return { archived: true };
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
      senderActorKind: "agent",
      senderDisplayName: args.assignedAgent ?? intent.assignedAgent ?? "Boreal Agent",
      senderExternalId:
        (args.assignedAgent ?? intent.assignedAgent)?.toLowerCase().includes("boreal")
          ? "agent:boreal"
          : undefined,
      senderHandle:
        (args.assignedAgent ?? intent.assignedAgent)?.toLowerCase().includes("boreal")
          ? "boreal"
          : undefined,
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

export const postThreadMessage = mutation({
  args: {
    body: v.string(),
    intentId: v.id("intents"),
    ownerDisplayName: v.optional(v.string()),
    ownerExternalId: v.optional(v.string()),
    ownerHandle: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const intent = await ctx.db.get(args.intentId);

    if (!intent || !args.ownerExternalId) {
      return { sent: false };
    }

    const sender = await upsertOwnerUser(ctx, {
      displayName: args.ownerDisplayName,
      externalId: args.ownerExternalId,
      handle: args.ownerHandle,
    });

    if (!sender) {
      return { sent: false };
    }

    const acceptedProposal = await ctx.db
      .query("proposals")
      .withIndex("by_intentKey_and_status", (queryBuilder) =>
        queryBuilder.eq("intentKey", intent.intentKey).eq("status", "accepted"),
      )
      .unique();

    const canPost =
      sender === intent.ownerUserId || acceptedProposal?.proposerUserId === sender;

    if (!canPost) {
      return { sent: false };
    }

    const now = Date.now();
    const senderUser = (await ctx.db.get(sender as never)) as
      | { actorKind?: "agent" | "human" | "tool"; displayName?: string; handle?: string }
      | null;

    await ctx.db.insert("chatMessages", {
      body: args.body.trim(),
      conversationId: intent.conversationId ?? crypto.randomUUID(),
      createdAt: now,
      intentKey: intent.intentKey,
      messageId: crypto.randomUUID(),
      provider: intent.provider,
      role: "user",
      senderActorKind: senderUser?.actorKind ?? "human",
      senderDisplayName: senderUser?.displayName ?? args.ownerDisplayName ?? "Participant",
      senderExternalId: args.ownerExternalId,
      senderHandle: senderUser?.handle ?? args.ownerHandle,
    });

    await ctx.db.insert("activityEvents", {
      createdAt: now,
      entityId: intent.intentKey,
      entityType: "intent",
      payload: JSON.stringify({
        senderExternalId: args.ownerExternalId,
      }),
      type: "thread.message_posted",
    });

    return { sent: true };
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
