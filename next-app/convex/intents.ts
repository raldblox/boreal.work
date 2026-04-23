import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const listSidebar = query({
  args: {
    limit: v.number(),
  },
  handler: async (ctx, args) => {
    const intents = await ctx.db.query("intents").order("desc").take(args.limit);

    return intents.map((intent) => ({
      _creationTime: intent._creationTime,
      _id: intent._id,
      category: intent.category,
      conversationId: intent.conversationId ?? null,
      confidence: intent.confidence,
      needsClarification: intent.needsClarification ?? false,
      provider: intent.provider,
      requestedOutputTypes: intent.requestedOutputTypes ?? ["text"],
      routeTarget: intent.routeTarget ?? "general_assistance",
      status: intent.status,
      summary: intent.summary,
      title: intent.title,
    }));
  },
});

export const getRequestDetail = query({
  args: {
    intentId: v.id("intents"),
  },
  handler: async (ctx, args) => {
    const intent = await ctx.db.get(args.intentId);

    if (!intent) {
      return {
        artifact: null,
        conversationId: null,
        intent: null,
        messages: [],
      };
    }

    const messages = await ctx.db
      .query("chatMessages")
      .withIndex("by_conversationId_and_createdAt", (queryBuilder) =>
        queryBuilder.eq("conversationId", intent.conversationId ?? ""),
      )
      .order("asc")
      .take(64);

    const requestMessages = messages
      .filter((message) => message.intentKey === intent.intentKey)
      .map((message) => ({
        _id: message._id,
        body: message.body,
        createdAt: message.createdAt,
        role: message.role,
      }));

    const artifacts = await ctx.db
      .query("artifacts")
      .withIndex("by_intentKey_and_createdAt", (queryBuilder) =>
        queryBuilder.eq("intentKey", intent.intentKey),
      )
      .order("desc")
      .take(4);

    const artifact = artifacts[0];

    return {
      artifact: artifact
        ? {
            _id: artifact._id,
            artifactKind: artifact.artifactKind,
            createdAt: artifact.createdAt,
            mediaType: artifact.mediaType ?? null,
            metadata: parseJson(artifact.metadataJson),
            provider: artifact.provider,
            remoteId: artifact.remoteId ?? null,
            status: artifact.status,
            subtitle: artifact.subtitle,
            title: artifact.title,
            updatedAt: artifact.updatedAt,
          }
        : null,
      conversationId: intent.conversationId ?? null,
      intent: {
        _creationTime: intent._creationTime,
        _id: intent._id,
        category: intent.category,
        confidence: intent.confidence,
        missingDetails: intent.missingDetails ?? [],
        needsClarification: intent.needsClarification ?? false,
        provider: intent.provider,
        requestedOutputTypes: intent.requestedOutputTypes ?? ["text"],
        responseInstructions: intent.responseInstructions ?? "",
        routeTarget: intent.routeTarget ?? "general_assistance",
        status: intent.status,
        suggestedReplies: intent.suggestedReplies ?? [],
        summary: intent.summary,
        title: intent.title,
      },
      messages: requestMessages,
    };
  },
});

export const listRecent = query({
  args: {
    limit: v.number(),
  },
  handler: async (ctx, args) => {
    const intents = await ctx.db.query("intents").order("desc").take(args.limit);

    return intents.map((intent) => ({
      _creationTime: intent._creationTime,
      _id: intent._id,
      category: intent.category,
      generationSignals: {
        primaryMode: intent.generationSignals.primaryMode,
        requestsImageGeneration: intent.generationSignals.requestsImageGeneration,
        requestsSpeechGeneration:
          intent.generationSignals.requestsSpeechGeneration ?? false,
        requestsText: intent.generationSignals.requestsText,
        requestsVideoGeneration: intent.generationSignals.requestsVideoGeneration,
      },
      requestedOutputTypes: intent.requestedOutputTypes ?? ["text"],
      routing: intent.routing,
      summary: intent.summary,
      title: intent.title,
    }));
  },
});

function parseJson(value: string | undefined) {
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export const deleteIntent = mutation({
  args: {
    intentId: v.id("intents"),
  },
  handler: async (ctx, args) => {
    const intent = await ctx.db.get(args.intentId);

    if (!intent) {
      return { deleted: false };
    }

    const relatedMessages = await ctx.db
      .query("chatMessages")
      .withIndex("by_conversationId_and_createdAt", (queryBuilder) =>
        queryBuilder.eq("conversationId", intent.conversationId ?? ""),
      )
      .take(64);

    for (const message of relatedMessages) {
      if (message.intentKey === intent.intentKey) {
        await ctx.db.delete(message._id);
      }
    }

    const relatedRuns = await ctx.db
      .query("intentRuns")
      .withIndex("by_intentKey_and_createdAt", (queryBuilder) =>
        queryBuilder.eq("intentKey", intent.intentKey),
      )
      .take(32);

    for (const run of relatedRuns) {
      await ctx.db.delete(run._id);
    }

    const relatedArtifacts = await ctx.db
      .query("artifacts")
      .withIndex("by_intentKey_and_createdAt", (queryBuilder) =>
        queryBuilder.eq("intentKey", intent.intentKey),
      )
      .take(32);

    for (const artifact of relatedArtifacts) {
      await ctx.db.delete(artifact._id);
    }

    const activityEvents = await ctx.db
      .query("activityEvents")
      .withIndex("by_entityType_and_entityId", (queryBuilder) =>
        queryBuilder.eq("entityType", "intent").eq("entityId", intent.intentKey),
      )
      .take(32);

    for (const event of activityEvents) {
      await ctx.db.delete(event._id);
    }

    await ctx.db.delete(args.intentId);

    return { deleted: true };
  },
});
