import { createConvexServerClient } from "../integrations/convex/server-client.ts";
import {
  convexFunctionRefs,
  type ConnectedAgentControlRecord,
  type WalletAccountRecord,
} from "../integrations/convex/function-refs.ts";
import { createSessionToken } from "../one-request/auth.ts";
import {
  createEmptyProfileBuilderDraft,
  type ProfileBuilderDraft,
} from "../schemas/profile-builder.ts";
import {
  normalizeIntentExtraction,
  type RequestedOutputType,
  type PersistedIntent,
} from "../schemas/intent.ts";
import type {
  CatalogItem,
  ChatUiContext as ChatContextShape,
  WorkspaceState,
} from "../schemas/chat.ts";

type RequesterIdentity = {
  displayName?: string;
  externalId?: string;
  handle?: string;
};

type ActiveConnectedAgent = {
  control: ConnectedAgentControlRecord;
  sessionToken: string | null;
  supply: NonNullable<ConnectedAgentControlRecord["activeSupply"]>;
  walletAddress: string | null;
};

type ResolvedConnectedAgent = {
  control: ConnectedAgentControlRecord;
  sessionToken: string | null;
  supply: NonNullable<ConnectedAgentControlRecord["activeSupply"]> | null;
  walletAddress: string | null;
};

type ConnectedAgentRuntimeResponse = {
  assistantDisplayName: string;
  assistantExternalId: string;
  assistantHandle: string | null;
  assistantMessage: string;
  assistantProvider: string;
  connectionMode: ConnectedAgentControlRecord["mode"];
  conversationId?: string;
  intent: PersistedIntent;
  intentId?: string;
  persisted: boolean;
  relatedCatalogItems: CatalogItem[];
  requiresApproval: boolean;
  workspace: WorkspaceState;
};

type ExternalAgentMessagePayload = {
  agent: {
    mode: ConnectedAgentControlRecord["mode"];
    role: ConnectedAgentControlRecord["role"];
    supply: {
      capabilityTags: string[];
      executionSurface: string | null;
      outputTypes: string[];
      supplyId: string;
      title: string;
    };
  };
  boreal: {
    auth: {
      bearerToken: string | null;
      walletAddress: string | null;
    };
    callbacks: {
      evidenceUrlTemplate: string;
      heartbeatUrlTemplate: string;
      statusUrlTemplate: string;
    };
    docs: {
      inboxApi: string;
      llms: string;
      requestApi: string;
      skill: string;
    };
    endpoints: {
      inbox: string;
      requestEventsTemplate: string;
      requestGetTemplate: string;
      requestPost: string;
      supplies: string;
    };
  };
  conversation: {
    conversationId?: string;
    requestId?: string | null;
    requestRole?: ChatContextShape["requestRole"];
    requestStatus?: string | null;
    surface: ChatContextShape["surface"];
  };
  message: string;
  requester: {
    displayName?: string;
    externalId?: string;
    handle?: string;
  };
};

type ExternalAgentNormalizedResult = {
  assistantMessage: string;
  relatedCatalogItems: CatalogItem[];
  requiresApproval: boolean;
  workspace: WorkspaceState;
};

const DEFAULT_MCP_PROTOCOL_VERSION = "2025-03-26";
const DEFAULT_MCP_TOOL_NAME = "process_boreal_message";

export async function resolveConnectedAgent(input: {
  ownerExternalId?: string;
}): Promise<ResolvedConnectedAgent | null> {
  if (!input.ownerExternalId) {
    return null;
  }

  const client = createConvexServerClient();
  const control = await client.query(convexFunctionRefs.getConnectedAgentControl, {
    ownerExternalId: input.ownerExternalId,
  });

  if (!control?.activeSupply || !control.role || control.role === "supply") {
    return {
      control: {
        activeSupply: null,
        mode: control?.mode ?? "boreal",
        role: control?.role ?? null,
      },
      sessionToken: null,
      supply: null,
      walletAddress: null,
    };
  }

  const supply = control.activeSupply;
  const hasDirectRuntime =
    supply.supportsDirectInvoke &&
    ((supply.executionSurface === "http" && Boolean(supply.executorUrl)) ||
      (supply.executionSurface === "mcp" && Boolean(supply.mcpServerUrl)));

  if (!hasDirectRuntime) {
    return {
      control,
      sessionToken: null,
      supply,
      walletAddress: null,
    };
  }

  const wallets = await client.query(convexFunctionRefs.getMyWalletAccounts, {
    ownerExternalId: input.ownerExternalId,
  });
  const walletAddress = selectSessionWalletAddress(wallets);

  return {
    control,
    sessionToken: walletAddress ? createSessionToken({ walletAddress }) : null,
    supply,
    walletAddress,
  };
}

export async function runConnectedAgentChat(input: {
  connectedAgent: ActiveConnectedAgent;
  conversationId?: string;
  message: string;
  requestUrl: string;
  requester?: RequesterIdentity;
  uiContext?: ChatContextShape;
}): Promise<ConnectedAgentRuntimeResponse> {
  const normalized = await invokeConnectedRuntime(input);
  const conversationId = input.conversationId ?? crypto.randomUUID();

  return {
    assistantDisplayName: input.connectedAgent.supply.title,
    assistantExternalId: `supply:${input.connectedAgent.supply._id}`,
    assistantHandle: slugifyHandle(input.connectedAgent.supply.title),
    assistantMessage: normalized.assistantMessage,
    assistantProvider: buildAssistantProviderKey(input.connectedAgent.supply),
    connectionMode: input.connectedAgent.control.mode,
    conversationId,
    intent: buildEphemeralConnectedIntent({
      assistantMessage: normalized.assistantMessage,
      capabilityTags: input.connectedAgent.supply.capabilityTags,
      conversationId,
      message: input.message,
      provider: buildAssistantProviderKey(input.connectedAgent.supply),
      requestedOutputTypes:
        input.connectedAgent.supply.outputTypes.length > 0
          ? input.connectedAgent.supply.outputTypes
          : ["text"],
    }),
    intentId: undefined,
    persisted: false,
    relatedCatalogItems: normalized.relatedCatalogItems,
    requiresApproval: normalized.requiresApproval,
    workspace: normalized.workspace,
  };
}

async function invokeConnectedRuntime(input: {
  connectedAgent: ActiveConnectedAgent;
  conversationId?: string;
  message: string;
  requestUrl: string;
  requester?: RequesterIdentity;
  uiContext?: ChatContextShape;
}) {
  const payload = buildExternalAgentPayload(input);
  const supply = input.connectedAgent.supply;

  if (supply.executionSurface === "http" && supply.executorUrl) {
    const response = await fetch(resolveRuntimeUrl(supply.executorUrl, input.requestUrl), {
      body: JSON.stringify(payload),
      headers: {
        "Content-Type": "application/json",
        "X-Boreal-Connected-Agent": "1",
      },
      method: "POST",
    });

    if (!response.ok) {
      const errorText = await safeReadText(response);
      throw new Error(
        errorText || `${supply.title} returned ${response.status} for Boreal chat execution.`,
      );
    }

    return normalizeExternalAgentResponse(await parseFlexibleResponseBody(response));
  }

  if (supply.executionSurface === "mcp" && supply.mcpServerUrl) {
    return invokeMcpConnectedRuntime({
      payload,
      requestUrl: input.requestUrl,
      serverUrl: supply.mcpServerUrl,
      toolName: supply.mcpToolName ?? DEFAULT_MCP_TOOL_NAME,
    });
  }

  throw new Error(`${supply.title} is not configured for direct Boreal chat execution.`);
}

function buildExternalAgentPayload(input: {
  connectedAgent: ActiveConnectedAgent;
  conversationId?: string;
  message: string;
  requestUrl: string;
  requester?: RequesterIdentity;
  uiContext?: ChatContextShape;
}): ExternalAgentMessagePayload {
  const origin = new URL(input.requestUrl).origin;
  const supply = input.connectedAgent.supply;

  return {
    agent: {
      mode: input.connectedAgent.control.mode,
      role: input.connectedAgent.control.role,
      supply: {
        capabilityTags: supply.capabilityTags,
        executionSurface: supply.executionSurface,
        outputTypes: supply.outputTypes,
        supplyId: supply._id,
        title: supply.title,
      },
    },
    boreal: {
      auth: {
        bearerToken: input.connectedAgent.sessionToken,
        walletAddress: input.connectedAgent.walletAddress,
      },
      callbacks: {
        evidenceUrlTemplate: `${origin}/api/v1/requests/{requestToken}/evidence`,
        heartbeatUrlTemplate: `${origin}/api/v1/requests/{requestToken}/heartbeat`,
        statusUrlTemplate: `${origin}/api/v1/requests/{requestToken}/status`,
      },
      docs: {
        inboxApi: `${origin}/one-inbox-api.md`,
        llms: `${origin}/llms.txt`,
        requestApi: `${origin}/one-request-api.md`,
        skill: `${origin}/SKILL.md`,
      },
      endpoints: {
        inbox: `${origin}/api/v1/inbox`,
        requestEventsTemplate: `${origin}/api/v1/requests/{requestToken}/events`,
        requestGetTemplate: `${origin}/api/v1/requests/{requestToken}`,
        requestPost: `${origin}/api/v1/requests`,
        supplies: `${origin}/api/v1/supplies`,
      },
    },
    conversation: {
      conversationId: input.conversationId,
      requestId: input.uiContext?.requestId ?? null,
      requestRole: input.uiContext?.requestRole ?? "none",
      requestStatus: input.uiContext?.requestStatus ?? null,
      surface: input.uiContext?.surface ?? "home",
    },
    message: input.message,
    requester: {
      displayName: input.requester?.displayName,
      externalId: input.requester?.externalId,
      handle: input.requester?.handle,
    },
  };
}

async function invokeMcpConnectedRuntime(input: {
  payload: ExternalAgentMessagePayload;
  requestUrl: string;
  serverUrl: string;
  toolName: string;
}) {
  const serverUrl = resolveRuntimeUrl(input.serverUrl, input.requestUrl);
  const session = {
    id: crypto.randomUUID(),
    mcpSessionId: null as string | null,
  };

  const initialize = await sendMcpRequest({
    method: "initialize",
    params: {
      capabilities: {},
      clientInfo: {
        name: "boreal-connected-agent-client",
        version: "1.0.0",
      },
      protocolVersion: DEFAULT_MCP_PROTOCOL_VERSION,
    },
    serverUrl,
    session,
  });

  if (!initialize?.result) {
    throw new Error("Connected MCP agent did not complete initialization.");
  }

  await sendMcpNotification({
    method: "notifications/initialized",
    params: {},
    serverUrl,
    session,
  });

  const toolCall = await sendMcpRequest({
    method: "tools/call",
    params: {
      arguments: input.payload,
      name: input.toolName,
    },
    serverUrl,
    session,
  });

  if (toolCall?.error) {
    throw new Error(toolCall.error.message ?? "Connected MCP agent tool call failed.");
  }

  return normalizeExternalAgentResponse(toolCall?.result ?? null);
}

async function sendMcpRequest(input: {
  method: string;
  params: Record<string, unknown>;
  serverUrl: string;
  session: { id: string; mcpSessionId: string | null };
}) {
  const response = await fetch(input.serverUrl, {
    body: JSON.stringify({
      id: input.session.id,
      jsonrpc: "2.0",
      method: input.method,
      params: input.params,
    }),
    headers: buildMcpHeaders(input.session),
    method: "POST",
  });

  const nextSessionId = response.headers.get("mcp-session-id");
  if (nextSessionId) {
    input.session.mcpSessionId = nextSessionId;
  }

  const payload = (await response.json()) as {
    error?: { message?: string };
    id?: string;
    jsonrpc?: string;
    result?: unknown;
  };

  if (!response.ok) {
    throw new Error(
      payload.error?.message ?? `Connected MCP agent returned ${response.status}.`,
    );
  }

  return payload;
}

async function sendMcpNotification(input: {
  method: string;
  params: Record<string, unknown>;
  serverUrl: string;
  session: { id: string; mcpSessionId: string | null };
}) {
  await fetch(input.serverUrl, {
    body: JSON.stringify({
      jsonrpc: "2.0",
      method: input.method,
      params: input.params,
    }),
    headers: buildMcpHeaders(input.session),
    method: "POST",
  });
}

function buildMcpHeaders(session: { mcpSessionId: string | null }) {
  return {
    Accept: "application/json, text/event-stream",
    "Content-Type": "application/json",
    ...(session.mcpSessionId ? { "mcp-session-id": session.mcpSessionId } : {}),
  };
}

async function parseFlexibleResponseBody(response: Response) {
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return response.json();
  }

  return response.text();
}

async function safeReadText(response: Response) {
  try {
    return (await response.text()).trim();
  } catch {
    return "";
  }
}

function normalizeExternalAgentResponse(value: unknown): ExternalAgentNormalizedResult {
  const objectValue =
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : null;

  if (typeof value === "string") {
    return {
      assistantMessage: value.trim(),
      relatedCatalogItems: [],
      requiresApproval: false,
      workspace: emptyWorkspace(),
    };
  }

  if (objectValue && Array.isArray(objectValue.content)) {
    const text = objectValue.content
      .map((item) =>
        item && typeof item === "object" && "text" in item && typeof item.text === "string"
          ? item.text
          : "",
      )
      .filter(Boolean)
      .join("\n\n")
      .trim();

    if (text) {
      return {
        assistantMessage: text,
        relatedCatalogItems: [],
        requiresApproval: false,
        workspace: emptyWorkspace(),
      };
    }
  }

  const assistantMessage =
    typeof objectValue?.assistantMessage === "string"
      ? objectValue.assistantMessage.trim()
      : typeof objectValue?.message === "string"
        ? objectValue.message.trim()
        : "";

  if (!assistantMessage) {
    throw new Error("Connected agent response did not include an assistant message.");
  }

  return {
    assistantMessage,
    relatedCatalogItems: coerceCatalogItems(objectValue?.relatedCatalogItems),
    requiresApproval: objectValue?.requiresApproval === true,
    workspace: coerceWorkspaceState(objectValue?.workspace),
  };
}

function coerceWorkspaceState(value: unknown): WorkspaceState {
  if (!value || typeof value !== "object") {
    return emptyWorkspace();
  }

  const workspace = value as Record<string, unknown>;

  if (workspace.kind === "clarification") {
    return {
      kind: "clarification",
      questions: asStringArray(workspace.questions),
      subtitle: asOptionalString(workspace.subtitle) ?? "Review what still needs clarification.",
      suggestions: asStringArray(workspace.suggestions),
      title: asOptionalString(workspace.title) ?? "Clarification needed",
    };
  }

  if (workspace.kind === "catalog") {
    return {
      highlightedId: asOptionalString(workspace.highlightedId) ?? undefined,
      items: coerceCatalogItems(workspace.items),
      kind: "catalog",
      subtitle: asOptionalString(workspace.subtitle) ?? "Connected agent returned relevant catalog items.",
      title: asOptionalString(workspace.title) ?? "Catalog matches",
    };
  }

  if (workspace.kind === "artifact") {
    const artifact = workspace.artifact;
    if (!artifact || typeof artifact !== "object") {
      return emptyWorkspace();
    }

    return {
      artifact: artifact as WorkspaceState extends { kind: "artifact"; artifact: infer T } ? T : never,
      kind: "artifact",
      subtitle: asOptionalString(workspace.subtitle) ?? "Connected agent returned an artifact.",
      title: asOptionalString(workspace.title) ?? "Artifact",
    };
  }

  if (workspace.kind === "profile_builder") {
    return {
      draft: coerceProfileBuilderDraft(workspace.draft),
      kind: "profile_builder",
      sourceBrief: asOptionalString(workspace.sourceBrief) ?? "",
      subtitle: asOptionalString(workspace.subtitle) ?? "Connected agent drafted a Boreal profile update.",
      title: asOptionalString(workspace.title) ?? "Profile builder",
    };
  }

  if (workspace.kind === "empty") {
    return {
      kind: "empty",
      subtitle: asOptionalString(workspace.subtitle) ?? "Connected agent replied inline.",
      title: asOptionalString(workspace.title) ?? "Chat response",
    };
  }

  return emptyWorkspace();
}

function coerceProfileBuilderDraft(value: unknown): ProfileBuilderDraft {
  if (!value || typeof value !== "object") {
    return createEmptyProfileBuilderDraft();
  }

  return {
    ...createEmptyProfileBuilderDraft(),
    ...(value as ProfileBuilderDraft),
  };
}

function coerceCatalogItems(value: unknown): CatalogItem[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry) => coerceCatalogItem(entry))
    .filter((entry): entry is CatalogItem => entry !== null);
}

function coerceCatalogItem(value: unknown): CatalogItem | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const entry = value as Partial<CatalogItem> & Record<string, unknown>;
  if (typeof entry.id !== "string" || typeof entry.title !== "string") {
    return null;
  }

  return {
    actorKind:
      entry.actorKind === "agent" || entry.actorKind === "human" || entry.actorKind === "tool"
        ? entry.actorKind
        : "agent",
    averageRating: typeof entry.averageRating === "number" ? entry.averageRating : null,
    brand: typeof entry.brand === "string" ? entry.brand : null,
    capabilityTags: asStringArray(entry.capabilityTags),
    category: typeof entry.category === "string" ? entry.category : "connected agent",
    checkoutProtocol:
      entry.checkoutProtocol === "acp" ||
      entry.checkoutProtocol === "custom" ||
      entry.checkoutProtocol === "ucp"
        ? entry.checkoutProtocol
        : null,
    currency: typeof entry.currency === "string" ? entry.currency : "USD",
    deliveryType: typeof entry.deliveryType === "string" ? entry.deliveryType : "async",
    description: typeof entry.description === "string" ? entry.description : entry.title,
    estimatedDeliveryLabel:
      typeof entry.estimatedDeliveryLabel === "string" ? entry.estimatedDeliveryLabel : null,
    executionSurface:
      entry.executionSurface === "handoff" ||
      entry.executionSurface === "http" ||
      entry.executionSurface === "jsonrpc" ||
      entry.executionSurface === "mcp" ||
      entry.executionSurface === "registry" ||
      entry.executionSurface === "sdk" ||
      entry.executionSurface === "widget"
        ? entry.executionSurface
        : null,
    executorUrl: typeof entry.executorUrl === "string" ? entry.executorUrl : null,
    fulfillmentKind: typeof entry.fulfillmentKind === "string" ? entry.fulfillmentKind : "service",
    gatedOutReasons: asStringArray(entry.gatedOutReasons),
    id: entry.id,
    isCartEnabled: entry.isCartEnabled === true,
    isPinned: entry.isPinned === true,
    matchReasons: asStringArray(entry.matchReasons),
    matchScore: typeof entry.matchScore === "number" ? entry.matchScore : null,
    matchStage:
      entry.matchStage === "feasible" ||
      entry.matchStage === "notified" ||
      entry.matchStage === "ranked" ||
      entry.matchStage === "reserved" ||
      entry.matchStage === "retrieved"
        ? entry.matchStage
        : null,
    paymentNetworkHints: asStringArray(entry.paymentNetworkHints),
    paymentProtocol:
      entry.paymentProtocol === "direct-solana" ||
      entry.paymentProtocol === "mpp" ||
      entry.paymentProtocol === "none" ||
      entry.paymentProtocol === "widget" ||
      entry.paymentProtocol === "x402"
        ? entry.paymentProtocol
        : null,
    priceAmount: typeof entry.priceAmount === "number" ? entry.priceAmount : null,
    priceLabel: typeof entry.priceLabel === "string" ? entry.priceLabel : "Connected agent",
    requiresHumanApproval: entry.requiresHumanApproval === true,
    reviewCount: typeof entry.reviewCount === "number" ? entry.reviewCount : 0,
    seller:
      entry.seller && typeof entry.seller === "object"
        ? {
            actorKind:
              entry.seller.actorKind === "agent" ||
              entry.seller.actorKind === "human" ||
              entry.seller.actorKind === "tool"
                ? entry.seller.actorKind
                : "agent",
            displayName:
              typeof entry.seller.displayName === "string" ? entry.seller.displayName : "Connected agent",
            handle: typeof entry.seller.handle === "string" ? entry.seller.handle : null,
            profileId: typeof entry.seller.profileId === "string" ? entry.seller.profileId : null,
          }
        : null,
    sourceListingUrl: typeof entry.sourceListingUrl === "string" ? entry.sourceListingUrl : null,
    sourceProviderKey:
      entry.sourceProviderKey === "agentcash" ||
      entry.sourceProviderKey === "agentic-market" ||
      entry.sourceProviderKey === "frames" ||
      entry.sourceProviderKey === "manual" ||
      entry.sourceProviderKey === "moonpay" ||
      entry.sourceProviderKey === "solana-agent-kit"
        ? entry.sourceProviderKey
        : null,
    subtitle: typeof entry.subtitle === "string" ? entry.subtitle : null,
    supplyType: typeof entry.supplyType === "string" ? entry.supplyType : "capability",
    supportsDirectInvoke: entry.supportsDirectInvoke === true,
    supportsPrivyWallet: entry.supportsPrivyWallet === true,
    successProbability: typeof entry.successProbability === "number" ? entry.successProbability : null,
    title: entry.title,
  };
}

function buildEphemeralConnectedIntent(input: {
  assistantMessage: string;
  capabilityTags: string[];
  conversationId: string;
  message: string;
  provider: string;
  requestedOutputTypes: RequestedOutputType[];
}): PersistedIntent {
  const normalized = normalizeIntentExtraction(
    {
      body: input.message,
      capabilityTags: input.capabilityTags,
      category: "connected_agent_chat",
      confidence: 0.72,
      intentType: "informational",
      persistence: {
        isUnresolved: false,
        reason: "Handled inline by a connected agent.",
        shouldPersist: false,
      },
      requestedOutputTypes: input.requestedOutputTypes,
      responseInstructions: input.assistantMessage.slice(0, 280),
      routeTarget: "general_assistance",
      routing: {
        resolutionTier: "fast",
        shouldCreateFulfillmentRequest: false,
        shouldPersistToBoard: false,
      },
      shouldSearchCatalog: false,
      summary: input.message.slice(0, 220),
      title: input.message.slice(0, 96) || "Connected agent chat",
    },
    input.message,
    [{ kind: "text", score: 1 }],
  );

  return {
    ...normalized,
    assistantMessageId: crypto.randomUUID(),
    conversationId: input.conversationId,
    embedding: [],
    embeddingModel: "connected-agent:none",
    intentModel: "connected-agent:none",
    modalityScores: [{ kind: "text", score: 1 }],
    provider: input.provider,
    userMessageId: crypto.randomUUID(),
  };
}

function selectSessionWalletAddress(wallets: WalletAccountRecord) {
  return (
    wallets.find((wallet) => wallet.isDefaultBuyer)?.walletAddress ??
    wallets.find((wallet) => wallet.isDefaultPayout)?.walletAddress ??
    wallets[0]?.walletAddress ??
    null
  );
}

function resolveRuntimeUrl(url: string, requestUrl: string) {
  return new URL(url, new URL(requestUrl).origin).toString();
}

function buildAssistantProviderKey(
  supply: NonNullable<ConnectedAgentControlRecord["activeSupply"]>,
) {
  return `connected-agent:${slugifyHandle(supply.title) ?? supply._id}`;
}

function slugifyHandle(value: string) {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug.length > 0 ? slug : null;
}

function asOptionalString(value: unknown) {
  return typeof value === "string" ? value : null;
}

function asStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((entry): entry is string => typeof entry === "string");
}

function emptyWorkspace(): WorkspaceState {
  return {
    kind: "empty",
    subtitle: "Connected agent replied inline.",
    title: "Chat response",
  };
}
