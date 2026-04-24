import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const listSidebar = query({
  args: {
    limit: v.number(),
    ownerExternalId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const ownerUserId = await getOwnerUserId(ctx, args.ownerExternalId);
    const intents = await ctx.db.query("intents").order("desc").take(args.limit);

    return intents
      .filter((intent) => !ownerUserId || intent.ownerUserId === ownerUserId)
      .map((intent) => ({
        _creationTime: intent._creationTime,
        _id: intent._id,
        assignedAgent: intent.assignedAgent ?? null,
        category: intent.category,
        conversationId: intent.conversationId ?? null,
        needsClarification: intent.needsClarification ?? false,
        provider: intent.provider,
        requestedOutputTypes: intent.requestedOutputTypes ?? ["text"],
        reviewRating: intent.reviewRating ?? null,
        routeTarget: intent.routeTarget ?? "general_assistance",
        status: intent.status,
        summary: intent.summary,
        title: intent.title,
        updatedAt: intent.updatedAt,
      }));
  },
});

export const listMarketplace = query({
  args: {
    limit: v.number(),
    ownerExternalId: v.optional(v.string()),
    query: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const ownerUserId = await getOwnerUserId(ctx, args.ownerExternalId);
    const trimmed = args.query?.trim() ?? "";
    const intents =
      trimmed.length > 0
        ? await ctx.db
            .query("intents")
            .withSearchIndex("search_body", (queryBuilder) =>
              queryBuilder.search("body", trimmed).eq("visibility", "public"),
            )
            .take(args.limit)
        : await ctx.db.query("intents").order("desc").take(args.limit * 3);

    return intents
      .filter((intent) => intent.visibility === "public")
      .slice(0, args.limit)
      .map((intent) => ({
        _creationTime: intent._creationTime,
        _id: intent._id,
        assignedAgent: intent.assignedAgent ?? null,
        category: intent.category,
        conversationId: intent.conversationId ?? null,
        isOwner: !!(ownerUserId && intent.ownerUserId === ownerUserId),
        needsClarification: intent.needsClarification ?? false,
        provider: intent.provider,
        requestedOutputTypes: intent.requestedOutputTypes ?? ["text"],
        reviewRating: intent.reviewRating ?? null,
        routeTarget: intent.routeTarget ?? "general_assistance",
        status: intent.status,
        summary: intent.summary,
        title: intent.title,
        updatedAt: intent.updatedAt,
        visibility: intent.visibility,
      }));
  },
});

export const getRequestDetail = query({
  args: {
    intentId: v.id("intents"),
    ownerExternalId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const intent = await ctx.db.get(args.intentId);
    const ownerUserId = await getOwnerUserId(ctx, args.ownerExternalId);
    const isOwner = !!(intent && ownerUserId && intent.ownerUserId === ownerUserId);

    if (
      !intent ||
      !(await hasRequestReadAccess(ctx, intent.ownerUserId, args.ownerExternalId, intent.visibility))
    ) {
      return {
        access: null,
        activity: [],
        artifact: null,
        assignment: null,
        conversationId: null,
        intent: null,
        messages: [],
        proposals: [],
        review: null,
      };
    }

    const messages = await ctx.db
      .query("chatMessages")
      .withIndex("by_conversationId_and_createdAt", (queryBuilder) =>
        queryBuilder.eq("conversationId", intent.conversationId ?? ""),
      )
      .order("asc")
      .take(128);

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

    const activity = await ctx.db
      .query("activityEvents")
      .withIndex("by_entityType_and_entityId", (queryBuilder) =>
        queryBuilder.eq("entityType", "intent").eq("entityId", intent.intentKey),
      )
      .order("desc")
      .take(24);

    const proposals = await ctx.db
      .query("proposals")
      .withIndex("by_intentKey_and_createdAt", (queryBuilder) =>
        queryBuilder.eq("intentKey", intent.intentKey),
      )
      .order("asc")
      .take(24);

    const artifact = artifacts[0];

    return {
      access: {
        canApproveProposals: isOwner,
        canSubmitProposal: !isOwner && intent.acceptsProposals,
        isOwner,
        visibility: intent.visibility,
      },
      activity: activity
        .map((event) => ({
          _id: event._id,
          createdAt: event.createdAt,
          payload: parseJson(event.payload),
          type: event.type,
        }))
        .reverse(),
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
      assignment: {
        agent: intent.assignedAgent ?? null,
        provider: intent.provider,
        tools: intent.assignedToolNames ?? [],
      },
      conversationId: intent.conversationId ?? null,
      intent: {
        _creationTime: intent._creationTime,
        _id: intent._id,
        approvedAt: intent.approvedAt ?? null,
        category: intent.category,
        completedAt: intent.completedAt ?? null,
        confidence: intent.confidence,
        missingDetails: intent.missingDetails ?? [],
        needsClarification: intent.needsClarification ?? false,
        provider: intent.provider,
        requestedOutputTypes: intent.requestedOutputTypes ?? ["text"],
        responseInstructions: intent.responseInstructions ?? "",
        resolutionTier: intent.resolutionTier,
        reviewPending:
          intent.status === "fulfilled" && typeof intent.reviewRating !== "number",
        routeTarget: intent.routeTarget ?? "general_assistance",
        startedAt: intent.startedAt ?? null,
        status: intent.status,
        suggestedReplies: intent.suggestedReplies ?? [],
        summary: intent.summary,
        title: intent.title,
      },
      messages: requestMessages,
      proposals: await Promise.all(
        proposals.map(async (proposal) => ({
          _id: proposal._id,
          createdAt: proposal.createdAt,
          currency: proposal.currency,
          deliverablesBody: proposal.deliverablesBody,
          etaAt: proposal.etaAt,
          isMine: !!(ownerUserId && proposal.proposerUserId === ownerUserId),
          price: proposal.price,
          proposer: await getProposalUser(ctx, proposal.proposerUserId, proposal.proposerKind),
          status: proposal.status,
        })),
      ),
      review:
        typeof intent.reviewRating === "number"
          ? {
              comment: intent.reviewComment ?? "",
              rating: intent.reviewRating,
              reviewedAt: intent.reviewedAt ?? null,
            }
          : null,
    };
  },
});

export const getExecutionContext = query({
  args: {
    intentId: v.id("intents"),
    ownerExternalId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const intent = await ctx.db.get(args.intentId);

    if (
      !intent ||
      !(await hasRequestOwnerAccess(ctx, intent.ownerUserId, args.ownerExternalId))
    ) {
      return null;
    }

    return {
      _id: intent._id,
      assetPrompt: intent.assetPrompt ?? intent.body,
      body: intent.body,
      catalogQuery: intent.catalogQuery ?? "",
      conversationId: intent.conversationId ?? null,
      generationSignals: intent.generationSignals,
      intentKey: intent.intentKey,
      missingDetails: intent.missingDetails ?? [],
      needsClarification: intent.needsClarification ?? false,
      provider: intent.provider,
      requestedOutputTypes: intent.requestedOutputTypes ?? ["text"],
      responseInstructions: intent.responseInstructions ?? "",
      routeTarget: intent.routeTarget ?? "general_assistance",
      speechText: intent.speechText ?? intent.summary,
      status: intent.status,
      suggestedReplies: intent.suggestedReplies ?? [],
      summary: intent.summary,
      title: intent.title,
      voice: intent.voice ?? "alloy",
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

export const deleteIntent = mutation({
  args: {
    intentId: v.id("intents"),
    ownerExternalId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const intent = await ctx.db.get(args.intentId);

    if (
      !intent ||
      !(await hasRequestOwnerAccess(ctx, intent.ownerUserId, args.ownerExternalId))
    ) {
      return { deleted: false };
    }

    const relatedMessages = await ctx.db
      .query("chatMessages")
      .withIndex("by_conversationId_and_createdAt", (queryBuilder) =>
        queryBuilder.eq("conversationId", intent.conversationId ?? ""),
      )
      .take(128);

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

async function getOwnerUserId(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ctx: any,
  ownerExternalId: string | undefined,
) {
  if (!ownerExternalId) {
    return null;
  }

  const owner = await ctx.db
    .query("users")
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .withIndex("by_externalId", (queryBuilder: any) =>
      queryBuilder.eq("externalId", ownerExternalId),
    )
    .unique();

  return owner?._id ?? null;
}

async function hasRequestReadAccess(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ctx: any,
  ownerUserId: string | undefined,
  ownerExternalId: string | undefined,
  visibility: "private" | "public",
) {
  if (visibility === "public") {
    return true;
  }

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

async function hasRequestOwnerAccess(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ctx: any,
  ownerUserId: string | undefined,
  ownerExternalId: string | undefined,
) {
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

async function getProposalUser(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ctx: any,
  proposerUserId: string | undefined,
  proposerKind: string,
) {
  const user = proposerUserId ? await ctx.db.get(proposerUserId) : null;

  return {
    displayName: user?.displayName ?? "Worker",
    handle: user?.handle ?? null,
    kind: proposerKind,
  };
}
