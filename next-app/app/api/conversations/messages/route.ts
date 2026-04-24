import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { convexFunctionRefs } from "@/lib/boreal/integrations/convex/function-refs";
import { createConvexServerClient } from "@/lib/boreal/integrations/convex/server-client";

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as {
      body?: string;
      conversationId?: string;
    };
    const message = body.body?.trim();

    if (!message) {
      return NextResponse.json({ error: "Message body is required." }, { status: 400 });
    }

    const client = createConvexServerClient();
    const result = await client.mutation(convexFunctionRefs.postConversationMessage, {
      body: message,
      conversationId: body.conversationId,
      ownerDisplayName: session.user.name ?? undefined,
      ownerExternalId: session.user.id,
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to save conversation message.",
      },
      { status: 500 },
    );
  }
}
