import type { Id } from "../../../convex/_generated/dataModel";

const PUBLIC_REQUEST_PREFIX = "req_public_";
const INBOX_ENTRY_PREFIX = "ibox_";
const PAYOUT_PREFIX = "payout_";
const INBOX_DELIMITER = "__";

export function createPublicRequestToken(intentId: string | Id<"intents">) {
  return `${PUBLIC_REQUEST_PREFIX}${intentId}`;
}

export function parsePublicRequestToken(
  requestToken: string,
): Id<"intents"> | null {
  if (!requestToken.startsWith(PUBLIC_REQUEST_PREFIX)) {
    return null;
  }

  const intentId = requestToken.slice(PUBLIC_REQUEST_PREFIX.length).trim();
  return intentId ? (intentId as Id<"intents">) : null;
}

export function isPublicRequestToken(requestToken: string) {
  return parsePublicRequestToken(requestToken) !== null;
}

export function createInboxEntryToken(input: {
  intentId: string | Id<"intents">;
  supplyId: string | Id<"supplies">;
}) {
  return `${INBOX_ENTRY_PREFIX}${input.intentId}${INBOX_DELIMITER}${input.supplyId}`;
}

export function parseInboxEntryToken(
  entryToken: string,
): { intentId: Id<"intents">; supplyId: Id<"supplies"> } | null {
  if (!entryToken.startsWith(INBOX_ENTRY_PREFIX)) {
    return null;
  }

  const raw = entryToken.slice(INBOX_ENTRY_PREFIX.length);
  const [intentId, supplyId] = raw.split(INBOX_DELIMITER);

  if (!intentId || !supplyId) {
    return null;
  }

  return {
    intentId: intentId as Id<"intents">,
    supplyId: supplyId as Id<"supplies">,
  };
}

export function createPayoutToken(payoutId: string | Id<"payouts">) {
  return `${PAYOUT_PREFIX}${payoutId}`;
}

export function parsePayoutToken(
  payoutToken: string,
): Id<"payouts"> | null {
  if (!payoutToken.startsWith(PAYOUT_PREFIX)) {
    return null;
  }

  const payoutId = payoutToken.slice(PAYOUT_PREFIX.length).trim();
  return payoutId ? (payoutId as Id<"payouts">) : null;
}
