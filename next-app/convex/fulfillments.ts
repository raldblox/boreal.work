import type { Id } from "./_generated/dataModel";
import { internalMutation, mutation, type MutationCtx } from "./_generated/server";
import { v } from "convex/values";

import {
  type CommerceChainFamily,
  type CommerceEnvironment,
  type CommerceNetworkKey,
  ensureSettlementForTransaction,
  ensureWorkTransaction,
  getDefaultPayoutWalletAccountId,
  getCommerceEnvironment,
  getProfileIdForUser,
  updateTransactionById,
} from "./commerceCore";
import {
  buildCollectivePayoutAllocations,
  proposalIncludesParticipant,
  resolveCollectiveParticipants,
} from "./collectives";
import { createPayoutToken, createPublicRequestToken } from "../lib/boreal/one-inbox/tokens";
import { refreshProfileAnalyticsForUser } from "./profileAnalytics";
import { releaseSupplyCapacity } from "./supplies";
import { getScenarioId, recordTransactionAuditEvent } from "./transactionScenarios";
import { queueWebhookDeliveries } from "./webhooks";

function normalizeStoredEnvironment(
  environment?: CommerceEnvironment | "devnet" | null,
): CommerceEnvironment | undefined {
  if (!environment) {
    return undefined;
  }

  return getCommerceEnvironment(environment);
}

function normalizeStoredFulfillmentEnvironment<T extends {
  environment?: CommerceEnvironment | "devnet";
}>(
  fulfillment: T,
): Omit<T, "environment"> & { environment?: CommerceEnvironment } {
  return {
    ...fulfillment,
    environment: normalizeStoredEnvironment(fulfillment.environment),
  };
}

export const submitWork = mutation({
  args: {
    artifact: v.optional(
      v.object({
        artifactKind: v.union(
          v.literal("image"),
          v.literal("audio"),
          v.literal("video"),
        ),
        mediaType: v.optional(v.string()),
        metadataJson: v.optional(v.string()),
        remoteId: v.optional(v.string()),
        status: v.union(
          v.literal("ready"),
          v.literal("queued"),
          v.literal("in_progress"),
          v.literal("failed"),
        ),
        subtitle: v.string(),
        title: v.string(),
      }),
    ),
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
    deliveryStage: v.optional(
      v.union(v.literal("delivered"), v.literal("started")),
    ),
    intentId: v.id("intents"),
    workerDisplayName: v.optional(v.string()),
    workerExternalId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const intent = await ctx.db.get(args.intentId);

    if (!intent || !intent.ownerUserId || !args.workerExternalId) {
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
      (proposal) =>
        proposalIncludesParticipant(proposal, {
          externalId: args.workerExternalId,
          userId: worker._id,
        }),
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
      (fulfillment) =>
        fulfillment.acceptedProposalId === acceptedProposal._id ||
        fulfillment.fulfillerUserId === worker._id,
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
        sellerUserId: acceptedProposal.proposerUserId,
        status: "active",
        titleSnapshot: intent.title,
      }));

    if (!activeFulfillment.transactionId) {
      await ctx.db.patch(activeFulfillment._id, {
        transactionId,
      });
    }
    const workerIdentity = {
      actorKind: worker.actorKind,
      displayName: args.workerDisplayName ?? worker.displayName ?? "Worker",
      externalId: args.workerExternalId ?? worker.externalId ?? null,
      handle: worker.handle ?? null,
      userId: worker._id,
    };
    const normalizedActiveFulfillment = normalizeStoredFulfillmentEnvironment(
      activeFulfillment,
    );
    const scopedIntent = {
      ...intent,
      ownerUserId: intent.ownerUserId,
    };

    if (args.deliveryStage === "started") {
      await recordAcceptedFulfillmentStart(ctx, {
        acceptedProposal,
        artifact: args.artifact,
        attachments: args.attachments,
        deliverablesBody: args.deliverablesBody,
        fulfillment: normalizedActiveFulfillment,
        intent: scopedIntent,
        now,
        transactionId,
        worker: workerIdentity,
      });

      return { submitted: true };
    }

    await finalizeAcceptedFulfillmentDelivery(ctx, {
      acceptedProposal,
      artifact: args.artifact,
      attachments: args.attachments,
      deliverablesBody: args.deliverablesBody,
      fulfillment: normalizedActiveFulfillment,
      intent: scopedIntent,
      now,
      postTimelineMessage: true,
      transactionId,
      worker: workerIdentity,
    });

    return { submitted: true };
  },
});

export const finalizeQueuedArtifactFulfillment = internalMutation({
  args: {
    intentKey: v.string(),
    summary: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const state = await resolveAcceptedFulfillmentState(ctx, args.intentKey);

    if (!state.intent || !state.acceptedProposal || !state.fulfillment) {
      return { finalized: false, reason: "fulfillment_not_found" as const };
    }

    if (!state.intent.ownerUserId) {
      return { finalized: false, reason: "owner_not_found" as const };
    }

    if (state.fulfillment.status === "fulfilled" || state.intent.status === "fulfilled") {
      return { finalized: true, reason: "already_finalized" as const };
    }

    const worker = await getWorkerIdentity(ctx, state.fulfillment.fulfillerUserId);

    if (!worker) {
      return { finalized: false, reason: "worker_not_found" as const };
    }

    await finalizeAcceptedFulfillmentDelivery(ctx, {
      acceptedProposal: state.acceptedProposal,
      artifact: undefined,
      attachments: undefined,
      deliverablesBody:
        args.summary ??
        state.fulfillment.completedSummary ??
        "Video completed. Playback and download are available in this request.",
      fulfillment: normalizeStoredFulfillmentEnvironment(state.fulfillment),
      intent: {
        ...state.intent,
        ownerUserId: state.intent.ownerUserId,
      },
      now: Date.now(),
      postTimelineMessage: false,
      transactionId: state.fulfillment.transactionId,
      worker,
    });

    return { finalized: true, reason: "finalized" as const };
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
        environment:
          normalizeStoredEnvironment(activeFulfillment.environment) ??
          getCommerceEnvironment(),
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
        environment: getCommerceEnvironment(transaction?.environment),
        networkKey: transaction?.networkKey,
        protocol: transaction?.paymentProtocol ?? null,
        status:
          acceptedProposal && acceptedProposal.price > 0
            ? "ready_for_payout"
            : "not_applicable",
        transactionId,
      });

      const payoutTargets =
        acceptedProposal && acceptedProposal.price > 0
          ? await ensurePayoutRecordsForProposal(ctx, {
              amount: transaction?.amount ?? acceptedProposal.price,
              chainFamily: transaction?.chainFamily,
              currency: transaction?.currency ?? acceptedProposal.currency,
              environment: getCommerceEnvironment(transaction?.environment),
              networkKey: transaction?.networkKey,
              proposal: acceptedProposal,
              settlementId,
              transactionId,
            })
          : [];

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
          collectiveMembers: acceptedProposal?.collectiveMembers ?? null,
          fulfillmentId,
          memberRoles: acceptedProposal?.memberRoles ?? null,
          settlementStatus:
            acceptedProposal && acceptedProposal.price > 0
              ? "ready_for_payout"
              : "not_applicable",
          splitPlan: acceptedProposal?.splitPlan ?? null,
          transactionId,
        },
        eventType: "inbox.delivered",
        message: "Owner marked the request fulfilled.",
        ownerExternalId: proposerExternalId,
        requestToken: createPublicRequestToken(intent._id),
        status: "delivered",
        stream: "inbox",
      });

      if (acceptedProposal && acceptedProposal.price > 0 && payoutTargets.length > 0) {
        await queuePayoutReadyWebhooks(ctx, {
          collectiveMembers: acceptedProposal.collectiveMembers ?? null,
          fallbackExternalId: proposerExternalId,
          memberRoles: acceptedProposal.memberRoles ?? null,
          payoutTargets,
          requestToken: createPublicRequestToken(intent._id),
          splitPlan: acceptedProposal.splitPlan ?? null,
          transactionId,
        });
      }
    }

    return { fulfilled: true };
  },
});

async function recordAcceptedFulfillmentStart(
  ctx: MutationCtx,
  input: {
    acceptedProposal: {
      _id: string;
      currency: string;
      price: number;
    };
    artifact?: {
      artifactKind: "audio" | "image" | "video";
      mediaType?: string;
      metadataJson?: string;
      remoteId?: string;
      status: "failed" | "in_progress" | "queued" | "ready";
      subtitle: string;
      title: string;
    };
    attachments?: Array<{
      fileName: string;
      mediaType: string;
      sizeBytes: number;
      storageId: Id<"_storage">;
    }>;
    deliverablesBody: string;
    fulfillment: {
      _id: Id<"fulfillments">;
      environment?: CommerceEnvironment;
      fulfillerUserId?: string;
      intentKey: string;
      scenarioId?: string;
      supplyId?: Id<"supplies">;
      transactionId?: Id<"transactions">;
    };
    intent: {
      _id: Id<"intents">;
      _creationTime: number;
      conversationId?: string;
      intentKey: string;
      ownerUserId: string;
      startedAt?: number;
      status: string;
    };
    now: number;
    transactionId: Id<"transactions">;
    worker: WorkerIdentity;
  },
) {
  await ctx.db.patch(input.fulfillment._id, {
    completedSummary: input.deliverablesBody,
    environment: input.fulfillment.environment ?? getCommerceEnvironment(),
    fulfillerUserId: input.worker.userId,
    scenarioId:
      input.fulfillment.scenarioId ?? getScenarioId("custom_scoped_work"),
    settlementStatus:
      input.acceptedProposal.price > 0 ? "pending" : "not_applicable",
    status: "active",
  });

  await ctx.db.insert("evidences", {
    attachments:
      input.attachments && input.attachments.length > 0 ? input.attachments : undefined,
    body: input.deliverablesBody,
    createdAt: input.now,
    fulfillmentId: input.fulfillment._id,
    mediaType: "text/markdown",
    url: undefined,
  });

  if (input.artifact) {
    await upsertArtifactRecord(ctx, {
      artifact: input.artifact,
      conversationId: input.intent.conversationId ?? crypto.randomUUID(),
      intentKey: input.intent.intentKey,
      now: input.now,
    });
  }

  await ctx.db.patch(input.intent._id, {
    startedAt: input.intent.startedAt ?? input.now,
    status: "in_progress",
    updatedAt: input.now,
  });

  await ctx.db.insert("chatMessages", {
    body:
      input.artifact?.artifactKind === "video"
        ? `${input.worker.displayName} started the render. Playback will appear in this request when ready.`
        : `${input.worker.displayName} started the work.`,
    conversationId: input.intent.conversationId ?? crypto.randomUUID(),
    createdAt: input.now,
    intentKey: input.intent.intentKey,
    messageId: crypto.randomUUID(),
    provider: "boreal-agent",
    role: "assistant",
    senderActorKind: input.worker.actorKind,
    senderDisplayName: input.worker.displayName,
    senderExternalId: input.worker.externalId ?? undefined,
    senderHandle: input.worker.handle ?? undefined,
  });

  await ctx.db.insert("activityEvents", {
    createdAt: input.now,
    entityId: input.intent.intentKey,
    entityType: "intent",
    payload: JSON.stringify({
      attachmentCount: input.attachments?.length ?? 0,
      artifactKind: input.artifact?.artifactKind ?? null,
      proposerUserId: input.worker.userId,
      status: "in_progress",
    }),
    type: "fulfillment.started",
  });

  await refreshProfileAnalyticsForUser(ctx, input.worker.userId);
  await refreshProfileAnalyticsForUser(ctx, input.intent.ownerUserId);

  await updateTransactionById(ctx, input.transactionId, {
    fulfillmentId: input.fulfillment._id,
    settlementStatus:
      input.acceptedProposal.price > 0 ? "pending" : "not_applicable",
    status: "active",
  });
}

async function finalizeAcceptedFulfillmentDelivery(
  ctx: MutationCtx,
  input: {
    acceptedProposal: {
      _id: string;
      collectiveMembers?: string[];
      currency: string;
      memberRoles?: Array<{ memberId: string; role: string }>;
      price: number;
      proposerUserId?: string;
      splitPlan?: Array<{ memberId: string; percent: number }>;
    };
    artifact?: {
      artifactKind: "audio" | "image" | "video";
      mediaType?: string;
      metadataJson?: string;
      remoteId?: string;
      status: "failed" | "in_progress" | "queued" | "ready";
      subtitle: string;
      title: string;
    };
    attachments?: Array<{
      fileName: string;
      mediaType: string;
      sizeBytes: number;
      storageId: Id<"_storage">;
    }>;
    deliverablesBody: string;
    fulfillment: {
      _id: Id<"fulfillments">;
      completedSummary?: string;
      environment?: CommerceEnvironment;
      fulfillerUserId?: string;
      intentKey: string;
      scenarioId?: string;
      supplyId?: Id<"supplies">;
      transactionId?: Id<"transactions">;
    };
    intent: {
      _id: Id<"intents">;
      _creationTime: number;
      conversationId?: string;
      intentKey: string;
      ownerUserId: string;
      reviewRating?: number;
      startedAt?: number;
      status: string;
      title?: string;
    };
    now: number;
    postTimelineMessage: boolean;
    transactionId?: Id<"transactions">;
    worker: WorkerIdentity;
  },
) {
  const transactionId =
    input.transactionId ??
    input.fulfillment.transactionId ??
    (await ensureWorkTransaction(ctx, {
      amount: input.acceptedProposal.price,
      buyerUserId: input.intent.ownerUserId,
      currency: input.acceptedProposal.currency,
      environment: getCommerceEnvironment(),
      intentId: input.intent._id,
      intentKey: input.intent.intentKey,
      proposalId: input.acceptedProposal._id as never,
      sellerUserId: input.acceptedProposal.proposerUserId,
      status: "fulfilled",
      titleSnapshot: input.intent.title ?? input.intent.intentKey,
    }));

  await ctx.db.patch(input.fulfillment._id, {
    completedSummary: input.deliverablesBody,
    environment: input.fulfillment.environment ?? getCommerceEnvironment(),
    fulfillerUserId: input.worker.userId,
    scenarioId:
      input.fulfillment.scenarioId ?? getScenarioId("custom_scoped_work"),
    settlementStatus:
      input.acceptedProposal.price > 0 ? "ready_for_payout" : "not_applicable",
    status: "fulfilled",
    transactionId,
  });

  await releaseSupplyCapacity(ctx, input.fulfillment.supplyId);

  const hasEvidence = await hasFulfillmentEvidence(ctx, input.fulfillment._id);
  if (!hasEvidence) {
    await ctx.db.insert("evidences", {
      attachments:
        input.attachments && input.attachments.length > 0 ? input.attachments : undefined,
      body: input.deliverablesBody,
      createdAt: input.now,
      fulfillmentId: input.fulfillment._id,
      mediaType: "text/markdown",
      url: undefined,
    });
  }

  if (input.artifact) {
    await upsertArtifactRecord(ctx, {
      artifact: input.artifact,
      conversationId: input.intent.conversationId ?? crypto.randomUUID(),
      intentKey: input.intent.intentKey,
      now: input.now,
    });
  }

  await ctx.db.patch(input.intent._id, {
    completedAt: input.now,
    reviewRating: input.intent.reviewRating,
    startedAt: input.intent.startedAt ?? input.now,
    status: "fulfilled",
    updatedAt: input.now,
  });

  if (input.postTimelineMessage) {
    await ctx.db.insert("chatMessages", {
      body: `${input.worker.displayName} submitted the work.`,
      conversationId: input.intent.conversationId ?? crypto.randomUUID(),
      intentKey: input.intent.intentKey,
      messageId: crypto.randomUUID(),
      provider: "boreal-agent",
      role: "user",
      senderActorKind: input.worker.actorKind,
      senderDisplayName: input.worker.displayName,
      senderExternalId: input.worker.externalId ?? undefined,
      senderHandle: input.worker.handle ?? undefined,
      createdAt: input.now,
    });
  }

  await ctx.db.insert("activityEvents", {
    createdAt: input.now,
    entityId: input.intent.intentKey,
    entityType: "intent",
    payload: JSON.stringify({
      attachmentCount: input.attachments?.length ?? 0,
      artifactKind: input.artifact?.artifactKind ?? null,
      proposerUserId: input.worker.userId,
    }),
    type: "fulfillment.submitted",
  });

  await refreshProfileAnalyticsForUser(ctx, input.worker.userId);
  await refreshProfileAnalyticsForUser(ctx, input.intent.ownerUserId);

  await updateTransactionById(ctx, transactionId, {
    fulfillmentId: input.fulfillment._id,
    settlementStatus:
      input.acceptedProposal.price > 0 ? "ready_for_payout" : "not_applicable",
    status: "fulfilled",
  });

  const transaction = await ctx.db.get(transactionId);
  const settlementId = await ensureSettlementForTransaction(ctx, {
    amount: transaction?.amount ?? input.acceptedProposal.price,
    chainFamily: transaction?.chainFamily,
    currency: transaction?.currency ?? input.acceptedProposal.currency,
    environment: getCommerceEnvironment(transaction?.environment),
    networkKey: transaction?.networkKey,
    protocol: transaction?.paymentProtocol ?? null,
    status:
      input.acceptedProposal.price > 0 ? "ready_for_payout" : "not_applicable",
    transactionId,
  });

  const payoutTargets =
    input.acceptedProposal.price > 0
      ? await ensurePayoutRecordsForProposal(ctx, {
          amount: transaction?.amount ?? input.acceptedProposal.price,
          chainFamily: transaction?.chainFamily,
          currency: transaction?.currency ?? input.acceptedProposal.currency,
          environment: getCommerceEnvironment(transaction?.environment),
          networkKey: transaction?.networkKey,
          proposal: input.acceptedProposal,
          settlementId,
          transactionId,
        })
      : [];

  await recordTransactionAuditEvent(ctx, {
    fulfillmentId: input.fulfillment._id,
    intentId: input.intent._id,
    message: `${input.worker.displayName} submitted final work.`,
    metadata: {
      attachmentCount: input.attachments?.length ?? 0,
    },
    proposalId: input.acceptedProposal._id as never,
    scenarioType: "custom_scoped_work",
    source: "fulfillment",
    stage: "delivery",
    status: "passed",
    transactionId,
  });

  await recordTransactionAuditEvent(ctx, {
    fulfillmentId: input.fulfillment._id,
    intentId: input.intent._id,
    message: "Settlement is ready for payout after work delivery.",
    metadata: {
      settlementStatus:
        input.acceptedProposal.price > 0 ? "ready_for_payout" : "not_applicable",
    },
    proposalId: input.acceptedProposal._id as never,
    scenarioType: "custom_scoped_work",
    settlementId,
    source: "fulfillment",
    stage: "settlement",
    status: input.acceptedProposal.price > 0 ? "passed" : "info",
    transactionId,
  });

  await queueWebhookDeliveries(ctx, {
    data: {
      collectiveMembers: input.acceptedProposal.collectiveMembers ?? null,
      fulfillmentId: input.fulfillment._id,
      memberRoles: input.acceptedProposal.memberRoles ?? null,
      settlementStatus:
        input.acceptedProposal.price > 0 ? "ready_for_payout" : "not_applicable",
      splitPlan: input.acceptedProposal.splitPlan ?? null,
      transactionId,
    },
    eventType: "inbox.delivered",
    message: "Supplier delivered work.",
    ownerExternalId: input.worker.externalId,
    requestToken: createPublicRequestToken(input.intent._id),
    status: "delivered",
    stream: "inbox",
  });

  if (input.acceptedProposal.price > 0 && payoutTargets.length > 0) {
    await queuePayoutReadyWebhooks(ctx, {
      collectiveMembers: input.acceptedProposal.collectiveMembers ?? null,
      fallbackExternalId: input.worker.externalId,
      memberRoles: input.acceptedProposal.memberRoles ?? null,
      payoutTargets,
      requestToken: createPublicRequestToken(input.intent._id),
      splitPlan: input.acceptedProposal.splitPlan ?? null,
      transactionId,
    });
  }
}

async function resolveAcceptedFulfillmentState(
  ctx: MutationCtx,
  intentKey: string,
) {
  const intent = await ctx.db
    .query("intents")
    .withIndex("by_intentKey", (queryBuilder) => queryBuilder.eq("intentKey", intentKey))
    .unique();

  if (!intent) {
    return {
      acceptedProposal: null,
      fulfillment: null,
      intent: null,
    };
  }

  const acceptedProposals = await ctx.db
    .query("proposals")
    .withIndex("by_intentKey_and_status", (queryBuilder) =>
      queryBuilder.eq("intentKey", intentKey).eq("status", "accepted"),
    )
    .collect();
  const acceptedProposal = acceptedProposals[0] ?? null;
  const candidateFulfillments = [
    ...(await ctx.db
      .query("fulfillments")
      .withIndex("by_intentKey_and_status", (queryBuilder) =>
        queryBuilder.eq("intentKey", intentKey).eq("status", "approved"),
      )
      .collect()),
    ...(await ctx.db
      .query("fulfillments")
      .withIndex("by_intentKey_and_status", (queryBuilder) =>
        queryBuilder.eq("intentKey", intentKey).eq("status", "active"),
      )
      .collect()),
    ...(await ctx.db
      .query("fulfillments")
      .withIndex("by_intentKey_and_status", (queryBuilder) =>
        queryBuilder.eq("intentKey", intentKey).eq("status", "blocked"),
      )
      .collect()),
    ...(await ctx.db
      .query("fulfillments")
      .withIndex("by_intentKey_and_status", (queryBuilder) =>
        queryBuilder.eq("intentKey", intentKey).eq("status", "fulfilled"),
      )
      .collect()),
  ];
  const fulfillment =
    candidateFulfillments.find((entry) =>
      acceptedProposal ? entry.acceptedProposalId === acceptedProposal._id : true,
    ) ?? null;

  return {
    acceptedProposal,
    fulfillment: fulfillment
      ? normalizeStoredFulfillmentEnvironment(fulfillment)
      : null,
    intent,
  };
}

async function hasFulfillmentEvidence(
  ctx: MutationCtx,
  fulfillmentId: Id<"fulfillments">,
) {
  const evidence = await ctx.db
    .query("evidences")
    .withIndex("by_fulfillmentId_and_createdAt", (queryBuilder) =>
      queryBuilder.eq("fulfillmentId", fulfillmentId),
    )
    .take(1);

  return evidence.length > 0;
}

async function upsertArtifactRecord(
  ctx: MutationCtx,
  input: {
    artifact: {
      artifactKind: "audio" | "image" | "video";
      mediaType?: string;
      metadataJson?: string;
      remoteId?: string;
      status: "failed" | "in_progress" | "queued" | "ready";
      subtitle: string;
      title: string;
    };
    conversationId: string;
    intentKey: string;
    now: number;
  },
) {
  if (input.artifact.remoteId) {
    const existing = await ctx.db
      .query("artifacts")
      .withIndex("by_remoteId", (queryBuilder) =>
        queryBuilder.eq("remoteId", input.artifact.remoteId!),
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        artifactKind: input.artifact.artifactKind,
        conversationId: input.conversationId,
        intentKey: input.intentKey,
        mediaType: input.artifact.mediaType,
        metadataJson: input.artifact.metadataJson,
        provider: "boreal-agent",
        status: input.artifact.status,
        subtitle: input.artifact.subtitle,
        title: input.artifact.title,
        updatedAt: input.now,
      });

      return existing._id;
    }
  }

  return ctx.db.insert("artifacts", {
    artifactKind: input.artifact.artifactKind,
    conversationId: input.conversationId,
    createdAt: input.now,
    intentKey: input.intentKey,
    mediaType: input.artifact.mediaType,
    metadataJson: input.artifact.metadataJson,
    provider: "boreal-agent",
    remoteId: input.artifact.remoteId,
    status: input.artifact.status,
    subtitle: input.artifact.subtitle,
    title: input.artifact.title,
    updatedAt: input.now,
  });
}

type WorkerIdentity = {
  actorKind: "agent" | "human" | "tool";
  displayName: string;
  externalId: string | null;
  handle: string | null;
  userId: string;
};

async function getWorkerIdentity(
  ctx: MutationCtx,
  userId: string | undefined,
): Promise<WorkerIdentity | null> {
  if (!userId) {
    return null;
  }

  const user = await ctx.db.get(userId as Id<"users">);

  if (!user) {
    return null;
  }

  return {
    actorKind: user.actorKind,
    displayName: user.displayName ?? "Worker",
    externalId: user.externalId ?? null,
    handle: user.handle ?? null,
    userId: user._id,
  };
}

async function ensurePayoutRecord(
  ctx: MutationCtx,
  input: {
    amount: number;
    chainFamily?: CommerceChainFamily;
    currency: string;
    environment: CommerceEnvironment;
    networkKey?: CommerceNetworkKey;
    settlementId: Id<"settlements">;
    transactionId: Id<"transactions">;
    userId: string;
  },
) {
  const now = Date.now();
  const existing = await ctx.db
    .query("payouts")
    .withIndex("by_transactionId", (queryBuilder) =>
      queryBuilder.eq("transactionId", input.transactionId),
    )
    .collect();

  const matched = existing.find((payout) => payout.payeeUserId === input.userId);

  if (matched) {
    const walletAccountId = await getDefaultPayoutWalletAccountId(ctx, input.userId);

    await ctx.db.patch(matched._id, {
      amount: input.amount,
      chainFamily: input.chainFamily,
      currency: input.currency,
      environment: input.environment,
      networkKey: input.networkKey,
      settlementId: input.settlementId,
      updatedAt: now,
      walletAccountId,
    });

    return matched._id;
  }

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

async function ensurePayoutRecordsForProposal(
  ctx: MutationCtx,
  input: {
    amount: number;
    chainFamily?: CommerceChainFamily;
    currency: string;
    environment: CommerceEnvironment;
    networkKey?: CommerceNetworkKey;
    proposal: {
      collectiveMembers?: string[];
      memberRoles?: Array<{ memberId: string; role: string }>;
      proposerUserId?: string;
      splitPlan?: Array<{ memberId: string; percent: number }>;
    };
    settlementId: Id<"settlements">;
    transactionId: Id<"transactions">;
  },
) {
  const collectiveParticipants = await resolveCollectiveParticipants(
    ctx,
    input.proposal,
  );

  if (collectiveParticipants.error) {
    return [];
  }

  const allocations = buildCollectivePayoutAllocations({
    amount: input.amount,
    participants: collectiveParticipants.participants.map((participant) => ({
      externalId: participant.externalId,
      userId: participant.userId,
    })),
    splitPlan: input.proposal.splitPlan,
  });
  const payoutTargets: Array<{
    externalId: string | null;
    payoutId: Id<"payouts">;
  }> = [];

  for (const allocation of allocations) {
    const payoutId = await ensurePayoutRecord(ctx, {
      amount: allocation.amount,
      chainFamily: input.chainFamily,
      currency: input.currency,
      environment: input.environment,
      networkKey: input.networkKey,
      settlementId: input.settlementId,
      transactionId: input.transactionId,
      userId: allocation.userId,
    });

    payoutTargets.push({
      externalId: allocation.externalId,
      payoutId,
    });
  }

  return payoutTargets;
}

async function queuePayoutReadyWebhooks(
  ctx: MutationCtx,
  input: {
    collectiveMembers: string[] | null;
    fallbackExternalId?: string | null;
    memberRoles: Array<{ memberId: string; role: string }> | null;
    payoutTargets: Array<{
      externalId: string | null;
      payoutId: Id<"payouts">;
    }>;
    requestToken: string;
    splitPlan: Array<{ memberId: string; percent: number }> | null;
    transactionId: Id<"transactions">;
  },
) {
  for (const target of input.payoutTargets) {
    const payoutToken = createPayoutToken(target.payoutId);

    await queueWebhookDeliveries(ctx, {
      data: {
        collectiveMembers: input.collectiveMembers,
        memberRoles: input.memberRoles,
        payoutToken,
        settlementStatus: "ready_for_payout",
        splitPlan: input.splitPlan,
        transactionId: input.transactionId,
      },
      eventType: "inbox.payout_ready",
      message: "Payout is ready for the supplier.",
      ownerExternalId: target.externalId ?? input.fallbackExternalId ?? null,
      payoutToken,
      requestToken: input.requestToken,
      status: "payout_ready",
      stream: "inbox",
    });
    await queueWebhookDeliveries(ctx, {
      data: {
        collectiveMembers: input.collectiveMembers,
        memberRoles: input.memberRoles,
        payoutToken,
        settlementStatus: "ready_for_payout",
        splitPlan: input.splitPlan,
        transactionId: input.transactionId,
      },
      eventType: "payout.ready",
      message: "Payout is ready for processing.",
      ownerExternalId: target.externalId ?? input.fallbackExternalId ?? null,
      payoutToken,
      requestToken: input.requestToken,
      status: "pending",
      stream: "payouts",
    });
  }
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
