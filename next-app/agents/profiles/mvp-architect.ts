import { generateAgentMarkdown } from "../shared/llm.ts";
import type { AutonomousAgentDefinition } from "../shared/types.ts";

const MVP_ARCHITECT_SYSTEM =
  `Act as an MVP architect applying Paul Graham's "build something people want" framework - the only purpose of an MVP is to test the single most important assumption as fast and cheaply as possible.`;

export const mvpArchitectAgent: AutonomousAgentDefinition = {
  identity: {
    actorKind: "agent",
    displayName: "MVP Architect",
    externalId: "agent:mvp-architect",
    handle: "mvp-architect",
  },
  key: "mvp-architect",
  profile: {
    availabilityStatus: "available",
    bio: "Designs the smallest possible MVP to test a startup's core assumption in two weeks, with a direct focus on user behavior and signal quality.",
    capabilityTags: [
      "mvp planning",
      "core assumption testing",
      "launch planning",
      "startup execution",
    ],
    headline: "Lean MVP architect for early startup bets",
    isPublic: true,
    productLabels: ["2-week plan", "MVP scope", "assumption test"],
    skillTags: ["scope cutting", "launch planning", "behavioral validation"],
  },
  supplyEntry: {
    agentReady: true,
    capabilityTags: ["startup", "product strategy", "mvp design"],
    category: "advisory",
    checkoutProtocol: "custom",
    deliveryType: "instant",
    description:
      "Callable MVP architect that cuts a product down to the smallest assumption-testing build and launch plan.",
    executorUrl: "/api/agents/mvp-architect/execute",
    fulfillmentKind: "digital",
    isCartEnabled: false,
    outputTypes: ["text"],
    priceAmount: 0,
    priceType: "fixed",
    scenarioTypes: ["consultation"],
    supplyType: "capability",
    title: "MVP Architect",
  },
  settlement: {
    autoQuoteUsd: 45,
    chainFamily: "solana",
    environment: "devnet",
    networkKey: "solana:devnet",
    payerSources: ["openwallet", "agentcash"],
    payoutAddress: "Az1U9NsW72P5o4fYx1occGg5n6gKPjHM9S4gkf9dJvZC",
    walletAddress: "Az1U9NsW72P5o4fYx1occGg5n6gKPjHM9S4gkf9dJvZC",
  },
  async buildDelivery({ detail, modelId }) {
    const deliverablesBody = await generateAgentMarkdown({
      modelId,
      prompt: [
        `Request title: ${detail.title}`,
        `Request summary: ${detail.summary}`,
        `Request body: ${detail.body}`,
        "Design the smallest possible MVP for this startup idea.",
        "Output: Core Assumption -> Minimum Feature Set -> What Gets Cut -> Test Criteria -> 2-Week Launch Plan.",
        "The MVP must test one assumption only and end with real users, not internal testing.",
      ].join("\n"),
      system: MVP_ARCHITECT_SYSTEM,
    });

    return {
      deliverablesBody,
      deliverablesType: "markdown",
    };
  },
  buildProposal({ detail }) {
    return {
      currency: "USD",
      deliverablesBody: `I will turn "${detail.title}" into a 2-week MVP plan with one core assumption, minimum feature set, and clear behavioral test criteria.`,
      etaAt: Date.now() + 30 * 60 * 1000,
      price: 45,
    };
  },
  match({ detail, request }) {
    const text = `${request.title} ${request.summary} ${detail?.body ?? ""}`.toLowerCase();
    let score = 0;

    for (const keyword of [
      "mvp",
      "prototype",
      "assumption",
      "launch plan",
      "test this idea",
      "what should we build first",
      "product scope",
      "validate",
    ]) {
      if (text.includes(keyword)) {
        score += 16;
      }
    }

    if (request.category === "advisory" || request.category === "strategy") {
      score += 18;
    }

    return Math.min(score, 100);
  },
  directExecution: {
    auth: "x-session",
    description:
      "Designs the smallest MVP and 2-week launch plan around a startup's core assumption.",
    exampleRequest: {
      coreAssumption:
        "Teams will trust one request thread to route work across agents, providers, and freelancers.",
      idea:
        "A request-native commerce system that keeps approvals, delivery, and proof in one live work thread.",
    },
    fields: [
      {
        description: "Startup idea description to design an MVP for.",
        name: "idea",
        required: true,
        type: "string",
      },
      {
        description: "Optional explicit core assumption if the founder already knows it.",
        name: "coreAssumption",
        required: false,
        type: "string",
      },
    ],
    invoke: async ({ modelId, payload }) => {
      const idea = String(payload.idea ?? "").trim();
      const coreAssumption =
        typeof payload.coreAssumption === "string"
          ? payload.coreAssumption.trim()
          : "";

      if (!idea) {
        throw new Error("idea is required for mvp-architect.");
      }

      const content = await generateAgentMarkdown({
        modelId,
        prompt: [
          `Startup idea: ${idea}`,
          coreAssumption
            ? `Founder-stated core assumption: ${coreAssumption}`
            : "Identify the single core assumption yourself first.",
          "Design the smallest possible version of this product that tests the core assumption - built in 2 weeks, launched to real users, and generating real signal.",
          "Steps:",
          "1. Identify the single most important assumption that must be true for the business to work",
          "2. Design the minimum feature set - only what's needed to test that one assumption",
          "3. Cut everything else - every feature that doesn't test the core assumption gets removed",
          "4. Define the test criteria - what specific user behavior proves or disproves the assumption",
          "5. Build a 2-week launch plan - day by day from zero to first real users",
          "Rules:",
          "- MVP tests one assumption - never two or three",
          "- Every feature not required for the test gets cut - no exceptions",
          "- Test criteria must be behavioral - not 'users said they liked it'",
          "- 2-week plan must end with real users - not internal testing",
          "- Test: if this assumption is wrong does the entire business model change",
          "Output: Core Assumption -> Minimum Feature Set -> What Gets Cut -> Test Criteria -> 2-Week Launch Plan",
        ].join("\n"),
        system: MVP_ARCHITECT_SYSTEM,
      });

      return {
        content,
        contentType: "text/markdown" as const,
        kind: "text" as const,
        title: "MVP architecture plan",
      };
    },
    outputKinds: ["text"],
    routePath: "/api/agents/mvp-architect/execute",
    version: "boreal-agent-registry/v1",
  },
};
