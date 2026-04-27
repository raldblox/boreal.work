import { autonomousAgents } from "../index.ts";
import {
  applyAgentRuntimeFlags,
  getAgentRuntimeTarget,
} from "../shared/runtime-config.ts";
import { syncAgentPresence } from "../shared/runtime.ts";

// Seed is the repo-to-Convex sync step for built-in agent users, profiles, and supplies.
applyAgentRuntimeFlags(process.argv);

for (const agent of autonomousAgents) {
  await syncAgentPresence(agent);
  console.log(`seeded ${agent.key} on ${getAgentRuntimeTarget()}`);
}
