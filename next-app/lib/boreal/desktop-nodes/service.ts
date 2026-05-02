import { randomUUID } from "node:crypto";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { createConvexServerClient } from "@/lib/boreal/integrations/convex/server-client";
import type { OwnedSupplyRecord, PublicSupplyUpsertBody } from "@/lib/boreal/supplies/public-api";
import { buildPublicSupplyMutationArgs } from "@/lib/boreal/supplies/public-api";

import {
  buildDesktopCapabilityTags,
  buildDesktopNodeAssignment,
  buildDesktopNodeEnvelope,
  DESKTOP_NODE_OFFER_SLUG,
  DESKTOP_NODE_SOURCE_CAPABILITY_ID,
  DESKTOP_NODE_TITLE,
  isDesktopNodeSupplyRecord,
  mergeDesktopNodeMetadata,
  parseDesktopNodeMetadata,
  toDesktopConnectorHealthStatus,
  toDesktopSupplyAvailabilityStatus,
  type DesktopNodeAssignmentInput,
  type DesktopNodeAssignmentPatchBody,
  type DesktopNodeEnvelope,
  type DesktopNodeHeartbeatBody,
  type DesktopNodeMetadata,
  type DesktopNodeSupplyShape,
  type DesktopNodeUpsertBody,
} from "./contracts";

type Caller = {
  displayName: string;
  externalId: string;
  walletAddress?: string | null;
};

type OwnedDesktopSupplyRecord = OwnedSupplyRecord &
  DesktopNodeSupplyShape & {
    status?: string | null;
  };

type OwnedDesktopNodeEntry = {
  seller: unknown;
  supply: OwnedDesktopSupplyRecord;
};

export async function getDesktopNodeByCaller(caller: Caller) {
  const entry = await findOwnedDesktopNode(await resolveDesktopOwnerExternalId(caller));
  return entry ? buildDesktopNodeEnvelope(entry.supply) : null;
}

export async function getDesktopNodeByOwnerExternalId(ownerExternalId: string) {
  const entry = await findOwnedDesktopNode(ownerExternalId);
  return entry ? buildDesktopNodeEnvelope(entry.supply) : null;
}

export async function registerDesktopNode(input: {
  body: DesktopNodeUpsertBody;
  caller: Caller;
}) {
  const ownerExternalId = await resolveDesktopOwnerExternalId(input.caller);
  const existing = await findOwnedDesktopNode(ownerExternalId);
  const metadata = mergeDesktopNodeMetadata(
    parseDesktopNodeMetadata(existing?.supply.metadataJson),
    {
      appVersion: input.body.appVersion,
      availabilityStatus: input.body.availabilityStatus,
      capacityPolicy: {
        maxConcurrentAssignments: input.body.maxConcurrentAssignments,
        maxQueueDepth: input.body.maxQueueDepth,
      },
      healthStatus: input.body.healthStatus,
      lastHeartbeatAt: new Date().toISOString(),
      localMachineCapabilities: input.body.localMachineCapabilities,
      machineLabel: input.body.machineLabel,
      platform: input.body.platform,
      runtimeFamilies: input.body.runtimeFamilies,
      stableNodeId: input.body.stableNodeId,
    },
  );

  return upsertOwnedDesktopNode({
    caller: {
      ...input.caller,
      externalId: ownerExternalId,
    },
    existingSupply: existing?.supply ?? null,
    metadata,
  });
}

export async function heartbeatDesktopNode(input: {
  body: DesktopNodeHeartbeatBody;
  caller: Caller;
}) {
  const ownerExternalId = await resolveDesktopOwnerExternalId(input.caller);
  const existing = await requireOwnedDesktopNode(ownerExternalId);
  const metadata = mergeDesktopNodeMetadata(
    parseDesktopNodeMetadata(existing.supply.metadataJson),
    {
      appVersion: input.body.appVersion,
      availabilityStatus: input.body.availabilityStatus,
      capacityPolicy: {
        maxConcurrentAssignments: input.body.maxConcurrentAssignments,
        maxQueueDepth: input.body.maxQueueDepth,
      },
      healthStatus: input.body.healthStatus,
      lastHeartbeatAt: new Date().toISOString(),
      localMachineCapabilities: input.body.localMachineCapabilities,
      machineLabel: input.body.machineLabel,
      platform: input.body.platform,
      runtimeFamilies: input.body.runtimeFamilies,
      stableNodeId: input.body.stableNodeId,
    },
  );

  return upsertOwnedDesktopNode({
    caller: {
      ...input.caller,
      externalId: ownerExternalId,
    },
    existingSupply: existing.supply,
    metadata,
  });
}

export async function listDesktopAssignments(caller: Caller) {
  return requireDesktopNodeEnvelope(await resolveDesktopOwnerExternalId(caller));
}

export async function createDesktopAssignment(input: {
  body: DesktopNodeAssignmentInput;
  caller: Caller;
}) {
  const ownerExternalId = await resolveDesktopOwnerExternalId(input.caller);
  const existing = await requireOwnedDesktopNode(ownerExternalId);
  const currentMetadata = parseDesktopNodeMetadata(existing.supply.metadataJson);

  if (!currentMetadata) {
    throw new Error("Desktop node metadata is missing.");
  }

  if (input.body.requestCallbacksEnabled) {
    await ensureRequestOwnedByCaller({
      ownerExternalId,
      requestToken: input.body.requestToken ?? "",
    });
  }

  const assignment = buildDesktopNodeAssignment({
    ...input.body,
    id: randomUUID(),
  });
  const metadata = mergeDesktopNodeMetadata(currentMetadata, {
    assignments: [assignment, ...currentMetadata.assignments],
    lastHeartbeatAt: currentMetadata.lastHeartbeatAt ?? new Date().toISOString(),
  });

  return upsertOwnedDesktopNode({
    caller: {
      ...input.caller,
      externalId: ownerExternalId,
    },
    existingSupply: existing.supply,
    metadata,
  });
}

export async function queueDesktopAssignmentForOwner(input: {
  assignment: DesktopNodeAssignmentInput;
  ownerExternalId: string;
}) {
  const existing = await requireOwnedDesktopNode(input.ownerExternalId);
  const currentMetadata = parseDesktopNodeMetadata(existing.supply.metadataJson);

  if (!currentMetadata) {
    throw new Error("Desktop node metadata is missing.");
  }

  if (input.assignment.requestCallbacksEnabled) {
    await ensureRequestOwnedByCaller({
      ownerExternalId: input.ownerExternalId,
      requestToken: input.assignment.requestToken ?? "",
    });
  }

  const currentAssignment =
    typeof input.assignment.requestToken === "string" &&
    input.assignment.requestToken.trim().length > 0
      ? findReusableAssignment(currentMetadata.assignments, input.assignment.requestToken)
      : null;

  if (currentAssignment) {
    const refreshedAssignment = {
      ...currentAssignment,
      acceptByAt: buildDesktopNodeAssignment({
        ...input.assignment,
        id: currentAssignment.id,
      }).acceptByAt,
      outputKinds:
        input.assignment.outputKinds && input.assignment.outputKinds.length > 0
          ? [...input.assignment.outputKinds]
          : currentAssignment.outputKinds,
      requestCallbacksEnabled:
        typeof input.assignment.requestCallbacksEnabled === "boolean"
          ? input.assignment.requestCallbacksEnabled
          : currentAssignment.requestCallbacksEnabled,
      requiredCapabilities:
        input.assignment.requiredCapabilities &&
        input.assignment.requiredCapabilities.length > 0
          ? [...input.assignment.requiredCapabilities]
          : currentAssignment.requiredCapabilities,
      runtimeFamily: input.assignment.runtimeFamily,
      summary: input.assignment.summary.trim(),
      title: input.assignment.title.trim(),
      updatedAt: new Date().toISOString(),
      workspaceHint: input.assignment.workspaceHint?.trim() || null,
    };
    const nextAssignments = currentMetadata.assignments.map((assignment) =>
      assignment.id === currentAssignment.id ? refreshedAssignment : assignment,
    );
    const metadata = mergeDesktopNodeMetadata(currentMetadata, {
      assignments: nextAssignments,
      lastHeartbeatAt: currentMetadata.lastHeartbeatAt ?? new Date().toISOString(),
    });
    const envelope = await upsertOwnedDesktopNode({
      caller: {
        displayName: "Boreal Desktop",
        externalId: input.ownerExternalId,
        walletAddress: null,
      },
      existingSupply: existing.supply,
      metadata,
    });

    return {
      assignment: refreshedAssignment,
      created: false,
      envelope,
    };
  }

  const assignment = buildDesktopNodeAssignment({
    ...input.assignment,
    id: randomUUID(),
  });
  const metadata = mergeDesktopNodeMetadata(currentMetadata, {
    assignments: [assignment, ...currentMetadata.assignments],
    lastHeartbeatAt: currentMetadata.lastHeartbeatAt ?? new Date().toISOString(),
  });
  const envelope = await upsertOwnedDesktopNode({
    caller: {
      displayName: "Boreal Desktop",
      externalId: input.ownerExternalId,
      walletAddress: null,
    },
    existingSupply: existing.supply,
    metadata,
  });

  return {
    assignment,
    created: true,
    envelope,
  };
}

export async function acceptDesktopAssignment(input: {
  assignmentId: string;
  caller: Caller;
}) {
  return updateDesktopAssignment(input.caller, input.assignmentId, (assignment) => ({
    ...assignment,
    lastError: null,
    status: "accepted_by_desktop",
    updatedAt: new Date().toISOString(),
  }));
}

export async function rejectDesktopAssignment(input: {
  assignmentId: string;
  caller: Caller;
}) {
  return updateDesktopAssignment(input.caller, input.assignmentId, (assignment) => ({
    ...assignment,
    lastError: null,
    status: "rejected_by_desktop",
    updatedAt: new Date().toISOString(),
  }));
}

export async function patchDesktopAssignment(input: {
  assignmentId: string;
  body: DesktopNodeAssignmentPatchBody;
  caller: Caller;
}) {
  return updateDesktopAssignment(input.caller, input.assignmentId, (assignment) => ({
    ...assignment,
    evidenceCount:
      typeof input.body.evidenceCount === "number"
        ? Math.max(0, Math.round(input.body.evidenceCount))
        : assignment.evidenceCount,
    lastError:
      typeof input.body.lastError === "string" || input.body.lastError === null
        ? input.body.lastError
        : assignment.lastError,
    status: input.body.status,
    updatedAt: new Date().toISOString(),
  }));
}

export async function deleteDesktopAssignment(input: {
  assignmentId: string;
  caller: Caller;
}) {
  const ownerExternalId = await resolveDesktopOwnerExternalId(input.caller);
  const existing = await requireOwnedDesktopNode(ownerExternalId);
  const metadata = parseDesktopNodeMetadata(existing.supply.metadataJson);

  if (!metadata) {
    throw new Error("Desktop node metadata is missing.");
  }

  const nextAssignments = metadata.assignments.filter(
    (assignment) => assignment.id !== input.assignmentId,
  );

  if (nextAssignments.length === metadata.assignments.length) {
    throw new Error("Desktop assignment not found.");
  }

  return upsertOwnedDesktopNode({
    caller: {
      ...input.caller,
      externalId: ownerExternalId,
    },
    existingSupply: existing.supply,
    metadata: mergeDesktopNodeMetadata(metadata, {
      assignments: nextAssignments,
      lastHeartbeatAt: new Date().toISOString(),
    }),
  });
}

async function updateDesktopAssignment(
  caller: Caller,
  assignmentId: string,
  updater: (
    assignment: NonNullable<DesktopNodeMetadata["assignments"][number]>,
  ) => NonNullable<DesktopNodeMetadata["assignments"][number]>,
) {
  const ownerExternalId = await resolveDesktopOwnerExternalId(caller);
  const existing = await requireOwnedDesktopNode(ownerExternalId);
  const metadata = parseDesktopNodeMetadata(existing.supply.metadataJson);

  if (!metadata) {
    throw new Error("Desktop node metadata is missing.");
  }

  const index = metadata.assignments.findIndex((assignment) => assignment.id === assignmentId);

  if (index < 0) {
    throw new Error("Desktop assignment not found.");
  }

  const nextAssignments = [...metadata.assignments];
  nextAssignments[index] = updater(nextAssignments[index]);

  return upsertOwnedDesktopNode({
    caller: {
      ...caller,
      externalId: ownerExternalId,
    },
    existingSupply: existing.supply,
    metadata: mergeDesktopNodeMetadata(metadata, {
      assignments: nextAssignments,
      lastHeartbeatAt: new Date().toISOString(),
    }),
  });
}

async function ensureRequestOwnedByCaller(input: {
  ownerExternalId: string;
  requestToken: string;
}) {
  const requestToken = input.requestToken.trim();

  if (!requestToken) {
    throw new Error("requestToken is required when request callbacks are enabled.");
  }

  const convex = createConvexServerClient();
  const session = await convex.query(api.requestApi.getRequestSession, {
    ownerExternalId: input.ownerExternalId,
    requestToken,
  });

  if (!session) {
    throw new Error("Request not found for this Boreal owner.");
  }
}

async function findOwnedDesktopNode(ownerExternalId: string) {
  const convex = createConvexServerClient();
  const owned = (await convex.query(api.supplies.listOwnedSupplies, {
    ownerExternalId,
  })) as OwnedDesktopNodeEntry[];

  return (
    owned.find((entry) => {
      return isDesktopNodeSupplyRecord({
        executionSurface: entry.supply.executionSurface,
        metadataJson: entry.supply.metadataJson,
        offerSlug: entry.supply.offerSlug ?? null,
        sourceCapabilityId: entry.supply.sourceCapabilityId ?? null,
      });
    }) ?? null
  );
}

async function requireOwnedDesktopNode(ownerExternalId: string) {
  const entry = await findOwnedDesktopNode(ownerExternalId);

  if (!entry) {
    throw new Error("Desktop node is not registered for this Boreal owner.");
  }

  return entry;
}

async function requireDesktopNodeEnvelope(ownerExternalId: string) {
  const entry = await requireOwnedDesktopNode(ownerExternalId);
  return buildDesktopNodeEnvelope(entry.supply);
}

async function resolveDesktopOwnerExternalId(caller: Caller) {
  const walletAddress = caller.walletAddress?.trim() ?? "";

  if (!walletAddress) {
    return caller.externalId;
  }

  const convex = createConvexServerClient();
  const resolvedOwnerExternalId = await convex.query(
    api.wallets.getOwnerExternalIdByWalletAddress,
    {
      walletAddress,
    },
  );

  return resolvedOwnerExternalId ?? caller.externalId;
}

function findReusableAssignment(
  assignments: DesktopNodeMetadata["assignments"],
  requestToken: string,
) {
  return assignments.find(
    (assignment) =>
      assignment.requestToken === requestToken &&
      assignment.status !== "delivered_by_desktop" &&
      assignment.status !== "expired" &&
      assignment.status !== "failed_on_desktop" &&
      assignment.status !== "rejected_by_desktop",
  ) ?? null;
}

async function upsertOwnedDesktopNode(input: {
  caller: Caller;
  existingSupply: OwnedDesktopSupplyRecord | null;
  metadata: DesktopNodeMetadata;
}) {
  const convex = createConvexServerClient();
  const body = buildDesktopSupplyBody({
    existingSupply: input.existingSupply,
    metadata: input.metadata,
  });
  const mutationArgs = buildPublicSupplyMutationArgs({
    body,
    caller: {
      ...input.caller,
      walletAddress: input.caller.walletAddress ?? "",
    },
    existingSupply: input.existingSupply,
  });
  const result = await convex.mutation(api.supplies.createSupplyEntry, mutationArgs);

  if (!result.created || !result.supplyId) {
    throw new Error(result.reason ?? "Unable to upsert the Boreal desktop node.");
  }

  const supply = (await convex.query(api.supplies.getOwnedSupply, {
    ownerExternalId: input.caller.externalId,
    supplyId: result.supplyId as Id<"supplies">,
  })) as OwnedDesktopNodeEntry | null;

  if (!supply) {
    throw new Error("Desktop node was saved but could not be reloaded.");
  }

  return buildDesktopNodeEnvelope(supply.supply);
}

function buildDesktopSupplyBody(input: {
  existingSupply: OwnedDesktopSupplyRecord | null;
  metadata: DesktopNodeMetadata;
}) {
  const capabilityTags = buildDesktopCapabilityTags(input.metadata);

  return {
    agentReady: true,
    availabilityStatus: toDesktopSupplyAvailabilityStatus(
      input.metadata.availabilityStatus,
    ),
    brand: "Boreal",
    capabilityTags,
    category: "desktop execution node",
    connectorHealthStatus: toDesktopConnectorHealthStatus(
      input.metadata.healthStatus,
      input.metadata.availabilityStatus,
    ),
    connectorLastHeartbeatAt: Date.now(),
    deliveryType: "async",
    description:
      "Owner-only Boreal Desktop execution node for local Codex and QVAC work, assignment lifecycle control, and request-thread delivery callbacks.",
    exampleIntents: [
      "Run a private Codex repo task on my desktop machine",
      "Transcribe or OCR local files through my private QVAC runtime",
      "Accept a routed Boreal request and deliver the result from my own machine",
    ],
    executionSurface: "desktop",
    fulfillmentKind: "service",
    isCartEnabled: false,
    maxConcurrentJobs: input.metadata.capacityPolicy.maxConcurrentAssignments,
    metadataJson: JSON.stringify(input.metadata),
    offerSlug: DESKTOP_NODE_OFFER_SLUG,
    outputTypes: ["text"],
    ownerActorKind: "tool",
    paymentProtocol: "none",
    priceAmount: 0,
    priceType: "fixed",
    requiresHumanApproval: true,
    responseSlaMinutes: 60,
    scenarioTypes: ["custom_scoped_work"],
    sourceCapabilityId: DESKTOP_NODE_SOURCE_CAPABILITY_ID,
    sourceProviderKey: "manual",
    subtitle: `${input.metadata.machineLabel} private desktop node`,
    supportsDirectInvoke: false,
    supportsEvidencePush: true,
    supportsPrivyWallet: false,
    supportsStatusUpdates: true,
    supplyType: "capability",
    title: DESKTOP_NODE_TITLE,
  } satisfies PublicSupplyUpsertBody;
}
