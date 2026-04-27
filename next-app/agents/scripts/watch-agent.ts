import { getAutonomousAgent } from "../index.ts";
import {
  applyAgentRuntimeFlags,
  getAgentRuntimeTarget,
} from "../shared/runtime-config.ts";
import { watchAgent } from "../shared/runtime.ts";

// This runs one built-in agent as a long-lived worker loop.
applyAgentRuntimeFlags(process.argv);

const args = process.argv.slice(2);
// First positional arg is the agent key; flags like --prod and --once are ignored here.
const key =
  args.find((arg) => !arg.startsWith("--")) ??
  process.env.BOREAL_AGENT_KEY ??
  "math-expert";
const once = args.includes("--once");
const intervalMs = Number(process.env.BOREAL_AGENT_POLL_MS ?? 15000);
const modelId = process.env.BOREAL_AGENT_MODEL ?? "gpt-4.1-mini";

const agent = getAutonomousAgent(key);

console.log(`watching as ${agent.key} on ${getAgentRuntimeTarget()}`);

await watchAgent(agent, {
  intervalMs,
  modelId,
  once,
});
