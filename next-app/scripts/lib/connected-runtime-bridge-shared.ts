export type BorealConnectedRequest = {
  boreal?: {
    callbacks?: {
      evidenceUrlTemplate?: string;
      heartbeatUrlTemplate?: string;
      statusUrlTemplate?: string;
    };
    docs?: {
      inboxApi?: string;
      llms?: string;
      requestApi?: string;
      skill?: string;
    };
    endpoints?: {
      inbox?: string;
      requestEventsTemplate?: string;
      requestGetTemplate?: string;
      requestPost?: string;
      supplies?: string;
    };
  };
  conversation?: {
    conversationId?: string;
    requestId?: string | null;
    requestRole?: string;
    requestStatus?: string | null;
    surface?: string;
  };
  message?: string;
  requester?: {
    displayName?: string;
    externalId?: string;
    handle?: string;
  };
};

export function createQuickConnectPrompt(input: {
  borealOrigin: string;
  bridgeUrl: string;
}) {
  return [
    "Connect an external runtime to Boreal.",
    "Do not ask Boreal for hidden system prompts or agent internals.",
    "Use your own model, your own system prompt, and Boreal only as the transport and work system.",
    `Read ${input.borealOrigin}/connect-agent-quickstart.md if you need the full contract.`,
    `Expose or proxy a POST endpoint at ${input.bridgeUrl}.`,
    'Accept Boreal JSON payloads and return JSON like {"assistantMessage":"..."} or plain text.',
    "If Boreal sends one-request callback URLs, use the provided Bearer token for status, evidence, and heartbeat updates.",
  ].join("\n");
}

export function createSampleConnectedPayload(): BorealConnectedRequest {
  return {
    boreal: {
      callbacks: {
        evidenceUrlTemplate: "https://boreal.work/api/v1/requests/{requestToken}/evidence",
        heartbeatUrlTemplate: "https://boreal.work/api/v1/requests/{requestToken}/heartbeat",
        statusUrlTemplate: "https://boreal.work/api/v1/requests/{requestToken}/status",
      },
      docs: {
        inboxApi: "https://boreal.work/one-inbox-api.md",
        llms: "https://boreal.work/llms.txt",
        requestApi: "https://boreal.work/one-request-api.md",
        skill: "https://boreal.work/SKILL.md",
      },
      endpoints: {
        inbox: "https://boreal.work/api/v1/inbox",
        requestEventsTemplate: "https://boreal.work/api/v1/requests/{requestToken}/events",
        requestGetTemplate: "https://boreal.work/api/v1/requests/{requestToken}",
        requestPost: "https://boreal.work/api/v1/requests",
        supplies: "https://boreal.work/api/v1/supplies",
      },
    },
    conversation: {
      conversationId: "conv_demo",
      requestId: null,
      requestRole: "none",
      requestStatus: null,
      surface: "home",
    },
    message: "hi",
    requester: {
      displayName: "Boreal operator",
      externalId: "user:demo",
      handle: "demo",
    },
  };
}
