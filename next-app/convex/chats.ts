import { mutation, query } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { v } from "convex/values";

import { intentStatusValidator, persistedIntentValidator } from "./validators";
import { persistIntentMatchCandidates } from "./matching";
import {
  refreshBorealProfileAnalytics,
  refreshProfileAnalyticsForUser,
} from "./profileAnalytics";

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
    const ownerExternalId = args.ownerExternalId?.trim();

    if (!ownerExternalId) {
      throw new Error("Sign in with X before using Boreal chat.");
    }

    const ownerUserId: string | undefined = await upsertOwnerUser(ctx, {
      displayName: args.ownerDisplayName,
      externalId: ownerExternalId,
      handle: args.ownerHandle,
    });
    if (!ownerUserId) {
      throw new Error("Sign in with X before using Boreal chat.");
    }
    const existingConversation = await ctx.db
      .query("conversations")
      .withIndex("by_conversationId", (queryBuilder) =>
        queryBuilder.eq("conversationId", conversationId),
      )
      .unique();

    if (
      existingConversation?.ownerExternalId &&
      existingConversation.ownerExternalId !== ownerExternalId
    ) {
      throw new Error("You do not have access to this conversation.");
    }
    const conversationTitle =
      args.intent.title.trim().length > 0
        ? args.intent.title
        : buildConversationTitle(args.userMessage);

    if (existingConversation) {
      await ctx.db.patch(existingConversation._id, {
        intentCount: existingConversation.intentCount + 1,
        lastMessageBody: args.assistantMessage,
        lastMessageRole: "assistant",
        latestMessageAt: now,
        messageCount: (existingConversation.messageCount ?? 0) + 2,
        ownerExternalId:
          ownerExternalId ?? existingConversation.ownerExternalId,
        ownerHandle: args.ownerHandle ?? existingConversation.ownerHandle,
        ownerUserId: ownerUserId ?? existingConversation.ownerUserId,
        title: conversationTitle,
        updatedAt: now,
      });
    } else {
      await ctx.db.insert("conversations", {
        conversationId,
        createdAt: now,
        intentCount: 1,
        lastMessageBody: args.assistantMessage,
        lastMessageRole: "assistant",
        latestMessageAt: now,
        messageCount: 2,
        ownerExternalId,
        ownerHandle: args.ownerHandle,
        ownerUserId,
        provider: args.intent.provider,
        source: "chat",
        status: "active",
        title: conversationTitle,
        updatedAt: now,
      });
    }

    const intentKey = crypto.randomUUID();
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
      senderExternalId: ownerExternalId,
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

    const isProfileUpdate = args.intent.routeTarget === "profile_update";
    const intentId = (await ctx.db.insert("intents", {
      acceptsProposals: !isProfileUpdate,
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
      visibility:
        isProfileUpdate
          ? "private"
          : status === "proposed" || status === "open"
            ? "public"
            : "private",
      voice: args.intent.voice,
    })) as Id<"intents">;

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

    const matching = await persistIntentMatchCandidates(ctx, {
      body: args.intent.body,
      budgetMax: undefined,
      budgetMin: undefined,
      capabilityTags: args.intent.capabilityTags,
      catalogQuery: args.intent.catalogQuery,
      category: args.intent.category,
      deadlineAt: undefined,
      embedding: args.intent.embedding,
      intentId,
      intentKey,
      keywords: args.intent.keywords,
      limit: 24,
      requestedOutputTypes: args.intent.requestedOutputTypes,
      summary: args.intent.summary,
      title: args.intent.title,
    });

    await ctx.db.insert("activityEvents", {
      createdAt: now,
      entityId: intentKey,
      entityType: "intent",
      payload: JSON.stringify({
        candidateCount: matching.persistedCount,
        topMatchScore: matching.topMatchScore,
      }),
      type:
        matching.persistedCount > 0
          ? "matching.completed"
          : "matching.empty",
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

    await refreshProfileAnalyticsForUser(ctx, ownerUserId);
    await refreshBorealProfileAnalytics(ctx);

    return {
      assistantMessageId: args.intent.assistantMessageId,
      conversationId,
      intentId,
      intentKey,
      userMessageId: args.intent.userMessageId,
    };
  },
});

export const approveRequest = mutation({
  args: {
    assignedAgent: v.optional(v.string()),
    assignedToolNames: v.optional(v.array(v.string())),
    assistantMessage: v.optional(v.string()),
    intentId: v.id("intents"),
    ownerExternalId: v.optional(v.string()),
    status: v.optional(intentStatusValidator),
  },
  handler: async (ctx, args) => {
    const intent = await ctx.db.get(args.intentId);

    if (!intent || !(await hasRequestAccess(ctx, intent.ownerUserId, args.ownerExternalId))) {
      return { approved: false };
    }

    const now = Date.now();
    const nextStatus = args.status ?? "claimed";

    await persistIntentMatchCandidates(ctx, {
      body: intent.body,
      budgetMax: intent.budgetMax,
      budgetMin: intent.budgetMin,
      capabilityTags: intent.capabilityTags,
      catalogQuery: intent.catalogQuery,
      category: intent.category,
      deadlineAt: intent.deadlineAt,
      embedding: intent.embedding,
      intentId: intent._id,
      intentKey: intent.intentKey,
      keywords: intent.keywords,
      limit: 24,
      requestedOutputTypes: intent.requestedOutputTypes ?? ["text"],
      summary: intent.summary,
      title: intent.title,
    });

    await ctx.db.patch(args.intentId, {
      approvedAt: now,
      assignedAgent: args.assignedAgent,
      assignedToolNames: args.assignedToolNames,
      startedAt:
        nextStatus === "claimed" || nextStatus === "in_progress"
          ? intent.startedAt ?? now
          : intent.startedAt,
      status: nextStatus,
      updatedAt: now,
    });

    await ctx.db.insert("chatMessages", {
      body:
        args.assistantMessage ??
        (args.assignedAgent
          ? "Request approved. Boreal assigned the work and started execution."
          : "Request approved. It is now open for proposals and matched workers."),
      conversationId: intent.conversationId ?? crypto.randomUUID(),
      createdAt: now,
      intentKey: intent.intentKey,
      messageId: crypto.randomUUID(),
      provider: intent.provider,
      role: "system",
      senderActorKind: args.assignedAgent ? "agent" : "human",
      senderDisplayName: args.assignedAgent ? "Boreal Agent" : "Owner",
      senderExternalId: args.assignedAgent ? "agent:boreal" : args.ownerExternalId,
      senderHandle: args.assignedAgent ? "boreal" : undefined,
    });

    await ctx.db.insert("activityEvents", {
      createdAt: now,
      entityId: intent.intentKey,
      entityType: "intent",
      payload: JSON.stringify({
        assignedAgent: args.assignedAgent,
        assignedToolNames: args.assignedToolNames,
        status: nextStatus,
      }),
      type: nextStatus === "open" ? "request.opened_for_workers" : "request.approved",
    });

    await refreshProfileAnalyticsForUser(ctx, intent.ownerUserId);
    if (args.assignedAgent?.toLowerCase().includes("boreal")) {
      await refreshBorealProfileAnalytics(ctx);
    }

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
    const ownerExternalId = args.ownerExternalId?.trim();

    if (!ownerExternalId) {
      throw new Error("Sign in with X before using Boreal chat.");
    }

    const ownerUserId: string | undefined = await upsertOwnerUser(ctx, {
      displayName: args.ownerDisplayName,
      externalId: ownerExternalId,
      handle: args.ownerHandle,
    });
    if (!ownerUserId) {
      throw new Error("Sign in with X before using Boreal chat.");
    }
    const existingConversation = await ctx.db
      .query("conversations")
      .withIndex("by_conversationId", (queryBuilder) =>
        queryBuilder.eq("conversationId", conversationId),
      )
      .unique();

    if (
      existingConversation?.ownerExternalId &&
      existingConversation.ownerExternalId !== ownerExternalId
    ) {
      throw new Error("You do not have access to this conversation.");
    }
    const trimmedBody = args.body.trim();

    if (existingConversation) {
      await ctx.db.patch(existingConversation._id, {
        lastMessageBody: trimmedBody,
        lastMessageRole: "user",
        latestMessageAt: now,
        messageCount: (existingConversation.messageCount ?? 0) + 1,
        ownerExternalId:
          ownerExternalId ?? existingConversation.ownerExternalId,
        ownerHandle: args.ownerHandle ?? existingConversation.ownerHandle,
        ownerUserId: ownerUserId ?? existingConversation.ownerUserId,
        title:
          existingConversation.title === "Chat thread"
            ? buildConversationTitle(trimmedBody)
            : existingConversation.title,
        updatedAt: now,
      });
    } else {
      await ctx.db.insert("conversations", {
        conversationId,
        createdAt: now,
        intentCount: 0,
        lastMessageBody: trimmedBody,
        lastMessageRole: "user",
        latestMessageAt: now,
        messageCount: 1,
        ownerExternalId,
        ownerHandle: args.ownerHandle,
        ownerUserId,
        provider: "boreal-agent",
        source: "chat",
        status: "active",
        title: buildConversationTitle(trimmedBody),
        updatedAt: now,
      });
    }

    const messageId = crypto.randomUUID();
    await ctx.db.insert("chatMessages", {
      body: trimmedBody,
      conversationId,
      createdAt: now,
      intentKey: undefined,
      messageId,
      provider: "boreal-agent",
      role: "user",
      senderActorKind: "human",
      senderDisplayName: args.ownerDisplayName ?? "X user",
      senderExternalId: ownerExternalId,
      senderHandle: args.ownerHandle,
    });

    return {
      conversationId,
      messageId,
      posted: true,
    };
  },
});

export const recordConversationExchange = mutation({
  args: {
    assistantMessage: v.string(),
    conversationId: v.optional(v.string()),
    ownerDisplayName: v.optional(v.string()),
    ownerExternalId: v.optional(v.string()),
    ownerHandle: v.optional(v.string()),
    userMessage: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const conversationId = args.conversationId ?? crypto.randomUUID();
    const ownerExternalId = args.ownerExternalId?.trim();

    if (!ownerExternalId) {
      throw new Error("Sign in with X before using Boreal chat.");
    }

    const ownerUserId: string | undefined = await upsertOwnerUser(ctx, {
      displayName: args.ownerDisplayName,
      externalId: ownerExternalId,
      handle: args.ownerHandle,
    });
    if (!ownerUserId) {
      throw new Error("Sign in with X before using Boreal chat.");
    }
    const existingConversation = await ctx.db
      .query("conversations")
      .withIndex("by_conversationId", (queryBuilder) =>
        queryBuilder.eq("conversationId", conversationId),
      )
      .unique();

    if (
      existingConversation?.ownerExternalId &&
      existingConversation.ownerExternalId !== ownerExternalId
    ) {
      throw new Error("You do not have access to this conversation.");
    }
    const trimmedUserMessage = args.userMessage.trim();
    const trimmedAssistantMessage = args.assistantMessage.trim();

    if (existingConversation) {
      await ctx.db.patch(existingConversation._id, {
        lastMessageBody: trimmedAssistantMessage,
        lastMessageRole: "assistant",
        latestMessageAt: now,
        messageCount: (existingConversation.messageCount ?? 0) + 2,
        ownerExternalId:
          ownerExternalId ?? existingConversation.ownerExternalId,
        ownerHandle: args.ownerHandle ?? existingConversation.ownerHandle,
        ownerUserId: ownerUserId ?? existingConversation.ownerUserId,
        title:
          existingConversation.title === "Chat thread"
            ? buildConversationTitle(trimmedUserMessage)
            : existingConversation.title,
        updatedAt: now,
      });
    } else {
      await ctx.db.insert("conversations", {
        conversationId,
        createdAt: now,
        intentCount: 0,
        lastMessageBody: trimmedAssistantMessage,
        lastMessageRole: "assistant",
        latestMessageAt: now,
        messageCount: 2,
        ownerExternalId,
        ownerHandle: args.ownerHandle,
        ownerUserId,
        provider: "boreal-agent",
        source: "chat",
        status: "active",
        title: buildConversationTitle(trimmedUserMessage),
        updatedAt: now,
      });
    }

    const userMessageId = crypto.randomUUID();
    const assistantMessageId = crypto.randomUUID();

    await ctx.db.insert("chatMessages", {
      body: trimmedUserMessage,
      conversationId,
      createdAt: now,
      intentKey: undefined,
      messageId: userMessageId,
      provider: "boreal-agent",
      role: "user",
      senderActorKind: "human",
      senderDisplayName: args.ownerDisplayName ?? "X user",
      senderExternalId: ownerExternalId,
      senderHandle: args.ownerHandle,
    });

    await ctx.db.insert("chatMessages", {
      body: trimmedAssistantMessage,
      conversationId,
      createdAt: now,
      intentKey: undefined,
      messageId: assistantMessageId,
      provider: "boreal-agent",
      role: "assistant",
      senderActorKind: "agent",
      senderDisplayName: "Boreal Agent",
      senderExternalId: "agent:boreal",
      senderHandle: "boreal",
    });

    return {
      assistantMessageId,
      conversationId,
      posted: true,
      userMessageId,
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

    await refreshProfileAnalyticsForUser(ctx, intent.ownerUserId);
    const acceptedProposal = await ctx.db
      .query("proposals")
      .withIndex("by_intentKey_and_status", (queryBuilder) =>
        queryBuilder.eq("intentKey", intent.intentKey).eq("status", "accepted"),
      )
      .unique();
    await refreshProfileAnalyticsForUser(ctx, acceptedProposal?.proposerUserId);
    if (
      intent.assignedAgent?.toLowerCase().includes("boreal") ||
      intent.provider === "boreal-agent"
    ) {
      await refreshBorealProfileAnalytics(ctx);
    }

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

    await refreshProfileAnalyticsForUser(ctx, intent.ownerUserId);
    const acceptedProposal = await ctx.db
      .query("proposals")
      .withIndex("by_intentKey_and_status", (queryBuilder) =>
        queryBuilder.eq("intentKey", intent.intentKey).eq("status", "accepted"),
      )
      .unique();
    await refreshProfileAnalyticsForUser(ctx, acceptedProposal?.proposerUserId);
    if (
      intent.assignedAgent?.toLowerCase().includes("boreal") ||
      intent.provider === "boreal-agent"
    ) {
      await refreshBorealProfileAnalytics(ctx);
    }

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

    await refreshProfileAnalyticsForUser(ctx, intent.ownerUserId);
    const acceptedProposal = await ctx.db
      .query("proposals")
      .withIndex("by_intentKey_and_status", (queryBuilder) =>
        queryBuilder.eq("intentKey", intent.intentKey).eq("status", "accepted"),
      )
      .unique();
    await refreshProfileAnalyticsForUser(ctx, acceptedProposal?.proposerUserId);
    if (
      (args.assignedAgent ?? intent.assignedAgent)?.toLowerCase().includes("boreal") ||
      intent.provider === "boreal-agent"
    ) {
      await refreshBorealProfileAnalytics(ctx);
    }

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

    await refreshProfileAnalyticsForUser(ctx, intent.ownerUserId);
    const acceptedProposal = await ctx.db
      .query("proposals")
      .withIndex("by_intentKey_and_status", (queryBuilder) =>
        queryBuilder.eq("intentKey", intent.intentKey).eq("status", "accepted"),
      )
      .unique();
    await refreshProfileAnalyticsForUser(ctx, acceptedProposal?.proposerUserId);
    if (
      intent.assignedAgent?.toLowerCase().includes("boreal") ||
      intent.provider === "boreal-agent"
    ) {
      await refreshBorealProfileAnalytics(ctx);
    }

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

export const listConversationSidebar = query({
  args: {
    limit: v.number(),
    ownerExternalId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (!args.ownerExternalId) {
      return [];
    }

    const conversations = await ctx.db
      .query("conversations")
      .withIndex("by_ownerExternalId_and_latestMessageAt", (queryBuilder) =>
        queryBuilder.eq("ownerExternalId", args.ownerExternalId),
      )
      .order("desc")
      .take(args.limit);

    return Promise.all(
      conversations.map(async (conversation) => {
        const linkedIntent = await ctx.db
          .query("intents")
          .withIndex("by_conversationId", (queryBuilder) =>
            queryBuilder.eq("conversationId", conversation.conversationId),
          )
          .collect();
        const latestLinkedIntent =
          linkedIntent.sort((left, right) => right.createdAt - left.createdAt)[0] ??
          null;

        return {
          _id: conversation._id,
          conversationId: conversation.conversationId,
          intentCount: conversation.intentCount,
          lastMessageBody: conversation.lastMessageBody ?? null,
          lastMessageRole: conversation.lastMessageRole ?? null,
          latestMessageAt: conversation.latestMessageAt,
          linkedRequest:
            latestLinkedIntent
              ? {
                  id: latestLinkedIntent._id,
                  status: latestLinkedIntent.status,
                  title: latestLinkedIntent.title,
                }
              : null,
          messageCount: conversation.messageCount ?? 0,
          title: conversation.title,
          updatedAt: conversation.updatedAt,
        };
      }),
    );
  },
});

export const getConversationThread = query({
  args: {
    conversationId: v.string(),
    ownerExternalId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (!args.ownerExternalId) {
      return null;
    }

    const conversation = await ctx.db
      .query("conversations")
      .withIndex("by_conversationId", (queryBuilder) =>
        queryBuilder.eq("conversationId", args.conversationId),
      )
      .unique();

    if (!conversation) {
      return null;
    }

    if (
      args.ownerExternalId &&
      conversation.ownerExternalId &&
      conversation.ownerExternalId !== args.ownerExternalId
    ) {
      return null;
    }

    const messages = await ctx.db
      .query("chatMessages")
      .withIndex("by_conversationId_and_createdAt", (queryBuilder) =>
        queryBuilder.eq("conversationId", args.conversationId),
      )
      .collect();

    const linkedIntent = await ctx.db
      .query("intents")
      .withIndex("by_conversationId", (queryBuilder) =>
        queryBuilder.eq("conversationId", args.conversationId),
      )
      .collect();
    const latestLinkedIntent =
      linkedIntent.sort((left, right) => right.createdAt - left.createdAt)[0] ??
      null;

    return {
      conversation: {
        _id: conversation._id,
        conversationId: conversation.conversationId,
        intentCount: conversation.intentCount,
        lastMessageBody: conversation.lastMessageBody ?? null,
        lastMessageRole: conversation.lastMessageRole ?? null,
        latestMessageAt: conversation.latestMessageAt,
        messageCount: conversation.messageCount ?? 0,
        title: conversation.title,
        updatedAt: conversation.updatedAt,
      },
      linkedRequest:
        latestLinkedIntent
          ? {
              id: latestLinkedIntent._id,
              status: latestLinkedIntent.status,
              title: latestLinkedIntent.title,
            }
          : null,
      messages: messages.map((message) => ({
        _id: message._id,
        body: message.body,
        createdAt: message.createdAt,
        role: message.role,
        sender: {
          actorKind: message.senderActorKind ?? "human",
          displayName: message.senderDisplayName ?? "Unknown",
          externalId: message.senderExternalId ?? null,
          handle: message.senderHandle ?? null,
        },
      })),
    };
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

function buildConversationTitle(body: string) {
  const trimmed = body.trim().replace(/\s+/g, " ");

  if (trimmed.length === 0) {
    return "Chat thread";
  }

  return trimmed.length > 72 ? `${trimmed.slice(0, 69)}...` : trimmed;
}

async function hasRequestAccess(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ctx: any,
  ownerUserId: string | undefined,
  ownerExternalId: string | undefined,
): Promise<boolean> {
  if (!ownerUserId || !ownerExternalId) {
    return false;
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
