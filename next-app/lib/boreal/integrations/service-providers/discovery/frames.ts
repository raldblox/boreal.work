import { createStaticCatalogAdapter } from "./static-catalog.ts";
import type { NormalizedCapability } from "../types.ts";

const FRAMES_CAPABILITIES: NormalizedCapability[] = [
  {
    acceptedCurrencies: [],
    capabilityTags: [
      "frames",
      "managed-agents",
      "handoff",
      "onboarding",
      "fallback",
    ],
    category: "managed agent handoff",
    description:
      "Controlled Boreal handoff into Frames-managed agent surfaces when the underlying provider contract is not yet safe enough for direct invoke inside Boreal.",
    evidence: {
      returnsReceipt: false,
      returnsTxHash: false,
      supportsSchemaMetadata: false,
    },
    executionSurface: "handoff",
    keywords: [
      "frames",
      "handoff",
      "managed",
      "agent",
      "workspace",
      "onboarding",
      "fallback",
    ],
    paymentNetworkHints: [],
    paymentProtocol: "none",
    pricing: {
      raw: {
        docsStatus: "public-contract-not-yet-verified",
        handoffUrl: "https://www.fra.ms/",
      },
      type: "quote-required",
    },
    raw: {
      integrationMode: "catalog-handoff",
      notes: [
        "Frames discovery is present in Boreal search as a fallback source.",
        "Direct invoke stays blocked until a stable public developer contract is verified.",
      ],
    },
    requiresHumanApproval: true,
    routingTier: "B-ingest-handoff",
    sourceCapabilityId: "frames:managed-handoff",
    sourceId: "frames",
    sourceProvider: "frames",
    sourceProviderUrl: "https://www.fra.ms/",
    sourceUrl: "https://www.fra.ms/",
    subtitle: "Curated handoff only",
    supportsDirectInvoke: false,
    supportsPrivyWallet: false,
    title: "Frames managed agent handoff",
    walletRequirements: {
      supportedWalletModes: ["provider-managed"],
    },
  },
];

export const framesDiscoveryAdapter = createStaticCatalogAdapter({
  capabilities: [...FRAMES_CAPABILITIES],
  key: "frames",
});
