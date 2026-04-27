import { NextResponse } from "next/server";

import { api } from "@/convex/_generated/api";
import { createConvexServerClient } from "@/lib/boreal/integrations/convex/server-client";
import { requireAgentSession } from "@/lib/boreal/one-request/http";
import { isPublicRequestToken } from "@/lib/boreal/one-inbox/tokens";

export async function POST(
  request: Request,
  context: { params: Promise<{ requestToken: string }> },
) {
  try {
    const caller = requireAgentSession(request);
    const { requestToken } = await context.params;

    if (!isPublicRequestToken(requestToken)) {
      return NextResponse.json(
        { error: "Proposals are only supported on public market requests." },
        { status: 400 },
      );
    }

    const body = (await request.json()) as {
      collectiveMembers?: string[];
      currency?: string;
      etaAt?: number;
      etaHours?: number;
      memberRoles?: Array<{
        memberId: string;
        role: string;
      }>;
      summary?: string;
      price?: number;
      splitPlan?: Array<{
        memberId: string;
        percent: number;
      }>;
    };
    const summary = body.summary?.trim();
    const price = body.price;

    if (!summary) {
      return NextResponse.json({ error: "summary is required." }, { status: 400 });
    }

    if (typeof price !== "number" || !Number.isFinite(price) || price < 0) {
      return NextResponse.json({ error: "price must be a non-negative number." }, { status: 400 });
    }

    const etaAt =
      typeof body.etaAt === "number" && Number.isFinite(body.etaAt)
        ? body.etaAt
        : Date.now() + Math.max(1, Math.round(body.etaHours ?? 24)) * 60 * 60 * 1000;
    const convex = createConvexServerClient();
    const view = await convex.query(api.inboxApi.getSupplierRequestView, {
      ownerExternalId: caller.externalId,
      requestToken,
    });

    if (!view) {
      return NextResponse.json({ error: "Request not found." }, { status: 404 });
    }

    if (!view.inbox.actions.canPropose) {
      return NextResponse.json(
        { error: "This request is not open for supplier proposals." },
        { status: 409 },
      );
    }

    const result = await convex.mutation(api.proposals.submitProposal, {
      collectiveMembers: body.collectiveMembers,
      currency: body.currency?.trim() || "USD",
      deliverablesBody: summary,
      deliverablesType: "markdown",
      etaAt,
      intentId: view.request.request._id,
      ownerDisplayName: caller.displayName,
      ownerExternalId: caller.externalId,
      ownerHandle: undefined,
      price,
      proposerKind: "agent",
      memberRoles: body.memberRoles,
      splitPlan: body.splitPlan,
    });

    if (!result.submitted) {
      return NextResponse.json(
        { error: result.error ?? "Unable to submit proposal." },
        { status: 400 },
      );
    }

    return NextResponse.json({
      collectiveMembers: body.collectiveMembers ?? null,
      memberRoles: body.memberRoles ?? null,
      proposalId: result.proposalId,
      requestToken,
      splitPlan: body.splitPlan ?? null,
      submitted: result.submitted,
      version: "boreal-inbox/v1",
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to submit proposal.",
      },
      { status: 400 },
    );
  }
}
