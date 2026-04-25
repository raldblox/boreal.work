import { mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { v } from "convex/values";

import {
  actorKindValidator,
  checkoutProtocolValidator,
  deliveryTypeValidator,
  fulfillmentKindValidator,
  profileAvailabilityValidator,
  requestedOutputTypeValidator,
} from "./validators";
import {
  buildRankedSupplyMatches,
  getPersistedIntentMatches,
} from "./matching";

const defaultCatalog = [
  {
    acceptanceRate: 0.96,
    actorKind: "tool" as const,
    brand: "Boreal",
    capabilityTags: ["prompt-pack", "commerce", "operations", "agent-ready"],
    category: "digital goods",
    checkoutProtocol: "custom" as const,
    checkoutProvider: "boreal",
    currency: "USD",
    deliveryType: "instant" as const,
    description:
      "A downloadable prompt pack for catalog cleanup, request routing, proposal shaping, and structured operator playbooks.",
    estimatedDeliveryLabel: "Instant download",
    executorUrl: "/downloads/boreal-commerce-prompt-pack.md",
    fulfillmentKind: "digital" as const,
    fulfillmentRate: 0.99,
    isCartEnabled: true,
    keywords: ["prompt", "pack", "commerce", "agent", "catalog", "operations"],
    matchCount: 14,
    metadataJson: JSON.stringify({
      attributes: {
        fileFormat: "markdown",
        protocolReadiness: ["ucp-ready metadata", "agent-facing catalog copy"],
      },
      media: [],
      variants: [],
    }),
    priceAmount: 19,
    priceType: "fixed" as const,
    status: "active" as const,
    subtitle: "Structured prompt pack for commerce operators",
    supplyType: "product" as const,
    title: "Boreal Commerce Prompt Pack",
    trustScore: 94,
  },
  {
    acceptanceRate: 0.93,
    actorKind: "tool" as const,
    brand: "Boreal",
    capabilityTags: ["copywriting", "launch", "landing-page", "bundle"],
    category: "digital goods",
    checkoutProtocol: "custom" as const,
    checkoutProvider: "boreal",
    currency: "USD",
    deliveryType: "instant" as const,
    description:
      "A downloadable launch-copy bundle with hero sections, product value props, CTA variants, and a release email sequence.",
    estimatedDeliveryLabel: "Instant download",
    executorUrl: "/downloads/boreal-launch-copy-kit.md",
    fulfillmentKind: "digital" as const,
    fulfillmentRate: 0.97,
    isCartEnabled: true,
    keywords: ["copy", "launch", "landing", "email", "bundle", "product"],
    matchCount: 11,
    metadataJson: JSON.stringify({
      attributes: {
        fileFormat: "markdown",
        idealUseCase: "product launch messaging",
      },
      media: [],
      variants: [],
    }),
    priceAmount: 24,
    priceType: "fixed" as const,
    status: "active" as const,
    subtitle: "Ready-to-use launch messaging bundle",
    supplyType: "product" as const,
    title: "Boreal Launch Copy Kit",
    trustScore: 91,
  },
  {
    acceptanceRate: 0.9,
    actorKind: "agent" as const,
    brand: "Boreal",
    capabilityTags: ["matching", "catalog", "discovery", "audit"],
    category: "services",
    checkoutProtocol: "custom" as const,
    checkoutProvider: "boreal",
    currency: "USD",
    deliveryType: "async" as const,
    description:
      "A scoped audit of your current supply metadata, discovery quality, and ranking blind spots, delivered with concrete fixes.",
    estimatedDeliveryLabel: "2 business days",
    executorUrl: undefined,
    fulfillmentKind: "service" as const,
    fulfillmentRate: 0.92,
    isCartEnabled: true,
    keywords: ["matching", "audit", "search", "catalog", "ranking", "supply"],
    matchCount: 6,
    metadataJson: JSON.stringify({
      attributes: {
        deliverable: "markdown audit report",
        fulfillmentMode: "manual review",
      },
      media: [],
      variants: [],
    }),
    priceAmount: 149,
    priceType: "fixed" as const,
    status: "active" as const,
    subtitle: "Scoped matching and discovery audit",
    supplyType: "capability" as const,
    title: "Boreal Matching Audit",
    trustScore: 89,
  },
  {
    acceptanceRate: 0.94,
    actorKind: "tool" as const,
    brand: "Boreal",
    capabilityTags: ["image-generation", "brand-visuals", "marketing-creative"],
    category: "creative",
    checkoutProtocol: undefined,
    checkoutProvider: undefined,
    currency: "USD",
    deliveryType: "instant" as const,
    description:
      "Generate polished product visuals, hero art, listing images, and campaign stills from a prompt.",
    estimatedDeliveryLabel: "Instant generation",
    executorUrl: undefined,
    fulfillmentKind: "digital" as const,
    fulfillmentRate: 0.97,
    isCartEnabled: false,
    keywords: ["image", "hero", "visual", "listing", "creative", "brand"],
    matchCount: 18,
    metadataJson: undefined,
    priceAmount: 29,
    priceType: "fixed" as const,
    status: "active" as const,
    subtitle: "Prompt-driven image generation",
    supplyType: "agent_tool" as const,
    title: "Boreal Image Studio",
    trustScore: 91,
  },
  {
    acceptanceRate: 0.92,
    actorKind: "tool" as const,
    brand: "Boreal",
    capabilityTags: ["tts", "voiceover", "speech-generation"],
    category: "audio",
    checkoutProtocol: undefined,
    checkoutProvider: undefined,
    currency: "USD",
    deliveryType: "instant" as const,
    description:
      "Create spoken audio from scripts, concise answers, product narration, and announcement copy.",
    estimatedDeliveryLabel: "Instant generation",
    executorUrl: undefined,
    fulfillmentKind: "digital" as const,
    fulfillmentRate: 0.95,
    isCartEnabled: false,
    keywords: ["audio", "tts", "voice", "speech", "voiceover"],
    matchCount: 11,
    metadataJson: undefined,
    priceAmount: 12,
    priceType: "fixed" as const,
    status: "active" as const,
    subtitle: "Prompt-driven speech generation",
    supplyType: "agent_tool" as const,
    title: "Boreal Voice Forge",
    trustScore: 88,
  },
  {
    acceptanceRate: 0.98,
    actorKind: "agent" as const,
    brand: "Boreal",
    capabilityTags: ["research", "routing", "requirements", "catalog"],
    category: "operations",
    checkoutProtocol: undefined,
    checkoutProvider: undefined,
    currency: "USD",
    deliveryType: "instant" as const,
    description:
      "Answer questions, refine briefs, search the supply catalog, and route work to the right Boreal capability.",
    estimatedDeliveryLabel: "Instant guidance",
    executorUrl: undefined,
    fulfillmentKind: "service" as const,
    fulfillmentRate: 0.99,
    isCartEnabled: false,
    keywords: ["assistant", "routing", "catalog", "research", "brief"],
    matchCount: 42,
    metadataJson: undefined,
    priceAmount: 0,
    priceType: "fixed" as const,
    status: "active" as const,
    subtitle: "Default orchestration and routing agent",
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

    const now = Date.now();

    for (const item of defaultCatalog) {
      const outputTypes = inferOutputTypesFromSupply({
        capabilityTags: item.capabilityTags,
        description: item.description,
        title: item.title,
      });
      await ctx.db.insert("supplies", {
        ...item,
        availabilityStatus: "available",
        createdAt: now,
        embedding: [],
        outputTypes,
        searchText: buildSupplySearchText({
          ...item,
          availabilityStatus: "available",
          outputTypes,
        }),
        supplierUserId: undefined,
        updatedAt: now,
      });
    }

    return { created: defaultCatalog.length };
  },
});

export const listCatalog = query({
  args: {
    limit: v.number(),
  },
  handler: (ctx, args) => listCatalogListings(ctx, args.limit),
});

export const searchCatalog = query({
  args: {
    limit: v.number(),
    query: v.string(),
  },
  handler: (ctx, args) => searchCatalogListings(ctx, args.query, args.limit),
});

export const createSupplyEntry = mutation({
  args: {
    availabilityStatus: v.optional(profileAvailabilityValidator),
    brand: v.optional(v.string()),
    capabilityTags: v.array(v.string()),
    category: v.string(),
    checkoutProtocol: v.optional(checkoutProtocolValidator),
    checkoutProvider: v.optional(v.string()),
    currency: v.optional(v.string()),
    deliveryType: deliveryTypeValidator,
    description: v.string(),
    estimatedDeliveryLabel: v.optional(v.string()),
    exampleIntents: v.optional(v.array(v.string())),
    executorUrl: v.optional(v.string()),
    exclusions: v.optional(v.array(v.string())),
    fulfillmentKind: v.optional(fulfillmentKindValidator),
    isCartEnabled: v.optional(v.boolean()),
    maxConcurrentJobs: v.optional(v.number()),
    metadataJson: v.optional(v.string()),
    nextAvailableAt: v.optional(v.number()),
    ownerActorKind: v.optional(actorKindValidator),
    ownerDisplayName: v.optional(v.string()),
    ownerExternalId: v.optional(v.string()),
    ownerHandle: v.optional(v.string()),
    outputTypes: v.optional(v.array(requestedOutputTypeValidator)),
    priceAmount: v.optional(v.number()),
    priceMax: v.optional(v.number()),
    priceMin: v.optional(v.number()),
    priceType: v.union(v.literal("fixed"), v.literal("hourly"), v.literal("scoped")),
    responseSlaMinutes: v.optional(v.number()),
    subtitle: v.optional(v.string()),
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

    const keywords = extractKeywords(
      `${args.title} ${args.subtitle ?? ""} ${args.description} ${args.capabilityTags.join(" ")}`,
    );
    const existing = await ctx.db
      .query("supplies")
      .withIndex("by_supplierUserId", (queryBuilder) =>
        queryBuilder.eq("supplierUserId", user._id),
      )
      .collect();
    const matchingEntry = existing.find(
      (supply) => supply.title.toLowerCase() === args.title.trim().toLowerCase(),
    );
    const isCartEnabled =
      typeof args.isCartEnabled === "boolean"
        ? args.isCartEnabled
        : args.supplyType === "product" || args.supplyType === "capability";
    const fulfillmentKind =
      args.fulfillmentKind ??
      (args.supplyType === "product" || args.deliveryType === "instant"
        ? "digital"
        : "service");
    const outputTypes =
      args.outputTypes && args.outputTypes.length > 0
        ? Array.from(new Set(args.outputTypes))
        : inferOutputTypesFromSupply({
            capabilityTags: args.capabilityTags,
            description: args.description,
            title: args.title,
          });
    const now = Date.now();
    const payload = {
      acceptanceRate: 0.8,
      activeReservations: matchingEntry?.activeReservations ?? 0,
      actorKind: user.actorKind ?? "human",
      availabilityStatus: args.availabilityStatus ?? matchingEntry?.availabilityStatus ?? "available",
      brand: sanitizeOptionalText(args.brand),
      capabilityTags: normalizeTagList(args.capabilityTags),
      category: args.category.trim(),
      checkoutProtocol: args.checkoutProtocol,
      checkoutProvider: sanitizeOptionalText(args.checkoutProvider),
      currency: args.currency?.trim() || "USD",
      createdAt: matchingEntry?.createdAt ?? now,
      deliveryType: args.deliveryType,
      description: args.description.trim(),
      embedding: [],
      estimatedDeliveryLabel: sanitizeOptionalText(args.estimatedDeliveryLabel),
      exampleIntents: sanitizeStringArray(args.exampleIntents) ?? matchingEntry?.exampleIntents,
      exclusions: sanitizeStringArray(args.exclusions) ?? matchingEntry?.exclusions,
      executorUrl: sanitizeOptionalText(args.executorUrl),
      fulfillmentKind,
      fulfillmentRate: 0.8,
      isCartEnabled,
      keywords,
      maxConcurrentJobs: args.maxConcurrentJobs ?? matchingEntry?.maxConcurrentJobs,
      matchCount: matchingEntry?.matchCount ?? 0,
      metadataJson: sanitizeOptionalText(args.metadataJson),
      nextAvailableAt: args.nextAvailableAt ?? matchingEntry?.nextAvailableAt,
      outputTypes: outputTypes.length > 0 ? outputTypes : matchingEntry?.outputTypes,
      priceAmount: args.priceAmount,
      priceMax: args.priceMax ?? matchingEntry?.priceMax,
      priceMin: args.priceMin ?? matchingEntry?.priceMin,
      priceType: args.priceType,
      responseSlaMinutes: args.responseSlaMinutes ?? matchingEntry?.responseSlaMinutes,
      searchText: buildSupplySearchText({
        actorKind: user.actorKind ?? "human",
        availabilityStatus:
          args.availabilityStatus ?? matchingEntry?.availabilityStatus ?? "available",
        brand: args.brand,
        capabilityTags: args.capabilityTags,
        category: args.category.trim(),
        checkoutProtocol: args.checkoutProtocol,
        checkoutProvider: args.checkoutProvider,
        currency: args.currency?.trim() || "USD",
        deliveryType: args.deliveryType,
        description: args.description.trim(),
        estimatedDeliveryLabel: args.estimatedDeliveryLabel,
        exampleIntents: args.exampleIntents ?? matchingEntry?.exampleIntents,
        exclusions: args.exclusions ?? matchingEntry?.exclusions,
        executorUrl: args.executorUrl,
        fulfillmentKind,
        fulfillmentRate: 0.8,
        isCartEnabled,
        keywords,
        maxConcurrentJobs: args.maxConcurrentJobs ?? matchingEntry?.maxConcurrentJobs,
        matchCount: matchingEntry?.matchCount ?? 0,
        metadataJson: args.metadataJson,
        nextAvailableAt: args.nextAvailableAt ?? matchingEntry?.nextAvailableAt,
        outputTypes: outputTypes.length > 0 ? outputTypes : matchingEntry?.outputTypes,
        priceAmount: args.priceAmount,
        priceMax: args.priceMax ?? matchingEntry?.priceMax,
        priceMin: args.priceMin ?? matchingEntry?.priceMin,
        priceType: args.priceType,
        responseSlaMinutes: args.responseSlaMinutes ?? matchingEntry?.responseSlaMinutes,
        status: "active",
        subtitle: args.subtitle,
        supplyType: args.supplyType,
        title: args.title.trim(),
        trustScore: user.trustScore,
      }),
      status: "active" as const,
      subtitle: sanitizeOptionalText(args.subtitle),
      supplierUserId: user._id,
      supplyType: args.supplyType,
      title: args.title.trim(),
      trustScore: user.trustScore,
      updatedAt: now,
    };

    if (matchingEntry) {
      await ctx.db.patch(matchingEntry._id, payload);
      return { created: true, supplyId: matchingEntry._id };
    }

    const supplyId = await ctx.db.insert("supplies", payload);

    return { created: true, supplyId };
  },
});

async function mapSupplyListing(
  ctx: QueryCtx,
  supply: {
    _id: string;
    actorKind: "agent" | "human" | "tool";
    brand?: string;
    capabilityTags: string[];
    category: string;
    checkoutProtocol?: "ucp" | "acp" | "custom";
    checkoutProvider?: string;
    currency: string;
    deliveryType: "async" | "instant" | "scheduled";
    description: string;
    evidenceMode?: "none" | "receipt" | "response";
    estimatedDeliveryLabel?: string;
    executionSurface?: "registry" | "http" | "mcp" | "jsonrpc" | "sdk" | "widget" | "handoff";
    executorUrl?: string;
    fulfillmentKind: "digital" | "service" | "physical" | "hybrid";
    isCartEnabled: boolean;
    paymentNetworkHints?: string[];
    paymentProtocol?: "x402" | "mpp" | "direct-solana" | "widget" | "none";
    priceAmount?: number;
    priceType: "fixed" | "hourly" | "scoped";
    requiresHumanApproval?: boolean;
    sourceListingUrl?: string;
    sourceProviderKey?: "agentic-market" | "agentcash" | "frames" | "manual" | "moonpay" | "solana-agent-kit";
    subtitle?: string;
    supportsDirectInvoke?: boolean;
    supportsPrivyWallet?: boolean;
    supplierUserId?: string;
    supplyType: "agent_tool" | "capability" | "collective" | "product";
    title: string;
    trustScore: number;
  },
  ranking: {
    matchReasons: string[];
    matchScore: number | null;
  },
) {
  const seller = await getSupplySeller(ctx, supply.supplierUserId);
  const reviews = await getSupplyReviewSummary(ctx, supply._id);

  return {
    _id: supply._id,
    actorKind: supply.actorKind,
    averageRating: reviews.averageRating,
    brand: supply.brand ?? null,
    capabilityTags: supply.capabilityTags,
    category: supply.category,
    checkoutProtocol: supply.checkoutProtocol ?? null,
    currency: supply.currency,
    deliveryType: supply.deliveryType,
    description: supply.description,
    estimatedDeliveryLabel: supply.estimatedDeliveryLabel ?? null,
    executionSurface: supply.executionSurface ?? null,
    executorUrl: supply.executorUrl ?? null,
    fulfillmentKind: supply.fulfillmentKind,
    isCartEnabled: supply.isCartEnabled,
    matchReasons: ranking.matchReasons,
    matchScore: ranking.matchScore,
    paymentNetworkHints: supply.paymentNetworkHints ?? [],
    paymentProtocol: supply.paymentProtocol ?? null,
    priceAmount: supply.priceAmount ?? null,
    priceType: supply.priceType,
    requiresHumanApproval: supply.requiresHumanApproval ?? false,
    reviewCount: reviews.reviewCount,
    seller:
      seller ??
      (supply.brand === "Boreal"
        ? {
            actorKind: supply.actorKind,
            displayName: "Boreal Agent",
            handle: "boreal",
            profileId: "boreal-agent",
          }
        : null),
    sourceListingUrl: supply.sourceListingUrl ?? null,
    sourceProviderKey: supply.sourceProviderKey ?? null,
    subtitle: supply.subtitle ?? null,
    supplyType: supply.supplyType,
    supportsDirectInvoke: supply.supportsDirectInvoke ?? false,
    supportsPrivyWallet: supply.supportsPrivyWallet ?? false,
    title: supply.title,
    trustScore: supply.trustScore,
  };
}

export async function listCatalogListings(ctx: QueryCtx, limit: number) {
  const supplies = await ctx.db
    .query("supplies")
    .withIndex("by_status_and_trustScore", (queryBuilder) =>
      queryBuilder.eq("status", "active"),
    )
    .order("desc")
    .take(Math.max(limit * 3, 36));

  const mapped = await Promise.all(
    supplies.map((supply) =>
      mapSupplyListing(ctx, supply, { matchScore: null, matchReasons: [] }),
    ),
  );

  return mapped
    .sort((left, right) => rankCatalogListing(right) - rankCatalogListing(left))
    .slice(0, limit);
}

export async function searchCatalogListings(
  ctx: QueryCtx,
  query: string,
  limit: number,
) {
  const trimmed = query.trim();

  if (!trimmed) {
    return [];
  }

  const ranked = await buildRankedSupplyMatches(ctx, {
    body: trimmed,
    catalogQuery: trimmed,
    summary: trimmed,
    title: trimmed,
  });
  const scored = await Promise.all(
    ranked
      .filter((candidate) => candidate.gatedOutReasons.length === 0)
      .slice(0, limit * 2)
      .map((candidate) =>
        mapSupplyListing(ctx, candidate.supply, {
          matchReasons: candidate.matchReasons,
          matchScore: candidate.heuristicScore,
        }),
      ),
  );

  return scored
    .filter((item) => (item.matchScore ?? 0) > 0)
    .sort(
      (left, right) =>
        (right.matchScore ?? 0) - (left.matchScore ?? 0) ||
        rankCatalogListing(right) - rankCatalogListing(left),
    )
    .slice(0, limit);
}

export async function listIntentCatalogMatches(
  ctx: QueryCtx,
  intent: {
    _id: Id<"intents">;
    body: string;
    budgetMax?: number;
    budgetMin?: number;
    capabilityTags: string[];
    catalogQuery?: string;
    category: string;
    deadlineAt?: number;
    embedding: number[];
    intentKey: string;
    keywords: string[];
    requestedOutputTypes: Array<
      "image_generation" | "speech_generation" | "text" | "video_generation"
    >;
    summary: string;
    title: string;
  },
  limit: number,
) {
  const persisted = await getPersistedIntentMatches(ctx, {
    intentId: intent._id,
    limit: Math.max(limit * 2, 16),
  });
  const ranked =
    persisted.length > 0
      ? persisted
      : await buildRankedSupplyMatches(ctx, {
          body: intent.body,
          budgetMax: intent.budgetMax,
          budgetMin: intent.budgetMin,
          capabilityTags: intent.capabilityTags,
          catalogQuery: intent.catalogQuery,
          category: intent.category,
          deadlineAt: intent.deadlineAt,
          embedding: intent.embedding,
          intentId: intent._id,
          intentKey: intent.intentKey,
          keywords: intent.keywords,
          requestedOutputTypes: intent.requestedOutputTypes,
          summary: intent.summary,
          title: intent.title,
        });

  return Promise.all(
    ranked
      .filter((candidate) => candidate.gatedOutReasons.length === 0)
      .slice(0, limit)
      .map((candidate) =>
        mapSupplyListing(ctx, candidate.supply, {
          matchReasons: candidate.matchReasons,
          matchScore: candidate.heuristicScore,
        }),
      ),
  );
}

async function getSupplySeller(
  ctx: QueryCtx,
  supplierUserId?: string,
) {
  if (!supplierUserId) {
    return null;
  }

  const user = await getUserById(ctx, supplierUserId);

  if (!user) {
    return null;
  }

  const profile = await ctx.db
    .query("profiles")
    .withIndex("by_userId", (queryBuilder) =>
      queryBuilder.eq("userId", supplierUserId),
    )
    .unique();

  return {
    actorKind: user.actorKind,
    displayName: user.displayName,
    handle: user.handle ?? null,
    profileId: profile?._id ?? null,
  };
}

async function getSupplyReviewSummary(
  ctx: QueryCtx,
  supplyId: string,
) {
  const items = await ctx.db
    .query("checkoutItems")
    .withIndex("by_supplyId_and_createdAt", (queryBuilder) =>
      queryBuilder.eq("supplyId", supplyId as never),
    )
    .order("desc")
    .take(64);
  const rated = items.filter((item) => typeof item.reviewRating === "number");

  return {
    averageRating:
      rated.length > 0
        ? Math.round(
            (rated.reduce((sum, item) => sum + (item.reviewRating ?? 0), 0) / rated.length) *
              10,
          ) / 10
        : null,
    reviewCount: rated.length,
  };
}

function rankCatalogListing(listing: {
  averageRating: number | null;
  isCartEnabled: boolean;
  reviewCount: number;
  supplyType: string;
  trustScore: number;
}) {
  return (
    listing.trustScore +
    (listing.averageRating ?? 0) * 8 +
    Math.min(listing.reviewCount, 12) * 2 +
    (listing.isCartEnabled ? 12 : 0) +
    (listing.supplyType === "product" ? 8 : 0)
  );
}

function buildSupplySearchText(input: {
  availabilityStatus?: "available" | "limited" | "unavailable";
  actorKind: "agent" | "human" | "tool";
  brand?: string;
  capabilityTags: string[];
  category: string;
  checkoutProtocol?: "ucp" | "acp" | "custom";
  checkoutProvider?: string;
  currency: string;
  deliveryType: "async" | "instant" | "scheduled";
  description: string;
  evidenceMode?: "none" | "receipt" | "response";
  estimatedDeliveryLabel?: string;
  exampleIntents?: string[];
  exclusions?: string[];
  executionSurface?: "handoff" | "http" | "jsonrpc" | "mcp" | "registry" | "sdk" | "widget";
  executorUrl?: string;
  fulfillmentKind: "digital" | "service" | "physical" | "hybrid";
  fulfillmentRate: number;
  isCartEnabled: boolean;
  keywords: string[];
  maxConcurrentJobs?: number;
  matchCount: number;
  metadataJson?: string;
  nextAvailableAt?: number;
  outputTypes?: Array<"image_generation" | "speech_generation" | "text" | "video_generation">;
  paymentNetworkHints?: string[];
  paymentProtocol?: "direct-solana" | "mpp" | "none" | "widget" | "x402";
  priceAmount?: number;
  priceMax?: number;
  priceMin?: number;
  priceType: "fixed" | "hourly" | "scoped";
  responseSlaMinutes?: number;
  requiresHumanApproval?: boolean;
  sourceCapabilityId?: string;
  sourceListingUrl?: string;
  sourceProviderKey?: "agentic-market" | "agentcash" | "frames" | "manual" | "moonpay" | "solana-agent-kit";
  status: "active";
  subtitle?: string;
  supplyType: "agent_tool" | "capability" | "collective" | "product";
  supportsDirectInvoke?: boolean;
  supportsPrivyWallet?: boolean;
  title: string;
  trustScore: number;
}) {
  return [
    input.title,
    input.subtitle,
    input.brand,
    input.category,
    input.description,
    input.deliveryType,
    input.fulfillmentKind,
    input.supplyType,
    input.currency,
    input.checkoutProtocol,
    input.checkoutProvider,
    input.availabilityStatus,
    input.paymentProtocol,
    input.sourceProviderKey,
    input.sourceListingUrl,
    input.estimatedDeliveryLabel,
    input.executorUrl,
    input.actorKind,
    input.priceType,
    input.executionSurface,
    input.evidenceMode,
    input.supportsDirectInvoke ? "direct invoke" : undefined,
    input.supportsPrivyWallet ? "privy wallet" : undefined,
    input.requiresHumanApproval ? "approval required" : undefined,
    input.isCartEnabled ? "cart checkout buy purchase order" : "tool capability",
    String(input.priceAmount ?? ""),
    String(input.priceMin ?? ""),
    String(input.priceMax ?? ""),
    String(input.responseSlaMinutes ?? ""),
    String(input.maxConcurrentJobs ?? ""),
    String(input.nextAvailableAt ?? ""),
    String(input.trustScore),
    String(input.fulfillmentRate),
    String(input.matchCount),
    input.sourceCapabilityId,
    ...(input.paymentNetworkHints ?? []),
    ...(input.outputTypes ?? []),
    ...input.capabilityTags,
    ...(input.exampleIntents ?? []),
    ...(input.exclusions ?? []),
    ...input.keywords,
    input.metadataJson,
  ]
    .filter(Boolean)
    .join(" ");
}

function normalizeTagList(values: string[]) {
  return Array.from(
    new Set(
      values
        .map((value) => value.trim())
        .filter(Boolean),
    ),
  ).slice(0, 24);
}

function extractKeywords(value: string) {
  return Array.from(
    new Set(
      value
        .toLowerCase()
        .split(/[^a-z0-9-]+/i)
        .filter((token) => token.length > 2),
    ),
  ).slice(0, 48);
}

function sanitizeOptionalText(value?: string) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function sanitizeStringArray(values?: string[]) {
  if (!values || values.length === 0) {
    return undefined;
  }

  const normalized = Array.from(
    new Set(
      values
        .map((value) => value.trim())
        .filter(Boolean),
    ),
  ).slice(0, 24);

  return normalized.length > 0 ? normalized : undefined;
}

function inferOutputTypesFromSupply(input: {
  capabilityTags: string[];
  description: string;
  title: string;
}) {
  const haystack = `${input.title} ${input.description} ${input.capabilityTags.join(" ")}`.toLowerCase();
  const outputTypes: Array<"image_generation" | "speech_generation" | "text" | "video_generation"> = [];

  if (haystack.includes("image")) {
    outputTypes.push("image_generation");
  }

  if (haystack.includes("audio") || haystack.includes("voice") || haystack.includes("speech")) {
    outputTypes.push("speech_generation");
  }

  if (haystack.includes("video")) {
    outputTypes.push("video_generation");
  }

  if (outputTypes.length === 0 || haystack.includes("text") || haystack.includes("markdown")) {
    outputTypes.push("text");
  }

  return Array.from(new Set(outputTypes));
}

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
        handle?: string;
      }
    | null;
}
