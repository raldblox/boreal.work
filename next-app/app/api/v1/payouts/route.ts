import { NextResponse } from "next/server";

import { api } from "@/convex/_generated/api";
import { createConvexServerClient } from "@/lib/boreal/integrations/convex/server-client";
import { requireAgentSession } from "@/lib/boreal/one-request/http";

export async function GET(request: Request) {
  try {
    const caller = requireAgentSession(request);
    const convex = createConvexServerClient();
    const payouts = await convex.query(api.inboxApi.listPayouts, {
      ownerExternalId: caller.externalId,
    });

    return NextResponse.json({
      payouts,
      version: "boreal-payouts/v1",
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to load payouts.",
      },
      { status: 401 },
    );
  }
}
