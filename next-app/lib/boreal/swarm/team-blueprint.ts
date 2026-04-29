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
  version: 1;
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

export function parseRequestTeamBlueprint(
  value: string | null | undefined,
): RequestTeamBlueprint | null {
  if (!value) {
    return null;
  }

  try {
    const parsed = JSON.parse(value) as Partial<RequestTeamBlueprint>;

    if (
      parsed?.version !== 1 ||
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
        typeof parsed.leadAgentKey === "string" ? parsed.leadAgentKey : members[0]!.agentKey,
      members,
      version: 1,
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
