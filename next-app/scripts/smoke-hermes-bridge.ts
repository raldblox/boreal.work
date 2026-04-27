import {
  createSampleConnectedPayload,
  startHermesBridgeServer,
} from "./lib/hermes-http-bridge.ts";

const started = await startHermesBridgeServer({
  config: {
    host: "127.0.0.1",
    mode: "echo",
    port: 0,
    replyPrefix: "Hermes heard: ",
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

  const body = (await response.json()) as {
    assistantMessage?: string;
  };

  if (!response.ok) {
    throw new Error(`Bridge returned ${response.status}.`);
  }

  if (body.assistantMessage !== "Hermes heard: hi") {
    throw new Error("Bridge did not normalize the assistant response as expected.");
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
      },
      null,
      2,
    ),
  );
} finally {
  await started.close();
}
