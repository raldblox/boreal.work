import "server-only";

import { createHash } from "node:crypto";

import {
  buildPaymentAuthorizationMessage,
  buildPaymentReferenceMemo,
} from "@/lib/boreal/one-request/auth";
import { getOneRequestSellerMetadata } from "@/lib/boreal/one-request/seller";
import { getDefaultSolanaNetworkKey } from "@/lib/boreal/solana-network";
import { listDiscoveredCapabilities } from "@/lib/boreal/integrations/service-providers/registry";
import type {
  NormalizedCapability,
  ServiceProviderKey,
} from "@/lib/boreal/integrations/service-providers/types";

import type {
  PaymentAccessPolicy,
  ProviderCompany,
  ProviderRouteMatrixEntry,
  ProviderRouteOption,
  ProviderRouteQuote,
  ProviderSelectionState,
} from "./types";

const PROVIDER_SELECTION_QUOTE_TTL_MS = 15 * 60 * 1000;
const BOREAL_OPENAI_ROUTE_KEY = "openai-by-boreal";
const CURATED_ROUTE_MATRIX: ProviderRouteMatrixEntry[] = [
  {
    company: "openai",
    deliveryMode: "boreal-hosted",
    displayTitle: "OpenAI by Boreal",
    executionSurface: "http",
    fallbackOrder: 0,
    networkHints: [getDefaultSolanaNetworkKey()],
    paymentProtocol: "none",
    pricingPolicy: {
      kind: "free",
    },
    providerKey: "boreal",
    receiptExpectation: {
      requiresSignedMessage: true,
      requiresTxHash: true,
      requiresVerification: true,
    },
    requiresPayment: false,
    routeKey: BOREAL_OPENAI_ROUTE_KEY,
    sourceCapabilityId: "boreal:openai-default",
    sourceProviderKey: null,
    subtitle: "Boreal-hosted default lane for fast text work.",
    supportsDirectInvoke: true,
  },
];

const COMPANY_DISCOVERY_QUERIES: Record<
  Exclude<ProviderCompany, "openai"> | "openai-market",
  { company: ProviderCompany; query: string }
> = {
  "anthropic": {
    company: "anthropic",
    query: "anthropic",
  },
  "gemini": {
    company: "gemini",
    query: "gemini",
  },
  "openai-market": {
    company: "openai",
    query: "openai",
  },
};

export async function buildProviderSelectionState(input: {
  promptText: string;
  requesterExternalId?: string | null;
  walletAddress?: string | null;
  rateLimitReason?: string | null;
}) {
  const preparedAt = Date.now();
  const promptText = input.promptText.trim();
  const promptHash = hashPrompt(promptText);
  const accessPolicy = resolvePaymentAccessPolicy({
    requesterExternalId: input.requesterExternalId ?? null,
    walletAddress: input.walletAddress ?? null,
  });
  const discoveredRoutes = await discoverCuratedProviderRoutes();
  const entries = [...CURATED_ROUTE_MATRIX, ...discoveredRoutes].sort(
    (left, right) => left.fallbackOrder - right.fallbackOrder,
  );
  const defaultRouteKey = entries[0]?.routeKey ?? BOREAL_OPENAI_ROUTE_KEY;
  const options: ProviderRouteOption[] = entries.map((entry) =>
    toProviderRouteOption({
      accessPolicy,
      entry,
      isDefault: entry.routeKey === defaultRouteKey,
      promptHash,
      promptText,
    }),
  );

  return {
    defaultRouteKey,
    options,
    preparedAt,
    promptHash,
    promptText,
    rateLimitReason: input.rateLimitReason ?? null,
    selectedRouteKey: defaultRouteKey,
  } satisfies ProviderSelectionState;
}

export async function getProviderRouteOptionByKey(input: {
  promptHash: string;
  promptText: string;
  requesterExternalId?: string | null;
  routeKey: string;
  walletAddress?: string | null;
}) {
  const selection = await buildProviderSelectionState({
    promptText: input.promptText,
    requesterExternalId: input.requesterExternalId,
    walletAddress: input.walletAddress,
  });

  if (selection.promptHash !== input.promptHash) {
    throw new Error("Provider selection prompt snapshot no longer matches.");
  }

  return (
    selection.options.find((option) => option.routeKey === input.routeKey) ?? null
  );
}

export function isBorealHostedProviderRoute(routeKey: string) {
  return routeKey === BOREAL_OPENAI_ROUTE_KEY;
}

export function resolvePaymentAccessPolicy(input: {
  requesterExternalId?: string | null;
  walletAddress?: string | null;
}) {
  const freeAccessEnabled = parseBooleanFlag(process.env.FREE_ACCESS);
  const entries = (process.env.BOREAL_FREE_ACCESS_ALLOWLIST ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  const requesterExternalId = input.requesterExternalId?.trim() ?? null;
  const walletAddress = input.walletAddress?.trim() ?? null;
  const loweredExternalId = requesterExternalId?.toLowerCase() ?? null;
  const loweredWalletAddress = walletAddress?.toLowerCase() ?? null;
  const matchedAllowlistEntry =
    entries.find((entry) => {
      const lowered = entry.toLowerCase();
      return lowered === loweredExternalId || lowered === loweredWalletAddress;
    }) ?? null;

  return {
    freeAccessEnabled,
    matchedAllowlistEntry,
    walletAddress,
    xIdentity: requesterExternalId,
  } satisfies PaymentAccessPolicy;
}

export function hashPrompt(promptText: string) {
  return createHash("sha256")
    .update(normalizePrompt(promptText))
    .digest("hex");
}

function toProviderRouteOption(input: {
  accessPolicy: PaymentAccessPolicy;
  entry: ProviderRouteMatrixEntry;
  isDefault: boolean;
  promptHash: string;
  promptText: string;
}): ProviderRouteOption {
  const freeByPolicy = input.entry.pricingPolicy.kind === "free";
  const freeAccessAllowed =
    freeByPolicy ||
    (input.entry.routeKey === BOREAL_OPENAI_ROUTE_KEY &&
      (input.accessPolicy.freeAccessEnabled ||
        Boolean(input.accessPolicy.matchedAllowlistEntry)));
  const requiresPayment =
    input.entry.deliveryMode === "provider-backed"
      ? true
      : !freeAccessAllowed && input.entry.pricingPolicy.kind !== "free";

  return {
    accessLabel: freeAccessAllowed
      ? "Free access"
      : requiresPayment
        ? input.entry.deliveryMode === "boreal-hosted"
          ? "0.001 SOL gate"
          : "x402 gated"
        : "Ready",
    company: input.entry.company,
    deliveryMode: input.entry.deliveryMode,
    displayTitle: input.entry.displayTitle,
    executionSurface: input.entry.executionSurface,
    fallbackOrder: input.entry.fallbackOrder,
    isDefault: input.isDefault,
    networkHints: input.entry.networkHints,
    paymentProtocol: input.entry.paymentProtocol,
    priceLabel: requiresPayment
      ? input.entry.pricingPolicy.kind === "flat-sol"
        ? `${input.entry.pricingPolicy.amount} ${input.entry.pricingPolicy.currency}`
        : input.entry.pricingPolicy.kind === "x402-fixed"
          ? `${input.entry.pricingPolicy.amount} ${input.entry.pricingPolicy.currency}`
          : "Payment required"
      : "Free",
    pricingPolicy: input.entry.pricingPolicy,
    providerKey: input.entry.providerKey,
    quote: requiresPayment
      ? buildProviderRouteQuote({
          amount:
            input.entry.pricingPolicy.kind === "flat-sol" ||
            input.entry.pricingPolicy.kind === "x402-fixed"
              ? input.entry.pricingPolicy.amount
              : 0,
          currency:
            input.entry.pricingPolicy.kind === "flat-sol"
              ? input.entry.pricingPolicy.currency
              : input.entry.pricingPolicy.kind === "x402-fixed"
                ? input.entry.pricingPolicy.currency
                : "USD",
          routeKey: input.entry.routeKey,
        })
      : null,
    receiptExpectation: input.entry.receiptExpectation,
    requiresPayment,
    routeKey: input.entry.routeKey,
    sourceCapabilityId: input.entry.sourceCapabilityId ?? null,
    sourceProviderKey: input.entry.sourceProviderKey ?? null,
    subtitle: input.entry.subtitle,
    supportsDirectInvoke: input.entry.supportsDirectInvoke,
  } satisfies ProviderRouteOption;
}

function buildProviderRouteQuote(input: {
  amount: number;
  currency: string;
  routeKey: string;
}): ProviderRouteQuote {
  const requestToken = `req_${crypto.randomUUID().replaceAll("-", "")}`;
  const quoteToken = `quote_${crypto.randomUUID().replaceAll("-", "")}`;
  const authorizationMessage = buildPaymentAuthorizationMessage({
    amount: input.amount,
    currency: input.currency,
    quoteToken,
    requestToken,
  });
  const paymentReference = buildPaymentReferenceMemo({
    quoteToken,
    requestToken,
  });
  const seller = getOneRequestSellerMetadata();

  return {
    amount: input.amount,
    authorizationMessage,
    currency: input.currency,
    expiresAt: Date.now() + PROVIDER_SELECTION_QUOTE_TTL_MS,
    networkKey: getDefaultSolanaNetworkKey(),
    payToAddress: seller.payToAddress,
    payerSources: ["openwallet", "agentcash"],
    paymentProtocol: "x402",
    paymentReference,
    quoteToken,
    requestToken,
  };
}

async function discoverCuratedProviderRoutes() {
  const admitted: ProviderRouteMatrixEntry[] = [];

  for (const descriptor of Object.values(COMPANY_DISCOVERY_QUERIES)) {
    try {
      const capabilities = await listDiscoveredCapabilities("agentic-market", {
        limit: 12,
        query: descriptor.query,
      });
      const match = pickBestCapabilityForCompany(capabilities, descriptor.company);

      if (!match) {
        continue;
      }

      admitted.push({
        company: descriptor.company,
        deliveryMode: "provider-backed",
        displayTitle: `${getProviderCompanyLabel(descriptor.company)} via Agentic Market`,
        executionSurface: match.executionSurface,
        fallbackOrder: descriptor.company === "openai" ? 1 : descriptor.company === "anthropic" ? 2 : 3,
        networkHints: match.paymentNetworkHints,
        paymentProtocol: match.paymentProtocol,
        pricingPolicy: {
          amount: match.pricing.amount ?? 0,
          currency: match.pricing.currency ?? "USDC",
          kind: "x402-fixed",
          networkHint: match.paymentNetworkHints[0] ?? null,
        },
        providerKey: "agentic-market",
        receiptExpectation: {
          requiresSignedMessage: true,
          requiresTxHash: Boolean(match.evidence.returnsTxHash),
          requiresVerification: Boolean(
            match.evidence.returnsReceipt || match.evidence.returnsTxHash,
          ),
        },
        requiresPayment: true,
        routeKey: `agentic-market:${descriptor.company}`,
        sourceCapabilityId: match.sourceCapabilityId,
        sourceProviderKey: "agentic-market",
        subtitle: match.subtitle ?? match.description,
        supportsDirectInvoke: match.supportsDirectInvoke,
      });
    } catch {
      continue;
    }
  }

  return admitted;
}

function pickBestCapabilityForCompany(
  capabilities: NormalizedCapability[],
  company: ProviderCompany,
) {
  const filtered = capabilities.filter((capability) =>
    isAdmittedCuratedCapability(capability, company),
  );

  return filtered.sort(compareCapabilities)[0] ?? null;
}

function isAdmittedCuratedCapability(
  capability: NormalizedCapability,
  company: ProviderCompany,
) {
  if (capability.sourceProvider !== "agentic-market") {
    return false;
  }

  if (!matchesProviderCompany(capability, company)) {
    return false;
  }

  if (!capability.supportsDirectInvoke || capability.executionSurface !== "http") {
    return false;
  }

  if (capability.paymentProtocol !== "x402") {
    return false;
  }

  if (capability.pricing.type !== "fixed" || !capability.pricing.amount) {
    return false;
  }

  if (
    !(capability.paymentNetworkHints ?? []).some((hint) =>
      hint.toLowerCase().startsWith("solana:"),
    )
  ) {
    return false;
  }

  if (
    !capability.evidence.returnsReceipt &&
    !capability.evidence.returnsTxHash
  ) {
    return false;
  }

  return capability.requiresHumanApproval;
}

function compareCapabilities(
  left: NormalizedCapability,
  right: NormalizedCapability,
) {
  return scoreCapability(right) - scoreCapability(left);
}

function scoreCapability(capability: NormalizedCapability) {
  let score = 0;

  if (capability.supportsDirectInvoke) {
    score += 20;
  }

  if (capability.pricing.type === "fixed" && capability.pricing.amount) {
    score += 10;
  }

  if (capability.evidence.returnsReceipt) {
    score += 8;
  }

  if (capability.evidence.returnsTxHash) {
    score += 4;
  }

  if ((capability.paymentNetworkHints ?? []).length > 0) {
    score += 2;
  }

  return score;
}

function matchesProviderCompany(
  capability: NormalizedCapability,
  company: ProviderCompany,
) {
  const haystack = [
    capability.title,
    capability.subtitle,
    capability.description,
    capability.sourceCapabilityId,
    ...(capability.capabilityTags ?? []),
    ...(capability.keywords ?? []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  switch (company) {
    case "anthropic":
      return haystack.includes("anthropic") || haystack.includes("claude");
    case "gemini":
      return (
        haystack.includes("gemini") ||
        haystack.includes("google") ||
        haystack.includes("vertex")
      );
    case "openai":
    default:
      return haystack.includes("openai") || haystack.includes("gpt");
  }
}

function getProviderCompanyLabel(company: ProviderCompany) {
  switch (company) {
    case "anthropic":
      return "Anthropic";
    case "gemini":
      return "Gemini";
    case "openai":
    default:
      return "OpenAI";
  }
}

function parseBooleanFlag(value?: string | null) {
  const normalized = value?.trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes";
}

function normalizePrompt(value: string) {
  return value.trim().replace(/\s+/g, " ");
}
