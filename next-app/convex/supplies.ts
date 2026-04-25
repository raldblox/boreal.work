import { mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server";
import { v } from "convex/values";

import {
  actorKindValidator,
  checkoutProtocolValidator,
  deliveryTypeValidator,
  fulfillmentKindValidator,
} from "./validators";

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

    for (const item of defaultCatalog) {
      await ctx.db.insert("supplies", {
        ...item,
        embedding: [],
        searchText: buildSupplySearchText(item),
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
    brand: v.optional(v.string()),
    capabilityTags: v.array(v.string()),
    category: v.string(),
    checkoutProtocol: v.optional(checkoutProtocolValidator),
    checkoutProvider: v.optional(v.string()),
    currency: v.optional(v.string()),
    deliveryType: deliveryTypeValidator,
    description: v.string(),
    estimatedDeliveryLabel: v.optional(v.string()),
    executorUrl: v.optional(v.string()),
    fulfillmentKind: v.optional(fulfillmentKindValidator),
    isCartEnabled: v.optional(v.boolean()),
    metadataJson: v.optional(v.string()),
    ownerActorKind: v.optional(actorKindValidator),
    ownerDisplayName: v.optional(v.string()),
    ownerExternalId: v.optional(v.string()),
    ownerHandle: v.optional(v.string()),
    priceAmount: v.optional(v.number()),
    priceType: v.union(v.literal("fixed"), v.literal("hourly"), v.literal("scoped")),
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
    const payload = {
      acceptanceRate: 0.8,
      actorKind: user.actorKind ?? "human",
      brand: sanitizeOptionalText(args.brand),
      capabilityTags: normalizeTagList(args.capabilityTags),
      category: args.category.trim(),
      checkoutProtocol: args.checkoutProtocol,
      checkoutProvider: sanitizeOptionalText(args.checkoutProvider),
      currency: args.currency?.trim() || "USD",
      deliveryType: args.deliveryType,
      description: args.description.trim(),
      embedding: [],
      estimatedDeliveryLabel: sanitizeOptionalText(args.estimatedDeliveryLabel),
      executorUrl: sanitizeOptionalText(args.executorUrl),
      fulfillmentKind,
      fulfillmentRate: 0.8,
      isCartEnabled,
      keywords,
      matchCount: 0,
      metadataJson: sanitizeOptionalText(args.metadataJson),
      priceAmount: args.priceAmount,
      priceType: args.priceType,
      searchText: buildSupplySearchText({
        actorKind: user.actorKind ?? "human",
        brand: args.brand,
        capabilityTags: args.capabilityTags,
        category: args.category.trim(),
        checkoutProtocol: args.checkoutProtocol,
        checkoutProvider: args.checkoutProvider,
        currency: args.currency?.trim() || "USD",
        deliveryType: args.deliveryType,
        description: args.description.trim(),
        estimatedDeliveryLabel: args.estimatedDeliveryLabel,
        executorUrl: args.executorUrl,
        fulfillmentKind,
        fulfillmentRate: 0.8,
        isCartEnabled,
        keywords,
        matchCount: 0,
        metadataJson: args.metadataJson,
        priceAmount: args.priceAmount,
        priceType: args.priceType,
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

  const searchResults = await ctx.db
    .query("supplies")
    .withSearchIndex("search_market", (queryBuilder) =>
      queryBuilder.search("searchText", trimmed).eq("status", "active"),
    )
    .take(Math.max(limit * 6, 36));
  const fallback = await ctx.db
    .query("supplies")
    .withIndex("by_status_and_trustScore", (queryBuilder) =>
      queryBuilder.eq("status", "active"),
    )
    .order("desc")
    .take(36);
  const candidates = dedupeSuppliesById([...searchResults, ...fallback]);
  const scored = await Promise.all(
    candidates.map(async (supply) => {
      const ranking = rankSupplyMatch(trimmed, supply);
      return mapSupplyListing(ctx, supply, ranking);
    }),
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

function rankSupplyMatch(
  query: string,
  supply: {
    capabilityTags: string[];
    category: string;
    deliveryType: "async" | "instant" | "scheduled";
    description: string;
    fulfillmentKind: "digital" | "service" | "physical" | "hybrid";
    keywords: string[];
    priceAmount?: number;
    subtitle?: string;
    supplyType: "agent_tool" | "capability" | "collective" | "product";
    title: string;
    trustScore: number;
  },
) {
  const tokens = extractKeywords(query);
  let score = 0;
  const reasons: string[] = [];
  const haystacks = {
    title: tokenize(supply.title),
    subtitle: tokenize(supply.subtitle ?? ""),
    description: tokenize(supply.description),
    category: tokenize(supply.category),
    capabilities: supply.capabilityTags.flatMap((value) => tokenize(value)),
    keywords: supply.keywords.flatMap((value) => tokenize(value)),
  };
  const titleHits = countOverlap(tokens, haystacks.title);
  const capabilityHits = countOverlap(tokens, haystacks.capabilities);
  const keywordHits = countOverlap(tokens, haystacks.keywords);
  const categoryHits = countOverlap(tokens, haystacks.category);
  const descriptionHits = countOverlap(tokens, haystacks.description) + countOverlap(tokens, haystacks.subtitle);

  if (titleHits > 0) {
    score += titleHits * 18;
    reasons.push("title match");
  }

  if (capabilityHits > 0) {
    score += capabilityHits * 14;
    reasons.push("capability fit");
  }

  if (keywordHits > 0) {
    score += keywordHits * 10;
    reasons.push("keyword overlap");
  }

  if (categoryHits > 0) {
    score += categoryHits * 8;
    reasons.push("category match");
  }

  if (descriptionHits > 0) {
    score += Math.min(descriptionHits * 4, 16);
    reasons.push("description fit");
  }

  if (tokens.some((token) => ["download", "digital", "template", "pack"].includes(token))) {
    if (supply.fulfillmentKind === "digital") {
      score += 8;
      reasons.push("digital delivery");
    }
    if (supply.supplyType === "product") {
      score += 6;
      reasons.push("product listing");
    }
  }

  if (tokens.some((token) => ["service", "audit", "help", "done-for-you"].includes(token))) {
    if (supply.fulfillmentKind === "service") {
      score += 8;
      reasons.push("service fit");
    }
    if (supply.deliveryType === "async" || supply.deliveryType === "scheduled") {
      score += 4;
    }
  }

  if (tokens.some((token) => ["instant", "now", "immediate"].includes(token))) {
    if (supply.deliveryType === "instant") {
      score += 6;
      reasons.push("instant delivery");
    }
  }

  if (typeof supply.priceAmount === "number") {
    score += Math.min(8, Math.round(Math.max(0, 120 - supply.priceAmount) / 20));
  }

  score += Math.round(supply.trustScore / 10);

  return {
    matchReasons: Array.from(new Set(reasons)).slice(0, 3),
    matchScore: Math.max(0, Math.min(100, score)),
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
  executionSurface?: "handoff" | "http" | "jsonrpc" | "mcp" | "registry" | "sdk" | "widget";
  executorUrl?: string;
  fulfillmentKind: "digital" | "service" | "physical" | "hybrid";
  fulfillmentRate: number;
  isCartEnabled: boolean;
  keywords: string[];
  matchCount: number;
  metadataJson?: string;
  paymentNetworkHints?: string[];
  paymentProtocol?: "direct-solana" | "mpp" | "none" | "widget" | "x402";
  priceAmount?: number;
  priceType: "fixed" | "hourly" | "scoped";
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
    String(input.trustScore),
    String(input.fulfillmentRate),
    String(input.matchCount),
    input.sourceCapabilityId,
    ...(input.paymentNetworkHints ?? []),
    ...input.capabilityTags,
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

function dedupeSuppliesById<
  T extends { _id: string },
>(supplies: T[]) {
  const seen = new Map<string, T>();

  for (const supply of supplies) {
    if (!seen.has(supply._id)) {
      seen.set(supply._id, supply);
    }
  }

  return Array.from(seen.values());
}

function tokenize(value: string) {
  return extractKeywords(value);
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

function countOverlap(source: string[], target: string[]) {
  const targetSet = new Set(target);
  return source.filter((token) => targetSet.has(token)).length;
}

function sanitizeOptionalText(value?: string) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
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
