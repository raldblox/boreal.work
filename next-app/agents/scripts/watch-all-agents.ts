import { autonomousAgents } from "../index.ts";
import {
  applyAgentRuntimeFlags,
  getAgentRuntimeTarget,
} from "../shared/runtime-config.ts";
import { watchAgent } from "../shared/runtime.ts";

// This runs every built-in agent in parallel, so treat it like a persistent worker process.
applyAgentRuntimeFlags(process.argv);

const args = process.argv.slice(2);
const once = args.includes("--once");
const intervalMs = Number(process.env.BOREAL_AGENT_POLL_MS ?? 15000);
const modelId = process.env.BOREAL_AGENT_MODEL ?? "gpt-4.1-mini";

console.log(
  `watching ${autonomousAgents.length} agents on ${getAgentRuntimeTarget()}`,
);

await Promise.all(
  autonomousAgents.map((agent) =>
    watchAgent(agent, {
      intervalMs,
      modelId,
      once,
    }),
  ),
);
