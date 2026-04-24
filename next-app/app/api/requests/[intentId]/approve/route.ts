import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { approvePersistedRequest } from "@/lib/boreal/agents/chat-assistant/agent";

type RouteContext = {
  params: Promise<{
    intentId: string;
  }>;
};

export async function POST(_: Request, context: RouteContext) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { intentId } = await context.params;
    const result = await approvePersistedRequest({
      intentId,
      ownerExternalId: session.user.id,
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to approve request.",
      },
      { status: 500 },
    );
  }
}
