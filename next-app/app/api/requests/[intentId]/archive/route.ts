import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { archiveRequest } from "@/lib/boreal/dal/intent-repository";

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
    const result = await archiveRequest({
      intentId,
      ownerExternalId: session.user.id,
    });

    if (!result.archived) {
      return NextResponse.json({ error: "Archive failed." }, { status: 403 });
    }

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to archive request.",
      },
      { status: 500 },
    );
  }
}
