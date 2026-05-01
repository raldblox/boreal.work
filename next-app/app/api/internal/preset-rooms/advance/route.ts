import { NextResponse } from "next/server";

import { advancePresetRoomOffTab } from "@/lib/boreal/agents/chat-assistant/agent";

export async function POST(request: Request) {
  const secret = request.headers.get("x-boreal-internal-secret");

  if (secret !== getInternalPresetRoomSecret()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = parseAdvanceRequest(await request.json());
    const result = await advancePresetRoomOffTab(body);

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Preset room advance failed.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function getInternalPresetRoomSecret() {
  if (process.env.BOREAL_INTERNAL_PRESET_ROOM_SECRET?.trim()) {
    return process.env.BOREAL_INTERNAL_PRESET_ROOM_SECRET.trim();
  }

  if (process.env.NODE_ENV !== "production") {
    return "boreal-preset-room-dev-secret";
  }

  throw new Error(
    "Missing BOREAL_INTERNAL_PRESET_ROOM_SECRET for durable preset room advances.",
  );
}

function parseAdvanceRequest(value: unknown) {
  if (!value || typeof value !== "object") {
    throw new Error("Preset room advance payload must be an object.");
  }

  const payload = value as Record<string, unknown>;
  const intentId = payload.intentId;
  const ownerExternalId = payload.ownerExternalId;
  const expectedCycleNumber = payload.expectedCycleNumber;
  const expectedTurnIndex = payload.expectedTurnIndex;

  if (typeof intentId !== "string" || intentId.trim().length === 0) {
    throw new Error("Preset room advance requires intentId.");
  }

  if (
    typeof ownerExternalId !== "string" ||
    ownerExternalId.trim().length === 0
  ) {
    throw new Error("Preset room advance requires ownerExternalId.");
  }

  if (
    typeof expectedCycleNumber !== "number" ||
    !Number.isFinite(expectedCycleNumber)
  ) {
    throw new Error("Preset room advance requires expectedCycleNumber.");
  }

  if (
    typeof expectedTurnIndex !== "number" ||
    !Number.isFinite(expectedTurnIndex)
  ) {
    throw new Error("Preset room advance requires expectedTurnIndex.");
  }

  return {
    expectedCycleNumber: Math.max(1, Math.floor(expectedCycleNumber)),
    expectedTurnIndex: Math.max(0, Math.floor(expectedTurnIndex)),
    intentId: intentId.trim(),
    ownerExternalId: ownerExternalId.trim(),
  };
}
