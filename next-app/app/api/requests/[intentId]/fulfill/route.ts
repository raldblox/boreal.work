import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { markRequestFulfilled } from "@/lib/boreal/dal/intent-repository";

export async function POST(_: Request, context: { params: Promise<unknown> }) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { intentId } = (await context.params) as { intentId: string };
    const result = await markRequestFulfilled({
      intentId,
      ownerExternalId: session.user.id,
    });

    if (!result.fulfilled) {
      return NextResponse.json({ error: "Failed to mark request as fulfilled." }, { status: 403 });
    }

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to mark request as fulfilled.",
      },
      { status: 500 },
    );
  }
}
