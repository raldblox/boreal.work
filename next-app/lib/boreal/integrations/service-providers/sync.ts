import "server-only";

import { convexFunctionRefs } from "@/lib/boreal/integrations/convex/function-refs";
import { createConvexServerClient } from "@/lib/boreal/integrations/convex/server-client";
import { listDiscoveredCapabilities } from "@/lib/boreal/integrations/service-providers/registry";
import type {
  DiscoveryInput,
  ServiceProviderKey,
} from "@/lib/boreal/integrations/service-providers/types";

type ProviderDefinition = {
  description: string;
  displayName: string;
  key: ServiceProviderKey;
  providerUrl?: string;
};

export async function syncDiscoveredProvider(
  provider: ProviderDefinition,
  input: DiscoveryInput,
) {
  const capabilities = await listDiscoveredCapabilities(provider.key, input);
  const convex = createConvexServerClient();
  const result = await convex.mutation(convexFunctionRefs.syncCatalogCapabilities, {
    capabilities: capabilities.map((capability) => ({
      acceptedCurrencies: capability.acceptedCurrencies,
      capabilityTags: capability.capabilityTags,
      category: capability.category,
      description: capability.description,
      endpoint: capability.endpoint,
      evidence: capability.evidence,
      executionSurface: capability.executionSurface,
      keywords: capability.keywords,
      paymentNetworkHints: capability.paymentNetworkHints,
      paymentProtocol: capability.paymentProtocol,
      pricing: {
        amount: capability.pricing.amount,
        currency: capability.pricing.currency,
        rawJson: capability.pricing.raw
          ? JSON.stringify(capability.pricing.raw)
          : undefined,
        type: capability.pricing.type,
      },
      rawJson: capability.raw ? JSON.stringify(capability.raw) : undefined,
      requiresHumanApproval: capability.requiresHumanApproval,
      routingTier: capability.routingTier,
      sourceCapabilityId: capability.sourceCapabilityId,
      sourceId: capability.sourceId,
      sourceProvider: capability.sourceProvider,
      sourceProviderUrl: capability.sourceProviderUrl,
      sourceUrl: capability.sourceUrl,
      subtitle: capability.subtitle,
      supportsDirectInvoke: capability.supportsDirectInvoke,
      supportsPrivyWallet: capability.supportsPrivyWallet,
      title: capability.title,
      walletModes: capability.walletRequirements.supportedWalletModes,
    })),
    provider,
  });

  return {
    capabilityCount: capabilities.length,
    insertedCount: result.insertedCount,
    synced: result.synced,
    updatedCount: result.updatedCount,
  };
}
