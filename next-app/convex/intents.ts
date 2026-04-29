import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

import {
  DEFAULT_BOREAL_VIDEO_SECONDS,
  DEFAULT_BOREAL_VIDEO_SIZE,
} from "../lib/boreal/media/video-contract.ts";
import {
  normalizeIntentExtraction,
  type RequestClassification,
  type RequestedOutputType,
  type ToolRoute,
} from "../lib/boreal/schemas/intent.ts";
import {
  buildCollectiveContributionSummary,
  buildCollectiveTrustSummary,
  getCollectiveMemberRole,
  proposalIncludesParticipant,
  resolveCollectiveParticipants,
} from "./collectives";
import { isLocalRuntimeSupply } from "../lib/boreal/external-agents/local-runtime.ts";
import { shouldFetchRequestMatches } from "../lib/boreal/request-matching-policy.ts";
import { persistIntentMatchCandidates } from "./matching";
import { listIntentMatchCandidates } from "./supplies";

function sanitizeStoredIntentShape(intent: {
  assetPrompt?: string | null;
  body?: string | null;
  capabilityTags?: string[] | null;
  catalogQuery?: string | null;
  category?: string | null;
  confidence?: number | null;
  classification?: RequestClassification | null;
  intentType?: "demand" | "informational" | "supply" | null;
  keywords?: string[] | null;
  missingDetails?: string[] | null;
  needsClarification?: boolean | null;
  requestedOutputTypes?: RequestedOutputType[] | null;
  responseInstructions?: string | null;
  routeTarget?: ToolRoute | null;
  shouldSearchCatalog?: boolean | null;
  speechText?: string | null;
  suggestedReplies?: string[] | null;
  summary?: string | null;
  title?: string | null;
  videoSeconds?: string | null;
  videoSize?: string | null;
  voice?: string | null;
}) {
  const fallbackMessage =
    intent.body?.trim() || intent.summary?.trim() || intent.title?.trim() || "";
  const requestedOutputTypes =
    (intent.requestedOutputTypes?.length
      ? intent.requestedOutputTypes
      : ["text"]) as RequestedOutputType[];

  const normalizedIntent = normalizeIntentExtraction(
    {
      assetPrompt: intent.assetPrompt ?? "",
      body: intent.body ?? fallbackMessage,
      capabilityTags: intent.capabilityTags ?? [],
      catalogQuery: intent.catalogQuery ?? "",
      category: intent.category ?? "general",
      confidence: intent.confidence ?? undefined,
      intentType: intent.intentType ?? "demand",
      keywords: intent.keywords ?? [],
      missingDetails: intent.missingDetails ?? [],
      needsClarification: intent.needsClarification ?? false,
      requestedOutputTypes,
      responseInstructions: intent.responseInstructions ?? "",
      routeTarget: intent.routeTarget ?? "general_assistance",
      shouldSearchCatalog: intent.shouldSearchCatalog ?? false,
      speechText: intent.speechText ?? fallbackMessage,
      suggestedReplies: intent.suggestedReplies ?? [],
      summary: intent.summary ?? fallbackMessage,
      title: intent.title?.trim() || fallbackMessage || "Boreal request",
      videoSeconds: intent.videoSeconds ?? "",
      videoSize: intent.videoSize ?? "",
      voice: intent.voice ?? "alloy",
    },
    fallbackMessage,
    requestedOutputTypes.map((kind, index) => ({
      kind,
      score: index === 0 ? 1 : 0.5,
    })),
  );

  return {
    ...normalizedIntent,
    classification: intent.classification ?? normalizedIntent.classification,
  };
}

export const listSidebar = query({
  args: {
    limit: v.number(),
    ownerExternalId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (!args.ownerExternalId) {
      return [];
    }

    const ownerUserId = await getOwnerUserId(ctx, args.ownerExternalId);
    const intents = await ctx.db.query("intents").order("desc").take(args.limit);

    return Promise.all(
      intents
        .filter(
          (intent) =>
            (!ownerUserId || intent.ownerUserId === ownerUserId) &&
            intent.status !== "proposed",
        )
        .map(async (intent) => {
        const normalizedIntent = sanitizeStoredIntentShape(intent);

        return ({
        _creationTime: intent._creationTime,
        _id: intent._id,
        assignedAgent: intent.assignedAgent ?? null,
        category: intent.category,
        conversationId: intent.conversationId ?? null,
        needsClarification: normalizedIntent.needsClarification,
        participants: await getIntentParticipantsPreview(ctx, intent),
        provider: intent.provider,
        requestedOutputTypes: normalizedIntent.requestedOutputTypes,
        reviewRating: intent.reviewRating ?? null,
        routeTarget: normalizedIntent.routeTarget,
        status: intent.status,
        summary: intent.summary,
        title: intent.title,
        updatedAt: intent.updatedAt,
      })}),
    );
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

    return Promise.all(
      intents
        .filter((intent) => intent.visibility === "public")
        .slice(0, args.limit)
        .map(async (intent) => {
        const normalizedIntent = sanitizeStoredIntentShape(intent);

        return ({
        _creationTime: intent._creationTime,
        _id: intent._id,
        assignedAgent: intent.assignedAgent ?? null,
        category: intent.category,
        conversationId: intent.conversationId ?? null,
        isOwner: !!(ownerUserId && intent.ownerUserId === ownerUserId),
        needsClarification: normalizedIntent.needsClarification,
        participants: await getIntentParticipantsPreview(ctx, intent),
        provider: intent.provider,
        requestedOutputTypes: normalizedIntent.requestedOutputTypes,
        reviewRating: intent.reviewRating ?? null,
        routeTarget: normalizedIntent.routeTarget,
        status: intent.status,
        summary: intent.summary,
        title: intent.title,
        updatedAt: intent.updatedAt,
        visibility: intent.visibility,
      })}),
    );
  },
});

export const getRequestDetail = query({
  args: {
    intentId: v.id("intents"),
    ownerExternalId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const intent = await ctx.db.get(args.intentId);
    const currentUserId = await getOwnerUserId(ctx, args.ownerExternalId);
    const isOwner = !!(intent && currentUserId && intent.ownerUserId === currentUserId);

    if (
      !intent ||
      !(await hasRequestReadAccess(ctx, intent.ownerUserId, args.ownerExternalId, intent.visibility))
    ) {
      return {
        access: null,
        activity: [],
        artifact: null,
        assignment: null,
        catalogItems: [],
        conversationId: null,
        intent: null,
        matchCandidates: [],
        collectiveTrust: null,
        messages: [],
        contributions: [],
        participants: [],
        fulfillment: null,
        proposals: [],
        review: null,
      };
    }

    const proposals = await ctx.db
      .query("proposals")
      .withIndex("by_intentKey_and_createdAt", (queryBuilder) =>
        queryBuilder.eq("intentKey", intent.intentKey),
      )
      .order("asc")
      .take(24);
    const acceptedProposal = proposals.find((proposal) => proposal.status === "accepted");
    const canViewChat = Boolean(
      isOwner ||
        (currentUserId && acceptedProposal?.proposerUserId === currentUserId),
    );
    const canSubmitWork = Boolean(
      currentUserId && acceptedProposal?.proposerUserId === currentUserId,
    );

    const messages = await ctx.db
      .query("chatMessages")
      .withIndex("by_conversationId_and_createdAt", (queryBuilder) =>
        queryBuilder.eq("conversationId", intent.conversationId ?? ""),
      )
      .order("asc")
      .take(128);

    const requestMessages = await Promise.all(
      (canViewChat ? messages : [])
        .filter((message) => message.intentKey === intent.intentKey)
        .map(async (message) => ({
          _id: message._id,
          body: message.body,
          createdAt: message.createdAt,
          role: message.role,
          sender: {
            actorKind: message.senderActorKind ?? fallbackSenderActorKind(message.role),
            displayName:
              message.senderDisplayName ?? fallbackSenderDisplayName(message.role),
            externalId: message.senderExternalId ?? null,
            handle: message.senderHandle ?? null,
            isCurrentUser:
              !!(
                message.senderExternalId &&
                args.ownerExternalId &&
                message.senderExternalId === args.ownerExternalId
              ),
            profileId:
              message.senderExternalId
                ? await getProfileIdByExternalId(ctx, message.senderExternalId)
                : null,
          },
        })),
    );

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

    const artifact = artifacts[0];
    const participants = await getRequestParticipants(ctx, intent, acceptedProposal);
    const participantActivity = new Map<string, number>();

    for (const message of requestMessages) {
      const key = getParticipantActivityKey({
        displayName: message.sender.displayName,
        externalId: message.sender.externalId ?? null,
        handle: message.sender.handle ?? null,
      });
      const current = participantActivity.get(key) ?? 0;
      participantActivity.set(key, Math.max(current, message.createdAt));
    }

    const contributions = await buildCollectiveContributionSummary(ctx, {
      acceptedProposal,
      conversationId: intent.conversationId ?? null,
      intentKey: intent.intentKey,
    });
    const collectiveTrust = await buildCollectiveTrustSummary(ctx, {
      acceptedProposal,
    });
    const fulfillment = await getRequestFulfillment(ctx, intent, acceptedProposal);
    const normalizedIntent = sanitizeStoredIntentShape(intent);
    const matchCandidates =
      shouldFetchRequestMatches(normalizedIntent.classification)
        ? await listIntentMatchCandidates(
            ctx,
            {
              _id: intent._id,
              body: intent.body,
              budgetMax: intent.budgetMax,
              budgetMin: intent.budgetMin,
              capabilityTags: intent.capabilityTags,
              catalogQuery: intent.catalogQuery,
              category: intent.category,
              classification: normalizedIntent.classification,
              deadlineAt: intent.deadlineAt,
              embedding: intent.embedding,
              intentKey: intent.intentKey,
              keywords: intent.keywords,
              pinnedSupplyIds: intent.pinnedSupplyIds ?? [],
              requestedOutputTypes: normalizedIntent.requestedOutputTypes,
              summary: intent.summary,
              title: intent.title,
            },
            16,
          )
        : [];
    const catalogItems = matchCandidates
      .filter((candidate) => candidate.gatedOutReasons.length === 0)
      .slice(0, 8);

    return {
      access: {
        canApproveProposals: isOwner,
        canSubmitProposal: !isOwner && intent.acceptsProposals,
        canSubmitWork,
        canViewChat,
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
        runtimeSupplyIds: (intent.invitedRuntimeSupplyIds ?? []).map(String),
        tools: intent.assignedToolNames ?? [],
      },
      catalogItems,
      conversationId: intent.conversationId ?? null,
      fulfillment,
      intent: {
        _creationTime: intent._creationTime,
        _id: intent._id,
        approvedAt: intent.approvedAt ?? null,
        body: intent.body,
        catalogQuery: intent.catalogQuery ?? "",
        cancelledAt: intent.cancelledAt ?? null,
        category: intent.category,
        closedReason: intent.closedReason ?? null,
        completedAt: intent.completedAt ?? null,
        confidence: intent.confidence,
        classification: normalizedIntent.classification,
        missingDetails: normalizedIntent.missingDetails,
        matchAttempts: intent.matchAttempts ?? 0,
        needsClarification: normalizedIntent.needsClarification,
        pinnedSupplyIds: (intent.pinnedSupplyIds ?? []).map(String),
        provider: intent.provider,
        requestedOutputTypes: normalizedIntent.requestedOutputTypes,
        responseInstructions: normalizedIntent.responseInstructions,
        resolutionTier: intent.resolutionTier,
        reviewPending:
          intent.status === "fulfilled" && typeof intent.reviewRating !== "number",
        routeTarget: normalizedIntent.routeTarget,
        shouldSearchCatalog: normalizedIntent.shouldSearchCatalog,
        startedAt: intent.startedAt ?? null,
        status: intent.status,
        suggestedReplies: normalizedIntent.suggestedReplies,
        summary: intent.summary,
        title: intent.title,
        videoSeconds: normalizedIntent.videoSeconds ?? DEFAULT_BOREAL_VIDEO_SECONDS,
        videoSize: normalizedIntent.videoSize ?? DEFAULT_BOREAL_VIDEO_SIZE,
      },
      matchCandidates,
      collectiveTrust,
      messages: requestMessages,
      contributions,
      participants: participants.map((participant) => ({
        ...participant,
        lastActivityAt:
          participantActivity.get(getParticipantActivityKey(participant)) ?? null,
      })),
      proposals: await Promise.all(
        proposals.map(async (proposal) => ({
          collectiveMembers: proposal.collectiveMembers ?? [],
          _id: proposal._id,
          createdAt: proposal.createdAt,
          currency: proposal.currency,
          deliverablesBody: proposal.deliverablesBody,
          etaAt: proposal.etaAt,
          isCollective: proposal.isCollective,
          isMine: proposalIncludesParticipant(proposal, {
            externalId: args.ownerExternalId ?? null,
            userId: currentUserId,
          }),
          memberRoles: proposal.memberRoles ?? [],
          price: proposal.price,
          proposer: await getProposalUser(ctx, proposal.proposerUserId, proposal.proposerKind),
          splitPlan: proposal.splitPlan ?? [],
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
    const normalizedIntent = sanitizeStoredIntentShape(intent);
    const runtimeSupplies = (
      await Promise.all(
        (intent.invitedRuntimeSupplyIds ?? []).map((supplyId) => ctx.db.get(supplyId)),
      )
    ).filter(
      (
        supply,
      ): supply is NonNullable<typeof supply> =>
        Boolean(
          supply &&
            supply.status === "active" &&
            isLocalRuntimeSupply(supply),
        ),
    );

    return {
      _id: intent._id,
      assetPrompt: normalizedIntent.assetPrompt,
      body: intent.body,
      capabilityTags: intent.capabilityTags ?? [],
      catalogQuery: intent.catalogQuery ?? "",
      category: intent.category,
      conversationId: intent.conversationId ?? null,
      generationSignals: intent.generationSignals,
      classification: normalizedIntent.classification,
      intentKey: intent.intentKey,
      keywords: intent.keywords ?? [],
      missingDetails: normalizedIntent.missingDetails,
      needsClarification: normalizedIntent.needsClarification,
      provider: intent.provider,
      requestedOutputTypes: normalizedIntent.requestedOutputTypes,
      responseInstructions: normalizedIntent.responseInstructions,
      routeTarget: normalizedIntent.routeTarget,
      runtimeSupplies: runtimeSupplies.map((supply) => ({
        _id: supply._id,
        capabilityTags: supply.capabilityTags,
        connectorHealthStatus: supply.connectorHealthStatus ?? null,
        connectorLastHeartbeatAt: supply.connectorLastHeartbeatAt ?? null,
        connectorLastTestedAt: supply.connectorLastTestedAt ?? null,
        executionSurface: supply.executionSurface ?? null,
        executorUrl: supply.executorUrl ?? null,
        mcpServerUrl: supply.mcpServerUrl ?? null,
        mcpToolName: supply.mcpToolName ?? null,
        outputTypes: supply.outputTypes ?? [],
        sourceProviderKey: supply.sourceProviderKey ?? null,
        supportsDirectInvoke: supply.supportsDirectInvoke ?? false,
        title: supply.title,
      })),
      speechText: normalizedIntent.speechText,
      status: intent.status,
      suggestedReplies: normalizedIntent.suggestedReplies,
      summary: intent.summary,
      title: intent.title,
      videoSeconds: normalizedIntent.videoSeconds ?? DEFAULT_BOREAL_VIDEO_SECONDS,
      videoSize: normalizedIntent.videoSize ?? DEFAULT_BOREAL_VIDEO_SIZE,
      voice: normalizedIntent.voice ?? "alloy",
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

    const matchCandidates = await ctx.db
      .query("matchCandidates")
      .withIndex("by_intentId_and_createdAt", (queryBuilder) =>
        queryBuilder.eq("intentId", args.intentId),
      )
      .take(64);

    for (const candidate of matchCandidates) {
      await ctx.db.delete(candidate._id);
    }

    await ctx.db.delete(args.intentId);

    return { deleted: true };
  },
});

export const refineRequestMatches = mutation({
  args: {
    intentId: v.id("intents"),
    ownerExternalId: v.optional(v.string()),
    query: v.string(),
  },
  handler: async (ctx, args) => {
    const intent = await ctx.db.get(args.intentId);
    const query = args.query.trim();

    if (
      !intent ||
      !query ||
      !(await hasRequestOwnerAccess(ctx, intent.ownerUserId, args.ownerExternalId))
    ) {
      return { query, refined: false };
    }

    const now = Date.now();
    const normalizedIntent = sanitizeStoredIntentShape(intent);

    await ctx.db.patch(args.intentId, {
      catalogQuery: query,
      shouldSearchCatalog: true,
      updatedAt: now,
    });

    const result = await persistIntentMatchCandidates(ctx, {
      body: intent.body,
      budgetMax: intent.budgetMax,
      budgetMin: intent.budgetMin,
      capabilityTags: intent.capabilityTags,
      catalogQuery: query,
      category: intent.category,
      classification: normalizedIntent.classification,
      deadlineAt: intent.deadlineAt,
      embedding: intent.embedding,
      intentId: intent._id,
      intentKey: intent.intentKey,
      keywords: intent.keywords,
      requestedOutputTypes: normalizedIntent.requestedOutputTypes,
      summary: intent.summary,
      title: intent.title,
    });

    await ctx.db.insert("activityEvents", {
      createdAt: now,
      entityId: intent.intentKey,
      entityType: "intent",
      payload: JSON.stringify({
        fetchPath: result.fetchPath,
        persistedCount: result.persistedCount,
        query,
        topMatchScore: result.topMatchScore,
      }),
      type: "matching.refined",
    });

    return { query, refined: true };
  },
});

export const togglePinnedSupplyMatch = mutation({
  args: {
    intentId: v.id("intents"),
    ownerExternalId: v.optional(v.string()),
    supplyId: v.id("supplies"),
  },
  handler: async (ctx, args) => {
    const intent = await ctx.db.get(args.intentId);

    if (
      !intent ||
      !(await hasRequestOwnerAccess(ctx, intent.ownerUserId, args.ownerExternalId))
    ) {
      return { isPinned: false, pinnedSupplyIds: [] as string[], updated: false };
    }

    const currentPinned = new Map(
      (intent.pinnedSupplyIds ?? []).map((supplyId) => [String(supplyId), supplyId] as const),
    );
    const supplyKey = String(args.supplyId);
    const isPinned = !currentPinned.has(supplyKey);

    if (isPinned) {
      currentPinned.set(supplyKey, args.supplyId);
    } else {
      currentPinned.delete(supplyKey);
    }

    const pinnedSupplyIds = Array.from(currentPinned.values());
    const now = Date.now();

    await ctx.db.patch(args.intentId, {
      pinnedSupplyIds,
      updatedAt: now,
    });

    await ctx.db.insert("activityEvents", {
      createdAt: now,
      entityId: intent.intentKey,
      entityType: "intent",
      payload: JSON.stringify({
        isPinned,
        supplyId: supplyKey,
      }),
      type: isPinned ? "matching.pinned" : "matching.unpinned",
    });

    return {
      isPinned,
      pinnedSupplyIds: pinnedSupplyIds.map(String),
      updated: true,
    };
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

async function getIntentParticipantsPreview(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ctx: any,
  intent: {
    assignedAgent?: string;
    intentKey: string;
    ownerUserId?: string;
    status: string;
  },
) {
  const acceptedProposal = await ctx.db
    .query("proposals")
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .withIndex("by_intentKey_and_status", (queryBuilder: any) =>
      queryBuilder.eq("intentKey", intent.intentKey).eq("status", "accepted"),
    )
    .first();

  const participants = await getRequestParticipants(ctx, intent, acceptedProposal);

  return participants
    .filter((participant) => participant.status !== "owner")
    .map((participant) => ({
      displayName: participant.displayName,
      externalId: participant.externalId,
      handle: participant.handle,
      kind: participant.kind,
      status: participant.status,
    }))
    .slice(0, 4);
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
  const profile = user?.externalId ? await getProfileIdByExternalId(ctx, user.externalId) : null;

  return {
    displayName: user?.displayName ?? "Worker",
    handle: user?.handle ?? null,
    kind: proposerKind,
    profileId: profile,
  };
}

async function getProfileIdByExternalId(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ctx: any,
  externalId: string,
) {
  const profile = await ctx.db
    .query("profiles")
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .withIndex("by_externalId", (queryBuilder: any) =>
      queryBuilder.eq("externalId", externalId),
    )
    .unique();

  return profile?._id ?? null;
}

const DIRECT_AGENT_PARTICIPANTS: Record<
  string,
  { displayName: string; externalId: string; handle: string }
> = {
  "boreal-agent": {
    displayName: "Boreal Agent",
    externalId: "agent:boreal",
    handle: "boreal",
  },
  copywriter: {
    displayName: "Copywriter",
    externalId: "agent:copywriter",
    handle: "copywriter",
  },
  "image-studio": {
    displayName: "Image Studio",
    externalId: "agent:image-studio",
    handle: "image-studio",
  },
  "math-expert": {
    displayName: "Math Expert",
    externalId: "agent:math-expert",
    handle: "math-expert",
  },
  "motion-video-studio": {
    displayName: "Motion Video Studio",
    externalId: "agent:motion-video-studio",
    handle: "motion-video-studio",
  },
  "mvp-architect": {
    displayName: "MVP Architect",
    externalId: "agent:mvp-architect",
    handle: "mvp-architect",
  },
  "research-analyst": {
    displayName: "Research Analyst",
    externalId: "agent:research-analyst",
    handle: "research-analyst",
  },
  "solana-operator": {
    displayName: "Solana Operator",
    externalId: "agent:solana-operator",
    handle: "solana-operator",
  },
  "startup-pressure-test": {
    displayName: "Startup Pressure Test",
    externalId: "agent:startup-pressure-test",
    handle: "startup-pressure-test",
  },
  "voiceover-studio": {
    displayName: "Voiceover Studio",
    externalId: "agent:voiceover-studio",
    handle: "voiceover-studio",
  },
};

function buildRuntimeHandle(title: string) {
  return title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "runtime"
}

async function getRequestParticipants(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ctx: any,
  intent: {
    assignedAgent?: string;
    assignedToolNames?: string[];
    invitedRuntimeSupplyIds?: string[];
    intentKey: string;
    ownerUserId?: string;
    status: string;
  },
  acceptedProposal:
    | {
        collectiveMembers?: string[];
        isCollective?: boolean;
        memberRoles?: Array<{ memberId: string; role: string }>;
        proposerUserId?: string;
        status: string;
      }
    | undefined,
) {
  const participants: Array<{
    displayName: string;
    externalId: string | null;
    handle: string | null;
    kind: string;
    connectorHealthStatus: "failing" | "healthy" | "unknown" | null;
    connectorLastHeartbeatAt: number | null;
    connectorLastTestedAt: number | null;
    executorUrl: string | null;
    lastActivityAt: number | null;
    mcpServerUrl: string | null;
    profileId: string | null;
    role: string | null;
    runtimeSupplyId: string | null;
    status: string;
    supportsDirectInvoke: boolean;
    title: string | null;
  }> = [];
  const assignedAgent = intent.assignedAgent;
  const assignedDirectAgents = (intent.assignedToolNames ?? [])
    .map((toolName) => DIRECT_AGENT_PARTICIPANTS[toolName.trim().toLowerCase()])
    .filter(Boolean);
  const invitedRuntimeSupplies = (
    await Promise.all(
      (intent.invitedRuntimeSupplyIds ?? []).map((supplyId) => ctx.db.get(supplyId)),
    )
  ).filter(
    (
      supply,
    ): supply is NonNullable<typeof supply> =>
      Boolean(
        supply &&
          supply.status === "active" &&
          isLocalRuntimeSupply(supply),
      ),
  );

  if (intent.ownerUserId) {
    const owner = await ctx.db.get(intent.ownerUserId);
    if (owner) {
      participants.push({
        displayName: owner.displayName,
        externalId: owner.externalId ?? null,
        handle: owner.handle ?? null,
        kind: owner.actorKind,
        connectorHealthStatus: null,
        connectorLastHeartbeatAt: null,
        connectorLastTestedAt: null,
        executorUrl: null,
        lastActivityAt: null,
        mcpServerUrl: null,
        profileId: owner.externalId ? await getProfileIdByExternalId(ctx, owner.externalId) : null,
        role: null,
        runtimeSupplyId: null,
        status: "owner",
        supportsDirectInvoke: false,
        title: null,
      });
    }
  }

  if (acceptedProposal?.proposerUserId) {
    const proposer = await ctx.db.get(acceptedProposal.proposerUserId);
    if (proposer) {
      participants.push({
        displayName: proposer.displayName,
        externalId: proposer.externalId ?? null,
        handle: proposer.handle ?? null,
        kind: proposer.actorKind,
        connectorHealthStatus: null,
        connectorLastHeartbeatAt: null,
        connectorLastTestedAt: null,
        executorUrl: null,
        lastActivityAt: null,
        mcpServerUrl: null,
        profileId:
          proposer.externalId ? await getProfileIdByExternalId(ctx, proposer.externalId) : null,
        role: proposer.externalId
          ? getCollectiveMemberRole(acceptedProposal, proposer.externalId)
          : null,
        runtimeSupplyId: null,
        status: acceptedProposal.status,
        supportsDirectInvoke: false,
        title: null,
      });
    }
  }

  if (acceptedProposal?.isCollective) {
    const collectiveParticipants = await resolveCollectiveParticipants(
      ctx,
      acceptedProposal,
    );

    if (!collectiveParticipants.error) {
      for (const participant of collectiveParticipants.participants) {
        if (
          participants.some(
            (current) => current.externalId === participant.externalId,
          )
        ) {
          continue;
        }

        participants.push({
          displayName: participant.displayName,
          externalId: participant.externalId,
          handle: participant.handle,
          kind: participant.user.actorKind,
          connectorHealthStatus: null,
          connectorLastHeartbeatAt: null,
          connectorLastTestedAt: null,
          executorUrl: null,
          lastActivityAt: null,
          mcpServerUrl: null,
          profileId: participant.profileId ?? null,
          role: getCollectiveMemberRole(acceptedProposal, participant.externalId),
          runtimeSupplyId: null,
          status: acceptedProposal.status,
          supportsDirectInvoke: false,
          title: null,
        });
      }
    }
  }

  for (const runtimeSupply of invitedRuntimeSupplies) {
    const externalId = `supply:${runtimeSupply._id}`;

    if (participants.some((participant) => participant.externalId === externalId)) {
      continue;
    }

    participants.push({
      displayName: runtimeSupply.title,
      externalId,
      handle: buildRuntimeHandle(runtimeSupply.title),
      kind: "agent",
      connectorHealthStatus: runtimeSupply.connectorHealthStatus ?? null,
      connectorLastHeartbeatAt: runtimeSupply.connectorLastHeartbeatAt ?? null,
      connectorLastTestedAt: runtimeSupply.connectorLastTestedAt ?? null,
      executorUrl: runtimeSupply.executorUrl ?? null,
      lastActivityAt: null,
      mcpServerUrl: runtimeSupply.mcpServerUrl ?? null,
      profileId: null,
      role: "runtime",
      runtimeSupplyId: runtimeSupply._id,
      status: intent.status,
      supportsDirectInvoke: runtimeSupply.supportsDirectInvoke ?? false,
      title: runtimeSupply.title,
    });
  }

  for (const directAgent of assignedDirectAgents) {
    if (
      participants.some(
        (participant) => participant.externalId === directAgent.externalId,
      )
    ) {
      continue;
    }

    participants.push({
      displayName: directAgent.displayName,
      externalId: directAgent.externalId,
      handle: directAgent.handle,
      kind: "agent",
      connectorHealthStatus: null,
      connectorLastHeartbeatAt: null,
      connectorLastTestedAt: null,
      executorUrl: null,
      lastActivityAt: null,
      mcpServerUrl: null,
      profileId: null,
      role: null,
      runtimeSupplyId: null,
      status: intent.status,
      supportsDirectInvoke: false,
      title: null,
    });
  }

  const hasExplicitBorealTool = (intent.assignedToolNames ?? []).some(
    (toolName) => toolName.trim().toLowerCase() === "boreal-agent",
  );
  const isImplicitBorealAgentName = assignedAgent
    ? assignedAgent.toLowerCase().includes("boreal")
    : false;

  if (
    assignedAgent &&
    assignedDirectAgents.length === 0 &&
    (!isImplicitBorealAgentName || hasExplicitBorealTool) &&
    !participants.some(
      (participant) =>
        participant.displayName === assignedAgent ||
        (assignedAgent.toLowerCase().includes("boreal") &&
          participant.externalId === "agent:boreal"),
    )
  ) {
    participants.push({
      displayName: assignedAgent,
      externalId: assignedAgent.toLowerCase().includes("boreal")
        ? "agent:boreal"
        : null,
      handle: assignedAgent.toLowerCase().includes("boreal") ? "boreal" : null,
      kind: "agent",
      connectorHealthStatus: null,
      connectorLastHeartbeatAt: null,
      connectorLastTestedAt: null,
      executorUrl: null,
      lastActivityAt: null,
      mcpServerUrl: null,
      profileId: null,
      role: null,
      runtimeSupplyId: null,
      status: intent.status,
      supportsDirectInvoke: false,
      title: null,
    });
  }

  return dedupeRequestParticipants(participants);
}

function dedupeRequestParticipants<
  T extends {
    displayName: string;
    externalId: string | null;
    handle: string | null;
    kind: string;
    connectorHealthStatus: "failing" | "healthy" | "unknown" | null;
    connectorLastHeartbeatAt: number | null;
    connectorLastTestedAt: number | null;
    executorUrl: string | null;
    lastActivityAt: number | null;
    mcpServerUrl: string | null;
    profileId: string | null;
    runtimeSupplyId: string | null;
    status: string;
    supportsDirectInvoke: boolean;
    title: string | null;
  },
>(participants: T[]) {
  const deduped = new Map<string, T>();

  for (const participant of participants) {
    const key = getRequestParticipantKey(participant);
    const current = deduped.get(key);

    if (!current) {
      deduped.set(key, participant);
      continue;
    }

    const nextStatusWins =
      getParticipantStatusPriority(participant.status) >=
      getParticipantStatusPriority(current.status);

    deduped.set(key, {
      ...current,
      ...participant,
      displayName:
        current.externalId === "agent:boreal" || participant.externalId === "agent:boreal"
          ? "Boreal Agent"
          : nextStatusWins
            ? participant.displayName
            : current.displayName,
      externalId: current.externalId ?? participant.externalId,
      handle:
        current.externalId === "agent:boreal" || participant.externalId === "agent:boreal"
          ? "boreal"
          : current.handle ?? participant.handle,
      kind: current.kind === "agent" || participant.kind === "agent" ? "agent" : current.kind,
      connectorHealthStatus:
        participant.connectorHealthStatus ?? current.connectorHealthStatus,
      connectorLastHeartbeatAt:
        participant.connectorLastHeartbeatAt ?? current.connectorLastHeartbeatAt,
      connectorLastTestedAt:
        participant.connectorLastTestedAt ?? current.connectorLastTestedAt,
      executorUrl: participant.executorUrl ?? current.executorUrl,
      lastActivityAt: participant.lastActivityAt ?? current.lastActivityAt,
      mcpServerUrl: participant.mcpServerUrl ?? current.mcpServerUrl,
      profileId: current.profileId ?? participant.profileId,
      runtimeSupplyId: current.runtimeSupplyId ?? participant.runtimeSupplyId,
      status: nextStatusWins ? participant.status : current.status,
      supportsDirectInvoke:
        current.supportsDirectInvoke || participant.supportsDirectInvoke,
      title: participant.title ?? current.title,
    });
  }

  return Array.from(deduped.values());
}

function getParticipantActivityKey(participant: {
  displayName: string;
  externalId: string | null;
  handle: string | null;
}) {
  return (
    participant.externalId?.trim().toLowerCase() ??
    participant.handle?.trim().toLowerCase() ??
    participant.displayName.trim().toLowerCase()
  );
}

export const inviteRuntimeToRequest = mutation({
  args: {
    intentId: v.id("intents"),
    ownerExternalId: v.optional(v.string()),
    supplyId: v.id("supplies"),
  },
  handler: async (ctx, args) => {
    const intent = await ctx.db.get(args.intentId);

    if (
      !intent ||
      !(await hasRequestOwnerAccess(ctx, intent.ownerUserId, args.ownerExternalId))
    ) {
      return { invited: false, reason: "request_not_open" as const, supplyId: null };
    }

    if (
      intent.status === "closed" ||
      intent.status === "fulfilled"
    ) {
      return { invited: false, reason: "request_not_open" as const, supplyId: null };
    }

    const supply = await ctx.db.get(args.supplyId);

    if (!supply || supply.status !== "active") {
      return { invited: false, reason: "supply_not_found" as const, supplyId: null };
    }

    if (supply.supplierUserId !== intent.ownerUserId) {
      return { invited: false, reason: "supply_not_owned" as const, supplyId: null };
    }

    if (!isLocalRuntimeSupply(supply)) {
      return { invited: false, reason: "not_local_runtime" as const, supplyId: null };
    }

    const now = Date.now();
    const currentSupplyIds = intent.invitedRuntimeSupplyIds ?? [];
    const nextSupplyIds = currentSupplyIds.includes(args.supplyId)
      ? currentSupplyIds
      : [...currentSupplyIds, args.supplyId];

    await ctx.db.patch(args.intentId, {
      invitedRuntimeSupplyIds: nextSupplyIds,
      updatedAt: now,
    });

    await ctx.db.insert("activityEvents", {
      createdAt: now,
      entityId: intent.intentKey,
      entityType: "intent",
      payload: JSON.stringify({
        executionSurface: supply.executionSurface ?? null,
        supplyId: supply._id,
        title: supply.title,
      }),
      type: "request.runtime_invited",
    });

    return { invited: true, supplyId: supply._id };
  },
});

function getRequestParticipantKey(participant: {
  displayName: string;
  externalId: string | null;
  handle: string | null;
}) {
  const externalId = participant.externalId?.trim().toLowerCase();

  if (externalId) {
    return externalId.includes("boreal") ? "agent:boreal" : `external:${externalId}`;
  }

  const handle = participant.handle?.trim().toLowerCase();

  if (handle) {
    return handle === "boreal" ? "agent:boreal" : `handle:${handle}`;
  }

  const name = participant.displayName.trim().toLowerCase();
  return name.includes("boreal") ? "agent:boreal" : `name:${name}`;
}

function getParticipantStatusPriority(status: string) {
  switch (status) {
    case "owner":
      return 100;
    case "accepted":
    case "fulfilled":
      return 90;
    case "approved":
    case "claimed":
      return 80;
    case "in_progress":
      return 70;
    case "submitted":
      return 60;
    case "proposed":
      return 50;
    case "present":
      return 10;
    default:
      return 20;
  }
}

async function getRequestFulfillment(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ctx: any,
  intent: {
    intentKey: string;
  },
  acceptedProposal:
    | {
        _id?: string;
      }
    | undefined,
) {
  const fulfillments = await ctx.db
    .query("fulfillments")
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .withIndex("by_intentKey_and_status", (queryBuilder: any) =>
      queryBuilder.eq("intentKey", intent.intentKey).eq("status", "fulfilled"),
    )
    .collect();
  const approvedFulfillments = await ctx.db
    .query("fulfillments")
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .withIndex("by_intentKey_and_status", (queryBuilder: any) =>
      queryBuilder.eq("intentKey", intent.intentKey).eq("status", "approved"),
    )
    .collect();

  const fulfillment = fulfillments[0] ?? approvedFulfillments[0] ?? null;

  if (!fulfillment) {
    return null;
  }

  const evidence = await ctx.db
    .query("evidences")
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .withIndex("by_fulfillmentId_and_createdAt", (queryBuilder: any) =>
      queryBuilder.eq("fulfillmentId", fulfillment._id),
    )
    .order("desc")
    .take(1);

  return {
    acceptedProposalId: acceptedProposal?._id ?? fulfillment.acceptedProposalId ?? null,
    completedSummary: fulfillment.completedSummary ?? "",
    evidence:
      evidence[0]
        ? {
            attachments: await Promise.all(
              (evidence[0].attachments ?? []).map(
                async (
                  attachment:
                    | {
                        fileName: string;
                        mediaType: string;
                        sizeBytes: number;
                        storageId: string;
                      }
                    | {
                        base64: string;
                        fileName: string;
                        mediaType: string;
                        sizeBytes: number;
                      },
                ) => ({
                  fileName: attachment.fileName,
                  mediaType: attachment.mediaType,
                  sizeBytes: attachment.sizeBytes,
                  url:
                    "storageId" in attachment
                      ? ((await ctx.storage.getUrl(attachment.storageId)) ?? null)
                      : `data:${attachment.mediaType};base64,${attachment.base64}`,
                }),
              ),
            ),
            body: evidence[0].body,
            createdAt: evidence[0].createdAt,
            mediaType: evidence[0].mediaType,
            url: evidence[0].url ?? null,
          }
        : null,
    fulfillerUserId: fulfillment.fulfillerUserId ?? null,
    status: fulfillment.status,
  };
}

function fallbackSenderActorKind(role: "assistant" | "system" | "user") {
  if (role === "assistant") {
    return "agent";
  }

  return "human";
}

function fallbackSenderDisplayName(role: "assistant" | "system" | "user") {
  if (role === "assistant") {
    return "Boreal Agent";
  }

  if (role === "system") {
    return "System";
  }

  return "Participant";
}
