import "server-only";

export type SupportedProviderKey = "openai";

const DEFAULT_PROVIDER = "openai" satisfies SupportedProviderKey;
const DEFAULT_INTENT_MODEL = "gpt-4.1-mini";
const DEFAULT_ASSISTANT_MODEL = "gpt-4.1-mini";
const DEFAULT_EMBEDDING_MODEL = "text-embedding-3-small";
const DEFAULT_IMAGE_MODEL = "dall-e-3";
const DEFAULT_SPEECH_MODEL = "gpt-4o-mini-tts";
const DEFAULT_VIDEO_MODEL = "sora-2-pro";

export type BorealRuntimeConfig = {
  provider: SupportedProviderKey;
  intentModel: string;
  assistantModel: string;
  embeddingModel: string;
  imageModel: string;
  speechModel: string;
  videoModel: string;
};

export function getBorealRuntimeConfig(): BorealRuntimeConfig {
  return {
    assistantModel:
      process.env.BOREAL_ASSISTANT_MODEL ?? DEFAULT_ASSISTANT_MODEL,
    provider: normalizeProvider(process.env.BOREAL_LLM_PROVIDER),
    intentModel: process.env.BOREAL_INTENT_MODEL ?? DEFAULT_INTENT_MODEL,
    embeddingModel:
      process.env.BOREAL_EMBEDDING_MODEL ?? DEFAULT_EMBEDDING_MODEL,
    imageModel: process.env.BOREAL_IMAGE_MODEL ?? DEFAULT_IMAGE_MODEL,
    speechModel: process.env.BOREAL_SPEECH_MODEL ?? DEFAULT_SPEECH_MODEL,
    videoModel: process.env.BOREAL_VIDEO_MODEL ?? DEFAULT_VIDEO_MODEL,
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
