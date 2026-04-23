import "server-only";

import { createOpenAI } from "@ai-sdk/openai";

import type { BorealProviderAdapter, VideoGenerationJob } from "./types";

function getOpenAIKey() {
  const apiKey = process.env.OPENAI_API_KEY ?? process.env.OPENAI_KEY;

  if (!apiKey) {
    throw new Error(
      "Missing OpenAI BYOK configuration. Set OPENAI_API_KEY (preferred) or OPENAI_KEY.",
    );
  }

  return apiKey;
}

async function startOpenAIVideoGeneration(input: {
  modelId: string;
  prompt: string;
  seconds?: string;
  size?: string;
}): Promise<VideoGenerationJob> {
  const formData = new FormData();
  formData.append("model", input.modelId);
  formData.append("prompt", input.prompt);
  formData.append("seconds", input.seconds ?? "8");
  formData.append("size", input.size ?? "1280x720");

  const response = await fetch("https://api.openai.com/v1/videos", {
    body: formData,
    headers: {
      Authorization: `Bearer ${getOpenAIKey()}`,
    },
    method: "POST",
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `OpenAI video generation failed with ${response.status}: ${body || "Unknown error."}`,
    );
  }

  const payload = (await response.json()) as {
    id?: string;
    model?: string;
    progress?: number;
    seconds?: string;
    size?: string;
    status?: VideoGenerationJob["status"];
  };

  if (!payload.id || !payload.status) {
    throw new Error("OpenAI video generation returned an incomplete job.");
  }

  return {
    createdAt: undefined,
    completedAt: undefined,
    errorMessage: undefined,
    expiresAt: undefined,
    jobId: payload.id,
    mediaType: "video/mp4",
    model: payload.model ?? input.modelId,
    progress: payload.progress ?? 0,
    prompt: input.prompt,
    seconds: payload.seconds ?? input.seconds ?? "8",
    size: payload.size ?? input.size ?? "1280x720",
    status: payload.status,
  };
}

async function getOpenAIVideoGeneration(videoId: string): Promise<VideoGenerationJob> {
  const response = await fetch(`https://api.openai.com/v1/videos/${videoId}`, {
    headers: {
      Authorization: `Bearer ${getOpenAIKey()}`,
    },
    method: "GET",
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `OpenAI video status lookup failed with ${response.status}: ${body || "Unknown error."}`,
    );
  }

  const payload = (await response.json()) as {
    completed_at?: number;
    created_at?: number;
    error?: { message?: string };
    expires_at?: number;
    id: string;
    model?: string;
    progress?: number;
    prompt?: string;
    seconds?: string;
    size?: string;
    status: VideoGenerationJob["status"];
  };

  return {
    completedAt: payload.completed_at,
    createdAt: payload.created_at,
    errorMessage: payload.error?.message,
    expiresAt: payload.expires_at,
    jobId: payload.id,
    mediaType: "video/mp4",
    model: payload.model ?? "sora-2",
    progress: payload.progress ?? 0,
    prompt: payload.prompt,
    seconds: payload.seconds ?? "8",
    size: payload.size ?? "1280x720",
    status: payload.status,
  };
}

async function downloadOpenAIVideoContent(videoId: string) {
  const response = await fetch(`https://api.openai.com/v1/videos/${videoId}/content`, {
    headers: {
      Authorization: `Bearer ${getOpenAIKey()}`,
    },
    method: "GET",
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `OpenAI video download failed with ${response.status}: ${body || "Unknown error."}`,
    );
  }

  return {
    contentType: response.headers.get("content-type") ?? "video/mp4",
    data: await response.arrayBuffer(),
    fileName: `${videoId}.mp4`,
  };
}

export function createOpenAIProviderAdapter(): BorealProviderAdapter {
  const provider = createOpenAI({
    apiKey: getOpenAIKey(),
  });

  return {
    key: "openai",
    displayName: "OpenAI",
    getAssistantModel: (modelId) => provider(modelId),
    getIntentModel: (modelId) => provider(modelId),
    getEmbeddingModel: (modelId) => provider.embedding(modelId),
    getImageModel: (modelId) => provider.image(modelId),
    getSpeechModel: (modelId) => provider.speech(modelId),
    getVideoGeneration: getOpenAIVideoGeneration,
    downloadVideoContent: downloadOpenAIVideoContent,
    startVideoGeneration: startOpenAIVideoGeneration,
  };
}
