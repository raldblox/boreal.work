import { generateAgentMarkdown } from "../shared/llm.ts";
import { buildDefaultAgentSettlement } from "../shared/runtime-config.ts";
import type { AutonomousAgentDefinition } from "../shared/types.ts";

export const copywriterAgent: AutonomousAgentDefinition = {
  identity: {
    actorKind: "agent",
    displayName: "Copywriter",
    externalId: "agent:copywriter",
    handle: "copywriter",
  },
  key: "copywriter",
  profile: {
    availabilityStatus: "available",
    bio: "Writes landing pages, product copy, announcement copy, and conversion-focused messaging with clear structure and tone control.",
    capabilityTags: ["copywriting", "landing-page-copy", "product-marketing", "launch-copy"],
    headline: "Conversion-focused writing agent",
    isPublic: true,
    productLabels: ["hero copy", "email drafts", "product descriptions"],
    skillTags: ["messaging", "positioning", "headline writing"],
  },
  supplyEntry: {
    agentReady: true,
    capabilityTags: ["copywriting", "creative", "marketing"],
    category: "content",
    checkoutProtocol: "custom",
    deliveryType: "instant",
    description:
      "Direct product and launch copy for landing pages, emails, offer pages, and messaging drafts.",
    executorUrl: "/api/agents/copywriter/execute",
    fulfillmentKind: "digital",
    isCartEnabled: false,
    outputTypes: ["text"],
    priceAmount: 0,
    priceType: "fixed",
    scenarioTypes: ["consultation"],
    supplyType: "capability",
    title: "Copywriter",
  },
  settlement: buildDefaultAgentSettlement(),
  async buildDelivery({ detail, modelId }) {
    const deliverablesBody = await generateAgentMarkdown({
      modelId,
      prompt: [
        `Request title: ${detail.title}`,
        `Request summary: ${detail.summary}`,
        `Request body: ${detail.body}`,
        "Write a clean delivery in markdown.",
        "Include:",
        "1. Messaging angle",
        "2. Primary copy deliverable",
        "3. Two alternate headline options",
        "4. Notes on tone",
      ].join("\n"),
      system:
        "You are a direct product copywriter. Write concise, useful copy that sounds intentional and commercially strong.",
    });

    return {
      deliverablesBody,
      deliverablesType: "markdown",
    };
  },
  buildProposal({ detail }) {
    return {
      currency: "USD",
      deliverablesBody: `I will deliver polished copy in markdown for "${detail.title}", including a primary draft, alternates, and tone notes that the owner can use immediately.`,
      etaAt: Date.now() + 2 * 60 * 60 * 1000,
      price: 0.01,
    };
  },
  match({ detail, request }) {
    const text = `${request.title} ${request.summary} ${detail?.body ?? ""}`.toLowerCase();
    let score = 0;

    for (const keyword of [
      "copy",
      "headline",
      "landing page",
      "announcement",
      "product description",
      "email",
      "brand voice",
      "messaging",
    ]) {
      if (text.includes(keyword)) {
        score += 16;
      }
    }

    if (request.category === "content") {
      score += 20;
    }

    return Math.min(score, 100);
  },
  directExecution: {
    auth: "x-session",
    description:
      "Writes structured product, launch, and landing-page copy in markdown through Boreal's OpenAI-backed text route.",
    exampleRequest: {
      format: "landing page hero",
      goal: "Make the product legible to founders in one screen.",
      brief:
        "A request-native commerce platform that turns one chat ask into tracked work across agents, providers, and freelancers.",
    },
    fields: [
      {
        description: "What needs to be written.",
        name: "brief",
        required: true,
        type: "string",
      },
      {
        description: "Optional target format such as landing page hero, email, launch post, or product description.",
        name: "format",
        required: false,
        type: "string",
      },
      {
        description: "Optional outcome or conversion goal.",
        name: "goal",
        required: false,
        type: "string",
      },
    ],
    invoke: async ({ modelId, payload }) => {
      const brief = String(payload.brief ?? "").trim();
      const format =
        typeof payload.format === "string" && payload.format.trim().length > 0
          ? payload.format.trim()
          : "product copy";
      const goal =
        typeof payload.goal === "string" && payload.goal.trim().length > 0
          ? payload.goal.trim()
          : "make the offer clearer and more persuasive";

      if (!brief) {
        throw new Error("brief is required for copywriter.");
      }

      const content = await generateAgentMarkdown({
        modelId,
        prompt: [
          `Brief: ${brief}`,
          `Format: ${format}`,
          `Goal: ${goal}`,
          "Write clean, commercially strong copy in markdown.",
          "Output:",
          "1. Messaging angle",
          "2. Primary draft",
          "3. Three alternate headlines or hooks",
          "4. Tone notes",
          "Rules:",
          "- make it direct and usable",
          "- avoid filler and generic marketing language",
          "- optimize for clarity before cleverness",
        ].join("\n"),
        system:
          "You are a direct-response product copywriter. Produce sharp, useful copy with clear structure and strong commercial intent.",
      });

      return {
        content,
        contentType: "text/markdown" as const,
        kind: "text" as const,
        title: "Copy draft",
      };
    },
    outputKinds: ["text"],
    routePath: "/api/agents/copywriter/execute",
    version: "boreal-agent-registry/v1",
  },
};
