import { NextResponse } from "next/server";

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
