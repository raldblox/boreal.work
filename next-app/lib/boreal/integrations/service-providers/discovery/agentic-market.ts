import "server-only";

import type {
  DiscoveryInput,
  NormalizedCapability,
  ServiceDiscoveryAdapter,
} from "@/lib/boreal/integrations/service-providers/types";

type AgenticMarketService = {
  category?: string;
  description?: string;
  domain?: string;
  endpoints?: AgenticMarketEndpoint[];
  id: string;
  name: string;
  networks?: string[];
  provider?: string;
  providerUrl?: string;
};

type AgenticMarketEndpoint = {
  description?: string;
  method?: string;
  pricing?: {
    amount?: string;
    currency?: string;
    network?: string;
  };
  providerName?: string;
  url: string;
};

type AgenticMarketResponse = {
  services?: AgenticMarketService[];
};

const AGENTIC_MARKET_API = "https://api.agentic.market/v1/services";

export const agenticMarketDiscoveryAdapter: ServiceDiscoveryAdapter = {
  key: "agentic-market",
  async listCapabilities(input) {
    const response = await fetch(buildAgenticMarketUrl(input), {
      cache: "no-store",
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Agentic Market discovery failed with ${response.status}.`);
    }

    const payload = (await response.json()) as AgenticMarketResponse;
    const services = payload.services ?? [];

    return services.flatMap((service) => normalizeService(service, input.limit));
  },
};

function buildAgenticMarketUrl(input: DiscoveryInput) {
  const query = input.query?.trim();

  if (!query) {
    return AGENTIC_MARKET_API;
  }

  const params = new URLSearchParams({ q: query });
  return `${AGENTIC_MARKET_API}/search?${params.toString()}`;
}

function normalizeService(service: AgenticMarketService, limit?: number): NormalizedCapability[] {
  const endpoints = service.endpoints ?? [];
  const capped = typeof limit === "number" ? endpoints.slice(0, limit) : endpoints;

  return capped.map((endpoint, index) => {
    const method = (endpoint.method ?? "GET").toUpperCase();
    const endpointDescription = sanitizeText(endpoint.description);
    const endpointLabel = endpointDescription ?? method;
    const paymentNetworkHints = Array.from(
      new Set(
        [endpoint.pricing?.network, ...(service.networks ?? [])]
          .map(normalizeCaip2NetworkHint)
          .filter(Boolean),
      ),
    ) as string[];
    const amount = parseAmount(endpoint.pricing?.amount);
    const title = `${service.name} · ${truncate(endpointLabel, 56)}`;
    const subtitle = buildSubtitle(service, endpoint);
    const keywords = extractKeywords(
      [
        service.name,
        service.category,
        service.provider,
        endpoint.providerName,
        endpointDescription,
        endpoint.url,
        ...(service.networks ?? []),
      ]
        .filter(Boolean)
        .join(" "),
    );
    const supportsDirectInvoke =
      !endpoint.url.includes("{") &&
      !endpoint.url.includes(":") &&
      (method === "GET" || method === "POST");

    return {
      acceptedCurrencies: endpoint.pricing?.currency ? [endpoint.pricing.currency] : ["USDC"],
      capabilityTags: Array.from(
        new Set([
          normalizeTag(service.category),
          normalizeTag(endpoint.providerName),
          normalizeTag(service.provider),
          method.toLowerCase(),
          "x402",
          "agent-ready",
        ].filter((value): value is string => Boolean(value))),
      ),
      category: (service.category ?? "external service").toLowerCase(),
      description:
        service.description ??
        endpointDescription ??
        `${service.name} capability discovered from Agentic Market.`,
      endpoint: {
        bodyType: method === "POST" ? "json" : "none",
        method,
        url: endpoint.url,
      },
      evidence: {
        returnsReceipt: true,
        returnsTxHash: true,
        supportsSchemaMetadata: false,
      },
      executionSurface: "http",
      keywords,
      paymentNetworkHints,
      paymentProtocol: "x402",
      pricing: {
        amount,
        currency: endpoint.pricing?.currency ?? "USDC",
        raw: endpoint.pricing,
        type: amount && amount > 0 ? "fixed" : "free",
      },
      raw: {
        endpoint,
        service,
      },
      requiresHumanApproval: true,
      routingTier: supportsDirectInvoke ? "A-direct" : "B-ingest-handoff",
      sourceCapabilityId: `${service.id}:${index}`,
      sourceId: service.id,
      sourceProvider: "agentic-market",
      sourceProviderUrl: "https://agentic.market",
      sourceUrl: endpoint.url,
      subtitle,
      supportsDirectInvoke,
      supportsPrivyWallet: true,
      title,
      walletRequirements: {
        supportedWalletModes: ["client-sign"],
      },
    };
  });
}

function buildSubtitle(service: AgenticMarketService, endpoint: AgenticMarketEndpoint) {
  const parts = [
    sanitizeText(service.provider),
    sanitizeText(endpoint.providerName),
    sanitizeText(service.category),
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(" · ") : undefined;
}

function normalizeCaip2NetworkHint(value?: string) {
  const normalized = value?.trim();

  if (!normalized) {
    return null;
  }

  if (normalized.includes(":")) {
    return normalized.toLowerCase();
  }

  const lower = normalized.toLowerCase();

  if (lower === "base") {
    return "eip155:8453";
  }

  if (lower === "base sepolia") {
    return "eip155:84532";
  }

  if (lower === "solana") {
    return "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp";
  }

  if (lower === "polygon") {
    return "eip155:137";
  }

  if (lower === "ethereum") {
    return "eip155:1";
  }

  return normalized;
}

function parseAmount(value?: string) {
  if (!value?.trim()) {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function extractKeywords(value: string) {
  return Array.from(
    new Set(
      value
        .toLowerCase()
        .split(/[^a-z0-9-]+/i)
        .filter((token) => token.length > 2),
    ),
  ).slice(0, 48);
}

function normalizeTag(value?: string) {
  const trimmed = value?.trim().toLowerCase().replace(/\s+/g, "-");
  return trimmed || null;
}

function sanitizeText(value?: string) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function truncate(value: string, length: number) {
  return value.length <= length ? value : `${value.slice(0, length - 3)}...`;
}
