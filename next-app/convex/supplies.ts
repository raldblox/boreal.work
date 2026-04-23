import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

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

