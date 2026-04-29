export function toUsdcMicros(amount?: number | null) {
  if (typeof amount !== "number" || !Number.isFinite(amount) || amount <= 0) {
    return undefined;
  }

  return BigInt(Math.round(amount * 1_000_000));
}

export function parsePaymentResponseHeader(headerValue: string | null) {
  if (!headerValue) {
    return null;
  }

  try {
    return JSON.parse(headerValue) as Record<string, unknown>;
  } catch {
    return {
      raw: headerValue,
    };
  }
}

export function parsePaymentRequiredHeader(headerValue: string | null) {
  if (!headerValue) {
    return null;
  }

  const trimmed = headerValue.trim();
  if (!trimmed) {
    return null;
  }

  const decoded = tryDecodeBase64Json(trimmed);
  if (decoded) {
    return decoded;
  }

  try {
    return JSON.parse(trimmed) as Record<string, unknown> | unknown[];
  } catch {
    return {
      raw: headerValue,
    };
  }
}

export function inferInvocationAccess(responseBody: unknown) {
  if (!responseBody || typeof responseBody !== "object") {
    return {
      accessLabel: undefined,
      accessUrl: undefined,
      resultSummary: undefined,
    };
  }

  const record = responseBody as Record<string, unknown>;
  const candidateUrl =
    pickString(record.downloadUrl) ??
    pickString(record.download_url) ??
    pickString(record.url) ??
    pickString(record.resultUrl) ??
    pickString(record.link);

  return {
    accessLabel: candidateUrl ? "Open result" : undefined,
    accessUrl: candidateUrl,
    resultSummary: pickString(record.message) ?? pickString(record.status),
  };
}

function pickString(value: unknown) {
  return typeof value === "string" && value.trim() ? value : undefined;
}

function tryDecodeBase64Json(value: string) {
  for (const candidate of [value, normalizeBase64(value)]) {
    try {
      const decoded = Buffer.from(candidate, "base64").toString("utf8").trim();
      if (!decoded) {
        continue;
      }
      return JSON.parse(decoded) as Record<string, unknown> | unknown[];
    } catch {
      continue;
    }
  }

  return null;
}

function normalizeBase64(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const remainder = normalized.length % 4;

  if (remainder === 0) {
    return normalized;
  }

  return `${normalized}${"=".repeat(4 - remainder)}`;
}
