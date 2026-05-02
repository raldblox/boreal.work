import { NextResponse } from "next/server";

import { api } from "@/convex/_generated/api";
import { createConvexServerClient } from "@/lib/boreal/integrations/convex/server-client";
import {
  createSignedTokenFingerprint,
  createSiwxChallenge,
} from "@/lib/boreal/one-request/auth";

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

    const challenge = createSiwxChallenge({ walletAddress });
    const convex = createConvexServerClient();

    await convex.mutation(api.siwxChallenges.registerChallenge, {
      challengeTokenHash: createSignedTokenFingerprint(challenge.challengeToken),
      expiresAt: challenge.expiresAt,
      walletAddress,
    });

    return NextResponse.json(challenge);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to issue SIWX challenge.",
      },
      { status: 400 },
    );
  }
}
