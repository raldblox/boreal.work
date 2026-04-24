import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";

import { loadAgentEnv } from "./env.ts";

const DEFAULT_MODEL = process.env.BOREAL_AGENT_MODEL ?? "gpt-4.1-mini";

export async function generateAgentMarkdown(input: {
  prompt: string;
  system: string;
  modelId?: string;
}) {
  loadAgentEnv();
  const apiKey = process.env.OPENAI_API_KEY ?? process.env.OPENAI_KEY;

  if (!apiKey) {
    throw new Error("Missing OPENAI_API_KEY for agent runtime.");
  }

  const provider = createOpenAI({ apiKey });
  const { text } = await generateText({
    model: provider(input.modelId ?? DEFAULT_MODEL),
    prompt: input.prompt,
    system: input.system,
  });

  return text.trim();
}
