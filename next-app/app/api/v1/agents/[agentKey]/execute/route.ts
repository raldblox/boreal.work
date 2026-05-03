import { NextResponse } from "next/server";

import { handleBorealDirectExecutionRoute } from "@/lib/boreal/x402/direct-agent";

export async function POST(
  request: Request,
  context: { params: Promise<{ agentKey: string }> },
) {
  try {
    const { agentKey } = await context.params;
    return handleBorealDirectExecutionRoute({
      agentKey,
      request,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Could not execute agent.",
      },
      { status: 500 },
    );
  }
}
