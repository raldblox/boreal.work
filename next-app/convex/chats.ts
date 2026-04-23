import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

import { persistedIntentValidator } from "./validators";

export const recordIntentPipeline = mutation({
  args: {
    assistantMessage: v.string(),
    conversationId: v.optional(v.string()),
    intent: persistedIntentValidator,
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

    const intentId = await ctx.db.insert("intents", {
      acceptsProposals: true,
      actorKind: "human",
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
      persistence: args.intent.persistence,
      provider: args.intent.provider,
      requestedOutputTypes: args.intent.requestedOutputTypes,
      resolutionTier: args.intent.routing.resolutionTier,
      responseInstructions: args.intent.responseInstructions,
      routeTarget: args.intent.routeTarget,
      routing: args.intent.routing,
      shouldSearchCatalog: args.intent.shouldSearchCatalog,
      speechText: args.intent.speechText,
      status: args.intent.persistence.isUnresolved ? "open" : "fulfilled",
      suggestedReplies: args.intent.suggestedReplies,
      summary: args.intent.summary,
      title: args.intent.title,
      updatedAt: now,
      urgencyScore: args.intent.persistence.isUnresolved ? 0.72 : 0.15,
      visibility: "private",
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
      type: "intent.created",
    });

    return {
      assistantMessageId: args.intent.assistantMessageId,
      conversationId,
      intentId: intentId as string,
      intentKey,
      userMessageId: args.intent.userMessageId,
    };
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

