import type { Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";

import {
  type BorealChainEnvironment,
  type BorealChainFamily,
  type BorealSupportedNetworkKey,
  getBorealChainEnvironment,
  inferBorealNetworkSelection,
} from "../lib/boreal/commerce/networks";
import { getScenarioId } from "./transactionScenarios";

export type CommerceEnvironment = BorealChainEnvironment;
export type CommerceChainFamily = BorealChainFamily;
export type CommerceNetworkKey = BorealSupportedNetworkKey;
export type TransactionScenario =
  | "instant_digital_purchase"
  | "provider_paid_service"
  | "provider_handoff_service"
  | "custom_scoped_work"
  | "chat_only_fulfillment"
  | "consultation"
  | "physical_service"
  | "milestone_project"
  | "supply_publish";

export type TransactionStatus =
  | "draft"
  | "awaiting_approval"
  | "awaiting_payment"
  | "active"
  | "fulfilled"
  | "cancelled"
  | "failed"
  | "disputed"
  | "refunded";

export type SettlementStatus =
  | "not_applicable"
  | "pending"
  | "held"
  | "ready_for_payout"
  | "paid_out"
  | "failed"
  | "refunded";

export function getCommerceEnvironment(
  explicit?: string | null,
): CommerceEnvironment {
  return getBorealChainEnvironment(explicit);
}

export function getCommerceNetworkSelection(input?: {
  chainFamily?: string | null;
  chainId?: string | null;
  environment?: string | null;
  networkKey?: string | null;
}) {
  return inferBorealNetworkSelection({
    chainFamily: input?.chainFamily,
    chainId: input?.chainId,
    environment: input?.environment,
    networkKey: input?.networkKey,
  });
}

export function deriveCheckoutScenario(input: {
  deliveryType?: string;
  fulfillmentKind?: string;
  sourceProviderKey?: string;
  supportsDirectInvoke?: boolean;
}): TransactionScenario {
  if (input.sourceProviderKey) {
    return input.supportsDirectInvoke
      ? "provider_paid_service"
      : "provider_handoff_service";
  }

  if (input.fulfillmentKind === "physical") {
    return "physical_service";
  }

  if (
    input.fulfillmentKind === "service" &&
    input.deliveryType === "scheduled"
  ) {
    return "consultation";
  }

  if (
    input.fulfillmentKind === "digital" &&
    input.deliveryType === "instant"
  ) {
    return "instant_digital_purchase";
  }

  return "custom_scoped_work";
}

export function deriveCheckoutTransactionStatus(input: {
  itemStatus:
    | "awaiting_payment"
    | "cancelled"
    | "failed"
    | "fulfilled"
    | "in_progress"
    | "submitted";
}): TransactionStatus {
  switch (input.itemStatus) {
    case "awaiting_payment":
      return "awaiting_payment";
    case "fulfilled":
      return "fulfilled";
    case "failed":
      return "failed";
    case "cancelled":
      return "cancelled";
    case "in_progress":
      return "active";
    case "submitted":
    default:
      return "active";
  }
}

export function deriveCheckoutSettlementStatus(input: {
  amount?: number | null;
  itemStatus:
    | "awaiting_payment"
    | "cancelled"
    | "failed"
    | "fulfilled"
    | "in_progress"
    | "submitted";
  scenarioType: TransactionScenario;
  sellerUserId?: string | null;
  sourceProviderKey?: string | null;
}): SettlementStatus {
  if (
    input.scenarioType === "provider_paid_service" ||
    input.scenarioType === "provider_handoff_service"
  ) {
    return "not_applicable";
  }

  if (!input.sellerUserId || !input.amount || input.amount <= 0) {
    return "not_applicable";
  }

  if (input.itemStatus === "fulfilled") {
    return "ready_for_payout";
  }

  if (input.itemStatus === "failed" || input.itemStatus === "cancelled") {
    return "failed";
  }

  return "pending";
}

export async function getProfileIdForUser(
  ctx: MutationCtx | QueryCtx,
  userId?: string | null,
): Promise<Id<"profiles"> | undefined> {
  if (!userId) {
    return undefined;
  }

  const profile = await ctx.db
    .query("profiles")
    .withIndex("by_userId", (queryBuilder) => queryBuilder.eq("userId", userId))
    .unique();

  return profile?._id;
}

export async function getDefaultPayoutWalletAccountId(
  ctx: MutationCtx | QueryCtx,
  userId?: string | null,
): Promise<Id<"walletAccounts"> | undefined> {
  if (!userId) {
    return undefined;
  }

  const accounts = await ctx.db
    .query("walletAccounts")
    .withIndex("by_userId_and_lastSyncedAt", (queryBuilder) =>
      queryBuilder.eq("userId", userId),
    )
    .order("desc")
    .take(12);

  const preferred = accounts.find((account) => account.isDefaultPayout);
  return preferred?._id ?? accounts[0]?._id;
}

export async function getDefaultBuyerWalletAccountId(
  ctx: MutationCtx | QueryCtx,
  userId?: string | null,
): Promise<Id<"walletAccounts"> | undefined> {
  if (!userId) {
    return undefined;
  }

  const accounts = await ctx.db
    .query("walletAccounts")
    .withIndex("by_userId_and_lastSyncedAt", (queryBuilder) =>
      queryBuilder.eq("userId", userId),
    )
    .order("desc")
    .take(12);

  const preferred = accounts.find((account) => account.isDefaultBuyer);
  return preferred?._id ?? accounts[0]?._id;
}

export async function getWalletAccountContext(
  ctx: MutationCtx | QueryCtx,
  walletAccountId?: Id<"walletAccounts"> | undefined,
) {
  if (!walletAccountId) {
    return null;
  }

  const account = await ctx.db.get(walletAccountId);

  if (!account) {
    return null;
  }

  return {
    chainFamily: account.chainFamily,
    chainId: account.chainId ?? null,
    environment: account.environment,
    networkKey: account.networkKey,
  };
}

export async function ensureTransactionForCheckoutItem(
  ctx: MutationCtx,
  input: {
    amount?: number | null;
    buyerUserId?: string | null;
    buyerWalletAccountId?: Id<"walletAccounts"> | undefined;
    chainFamily?: CommerceChainFamily | null;
    chainId?: string | null;
    checkoutId: Id<"checkouts">;
    checkoutItemId: Id<"checkoutItems">;
    currency?: string | null;
    environment?: string | null;
    intentId?: Id<"intents"> | undefined;
    intentKey?: string | null;
    paymentAttemptId?: Id<"paymentAttempts"> | undefined;
    paymentProtocol?: "direct-solana" | "mpp" | "none" | "widget" | "x402" | null;
    networkKey?: CommerceNetworkKey | null;
    paymentStatus:
      | "cancelled"
      | "failed"
      | "paid"
      | "pending_approval"
      | "processing"
      | "ready_to_pay";
    scenarioType: TransactionScenario;
    sellerProfileId?: Id<"profiles"> | undefined;
    sellerUserId?: string | null;
    serviceInvocationId?: Id<"serviceInvocations"> | undefined;
    settlementStatus: SettlementStatus;
    sourceProviderKey?:
      | "agentcash"
      | "agentic-market"
      | "frames"
      | "manual"
      | "moonpay"
      | "solana-agent-kit"
      | null;
    status: TransactionStatus;
    supplyId?: Id<"supplies"> | undefined;
    titleSnapshot?: string | null;
  },
): Promise<Id<"transactions">> {
  const networkSelection = getCommerceNetworkSelection({
    chainFamily: input.chainFamily,
    chainId: input.chainId,
    environment: input.environment,
    networkKey: input.networkKey,
  });
  const existing = await ctx.db
    .query("transactions")
    .withIndex("by_checkoutItemId", (queryBuilder) =>
      queryBuilder.eq("checkoutItemId", input.checkoutItemId),
    )
    .unique();

  const payload = {
    amount: input.amount ?? undefined,
    buyerUserId: input.buyerUserId ?? undefined,
    buyerWalletAccountId: input.buyerWalletAccountId,
    chainFamily: networkSelection.chainFamily,
    checkoutId: input.checkoutId,
    checkoutItemId: input.checkoutItemId,
    currency: input.currency ?? undefined,
    environment: networkSelection.environment,
    intentId: input.intentId,
    intentKey: input.intentKey ?? undefined,
    networkKey: networkSelection.networkKey,
    paymentAttemptId: input.paymentAttemptId,
    paymentProtocol: input.paymentProtocol ?? undefined,
    paymentStatus: input.paymentStatus,
    scenarioId: getScenarioId(input.scenarioType),
    scenarioType: input.scenarioType,
    sellerProfileId: input.sellerProfileId,
    sellerUserId: input.sellerUserId ?? undefined,
    serviceInvocationId: input.serviceInvocationId,
    settlementStatus: input.settlementStatus,
    sourceProviderKey: input.sourceProviderKey ?? undefined,
    status: input.status,
    supplyId: input.supplyId,
    titleSnapshot: input.titleSnapshot ?? undefined,
    updatedAt: Date.now(),
  };

  if (existing) {
    await ctx.db.patch(existing._id, payload);
    return existing._id;
  }

  return ctx.db.insert("transactions", {
    ...payload,
    createdAt: Date.now(),
    fulfillmentId: undefined,
    proposalId: undefined,
  });
}

export async function ensureWorkTransaction(
  ctx: MutationCtx,
  input: {
    amount?: number | null;
    buyerUserId?: string | null;
    buyerWalletAccountId?: Id<"walletAccounts"> | undefined;
    chainFamily?: CommerceChainFamily | null;
    chainId?: string | null;
    currency?: string | null;
    environment?: string | null;
    intentId?: Id<"intents"> | undefined;
    intentKey: string;
    proposalId?: Id<"proposals"> | undefined;
    sellerProfileId?: Id<"profiles"> | undefined;
    sellerUserId?: string | null;
    sourceProviderKey?: null;
    status: TransactionStatus;
    titleSnapshot?: string | null;
    networkKey?: CommerceNetworkKey | null;
  },
): Promise<Id<"transactions">> {
  const networkSelection = getCommerceNetworkSelection({
    chainFamily: input.chainFamily,
    chainId: input.chainId,
    environment: input.environment,
    networkKey: input.networkKey,
  });
  const existing = input.proposalId
    ? await ctx.db
        .query("transactions")
        .withIndex("by_proposalId", (queryBuilder) =>
          queryBuilder.eq("proposalId", input.proposalId),
        )
        .unique()
    : null;

  const payload = {
    amount: input.amount ?? undefined,
    buyerUserId: input.buyerUserId ?? undefined,
    buyerWalletAccountId: input.buyerWalletAccountId,
    chainFamily: networkSelection.chainFamily,
    currency: input.currency ?? undefined,
    environment: networkSelection.environment,
    intentId: input.intentId,
    intentKey: input.intentKey,
    networkKey: networkSelection.networkKey,
    paymentAttemptId: undefined,
    paymentProtocol: undefined,
    paymentStatus:
      input.amount && input.amount > 0
        ? ("ready_to_pay" as const)
        : ("paid" as const),
    proposalId: input.proposalId,
    scenarioId: getScenarioId("custom_scoped_work"),
    scenarioType: "custom_scoped_work" as const,
    sellerProfileId: input.sellerProfileId,
    sellerUserId: input.sellerUserId ?? undefined,
    serviceInvocationId: undefined,
    settlementStatus:
      input.amount && input.amount > 0 ? ("pending" as const) : ("not_applicable" as const),
    sourceProviderKey: undefined,
    status: input.status,
    titleSnapshot: input.titleSnapshot ?? undefined,
    updatedAt: Date.now(),
  };

  if (existing) {
    await ctx.db.patch(existing._id, payload);
    return existing._id;
  }

  return ctx.db.insert("transactions", {
    ...payload,
    checkoutId: undefined,
    checkoutItemId: undefined,
    createdAt: Date.now(),
    fulfillmentId: undefined,
    supplyId: undefined,
  });
}

export async function ensureSettlementForTransaction(
  ctx: MutationCtx,
  input: {
    amount?: number | null;
    buyerWalletAccountId?: Id<"walletAccounts"> | undefined;
    chainFamily?: CommerceChainFamily | null;
    chainId?: string | null;
    currency?: string | null;
    environment?: string | null;
    networkKey?: CommerceNetworkKey | null;
    payoutWalletAccountId?: Id<"walletAccounts"> | undefined;
    protocol?: "direct-solana" | "mpp" | "none" | "widget" | "x402" | null;
    status: SettlementStatus;
    transactionId: Id<"transactions">;
    txHash?: string | null;
  },
): Promise<Id<"settlements">> {
  const networkSelection = getCommerceNetworkSelection({
    chainFamily: input.chainFamily,
    chainId: input.chainId,
    environment: input.environment,
    networkKey: input.networkKey,
  });
  const existing = await ctx.db
    .query("settlements")
    .withIndex("by_transactionId", (queryBuilder) =>
      queryBuilder.eq("transactionId", input.transactionId),
    )
    .unique();

  const payload = {
    amount: input.amount ?? undefined,
    buyerWalletAccountId: input.buyerWalletAccountId,
    chainFamily: networkSelection.chainFamily,
    currency: input.currency ?? undefined,
    environment: networkSelection.environment,
    networkKey: networkSelection.networkKey,
    payoutWalletAccountId: input.payoutWalletAccountId,
    settlementProtocol: input.protocol ?? undefined,
    status: input.status,
    txHash: input.txHash ?? undefined,
    updatedAt: Date.now(),
  };

  if (existing) {
    await ctx.db.patch(existing._id, payload);
    return existing._id;
  }

  return ctx.db.insert("settlements", {
    ...payload,
    createdAt: Date.now(),
    transactionId: input.transactionId,
  });
}

export async function updateTransactionById(
  ctx: MutationCtx,
  transactionId: Id<"transactions">,
  input: {
    fulfillmentId?: Id<"fulfillments"> | undefined;
    paymentAttemptId?: Id<"paymentAttempts"> | undefined;
    paymentStatus?:
      | "cancelled"
      | "failed"
      | "paid"
      | "pending_approval"
      | "processing"
      | "ready_to_pay";
    serviceInvocationId?: Id<"serviceInvocations"> | undefined;
    settlementStatus?: SettlementStatus;
    status?: TransactionStatus;
  },
) {
  const patch: Record<string, unknown> = {
    updatedAt: Date.now(),
  };

  if ("fulfillmentId" in input) {
    patch.fulfillmentId = input.fulfillmentId;
  }

  if ("paymentAttemptId" in input) {
    patch.paymentAttemptId = input.paymentAttemptId;
  }

  if ("paymentStatus" in input) {
    patch.paymentStatus = input.paymentStatus;
  }

  if ("serviceInvocationId" in input) {
    patch.serviceInvocationId = input.serviceInvocationId;
  }

  if ("settlementStatus" in input) {
    patch.settlementStatus = input.settlementStatus;
  }

  if ("status" in input) {
    patch.status = input.status;
  }

  await ctx.db.patch(transactionId, patch);
}
