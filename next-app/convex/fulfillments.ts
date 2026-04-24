import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const submitWork = mutation({
  args: {
    deliverablesBody: v.string(),
    deliverablesType: v.union(v.literal("file"), v.literal("link"), v.literal("markdown")),
    intentId: v.id("intents"),
    mediaType: v.optional(v.string()),
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
      body: args.deliverablesBody,
      createdAt: now,
      fulfillmentId: activeFulfillment._id,
      mediaType: args.mediaType ?? `text/${args.deliverablesType}`,
      url: undefined,
    });

    await ctx.db.patch(intent._id, {
      completedAt: now,
      reviewRating: intent.reviewRating,
      status: "fulfilled",
      updatedAt: now,
    });

    await ctx.db.insert("chatMessages", {
      body: [
        `${args.workerDisplayName ?? worker.displayName ?? "Worker"} submitted the work.`,
        "",
        args.deliverablesBody,
      ].join("\n"),
      conversationId: intent.conversationId ?? crypto.randomUUID(),
      intentKey: intent.intentKey,
      messageId: crypto.randomUUID(),
      provider: "boreal-agent",
      role: "assistant",
      createdAt: now,
    });

    await ctx.db.insert("activityEvents", {
      createdAt: now,
      entityId: intent.intentKey,
      entityType: "intent",
      payload: JSON.stringify({
        deliverablesType: args.deliverablesType,
        proposerUserId: worker._id,
      }),
      type: "fulfillment.submitted",
    });

    return { submitted: true };
  },
});
