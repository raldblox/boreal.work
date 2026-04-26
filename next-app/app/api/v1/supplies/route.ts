import { NextResponse } from "next/server";

import { api } from "@/convex/_generated/api";
import { createConvexServerClient } from "@/lib/boreal/integrations/convex/server-client";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = url.searchParams.get("query")?.trim() ?? "";
  const limit = Number(url.searchParams.get("limit") ?? "24");
  const safeLimit = Number.isFinite(limit) ? Math.max(1, Math.min(limit, 100)) : 24;
  const convex = createConvexServerClient();
  const supplies =
    query.length > 0
      ? await convex.query(api.supplies.searchCatalog, {
          limit: safeLimit,
          query,
        })
      : await convex.query(api.supplies.listCatalog, {
          limit: safeLimit,
        });

  return NextResponse.json({
    supplies,
    version: "boreal-supplies/v1",
  });
}
