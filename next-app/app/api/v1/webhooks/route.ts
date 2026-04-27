import { NextResponse } from "next/server";

import { api } from "@/convex/_generated/api";
import { createConvexServerClient } from "@/lib/boreal/integrations/convex/server-client";
import { requireAgentSession } from "@/lib/boreal/one-request/http";

const ALLOWED_STREAMS = new Set(["requests", "inbox", "payouts"]);

export async function GET(request: Request) {
  try {
    const caller = requireAgentSession(request);
    const convex = createConvexServerClient();
    const webhooks = await convex.query(api.webhooks.listWebhookSubscriptions, {
      ownerExternalId: caller.externalId,
    });

    return NextResponse.json({
      version: "boreal-webhook/v1",
      webhooks,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to list Boreal webhooks.",
      },
      { status: 401 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const caller = requireAgentSession(request);
    const body = (await request.json()) as {
      endpointUrl?: string;
      eventStreams?: string[];
    };
    const endpointUrl = body.endpointUrl?.trim();

    if (!endpointUrl) {
      return NextResponse.json({ error: "endpointUrl is required." }, { status: 400 });
    }

    if (
      body.eventStreams &&
      (!Array.isArray(body.eventStreams) ||
        body.eventStreams.some((stream) => !ALLOWED_STREAMS.has(stream)))
    ) {
      return NextResponse.json(
        { error: "eventStreams must only include requests, inbox, or payouts." },
        { status: 400 },
      );
    }

    const convex = createConvexServerClient();
    const result = await convex.mutation(api.webhooks.createWebhookSubscription, {
      endpointUrl,
      eventStreams: body.eventStreams as Array<"inbox" | "payouts" | "requests"> | undefined,
      ownerDisplayName: caller.displayName,
      ownerExternalId: caller.externalId,
      walletAddress: caller.walletAddress,
    });

    return NextResponse.json({
      created: result.created,
      secret: result.secret,
      subscription: result.subscription,
      version: "boreal-webhook/v1",
      webhookToken: result.webhookToken,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to register Boreal webhook.",
      },
      { status: 400 },
    );
  }
}
