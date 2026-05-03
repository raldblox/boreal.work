import { getPublicReadySpecialistMeta } from "../agents/public-ready-specialists.ts";
import {
  formatUsdcPriceLabel,
  SPECIALIST_FUNDED_START_USDC_AMOUNT,
} from "../one-request/pricing.ts";
import type { OneRequestRoutePlan } from "../one-request/types.ts";
import { getDefaultSolanaNetworkKey } from "../solana-network.ts";
import type { WorkspaceState } from "../schemas/chat.ts";
import type { PresetTeamDefinition } from "../swarm/preset-teams.ts";
import { buildPresetTeamSourceCapabilityId } from "../swarm/preset-teams.ts";

import type {
  ProviderRouteOption,
  ProviderSelectionState,
} from "./types";

export function buildTrackedSpecialistRouteOption(routePlan: OneRequestRoutePlan) {
  const selectedAgentKeys = routePlan.selected.map((selection) => selection.agent.key);
  const displayTitle = routePlan.selected
    .map((selection) => selection.agent.identity.displayName)
    .join(", ");
  const leadMeta = getPublicReadySpecialistMeta(selectedAgentKeys[0] ?? null);
  const providerCompany =
    leadMeta?.providerCompany.trim().toLowerCase() === "anthropic"
      ? "anthropic"
      : leadMeta?.providerCompany.trim().toLowerCase() === "gemini"
        ? "gemini"
        : "openai";
  const providerSuffix = leadMeta?.model
    ? `${leadMeta.providerCompany ?? "OpenAI"} - ${leadMeta.model}`
    : (leadMeta?.providerCompany ?? "OpenAI");

  return {
    accessLabel: "Funding required",
    company: providerCompany,
    deliveryMode: "boreal-hosted",
    displayTitle,
    executionSurface: "http",
    fallbackOrder: 0,
    isDefault: true,
    networkHints: [routePlan.networkKey],
    paymentProtocol: routePlan.paymentProtocol,
    priceLabel: formatUsdcPriceLabel(SPECIALIST_FUNDED_START_USDC_AMOUNT),
    pricingPolicy: {
      amount: SPECIALIST_FUNDED_START_USDC_AMOUNT,
      currency: "USDC",
      kind: "flat-usdc",
      networkKey: routePlan.networkKey,
    },
    providerKey: "boreal",
    quote: null,
    receiptExpectation: {
      requiresSignedMessage: true,
      requiresTxHash: true,
      requiresVerification: true,
    },
    requiresPayment: true,
    routeKey: `tracked-specialist:${selectedAgentKeys.join("+")}`,
    sourceCapabilityId:
      selectedAgentKeys.length === 1
        ? `autonomous-agent:${selectedAgentKeys[0]}`
        : `autonomous-team:${selectedAgentKeys.join("+")}`,
    sourceProviderKey: null,
    subtitle:
      routePlan.selected.length === 1
        ? `${displayTitle} starts after funding. ${providerSuffix}`.trim()
        : `${displayTitle} start after funding in this same tracked request thread.`,
    supportsDirectInvoke: true,
  } satisfies ProviderRouteOption;
}

export function buildTrackedPresetTeamRouteOption(
  presetTeam: PresetTeamDefinition,
) {
  const networkKey = getDefaultSolanaNetworkKey();

  return {
    accessLabel: "Funding required",
    company: "openai",
    deliveryMode: "boreal-hosted",
    displayTitle: presetTeam.teamDisplayName,
    executionSurface: "sdk",
    fallbackOrder: 0,
    isDefault: true,
    networkHints: [networkKey],
    paymentProtocol: "x402",
    priceLabel: formatUsdcPriceLabel(SPECIALIST_FUNDED_START_USDC_AMOUNT),
    pricingPolicy: {
      amount: SPECIALIST_FUNDED_START_USDC_AMOUNT,
      currency: "USDC",
      kind: "flat-usdc",
      networkKey,
    },
    providerKey: "boreal",
    quote: null,
    receiptExpectation: {
      requiresSignedMessage: true,
      requiresTxHash: true,
      requiresVerification: true,
    },
    requiresPayment: true,
    routeKey: `tracked-preset-team:${presetTeam.key}`,
    sourceCapabilityId: buildPresetTeamSourceCapabilityId(presetTeam.key),
    sourceProviderKey: null,
    subtitle: `${presetTeam.teamDisplayName} starts after funding in this same tracked request thread.`,
    supportsDirectInvoke: true,
  } satisfies ProviderRouteOption;
}

export function buildSpecialistPaymentWorkspace(input: {
  selection: ProviderSelectionState;
  subtitle?: string;
}) {
  const leadTitle =
    input.selection.options[0]?.displayTitle?.trim() || "specialist";
  const priceLabel = input.selection.options[0]?.priceLabel?.trim() || "payment";

  return {
    kind: "provider_selection",
    selection: input.selection,
    subtitle:
      input.subtitle ??
      `Funding starts ${leadTitle} in this same request thread. ${priceLabel} is required, and Boreal records the signed receipt plus verified Solana transaction before work begins.`,
    title: "Fund specialist",
  } satisfies WorkspaceState;
}
