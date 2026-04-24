import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const submitProposal = mutation({
  args: {
    currency: v.string(),
    deliverablesBody: v.string(),
    deliverablesType: v.union(v.literal("markdown"), v.literal("file"), v.literal("link")),
    etaAt: v.number(),
    intentId: v.id("intents"),
    ownerDisplayName: v.optional(v.string()),
    ownerExternalId: v.optional(v.string()),
    ownerHandle: v.optional(v.string()),
    price: v.number(),
    proposerKind: v.optional(v.union(v.literal("human"), v.literal("agent"))),
  },
  handler: async (ctx, args) => {
    const intent = await ctx.db.get(args.intentId);

    if (!intent || intent.visibility !== "public") {
      return { proposalId: null, submitted: false };
    }

    const proposerUserId = await upsertProposalUser(ctx, {
      displayName: args.ownerDisplayName,
      externalId: args.ownerExternalId,
      handle: args.ownerHandle,
    });
    const now = Date.now();

    const proposalId = await ctx.db.insert("proposals", {
      createdAt: now,
      currency: args.currency,
      deliverablesBody: args.deliverablesBody,
      deliverablesType: args.deliverablesType,
      etaAt: args.etaAt,
      intentKey: intent.intentKey,
      isCollective: false,
      price: args.price,
      proposerKind: args.proposerKind ?? "human",
      proposerUserId,
      status: "submitted",
    });

    await ctx.db.insert("activityEvents", {
      createdAt: now,
      entityId: intent.intentKey,
      entityType: "intent",
      payload: JSON.stringify({
        price: args.price,
        proposerUserId,
        proposalId,
      }),
      type: "proposal.submitted",
    });

    return { proposalId, submitted: true };
  },
});

export const approveProposal = mutation({
  args: {
    intentId: v.id("intents"),
    ownerExternalId: v.optional(v.string()),
    proposalId: v.id("proposals"),
  },
  handler: async (ctx, args) => {
    const intent = await ctx.db.get(args.intentId);
    const proposal = await ctx.db.get(args.proposalId);

    if (
      !intent ||
      !proposal ||
      proposal.intentKey !== intent.intentKey ||
      !(await hasOwnerAccess(ctx, intent.ownerUserId, args.ownerExternalId))
    ) {
      return { approved: false };
    }

    const now = Date.now();
    const acceptedProposerName = await getUserDisplayName(ctx, proposal.proposerUserId);

    const relatedProposals = await ctx.db
      .query("proposals")
      .withIndex("by_intentKey_and_createdAt", (queryBuilder) =>
        queryBuilder.eq("intentKey", intent.intentKey),
      )
      .order("asc")
      .take(32);

    for (const relatedProposal of relatedProposals) {
      await ctx.db.patch(relatedProposal._id, {
        status: relatedProposal._id === args.proposalId ? "accepted" : "declined",
      });
    }

    await ctx.db.patch(args.intentId, {
      approvedAt: intent.approvedAt ?? now,
      assignedAgent: acceptedProposerName ?? "Approved proposer",
      assignedToolNames: ["proposal-worker"],
      startedAt: intent.startedAt ?? now,
      status: "claimed",
      updatedAt: now,
    });

    await ctx.db.insert("fulfillments", {
      acceptedProposalId: args.proposalId,
      fulfillerUserId: proposal.proposerUserId,
      intentKey: intent.intentKey,
      ownerUserId: intent.ownerUserId,
      status: "approved",
    });

    await ctx.db.insert("chatMessages", {
      body: `${acceptedProposerName ?? "A proposer"} was approved for this request at ${proposal.price} ${proposal.currency}.`,
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
        approvedProposalId: args.proposalId,
        proposerUserId: proposal.proposerUserId,
      }),
      type: "proposal.approved",
    });

    return { approved: true };
  },
});

async function upsertProposalUser(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ctx: any,
  input: {
    displayName?: string;
    externalId?: string;
    handle?: string;
  },
) {
  if (!input.externalId) {
    return undefined;
  }

  const existing = await ctx.db
    .query("users")
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .withIndex("by_externalId", (queryBuilder: any) =>
      queryBuilder.eq("externalId", input.externalId),
    )
    .unique();

  if (existing) {
    await ctx.db.patch(existing._id, {
      actorKind: existing.actorKind ?? "human",
      displayName: input.displayName ?? existing.displayName,
      handle: input.handle ?? existing.handle,
      updatedAt: Date.now(),
    });

    return existing._id as string;
  }

  return ctx.db.insert("users", {
    actorKind: "human",
    createdAt: Date.now(),
    displayName: input.displayName ?? input.handle ?? "Worker",
    externalId: input.externalId,
    handle: input.handle,
    trustScore: 0.5,
    updatedAt: Date.now(),
  });
}

async function hasOwnerAccess(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ctx: any,
  ownerUserId: string | undefined,
  ownerExternalId: string | undefined,
) {
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

async function getUserDisplayName(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ctx: any,
  userId: string | undefined,
) {
  if (!userId) {
    return null;
  }

  const user = await ctx.db.get(userId);
  return user?.displayName ?? null;
}
