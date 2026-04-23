import "server-only";

import { getBorealRuntimeConfig } from "@/lib/boreal/config";
import { saveIntentPipelineRecord } from "@/lib/boreal/dal/intent-repository";
import { resolveProviderAdapter } from "@/lib/boreal/integrations/providers/registry";
import type { ComposableAgent } from "@/lib/boreal/agents/base";
import type {
  IntentExtraction,
  PersistedIntent,
} from "@/lib/boreal/schemas/intent";
import { classifyGenerationIntent } from "@/lib/boreal/tools/embeddings/classify-generation-intent";
import { extractStructuredIntent } from "@/lib/boreal/tools/llm/extract-structured-intent";
import {
  buildIntentPersistencePayload,
  buildIntentResponseMessage,
} from "@/lib/boreal/tools/ui/build-intent-response";

type IntentExtractionAgentInput = {
  message: string;
  conversationId?: string;
};

type IntentExtractionAgentOutput = {
  assistantMessage: string;
  conversationId: string;
  intentId: string;
  intent: PersistedIntent;
};

export const intentExtractionAgent: ComposableAgent<
  "intent-extraction",
  readonly [
    {
      name: "classify-generation-intent";
      description: string;
      execute: typeof classifyGenerationIntent;
    },
    {
      name: "extract-structured-intent";
      description: string;
      execute: typeof extractStructuredIntent;
    },
    {
      name: "save-intent-pipeline-record";
      description: string;
      execute: typeof saveIntentPipelineRecord;
    },
  ],
  IntentExtractionAgentInput,
  IntentExtractionAgentOutput
> = {
  name: "intent-extraction",
  description:
    "Extracts a structured Boreal intent from chat, classifies text/image/video generation demand, and persists the result to Convex.",
  tools: [
    {
      name: "classify-generation-intent",
      description:
        "Embeds a chat message and scores it against canonical text, image generation, and video generation profiles.",
      execute: classifyGenerationIntent,
    },
    {
      name: "extract-structured-intent",
      description:
        "Uses the configured LLM provider to emit a validated structured intent schema.",
      execute: extractStructuredIntent,
    },
    {
      name: "save-intent-pipeline-record",
      description:
        "Stores the chat exchange and extracted intent in Convex for later matching and routing.",
      execute: saveIntentPipelineRecord,
    },
  ] as const,
  async run(input) {
    const runtimeConfig = getBorealRuntimeConfig();
    const provider = resolveProviderAdapter();

    const modality = await classifyGenerationIntent({
      embeddingModelId: runtimeConfig.embeddingModel,
      message: input.message,
      provider,
    });

    const extractedIntent: IntentExtraction = await extractStructuredIntent({
      intentModelId: runtimeConfig.intentModel,
      message: input.message,
      modalityScores: modality.modalityScores,
      provider,
    });

    const conversationId = input.conversationId ?? crypto.randomUUID();
    const userMessageId = crypto.randomUUID();
    const assistantMessageId = crypto.randomUUID();
    const assistantMessage = buildIntentResponseMessage(extractedIntent);

    const persistedIntent = buildIntentPersistencePayload({
      assistantMessageId,
      conversationId,
      embedding: modality.embedding,
      embeddingModel: runtimeConfig.embeddingModel,
      intent: extractedIntent,
      intentModel: runtimeConfig.intentModel,
      modalityScores: modality.modalityScores,
      provider: provider.key,
      userMessageId,
    });

    const result = await saveIntentPipelineRecord({
      assistantMessage,
      conversationId,
      intent: persistedIntent,
      userMessage: input.message,
    });

    return {
      assistantMessage,
      conversationId: result.conversationId,
      intent: persistedIntent,
      intentId: result.intentId,
    };
  },
};
