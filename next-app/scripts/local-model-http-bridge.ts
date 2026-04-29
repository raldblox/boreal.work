import {
  createQuickConnectPrompt,
} from "./lib/connected-runtime-bridge-shared.ts";
import {
  resolveLocalModelBridgeConfig,
  startLocalModelBridgeServer,
} from "./lib/local-model-http-bridge.ts";

const config = resolveLocalModelBridgeConfig();
const started = await startLocalModelBridgeServer({ config });

const baseUrl = `http://127.0.0.1:${started.port}`;
const executorUrl = `${baseUrl}${started.config.path}`;

console.log(
  JSON.stringify(
    {
      baseUrl: started.config.baseUrl,
      bridgeName: started.config.bridgeName,
      executorUrl,
      healthUrl: `${baseUrl}${started.config.healthPath}`,
      model: started.config.model,
      preset: started.config.preset,
      promptUrl: `${baseUrl}${started.config.promptPath}`,
      provider: started.config.providerLabel,
      quickConnectPrompt: createQuickConnectPrompt({
        borealOrigin: started.config.borealOrigin,
        bridgeUrl: executorUrl,
      }),
      sampleRequestUrl: `${baseUrl}${started.config.samplePath}`,
      suggestedSupplyDraft: {
        capabilityTags: [
          "local-model",
          started.config.preset,
          "connected-agent",
        ],
        description: `${started.config.providerLabel} runtime exposed through Boreal's transport-only local model bridge without sharing Boreal Agent prompts.`,
        executionSurface: "http",
        executorUrl,
        title: started.config.bridgeName,
      },
      tunnelNote:
        "Expose this bridge publicly with a tunnel or public host before using it from live Boreal chat.",
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
