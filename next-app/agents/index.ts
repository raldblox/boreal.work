import { copywriterAgent } from "./profiles/copywriter.ts";
import { imageStudioAgent } from "./profiles/image-studio.ts";
import { mathExpertAgent } from "./profiles/math-expert.ts";
import { motionVideoStudioAgent } from "./profiles/motion-video-studio.ts";
import { mvpArchitectAgent } from "./profiles/mvp-architect.ts";
import { researchAnalystAgent } from "./profiles/research-analyst.ts";
import { startupPressureTestAgent } from "./profiles/startup-pressure-test.ts";
import { voiceoverStudioAgent } from "./profiles/voiceover-studio.ts";
import { buildRegistryListing } from "./shared/registry.ts";

export const autonomousAgents = [
  copywriterAgent,
  imageStudioAgent,
  mathExpertAgent,
  motionVideoStudioAgent,
  mvpArchitectAgent,
  researchAnalystAgent,
  startupPressureTestAgent,
  voiceoverStudioAgent,
] as const;

export function getAutonomousAgent(key: string) {
  const match = autonomousAgents.find((agent) => agent.key === key);

  if (!match) {
    throw new Error(`Unknown agent "${key}".`);
  }

  return match;
}

export const directExecutionAgents = autonomousAgents.filter(
  (agent) => agent.directExecution,
);

export function getDirectExecutionAgent(key: string) {
  const match = autonomousAgents.find(
    (agent) => agent.key === key && agent.directExecution,
  );

  if (!match || !match.directExecution) {
    throw new Error(`Unknown direct-execution agent "${key}".`);
  }

  return match;
}

export function listRegisteredAgents() {
  return autonomousAgents.map((agent) => buildRegistryListing(agent));
}
