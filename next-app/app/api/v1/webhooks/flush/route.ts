import { NextResponse } from "next/server";

import { createConvexServerClient } from "@/lib/boreal/integrations/convex/server-client";
import { requireAgentSession } from "@/lib/boreal/one-request/http";
import { flushWebhookDeliveriesWithClient } from "@/lib/boreal/webhooks/dispatcher";

export async function POST(request: Request) {
  try {
    const caller = requireAgentSession(request);
    const body = (await request.json().catch(() => ({}))) as {
      limit?: number;
    };
    const result = await flushWebhookDeliveriesWithClient(createConvexServerClient(), {
      limit:
        typeof body.limit === "number" && Number.isFinite(body.limit)
          ? Math.max(1, Math.min(Math.trunc(body.limit), 100))
          : undefined,
      ownerExternalId: caller.externalId,
    });

    return NextResponse.json({
      ...result,
      version: "boreal-webhook/v1",
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to flush webhook deliveries.",
      },
      { status: 400 },
    );
  }
}
