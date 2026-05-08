import { getDefaultSolanaNetworkKey } from "../solana-network.ts";

const BOREAL_HOST = "boreal.work";

export function buildPaymentAuthorizationMessage(input: {
  amount: number;
  currency: string;
  quoteToken: string;
  requestToken: string;
}) {
  const paymentReference = buildPaymentReferenceMemo({
    quoteToken: input.quoteToken,
    requestToken: input.requestToken,
  });

  return [
    `${BOREAL_HOST} payment authorization`,
    `Request: ${input.requestToken}`,
    `Quote: ${input.quoteToken}`,
    `Amount: ${input.amount} ${input.currency}`,
    `Network: ${getDefaultSolanaNetworkKey()}`,
    `Reference: ${paymentReference}`,
    "Purpose: authorize one Boreal auto route execution",
  ].join("\n");
}

export function buildPaymentReferenceMemo(input: {
  quoteToken: string;
  requestToken: string;
}) {
  return `boreal:one-request:${input.requestToken}:${input.quoteToken}`;
}
