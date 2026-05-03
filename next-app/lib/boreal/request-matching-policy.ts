import type { IntentExtraction, RequestClassification } from "./schemas/intent.ts";

type SupplyActorKind = "human" | "agent" | "tool";
type SupplyDeliveryType = "instant" | "async" | "scheduled";
type SupplyFulfillmentKind = "digital" | "service" | "hybrid" | "physical";
type SupplyType = "product" | "capability" | "agent_tool" | "collective";
export type RequestFetchPath =
  | "none"
  | "catalog_lookup"
  | "direct_tool"
  | "product_catalog"
  | "provider_x402"
  | "worker_market"
  | "collective_market";

export type RequestMatchableSupply = {
  actorKind: SupplyActorKind;
  deliveryType: SupplyDeliveryType;
  fulfillmentKind: SupplyFulfillmentKind;
  isCartEnabled: boolean;
  paymentProtocol?: string;
  sourceProviderKey?: string;
  supplyType: SupplyType;
  supportsDirectInvoke?: boolean;
};

type QualifiedRequestRoutingIntent = Pick<
  IntentExtraction,
  | "classification"
  | "confidence"
  | "intentType"
  | "needsClarification"
  | "requestedOutputTypes"
  | "routeTarget"
  | "routing"
>;

const LOW_CONFIDENCE_SPECIALIST_ROUTE_THRESHOLD = 0.74;

function customWorkVisibleCandidatePool() {
  return {
    actorKinds: ["human", "agent", "tool"] as SupplyActorKind[],
    deliveryTypes: ["async", "scheduled"] as SupplyDeliveryType[],
    fulfillmentKinds: ["digital", "service", "hybrid"] as SupplyFulfillmentKind[],
    requiresCartEnabled: null,
    requiresDirectInvoke: null,
    requiresSourceProvider: false,
    supplyTypes: ["capability", "agent_tool", "collective"] as SupplyType[],
  };
}

function workerMarketCandidatePool() {
  return {
    actorKinds: ["human", "agent"] as SupplyActorKind[],
    deliveryTypes: ["async", "scheduled"] as SupplyDeliveryType[],
    fulfillmentKinds: ["digital", "service", "hybrid"] as SupplyFulfillmentKind[],
    requiresCartEnabled: null,
    requiresDirectInvoke: false,
    requiresSourceProvider: false,
    supplyTypes: ["capability", "agent_tool", "collective"] as SupplyType[],
  };
}

export function resolveMatchSurfaceClassification(input: {
  classification?: RequestClassification | null;
  requestStatus?: string | null;
}) {
  const classification = input.classification;

  if (!classification) {
    return null;
  }

  if (classification.routeFamily !== "custom_work") {
    return classification;
  }

  if (input.requestStatus === "open") {
    return {
      ...classification,
      matchingMode: "worker_market" as const,
      candidatePool: workerMarketCandidatePool(),
    };
  }

  if (classification.executionKind === "async_agent") {
    return {
      ...classification,
      candidatePool: customWorkVisibleCandidatePool(),
    };
  }

  return classification;
}

export function shouldPreferWorkerMarketForQualifiedRequest(input: {
  hasSpecialistRoute: boolean;
  intent: QualifiedRequestRoutingIntent;
}) {
  const { hasSpecialistRoute, intent } = input;

  if (
    intent.intentType !== "demand" ||
    intent.needsClarification ||
    intent.routeTarget === "clarification" ||
    !intent.routing.shouldCreateFulfillmentRequest ||
    intent.classification.routeFamily !== "custom_work"
  ) {
    return false;
  }

  if (
    intent.routeTarget === "profile_update" ||
    intent.routeTarget === "catalog_lookup" ||
    intent.requestedOutputTypes.some((type) => type !== "text")
  ) {
    return false;
  }

  if (intent.classification.matchingMode === "worker_market") {
    return true;
  }

  if (!hasSpecialistRoute) {
    return true;
  }

  return intent.confidence < LOW_CONFIDENCE_SPECIALIST_ROUTE_THRESHOLD;
}

export function resolveRequestFetchPath(
  classification?: RequestClassification | null,
): RequestFetchPath {
  if (!classification) {
    return "catalog_lookup";
  }

  if (classification.matchingMode === "none") {
    return "none";
  }

  if (
    classification.matchingMode === "collective_market" ||
    isCollectiveOnlyPool(classification)
  ) {
    return "collective_market";
  }

  if (
    classification.matchingMode === "worker_market" ||
    looksLikeWorkerMarket(classification)
  ) {
    return "worker_market";
  }

  if (
    classification.routeFamily === "provider_service" ||
    classification.executionKind === "direct_provider" ||
    classification.candidatePool.requiresSourceProvider
  ) {
    return "provider_x402";
  }

  if (
    classification.routeFamily === "product_purchase" ||
    classification.executionKind === "instant_download" ||
    classification.paymentMode === "catalog_checkout" ||
    classification.candidatePool.requiresCartEnabled === true ||
    isProductOnlyPool(classification)
  ) {
    return "product_catalog";
  }

  if (classification.executionKind === "none") {
    return "catalog_lookup";
  }

  return "direct_tool";
}

export function shouldFetchRequestMatches(
  classification?: RequestClassification | null,
) {
  return resolveRequestFetchPath(classification) !== "none";
}

export function shouldUseDirectAutoRoute(
  classification?: RequestClassification | null,
) {
  return resolveRequestFetchPath(classification) === "direct_tool";
}

export function filterSupplyForRequestClassification(
  supply: RequestMatchableSupply,
  classification?: RequestClassification | null,
) {
  const fetchPath = resolveRequestFetchPath(classification);

  if (fetchPath === "none" || !classification) {
    return false;
  }

  const candidatePool = classification.candidatePool;

  if (!matchesAllowed(candidatePool.actorKinds, supply.actorKind)) {
    return false;
  }

  if (!matchesAllowed(candidatePool.deliveryTypes, supply.deliveryType)) {
    return false;
  }

  if (!matchesAllowed(candidatePool.fulfillmentKinds, supply.fulfillmentKind)) {
    return false;
  }

  if (!matchesAllowed(candidatePool.supplyTypes, supply.supplyType)) {
    return false;
  }

  if (candidatePool.requiresCartEnabled === true && !supply.isCartEnabled) {
    return false;
  }

  if (candidatePool.requiresCartEnabled === false && supply.isCartEnabled) {
    return false;
  }

  if (
    candidatePool.requiresDirectInvoke === true &&
    supply.supportsDirectInvoke === false
  ) {
    return false;
  }

  if (
    candidatePool.requiresDirectInvoke === false &&
    supply.supportsDirectInvoke === true
  ) {
    return false;
  }

  if (
    candidatePool.requiresSourceProvider &&
    (!supply.sourceProviderKey || supply.sourceProviderKey.trim().length === 0)
  ) {
    return false;
  }

  switch (fetchPath) {
    case "product_catalog":
      return supply.supplyType === "product" && supply.isCartEnabled;
    case "provider_x402":
      return Boolean(supply.sourceProviderKey) && supply.paymentProtocol === "x402";
    case "collective_market":
      return supply.supplyType === "collective";
    default:
      return true;
  }
}

function isCollectiveOnlyPool(classification: RequestClassification) {
  return (
    classification.candidatePool.supplyTypes.length === 1 &&
    classification.candidatePool.supplyTypes[0] === "collective"
  );
}

function isProductOnlyPool(classification: RequestClassification) {
  return (
    classification.candidatePool.supplyTypes.length === 1 &&
    classification.candidatePool.supplyTypes[0] === "product"
  );
}

function looksLikeWorkerMarket(classification: RequestClassification) {
  return (
    classification.executionKind !== "none" &&
    classification.candidatePool.actorKinds.includes("human") &&
    classification.candidatePool.requiresDirectInvoke === false
  );
}

function matchesAllowed<T extends string>(allowed: T[], value: T) {
  return allowed.length === 0 || allowed.includes(value);
}
