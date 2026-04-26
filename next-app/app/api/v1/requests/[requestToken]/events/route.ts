import { NextResponse } from "next/server";

import { api } from "@/convex/_generated/api";
import { createConvexServerClient } from "@/lib/boreal/integrations/convex/server-client";
import { requireAgentSession } from "@/lib/boreal/one-request/http";
import { isPublicRequestToken } from "@/lib/boreal/one-inbox/tokens";

export async function GET(
  request: Request,
  context: { params: Promise<{ requestToken: string }> },
) {
  try {
    const caller = requireAgentSession(request);
    const { requestToken } = await context.params;
    const convex = createConvexServerClient();
    const body = isPublicRequestToken(requestToken)
      ? (
          await convex.query(api.inboxApi.listSupplierRequestEvents, {
            ownerExternalId: caller.externalId,
            requestToken,
          })
        )
          .map((event) =>
            [
              `event: ${event.eventType}`,
              `data: ${JSON.stringify({
                createdAt: event.createdAt,
                data: event.data ?? null,
                message: event.message,
                requestToken,
                status: event.status,
                type: event.eventType,
              })}`,
              "",
            ].join("\n"),
          )
          .join("\n")
      : (
          await convex.query(api.requestApi.listRequestEvents, {
            ownerExternalId: caller.externalId,
            requestToken,
          })
        )
          .map((event) =>
            [
              `event: ${event.eventType}`,
              `data: ${JSON.stringify({
                createdAt: event.createdAt,
                data: event.dataJson ? safeParseJson(event.dataJson) : null,
                message: event.message,
                requestToken: event.requestToken,
                status: event.status,
                type: event.eventType,
              })}`,
              "",
            ].join("\n"),
          )
          .join("\n");

    return new Response(body, {
      headers: {
        "Cache-Control": "no-store",
        "Content-Type": "text/event-stream; charset=utf-8",
      },
      status: 200,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unable to stream Boreal request events.",
      },
      { status: 401 },
    );
  }
}

function safeParseJson(value: string) {
  try {
    return JSON.parse(value) as Record<string, unknown>;
  } catch {
    return {};
  }
}
