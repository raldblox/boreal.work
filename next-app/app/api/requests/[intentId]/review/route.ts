import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { rateRequest } from "@/lib/boreal/dal/intent-repository";

type RouteContext = {
  params: Promise<{
    intentId: string;
  }>;
};

export async function POST(request: Request, context: RouteContext) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as {
      comment?: string;
      rating?: number;
    };
    const { intentId } = await context.params;

    if (typeof body.rating !== "number" || body.rating < 1 || body.rating > 5) {
      return NextResponse.json({ error: "rating must be between 1 and 5." }, { status: 400 });
    }

    const result = await rateRequest({
      comment: typeof body.comment === "string" ? body.comment : undefined,
      intentId,
      ownerExternalId: session.user.id,
      rating: body.rating,
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to save request review.",
      },
      { status: 500 },
    );
  }
}
