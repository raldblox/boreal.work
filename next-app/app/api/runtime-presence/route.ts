import { NextResponse } from "next/server";

import { isLocalRuntimeEndpoint } from "@/lib/boreal/external-agents/local-runtime";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
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
