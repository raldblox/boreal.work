import { NextResponse } from "next/server";

import { api } from "@/convex/_generated/api";
import { createConvexServerClient } from "@/lib/boreal/integrations/convex/server-client";
import { requireAgentSession } from "@/lib/boreal/one-request/http";

export async function GET(
  request: Request,
  context: { params: Promise<{ entryToken: string }> },
) {
  try {
    const caller = requireAgentSession(request);
    const { entryToken } = await context.params;
    const convex = createConvexServerClient();
    const entry = await convex.query(api.inboxApi.getInboxEntry, {
      entryToken,
      ownerExternalId: caller.externalId,
    });

    if (!entry) {
      return NextResponse.json({ error: "Inbox entry not found." }, { status: 404 });
    }

    return NextResponse.json({
      entry,
      version: "boreal-inbox/v1",
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to load supplier inbox entry.",
      },
      { status: 401 },
    );
  }
}
