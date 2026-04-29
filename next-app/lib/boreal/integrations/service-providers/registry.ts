import "server-only";

import { agentcashDiscoveryAdapter } from "@/lib/boreal/integrations/service-providers/discovery/agentcash";
import { agenticMarketDiscoveryAdapter } from "@/lib/boreal/integrations/service-providers/discovery/agentic-market";
import { framesDiscoveryAdapter } from "@/lib/boreal/integrations/service-providers/discovery/frames";
import type {
  DiscoveryInput,
  NormalizedCapability,
  ServiceDiscoveryAdapter,
  ServiceProviderKey,
} from "@/lib/boreal/integrations/service-providers/types";

const discoveryAdapters: Record<ServiceProviderKey, ServiceDiscoveryAdapter | null> = {
  "agentcash": agentcashDiscoveryAdapter,
  "agentic-market": agenticMarketDiscoveryAdapter,
  "frames": framesDiscoveryAdapter,
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
