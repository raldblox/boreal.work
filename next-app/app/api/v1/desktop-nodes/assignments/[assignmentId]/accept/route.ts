import { NextResponse } from "next/server";

import { acceptDesktopAssignment } from "@/lib/boreal/desktop-nodes/service";
import { requireAgentSession } from "@/lib/boreal/one-request/http";

export async function POST(
  request: Request,
  context: { params: Promise<{ assignmentId: string }> },
) {
  try {
    const caller = requireAgentSession(request);
    const { assignmentId } = await context.params;

    return NextResponse.json(
      await acceptDesktopAssignment({
        assignmentId,
        caller,
      }),
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to accept the desktop assignment.";
    const status = message.includes("Bearer session token") ? 401 : 400;

    return NextResponse.json({ error: message }, { status });
  }
}
