import "server-only";

import { generateText, Output } from "ai";

import type { BorealProviderAdapter } from "@/lib/boreal/integrations/providers/types";
import {
  intentExtractionSchema,
  normalizeIntentExtraction,
  type IntentExtraction,
  type ModalityProfileScore,
} from "@/lib/boreal/schemas/intent";

export async function extractStructuredIntent(input: {
  message: string;
  intentModelId: string;
  provider: BorealProviderAdapter;
  modalityScores: ModalityProfileScore[];
}): Promise<IntentExtraction> {
  const { output } = await generateText({
    model: input.provider.getIntentModel(input.intentModelId),
    output: Output.object({
      schema: intentExtractionSchema,
    }),
    prompt: buildPrompt(input.message, input.modalityScores),
  });

  return normalizeIntentExtraction(output as IntentExtraction);
}

function buildPrompt(message: string, modalityScores: ModalityProfileScore[]) {
  const modalityHint = modalityScores
    .map(({ kind, score }) => `${kind}: ${score.toFixed(4)}`)
    .join(", ");

  return [
    "You are Boreal's intent extraction agent.",
    "Return a structured object that captures the user's fulfillment intent.",
    "Boreal routes intent to tools, listings, agents, and human operators.",
    "Use the embedding-based modality hints, but correct them if the message clearly indicates something else.",
    "Requested output types must always include at least one of: text, image_generation, video_generation.",
    "Use 'auto' resolution tier when the request is for instantly deliverable generation work such as image or video generation.",
    "Use 'open' when the request likely requires human or multi-step fulfillment.",
    `Embedding modality hints: ${modalityHint}`,
    `User message: """${message}"""`,
  ].join("\n");
}
