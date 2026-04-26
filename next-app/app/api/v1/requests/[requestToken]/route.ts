import { NextResponse } from "next/server";

import { api } from "@/convex/_generated/api";
import { createConvexServerClient } from "@/lib/boreal/integrations/convex/server-client";
import {
  buildSessionEnvelope,
  buildTrackingUrls,
  requireAgentSession,
} from "@/lib/boreal/one-request/http";
import { isPublicRequestToken } from "@/lib/boreal/one-inbox/tokens";

export async function GET(
  request: Request,
  context: { params: Promise<{ requestToken: string }> },
) {
  try {
    const caller = requireAgentSession(request);
    const { requestToken } = await context.params;
    const convex = createConvexServerClient();

    if (isPublicRequestToken(requestToken)) {
      const view = await convex.query(api.inboxApi.getSupplierRequestView, {
        ownerExternalId: caller.externalId,
        requestToken,
      });

      if (!view) {
        return NextResponse.json({ error: "Request not found." }, { status: 404 });
      }

      return NextResponse.json({
        inbox: view.inbox,
        request: view.request,
        requestToken,
        version: "boreal-requests/v1",
      });
    }

    const session = await convex.query(api.requestApi.getRequestSession, {
      ownerExternalId: caller.externalId,
      requestToken,
    });

    if (!session) {
      return NextResponse.json({ error: "Request not found." }, { status: 404 });
    }

    return NextResponse.json(
      buildSessionEnvelope({
        eventsUrl: buildTrackingUrls(request, requestToken).eventsUrl,
        requestToken,
        route: safeParseJson(session.routeJson),
        session: {
          conversationId: session.conversationId ?? null,
          intentId: session.intentId ?? null,
          payment: {
            amount: session.quoteAmount,
            authorizationMessage: session.quoteAuthorizationMessage,
            currency: session.currency,
            expiresAt: session.quoteExpiresAt,
            payerSource: session.payerSource ?? null,
            quoteToken: session.quoteToken,
            txHash: session.txHash ?? null,
          },
          result: session.resultJson ? safeParseJson(session.resultJson) : null,
          status: session.status,
          summary: session.summary,
          title: session.title,
          walletAddress: session.walletAddress,
        },
        statusUrl: buildTrackingUrls(request, requestToken).statusUrl,
      }),
    );
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unable to load Boreal request state.",
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
