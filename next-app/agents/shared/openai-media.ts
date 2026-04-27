import type { AgentExecutionResult } from "./types.ts";
import { getBorealRuntimeConfig } from "../../lib/boreal/config.ts";
import { resolveProviderAdapter } from "../../lib/boreal/integrations/providers/registry.ts";
import { generateImageAsset } from "../../lib/boreal/tools/media/generate-image-asset.ts";
import { generateSpeechAsset } from "../../lib/boreal/tools/media/generate-speech-asset.ts";
import { startVideoGeneration } from "../../lib/boreal/tools/media/start-video-generation.ts";

export async function runImageGeneration(input: {
  prompt: string;
  title: string;
}): Promise<Extract<AgentExecutionResult, { kind: "image_generation" }>> {
  const runtimeConfig = getBorealRuntimeConfig();
  const provider = resolveProviderAdapter();
  const artifact = await generateImageAsset({
    modelId: runtimeConfig.imageModel,
    prompt: input.prompt,
    provider,
    title: input.title,
  });

  return {
    base64: artifact.base64,
    kind: "image_generation",
    mediaType: artifact.mediaType,
    prompt: artifact.prompt,
    title: artifact.title,
  };
}

export async function runSpeechGeneration(input: {
  instructions?: string;
  text: string;
  title: string;
  voice?: string;
}): Promise<Extract<AgentExecutionResult, { kind: "speech_generation" }>> {
  const runtimeConfig = getBorealRuntimeConfig();
  const provider = resolveProviderAdapter();
  const artifact = await generateSpeechAsset({
    instructions: input.instructions,
    modelId: runtimeConfig.speechModel,
    provider,
    text: input.text,
    title: input.title,
    voice: input.voice ?? "alloy",
  });

  return {
    base64: artifact.base64,
    format: artifact.format,
    kind: "speech_generation",
    mediaType: artifact.mediaType,
    title: artifact.title,
    transcript: artifact.transcript,
    voice: artifact.voice,
  };
}

export async function runVideoGeneration(input: {
  prompt: string;
  seconds?: string;
  size?: string;
  title: string;
}): Promise<Extract<AgentExecutionResult, { kind: "video_generation" }>> {
  const runtimeConfig = getBorealRuntimeConfig();
  const provider = resolveProviderAdapter();
  const artifact = await startVideoGeneration({
    modelId: runtimeConfig.videoModel,
    prompt: input.prompt,
    provider,
    seconds: input.seconds ?? runtimeConfig.videoSeconds,
    size: input.size ?? runtimeConfig.videoSize,
    title: input.title,
  });

  return {
    jobId: artifact.jobId,
    kind: "video_generation",
    model: artifact.model,
    progress: artifact.progress,
    prompt: artifact.prompt,
    seconds: artifact.seconds,
    size: artifact.size,
    status: artifact.status,
    title: artifact.title,
  };
}
