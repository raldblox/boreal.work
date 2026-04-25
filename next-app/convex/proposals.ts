import { mutation } from "./_generated/server";
import { v } from "convex/values";

import {
  ensureSettlementForTransaction,
  ensureWorkTransaction,
  getCommerceEnvironment,
  getDefaultBuyerWalletAccountId,
  getDefaultPayoutWalletAccountId,
  getProfileIdForUser,
  getWalletAccountContext,
} from "./commerceCore";
import { areBorealNetworksCompatible } from "../lib/boreal/commerce/networks";
import { refreshProfileAnalyticsForUser } from "./profileAnalytics";
import {
  getScenarioId,
  recordTransactionAuditEvent,
  scenarioNeedsBuyerWallet,
  scenarioNeedsPayoutWallet,
} from "./transactionScenarios";

export const submitProposal = mutation({
  args: {
    currency: v.string(),
    deliverablesBody: v.string(),
    deliverablesType: v.union(v.literal("markdown"), v.literal("file"), v.literal("link")),
    etaAt: v.number(),
    intentId: v.id("intents"),
    ownerDisplayName: v.optional(v.string()),
    ownerExternalId: v.optional(v.string()),
    ownerHandle: v.optional(v.string()),
    price: v.number(),
    proposerKind: v.optional(v.union(v.literal("human"), v.literal("agent"))),
  },
  handler: async (ctx, args) => {
    const intent = await ctx.db.get(args.intentId);

    if (!intent || intent.visibility !== "public") {
      return { proposalId: null, submitted: false };
    }

    const proposerUserId = await upsertProposalUser(ctx, {
      displayName: args.ownerDisplayName,
      externalId: args.ownerExternalId,
      handle: args.ownerHandle,
    });
    const now = Date.now();

    const proposalId = await ctx.db.insert("proposals", {
      createdAt: now,
      currency: args.currency,
      deliverablesBody: args.deliverablesBody,
      deliverablesType: args.deliverablesType,
      environment: getCommerceEnvironment(),
      etaAt: args.etaAt,
      intentKey: intent.intentKey,
      isCollective: false,
      price: args.price,
      proposerKind: args.proposerKind ?? "human",
      proposerUserId,
      scenarioId: getScenarioId("custom_scoped_work"),
      scenarioType: "custom_scoped_work",
      status: "submitted",
    });

    const proposer = proposerUserId
      ? ((await ctx.db.get(proposerUserId as never)) as
          | { displayName?: string; handle?: string }
          | null)
      : null;

    await ctx.db.insert("chatMessages", {
      body: [
        `${proposer?.displayName ?? args.ownerDisplayName ?? "Worker"} submitted a proposal.`,
        "",
        `Quote: ${args.price} ${args.currency}`,
        `ETA: ${new Date(args.etaAt).toLocaleString("en-US", {
          dateStyle: "medium",
          timeStyle: "short",
        })}`,
        "",
        args.deliverablesBody,
      ].join("\n"),
      conversationId: intent.conversationId ?? crypto.randomUUID(),
      createdAt: now,
      intentKey: intent.intentKey,
      messageId: crypto.randomUUID(),
      provider: intent.provider,
      role: "system",
      senderActorKind: args.proposerKind ?? "human",
      senderDisplayName:
        proposer?.displayName ?? args.ownerDisplayName ?? args.ownerHandle ?? "Worker",
      senderExternalId: args.ownerExternalId,
      senderHandle: proposer?.handle ?? args.ownerHandle,
    });

    await ctx.db.insert("activityEvents", {
      createdAt: now,
      entityId: intent.intentKey,
      entityType: "intent",
      payload: JSON.stringify({
        price: args.price,
        proposerUserId,
        proposalId,
      }),
      type: "proposal.submitted",
    });

    await recordTransactionAuditEvent(ctx, {
      intentId: intent._id,
      message: `${proposer?.displayName ?? args.ownerDisplayName ?? "Worker"} submitted a proposal.`,
      metadata: {
        currency: args.currency,
        etaAt: args.etaAt,
        price: args.price,
      },
      proposalId,
      scenarioType: "custom_scoped_work",
      source: "proposal",
      stage: "proposal",
      status: "passed",
    });

    await refreshProfileAnalyticsForUser(ctx, proposerUserId);
    await refreshProfileAnalyticsForUser(ctx, intent.ownerUserId);

    return { proposalId, submitted: true };
  },
});

export const approveProposal = mutation({
  args: {
    intentId: v.id("intents"),
    ownerExternalId: v.optional(v.string()),
    proposalId: v.id("proposals"),
  },
  handler: async (ctx, args) => {
    const intent = await ctx.db.get(args.intentId);
    const proposal = await ctx.db.get(args.proposalId);

    if (
      !intent ||
      !proposal ||
      proposal.intentKey !== intent.intentKey ||
      !(await hasOwnerAccess(ctx, intent.ownerUserId, args.ownerExternalId))
    ) {
      return { approved: false };
    }

    const now = Date.now();
    const acceptedProposerName = await getUserDisplayName(ctx, proposal.proposerUserId);
    const acceptedProposerProfileId = await getProfileIdForUser(
      ctx,
      proposal.proposerUserId,
    );
    const ownerBuyerWalletAccountId = scenarioNeedsBuyerWallet(
      "custom_scoped_work",
      proposal.price,
    )
      ? await getDefaultBuyerWalletAccountId(ctx, intent.ownerUserId)
      : undefined;
    const proposerPayoutWalletAccountId = scenarioNeedsPayoutWallet(
      "custom_scoped_work",
      proposal.price,
    )
      ? await getDefaultPayoutWalletAccountId(ctx, proposal.proposerUserId)
      : undefined;
    const ownerBuyerWalletContext = await getWalletAccountContext(
      ctx,
      ownerBuyerWalletAccountId,
    );
    const proposerPayoutWalletContext = await getWalletAccountContext(
      ctx,
      proposerPayoutWalletAccountId,
    );

    if (scenarioNeedsBuyerWallet("custom_scoped_work", proposal.price) && !ownerBuyerWalletAccountId) {
      await recordTransactionAuditEvent(ctx, {
        intentId: intent._id,
        message:
          "The buyer needs a connected wallet before approving paid work.",
        metadata: {
          proposalId: args.proposalId,
          price: proposal.price,
        },
        proposalId: proposal._id,
        scenarioType: "custom_scoped_work",
        source: "wallet",
        stage: "wallet",
        status: "blocked",
      });

      return {
        approved: false,
        reason: "missing_buyer_wallet" as const,
      };
    }

    if (
      scenarioNeedsPayoutWallet("custom_scoped_work", proposal.price) &&
      !proposerPayoutWalletAccountId
    ) {
      await recordTransactionAuditEvent(ctx, {
        intentId: intent._id,
        message:
          "The selected worker needs a payout wallet before approval.",
        metadata: {
          proposalId: args.proposalId,
          proposerUserId: proposal.proposerUserId,
        },
        proposalId: proposal._id,
        scenarioType: "custom_scoped_work",
        source: "wallet",
        stage: "wallet",
        status: "blocked",
      });

      return {
        approved: false,
        reason: "missing_payout_wallet" as const,
      };
    }

    if (
      proposal.price > 0 &&
      !areBorealNetworksCompatible({
        left: ownerBuyerWalletContext?.networkKey ?? null,
        right: proposerPayoutWalletContext?.networkKey ?? null,
      })
    ) {
      await recordTransactionAuditEvent(ctx, {
        intentId: intent._id,
        message:
          "Buyer and payout wallets are on different networks. Cross-network settlement is not enabled yet.",
        metadata: {
          buyerNetworkKey: ownerBuyerWalletContext?.networkKey,
          payoutNetworkKey: proposerPayoutWalletContext?.networkKey,
          proposalId: args.proposalId,
        },
        proposalId: proposal._id,
        scenarioType: "custom_scoped_work",
        source: "wallet",
        stage: "wallet",
        status: "blocked",
      });

      return {
        approved: false,
        reason: "wallet_network_mismatch" as const,
      };
    }

    const relatedProposals = await ctx.db
      .query("proposals")
      .withIndex("by_intentKey_and_createdAt", (queryBuilder) =>
        queryBuilder.eq("intentKey", intent.intentKey),
      )
      .order("asc")
      .take(32);

    for (const relatedProposal of relatedProposals) {
      await ctx.db.patch(relatedProposal._id, {
        status: relatedProposal._id === args.proposalId ? "accepted" : "declined",
      });
    }

    await ctx.db.patch(args.intentId, {
      approvedAt: intent.approvedAt ?? now,
      assignedAgent: acceptedProposerName ?? "Approved proposer",
      assignedToolNames: ["proposal-worker"],
      startedAt: intent.startedAt ?? now,
      status: "claimed",
      updatedAt: now,
    });

    const transactionId = await ensureWorkTransaction(ctx, {
      amount: proposal.price,
      buyerUserId: intent.ownerUserId,
      buyerWalletAccountId: ownerBuyerWalletAccountId,
      chainFamily:
        proposerPayoutWalletContext?.chainFamily ??
        ownerBuyerWalletContext?.chainFamily ??
        undefined,
      chainId:
        proposerPayoutWalletContext?.chainId ??
        ownerBuyerWalletContext?.chainId ??
        undefined,
      currency: proposal.currency,
      environment: getCommerceEnvironment(),
      intentId: intent._id,
      intentKey: intent.intentKey,
      networkKey:
        proposerPayoutWalletContext?.networkKey ??
        ownerBuyerWalletContext?.networkKey ??
        undefined,
      proposalId: proposal._id,
      sellerProfileId: acceptedProposerProfileId,
      sellerUserId: proposal.proposerUserId,
      status: "active",
      titleSnapshot: intent.title,
    });

    const fulfillmentId = await ctx.db.insert("fulfillments", {
      acceptedProposalId: args.proposalId,
      environment: getCommerceEnvironment(),
      fulfillerUserId: proposal.proposerUserId,
      intentKey: intent.intentKey,
      ownerUserId: intent.ownerUserId,
      scenarioId: getScenarioId("custom_scoped_work"),
      scenarioType: "custom_scoped_work",
      settlementStatus: proposal.price > 0 ? "pending" : "not_applicable",
      status: "approved",
      transactionId,
    });

    await ensureSettlementForTransaction(ctx, {
      amount: proposal.price,
      buyerWalletAccountId: ownerBuyerWalletAccountId,
      chainFamily:
        proposerPayoutWalletContext?.chainFamily ??
        ownerBuyerWalletContext?.chainFamily ??
        undefined,
      currency: proposal.currency,
      environment: getCommerceEnvironment(),
      networkKey:
        proposerPayoutWalletContext?.networkKey ??
        ownerBuyerWalletContext?.networkKey ??
        undefined,
      payoutWalletAccountId: proposerPayoutWalletAccountId,
      protocol: null,
      status: proposal.price > 0 ? "pending" : "not_applicable",
      transactionId,
    });

    await ctx.db.patch(transactionId, {
      fulfillmentId,
      updatedAt: now,
    });

    await ctx.db.insert("chatMessages", {
      body: `${acceptedProposerName ?? "A proposer"} was approved for this request at ${proposal.price} ${proposal.currency}.`,
      conversationId: intent.conversationId ?? crypto.randomUUID(),
      createdAt: now,
      intentKey: intent.intentKey,
      messageId: crypto.randomUUID(),
      provider: intent.provider,
      role: "system",
      senderActorKind: "human",
      senderDisplayName: "Owner",
      senderExternalId: args.ownerExternalId,
    });

    await ctx.db.insert("activityEvents", {
      createdAt: now,
      entityId: intent.intentKey,
      entityType: "intent",
      payload: JSON.stringify({
        approvedProposalId: args.proposalId,
        proposerUserId: proposal.proposerUserId,
      }),
      type: "proposal.approved",
    });

    if (proposal.price > 0) {
      await recordTransactionAuditEvent(ctx, {
        intentId: intent._id,
        message:
          "Buyer and payout wallets are present for this paid proposal.",
        metadata: {
          buyerWalletAccountId: ownerBuyerWalletAccountId,
          payoutWalletAccountId: proposerPayoutWalletAccountId,
        },
        proposalId: proposal._id,
        scenarioType: "custom_scoped_work",
        source: "wallet",
        stage: "wallet",
        status: "passed",
        transactionId,
      });
    }

    await recordTransactionAuditEvent(ctx, {
      fulfillmentId,
      intentId: intent._id,
      message: `${acceptedProposerName ?? "A proposer"} was approved and work is now active.`,
      metadata: {
        price: proposal.price,
        proposalId: proposal._id,
      },
      proposalId: proposal._id,
      scenarioType: "custom_scoped_work",
      source: "proposal",
      stage: "approval",
      status: "passed",
      transactionId,
    });

    await recordTransactionAuditEvent(ctx, {
      fulfillmentId,
      intentId: intent._id,
      message: "The request moved into active fulfillment.",
      proposalId: proposal._id,
      scenarioType: "custom_scoped_work",
      source: "fulfillment",
      stage: "fulfillment",
      status: "info",
      transactionId,
    });

    await refreshProfileAnalyticsForUser(ctx, proposal.proposerUserId);
    await refreshProfileAnalyticsForUser(ctx, intent.ownerUserId);

    return { approved: true };
  },
});

async function upsertProposalUser(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ctx: any,
  input: {
    displayName?: string;
    externalId?: string;
    handle?: string;
  },
) {
  if (!input.externalId) {
    return undefined;
  }

  const existing = await ctx.db
    .query("users")
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .withIndex("by_externalId", (queryBuilder: any) =>
      queryBuilder.eq("externalId", input.externalId),
    )
    .unique();

  if (existing) {
    await ctx.db.patch(existing._id, {
      actorKind: existing.actorKind ?? "human",
      displayName: input.displayName ?? existing.displayName,
      handle: input.handle ?? existing.handle,
      updatedAt: Date.now(),
    });

    return existing._id as string;
  }

  return ctx.db.insert("users", {
    actorKind: "human",
    createdAt: Date.now(),
    displayName: input.displayName ?? input.handle ?? "Worker",
    externalId: input.externalId,
    handle: input.handle,
    trustScore: 0.5,
    updatedAt: Date.now(),
  });
}

async function hasOwnerAccess(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ctx: any,
  ownerUserId: string | undefined,
  ownerExternalId: string | undefined,
) {
  if (!ownerUserId || !ownerExternalId) {
    return true;
  }

  const owner = await ctx.db
    .query("users")
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .withIndex("by_externalId", (queryBuilder: any) =>
      queryBuilder.eq("externalId", ownerExternalId),
    )
    .unique();

  return owner?._id === ownerUserId;
}

async function getUserDisplayName(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ctx: any,
  userId: string | undefined,
) {
  if (!userId) {
    return null;
  }

  const user = await ctx.db.get(userId);
  return user?.displayName ?? null;
}
