import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { cancelRequestDraft } from "@/lib/boreal/dal/intent-repository";

type RouteContext = {
  params: Promise<{
    intentId: string;
  }>;
};

export async function POST(_: Request, context: RouteContext) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { intentId } = await context.params;
    const result = await cancelRequestDraft({
      intentId,
      ownerExternalId: session.user.id,
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to cancel request.",
      },
      { status: 500 },
    );
  }
}
