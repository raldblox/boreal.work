import { NextResponse } from "next/server";

import { convexFunctionRefs } from "@/lib/boreal/integrations/convex/function-refs";
import { createConvexServerClient } from "@/lib/boreal/integrations/convex/server-client";
import { listDiscoveredCapabilities } from "@/lib/boreal/integrations/service-providers/registry";

export async function POST(request: Request) {
  try {
    const url = new URL(request.url);
    const limitParam = url.searchParams.get("limit");
    const query = url.searchParams.get("query") ?? undefined;
    const limit = limitParam ? Number(limitParam) : 24;
    const capabilities = await listDiscoveredCapabilities("agentic-market", {
      limit: Number.isFinite(limit) ? Math.max(1, Math.min(limit, 100)) : 24,
      query,
    });
    const convex = createConvexServerClient();
    const result = await convex.mutation(convexFunctionRefs.syncCatalogCapabilities, {
      capabilities: capabilities.map((capability) => ({
        acceptedCurrencies: capability.acceptedCurrencies,
        capabilityTags: capability.capabilityTags,
        category: capability.category,
        description: capability.description,
        endpoint: capability.endpoint,
        evidence: capability.evidence,
        executionSurface: capability.executionSurface,
        keywords: capability.keywords,
        paymentNetworkHints: capability.paymentNetworkHints,
        paymentProtocol: capability.paymentProtocol,
        pricing: {
          amount: capability.pricing.amount,
          currency: capability.pricing.currency,
          rawJson: capability.pricing.raw ? JSON.stringify(capability.pricing.raw) : undefined,
          type: capability.pricing.type,
        },
        rawJson: capability.raw ? JSON.stringify(capability.raw) : undefined,
        requiresHumanApproval: capability.requiresHumanApproval,
        routingTier: capability.routingTier,
        sourceCapabilityId: capability.sourceCapabilityId,
        sourceId: capability.sourceId,
        sourceProvider: capability.sourceProvider,
        sourceProviderUrl: capability.sourceProviderUrl,
        sourceUrl: capability.sourceUrl,
        subtitle: capability.subtitle,
        supportsDirectInvoke: capability.supportsDirectInvoke,
        supportsPrivyWallet: capability.supportsPrivyWallet,
        title: capability.title,
        walletModes: capability.walletRequirements.supportedWalletModes,
      })),
      provider: {
        description: "Machine-readable x402 registry source for public service discovery.",
        displayName: "Agentic Market",
        key: "agentic-market",
        providerUrl: "https://agentic.market",
      },
    });

    return NextResponse.json({
      capabilityCount: capabilities.length,
      insertedCount: result.insertedCount,
      synced: result.synced,
      updatedCount: result.updatedCount,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Could not sync Agentic Market.",
      },
      { status: 500 },
    );
  }
}
