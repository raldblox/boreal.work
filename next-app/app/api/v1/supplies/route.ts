import { NextResponse } from "next/server";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { createConvexServerClient } from "@/lib/boreal/integrations/convex/server-client";
import { requireAgentSession } from "@/lib/boreal/one-request/http";
import {
  buildPublicSupplyMutationArgs,
  buildSupplierPayoutWalletArgs,
  type PublicSupplyUpsertBody,
} from "@/lib/boreal/supplies/public-api";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const mine = url.searchParams.get("mine") === "true";
  const query = url.searchParams.get("query")?.trim() ?? "";
  const limit = Number(url.searchParams.get("limit") ?? "24");
  const safeLimit = Number.isFinite(limit) ? Math.max(1, Math.min(limit, 100)) : 24;
  const convex = createConvexServerClient();

  if (mine) {
    const caller = requireAgentSession(request);
    const [supplies, walletAccounts] = await Promise.all([
      convex.query(api.supplies.listOwnedSupplies, {
        ownerExternalId: caller.externalId,
      }),
      convex.query(api.wallets.getMyWalletAccounts, {
        ownerExternalId: caller.externalId,
      }),
    ]);

    return NextResponse.json({
      supplier: {
        defaultPayoutWallet:
          walletAccounts.find((account) => account.isDefaultPayout) ?? null,
        ownerDisplayName: caller.displayName,
        ownerExternalId: caller.externalId,
        walletAddress: caller.walletAddress,
      },
      supplies,
      version: "boreal-supplies/v1",
    });
  }

  const supplies =
    query.length > 0
      ? await convex.query(api.supplies.searchCatalog, {
          limit: safeLimit,
          query,
        })
      : await convex.query(api.supplies.listCatalog, {
          limit: safeLimit,
        });

  return NextResponse.json({
    supplies,
    version: "boreal-supplies/v1",
  });
}

export async function POST(request: Request) {
  try {
    const caller = requireAgentSession(request);
    const body = (await request.json()) as PublicSupplyUpsertBody;
    const convex = createConvexServerClient();

    await convex.mutation(api.wallets.syncWalletAccount, buildSupplierPayoutWalletArgs(caller));

    const mutationArgs = buildPublicSupplyMutationArgs({
      body,
      caller,
    });
    const result = await convex.mutation(api.supplies.createSupplyEntry, mutationArgs);

    if (!result.created || !result.supplyId) {
      return NextResponse.json(
        { error: result.reason ?? "Unable to register supplier supply." },
        {
          status:
            result.reason === "missing_payout_wallet"
              ? 409
              : result.reason === "supply_limit_reached"
                ? 429
                : 400,
        },
      );
    }

    const supply = await convex.query(api.supplies.getOwnedSupply, {
      ownerExternalId: caller.externalId,
      supplyId: result.supplyId as Id<"supplies">,
    });

    return NextResponse.json(
      {
        supplier: {
          ownerDisplayName: caller.displayName,
          ownerExternalId: caller.externalId,
          payoutWalletAddress: caller.walletAddress,
          walletAddress: caller.walletAddress,
        },
        supply,
        version: "boreal-supplies/v1",
      },
      { status: 201 },
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to register supplier supply.";
    const status =
      message.includes("Bearer session token") ||
      message.includes("Signed token") ||
      message.includes("Wallet")
        ? 401
        : 400;

    return NextResponse.json({ error: message }, { status });
  }
}
