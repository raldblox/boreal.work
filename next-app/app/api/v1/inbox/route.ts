import { NextResponse } from "next/server";

import { api } from "@/convex/_generated/api";
import { createConvexServerClient } from "@/lib/boreal/integrations/convex/server-client";
import { requireAgentSession } from "@/lib/boreal/one-request/http";

export async function GET(request: Request) {
  try {
    const caller = requireAgentSession(request);
    const url = new URL(request.url);
    const limit = Number(url.searchParams.get("limit") ?? "24");
    const safeLimit = Number.isFinite(limit) ? Math.max(1, Math.min(limit, 100)) : 24;
    const includeDeclined = url.searchParams.get("includeDeclined") === "true";
    const convex = createConvexServerClient();
    const entries = await convex.query(api.inboxApi.listInbox, {
      includeDeclined,
      limit: safeLimit,
      ownerExternalId: caller.externalId,
    });

    return NextResponse.json({
      entries,
      version: "boreal-inbox/v1",
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to load supplier inbox.",
      },
      { status: 401 },
    );
  }
}
