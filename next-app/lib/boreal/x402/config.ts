import "server-only";

import { SPECIALIST_FUNDED_START_USDC_AMOUNT } from "@/lib/boreal/one-request/pricing";
import {
  getDefaultSolanaCaip2,
  getDefaultSolanaNetworkKey,
} from "@/lib/boreal/solana-network";
export type BorealX402FacilitatorKind = "cdp" | "rapid402" | "generic";
export const BOREAL_X402_FLAT_PRICE_USDC = SPECIALIST_FUNDED_START_USDC_AMOUNT;
export const BOREAL_X402_PRIMARY_DEFAULT_URL =
  "https://api.cdp.coinbase.com/platform/v2/x402";
export const BOREAL_X402_FALLBACK_DEFAULT_URL = "https://rapid402.com/api/v1";
export const BOREAL_X402_TIMEOUT_MS_DEFAULT = 12_000;

export function isBorealX402Enabled() {
  const raw = process.env.BOREAL_X402_ENABLED?.trim().toLowerCase();

  return raw === undefined || raw === "" || raw === "1" || raw === "true" || raw === "yes";
}

export function getBorealX402SolanaNetwork() {
  return (
    process.env.BOREAL_X402_SOLANA_NETWORK?.trim() || getDefaultSolanaCaip2()
  ) as `${string}:${string}`;
}

export function getBorealX402LegacySolanaNetwork() {
  switch (getDefaultSolanaNetworkKey()) {
    case "solana:testnet":
      return "solana-devnet";
    case "solana:mainnet":
    default:
      return "solana";
  }
}

export function getBorealX402SupportedSolanaNetworks() {
  return Array.from(
    new Set([getBorealX402SolanaNetwork(), getBorealX402LegacySolanaNetwork()]),
  );
}

export function getBorealX402TimeoutMs() {
  const parsed = Number(process.env.BOREAL_X402_TIMEOUT_MS ?? "");

  return Number.isFinite(parsed) && parsed > 0
    ? parsed
    : BOREAL_X402_TIMEOUT_MS_DEFAULT;
}

export function getBorealX402PrimaryFacilitatorConfig() {
  return {
    kind: parseFacilitatorKind(
      process.env.BOREAL_X402_PRIMARY_FACILITATOR_KIND,
      "cdp",
    ),
    url:
      process.env.BOREAL_X402_PRIMARY_FACILITATOR_URL?.trim() ||
      BOREAL_X402_PRIMARY_DEFAULT_URL,
  };
}

export function getBorealX402FallbackFacilitatorConfig() {
  const rawUrl = process.env.BOREAL_X402_FALLBACK_FACILITATOR_URL?.trim();

  return {
    kind: parseFacilitatorKind(
      process.env.BOREAL_X402_FALLBACK_FACILITATOR_KIND,
      "rapid402",
    ),
    url: rawUrl || BOREAL_X402_FALLBACK_DEFAULT_URL,
  };
}

function parseFacilitatorKind(
  value: string | undefined,
  fallback: BorealX402FacilitatorKind,
): BorealX402FacilitatorKind {
  const normalized = value?.trim().toLowerCase();

  if (normalized === "cdp" || normalized === "rapid402" || normalized === "generic") {
    return normalized;
  }

  return fallback;
}
