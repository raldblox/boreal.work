import "server-only";

import { experimental_generateSpeech as generateSpeech } from "ai";

import type { BorealProviderAdapter } from "@/lib/boreal/integrations/providers/types";
import type { MediaArtifact } from "@/lib/boreal/schemas/chat";
import { normalizeSpeechVoice } from "@/lib/boreal/schemas/intent";

export async function generateSpeechAsset(input: {
  instructions?: string;
  modelId: string;
  provider: BorealProviderAdapter;
  text: string;
  title: string;
  voice: string;
}): Promise<Extract<MediaArtifact, { kind: "audio" }>> {
  const voice = normalizeSpeechVoice(input.voice);

  const result = await generateSpeech({
    instructions: input.instructions,
    model: input.provider.getSpeechModel(input.modelId),
    outputFormat: "mp3",
    text: input.text,
    voice,
  });

  return {
    base64: result.audio.base64,
    format: result.audio.format,
    kind: "audio",
    mediaType: result.audio.mediaType,
    title: input.title,
    transcript: input.text,
    voice,
  };
}
