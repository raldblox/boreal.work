export type ProfileBuilderDraft = {
  availabilityStatus: "available" | "limited" | "unavailable";
  bio: string;
  capabilityTagsText: string;
  deliveryType: "async" | "instant" | "scheduled";
  estimatedDeliveryLabel: string;
  headline: string;
  listingCategory: string;
  listingDescription: string;
  listingPriceAmount: string;
  listingPriceType: "fixed" | "hourly" | "scoped";
  listingSubtitle: string;
  listingSupplyType: "agent_tool" | "capability" | "collective" | "product";
  listingTitle: string;
  productLabelsText: string;
  skillTagsText: string;
  sourcePrompt: string;
};

type ExistingProfileSnapshot = {
  profile?: {
    availabilityStatus?: "available" | "limited" | "unavailable";
    bio?: string;
    capabilityTags?: string[];
    headline?: string;
    productLabels?: string[];
    skillTags?: string[];
  } | null;
  supplies?: Array<{
    category?: string;
    description?: string;
    priceAmount?: number | null;
    priceType?: "fixed" | "hourly" | "scoped";
    title?: string;
  }>;
} | null;

type DraftSeed = {
  availabilityStatus?: "available" | "limited" | "unavailable";
  bio?: string;
  capabilityTags?: string[];
  deliveryType?: "async" | "instant" | "scheduled";
  estimatedDeliveryLabel?: string;
  headline?: string;
  listingCategory?: string;
  listingDescription?: string;
  listingPriceAmount?: number | null;
  listingPriceType?: "fixed" | "hourly" | "scoped";
  listingSubtitle?: string;
  listingSupplyType?: "agent_tool" | "capability" | "collective" | "product";
  listingTitle?: string;
  productLabels?: string[];
  skillTags?: string[];
  sourcePrompt?: string;
};

export function emptyProfileBuilderDraft(sourcePrompt = ""): ProfileBuilderDraft {
  return {
    availabilityStatus: "available",
    bio: "",
    capabilityTagsText: "",
    deliveryType: "async",
    estimatedDeliveryLabel: "",
    headline: "",
    listingCategory: "",
    listingDescription: "",
    listingPriceAmount: "",
    listingPriceType: "fixed",
    listingSubtitle: "",
    listingSupplyType: "capability",
    listingTitle: "",
    productLabelsText: "",
    skillTagsText: "",
    sourcePrompt,
  };
}

export function profileBuilderDraftFromExistingProfile(
  existing: ExistingProfileSnapshot,
  sourcePrompt = "",
): ProfileBuilderDraft {
  const latestSupply = existing?.supplies?.[0];

  return {
    availabilityStatus: existing?.profile?.availabilityStatus ?? "available",
    bio: existing?.profile?.bio ?? "",
    capabilityTagsText: joinTagList(existing?.profile?.capabilityTags),
    deliveryType: "async",
    estimatedDeliveryLabel: "",
    headline: existing?.profile?.headline ?? "",
    listingCategory: latestSupply?.category ?? "",
    listingDescription: latestSupply?.description ?? "",
    listingPriceAmount:
      typeof latestSupply?.priceAmount === "number" ? String(latestSupply.priceAmount) : "",
    listingPriceType: latestSupply?.priceType ?? "fixed",
    listingSubtitle: "",
    listingSupplyType: "capability",
    listingTitle: latestSupply?.title ?? "",
    productLabelsText: joinTagList(existing?.profile?.productLabels),
    skillTagsText: joinTagList(existing?.profile?.skillTags),
    sourcePrompt,
  };
}

export function mergeProfileBuilderDraft(
  current: ProfileBuilderDraft,
  incoming?: Partial<ProfileBuilderDraft> | null,
) {
  if (!incoming) {
    return current;
  }

  return {
    ...current,
    ...Object.fromEntries(
      Object.entries(incoming).filter(([, value]) => value !== undefined && value !== null),
    ),
  } as ProfileBuilderDraft;
}

export function profileBuilderDraftFromSeed(
  seed: DraftSeed,
  fallbackSourcePrompt = "",
): ProfileBuilderDraft {
  return {
    availabilityStatus: seed.availabilityStatus ?? "available",
    bio: seed.bio ?? "",
    capabilityTagsText: joinTagList(seed.capabilityTags),
    deliveryType: seed.deliveryType ?? "async",
    estimatedDeliveryLabel: seed.estimatedDeliveryLabel ?? "",
    headline: seed.headline ?? "",
    listingCategory: seed.listingCategory ?? "",
    listingDescription: seed.listingDescription ?? "",
    listingPriceAmount:
      typeof seed.listingPriceAmount === "number" ? String(seed.listingPriceAmount) : "",
    listingPriceType: seed.listingPriceType ?? "fixed",
    listingSubtitle: seed.listingSubtitle ?? "",
    listingSupplyType: seed.listingSupplyType ?? "capability",
    listingTitle: seed.listingTitle ?? "",
    productLabelsText: joinTagList(seed.productLabels),
    skillTagsText: joinTagList(seed.skillTags),
    sourcePrompt: seed.sourcePrompt ?? fallbackSourcePrompt,
  };
}

export function profileBuilderToProfileMutationArgs(input: {
  draft: ProfileBuilderDraft;
  ownerDisplayName?: string;
  ownerExternalId?: string;
  ownerHandle?: string;
}) {
  return {
    availabilityStatus: input.draft.availabilityStatus,
    bio: normalizeOptionalText(input.draft.bio),
    capabilityTags: parseTagText(input.draft.capabilityTagsText),
    headline: normalizeOptionalText(input.draft.headline),
    isPublic: true,
    ownerDisplayName: input.ownerDisplayName,
    ownerExternalId: input.ownerExternalId,
    ownerHandle: input.ownerHandle,
    productLabels: parseTagText(input.draft.productLabelsText),
    skillTags: parseTagText(input.draft.skillTagsText),
  };
}

export function profileBuilderToSupplyMutationArgs(input: {
  draft: ProfileBuilderDraft;
  ownerDisplayName?: string;
  ownerExternalId?: string;
  ownerHandle?: string;
}) {
  return {
    category: normalizeOptionalText(input.draft.listingCategory) ?? "general",
    deliveryType: input.draft.deliveryType,
    description:
      normalizeOptionalText(input.draft.listingDescription) ??
      "Public supply listing published from Boreal public setup workspace.",
    estimatedDeliveryLabel: normalizeOptionalText(input.draft.estimatedDeliveryLabel),
    ownerDisplayName: input.ownerDisplayName,
    ownerExternalId: input.ownerExternalId,
    ownerHandle: input.ownerHandle,
    priceAmount: parseNumber(input.draft.listingPriceAmount),
    priceType: input.draft.listingPriceType,
    subtitle: normalizeOptionalText(input.draft.listingSubtitle),
    supplyType: input.draft.listingSupplyType,
    title: normalizeOptionalText(input.draft.listingTitle) ?? "Public supply listing",
    capabilityTags: Array.from(
      new Set([
        ...parseTagText(input.draft.capabilityTagsText),
        ...parseTagText(input.draft.skillTagsText),
        ...parseTagText(input.draft.productLabelsText),
      ]),
    ).slice(0, 16),
  };
}

export function hasUsableSupplyDraft(draft: ProfileBuilderDraft) {
  return Boolean(
    draft.listingTitle.trim().length > 0 ||
      draft.listingDescription.trim().length > 0,
  );
}

export function parseTagText(value: string) {
  return Array.from(
    new Set(
      value
        .split(/[\n,]/)
        .map((entry) => entry.trim())
        .filter(Boolean),
    ),
  ).slice(0, 16);
}

export function joinTagList(values?: string[]) {
  return values && values.length > 0 ? values.join(", ") : "";
}

function parseNumber(value: string) {
  const parsed = Number.parseFloat(value.trim());
  return Number.isFinite(parsed) ? parsed : undefined;
}

function normalizeOptionalText(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}
