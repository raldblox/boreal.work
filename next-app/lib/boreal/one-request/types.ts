import type {
  AgentExecutionResult,
  AutonomousAgentDefinition,
} from "../../../agents/shared/types";
import type { PersistedIntent } from "../schemas/intent";

export type OneRequestPaymentSource = "agentcash" | "openwallet";

export type OneRequestRouteSelection = {
  agent: AutonomousAgentDefinition;
  outputKinds: string[];
  quoteUsd: number;
  score: number;
};

export type OneRequestRoutePlan = {
  assetPrompt?: string;
  capabilityTags?: string[];
  category?: string;
  currency: "USD";
  estimatedMinutes: number;
  keywords?: string[];
  networkKey: "solana:devnet";
  paymentProtocol: "x402";
  routeTarget?: PersistedIntent["routeTarget"];
  selected: OneRequestRouteSelection[];
  speechText?: string;
  size?: string;
  summary: string;
  seconds?: string;
  title: string;
  totalQuoteUsd: number;
  voice?: string;
};

export type OneRequestExecutionResult = {
  agentKey: string;
  result: AgentExecutionResult;
};

export type OneRequestPaymentReceipt = {
  amount: number;
  currency: "USD";
  networkKey: "solana:devnet";
  payerSource: OneRequestPaymentSource;
  quoteToken: string;
  requestToken: string;
  signature: string;
  signedMessage?: string;
  txHash: string;
  walletAddress: string;
};

export type OneRequestCaller = {
  displayName: string;
  externalId: string;
  walletAddress: string;
};

export type OneRequestIntentContext = {
  intent: PersistedIntent;
  message: string;
};
