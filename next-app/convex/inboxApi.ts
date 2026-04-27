import { mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { v } from "convex/values";

import {
  ensureSettlementForTransaction,
  ensureWorkTransaction,
  getDefaultBuyerWalletAccountId,
  getDefaultPayoutWalletAccountId,
  getProfileIdForUser,
  getWalletAccountContext,
} from "./commerceCore";
import { refreshProfileAnalyticsForUser } from "./profileAnalytics";
import { listIntentMatchCandidates, reserveSupplyCapacity } from "./supplies";
import { areBorealNetworksCompatible } from "../lib/boreal/commerce/networks";
import {
  createInboxEntryToken,
  createPayoutToken,
  createPublicRequestToken,
  parseInboxEntryToken,
  parsePayoutToken,
  parsePublicRequestToken,
} from "../lib/boreal/one-inbox/tokens";
import { getScenarioId, recordTransactionAuditEvent } from "./transactionScenarios";

const DEFAULT_LIMIT = 24;
const MARKET_OPEN_STATUSES = new Set(["open", "proposed", "claimed", "in_progress", "fulfilled"]);

export const listInbox = query({
  args: {
    includeDeclined: v.optional(v.boolean()),
    limit: v.optional(v.number()),
    ownerExternalId: v.string(),
  },
  handler: async (ctx, args) => {
    const supplier = await getSupplierContext(ctx, args.ownerExternalId);

    if (!supplier || supplier.supplies.length === 0) {
      return [];
    }

    return listInboxEntriesForSupplier(ctx, {
      includeDeclined: args.includeDeclined ?? false,
      limit: args.limit ?? DEFAULT_LIMIT,
      supplier,
    });
  },
});

export const getInboxEntry = query({
  args: {
    entryToken: v.string(),
    ownerExternalId: v.string(),
  },
  handler: async (ctx, args) => {
    const supplier = await getSupplierContext(ctx, args.ownerExternalId);
    const parsed = parseInboxEntryToken(args.entryToken);

    if (!supplier || !parsed) {
      return null;
    }

    const intent = await ctx.db.get(parsed.intentId);

    if (!intent || intent.visibility !== "public") {
      return null;
    }

    return buildInboxEntryForIntent(ctx, {
      includeDeclined: true,
      intent,
      requestedSupplyId: parsed.supplyId,
      supplier,
    });
  },
});

export const listInboxEvents = query({
  args: {
    limit: v.optional(v.number()),
    ownerExternalId: v.string(),
  },
  handler: async (ctx, args) => {
    const supplier = await getSupplierContext(ctx, args.ownerExternalId);

    if (!supplier) {
      return [];
    }

    const entries = await listInboxEntriesForSupplier(ctx, {
      includeDeclined: true,
      limit: Math.max(args.limit ?? DEFAULT_LIMIT, DEFAULT_LIMIT),
      supplier,
    });
    const declineDecisions = await ctx.db
      .query("supplierRequestDecisions")
      .withIndex("by_supplierUserId_and_createdAt", (queryBuilder) =>
        queryBuilder.eq("supplierUserId", supplier.user._id),
      )
      .order("desc")
      .take(args.limit ?? DEFAULT_LIMIT);

    const declineEvents = await Promise.all(
      declineDecisions.map(async (decision) => {
        const intent = await ctx.db.get(decision.intentId);
        return {
          createdAt: decision.updatedAt,
          data: {
            entryToken:
              decision.supplyId
                ? createInboxEntryToken({
                    intentId: decision.intentId,
                    supplyId: decision.supplyId,
                  })
                : null,
            reason: decision.reason ?? null,
            requestToken: decision.requestToken,
            title: intent?.title ?? "Request",
          },
          eventType: "inbox.declined",
          message: "Supplier declined this request.",
          status: "declined",
        };
      }),
    );

    return [
      ...entries.map((entry) => ({
        createdAt: entry.updatedAt,
        data: entry,
        eventType: `inbox.${entry.status}`,
        message: buildInboxEventMessage(entry.status, entry.title),
        status: entry.status,
      })),
      ...declineEvents,
    ]
      .sort((left, right) => right.createdAt - left.createdAt)
      .slice(0, args.limit ?? DEFAULT_LIMIT);
  },
});

export const getSupplierRequestView = query({
  args: {
    ownerExternalId: v.string(),
    requestToken: v.string(),
  },
  handler: async (ctx, args) => {
    const supplier = await getSupplierContext(ctx, args.ownerExternalId);
    const intentId = parsePublicRequestToken(args.requestToken);

    if (!supplier || !intentId) {
      return null;
    }

    const intent = await ctx.db.get(intentId);

    if (!intent || intent.visibility !== "public") {
      return null;
    }

    const bestEntry = await buildInboxEntryForIntent(ctx, {
      includeDeclined: true,
      intent,
      supplier,
    });

    if (!bestEntry) {
      return null;
    }

    const detail = await buildSupplierRequestDetail(ctx, {
      intent,
      requestToken: args.requestToken,
      supplier,
    });

    return {
      inbox: bestEntry,
      request: detail,
    };
  },
});

export const listSupplierRequestEvents = query({
  args: {
    ownerExternalId: v.string(),
    requestToken: v.string(),
  },
  handler: async (ctx, args) => {
    const supplier = await getSupplierContext(ctx, args.ownerExternalId);
    const intentId = parsePublicRequestToken(args.requestToken);

    if (!supplier || !intentId) {
      return [];
    }

    const intent = await ctx.db.get(intentId);

    if (!intent || intent.visibility !== "public") {
      return [];
    }

    const acceptedProposal = await getAcceptedProposalForIntent(ctx, intent.intentKey);
    const myProposal = await getSupplierProposalForIntent(ctx, intent.intentKey, supplier.user._id);
    const fulfillment = await getSupplierFulfillmentForIntent(
      ctx,
      intent.intentKey,
      supplier.user._id,
    );
    const transaction = acceptedProposal?._id
      ? await getTransactionByProposalId(ctx, acceptedProposal._id)
      : null;
    const payouts = transaction?._id
      ? await ctx.db
          .query("payouts")
          .withIndex("by_transactionId", (queryBuilder) =>
            queryBuilder.eq("transactionId", transaction._id),
          )
          .collect()
      : [];
    const declineDecision = await getSupplierDecision(ctx, supplier.user._id, intent._id);
    const activity = await ctx.db
      .query("activityEvents")
      .withIndex("by_entityType_and_entityId", (queryBuilder) =>
        queryBuilder.eq("entityType", "intent").eq("entityId", intent.intentKey),
      )
      .order("desc")
      .take(32);

    const events = activity.map((event) => ({
      createdAt: event.createdAt,
      data: safeParseJson(event.payload),
      eventType: event.type,
      message: mapActivityMessage(event.type),
      status: mapActivityStatus(event.type, intent.status),
    }));

    if (myProposal) {
      events.push({
        createdAt: myProposal.createdAt,
        data: {
          price: myProposal.price,
          proposalId: myProposal._id,
        },
        eventType: "request.proposed",
        message: "Supplier submitted a proposal.",
        status: myProposal.status === "accepted" ? "claimed" : "proposed",
      });
    }

    if (fulfillment) {
      events.push({
        createdAt: fulfillment.status === "fulfilled" ? Date.now() : intent.updatedAt,
        data: {
          fulfillmentId: fulfillment._id,
          status: fulfillment.status,
        },
        eventType: "request.fulfillment",
        message:
          fulfillment.status === "fulfilled"
            ? "Supplier delivered work."
            : "Supplier is responsible for delivery.",
        status: fulfillment.status === "fulfilled" ? "delivered" : "claimed",
      });
    }

    if (payouts.some((payout) => payout.payeeUserId === supplier.user._id)) {
      const payout = payouts.find((candidate) => candidate.payeeUserId === supplier.user._id)!;
      const payoutStatus =
        payout.status === "paid"
          ? "settled"
          : payout.status === "processing"
            ? "payout_processing"
            : payout.status === "failed"
              ? "payout_failed"
              : "payout_ready";
      const payoutMessage =
        payout.status === "paid"
          ? "Payout has been completed for the supplier."
          : payout.status === "processing"
            ? "Payout is being processed for the supplier."
            : payout.status === "failed"
              ? "Payout failed and needs operator attention."
              : "Payout is ready for the supplier.";
      events.push({
        createdAt: payout.updatedAt,
        data: {
          failureReason: payout.failureReason ?? null,
          payoutToken: createPayoutToken(payout._id),
          status: payout.status,
          txHash: payout.txHash ?? null,
        },
        eventType:
          payout.status === "paid"
            ? "request.payout_paid"
            : payout.status === "processing"
              ? "request.payout_processing"
              : payout.status === "failed"
                ? "request.payout_failed"
                : "request.payout_ready",
        message: payoutMessage,
        status: payoutStatus,
      });
    }

    if (declineDecision) {
      events.push({
        createdAt: declineDecision.updatedAt,
        data: {
          reason: declineDecision.reason ?? null,
        },
        eventType: "request.declined",
        message: "Supplier declined the request.",
        status: "declined",
      });
    }

    return events.sort((left, right) => left.createdAt - right.createdAt);
  },
});

export const recordRequestDecline = mutation({
  args: {
    ownerExternalId: v.string(),
    reason: v.optional(v.string()),
    requestToken: v.string(),
    supplyId: v.optional(v.id("supplies")),
  },
  handler: async (ctx, args) => {
    const supplier = await getSupplierContext(ctx, args.ownerExternalId);
    const intentId = parsePublicRequestToken(args.requestToken);

    if (!supplier || !intentId) {
      return { declined: false };
    }

    const intent = await ctx.db.get(intentId);

    if (!intent || intent.visibility !== "public") {
      return { declined: false };
    }

    const acceptedProposal = await getAcceptedProposalForIntent(ctx, intent.intentKey);

    if (acceptedProposal?.proposerUserId === supplier.user._id) {
      return { declined: false, reason: "already_claimed" as const };
    }

    const existing = await getSupplierDecision(ctx, supplier.user._id, intentId);
    const now = Date.now();

    if (existing) {
      await ctx.db.patch(existing._id, {
        reason: args.reason?.trim() || existing.reason,
        supplyId: args.supplyId ?? existing.supplyId,
        updatedAt: now,
      });
    } else {
      await ctx.db.insert("supplierRequestDecisions", {
        createdAt: now,
        intentId,
        reason: args.reason?.trim() || undefined,
        requestToken: args.requestToken,
        status: "declined",
        supplierUserId: supplier.user._id,
        supplyId: args.supplyId,
        updatedAt: now,
      });
    }

    await ctx.db.insert("activityEvents", {
      createdAt: now,
      entityId: intent.intentKey,
      entityType: "intent",
      payload: JSON.stringify({
        reason: args.reason?.trim() || null,
        supplierExternalId: args.ownerExternalId,
      }),
      type: "request.declined_by_supplier",
    });

    return { declined: true };
  },
});

export const claimMatchedRequest = mutation({
  args: {
    ownerDisplayName: v.optional(v.string()),
    ownerExternalId: v.string(),
    requestToken: v.string(),
    supplyId: v.optional(v.id("supplies")),
  },
  handler: async (ctx, args) => {
    const supplier = await getSupplierContext(ctx, args.ownerExternalId);
    const intentId = parsePublicRequestToken(args.requestToken);

    if (!supplier || !intentId) {
      return { claimed: false, reason: "not_found" as const };
    }

    const intent = await ctx.db.get(intentId);

    if (!intent || intent.visibility !== "public") {
      return { claimed: false, reason: "not_found" as const };
    }

    if (intent.ownerUserId === supplier.user._id) {
      return { claimed: false, reason: "cannot_claim_own_request" as const };
    }

    const bestMatch = await getBestSupplyMatchForIntent(ctx, {
      intent,
      requestedSupplyId: args.supplyId,
      supplier,
    });

    if (!bestMatch) {
      return { claimed: false, reason: "no_match" as const };
    }

    const gatedOutReasons = bestMatch.match.gatedOutReasons ?? [];
    if (gatedOutReasons.length > 0) {
      if (gatedOutReasons.includes("capacity exhausted")) {
        return { claimed: false, reason: "capacity_exhausted" as const };
      }

      if (gatedOutReasons.includes("currently unavailable")) {
        return { claimed: false, reason: "supplier_unavailable" as const };
      }

      return { claimed: false, reason: "gated_out" as const };
    }

    const supply = bestMatch.supply;
    const acceptedProposal = await getAcceptedProposalForIntent(ctx, intent.intentKey);

    if (acceptedProposal && acceptedProposal.proposerUserId !== supplier.user._id) {
      return { claimed: false, reason: "already_claimed" as const };
    }

    if (acceptedProposal && acceptedProposal.proposerUserId === supplier.user._id) {
      return {
        claimed: true,
        proposalId: acceptedProposal._id,
        requestToken: args.requestToken,
      };
    }

    if (typeof supply.priceAmount !== "number") {
      return { claimed: false, reason: "quote_required" as const };
    }

    const buyerWalletAccountId = await getDefaultBuyerWalletAccountId(ctx, intent.ownerUserId);

    if (!buyerWalletAccountId) {
      return { claimed: false, reason: "missing_buyer_wallet" as const };
    }

    const payoutWalletAccountId = await getDefaultPayoutWalletAccountId(ctx, supplier.user._id);

    if (!payoutWalletAccountId) {
      return { claimed: false, reason: "missing_payout_wallet" as const };
    }

    const buyerWalletContext = await getWalletAccountContext(ctx, buyerWalletAccountId);
    const payoutWalletContext = await getWalletAccountContext(ctx, payoutWalletAccountId);

    if (
      supply.priceAmount > 0 &&
      !areBorealNetworksCompatible({
        left: buyerWalletContext?.networkKey ?? null,
        right: payoutWalletContext?.networkKey ?? null,
      })
    ) {
      return { claimed: false, reason: "wallet_network_mismatch" as const };
    }

    const reservation = await reserveSupplyCapacity(ctx, supply._id);

    if (!reservation.reserved) {
      return {
        claimed: false,
        reason:
          reservation.reason === "capacity_exhausted"
            ? "capacity_exhausted"
            : reservation.reason === "unavailable"
              ? "supplier_unavailable"
              : "gated_out",
      };
    }

    const now = Date.now();
    const existingProposal = await getSupplierProposalForIntent(ctx, intent.intentKey, supplier.user._id);
    const proposalId =
      existingProposal?._id ??
      (await ctx.db.insert("proposals", {
        createdAt: now,
        currency: supply.currency,
        deliverablesBody: [
          `${supply.title}`,
          "",
          supply.description,
        ].join("\n"),
        deliverablesType: "markdown",
        environment: payoutWalletContext?.environment ?? buyerWalletContext?.environment,
        etaAt: estimateClaimEtaAt(now, supply.estimatedDeliveryLabel, supply.deliveryType),
        intentKey: intent.intentKey,
        isCollective: false,
        price: supply.priceAmount,
        proposerKind: supplier.user.actorKind,
        proposerUserId: supplier.user._id,
        scenarioId: getScenarioId("custom_scoped_work"),
        scenarioType: "custom_scoped_work",
        status: "accepted",
      }));

    const relatedProposals = await ctx.db
      .query("proposals")
      .withIndex("by_intentKey_and_createdAt", (queryBuilder) =>
        queryBuilder.eq("intentKey", intent.intentKey),
      )
      .order("asc")
      .take(32);

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

    await ctx.db.patch(intent._id, {
      approvedAt: intent.approvedAt ?? now,
      assignedAgent: supply.title,
      assignedToolNames: [supply.title, ...supply.capabilityTags.slice(0, 3)],
      startedAt: intent.startedAt ?? now,
      status: "claimed",
      updatedAt: now,
    });

    const sellerProfileId = await getProfileIdForUser(ctx, supplier.user._id);
    const transactionId = await ensureWorkTransaction(ctx, {
      amount: supply.priceAmount,
      buyerUserId: intent.ownerUserId,
      buyerWalletAccountId,
      chainFamily:
        payoutWalletContext?.chainFamily ?? buyerWalletContext?.chainFamily ?? undefined,
      chainId: payoutWalletContext?.chainId ?? buyerWalletContext?.chainId ?? undefined,
      currency: supply.currency,
      environment:
        payoutWalletContext?.environment ?? buyerWalletContext?.environment ?? undefined,
      intentId: intent._id,
      intentKey: intent.intentKey,
      networkKey:
        payoutWalletContext?.networkKey ?? buyerWalletContext?.networkKey ?? undefined,
      proposalId,
      sellerProfileId,
      sellerUserId: supplier.user._id,
      status: "active",
      titleSnapshot: intent.title,
    });
    const fulfillmentId = await ctx.db.insert("fulfillments", {
      acceptedProposalId: proposalId,
      environment:
        payoutWalletContext?.environment ?? buyerWalletContext?.environment ?? undefined,
      fulfillerUserId: supplier.user._id,
      intentKey: intent.intentKey,
      ownerUserId: intent.ownerUserId,
      scenarioId: getScenarioId("custom_scoped_work"),
      scenarioType: "custom_scoped_work",
      settlementStatus: supply.priceAmount > 0 ? "pending" : "not_applicable",
      status: "approved",
      supplyId: supply._id,
      transactionId,
    });

    await ensureSettlementForTransaction(ctx, {
      amount: supply.priceAmount,
      buyerWalletAccountId,
      chainFamily:
        payoutWalletContext?.chainFamily ?? buyerWalletContext?.chainFamily ?? undefined,
      chainId: payoutWalletContext?.chainId ?? buyerWalletContext?.chainId ?? undefined,
      currency: supply.currency,
      environment:
        payoutWalletContext?.environment ?? buyerWalletContext?.environment ?? undefined,
      networkKey:
        payoutWalletContext?.networkKey ?? buyerWalletContext?.networkKey ?? undefined,
      payoutWalletAccountId,
      protocol: null,
      status: supply.priceAmount > 0 ? "pending" : "not_applicable",
      transactionId,
    });

    await ctx.db.patch(transactionId, {
      fulfillmentId,
      updatedAt: now,
    });

    await clearSupplierDecision(ctx, supplier.user._id, intent._id);

    await ctx.db.insert("chatMessages", {
      body: `${supplier.user.displayName} claimed this request at ${supply.priceAmount} ${supply.currency}.`,
      conversationId: intent.conversationId ?? crypto.randomUUID(),
      createdAt: now,
      intentKey: intent.intentKey,
      messageId: crypto.randomUUID(),
      provider: intent.provider,
      role: "system",
      senderActorKind: supplier.user.actorKind,
      senderDisplayName: supplier.user.displayName,
      senderExternalId: args.ownerExternalId,
      senderHandle: supplier.user.handle,
    });

    await ctx.db.insert("activityEvents", {
      createdAt: now,
      entityId: intent.intentKey,
      entityType: "intent",
      payload: JSON.stringify({
        proposalId,
        supplierExternalId: args.ownerExternalId,
        supplyId: supply._id,
      }),
      type: "request.claimed_by_supplier",
    });

    await recordTransactionAuditEvent(ctx, {
      fulfillmentId,
      intentId: intent._id,
      message: `${supplier.user.displayName} claimed the request through the Boreal inbox.`,
      metadata: {
        price: supply.priceAmount,
        supplyId: supply._id,
      },
      proposalId,
      scenarioType: "custom_scoped_work",
      source: "proposal",
      stage: "approval",
      status: "passed",
      transactionId,
    });

    await refreshProfileAnalyticsForUser(ctx, supplier.user._id);
    await refreshProfileAnalyticsForUser(ctx, intent.ownerUserId);

    return {
      claimed: true,
      fulfillmentId,
      proposalId,
      requestToken: args.requestToken,
      transactionId,
    };
  },
});

export const listPayouts = query({
  args: {
    ownerExternalId: v.string(),
  },
  handler: async (ctx, args) => {
    const supplier = await getSupplierContext(ctx, args.ownerExternalId);

    if (!supplier) {
      return [];
    }

    const payouts = await ctx.db
      .query("payouts")
      .withIndex("by_payeeUserId_and_createdAt", (queryBuilder) =>
        queryBuilder.eq("payeeUserId", supplier.user._id),
      )
      .order("desc")
      .take(64);

    return Promise.all(
      payouts.map((payout) => mapPayoutRecord(ctx, payout)),
    );
  },
});

export const getPayout = query({
  args: {
    ownerExternalId: v.string(),
    payoutToken: v.string(),
  },
  handler: async (ctx, args) => {
    const supplier = await getSupplierContext(ctx, args.ownerExternalId);
    const payoutId = parsePayoutToken(args.payoutToken);

    if (!supplier || !payoutId) {
      return null;
    }

    const payout = await ctx.db.get(payoutId);

    if (!payout || payout.payeeUserId !== supplier.user._id) {
      return null;
    }

    return mapPayoutRecord(ctx, payout);
  },
});

async function listMarketIntents(ctx: QueryCtx, limit: number) {
  const intents = await ctx.db.query("intents").order("desc").take(Math.max(limit * 5, 80));

  return intents.filter(
    (intent) =>
      intent.visibility === "public" &&
      MARKET_OPEN_STATUSES.has(intent.status) &&
      !intent.needsClarification,
  );
}

async function listInboxEntriesForSupplier(
  ctx: QueryCtx,
  input: {
    includeDeclined: boolean;
    limit: number;
    supplier: NonNullable<Awaited<ReturnType<typeof getSupplierContext>>>;
  },
) {
  const intents = await listMarketIntents(ctx, input.limit);
  const entries = await Promise.all(
    intents.map((intent) =>
      buildInboxEntryForIntent(ctx, {
        includeDeclined: input.includeDeclined,
        intent,
        supplier: input.supplier,
      }),
    ),
  );

  return entries
    .filter(
      (
        entry,
      ): entry is NonNullable<typeof entry> => Boolean(entry),
    )
    .sort(compareInboxEntries)
    .slice(0, input.limit);
}

async function getSupplierContext(ctx: MutationCtx | QueryCtx, ownerExternalId: string) {
  const user = await getUserByExternalId(ctx, ownerExternalId);

  if (!user) {
    return null;
  }

  const supplies = await ctx.db
    .query("supplies")
    .withIndex("by_supplierUserId_and_status", (queryBuilder) =>
      queryBuilder.eq("supplierUserId", user._id).eq("status", "active"),
    )
    .collect();

  return {
    supplies,
    user,
  };
}

async function buildInboxEntryForIntent(
  ctx: QueryCtx,
  input: {
    includeDeclined: boolean;
    intent: Doc<"intents">;
    requestedSupplyId?: Id<"supplies">;
    supplier: Awaited<ReturnType<typeof getSupplierContext>>;
  },
) {
  const supplier = input.supplier;

  if (!supplier || input.intent.ownerUserId === supplier.user._id) {
    return null;
  }

  const bestMatch = await getBestSupplyMatchForIntent(ctx, {
    intent: input.intent,
    requestedSupplyId: input.requestedSupplyId,
    supplier,
  });

  if (!bestMatch || bestMatch.match.gatedOutReasons.length > 0) {
    return null;
  }

  const acceptedProposal = await getAcceptedProposalForIntent(ctx, input.intent.intentKey);

  if (acceptedProposal && acceptedProposal.proposerUserId !== supplier.user._id) {
    return null;
  }

  const myProposal = await getSupplierProposalForIntent(
    ctx,
    input.intent.intentKey,
    supplier.user._id,
  );
  const fulfillment = await getSupplierFulfillmentForIntent(
    ctx,
    input.intent.intentKey,
    supplier.user._id,
  );
  const decision = await getSupplierDecision(ctx, supplier.user._id, input.intent._id);
  const transaction = acceptedProposal?._id
    ? await getTransactionByProposalId(ctx, acceptedProposal._id)
    : null;
  const payouts = transaction?._id
    ? await ctx.db
        .query("payouts")
        .withIndex("by_transactionId", (queryBuilder) =>
          queryBuilder.eq("transactionId", transaction._id),
        )
        .collect()
    : [];
  const myPayout = payouts.find((payout) => payout.payeeUserId === supplier.user._id) ?? null;

  const derived = deriveSupplierRequestState({
    acceptedProposal,
    decision,
    fulfillment,
    intent: input.intent,
    myPayout,
    proposal: myProposal,
    supplierUserId: supplier.user._id,
  });

  if (!input.includeDeclined && derived.status === "declined") {
    return null;
  }

  const economics = buildInboxEconomics({
    acceptedProposal,
    proposal: myProposal,
    supply: bestMatch.supply,
  });
  const entryToken = createInboxEntryToken({
    intentId: input.intent._id,
    supplyId: bestMatch.supply._id,
  });
  const requestToken = createPublicRequestToken(input.intent._id);

  return {
    actions: {
      canClaim:
        derived.status === "matched" &&
        economics.payoutType === "fixed" &&
        typeof economics.amount === "number",
      canDecline: derived.status === "matched" || derived.status === "proposed",
      canDeliver: derived.status === "claimed",
      canPropose: derived.status === "matched" && input.intent.acceptsProposals,
    },
    delivery: {
      deadlineAt: input.intent.deadlineAt ?? null,
      kind:
        input.intent.requestedOutputTypes.length > 1
          ? "artifact_bundle"
          : input.intent.requestedOutputTypes[0],
      outputKinds: input.intent.requestedOutputTypes,
    },
    economics,
    entryToken,
    match: {
      matchedSupplyId: bestMatch.supply._id,
      matchedSupplyTitle: bestMatch.supply.title,
      reasons: bestMatch.match.matchReasons,
      score: bestMatch.match.matchScore ?? 0,
    },
    requestToken,
    status: derived.status,
    summary: input.intent.summary,
    title: input.intent.title,
    tracking: {
      eventsUrl: `/api/v1/requests/${requestToken}/events`,
      requestUrl: `/api/v1/requests/${requestToken}`,
    },
    updatedAt: derived.updatedAt,
  };
}

async function buildSupplierRequestDetail(
  ctx: QueryCtx,
  input: {
    intent: Doc<"intents">;
    requestToken: string;
    supplier: Awaited<ReturnType<typeof getSupplierContext>>;
  },
) {
  const supplier = input.supplier!;
  const acceptedProposal = await getAcceptedProposalForIntent(ctx, input.intent.intentKey);
  const fulfillment = await getSupplierFulfillmentForIntent(
    ctx,
    input.intent.intentKey,
    supplier.user._id,
  );
  const participants = await getRequestParticipants(ctx, input.intent, acceptedProposal);

  return {
    access: {
      canClaim: !acceptedProposal,
      canDeliver:
        acceptedProposal?.proposerUserId === supplier.user._id &&
        fulfillment?.status !== "fulfilled",
      canPropose: input.intent.acceptsProposals && !acceptedProposal,
      visibility: input.intent.visibility,
    },
    assignment: {
      agent: input.intent.assignedAgent ?? null,
      tools: input.intent.assignedToolNames ?? [],
    },
    participants,
    requestToken: input.requestToken,
    request: {
      _id: input.intent._id,
      body: input.intent.body,
      category: input.intent.category,
      requestedOutputTypes: input.intent.requestedOutputTypes,
      routeTarget: input.intent.routeTarget ?? "general_assistance",
      status: input.intent.status,
      summary: input.intent.summary,
      title: input.intent.title,
      visibility: input.intent.visibility,
    },
  };
}

async function getBestSupplyMatchForIntent(
  ctx: QueryCtx | MutationCtx,
  input: {
    intent: Doc<"intents">;
    requestedSupplyId?: Id<"supplies">;
    supplier: NonNullable<Awaited<ReturnType<typeof getSupplierContext>>>;
  },
) {
  const supplyIds = new Set(
    input.supplier.supplies
      .filter((supply) => !input.requestedSupplyId || supply._id === input.requestedSupplyId)
      .map((supply) => String(supply._id)),
  );

  if (supplyIds.size === 0) {
    return null;
  }

  const candidates = await listIntentMatchCandidates(
    ctx,
    {
      _id: input.intent._id,
      body: input.intent.body,
      budgetMax: input.intent.budgetMax,
      budgetMin: input.intent.budgetMin,
      capabilityTags: input.intent.capabilityTags,
      catalogQuery: input.intent.catalogQuery,
      category: input.intent.category,
      deadlineAt: input.intent.deadlineAt,
      embedding: input.intent.embedding,
      intentKey: input.intent.intentKey,
      keywords: input.intent.keywords,
      pinnedSupplyIds: input.intent.pinnedSupplyIds ?? [],
      requestedOutputTypes: input.intent.requestedOutputTypes,
      summary: input.intent.summary,
      title: input.intent.title,
    },
    24,
  );
  const candidate = candidates.find((entry) => supplyIds.has(String(entry._id)));

  if (!candidate) {
    return null;
  }

  const supply = input.supplier.supplies.find((entry) => entry._id === candidate._id);

  if (!supply) {
    return null;
  }

  return {
    match: candidate,
    supply,
  };
}

function buildInboxEconomics(input: {
  acceptedProposal:
    | Doc<"proposals">
    | null;
  proposal:
    | Doc<"proposals">
    | null;
  supply: Doc<"supplies">;
}) {
  if (input.acceptedProposal) {
    return {
      amount: input.acceptedProposal.price,
      currency: input.acceptedProposal.currency,
      networkKey: "solana:devnet",
      payoutType: "proposal_locked" as const,
    };
  }

  if (input.proposal) {
    return {
      amount: input.proposal.price,
      currency: input.proposal.currency,
      networkKey: "solana:devnet",
      payoutType: "proposal_required" as const,
    };
  }

  return {
    amount: input.supply.priceAmount ?? null,
    currency: input.supply.currency,
    networkKey: "solana:devnet",
    payoutType:
      typeof input.supply.priceAmount === "number" &&
      !(input.supply.requiresHumanApproval ?? false)
        ? ("fixed" as const)
        : ("proposal_required" as const),
  };
}

function deriveSupplierRequestState(input: {
  acceptedProposal: Doc<"proposals"> | null;
  decision: Doc<"supplierRequestDecisions"> | null;
  fulfillment: Doc<"fulfillments"> | null;
  intent: Doc<"intents">;
  myPayout: Doc<"payouts"> | null;
  proposal: Doc<"proposals"> | null;
  supplierUserId: string;
}) {
  if (input.myPayout) {
    if (input.myPayout.status === "paid") {
      return {
        status: "settled" as const,
        updatedAt: input.myPayout.updatedAt,
      };
    }

    if (input.myPayout.status === "processing") {
      return {
        status: "payout_processing" as const,
        updatedAt: input.myPayout.updatedAt,
      };
    }

    if (input.myPayout.status === "failed") {
      return {
        status: "payout_failed" as const,
        updatedAt: input.myPayout.updatedAt,
      };
    }

    return {
      status: "payout_ready" as const,
      updatedAt: input.myPayout.updatedAt,
    };
  }

  if (
    input.fulfillment?.status === "fulfilled" ||
    (input.acceptedProposal?.proposerUserId === input.supplierUserId &&
      input.intent.status === "fulfilled")
  ) {
    return {
      status: "delivered" as const,
      updatedAt: input.intent.updatedAt,
    };
  }

  if (
    input.acceptedProposal?.proposerUserId === input.supplierUserId &&
    input.fulfillment
  ) {
    return {
      status: "claimed" as const,
      updatedAt: input.intent.updatedAt,
    };
  }

  if (input.proposal && input.proposal.status !== "accepted") {
    return {
      status: "proposed" as const,
      updatedAt: input.proposal.createdAt,
    };
  }

  if (input.decision?.status === "declined") {
    return {
      status: "declined" as const,
      updatedAt: input.decision.updatedAt,
    };
  }

  return {
    status: "matched" as const,
    updatedAt: input.intent.updatedAt,
  };
}

async function getAcceptedProposalForIntent(
  ctx: QueryCtx | MutationCtx,
  intentKey: string,
) {
  return ctx.db
    .query("proposals")
    .withIndex("by_intentKey_and_status", (queryBuilder) =>
      queryBuilder.eq("intentKey", intentKey).eq("status", "accepted"),
    )
    .unique();
}

async function getSupplierProposalForIntent(
  ctx: QueryCtx | MutationCtx,
  intentKey: string,
  supplierUserId: string,
) {
  const proposals = await ctx.db
    .query("proposals")
    .withIndex("by_intentKey_and_createdAt", (queryBuilder) =>
      queryBuilder.eq("intentKey", intentKey),
    )
    .order("desc")
    .take(16);

  return (
    proposals.find((proposal) => proposal.proposerUserId === supplierUserId) ?? null
  );
}

async function getSupplierFulfillmentForIntent(
  ctx: QueryCtx | MutationCtx,
  intentKey: string,
  supplierUserId: string,
) {
  const fulfillments = await ctx.db
    .query("fulfillments")
    .withIndex("by_fulfillerUserId", (queryBuilder) =>
      queryBuilder.eq("fulfillerUserId", supplierUserId),
    )
    .collect();

  return fulfillments.find((fulfillment) => fulfillment.intentKey === intentKey) ?? null;
}

async function getTransactionByProposalId(
  ctx: QueryCtx | MutationCtx,
  proposalId: Id<"proposals">,
) {
  return ctx.db
    .query("transactions")
    .withIndex("by_proposalId", (queryBuilder) =>
      queryBuilder.eq("proposalId", proposalId),
    )
    .unique();
}

async function getSupplierDecision(
  ctx: QueryCtx | MutationCtx,
  supplierUserId: string,
  intentId: Id<"intents">,
) {
  return ctx.db
    .query("supplierRequestDecisions")
    .withIndex("by_supplierUserId_and_intentId", (queryBuilder) =>
      queryBuilder.eq("supplierUserId", supplierUserId).eq("intentId", intentId),
    )
    .unique();
}

async function clearSupplierDecision(
  ctx: MutationCtx,
  supplierUserId: string,
  intentId: Id<"intents">,
) {
  const decision = await getSupplierDecision(ctx, supplierUserId, intentId);

  if (decision) {
    await ctx.db.delete(decision._id);
  }
}

async function getUserByExternalId(
  ctx: QueryCtx | MutationCtx,
  externalId: string,
) {
  return ctx.db
    .query("users")
    .withIndex("by_externalId", (queryBuilder) =>
      queryBuilder.eq("externalId", externalId),
    )
    .unique();
}

async function getRequestParticipants(
  ctx: QueryCtx,
  intent: Doc<"intents">,
  acceptedProposal: Doc<"proposals"> | null,
) {
  const participants: Array<{
    displayName: string;
    externalId: string | null;
    handle: string | null;
    kind: string;
    status: string;
  }> = [];

  if (intent.ownerUserId) {
    const owner = (await ctx.db.get(intent.ownerUserId as never)) as
      | {
          actorKind: "agent" | "human" | "tool";
          displayName: string;
          externalId?: string;
          handle?: string;
        }
      | null;

    if (owner) {
      participants.push({
        displayName: owner.displayName,
        externalId: owner.externalId ?? null,
        handle: owner.handle ?? null,
        kind: owner.actorKind,
        status: "owner",
      });
    }
  }

  if (acceptedProposal?.proposerUserId) {
    const supplier = (await ctx.db.get(acceptedProposal.proposerUserId as never)) as
      | {
          actorKind: "agent" | "human" | "tool";
          displayName: string;
          externalId?: string;
          handle?: string;
        }
      | null;

    if (supplier) {
      participants.push({
        displayName: supplier.displayName,
        externalId: supplier.externalId ?? null,
        handle: supplier.handle ?? null,
        kind: supplier.actorKind,
        status: acceptedProposal.status,
      });
    }
  }

  if (intent.assignedAgent) {
    participants.push({
      displayName: intent.assignedAgent,
      externalId: intent.assignedAgent.toLowerCase().includes("boreal") ? "agent:boreal" : null,
      handle: intent.assignedAgent.toLowerCase().includes("boreal") ? "boreal" : null,
      kind: intent.assignedAgent.toLowerCase().includes("boreal") ? "agent" : "tool",
      status: intent.status,
    });
  }

  return participants;
}

async function mapPayoutRecord(ctx: QueryCtx, payout: Doc<"payouts">) {
  const transaction = await ctx.db.get(payout.transactionId);
  const settlement = payout.settlementId ? await ctx.db.get(payout.settlementId) : null;
  const intent = transaction?.intentId ? await ctx.db.get(transaction.intentId) : null;

  return {
    amount: payout.amount,
    createdAt: payout.createdAt,
    currency: payout.currency,
    failureReason: payout.failureReason ?? null,
    networkKey: payout.networkKey ?? null,
    paidAt: payout.paidAt ?? null,
    payoutToken: createPayoutToken(payout._id),
    processingStartedAt: payout.processingStartedAt ?? null,
    processor: payout.processor ?? null,
    request: intent
      ? {
          requestToken: createPublicRequestToken(intent._id),
          status: intent.status,
          summary: intent.summary,
          title: intent.title,
        }
      : null,
    settlementStatus: settlement?.status ?? null,
    status: payout.status,
    transactionStatus: transaction?.status ?? null,
    txHash: payout.txHash ?? null,
    updatedAt: payout.updatedAt,
    walletAccountId: payout.walletAccountId ?? null,
  };
}

function compareInboxEntries(
  left: {
    match: { score: number };
    status: string;
    updatedAt: number;
  },
  right: {
    match: { score: number };
    status: string;
    updatedAt: number;
  },
) {
  return (
    getInboxStatusPriority(right.status) - getInboxStatusPriority(left.status) ||
    right.match.score - left.match.score ||
    right.updatedAt - left.updatedAt
  );
}

function getInboxStatusPriority(status: string) {
  switch (status) {
    case "settled":
      return 120;
    case "payout_processing":
      return 110;
    case "payout_failed":
      return 105;
    case "claimed":
      return 100;
    case "matched":
      return 90;
    case "proposed":
      return 80;
    case "delivered":
      return 70;
    case "payout_ready":
      return 60;
    case "declined":
      return 10;
    default:
      return 20;
  }
}

function buildInboxEventMessage(status: string, title: string) {
  switch (status) {
    case "settled":
      return `Payout settled for ${title}.`;
    case "payout_processing":
      return `Payout is processing for ${title}.`;
    case "payout_failed":
      return `Payout failed for ${title}.`;
    case "claimed":
      return `You are assigned to ${title}.`;
    case "proposed":
      return `You proposed on ${title}.`;
    case "delivered":
      return `You delivered work for ${title}.`;
    case "payout_ready":
      return `Payout is ready for ${title}.`;
    case "declined":
      return `You declined ${title}.`;
    case "matched":
    default:
      return `${title} matches your supply.`;
  }
}

function mapActivityMessage(type: string) {
  switch (type) {
    case "proposal.submitted":
      return "A proposal was submitted on this request.";
    case "proposal.approved":
      return "A supplier was approved on this request.";
    case "fulfillment.submitted":
      return "Work was submitted on this request.";
    case "request.claimed_by_supplier":
      return "A supplier claimed this request.";
    default:
      return type;
  }
}

function mapActivityStatus(type: string, fallbackStatus: string) {
  switch (type) {
    case "proposal.submitted":
      return "proposed";
    case "proposal.approved":
    case "request.claimed_by_supplier":
      return "claimed";
    case "fulfillment.submitted":
      return "delivered";
    default:
      return fallbackStatus;
  }
}

function safeParseJson(value?: string) {
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value) as Record<string, unknown>;
  } catch {
    return null;
  }
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
