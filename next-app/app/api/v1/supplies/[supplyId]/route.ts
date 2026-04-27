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

export async function GET(
  request: Request,
  context: { params: Promise<{ supplyId: string }> },
) {
  const { supplyId } = await context.params;
  const url = new URL(request.url);
  const mine = url.searchParams.get("mine") === "true";
  const convex = createConvexServerClient();

  const supply = mine
    ? await convex.query(api.supplies.getOwnedSupply, {
        ownerExternalId: requireAgentSession(request).externalId,
        supplyId: supplyId as Id<"supplies">,
      })
    : await convex.query(api.supplies.getSupply, {
        supplyId: supplyId as Id<"supplies">,
      });

  if (!supply) {
    return NextResponse.json({ error: "Supply not found." }, { status: 404 });
  }

  return NextResponse.json({
    supply,
    version: "boreal-supplies/v1",
  });
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ supplyId: string }> },
) {
  try {
    const { supplyId } = await context.params;
    const caller = requireAgentSession(request);
    const body = (await request.json()) as PublicSupplyUpsertBody;
    const convex = createConvexServerClient();
    const existing = await convex.query(api.supplies.getOwnedSupply, {
      ownerExternalId: caller.externalId,
      supplyId: supplyId as Id<"supplies">,
    });

    if (!existing?.supply) {
      return NextResponse.json({ error: "Supply not found." }, { status: 404 });
    }

    await convex.mutation(api.wallets.syncWalletAccount, buildSupplierPayoutWalletArgs(caller));

    const mutationArgs = buildPublicSupplyMutationArgs({
      body,
      caller,
      existingSupply: existing.supply,
    });
    const result = await convex.mutation(api.supplies.createSupplyEntry, mutationArgs);

    if (!result.created || !result.supplyId) {
      return NextResponse.json(
        { error: result.reason ?? "Unable to update supplier supply." },
        { status: result.reason === "missing_payout_wallet" ? 409 : 400 },
      );
    }

    const supply = await convex.query(api.supplies.getOwnedSupply, {
      ownerExternalId: caller.externalId,
      supplyId: result.supplyId as Id<"supplies">,
    });

    return NextResponse.json({
      supplier: {
        ownerDisplayName: caller.displayName,
        ownerExternalId: caller.externalId,
        payoutWalletAddress: caller.walletAddress,
        walletAddress: caller.walletAddress,
      },
      supply,
      version: "boreal-supplies/v1",
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to update supplier supply.";
    const status =
      message.includes("Bearer session token") ||
      message.includes("Signed token") ||
      message.includes("Wallet")
        ? 401
        : 400;

    return NextResponse.json({ error: message }, { status });
  }
}
