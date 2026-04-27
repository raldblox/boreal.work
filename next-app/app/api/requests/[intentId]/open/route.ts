import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { openPersistedRequestForWorkers } from "@/lib/boreal/agents/chat-assistant/agent";

export async function POST(
  _: Request,
  { params }: { params: Promise<{ intentId: string }> },
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { intentId } = await params;
    const result = await openPersistedRequestForWorkers({
      intentId,
      ownerExternalId: session.user.id,
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to open request for workers.",
      },
      { status: 500 },
    );
  }
}
