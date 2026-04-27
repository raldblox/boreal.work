import type { TableNames } from "./_generated/dataModel";
import { internal } from "./_generated/api";
import {
  internalAction,
  internalMutation,
} from "./_generated/server";
import { v } from "convex/values";

const DEV_WIPE_CONFIRMATION = "WIPE DEVELOPMENT DATA";
const DEFAULT_BATCH_SIZE = 128;
const MAX_BATCH_SIZE = 512;

// Reverse-ish dependency order keeps child/event tables clearing before parent rows.
const DEV_WIPE_TABLES = [
  "matchEvents",
  "matchCandidates",
  "activityEvents",
  "evidences",
  "fulfillments",
  "proposals",
  "artifacts",
  "disputes",
  "refunds",
  "transactionScenarioRuns",
  "transactionAuditEvents",
  "payouts",
  "settlements",
  "transactions",
  "webhookDeliveries",
  "webhookSubscriptions",
  "supplierRequestDecisions",
  "agentRequestEvents",
  "agentRequestSessions",
  "walletSessions",
  "transactionApprovals",
  "paymentAttempts",
  "serviceInvocations",
  "serviceProviderSyncs",
  "serviceCapabilities",
  "serviceProviders",
  "checkoutItems",
  "checkouts",
  "cartLineItems",
  "carts",
  "supplies",
  "intentRuns",
  "intents",
  "chatMessages",
  "conversations",
  "walletAccounts",
  "profiles",
  "users",
] as const satisfies readonly TableNames[];

const DEV_WIPE_TABLE_SET = new Set<string>(DEV_WIPE_TABLES);

export const wipeDevelopmentBatch = internalMutation({
  args: {
    batchSize: v.optional(v.number()),
    confirm: v.string(),
    tableName: v.string(),
  },
  handler: async (ctx, args) => {
    if (args.confirm !== DEV_WIPE_CONFIRMATION) {
      throw new Error("Invalid wipe confirmation phrase.");
    }

    if (!DEV_WIPE_TABLE_SET.has(args.tableName)) {
      throw new Error(`Unsupported wipe table "${args.tableName}".`);
    }

    const tableName = args.tableName as TableNames;
    const batchSize = normalizeBatchSize(args.batchSize);
    const documents = await ctx.db.query(tableName).take(batchSize);

    for (const document of documents) {
      await ctx.db.delete(document._id);
    }

    return {
      deletedCount: documents.length,
      hasMore: documents.length === batchSize,
      tableName,
    };
  },
});

export const wipeDevelopmentData = internalAction({
  args: {
    batchSize: v.optional(v.number()),
    confirm: v.string(),
  },
  handler: async (ctx, args) => {
    if (args.confirm !== DEV_WIPE_CONFIRMATION) {
      throw new Error("Invalid wipe confirmation phrase.");
    }

    const batchSize = normalizeBatchSize(args.batchSize);
    const tables: Array<{
      deletedCount: number;
      tableName: TableNames;
    }> = [];
    let totalDeleted = 0;

    for (const tableName of DEV_WIPE_TABLES) {
      let deletedCount = 0;

      // Loop until the current table is empty so large dev datasets stay wipeable.
      for (;;) {
        const result = await ctx.runMutation(
          internal.devTools.wipeDevelopmentBatch,
          {
            batchSize,
            confirm: args.confirm,
            tableName,
          },
        );

        deletedCount += result.deletedCount;

        if (!result.hasMore) {
          break;
        }
      }

      totalDeleted += deletedCount;
      tables.push({
        deletedCount,
        tableName,
      });
    }

    return {
      batchSize,
      tableCount: tables.length,
      tables,
      totalDeleted,
      wipedAt: Date.now(),
    };
  },
});

function normalizeBatchSize(value?: number) {
  if (!Number.isFinite(value) || value === undefined) {
    return DEFAULT_BATCH_SIZE;
  }

  return Math.max(1, Math.min(MAX_BATCH_SIZE, Math.floor(value)));
}
