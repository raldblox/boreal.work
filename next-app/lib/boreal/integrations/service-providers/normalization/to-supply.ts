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
    actorKind: "tool" as const,
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
    mcpServerUrl: capability.endpoint?.mcpServerUrl,
    metadataJson: JSON.stringify(metadata),
    openApiUrl: undefined,
    paymentNetworkHints: capability.paymentNetworkHints,
    paymentProtocol: capability.paymentProtocol,
    priceAmount: capability.pricing.amount,
    priceRawJson: capability.pricing.raw
      ? JSON.stringify(capability.pricing.raw)
      : undefined,
    priceType: "fixed" as const,
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
