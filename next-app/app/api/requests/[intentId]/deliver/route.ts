import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { submitWork } from "@/lib/boreal/dal/intent-repository";

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
      attachments?: Array<{
        fileName?: string;
        mediaType?: string;
        sizeBytes?: number;
        storageId?: string;
      }>;
      deliverablesBody?: string;
    };
    const deliverablesBody = body.deliverablesBody;

    if (typeof deliverablesBody !== "string" || deliverablesBody.trim().length === 0) {
      return NextResponse.json({ error: "Deliverables are required." }, { status: 400 });
    }

    const attachments = (body.attachments ?? []).flatMap((attachment) =>
      typeof attachment.storageId === "string" &&
      typeof attachment.fileName === "string" &&
      typeof attachment.mediaType === "string" &&
      typeof attachment.sizeBytes === "number"
        ? [
            {
              fileName: attachment.fileName,
              mediaType: attachment.mediaType,
              sizeBytes: attachment.sizeBytes,
              storageId: attachment.storageId,
            },
          ]
        : [],
    );

    const { intentId } = await context.params;
    const result = await submitWork({
      attachments,
      deliverablesBody: deliverablesBody.trim(),
      intentId,
      workerDisplayName: session.user.name ?? undefined,
      workerExternalId: session.user.id,
    });

    if (!result.submitted) {
      return NextResponse.json(
        { error: "Work submission failed for this request." },
        { status: 403 },
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to submit work.",
      },
      { status: 500 },
    );
  }
}
