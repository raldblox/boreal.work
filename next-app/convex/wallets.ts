import { mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { v } from "convex/values";

import {
  chainFamilyValidator,
  chainEnvironmentValidator,
  networkKeyValidator,
  walletAccountRoleValidator,
  walletProviderValidator,
} from "./validators";
import { inferBorealNetworkSelection } from "../lib/boreal/commerce/networks";

export const getMyWalletAccounts = query({
  args: {
    ownerExternalId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getUserByExternalId(ctx, args.ownerExternalId);

    if (!user) {
      return [];
    }

    const accounts = await ctx.db
      .query("walletAccounts")
      .withIndex("by_userId_and_lastSyncedAt", (queryBuilder) =>
        queryBuilder.eq("userId", user._id),
      )
      .order("desc")
      .take(24);

    return accounts.map((account) => ({
      _id: account._id,
      chainFamily: account.chainFamily,
      chainId: account.chainId ?? null,
      environment: account.environment,
      isDefaultBuyer: account.isDefaultBuyer,
      isDefaultPayout: account.isDefaultPayout,
      networkKey: account.networkKey,
      roles: account.roles,
      walletAddress: account.walletAddress,
      walletProvider: account.walletProvider,
    }));
  },
});

export const getOwnerExternalIdByWalletAddress = query({
  args: {
    walletAddress: v.string(),
  },
  handler: async (ctx, args) => {
    const walletAddress = args.walletAddress.trim();

    if (!walletAddress) {
      return null;
    }

    const walletAccount = await ctx.db
      .query("walletAccounts")
      .withIndex("by_walletAddress", (queryBuilder) =>
        queryBuilder.eq("walletAddress", walletAddress),
      )
      .unique();

    if (walletAccount?.actorExternalId) {
      return walletAccount.actorExternalId;
    }

    const walletSession = await ctx.db
      .query("walletSessions")
      .withIndex("by_walletAddress", (queryBuilder) =>
        queryBuilder.eq("walletAddress", walletAddress),
      )
      .unique();

    return walletSession?.actorExternalId ?? null;
  },
});

export const syncWalletAccount = mutation({
  args: {
    chainFamily: v.optional(chainFamilyValidator),
    chainId: v.optional(v.string()),
    environment: v.optional(chainEnvironmentValidator),
    networkKey: v.optional(networkKeyValidator),
    ownerDisplayName: v.optional(v.string()),
    ownerExternalId: v.optional(v.string()),
    roles: v.optional(v.array(walletAccountRoleValidator)),
    setAsDefaultBuyer: v.optional(v.boolean()),
    setAsDefaultPayout: v.optional(v.boolean()),
    walletAddress: v.string(),
    walletProvider: v.optional(walletProviderValidator),
  },
  handler: async (ctx, args) => {
    const synced = await syncWalletAccountRecord(ctx, {
      chainFamily: args.chainFamily,
      chainId: args.chainId,
      environment: args.environment,
      networkKey: args.networkKey,
      ownerDisplayName: args.ownerDisplayName,
      ownerExternalId: args.ownerExternalId,
      roles: args.roles ?? ["connected", "buyer"],
      setAsDefaultBuyer: args.setAsDefaultBuyer ?? true,
      setAsDefaultPayout: args.setAsDefaultPayout ?? false,
      walletAddress: args.walletAddress,
      walletProvider: args.walletProvider,
    });

    return {
      synced: Boolean(synced),
      walletAccountId: synced?.walletAccountId ?? null,
    };
  },
});

export const setDefaultPayoutWalletAccount = mutation({
  args: {
    ownerExternalId: v.optional(v.string()),
    walletAccountId: v.id("walletAccounts"),
  },
  handler: async (ctx, args) => {
    const user = await getUserByExternalId(ctx, args.ownerExternalId);
    const account = await ctx.db.get(args.walletAccountId);

    if (!user || !account || account.userId !== user._id) {
      return { updated: false };
    }

    const accounts = await ctx.db
      .query("walletAccounts")
      .withIndex("by_userId_and_lastSyncedAt", (queryBuilder) =>
        queryBuilder.eq("userId", user._id),
      )
      .collect();

    for (const walletAccount of accounts) {
      await ctx.db.patch(walletAccount._id, {
        isDefaultPayout: walletAccount._id === args.walletAccountId,
        lastSyncedAt: Date.now(),
      });
    }

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (queryBuilder) =>
        queryBuilder.eq("userId", user._id),
      )
      .unique();

    if (profile) {
      await ctx.db.patch(profile._id, {
        defaultPayoutWalletAccountId: args.walletAccountId,
        walletChainFamily: account.chainFamily,
        walletEnvironment: account.environment,
        walletNetworkKey: account.networkKey,
        walletSyncStatus: "ready",
      });
    }

    return { updated: true };
  },
});

export async function syncWalletAccountRecord(
  ctx: MutationCtx,
  input: {
    chainFamily?: "evm" | "solana";
    chainId?: string;
    environment?: "mainnet" | "testnet";
    networkKey?: string;
    ownerDisplayName?: string;
    ownerExternalId?: string;
    roles: Array<"buyer" | "connected" | "payout">;
    setAsDefaultBuyer?: boolean;
    setAsDefaultPayout?: boolean;
    walletAddress: string;
    walletProvider?:
      | "agentcash"
      | "manual"
      | "openwallet"
      | "privy"
      | "reown"
      | "siwx";
  },
): Promise<
  | {
      environment: "mainnet" | "testnet";
      profileId: Id<"profiles"> | undefined;
      userId: string | undefined;
      walletAccountId: Id<"walletAccounts">;
    }
  | null
> {
  if (!input.ownerExternalId) {
    return null;
  }

  const now = Date.now();
  const networkSelection = inferBorealNetworkSelection({
    chainFamily: input.chainFamily,
    chainId: input.chainId,
    environment: input.environment,
    networkKey: input.networkKey,
  });
  const user = await upsertWalletUser(ctx, {
    displayName: input.ownerDisplayName,
    externalId: input.ownerExternalId,
  });

  if (!user) {
    return null;
  }

  const profile = await ctx.db
    .query("profiles")
    .withIndex("by_userId", (queryBuilder) =>
      queryBuilder.eq("userId", user._id),
    )
    .unique();

  const existing = await ctx.db
    .query("walletAccounts")
    .withIndex("by_walletAddress", (queryBuilder) =>
      queryBuilder.eq("walletAddress", input.walletAddress),
    )
    .unique();
  const roles = Array.from(new Set(input.roles));
  const hasDefaultPayout = await hasDefaultWallet(ctx, user._id, "payout");
  const hasDefaultBuyer = await hasDefaultWallet(ctx, user._id, "buyer");
  const shouldDefaultPayout =
    input.setAsDefaultPayout === true || (!hasDefaultPayout && roles.includes("payout"));
  const shouldDefaultBuyer =
    input.setAsDefaultBuyer !== false && (!hasDefaultBuyer || roles.includes("buyer"));

  let walletAccountId: Id<"walletAccounts">;

  if (existing) {
    walletAccountId = existing._id;
    await ctx.db.patch(existing._id, {
      actorExternalId: input.ownerExternalId,
      chainFamily: networkSelection.chainFamily,
      chainId: input.chainId ?? existing.chainId,
      environment: networkSelection.environment,
      isDefaultBuyer: shouldDefaultBuyer ? true : existing.isDefaultBuyer,
      isDefaultPayout: shouldDefaultPayout ? true : existing.isDefaultPayout,
      lastSyncedAt: now,
      metadataJson: existing.metadataJson,
      networkKey: networkSelection.networkKey,
      profileId: profile?._id,
      roles: Array.from(new Set([...existing.roles, ...roles])),
      userId: user._id,
      walletProvider: input.walletProvider ?? existing.walletProvider,
    });
  } else {
    walletAccountId = await ctx.db.insert("walletAccounts", {
      actorExternalId: input.ownerExternalId,
      chainFamily: networkSelection.chainFamily,
      chainId: input.chainId,
      createdAt: now,
      environment: networkSelection.environment,
      isDefaultBuyer: shouldDefaultBuyer,
      isDefaultPayout: shouldDefaultPayout,
      lastSyncedAt: now,
      metadataJson: undefined,
      networkKey: networkSelection.networkKey,
      profileId: profile?._id,
      roles,
      userId: user._id,
      walletAddress: input.walletAddress,
      walletProvider: input.walletProvider ?? "reown",
    });
  }

  if (shouldDefaultBuyer || shouldDefaultPayout) {
    await normalizeWalletDefaults(ctx, {
      walletAccountId,
      userId: user._id,
    });
  }

  const walletSession = await ctx.db
    .query("walletSessions")
    .withIndex("by_walletAddress", (queryBuilder) =>
      queryBuilder.eq("walletAddress", input.walletAddress),
    )
    .unique();

  if (walletSession) {
    await ctx.db.patch(walletSession._id, {
      actorExternalId: input.ownerExternalId,
      chainFamily: networkSelection.chainFamily,
      chainId: input.chainId ?? walletSession.chainId,
      environment: networkSelection.environment,
      lastUsedAt: now,
      networkKey: networkSelection.networkKey,
      walletProvider: input.walletProvider ?? walletSession.walletProvider,
    });
  } else {
    await ctx.db.insert("walletSessions", {
      actorExternalId: input.ownerExternalId,
      chainFamily: networkSelection.chainFamily,
      chainId: input.chainId,
      createdAt: now,
      environment: networkSelection.environment,
      lastUsedAt: now,
      metadataJson: undefined,
      networkKey: networkSelection.networkKey,
      walletAddress: input.walletAddress,
      walletProvider: input.walletProvider ?? "reown",
    });
  }

  if (profile) {
    await ctx.db.patch(profile._id, {
      defaultPayoutWalletAccountId: shouldDefaultPayout
        ? walletAccountId
        : profile.defaultPayoutWalletAccountId,
      walletChainFamily: networkSelection.chainFamily,
      walletEnvironment: networkSelection.environment,
      walletNetworkKey: networkSelection.networkKey,
      walletSyncStatus: roles.includes("payout") ? "ready" : "connected",
    });
  }

  return {
    environment: networkSelection.environment,
    profileId: profile?._id,
    userId: user._id,
    walletAccountId,
  };
}

async function upsertWalletUser(
  ctx: MutationCtx,
  input: {
    displayName?: string;
    externalId?: string;
  },
) {
  if (!input.externalId) {
    return null;
  }

  const existing = await getUserByExternalId(ctx, input.externalId);

  if (existing) {
    await ctx.db.patch(existing._id, {
      displayName: input.displayName ?? existing.displayName,
      updatedAt: Date.now(),
    });

    return {
      ...existing,
      displayName: input.displayName ?? existing.displayName,
    };
  }

  const now = Date.now();
  const userId = await ctx.db.insert("users", {
    actorKind: "human",
    createdAt: now,
    displayName: input.displayName ?? "Boreal user",
    externalId: input.externalId,
    handle: undefined,
    trustScore: 50,
    updatedAt: now,
  });

  return {
    _id: userId,
    displayName: input.displayName ?? "Boreal user",
    externalId: input.externalId,
  };
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

async function hasDefaultWallet(
  ctx: MutationCtx,
  userId: string,
  role: "buyer" | "payout",
) {
  const accounts = await ctx.db
    .query("walletAccounts")
    .withIndex("by_userId_and_lastSyncedAt", (queryBuilder) =>
      queryBuilder.eq("userId", userId),
    )
    .take(24);

  return accounts.some((account) =>
    role === "payout" ? account.isDefaultPayout : account.isDefaultBuyer,
  );
}

async function normalizeWalletDefaults(
  ctx: MutationCtx,
  input: {
    userId: string;
    walletAccountId: Id<"walletAccounts">;
  },
) {
  const accounts = await ctx.db
    .query("walletAccounts")
    .withIndex("by_userId_and_lastSyncedAt", (queryBuilder) =>
      queryBuilder.eq("userId", input.userId),
    )
    .collect();
  const target = accounts.find((account) => account._id === input.walletAccountId);

  if (!target) {
    return;
  }

  for (const account of accounts) {
    await ctx.db.patch(account._id, {
      isDefaultBuyer: target.roles.includes("buyer")
        ? account._id === target._id
        : account.isDefaultBuyer,
      isDefaultPayout: target.roles.includes("payout")
        ? account._id === target._id
        : account.isDefaultPayout,
      lastSyncedAt: Date.now(),
    });
  }
}
