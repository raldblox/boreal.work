import { ed25519 } from "@noble/curves/ed25519";
import { hmac } from "@noble/hashes/hmac";
import { sha256 } from "@noble/hashes/sha2";
import { bytesToHex, utf8ToBytes } from "@noble/hashes/utils";

import {
  getDefaultSolanaNetworkKey,
  getDefaultSolanaNetworkLabel,
  type BorealSolanaNetworkKey,
} from "../solana-network.ts";

type SessionPayload = {
  exp: number;
  iat: number;
  networkKey: BorealSolanaNetworkKey;
  purpose: "boreal-agent-session";
  walletAddress: string;
};

type ChallengePayload = {
  exp: number;
  iat: number;
  networkKey: BorealSolanaNetworkKey;
  nonce: string;
  purpose: "boreal-siwx-challenge";
  walletAddress: string;
};

const BOREAL_HOST = "boreal.work";
const DEFAULT_SESSION_TTL_MS = 24 * 60 * 60 * 1000;
const DEFAULT_CHALLENGE_TTL_MS = 10 * 60 * 1000;
const DEVELOPMENT_SIGNING_SECRET = "boreal-one-request-dev-secret";
const BASE58_ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

export function createSiwxChallenge(input: { walletAddress: string }) {
  const issuedAt = Date.now();
  const expiresAt = issuedAt + DEFAULT_CHALLENGE_TTL_MS;
  const networkKey = getDefaultSolanaNetworkKey();
  const payload: ChallengePayload = {
    exp: expiresAt,
    iat: issuedAt,
    networkKey,
    nonce: crypto.randomUUID(),
    purpose: "boreal-siwx-challenge",
    walletAddress: input.walletAddress,
  };

  const token = signPayload(payload);

  return {
    challengeToken: token,
    expiresAt,
    message: buildChallengeMessage(payload),
    walletAddress: input.walletAddress,
  };
}

export function verifySiwxChallenge(input: {
  challengeToken: string;
  signature: string;
  walletAddress: string;
}) {
  const payload = readSiwxChallengeToken(input.challengeToken);

  if (payload.walletAddress !== input.walletAddress) {
    throw new Error("Wallet address does not match the issued challenge.");
  }

  const message = buildChallengeMessage(payload);
  verifySolanaMessageSignature({
    message,
    signature: input.signature,
    walletAddress: input.walletAddress,
  });

  return {
    sessionToken: createSessionToken({
      walletAddress: input.walletAddress,
    }),
    walletAddress: input.walletAddress,
  };
}

export function readSiwxChallengeToken(challengeToken: string) {
  return verifySignedPayload<ChallengePayload>(
    challengeToken,
    "boreal-siwx-challenge",
  );
}

export function createSessionToken(input: { walletAddress: string }) {
  const issuedAt = Date.now();
  const networkKey = getDefaultSolanaNetworkKey();
  const payload: SessionPayload = {
    exp: issuedAt + DEFAULT_SESSION_TTL_MS,
    iat: issuedAt,
    networkKey,
    purpose: "boreal-agent-session",
    walletAddress: input.walletAddress,
  };

  return signPayload(payload);
}

export function verifySessionToken(token: string) {
  return verifySignedPayload<SessionPayload>(token, "boreal-agent-session");
}

export function getWalletExternalId(walletAddress: string) {
  return `wallet:solana:${walletAddress}`;
}

export function getProvisionalExternalId(seed: string) {
  return `guest:solana:${sha256Hex(seed).slice(0, 24)}`;
}

export function getWalletDisplayName(walletAddress: string) {
  if (walletAddress.length <= 12) {
    return walletAddress;
  }

  return `${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}`;
}

export function createRequestFingerprint(message: string) {
  return sha256Hex(normalizeMessage(message));
}

export function createSignedTokenFingerprint(token: string) {
  return sha256Hex(token);
}

export function createOpaqueToken(label: string, seed?: string) {
  const raw = sha256Hex(
    `${label}:${seed ?? crypto.randomUUID()}:${Date.now()}:${crypto.randomUUID()}`,
  );

  return `${label}_${raw.slice(0, 32)}`;
}

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

export function verifySolanaMessageSignature(input: {
  message: string;
  signature: string;
  walletAddress: string;
}) {
  const publicKey = decodeSolanaPublicKey(input.walletAddress);
  const signature = decodeFlexibleBinary(input.signature);
  const verified = ed25519.verify(signature, utf8ToBytes(input.message), publicKey);

  if (!verified) {
    throw new Error("Wallet signature verification failed.");
  }
}

export function verifyPaymentReceipt(input: {
  amount: number;
  authorizationMessage?: string;
  currency: string;
  quoteToken: string;
  receipt: {
    amount: number;
    currency: string;
    networkKey: BorealSolanaNetworkKey;
    quoteToken: string;
    requestToken: string;
    signature: string;
    signedMessage?: string;
    txHash: string;
    walletAddress: string;
  };
  requestToken: string;
  walletAddress: string;
}) {
  if (!input.receipt.txHash?.trim()) {
    throw new Error("Payment receipt must include a Solana transaction hash.");
  }

  if (input.receipt.walletAddress !== input.walletAddress) {
    throw new Error("Payment receipt wallet does not match the authenticated wallet.");
  }

  if (
    input.receipt.quoteToken !== input.quoteToken ||
    input.receipt.requestToken !== input.requestToken ||
    input.receipt.amount !== input.amount ||
    input.receipt.currency !== input.currency ||
    input.receipt.networkKey !== getDefaultSolanaNetworkKey()
  ) {
    throw new Error("Payment receipt does not match the locked quote.");
  }

  const expectedMessage =
    input.authorizationMessage ??
    buildPaymentAuthorizationMessage({
      amount: input.amount,
      currency: input.currency,
      quoteToken: input.quoteToken,
      requestToken: input.requestToken,
    });
  const signedMessage = input.receipt.signedMessage ?? expectedMessage;

  if (signedMessage !== expectedMessage) {
    throw new Error("Payment receipt signed message does not match Boreal's quote.");
  }

  verifySolanaMessageSignature({
    message: signedMessage,
    signature: input.receipt.signature,
    walletAddress: input.walletAddress,
  });
}

function buildChallengeMessage(payload: ChallengePayload) {
  const label = getDefaultSolanaNetworkLabel().toLowerCase();

  return [
    `${BOREAL_HOST} wants you to sign in with your Solana account`,
    `Address: ${payload.walletAddress}`,
    `URI: https://${BOREAL_HOST}`,
    `Version: 1`,
    `Chain ID: ${payload.networkKey}`,
    `Nonce: ${payload.nonce}`,
    `Issued At: ${new Date(payload.iat).toISOString()}`,
    `Expiration Time: ${new Date(payload.exp).toISOString()}`,
    `Statement: Sign this message to access the Boreal one-request agent API on ${label}.`,
  ].join("\n");
}

function normalizeMessage(message: string) {
  return message.trim().replace(/\s+/g, " ");
}

function signPayload(payload: Record<string, unknown>) {
  const serialized = JSON.stringify(payload);
  const encodedPayload = base64UrlEncode(Buffer.from(serialized, "utf8"));
  const signature = createSha256Hmac(getSigningSecret(), encodedPayload);

  return `${encodedPayload}.${base64UrlEncode(signature)}`;
}

function verifySignedPayload<T extends { exp: number; purpose: string }>(
  token: string,
  expectedPurpose: T["purpose"],
) {
  const [encodedPayload, encodedSignature] = token.split(".");

  if (!encodedPayload || !encodedSignature) {
    throw new Error("Malformed signed token.");
  }

  const expectedSignature = createSha256Hmac(getSigningSecret(), encodedPayload);
  const actualSignature = base64UrlDecode(encodedSignature);

  if (
    expectedSignature.length !== actualSignature.length ||
    !constantTimeEqual(expectedSignature, actualSignature)
  ) {
    throw new Error("Signed token verification failed.");
  }

  const payload = JSON.parse(base64UrlDecode(encodedPayload).toString("utf8")) as T;

  if (payload.purpose !== expectedPurpose) {
    throw new Error("Signed token purpose mismatch.");
  }

  if (payload.exp <= Date.now()) {
    throw new Error("Signed token expired.");
  }

  return payload;
}

function getSigningSecret() {
  const configuredSecret = process.env.BOREAL_ONE_REQUEST_SECRET?.trim();

  if (configuredSecret) {
    return configuredSecret;
  }

  // Production must fail closed here. A shared fallback secret would let
  // anyone mint Boreal bearer tokens for arbitrary wallets.
  if (process.env.NODE_ENV !== "production") {
    return DEVELOPMENT_SIGNING_SECRET;
  }

  throw new Error(
    "Missing BOREAL_ONE_REQUEST_SECRET for the one-request auth boundary.",
  );
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
  const padding = normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4));

  return Buffer.from(`${normalized}${padding}`, "base64");
}

function decodeFlexibleBinary(value: string) {
  const trimmed = value.trim();

  if (/^[0-9a-fA-F]+$/.test(trimmed) && trimmed.length % 2 === 0) {
    return Buffer.from(trimmed, "hex");
  }

  const looksLikeBase64 =
    /^[A-Za-z0-9+/_=-]+$/.test(trimmed) &&
    (trimmed.includes("=") ||
      trimmed.includes("+") ||
      trimmed.includes("/") ||
      trimmed.includes("_") ||
      trimmed.includes("-") ||
      trimmed.length % 4 === 0);

  if (looksLikeBase64) {
    try {
      return Buffer.from(trimmed, "base64");
    } catch {
      return base64UrlDecode(trimmed);
    }
  }

  return decodeBase58(trimmed);
}

function decodeSolanaPublicKey(value: string) {
  const decoded = decodeBase58(value);

  if (decoded.length !== 32) {
    throw new Error("Invalid Solana public key length.");
  }

  return decoded;
}

function decodeBase58(value: string) {
  const digits = [0];

  for (const character of value) {
    const index = BASE58_ALPHABET.indexOf(character);

    if (index === -1) {
      throw new Error("Invalid base58 value.");
    }

    let carry = index;

    for (let digitIndex = 0; digitIndex < digits.length; digitIndex += 1) {
      carry += digits[digitIndex] * 58;
      digits[digitIndex] = carry & 0xff;
      carry >>= 8;
    }

    while (carry > 0) {
      digits.push(carry & 0xff);
      carry >>= 8;
    }
  }

  for (const character of value) {
    if (character === "1") {
      digits.push(0);
    } else {
      break;
    }
  }

  return Buffer.from(digits.reverse());
}

function createSha256Hmac(secret: string, value: string) {
  return Buffer.from(hmac(sha256, utf8ToBytes(secret), utf8ToBytes(value)));
}

function sha256Hex(value: string) {
  return bytesToHex(sha256(utf8ToBytes(value)));
}

function constantTimeEqual(left: Uint8Array, right: Uint8Array) {
  if (left.length !== right.length) {
    return false;
  }

  let mismatch = 0;

  for (let index = 0; index < left.length; index += 1) {
    mismatch |= left[index] ^ right[index];
  }

  return mismatch === 0;
}
