import { jsonSchema } from "ai";

export type RequestedOutputType =
  | "text"
  | "image_generation"
  | "video_generation";

export type ModalityProfileScore = {
  kind: RequestedOutputType;
  score: number;
};

export type IntentExtraction = {
  intentType: "demand" | "supply" | "informational";
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
    requestsVideoGeneration: boolean;
    primaryMode: RequestedOutputType;
  };
  routing: {
    resolutionTier: "auto" | "fast" | "open" | "pending";
    shouldPersistToBoard: boolean;
    shouldCreateFulfillmentRequest: boolean;
  };
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
  "video_generation",
] as const;

export const intentExtractionSchema = jsonSchema({
  type: "object",
  additionalProperties: false,
  required: [
    "intentType",
    "title",
    "summary",
    "body",
    "category",
    "requestedOutputTypes",
    "capabilityTags",
    "keywords",
    "confidence",
    "generationSignals",
    "routing",
    "extractionNotes",
  ],
  properties: {
    intentType: {
      type: "string",
      enum: ["demand", "supply", "informational"],
    },
    title: {
      type: "string",
      minLength: 3,
      maxLength: 140,
    },
    summary: {
      type: "string",
      minLength: 12,
      maxLength: 320,
    },
    body: {
      type: "string",
      minLength: 1,
    },
    category: {
      type: "string",
      minLength: 2,
      maxLength: 64,
    },
    requestedOutputTypes: {
      type: "array",
      minItems: 1,
      maxItems: 3,
      items: {
        type: "string",
        enum: [...requestedOutputTypeValues],
      },
    },
    capabilityTags: {
      type: "array",
      minItems: 2,
      maxItems: 8,
      items: {
        type: "string",
        minLength: 2,
        maxLength: 48,
      },
    },
    keywords: {
      type: "array",
      minItems: 5,
      maxItems: 15,
      items: {
        type: "string",
        minLength: 2,
        maxLength: 48,
      },
    },
    confidence: {
      type: "number",
      minimum: 0,
      maximum: 1,
    },
    generationSignals: {
      type: "object",
      additionalProperties: false,
      required: [
        "requestsText",
        "requestsImageGeneration",
        "requestsVideoGeneration",
        "primaryMode",
      ],
      properties: {
        requestsText: { type: "boolean" },
        requestsImageGeneration: { type: "boolean" },
        requestsVideoGeneration: { type: "boolean" },
        primaryMode: {
          type: "string",
          enum: ["text", "image_generation", "video_generation"],
        },
      },
    },
    routing: {
      type: "object",
      additionalProperties: false,
      required: [
        "resolutionTier",
        "shouldPersistToBoard",
        "shouldCreateFulfillmentRequest",
      ],
      properties: {
        resolutionTier: {
          type: "string",
          enum: ["auto", "fast", "open", "pending"],
        },
        shouldPersistToBoard: { type: "boolean" },
        shouldCreateFulfillmentRequest: { type: "boolean" },
      },
    },
    extractionNotes: {
      type: "array",
      minItems: 1,
      maxItems: 4,
      items: {
        type: "string",
        minLength: 3,
        maxLength: 180,
      },
    },
  },
});

export function normalizeIntentExtraction(
  intent: IntentExtraction,
): IntentExtraction {
  const requestedOutputTypes = Array.from(
    new Set(intent.requestedOutputTypes),
  ).filter((value): value is RequestedOutputType =>
    requestedOutputTypeValues.includes(value as RequestedOutputType),
  );

  return {
    ...intent,
    capabilityTags: Array.from(new Set(intent.capabilityTags)),
    keywords: Array.from(new Set(intent.keywords)),
    requestedOutputTypes:
      requestedOutputTypes.length > 0
        ? requestedOutputTypes
        : [intent.generationSignals.primaryMode],
  };
}
