import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { getBorealRuntimeConfig } from "@/lib/boreal/config";
import { getMyProfileRecord } from "@/lib/boreal/dal/intent-repository";
import { resolveProviderAdapter } from "@/lib/boreal/integrations/providers/registry";
import { draftProfileBuilder } from "@/lib/boreal/tools/llm/draft-profile-builder";

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = parseDraftRequest(await request.json());
    const provider = resolveProviderAdapter();
    const config = getBorealRuntimeConfig();
    const currentProfile = await getMyProfileRecord({
      ownerExternalId: session.user.id,
    });

    const draft = await draftProfileBuilder({
      currentProfile,
      message: body.message,
      modelId: config.assistantModel,
      provider,
    });

    return NextResponse.json({ draft });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not draft the profile builder.";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}

function parseDraftRequest(value: unknown) {
  if (!value || typeof value !== "object") {
    throw new Error("Profile builder payload must be an object.");
  }

  const payload = value as Record<string, unknown>;
  const message = payload.message;

  if (typeof message !== "string" || message.trim().length === 0) {
    throw new Error("Profile builder drafting requires a message.");
  }

  return { message: message.trim() };
}
