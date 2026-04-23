import "server-only";

import { generateImage } from "ai";

import type { BorealProviderAdapter } from "@/lib/boreal/integrations/providers/types";
import type { MediaArtifact } from "@/lib/boreal/schemas/chat";

export async function generateImageAsset(input: {
  modelId: string;
  prompt: string;
  provider: BorealProviderAdapter;
  title: string;
}): Promise<Extract<MediaArtifact, { kind: "image" }>> {
  const result = await generateImage({
    aspectRatio: "16:9",
    model: input.provider.getImageModel(input.modelId),
    prompt: input.prompt,
  });

  return {
    base64: result.image.base64,
    kind: "image",
    mediaType: result.image.mediaType,
    prompt: input.prompt,
    title: input.title,
  };
}
