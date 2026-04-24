import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { proposalSubmissionAgent } from "@/lib/boreal/agents/proposal-submission/agent";
import {
  getRequestDetailRecord,
  submitProposal,
} from "@/lib/boreal/dal/intent-repository";
import { normalizeProposalDraft } from "@/lib/boreal/schemas/proposal";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ intentId: string }> },
) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { intentId } = await params;

  try {
    const body = parseProposalRequest(await request.json());
    const detail = await getRequestDetailRecord({
      intentId,
      ownerExternalId: session.user.id,
    });

    if (!detail?.intent || !detail.access?.canSubmitProposal) {
      return NextResponse.json(
        { error: "This request is not open for proposal submission." },
        { status: 403 },
      );
    }

    if (body.action === "draft") {
      const draft = await proposalSubmissionAgent.run({
        intentSummary: detail.intent.summary,
        intentTitle: detail.intent.title,
        message: body.message,
      });

      return NextResponse.json({ draft });
    }

    const draft = normalizeProposalDraft(body.draft, body.message);
    const result = await submitProposal({
      currency: draft.currency,
      deliverablesBody: draft.deliverablesBody,
      deliverablesType: draft.deliverablesType,
      etaAt: Date.now() + draft.etaDays * 24 * 60 * 60 * 1000,
      intentId,
      ownerDisplayName: session.user.name ?? undefined,
      ownerExternalId: session.user.id,
      ownerHandle: undefined,
      price: draft.price,
      proposerKind: "human",
    });

    return NextResponse.json({ draft, ...result });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Proposal request failed.";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}

type ParsedProposalRequest =
  | {
      action: "draft";
      message: string;
    }
  | {
      action: "submit";
      draft: Record<string, unknown>;
      message: string;
    };

function parseProposalRequest(value: unknown): ParsedProposalRequest {
  if (!value || typeof value !== "object") {
    throw new Error("Proposal payload must be an object.");
  }

  const payload = value as Record<string, unknown>;
  const action = payload.action;
  const message = payload.message;

  if (action !== "draft" && action !== "submit") {
    throw new Error("Proposal action must be draft or submit.");
  }

  if (typeof message !== "string" || message.trim().length === 0) {
    throw new Error("Proposal message is required.");
  }

  if (action === "draft") {
    return { action, message };
  }

  if (!payload.draft || typeof payload.draft !== "object") {
    throw new Error("Proposal submission requires a draft.");
  }

  return {
    action,
    draft: payload.draft as Record<string, unknown>,
    message,
  };
}
