import { NextResponse } from "next/server";

import type { DesktopNodeHeartbeatBody } from "@/lib/boreal/desktop-nodes/contracts";
import { heartbeatDesktopNode } from "@/lib/boreal/desktop-nodes/service";
import { requireAgentSession } from "@/lib/boreal/one-request/http";

export async function POST(request: Request) {
  try {
    const caller = requireAgentSession(request);
    const body = (await request.json()) as DesktopNodeHeartbeatBody;

    return NextResponse.json(
      await heartbeatDesktopNode({
        body,
        caller,
      }),
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to record the Boreal desktop heartbeat.";
    const status = message.includes("Bearer session token") ? 401 : 400;

    return NextResponse.json({ error: message }, { status });
  }
}
