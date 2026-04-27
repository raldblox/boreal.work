import { NextResponse } from "next/server";

import {
  handleOneRequestStatusCallback,
  type OneRequestStatusCallbackPayload,
} from "@/lib/boreal/one-request/callbacks";
import { requireAgentSession } from "@/lib/boreal/one-request/http";

export async function POST(
  request: Request,
  context: { params: Promise<{ requestToken: string }> },
) {
  try {
    const caller = requireAgentSession(request);
    const { requestToken } = await context.params;
    const body = (await request.json()) as OneRequestStatusCallbackPayload;

    return NextResponse.json(
      await handleOneRequestStatusCallback({
        body,
        caller,
        requestToken,
      }),
    );
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to record Boreal request status.",
      },
      { status: 401 },
    );
  }
}
