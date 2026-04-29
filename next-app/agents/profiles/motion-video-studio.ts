import { generateAgentMarkdown } from "../shared/llm.ts";
import { buildDefaultAgentSettlement } from "../shared/runtime-config.ts";
import type { AutonomousAgentDefinition } from "../shared/types.ts";

export const motionVideoStudioAgent: AutonomousAgentDefinition = {
  identity: {
    actorKind: "agent",
    displayName: "Video Generation",
    externalId: "agent:motion-video-studio",
    handle: "motion-video-studio",
  },
  key: "motion-video-studio",
  profile: {
    availabilityStatus: "available",
    bio: "Starts short video-generation jobs for product shots, visual loops, and launch visuals through a direct Boreal route. It is not a full motion studio or edit suite.",
    capabilityTags: [
      "video generation",
      "product visuals",
      "launch visuals",
      "short video",
    ],
    headline: "Direct short video generation",
    isPublic: true,
    productLabels: ["product shot", "video loop", "video job"],
    skillTags: ["video prompting", "shot direction", "visual sequencing"],
  },
  supplyEntry: {
    agentReady: true,
    capabilityTags: ["video generation", "product visuals", "launch visuals"],
    category: "video",
    checkoutProtocol: "custom",
    deliveryType: "instant",
    description:
      "Direct short video generation for product shots, loops, and launch visuals.",
    executorUrl: "/api/agents/motion-video-studio/execute",
    fulfillmentKind: "digital",
    isCartEnabled: false,
    outputTypes: ["video_generation"],
    priceAmount: 0,
    priceType: "fixed",
    scenarioTypes: ["provider_paid_service"],
    supplyType: "agent_tool",
    title: "Video Generation",
  },
  settlement: buildDefaultAgentSettlement(),
  async buildDelivery({ detail, modelId }) {
    const deliverablesBody = await generateAgentMarkdown({
      modelId,
      prompt: [
        `Request title: ${detail.title}`,
        `Request summary: ${detail.summary}`,
        `Request body: ${detail.body}`,
        "Prepare a short video-generation plan in markdown.",
        "Include:",
        "1. Shot direction",
        "2. Visual pacing",
        "3. Prompt-ready scene text",
        "4. Edit and delivery notes",
      ].join("\n"),
      system:
        "You are a short-form video producer for startup launches. Write concise scene direction and prompt-ready video planning notes without claiming full production or edit work.",
    });

    return {
      deliverablesBody,
      deliverablesType: "markdown",
    };
  },
  buildProposal({ detail }) {
    return {
      currency: "USD",
      deliverablesBody: `I will turn "${detail.title}" into a short video plan and a direct video-generation path for product or launch output.`,
      etaAt: Date.now() + 90 * 60 * 1000,
      price: 0.01,
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
      prompt: "Generate a cinematic sad cat video with soft rain and a slow dolly-in.",
      seconds: "8",
      size: "1280x720",
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
      {
        description: "Optional clip duration. Allowed values: 4, 8, or 12 seconds.",
        name: "seconds",
        required: false,
        type: "string",
      },
      {
        description:
          "Optional output size. Allowed values: 720x1280, 1280x720, 1024x1792, or 1792x1024.",
        name: "size",
        required: false,
        type: "string",
      },
    ],
    invoke: async ({ payload }) => {
      const { runVideoGeneration } = await import("../shared/openai-media.ts");

      return runVideoGeneration({
        prompt: String(payload.prompt ?? ""),
        seconds:
          typeof payload.seconds === "string" ? payload.seconds : undefined,
        size: typeof payload.size === "string" ? payload.size : undefined,
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
