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
