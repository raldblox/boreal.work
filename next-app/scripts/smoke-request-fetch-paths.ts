import assert from "node:assert/strict";

import {
  filterSupplyForRequestClassification,
  resolveRequestFetchPath,
  shouldFetchRequestMatches,
  shouldUseDirectAutoRoute,
  type RequestMatchableSupply,
} from "../lib/boreal/request-matching-policy.ts";
import {
  deriveRequestClassification,
  normalizeIntentExtraction,
  type PersistedIntent,
  type RequestClassification,
  type RequestedOutputType,
} from "../lib/boreal/schemas/intent.ts";
import { buildAutoRoutePlan } from "../lib/boreal/one-request/routing.ts";

function createPersistedIntent(input: {
  message: string;
  partialIntent: Parameters<typeof normalizeIntentExtraction>[0];
  scoreKind?: RequestedOutputType;
  classification?: RequestClassification;
}): PersistedIntent {
  const normalizedIntent = normalizeIntentExtraction(
    input.partialIntent,
    input.message,
    [{ kind: input.scoreKind ?? "text", score: 0.98 }],
  );

  return {
    ...normalizedIntent,
    assistantMessageId: crypto.randomUUID(),
    classification: input.classification ?? normalizedIntent.classification,
    conversationId: crypto.randomUUID(),
    embedding: [],
    embeddingModel: "smoke-test",
    intentModel: "smoke-test",
    modalityScores: normalizedIntent.requestedOutputTypes.map((kind, index) => ({
      kind,
      score: index === 0 ? 0.98 : 0.7,
    })),
    provider: "boreal-agent",
    userMessageId: crypto.randomUUID(),
  };
}

function main() {
  const informationalClassification = deriveRequestClassification({
    intentType: "informational",
    needsClarification: false,
    requestedOutputTypes: ["text"],
    routeTarget: "catalog_lookup",
    routing: {
      resolutionTier: "fast",
      shouldCreateFulfillmentRequest: false,
      shouldPersistToBoard: false,
    },
    shouldSearchCatalog: true,
  });

  assert.equal(
    resolveRequestFetchPath(informationalClassification),
    "catalog_lookup",
    "informational catalog lookups should stay on the catalog lookup fetch path",
  );
  assert.equal(
    shouldFetchRequestMatches(informationalClassification),
    true,
    "informational catalog lookups should still fetch ranked matches",
  );
  assert.equal(
    shouldUseDirectAutoRoute(informationalClassification),
    false,
    "informational catalog lookups must not auto-route into direct execution",
  );

  const videoMessage = "Generate me a sad cat video.";
  const videoIntent = createPersistedIntent({
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

  assert.equal(
    resolveRequestFetchPath(videoIntent.classification),
    "direct_tool",
    "video requests should lock to the direct tool fetch path",
  );
  assert.equal(
    shouldUseDirectAutoRoute(videoIntent.classification),
    true,
    "direct generation requests should stay eligible for direct auto routing",
  );
  assert.ok(
    buildAutoRoutePlan({
      intent: videoIntent,
      message: videoMessage,
    }),
    "direct generation requests should still build an auto route plan",
  );

  const workerClassification = deriveRequestClassification({
    intentType: "demand",
    needsClarification: false,
    requestedOutputTypes: ["text"],
    routeTarget: "general_assistance",
    routing: {
      resolutionTier: "open",
      shouldCreateFulfillmentRequest: true,
      shouldPersistToBoard: true,
    },
    shouldSearchCatalog: true,
    workerLed: true,
  });
  const workerIntent = createPersistedIntent({
    classification: workerClassification,
    message: "I need a human operator to clean up my product catalog this week.",
    partialIntent: {
      body: "I need a human operator to clean up my product catalog this week.",
      capabilityTags: ["catalog cleanup", "operator"],
      catalogQuery: "catalog cleanup operator",
      category: "operations",
      confidence: 0.94,
      extractionNotes: ["deterministic smoke worker-market request"],
      intentType: "demand",
      keywords: ["catalog", "cleanup", "operator"],
      requestedOutputTypes: ["text"],
      responseInstructions: "Find the best async operator.",
      routeTarget: "general_assistance",
      routing: {
        resolutionTier: "open",
        shouldCreateFulfillmentRequest: true,
        shouldPersistToBoard: true,
      },
      shouldSearchCatalog: true,
      summary: "Find an async catalog cleanup operator.",
      title: "Find a catalog cleanup operator",
      voice: "alloy",
    },
  });

  assert.equal(
    resolveRequestFetchPath(workerClassification),
    "worker_market",
    "worker-led requests should route into the worker market fetch path",
  );
  assert.equal(
    shouldUseDirectAutoRoute(workerClassification),
    false,
    "worker-market requests must not auto-route into direct execution",
  );
  assert.equal(
    buildAutoRoutePlan({
      intent: workerIntent,
      message: workerIntent.body,
    }),
    null,
    "worker-market requests should stop direct auto routing",
  );

  const providerClassification: RequestClassification = {
    candidatePool: {
      actorKinds: ["agent", "tool"],
      deliveryTypes: ["instant", "async"],
      fulfillmentKinds: ["digital", "service"],
      requiresCartEnabled: false,
      requiresDirectInvoke: true,
      requiresSourceProvider: true,
      supplyTypes: ["capability", "agent_tool"],
    },
    executionKind: "direct_provider",
    matchingMode: "provider_capability",
    paymentMode: "x402_prepay",
    routeFamily: "provider_service",
  };
  const providerSupply: RequestMatchableSupply = {
    actorKind: "tool",
    deliveryType: "instant",
    fulfillmentKind: "digital",
    isCartEnabled: false,
    paymentProtocol: "x402",
    sourceProviderKey: "openai",
    supplyType: "agent_tool",
    supportsDirectInvoke: true,
  };
  const nonProviderSupply: RequestMatchableSupply = {
    actorKind: "tool",
    deliveryType: "instant",
    fulfillmentKind: "digital",
    isCartEnabled: false,
    paymentProtocol: "manual_invoice",
    supplyType: "agent_tool",
    supportsDirectInvoke: true,
  };

  assert.equal(
    resolveRequestFetchPath(providerClassification),
    "provider_x402",
    "provider-backed requests should resolve to the provider x402 fetch path",
  );
  assert.equal(
    filterSupplyForRequestClassification(providerSupply, providerClassification),
    true,
    "provider-backed x402 supply should satisfy provider classification filters",
  );
  assert.equal(
    filterSupplyForRequestClassification(nonProviderSupply, providerClassification),
    false,
    "non-provider supply should fail provider x402 filters",
  );

  const collectiveClassification: RequestClassification = {
    candidatePool: {
      actorKinds: ["human", "agent"],
      deliveryTypes: ["async", "scheduled"],
      fulfillmentKinds: ["digital", "service", "hybrid"],
      requiresCartEnabled: false,
      requiresDirectInvoke: false,
      requiresSourceProvider: false,
      supplyTypes: ["collective"],
    },
    executionKind: "async_collective",
    matchingMode: "collective_market",
    paymentMode: "quote_then_escrow",
    routeFamily: "custom_work",
  };
  const collectiveSupply: RequestMatchableSupply = {
    actorKind: "human",
    deliveryType: "async",
    fulfillmentKind: "service",
    isCartEnabled: false,
    paymentProtocol: "manual_invoice",
    supplyType: "collective",
  };
  const ordinaryToolSupply: RequestMatchableSupply = {
    actorKind: "tool",
    deliveryType: "instant",
    fulfillmentKind: "digital",
    isCartEnabled: false,
    paymentProtocol: "x402",
    supplyType: "agent_tool",
    supportsDirectInvoke: true,
  };

  assert.equal(
    resolveRequestFetchPath(collectiveClassification),
    "collective_market",
    "collective requests should stay on the collective fetch path",
  );
  assert.equal(
    filterSupplyForRequestClassification(collectiveSupply, collectiveClassification),
    true,
    "collective supplies should satisfy collective-market filters",
  );
  assert.equal(
    filterSupplyForRequestClassification(ordinaryToolSupply, collectiveClassification),
    false,
    "ordinary tool supplies should fail collective-market filters",
  );

  console.log("smoke:request-fetch-paths passed");
}

main();
