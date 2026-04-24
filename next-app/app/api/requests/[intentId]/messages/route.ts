import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { convexFunctionRefs } from "@/lib/boreal/integrations/convex/function-refs";
import { createConvexServerClient } from "@/lib/boreal/integrations/convex/server-client";

type RouteContext = {
  params: Promise<{
    intentId: string;
  }>;
};

export async function POST(request: Request, context: RouteContext) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as { body?: string };
    const message = body.body?.trim();

    if (!message) {
      return NextResponse.json({ error: "Message body is required." }, { status: 400 });
    }

    const { intentId } = await context.params;
    const client = createConvexServerClient();
    const result = await client.mutation(convexFunctionRefs.postThreadMessage, {
      body: message,
      intentId,
      ownerDisplayName: session.user.name ?? undefined,
      ownerExternalId: session.user.id,
    });

    if (!result.sent) {
      return NextResponse.json(
        { error: "You are not allowed to post in this request thread." },
        { status: 403 },
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to send thread message.",
      },
      { status: 500 },
    );
  }
}
