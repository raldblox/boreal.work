import { NextResponse } from "next/server";

import { api } from "@/convex/_generated/api";
import { createConvexServerClient } from "@/lib/boreal/integrations/convex/server-client";
import { requireAgentSession } from "@/lib/boreal/one-request/http";

export async function GET(request: Request) {
  try {
    const caller = requireAgentSession(request);
    const url = new URL(request.url);
    const limit = Number(url.searchParams.get("limit") ?? "32");
    const safeLimit = Number.isFinite(limit) ? Math.max(1, Math.min(Math.trunc(limit), 100)) : 32;
    const convex = createConvexServerClient();
    const deliveries = await convex.query(api.webhooks.listWebhookDeliveries, {
      limit: safeLimit,
      ownerExternalId: caller.externalId,
    });

    return NextResponse.json({
      deliveries,
      version: "boreal-webhook/v1",
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to list webhook deliveries.",
      },
      { status: 401 },
    );
  }
}
