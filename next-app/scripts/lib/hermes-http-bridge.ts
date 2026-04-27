import { spawn } from "node:child_process";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";

type BridgeMode = "command" | "echo" | "forward";

type BorealConnectedRequest = {
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

export type HermesBridgeConfig = {
  borealOrigin: string;
  bridgeName: string;
  command: string | null;
  forwardUrl: string | null;
  healthPath: string;
  host: string;
  mode: BridgeMode;
  path: string;
  port: number;
  promptPath: string;
  replyPrefix: string;
  samplePath: string;
};

export function resolveHermesBridgeConfigFromEnv(
  env: NodeJS.ProcessEnv = process.env,
): HermesBridgeConfig {
  const command = trim(env.HERMES_BRIDGE_COMMAND);
  const forwardUrl = trim(env.HERMES_BRIDGE_FORWARD_URL);
  const mode = normalizeMode(trim(env.HERMES_BRIDGE_MODE), {
    command,
    forwardUrl,
  });

  return {
    borealOrigin: trim(env.BOREAL_PUBLIC_ORIGIN) ?? "https://boreal.work",
    bridgeName: trim(env.HERMES_BRIDGE_NAME) ?? "Hermes bridge",
    command,
    forwardUrl,
    healthPath: trim(env.HERMES_BRIDGE_HEALTH_PATH) ?? "/health",
    host: trim(env.HERMES_BRIDGE_HOST) ?? "0.0.0.0",
    mode,
    path: trim(env.HERMES_BRIDGE_PATH) ?? "/boreal/chat",
    port: parsePort(env.HERMES_BRIDGE_PORT ?? env.PORT),
    promptPath: trim(env.HERMES_BRIDGE_PROMPT_PATH) ?? "/prompt",
    replyPrefix: trim(env.HERMES_BRIDGE_REPLY_PREFIX) ?? "Hermes heard: ",
    samplePath: trim(env.HERMES_BRIDGE_SAMPLE_PATH) ?? "/sample-request",
  };
}

export function createQuickConnectPrompt(input: {
  borealOrigin: string;
  bridgeUrl: string;
}) {
  return [
    "Connect yourself to Boreal.",
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

export async function startHermesBridgeServer(input: {
  config?: Partial<HermesBridgeConfig>;
  env?: NodeJS.ProcessEnv;
}) {
  const base = resolveHermesBridgeConfigFromEnv(input.env);
  const config = { ...base, ...input.config };

  const server = createServer(async (request, response) => {
    try {
      await handleRequest({
        config,
        request,
        response,
      });
    } catch (error) {
      writeJson(response, 500, {
        error: error instanceof Error ? error.message : "Hermes bridge failed.",
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

async function handleRequest(input: {
  config: HermesBridgeConfig;
  request: IncomingMessage;
  response: ServerResponse;
}) {
  const url = new URL(input.request.url ?? "/", "http://127.0.0.1");

  if (input.request.method === "GET" && url.pathname === input.config.healthPath) {
    writeJson(input.response, 200, {
      mode: input.config.mode,
      ok: true,
      path: input.config.path,
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
  const result = await executeBridge(input.config, payload);
  writeFlexibleResponse(input.response, result);
}

async function executeBridge(
  config: HermesBridgeConfig,
  payload: BorealConnectedRequest,
) {
  if (config.mode === "forward") {
    if (!config.forwardUrl) {
      throw new Error("HERMES_BRIDGE_FORWARD_URL is required for forward mode.");
    }

    const response = await fetch(config.forwardUrl, {
      body: JSON.stringify(payload),
      headers: {
        "Content-Type": "application/json",
        "X-Boreal-Connected-Agent": "1",
      },
      method: "POST",
    });

    const contentType = response.headers.get("content-type") ?? "";
    if (!response.ok) {
      throw new Error((await response.text()).trim() || "Forwarded Hermes runtime failed.");
    }

    if (contentType.includes("application/json")) {
      return await response.json();
    }

    return await response.text();
  }

  if (config.mode === "command") {
    if (!config.command) {
      throw new Error("HERMES_BRIDGE_COMMAND is required for command mode.");
    }

    const output = await runLocalCommand({
      command: config.command,
      payload,
    });

    return parseBridgeOutput(output);
  }

  const text = `${config.replyPrefix}${payload.message?.trim() || "Hello from Boreal."}`;

  return {
    assistantMessage: text,
  };
}

async function runLocalCommand(input: {
  command: string;
  payload: BorealConnectedRequest;
}) {
  return await new Promise<string>((resolve, reject) => {
    const child = spawn(input.command, {
      shell: true,
      stdio: ["pipe", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("error", reject);

    child.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(stderr.trim() || `Hermes bridge command exited with ${code}.`));
        return;
      }

      resolve(stdout.trim());
    });

    child.stdin.write(JSON.stringify(input.payload));
    child.stdin.end();
  });
}

function parseBridgeOutput(output: string) {
  if (!output.trim()) {
    throw new Error("Hermes bridge command returned no output.");
  }

  try {
    return JSON.parse(output);
  } catch {
    return {
      assistantMessage: output.trim(),
    };
  }
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

function writeFlexibleResponse(response: ServerResponse, value: unknown) {
  if (typeof value === "string") {
    response.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
    response.end(value);
    return;
  }

  writeJson(response, 200, value);
}

function writeJson(response: ServerResponse, statusCode: number, value: unknown) {
  response.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(value));
}

function normalizeMode(
  value: string | null,
  context: { command: string | null; forwardUrl: string | null },
): BridgeMode {
  if (value === "command" || value === "echo" || value === "forward") {
    return value;
  }

  if (context.command) {
    return "command";
  }

  if (context.forwardUrl) {
    return "forward";
  }

  return "echo";
}

function parsePort(value: string | undefined) {
  const parsed = Number.parseInt(value ?? "8787", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 8787;
}

function trim(value: string | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function guessPublicBaseUrl(config: HermesBridgeConfig) {
  return `http://${config.host === "0.0.0.0" ? "127.0.0.1" : config.host}:${config.port}`;
}
