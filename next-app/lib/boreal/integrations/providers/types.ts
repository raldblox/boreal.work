import type { EmbeddingModel, LanguageModel } from "ai";

export type BorealProviderAdapter = {
  key: string;
  displayName: string;
  getIntentModel: (modelId: string) => LanguageModel;
  getEmbeddingModel: (modelId: string) => EmbeddingModel;
};

