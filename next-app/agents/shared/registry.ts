import type {
  AgentDirectExecutionSpec,
  AutonomousAgentDefinition,
} from "./types.ts";

export function buildDirectExecutionProtocolDescriptor(
  agent: AutonomousAgentDefinition,
  spec: AgentDirectExecutionSpec,
) {
  return {
    auth: spec.auth,
    description: spec.description,
    fields: spec.fields,
    key: agent.key,
    outputKinds: spec.outputKinds,
    owner: {
      actorKind: agent.identity.actorKind,
      displayName: agent.identity.displayName,
      externalId: agent.identity.externalId,
      handle: agent.identity.handle,
    },
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
          description: spec.description,
          exampleRequest: spec.exampleRequest,
          fields: spec.fields,
          outputKinds: spec.outputKinds,
          routePath: spec.routePath,
          version: spec.version,
        }
      : null,
    displayName: agent.identity.displayName,
    externalId: agent.identity.externalId,
    handle: agent.identity.handle,
    headline: agent.profile.headline,
    key: agent.key,
    productLabels: agent.profile.productLabels,
    skillTags: agent.profile.skillTags,
    supply: {
      deliveryType: agent.supplyEntry.deliveryType,
      description: agent.supplyEntry.description,
      priceAmount: agent.supplyEntry.priceAmount,
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
