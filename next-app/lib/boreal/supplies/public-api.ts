import type { Id } from "@/convex/_generated/dataModel";

type SupplierCaller = {
  displayName: string;
  externalId: string;
  walletAddress: string;
};

type SupplyActorKind = "agent" | "human" | "tool";
type SupplyAvailability = "available" | "limited" | "unavailable";
type SupplyCheckoutProtocol = "acp" | "custom" | "ucp";
type SupplyDeliveryType = "async" | "instant" | "scheduled";
type SupplyEvidenceMode = "none" | "receipt" | "response";
type SupplyExecutionSurface =
  | "handoff"
  | "http"
  | "jsonrpc"
  | "mcp"
  | "registry"
  | "sdk"
  | "widget";
type SupplyFulfillmentKind = "digital" | "hybrid" | "physical" | "service";
type SupplyOutputType = "image_generation" | "speech_generation" | "text" | "video_generation";
type SupplyPaymentProtocol = "direct-solana" | "mpp" | "none" | "widget" | "x402";
type SupplyPriceType = "fixed" | "hourly" | "scoped";
type SupplyRoutingTier = "A-delegated" | "A-direct" | "B-ingest-handoff" | "C-manual";
type SupplyScenarioType =
  | "chat_only_fulfillment"
  | "consultation"
  | "custom_scoped_work"
  | "instant_digital_purchase"
  | "milestone_project"
  | "physical_service"
  | "provider_handoff_service"
  | "provider_paid_service"
  | "supply_publish";
type SupplySourceProviderKey =
  | "agentcash"
  | "agentic-market"
  | "frames"
  | "manual"
  | "moonpay"
  | "solana-agent-kit";
type SupplyType = "agent_tool" | "capability" | "collective" | "product";

export type PublicSupplyUpsertBody = {
  a2aEndpoint?: string | null;
  acpCheckoutUrl?: string | null;
  agentReady?: boolean;
  availabilityStatus?: SupplyAvailability;
  brand?: string | null;
  capabilityTags?: string[];
  category?: string | null;
  checkoutProtocol?: SupplyCheckoutProtocol;
  checkoutProvider?: string | null;
  currency?: string | null;
  deliveryType?: SupplyDeliveryType;
  description?: string | null;
  evidenceMode?: SupplyEvidenceMode;
  estimatedDeliveryLabel?: string | null;
  exampleIntents?: string[] | null;
  executionSurface?: SupplyExecutionSurface;
  executorUrl?: string | null;
  exclusions?: string[] | null;
  fulfillmentKind?: SupplyFulfillmentKind;
  isCartEnabled?: boolean;
  maxConcurrentJobs?: number | null;
  mcpServerUrl?: string | null;
  metadataJson?: string | null;
  nextAvailableAt?: number | null;
  offerSlug?: string | null;
  openApiUrl?: string | null;
  outputTypes?: SupplyOutputType[] | null;
  ownerActorKind?: SupplyActorKind;
  ownerDisplayName?: string | null;
  ownerHandle?: string | null;
  paymentNetworkHints?: string[] | null;
  paymentProtocol?: SupplyPaymentProtocol;
  payoutWalletAddress?: string | null;
  priceAmount?: number | null;
  priceMax?: number | null;
  priceMin?: number | null;
  priceRawJson?: string | null;
  priceType?: SupplyPriceType;
  protocolDescriptorJson?: string | null;
  requiresHumanApproval?: boolean;
  responseSlaMinutes?: number | null;
  routingTier?: SupplyRoutingTier;
  scenarioTypes?: SupplyScenarioType[] | null;
  schemaUrl?: string | null;
  sourceCapabilityId?: string | null;
  sourceListingUrl?: string | null;
  sourceProviderKey?: SupplySourceProviderKey;
  sourceProviderUrl?: string | null;
  subtitle?: string | null;
  supportsDirectInvoke?: boolean;
  supportsPrivyWallet?: boolean;
  supplyType?: SupplyType;
  title?: string | null;
  ucpCatalogUrl?: string | null;
  ucpCheckoutUrl?: string | null;
  walletAddress?: string | null;
};

export type OwnedSupplyRecord = {
  _id: Id<"supplies">;
  a2aEndpoint?: string | null;
  acpCheckoutUrl?: string | null;
  actorKind?: SupplyActorKind | null;
  agentReady?: boolean;
  availabilityStatus?: SupplyAvailability | null;
  brand?: string | null;
  capabilityTags?: string[];
  category?: string | null;
  checkoutProtocol?: SupplyCheckoutProtocol | null;
  checkoutProvider?: string | null;
  currency?: string | null;
  deliveryType?: SupplyDeliveryType | null;
  description?: string | null;
  evidenceMode?: SupplyEvidenceMode | null;
  estimatedDeliveryLabel?: string | null;
  exampleIntents?: string[];
  executionSurface?: SupplyExecutionSurface | null;
  executorUrl?: string | null;
  exclusions?: string[];
  fulfillmentKind?: SupplyFulfillmentKind | null;
  isCartEnabled?: boolean;
  maxConcurrentJobs?: number | null;
  mcpServerUrl?: string | null;
  metadataJson?: string | null;
  nextAvailableAt?: number | null;
  offerSlug?: string | null;
  openApiUrl?: string | null;
  outputTypes?: SupplyOutputType[];
  paymentNetworkHints?: string[];
  paymentProtocol?: SupplyPaymentProtocol | null;
  priceAmount?: number | null;
  priceMax?: number | null;
  priceMin?: number | null;
  priceRawJson?: string | null;
  priceType?: SupplyPriceType | null;
  protocolDescriptorJson?: string | null;
  requiresHumanApproval?: boolean;
  responseSlaMinutes?: number | null;
  routingTier?: SupplyRoutingTier | null;
  scenarioTypes?: SupplyScenarioType[];
  schemaUrl?: string | null;
  sourceCapabilityId?: string | null;
  sourceListingUrl?: string | null;
  sourceProviderKey?: SupplySourceProviderKey | null;
  sourceProviderUrl?: string | null;
  subtitle?: string | null;
  supportsDirectInvoke?: boolean;
  supportsPrivyWallet?: boolean;
  supplyType?: SupplyType | null;
  title?: string | null;
  ucpCatalogUrl?: string | null;
  ucpCheckoutUrl?: string | null;
};

export function buildPublicSupplyMutationArgs(input: {
  body: PublicSupplyUpsertBody;
  caller: SupplierCaller;
  existingSupply?: OwnedSupplyRecord | null;
}) {
  const existing = input.existingSupply ?? null;

  assertWalletOwnership(input.body, input.caller.walletAddress);

  const ownerActorKind = input.body.ownerActorKind ?? existing?.actorKind ?? "agent";
  const title = requireText(input.body.title ?? existing?.title, "title");
  const category = requireText(input.body.category ?? existing?.category, "category");
  const description = requireText(
    input.body.description ?? existing?.description,
    "description",
  );
  const deliveryType = requireEnum(
    input.body.deliveryType ?? existing?.deliveryType,
    "deliveryType",
  );
  const priceType = requireEnum(input.body.priceType ?? existing?.priceType, "priceType");
  const supplyType = requireEnum(input.body.supplyType ?? existing?.supplyType, "supplyType");
  const capabilityTags = normalizeStringArray(
    input.body.capabilityTags ?? existing?.capabilityTags ?? [],
  );

  if (capabilityTags.length === 0) {
    throw new Error("capabilityTags must include at least one value.");
  }

  const executorUrl = normalizeOptionalText(input.body.executorUrl ?? existing?.executorUrl);

  return {
    a2aEndpoint: normalizeOptionalText(input.body.a2aEndpoint ?? existing?.a2aEndpoint),
    acpCheckoutUrl: normalizeOptionalText(
      input.body.acpCheckoutUrl ?? existing?.acpCheckoutUrl,
    ),
    agentReady:
      input.body.agentReady ?? existing?.agentReady ?? ownerActorKind !== "human",
    availabilityStatus:
      input.body.availabilityStatus ?? existing?.availabilityStatus ?? "available",
    brand: normalizeOptionalText(input.body.brand ?? existing?.brand),
    capabilityTags,
    category,
    checkoutProtocol:
      input.body.checkoutProtocol ?? existing?.checkoutProtocol ?? undefined,
    checkoutProvider: normalizeOptionalText(
      input.body.checkoutProvider ?? existing?.checkoutProvider,
    ),
    currency: normalizeCurrency(input.body.currency ?? existing?.currency),
    deliveryType,
    description,
    evidenceMode: input.body.evidenceMode ?? existing?.evidenceMode ?? undefined,
    estimatedDeliveryLabel: normalizeOptionalText(
      input.body.estimatedDeliveryLabel ?? existing?.estimatedDeliveryLabel,
    ),
    exampleIntents: normalizeNullableStringArray(
      input.body.exampleIntents ?? existing?.exampleIntents,
    ),
    executionSurface:
      input.body.executionSurface ?? existing?.executionSurface ?? undefined,
    executorUrl,
    exclusions: normalizeNullableStringArray(input.body.exclusions ?? existing?.exclusions),
    fulfillmentKind:
      input.body.fulfillmentKind ?? existing?.fulfillmentKind ?? undefined,
    isCartEnabled: input.body.isCartEnabled ?? existing?.isCartEnabled ?? false,
    maxConcurrentJobs:
      normalizeOptionalNumber(input.body.maxConcurrentJobs) ??
      normalizeOptionalNumber(existing?.maxConcurrentJobs),
    mcpServerUrl: normalizeOptionalText(
      input.body.mcpServerUrl ?? existing?.mcpServerUrl,
    ),
    metadataJson: normalizeOptionalText(input.body.metadataJson ?? existing?.metadataJson),
    nextAvailableAt:
      normalizeOptionalNumber(input.body.nextAvailableAt) ??
      normalizeOptionalNumber(existing?.nextAvailableAt),
    offerSlug: normalizeOptionalText(input.body.offerSlug ?? existing?.offerSlug),
    openApiUrl: normalizeOptionalText(input.body.openApiUrl ?? existing?.openApiUrl),
    outputTypes: normalizeNullableStringArray(
      input.body.outputTypes ?? existing?.outputTypes,
    ) as SupplyOutputType[] | undefined,
    ownerActorKind,
    ownerDisplayName:
      normalizeOptionalText(input.body.ownerDisplayName) ?? input.caller.displayName,
    ownerExternalId: input.caller.externalId,
    ownerHandle: normalizeOptionalText(input.body.ownerHandle),
    paymentNetworkHints:
      normalizeNullableStringArray(
        input.body.paymentNetworkHints ?? existing?.paymentNetworkHints,
      ) ?? ["solana:devnet"],
    paymentProtocol:
      input.body.paymentProtocol ?? existing?.paymentProtocol ?? undefined,
    priceAmount:
      normalizeOptionalNumber(input.body.priceAmount) ??
      normalizeOptionalNumber(existing?.priceAmount),
    priceMax:
      normalizeOptionalNumber(input.body.priceMax) ??
      normalizeOptionalNumber(existing?.priceMax),
    priceMin:
      normalizeOptionalNumber(input.body.priceMin) ??
      normalizeOptionalNumber(existing?.priceMin),
    priceRawJson: normalizeOptionalText(input.body.priceRawJson ?? existing?.priceRawJson),
    priceType,
    protocolDescriptorJson: normalizeOptionalText(
      input.body.protocolDescriptorJson ?? existing?.protocolDescriptorJson,
    ),
    requiresHumanApproval:
      input.body.requiresHumanApproval ?? existing?.requiresHumanApproval ?? false,
    responseSlaMinutes:
      normalizeOptionalNumber(input.body.responseSlaMinutes) ??
      normalizeOptionalNumber(existing?.responseSlaMinutes),
    routingTier: input.body.routingTier ?? existing?.routingTier ?? undefined,
    scenarioTypes: normalizeNullableStringArray(
      input.body.scenarioTypes ?? existing?.scenarioTypes,
    ) as SupplyScenarioType[] | undefined,
    schemaUrl: normalizeOptionalText(input.body.schemaUrl ?? existing?.schemaUrl),
    sourceCapabilityId: normalizeOptionalText(
      input.body.sourceCapabilityId ?? existing?.sourceCapabilityId,
    ),
    sourceListingUrl: normalizeOptionalText(
      input.body.sourceListingUrl ?? existing?.sourceListingUrl,
    ),
    sourceProviderKey:
      input.body.sourceProviderKey ?? existing?.sourceProviderKey ?? "manual",
    sourceProviderUrl: normalizeOptionalText(
      input.body.sourceProviderUrl ?? existing?.sourceProviderUrl,
    ),
    subtitle: normalizeOptionalText(input.body.subtitle ?? existing?.subtitle),
    supportsDirectInvoke:
      input.body.supportsDirectInvoke ??
      existing?.supportsDirectInvoke ??
      Boolean(executorUrl),
    supportsPrivyWallet:
      input.body.supportsPrivyWallet ?? existing?.supportsPrivyWallet ?? false,
    supplyId: existing?._id,
    supplyType,
    title,
    ucpCatalogUrl: normalizeOptionalText(
      input.body.ucpCatalogUrl ?? existing?.ucpCatalogUrl,
    ),
    ucpCheckoutUrl: normalizeOptionalText(
      input.body.ucpCheckoutUrl ?? existing?.ucpCheckoutUrl,
    ),
  };
}

export function buildSupplierPayoutWalletArgs(input: SupplierCaller) {
  return {
    chainFamily: "solana" as const,
    environment: "devnet" as const,
    networkKey: "solana:devnet" as const,
    ownerDisplayName: input.displayName,
    ownerExternalId: input.externalId,
    roles: ["connected", "payout"] as Array<"connected" | "payout">,
    setAsDefaultBuyer: false,
    setAsDefaultPayout: true,
    walletAddress: input.walletAddress,
    walletProvider: "siwx" as const,
  };
}

function assertWalletOwnership(body: PublicSupplyUpsertBody, walletAddress: string) {
  const requestedWallets = [body.walletAddress, body.payoutWalletAddress]
    .map((value) => value?.trim())
    .filter(Boolean);

  for (const requested of requestedWallets) {
    if (requested !== walletAddress) {
      throw new Error(
        "walletAddress and payoutWalletAddress must match the authenticated SIWX wallet for this API.",
      );
    }
  }
}

function requireText(value: string | null | undefined, field: string) {
  const normalized = normalizeOptionalText(value);

  if (!normalized) {
    throw new Error(`${field} is required.`);
  }

  return normalized;
}

function requireEnum<T>(value: T | null | undefined, field: string) {
  if (!value) {
    throw new Error(`${field} is required.`);
  }

  return value;
}

function normalizeCurrency(value: string | null | undefined) {
  return normalizeOptionalText(value) ?? "USD";
}

function normalizeOptionalText(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function normalizeStringArray(values: Array<string | null | undefined>) {
  return Array.from(
    new Set(
      values
        .map((value) => value?.trim())
        .filter((value): value is string => Boolean(value)),
    ),
  );
}

function normalizeNullableStringArray(values?: Array<string | null | undefined> | null) {
  if (!values) {
    return undefined;
  }

  const normalized = normalizeStringArray(values);
  return normalized.length > 0 ? normalized : undefined;
}

function normalizeOptionalNumber(value: number | null | undefined) {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}
