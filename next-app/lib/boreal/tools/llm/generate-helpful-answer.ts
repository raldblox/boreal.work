import "server-only";

import { generateText } from "ai";

import type { BorealProviderAdapter } from "@/lib/boreal/integrations/providers/types";
import type { CatalogItem } from "@/lib/boreal/schemas/chat";
import type { IntentExtraction } from "@/lib/boreal/schemas/intent";

export async function generateHelpfulAnswer(input: {
  assistantModelId: string;
  catalogItems: CatalogItem[];
  intent: IntentExtraction;
  message: string;
  provider: BorealProviderAdapter;
}): Promise<string> {
  const { text } = await generateText({
    model: input.provider.getAssistantModel(input.assistantModelId),
    prompt: buildPrompt(input),
    system:
      "You are Boreal, a helpful orchestration chatbot. Answer directly, avoid internal routing jargon, and keep non-text artifacts out of the inline message because they will appear in a workspace panel.",
  });

  return text.trim() || fallbackAnswer(input.intent, input.catalogItems);
}

function buildPrompt(input: {
  catalogItems: CatalogItem[];
  intent: IntentExtraction;
  message: string;
}) {
  const catalogBlock =
    input.catalogItems.length === 0
      ? "No catalog matches were found."
      : input.catalogItems
          .map(
            (item, index) =>
              `${index + 1}. ${item.title} | ${item.category} | ${item.priceLabel} | ${item.description}`,
          )
          .join("\n");

  return [
    `User message: """${input.message}"""`,
    `Intent route: ${input.intent.routeTarget}`,
    `Intent summary: ${input.intent.summary}`,
    `Intent instructions: ${input.intent.responseInstructions}`,
    input.intent.needsClarification
      ? `Missing details: ${input.intent.missingDetails.join(", ")}`
      : "Missing details: none",
    "Catalog matches:",
    catalogBlock,
    "Answer requirements:",
    "- Be useful and concise.",
    "- If catalog matches exist, summarize the best matches and when to choose them.",
    "- If the user asked a general question, answer it plainly first.",
    "- Do not emit JSON, schemas, scores, or internal extractor details.",
    "- If the request is incomplete, ask only for the missing details that matter.",
  ].join("\n");
}

function fallbackAnswer(intent: IntentExtraction, catalogItems: CatalogItem[]) {
  if (intent.needsClarification) {
    return [
      "I can continue, but I still need:",
      ...intent.missingDetails.map((detail) => `- ${detail}`),
    ].join("\n");
  }

  if (catalogItems.length > 0) {
    const titles = catalogItems.slice(0, 3).map((item) => item.title).join(", ");
    return `I found matching Boreal options: ${titles}. Open the catalog panel for the full list.`;
  }

  return intent.summary;
}
