import { NextResponse } from "next/server";

import { syncDiscoveredProvider } from "@/lib/boreal/integrations/service-providers/sync";

export async function POST(request: Request) {
  try {
    const url = new URL(request.url);
    const limitParam = url.searchParams.get("limit");
    const query = url.searchParams.get("query") ?? undefined;
    const limit = limitParam ? Number(limitParam) : 24;
    const result = await syncDiscoveredProvider(
      {
        description:
          "Curated handoff adapter for Frames-origin managed agent discovery while the public contract stays shallow.",
        displayName: "Frames",
        key: "frames",
        providerUrl: "https://www.fra.ms/",
      },
      {
        limit: Number.isFinite(limit) ? Math.max(1, Math.min(limit, 100)) : 24,
        query,
      },
    );

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Could not sync Frames.",
      },
      { status: 500 },
    );
  }
}
