import { NextResponse } from "next/server";

import { listRegisteredAgents } from "@/agents";

export async function GET(
  _request: Request,
  context: { params: Promise<{ agentKey: string }> },
) {
  const { agentKey } = await context.params;
  const agent = listRegisteredAgents().find((entry) => entry.key === agentKey);

  if (!agent) {
    return NextResponse.json({ error: "Agent not found." }, { status: 404 });
  }

  return NextResponse.json({
    agent,
    version: "boreal-agent-registry/v1",
  });
}
