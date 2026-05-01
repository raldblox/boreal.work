import { autonomousAgents, stableAutonomousAgents } from "../index.ts";
import {
  applyAgentRuntimeFlags,
  getAgentRuntimeTarget,
} from "../shared/runtime-config.ts";
import { syncAgentPresence } from "../shared/runtime.ts";

// Seed is the repo-to-Convex sync step for built-in agent users, profiles, and supplies.
applyAgentRuntimeFlags(process.argv);

const shouldSeedAllAgents = process.argv.includes("--all");
const agentsToSeed = shouldSeedAllAgents
  ? autonomousAgents
  : stableAutonomousAgents;

for (const agent of agentsToSeed) {
  await syncAgentPresence(agent);
  console.log(`seeded ${agent.key} on ${getAgentRuntimeTarget()}`);
}
