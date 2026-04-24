import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const submitWork = mutation({
  args: {
    attachments: v.optional(
      v.array(
        v.object({
          fileName: v.string(),
          mediaType: v.string(),
          sizeBytes: v.number(),
          storageId: v.id("_storage"),
        }),
      ),
    ),
    deliverablesBody: v.string(),
    intentId: v.id("intents"),
    workerDisplayName: v.optional(v.string()),
    workerExternalId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const intent = await ctx.db.get(args.intentId);

    if (!intent || !args.workerExternalId) {
      return { submitted: false };
    }

    const worker = await ctx.db
      .query("users")
      .withIndex("by_externalId", (queryBuilder) =>
        queryBuilder.eq("externalId", args.workerExternalId),
      )
      .unique();

    if (!worker) {
      return { submitted: false };
    }

    const proposals = await ctx.db
      .query("proposals")
      .withIndex("by_intentKey_and_status", (queryBuilder) =>
        queryBuilder.eq("intentKey", intent.intentKey).eq("status", "accepted"),
      )
      .collect();

    const acceptedProposal = proposals.find(
      (proposal) => proposal.proposerUserId === worker._id,
    );

    if (!acceptedProposal) {
      return { submitted: false };
    }

    const fulfillments = await ctx.db
      .query("fulfillments")
      .withIndex("by_intentKey_and_status", (queryBuilder) =>
        queryBuilder.eq("intentKey", intent.intentKey).eq("status", "approved"),
      )
      .collect();
    const activeFulfillment = fulfillments.find(
      (fulfillment) => fulfillment.fulfillerUserId === worker._id,
    );

    if (!activeFulfillment) {
      return { submitted: false };
    }

    const now = Date.now();

    await ctx.db.patch(activeFulfillment._id, {
      completedSummary: args.deliverablesBody,
      status: "fulfilled",
    });

    await ctx.db.insert("evidences", {
      attachments: args.attachments && args.attachments.length > 0 ? args.attachments : undefined,
      body: args.deliverablesBody,
      createdAt: now,
      fulfillmentId: activeFulfillment._id,
      mediaType: "text/markdown",
      url: undefined,
    });

    await ctx.db.patch(intent._id, {
      completedAt: now,
      reviewRating: intent.reviewRating,
      status: "fulfilled",
      updatedAt: now,
    });

    await ctx.db.insert("chatMessages", {
      body: `${args.workerDisplayName ?? worker.displayName ?? "Worker"} submitted the work.`,
      conversationId: intent.conversationId ?? crypto.randomUUID(),
      intentKey: intent.intentKey,
      messageId: crypto.randomUUID(),
      provider: "boreal-agent",
      role: "user",
      senderActorKind: worker.actorKind,
      senderDisplayName: args.workerDisplayName ?? worker.displayName ?? "Worker",
      senderExternalId: args.workerExternalId,
      senderHandle: worker.handle,
      createdAt: now,
    });

    await ctx.db.insert("activityEvents", {
      createdAt: now,
      entityId: intent.intentKey,
      entityType: "intent",
      payload: JSON.stringify({
        attachmentCount: args.attachments?.length ?? 0,
        proposerUserId: worker._id,
      }),
      type: "fulfillment.submitted",
    });

    return { submitted: true };
  },
});

export const generateUploadUrl = mutation({
  args: {},
  returns: v.string(),
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

export const markRequestFulfilled = mutation({
  args: {
    intentId: v.id("intents"),
    ownerExternalId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const intent = await ctx.db.get(args.intentId);

    if (!intent) {
      return { fulfilled: false };
    }

    const owner = args.ownerExternalId
      ? await ctx.db
          .query("users")
          .withIndex("by_externalId", (queryBuilder) =>
            queryBuilder.eq("externalId", args.ownerExternalId),
          )
          .unique()
      : null;

    if (!intent.ownerUserId || owner?._id !== intent.ownerUserId) {
      return { fulfilled: false };
    }

    const now = Date.now();
    const acceptedProposals = await ctx.db
      .query("proposals")
      .withIndex("by_intentKey_and_status", (queryBuilder) =>
        queryBuilder.eq("intentKey", intent.intentKey).eq("status", "accepted"),
      )
      .collect();
    const acceptedProposal = acceptedProposals[0] ?? null;

    const candidateFulfillments = [
      ...(await ctx.db
        .query("fulfillments")
        .withIndex("by_intentKey_and_status", (queryBuilder) =>
          queryBuilder.eq("intentKey", intent.intentKey).eq("status", "approved"),
        )
        .collect()),
      ...(await ctx.db
        .query("fulfillments")
        .withIndex("by_intentKey_and_status", (queryBuilder) =>
          queryBuilder.eq("intentKey", intent.intentKey).eq("status", "active"),
        )
        .collect()),
      ...(await ctx.db
        .query("fulfillments")
        .withIndex("by_intentKey_and_status", (queryBuilder) =>
          queryBuilder.eq("intentKey", intent.intentKey).eq("status", "blocked"),
        )
        .collect()),
      ...(await ctx.db
        .query("fulfillments")
        .withIndex("by_intentKey_and_status", (queryBuilder) =>
          queryBuilder.eq("intentKey", intent.intentKey).eq("status", "fulfilled"),
        )
        .collect()),
    ];

    const activeFulfillment =
      candidateFulfillments.find((fulfillment) =>
        acceptedProposal ? fulfillment.acceptedProposalId === acceptedProposal._id : true,
      ) ?? null;

    if (intent.status === "fulfilled" && activeFulfillment) {
      return { fulfilled: true };
    }

    const fulfillmentId =
      activeFulfillment?._id ??
      (await ctx.db.insert("fulfillments", {
        acceptedProposalId: acceptedProposal?._id,
        completedSummary: "Marked fulfilled by owner. Final delivery happened in the request chat.",
        fulfillerUserId: acceptedProposal?.proposerUserId,
        intentKey: intent.intentKey,
        ownerUserId: intent.ownerUserId,
        status: "fulfilled",
      }));

    if (activeFulfillment) {
      await ctx.db.patch(activeFulfillment._id, {
        acceptedProposalId: acceptedProposal?._id ?? activeFulfillment.acceptedProposalId,
        completedSummary:
          activeFulfillment.completedSummary ||
          "Marked fulfilled by owner. Final delivery happened in the request chat.",
        status: "fulfilled",
      });
    }

    const existingEvidence = await ctx.db
      .query("evidences")
      .withIndex("by_fulfillmentId_and_createdAt", (queryBuilder) =>
        queryBuilder.eq("fulfillmentId", fulfillmentId),
      )
      .order("desc")
      .take(1);

    if (!existingEvidence[0]) {
      await ctx.db.insert("evidences", {
        body: "Marked fulfilled by owner. Final delivery happened in the request chat.",
        createdAt: now,
        fulfillmentId,
        mediaType: "text/markdown",
        url: undefined,
      });
    }

    await ctx.db.patch(intent._id, {
      completedAt: now,
      status: "fulfilled",
      updatedAt: now,
    });

    await ctx.db.insert("activityEvents", {
      createdAt: now,
      entityId: intent.intentKey,
      entityType: "intent",
      payload: JSON.stringify({
        markedBy: args.ownerExternalId,
      }),
      type: "fulfillment.marked_complete",
    });

    return { fulfilled: true };
  },
});
