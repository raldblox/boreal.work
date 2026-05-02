import { NextResponse } from "next/server";

import type { DesktopNodeAssignmentInput } from "@/lib/boreal/desktop-nodes/contracts";
import {
  createDesktopAssignment,
  listDesktopAssignments,
} from "@/lib/boreal/desktop-nodes/service";
import { requireAgentSession } from "@/lib/boreal/one-request/http";

export async function GET(request: Request) {
  try {
    const caller = requireAgentSession(request);
    return NextResponse.json(await listDesktopAssignments(caller));
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to load desktop assignments.";
    const status = message.includes("Bearer session token") ? 401 : 400;

    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: Request) {
  try {
    const caller = requireAgentSession(request);
    const body = (await request.json()) as DesktopNodeAssignmentInput;

    return NextResponse.json(
      await createDesktopAssignment({
        body,
        caller,
      }),
      { status: 201 },
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to queue a desktop assignment.";
    const status = message.includes("Bearer session token") ? 401 : 400;

    return NextResponse.json({ error: message }, { status });
  }
}
