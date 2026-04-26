import { generateAgentMarkdown } from "../shared/llm.ts";
import type { AutonomousAgentDefinition } from "../shared/types.ts";

export const motionVideoStudioAgent: AutonomousAgentDefinition = {
  identity: {
    actorKind: "agent",
    displayName: "Motion Video Studio",
    externalId: "agent:motion-video-studio",
    handle: "motion-video-studio",
  },
  key: "motion-video-studio",
  profile: {
    availabilityStatus: "available",
    bio: "Starts short-form motion and video generation jobs for promos, explainer beats, and launch visual experiments through a direct Boreal route.",
    capabilityTags: [
      "video generation",
      "motion graphics",
      "promo video",
      "launch visuals",
    ],
    headline: "Direct motion and video generation agent",
    isPublic: true,
    productLabels: ["promo shot", "motion beat", "video job"],
    skillTags: ["video prompting", "motion direction", "visual sequencing"],
  },
  supplyEntry: {
    agentReady: true,
    capabilityTags: ["video generation", "motion graphics", "promo creative"],
    category: "video",
    checkoutProtocol: "custom",
    deliveryType: "instant",
    description:
      "Callable video-generation agent for short motion sequences, launch visuals, and promo concepts.",
    executorUrl: "/api/agents/motion-video-studio/execute",
    fulfillmentKind: "digital",
    isCartEnabled: false,
    outputTypes: ["video_generation"],
    priceAmount: 0,
    priceType: "fixed",
    scenarioTypes: ["provider_paid_service"],
    supplyType: "agent_tool",
    title: "Motion Video Studio",
  },
  settlement: {
    autoQuoteUsd: 60,
    chainFamily: "solana",
    environment: "devnet",
    networkKey: "solana:devnet",
    payerSources: ["openwallet", "agentcash"],
    payoutAddress: "GHc6UXMXYPVGT3kSCpivugrCvsbsenEzcjNo2MdZPAsb",
    walletAddress: "GHc6UXMXYPVGT3kSCpivugrCvsbsenEzcjNo2MdZPAsb",
  },
  async buildDelivery({ detail, modelId }) {
    const deliverablesBody = await generateAgentMarkdown({
      modelId,
      prompt: [
        `Request title: ${detail.title}`,
        `Request summary: ${detail.summary}`,
        `Request body: ${detail.body}`,
        "Prepare a motion-video generation plan in markdown.",
        "Include:",
        "1. Shot direction",
        "2. Visual pacing",
        "3. Prompt-ready scene text",
        "4. Edit and delivery notes",
      ].join("\n"),
      system:
        "You are a motion-graphics producer for startup launches. Write concise scene direction and prompt-ready video planning notes.",
    });

    return {
      deliverablesBody,
      deliverablesType: "markdown",
    };
  },
  buildProposal({ detail }) {
    return {
      currency: "USD",
      deliverablesBody: `I will turn "${detail.title}" into a motion-ready scene plan and a direct video-generation path for promo or explainer output.`,
      etaAt: Date.now() + 90 * 60 * 1000,
      price: 60,
    };
  },
  match({ detail, request }) {
    const text = `${request.title} ${request.summary} ${detail?.body ?? ""}`.toLowerCase();
    let score = 0;

    for (const keyword of [
      "video",
      "motion",
      "promo",
      "launch cut",
      "trailer",
      "animation",
      "scene",
      "sizzle",
    ]) {
      if (text.includes(keyword)) {
        score += 16;
      }
    }

    if (request.requestedOutputTypes.includes("video_generation")) {
      score += 30;
    }

    return Math.min(score, 100);
  },
  directExecution: {
    auth: "x-session",
    description:
      "Starts a short video-generation job through Boreal's OpenAI-backed video route.",
    exampleRequest: {
      prompt:
        "Generate an 8-second cinematic product motion shot for a request-native commerce launch.",
      title: "Launch motion test",
    },
    fields: [
      {
        description: "Video prompt describing the shot or motion sequence.",
        name: "prompt",
        required: true,
        type: "string",
      },
      {
        description: "Short title used in the returned video job artifact.",
        name: "title",
        required: false,
        type: "string",
      },
    ],
    invoke: async ({ payload }) => {
      const { runVideoGeneration } = await import("../shared/openai-media.ts");

      return runVideoGeneration({
        prompt: String(payload.prompt ?? ""),
        title:
          typeof payload.title === "string" && payload.title.trim().length > 0
            ? payload.title
            : "Generated video job",
      });
    },
    outputKinds: ["video_generation"],
    routePath: "/api/agents/motion-video-studio/execute",
    version: "boreal-agent-registry/v1",
  },
};
