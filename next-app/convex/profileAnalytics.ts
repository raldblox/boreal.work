import type { Doc } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import {
  BOREAL_AGENT_BIO,
  BOREAL_AGENT_CAPABILITY_TAGS,
  BOREAL_AGENT_DISPLAY_NAME,
  BOREAL_AGENT_EXTERNAL_ID,
  BOREAL_AGENT_HANDLE,
  BOREAL_AGENT_HEADLINE,
  BOREAL_AGENT_PRODUCT_LABELS,
  BOREAL_AGENT_SKILL_TAGS,
} from "../lib/boreal/boreal-agent";

type RequestedOutputType = "image_generation" | "speech_generation" | "text" | "video_generation";

type AnalyticsRequestPreview = {
  _id: string;
  requestedOutputTypes: RequestedOutputType[];
  status: string;
  summary: string;
  title: string;
  updatedAt: number;
};

type StoredProfileAnalytics = {
  activeCount: number;
  activeSupplyCount: number;
  activityBuckets: Array<{
    count: number;
    label: string;
  }>;
  averageCompletionHours?: number;
  averageRating?: number;
  blockedCount: number;
  buyerCheckoutCount: number;
  fulfilledCount: number;
  grossEarned: number;
  grossSpend: number;
  openCount: number;
  productSupplyCount: number;
  recentRequests: AnalyticsRequestPreview[];
  requestCount: number;
  reviewCount: number;
  sellerOrderCount: number;
  supplyCount: number;
  totalHandledCount: number;
  totalProposalCount: number;
  updatedAt: number;
};

export type ProfileAnalyticsSnapshot = Omit<
  StoredProfileAnalytics,
  "averageCompletionHours" | "averageRating"
> & {
  averageCompletionHours: number | null;
  averageRating: number | null;
};

type ProfileWithAnalytics = {
  analytics?: StoredProfileAnalytics;
};

export function emptyProfileAnalyticsSnapshot(): ProfileAnalyticsSnapshot {
  return {
    activeCount: 0,
    activeSupplyCount: 0,
    activityBuckets: buildActivityBuckets([]),
    averageCompletionHours: null,
    averageRating: null,
    blockedCount: 0,
    buyerCheckoutCount: 0,
    fulfilledCount: 0,
    grossEarned: 0,
    grossSpend: 0,
    openCount: 0,
    productSupplyCount: 0,
    recentRequests: [],
    requestCount: 0,
    reviewCount: 0,
    sellerOrderCount: 0,
    supplyCount: 0,
    totalHandledCount: 0,
    totalProposalCount: 0,
    updatedAt: 0,
  };
}

export function readProfileAnalytics(
  profile?: ProfileWithAnalytics | null,
): ProfileAnalyticsSnapshot {
  if (!profile?.analytics) {
    return emptyProfileAnalyticsSnapshot();
  }

  return {
    ...profile.analytics,
    averageCompletionHours: profile.analytics.averageCompletionHours ?? null,
    averageRating: profile.analytics.averageRating ?? null,
  };
}

export async function refreshProfileAnalyticsForUser(
  ctx: MutationCtx,
  userId?: string,
) {
  if (!userId) {
    return null;
  }

  const user = await getUserById(ctx, userId);

  if (!user) {
    return null;
  }

  const analytics = await computeUserProfileAnalytics(ctx, userId);
  await upsertProfileAnalytics(ctx, user, analytics);

  return analytics;
}

export async function refreshBorealProfileAnalytics(ctx: MutationCtx) {
  const borealUser = await ensureBorealUser(ctx);
  const analytics = await computeBorealProfileAnalytics(ctx, borealUser._id);
  await upsertProfileAnalytics(ctx, borealUser, analytics, {
    bio: BOREAL_AGENT_BIO,
    capabilityTags: [...BOREAL_AGENT_CAPABILITY_TAGS],
    headline: BOREAL_AGENT_HEADLINE,
    isPublic: true,
    productLabels: [...BOREAL_AGENT_PRODUCT_LABELS],
    skillTags: [...BOREAL_AGENT_SKILL_TAGS],
  });

  return analytics;
}

async function computeUserProfileAnalytics(
  ctx: MutationCtx,
  userId: string,
): Promise<StoredProfileAnalytics> {
  const [ownedIntents, proposals, fulfillments, supplies, checkouts, sellerItems] =
    await Promise.all([
      ctx.db
        .query("intents")
        .withIndex("by_ownerUserId_and_updatedAt", (queryBuilder) =>
          queryBuilder.eq("ownerUserId", userId),
        )
        .order("desc")
        .collect(),
      ctx.db
        .query("proposals")
        .withIndex("by_proposerUserId_and_createdAt", (queryBuilder) =>
          queryBuilder.eq("proposerUserId", userId),
        )
        .order("desc")
        .collect(),
      ctx.db
        .query("fulfillments")
        .withIndex("by_fulfillerUserId", (queryBuilder) =>
          queryBuilder.eq("fulfillerUserId", userId),
        )
        .collect(),
      ctx.db
        .query("supplies")
        .withIndex("by_supplierUserId", (queryBuilder) =>
          queryBuilder.eq("supplierUserId", userId),
        )
        .collect(),
      ctx.db
        .query("checkouts")
        .withIndex("by_ownerUserId_and_createdAt", (queryBuilder) =>
          queryBuilder.eq("ownerUserId", userId),
        )
        .order("desc")
        .collect(),
      ctx.db
        .query("checkoutItems")
        .withIndex("by_sellerUserId_and_createdAt", (queryBuilder) =>
          queryBuilder.eq("sellerUserId", userId),
        )
        .order("desc")
        .collect(),
    ]);

  const involvedIntentKeys = Array.from(
    new Set([
      ...proposals.map((proposal) => proposal.intentKey),
      ...fulfillments.map((fulfillment) => fulfillment.intentKey),
    ]),
  );
  const involvedIntents = (
    await Promise.all(involvedIntentKeys.map((intentKey) => getIntentByKey(ctx, intentKey)))
  ).filter(isPresent);
  const engagedIntents = dedupeIntentsById([...ownedIntents, ...involvedIntents]);
  const requestRatings = engagedIntents
    .map((intent) => intent.reviewRating)
    .filter(isNumber);
  const sellerRatings = sellerItems
    .map((item) => item.reviewRating)
    .filter(isNumber);
  const allRatings = [...requestRatings, ...sellerRatings];
  const completionHours = engagedIntents
    .filter(
      (intent) =>
        typeof intent.startedAt === "number" && typeof intent.completedAt === "number",
    )
    .map((intent) => (intent.completedAt! - intent.startedAt!) / (1000 * 60 * 60));
  const activityBuckets = buildActivityBuckets([
    ...ownedIntents.map((intent) => intent.updatedAt),
    ...proposals.map((proposal) => proposal.createdAt),
    ...fulfillments.map((fulfillment) => extractFulfillmentTimestamp(fulfillment)),
    ...checkouts.map((checkout) => checkout.updatedAt),
    ...sellerItems.map((item) => item.updatedAt),
    ...supplies.map((supply) => supply.updatedAt ?? supply.createdAt ?? Date.now()),
  ]);

  return {
    activeCount: engagedIntents.filter(
      (intent) => intent.status === "claimed" || intent.status === "in_progress",
    ).length,
    activeSupplyCount: supplies.filter((supply) => supply.status === "active").length,
    activityBuckets,
    averageCompletionHours:
      completionHours.length > 0
        ? roundToOneDecimal(
            completionHours.reduce((sum, value) => sum + value, 0) / completionHours.length,
          )
        : undefined,
    averageRating:
      allRatings.length > 0
        ? roundToOneDecimal(allRatings.reduce((sum, value) => sum + value, 0) / allRatings.length)
        : undefined,
    blockedCount: engagedIntents.filter((intent) => intent.status === "blocked").length,
    buyerCheckoutCount: checkouts.length,
    fulfilledCount: engagedIntents.filter((intent) => intent.status === "fulfilled").length,
    grossEarned: sellerItems.reduce(
      (sum, item) => sum + (item.unitPriceAmount ?? 0) * item.quantity,
      0,
    ),
    grossSpend: checkouts.reduce((sum, checkout) => sum + checkout.subtotalAmount, 0),
    openCount: engagedIntents.filter(
      (intent) => intent.status === "open" || intent.status === "proposed",
    ).length,
    productSupplyCount: supplies.filter((supply) => supply.supplyType === "product").length,
    recentRequests: engagedIntents
      .sort((left, right) => right.updatedAt - left.updatedAt)
      .slice(0, 6)
      .map(toAnalyticsRequestPreview),
    requestCount: ownedIntents.length,
    reviewCount: allRatings.length,
    sellerOrderCount: sellerItems.length,
    supplyCount: supplies.length,
    totalHandledCount: engagedIntents.length,
    totalProposalCount: proposals.length,
    updatedAt: Date.now(),
  };
}

async function computeBorealProfileAnalytics(
  ctx: MutationCtx,
  borealUserId: string,
): Promise<StoredProfileAnalytics> {
  const [borealIntents, supplies] = await Promise.all([
    ctx.db
      .query("intents")
      .withIndex("by_provider_and_updatedAt", (queryBuilder) =>
        queryBuilder.eq("provider", "boreal-agent"),
      )
      .order("desc")
      .collect(),
    ctx.db.query("supplies").collect(),
  ]);

  const handled = dedupeIntentsById(
    borealIntents.filter((intent) => isBorealHandledIntent(intent)),
  );
  const ratings = handled
    .map((intent) => intent.reviewRating)
    .filter(isNumber);
  const completionHours = handled
    .filter(
      (intent) =>
        typeof intent.startedAt === "number" && typeof intent.completedAt === "number",
    )
    .map((intent) => (intent.completedAt! - intent.startedAt!) / (1000 * 60 * 60));
  const linkedSupplies = supplies.filter(
    (supply) => supply.supplierUserId === borealUserId || supply.brand === "Boreal",
  );

  return {
    activeCount: handled.filter(
      (intent) => intent.status === "claimed" || intent.status === "in_progress",
    ).length,
    activeSupplyCount: linkedSupplies.filter((supply) => supply.status === "active").length,
    activityBuckets: buildActivityBuckets(handled.map((intent) => intent.updatedAt)),
    averageCompletionHours:
      completionHours.length > 0
        ? roundToOneDecimal(
            completionHours.reduce((sum, value) => sum + value, 0) / completionHours.length,
          )
        : undefined,
    averageRating:
      ratings.length > 0
        ? roundToOneDecimal(ratings.reduce((sum, value) => sum + value, 0) / ratings.length)
        : undefined,
    blockedCount: handled.filter((intent) => intent.status === "blocked").length,
    buyerCheckoutCount: 0,
    fulfilledCount: handled.filter((intent) => intent.status === "fulfilled").length,
    grossEarned: 0,
    grossSpend: 0,
    openCount: handled.filter(
      (intent) => intent.status === "open" || intent.status === "proposed",
    ).length,
    productSupplyCount: linkedSupplies.filter((supply) => supply.supplyType === "product").length,
    recentRequests: handled.slice(0, 6).map(toAnalyticsRequestPreview),
    requestCount: handled.length,
    reviewCount: ratings.length,
    sellerOrderCount: 0,
    supplyCount: linkedSupplies.length,
    totalHandledCount: handled.length,
    totalProposalCount: 0,
    updatedAt: Date.now(),
  };
}

async function upsertProfileAnalytics(
  ctx: MutationCtx,
  user: {
    _id: string;
    actorKind: "agent" | "human" | "tool";
    displayName: string;
    externalId?: string;
    handle?: string;
  },
  analytics: StoredProfileAnalytics,
  overrides?: {
    bio?: string;
    capabilityTags?: string[];
    headline?: string;
    isPublic?: boolean;
    productLabels?: string[];
    skillTags?: string[];
  },
) {
  const now = Date.now();
  const existingProfile = await getProfileByUser(ctx, user._id, user.externalId);
  const displayName = user.displayName;
  const bio = overrides?.bio ?? existingProfile?.bio;
  const capabilityTags = overrides?.capabilityTags ?? existingProfile?.capabilityTags ?? [];
  const headline = overrides?.headline ?? existingProfile?.headline;
  const isPublic = overrides?.isPublic ?? existingProfile?.isPublic ?? user.actorKind === "agent";
  const productLabels = overrides?.productLabels ?? existingProfile?.productLabels ?? [];
  const skillTags = overrides?.skillTags ?? existingProfile?.skillTags ?? [];
  const searchText = buildProfileSearchText({
    bio,
    capabilityTags,
    displayName,
    handle: user.handle,
    headline,
    productLabels,
    skillTags,
  });
  const payload = {
    analytics,
    bio,
    capabilityTags,
    displayName,
    externalId: user.externalId,
    handle: user.handle,
    headline,
    isPublic,
    productLabels,
    searchText,
    skillTags,
    updatedAt: now,
    userId: user._id,
  };

  if (existingProfile) {
    await ctx.db.patch(existingProfile._id, payload);
    return existingProfile._id;
  }

  return ctx.db.insert("profiles", {
    analytics,
    availabilityStatus: "available",
    avatarUrl: undefined,
    bio,
    capabilityTags,
    createdAt: now,
    displayName,
    externalId: user.externalId,
    handle: user.handle,
    headline,
    isPublic,
    productLabels,
    searchText,
    skillTags,
    updatedAt: now,
    userId: user._id,
  });
}

async function ensureBorealUser(ctx: MutationCtx) {
  const existing = await ctx.db
    .query("users")
    .withIndex("by_externalId", (queryBuilder) =>
      queryBuilder.eq("externalId", BOREAL_AGENT_EXTERNAL_ID),
    )
    .unique();

  if (existing) {
    await ctx.db.patch(existing._id, {
      actorKind: "agent",
      displayName: BOREAL_AGENT_DISPLAY_NAME,
      handle: BOREAL_AGENT_HANDLE,
      updatedAt: Date.now(),
    });

    return {
      ...existing,
      actorKind: "agent" as const,
      displayName: BOREAL_AGENT_DISPLAY_NAME,
      handle: BOREAL_AGENT_HANDLE,
    };
  }

  const now = Date.now();
  const userId = await ctx.db.insert("users", {
    actorKind: "agent",
    createdAt: now,
    displayName: BOREAL_AGENT_DISPLAY_NAME,
    externalId: BOREAL_AGENT_EXTERNAL_ID,
    handle: BOREAL_AGENT_HANDLE,
    trustScore: 100,
    updatedAt: now,
  });

  return {
    _id: userId,
    actorKind: "agent" as const,
    displayName: BOREAL_AGENT_DISPLAY_NAME,
    externalId: BOREAL_AGENT_EXTERNAL_ID,
    handle: BOREAL_AGENT_HANDLE,
  };
}

async function getIntentByKey(
  ctx: MutationCtx | QueryCtx,
  intentKey: string,
) {
  return ctx.db
    .query("intents")
    .withIndex("by_intentKey", (queryBuilder) =>
      queryBuilder.eq("intentKey", intentKey),
    )
    .unique();
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

function dedupeIntentsById(intents: Doc<"intents">[]) {
  const unique = new Map<string, Doc<"intents">>();

  for (const intent of intents) {
    const existing = unique.get(String(intent._id));

    if (!existing || intent.updatedAt > existing.updatedAt) {
      unique.set(String(intent._id), intent);
    }
  }

  return Array.from(unique.values());
}

function toAnalyticsRequestPreview(intent: Doc<"intents">): AnalyticsRequestPreview {
  return {
    _id: String(intent._id),
    requestedOutputTypes: (intent.requestedOutputTypes ?? ["text"]) as RequestedOutputType[],
    status: intent.status,
    summary: intent.summary,
    title: intent.title,
    updatedAt: intent.updatedAt,
  };
}

function extractFulfillmentTimestamp(fulfillment: {
  _creationTime: number;
}) {
  return fulfillment._creationTime;
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

function roundToOneDecimal(value: number) {
  return Math.round(value * 10) / 10;
}

function isNumber(value: number | undefined): value is number {
  return typeof value === "number";
}

function isPresent<T>(value: T | null): value is T {
  return value !== null;
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
