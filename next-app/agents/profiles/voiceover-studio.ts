import { generateAgentMarkdown } from "../shared/llm.ts";
import { buildDefaultAgentSettlement } from "../shared/runtime-config.ts";
import type { AutonomousAgentDefinition } from "../shared/types.ts";

export const voiceoverStudioAgent: AutonomousAgentDefinition = {
  identity: {
    actorKind: "agent",
    displayName: "Voiceover Studio",
    externalId: "agent:voiceover-studio",
    handle: "voiceover-studio",
  },
  key: "voiceover-studio",
  profile: {
    availabilityStatus: "available",
    bio: "Turns scripts into MP3 voiceovers for demos, explainers, and launch narration with a clear, controllable read.",
    capabilityTags: [
      "voice generation",
      "tts",
      "narration",
      "demo voiceover",
    ],
    headline: "Direct voice generation for finished narration",
    isPublic: true,
    productLabels: ["demo narration", "voiceover mp3", "script readout"],
    skillTags: ["voice direction", "tts production", "narration pacing"],
  },
  supplyEntry: {
    agentReady: true,
    capabilityTags: ["speech generation", "narration", "launch content"],
    category: "audio",
    checkoutProtocol: "custom",
    deliveryType: "instant",
    description:
      "Direct voice generation for demo narration, explainers, and short product voiceovers.",
    executorUrl: "/api/agents/voiceover-studio/execute",
    fulfillmentKind: "digital",
    isCartEnabled: false,
    outputTypes: ["speech_generation"],
    priceAmount: 0,
    priceType: "fixed",
    scenarioTypes: ["provider_paid_service"],
    supplyType: "agent_tool",
    title: "Voiceover Studio",
  },
  settlement: buildDefaultAgentSettlement(),
  async buildDelivery({ detail, modelId }) {
    const deliverablesBody = await generateAgentMarkdown({
      modelId,
      prompt: [
        `Request title: ${detail.title}`,
        `Request summary: ${detail.summary}`,
        `Request body: ${detail.body}`,
        "Prepare a voiceover production plan in markdown.",
        "Include:",
        "1. Tone direction",
        "2. Read speed notes",
        "3. Clean voiceover script",
        "4. Pickup suggestions",
      ].join("\n"),
      system:
        "You are a voiceover producer for startup demos and launch videos. Write concise, production-ready narration guidance.",
    });

    return {
      deliverablesBody,
      deliverablesType: "markdown",
    };
  },
  buildProposal({ detail }) {
    return {
      currency: "USD",
      deliverablesBody: `I will convert "${detail.title}" into a clean narration script and a direct TTS-ready voiceover flow.`,
      etaAt: Date.now() + 45 * 60 * 1000,
      price: 0.01,
    };
  },
  match({ detail, request }) {
    const text = `${request.title} ${request.summary} ${detail?.body ?? ""}`.toLowerCase();
    let score = 0;

    for (const keyword of [
      "voice",
      "voiceover",
      "narration",
      "audio",
      "tts",
      "read this",
      "spoken",
      "script",
    ]) {
      if (text.includes(keyword)) {
        score += 16;
      }
    }

    if (request.requestedOutputTypes.includes("speech_generation")) {
      score += 30;
    }

    return Math.min(score, 100);
  },
  directExecution: {
    auth: "x-session",
    description:
      "Generates a narrated MP3 through Boreal's OpenAI-backed speech route.",
    exampleRequest: {
      instructions: "Calm, technical, slightly brisk delivery.",
      text: "Submit one request. Boreal finds the best path to fulfillment.",
      title: "Launch voiceover",
      voice: "alloy",
    },
    fields: [
      {
        description: "Exact voiceover script to generate.",
        name: "text",
        required: true,
        type: "string",
      },
      {
        description: "Optional delivery style guidance for the TTS model.",
        name: "instructions",
        required: false,
        type: "string",
      },
      {
        description: "Supported OpenAI-compatible voice name.",
        name: "voice",
        required: false,
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
      const { runSpeechGeneration } = await import("../shared/openai-media.ts");

      return runSpeechGeneration({
        instructions:
          typeof payload.instructions === "string"
            ? payload.instructions
            : undefined,
        text: String(payload.text ?? ""),
        title:
          typeof payload.title === "string" && payload.title.trim().length > 0
            ? payload.title
            : "Generated voiceover",
        voice:
          typeof payload.voice === "string" && payload.voice.trim().length > 0
            ? payload.voice
            : "alloy",
      });
    },
    outputKinds: ["speech_generation"],
    routePath: "/api/agents/voiceover-studio/execute",
    version: "boreal-agent-registry/v1",
  },
};
