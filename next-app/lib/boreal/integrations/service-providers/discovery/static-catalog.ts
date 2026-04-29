import type {
  NormalizedCapability,
  ServiceDiscoveryAdapter,
  ServiceProviderKey,
} from "../types.ts";

type StaticCatalogOptions = {
  capabilities: NormalizedCapability[];
  key: ServiceProviderKey;
};

export function createStaticCatalogAdapter(
  options: StaticCatalogOptions,
): ServiceDiscoveryAdapter {
  return {
    key: options.key,
    async listCapabilities(input) {
      const matches = filterCapabilities(options.capabilities, input.query);
      const limit = clampLimit(input.limit);
      return matches.slice(0, limit);
    },
  };
}

function filterCapabilities(
  capabilities: NormalizedCapability[],
  query?: string,
) {
  const trimmed = query?.trim().toLowerCase();

  if (!trimmed) {
    return capabilities;
  }

  return capabilities.filter((capability) =>
    [
      capability.title,
      capability.subtitle,
      capability.description,
      capability.category,
      ...capability.capabilityTags,
      ...capability.keywords,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(trimmed),
  );
}

function clampLimit(limit?: number) {
  if (typeof limit !== "number" || !Number.isFinite(limit) || limit <= 0) {
    return 24;
  }

  return Math.max(1, Math.min(Math.trunc(limit), 100));
}
