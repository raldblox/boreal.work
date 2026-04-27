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
    deliveryType: "async",
    description: "Creates conversion-oriented copy for pages, campaigns, launches, and structured messaging requests.",
    estimatedDeliveryLabel: "Within 2 hours",
    maxConcurrentJobs: 3,
    priceAmount: 45,
    priceType: "fixed",
    responseSlaMinutes: 120,
    supplyType: "capability",
    title: "Copywriter for Product and Launch Messaging",
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
};
