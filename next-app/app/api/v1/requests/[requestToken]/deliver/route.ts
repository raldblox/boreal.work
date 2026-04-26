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
        { error: "Deliver is only supported on public market requests." },
        { status: 400 },
      );
    }

    const body = (await request.json()) as {
      deliverablesBody?: string;
    };
    const deliverablesBody = body.deliverablesBody?.trim();

    if (!deliverablesBody) {
      return NextResponse.json(
        { error: "deliverablesBody is required." },
        { status: 400 },
      );
    }

    const convex = createConvexServerClient();
    const view = await convex.query(api.inboxApi.getSupplierRequestView, {
      ownerExternalId: caller.externalId,
      requestToken,
    });

    if (!view) {
      return NextResponse.json({ error: "Request not found." }, { status: 404 });
    }

    if (!view.inbox.actions.canDeliver) {
      return NextResponse.json(
        { error: "This request is not ready for supplier delivery." },
        { status: 409 },
      );
    }

    const result = await convex.mutation(api.fulfillments.submitWork, {
      deliverablesBody,
      intentId: view.request.request._id,
      workerDisplayName: caller.displayName,
      workerExternalId: caller.externalId,
    });

    if (!result.submitted) {
      return NextResponse.json(
        { error: "Work submission was rejected for this request." },
        { status: 409 },
      );
    }

    return NextResponse.json({
      requestToken,
      submitted: true,
      version: "boreal-inbox/v1",
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to deliver work.",
      },
      { status: 400 },
    );
  }
}
