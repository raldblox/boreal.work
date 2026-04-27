import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { approveMatchedSupplyForRequest } from "@/lib/boreal/agents/chat-assistant/agent";

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

  let body: { supplyId?: string } | null = null;

  try {
    body = (await request.json()) as { supplyId?: string };
  } catch {
    return NextResponse.json({ error: "Missing supply selection." }, { status: 400 });
  }

  if (!body?.supplyId) {
    return NextResponse.json({ error: "Missing supply selection." }, { status: 400 });
  }

  try {
    const { intentId } = await context.params;
    const result = await approveMatchedSupplyForRequest({
      intentId,
      ownerExternalId: session.user.id,
      supplyId: body.supplyId,
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to approve this worker into the team.",
      },
      { status: 400 },
    );
  }
}
