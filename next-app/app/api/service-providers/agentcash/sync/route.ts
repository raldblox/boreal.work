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
          "Curated delegated-gateway adapter for AgentCash skill, CLI, and MCP fallback discovery.",
        displayName: "AgentCash",
        key: "agentcash",
        providerUrl: "https://agentcash.dev",
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
        error:
          error instanceof Error ? error.message : "Could not sync AgentCash.",
      },
      { status: 500 },
    );
  }
}
