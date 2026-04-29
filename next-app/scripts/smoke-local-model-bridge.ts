import { createServer } from "node:http";

import { createSampleConnectedPayload } from "./lib/connected-runtime-bridge-shared.ts";
import { startLocalModelBridgeServer } from "./lib/local-model-http-bridge.ts";

const upstream = createServer(async (request, response) => {
  const url = new URL(request.url ?? "/", "http://127.0.0.1");

  if (request.method === "GET" && url.pathname === "/v1/models") {
    response.writeHead(200, {
      "Content-Type": "application/json; charset=utf-8",
    });
    response.end(
      JSON.stringify({
        data: [{ id: "qwen2.5-local" }],
      }),
    );
    return;
  }

  if (request.method === "POST" && url.pathname === "/v1/chat/completions") {
    response.writeHead(200, {
      "Content-Type": "application/json; charset=utf-8",
    });
    response.end(
      JSON.stringify({
        choices: [
          {
            message: {
              content: "Local model heard: hi",
            },
          },
        ],
      }),
    );
    return;
  }

  response.writeHead(404, {
    "Content-Type": "application/json; charset=utf-8",
  });
  response.end(JSON.stringify({ error: "Not found." }));
});

await new Promise<void>((resolve) => {
  upstream.listen(0, "127.0.0.1", () => resolve());
});

const upstreamAddress = upstream.address();

if (!upstreamAddress || typeof upstreamAddress !== "object") {
  throw new Error("Could not start stub OpenAI-compatible upstream.");
}

const started = await startLocalModelBridgeServer({
  config: {
    baseUrl: `http://127.0.0.1:${upstreamAddress.port}/v1`,
    host: "127.0.0.1",
    model: null,
    port: 0,
    preset: "openai-compatible",
    providerLabel: "OpenAI-compatible local model",
  },
});

try {
  const response = await fetch(
    `http://127.0.0.1:${started.port}${started.config.path}`,
    {
      body: JSON.stringify(createSampleConnectedPayload()),
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
    },
  );

  if (!response.ok) {
    throw new Error(`Bridge returned ${response.status}.`);
  }

  const body = (await response.json()) as {
    assistantMessage?: string;
    provider?: string;
  };

  if (body.assistantMessage !== "Local model heard: hi") {
    throw new Error("Bridge did not normalize the assistant message.");
  }

  if (body.provider !== "OpenAI-compatible local model") {
    throw new Error("Bridge did not preserve the provider label.");
  }

  const health = await fetch(
    `http://127.0.0.1:${started.port}${started.config.healthPath}`,
  );

  if (!health.ok) {
    throw new Error("Bridge health endpoint failed.");
  }

  console.log(
    JSON.stringify(
      {
        assistantMessage: body.assistantMessage,
        health: await health.json(),
        port: started.port,
        upstreamPort: upstreamAddress.port,
      },
      null,
      2,
    ),
  );
} finally {
  await started.close();
  await new Promise<void>((resolve, reject) => {
    upstream.close((error) => (error ? reject(error) : resolve()));
  });
}
