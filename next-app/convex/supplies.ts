import { mutation, query, type MutationCtx } from "./_generated/server";
import { v } from "convex/values";

import { actorKindValidator, deliveryTypeValidator } from "./validators";

const defaultCatalog = [
  {
    acceptanceRate: 0.94,
    actorKind: "tool" as const,
    capabilityTags: ["image-generation", "brand-visuals", "marketing-creative"],
    category: "creative",
    deliveryType: "instant" as const,
    description:
      "Generate polished product visuals, hero art, listing images, and campaign stills from a prompt.",
    fulfillmentRate: 0.97,
    keywords: ["image", "hero", "visual", "listing", "creative", "brand"],
    matchCount: 18,
    priceAmount: 29,
    priceType: "fixed" as const,
    status: "active" as const,
    supplyType: "agent_tool" as const,
    title: "Boreal Image Studio",
    trustScore: 91,
  },
  {
    acceptanceRate: 0.92,
    actorKind: "tool" as const,
    capabilityTags: ["tts", "voiceover", "speech-generation"],
    category: "audio",
    deliveryType: "instant" as const,
    description:
      "Create spoken audio from scripts, concise answers, product narration, and announcement copy.",
    fulfillmentRate: 0.95,
    keywords: ["audio", "tts", "voice", "speech", "voiceover"],
    matchCount: 11,
    priceAmount: 12,
    priceType: "fixed" as const,
    status: "active" as const,
    supplyType: "agent_tool" as const,
    title: "Boreal Voice Forge",
    trustScore: 88,
  },
  {
    acceptanceRate: 0.81,
    actorKind: "tool" as const,
    capabilityTags: ["video-generation", "motion", "launch-assets"],
    category: "video",
    deliveryType: "async" as const,
    description:
      "Kick off short product videos, teaser clips, and motion-first promotional assets.",
    fulfillmentRate: 0.89,
    keywords: ["video", "motion", "teaser", "launch", "clip"],
    matchCount: 8,
    priceAmount: 79,
    priceType: "fixed" as const,
    status: "active" as const,
    supplyType: "agent_tool" as const,
    title: "Boreal Motion Lab",
    trustScore: 84,
  },
  {
    acceptanceRate: 0.98,
    actorKind: "agent" as const,
    capabilityTags: ["research", "routing", "requirements", "catalog"],
    category: "operations",
    deliveryType: "instant" as const,
    description:
      "Answer questions, refine briefs, search the supply catalog, and route work to the right Boreal capability.",
    fulfillmentRate: 0.99,
    keywords: ["assistant", "routing", "catalog", "research", "brief"],
    matchCount: 42,
    priceAmount: 0,
    priceType: "fixed" as const,
    status: "active" as const,
    supplyType: "capability" as const,
    title: "Boreal Routing Assistant",
    trustScore: 96,
  },
];

export const ensureDefaultCatalog = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("supplies").take(1);

    if (existing.length > 0) {
      return { created: 0 };
    }

    for (const item of defaultCatalog) {
      await ctx.db.insert("supplies", {
        ...item,
        embedding: [],
        executorUrl: undefined,
        supplierUserId: undefined,
      });
    }

    return { created: defaultCatalog.length };
  },
});

export const listCatalog = query({
  args: {
    limit: v.number(),
  },
  handler: async (ctx, args) => {
    const supplies = await ctx.db
      .query("supplies")
      .withIndex("by_status_and_trustScore", (queryBuilder) =>
        queryBuilder.eq("status", "active"),
      )
      .order("desc")
      .take(args.limit);

    return supplies.map((supply) => ({
      _id: supply._id,
      category: supply.category,
      capabilityTags: supply.capabilityTags,
      deliveryType: supply.deliveryType,
      description: supply.description,
      priceAmount: supply.priceAmount ?? null,
      priceType: supply.priceType,
      supplyType: supply.supplyType,
      title: supply.title,
      trustScore: supply.trustScore,
    }));
  },
});

export const searchCatalog = query({
  args: {
    limit: v.number(),
    query: v.string(),
  },
  handler: async (ctx, args) => {
    const trimmed = args.query.trim();

    if (!trimmed) {
      return [];
    }

    const results = await ctx.db
      .query("supplies")
      .withSearchIndex("search_description", (queryBuilder) =>
        queryBuilder.search("description", trimmed).eq("status", "active"),
      )
      .take(args.limit);

    return results.map((supply) => ({
      _id: supply._id,
      category: supply.category,
      capabilityTags: supply.capabilityTags,
      deliveryType: supply.deliveryType,
      description: supply.description,
      priceAmount: supply.priceAmount ?? null,
      priceType: supply.priceType,
      supplyType: supply.supplyType,
      title: supply.title,
      trustScore: supply.trustScore,
    }));
  },
});

export const createSupplyEntry = mutation({
  args: {
    capabilityTags: v.array(v.string()),
    category: v.string(),
    deliveryType: deliveryTypeValidator,
    description: v.string(),
    ownerActorKind: v.optional(actorKindValidator),
    ownerDisplayName: v.optional(v.string()),
    ownerExternalId: v.optional(v.string()),
    ownerHandle: v.optional(v.string()),
    priceAmount: v.optional(v.number()),
    priceType: v.union(v.literal("fixed"), v.literal("hourly"), v.literal("scoped")),
    supplyType: v.union(
      v.literal("product"),
      v.literal("capability"),
      v.literal("agent_tool"),
      v.literal("collective"),
    ),
    title: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await upsertSupplierUser(ctx, {
      displayName: args.ownerDisplayName,
      externalId: args.ownerExternalId,
      handle: args.ownerHandle,
      kind: args.ownerActorKind,
    });

    if (!user) {
      return { created: false, supplyId: null };
    }

    const keywords = Array.from(
      new Set(
        `${args.title} ${args.description} ${args.capabilityTags.join(" ")}`
          .toLowerCase()
          .split(/[^a-z0-9-]+/i)
          .filter((token) => token.length > 2),
      ),
    ).slice(0, 24);

    const existing = await ctx.db
      .query("supplies")
      .withIndex("by_supplierUserId", (queryBuilder) =>
        queryBuilder.eq("supplierUserId", user._id),
      )
      .collect();
    const matchingEntry = existing.find(
      (supply) => supply.title.toLowerCase() === args.title.trim().toLowerCase(),
    );

    const payload = {
      acceptanceRate: 0.8,
      actorKind: user.actorKind ?? "human",
      capabilityTags: args.capabilityTags,
      category: args.category.trim(),
      deliveryType: args.deliveryType,
      description: args.description.trim(),
      embedding: [],
      executorUrl: undefined,
      fulfillmentRate: 0.8,
      keywords,
      matchCount: 0,
      priceAmount: args.priceAmount,
      priceType: args.priceType,
      status: "active" as const,
      supplierUserId: user._id,
      supplyType: args.supplyType,
      title: args.title.trim(),
      trustScore: user.trustScore,
    };

    if (matchingEntry) {
      await ctx.db.patch(matchingEntry._id, payload);
      return { created: true, supplyId: matchingEntry._id };
    }

    const supplyId = await ctx.db.insert("supplies", payload);

    return { created: true, supplyId };
  },
});

async function upsertSupplierUser(
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

  const now = Date.now();
  const userId = await ctx.db.insert("users", {
    actorKind: input.kind ?? "human",
    createdAt: now,
    displayName: input.displayName ?? input.handle ?? "X user",
    externalId: input.externalId,
    handle: input.handle,
    trustScore: 50,
    updatedAt: now,
  });

  return {
    _id: userId,
    actorKind: input.kind ?? "human",
    displayName: input.displayName ?? input.handle ?? "X user",
    externalId: input.externalId,
    handle: input.handle,
    trustScore: 50,
  };
}
