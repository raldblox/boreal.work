export type AgentMarketplaceRequest = {
  _id: string;
  category: string;
  requestedOutputTypes: string[];
  routeTarget: string;
  status: string;
  summary: string;
  title: string;
};

export type AgentRequestDetail = {
  access: {
    canSubmitProposal: boolean;
  } | null;
  intent: {
    _id: string;
    body: string;
    category: string;
    requestedOutputTypes: string[];
    routeTarget: string;
    status: string;
    summary: string;
    title: string;
  } | null;
  proposals: Array<{
    _id: string;
    currency: string;
    deliverablesBody: string;
    etaAt: number;
    isMine: boolean;
    price: number;
    status: string;
  }>;
};

export type AgentExecutionField = {
  description: string;
  name: string;
  required: boolean;
  type: "boolean" | "number" | "object" | "string";
};

export type AgentExecutionOutputKind =
  | "image_generation"
  | "speech_generation"
  | "text"
  | "video_generation";

export type AgentPaymentSource = "agentcash" | "openwallet";
export type AgentConnectorHealthStatus = "failing" | "healthy" | "unknown";
export type AgentExecutionSurface =
  | "handoff"
  | "http"
  | "jsonrpc"
  | "mcp"
  | "registry"
  | "sdk"
  | "widget";
export type AgentPaymentProtocol =
  | "direct-solana"
  | "mpp"
  | "none"
  | "widget"
  | "x402";
export type AgentSourceProviderKey =
  | "agentic-market"
  | "agentcash"
  | "frames"
  | "manual"
  | "moonpay"
  | "solana-agent-kit";

export type AgentSettlementProfile = {
  autoQuoteUsd: number;
  chainFamily: "evm" | "solana";
  environment: "mainnet" | "testnet";
  networkKey:
    | "base:mainnet"
    | "base:sepolia"
    | "ethereum:mainnet"
    | "ethereum:sepolia"
    | "polygon:amoy"
    | "polygon:mainnet"
    | "solana:mainnet"
    | "solana:testnet";
  payerSources: AgentPaymentSource[];
  payoutAddress: string;
  walletAddress: string;
};

export type AgentExecutionResult =
  | {
      content: string;
      contentType: "text/markdown";
      kind: "text";
      title: string;
    }
  | {
      base64: string;
      kind: "image_generation";
      mediaType: string;
      prompt: string;
      title: string;
    }
  | {
      base64: string;
      format: string;
      kind: "speech_generation";
      mediaType: string;
      title: string;
      transcript: string;
      voice: string;
    }
  | {
      jobId: string;
      kind: "video_generation";
      model: string;
      progress: number;
      prompt: string;
      seconds: string;
      size: string;
      status: "completed" | "failed" | "in_progress" | "queued";
      title: string;
    };

export type AgentDirectExecutionSpec = {
  auth: "x-session";
  description: string;
  exampleRequest: Record<string, unknown>;
  fields: AgentExecutionField[];
  outputKinds: AgentExecutionOutputKind[];
  routePath: string;
  version: "boreal-agent-registry/v1";
  invoke: (input: {
    modelId?: string;
    payload: Record<string, unknown>;
  }) => Promise<AgentExecutionResult>;
};

export type AutonomousAgentDefinition = {
  identity: {
    actorKind: "agent";
    displayName: string;
    externalId: string;
    handle: string;
  };
  key: string;
  profile: {
    availabilityStatus: "available" | "limited" | "unavailable";
    bio: string;
    capabilityTags: string[];
    headline: string;
    isPublic: boolean;
    productLabels: string[];
    skillTags: string[];
  };
  supplyEntry: {
    agentReady?: boolean;
    capabilityTags: string[];
    category: string;
    checkoutProtocol?: "acp" | "custom" | "ucp";
    connectorHealthStatus?: AgentConnectorHealthStatus;
    deliveryType: "async" | "instant" | "scheduled";
    description: string;
    estimatedDeliveryLabel?: string;
    executionSurface?: AgentExecutionSurface;
    executorUrl?: string;
    fulfillmentKind?: "digital" | "hybrid" | "physical" | "service";
    isCartEnabled?: boolean;
    maxConcurrentJobs?: number;
    mcpServerUrl?: string;
    mcpToolName?: string;
    offerSlug?: string;
    openApiUrl?: string;
    outputTypes?: Array<
      "image_generation" | "speech_generation" | "text" | "video_generation"
    >;
    paymentNetworkHints?: string[];
    paymentProtocol?: AgentPaymentProtocol;
    priceAmount: number;
    priceType: "fixed" | "hourly" | "scoped";
    protocolDescriptorJson?: string;
    responseSlaMinutes?: number;
    scenarioTypes?: Array<
      | "chat_only_fulfillment"
      | "consultation"
      | "custom_scoped_work"
      | "instant_digital_purchase"
      | "milestone_project"
      | "physical_service"
      | "provider_handoff_service"
      | "provider_paid_service"
      | "supply_publish"
    >;
    sourceCapabilityId?: string;
    sourceProviderKey?: AgentSourceProviderKey;
    supplyType: "agent_tool" | "capability" | "collective" | "product";
    supportsEvidencePush?: boolean;
    supportsDirectInvoke?: boolean;
    supportsPrivyWallet?: boolean;
    supportsStatusUpdates?: boolean;
    title: string;
  };
  buildDelivery: (input: {
    detail: NonNullable<AgentRequestDetail["intent"]>;
    modelId: string;
  }) => Promise<{
    deliverablesBody: string;
    deliverablesType: "markdown";
  }>;
  buildProposal: (input: {
    detail: NonNullable<AgentRequestDetail["intent"]>;
  }) => {
    currency: string;
    deliverablesBody: string;
    etaAt: number;
    price: number;
  };
  match: (input: {
    detail?: NonNullable<AgentRequestDetail["intent"]>;
    request: AgentMarketplaceRequest;
  }) => number;
  directExecution?: AgentDirectExecutionSpec;
  settlement?: AgentSettlementProfile;
};
