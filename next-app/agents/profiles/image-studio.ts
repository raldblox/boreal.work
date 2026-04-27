import { generateAgentMarkdown } from "../shared/llm.ts";
import type { AutonomousAgentDefinition } from "../shared/types.ts";

export const imageStudioAgent: AutonomousAgentDefinition = {
  identity: {
    actorKind: "agent",
    displayName: "Image Studio",
    externalId: "agent:image-studio",
    handle: "image-studio",
  },
  key: "image-studio",
  profile: {
    availabilityStatus: "available",
    bio: "Generates launch visuals, product art, thumbnails, and branded image assets through a direct OpenAI-backed execution route.",
    capabilityTags: [
      "image generation",
      "launch visuals",
      "thumbnail design",
      "brand art direction",
    ],
    headline: "Direct image generation agent",
    isPublic: true,
    productLabels: ["hero visual", "thumbnail", "campaign art"],
    skillTags: ["visual prompting", "art direction", "brand consistency"],
  },
  supplyEntry: {
    agentReady: true,
    capabilityTags: ["image generation", "visual design", "launch creative"],
    category: "design",
    checkoutProtocol: "custom",
    deliveryType: "instant",
    description:
      "Callable image-generation agent for thumbnails, hero art, launch visuals, and product graphics.",
    executorUrl: "/api/agents/image-studio/execute",
    fulfillmentKind: "digital",
    isCartEnabled: false,
    outputTypes: ["image_generation"],
    priceAmount: 0,
    priceType: "fixed",
    scenarioTypes: ["provider_paid_service"],
    supplyType: "agent_tool",
    title: "Image Studio",
  },
  settlement: {
    autoQuoteUsd: 0.01,
    chainFamily: "solana",
    environment: "devnet",
    networkKey: "solana:devnet",
    payerSources: ["openwallet", "agentcash"],
    payoutAddress: "5cPwv7uSPBGptC8fjDUf4y4yZtXGYnGVDMeUHHPmNPr3",
    walletAddress: "5cPwv7uSPBGptC8fjDUf4y4yZtXGYnGVDMeUHHPmNPr3",
  },
  async buildDelivery({ detail, modelId }) {
    const deliverablesBody = await generateAgentMarkdown({
      modelId,
      prompt: [
        `Request title: ${detail.title}`,
        `Request summary: ${detail.summary}`,
        `Request body: ${detail.body}`,
        "Prepare a creative delivery brief in markdown for a launch visual request.",
        "Include:",
        "1. Recommended visual direction",
        "2. Prompt-ready shot list",
        "3. Asset checklist",
        "4. Notes for brand consistency",
      ].join("\n"),
      system:
        "You are a concise art director for startup launch visuals. Write practical image-generation guidance in markdown.",
    });

    return {
      deliverablesBody,
      deliverablesType: "markdown",
    };
  },
  buildProposal({ detail }) {
    return {
      currency: "USD",
      deliverablesBody: `I will turn "${detail.title}" into a production-ready image brief or direct asset-generation flow for hero visuals, thumbnails, or launch art.`,
      etaAt: Date.now() + 60 * 60 * 1000,
      price: 0.01,
    };
  },
  match({ detail, request }) {
    const text = `${request.title} ${request.summary} ${detail?.body ?? ""}`.toLowerCase();
    let score = 0;

    for (const keyword of [
      "image",
      "visual",
      "thumbnail",
      "poster",
      "cover",
      "hero",
      "art",
      "graphic",
    ]) {
      if (text.includes(keyword)) {
        score += 16;
      }
    }

    if (request.requestedOutputTypes.includes("image_generation")) {
      score += 30;
    }

    return Math.min(score, 100);
  },
  directExecution: {
    auth: "x-session",
    description:
      "Generates a single image asset directly through Boreal's OpenAI-backed image route.",
    exampleRequest: {
      prompt:
        "Create a clean cinematic thumbnail for a startup launch video about request-native agentic commerce.",
      title: "Launch thumbnail",
    },
    fields: [
      {
        description: "What the image should depict.",
        name: "prompt",
        required: true,
        type: "string",
      },
      {
        description: "Short title used in the returned artifact.",
        name: "title",
        required: false,
        type: "string",
      },
    ],
    invoke: async ({ payload }) => {
      const { runImageGeneration } = await import("../shared/openai-media.ts");

      return runImageGeneration({
        prompt: String(payload.prompt ?? ""),
        title:
          typeof payload.title === "string" && payload.title.trim().length > 0
            ? payload.title
            : "Generated image",
      });
    },
    outputKinds: ["image_generation"],
    routePath: "/api/agents/image-studio/execute",
    version: "boreal-agent-registry/v1",
  },
};
