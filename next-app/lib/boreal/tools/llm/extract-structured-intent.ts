import "server-only";

import { generateText } from "ai";

import type { BorealProviderAdapter } from "@/lib/boreal/integrations/providers/types";
import { buildIntentRoutingHint } from "@/lib/boreal/prompting/character";
import type { ChatUiContext } from "@/lib/boreal/schemas/chat";
import {
  normalizeIntentExtraction,
  type IntentExtraction,
  type ModalityProfileScore,
} from "@/lib/boreal/schemas/intent";

export async function extractStructuredIntent(input: {
  message: string;
  intentModelId: string;
  provider: BorealProviderAdapter;
  modalityScores: ModalityProfileScore[];
  uiContext?: ChatUiContext;
}): Promise<IntentExtraction> {
  const contextHint = buildIntentRoutingHint(input.uiContext);
  const { text } = await generateText({
    model: input.provider.getIntentModel(input.intentModelId),
    prompt: buildPrompt(input.message, input.modalityScores, contextHint),
  });

  const parsed = extractJsonObject(text);

  return normalizeIntentExtraction(parsed, input.message, input.modalityScores);
}

function buildPrompt(
  message: string,
  modalityScores: ModalityProfileScore[],
  contextHint: string,
) {
  const modalityHint = modalityScores
    .map(({ kind, score }) => `${kind}: ${score.toFixed(4)}`)
    .join(", ");

  return [
    "You are Boreal's intent-routing extractor.",
    "Analyze the user message and output a single JSON object only.",
    "Do not wrap the JSON in markdown fences.",
    "The object must include these fields:",
    "{",
    '  "intentType": "demand" | "supply" | "informational",',
    '  "routeTarget": "general_assistance" | "catalog_lookup" | "profile_update" | "image_generation" | "speech_generation" | "video_generation" | "clarification",',
    '  "title": string,',
    '  "summary": string,',
    '  "body": string,',
    '  "category": string,',
    '  "requestedOutputTypes": string[],',
    '  "capabilityTags": string[],',
    '  "keywords": string[],',
    '  "confidence": number,',
    '  "generationSignals": { "requestsText": boolean, "requestsImageGeneration": boolean, "requestsSpeechGeneration": boolean, "requestsVideoGeneration": boolean, "primaryMode": string },',
    '  "routing": { "resolutionTier": "auto" | "fast" | "open" | "pending", "shouldPersistToBoard": boolean, "shouldCreateFulfillmentRequest": boolean },',
    '  "persistence": { "shouldPersist": boolean, "isUnresolved": boolean, "reason": string },',
    '  "needsClarification": boolean,',
    '  "missingDetails": string[],',
    '  "suggestedReplies": string[],',
    '  "shouldSearchCatalog": boolean,',
    '  "catalogQuery": string,',
    '  "assetPrompt": string,',
    '  "speechText": string,',
    '  "voice": string,',
    '  "responseInstructions": string,',
    '  "extractionNotes": string[]',
    "}",
    "Rules:",
    "- greetings, acknowledgements, thanks, and basic conversational messages should stay direct chat replies and should not become tracked work.",
    "- basic information questions about Boreal, an offer, a provider, or how something works should stay direct chat replies unless the user clearly wants work opened.",
    "- general questions should use routeTarget=general_assistance.",
    "- if the user is asking Boreal to make, write, build, draft, explain, package, or prepare a deliverable for them, do not treat it as a plain direct answer. Treat it as a tracked request.",
    "- for underspecified text deliverables, tutorials, explainers, lessons, scripts, guides, or packaged outputs, set needsClarification=true and list the missing scope details.",
    "- for vague educational content requests, ask about outcome format, audience level, and desired depth before approving execution.",
    "- use catalog_lookup when the user is asking about available products, tools, services, pricing, or capability matching.",
    "- use profile_update when the user wants to publish, improve, structure, or package their worker profile, skills, services, capabilities, or products into Boreal supply.",
    "- use image_generation, speech_generation, or video_generation when the user clearly wants an asset generated now.",
    "- use clarification when immediate generation is requested but important details are missing.",
    "- requestedOutputTypes may include text, image_generation, speech_generation, video_generation.",
    "- assetPrompt should be a clean generation prompt if media generation is likely.",
    "- speechText should contain the exact script when the user provided one, otherwise a concise generated script direction.",
    "- voice should be one supported OpenAI-compatible voice: alloy, echo, fable, onyx, nova, shimmer, coral, verse, ballad, ash, sage, marin, or cedar.",
    "- shouldPersist should be true for unresolved requests, asset generation requests, catalog requests, and valid Boreal intents.",
    "UI routing hints:",
    contextHint,
    `Embedding modality hints: ${modalityHint}`,
    `User message: """${message}"""`,
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

    const candidate = trimmed.slice(firstBrace, lastBrace + 1);

    try {
      return JSON.parse(candidate) as Record<string, unknown>;
    } catch {
      return {};
    }
  }
}
