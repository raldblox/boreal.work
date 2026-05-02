import { createHmac, timingSafeEqual } from "node:crypto";

type DesktopConnectGrantPayload = {
  exp: number;
  iat: number;
  ownerExternalId: string;
  purpose: "boreal-desktop-connect";
  walletAddress: string;
};

const DEFAULT_DESKTOP_CONNECT_TTL_MS = 5 * 60 * 1000;
const DEVELOPMENT_DESKTOP_CONNECT_SECRET = "boreal-desktop-connect-dev-secret";

export function createDesktopConnectGrant(input: {
  ownerExternalId: string;
  walletAddress: string;
}) {
  const issuedAt = Date.now();
  const expiresAt = issuedAt + DEFAULT_DESKTOP_CONNECT_TTL_MS;
  const payload: DesktopConnectGrantPayload = {
    exp: expiresAt,
    iat: issuedAt,
    ownerExternalId: input.ownerExternalId,
    purpose: "boreal-desktop-connect",
    walletAddress: input.walletAddress,
  };

  return {
    expiresAt,
    grantToken: signDesktopConnectPayload(payload),
  };
}

export function verifyDesktopConnectGrant(
  grantToken: string,
): DesktopConnectGrantPayload {
  return verifyDesktopConnectPayload(grantToken, "boreal-desktop-connect");
}

export function buildDesktopConnectLaunchUrl(input: {
  apiBaseUrl: string;
  grantToken: string;
}) {
  const url = new URL("boreal-desktop://connect");
  url.searchParams.set("apiBaseUrl", normalizeBaseUrl(input.apiBaseUrl));
  url.searchParams.set("grant", input.grantToken);
  return url.toString();
}

function signDesktopConnectPayload(payload: DesktopConnectGrantPayload) {
  const serialized = JSON.stringify(payload);
  const encodedPayload = base64UrlEncode(Buffer.from(serialized, "utf8"));
  const signature = createHmac("sha256", getDesktopConnectSecret())
    .update(encodedPayload)
    .digest();

  return `${encodedPayload}.${base64UrlEncode(signature)}`;
}

function verifyDesktopConnectPayload<
  T extends { exp: number; purpose: string },
>(token: string, expectedPurpose: T["purpose"]) {
  const [encodedPayload, encodedSignature] = token.split(".");

  if (!encodedPayload || !encodedSignature) {
    throw new Error("Malformed desktop connect grant.");
  }

  const expectedSignature = createHmac("sha256", getDesktopConnectSecret())
    .update(encodedPayload)
    .digest();
  const actualSignature = base64UrlDecode(encodedSignature);

  if (
    expectedSignature.length !== actualSignature.length ||
    !timingSafeEqual(expectedSignature, actualSignature)
  ) {
    throw new Error("Desktop connect grant verification failed.");
  }

  const payload = JSON.parse(base64UrlDecode(encodedPayload).toString("utf8")) as T;

  if (payload.purpose !== expectedPurpose) {
    throw new Error("Desktop connect grant purpose mismatch.");
  }

  if (payload.exp <= Date.now()) {
    throw new Error("Desktop connect grant expired.");
  }

  return payload;
}

function getDesktopConnectSecret() {
  const configuredSecret =
    process.env.BOREAL_DESKTOP_CONNECT_SECRET?.trim() ??
    process.env.BOREAL_ONE_REQUEST_SECRET?.trim();

  if (configuredSecret) {
    return configuredSecret;
  }

  if (process.env.NODE_ENV !== "production") {
    return DEVELOPMENT_DESKTOP_CONNECT_SECRET;
  }

  throw new Error(
    "Missing desktop connect signing secret for the Boreal desktop auth boundary.",
  );
}

function normalizeBaseUrl(value: string) {
  return value.trim().replace(/\/+$/, "");
}

function base64UrlEncode(value: Buffer) {
  return value
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function base64UrlDecode(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padding =
    normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4));

  return Buffer.from(`${normalized}${padding}`, "base64");
}
