import { autonomousAgents } from "../index.ts";
import { watchAgent } from "../shared/runtime.ts";

const once = process.argv.includes("--once");
const intervalMs = Number(process.env.BOREAL_AGENT_POLL_MS ?? 15000);
const modelId = process.env.BOREAL_AGENT_MODEL ?? "gpt-4.1-mini";

await Promise.all(
  autonomousAgents.map((agent) =>
    watchAgent(agent, {
      intervalMs,
      modelId,
      once,
    }),
  ),
);
