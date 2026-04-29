import assert from "node:assert/strict";

import { buildAutoRoutePlan } from "../lib/boreal/one-request/routing.ts";
import { refineIntentForRequestLifecycle } from "../lib/boreal/routing/request-handling.ts";
import {
  normalizeIntentExtraction,
  type PersistedIntent,
} from "../lib/boreal/schemas/intent.ts";

const solanaStarterPrompt =
  "I need Solana help. Plan a mainnet swap or staking flow with wallet requirements, approval steps, and risk notes.";

function createPersistedIntent(intent: ReturnType<typeof refineIntentForRequestLifecycle>) {
  return {
    ...intent,
    assistantMessageId: crypto.randomUUID(),
    conversationId: crypto.randomUUID(),
    embedding: [],
    embeddingModel: "smoke-test",
    intentModel: "smoke-test",
    modalityScores: intent.requestedOutputTypes.map((kind, index) => ({
      kind,
      score: index === 0 ? 0.98 : 0.75,
    })),
    provider: "boreal-agent",
    userMessageId: crypto.randomUUID(),
  } satisfies PersistedIntent;
}

function main() {
  const normalized = normalizeIntentExtraction(
    {
      body: solanaStarterPrompt,
      capabilityTags: ["solana", "swap", "staking", "wallet approvals"],
      catalogQuery: "solana mainnet swap staking plan",
      category: "general",
      confidence: 0.93,
      extractionNotes: ["deterministic smoke solana quick action"],
      intentType: "demand",
      keywords: ["solana", "swap", "staking", "wallet", "risk"],
      requestedOutputTypes: ["text"],
      responseInstructions: "Route Solana planning to the best specialist.",
      routeTarget: "general_assistance",
      routing: {
        resolutionTier: "fast",
        shouldCreateFulfillmentRequest: false,
        shouldPersistToBoard: false,
      },
      shouldSearchCatalog: false,
      summary: "Plan a Solana mainnet swap or staking flow.",
      title: "Plan a Solana mainnet swap or staking flow",
      voice: "alloy",
    },
    solanaStarterPrompt,
    [{ kind: "text", score: 0.98 }],
  );

  const refined = refineIntentForRequestLifecycle(normalized, solanaStarterPrompt);
  const persistedIntent = createPersistedIntent(refined);
  const routePlan = buildAutoRoutePlan({
    intent: persistedIntent,
    message: solanaStarterPrompt,
  });

  assert.equal(refined.category, "solana", "Solana starter prompt should classify as solana");
  assert.equal(
    refined.needsClarification,
    false,
    "Solana starter prompt should bypass generic text-deliverable clarification",
  );
  assert.equal(
    refined.classification.executionKind,
    "async_agent",
    "Solana starter prompt should stay on the specialist async-agent path",
  );
  assert.equal(
    refined.classification.matchingMode,
    "catalog",
    "Solana starter prompt should search the specialist catalog",
  );
  assert.ok(
    refined.suggestedReplies.includes("Invite Solana Operator"),
    "Solana starter prompt should expose the direct invite action",
  );
  assert.ok(routePlan, "Solana starter prompt should build a direct specialist route plan");
  assert.equal(
    routePlan?.selected[0]?.agent.key,
    "solana-operator",
    "Solana Operator should be the top route for the starter prompt",
  );

  console.log("smoke:solana-specialist-route passed");
}

main();
