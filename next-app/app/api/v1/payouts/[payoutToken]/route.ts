import { NextResponse } from "next/server";

import { api } from "@/convex/_generated/api";
import { createConvexServerClient } from "@/lib/boreal/integrations/convex/server-client";
import { requireAgentSession } from "@/lib/boreal/one-request/http";

export async function GET(
  request: Request,
  context: { params: Promise<{ payoutToken: string }> },
) {
  try {
    const caller = requireAgentSession(request);
    const { payoutToken } = await context.params;
    const convex = createConvexServerClient();
    const payout = await convex.query(api.inboxApi.getPayout, {
      ownerExternalId: caller.externalId,
      payoutToken,
    });

    if (!payout) {
      return NextResponse.json({ error: "Payout not found." }, { status: 404 });
    }

    return NextResponse.json({
      payout,
      version: "boreal-payouts/v1",
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to load payout state.",
      },
      { status: 401 },
    );
  }
}
