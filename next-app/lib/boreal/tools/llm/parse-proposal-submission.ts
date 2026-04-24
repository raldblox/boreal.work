import "server-only";

import { generateText } from "ai";

import type { BorealProviderAdapter } from "@/lib/boreal/integrations/providers/types";
import { normalizeProposalDraft, type ProposalDraft } from "@/lib/boreal/schemas/proposal";

export async function parseProposalSubmission(input: {
  intentSummary: string;
  intentTitle: string;
  message: string;
  modelId: string;
  provider: BorealProviderAdapter;
}): Promise<ProposalDraft> {
  const { text } = await generateText({
    model: input.provider.getAssistantModel(input.modelId),
    prompt: buildPrompt(input),
  });

  return normalizeProposalDraft(extractJsonObject(text), input.message);
}

function buildPrompt(input: {
  intentSummary: string;
  intentTitle: string;
  message: string;
}) {
  return [
    "You are Boreal's proposal parser.",
    "Convert the worker's freeform offer into one JSON object only.",
    "Do not use markdown fences.",
    "{",
    '  "summary": string,',
    '  "deliverablesBody": string,',
    '  "deliverablesType": "markdown" | "file" | "link",',
    '  "price": number,',
    '  "currency": string,',
    '  "etaDays": number',
    "}",
    "Rules:",
    "- Keep the proposal practical and concise.",
    "- If the worker gave no explicit quote, infer a reasonable placeholder from the offer but keep it conservative.",
    "- etaDays must be a positive number of days.",
    `Request title: ${input.intentTitle}`,
    `Request summary: ${input.intentSummary}`,
    `Worker proposal: """${input.message}"""`,
  ].join("\n");
}

function extractJsonObject(text: string): Record<string, unknown> {
  const trimmed = text.trim();

  try {
    return JSON.parse(trimmed) as Record<string, unknown>;
  } catch {
    const firstBrace = trimmed.indexOf("{");
    const lastBrace = trimmed.lastIndexOf("}");

    if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
      return {};
    }

    try {
      return JSON.parse(trimmed.slice(firstBrace, lastBrace + 1)) as Record<string, unknown>;
    } catch {
      return {};
    }
  }
}
