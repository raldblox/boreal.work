export type RequestTeamExecutionMode =
  | "fanout_merge"
  | "lead_only"
  | "sequential_handoff"
  | "validator_gate";

export type RequestTeamReplyPolicy =
  | "ask_team"
  | "lead_only"
  | "mention_only";

export type RequestTeamRole = "lead" | "validator" | "worker";

export type PresetTeamRunStatus = "awaiting_owner" | "running";

export type PresetTeamState = {
  currentSpeakerKey: string | null;
  cycleNumber: number;
  cycleStartedAt: number | null;
  lastAdvanceAt: number | null;
  nextTurnIndex: number | null;
  runStatus: PresetTeamRunStatus;
};

export type RequestTeamMember = {
  agentKey: string;
  displayName: string;
  replyPolicy: RequestTeamReplyPolicy;
  role: RequestTeamRole;
};

export type RequestTeamBlueprint = {
  executionMode: RequestTeamExecutionMode;
  leadAgentKey: string | null;
  members: RequestTeamMember[];
  presetState?: PresetTeamState;
  presetKey?: string;
  teamDisplayName?: string;
  version: 1 | 2 | 3;
};

export function buildDirectAgentTeamBlueprint(
  agents: Array<{
    identity: {
      displayName: string;
    };
    key: string;
  }>,
): RequestTeamBlueprint | null {
  if (agents.length === 0) {
    return null;
  }

  return {
    executionMode: "lead_only",
    leadAgentKey: agents[0]?.key ?? null,
    members: agents.map((agent, index) => ({
      agentKey: agent.key,
      displayName: agent.identity.displayName,
      replyPolicy: index === 0 ? "lead_only" : "ask_team",
      role: index === 0 ? "lead" : "worker",
    })),
    version: 1,
  };
}

export function buildPresetTeamBlueprint(input: {
  cycleNumber?: number;
  cycleStartedAt?: number | null;
  currentSpeakerKey?: string | null;
  executionMode: RequestTeamExecutionMode;
  key: string;
  lastAdvanceAt?: number | null;
  members: RequestTeamMember[];
  nextTurnIndex?: number | null;
  runStatus?: PresetTeamRunStatus;
  teamDisplayName: string;
}): RequestTeamBlueprint | null {
  if (input.members.length === 0) {
    return null;
  }

  const normalizedNextTurnIndex = input.nextTurnIndex ?? 0;

  return {
    executionMode: input.executionMode,
    leadAgentKey: input.members[0]?.agentKey ?? null,
    members: input.members,
    presetState: {
      currentSpeakerKey:
        input.currentSpeakerKey ??
        resolvePresetSpeakerKey(input.members, normalizedNextTurnIndex),
      cycleNumber: Math.max(1, input.cycleNumber ?? 1),
      cycleStartedAt: input.cycleStartedAt ?? null,
      lastAdvanceAt: input.lastAdvanceAt ?? null,
      nextTurnIndex: normalizedNextTurnIndex,
      runStatus: input.runStatus ?? "running",
    },
    presetKey: input.key,
    teamDisplayName: input.teamDisplayName,
    version: 3,
  };
}

export function parseRequestTeamBlueprint(
  value: string | null | undefined,
): RequestTeamBlueprint | null {
  if (!value) {
    return null;
  }

  try {
    const parsed = JSON.parse(value) as Partial<RequestTeamBlueprint>;

    if (
      (parsed?.version !== 1 &&
        parsed?.version !== 2 &&
        parsed?.version !== 3) ||
      !Array.isArray(parsed.members) ||
      typeof parsed.executionMode !== "string"
    ) {
      return null;
    }

    const members = parsed.members
      .filter(
        (member): member is RequestTeamMember =>
          Boolean(
            member &&
              typeof member.agentKey === "string" &&
              typeof member.displayName === "string" &&
              typeof member.replyPolicy === "string" &&
              typeof member.role === "string",
          ),
      )
      .map((member) => ({
        agentKey: member.agentKey,
        displayName: member.displayName,
        replyPolicy: normalizeReplyPolicy(member.replyPolicy),
        role: normalizeRole(member.role),
      }));

    if (members.length === 0) {
      return null;
    }

    return {
      executionMode: normalizeExecutionMode(parsed.executionMode),
      leadAgentKey:
        typeof parsed.leadAgentKey === "string"
          ? parsed.leadAgentKey
          : members[0]!.agentKey,
      members,
      presetState: normalizePresetState(parsed.presetState, members),
      presetKey: typeof parsed.presetKey === "string" ? parsed.presetKey : undefined,
      teamDisplayName:
        typeof parsed.teamDisplayName === "string"
          ? parsed.teamDisplayName
          : undefined,
      version: parsed.version,
    };
  } catch {
    return null;
  }
}

export function serializeRequestTeamBlueprint(
  blueprint: RequestTeamBlueprint | null,
) {
  return blueprint ? JSON.stringify(blueprint) : undefined;
}

export function shouldAskTeam(message: string) {
  const normalized = message.trim().toLowerCase();

  return (
    normalized.startsWith("ask team") ||
    normalized.startsWith("@team") ||
    normalized.startsWith("/team")
  );
}

export function stripTeamDirective(message: string) {
  return message
    .trim()
    .replace(/^ask team[:\s-]*/i, "")
    .replace(/^@team[:\s-]*/i, "")
    .replace(/^\/team[:\s-]*/i, "")
    .trim();
}

function normalizeExecutionMode(
  value: string,
): RequestTeamExecutionMode {
  switch (value) {
    case "fanout_merge":
    case "sequential_handoff":
    case "validator_gate":
      return value;
    case "lead_only":
    default:
      return "lead_only";
  }
}

function normalizeReplyPolicy(
  value: string,
): RequestTeamReplyPolicy {
  switch (value) {
    case "ask_team":
    case "mention_only":
      return value;
    case "lead_only":
    default:
      return "lead_only";
  }
}

function normalizeRole(
  value: string,
): RequestTeamRole {
  switch (value) {
    case "validator":
    case "worker":
      return value;
    case "lead":
    default:
      return "lead";
  }
}

function normalizePresetState(
  value: unknown,
  members: RequestTeamMember[],
): PresetTeamState | undefined {
  if (!value || typeof value !== "object") {
    return undefined;
  }

  const presetState = value as Partial<PresetTeamState>;
  const nextTurnIndex =
    presetState.nextTurnIndex === null ||
    typeof presetState.nextTurnIndex === "number"
      ? presetState.nextTurnIndex ?? null
      : null;

  return {
    currentSpeakerKey:
      typeof presetState.currentSpeakerKey === "string"
        ? presetState.currentSpeakerKey
        : resolvePresetSpeakerKey(members, nextTurnIndex),
    cycleNumber:
      typeof presetState.cycleNumber === "number" &&
      Number.isFinite(presetState.cycleNumber) &&
      presetState.cycleNumber > 0
        ? Math.floor(presetState.cycleNumber)
        : 1,
    cycleStartedAt:
      typeof presetState.cycleStartedAt === "number" &&
      Number.isFinite(presetState.cycleStartedAt)
        ? presetState.cycleStartedAt
        : null,
    lastAdvanceAt:
      typeof presetState.lastAdvanceAt === "number" &&
      Number.isFinite(presetState.lastAdvanceAt)
        ? presetState.lastAdvanceAt
        : null,
    nextTurnIndex,
    runStatus:
      presetState.runStatus === "awaiting_owner"
        ? "awaiting_owner"
        : "running",
  };
}

function resolvePresetSpeakerKey(
  members: RequestTeamMember[],
  nextTurnIndex: number | null,
) {
  if (nextTurnIndex === null || nextTurnIndex !== 0) {
    return null;
  }

  return members[nextTurnIndex]?.agentKey ?? null;
}
