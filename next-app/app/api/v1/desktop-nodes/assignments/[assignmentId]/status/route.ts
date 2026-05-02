import { NextResponse } from "next/server";

import type { DesktopNodeAssignmentPatchBody } from "@/lib/boreal/desktop-nodes/contracts";
import {
  deleteDesktopAssignment,
  patchDesktopAssignment,
} from "@/lib/boreal/desktop-nodes/service";
import { requireAgentSession } from "@/lib/boreal/one-request/http";

export async function POST(
  request: Request,
  context: { params: Promise<{ assignmentId: string }> },
) {
  try {
    const caller = requireAgentSession(request);
    const { assignmentId } = await context.params;
    const body = (await request.json()) as DesktopNodeAssignmentPatchBody;

    return NextResponse.json(
      await patchDesktopAssignment({
        assignmentId,
        body,
        caller,
      }),
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to update the desktop assignment.";
    const status = message.includes("Bearer session token") ? 401 : 400;

    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ assignmentId: string }> },
) {
  try {
    const caller = requireAgentSession(request);
    const { assignmentId } = await context.params;

    return NextResponse.json(
      await deleteDesktopAssignment({
        assignmentId,
        caller,
      }),
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to delete the desktop assignment.";
    const status = message.includes("Bearer session token") ? 401 : 400;

    return NextResponse.json({ error: message }, { status });
  }
}
