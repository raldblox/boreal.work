import { mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { v } from "convex/values";

import {
  agentPaymentSourceValidator,
  agentRequestStatusValidator,
  chainFamilyValidator,
  networkKeyValidator,
  paymentProtocolValidator,
  requestedOutputTypeValidator,
} from "./validators";
import {
  getDefaultBuyerWalletAccountId,
  getProfileIdForUser,
} from "./commerceCore";
import { refreshProfileAnalyticsForUser } from "./profileAnalytics";
import { recordTransactionAuditEvent } from "./transactionScenarios";

export const findSessionForCaller = query({
  args: {
    idempotencyKey: v.string(),
    ownerExternalId: v.string(),
    requestFingerprint: v.string(),
  },
  handler: async (ctx, args) => {
    const byIdempotency = await ctx.db
      .query("agentRequestSessions")
      .withIndex("by_ownerExternalId_and_idempotencyKey", (queryBuilder) =>
        queryBuilder
          .eq("ownerExternalId", args.ownerExternalId)
          .eq("idempotencyKey", args.idempotencyKey),
      )
      .collect();

    const mostRecentIdempotent = byIdempotency.sort((left, right) => right.updatedAt - left.updatedAt)[0];

    if (mostRecentIdempotent) {
      return mostRecentIdempotent;
    }

    const byFingerprint = await ctx.db
      .query("agentRequestSessions")
      .withIndex("by_ownerExternalId_and_requestFingerprint", (queryBuilder) =>
        queryBuilder
          .eq("ownerExternalId", args.ownerExternalId)
          .eq("requestFingerprint", args.requestFingerprint),
      )
      .collect();

    return byFingerprint.sort((left, right) => right.updatedAt - left.updatedAt)[0] ?? null;
  },
});

export const getRequestSession = query({
  args: {
    ownerExternalId: v.string(),
    requestToken: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await getSessionByToken(ctx, args.requestToken);

    if (!session || session.ownerExternalId !== args.ownerExternalId) {
      return null;
    }

    return session;
  },
});

export const getRequestFinancials = query({
  args: {
    ownerExternalId: v.string(),
    requestToken: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await getSessionByToken(ctx, args.requestToken);

    if (!session || session.ownerExternalId !== args.ownerExternalId) {
      return null;
    }

    const transaction = session.transactionId
      ? await ctx.db.get(session.transactionId)
      : null;
    const settlement = session.settlementId
      ? await ctx.db.get(session.settlementId)
      : null;
    const payouts = session.transactionId
      ? await ctx.db
          .query("payouts")
          .withIndex("by_transactionId", (queryBuilder) =>
            queryBuilder.eq("transactionId", session.transactionId!),
          )
          .collect()
      : [];

    return {
      payoutCount: payouts.length,
      payoutStatuses: payouts.map((payout) => payout.status),
      settlementId: session.settlementId ?? null,
      settlementStatus: settlement?.status ?? null,
      transactionId: session.transactionId ?? null,
      transactionStatus: transaction?.status ?? null,
    };
  },
});

export const listRequestEvents = query({
  args: {
    limit: v.optional(v.number()),
    ownerExternalId: v.string(),
    requestToken: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await getSessionByToken(ctx, args.requestToken);

    if (!session || session.ownerExternalId !== args.ownerExternalId) {
      return [];
    }

    const events = await ctx.db
      .query("agentRequestEvents")
      .withIndex("by_requestToken_and_createdAt", (queryBuilder) =>
        queryBuilder.eq("requestToken", args.requestToken),
      )
      .order("desc")
      .take(args.limit ?? 64);

    return events.reverse();
  },
});

export const createRequestSession = mutation({
  args: {
    chainFamily: chainFamilyValidator,
    conversationId: v.optional(v.string()),
    currency: v.string(),
    idempotencyKey: v.string(),
    intentId: v.optional(v.id("intents")),
    intentKey: v.optional(v.string()),
    message: v.string(),
    networkKey: networkKeyValidator,
    ownerDisplayName: v.optional(v.string()),
    ownerExternalId: v.string(),
    paymentProtocol: paymentProtocolValidator,
    quoteAmount: v.number(),
    quoteAuthorizationMessage: v.string(),
    quoteExpiresAt: v.number(),
    quoteToken: v.string(),
    requestFingerprint: v.string(),
    requestToken: v.string(),
    requestedOutputTypes: v.array(requestedOutputTypeValidator),
    routeJson: v.string(),
    status: agentRequestStatusValidator,
    summary: v.string(),
    title: v.string(),
    walletAddress: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const sessionId = await ctx.db.insert("agentRequestSessions", {
      chainFamily: args.chainFamily,
      conversationId: args.conversationId,
      createdAt: now,
      currency: args.currency,
      environment: inferEnvironmentFromNetworkKey(args.networkKey),
      idempotencyKey: args.idempotencyKey,
      intentId: args.intentId,
      intentKey: args.intentKey,
      lastEventAt: now,
      lockedAt: now,
      message: args.message,
      mode: "auto",
      networkKey: args.networkKey,
      ownerDisplayName: args.ownerDisplayName,
      ownerExternalId: args.ownerExternalId,
      paymentProtocol: args.paymentProtocol,
      quoteAmount: args.quoteAmount,
      quoteAuthorizationMessage: args.quoteAuthorizationMessage,
      quoteExpiresAt: args.quoteExpiresAt,
      quoteToken: args.quoteToken,
      requestFingerprint: args.requestFingerprint,
      requestToken: args.requestToken,
      requestedOutputTypes: args.requestedOutputTypes,
      routeJson: args.routeJson,
      status: args.status,
      summary: args.summary,
      title: args.title,
      updatedAt: now,
      walletAddress: args.walletAddress,
    });

    await insertRequestEvent(ctx, {
      message: "Request received by the Boreal one-request API.",
      requestSessionId: sessionId,
      requestToken: args.requestToken,
      status: "received",
      type: "request.received",
    });
    await insertRequestEvent(ctx, {
      dataJson: args.routeJson,
      message: "Auto route locked and quote created.",
      requestSessionId: sessionId,
      requestToken: args.requestToken,
      status: args.status,
      type: "request.routed",
    });

    if (args.status === "payment_required") {
      await insertRequestEvent(ctx, {
        dataJson: JSON.stringify({
          amount: args.quoteAmount,
          currency: args.currency,
          quoteExpiresAt: args.quoteExpiresAt,
          quoteToken: args.quoteToken,
        }),
        message: "Payment is required before execution can begin.",
        requestSessionId: sessionId,
        requestToken: args.requestToken,
        status: "payment_required",
        type: "request.payment_required",
      });
    }

    return {
      requestSessionId: sessionId,
      requestToken: args.requestToken,
    };
  },
});

export const appendRequestEvent = mutation({
  args: {
    dataJson: v.optional(v.string()),
    message: v.string(),
    ownerExternalId: v.string(),
    requestToken: v.string(),
    status: agentRequestStatusValidator,
    type: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await getSessionByToken(ctx, args.requestToken);

    if (!session || session.ownerExternalId !== args.ownerExternalId) {
      return { appended: false };
    }

    await insertRequestEvent(ctx, {
      dataJson: args.dataJson,
      message: args.message,
      requestSessionId: session._id,
      requestToken: args.requestToken,
      status: args.status,
      type: args.type,
    });

    return { appended: true };
  },
});

export const recordQuotePayment = mutation({
  args: {
    ownerExternalId: v.string(),
    payerSource: agentPaymentSourceValidator,
    paymentReceiptJson: v.string(),
    requestToken: v.string(),
    txHash: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const session = await getSessionByToken(ctx, args.requestToken);

    if (!session || session.ownerExternalId !== args.ownerExternalId) {
      return { paid: false };
    }

    if (session.paidAt) {
      return {
        paid: true,
        requestToken: session.requestToken,
        settlementId: session.settlementId ?? null,
        transactionId: session.transactionId ?? null,
      };
    }

    const now = Date.now();
    const ownerUser = await getUserByExternalId(ctx, args.ownerExternalId);
    const buyerWalletAccountId = await getDefaultBuyerWalletAccountId(ctx, ownerUser?._id);
    const transactionId =
      session.transactionId ??
      (await ctx.db.insert("transactions", {
        amount: session.quoteAmount,
        buyerUserId: ownerUser?._id,
        buyerWalletAccountId,
        chainFamily: session.chainFamily,
        createdAt: now,
        currency: session.currency,
        environment: session.environment,
        fulfillmentId: undefined,
        intentId: session.intentId,
        intentKey: session.intentKey,
        networkKey: session.networkKey,
        paymentAttemptId: undefined,
        paymentProtocol: session.paymentProtocol,
        paymentStatus: "paid",
        proposalId: undefined,
        scenarioId: "boreal-one-request-auto",
        scenarioType: "custom_scoped_work",
        sellerProfileId: undefined,
        sellerUserId: undefined,
        serviceInvocationId: undefined,
        settlementStatus: "pending",
        sourceProviderKey: undefined,
        status: "active",
        supplyId: undefined,
        titleSnapshot: session.title,
        updatedAt: now,
      }));
    const settlementId =
      session.settlementId ??
      (await ctx.db.insert("settlements", {
        amount: session.quoteAmount,
        buyerWalletAccountId,
        chainFamily: session.chainFamily,
        createdAt: now,
        currency: session.currency,
        environment: session.environment,
        networkKey: session.networkKey,
        payoutWalletAccountId: undefined,
        settlementProtocol: session.paymentProtocol,
        status: "pending",
        transactionId,
        txHash: args.txHash,
        updatedAt: now,
      }));

    await ctx.db.patch(session._id, {
      paidAt: now,
      payerSource: args.payerSource,
      paymentReceiptJson: args.paymentReceiptJson,
      settlementId,
      status: "paid",
      transactionId,
      txHash: args.txHash,
      updatedAt: now,
    });

    await ctx.db.patch(transactionId, {
      paymentStatus: "paid",
      settlementStatus: "pending",
      status: "active",
      updatedAt: now,
    });
    await ctx.db.patch(settlementId, {
      status: "pending",
      txHash: args.txHash,
      updatedAt: now,
    });

    await insertRequestEvent(ctx, {
      dataJson: args.paymentReceiptJson,
      message: "Payment recorded for the locked Boreal route.",
      requestSessionId: session._id,
      requestToken: session.requestToken,
      status: "paid",
      type: "request.paid",
    });
    await recordTransactionAuditEvent(ctx, {
      intentId: session.intentId,
      message: "One-request payment recorded and locked route can now execute.",
      metadata: {
        payerSource: args.payerSource,
        requestToken: session.requestToken,
        txHash: args.txHash,
      },
      scenarioType: "custom_scoped_work",
      settlementId,
      source: "payment",
      stage: "payment",
      status: "passed",
      transactionId,
    });

    return {
      paid: true,
      requestToken: session.requestToken,
      settlementId,
      transactionId,
    };
  },
});

export const markExecutionStarted = mutation({
  args: {
    ownerExternalId: v.string(),
    requestToken: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await getSessionByToken(ctx, args.requestToken);

    if (!session || session.ownerExternalId !== args.ownerExternalId) {
      return { started: false };
    }

    if (session.startedAt) {
      return { started: true };
    }

    const now = Date.now();
    await ctx.db.patch(session._id, {
      startedAt: now,
      status: "executing",
      updatedAt: now,
    });

    if (session.transactionId) {
      await ctx.db.patch(session.transactionId, {
        paymentStatus: "paid",
        status: "active",
        updatedAt: now,
      });
    }

    await insertRequestEvent(ctx, {
      message: "Specialists started executing the locked route.",
      requestSessionId: session._id,
      requestToken: session.requestToken,
      status: "executing",
      type: "request.execution_started",
    });

    return { started: true };
  },
});

export const markRequestDelivered = mutation({
  args: {
    ownerExternalId: v.string(),
    payoutTargets: v.array(
      v.object({
        agentExternalId: v.string(),
        amount: v.number(),
        walletAddress: v.string(),
      }),
    ),
    requestToken: v.string(),
    resultJson: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await getSessionByToken(ctx, args.requestToken);

    if (!session || session.ownerExternalId !== args.ownerExternalId) {
      return { delivered: false };
    }

    if (session.deliveredAt) {
      return { delivered: true };
    }

    const now = Date.now();
    await ctx.db.patch(session._id, {
      deliveredAt: now,
      resultJson: args.resultJson,
      status: "delivered",
      updatedAt: now,
    });

    if (session.transactionId) {
      await ctx.db.patch(session.transactionId, {
        paymentStatus: "paid",
        settlementStatus: "ready_for_payout",
        status: "fulfilled",
        updatedAt: now,
      });
    }

    if (session.settlementId) {
      await ctx.db.patch(session.settlementId, {
        status: "ready_for_payout",
        updatedAt: now,
      });
    }

    for (const payoutTarget of args.payoutTargets) {
      const sellerUser = await getUserByExternalId(ctx, payoutTarget.agentExternalId);
      const payoutWalletAccountId = await getPayoutWalletAccountIdByAddress(
        ctx,
        payoutTarget.walletAddress,
      );
      const sellerProfileId = await getProfileIdForUser(ctx, sellerUser?._id);

      if (!session.transactionId) {
        continue;
      }

      await ctx.db.insert("payouts", {
        amount: payoutTarget.amount,
        chainFamily: session.chainFamily,
        createdAt: now,
        currency: session.currency,
        environment: session.environment,
        networkKey: session.networkKey,
        payeeProfileId: sellerProfileId,
        payeeUserId: sellerUser?._id,
        settlementId: session.settlementId,
        status: "pending",
        transactionId: session.transactionId,
        txHash: undefined,
        updatedAt: now,
        walletAccountId: payoutWalletAccountId,
      });

      await refreshProfileAnalyticsForUser(ctx, sellerUser?._id);
    }

    await insertRequestEvent(ctx, {
      dataJson: args.resultJson,
      message: "Locked route delivered final results.",
      requestSessionId: session._id,
      requestToken: session.requestToken,
      status: "delivered",
      type: "request.delivered",
    });

    if (session.transactionId) {
      await recordTransactionAuditEvent(ctx, {
        intentId: session.intentId,
        message: "One-request execution delivered and payouts are ready.",
        metadata: {
          payoutTargetCount: args.payoutTargets.length,
          requestToken: session.requestToken,
        },
        scenarioType: "custom_scoped_work",
        settlementId: session.settlementId,
        source: "fulfillment",
        stage: "delivery",
        status: "passed",
        transactionId: session.transactionId,
      });
      await recordTransactionAuditEvent(ctx, {
        intentId: session.intentId,
        message: "Settlement moved to ready_for_payout for one-request execution.",
        metadata: {
          requestToken: session.requestToken,
        },
        scenarioType: "custom_scoped_work",
        settlementId: session.settlementId,
        source: "payment",
        stage: "settlement",
        status: "info",
        transactionId: session.transactionId,
      });
    }

    return { delivered: true };
  },
});

export const markRequestFailed = mutation({
  args: {
    errorCode: v.optional(v.string()),
    errorMessage: v.string(),
    ownerExternalId: v.string(),
    requestToken: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await getSessionByToken(ctx, args.requestToken);

    if (!session || session.ownerExternalId !== args.ownerExternalId) {
      return { failed: false };
    }

    const now = Date.now();
    await ctx.db.patch(session._id, {
      errorCode: args.errorCode,
      errorMessage: args.errorMessage,
      status: "failed",
      updatedAt: now,
    });

    if (session.transactionId) {
      await ctx.db.patch(session.transactionId, {
        paymentStatus: session.paidAt ? "paid" : "failed",
        settlementStatus: "failed",
        status: "failed",
        updatedAt: now,
      });
    }

    if (session.settlementId) {
      await ctx.db.patch(session.settlementId, {
        status: "failed",
        updatedAt: now,
      });
    }

    await insertRequestEvent(ctx, {
      dataJson: JSON.stringify({
        errorCode: args.errorCode,
      }),
      message: args.errorMessage,
      requestSessionId: session._id,
      requestToken: session.requestToken,
      status: "failed",
      type: "request.failed",
    });

    return { failed: true };
  },
});

async function getSessionByToken(
  ctx: MutationCtx | QueryCtx,
  requestToken: string,
) {
  return ctx.db
    .query("agentRequestSessions")
    .withIndex("by_requestToken", (queryBuilder) =>
      queryBuilder.eq("requestToken", requestToken),
    )
    .unique();
}

async function insertRequestEvent(
  ctx: MutationCtx,
  input: {
    dataJson?: string;
    message: string;
    requestSessionId: Id<"agentRequestSessions">;
    requestToken: string;
    status:
      | "clarification_required"
      | "delivered"
      | "executing"
      | "failed"
      | "fallback_required"
      | "paid"
      | "payment_required"
      | "received"
      | "routing";
    type: string;
  },
) {
  const now = Date.now();
  await ctx.db.insert("agentRequestEvents", {
    createdAt: now,
    dataJson: input.dataJson,
    eventType: input.type,
    message: input.message,
    requestSessionId: input.requestSessionId,
    requestToken: input.requestToken,
    status: input.status,
  });
  await ctx.db.patch(input.requestSessionId, {
    lastEventAt: now,
    updatedAt: now,
  });
}

async function getUserByExternalId(
  ctx: MutationCtx | QueryCtx,
  externalId?: string,
) {
  if (!externalId) {
    return null;
  }

  return ctx.db
    .query("users")
    .withIndex("by_externalId", (queryBuilder) =>
      queryBuilder.eq("externalId", externalId),
    )
    .unique();
}

async function getPayoutWalletAccountIdByAddress(
  ctx: MutationCtx | QueryCtx,
  walletAddress: string,
) {
  const account = await ctx.db
    .query("walletAccounts")
    .withIndex("by_walletAddress", (queryBuilder) =>
      queryBuilder.eq("walletAddress", walletAddress),
    )
    .unique();

  return account?._id;
}

function inferEnvironmentFromNetworkKey(networkKey: string) {
  if (networkKey.endsWith(":mainnet")) {
    return "mainnet" as const;
  }

  if (networkKey.endsWith(":testnet")) {
    return "testnet" as const;
  }

  return "devnet" as const;
}
