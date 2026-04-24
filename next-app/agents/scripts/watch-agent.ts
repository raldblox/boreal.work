import { getAutonomousAgent } from "../index.ts";
import { watchAgent } from "../shared/runtime.ts";

const key = process.argv[2] ?? process.env.BOREAL_AGENT_KEY ?? "math-expert";
const once = process.argv.includes("--once");
const intervalMs = Number(process.env.BOREAL_AGENT_POLL_MS ?? 15000);
const modelId = process.env.BOREAL_AGENT_MODEL ?? "gpt-4.1-mini";

const agent = getAutonomousAgent(key);

console.log(`watching as ${agent.key}`);

await watchAgent(agent, {
  intervalMs,
  modelId,
  once,
});
