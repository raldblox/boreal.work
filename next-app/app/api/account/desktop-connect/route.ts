import { NextResponse } from "next/server";

import { api } from "@/convex/_generated/api";
import { auth } from "@/lib/auth";
import {
  buildDesktopConnectLaunchUrl,
  createDesktopConnectGrant,
} from "@/lib/boreal/desktop-connect/grants";
import { createConvexServerClient } from "@/lib/boreal/integrations/convex/server-client";
import { getDefaultSolanaNetworkKey } from "@/lib/boreal/solana-network";

type WalletAccountSummary = {
  chainFamily: "evm" | "solana";
  isDefaultBuyer: boolean;
  isDefaultPayout: boolean;
  networkKey: string;
  walletAddress: string;
};

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json().catch(() => ({}))) as {
      walletAddress?: string;
    };
    const preferredWalletAddress = body.walletAddress?.trim() ?? "";
    const runtimeNetworkKey = getDefaultSolanaNetworkKey();
    const convex = createConvexServerClient();

    if (preferredWalletAddress) {
      if (!looksLikeSolanaAddress(preferredWalletAddress)) {
        return NextResponse.json(
          {
            error: "Connected wallet address is not a valid Solana address.",
          },
          { status: 400 },
        );
      }

      await convex.mutation(api.wallets.syncWalletAccount, {
        chainFamily: "solana",
        networkKey: runtimeNetworkKey,
        ownerDisplayName: session.user.name ?? undefined,
        ownerExternalId: session.user.id,
        roles: ["connected", "buyer", "payout"],
        setAsDefaultBuyer: true,
        setAsDefaultPayout: true,
        walletAddress: preferredWalletAddress,
        walletProvider: "reown",
      });
    }

    const walletAccounts = (await convex.query(api.wallets.getMyWalletAccounts, {
      ownerExternalId: session.user.id,
    })) as WalletAccountSummary[];
    const walletAccount = selectDesktopConnectWallet(
      walletAccounts,
      preferredWalletAddress,
    );

    if (!walletAccount) {
      return NextResponse.json(
        {
          error:
            "Connect and sync a Solana mainnet wallet first so Boreal Desktop can inherit this account identity.",
        },
        { status: 409 },
      );
    }

    const apiBaseUrl = new URL(request.url).origin;
    const grant = createDesktopConnectGrant({
      ownerExternalId: session.user.id,
      walletAddress: walletAccount.walletAddress,
    });

    return NextResponse.json({
      apiBaseUrl,
      expiresAt: new Date(grant.expiresAt).toISOString(),
      launchUrl: buildDesktopConnectLaunchUrl({
        apiBaseUrl,
        grantToken: grant.grantToken,
      }),
      walletAddress: walletAccount.walletAddress,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to prepare the Boreal Desktop connect flow.",
      },
      { status: 400 },
    );
  }
}

function selectDesktopConnectWallet(
  accounts: WalletAccountSummary[],
  preferredWalletAddress?: string,
) {
  const runtimeNetworkKey = getDefaultSolanaNetworkKey();
  const runtimeWallets = accounts.filter(
    (account) =>
      account.chainFamily === "solana" &&
      account.networkKey === runtimeNetworkKey &&
      account.walletAddress.trim().length > 0,
  );

  if (runtimeWallets.length === 0) {
    return null;
  }

  return (
    runtimeWallets.find(
      (account) =>
        preferredWalletAddress &&
        account.walletAddress.toLowerCase() === preferredWalletAddress.toLowerCase(),
    ) ??
    runtimeWallets.find((account) => account.isDefaultBuyer) ??
    runtimeWallets.find((account) => account.isDefaultPayout) ??
    runtimeWallets[0]
  );
}

function looksLikeSolanaAddress(walletAddress: string) {
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(walletAddress);
}
