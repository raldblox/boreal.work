import type { NormalizedCapability } from "../types";

export function normalizedCapabilityToSupply(capability: NormalizedCapability) {
  const metadata = {
    endpoint: capability.endpoint ?? null,
    evidence: capability.evidence,
    raw: capability.raw ?? null,
    walletRequirements: capability.walletRequirements,
  };

  return {
    acceptanceRate: 0.82,
    activeReservations: 0,
    actorKind: "tool" as const,
    availabilityStatus: "available" as const,
    brand: titleizeProviderKey(capability.sourceProvider),
    capabilityTags: capability.capabilityTags.slice(0, 24),
    category: capability.category,
    checkoutProtocol: "custom" as const,
    checkoutProvider: titleizeProviderKey(capability.sourceProvider),
    currency: capability.pricing.currency ?? "USDC",
    deliveryType: capability.supportsDirectInvoke ? ("instant" as const) : ("async" as const),
    description: capability.description,
    embedding: [],
    estimatedDeliveryLabel: capability.supportsDirectInvoke
      ? "On-demand invocation"
      : "Requires follow-up",
    evidenceMode: capability.evidence.returnsReceipt
      ? ("receipt" as const)
      : capability.supportsDirectInvoke
        ? ("response" as const)
        : ("none" as const),
    executionSurface: capability.executionSurface,
    executorUrl: capability.endpoint?.url,
    fulfillmentKind: "digital" as const,
    fulfillmentRate: 0.78,
    isCartEnabled: true,
    keywords: capability.keywords.slice(0, 48),
    maxConcurrentJobs: capability.supportsDirectInvoke ? 8 : 2,
    mcpServerUrl: capability.endpoint?.mcpServerUrl,
    metadataJson: JSON.stringify(metadata),
    nextAvailableAt: undefined,
    openApiUrl: undefined,
    outputTypes: inferOutputTypes(capability),
    paymentNetworkHints: capability.paymentNetworkHints,
    paymentProtocol: capability.paymentProtocol,
    priceAmount: capability.pricing.amount,
    priceMax: capability.pricing.amount,
    priceMin: capability.pricing.amount,
    priceRawJson: capability.pricing.raw
      ? JSON.stringify(capability.pricing.raw)
      : undefined,
    priceType: "fixed" as const,
    responseSlaMinutes: capability.supportsDirectInvoke ? 5 : 120,
    requiresHumanApproval: capability.requiresHumanApproval,
    routingTier: capability.routingTier,
    schemaUrl: undefined,
    sourceCapabilityId: capability.sourceCapabilityId,
    sourceListingUrl: capability.sourceUrl,
    sourceProviderKey: capability.sourceProvider,
    sourceProviderUrl: capability.sourceProviderUrl,
    status: "active" as const,
    subtitle: capability.subtitle,
    supplyType: "capability" as const,
    supportsDirectInvoke: capability.supportsDirectInvoke,
    supportsPrivyWallet: capability.supportsPrivyWallet,
    title: capability.title,
    trustScore: capability.supportsDirectInvoke ? 72 : 64,
  };
}

function titleizeProviderKey(value: string) {
  return value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function inferOutputTypes(capability: NormalizedCapability) {
  const haystack = `${capability.title} ${capability.description} ${capability.capabilityTags.join(" ")}`.toLowerCase();
  const outputTypes: Array<"image_generation" | "speech_generation" | "text" | "video_generation"> = [];

  if (haystack.includes("image")) {
    outputTypes.push("image_generation");
  }

  if (haystack.includes("speech") || haystack.includes("voice") || haystack.includes("audio")) {
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
