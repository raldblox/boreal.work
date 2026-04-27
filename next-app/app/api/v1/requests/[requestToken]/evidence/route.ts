import { NextResponse } from "next/server";

import {
  handleOneRequestEvidenceCallback,
  type OneRequestEvidenceCallbackPayload,
} from "@/lib/boreal/one-request/callbacks";
import { requireAgentSession } from "@/lib/boreal/one-request/http";

export async function POST(
  request: Request,
  context: { params: Promise<{ requestToken: string }> },
) {
  try {
    const caller = requireAgentSession(request);
    const { requestToken } = await context.params;
    const body = (await request.json()) as OneRequestEvidenceCallbackPayload;

    return NextResponse.json(
      await handleOneRequestEvidenceCallback({
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
            : "Unable to record Boreal request evidence.",
      },
      { status: 401 },
    );
  }
}
