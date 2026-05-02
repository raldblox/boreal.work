import type { Id, TableNames } from "./_generated/dataModel";
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
  "siwxChallenges",
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
    let deletedStorageCount = 0;
    const deletedStorageIds = new Set<Id<"_storage">>();

    for (const document of documents) {
      for (const storageId of collectStorageIds(document)) {
        if (deletedStorageIds.has(storageId)) {
          continue;
        }

        try {
          await ctx.storage.delete(storageId);
          deletedStorageIds.add(storageId);
          deletedStorageCount += 1;
        } catch {
          // Missing or already-deleted storage should not block a dev wipe.
        }
      }

      await ctx.db.delete(document._id);
    }

    return {
      deletedCount: documents.length,
      deletedStorageCount,
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
      deletedStorageCount: number;
      tableName: TableNames;
    }> = [];
    let totalDeleted = 0;
    let totalStorageDeleted = 0;

    for (const tableName of DEV_WIPE_TABLES) {
      let deletedCount = 0;
      let deletedStorageCount = 0;

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
        deletedStorageCount += result.deletedStorageCount;

        if (!result.hasMore) {
          break;
        }
      }

      totalDeleted += deletedCount;
      totalStorageDeleted += deletedStorageCount;
      tables.push({
        deletedCount,
        deletedStorageCount,
        tableName,
      });
    }

    return {
      batchSize,
      totalStorageDeleted,
      tableCount: tables.length,
      tables,
      totalDeleted,
      wipedAt: Date.now(),
    };
  },
});

export const normalizeLegacySolanaDevnetRequestSessions = internalMutation({
  args: {},
  handler: async (ctx) => {
    const sessions = await ctx.db.query("agentRequestSessions").collect();
    let normalizedCount = 0;

    for (const session of sessions) {
      if (
        session.networkKey !== "solana:devnet" &&
        session.environment !== "devnet"
      ) {
        continue;
      }

      await ctx.db.patch(session._id, {
        environment: "testnet",
        networkKey: "solana:testnet",
        updatedAt: Date.now(),
      });
      normalizedCount += 1;
    }

    return {
      normalizedCount,
      normalizedToEnvironment: "testnet" as const,
      normalizedToNetworkKey: "solana:testnet" as const,
    };
  },
});

function normalizeBatchSize(value?: number) {
  if (!Number.isFinite(value) || value === undefined) {
    return DEFAULT_BATCH_SIZE;
  }

  return Math.max(1, Math.min(MAX_BATCH_SIZE, Math.floor(value)));
}

function collectStorageIds(value: unknown): Id<"_storage">[] {
  const found = new Set<Id<"_storage">>();
  visitForStorageIds(value, found);
  return [...found];
}

function visitForStorageIds(
  value: unknown,
  found: Set<Id<"_storage">>,
) {
  if (!value) {
    return;
  }

  if (Array.isArray(value)) {
    for (const entry of value) {
      visitForStorageIds(entry, found);
    }
    return;
  }

  if (typeof value !== "object") {
    return;
  }

  for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
    if (key === "storageId" && typeof nested === "string" && nested.length > 0) {
      found.add(nested as Id<"_storage">);
      continue;
    }

    visitForStorageIds(nested, found);
  }
}
