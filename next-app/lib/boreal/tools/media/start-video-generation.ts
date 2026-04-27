import "server-only";

import {
  resolveVideoRequestSettings,
  type SupportedVideoSeconds,
  type SupportedVideoSize,
} from "../../media/video-contract.ts";
import type { BorealProviderAdapter } from "../../integrations/providers/types.ts";
import type { MediaArtifact } from "../../schemas/chat.ts";

export async function startVideoGeneration(input: {
  modelId: string;
  prompt: string;
  provider: BorealProviderAdapter;
  seconds?: string;
  size?: string;
  title: string;
}): Promise<Extract<MediaArtifact, { kind: "video" }>> {
  if (!input.provider.startVideoGeneration) {
    throw new Error(
      `Provider "${input.provider.key}" does not expose video generation yet.`,
    );
  }

  const settings = resolveVideoRequestSettings({
    message: input.prompt,
    rawSeconds: input.seconds,
    rawSize: input.size,
  });

  if (settings.invalidDetails.length > 0) {
    throw new Error(settings.invalidDetails[0] ?? "Unsupported video request settings.");
  }

  const job = await input.provider.startVideoGeneration({
    modelId: input.modelId,
    prompt: input.prompt,
    seconds: settings.seconds,
    size: settings.size,
  });

  return {
    jobId: job.jobId,
    kind: "video",
    model: job.model,
    progress: job.progress,
    prompt: input.prompt,
    seconds: (job.seconds || settings.seconds) as SupportedVideoSeconds,
    size: (job.size || settings.size) as SupportedVideoSize,
    status: job.status,
    title: input.title,
  };
}
