import { NextResponse } from "next/server";

import { listRegisteredAgents } from "@/agents/index";

export async function GET() {
  return NextResponse.json({
    agents: listRegisteredAgents(),
    version: "boreal-agent-registry/v1",
  });
}
