import { mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server";
import { v } from "convex/values";

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

      return { profileId: existing._id, saved: true };
    }

    const profileId = await ctx.db.insert("profiles", {
      ...payload,
      avatarUrl: undefined,
      createdAt: now,
    });

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
        const supplies = profile.userId
          ? await ctx.db
              .query("supplies")
              .withIndex("by_supplierUserId", (queryBuilder) =>
                queryBuilder.eq("supplierUserId", profile.userId),
              )
              .collect()
          : [];

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
          supplyCount: supplies.length,
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
    const user = await getUserById(ctx, profile.userId);

    if (!profile.isPublic && !isMine) {
      return null;
    }

    const supplies = profile.userId
      ? await ctx.db
          .query("supplies")
          .withIndex("by_supplierUserId", (queryBuilder) =>
            queryBuilder.eq("supplierUserId", profile.userId),
          )
          .order("desc")
          .take(24)
      : [];

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
      analytics: await buildWorkerProfileAnalytics(ctx, profile.userId),
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
    const intents = await ctx.db.query("intents").order("desc").take(512);
    const handled = intents.filter((intent) => isBorealHandledIntent(intent));
    const rated = handled.filter((intent) => typeof intent.reviewRating === "number");
    const completedDurations = handled
      .filter(
        (intent) =>
          typeof intent.startedAt === "number" && typeof intent.completedAt === "number",
      )
      .map((intent) => (intent.completedAt! - intent.startedAt!) / (1000 * 60 * 60));
    const activityBuckets = buildActivityBuckets(handled.map((intent) => intent.updatedAt));

    return {
      activeCount: handled.filter(
        (intent) => intent.status === "claimed" || intent.status === "in_progress",
      ).length,
      activityBuckets,
      averageCompletionHours:
        completedDurations.length > 0
          ? roundToOneDecimal(
              completedDurations.reduce((total, value) => total + value, 0) /
                completedDurations.length,
            )
          : null,
      averageRating:
        rated.length > 0
          ? roundToOneDecimal(
              rated.reduce((total, intent) => total + (intent.reviewRating ?? 0), 0) /
                rated.length,
            )
          : null,
      blockedCount: handled.filter((intent) => intent.status === "blocked").length,
      fulfilledCount: handled.filter((intent) => intent.status === "fulfilled").length,
      openCount: handled.filter(
        (intent) => intent.status === "open" || intent.status === "proposed",
      ).length,
      recentRequests: handled.slice(0, 6).map((intent) => ({
        _id: intent._id,
        requestedOutputTypes: intent.requestedOutputTypes ?? ["text"],
        status: intent.status,
        summary: intent.summary,
        title: intent.title,
        updatedAt: intent.updatedAt,
      })),
      reviewCount: rated.length,
      totalHandledCount: handled.length,
    };
  },
});

async function buildWorkerProfileAnalytics(
  ctx: QueryCtx,
  userId?: string,
) {
  if (!userId) {
    return emptyWorkerProfileAnalytics();
  }

  const proposals = await ctx.db
    .query("proposals")
    .withIndex("by_proposerUserId_and_createdAt", (queryBuilder) =>
      queryBuilder.eq("proposerUserId", userId),
    )
    .order("desc")
    .take(96);

  const fulfillments = await ctx.db
    .query("fulfillments")
    .withIndex("by_fulfillerUserId", (queryBuilder) =>
      queryBuilder.eq("fulfillerUserId", userId),
    )
    .collect();

  const proposalIntentKeys = proposals.map((proposal) => proposal.intentKey);
  const fulfillmentIntentKeys = fulfillments.map((fulfillment) => fulfillment.intentKey);
  const uniqueIntentKeys = Array.from(
    new Set([...proposalIntentKeys, ...fulfillmentIntentKeys]),
  );

  if (uniqueIntentKeys.length === 0) {
    return emptyWorkerProfileAnalytics();
  }

  const intents = (
    await Promise.all(uniqueIntentKeys.map((intentKey) => getIntentByKey(ctx, intentKey)))
  ).filter(isPresent);
  const submittedProposalKeys = new Set(
    proposals
      .filter(
        (proposal) =>
          proposal.status === "submitted" || proposal.status === "revision_requested",
      )
      .map((proposal) => proposal.intentKey),
  );
  const acceptedProposalKeys = new Set(
    proposals
      .filter((proposal) => proposal.status === "accepted")
      .map((proposal) => proposal.intentKey),
  );
  const fulfilledIntentKeys = new Set(
    fulfillments
      .filter((fulfillment) => fulfillment.status === "fulfilled")
      .map((fulfillment) => fulfillment.intentKey),
  );
  const handledIntents = intents.filter(
    (intent) =>
      acceptedProposalKeys.has(intent.intentKey) || fulfilledIntentKeys.has(intent.intentKey),
  );
  const rated = handledIntents.filter((intent) => typeof intent.reviewRating === "number");
  const completedDurations = handledIntents
    .filter(
      (intent) =>
        typeof intent.startedAt === "number" && typeof intent.completedAt === "number",
    )
    .map((intent) => (intent.completedAt! - intent.startedAt!) / (1000 * 60 * 60));
  const activityBuckets = buildActivityBuckets([
    ...proposals.map((proposal) => proposal.createdAt),
    ...handledIntents.map((intent) => intent.updatedAt),
  ]);
  const recentRequests = [...intents]
    .sort((left, right) => right.updatedAt - left.updatedAt)
    .slice(0, 6)
    .map((intent) => ({
      _id: intent._id,
      requestedOutputTypes: intent.requestedOutputTypes ?? ["text"],
      status: intent.status,
      summary: intent.summary,
      title: intent.title,
      updatedAt: intent.updatedAt,
    }));

  return {
    activeCount: handledIntents.filter(
      (intent) => intent.status === "claimed" || intent.status === "in_progress",
    ).length,
    activityBuckets,
    averageCompletionHours:
      completedDurations.length > 0
        ? roundToOneDecimal(
            completedDurations.reduce((total, value) => total + value, 0) /
              completedDurations.length,
          )
        : null,
    averageRating:
      rated.length > 0
        ? roundToOneDecimal(
            rated.reduce((total, intent) => total + (intent.reviewRating ?? 0), 0) /
              rated.length,
          )
        : null,
    blockedCount: handledIntents.filter((intent) => intent.status === "blocked").length,
    fulfilledCount: handledIntents.filter((intent) => intent.status === "fulfilled").length,
    openCount: submittedProposalKeys.size,
    recentRequests,
    reviewCount: rated.length,
    totalHandledCount: uniqueIntentKeys.length,
  };
}

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

function isBorealHandledIntent(intent: {
  assignedAgent?: string;
  provider: string;
}) {
  return (
    intent.assignedAgent?.toLowerCase().includes("boreal") ||
    intent.provider === "boreal-agent"
  );
}

function roundToOneDecimal(value: number) {
  return Math.round(value * 10) / 10;
}

function emptyWorkerProfileAnalytics() {
  return {
    activeCount: 0,
    activityBuckets: buildActivityBuckets([]),
    averageCompletionHours: null,
    averageRating: null,
    blockedCount: 0,
    fulfilledCount: 0,
    openCount: 0,
    recentRequests: [] as Array<{
      _id: string;
      requestedOutputTypes: string[];
      status: string;
      summary: string;
      title: string;
      updatedAt: number;
    }>,
    reviewCount: 0,
    totalHandledCount: 0,
  };
}

function startOfDay(timestamp: number) {
  const date = new Date(timestamp);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

function formatBucketLabel(timestamp: number) {
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "numeric",
  }).format(timestamp);
}

function buildActivityBuckets(timestamps: number[]) {
  return Array.from({ length: 10 }).map((_, index) => {
    const daysAgo = 9 - index;
    const bucketStart = startOfDay(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
    const bucketEnd = bucketStart + 24 * 60 * 60 * 1000;

    return {
      count: timestamps.filter(
        (timestamp) => timestamp >= bucketStart && timestamp < bucketEnd,
      ).length,
      label: formatBucketLabel(bucketStart),
    };
  });
}

async function getIntentByKey(
  ctx: QueryCtx,
  intentKey: string,
) {
  return ctx.db
    .query("intents")
    .withIndex("by_intentKey", (queryBuilder) =>
      queryBuilder.eq("intentKey", intentKey),
    )
    .unique();
}

function isPresent<T>(value: T | null): value is T {
  return value !== null;
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
