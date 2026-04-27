const encoder = new TextEncoder();

export function createWebhookToken(seed?: string) {
  return createToken("wh", seed);
}

export function createWebhookDeliveryToken(seed?: string) {
  return createToken("whd", seed);
}

export function createWebhookSecret(seed?: string) {
  return createToken("whsec", seed);
}

export async function createWebhookSignature(input: {
  payload: string;
  secret: string;
  timestamp: string;
}) {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(input.secret),
    { hash: "SHA-256", name: "HMAC" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(`${input.timestamp}.${input.payload}`),
  );

  return Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function createToken(prefix: string, seed?: string) {
  const raw = `${seed ?? ""}${Date.now().toString(36)}${crypto.randomUUID().replace(/-/g, "")}`;
  return `${prefix}_${raw}`;
}
