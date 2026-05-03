import { buildPaymentReferenceMemo } from "@/lib/boreal/one-request/auth";
import {
  formatUsdcPriceLabel,
  SPECIALIST_FUNDED_START_USDC_AMOUNT,
} from "@/lib/boreal/one-request/pricing";
import { getOneRequestSellerMetadata } from "@/lib/boreal/one-request/seller";
import type { BorealSolanaNetworkKey } from "@/lib/boreal/solana-network";

import type {
  ProviderRouteOption,
  ProviderRoutePricingPolicy,
  ProviderSelectionState,
} from "./types";

type StoredTrackedProviderOption = Omit<
  ProviderRouteOption,
  "accessLabel" | "isDefault" | "priceLabel" | "quote"
>;

type StoredTrackedProviderSelectionSnapshot = {
  kind: "tracked_provider_selection";
  option: StoredTrackedProviderOption;
};

export const TRACKED_REQUEST_SELECTION_KIND = "tracked_provider_selection";
export const TRACKED_REQUEST_QUOTE_TTL_MS = 15 * 60 * 1000;
export { SPECIALIST_FUNDED_START_USDC_AMOUNT };

export function serializeTrackedProviderSelectionSnapshot(
  option: StoredTrackedProviderOption,
) {
  return JSON.stringify({
    kind: TRACKED_REQUEST_SELECTION_KIND,
    option,
  } satisfies StoredTrackedProviderSelectionSnapshot);
}

export function buildTrackedProviderSelectionStateFromSession(input: {
  lockedAt: number;
  message: string;
  networkKey: BorealSolanaNetworkKey;
  quoteAmount: number;
  quoteAuthorizationMessage: string;
  quoteExpiresAt: number;
  quoteToken: string;
  requestFingerprint: string;
  requestToken: string;
  routeJson: string;
}) {
  const snapshot = parseTrackedProviderSelectionSnapshot(input.routeJson);

  if (!snapshot) {
    return null;
  }

  const priceLabel = formatPricingLabel(snapshot.option.pricingPolicy);
  const seller = getOneRequestSellerMetadata();

  return {
    defaultRouteKey: snapshot.option.routeKey,
    options: [
      {
        ...snapshot.option,
        accessLabel: snapshot.option.requiresPayment
          ? "Funding required"
          : "Ready",
        isDefault: true,
        priceLabel,
        quote: snapshot.option.requiresPayment
          ? {
              amount: input.quoteAmount,
              authorizationMessage: input.quoteAuthorizationMessage,
              currency: resolvePricingCurrency(snapshot.option.pricingPolicy),
              expiresAt: input.quoteExpiresAt,
              networkKey: input.networkKey,
              payToAddress: seller.payToAddress,
              payToAsset: seller.payToAsset,
              payToMintAddress: seller.payToMintAddress,
              payToTokenAccountAddress: seller.payToTokenAccountAddress,
              payToTokenDecimals: seller.payToTokenDecimals,
              payToTokenProgramAddress: seller.payToTokenProgramAddress,
              payerSources: ["openwallet", "agentcash"],
              paymentProtocol: snapshot.option.paymentProtocol,
              paymentReference: buildPaymentReferenceMemo({
                quoteToken: input.quoteToken,
                requestToken: input.requestToken,
              }),
              quoteToken: input.quoteToken,
              requestToken: input.requestToken,
            }
          : null,
      },
    ],
    preparedAt: input.lockedAt,
    promptHash: input.requestFingerprint,
    promptText: input.message,
    selectedRouteKey: snapshot.option.routeKey,
  } satisfies ProviderSelectionState;
}

function parseTrackedProviderSelectionSnapshot(routeJson: string) {
  try {
    const parsed = JSON.parse(routeJson) as
      | StoredTrackedProviderSelectionSnapshot
      | Record<string, unknown>;

    if (
      parsed &&
      typeof parsed === "object" &&
      parsed.kind === TRACKED_REQUEST_SELECTION_KIND &&
      parsed.option &&
      typeof parsed.option === "object"
    ) {
      return parsed as StoredTrackedProviderSelectionSnapshot;
    }
  } catch {
    return null;
  }

  return null;
}

function formatPricingLabel(pricingPolicy: ProviderRoutePricingPolicy) {
  if (pricingPolicy.kind === "flat-usdc") {
    return formatUsdcPriceLabel(pricingPolicy.amount);
  }

  if (pricingPolicy.kind === "x402-fixed") {
    return `${pricingPolicy.amount} ${pricingPolicy.currency}`;
  }

  return "Free";
}

function resolvePricingCurrency(pricingPolicy: ProviderRoutePricingPolicy) {
  if (pricingPolicy.kind === "flat-usdc") {
    return pricingPolicy.currency;
  }

  if (pricingPolicy.kind === "x402-fixed") {
    return pricingPolicy.currency;
  }

  return "USDC";
}
