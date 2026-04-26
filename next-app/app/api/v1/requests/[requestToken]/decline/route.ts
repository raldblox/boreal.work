import { NextResponse } from "next/server";

import { api } from "@/convex/_generated/api";
import { createConvexServerClient } from "@/lib/boreal/integrations/convex/server-client";
import { requireAgentSession } from "@/lib/boreal/one-request/http";
import { isPublicRequestToken } from "@/lib/boreal/one-inbox/tokens";

export async function POST(
  request: Request,
  context: { params: Promise<{ requestToken: string }> },
) {
  try {
    const caller = requireAgentSession(request);
    const { requestToken } = await context.params;

    if (!isPublicRequestToken(requestToken)) {
      return NextResponse.json(
        { error: "Decline is only supported on public market requests." },
        { status: 400 },
      );
    }

    const body = (await request.json().catch(() => ({}))) as {
      reason?: string;
      supplyId?: string;
    };
    const convex = createConvexServerClient();
    const result = await convex.mutation(api.inboxApi.recordRequestDecline, {
      ownerExternalId: caller.externalId,
      reason: body.reason?.trim(),
      requestToken,
      supplyId: body.supplyId as never,
    });

    if (!result.declined) {
      return NextResponse.json(
        { error: result.reason ?? "Unable to decline request." },
        { status: 409 },
      );
    }

    return NextResponse.json({
      declined: true,
      requestToken,
      version: "boreal-inbox/v1",
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to decline request.",
      },
      { status: 400 },
    );
  }
}
