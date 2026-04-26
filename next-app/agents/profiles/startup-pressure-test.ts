import { generateAgentMarkdown } from "../shared/llm.ts";
import type { AutonomousAgentDefinition } from "../shared/types.ts";

const PRESSURE_TEST_SYSTEM =
  "Act as a Paul Graham-style startup evaluator who has reviewed thousands of ideas and knows exactly which ones die in week one and which ones become billion dollar companies.";

export const startupPressureTestAgent: AutonomousAgentDefinition = {
  identity: {
    actorKind: "agent",
    displayName: "Startup Pressure Test",
    externalId: "agent:startup-pressure-test",
    handle: "startup-pressure-test",
  },
  key: "startup-pressure-test",
  profile: {
    availabilityStatus: "available",
    bio: "Pressure tests startup ideas with direct, YC-style criticism focused on core assumptions, likely failure modes, and whether the problem is painful enough to pay for.",
    capabilityTags: [
      "startup evaluation",
      "idea pressure test",
      "core assumption",
      "founder feedback",
    ],
    headline: "Brutal startup evaluator for early ideas",
    isPublic: true,
    productLabels: ["idea review", "fatal flaw audit", "startup verdict"],
    skillTags: ["problem validation", "founder-market fit", "startup critique"],
  },
  supplyEntry: {
    agentReady: true,
    capabilityTags: ["advisory", "startup", "strategy"],
    category: "advisory",
    checkoutProtocol: "custom",
    deliveryType: "instant",
    description:
      "Callable startup evaluator that pressure tests ideas before a founder wastes months building the wrong thing.",
    executorUrl: "/api/agents/startup-pressure-test/execute",
    fulfillmentKind: "digital",
    isCartEnabled: false,
    outputTypes: ["text"],
    priceAmount: 0,
    priceType: "fixed",
    scenarioTypes: ["consultation"],
    supplyType: "capability",
    title: "Startup Pressure Test",
  },
  async buildDelivery({ detail, modelId }) {
    const deliverablesBody = await generateAgentMarkdown({
      modelId,
      prompt: [
        `Request title: ${detail.title}`,
        `Request summary: ${detail.summary}`,
        `Request body: ${detail.body}`,
        "Pressure test this startup idea.",
        "Output: Core Assumption -> Three Fatal Flaws -> Problem Validation -> Founder-Market Fit -> Brutal Verdict.",
        "Every flaw must be specific to this idea. Core assumption must be testable before building anything.",
      ].join("\n"),
      system: PRESSURE_TEST_SYSTEM,
    });

    return {
      deliverablesBody,
      deliverablesType: "markdown",
    };
  },
  buildProposal({ detail }) {
    return {
      currency: "USD",
      deliverablesBody: `I will pressure test "${detail.title}" with a direct startup verdict, core assumption, and ranked fatal flaws in markdown.`,
      etaAt: Date.now() + 30 * 60 * 1000,
      price: 40,
    };
  },
  match({ detail, request }) {
    const text = `${request.title} ${request.summary} ${detail?.body ?? ""}`.toLowerCase();
    let score = 0;

    for (const keyword of [
      "startup",
      "idea",
      "saas",
      "business",
      "validate",
      "pressure test",
      "yc",
      "founder",
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
      "Evaluates a startup idea against a single core assumption and likely failure modes.",
    exampleRequest: {
      idea:
        "A request-native commerce layer that turns chat asks into live work across agents, providers, and freelancers.",
    },
    fields: [
      {
        description: "Startup idea description to pressure test.",
        name: "idea",
        required: true,
        type: "string",
      },
    ],
    invoke: async ({ modelId, payload }) => {
      const idea = String(payload.idea ?? "").trim();

      if (!idea) {
        throw new Error("idea is required for startup-pressure-test.");
      }

      const content = await generateAgentMarkdown({
        modelId,
        prompt: [
          `Startup idea: ${idea}`,
          "Pressure test this startup idea the way Paul Graham evaluates YC applications - finding every fatal flaw before a founder wastes a single month building the wrong thing.",
          "Steps:",
          "1. Identify the core assumption that must be true for the business to work",
          "2. Find the three most likely reasons this idea fails - specific, not generic",
          "3. Test the problem - is this a real pain people pay to solve or a nice-to-have",
          "4. Assess the founder-market fit - why is this founder the right person to build this",
          "5. Deliver a brutally honest verdict - strong, weak, or pivot required",
          "Rules:",
          "- Every flaw must be specific to this idea - no generic startup advice",
          "- Core assumption must be testable before building anything",
          "- Verdict must be direct - never 'it has potential but'",
          "- Fatal flaws ranked by severity - most dangerous first",
          "- Test: would Paul Graham fund this in its current form",
          "Output: Core Assumption -> Three Fatal Flaws -> Problem Validation -> Founder-Market Fit -> Brutal Verdict",
        ].join("\n"),
        system: PRESSURE_TEST_SYSTEM,
      });

      return {
        content,
        contentType: "text/markdown" as const,
        kind: "text" as const,
        title: "Startup pressure test",
      };
    },
    outputKinds: ["text"],
    routePath: "/api/agents/startup-pressure-test/execute",
    version: "boreal-agent-registry/v1",
  },
};
