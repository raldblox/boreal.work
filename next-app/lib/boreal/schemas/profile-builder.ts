import type { MyProfileRecord } from "@/lib/boreal/integrations/convex/function-refs";

export type ProfileAvailabilityStatus = "available" | "limited" | "unavailable";
export type BuilderSupplyType = "agent_tool" | "capability" | "collective" | "product";
export type BuilderDeliveryType = "async" | "instant" | "scheduled";
export type BuilderPriceType = "fixed" | "hourly" | "scoped";
export type ProfileBuilderListingPath = "product" | "provider_sync" | "service";

export type ProfileBuilderDraft = {
  listing: {
    capabilityTags: string[];
    category: string;
    deliveryType: BuilderDeliveryType;
    description: string;
    enabled: boolean;
    estimatedDeliveryLabel: string;
    priceAmount: number | null;
    priceType: BuilderPriceType;
    subtitle: string;
    supplyType: BuilderSupplyType;
    title: string;
  };
  profile: {
    availabilityStatus: ProfileAvailabilityStatus;
    bio: string;
    capabilityTags: string[];
    displayName: string;
    headline: string;
    isPublic: boolean;
    productLabels: string[];
    skillTags: string[];
  };
};

export function createEmptyProfileBuilderDraft(displayName = ""): ProfileBuilderDraft {
  return {
    listing: {
      capabilityTags: [],
      category: "services",
      deliveryType: "async",
      description: "",
      enabled: false,
      estimatedDeliveryLabel: "",
      priceAmount: null,
      priceType: "scoped",
      subtitle: "",
      supplyType: "capability",
      title: "",
    },
    profile: {
      availabilityStatus: "available",
      bio: "",
      capabilityTags: [],
      displayName,
      headline: "",
      isPublic: true,
      productLabels: [],
      skillTags: [],
    },
  };
}

export function cloneProfileBuilderDraft(draft: ProfileBuilderDraft): ProfileBuilderDraft {
  return {
    listing: {
      ...draft.listing,
      capabilityTags: [...draft.listing.capabilityTags],
    },
    profile: {
      ...draft.profile,
      capabilityTags: [...draft.profile.capabilityTags],
      productLabels: [...draft.profile.productLabels],
      skillTags: [...draft.profile.skillTags],
    },
  };
}

export function buildProfileBuilderDraftFromRecord(
  record: MyProfileRecord | null,
  input?: {
    supplyId?: string | null;
  },
): ProfileBuilderDraft {
  if (!record) {
    return createEmptyProfileBuilderDraft();
  }

  const selectedSupply = input?.supplyId
    ? record.supplies.find((supply) => supply._id === input.supplyId) ?? null
    : null;
  const primarySupply =
    selectedSupply ??
    record.supplies.find((supply) => isEditableProfileBuilderSupply(supply)) ??
    null;

  return {
    listing: {
      capabilityTags: normalizeTagList(
        primarySupply?.capabilityTags ?? record.profile.capabilityTags,
      ),
      category: primarySupply?.category ?? "services",
      deliveryType: normalizeDeliveryType(primarySupply?.deliveryType),
      description: primarySupply?.description ?? "",
      enabled: Boolean(primarySupply),
      estimatedDeliveryLabel: primarySupply?.estimatedDeliveryLabel ?? "",
      priceAmount:
        typeof primarySupply?.priceAmount === "number" && Number.isFinite(primarySupply.priceAmount)
          ? primarySupply.priceAmount
          : null,
      priceType: normalizePriceType(primarySupply?.priceType),
      subtitle: primarySupply?.subtitle ?? "",
      supplyType: normalizeSupplyType(primarySupply?.supplyType),
      title: primarySupply?.title ?? "",
    },
    profile: {
      availabilityStatus: record.profile.availabilityStatus,
      bio: record.profile.bio,
      capabilityTags: normalizeTagList(record.profile.capabilityTags),
      displayName: record.profile.displayName || record.user.displayName,
      headline: record.profile.headline,
      isPublic: record.profile.isPublic,
      productLabels: normalizeTagList(record.profile.productLabels),
      skillTags: normalizeTagList(record.profile.skillTags),
    },
  };
}

function isEditableProfileBuilderSupply(
  supply: NonNullable<MyProfileRecord>["supplies"][number],
) {
  return !supply.sourceProviderKey || supply.sourceProviderKey === "manual";
}

export function mergeProfileBuilderDraft(
  base: ProfileBuilderDraft,
  incoming: Partial<ProfileBuilderDraft>,
): ProfileBuilderDraft {
  return normalizeProfileBuilderDraft(incoming, { current: base });
}

export function normalizeProfileBuilderDraft(
  rawDraft: unknown,
  input?: {
    current?: ProfileBuilderDraft;
    displayName?: string;
  },
): ProfileBuilderDraft {
  const base = input?.current
    ? cloneProfileBuilderDraft(input.current)
    : createEmptyProfileBuilderDraft(input?.displayName);
  const raw = isRecord(rawDraft) ? rawDraft : {};
  const rawProfile = isRecord(raw.profile) ? raw.profile : {};
  const rawListing = isRecord(raw.listing) ? raw.listing : {};

  return {
    listing: {
      capabilityTags: normalizeTagList(rawListing.capabilityTags, base.listing.capabilityTags),
      category: normalizeText(rawListing.category, base.listing.category, 80),
      deliveryType: normalizeDeliveryType(rawListing.deliveryType, base.listing.deliveryType),
      description: normalizeText(rawListing.description, base.listing.description, 1200),
      enabled: normalizeBoolean(rawListing.enabled, base.listing.enabled),
      estimatedDeliveryLabel: normalizeText(
        rawListing.estimatedDeliveryLabel,
        base.listing.estimatedDeliveryLabel,
        120,
      ),
      priceAmount: normalizeNullableNumber(rawListing.priceAmount, base.listing.priceAmount),
      priceType: normalizePriceType(rawListing.priceType, base.listing.priceType),
      subtitle: normalizeText(rawListing.subtitle, base.listing.subtitle, 160),
      supplyType: normalizeSupplyType(rawListing.supplyType, base.listing.supplyType),
      title: normalizeText(rawListing.title, base.listing.title, 140),
    },
    profile: {
      availabilityStatus: normalizeAvailabilityStatus(
        rawProfile.availabilityStatus,
        base.profile.availabilityStatus,
      ),
      bio: normalizeText(rawProfile.bio, base.profile.bio, 1600),
      capabilityTags: normalizeTagList(rawProfile.capabilityTags, base.profile.capabilityTags),
      displayName: normalizeText(rawProfile.displayName, base.profile.displayName, 120),
      headline: normalizeText(rawProfile.headline, base.profile.headline, 180),
      isPublic: normalizeBoolean(rawProfile.isPublic, base.profile.isPublic),
      productLabels: normalizeTagList(rawProfile.productLabels, base.profile.productLabels),
      skillTags: normalizeTagList(rawProfile.skillTags, base.profile.skillTags),
    },
  };
}

export function hasSavableProfileBuilderDraft(draft: ProfileBuilderDraft) {
  return draft.profile.headline.trim().length > 0 || draft.profile.bio.trim().length > 0;
}

export function hasPublishableSupplyListing(draft: ProfileBuilderDraft) {
  return (
    draft.listing.enabled &&
    draft.listing.title.trim().length > 0 &&
    draft.listing.description.trim().length > 0 &&
    draft.listing.category.trim().length > 0
  );
}

export function detectProfileBuilderListingPath(
  draft: ProfileBuilderDraft,
): ProfileBuilderListingPath {
  return draft.listing.supplyType === "product" ? "product" : "service";
}

export function applyProfileBuilderListingPath(
  draft: ProfileBuilderDraft,
  path: Exclude<ProfileBuilderListingPath, "provider_sync">,
): ProfileBuilderDraft {
  const next = cloneProfileBuilderDraft(draft);

  next.listing.enabled = true;

  if (path === "product") {
    next.listing.category = "digital products";
    next.listing.deliveryType = "instant";
    next.listing.priceType = "fixed";
    next.listing.supplyType = "product";

    if (next.listing.estimatedDeliveryLabel.trim().length === 0) {
      next.listing.estimatedDeliveryLabel = "Instant download";
    }

    return next;
  }

  next.listing.category = "services";
  next.listing.deliveryType = "async";
  next.listing.priceType = "scoped";
  next.listing.supplyType = "capability";

  if (next.listing.estimatedDeliveryLabel.trim() === "Instant download") {
    next.listing.estimatedDeliveryLabel = "";
  }

  return next;
}

export function profileBuilderToProfileMutationInput(
  draft: ProfileBuilderDraft,
  owner: {
    displayName?: string;
    externalId?: string;
    handle?: string;
  },
) {
  return {
    availabilityStatus: draft.profile.availabilityStatus,
    bio: draft.profile.bio.trim() || undefined,
    capabilityTags: normalizeTagList(draft.profile.capabilityTags),
    headline: draft.profile.headline.trim() || undefined,
    isPublic: draft.profile.isPublic,
    ownerDisplayName: owner.displayName,
    ownerExternalId: owner.externalId,
    ownerHandle: owner.handle,
    productLabels: normalizeTagList(draft.profile.productLabels),
    skillTags: normalizeTagList(draft.profile.skillTags),
  };
}

export function profileBuilderToSupplyMutationInput(
  draft: ProfileBuilderDraft,
  owner: {
    displayName?: string;
    externalId?: string;
    handle?: string;
  },
) {
  if (!hasPublishableSupplyListing(draft)) {
    return null;
  }

  return {
    capabilityTags: normalizeTagList(
      draft.listing.capabilityTags.length > 0
        ? draft.listing.capabilityTags
        : draft.profile.capabilityTags,
    ),
    category: draft.listing.category.trim(),
    deliveryType: draft.listing.deliveryType,
    description: draft.listing.description.trim(),
    estimatedDeliveryLabel: draft.listing.estimatedDeliveryLabel.trim() || undefined,
    ownerDisplayName: owner.displayName,
    ownerExternalId: owner.externalId,
    ownerHandle: owner.handle,
    priceAmount:
      typeof draft.listing.priceAmount === "number" && Number.isFinite(draft.listing.priceAmount)
        ? draft.listing.priceAmount
        : undefined,
    priceType: draft.listing.priceType,
    subtitle: draft.listing.subtitle.trim() || undefined,
    supplyType: draft.listing.supplyType,
    title: draft.listing.title.trim(),
  };
}

export function parseTagInput(value: string) {
  return normalizeTagList(value.split(","));
}

export function formatTagInput(values: string[]) {
  return normalizeTagList(values).join(", ");
}

function normalizeTagList(values: unknown, fallback: string[] = []) {
  if (!Array.isArray(values)) {
    return [...fallback];
  }

  return Array.from(
    new Set(
      values
        .filter((value): value is string => typeof value === "string")
        .map((value) => value.trim())
        .filter(Boolean),
    ),
  ).slice(0, 16);
}

function normalizeText(value: unknown, fallback = "", maxLength = 240) {
  if (typeof value !== "string") {
    return fallback;
  }

  return value.trim().slice(0, maxLength);
}

function normalizeBoolean(value: unknown, fallback: boolean) {
  return typeof value === "boolean" ? value : fallback;
}

function normalizeNullableNumber(value: unknown, fallback: number | null) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return fallback;
  }

  return value;
}

function normalizeAvailabilityStatus(
  value: unknown,
  fallback: ProfileAvailabilityStatus = "available",
): ProfileAvailabilityStatus {
  if (value === "limited" || value === "unavailable" || value === "available") {
    return value;
  }

  return fallback;
}

function normalizeSupplyType(
  value: unknown,
  fallback: BuilderSupplyType = "capability",
): BuilderSupplyType {
  if (
    value === "agent_tool" ||
    value === "capability" ||
    value === "collective" ||
    value === "product"
  ) {
    return value;
  }

  return fallback;
}

function normalizeDeliveryType(
  value: unknown,
  fallback: BuilderDeliveryType = "async",
): BuilderDeliveryType {
  if (value === "instant" || value === "scheduled" || value === "async") {
    return value;
  }

  return fallback;
}

function normalizePriceType(
  value: unknown,
  fallback: BuilderPriceType = "scoped",
): BuilderPriceType {
  if (value === "fixed" || value === "hourly" || value === "scoped") {
    return value;
  }

  return fallback;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}
