import { createStaticCatalogAdapter } from "./static-catalog.ts";
import type { NormalizedCapability } from "../types.ts";

const AGENTCASH_CAPABILITIES: NormalizedCapability[] = [
  {
    acceptedCurrencies: ["USDC"],
    capabilityTags: [
      "agentcash",
      "x402",
      "gateway",
      "skill",
      "cli",
      "mcp",
      "premium-api",
    ],
    category: "delegated gateway",
    description:
      "Delegated fallback into AgentCash's premium x402 catalog when Boreal cannot satisfy a paid provider request with its own direct integration first.",
    evidence: {
      returnsReceipt: false,
      returnsTxHash: false,
      supportsSchemaMetadata: false,
    },
    executionSurface: "registry",
    keywords: [
      "agentcash",
      "x402",
      "gateway",
      "fallback",
      "premium",
      "api",
      "skill",
      "cli",
      "mcp",
    ],
    paymentNetworkHints: [
      "eip155:8453",
      "eip155:1",
      "eip155:10",
      "eip155:42161",
      "eip155:137",
    ],
    paymentProtocol: "x402",
    pricing: {
      currency: "USDC",
      raw: {
        docsUrl: "https://agentcash.dev/docs",
        pricingModel: "pay-per-request",
        setupUrl: "https://agentcash.dev/onboard",
        skillUrl: "https://agentcash.dev/skill.md",
      },
      type: "metered",
    },
    raw: {
      integrationMode: "delegated-gateway",
      notes: [
        "Boreal should prefer its own direct provider integrations first.",
        "AgentCash remains a fallback gateway for upstream x402 services and MCP mode.",
      ],
    },
    requiresHumanApproval: true,
    routingTier: "A-delegated",
    sourceCapabilityId: "agentcash:delegated-gateway",
    sourceId: "agentcash",
    sourceProvider: "agentcash",
    sourceProviderUrl: "https://agentcash.dev",
    sourceUrl: "https://agentcash.dev/skill.md",
    subtitle: "Skill, CLI, and MCP fallback",
    supportsDirectInvoke: false,
    supportsPrivyWallet: false,
    title: "AgentCash x402 gateway fallback",
    walletRequirements: {
      supportedWalletModes: ["external-wallet", "provider-managed"],
    },
  },
];

export const agentcashDiscoveryAdapter = createStaticCatalogAdapter({
  capabilities: [...AGENTCASH_CAPABILITIES],
  key: "agentcash",
});
