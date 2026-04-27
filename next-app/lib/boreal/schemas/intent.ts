import {
  DEFAULT_BOREAL_VIDEO_SECONDS,
  DEFAULT_BOREAL_VIDEO_SIZE,
  resolveVideoRequestSettings,
} from "../media/video-contract.ts";

export type RequestedOutputType =
  | "text"
  | "image_generation"
  | "speech_generation"
  | "video_generation";

export type ToolRoute =
  | "general_assistance"
  | "catalog_lookup"
  | "profile_update"
  | "image_generation"
  | "speech_generation"
  | "video_generation"
  | "clarification";

export type ModalityProfileScore = {
  kind: RequestedOutputType;
  score: number;
};

export type IntentExtraction = {
  intentType: "demand" | "supply" | "informational";
  routeTarget: ToolRoute;
  title: string;
  summary: string;
  body: string;
  category: string;
  requestedOutputTypes: RequestedOutputType[];
  capabilityTags: string[];
  keywords: string[];
  confidence: number;
  generationSignals: {
    requestsText: boolean;
    requestsImageGeneration: boolean;
    requestsSpeechGeneration: boolean;
    requestsVideoGeneration: boolean;
    primaryMode: RequestedOutputType;
  };
  routing: {
    resolutionTier: "auto" | "fast" | "open" | "pending";
    shouldPersistToBoard: boolean;
    shouldCreateFulfillmentRequest: boolean;
  };
  persistence: {
    shouldPersist: boolean;
    isUnresolved: boolean;
    reason: string;
  };
  needsClarification: boolean;
  missingDetails: string[];
  suggestedReplies: string[];
  shouldSearchCatalog: boolean;
  catalogQuery: string;
  assetPrompt: string;
  speechText: string;
  videoSeconds: string;
  videoSize: string;
  voice: string;
  responseInstructions: string;
  extractionNotes: string[];
};

export type PersistedIntent = IntentExtraction & {
  conversationId: string;
  userMessageId: string;
  assistantMessageId: string;
  provider: string;
  intentModel: string;
  embeddingModel: string;
  embedding: number[];
  modalityScores: ModalityProfileScore[];
};

const requestedOutputTypeValues = [
  "text",
  "image_generation",
  "speech_generation",
  "video_generation",
] as const;

const routeValues = [
  "general_assistance",
  "catalog_lookup",
  "profile_update",
  "image_generation",
  "speech_generation",
  "video_generation",
  "clarification",
] as const;

const supportedSpeechVoices = [
  "alloy",
  "echo",
  "fable",
  "onyx",
  "nova",
  "shimmer",
  "coral",
  "verse",
  "ballad",
  "ash",
  "sage",
  "marin",
  "cedar",
] as const;

export type SupportedSpeechVoice = (typeof supportedSpeechVoices)[number];

export function normalizeIntentExtraction(
  rawIntent: Partial<IntentExtraction>,
  fallbackMessage: string,
  modalityScores: ModalityProfileScore[],
): IntentExtraction {
  const bestModality = modalityScores[0]?.kind ?? "text";
  const requestedOutputTypes = dedupeStrings(
    rawIntent.requestedOutputTypes,
    requestedOutputTypeValues,
  );
  const primaryMode = requestedOutputTypes[0] ?? bestModality;

  const routeTarget = routeValues.includes(
    rawIntent.routeTarget as ToolRoute,
  )
    ? (rawIntent.routeTarget as ToolRoute)
    : inferRouteTarget(primaryMode, rawIntent.shouldSearchCatalog);

  const confidence =
    typeof rawIntent.confidence === "number" &&
    Number.isFinite(rawIntent.confidence)
      ? clamp(rawIntent.confidence, 0, 1)
      : 0.62;

  const summary = normalizeString(rawIntent.summary, fallbackMessage, 320);
  const body = normalizeString(rawIntent.body, fallbackMessage, 1200);
  const title = normalizeString(
    rawIntent.title,
    summary.slice(0, 96) || "Boreal request",
    140,
  );

  const isVideoRequest =
    routeTarget === "video_generation" ||
    requestedOutputTypes.includes("video_generation");
  const videoSettings = isVideoRequest
    ? resolveVideoRequestSettings({
        message: fallbackMessage,
        rawSeconds: rawIntent.videoSeconds,
        rawSize: rawIntent.videoSize,
      })
    : {
        invalidDetails: [],
        seconds: DEFAULT_BOREAL_VIDEO_SECONDS,
        size: DEFAULT_BOREAL_VIDEO_SIZE,
      };
  const missingDetails = dedupePlainStrings([
    ...(Array.isArray(rawIntent.missingDetails) ? rawIntent.missingDetails : []),
    ...videoSettings.invalidDetails,
  ]).slice(0, 4);

  return {
    assetPrompt: normalizeString(rawIntent.assetPrompt, body, 1200),
    body,
    capabilityTags: dedupePlainStrings(rawIntent.capabilityTags).slice(0, 8),
    catalogQuery: normalizeString(rawIntent.catalogQuery, summary, 220),
    category: normalizeString(rawIntent.category, "general", 64),
    confidence,
    extractionNotes: dedupePlainStrings(rawIntent.extractionNotes).slice(0, 4),
    generationSignals: {
      primaryMode,
      requestsImageGeneration: requestedOutputTypes.includes(
        "image_generation",
      ),
      requestsSpeechGeneration: requestedOutputTypes.includes(
        "speech_generation",
      ),
      requestsText: requestedOutputTypes.includes("text"),
      requestsVideoGeneration: requestedOutputTypes.includes(
        "video_generation",
      ),
    },
    intentType: oneOf(rawIntent.intentType, [
      "demand",
      "supply",
      "informational",
    ], "demand"),
    keywords: dedupePlainStrings(rawIntent.keywords).slice(0, 15),
    missingDetails,
    needsClarification:
      Boolean(rawIntent.needsClarification) || missingDetails.length > 0,
    persistence: {
      isUnresolved:
        rawIntent.persistence?.isUnresolved ??
        (Boolean(rawIntent.needsClarification) || missingDetails.length > 0),
      reason: normalizeString(
        rawIntent.persistence?.reason,
        "Persisted as a routed Boreal intent.",
        180,
      ),
      shouldPersist:
        rawIntent.persistence?.shouldPersist ??
        (routeTarget === "profile_update" ||
          routeTarget === "image_generation" ||
          routeTarget === "speech_generation" ||
          routeTarget === "video_generation"),
    },
    requestedOutputTypes:
      requestedOutputTypes.length > 0 ? requestedOutputTypes : [bestModality],
    responseInstructions: normalizeString(
      rawIntent.responseInstructions,
      "Answer directly and keep rich artifacts out of inline chat when possible.",
      280,
    ),
    routeTarget,
    routing: {
      resolutionTier: oneOf(
        rawIntent.routing?.resolutionTier,
        ["auto", "fast", "open", "pending"],
        routeTarget === "general_assistance" ? "fast" : "auto",
      ),
      shouldCreateFulfillmentRequest:
        rawIntent.routing?.shouldCreateFulfillmentRequest ??
        false,
      shouldPersistToBoard:
        rawIntent.routing?.shouldPersistToBoard ??
        Boolean(rawIntent.persistence?.isUnresolved),
    },
    shouldSearchCatalog:
      rawIntent.shouldSearchCatalog ??
      (routeTarget === "catalog_lookup" ||
        routeTarget === "image_generation" ||
        routeTarget === "speech_generation" ||
        routeTarget === "video_generation"),
    speechText: normalizeString(rawIntent.speechText, summary, 1200),
    suggestedReplies: dedupePlainStrings(rawIntent.suggestedReplies).slice(0, 4),
    summary,
    title,
    videoSeconds: videoSettings.seconds,
    videoSize: videoSettings.size,
    voice: normalizeSpeechVoice(rawIntent.voice),
  };
}

function inferRouteTarget(
  primaryMode: RequestedOutputType,
  shouldSearchCatalog?: boolean,
): ToolRoute {
  if (primaryMode === "image_generation") {
    return "image_generation";
  }

  if (primaryMode === "speech_generation") {
    return "speech_generation";
  }

  if (primaryMode === "video_generation") {
    return "video_generation";
  }

  if (shouldSearchCatalog) {
    return "catalog_lookup";
  }

  return "general_assistance";
}

function dedupeStrings<T extends string>(
  values: unknown,
  allowed: readonly T[],
): T[] {
  const deduped = dedupePlainStrings(values);
  return deduped.filter((value): value is T =>
    allowed.includes(value as T),
  );
}

function dedupePlainStrings(values: unknown) {
  if (!Array.isArray(values)) {
    return [];
  }

  return Array.from(
    new Set(
      values
        .filter((value): value is string => typeof value === "string")
        .map((value) => value.trim())
        .filter(Boolean),
    ),
  );
}

function normalizeString(value: unknown, fallback: string, maxLength: number) {
  if (typeof value === "string" && value.trim()) {
    return value.trim().slice(0, maxLength);
  }

  return fallback.trim().slice(0, maxLength);
}

function oneOf<T extends string>(
  value: unknown,
  allowed: readonly T[],
  fallback: T,
): T {
  return typeof value === "string" && allowed.includes(value as T)
    ? (value as T)
    : fallback;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function normalizeSpeechVoice(value: unknown): SupportedSpeechVoice {
  if (typeof value !== "string") {
    return "alloy";
  }

  const normalized = value.trim().toLowerCase();

  if (
    supportedSpeechVoices.includes(normalized as SupportedSpeechVoice)
  ) {
    return normalized as SupportedSpeechVoice;
  }

  return "alloy";
}
