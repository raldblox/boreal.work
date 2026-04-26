import { NextResponse } from "next/server";

import { api } from "@/convex/_generated/api";
import { createConvexServerClient } from "@/lib/boreal/integrations/convex/server-client";
import { requireAgentSession } from "@/lib/boreal/one-request/http";
import { isPublicRequestToken } from "@/lib/boreal/one-inbox/tokens";

const CLAIM_STATUS: Record<string, number> = {
  already_claimed: 409,
  cannot_claim_own_request: 409,
  gated_out: 409,
  missing_buyer_wallet: 409,
  missing_payout_wallet: 409,
  no_match: 404,
  not_found: 404,
  quote_required: 409,
  wallet_network_mismatch: 409,
};

export async function POST(
  request: Request,
  context: { params: Promise<{ requestToken: string }> },
) {
  try {
    const caller = requireAgentSession(request);
    const { requestToken } = await context.params;

    if (!isPublicRequestToken(requestToken)) {
      return NextResponse.json(
        { error: "Claim is only supported on public market requests." },
        { status: 400 },
      );
    }

    const body = (await request.json().catch(() => ({}))) as {
      supplyId?: string;
    };
    const convex = createConvexServerClient();
    const result = await convex.mutation(api.inboxApi.claimMatchedRequest, {
      ownerDisplayName: caller.displayName,
      ownerExternalId: caller.externalId,
      requestToken,
      supplyId: body.supplyId as never,
    });

    if (!result.claimed) {
      return NextResponse.json(
        { error: result.reason ?? "Unable to claim request." },
        { status: CLAIM_STATUS[result.reason ?? ""] ?? 409 },
      );
    }

    return NextResponse.json({
      ...result,
      version: "boreal-inbox/v1",
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to claim request.",
      },
      { status: 400 },
    );
  }
}
