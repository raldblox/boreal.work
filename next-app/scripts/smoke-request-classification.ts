import assert from "node:assert/strict";

import { api, createAgentConvexClient } from "../agents/shared/convex-client.ts";
import { normalizeIntentExtraction } from "../lib/boreal/schemas/intent.ts";
import { buildIntentPersistencePayload } from "../lib/boreal/tools/ui/build-intent-response.ts";

const ownerExternalId = `smoke-request-classification-${Date.now()}`;

async function persistScenario(input: {
  conversationId: string;
  message: string;
  partialIntent: Parameters<typeof normalizeIntentExtraction>[0];
  scoreKind?: "image_generation" | "speech_generation" | "text" | "video_generation";
}) {
  const normalizedIntent = normalizeIntentExtraction(
    input.partialIntent,
    input.message,
    [{ kind: input.scoreKind ?? "text", score: 0.98 }],
  );
  const persistedIntent = buildIntentPersistencePayload({
    assistantMessageId: crypto.randomUUID(),
    conversationId: input.conversationId,
    embedding: [],
    embeddingModel: "smoke-test",
    intent: normalizedIntent,
    intentModel: "smoke-test",
    modalityScores: normalizedIntent.requestedOutputTypes.map((kind, index) => ({
      kind,
      score: index === 0 ? 0.98 : 0.75,
    })),
    provider: "boreal-agent",
    userMessageId: crypto.randomUUID(),
  });

  return {
    normalizedIntent,
    persistedIntent,
  };
}

async function main() {
  const client = createAgentConvexClient();
  const conversationId = crypto.randomUUID();

  const informationalMessage = "What startup pressure-test offers do you have here?";
  const informational = await persistScenario({
    conversationId,
    message: informationalMessage,
    partialIntent: {
      body: informationalMessage,
      capabilityTags: ["startup", "pressure test", "offers"],
      catalogQuery: "startup pressure test offers",
      category: "business",
      confidence: 0.9,
      extractionNotes: ["deterministic smoke informational request"],
      intentType: "informational",
      keywords: ["startup", "pressure test", "offers"],
      needsClarification: false,
      requestedOutputTypes: ["text"],
      responseInstructions: "Answer directly and show best catalog matches.",
      routeTarget: "catalog_lookup",
      routing: {
        resolutionTier: "fast",
        shouldCreateFulfillmentRequest: false,
        shouldPersistToBoard: false,
      },
      shouldSearchCatalog: true,
      summary: "Browse startup pressure-test offers.",
      title: "Browse startup pressure-test offers",
      voice: "alloy",
    },
  });

  const informationalRecord = await client.mutation(api.chats.recordIntentPipeline, {
    assistantMessage: "Catalog lookup prepared for direct answer.",
    conversationId,
    initialStatus: "open",
    intent: informational.persistedIntent,
    ownerDisplayName: "Smoke Classification Owner",
    ownerExternalId,
    ownerHandle: "smoke_request_classifier",
    userMessage: informationalMessage,
  });

  const informationalDetail = await client.query(api.intents.getRequestDetail, {
    intentId: informationalRecord.intentId,
    ownerExternalId,
  });
  const informationalExecution = await client.query(api.intents.getExecutionContext, {
    intentId: informationalRecord.intentId,
    ownerExternalId,
  });

  assert.equal(
    informationalDetail.intent?.classification.routeFamily,
    "informational",
    "informational requests should persist routeFamily=informational",
  );
  assert.equal(
    informationalDetail.intent?.classification.matchingMode,
    "catalog",
    "informational catalog lookups should persist matchingMode=catalog",
  );
  assert.equal(
    informationalExecution?.classification.executionKind,
    "none",
    "informational lookups should persist executionKind=none",
  );

  const videoMessage = "Generate me a sad cat video.";
  const video = await persistScenario({
    conversationId,
    message: videoMessage,
    partialIntent: {
      assetPrompt: "A sad cat sitting by a rainy window.",
      body: videoMessage,
      capabilityTags: ["video", "sad cat"],
      catalogQuery: videoMessage,
      category: "creative",
      confidence: 0.97,
      extractionNotes: ["deterministic smoke direct generation request"],
      intentType: "demand",
      keywords: ["video", "sad cat"],
      needsClarification: false,
      requestedOutputTypes: ["video_generation"],
      responseInstructions: "Generate the requested video.",
      routeTarget: "video_generation",
      routing: {
        resolutionTier: "auto",
        shouldCreateFulfillmentRequest: true,
        shouldPersistToBoard: true,
      },
      shouldSearchCatalog: false,
      summary: "Generate a sad cat video.",
      title: "Generate a sad cat video",
      voice: "alloy",
    },
    scoreKind: "video_generation",
  });

  const videoRecord = await client.mutation(api.chats.recordIntentPipeline, {
    assistantMessage: "Direct video route prepared.",
    conversationId,
    initialStatus: "open",
    intent: video.persistedIntent,
    ownerDisplayName: "Smoke Classification Owner",
    ownerExternalId,
    ownerHandle: "smoke_request_classifier",
    userMessage: videoMessage,
  });

  const videoDetail = await client.query(api.intents.getRequestDetail, {
    intentId: videoRecord.intentId,
    ownerExternalId,
  });
  const videoExecution = await client.query(api.intents.getExecutionContext, {
    intentId: videoRecord.intentId,
    ownerExternalId,
  });

  assert.equal(
    videoDetail.intent?.classification.routeFamily,
    "direct_generation",
    "video requests should persist routeFamily=direct_generation",
  );
  assert.equal(
    videoDetail.intent?.classification.executionKind,
    "direct_tool",
    "video requests should persist executionKind=direct_tool",
  );
  assert.equal(
    videoExecution?.classification.paymentMode,
    "x402_prepay",
    "video requests should persist paymentMode=x402_prepay",
  );
  assert.deepEqual(
    videoExecution?.classification.candidatePool.actorKinds,
    ["agent", "tool"],
    "direct generation should persist the direct generation actor pool",
  );

  const advisoryMessage = "Can you help me pressure test my agentic commerce idea?";
  const advisory = await persistScenario({
    conversationId,
    message: advisoryMessage,
    partialIntent: {
      body: advisoryMessage,
      capabilityTags: ["startup", "pressure test", "agentic commerce"],
      catalogQuery: "startup pressure test agentic commerce",
      category: "business",
      confidence: 0.95,
      extractionNotes: ["deterministic smoke advisory request"],
      intentType: "demand",
      keywords: ["startup", "pressure test", "agentic commerce"],
      needsClarification: false,
      requestedOutputTypes: ["text"],
      responseInstructions: "Route to the best startup pressure-test specialist.",
      routeTarget: "general_assistance",
      routing: {
        resolutionTier: "auto",
        shouldCreateFulfillmentRequest: true,
        shouldPersistToBoard: true,
      },
      shouldSearchCatalog: true,
      summary: "Pressure test an agentic commerce idea.",
      title: "Pressure test an agentic commerce idea",
      voice: "alloy",
    },
  });

  const advisoryRecord = await client.mutation(api.chats.recordIntentPipeline, {
    assistantMessage: "Advisory route preview prepared.",
    conversationId,
    initialStatus: "open",
    intent: advisory.persistedIntent,
    ownerDisplayName: "Smoke Classification Owner",
    ownerExternalId,
    ownerHandle: "smoke_request_classifier",
    userMessage: advisoryMessage,
  });

  const advisoryDetail = await client.query(api.intents.getRequestDetail, {
    intentId: advisoryRecord.intentId,
    ownerExternalId,
  });
  const advisoryExecution = await client.query(api.intents.getExecutionContext, {
    intentId: advisoryRecord.intentId,
    ownerExternalId,
  });

  assert.equal(
    advisoryDetail.intent?.classification.routeFamily,
    "custom_work",
    "advisory requests should persist routeFamily=custom_work",
  );
  assert.equal(
    advisoryDetail.intent?.classification.executionKind,
    "async_agent",
    "advisory requests should persist executionKind=async_agent",
  );
  assert.equal(
    advisoryExecution?.classification.matchingMode,
    "catalog",
    "advisory specialist routing should persist matchingMode=catalog",
  );
  assert.deepEqual(
    advisoryExecution?.classification.candidatePool.supplyTypes,
    ["capability", "agent_tool"],
    "advisory requests should persist the specialist route candidate pool",
  );

  console.log("smoke:request-classification passed");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
