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

    return Promise.all(
      intents
        .filter((intent) => !ownerUserId || intent.ownerUserId === ownerUserId)
        .map(async (intent) => ({
        _creationTime: intent._creationTime,
        _id: intent._id,
        assignedAgent: intent.assignedAgent ?? null,
        category: intent.category,
        conversationId: intent.conversationId ?? null,
        needsClarification: intent.needsClarification ?? false,
        participants: await getIntentParticipantsPreview(ctx, intent.intentKey),
        provider: intent.provider,
        requestedOutputTypes: intent.requestedOutputTypes ?? ["text"],
        reviewRating: intent.reviewRating ?? null,
        routeTarget: intent.routeTarget ?? "general_assistance",
        status: intent.status,
        summary: intent.summary,
        title: intent.title,
        updatedAt: intent.updatedAt,
      })),
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
        .map(async (intent) => ({
        _creationTime: intent._creationTime,
        _id: intent._id,
        assignedAgent: intent.assignedAgent ?? null,
        category: intent.category,
        conversationId: intent.conversationId ?? null,
        isOwner: !!(ownerUserId && intent.ownerUserId === ownerUserId),
        needsClarification: intent.needsClarification ?? false,
        participants: await getIntentParticipantsPreview(ctx, intent.intentKey),
        provider: intent.provider,
        requestedOutputTypes: intent.requestedOutputTypes ?? ["text"],
        reviewRating: intent.reviewRating ?? null,
        routeTarget: intent.routeTarget ?? "general_assistance",
        status: intent.status,
        summary: intent.summary,
        title: intent.title,
        updatedAt: intent.updatedAt,
        visibility: intent.visibility,
      })),
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
        conversationId: null,
        intent: null,
        messages: [],
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
    const fulfillment = await getRequestFulfillment(ctx, intent, acceptedProposal);

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
        tools: intent.assignedToolNames ?? [],
      },
      conversationId: intent.conversationId ?? null,
      fulfillment,
      intent: {
        _creationTime: intent._creationTime,
        _id: intent._id,
        approvedAt: intent.approvedAt ?? null,
        body: intent.body,
        cancelledAt: intent.cancelledAt ?? null,
        category: intent.category,
        closedReason: intent.closedReason ?? null,
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
      participants,
      proposals: await Promise.all(
        proposals.map(async (proposal) => ({
          _id: proposal._id,
          createdAt: proposal.createdAt,
          currency: proposal.currency,
          deliverablesBody: proposal.deliverablesBody,
          etaAt: proposal.etaAt,
          isMine: !!(currentUserId && proposal.proposerUserId === currentUserId),
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

async function getIntentParticipantsPreview(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ctx: any,
  intentKey: string,
) {
  const acceptedProposals = await ctx.db
    .query("proposals")
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .withIndex("by_intentKey_and_status", (queryBuilder: any) =>
      queryBuilder.eq("intentKey", intentKey).eq("status", "accepted"),
    )
    .collect();

  const previews = await Promise.all(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    acceptedProposals.map(async (proposal: any) => {
      const user = proposal.proposerUserId ? await ctx.db.get(proposal.proposerUserId) : null;
      return {
        displayName: user?.displayName ?? "Participant",
        externalId: user?.externalId ?? null,
        handle: user?.handle ?? null,
        kind: proposal.proposerKind,
      };
    }),
  );

  return previews.slice(0, 4);
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

async function getRequestParticipants(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ctx: any,
  intent: {
    assignedAgent?: string;
    intentKey: string;
    ownerUserId?: string;
    status: string;
  },
  acceptedProposal:
    | {
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
    profileId: string | null;
    status: string;
  }> = [];
  const assignedAgent = intent.assignedAgent;

  if (intent.ownerUserId) {
    const owner = await ctx.db.get(intent.ownerUserId);
    if (owner) {
      participants.push({
        displayName: owner.displayName,
        externalId: owner.externalId ?? null,
        handle: owner.handle ?? null,
        kind: owner.actorKind,
        profileId: owner.externalId ? await getProfileIdByExternalId(ctx, owner.externalId) : null,
        status: "owner",
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
        profileId:
          proposer.externalId ? await getProfileIdByExternalId(ctx, proposer.externalId) : null,
        status: acceptedProposal.status,
      });
    }
  }

  if (
    !participants.some(
      (participant) =>
        participant.externalId === "agent:boreal" || participant.displayName === "Boreal Agent",
    )
  ) {
    participants.push({
      displayName: "Boreal Agent",
      externalId: "agent:boreal",
      handle: "boreal",
      kind: "agent",
      profileId: null,
      status: intent.status === "open" || intent.status === "proposed" ? "present" : intent.status,
    });
  }

  if (
    assignedAgent &&
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
      profileId: null,
      status: intent.status,
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
    profileId: string | null;
    status: string;
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
      profileId: current.profileId ?? participant.profileId,
      status: nextStatusWins ? participant.status : current.status,
    });
  }

  return Array.from(deduped.values());
}

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
