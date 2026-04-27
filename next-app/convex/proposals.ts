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
import {
  normalizeCollectiveProposalInput,
  resolveCollectiveParticipants,
} from "./collectives";
import { reserveSupplyCapacity } from "./supplies";
import { areBorealNetworksCompatible } from "../lib/boreal/commerce/networks";
import { createPublicRequestToken } from "../lib/boreal/one-inbox/tokens";
import { refreshProfileAnalyticsForUser } from "./profileAnalytics";
import {
  getScenarioId,
  recordTransactionAuditEvent,
  scenarioNeedsBuyerWallet,
  scenarioNeedsPayoutWallet,
} from "./transactionScenarios";
import { queueWebhookDeliveries } from "./webhooks";

export const submitProposal = mutation({
  args: {
    collectiveMembers: v.optional(v.array(v.string())),
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
    memberRoles: v.optional(
      v.array(
        v.object({
          memberId: v.string(),
          role: v.string(),
        }),
      ),
    ),
    splitPlan: v.optional(
      v.array(
        v.object({
          memberId: v.string(),
          percent: v.number(),
        }),
      ),
    ),
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
    const collectiveInput = normalizeCollectiveProposalInput({
      collectiveMembers: args.collectiveMembers,
      memberRoles: args.memberRoles,
      proposerExternalId: args.ownerExternalId,
      splitPlan: args.splitPlan,
    });

    if (collectiveInput.error) {
      return {
        error: collectiveInput.error,
        proposalId: null,
        submitted: false,
      };
    }
    const now = Date.now();

    const proposalId = await ctx.db.insert("proposals", {
      collectiveMembers: collectiveInput.collective?.collectiveMembers,
      createdAt: now,
      currency: args.currency,
      deliverablesBody: args.deliverablesBody,
      deliverablesType: args.deliverablesType,
      environment: getCommerceEnvironment(),
      etaAt: args.etaAt,
      intentKey: intent.intentKey,
      isCollective: collectiveInput.collective?.isCollective ?? false,
      memberRoles: collectiveInput.collective?.memberRoles,
      price: args.price,
      proposerKind: args.proposerKind ?? "human",
      proposerUserId,
      scenarioId: getScenarioId("custom_scoped_work"),
      scenarioType: "custom_scoped_work",
      splitPlan: collectiveInput.collective?.splitPlan,
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
        collectiveInput.collective
          ? `Collective split: ${collectiveInput.collective.splitPlan
              .map((entry) => `${entry.memberId} ${entry.percent}%`)
              .join(", ")}`
          : null,
        collectiveInput.collective && collectiveInput.collective.memberRoles.length > 0
          ? `Collective roles: ${collectiveInput.collective.memberRoles
              .map((entry) => `${entry.memberId} - ${entry.role}`)
              .join(", ")}`
          : null,
        "",
        args.deliverablesBody,
      ]
        .filter((line): line is string => typeof line === "string")
        .join("\n"),
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
        collectiveMembers: collectiveInput.collective?.collectiveMembers ?? null,
        memberRoles: collectiveInput.collective?.memberRoles ?? null,
        price: args.price,
        proposerUserId,
        proposalId,
        splitPlan: collectiveInput.collective?.splitPlan ?? null,
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

    if (args.ownerExternalId) {
      await queueWebhookDeliveries(ctx, {
        data: {
          collectiveMembers: collectiveInput.collective?.collectiveMembers ?? null,
          currency: args.currency,
          etaAt: args.etaAt,
          memberRoles: collectiveInput.collective?.memberRoles ?? null,
          price: args.price,
          proposalId,
          splitPlan: collectiveInput.collective?.splitPlan ?? null,
        },
        eventType: "inbox.proposed",
        message: "Supplier submitted a proposal.",
        ownerExternalId: args.ownerExternalId,
        requestToken: createPublicRequestToken(intent._id),
        status: "proposed",
        stream: "inbox",
      });
    }

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
    const collectiveParticipants = proposal.isCollective
      ? await resolveCollectiveParticipants(ctx, proposal)
      : null;

    if (collectiveParticipants?.error) {
      await recordTransactionAuditEvent(ctx, {
        intentId: intent._id,
        message:
          "The selected collective proposal references a member that Boreal cannot resolve.",
        metadata: {
          memberId: collectiveParticipants.memberId,
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
        reason: "collective_member_not_found" as const,
      };
    }
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
      !proposal.isCollective &&
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
      scenarioNeedsPayoutWallet("custom_scoped_work", proposal.price) &&
      proposal.isCollective
    ) {
      const missingPayoutMember = collectiveParticipants?.participants.find(
        (participant) => !participant.payoutWalletAccountId,
      );

      if (missingPayoutMember) {
        await recordTransactionAuditEvent(ctx, {
          intentId: intent._id,
          message:
            "A collective member needs a payout wallet before approval.",
          metadata: {
            memberExternalId: missingPayoutMember.externalId,
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
          reason: "missing_collective_payout_wallet" as const,
        };
      }
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

    if (proposal.price > 0 && proposal.isCollective) {
      const mismatchedMember = collectiveParticipants?.participants.find(
        (participant) =>
          !areBorealNetworksCompatible({
            left: ownerBuyerWalletContext?.networkKey ?? null,
            right: participant.payoutWalletContext?.networkKey ?? null,
          }),
      );

      if (mismatchedMember) {
        await recordTransactionAuditEvent(ctx, {
          intentId: intent._id,
          message:
            "One collective payout wallet is on a different network than the buyer wallet.",
          metadata: {
            buyerNetworkKey: ownerBuyerWalletContext?.networkKey,
            memberExternalId: mismatchedMember.externalId,
            payoutNetworkKey: mismatchedMember.payoutWalletContext?.networkKey,
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
          reason: "collective_wallet_network_mismatch" as const,
        };
      }
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
        collectiveMembers: proposal.collectiveMembers ?? null,
        approvedProposalId: args.proposalId,
        memberRoles: proposal.memberRoles ?? null,
        proposerUserId: proposal.proposerUserId,
        splitPlan: proposal.splitPlan ?? null,
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

    await queueWebhookDeliveries(ctx, {
      data: {
        collectiveMembers: proposal.collectiveMembers ?? null,
        fulfillmentId,
        memberRoles: proposal.memberRoles ?? null,
        price: proposal.price,
        proposalId: proposal._id,
        splitPlan: proposal.splitPlan ?? null,
        transactionId,
      },
      eventType: "inbox.claimed",
      message: "Proposal approved and work moved into fulfillment.",
      ownerExternalId: await getUserExternalId(ctx, proposal.proposerUserId),
      requestToken: createPublicRequestToken(intent._id),
      status: "claimed",
      stream: "inbox",
    });

    if (proposal.isCollective && collectiveParticipants) {
      const proposerExternalId = await getUserExternalId(ctx, proposal.proposerUserId);

      for (const participant of collectiveParticipants.participants) {
        if (!participant.externalId || participant.externalId === proposerExternalId) {
          continue;
        }

        await queueWebhookDeliveries(ctx, {
          data: {
            collectiveMembers: proposal.collectiveMembers ?? null,
            fulfillmentId,
            memberRoles: proposal.memberRoles ?? null,
            price: proposal.price,
            proposalId: proposal._id,
            splitPlan: proposal.splitPlan ?? null,
            transactionId,
          },
          eventType: "inbox.claimed",
          message: "Collective proposal approved and work moved into fulfillment.",
          ownerExternalId: participant.externalId,
          requestToken: createPublicRequestToken(intent._id),
          status: "claimed",
          stream: "inbox",
        });
      }
    }

    await refreshProfileAnalyticsForUser(ctx, proposal.proposerUserId);
    await refreshProfileAnalyticsForUser(ctx, intent.ownerUserId);

    return { approved: true };
  },
});

export const approveMatchedSupply = mutation({
  args: {
    intentId: v.id("intents"),
    ownerExternalId: v.optional(v.string()),
    supplyId: v.id("supplies"),
  },
  handler: async (ctx, args) => {
    const intent = await ctx.db.get(args.intentId);
    const supply = await ctx.db.get(args.supplyId);

    if (
      !intent ||
      !supply ||
      supply.status !== "active" ||
      !supply.supplierUserId ||
      !(await hasOwnerAccess(ctx, intent.ownerUserId, args.ownerExternalId))
    ) {
      return { approved: false as const };
    }

    if (!["open", "proposed", "blocked"].includes(intent.status)) {
      return { approved: false as const, reason: "request_not_open" as const };
    }

    const reservation = await reserveSupplyCapacity(ctx, args.supplyId);

    if (!reservation.reserved) {
      return {
        approved: false as const,
        reason:
          reservation.reason === "capacity_exhausted"
            ? ("capacity_exhausted" as const)
            : reservation.reason === "unavailable"
              ? ("supplier_unavailable" as const)
              : ("gated_out" as const),
      };
    }

    const now = Date.now();
    const priceAmount = supply.priceAmount ?? 0;
    const supplierDisplayName =
      (await getUserDisplayName(ctx, supply.supplierUserId)) ?? supply.title;
    const supplierExternalId = await getUserExternalId(ctx, supply.supplierUserId);
    const supplierProfileId = await getProfileIdForUser(ctx, supply.supplierUserId);
    const ownerBuyerWalletAccountId = scenarioNeedsBuyerWallet(
      "custom_scoped_work",
      priceAmount,
    )
      ? await getDefaultBuyerWalletAccountId(ctx, intent.ownerUserId)
      : undefined;
    const supplierPayoutWalletAccountId = scenarioNeedsPayoutWallet(
      "custom_scoped_work",
      priceAmount,
    )
      ? await getDefaultPayoutWalletAccountId(ctx, supply.supplierUserId)
      : undefined;
    const ownerBuyerWalletContext = await getWalletAccountContext(
      ctx,
      ownerBuyerWalletAccountId,
    );
    const supplierPayoutWalletContext = await getWalletAccountContext(
      ctx,
      supplierPayoutWalletAccountId,
    );

    if (
      scenarioNeedsBuyerWallet("custom_scoped_work", priceAmount) &&
      !ownerBuyerWalletAccountId
    ) {
      await recordTransactionAuditEvent(ctx, {
        intentId: intent._id,
        message:
          "The buyer needs a connected wallet before approving this matched worker.",
        metadata: {
          price: priceAmount,
          supplyId: args.supplyId,
        },
        scenarioType: "custom_scoped_work",
        source: "wallet",
        stage: "wallet",
        status: "blocked",
      });

      return {
        approved: false as const,
        reason: "missing_buyer_wallet" as const,
      };
    }

    if (
      scenarioNeedsPayoutWallet("custom_scoped_work", priceAmount) &&
      !supplierPayoutWalletAccountId
    ) {
      await recordTransactionAuditEvent(ctx, {
        intentId: intent._id,
        message:
          "The selected matched worker needs a payout wallet before approval.",
        metadata: {
          supplyId: args.supplyId,
          supplierUserId: supply.supplierUserId,
        },
        scenarioType: "custom_scoped_work",
        source: "wallet",
        stage: "wallet",
        status: "blocked",
      });

      return {
        approved: false as const,
        reason: "missing_payout_wallet" as const,
      };
    }

    if (
      priceAmount > 0 &&
      !areBorealNetworksCompatible({
        left: ownerBuyerWalletContext?.networkKey ?? null,
        right: supplierPayoutWalletContext?.networkKey ?? null,
      })
    ) {
      await recordTransactionAuditEvent(ctx, {
        intentId: intent._id,
        message:
          "Buyer and matched worker payout wallets are on different networks. Cross-network settlement is not enabled yet.",
        metadata: {
          buyerNetworkKey: ownerBuyerWalletContext?.networkKey,
          payoutNetworkKey: supplierPayoutWalletContext?.networkKey,
          supplyId: args.supplyId,
        },
        scenarioType: "custom_scoped_work",
        source: "wallet",
        stage: "wallet",
        status: "blocked",
      });

      return {
        approved: false as const,
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

    const existingProposal =
      relatedProposals.find(
        (proposal) => proposal.proposerUserId === supply.supplierUserId,
      ) ?? null;
    const proposalId =
      existingProposal?._id ??
      (await ctx.db.insert("proposals", {
        createdAt: now,
        currency: supply.currency,
        deliverablesBody: [supply.title, "", supply.description].join("\n"),
        deliverablesType: "markdown",
        environment:
          supplierPayoutWalletContext?.environment ??
          ownerBuyerWalletContext?.environment,
        etaAt: estimateClaimEtaAt(now, supply.estimatedDeliveryLabel, supply.deliveryType),
        intentKey: intent.intentKey,
        isCollective: false,
        price: priceAmount,
        proposerKind: supply.actorKind,
        proposerUserId: supply.supplierUserId,
        scenarioId: getScenarioId("custom_scoped_work"),
        scenarioType: "custom_scoped_work",
        status: "accepted",
      }));

    for (const proposal of relatedProposals) {
      const nextStatus =
        proposal._id === proposalId
          ? "accepted"
          : proposal.status === "accepted"
            ? "declined"
            : proposal.status;

      if (nextStatus !== proposal.status) {
        await ctx.db.patch(proposal._id, { status: nextStatus });
      }
    }

    if (existingProposal) {
      await ctx.db.patch(existingProposal._id, {
        currency: supply.currency,
        deliverablesBody: [supply.title, "", supply.description].join("\n"),
        environment:
          supplierPayoutWalletContext?.environment ??
          ownerBuyerWalletContext?.environment,
        etaAt: estimateClaimEtaAt(now, supply.estimatedDeliveryLabel, supply.deliveryType),
        price: priceAmount,
        status: "accepted",
      });
    }

    await ctx.db.patch(args.intentId, {
      approvedAt: intent.approvedAt ?? now,
      assignedAgent: supply.title,
      assignedToolNames: [supply.title, ...supply.capabilityTags.slice(0, 3)],
      startedAt: intent.startedAt ?? now,
      status: "claimed",
      updatedAt: now,
    });

    const transactionId = await ensureWorkTransaction(ctx, {
      amount: priceAmount,
      buyerUserId: intent.ownerUserId,
      buyerWalletAccountId: ownerBuyerWalletAccountId,
      chainFamily:
        supplierPayoutWalletContext?.chainFamily ??
        ownerBuyerWalletContext?.chainFamily ??
        undefined,
      chainId:
        supplierPayoutWalletContext?.chainId ??
        ownerBuyerWalletContext?.chainId ??
        undefined,
      currency: supply.currency,
      environment: getCommerceEnvironment(),
      intentId: intent._id,
      intentKey: intent.intentKey,
      networkKey:
        supplierPayoutWalletContext?.networkKey ??
        ownerBuyerWalletContext?.networkKey ??
        undefined,
      proposalId,
      sellerProfileId: supplierProfileId,
      sellerUserId: supply.supplierUserId,
      status: "active",
      titleSnapshot: intent.title,
    });

    const fulfillmentId = await ctx.db.insert("fulfillments", {
      acceptedProposalId: proposalId,
      environment: getCommerceEnvironment(),
      fulfillerUserId: supply.supplierUserId,
      intentKey: intent.intentKey,
      ownerUserId: intent.ownerUserId,
      scenarioId: getScenarioId("custom_scoped_work"),
      scenarioType: "custom_scoped_work",
      settlementStatus: priceAmount > 0 ? "pending" : "not_applicable",
      status: "approved",
      supplyId: args.supplyId,
      transactionId,
    });

    await ensureSettlementForTransaction(ctx, {
      amount: priceAmount,
      buyerWalletAccountId: ownerBuyerWalletAccountId,
      chainFamily:
        supplierPayoutWalletContext?.chainFamily ??
        ownerBuyerWalletContext?.chainFamily ??
        undefined,
      currency: supply.currency,
      environment: getCommerceEnvironment(),
      networkKey:
        supplierPayoutWalletContext?.networkKey ??
        ownerBuyerWalletContext?.networkKey ??
        undefined,
      payoutWalletAccountId: supplierPayoutWalletAccountId,
      protocol: null,
      status: priceAmount > 0 ? "pending" : "not_applicable",
      transactionId,
    });

    await ctx.db.patch(transactionId, {
      fulfillmentId,
      updatedAt: now,
    });

    await ctx.db.insert("chatMessages", {
      body: `${supplierDisplayName} was added to this request from matched supply at ${supply.priceAmount} ${supply.currency}.`,
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
        proposalId,
        supplierUserId: supply.supplierUserId,
        supplyId: args.supplyId,
      }),
      type: "request.team_assigned",
    });

    if (priceAmount > 0) {
      await recordTransactionAuditEvent(ctx, {
        intentId: intent._id,
        message:
          "Buyer and payout wallets are present for this matched worker approval.",
        metadata: {
          buyerWalletAccountId: ownerBuyerWalletAccountId,
          payoutWalletAccountId: supplierPayoutWalletAccountId,
          supplyId: args.supplyId,
        },
        proposalId,
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
      message: `${supplierDisplayName} was approved directly from matched supply and work is now active.`,
      metadata: {
          price: priceAmount,
        proposalId,
        supplyId: args.supplyId,
      },
      proposalId,
      scenarioType: "custom_scoped_work",
      source: "proposal",
      stage: "approval",
      status: "passed",
      transactionId,
    });

    await recordTransactionAuditEvent(ctx, {
      fulfillmentId,
      intentId: intent._id,
      message: "The request moved into active fulfillment with an approved matched worker.",
      proposalId,
      scenarioType: "custom_scoped_work",
      source: "fulfillment",
      stage: "fulfillment",
      status: "info",
      transactionId,
    });

    await queueWebhookDeliveries(ctx, {
      data: {
        fulfillmentId,
        price: priceAmount,
        proposalId,
        supplyId: args.supplyId,
        transactionId,
      },
      eventType: "inbox.claimed",
      message: "Matched worker approved and work moved into fulfillment.",
      ownerExternalId: supplierExternalId,
      requestToken: createPublicRequestToken(intent._id),
      status: "claimed",
      stream: "inbox",
    });

    await refreshProfileAnalyticsForUser(ctx, supply.supplierUserId);
    await refreshProfileAnalyticsForUser(ctx, intent.ownerUserId);

    return {
      approved: true as const,
      fulfillmentId,
      proposalId,
      transactionId,
    };
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

async function getUserExternalId(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ctx: any,
  userId: string | undefined,
) {
  if (!userId) {
    return null;
  }

  const user = await ctx.db.get(userId);
  return user?.externalId ?? null;
}

function estimateClaimEtaAt(
  now: number,
  deliveryLabel: string | undefined,
  deliveryType: "async" | "instant" | "scheduled",
) {
  if (deliveryType === "instant") {
    return now + 60 * 60 * 1000;
  }

  const label = deliveryLabel?.toLowerCase() ?? "";
  const match = label.match(/(\d+(?:\.\d+)?)/);
  const value = match ? Number(match[1]) : null;

  if (value !== null) {
    if (label.includes("week")) {
      return now + value * 7 * 24 * 60 * 60 * 1000;
    }

    if (label.includes("day")) {
      return now + value * 24 * 60 * 60 * 1000;
    }

    if (label.includes("hour")) {
      return now + value * 60 * 60 * 1000;
    }
  }

  return now + (deliveryType === "scheduled" ? 7 : 3) * 24 * 60 * 60 * 1000;
}
