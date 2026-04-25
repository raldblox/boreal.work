import type { Id } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";

import type { TransactionScenario } from "./commerceCore";

export type TransactionAuditSource =
  | "checkout"
  | "fulfillment"
  | "listing"
  | "payment"
  | "proposal"
  | "provider"
  | "verification"
  | "wallet";

export type TransactionAuditStage =
  | "approval"
  | "checkout"
  | "delivery"
  | "fulfillment"
  | "listing"
  | "payment"
  | "proposal"
  | "provider"
  | "review"
  | "settlement"
  | "verification"
  | "wallet";

export type TransactionAuditStatus =
  | "blocked"
  | "failed"
  | "info"
  | "passed";

export type TransactionScenarioRunStatus =
  | "cancelled"
  | "failed"
  | "passed"
  | "started";

type ScenarioDefinition = {
  description: string;
  expectedAuditStages: TransactionAuditStage[];
  fulfillmentBehavior:
    | "chat_delivery"
    | "instant_access"
    | "listing_publish"
    | "milestone_delivery"
    | "physical_attendance"
    | "proposal_delivery"
    | "provider_handoff"
    | "provider_invoke"
    | "session_delivery";
  id: string;
  paymentBehavior:
    | "buyer_checkout"
    | "none"
    | "provider_checkout"
    | "quote_after_acceptance";
  requiresBuyerWallet: boolean;
  requiresPayoutWallet: boolean;
  title: string;
};

const TRANSACTION_SCENARIO_REGISTRY: Record<
  TransactionScenario,
  ScenarioDefinition
> = {
  chat_only_fulfillment: {
    description:
      "A request resolved directly in the workspace thread, with the owner explicitly marking the outcome complete.",
    expectedAuditStages: ["approval", "delivery", "fulfillment", "settlement"],
    fulfillmentBehavior: "chat_delivery",
    id: "txn.chat_only_fulfillment.v1",
    paymentBehavior: "none",
    requiresBuyerWallet: false,
    requiresPayoutWallet: false,
    title: "Chat-only fulfillment",
  },
  consultation: {
    description:
      "A scheduled or scoped consultation delivered through conversation or a session artifact.",
    expectedAuditStages: ["approval", "wallet", "fulfillment", "delivery", "settlement"],
    fulfillmentBehavior: "session_delivery",
    id: "txn.consultation.v1",
    paymentBehavior: "quote_after_acceptance",
    requiresBuyerWallet: true,
    requiresPayoutWallet: true,
    title: "Consultation",
  },
  custom_scoped_work: {
    description:
      "A proposal-based human or agent work request with explicit approval, delivery, and review.",
    expectedAuditStages: ["proposal", "approval", "wallet", "fulfillment", "delivery", "settlement"],
    fulfillmentBehavior: "proposal_delivery",
    id: "txn.custom_scoped_work.v1",
    paymentBehavior: "quote_after_acceptance",
    requiresBuyerWallet: true,
    requiresPayoutWallet: true,
    title: "Custom scoped work",
  },
  instant_digital_purchase: {
    description:
      "An instantly fulfilled digital listing that unlocks access immediately after checkout.",
    expectedAuditStages: ["wallet", "checkout", "fulfillment", "settlement"],
    fulfillmentBehavior: "instant_access",
    id: "txn.instant_digital_purchase.v1",
    paymentBehavior: "buyer_checkout",
    requiresBuyerWallet: true,
    requiresPayoutWallet: true,
    title: "Instant digital purchase",
  },
  milestone_project: {
    description:
      "A longer-running work stream intended to settle over milestones instead of one final delivery.",
    expectedAuditStages: ["proposal", "approval", "wallet", "fulfillment", "delivery", "settlement"],
    fulfillmentBehavior: "milestone_delivery",
    id: "txn.milestone_project.v1",
    paymentBehavior: "quote_after_acceptance",
    requiresBuyerWallet: true,
    requiresPayoutWallet: true,
    title: "Milestone project",
  },
  physical_service: {
    description:
      "A real-world service that requires scheduling, attendance, and proof of completion.",
    expectedAuditStages: ["proposal", "approval", "wallet", "fulfillment", "delivery", "settlement"],
    fulfillmentBehavior: "physical_attendance",
    id: "txn.physical_service.v1",
    paymentBehavior: "quote_after_acceptance",
    requiresBuyerWallet: true,
    requiresPayoutWallet: true,
    title: "Physical service",
  },
  provider_handoff_service: {
    description:
      "A provider-backed capability that Boreal can route to, but the buyer must complete through the external provider.",
    expectedAuditStages: ["wallet", "checkout", "provider", "settlement"],
    fulfillmentBehavior: "provider_handoff",
    id: "txn.provider_handoff_service.v1",
    paymentBehavior: "buyer_checkout",
    requiresBuyerWallet: true,
    requiresPayoutWallet: false,
    title: "Provider handoff service",
  },
  provider_paid_service: {
    description:
      "A provider-backed capability that Boreal can invoke directly after buyer payment and approval.",
    expectedAuditStages: ["wallet", "checkout", "payment", "provider", "settlement"],
    fulfillmentBehavior: "provider_invoke",
    id: "txn.provider_paid_service.v1",
    paymentBehavior: "provider_checkout",
    requiresBuyerWallet: true,
    requiresPayoutWallet: false,
    title: "Provider paid service",
  },
  supply_publish: {
    description:
      "A listing publication flow where Boreal structures supply metadata for discovery and matching.",
    expectedAuditStages: ["wallet", "listing", "verification"],
    fulfillmentBehavior: "listing_publish",
    id: "txn.supply_publish.v1",
    paymentBehavior: "none",
    requiresBuyerWallet: false,
    requiresPayoutWallet: false,
    title: "Supply publish",
  },
};

export function listScenarioDefinitions() {
  return Object.entries(TRANSACTION_SCENARIO_REGISTRY).map(
    ([scenarioType, definition]) => ({
      ...definition,
      scenarioType: scenarioType as TransactionScenario,
    }),
  );
}

export function getScenarioDefinition(scenarioType: TransactionScenario) {
  return TRANSACTION_SCENARIO_REGISTRY[scenarioType];
}

export function getScenarioId(scenarioType: TransactionScenario) {
  return TRANSACTION_SCENARIO_REGISTRY[scenarioType].id;
}

export function scenarioNeedsBuyerWallet(
  scenarioType: TransactionScenario,
  amount?: number | null,
) {
  return (
    TRANSACTION_SCENARIO_REGISTRY[scenarioType].requiresBuyerWallet &&
    (amount ?? 0) > 0
  );
}

export function scenarioNeedsPayoutWallet(
  scenarioType: TransactionScenario,
  amount?: number | null,
) {
  return (
    TRANSACTION_SCENARIO_REGISTRY[scenarioType].requiresPayoutWallet &&
    (amount ?? 0) > 0
  );
}

function stringifyMetadata(
  metadata?: Record<string, unknown>,
) {
  return metadata ? JSON.stringify(metadata) : undefined;
}

export async function recordTransactionAuditEvent(
  ctx: MutationCtx,
  input: {
    checkoutId?: Id<"checkouts">;
    checkoutItemId?: Id<"checkoutItems">;
    fulfillmentId?: Id<"fulfillments">;
    intentId?: Id<"intents">;
    message: string;
    metadata?: Record<string, unknown>;
    paymentAttemptId?: Id<"paymentAttempts">;
    proposalId?: Id<"proposals">;
    scenarioType: TransactionScenario;
    settlementId?: Id<"settlements">;
    source: TransactionAuditSource;
    stage: TransactionAuditStage;
    status: TransactionAuditStatus;
    supplyId?: Id<"supplies">;
    transactionId?: Id<"transactions">;
    verificationRunId?: Id<"transactionScenarioRuns">;
  },
) {
  return ctx.db.insert("transactionAuditEvents", {
    checkoutId: input.checkoutId,
    checkoutItemId: input.checkoutItemId,
    createdAt: Date.now(),
    fulfillmentId: input.fulfillmentId,
    intentId: input.intentId,
    message: input.message,
    metadataJson: stringifyMetadata(input.metadata),
    paymentAttemptId: input.paymentAttemptId,
    proposalId: input.proposalId,
    scenarioId: getScenarioId(input.scenarioType),
    scenarioType: input.scenarioType,
    settlementId: input.settlementId,
    source: input.source,
    stage: input.stage,
    status: input.status,
    supplyId: input.supplyId,
    transactionId: input.transactionId,
    verificationRunId: input.verificationRunId,
  });
}

export async function startTransactionScenarioRun(
  ctx: MutationCtx,
  input: {
    intentId?: Id<"intents">;
    notes?: string;
    runKey: string;
    scenarioType: TransactionScenario;
  },
) {
  const now = Date.now();
  return ctx.db.insert("transactionScenarioRuns", {
    completedAt: undefined,
    createdAt: now,
    errorMessage: undefined,
    intentId: input.intentId,
    metadataJson: undefined,
    notes: input.notes,
    runKey: input.runKey,
    scenarioId: getScenarioId(input.scenarioType),
    scenarioType: input.scenarioType,
    status: "started",
    transactionId: undefined,
    updatedAt: now,
  });
}

export async function completeTransactionScenarioRun(
  ctx: MutationCtx,
  input: {
    errorMessage?: string;
    metadata?: Record<string, unknown>;
    runId: Id<"transactionScenarioRuns">;
    status: TransactionScenarioRunStatus;
    transactionId?: Id<"transactions">;
  },
) {
  await ctx.db.patch(input.runId, {
    completedAt: Date.now(),
    errorMessage: input.errorMessage,
    metadataJson: stringifyMetadata(input.metadata),
    status: input.status,
    transactionId: input.transactionId,
    updatedAt: Date.now(),
  });
}
