import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { getDirectExecutionAgent } from "@/agents";
import { validateDirectExecutionPayload } from "@/agents/shared/registry";

export async function POST(
  request: Request,
  context: { params: Promise<{ agentKey: string }> },
) {
  const session = await auth();
  const user = session?.user;

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { agentKey } = await context.params;
    const agent = getDirectExecutionAgent(agentKey);
    const body = await request.json();

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "Execution payload must be a JSON object." },
        { status: 400 },
      );
    }

    validateDirectExecutionPayload(agent, body as Record<string, unknown>);

    const result = await agent.directExecution!.invoke({
      payload: body as Record<string, unknown>,
    });

    return NextResponse.json({
      agent: agent.key,
      result,
      version: "boreal-agent-registry/v1",
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
