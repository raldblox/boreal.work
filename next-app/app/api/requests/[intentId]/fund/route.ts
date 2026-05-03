import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { fundPersistedRequest } from "@/lib/boreal/agents/chat-assistant/agent";
import {
  attachBorealX402SettlementHeaders,
  createBorealX402Challenge,
  createBorealX402RequiredResponse,
  verifyAndSettleBorealX402,
} from "@/lib/boreal/x402/server";
import type { ProviderRoutePaymentReceipt } from "@/lib/boreal/provider-routing/types";

type FundRequestBody = {
  paymentReceipt?: ProviderRoutePaymentReceipt | null;
  routeKey?: string;
};

export async function POST(
  request: NextRequest,
  context: {
    params: Promise<{
      intentId: string;
    }>;
  },
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as FundRequestBody;
    const { intentId } = await context.params;

    if (!body.routeKey?.trim()) {
      return NextResponse.json(
        { error: "Missing locked route key." },
        { status: 400 },
      );
    }

    const prepared = await fundPersistedRequest({
      intentId,
      ownerExternalId: session.user.id,
      paymentReceipt: body.paymentReceipt ?? null,
      prepareOnly: !request.headers.has("PAYMENT-SIGNATURE") && !body.paymentReceipt,
      routeKey: body.routeKey.trim(),
    });

    if (!prepared.workspace || prepared.workspace.kind !== "provider_selection") {
      return NextResponse.json(prepared);
    }

    const selectedRoute =
      prepared.workspace.selection.options.find(
        (option) => option.routeKey === body.routeKey?.trim(),
      ) ?? null;
    const selectedQuote = selectedRoute?.quote ?? null;

    if (!selectedRoute || !selectedQuote) {
      throw new Error("This request no longer has a payable x402 route.");
    }

    if (!request.headers.has("PAYMENT-SIGNATURE")) {
      const challenge = await createBorealX402Challenge({
        memo: selectedQuote.paymentReference,
        request,
        resourceDescription: selectedRoute.displayTitle,
        resourcePath: `/api/requests/${intentId}/fund`,
      });

      return createBorealX402RequiredResponse({
        body: prepared as unknown as Record<string, unknown>,
        challenge,
      });
    }

    const challenge = await createBorealX402Challenge({
      memo: selectedQuote.paymentReference,
      request,
      resourceDescription: selectedRoute.displayTitle,
      resourcePath: `/api/requests/${intentId}/fund`,
    });
    const paidX402 = await verifyAndSettleBorealX402({
      challenge,
    });
    const settledWalletAddress = paidX402.verification.payer?.trim();
    const settledNetwork = paidX402.settlement.network?.trim();
    const settledTransaction = paidX402.settlement.transaction?.trim();
    const settledPayer = paidX402.settlement.payer?.trim() || settledWalletAddress;

    if (!settledWalletAddress || !settledNetwork || !settledTransaction || !settledPayer) {
      throw new Error("Boreal could not finalize this x402 payment.");
    }

    const result = await fundPersistedRequest({
      intentId,
      ownerExternalId: session.user.id,
      routeKey: body.routeKey.trim(),
      x402Payment: {
        settlement: {
          network: settledNetwork,
          payer: settledPayer,
          success: true,
          transaction: settledTransaction,
        },
        verification: paidX402.verification,
        walletAddress: settledWalletAddress,
      },
    });

    return attachBorealX402SettlementHeaders(
      NextResponse.json(result),
      {
        network: settledNetwork,
        payer: settledPayer,
        success: true,
        transaction: settledTransaction,
      },
    );
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to fund request.",
      },
      { status: 500 },
    );
  }
}
