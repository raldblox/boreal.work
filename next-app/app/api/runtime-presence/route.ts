import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { isLocalRuntimeEndpoint } from "@/lib/boreal/external-agents/local-runtime";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ ok: false, reason: "unauthorized" }, { status: 401 });
  }

  // Local runtime health now probes from the owner's browser. Keep the server
  // route disabled in production so Boreal never fetches its own localhost.
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { ok: false, reason: "disabled_in_production" },
      { status: 403 },
    );
  }

  const { searchParams } = new URL(request.url);
  const endpoint = searchParams.get("endpoint");

  if (!endpoint || !isLocalRuntimeEndpoint(endpoint)) {
    return NextResponse.json(
      { ok: false, reason: "invalid_endpoint" },
      { status: 400 },
    );
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 4000);

  try {
    const response = await fetch(endpoint, {
      cache: "no-store",
      method: "GET",
      signal: controller.signal,
    });

    return NextResponse.json({
      ok: response.ok,
      status: response.status,
    });
  } catch {
    return NextResponse.json({
      ok: false,
      reason: "offline",
    });
  } finally {
    clearTimeout(timer);
  }
}
