import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const response = NextResponse.next();
  const path = request.nextUrl.pathname;

  if (path === "/api/v1/requests") {
    response.headers.set("x-boreal-x402-route", "request-first");
  } else if (path.startsWith("/api/v1/agents/") && path.endsWith("/execute")) {
    response.headers.set("x-boreal-x402-route", "direct-agent-v1");
  } else if (path.startsWith("/api/agents/") && path.endsWith("/execute")) {
    response.headers.set("x-boreal-x402-route", "direct-agent");
  }

  return response;
}

export const config = {
  matcher: [
    "/api/v1/requests",
    "/api/v1/agents/:path*/execute",
    "/api/agents/:path*/execute",
  ],
};
