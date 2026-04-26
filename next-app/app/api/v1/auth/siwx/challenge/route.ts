import { NextResponse } from "next/server";

import { createSiwxChallenge } from "@/lib/boreal/one-request/auth";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { walletAddress?: string };
    const walletAddress = body.walletAddress?.trim();

    if (!walletAddress) {
      return NextResponse.json(
        { error: "walletAddress is required." },
        { status: 400 },
      );
    }

    return NextResponse.json(createSiwxChallenge({ walletAddress }));
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to issue SIWX challenge.",
      },
      { status: 400 },
    );
  }
}
