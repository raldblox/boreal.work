import type { Doc } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";

import {
  getDefaultPayoutWalletAccountId,
  getProfileIdForUser,
  getWalletAccountContext,
} from "./commerceCore";

type CollectiveContext = MutationCtx | QueryCtx;

export type CollectiveSplitPlanEntry = {
  memberId: string;
  percent: number;
};

export type NormalizedCollectiveProposal = {
  collectiveMembers: string[];
  isCollective: boolean;
  splitPlan: CollectiveSplitPlanEntry[];
};

export type ResolvedCollectiveParticipant = {
  displayName: string;
  externalId: string;
  handle: string | null;
  payoutWalletAccountId: Awaited<
    ReturnType<typeof getDefaultPayoutWalletAccountId>
  >;
  payoutWalletContext: Awaited<ReturnType<typeof getWalletAccountContext>>;
  profileId: string | undefined;
  user: Doc<"users">;
  userId: string;
};

export function normalizeCollectiveProposalInput(input: {
  collectiveMembers?: string[] | undefined;
  proposerExternalId?: string | undefined;
  splitPlan?:
    | Array<{
        memberId: string;
        percent: number;
      }>
    | undefined;
}): { collective?: NormalizedCollectiveProposal; error?: string } {
  const proposerExternalId = input.proposerExternalId?.trim();
  const normalizedMembers = dedupeStringArray(input.collectiveMembers);
  const normalizedPlan = normalizeSplitPlan(input.splitPlan);
  const requestedCollective =
    normalizedMembers.length > 0 || normalizedPlan.length > 0;

  if (!requestedCollective) {
    return {};
  }

  if (!proposerExternalId) {
    return {
      error:
        "collective proposals require a registered proposer identity with an external id.",
    };
  }

  const memberSet = new Set<string>(normalizedMembers);

  for (const entry of normalizedPlan) {
    memberSet.add(entry.memberId);
  }

  memberSet.add(proposerExternalId);

  const collectiveMembers = Array.from(memberSet);

  if (collectiveMembers.length < 2) {
    return {};
  }

  const splitPlan =
    normalizedPlan.length > 0
      ? normalizedPlan
      : buildEqualSplitPlan(collectiveMembers);

  const splitMemberIds = new Set(splitPlan.map((entry) => entry.memberId));

  if (
    splitMemberIds.size !== collectiveMembers.length ||
    collectiveMembers.some((memberId) => !splitMemberIds.has(memberId))
  ) {
    return {
      error:
        "collective split plans must cover every collective member exactly once.",
    };
  }

  const totalPercent = splitPlan.reduce(
    (sum, entry) => sum + entry.percent,
    0,
  );

  if (Math.abs(totalPercent - 100) > 0.001) {
    return {
      error: "collective split plans must add up to 100 percent.",
    };
  }

  return {
    collective: {
      collectiveMembers,
      isCollective: true,
      splitPlan,
    },
  };
}

export function proposalIncludesParticipant(
  proposal:
    | {
        collectiveMembers?: string[] | undefined;
        proposerUserId?: string | undefined;
      }
    | null
    | undefined,
  input: {
    externalId?: string | null;
    userId?: string | null;
  },
) {
  if (!proposal) {
    return false;
  }

  if (input.userId && proposal.proposerUserId === input.userId) {
    return true;
  }

  if (!input.externalId) {
    return false;
  }

  return (proposal.collectiveMembers ?? []).includes(input.externalId);
}

export async function resolveCollectiveParticipants(
  ctx: CollectiveContext,
  proposal: {
    collectiveMembers?: string[] | undefined;
    proposerUserId?: string | undefined;
    splitPlan?:
      | Array<{
          memberId: string;
          percent: number;
        }>
      | undefined;
  },
) {
  const participants: ResolvedCollectiveParticipant[] = [];
  const memberIds = dedupeStringArray(proposal.collectiveMembers);

  for (const externalId of memberIds) {
    const user = await getUserByExternalId(ctx, externalId);

    if (!user) {
      return {
        error: "collective_member_not_found" as const,
        memberId: externalId,
      };
    }

    const payoutWalletAccountId = await getDefaultPayoutWalletAccountId(
      ctx,
      user._id,
    );
    participants.push({
      displayName: user.displayName,
      externalId,
      handle: user.handle ?? null,
      payoutWalletAccountId,
      payoutWalletContext: await getWalletAccountContext(
        ctx,
        payoutWalletAccountId,
      ),
      profileId: await getProfileIdForUser(ctx, user._id),
      user,
      userId: user._id,
    });
  }

  const proposerIncluded =
    !!proposal.proposerUserId &&
    participants.some(
      (participant) => participant.userId === proposal.proposerUserId,
    );

  if (proposal.proposerUserId && !proposerIncluded) {
    const proposer = (await ctx.db.get(
      proposal.proposerUserId as never,
    )) as Doc<"users"> | null;

    if (proposer) {
      const payoutWalletAccountId = await getDefaultPayoutWalletAccountId(
        ctx,
        proposer._id,
      );
      participants.unshift({
        displayName: proposer.displayName,
        externalId: proposer.externalId ?? `user:${proposer._id}`,
        handle: proposer.handle ?? null,
        payoutWalletAccountId,
        payoutWalletContext: await getWalletAccountContext(
          ctx,
          payoutWalletAccountId,
        ),
        profileId: await getProfileIdForUser(ctx, proposer._id),
        user: proposer,
        userId: proposer._id,
      });
    }
  }

  return {
    participants: dedupeParticipants(participants),
  };
}

export function buildCollectivePayoutAllocations(input: {
  amount: number;
  participants: Array<{
    externalId: string;
    userId: string;
  }>;
  splitPlan?:
    | Array<{
        memberId: string;
        percent: number;
      }>
    | undefined;
}) {
  if (input.amount <= 0) {
    return [];
  }

  const normalizedPlan =
    input.splitPlan && input.splitPlan.length > 0
      ? input.splitPlan
      : buildEqualSplitPlan(input.participants.map((participant) => participant.externalId));
  const totalCents = Math.round(input.amount * 100);
  let assignedCents = 0;

  return input.participants.map((participant, index) => {
    const splitEntry = normalizedPlan.find(
      (entry) => entry.memberId === participant.externalId,
    );
    const cents =
      index === input.participants.length - 1
        ? totalCents - assignedCents
        : Math.round(totalCents * ((splitEntry?.percent ?? 0) / 100));

    assignedCents += cents;

    return {
      amount: cents / 100,
      externalId: participant.externalId,
      percent: splitEntry?.percent ?? 0,
      userId: participant.userId,
    };
  });
}

function normalizeSplitPlan(
  raw:
    | Array<{
        memberId: string;
        percent: number;
      }>
    | undefined,
) {
  if (!raw || raw.length === 0) {
    return [];
  }

  const normalized: CollectiveSplitPlanEntry[] = [];
  const seen = new Set<string>();

  for (const entry of raw) {
    const memberId = entry.memberId?.trim();
    const percent =
      typeof entry.percent === "number" && Number.isFinite(entry.percent)
        ? Math.round(entry.percent * 1000) / 1000
        : NaN;

    if (!memberId || seen.has(memberId) || percent <= 0) {
      continue;
    }

    seen.add(memberId);
    normalized.push({
      memberId,
      percent,
    });
  }

  return normalized;
}

function dedupeStringArray(values?: string[] | undefined) {
  const seen = new Set<string>();
  const normalized: string[] = [];

  for (const value of values ?? []) {
    const trimmed = value.trim();

    if (!trimmed || seen.has(trimmed)) {
      continue;
    }

    seen.add(trimmed);
    normalized.push(trimmed);
  }

  return normalized;
}

function buildEqualSplitPlan(memberIds: string[]) {
  if (memberIds.length === 0) {
    return [];
  }

  const base = Math.floor((100000 / memberIds.length)) / 1000;
  let assigned = 0;

  return memberIds.map((memberId, index) => {
    const percent =
      index === memberIds.length - 1
        ? Math.round((100 - assigned) * 1000) / 1000
        : base;

    assigned += percent;

    return {
      memberId,
      percent,
    };
  });
}

function dedupeParticipants(participants: ResolvedCollectiveParticipant[]) {
  const deduped = new Map<string, ResolvedCollectiveParticipant>();

  for (const participant of participants) {
    if (!deduped.has(participant.userId)) {
      deduped.set(participant.userId, participant);
    }
  }

  return Array.from(deduped.values());
}

async function getUserByExternalId(ctx: CollectiveContext, externalId: string) {
  return ctx.db
    .query("users")
    .withIndex("by_externalId", (queryBuilder) =>
      queryBuilder.eq("externalId", externalId),
    )
    .unique();
}
