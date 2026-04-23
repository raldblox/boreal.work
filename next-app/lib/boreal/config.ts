import "server-only";

export type SupportedProviderKey = "openai";

const DEFAULT_PROVIDER = "openai" satisfies SupportedProviderKey;
const DEFAULT_INTENT_MODEL = "gpt-5.4-mini";
const DEFAULT_EMBEDDING_MODEL = "text-embedding-3-small";

export type BorealRuntimeConfig = {
  provider: SupportedProviderKey;
  intentModel: string;
  embeddingModel: string;
};

export function getBorealRuntimeConfig(): BorealRuntimeConfig {
  return {
    provider: normalizeProvider(process.env.BOREAL_LLM_PROVIDER),
    intentModel: process.env.BOREAL_INTENT_MODEL ?? DEFAULT_INTENT_MODEL,
    embeddingModel:
      process.env.BOREAL_EMBEDDING_MODEL ?? DEFAULT_EMBEDDING_MODEL,
  };
}

function normalizeProvider(value?: string): SupportedProviderKey {
  if (!value) {
    return DEFAULT_PROVIDER;
  }

  if (value === "openai") {
    return value;
  }

  throw new Error(
    `Unsupported provider "${value}". Add an adapter in lib/boreal/integrations/providers before enabling it.`,
  );
}

