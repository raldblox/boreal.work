import { NextResponse } from "next/server";

import type { DesktopNodeUpsertBody } from "@/lib/boreal/desktop-nodes/contracts";
import { registerDesktopNode } from "@/lib/boreal/desktop-nodes/service";
import { requireAgentSession } from "@/lib/boreal/one-request/http";

export async function POST(request: Request) {
  try {
    const caller = requireAgentSession(request);
    const body = (await request.json()) as DesktopNodeUpsertBody;

    return NextResponse.json(
      await registerDesktopNode({
        body,
        caller,
      }),
      { status: 201 },
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to register the Boreal desktop node.";
    const status = message.includes("Bearer session token") ? 401 : 400;

    return NextResponse.json({ error: message }, { status });
  }
}
