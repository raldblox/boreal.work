export const supportedVideoSeconds = ["4", "8", "12"] as const;
export const supportedVideoSizes = [
  "720x1280",
  "1280x720",
  "1024x1792",
  "1792x1024",
] as const;

export type SupportedVideoSeconds = (typeof supportedVideoSeconds)[number];
export type SupportedVideoSize = (typeof supportedVideoSizes)[number];

export const DEFAULT_BOREAL_VIDEO_SECONDS: SupportedVideoSeconds = "8";
export const DEFAULT_BOREAL_VIDEO_SIZE: SupportedVideoSize = "1280x720";

const portraitHintPattern =
  /\b(portrait|vertical|story|stories|reel|reels|shorts|tiktok)\b/i;
const landscapeHintPattern =
  /\b(landscape|horizontal|widescreen|youtube|cinematic|promo)\b/i;

export function normalizeVideoSeconds(
  value: unknown,
): SupportedVideoSeconds | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return supportedVideoSeconds.includes(String(value) as SupportedVideoSeconds)
      ? (String(value) as SupportedVideoSeconds)
      : null;
  }

  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim().toLowerCase();
  const normalized = trimmed.replace(/\s+/g, "");
  const parsed = normalized.match(/^(\d{1,2})(?:s|sec|secs|second|seconds)?$/i);

  if (!parsed) {
    return null;
  }

  const seconds = parsed[1] as SupportedVideoSeconds;
  return supportedVideoSeconds.includes(seconds) ? seconds : null;
}

export function normalizeVideoSize(value: unknown): SupportedVideoSize | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace("×", "x")
    .replace("by", "x");

  if (portraitHintPattern.test(normalized)) {
    return "720x1280";
  }

  if (landscapeHintPattern.test(normalized)) {
    return "1280x720";
  }

  return supportedVideoSizes.includes(normalized as SupportedVideoSize)
    ? (normalized as SupportedVideoSize)
    : null;
}

export function resolveVideoRequestSettings(input: {
  message: string;
  rawSeconds?: unknown;
  rawSize?: unknown;
}): {
  invalidDetails: string[];
  seconds: SupportedVideoSeconds;
  size: SupportedVideoSize;
} {
  const invalidDetails: string[] = [];
  const messageSeconds = parseVideoSecondsFromText(input.message);
  const messageSize = parseVideoSizeFromText(input.message);
  const hasExplicitRawSeconds = hasExplicitVideoValue(input.rawSeconds);
  const hasExplicitRawSize = hasExplicitVideoValue(input.rawSize);
  const rawSeconds = hasExplicitRawSeconds
    ? normalizeVideoSeconds(input.rawSeconds)
    : null;
  const rawSize = hasExplicitRawSize ? normalizeVideoSize(input.rawSize) : null;

  if (hasExplicitRawSeconds && rawSeconds === null) {
    invalidDetails.push(
      buildInvalidVideoSecondsMessage(String(input.rawSeconds)),
    );
  }

  if (hasExplicitRawSize && rawSize === null) {
    invalidDetails.push(buildInvalidVideoSizeMessage(String(input.rawSize)));
  }

  if (messageSeconds.invalidValue) {
    invalidDetails.push(buildInvalidVideoSecondsMessage(messageSeconds.invalidValue));
  }

  if (messageSize.invalidValue) {
    invalidDetails.push(buildInvalidVideoSizeMessage(messageSize.invalidValue));
  }

  return {
    invalidDetails: Array.from(new Set(invalidDetails)),
    seconds:
      rawSeconds ??
      messageSeconds.value ??
      DEFAULT_BOREAL_VIDEO_SECONDS,
    size: rawSize ?? messageSize.value ?? DEFAULT_BOREAL_VIDEO_SIZE,
  };
}

export function buildVideoSettingsSummary(input: {
  seconds: string;
  size: string;
}) {
  return `${input.seconds}-second render at ${input.size}`;
}

export function buildInvalidVideoSecondsMessage(value: string) {
  return `Boreal video requests currently support only 4, 8, or 12 seconds. Revise the requested ${value}-second duration or omit it and Boreal will use 8 seconds by default.`;
}

export function buildInvalidVideoSizeMessage(value: string) {
  return `Boreal video requests currently support only 720x1280, 1280x720, 1024x1792, or 1792x1024. Revise the requested ${value} size or omit it and Boreal will use 1280x720 by default.`;
}

function parseVideoSecondsFromText(text: string): {
  invalidValue?: string;
  value?: SupportedVideoSeconds;
} {
  const match = text.match(/\b(\d{1,2})\s*(?:-| )?(?:second|seconds|sec|secs|s)\b/i);

  if (!match) {
    return {};
  }

  const seconds = normalizeVideoSeconds(match[1]);
  if (!seconds) {
    return { invalidValue: match[1] };
  }

  return { value: seconds };
}

function parseVideoSizeFromText(text: string): {
  invalidValue?: string;
  value?: SupportedVideoSize;
} {
  const resolutionMatch = text.match(/\b(\d{3,4})\s*[x×]\s*(\d{3,4})\b/i);

  if (resolutionMatch) {
    const resolution = `${resolutionMatch[1]}x${resolutionMatch[2]}`;
    const normalized = normalizeVideoSize(resolution);

    if (!normalized) {
      return { invalidValue: resolution };
    }

    return { value: normalized };
  }

  if (/\bsquare\b/i.test(text)) {
    return { invalidValue: "square" };
  }

  if (portraitHintPattern.test(text)) {
    return { value: "720x1280" };
  }

  if (landscapeHintPattern.test(text)) {
    return { value: "1280x720" };
  }

  return {};
}

function hasExplicitVideoValue(value: unknown) {
  if (value === undefined || value === null) {
    return false;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();

    if (
      normalized.length === 0 ||
      normalized === "default" ||
      normalized === "auto" ||
      normalized === "omit" ||
      normalized === "omitted" ||
      normalized === "unspecified" ||
      normalized === "none" ||
      normalized === "n/a"
    ) {
      return false;
    }
  }

  return true;
}
