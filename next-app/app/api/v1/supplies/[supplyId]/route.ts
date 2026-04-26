import { NextResponse } from "next/server";

import { api } from "@/convex/_generated/api";
import { createConvexServerClient } from "@/lib/boreal/integrations/convex/server-client";

export async function GET(
  request: Request,
  context: { params: Promise<{ supplyId: string }> },
) {
  const { supplyId } = await context.params;
  const convex = createConvexServerClient();
  const supplies = await convex.query(api.supplies.listCatalog, {
    limit: 200,
  });
  const supply = supplies.find((entry) => entry._id === supplyId);

  if (!supply) {
    return NextResponse.json({ error: "Supply not found." }, { status: 404 });
  }

  return NextResponse.json({
    supply,
    version: "boreal-supplies/v1",
  });
}
