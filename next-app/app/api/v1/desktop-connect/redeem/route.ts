import { NextResponse } from "next/server";

import { api } from "@/convex/_generated/api";
import { verifyDesktopConnectGrant } from "@/lib/boreal/desktop-connect/grants";
import { createConvexServerClient } from "@/lib/boreal/integrations/convex/server-client";
import { createSessionToken } from "@/lib/boreal/one-request/auth";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      grantToken?: string;
    };
    const grantToken = body.grantToken?.trim();

    if (!grantToken) {
      return NextResponse.json(
        { error: "grantToken is required." },
        { status: 400 },
      );
    }

    const grant = verifyDesktopConnectGrant(grantToken);
    const convex = createConvexServerClient();
    const resolvedOwnerExternalId = await convex.query(
      api.wallets.getOwnerExternalIdByWalletAddress,
      {
        walletAddress: grant.walletAddress,
      },
    );

    if (resolvedOwnerExternalId !== grant.ownerExternalId) {
      return NextResponse.json(
        {
          error:
            "Desktop connect grant no longer matches the linked Boreal wallet owner.",
        },
        { status: 409 },
      );
    }

    return NextResponse.json({
      ownerExternalId: grant.ownerExternalId,
      sessionToken: createSessionToken({
        walletAddress: grant.walletAddress,
      }),
      walletAddress: grant.walletAddress,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to redeem the Boreal Desktop connect grant.",
      },
      { status: 400 },
    );
  }
}
