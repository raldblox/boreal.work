import type { IntentExtraction, PersistedIntent } from "@/lib/boreal/schemas/intent";

export function buildIntentResponseMessage(intent: IntentExtraction) {
  const modes = intent.requestedOutputTypes
    .map((value: string) => value.replaceAll("_", " "))
    .join(", ");

  return [
    "## Intent captured",
    `**Title:** ${intent.title}`,
    `**Category:** ${intent.category}`,
    `**Requested modes:** ${modes}`,
    `**Resolution tier:** ${intent.routing.resolutionTier}`,
    "",
    intent.summary,
    "",
    "### Signals",
    `- Text requested: ${intent.generationSignals.requestsText ? "yes" : "no"}`,
    `- Image generation requested: ${intent.generationSignals.requestsImageGeneration ? "yes" : "no"}`,
    `- Video generation requested: ${intent.generationSignals.requestsVideoGeneration ? "yes" : "no"}`,
    "",
    `### Keywords\n${intent.keywords
      .map((keyword: string) => `- ${keyword}`)
      .join("\n")}`,
  ].join("\n");
}

export function buildIntentPersistencePayload(input: {
  conversationId: string;
  userMessageId: string;
  assistantMessageId: string;
  intent: IntentExtraction;
  provider: string;
  intentModel: string;
  embeddingModel: string;
  embedding: number[];
  modalityScores: PersistedIntent["modalityScores"];
}): PersistedIntent {
  return {
    ...input.intent,
    assistantMessageId: input.assistantMessageId,
    conversationId: input.conversationId,
    embedding: input.embedding,
    embeddingModel: input.embeddingModel,
    intentModel: input.intentModel,
    modalityScores: input.modalityScores,
    provider: input.provider,
    userMessageId: input.userMessageId,
  };
}
