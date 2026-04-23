import type { EmbeddingModel, ImageModel, LanguageModel, SpeechModel } from "ai";

export type VideoGenerationJob = {
  jobId: string;
  model: string;
  progress: number;
  seconds: string;
  size: string;
  status: "queued" | "in_progress" | "completed" | "failed";
  createdAt?: number;
  completedAt?: number;
  expiresAt?: number;
  mediaType?: string;
  prompt?: string;
  errorMessage?: string;
};

export type BorealProviderAdapter = {
  key: string;
  displayName: string;
  getIntentModel: (modelId: string) => LanguageModel;
  getAssistantModel: (modelId: string) => LanguageModel;
  getEmbeddingModel: (modelId: string) => EmbeddingModel;
  getImageModel: (modelId: string) => ImageModel;
  getSpeechModel: (modelId: string) => SpeechModel;
  startVideoGeneration?: (input: {
    modelId: string;
    prompt: string;
    seconds?: string;
    size?: string;
  }) => Promise<VideoGenerationJob>;
  getVideoGeneration?: (videoId: string) => Promise<VideoGenerationJob>;
  downloadVideoContent?: (videoId: string) => Promise<{
    contentType: string;
    data: ArrayBuffer;
    fileName: string;
  }>;
};
