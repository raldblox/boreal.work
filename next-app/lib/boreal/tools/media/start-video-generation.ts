import "server-only";

import type { BorealProviderAdapter } from "@/lib/boreal/integrations/providers/types";
import type { MediaArtifact } from "@/lib/boreal/schemas/chat";

export async function startVideoGeneration(input: {
  modelId: string;
  prompt: string;
  provider: BorealProviderAdapter;
  title: string;
}): Promise<Extract<MediaArtifact, { kind: "video" }>> {
  if (!input.provider.startVideoGeneration) {
    throw new Error(
      `Provider "${input.provider.key}" does not expose video generation yet.`,
    );
  }

  const job = await input.provider.startVideoGeneration({
    modelId: input.modelId,
    prompt: input.prompt,
  });

  return {
    jobId: job.jobId,
    kind: "video",
    model: job.model,
    progress: job.progress,
    prompt: input.prompt,
    seconds: job.seconds,
    size: job.size,
    status: job.status,
    title: input.title,
  };
}
