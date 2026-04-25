import { mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server";
import { v } from "convex/values";

import {
  emptyProfileAnalyticsSnapshot,
  readProfileAnalytics,
  refreshBorealProfileAnalytics,
  refreshProfileAnalyticsForUser,
} from "./profileAnalytics";
import { actorKindValidator, profileAvailabilityValidator } from "./validators";

export const getMyProfile = query({
  args: {
    ownerExternalId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getUserByExternalId(ctx, args.ownerExternalId);

    if (!user) {
      return null;
    }

    const profile = await getProfileByUser(ctx, user._id, user.externalId);
    const supplies = await ctx.db
      .query("supplies")
      .withIndex("by_supplierUserId", (queryBuilder) =>
        queryBuilder.eq("supplierUserId", user._id),
      )
      .order("desc")
      .take(24);

    return {
      profile: profile
        ? {
            _id: profile._id,
            actorKind: user.actorKind,
            availabilityStatus: profile.availabilityStatus,
            avatarUrl: profile.avatarUrl ?? null,
            bio: profile.bio ?? "",
            capabilityTags: profile.capabilityTags,
            displayName: profile.displayName,
            handle: profile.handle ?? null,
            headline: profile.headline ?? "",
            isPublic: profile.isPublic,
            productLabels: profile.productLabels,
            skillTags: profile.skillTags,
          }
        : {
            _id: null,
            actorKind: user.actorKind,
            availabilityStatus: "available",
            avatarUrl: null,
            bio: "",
            capabilityTags: [],
            displayName: user.displayName,
            handle: user.handle ?? null,
            headline: "",
            isPublic: true,
            productLabels: [],
            skillTags: [],
          },
      supplies: supplies.map((supply) => ({
        _id: supply._id,
        category: supply.category,
        description: supply.description,
        priceAmount: supply.priceAmount ?? null,
        priceType: supply.priceType,
        status: supply.status,
        supplyType: supply.supplyType,
        title: supply.title,
      })),
      user: {
        _id: user._id,
        displayName: user.displayName,
        handle: user.handle ?? null,
      },
    };
  },
});

export const upsertMyProfile = mutation({
  args: {
    availabilityStatus: profileAvailabilityValidator,
    bio: v.optional(v.string()),
    capabilityTags: v.array(v.string()),
    headline: v.optional(v.string()),
    isPublic: v.boolean(),
    ownerActorKind: v.optional(actorKindValidator),
    ownerDisplayName: v.optional(v.string()),
    ownerExternalId: v.optional(v.string()),
    ownerHandle: v.optional(v.string()),
    productLabels: v.array(v.string()),
    skillTags: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const user = await upsertUser(ctx, {
      displayName: args.ownerDisplayName,
      externalId: args.ownerExternalId,
      handle: args.ownerHandle,
      kind: args.ownerActorKind,
    });

    if (!user) {
      return { profileId: null, saved: false };
    }

    const existing = await getProfileByUser(ctx, user._id, user.externalId);
    const searchText = buildProfileSearchText({
      bio: args.bio,
      capabilityTags: args.capabilityTags,
      displayName: args.ownerDisplayName ?? user.displayName,
      handle: args.ownerHandle ?? user.handle,
      headline: args.headline,
      productLabels: args.productLabels,
      skillTags: args.skillTags,
    });

    const payload = {
      availabilityStatus: args.availabilityStatus,
      bio: sanitizeOptionalText(args.bio),
      capabilityTags: normalizeTagList(args.capabilityTags),
      displayName: args.ownerDisplayName ?? user.displayName,
      externalId: user.externalId,
      handle: args.ownerHandle ?? user.handle,
      headline: sanitizeOptionalText(args.headline),
      isPublic: args.isPublic,
      productLabels: normalizeTagList(args.productLabels),
      searchText,
      skillTags: normalizeTagList(args.skillTags),
      updatedAt: now,
      userId: user._id,
    };

    if (existing) {
      await ctx.db.patch(existing._id, payload);
      await refreshProfileAnalyticsForUser(ctx, user._id);

      return { profileId: existing._id, saved: true };
    }

    const profileId = await ctx.db.insert("profiles", {
      ...payload,
      avatarUrl: undefined,
      createdAt: now,
    });

    await refreshProfileAnalyticsForUser(ctx, user._id);

    return { profileId, saved: true };
  },
});

export const listPublicProfiles = query({
  args: {
    limit: v.number(),
    ownerExternalId: v.optional(v.string()),
    query: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const trimmed = args.query?.trim() ?? "";
    const ownerUser = await getUserByExternalId(ctx, args.ownerExternalId);

    const profiles =
      trimmed.length > 0
        ? await ctx.db
            .query("profiles")
            .withSearchIndex("search_public", (queryBuilder) =>
              queryBuilder
                .search("searchText", trimmed)
                .eq("isPublic", true),
            )
            .take(args.limit)
        : await ctx.db
            .query("profiles")
            .withIndex("by_isPublic_and_updatedAt", (queryBuilder) =>
              queryBuilder.eq("isPublic", true),
            )
            .order("desc")
            .take(args.limit);

    return Promise.all(
      profiles.map(async (profile) => {
        const user = await getUserById(ctx, profile.userId);
        const analytics = readProfileAnalytics(profile);

        return {
          _id: profile._id,
          actorKind: user?.actorKind ?? "human",
          availabilityStatus: profile.availabilityStatus,
          bio: profile.bio ?? "",
          capabilityTags: profile.capabilityTags,
          displayName: profile.displayName,
          handle: profile.handle ?? null,
          headline: profile.headline ?? "",
          isMine: !!(ownerUser && profile.userId === ownerUser._id),
          productLabels: profile.productLabels,
          skillTags: profile.skillTags,
          supplyCount: analytics.supplyCount,
        };
      }),
    );
  },
});

export const getPublicProfile = query({
  args: {
    ownerExternalId: v.optional(v.string()),
    profileId: v.id("profiles"),
  },
  handler: async (ctx, args) => {
    const profile = await ctx.db.get(args.profileId);
    const ownerUser = await getUserByExternalId(ctx, args.ownerExternalId);

    if (!profile) {
      return null;
    }

    const isMine = !!(ownerUser && profile.userId === ownerUser._id);

    if (!profile.isPublic && !isMine) {
      return null;
    }

    const [user, supplies] = await Promise.all([
      getUserById(ctx, profile.userId),
      profile.userId
        ? ctx.db
            .query("supplies")
            .withIndex("by_supplierUserId", (queryBuilder) =>
              queryBuilder.eq("supplierUserId", profile.userId),
            )
            .order("desc")
            .take(24)
        : Promise.resolve([]),
    ]);

    return {
      profile: {
        _id: profile._id,
        actorKind: user?.actorKind ?? "human",
        availabilityStatus: profile.availabilityStatus,
        avatarUrl: profile.avatarUrl ?? null,
        bio: profile.bio ?? "",
        capabilityTags: profile.capabilityTags,
        displayName: profile.displayName,
        handle: profile.handle ?? null,
        headline: profile.headline ?? "",
        isMine,
        isPublic: profile.isPublic,
        productLabels: profile.productLabels,
        skillTags: profile.skillTags,
      },
      analytics: readProfileAnalytics(profile),
      supplies: supplies.map((supply) => ({
        _id: supply._id,
        category: supply.category,
        deliveryType: supply.deliveryType,
        description: supply.description,
        priceAmount: supply.priceAmount ?? null,
        priceType: supply.priceType,
        status: supply.status,
        supplyType: supply.supplyType,
        title: supply.title,
      })),
    };
  },
});

export const getBorealAgentStats = query({
  args: {},
  handler: async (ctx) => {
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_externalId", (queryBuilder) =>
        queryBuilder.eq("externalId", "agent:boreal"),
      )
      .unique();

    return profile ? readProfileAnalytics(profile) : emptyProfileAnalyticsSnapshot();
  },
});

export const rebuildAllAnalytics = mutation({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();

    for (const user of users) {
      await refreshProfileAnalyticsForUser(ctx, user._id);
    }

    await refreshBorealProfileAnalytics(ctx);

    return {
      rebuiltProfiles: users.length,
    };
  },
});

async function getUserByExternalId(
  ctx: MutationCtx | QueryCtx,
  externalId?: string,
) {
  if (!externalId) {
    return null;
  }

  return ctx.db
    .query("users")
    .withIndex("by_externalId", (queryBuilder) =>
      queryBuilder.eq("externalId", externalId),
    )
    .unique();
}

async function getUserById(
  ctx: MutationCtx | QueryCtx,
  userId?: string,
) {
  if (!userId) {
    return null;
  }

  return (await ctx.db.get(userId as never)) as
    | {
        _id: string;
        actorKind: "agent" | "human" | "tool";
        displayName: string;
        externalId?: string;
        handle?: string;
      }
    | null;
}

async function getProfileByUser(
  ctx: MutationCtx | QueryCtx,
  userId?: string,
  externalId?: string,
) {
  if (userId) {
    const profileByUser = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (queryBuilder) =>
        queryBuilder.eq("userId", userId),
      )
      .unique();

    if (profileByUser) {
      return profileByUser;
    }
  }

  if (!externalId) {
    return null;
  }

  return ctx.db
    .query("profiles")
    .withIndex("by_externalId", (queryBuilder) =>
      queryBuilder.eq("externalId", externalId),
    )
    .unique();
}

async function upsertUser(
  ctx: MutationCtx,
  input: {
    displayName?: string;
    externalId?: string;
    handle?: string;
    kind?: "agent" | "human" | "tool";
  },
) {
  if (!input.externalId) {
    return null;
  }

  const existing = await ctx.db
    .query("users")
    .withIndex("by_externalId", (queryBuilder) =>
      queryBuilder.eq("externalId", input.externalId),
    )
    .unique();

  if (existing) {
    await ctx.db.patch(existing._id, {
      actorKind: input.kind ?? existing.actorKind,
      displayName: input.displayName ?? existing.displayName,
      handle: input.handle ?? existing.handle,
      updatedAt: Date.now(),
    });

    return {
      ...existing,
      actorKind: input.kind ?? existing.actorKind,
      displayName: input.displayName ?? existing.displayName,
      handle: input.handle ?? existing.handle,
    };
  }

  const userId = await ctx.db.insert("users", {
    actorKind: input.kind ?? "human",
    createdAt: Date.now(),
    displayName: input.displayName ?? input.handle ?? "X user",
    externalId: input.externalId,
    handle: input.handle,
    trustScore: 50,
    updatedAt: Date.now(),
  });

  return {
    _id: userId,
    actorKind: (input.kind ?? "human") as "agent" | "human" | "tool",
    createdAt: Date.now(),
    displayName: input.displayName ?? input.handle ?? "X user",
    externalId: input.externalId,
    handle: input.handle,
    trustScore: 50,
    updatedAt: Date.now(),
  };
}

function normalizeTagList(values: string[]) {
  return Array.from(
    new Set(
      values
        .map((value) => value.trim())
        .filter(Boolean),
    ),
  ).slice(0, 16);
}

function sanitizeOptionalText(value?: string) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function buildProfileSearchText(input: {
  bio?: string;
  capabilityTags: string[];
  displayName: string;
  handle?: string;
  headline?: string;
  productLabels: string[];
  skillTags: string[];
}) {
  return [
    input.displayName,
    input.handle,
    input.headline,
    input.bio,
    ...input.capabilityTags,
    ...input.skillTags,
    ...input.productLabels,
  ]
    .filter(Boolean)
    .join(" ");
}
