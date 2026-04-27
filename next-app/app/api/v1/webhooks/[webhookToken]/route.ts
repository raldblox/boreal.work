import { NextResponse } from "next/server";

import { api } from "@/convex/_generated/api";
import { createConvexServerClient } from "@/lib/boreal/integrations/convex/server-client";
import { requireAgentSession } from "@/lib/boreal/one-request/http";

export async function DELETE(
  request: Request,
  context: { params: Promise<{ webhookToken: string }> },
) {
  try {
    const caller = requireAgentSession(request);
    const { webhookToken } = await context.params;
    const convex = createConvexServerClient();
    const result = await convex.mutation(api.webhooks.deleteWebhookSubscription, {
      ownerExternalId: caller.externalId,
      webhookToken,
    });

    if (!result.deleted) {
      return NextResponse.json({ error: "Webhook not found." }, { status: 404 });
    }

    return NextResponse.json({
      deleted: true,
      version: "boreal-webhook/v1",
      webhookToken,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to delete webhook.",
      },
      { status: 400 },
    );
  }
}
