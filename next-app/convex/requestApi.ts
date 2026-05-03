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
import { inferBorealNetworkSelection } from "../lib/boreal/commerce/networks";
import {
  getDefaultBuyerWalletAccountId,
  getProfileIdForUser,
} from "./commerceCore";
import { refreshProfileAnalyticsForUser } from "./profileAnalytics";
import { recordTransactionAuditEvent } from "./transactionScenarios";
import { queueWebhookDeliveries } from "./webhooks";

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
      return normalizeStoredRequestSession(mostRecentIdempotent);
    }

    const byFingerprint = await ctx.db
      .query("agentRequestSessions")
      .withIndex("by_ownerExternalId_and_requestFingerprint", (queryBuilder) =>
        queryBuilder
          .eq("ownerExternalId", args.ownerExternalId)
          .eq("requestFingerprint", args.requestFingerprint),
      )
      .collect();

    const mostRecentByFingerprint =
      byFingerprint.sort((left, right) => right.updatedAt - left.updatedAt)[0] ??
      null;

    return mostRecentByFingerprint
      ? normalizeStoredRequestSession(mostRecentByFingerprint)
      : null;
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

    return normalizeStoredRequestSession(session);
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

export const getRequestIntakeGuardState = query({
  args: {
    ownerExternalId: v.string(),
    windowStartedAt: v.number(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const sessions = await ctx.db
      .query("agentRequestSessions")
      .withIndex("by_ownerExternalId_and_updatedAt", (queryBuilder) =>
        queryBuilder.eq("ownerExternalId", args.ownerExternalId),
      )
      .order("desc")
      .take(64);

    return {
      activeUnpaidQuoteCount: sessions.filter(
        (session) =>
          session.status === "payment_required" &&
          !session.paidAt &&
          session.quoteExpiresAt > now,
      ).length,
      recentRequestCount: sessions.filter(
        (session) => session.createdAt >= args.windowStartedAt,
      ).length,
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
      quoteRefreshCount: 0,
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
      ownerExternalId: args.ownerExternalId,
      requestSessionId: sessionId,
      requestToken: args.requestToken,
      status: "received",
      type: "request.received",
    });
    await insertRequestEvent(ctx, {
      dataJson: args.routeJson,
      message: "Auto route locked and quote created.",
      ownerExternalId: args.ownerExternalId,
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
        ownerExternalId: args.ownerExternalId,
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
      ownerExternalId: args.ownerExternalId,
      requestSessionId: session._id,
      requestToken: args.requestToken,
      status: args.status,
      type: args.type,
    });

    return { appended: true };
  },
});

export const refreshQuote = mutation({
  args: {
    ownerExternalId: v.string(),
    quoteAuthorizationMessage: v.string(),
    quoteExpiresAt: v.number(),
    quoteToken: v.string(),
    requestToken: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await getSessionByToken(ctx, args.requestToken);

    if (!session || session.ownerExternalId !== args.ownerExternalId) {
      return { refreshed: false };
    }

    if (session.paidAt || session.status !== "payment_required") {
      return {
        quoteAuthorizationMessage: session.quoteAuthorizationMessage,
        quoteExpiresAt: session.quoteExpiresAt,
        quoteRefreshCount: session.quoteRefreshCount ?? 0,
        quoteToken: session.quoteToken,
        refreshed: false,
      };
    }

    const now = Date.now();
    const quoteRefreshCount = (session.quoteRefreshCount ?? 0) + 1;

    await ctx.db.patch(session._id, {
      quoteAuthorizationMessage: args.quoteAuthorizationMessage,
      quoteExpiresAt: args.quoteExpiresAt,
      quoteRefreshCount,
      quoteToken: args.quoteToken,
      updatedAt: now,
    });

    await insertRequestEvent(ctx, {
      dataJson: JSON.stringify({
        quoteExpiresAt: args.quoteExpiresAt,
        quoteRefreshCount,
        quoteToken: args.quoteToken,
      }),
      message: "Locked route quote refreshed after expiry.",
      ownerExternalId: session.ownerExternalId,
      requestSessionId: session._id,
      requestToken: session.requestToken,
      status: "payment_required",
      type: "request.quote_refreshed",
    });

    return {
      quoteAuthorizationMessage: args.quoteAuthorizationMessage,
      quoteExpiresAt: args.quoteExpiresAt,
      quoteRefreshCount,
      quoteToken: args.quoteToken,
      refreshed: true,
    };
  },
});

export const rebindRequestSessionOwner = mutation({
  args: {
    currentOwnerExternalId: v.string(),
    nextOwnerExternalId: v.string(),
    ownerDisplayName: v.optional(v.string()),
    requestToken: v.string(),
    walletAddress: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await getSessionByToken(ctx, args.requestToken);

    if (!session || session.ownerExternalId !== args.currentOwnerExternalId) {
      return { rebound: false };
    }

    await ctx.db.patch(session._id, {
      ownerDisplayName: args.ownerDisplayName,
      ownerExternalId: args.nextOwnerExternalId,
      updatedAt: Date.now(),
      walletAddress: args.walletAddress,
    });

    return { rebound: true };
  },
});

export const recordQuotePayment = mutation({
  args: {
    ownerExternalId: v.string(),
    payerSource: agentPaymentSourceValidator,
    paymentReceiptJson: v.string(),
    paymentVerificationJson: v.string(),
    requestToken: v.string(),
    txHash: v.string(),
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

    if (session.quoteExpiresAt <= now) {
      throw new Error("Locked quote expired before Boreal could record payment.");
    }

    const existingTxSession = await ctx.db
      .query("agentRequestSessions")
      .withIndex("by_txHash", (queryBuilder) => queryBuilder.eq("txHash", args.txHash))
      .unique();

    if (existingTxSession && existingTxSession.requestToken !== session.requestToken) {
      throw new Error(
        "This Solana transaction hash has already been used for another Boreal request.",
      );
    }

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
    const paymentReceipt = safeParseJson(args.paymentReceiptJson);
    const walletAddress =
      typeof paymentReceipt?.walletAddress === "string" &&
      paymentReceipt.walletAddress.trim().length > 0
        ? paymentReceipt.walletAddress.trim()
        : session.walletAddress;

    await ctx.db.patch(session._id, {
      paidAt: now,
      payerSource: args.payerSource,
      paymentReceiptJson: args.paymentReceiptJson,
      paymentVerificationJson: args.paymentVerificationJson,
      paymentVerifiedAt: now,
      settlementId,
      status: "paid",
      transactionId,
      txHash: args.txHash,
      updatedAt: now,
      walletAddress,
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
      ownerExternalId: session.ownerExternalId,
      requestSessionId: session._id,
      requestToken: session.requestToken,
      status: "paid",
      type: "request.paid",
    });
    await recordTransactionAuditEvent(ctx, {
      intentId: session.intentId,
      message: "One-request payment verified and locked route can now execute.",
      metadata: {
        payerSource: args.payerSource,
        paymentVerificationJson: args.paymentVerificationJson,
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

    if (!session.paidAt || !session.paymentVerifiedAt) {
      throw new Error("Boreal cannot execute a one-request route before payment is verified.");
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
      ownerExternalId: session.ownerExternalId,
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
      ownerExternalId: session.ownerExternalId,
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
      ownerExternalId: session.ownerExternalId,
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
  const session = await ctx.db
    .query("agentRequestSessions")
    .withIndex("by_requestToken", (queryBuilder) =>
      queryBuilder.eq("requestToken", requestToken),
    )
    .unique();

  return session ? normalizeStoredRequestSession(session) : null;
}

async function insertRequestEvent(
  ctx: MutationCtx,
  input: {
    dataJson?: string;
    message: string;
    ownerExternalId: string;
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
  await queueWebhookDeliveries(ctx, {
    data: input.dataJson ? safeParseJson(input.dataJson) : null,
    eventType: input.type,
    message: input.message,
    ownerExternalId: input.ownerExternalId,
    requestToken: input.requestToken,
    status: input.status,
    stream: "requests",
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

  if (
    networkKey.endsWith(":testnet") ||
    networkKey.endsWith(":devnet")
  ) {
    return "testnet" as const;
  }

  return "mainnet" as const;
}

function normalizeStoredRequestSession<
  T extends {
    chainFamily: "evm" | "solana";
    environment: "devnet" | "mainnet" | "testnet";
    networkKey:
      | "base:mainnet"
      | "base:sepolia"
      | "ethereum:mainnet"
      | "ethereum:sepolia"
      | "polygon:amoy"
      | "polygon:mainnet"
      | "solana:devnet"
      | "solana:mainnet"
      | "solana:testnet";
    routeJson: string;
  },
>(session: T) {
  const normalizedNetworkSelection = inferBorealNetworkSelection({
    chainFamily: session.chainFamily,
    environment: session.environment,
    networkKey: session.networkKey,
  });

  return {
    ...session,
    environment: normalizedNetworkSelection.environment,
    networkKey: normalizedNetworkSelection.networkKey,
    routeJson: normalizeStoredRouteJson(
      session.routeJson,
      normalizedNetworkSelection.networkKey,
    ),
  };
}

function normalizeStoredRouteJson(
  routeJson: string,
  networkKey:
    | "base:mainnet"
    | "base:sepolia"
    | "ethereum:mainnet"
    | "ethereum:sepolia"
    | "polygon:amoy"
    | "polygon:mainnet"
    | "solana:mainnet"
    | "solana:testnet",
) {
  try {
    const parsed = JSON.parse(routeJson) as Record<string, unknown>;

    return JSON.stringify({
      ...parsed,
      networkKey,
    });
  } catch {
    return routeJson;
  }
}

function safeParseJson(value: string) {
  try {
    return JSON.parse(value) as Record<string, unknown>;
  } catch {
    return null;
  }
}
