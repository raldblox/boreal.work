import "server-only";

import { getWalletDisplayName, getWalletExternalId, verifySessionToken } from "./auth";
import type { OneRequestPaymentReceipt } from "./types";

export function requireAgentSession(request: Request) {
  const authorization = request.headers.get("authorization")?.trim() ?? "";
  const token = authorization.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length).trim()
    : "";

  if (!token) {
    throw new Error("Missing Bearer session token.");
  }

  const payload = verifySessionToken(token);

  return {
    displayName: getWalletDisplayName(payload.walletAddress),
    externalId: getWalletExternalId(payload.walletAddress),
    walletAddress: payload.walletAddress,
  };
}

export function parsePaymentReceiptHeader(request: Request): OneRequestPaymentReceipt | null {
  const headerValue = request.headers.get("x-boreal-payment-receipt");

  if (!headerValue) {
    return null;
  }

  const trimmed = headerValue.trim();

  try {
    return JSON.parse(trimmed) as OneRequestPaymentReceipt;
  } catch {
    try {
      return JSON.parse(Buffer.from(trimmed, "base64url").toString("utf8")) as OneRequestPaymentReceipt;
    } catch {
      throw new Error("Invalid x-boreal-payment-receipt header.");
    }
  }
}

export function getIdempotencyKey(request: Request, fallback: string) {
  return request.headers.get("idempotency-key")?.trim() || fallback;
}

export function buildTrackingUrls(request: Request, requestToken: string) {
  const url = new URL(request.url);
  const base = `${url.protocol}//${url.host}`;

  return {
    eventsUrl: `${base}/api/v1/requests/${requestToken}/events`,
    statusUrl: `${base}/api/v1/requests/${requestToken}`,
  };
}

export function buildSessionEnvelope(input: {
  eventsUrl: string;
  requestToken: string;
  route: Record<string, unknown>;
  session: Record<string, unknown>;
  statusUrl: string;
}) {
  return {
    requestToken: input.requestToken,
    route: input.route,
    session: input.session,
    tracking: {
      eventsUrl: input.eventsUrl,
      statusUrl: input.statusUrl,
    },
  };
}
