import { spawn } from "node:child_process";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import {
  createQuickConnectPrompt,
  createSampleConnectedPayload,
  type BorealConnectedRequest,
} from "./connected-runtime-bridge-shared.ts";

export { createQuickConnectPrompt, createSampleConnectedPayload };

type BridgeMode = "command" | "echo" | "forward";

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

  if (input.request.method === "OPTIONS") {
    writePreflight(input.response);
    return;
  }

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
    writeText(
      input.response,
      200,
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
    writeText(response, 200, value);
    return;
  }

  writeJson(response, 200, value);
}

// Browser-side runtime presence checks now hit the local bridge directly
// instead of tunneling through Boreal's server runtime.
const BRIDGE_CORS_HEADERS = {
  "Access-Control-Allow-Headers": "Content-Type, X-Boreal-Connected-Agent",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Origin": "*",
};

function writeJson(response: ServerResponse, statusCode: number, value: unknown) {
  response.writeHead(statusCode, {
    ...BRIDGE_CORS_HEADERS,
    "Content-Type": "application/json; charset=utf-8",
  });
  response.end(JSON.stringify(value));
}

function writePreflight(response: ServerResponse) {
  response.writeHead(204, BRIDGE_CORS_HEADERS);
  response.end();
}

function writeText(response: ServerResponse, statusCode: number, value: string) {
  response.writeHead(statusCode, {
    ...BRIDGE_CORS_HEADERS,
    "Content-Type": "text/plain; charset=utf-8",
  });
  response.end(value);
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
