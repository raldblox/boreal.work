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
    capabilityTags: entry.capabilityTags,
    category: entry.category,
    deliveryType: entry.deliveryType,
    description: entry.description,
    id: entry._id,
    priceLabel:
      entry.priceAmount === null
        ? "Custom"
        : entry.priceAmount === 0
          ? "Included"
          : `$${entry.priceAmount}/${entry.priceType}`,
    supplyType: entry.supplyType,
    title: entry.title,
  };
}
