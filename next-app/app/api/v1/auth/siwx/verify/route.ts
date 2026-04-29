import { NextResponse } from "next/server";

import { api } from "@/convex/_generated/api";
import { createConvexServerClient } from "@/lib/boreal/integrations/convex/server-client";
import {
  getWalletDisplayName,
  getWalletExternalId,
  verifySiwxChallenge,
} from "@/lib/boreal/one-request/auth";
import {
  getDefaultSolanaEnvironment,
  getDefaultSolanaNetworkKey,
} from "@/lib/boreal/solana-network";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      challengeToken?: string;
      signature?: string;
      walletAddress?: string;
    };
    const walletAddress = body.walletAddress?.trim();
    const challengeToken = body.challengeToken?.trim();
    const signature = body.signature?.trim();

    if (!walletAddress || !challengeToken || !signature) {
      return NextResponse.json(
        { error: "walletAddress, challengeToken, and signature are required." },
        { status: 400 },
      );
    }

    const verified = verifySiwxChallenge({
      challengeToken,
      signature,
      walletAddress,
    });
    const convex = createConvexServerClient();
    const ownerExternalId = getWalletExternalId(walletAddress);
    const networkKey = getDefaultSolanaNetworkKey();
    const environment = getDefaultSolanaEnvironment();

    await convex.mutation(api.wallets.syncWalletAccount, {
      chainFamily: "solana",
      environment,
      networkKey,
      ownerDisplayName: getWalletDisplayName(walletAddress),
      ownerExternalId,
      roles: ["connected", "buyer"],
      setAsDefaultBuyer: true,
      setAsDefaultPayout: false,
      walletAddress,
      walletProvider: "siwx",
    });

    return NextResponse.json({
      chainFamily: "solana",
      networkKey,
      ownerDisplayName: getWalletDisplayName(walletAddress),
      ownerExternalId,
      sessionToken: verified.sessionToken,
      walletAddress,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unable to verify SIWX challenge.",
      },
      { status: 401 },
    );
  }
}
