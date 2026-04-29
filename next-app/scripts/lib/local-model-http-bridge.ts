import { createServer, type IncomingMessage, type ServerResponse } from "node:http";

import {
  createQuickConnectPrompt,
  createSampleConnectedPayload,
  type BorealConnectedRequest,
} from "./connected-runtime-bridge-shared.ts";

export type LocalModelBridgePreset =
  | "lmstudio"
  | "ollama"
  | "openai-compatible";

export type LocalModelBridgeConfig = {
  apiKey: string | null;
  baseUrl: string;
  borealOrigin: string;
  bridgeName: string;
  healthPath: string;
  host: string;
  maxTokens: number | null;
  model: string | null;
  path: string;
  port: number;
  preset: LocalModelBridgePreset;
  promptPath: string;
  providerLabel: string;
  samplePath: string;
  systemPrompt: string;
  temperature: number | null;
  timeoutMs: number;
};

type BridgeArgs = {
  apiKey?: string | null;
  baseUrl?: string | null;
  model?: string | null;
  port?: string | null;
  preset?: string | null;
};

export function resolveLocalModelBridgeConfig(input?: {
  args?: string[];
  env?: NodeJS.ProcessEnv;
}): LocalModelBridgeConfig {
  const env = input?.env ?? process.env;
  const args = parseBridgeArgs(input?.args ?? process.argv.slice(2));
  const preset = normalizePreset(
    args.preset ??
      trim(env.LOCAL_MODEL_BRIDGE_PROVIDER) ??
      trim(env.LOCAL_MODEL_BRIDGE_PRESET),
  );
  const defaultBaseUrl = getDefaultBaseUrl(preset);
  const configuredBaseUrl =
    args.baseUrl ??
    trim(env.LOCAL_MODEL_BRIDGE_BASE_URL) ??
    trim(env.OPENAI_COMPATIBLE_BASE_URL) ??
    defaultBaseUrl;

  return {
    apiKey:
      args.apiKey ??
      trim(env.LOCAL_MODEL_BRIDGE_API_KEY) ??
      getDefaultApiKey(preset),
    baseUrl: normalizeBaseUrl(configuredBaseUrl, preset),
    borealOrigin: trim(env.BOREAL_PUBLIC_ORIGIN) ?? "https://boreal.work",
    bridgeName:
      trim(env.LOCAL_MODEL_BRIDGE_NAME) ?? getDefaultBridgeName(preset),
    healthPath: trim(env.LOCAL_MODEL_BRIDGE_HEALTH_PATH) ?? "/health",
    host: trim(env.LOCAL_MODEL_BRIDGE_HOST) ?? "127.0.0.1",
    maxTokens: parseOptionalInt(env.LOCAL_MODEL_BRIDGE_MAX_TOKENS),
    model:
      args.model ??
      trim(env.LOCAL_MODEL_BRIDGE_MODEL) ??
      trim(env.OPENAI_COMPATIBLE_MODEL),
    path: trim(env.LOCAL_MODEL_BRIDGE_PATH) ?? "/boreal/chat",
    port: parsePort(args.port ?? env.LOCAL_MODEL_BRIDGE_PORT ?? env.PORT),
    preset,
    promptPath: trim(env.LOCAL_MODEL_BRIDGE_PROMPT_PATH) ?? "/prompt",
    providerLabel: getProviderLabel(preset),
    samplePath: trim(env.LOCAL_MODEL_BRIDGE_SAMPLE_PATH) ?? "/sample-request",
    systemPrompt:
      trim(env.LOCAL_MODEL_BRIDGE_SYSTEM_PROMPT) ??
      buildDefaultSystemPrompt(preset),
    temperature: parseOptionalNumber(env.LOCAL_MODEL_BRIDGE_TEMPERATURE),
    timeoutMs: parsePositiveInt(env.LOCAL_MODEL_BRIDGE_TIMEOUT_MS, 120_000),
  };
}

export async function startLocalModelBridgeServer(input?: {
  config?: Partial<LocalModelBridgeConfig>;
  env?: NodeJS.ProcessEnv;
}) {
  const base = resolveLocalModelBridgeConfig({ env: input?.env });
  const config = { ...base, ...input?.config };
  const server = createServer(async (request, response) => {
    try {
      await handleRequest({
        config,
        request,
        response,
      });
    } catch (error) {
      writeJson(response, 500, {
        error:
          error instanceof Error
            ? error.message
            : "Local model bridge failed.",
      });
    }
  });

  await new Promise<void>((resolve) => {
    server.listen(config.port, config.host, () => resolve());
  });

  const address = server.address();
  const port =
    address && typeof address === "object" && typeof address.port === "number"
      ? address.port
      : config.port;

  return {
    close: () =>
      new Promise<void>((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      }),
    config,
    port,
    server,
  };
}

function parseBridgeArgs(args: string[]): BridgeArgs {
  const parsed: BridgeArgs = {};

  for (let index = 0; index < args.length; index += 1) {
    const part = args[index];
    const next = args[index + 1];

    if (!part) {
      continue;
    }

    if (part === "--provider" && next) {
      parsed.preset = next;
      index += 1;
      continue;
    }

    if (part === "--base-url" && next) {
      parsed.baseUrl = next;
      index += 1;
      continue;
    }

    if (part === "--model" && next) {
      parsed.model = next;
      index += 1;
      continue;
    }

    if (part === "--api-key" && next) {
      parsed.apiKey = next;
      index += 1;
      continue;
    }

    if (part === "--port" && next) {
      parsed.port = next;
      index += 1;
      continue;
    }
  }

  return parsed;
}

async function handleRequest(input: {
  config: LocalModelBridgeConfig;
  request: IncomingMessage;
  response: ServerResponse;
}) {
  const url = new URL(input.request.url ?? "/", "http://127.0.0.1");

  if (input.request.method === "GET" && url.pathname === input.config.healthPath) {
    writeJson(input.response, 200, {
      baseUrl: input.config.baseUrl,
      model: input.config.model,
      ok: true,
      path: input.config.path,
      preset: input.config.preset,
      provider: input.config.providerLabel,
    });
    return;
  }

  if (input.request.method === "GET" && url.pathname === input.config.samplePath) {
    writeJson(input.response, 200, createSampleConnectedPayload());
    return;
  }

  if (input.request.method === "GET" && url.pathname === input.config.promptPath) {
    input.response.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
    input.response.end(
      createQuickConnectPrompt({
        borealOrigin: input.config.borealOrigin,
        bridgeUrl: `${guessPublicBaseUrl(input.config)}${input.config.path}`,
      }),
    );
    return;
  }

  if (input.request.method !== "POST" || url.pathname !== input.config.path) {
    writeJson(input.response, 404, { error: "Not found." });
    return;
  }

  const payload = (await readJsonBody(input.request)) as BorealConnectedRequest;
  const result = await executeLocalModelBridge(input.config, payload);
  writeJson(input.response, 200, result);
}

async function executeLocalModelBridge(
  config: LocalModelBridgeConfig,
  payload: BorealConnectedRequest,
) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), config.timeoutMs);

  try {
    const model = await resolveModelId(config);
    const response = await fetch(`${config.baseUrl}/chat/completions`, {
      body: JSON.stringify({
        max_tokens: config.maxTokens ?? undefined,
        messages: [
          {
            content: config.systemPrompt,
            role: "system",
          },
          {
            content: buildUserPrompt(payload, config),
            role: "user",
          },
        ],
        model,
        stream: false,
        temperature: config.temperature ?? undefined,
      }),
      headers: {
        "Content-Type": "application/json",
        ...(config.apiKey
          ? { Authorization: `Bearer ${config.apiKey}` }
          : {}),
      },
      method: "POST",
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorText = (await response.text()).trim();
      throw new Error(
        `${config.providerLabel} bridge upstream returned ${response.status}: ${
          errorText || "Unknown error."
        }`,
      );
    }

    const body = (await response.json()) as {
      choices?: Array<{
        message?: {
          content?: string | Array<{ text?: string; type?: string }>;
        };
      }>;
      error?: { message?: string };
    };
    const assistantMessage = extractAssistantMessage(body);

    if (!assistantMessage) {
      throw new Error(
        `${config.providerLabel} bridge did not receive assistant content from the local model.`,
      );
    }

    return {
      assistantMessage,
      provider: config.providerLabel,
      relatedCatalogItems: [],
      requiresApproval: false,
      workspace: {
        kind: "empty",
        subtitle: `${config.providerLabel} replied inline through the operator-owned local runtime bridge.`,
        title: config.bridgeName,
      },
    };
  } finally {
    clearTimeout(timer);
  }
}

async function resolveModelId(config: LocalModelBridgeConfig) {
  if (config.model) {
    return config.model;
  }

  const response = await fetch(`${config.baseUrl}/models`, {
    headers: {
      ...(config.apiKey ? { Authorization: `Bearer ${config.apiKey}` } : {}),
    },
    method: "GET",
  });

  if (!response.ok) {
    throw new Error(
      `${config.providerLabel} bridge could not list models from ${config.baseUrl}. Set LOCAL_MODEL_BRIDGE_MODEL explicitly.`,
    );
  }

  const body = (await response.json()) as {
    data?: Array<{ id?: string }>;
  };
  const modelId = body.data?.find((entry) => typeof entry.id === "string")?.id;

  if (!modelId) {
    throw new Error(
      `${config.providerLabel} bridge could not detect a model automatically. Load one locally or set LOCAL_MODEL_BRIDGE_MODEL.`,
    );
  }

  return modelId;
}

function extractAssistantMessage(body: {
  choices?: Array<{
    message?: {
      content?: string | Array<{ text?: string; type?: string }>;
    };
  }>;
}) {
  const content = body.choices?.[0]?.message?.content;

  if (typeof content === "string") {
    return content.trim();
  }

  if (Array.isArray(content)) {
    return content
      .map((part) => (typeof part?.text === "string" ? part.text : ""))
      .filter(Boolean)
      .join("\n\n")
      .trim();
  }

  return "";
}

function buildUserPrompt(
  payload: BorealConnectedRequest,
  config: LocalModelBridgeConfig,
) {
  const summary = {
    bridge: {
      name: config.bridgeName,
      provider: config.providerLabel,
    },
    conversation: {
      conversationId: payload.conversation?.conversationId ?? null,
      requestId: payload.conversation?.requestId ?? null,
      requestRole: payload.conversation?.requestRole ?? "none",
      requestStatus: payload.conversation?.requestStatus ?? null,
      surface: payload.conversation?.surface ?? "home",
    },
    requester: {
      displayName: payload.requester?.displayName ?? null,
      externalId: payload.requester?.externalId ?? null,
      handle: payload.requester?.handle ?? null,
    },
    message: payload.message ?? "",
  };

  return [
    "Boreal connected-runtime request.",
    "This transport does not expose Boreal Agent hidden prompts.",
    "Use your own local runtime behavior and your own system prompt.",
    "Reply directly to the user message.",
    "Stay concise and actionable.",
    "Do not claim to be Boreal Agent.",
    "Do not mention hidden bridge internals unless the user asks.",
    "",
    JSON.stringify(summary, null, 2),
  ].join("\n");
}

function buildDefaultSystemPrompt(preset: LocalModelBridgePreset) {
  if (preset === "ollama") {
    return "You are an operator-owned Ollama runtime connected to Boreal. Use only the user message and request metadata in this turn. Do not claim to be Boreal Agent or mention hidden system prompts.";
  }

  if (preset === "lmstudio") {
    return "You are an operator-owned LM Studio runtime connected to Boreal. Use only the user message and request metadata in this turn. Do not claim to be Boreal Agent or mention hidden system prompts.";
  }

  return "You are an operator-owned OpenAI-compatible runtime connected to Boreal. Use only the user message and request metadata in this turn. Do not claim to be Boreal Agent or mention hidden system prompts.";
}

function getProviderLabel(preset: LocalModelBridgePreset) {
  switch (preset) {
    case "ollama":
      return "Ollama";
    case "lmstudio":
      return "LM Studio";
    default:
      return "OpenAI-compatible local model";
  }
}

function getDefaultBridgeName(preset: LocalModelBridgePreset) {
  switch (preset) {
    case "ollama":
      return "Ollama local bridge";
    case "lmstudio":
      return "LM Studio local bridge";
    default:
      return "Local model bridge";
  }
}

function getDefaultBaseUrl(preset: LocalModelBridgePreset) {
  switch (preset) {
    case "ollama":
      return "http://127.0.0.1:11434/v1";
    case "lmstudio":
      return "http://127.0.0.1:1234/v1";
    default:
      return "http://127.0.0.1:1234/v1";
  }
}

function getDefaultApiKey(preset: LocalModelBridgePreset) {
  if (preset === "ollama") {
    return "ollama";
  }

  return null;
}

function normalizePreset(value: string | null | undefined): LocalModelBridgePreset {
  switch (value?.trim().toLowerCase()) {
    case "ollama":
      return "ollama";
    case "lmstudio":
    case "lm-studio":
      return "lmstudio";
    case "openai-compatible":
    case "openai_compatible":
    case "openai":
      return "openai-compatible";
    default:
      return "ollama";
  }
}

function normalizeBaseUrl(
  value: string,
  preset: LocalModelBridgePreset,
) {
  const url = new URL(value);
  const normalizedPath = url.pathname.replace(/\/+$/, "");

  if (normalizedPath === "" || normalizedPath === "/") {
    url.pathname = "/v1";
  } else if (!normalizedPath.endsWith("/v1")) {
    url.pathname = `${normalizedPath}/v1`;
  }

  return url.toString().replace(/\/$/, "");
}

function parsePort(value: string | null | undefined) {
  const parsed = Number.parseInt(value ?? "8790", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 8790;
}

function parseOptionalNumber(value: string | undefined) {
  if (!value?.trim()) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseOptionalInt(value: string | undefined) {
  if (!value?.trim()) {
    return null;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function parsePositiveInt(value: string | undefined, fallback: number) {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function trim(value: string | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function guessPublicBaseUrl(config: LocalModelBridgeConfig) {
  return `http://${config.host === "0.0.0.0" ? "127.0.0.1" : config.host}:${config.port}`;
}

async function readJsonBody(request: IncomingMessage) {
  const chunks: Buffer[] = [];

  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  const raw = Buffer.concat(chunks).toString("utf8").trim();

  if (!raw) {
    return {};
  }

  return JSON.parse(raw);
}

function writeJson(response: ServerResponse, statusCode: number, value: unknown) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
  });
  response.end(JSON.stringify(value));
}
