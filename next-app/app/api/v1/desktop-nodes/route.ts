import { NextResponse } from "next/server";

import { getDesktopNodeByCaller } from "@/lib/boreal/desktop-nodes/service";
import { requireAgentSession } from "@/lib/boreal/one-request/http";

export async function GET(request: Request) {
  try {
    const caller = requireAgentSession(request);
    const node = await getDesktopNodeByCaller(caller);

    if (!node) {
      return NextResponse.json(
        {
          error: "Desktop node is not registered for this Boreal owner.",
        },
        { status: 404 },
      );
    }

    return NextResponse.json(node);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to load the Boreal desktop node.";
    const status = message.includes("Bearer session token") ? 401 : 400;

    return NextResponse.json({ error: message }, { status });
  }
}
