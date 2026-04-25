import "server-only";

import {
  listCatalogEntries,
  searchCatalogEntries,
} from "@/lib/boreal/dal/intent-repository";
import type { CatalogEntry } from "@/lib/boreal/integrations/convex/function-refs";
import type { CatalogItem } from "@/lib/boreal/schemas/chat";

export async function searchCatalog(input: {
  query: string;
  limit?: number;
}): Promise<CatalogItem[]> {
  const limit = input.limit ?? 6;
  const trimmed = input.query.trim();
  const entries = trimmed
    ? await searchCatalogEntries(trimmed, limit)
    : await listCatalogEntries(limit);

  if (entries.length > 0) {
    return entries.map(mapCatalogEntry);
  }

  return (await listCatalogEntries(limit)).map(mapCatalogEntry);
}

function mapCatalogEntry(entry: CatalogEntry): CatalogItem {
  return {
    actorKind: entry.actorKind,
    averageRating: entry.averageRating,
    brand: entry.brand,
    capabilityTags: entry.capabilityTags,
    category: entry.category,
    checkoutProtocol: entry.checkoutProtocol,
    currency: entry.currency,
    deliveryType: entry.deliveryType,
    description: entry.description,
    estimatedDeliveryLabel: entry.estimatedDeliveryLabel,
    executionSurface: entry.executionSurface,
    executorUrl: entry.executorUrl,
    fulfillmentKind: entry.fulfillmentKind,
    gatedOutReasons: entry.gatedOutReasons,
    id: entry._id,
    isCartEnabled: entry.isCartEnabled,
    isPinned: entry.isPinned,
    matchReasons: entry.matchReasons,
    matchScore: entry.matchScore,
    matchStage: entry.matchStage,
    paymentNetworkHints: entry.paymentNetworkHints,
    paymentProtocol: entry.paymentProtocol,
    priceAmount: entry.priceAmount,
    priceLabel:
      entry.priceAmount === null
        ? "Custom"
        : entry.priceAmount === 0
          ? "Included"
          : `${entry.currency} ${entry.priceAmount}/${entry.priceType}`,
    requiresHumanApproval: entry.requiresHumanApproval,
    reviewCount: entry.reviewCount,
    seller: entry.seller,
    sourceListingUrl: entry.sourceListingUrl,
    sourceProviderKey: entry.sourceProviderKey,
    subtitle: entry.subtitle,
    supplyType: entry.supplyType,
    supportsDirectInvoke: entry.supportsDirectInvoke,
    supportsPrivyWallet: entry.supportsPrivyWallet,
    successProbability: entry.successProbability,
    title: entry.title,
  };
}
