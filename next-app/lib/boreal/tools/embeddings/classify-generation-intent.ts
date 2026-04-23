import "server-only";

import { embed, embedMany } from "ai";

import type { BorealProviderAdapter } from "@/lib/boreal/integrations/providers/types";
import type {
  ModalityProfileScore,
  RequestedOutputType,
} from "@/lib/boreal/schemas/intent";

type ModalityProfile = {
  kind: RequestedOutputType;
  examples: string[];
};

type EmbeddedModalityProfile = {
  kind: RequestedOutputType;
  centroid: number[];
};

const modalityProfiles: ModalityProfile[] = [
  {
    kind: "text",
    examples: [
      "Write a concise customer support reply for a refund request.",
      "Draft a product brief and summarize the main requirements.",
      "Help me extract the business intent from this message and return structured text.",
    ],
  },
  {
    kind: "image_generation",
    examples: [
      "Generate a product hero image for a new coffee brand.",
      "Create an illustration in a cinematic editorial style.",
      "Make an image of a minimalist workspace for a landing page.",
    ],
  },
  {
    kind: "video_generation",
    examples: [
      "Generate a product teaser video for social media.",
      "Create a short explainer video with motion graphics.",
      "Produce a cinematic launch video from this prompt.",
    ],
  },
];

const profileCache = new Map<string, Promise<EmbeddedModalityProfile[]>>();

export type GenerationIntentClassification = {
  embedding: number[];
  modalityScores: ModalityProfileScore[];
};

export async function classifyGenerationIntent(input: {
  message: string;
  embeddingModelId: string;
  provider: BorealProviderAdapter;
}): Promise<GenerationIntentClassification> {
  const { embedding } = await embed({
    model: input.provider.getEmbeddingModel(input.embeddingModelId),
    value: input.message,
  });

  const profiles = await getEmbeddedProfiles(input.provider, input.embeddingModelId);

  const modalityScores = profiles
    .map((profile) => ({
      kind: profile.kind,
      score: cosineSimilarity(embedding, profile.centroid),
    }))
    .sort((left, right) => right.score - left.score);

  return {
    embedding,
    modalityScores,
  };
}

async function getEmbeddedProfiles(
  provider: BorealProviderAdapter,
  embeddingModelId: string,
) {
  const cacheKey = `${provider.key}:${embeddingModelId}`;
  const cached = profileCache.get(cacheKey);

  if (cached) {
    return cached;
  }

  const promise = Promise.all(
    modalityProfiles.map(async (profile) => {
      const { embeddings } = await embedMany({
        model: provider.getEmbeddingModel(embeddingModelId),
        values: profile.examples,
      });

      return {
        kind: profile.kind,
        centroid: averageVector(embeddings),
      };
    }),
  );

  profileCache.set(cacheKey, promise);
  return promise;
}

function averageVector(vectors: number[][]) {
  const size = vectors[0]?.length ?? 0;

  if (size === 0) {
    return [];
  }

  const total = new Array<number>(size).fill(0);

  for (const vector of vectors) {
    for (let index = 0; index < size; index += 1) {
      total[index] += vector[index] ?? 0;
    }
  }

  return total.map((value) => value / vectors.length);
}

function cosineSimilarity(left: number[], right: number[]) {
  let dot = 0;
  let leftNorm = 0;
  let rightNorm = 0;

  const size = Math.min(left.length, right.length);

  for (let index = 0; index < size; index += 1) {
    const leftValue = left[index] ?? 0;
    const rightValue = right[index] ?? 0;

    dot += leftValue * rightValue;
    leftNorm += leftValue * leftValue;
    rightNorm += rightValue * rightValue;
  }

  if (leftNorm === 0 || rightNorm === 0) {
    return 0;
  }

  return dot / (Math.sqrt(leftNorm) * Math.sqrt(rightNorm));
}

