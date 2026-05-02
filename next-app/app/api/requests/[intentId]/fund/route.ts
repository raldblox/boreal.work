import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { fundPersistedRequest } from "@/lib/boreal/agents/chat-assistant/agent";
import type { ProviderRoutePaymentReceipt } from "@/lib/boreal/provider-routing/types";

type FundRequestBody = {
  paymentReceipt?: ProviderRoutePaymentReceipt | null;
  routeKey?: string;
};

export async function POST(
  request: NextRequest,
  context: {
    params: Promise<{
      intentId: string;
    }>;
  },
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as FundRequestBody;
    const { intentId } = await context.params;

    if (!body.routeKey?.trim()) {
      return NextResponse.json(
        { error: "Missing locked route key." },
        { status: 400 },
      );
    }

    const result = await fundPersistedRequest({
      intentId,
      ownerExternalId: session.user.id,
      paymentReceipt: body.paymentReceipt ?? null,
      routeKey: body.routeKey.trim(),
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to fund request.",
      },
      { status: 500 },
    );
  }
}
