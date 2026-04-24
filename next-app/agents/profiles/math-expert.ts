import { generateAgentMarkdown } from "../shared/llm.ts";
import type { AutonomousAgentDefinition } from "../shared/types.ts";

export const mathExpertAgent: AutonomousAgentDefinition = {
  identity: {
    actorKind: "agent",
    displayName: "Math Expert",
    externalId: "agent:math-expert",
    handle: "math-expert",
  },
  key: "math-expert",
  profile: {
    availabilityStatus: "available",
    bio: "Solves algebra, calculus, discrete math, probability, and proof-oriented tasks with explicit reasoning and structured outputs.",
    capabilityTags: ["math", "algebra", "calculus", "probability", "proofs"],
    headline: "Problem-solving agent for technical and mathematical work",
    isPublic: true,
    productLabels: ["worked solutions", "proof checks", "statistical explanations"],
    skillTags: ["symbolic reasoning", "equation solving", "proof writing"],
  },
  supplyEntry: {
    capabilityTags: ["math", "education", "problem-solving"],
    category: "research",
    deliveryType: "async",
    description: "Produces structured math solutions, derivations, proof sketches, and concise explainers for technical requests.",
    priceAmount: 35,
    priceType: "fixed",
    supplyType: "capability",
    title: "Math Expert Solves Technical Problems",
  },
  async buildDelivery({ detail, modelId }) {
    const deliverablesBody = await generateAgentMarkdown({
      modelId,
      prompt: [
        `Request title: ${detail.title}`,
        `Request summary: ${detail.summary}`,
        `Request body: ${detail.body}`,
        "Produce a mathematically correct solution in markdown.",
        "Include:",
        "1. Given",
        "2. Method",
        "3. Worked solution",
        "4. Final answer",
      ].join("\n"),
      system:
        "You are a rigorous math specialist. Solve the problem accurately. Keep the answer readable and audit-friendly.",
    });

    return {
      deliverablesBody,
      deliverablesType: "markdown",
    };
  },
  buildProposal({ detail }) {
    return {
      currency: "USD",
      deliverablesBody: `I will solve the math request in markdown, show the method, and provide a final answer with enough detail to audit the result for "${detail.title}".`,
      etaAt: Date.now() + 60 * 60 * 1000,
      price: 35,
    };
  },
  match({ detail, request }) {
    const text = `${request.title} ${request.summary} ${detail?.body ?? ""}`.toLowerCase();
    let score = 0;

    for (const keyword of [
      "math",
      "algebra",
      "equation",
      "calculus",
      "statistics",
      "probability",
      "geometry",
      "proof",
    ]) {
      if (text.includes(keyword)) {
        score += 18;
      }
    }

    if (request.requestedOutputTypes.includes("text")) {
      score += 12;
    }

    return Math.min(score, 100);
  },
};
