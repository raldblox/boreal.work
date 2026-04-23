import "server-only";

import { createOpenAI } from "@ai-sdk/openai";

import type { BorealProviderAdapter } from "./types";

function getOpenAIKey() {
  const apiKey = process.env.OPENAI_API_KEY ?? process.env.OPENAI_KEY;

  if (!apiKey) {
    throw new Error(
      "Missing OpenAI BYOK configuration. Set OPENAI_API_KEY (preferred) or OPENAI_KEY.",
    );
  }

  return apiKey;
}

export function createOpenAIProviderAdapter(): BorealProviderAdapter {
  const provider = createOpenAI({
    apiKey: getOpenAIKey(),
  });

  return {
    key: "openai",
    displayName: "OpenAI",
    getIntentModel: (modelId) => provider(modelId),
    getEmbeddingModel: (modelId) => provider.embedding(modelId),
  };
}

