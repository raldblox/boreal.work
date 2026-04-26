import {
  createHash,
  createHmac,
  randomUUID,
  timingSafeEqual,
  verify as verifySignature,
} from "node:crypto";

type SessionPayload = {
  exp: number;
  iat: number;
  networkKey: "solana:devnet";
  purpose: "boreal-agent-session";
  walletAddress: string;
};

type ChallengePayload = {
  exp: number;
  iat: number;
  networkKey: "solana:devnet";
  nonce: string;
  purpose: "boreal-siwx-challenge";
  walletAddress: string;
};

const BOREAL_HOST = "boreal.work";
const DEFAULT_SESSION_TTL_MS = 24 * 60 * 60 * 1000;
const DEFAULT_CHALLENGE_TTL_MS = 10 * 60 * 1000;
const SOLANA_DEVNET = "solana:devnet" as const;
const BASE58_ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
const ED25519_SPKI_PREFIX = Buffer.from("302a300506032b6570032100", "hex");

export function createSiwxChallenge(input: { walletAddress: string }) {
  const issuedAt = Date.now();
  const expiresAt = issuedAt + DEFAULT_CHALLENGE_TTL_MS;
  const payload: ChallengePayload = {
    exp: expiresAt,
    iat: issuedAt,
    networkKey: SOLANA_DEVNET,
    nonce: randomUUID(),
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
  const payload = verifySignedPayload<ChallengePayload>(
    input.challengeToken,
    "boreal-siwx-challenge",
  );

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

export function createSessionToken(input: { walletAddress: string }) {
  const issuedAt = Date.now();
  const payload: SessionPayload = {
    exp: issuedAt + DEFAULT_SESSION_TTL_MS,
    iat: issuedAt,
    networkKey: SOLANA_DEVNET,
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

export function getWalletDisplayName(walletAddress: string) {
  if (walletAddress.length <= 12) {
    return walletAddress;
  }

  return `${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}`;
}

export function createRequestFingerprint(message: string) {
  return createHash("sha256")
    .update(normalizeMessage(message))
    .digest("hex");
}

export function createOpaqueToken(label: string, seed?: string) {
  const raw = createHash("sha256")
    .update(`${label}:${seed ?? randomUUID()}:${Date.now()}:${randomUUID()}`)
    .digest("hex");

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
    `Network: ${SOLANA_DEVNET}`,
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
  const spkiKey = Buffer.concat([ED25519_SPKI_PREFIX, publicKey]);
  const verified = verifySignature(
    null,
    Buffer.from(input.message, "utf8"),
    { format: "der", key: spkiKey, type: "spki" },
    signature,
  );

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
    networkKey: "solana:devnet";
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
    throw new Error("Payment receipt must include a Solana devnet transaction hash.");
  }

  if (input.receipt.walletAddress !== input.walletAddress) {
    throw new Error("Payment receipt wallet does not match the authenticated wallet.");
  }

  if (
    input.receipt.quoteToken !== input.quoteToken ||
    input.receipt.requestToken !== input.requestToken ||
    input.receipt.amount !== input.amount ||
    input.receipt.currency !== input.currency ||
    input.receipt.networkKey !== SOLANA_DEVNET
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
  return [
    `${BOREAL_HOST} wants you to sign in with your Solana account`,
    `Address: ${payload.walletAddress}`,
    `URI: https://${BOREAL_HOST}`,
    `Version: 1`,
    `Chain ID: ${payload.networkKey}`,
    `Nonce: ${payload.nonce}`,
    `Issued At: ${new Date(payload.iat).toISOString()}`,
    `Expiration Time: ${new Date(payload.exp).toISOString()}`,
    `Statement: Sign this message to access the Boreal one-request agent API.`,
  ].join("\n");
}

function normalizeMessage(message: string) {
  return message.trim().replace(/\s+/g, " ");
}

function signPayload(payload: Record<string, unknown>) {
  const serialized = JSON.stringify(payload);
  const encodedPayload = base64UrlEncode(Buffer.from(serialized, "utf8"));
  const signature = createHmac("sha256", getSigningSecret())
    .update(encodedPayload)
    .digest();

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

  const expectedSignature = createHmac("sha256", getSigningSecret())
    .update(encodedPayload)
    .digest();
  const actualSignature = base64UrlDecode(encodedSignature);

  if (
    expectedSignature.length !== actualSignature.length ||
    !timingSafeEqual(expectedSignature, actualSignature)
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
  return process.env.BOREAL_ONE_REQUEST_SECRET ?? "boreal-one-request-dev-secret";
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
