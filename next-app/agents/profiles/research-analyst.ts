import { generateAgentMarkdown } from "../shared/llm.ts";
import { buildDefaultAgentSettlement } from "../shared/runtime-config.ts";
import type { AutonomousAgentDefinition } from "../shared/types.ts";

export const researchAnalystAgent: AutonomousAgentDefinition = {
  identity: {
    actorKind: "agent",
    displayName: "Research Analyst",
    externalId: "agent:research-analyst",
    handle: "research-analyst",
  },
  key: "research-analyst",
  profile: {
    availabilityStatus: "available",
    bio: "Synthesizes messy topics into clear memos, comparison tables, and decision-ready research summaries.",
    capabilityTags: ["research", "analysis", "market-mapping", "synthesis"],
    headline: "Structured research and synthesis agent",
    isPublic: true,
    productLabels: ["research memo", "comparison brief", "market scan"],
    skillTags: ["synthesis", "comparison", "decision support"],
  },
  supplyEntry: {
    agentReady: true,
    capabilityTags: ["research", "analysis", "advisory"],
    category: "research",
    deliveryType: "async",
    description: "Turns open-ended questions into concise research memos, comparisons, and recommendation-ready summaries.",
    estimatedDeliveryLabel: "Within 3 hours",
    maxConcurrentJobs: 3,
    priceAmount: 55,
    priceType: "fixed",
    responseSlaMinutes: 180,
    supplyType: "capability",
    title: "Research Analyst for Structured Decision Support",
  },
  settlement: buildDefaultAgentSettlement(),
  async buildDelivery({ detail, modelId }) {
    const deliverablesBody = await generateAgentMarkdown({
      modelId,
      prompt: [
        `Request title: ${detail.title}`,
        `Request summary: ${detail.summary}`,
        `Request body: ${detail.body}`,
        "Create a structured research memo in markdown.",
        "Include:",
        "1. Objective",
        "2. Key findings",
        "3. Comparison or breakdown",
        "4. Recommendation",
      ].join("\n"),
      system:
        "You are a research analyst. Produce concise, decision-ready summaries with explicit structure and useful comparisons.",
    });

    return {
      deliverablesBody,
      deliverablesType: "markdown",
    };
  },
  buildProposal({ detail }) {
    return {
      currency: "USD",
      deliverablesBody: `I will deliver a concise research memo for "${detail.title}" with findings, comparisons, and a recommendation in markdown.`,
      etaAt: Date.now() + 3 * 60 * 60 * 1000,
      price: 0.01,
    };
  },
  match({ detail, request }) {
    const text = `${request.title} ${request.summary} ${detail?.body ?? ""}`.toLowerCase();
    let score = 0;

    for (const keyword of [
      "research",
      "compare",
      "analysis",
      "market",
      "competitor",
      "brief",
      "memo",
      "evaluate",
    ]) {
      if (text.includes(keyword)) {
        score += 16;
      }
    }

    if (request.category === "research" || request.category === "advisory") {
      score += 20;
    }

    return Math.min(score, 100);
  },
};
