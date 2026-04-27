import type {
  AgentDirectExecutionSpec,
  AutonomousAgentDefinition,
} from "./types.ts";

const REQUEST_FIRST_ROUTE_PATH = "/api/v1/requests";

function getCanonicalDirectExecutionRoutePath(agentKey: string) {
  return `/api/v1/agents/${agentKey}/execute`;
}

function buildFieldSchema(field: AgentDirectExecutionSpec["fields"][number]) {
  switch (field.type) {
    case "boolean":
      return { type: "boolean" } as const;
    case "number":
      return { type: "number" } as const;
    case "object":
      return {
        additionalProperties: true,
        type: "object",
      } as const;
    case "string":
    default:
      return { type: "string" } as const;
  }
}

function buildInputSchema(spec: AgentDirectExecutionSpec) {
  return {
    additionalProperties: true,
    properties: Object.fromEntries(
      spec.fields.map((field) => [
        field.name,
        {
          ...buildFieldSchema(field),
          description: field.description,
        },
      ]),
    ),
    required: spec.fields.filter((field) => field.required).map((field) => field.name),
    type: "object",
  };
}

function buildOutputVariantSchema(kind: AgentDirectExecutionSpec["outputKinds"][number]) {
  switch (kind) {
    case "image_generation":
      return {
        additionalProperties: false,
        properties: {
          base64: { type: "string" },
          kind: { const: "image_generation", type: "string" },
          mediaType: { type: "string" },
          prompt: { type: "string" },
          title: { type: "string" },
        },
        required: ["base64", "kind", "mediaType", "prompt", "title"],
        type: "object",
      };
    case "speech_generation":
      return {
        additionalProperties: false,
        properties: {
          base64: { type: "string" },
          format: { type: "string" },
          kind: { const: "speech_generation", type: "string" },
          mediaType: { type: "string" },
          title: { type: "string" },
          transcript: { type: "string" },
          voice: { type: "string" },
        },
        required: [
          "base64",
          "format",
          "kind",
          "mediaType",
          "title",
          "transcript",
          "voice",
        ],
        type: "object",
      };
    case "video_generation":
      return {
        additionalProperties: false,
        properties: {
          jobId: { type: "string" },
          kind: { const: "video_generation", type: "string" },
          model: { type: "string" },
          progress: { type: "number" },
          prompt: { type: "string" },
          seconds: { type: "string" },
          size: { type: "string" },
          status: {
            enum: ["completed", "failed", "in_progress", "queued"],
            type: "string",
          },
          title: { type: "string" },
        },
        required: [
          "jobId",
          "kind",
          "model",
          "progress",
          "prompt",
          "seconds",
          "size",
          "status",
          "title",
        ],
        type: "object",
      };
    case "text":
    default:
      return {
        additionalProperties: false,
        properties: {
          content: { type: "string" },
          contentType: { const: "text/markdown", type: "string" },
          kind: { const: "text", type: "string" },
          title: { type: "string" },
        },
        required: ["content", "contentType", "kind", "title"],
        type: "object",
      };
  }
}

function buildOutputSchema(spec: AgentDirectExecutionSpec) {
  return {
    oneOf: spec.outputKinds.map((kind) => buildOutputVariantSchema(kind)),
  };
}

function buildPriceLabel(amount: number, priceType: string) {
  return `$${amount.toFixed(2)} ${priceType}`;
}

export function buildDirectExecutionProtocolDescriptor(
  agent: AutonomousAgentDefinition,
  spec: AgentDirectExecutionSpec,
) {
  return {
    auth: spec.auth,
    canonicalRoutePath: getCanonicalDirectExecutionRoutePath(agent.key),
    description: spec.description,
    fields: spec.fields,
    inputSchema: buildInputSchema(spec),
    key: agent.key,
    outputSchema: buildOutputSchema(spec),
    outputKinds: spec.outputKinds,
    owner: {
      actorKind: agent.identity.actorKind,
      displayName: agent.identity.displayName,
      externalId: agent.identity.externalId,
      handle: agent.identity.handle,
    },
    payment: agent.settlement
      ? {
          autoQuoteUsd: agent.settlement.autoQuoteUsd,
          chainFamily: agent.settlement.chainFamily,
          environment: agent.settlement.environment,
          networkKey: agent.settlement.networkKey,
          payerSources: agent.settlement.payerSources,
          payoutAddress: agent.settlement.payoutAddress,
          walletAddress: agent.settlement.walletAddress,
        }
      : null,
    pricing: {
      amount: agent.supplyEntry.priceAmount,
      currency: "USD",
      label: buildPriceLabel(agent.supplyEntry.priceAmount, agent.supplyEntry.priceType),
      priceType: agent.supplyEntry.priceType,
      requestFirstRoutePath: REQUEST_FIRST_ROUTE_PATH,
    },
    requestRoutePath: REQUEST_FIRST_ROUTE_PATH,
    routePath: spec.routePath,
    title: agent.supplyEntry.title,
    version: spec.version,
  };
}

export function buildRegistryListing(agent: AutonomousAgentDefinition) {
  const spec = agent.directExecution;

  return {
    availabilityStatus: agent.profile.availabilityStatus,
    capabilityTags: agent.profile.capabilityTags,
    category: agent.supplyEntry.category,
    description: agent.profile.bio,
    directExecution: spec
      ? {
          auth: spec.auth,
          canonicalRoutePath: getCanonicalDirectExecutionRoutePath(agent.key),
          description: spec.description,
          exampleRequest: spec.exampleRequest,
          fields: spec.fields,
          inputSchema: buildInputSchema(spec),
          outputSchema: buildOutputSchema(spec),
          outputKinds: spec.outputKinds,
          requestRoutePath: REQUEST_FIRST_ROUTE_PATH,
          routePath: spec.routePath,
          version: spec.version,
        }
      : null,
    displayName: agent.identity.displayName,
    externalId: agent.identity.externalId,
    handle: agent.identity.handle,
    headline: agent.profile.headline,
    key: agent.key,
    payment: agent.settlement
      ? {
          autoQuoteUsd: agent.settlement.autoQuoteUsd,
          chainFamily: agent.settlement.chainFamily,
          environment: agent.settlement.environment,
          networkKey: agent.settlement.networkKey,
          payerSources: agent.settlement.payerSources,
          payoutAddress: agent.settlement.payoutAddress,
          walletAddress: agent.settlement.walletAddress,
        }
      : null,
    productLabels: agent.profile.productLabels,
    skillTags: agent.profile.skillTags,
    supply: {
      currency: "USD",
      deliveryType: agent.supplyEntry.deliveryType,
      description: agent.supplyEntry.description,
      priceAmount: agent.supplyEntry.priceAmount,
      priceLabel: buildPriceLabel(agent.supplyEntry.priceAmount, agent.supplyEntry.priceType),
      priceType: agent.supplyEntry.priceType,
      supplyType: agent.supplyEntry.supplyType,
      title: agent.supplyEntry.title,
    },
  };
}

export function validateDirectExecutionPayload(
  agent: AutonomousAgentDefinition,
  payload: Record<string, unknown>,
) {
  const spec = agent.directExecution;

  if (!spec) {
    throw new Error(`Agent "${agent.key}" does not expose direct execution.`);
  }

  for (const field of spec.fields) {
    if (!field.required) {
      continue;
    }

    const value = payload[field.name];

    if (
      value === undefined ||
      value === null ||
      (field.type === "string" && String(value).trim().length === 0)
    ) {
      throw new Error(`${field.name} is required for ${agent.key}.`);
    }
  }
}
