import { inferBorealNetworkSelection } from "../../lib/boreal/commerce/networks";
import { loadAgentEnv } from "./env.ts";
import type {
  AgentPaymentSource,
  AgentSettlementProfile,
} from "./types.ts";

const DEFAULT_AGENT_SOLANA_WALLET =
  "CxkLjW31HqX4Mp7JuDmSRBxEALqbnj8HWHn48FRWD4yS";
const DEFAULT_AGENT_EVM_WALLET =
  "0x339f616BA1A347ef40d3EdD5278c0B44315E0836";
const DEFAULT_AGENT_PAYER_SOURCES: AgentPaymentSource[] = [
  "openwallet",
  "agentcash",
];

export type AgentRuntimeTarget = "dev" | "prod";

function firstNonEmpty(...values: Array<string | undefined>) {
  for (const value of values) {
    const trimmed = value?.trim();

    if (trimmed) {
      return trimmed;
    }
  }

  return null;
}

export function applyAgentRuntimeFlags(argv: string[] = process.argv) {
  const args = argv.slice(2);

  // CLI flags intentionally win over env defaults so operators can force the target.
  if (args.includes("--prod")) {
    process.env.BOREAL_AGENT_RUNTIME_TARGET = "prod";
    process.env.BOREAL_AGENT_RUNTIME_ENABLED = "1";
  }

  if (args.includes("--dev")) {
    process.env.BOREAL_AGENT_RUNTIME_TARGET = "dev";
  }
}

export function getAgentRuntimeTarget(): AgentRuntimeTarget {
  loadAgentEnv();
  const value = (process.env.BOREAL_AGENT_RUNTIME_TARGET ?? "")
    .trim()
    .toLowerCase();

  return value === "prod" || value === "production" ? "prod" : "dev";
}

export function isAgentRuntimeEnabled() {
  loadAgentEnv();
  const value = (process.env.BOREAL_AGENT_RUNTIME_ENABLED ?? "")
    .trim()
    .toLowerCase();

  return (
    value === "1" ||
    value === "true" ||
    value === "yes" ||
    value === "on"
  );
}

export function resolveAgentConvexUrl() {
  loadAgentEnv();
  const target = getAgentRuntimeTarget();
  // Production agents may point at a different deployment than local/dev.
  const url =
    target === "prod"
      ? firstNonEmpty(
          process.env.BOREAL_AGENT_CONVEX_URL_PROD,
          process.env.BOREAL_AGENT_CONVEX_URL,
          process.env.NEXT_PUBLIC_CONVEX_URL,
        )
      : firstNonEmpty(
          process.env.BOREAL_AGENT_CONVEX_URL_DEV,
          process.env.BOREAL_AGENT_CONVEX_URL,
          process.env.NEXT_PUBLIC_CONVEX_URL,
        );

  if (!url) {
    throw new Error(
      target === "prod"
        ? "Missing BOREAL_AGENT_CONVEX_URL_PROD, BOREAL_AGENT_CONVEX_URL, or NEXT_PUBLIC_CONVEX_URL for the production agent runtime."
        : "Missing BOREAL_AGENT_CONVEX_URL_DEV, BOREAL_AGENT_CONVEX_URL, or NEXT_PUBLIC_CONVEX_URL for the agent runtime.",
    );
  }

  return url;
}

export function assertAgentRuntimeReady() {
  const target = getAgentRuntimeTarget();

  if (target === "prod" && !isAgentRuntimeEnabled()) {
    throw new Error(
      "Production agent runtime is disabled. Set BOREAL_AGENT_RUNTIME_ENABLED=1 or pass --prod.",
    );
  }

  resolveAgentConvexUrl();
}

export function getDefaultAgentWalletAddress(
  chainFamily: AgentSettlementProfile["chainFamily"],
) {
  loadAgentEnv();

  // All built-in agents share one default wallet per chain family unless env overrides it.
  if (chainFamily === "evm") {
    return (
      firstNonEmpty(
        process.env.BOREAL_AGENT_DEFAULT_EVM_WALLET,
        DEFAULT_AGENT_EVM_WALLET,
      ) ?? DEFAULT_AGENT_EVM_WALLET
    );
  }

  return (
    firstNonEmpty(
      process.env.BOREAL_AGENT_DEFAULT_SOLANA_WALLET,
      DEFAULT_AGENT_SOLANA_WALLET,
    ) ?? DEFAULT_AGENT_SOLANA_WALLET
  );
}

export function buildDefaultAgentSettlement(input?: {
  autoQuoteUsd?: number;
  chainFamily?: AgentSettlementProfile["chainFamily"];
  environment?: AgentSettlementProfile["environment"];
  networkKey?: AgentSettlementProfile["networkKey"];
  payerSources?: AgentPaymentSource[];
}) {
  loadAgentEnv();

  // Settlement follows the selected network policy, then binds to the shared wallet.
  const selection = inferBorealNetworkSelection({
    chainFamily:
      input?.chainFamily ?? process.env.BOREAL_AGENT_CHAIN_FAMILY ?? null,
    environment:
      input?.environment ?? process.env.BOREAL_AGENT_CHAIN_ENV ?? null,
    networkKey:
      input?.networkKey ?? process.env.BOREAL_AGENT_NETWORK_KEY ?? null,
  });
  const walletAddress = getDefaultAgentWalletAddress(selection.chainFamily);

  return {
    autoQuoteUsd: input?.autoQuoteUsd ?? 0.01,
    chainFamily: selection.chainFamily,
    environment: selection.environment,
    networkKey: selection.networkKey,
    payerSources: input?.payerSources ?? DEFAULT_AGENT_PAYER_SOURCES,
    payoutAddress: walletAddress,
    walletAddress,
  } satisfies AgentSettlementProfile;
}
