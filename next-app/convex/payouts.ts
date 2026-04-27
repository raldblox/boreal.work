import type { Doc, Id } from "./_generated/dataModel";
import { mutation, type MutationCtx } from "./_generated/server";
import { v } from "convex/values";

import { updateTransactionById } from "./commerceCore";
import { recordTransactionAuditEvent } from "./transactionScenarios";
import { createPayoutToken, createPublicRequestToken, parsePayoutToken } from "../lib/boreal/one-inbox/tokens";
import { queueWebhookDeliveries } from "./webhooks";

export const markPayoutProcessing = mutation({
  args: {
    payoutToken: v.string(),
    processor: v.string(),
    txHash: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const payout = await getPayoutByToken(ctx, args.payoutToken);

    if (!payout) {
      return { updated: false, reason: "payout_not_found" as const };
    }

    if (payout.status === "paid") {
      return { updated: false, reason: "already_paid" as const };
    }

    if (payout.status === "failed" || payout.status === "cancelled") {
      return { updated: false, reason: "payout_not_processible" as const };
    }

    if (payout.status === "processing") {
      return { updated: false, reason: "already_processing" as const };
    }

    const transaction = await ctx.db.get(payout.transactionId);
    const settlement = payout.settlementId ? await ctx.db.get(payout.settlementId) : null;

    if (!transaction || !settlement) {
      return { updated: false, reason: "missing_financial_context" as const };
    }

    if (transaction.status !== "fulfilled" || settlement.status !== "ready_for_payout") {
      return { updated: false, reason: "payout_not_ready" as const };
    }

    const now = Date.now();
    await ctx.db.patch(payout._id, {
      failureReason: undefined,
      processingStartedAt: payout.processingStartedAt ?? now,
      processor: args.processor,
      status: "processing",
      txHash: args.txHash ?? payout.txHash,
      updatedAt: now,
    });

    await recordTransactionAuditEvent(ctx, {
      intentId: transaction.intentId,
      message: "Payout processing started.",
      metadata: {
        payoutToken: args.payoutToken,
        processor: args.processor,
        txHash: args.txHash ?? null,
      },
      scenarioType: "custom_scoped_work",
      settlementId: settlement._id,
      source: "payment",
      stage: "settlement",
      status: "info",
      transactionId: transaction._id,
    });
    await queuePayoutWebhookDeliveries(ctx, {
      payout,
      requestToken: transaction.intentId ? createPublicRequestToken(transaction.intentId) : undefined,
      streamStatus: "payout_processing",
      type: "processing",
    });

    return {
      payoutToken: args.payoutToken,
      status: "processing" as const,
      updated: true,
    };
  },
});

export const markPayoutPaid = mutation({
  args: {
    payoutToken: v.string(),
    processor: v.string(),
    txHash: v.string(),
  },
  handler: async (ctx, args) => {
    const payout = await getPayoutByToken(ctx, args.payoutToken);

    if (!payout) {
      return { updated: false, reason: "payout_not_found" as const };
    }

    if (payout.status === "paid") {
      return { updated: false, reason: "already_paid" as const };
    }

    if (payout.status !== "processing") {
      return { updated: false, reason: "payout_not_processing" as const };
    }

    const transaction = await ctx.db.get(payout.transactionId);
    const settlement = payout.settlementId ? await ctx.db.get(payout.settlementId) : null;

    if (!transaction || !settlement) {
      return { updated: false, reason: "missing_financial_context" as const };
    }

    if (settlement.status !== "ready_for_payout") {
      return { updated: false, reason: "settlement_not_ready" as const };
    }

    const now = Date.now();
    await ctx.db.patch(payout._id, {
      failureReason: undefined,
      paidAt: now,
      processor: args.processor,
      status: "paid",
      txHash: args.txHash,
      updatedAt: now,
    });

    const aggregateStatus = await syncAggregatePayoutState(ctx, {
      settlementId: settlement._id,
      transactionId: transaction._id,
      txHash: args.txHash,
    });

    await recordTransactionAuditEvent(ctx, {
      intentId: transaction.intentId,
      message:
        aggregateStatus === "paid_out"
          ? "All payouts completed and settlement moved to paid_out."
          : "Payout completed but the settlement still has remaining unpaid targets.",
      metadata: {
        payoutToken: args.payoutToken,
        processor: args.processor,
        settlementStatus: aggregateStatus,
        txHash: args.txHash,
      },
      scenarioType: "custom_scoped_work",
      settlementId: settlement._id,
      source: "payment",
      stage: "settlement",
      status: "passed",
      transactionId: transaction._id,
    });
    await queuePayoutWebhookDeliveries(ctx, {
      payout: {
        ...payout,
        paidAt: now,
        processor: args.processor,
        status: "paid",
        txHash: args.txHash,
        updatedAt: now,
      },
      requestToken: transaction.intentId ? createPublicRequestToken(transaction.intentId) : undefined,
      streamStatus: "settled",
      type: "paid",
    });

    return {
      payoutToken: args.payoutToken,
      settlementStatus: aggregateStatus,
      status: "paid" as const,
      updated: true,
    };
  },
});

export const markPayoutFailed = mutation({
  args: {
    failureReason: v.string(),
    payoutToken: v.string(),
    processor: v.string(),
    txHash: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const payout = await getPayoutByToken(ctx, args.payoutToken);

    if (!payout) {
      return { updated: false, reason: "payout_not_found" as const };
    }

    if (payout.status === "paid") {
      return { updated: false, reason: "already_paid" as const };
    }

    if (payout.status === "failed" || payout.status === "cancelled") {
      return { updated: false, reason: "already_failed" as const };
    }

    const transaction = await ctx.db.get(payout.transactionId);
    const settlement = payout.settlementId ? await ctx.db.get(payout.settlementId) : null;

    if (!transaction || !settlement) {
      return { updated: false, reason: "missing_financial_context" as const };
    }

    const now = Date.now();
    await ctx.db.patch(payout._id, {
      failureReason: args.failureReason,
      processor: args.processor,
      status: "failed",
      txHash: args.txHash ?? payout.txHash,
      updatedAt: now,
    });

    const aggregateStatus = await syncAggregatePayoutState(ctx, {
      settlementId: settlement._id,
      transactionId: transaction._id,
      txHash: args.txHash ?? payout.txHash ?? undefined,
    });

    await recordTransactionAuditEvent(ctx, {
      intentId: transaction.intentId,
      message: "Payout failed and settlement is blocked.",
      metadata: {
        failureReason: args.failureReason,
        payoutToken: args.payoutToken,
        processor: args.processor,
        settlementStatus: aggregateStatus,
        txHash: args.txHash ?? payout.txHash ?? null,
      },
      scenarioType: "custom_scoped_work",
      settlementId: settlement._id,
      source: "payment",
      stage: "settlement",
      status: "failed",
      transactionId: transaction._id,
    });
    await queuePayoutWebhookDeliveries(ctx, {
      payout: {
        ...payout,
        failureReason: args.failureReason,
        processor: args.processor,
        status: "failed",
        txHash: args.txHash ?? payout.txHash,
        updatedAt: now,
      },
      requestToken: transaction.intentId ? createPublicRequestToken(transaction.intentId) : undefined,
      streamStatus: "payout_failed",
      type: "failed",
    });

    return {
      payoutToken: args.payoutToken,
      settlementStatus: aggregateStatus,
      status: "failed" as const,
      updated: true,
    };
  },
});

async function getPayoutByToken(ctx: MutationCtx, payoutToken: string): Promise<Doc<"payouts"> | null> {
  const payoutId = parsePayoutToken(payoutToken);

  if (!payoutId) {
    return null;
  }

  return ctx.db.get(payoutId);
}

async function syncAggregatePayoutState(
  ctx: MutationCtx,
  input: {
    settlementId: Id<"settlements">;
    transactionId: Id<"transactions">;
    txHash?: string | undefined;
  },
) {
  const payouts = await ctx.db
    .query("payouts")
    .withIndex("by_transactionId", (queryBuilder) =>
      queryBuilder.eq("transactionId", input.transactionId),
    )
    .collect();

  const nextStatus = payouts.some((payout) => payout.status === "failed")
    ? "failed"
    : payouts.length > 0 && payouts.every((payout) => payout.status === "paid")
      ? "paid_out"
      : "ready_for_payout";
  const now = Date.now();
  const settlementPatch: {
    status: "failed" | "paid_out" | "ready_for_payout";
    txHash?: string;
    updatedAt: number;
  } = {
    status: nextStatus,
    updatedAt: now,
  };

  if (nextStatus === "paid_out" && input.txHash) {
    settlementPatch.txHash = input.txHash;
  }

  await ctx.db.patch(input.settlementId, settlementPatch);
  await updateTransactionById(ctx, input.transactionId, {
    settlementStatus: nextStatus,
  });

  return nextStatus;
}

async function queuePayoutWebhookDeliveries(
  ctx: MutationCtx,
  input: {
    payout: Doc<"payouts">;
    requestToken?: string;
    streamStatus: "payout_failed" | "payout_processing" | "settled";
    type: "failed" | "paid" | "processing";
  },
) {
  const ownerExternalId = await getUserExternalId(ctx, input.payout.payeeUserId);
  const payoutToken = createPayoutToken(input.payout._id);

  await queueWebhookDeliveries(ctx, {
    data: {
      failureReason: input.payout.failureReason ?? null,
      payoutToken,
      processor: input.payout.processor ?? null,
      txHash: input.payout.txHash ?? null,
    },
    eventType: `payout.${input.type}`,
    message:
      input.type === "paid"
        ? "Payout completed."
        : input.type === "processing"
          ? "Payout processing started."
          : "Payout failed and needs attention.",
    ownerExternalId,
    payoutToken,
    requestToken: input.requestToken,
    status: input.payout.status,
    stream: "payouts",
  });
  await queueWebhookDeliveries(ctx, {
    data: {
      failureReason: input.payout.failureReason ?? null,
      payoutToken,
      txHash: input.payout.txHash ?? null,
    },
    eventType:
      input.type === "paid"
        ? "inbox.settled"
        : input.type === "processing"
          ? "inbox.payout_processing"
          : "inbox.payout_failed",
    message:
      input.type === "paid"
        ? "Payout settled for the supplier."
        : input.type === "processing"
          ? "Payout is being processed."
          : "Payout failed and needs attention.",
    ownerExternalId,
    payoutToken,
    requestToken: input.requestToken,
    status: input.streamStatus,
    stream: "inbox",
  });
}

async function getUserExternalId(
  ctx: MutationCtx,
  userId: string | undefined,
) {
  if (!userId) {
    return null;
  }

  const user = await ctx.db.get(userId as Id<"users">);
  return user?.externalId ?? null;
}
