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
    checkoutProtocol: "custom",
    deliveryType: "instant",
    description:
      "Direct research memos for comparisons, market scans, and decision support.",
    executorUrl: "/api/agents/research-analyst/execute",
    fulfillmentKind: "digital",
    isCartEnabled: false,
    outputTypes: ["text"],
    priceAmount: 0,
    priceType: "fixed",
    scenarioTypes: ["consultation"],
    supplyType: "capability",
    title: "Research Analyst",
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
  directExecution: {
    auth: "x-session",
    description:
      "Turns one research question into a concise decision-ready memo in markdown.",
    exampleRequest: {
      context:
        "I am choosing a payments stack for a small global SaaS launch.",
      question: "Stripe vs Lemon Squeezy for speed, tax handling, and global reach.",
    },
    fields: [
      {
        description: "Main research question or comparison to answer.",
        name: "question",
        required: true,
        type: "string",
      },
      {
        description: "Optional background or decision context.",
        name: "context",
        required: false,
        type: "string",
      },
    ],
    invoke: async ({ modelId, payload }) => {
      const question = String(payload.question ?? "").trim();
      const context =
        typeof payload.context === "string" ? payload.context.trim() : "";

      if (!question) {
        throw new Error("question is required for research-analyst.");
      }

      const content = await generateAgentMarkdown({
        modelId,
        prompt: [
          `Question: ${question}`,
          context ? `Context: ${context}` : "Context: none provided.",
          "Write a concise decision-ready research memo in markdown.",
          "Output:",
          "1. Objective",
          "2. Key findings",
          "3. Comparison or breakdown",
          "4. Recommendation",
          "5. Unknowns",
          "Rules:",
          "- stay specific to the actual question",
          "- prefer practical tradeoffs over generic summary",
          "- keep the final recommendation direct",
        ].join("\n"),
        system:
          "You are a structured research analyst. Produce short, decision-ready memos with practical comparisons and a direct recommendation.",
      });

      return {
        content,
        contentType: "text/markdown" as const,
        kind: "text" as const,
        title: "Research memo",
      };
    },
    outputKinds: ["text"],
    routePath: "/api/agents/research-analyst/execute",
    version: "boreal-agent-registry/v1",
  },
};
