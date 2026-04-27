import {
  createQuickConnectPrompt,
  startHermesBridgeServer,
} from "./lib/hermes-http-bridge.ts";

const started = await startHermesBridgeServer({});

const baseUrl = `http://127.0.0.1:${started.port}`;
const executorUrl = `${baseUrl}${started.config.path}`;

console.log(
  JSON.stringify(
    {
      bridgeName: started.config.bridgeName,
      executorUrl,
      healthUrl: `${baseUrl}${started.config.healthPath}`,
      mode: started.config.mode,
      promptUrl: `${baseUrl}${started.config.promptPath}`,
      sampleRequestUrl: `${baseUrl}${started.config.samplePath}`,
      quickConnectPrompt: createQuickConnectPrompt({
        borealOrigin: started.config.borealOrigin,
        bridgeUrl: executorUrl,
      }),
      tunnelNote:
        "Expose this bridge publicly with a tunnel or public host before using it from live Vercel Boreal chat.",
    },
    null,
    2,
  ),
);

process.on("SIGINT", async () => {
  await started.close();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await started.close();
  process.exit(0);
});
