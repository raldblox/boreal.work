import { directExecutionAgents } from "../../../agents/index.ts";
import type { AgentExecutionOutputKind } from "../../../agents/shared/types";
import { shouldUseDirectAutoRoute } from "../request-matching-policy.ts";
import type { PersistedIntent } from "../schemas/intent";

import type {
  OneRequestExecutionResult,
  OneRequestIntentContext,
  OneRequestRoutePlan,
  OneRequestRouteSelection,
} from "./types";
import { getDefaultSolanaNetworkKey } from "../solana-network.ts";

const AUTO_ROUTE_SCORE_THRESHOLD = 28;

export function buildAutoRoutePlan(input: OneRequestIntentContext): OneRequestRoutePlan | null {
  if (
    input.intent.needsClarification ||
    input.intent.missingDetails.length > 0 ||
    !shouldUseDirectAutoRoute(input.intent.classification)
  ) {
    return null;
  }

  const request = {
    _id: "one-request",
    category: input.intent.category,
    requestedOutputTypes: input.intent.requestedOutputTypes,
    routeTarget: input.intent.routeTarget,
    status: "open",
    summary: input.intent.summary,
    title: input.intent.title,
  };
  const detail = {
    _id: "one-request",
    body: input.intent.body,
    category: input.intent.category,
    requestedOutputTypes: input.intent.requestedOutputTypes,
    routeTarget: input.intent.routeTarget,
    status: "open",
    summary: input.intent.summary,
    title: input.intent.title,
  };
  const scored = directExecutionAgents
    .filter((agent) => agent.settlement)
    .map((agent) => ({
      agent,
      outputKinds: agent.directExecution?.outputKinds ?? [],
      quoteUsd: agent.settlement!.autoQuoteUsd,
      score: agent.match({ detail, request }),
    }))
    .filter((candidate) => candidate.score >= AUTO_ROUTE_SCORE_THRESHOLD);

  if (scored.length === 0) {
    return null;
  }

  const requestedKinds = input.intent.requestedOutputTypes.filter(
    (kind): kind is AgentExecutionOutputKind =>
      kind === "image_generation" ||
      kind === "speech_generation" ||
      kind === "text" ||
      kind === "video_generation",
  );
  const nonTextRequested = requestedKinds.filter((kind) => kind !== "text");
  const targetKinds = nonTextRequested.length > 0 ? nonTextRequested : requestedKinds;
  const selections = new Map<string, OneRequestRouteSelection>();

  for (const kind of targetKinds) {
    const candidate = scored
      .filter((entry) => entry.outputKinds.includes(kind))
      .sort((left, right) => right.score - left.score)[0];

    if (candidate) {
      selections.set(candidate.agent.key, candidate);
    }
  }

  const textOnlyRoute = targetKinds.length === 1 && targetKinds[0] === "text";

  if (textOnlyRoute) {
    const textCandidates = scored
      .filter((entry) => entry.outputKinds.includes("text"))
      .sort((left, right) => right.score - left.score);

    for (const textCandidate of textCandidates.slice(0, 2)) {
      selections.set(textCandidate.agent.key, textCandidate);
    }
  } else if (selections.size === 0) {
    const bestCandidate = scored.sort((left, right) => right.score - left.score)[0];

    if (bestCandidate) {
      selections.set(bestCandidate.agent.key, bestCandidate);
    }
  }

  const selected = [...selections.values()].sort((left, right) => right.score - left.score);

  if (selected.length === 0) {
    return null;
  }

  const totalQuoteUsd = selected.reduce((sum, selection) => sum + selection.quoteUsd, 0);

  return {
    assetPrompt: input.intent.assetPrompt,
    capabilityTags: input.intent.capabilityTags,
    category: input.intent.category,
    currency: "USDC",
    estimatedMinutes: Math.max(2, selected.length * 3),
    keywords: input.intent.keywords,
    networkKey: getDefaultSolanaNetworkKey(),
    paymentProtocol: "x402",
    routeTarget: input.intent.routeTarget,
    selected,
    size: input.intent.videoSize,
    speechText: input.intent.speechText,
    seconds: input.intent.videoSeconds,
    summary:
      selected.length === 1
        ? `Auto route locked to ${selected[0].agent.identity.displayName}.`
        : `Auto route locked across ${selected.map((selection) => selection.agent.identity.displayName).join(", ")}.`,
    title:
      input.intent.title.trim().length > 0
        ? input.intent.title
        : "Boreal one-request execution",
    totalQuoteUsd,
    voice: input.intent.voice,
  };
}

export async function executeAutoRoute(input: {
  intent: PersistedIntent;
  modelId?: string;
  routePlan: OneRequestRoutePlan;
}): Promise<OneRequestExecutionResult[]> {
  const results: OneRequestExecutionResult[] = [];

  for (const selection of input.routePlan.selected) {
    if (!selection.agent.directExecution) {
      continue;
    }

    const result = await selection.agent.directExecution.invoke({
      modelId: input.modelId,
      payload: buildDirectExecutionPayload(selection.agent.key, input.intent),
    });

    results.push({
      agentKey: selection.agent.key,
      result,
    });
  }

  return results;
}

function buildDirectExecutionPayload(agentKey: string, intent: PersistedIntent) {
  const promptText =
    intent.assetPrompt.trim().length > 0
      ? intent.assetPrompt
      : `${intent.title}\n${intent.summary}\n${intent.body}`.trim();

  switch (agentKey) {
    case "image-studio":
      return {
        prompt: promptText,
        title: intent.title,
      };
    case "voiceover-studio":
      return {
        instructions:
          intent.responseInstructions.trim().length > 0
            ? intent.responseInstructions
            : "Clear, concise, product-ready delivery.",
        text: intent.speechText.trim().length > 0 ? intent.speechText : intent.body,
        title: intent.title,
        voice: intent.voice,
      };
    case "motion-video-studio":
      return {
        prompt: promptText,
        seconds: intent.videoSeconds,
        size: intent.videoSize,
        title: intent.title,
      };
    case "startup-pressure-test":
      return {
        idea: intent.body,
      };
    case "mvp-architect":
      return {
        idea: intent.body,
      };
    case "solana-operator": {
      const walletMode = inferSolanaWalletMode(promptText);
      const riskPreference = inferSolanaRiskPreference(promptText);
      const network = inferSolanaNetwork(promptText);

      return {
        ...(network ? { network } : {}),
        ...(riskPreference ? { riskPreference } : {}),
        request: promptText,
        ...(walletMode ? { walletMode } : {}),
      };
    }
    default:
      return {
        prompt: promptText,
        title: intent.title,
      };
  }
}

function inferSolanaWalletMode(text: string) {
  const normalized = text.toLowerCase();

  if (normalized.includes("privy")) {
    return "privy";
  }

  if (normalized.includes("phantom")) {
    return "phantom";
  }

  if (normalized.includes("backpack")) {
    return "backpack";
  }

  return undefined;
}

function inferSolanaRiskPreference(text: string) {
  const normalized = text.toLowerCase();

  if (normalized.includes("aggressive")) {
    return "aggressive";
  }

  if (normalized.includes("balanced")) {
    return "balanced";
  }

  if (normalized.includes("conservative")) {
    return "conservative";
  }

  return undefined;
}

function inferSolanaNetwork(text: string) {
  const normalized = text.toLowerCase();

  if (
    normalized.includes("testnet") ||
    normalized.includes("devnet") ||
    normalized.includes("solana:testnet")
  ) {
    return "solana:testnet";
  }

  if (normalized.includes("mainnet") || normalized.includes("solana:mainnet")) {
    return "solana:mainnet";
  }

  return getDefaultSolanaNetworkKey();
}
