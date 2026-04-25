import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { approveProposal } from "@/lib/boreal/dal/intent-repository";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ intentId: string; proposalId: string }> },
) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { intentId, proposalId } = await params;

  try {
    const result = await approveProposal({
      intentId,
      ownerExternalId: session.user.id,
      proposalId,
    });

    if (!result.approved) {
      const error =
        result.reason === "missing_buyer_wallet"
          ? "Connect a buyer wallet before approving paid work."
          : result.reason === "missing_payout_wallet"
            ? "The selected proposer needs a payout wallet before approval."
            : result.reason === "wallet_network_mismatch"
              ? "Buyer and worker payout wallets must be on the same supported network for paid work."
            : "Proposal approval failed.";
      return NextResponse.json(
        { error },
        { status: 403 },
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Proposal approval failed.";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
