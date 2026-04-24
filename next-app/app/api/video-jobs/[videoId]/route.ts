import { NextResponse } from "next/server";

import { syncVideoArtifact } from "@/lib/boreal/dal/intent-repository";
import { resolveProviderAdapter } from "@/lib/boreal/integrations/providers/registry";

type RouteContext = {
  params: Promise<{
    videoId: string;
  }>;
};

export async function GET(_: Request, context: RouteContext) {
  try {
    const { videoId } = await context.params;
    const provider = resolveProviderAdapter();

    if (!provider.getVideoGeneration) {
      return NextResponse.json(
        { error: `Provider "${provider.key}" does not support video status retrieval.` },
        { status: 400 },
      );
    }

    const job = await provider.getVideoGeneration(videoId);
    await syncVideoArtifact({
      mediaType: job.mediaType ?? "video/mp4",
      metadataJson: JSON.stringify({
        ...job,
        downloadUrl:
          job.status === "completed"
            ? `/api/video-jobs/${job.jobId}/content`
            : undefined,
      }),
      remoteId: videoId,
      status: job.status === "completed" ? "ready" : job.status,
    });

    return NextResponse.json(job);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Video status lookup failed.",
      },
      { status: 500 },
    );
  }
}
