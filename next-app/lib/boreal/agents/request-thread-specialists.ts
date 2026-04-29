import { getDirectExecutionAgent } from "../../../agents/index.ts";
import type { AgentExecutionResult } from "../../../agents/shared/types.ts";
import type { RequestDetail } from "../integrations/convex/function-refs";

const INTERACTIVE_REQUEST_AGENT_KEYS = new Set([
  "mvp-architect",
  "startup-pressure-test",
]);

type InteractiveRequestThreadAgent = ReturnType<typeof getDirectExecutionAgent>;

type InteractiveRequestThreadPlan =
  | {
      kind: "ask";
      agent: InteractiveRequestThreadAgent;
      assistantMessage: string;
    }
  | {
      agent: InteractiveRequestThreadAgent;
      kind: "execute";
      payload: Record<string, unknown>;
    };

export function planInteractiveRequestThread(
  detail: RequestDetail | null,
): InteractiveRequestThreadPlan | null {
  if (!detail?.intent || !detail.assignment) {
    return null;
  }

  if (
    detail.intent.status !== "claimed" &&
    detail.intent.status !== "in_progress"
  ) {
    return null;
  }

  const agentKey = detail.assignment.tools.find((toolName) =>
    INTERACTIVE_REQUEST_AGENT_KEYS.has(toolName),
  );

  if (!agentKey) {
    return null;
  }

  const agent = getDirectExecutionAgent(agentKey);
  const agentMessages = detail.messages.filter(
    (message) =>
      message.role === "assistant" &&
      message.sender.displayName === agent.identity.displayName,
  );

  if (agentMessages.length === 0) {
    return {
      agent,
      assistantMessage: buildInitialFollowUpQuestion(agent.key),
      kind: "ask",
    };
  }

  const ownerReplies = collectOwnerRepliesAfterLastAgentTurn(
    detail,
    agent.identity.displayName,
  );
  const latestOwnerReply = ownerReplies[ownerReplies.length - 1] ?? "";

  if (!hasEnoughFollowUpDetail(latestOwnerReply)) {
    return {
      agent,
      assistantMessage: buildRefinementQuestion(agent.key),
      kind: "ask",
    };
  }

  return {
    agent,
    kind: "execute",
    payload: buildExecutionPayload(agent.key, detail, ownerReplies),
  };
}

export function isInteractiveRequestAgentKey(agentKey: string | null | undefined) {
  return Boolean(agentKey && INTERACTIVE_REQUEST_AGENT_KEYS.has(agentKey));
}

export function buildInitialInteractiveFollowUpQuestion(agentKey: string) {
  return buildInitialFollowUpQuestion(agentKey);
}

export function isGreetingLikeThreadMessage(message: string) {
  const normalized = message.trim().toLowerCase();

  if (!normalized) {
    return true;
  }

  return /^(hi|hello|hey|yo|sup|hola|good morning|good afternoon|good evening)[!.?\s]*$/.test(
    normalized,
  );
}

export function buildDirectSpecialistThreadGreeting(input: {
  agentDisplayName: string;
  agentKey?: string | null;
  teammateNames?: string[];
}) {
  const teammateNames = (input.teammateNames ?? []).filter(Boolean);

  if (teammateNames.length > 1) {
    return `${teammateNames.join(", ")} are on this request. Tell us the task or question and we will continue from this thread.`;
  }

  if (input.agentKey === "solana-operator") {
    return "Solana Operator here. Tell me the Solana task or question. I can explain the flow, approvals, and risks, or prepare a wallet-approved mainnet memo, simple SOL transfer, or message signature in this thread.";
  }

  if (input.agentKey === "voiceover-studio") {
    return "Voiceover Studio here. Paste the exact script or tell me the narration tone you want, and I will turn it into a voiceover-ready delivery from this request thread.";
  }

  return `${input.agentDisplayName} here. Tell me the task or question and I will help from this request thread.`;
}

export function buildInteractiveExecutionMessage(
  result: AgentExecutionResult,
): string {
  if (result.kind === "text") {
    return [`${result.title} completed this request.`, result.content].join(
      "\n\n",
    );
  }

  return `${result.title} completed this request.`;
}

function collectOwnerRepliesAfterLastAgentTurn(
  detail: RequestDetail,
  agentDisplayName: string,
) {
  const lastAgentTurnIndex = findLastIndex(
    detail.messages,
    (message) =>
      message.role === "assistant" &&
      message.sender.displayName === agentDisplayName,
  );

  if (lastAgentTurnIndex === -1) {
    return [];
  }

  return detail.messages
    .slice(lastAgentTurnIndex + 1)
    .filter((message) => message.role === "user" && message.sender.isCurrentUser)
    .map((message) => message.body.trim())
    .filter(Boolean);
}

function buildExecutionPayload(
  agentKey: string,
  detail: RequestDetail,
  ownerReplies: string[],
) {
  const ideaBrief = [detail.intent?.body ?? "", ...ownerReplies]
    .map((value) => value.trim())
    .filter(Boolean)
    .join("\n\n");

  if (agentKey === "mvp-architect") {
    const coreAssumption = extractCoreAssumption(ownerReplies);

    return {
      coreAssumption: coreAssumption ?? undefined,
      idea: ideaBrief,
    };
  }

  return {
    idea: ideaBrief,
  };
}

function extractCoreAssumption(ownerReplies: string[]) {
  for (const reply of ownerReplies) {
    const match = reply.match(/core assumption[:\-]\s*(.+)/i);

    if (match?.[1]) {
      return match[1].trim();
    }
  }

  return null;
}

function hasEnoughFollowUpDetail(message: string) {
  if (!message) {
    return false;
  }

  const wordCount = message
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;

  return message.trim().length >= 60 && wordCount >= 10;
}

function buildInitialFollowUpQuestion(agentKey: string) {
  if (agentKey === "mvp-architect") {
    return [
      "MVP Architect here.",
      "Give me the product idea in 3-6 sentences, who the first user is, and the single assumption you most need to test first.",
    ].join(" ");
  }

  return [
    "Startup Pressure Test here.",
    "Give me the idea in 3-6 sentences: who it is for, the painful problem, the current workaround, and why they would pay now.",
  ].join(" ");
}

function buildRefinementQuestion(agentKey: string) {
  if (agentKey === "mvp-architect") {
    return [
      "Still too thin.",
      "Tell me the concrete product, the first user, and the risky assumption this MVP must prove.",
    ].join(" ");
  }

  return [
    "Still too thin.",
    "Tell me the concrete idea, target user, current pain, and why this should get paid for instead of ignored.",
  ].join(" ");
}

function findLastIndex<T>(items: T[], predicate: (item: T) => boolean) {
  for (let index = items.length - 1; index >= 0; index -= 1) {
    if (predicate(items[index]!)) {
      return index;
    }
  }

  return -1;
}
