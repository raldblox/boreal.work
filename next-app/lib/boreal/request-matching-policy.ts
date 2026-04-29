import type { RequestClassification } from "./schemas/intent.ts";

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
