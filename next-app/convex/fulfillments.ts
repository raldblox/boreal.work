import type { Id } from "./_generated/dataModel";
import { mutation, type MutationCtx } from "./_generated/server";
import { v } from "convex/values";

import {
  ensureSettlementForTransaction,
  ensureWorkTransaction,
  getDefaultPayoutWalletAccountId,
  getCommerceEnvironment,
  getProfileIdForUser,
  updateTransactionById,
} from "./commerceCore";
import { createPayoutToken, createPublicRequestToken } from "../lib/boreal/one-inbox/tokens";
import { refreshProfileAnalyticsForUser } from "./profileAnalytics";
import { releaseSupplyCapacity } from "./supplies";
import { getScenarioId, recordTransactionAuditEvent } from "./transactionScenarios";
import { queueWebhookDeliveries } from "./webhooks";

export const submitWork = mutation({
  args: {
    attachments: v.optional(
      v.array(
        v.object({
          fileName: v.string(),
          mediaType: v.string(),
          sizeBytes: v.number(),
          storageId: v.id("_storage"),
        }),
      ),
    ),
    deliverablesBody: v.string(),
    intentId: v.id("intents"),
    workerDisplayName: v.optional(v.string()),
    workerExternalId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const intent = await ctx.db.get(args.intentId);

    if (!intent || !args.workerExternalId) {
      return { submitted: false };
    }

    const worker = await ctx.db
      .query("users")
      .withIndex("by_externalId", (queryBuilder) =>
        queryBuilder.eq("externalId", args.workerExternalId),
      )
      .unique();

    if (!worker) {
      return { submitted: false };
    }

    const proposals = await ctx.db
      .query("proposals")
      .withIndex("by_intentKey_and_status", (queryBuilder) =>
        queryBuilder.eq("intentKey", intent.intentKey).eq("status", "accepted"),
      )
      .collect();

    const acceptedProposal = proposals.find(
      (proposal) => proposal.proposerUserId === worker._id,
    );

    if (!acceptedProposal) {
      return { submitted: false };
    }

    const fulfillments = await ctx.db
      .query("fulfillments")
      .withIndex("by_intentKey_and_status", (queryBuilder) =>
        queryBuilder.eq("intentKey", intent.intentKey).eq("status", "approved"),
      )
      .collect();
    const activeFulfillment = fulfillments.find(
      (fulfillment) => fulfillment.fulfillerUserId === worker._id,
    );

    if (!activeFulfillment) {
      return { submitted: false };
    }

    const now = Date.now();
    const transactionId =
      activeFulfillment.transactionId ??
      (await ensureWorkTransaction(ctx, {
        amount: acceptedProposal.price,
        buyerUserId: intent.ownerUserId,
        currency: acceptedProposal.currency,
        environment: getCommerceEnvironment(),
        intentId: intent._id,
        intentKey: intent.intentKey,
        proposalId: acceptedProposal._id as never,
        sellerUserId: worker._id,
        status: "active",
        titleSnapshot: intent.title,
      }));

    if (!activeFulfillment.transactionId) {
      await ctx.db.patch(activeFulfillment._id, {
        transactionId,
      });
    }

    await ctx.db.patch(activeFulfillment._id, {
      completedSummary: args.deliverablesBody,
      environment: activeFulfillment.environment ?? getCommerceEnvironment(),
      scenarioId:
        activeFulfillment.scenarioId ?? getScenarioId("custom_scoped_work"),
      settlementStatus:
        acceptedProposal.price > 0 ? "ready_for_payout" : "not_applicable",
      status: "fulfilled",
    });

    await releaseSupplyCapacity(ctx, activeFulfillment.supplyId);

    await ctx.db.insert("evidences", {
      attachments: args.attachments && args.attachments.length > 0 ? args.attachments : undefined,
      body: args.deliverablesBody,
      createdAt: now,
      fulfillmentId: activeFulfillment._id,
      mediaType: "text/markdown",
      url: undefined,
    });

    await ctx.db.patch(intent._id, {
      completedAt: now,
      reviewRating: intent.reviewRating,
      status: "fulfilled",
      updatedAt: now,
    });

    await ctx.db.insert("chatMessages", {
      body: `${args.workerDisplayName ?? worker.displayName ?? "Worker"} submitted the work.`,
      conversationId: intent.conversationId ?? crypto.randomUUID(),
      intentKey: intent.intentKey,
      messageId: crypto.randomUUID(),
      provider: "boreal-agent",
      role: "user",
      senderActorKind: worker.actorKind,
      senderDisplayName: args.workerDisplayName ?? worker.displayName ?? "Worker",
      senderExternalId: args.workerExternalId,
      senderHandle: worker.handle,
      createdAt: now,
    });

    await ctx.db.insert("activityEvents", {
      createdAt: now,
      entityId: intent.intentKey,
      entityType: "intent",
      payload: JSON.stringify({
        attachmentCount: args.attachments?.length ?? 0,
        proposerUserId: worker._id,
      }),
      type: "fulfillment.submitted",
    });

    await refreshProfileAnalyticsForUser(ctx, worker._id);
    await refreshProfileAnalyticsForUser(ctx, intent.ownerUserId);

    if (transactionId) {
      let payoutId: Id<"payouts"> | undefined;
      await updateTransactionById(ctx, transactionId, {
        fulfillmentId: activeFulfillment._id,
        settlementStatus:
          acceptedProposal.price > 0 ? "ready_for_payout" : "not_applicable",
        status: "fulfilled",
      });

      const transaction = await ctx.db.get(transactionId);
      const settlementId = await ensureSettlementForTransaction(ctx, {
        amount: transaction?.amount ?? acceptedProposal.price,
        chainFamily: transaction?.chainFamily,
        currency: transaction?.currency ?? acceptedProposal.currency,
        environment: transaction?.environment ?? getCommerceEnvironment(),
        networkKey: transaction?.networkKey,
        protocol: transaction?.paymentProtocol ?? null,
        status:
          acceptedProposal.price > 0 ? "ready_for_payout" : "not_applicable",
        transactionId,
      });

      if (acceptedProposal.price > 0) {
        payoutId = await ensurePayoutRecord(ctx, {
          amount: transaction?.amount ?? acceptedProposal.price,
          chainFamily: transaction?.chainFamily,
          currency: transaction?.currency ?? acceptedProposal.currency,
          environment: transaction?.environment ?? getCommerceEnvironment(),
          networkKey: transaction?.networkKey,
          settlementId,
          transactionId,
          userId: worker._id,
        });
      }

      await recordTransactionAuditEvent(ctx, {
        fulfillmentId: activeFulfillment._id,
        intentId: intent._id,
        message: `${args.workerDisplayName ?? worker.displayName ?? "Worker"} submitted final work.`,
        metadata: {
          attachmentCount: args.attachments?.length ?? 0,
        },
        proposalId: acceptedProposal._id as never,
        scenarioType: "custom_scoped_work",
        source: "fulfillment",
        stage: "delivery",
        status: "passed",
        transactionId,
      });

      await recordTransactionAuditEvent(ctx, {
        fulfillmentId: activeFulfillment._id,
        intentId: intent._id,
        message: "Settlement is ready for payout after work delivery.",
        metadata: {
          settlementStatus:
            acceptedProposal.price > 0 ? "ready_for_payout" : "not_applicable",
        },
        proposalId: acceptedProposal._id as never,
        scenarioType: "custom_scoped_work",
        settlementId,
        source: "fulfillment",
        stage: "settlement",
        status: acceptedProposal.price > 0 ? "passed" : "info",
        transactionId,
      });

      await queueWebhookDeliveries(ctx, {
        data: {
          fulfillmentId: activeFulfillment._id,
          settlementStatus:
            acceptedProposal.price > 0 ? "ready_for_payout" : "not_applicable",
          transactionId,
        },
        eventType: "inbox.delivered",
        message: "Supplier delivered work.",
        ownerExternalId: args.workerExternalId,
        requestToken: createPublicRequestToken(intent._id),
        status: "delivered",
        stream: "inbox",
      });

      if (acceptedProposal.price > 0 && payoutId) {
        const payoutToken = createPayoutToken(payoutId);

        await queueWebhookDeliveries(ctx, {
          data: {
            payoutToken,
            settlementStatus: "ready_for_payout",
            transactionId,
          },
          eventType: "inbox.payout_ready",
          message: "Payout is ready for the supplier.",
          ownerExternalId: args.workerExternalId,
          payoutToken,
          requestToken: createPublicRequestToken(intent._id),
          status: "payout_ready",
          stream: "inbox",
        });
        await queueWebhookDeliveries(ctx, {
          data: {
            payoutToken,
            settlementStatus: "ready_for_payout",
            transactionId,
          },
          eventType: "payout.ready",
          message: "Payout is ready for processing.",
          ownerExternalId: args.workerExternalId,
          payoutToken,
          requestToken: createPublicRequestToken(intent._id),
          status: "pending",
          stream: "payouts",
        });
      }
    }

    return { submitted: true };
  },
});

export const generateUploadUrl = mutation({
  args: {},
  returns: v.string(),
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

export const markRequestFulfilled = mutation({
  args: {
    intentId: v.id("intents"),
    ownerExternalId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const intent = await ctx.db.get(args.intentId);

    if (!intent) {
      return { fulfilled: false };
    }

    const owner = args.ownerExternalId
      ? await ctx.db
          .query("users")
          .withIndex("by_externalId", (queryBuilder) =>
            queryBuilder.eq("externalId", args.ownerExternalId),
          )
          .unique()
      : null;

    if (!intent.ownerUserId || owner?._id !== intent.ownerUserId) {
      return { fulfilled: false };
    }

    const now = Date.now();
    const acceptedProposals = await ctx.db
      .query("proposals")
      .withIndex("by_intentKey_and_status", (queryBuilder) =>
        queryBuilder.eq("intentKey", intent.intentKey).eq("status", "accepted"),
      )
      .collect();
    const acceptedProposal = acceptedProposals[0] ?? null;

    const candidateFulfillments = [
      ...(await ctx.db
        .query("fulfillments")
        .withIndex("by_intentKey_and_status", (queryBuilder) =>
          queryBuilder.eq("intentKey", intent.intentKey).eq("status", "approved"),
        )
        .collect()),
      ...(await ctx.db
        .query("fulfillments")
        .withIndex("by_intentKey_and_status", (queryBuilder) =>
          queryBuilder.eq("intentKey", intent.intentKey).eq("status", "active"),
        )
        .collect()),
      ...(await ctx.db
        .query("fulfillments")
        .withIndex("by_intentKey_and_status", (queryBuilder) =>
          queryBuilder.eq("intentKey", intent.intentKey).eq("status", "blocked"),
        )
        .collect()),
      ...(await ctx.db
        .query("fulfillments")
        .withIndex("by_intentKey_and_status", (queryBuilder) =>
          queryBuilder.eq("intentKey", intent.intentKey).eq("status", "fulfilled"),
        )
        .collect()),
    ];

    const activeFulfillment =
      candidateFulfillments.find((fulfillment) =>
        acceptedProposal ? fulfillment.acceptedProposalId === acceptedProposal._id : true,
      ) ?? null;

    if (intent.status === "fulfilled" && activeFulfillment) {
      return { fulfilled: true };
    }

    const fallbackTransactionId =
      activeFulfillment?.transactionId ??
      (await ensureWorkTransaction(ctx, {
        amount: acceptedProposal?.price,
        buyerUserId: intent.ownerUserId,
        currency: acceptedProposal?.currency,
        environment: getCommerceEnvironment(),
        intentId: intent._id,
        intentKey: intent.intentKey,
        proposalId: acceptedProposal?._id as never,
        sellerUserId: acceptedProposal?.proposerUserId,
        status: "fulfilled",
        titleSnapshot: intent.title,
      }));

    const fulfillmentId =
      activeFulfillment?._id ??
      (await ctx.db.insert("fulfillments", {
        acceptedProposalId: acceptedProposal?._id,
        completedSummary: "Marked fulfilled by owner. Final delivery happened in the request chat.",
        environment: getCommerceEnvironment(),
        fulfillerUserId: acceptedProposal?.proposerUserId,
        intentKey: intent.intentKey,
        ownerUserId: intent.ownerUserId,
        scenarioId: getScenarioId(
          acceptedProposal ? "custom_scoped_work" : "chat_only_fulfillment",
        ),
        scenarioType: acceptedProposal ? "custom_scoped_work" : "chat_only_fulfillment",
        settlementStatus:
          acceptedProposal && acceptedProposal.price > 0
            ? "ready_for_payout"
            : "not_applicable",
        status: "fulfilled",
        supplyId: activeFulfillment?.supplyId,
        transactionId: fallbackTransactionId,
      }));

    if (activeFulfillment) {
      await ctx.db.patch(activeFulfillment._id, {
        acceptedProposalId: acceptedProposal?._id ?? activeFulfillment.acceptedProposalId,
        completedSummary:
          activeFulfillment.completedSummary ||
          "Marked fulfilled by owner. Final delivery happened in the request chat.",
        environment: activeFulfillment.environment ?? getCommerceEnvironment(),
        scenarioId:
          activeFulfillment.scenarioId ??
          getScenarioId(
            acceptedProposal ? "custom_scoped_work" : "chat_only_fulfillment",
          ),
        scenarioType:
          activeFulfillment.scenarioType ??
          (acceptedProposal ? "custom_scoped_work" : "chat_only_fulfillment"),
        settlementStatus:
          acceptedProposal && acceptedProposal.price > 0
            ? "ready_for_payout"
            : "not_applicable",
        status: "fulfilled",
        supplyId: activeFulfillment.supplyId,
        transactionId: activeFulfillment.transactionId ?? fallbackTransactionId,
      });

      await releaseSupplyCapacity(ctx, activeFulfillment.supplyId);
    }

    const existingEvidence = await ctx.db
      .query("evidences")
      .withIndex("by_fulfillmentId_and_createdAt", (queryBuilder) =>
        queryBuilder.eq("fulfillmentId", fulfillmentId),
      )
      .order("desc")
      .take(1);

    if (!existingEvidence[0]) {
      await ctx.db.insert("evidences", {
        body: "Marked fulfilled by owner. Final delivery happened in the request chat.",
        createdAt: now,
        fulfillmentId,
        mediaType: "text/markdown",
        url: undefined,
      });
    }

    await ctx.db.patch(intent._id, {
      completedAt: now,
      status: "fulfilled",
      updatedAt: now,
    });

    await ctx.db.insert("activityEvents", {
      createdAt: now,
      entityId: intent.intentKey,
      entityType: "intent",
      payload: JSON.stringify({
        markedBy: args.ownerExternalId,
      }),
      type: "fulfillment.marked_complete",
    });

    await refreshProfileAnalyticsForUser(ctx, intent.ownerUserId);
    await refreshProfileAnalyticsForUser(ctx, acceptedProposal?.proposerUserId);

    const fulfillment = await ctx.db.get(fulfillmentId);
    const transactionId = fulfillment?.transactionId;

    if (transactionId) {
      let payoutId: Id<"payouts"> | undefined;
      await updateTransactionById(ctx, transactionId, {
        fulfillmentId,
        settlementStatus:
          acceptedProposal && acceptedProposal.price > 0
            ? "ready_for_payout"
            : "not_applicable",
        status: "fulfilled",
      });

      const transaction = await ctx.db.get(transactionId);
      const settlementId = await ensureSettlementForTransaction(ctx, {
        amount: transaction?.amount ?? acceptedProposal?.price,
        chainFamily: transaction?.chainFamily,
        currency: transaction?.currency ?? acceptedProposal?.currency,
        environment: transaction?.environment ?? getCommerceEnvironment(),
        networkKey: transaction?.networkKey,
        protocol: transaction?.paymentProtocol ?? null,
        status:
          acceptedProposal && acceptedProposal.price > 0
            ? "ready_for_payout"
            : "not_applicable",
        transactionId,
      });

      if (acceptedProposal && acceptedProposal.price > 0 && acceptedProposal.proposerUserId) {
        payoutId = await ensurePayoutRecord(ctx, {
          amount: transaction?.amount ?? acceptedProposal.price,
          chainFamily: transaction?.chainFamily,
          currency: transaction?.currency ?? acceptedProposal.currency,
          environment: transaction?.environment ?? getCommerceEnvironment(),
          networkKey: transaction?.networkKey,
          settlementId,
          transactionId,
          userId: acceptedProposal.proposerUserId,
        });
      }

      await recordTransactionAuditEvent(ctx, {
        fulfillmentId,
        intentId: intent._id,
        message: acceptedProposal
          ? "Owner marked the approved work fulfilled from the request thread."
          : "Owner marked the chat-native request fulfilled.",
        metadata: {
          markedBy: args.ownerExternalId,
        },
        proposalId: acceptedProposal?._id as never,
        scenarioType: acceptedProposal
          ? "custom_scoped_work"
          : "chat_only_fulfillment",
        source: "fulfillment",
        stage: "delivery",
        status: "passed",
        transactionId,
      });

      await recordTransactionAuditEvent(ctx, {
        fulfillmentId,
        intentId: intent._id,
        message:
          acceptedProposal && acceptedProposal.price > 0
            ? "Settlement moved to ready-for-payout after owner confirmation."
            : "No payout settlement is required for this fulfillment.",
        metadata: {
          settlementStatus:
            acceptedProposal && acceptedProposal.price > 0
              ? "ready_for_payout"
              : "not_applicable",
        },
        proposalId: acceptedProposal?._id as never,
        scenarioType: acceptedProposal
          ? "custom_scoped_work"
          : "chat_only_fulfillment",
        settlementId,
        source: "fulfillment",
        stage: "settlement",
        status:
          acceptedProposal && acceptedProposal.price > 0 ? "passed" : "info",
        transactionId,
      });

      const proposerExternalId = await getUserExternalId(
        ctx,
        acceptedProposal?.proposerUserId,
      );

      await queueWebhookDeliveries(ctx, {
        data: {
          fulfillmentId,
          settlementStatus:
            acceptedProposal && acceptedProposal.price > 0
              ? "ready_for_payout"
              : "not_applicable",
          transactionId,
        },
        eventType: "inbox.delivered",
        message: "Owner marked the request fulfilled.",
        ownerExternalId: proposerExternalId,
        requestToken: createPublicRequestToken(intent._id),
        status: "delivered",
        stream: "inbox",
      });

      if (acceptedProposal && acceptedProposal.price > 0 && payoutId) {
        const payoutToken = createPayoutToken(payoutId);

        await queueWebhookDeliveries(ctx, {
          data: {
            payoutToken,
            settlementStatus: "ready_for_payout",
            transactionId,
          },
          eventType: "inbox.payout_ready",
          message: "Payout is ready after owner confirmation.",
          ownerExternalId: proposerExternalId,
          payoutToken,
          requestToken: createPublicRequestToken(intent._id),
          status: "payout_ready",
          stream: "inbox",
        });
        await queueWebhookDeliveries(ctx, {
          data: {
            payoutToken,
            settlementStatus: "ready_for_payout",
            transactionId,
          },
          eventType: "payout.ready",
          message: "Payout is ready for processing.",
          ownerExternalId: proposerExternalId,
          payoutToken,
          requestToken: createPublicRequestToken(intent._id),
          status: "pending",
          stream: "payouts",
        });
      }
    }

    return { fulfilled: true };
  },
});

async function ensurePayoutRecord(
  ctx: MutationCtx,
  input: {
    amount: number;
    chainFamily?: "evm" | "solana";
    currency: string;
    environment: "devnet" | "mainnet" | "testnet";
    networkKey?:
      | "base:mainnet"
      | "base:sepolia"
      | "ethereum:mainnet"
      | "ethereum:sepolia"
      | "polygon:amoy"
      | "polygon:mainnet"
      | "solana:devnet"
      | "solana:mainnet"
      | "solana:testnet";
    settlementId: Id<"settlements">;
    transactionId: Id<"transactions">;
    userId: string;
  },
) {
  const existing = await ctx.db
    .query("payouts")
    .withIndex("by_transactionId", (queryBuilder) =>
      queryBuilder.eq("transactionId", input.transactionId),
    )
    .collect();

  const matched = existing.find((payout) => payout.payeeUserId === input.userId);

  if (matched) {
    return matched._id;
  }

  const now = Date.now();
  const payeeProfileId = await getProfileIdForUser(ctx, input.userId);
  const walletAccountId = await getDefaultPayoutWalletAccountId(ctx, input.userId);

  return ctx.db.insert("payouts", {
    amount: input.amount,
    chainFamily: input.chainFamily,
    createdAt: now,
    currency: input.currency,
    environment: input.environment,
    networkKey: input.networkKey,
    payeeProfileId,
    payeeUserId: input.userId,
    settlementId: input.settlementId,
    status: "pending",
    transactionId: input.transactionId,
    txHash: undefined,
    updatedAt: now,
    walletAccountId,
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
