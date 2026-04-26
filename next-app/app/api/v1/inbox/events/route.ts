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
    const convex = createConvexServerClient();
    const events = await convex.query(api.inboxApi.listInboxEvents, {
      limit: safeLimit,
      ownerExternalId: caller.externalId,
    });
    const body = events
      .map((event) =>
        [
          `event: ${event.eventType}`,
          `data: ${JSON.stringify(event)}`,
          "",
        ].join("\n"),
      )
      .join("\n");

    return new Response(body, {
      headers: {
        "Cache-Control": "no-store",
        "Content-Type": "text/event-stream; charset=utf-8",
      },
      status: 200,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to stream supplier inbox events.",
      },
      { status: 401 },
    );
  }
}
