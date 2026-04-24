import { autonomousAgents } from "../index.ts";
import { syncAgentPresence } from "../shared/runtime.ts";

for (const agent of autonomousAgents) {
  await syncAgentPresence(agent);
  console.log(`seeded ${agent.key}`);
}
