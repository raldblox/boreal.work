import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const registerChallenge = mutation({
  args: {
    challengeTokenHash: v.string(),
    expiresAt: v.number(),
    walletAddress: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const existing = await ctx.db
      .query("siwxChallenges")
      .withIndex("by_challengeTokenHash", (queryBuilder) =>
        queryBuilder.eq("challengeTokenHash", args.challengeTokenHash),
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        consumedAt: undefined,
        expiresAt: args.expiresAt,
        updatedAt: now,
        walletAddress: args.walletAddress,
      });
      return { registered: true };
    }

    await ctx.db.insert("siwxChallenges", {
      challengeTokenHash: args.challengeTokenHash,
      createdAt: now,
      expiresAt: args.expiresAt,
      updatedAt: now,
      walletAddress: args.walletAddress,
    });

    return { registered: true };
  },
});

export const consumeChallenge = mutation({
  args: {
    challengeTokenHash: v.string(),
    walletAddress: v.string(),
  },
  handler: async (ctx, args) => {
    const challenge = await ctx.db
      .query("siwxChallenges")
      .withIndex("by_challengeTokenHash", (queryBuilder) =>
        queryBuilder.eq("challengeTokenHash", args.challengeTokenHash),
      )
      .unique();

    if (!challenge || challenge.walletAddress !== args.walletAddress) {
      return { consumed: false, reason: "challenge_not_found" as const };
    }

    if (challenge.expiresAt <= Date.now()) {
      return { consumed: false, reason: "challenge_expired" as const };
    }

    if (challenge.consumedAt) {
      return { consumed: false, reason: "challenge_used" as const };
    }

    const now = Date.now();
    await ctx.db.patch(challenge._id, {
      consumedAt: now,
      updatedAt: now,
    });

    return { consumed: true };
  },
});
