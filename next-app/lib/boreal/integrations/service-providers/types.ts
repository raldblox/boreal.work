export type ServiceProviderKey =
  | "agentic-market"
  | "agentcash"
  | "frames"
  | "moonpay"
  | "solana-agent-kit"
  | "manual";

export type PaymentProtocol =
  | "x402"
  | "mpp"
  | "direct-solana"
  | "widget"
  | "none";

export type ExecutionSurface =
  | "desktop"
  | "registry"
  | "http"
  | "mcp"
  | "jsonrpc"
  | "sdk"
  | "widget"
  | "handoff";

export type WalletExecutionMode =
  | "client-sign"
  | "server-execute-with-user-authorization"
  | "external-wallet"
  | "provider-managed";

export type CapabilityRoutingTier =
  | "A-direct"
  | "A-delegated"
  | "B-ingest-handoff"
  | "C-manual";

export type DiscoveryInput = {
  limit?: number;
  query?: string;
};

export type NormalizedCapability = {
  acceptedCurrencies: string[];
  capabilityTags: string[];
  category: string;
  description: string;
  endpoint?: {
    bodyType?: "json" | "none";
    jsonRpcMethod?: string;
    method?: string;
    mcpServerUrl?: string;
    toolName?: string;
    url?: string;
  };
  evidence: {
    returnsReceipt: boolean;
    returnsTxHash: boolean;
    supportsSchemaMetadata: boolean;
  };
  executionSurface: ExecutionSurface;
  keywords: string[];
  paymentNetworkHints: string[];
  paymentProtocol: PaymentProtocol;
  pricing: {
    amount?: number;
    currency?: string;
    raw?: unknown;
    type: "fixed" | "free" | "metered" | "quote-required";
  };
  raw?: unknown;
  requiresHumanApproval: boolean;
  routingTier: CapabilityRoutingTier;
  sourceCapabilityId: string;
  sourceId: string;
  sourceProvider: ServiceProviderKey;
  sourceProviderUrl?: string;
  sourceUrl?: string;
  subtitle?: string;
  supportsDirectInvoke: boolean;
  supportsPrivyWallet: boolean;
  title: string;
  walletRequirements: {
    supportedWalletModes: WalletExecutionMode[];
  };
};

export interface ServiceDiscoveryAdapter {
  key: ServiceProviderKey;
  listCapabilities(input: DiscoveryInput): Promise<NormalizedCapability[]>;
}
