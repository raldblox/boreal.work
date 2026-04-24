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
    capabilityTags: string[];
    category: string;
    deliveryType: "async" | "instant" | "scheduled";
    description: string;
    priceAmount: number;
    priceType: "fixed" | "hourly" | "scoped";
    supplyType: "agent_tool" | "capability" | "collective" | "product";
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
};
