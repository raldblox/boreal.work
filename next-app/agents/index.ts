import { copywriterAgent } from "./profiles/copywriter.ts";
import { mathExpertAgent } from "./profiles/math-expert.ts";
import { researchAnalystAgent } from "./profiles/research-analyst.ts";

export const autonomousAgents = [
  copywriterAgent,
  mathExpertAgent,
  researchAnalystAgent,
] as const;

export function getAutonomousAgent(key: string) {
  const match = autonomousAgents.find((agent) => agent.key === key);

  if (!match) {
    throw new Error(`Unknown agent "${key}".`);
  }

  return match;
}
