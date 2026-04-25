import "server-only";

import { agenticMarketDiscoveryAdapter } from "@/lib/boreal/integrations/service-providers/discovery/agentic-market";
import type {
  DiscoveryInput,
  NormalizedCapability,
  ServiceDiscoveryAdapter,
  ServiceProviderKey,
} from "@/lib/boreal/integrations/service-providers/types";

const discoveryAdapters: Record<ServiceProviderKey, ServiceDiscoveryAdapter | null> = {
  "agentcash": null,
  "agentic-market": agenticMarketDiscoveryAdapter,
  "frames": null,
  "manual": null,
  "moonpay": null,
  "solana-agent-kit": null,
};

export function getServiceDiscoveryAdapter(key: ServiceProviderKey) {
  return discoveryAdapters[key];
}

export async function listDiscoveredCapabilities(
  key: ServiceProviderKey,
  input: DiscoveryInput,
): Promise<NormalizedCapability[]> {
  const adapter = getServiceDiscoveryAdapter(key);

  if (!adapter) {
    return [];
  }

  return adapter.listCapabilities(input);
}
