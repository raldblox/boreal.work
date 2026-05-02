import type { Id } from "../../../convex/_generated/dataModel";

export const DESKTOP_NODE_API_VERSION = "boreal-desktop-node/v1";
export const DESKTOP_NODE_OFFER_SLUG = "boreal-desktop-node";
export const DESKTOP_NODE_SOURCE_CAPABILITY_ID = "boreal.desktop.node";
export const DESKTOP_NODE_TITLE = "Boreal Desktop";

const DESKTOP_RUNTIME_FAMILIES = ["codex", "qvac"] as const;
const DESKTOP_AVAILABILITY_STATUSES = [
  "available",
  "paused",
  "draining",
  "offline",
] as const;
const DESKTOP_HEALTH_STATUSES = [
  "active",
  "busy",
  "degraded",
  "idle",
  "offline",
] as const;
const DESKTOP_ASSIGNMENT_STATUSES = [
  "queued_for_desktop",
  "accepted_by_desktop",
  "executing_on_desktop",
  "waiting_for_owner_input",
  "delivered_by_desktop",
  "failed_on_desktop",
  "rejected_by_desktop",
  "expired",
] as const;
const DESKTOP_CAPABILITY_KEYS = [
  "shell",
  "filesystem_read",
  "filesystem_write",
  "git_read",
  "git_write",
  "browser_automation",
  "network_egress",
  "long_running_tasks",
] as const;

export type DesktopNodeRuntimeFamily = (typeof DESKTOP_RUNTIME_FAMILIES)[number];
export type DesktopNodeAvailabilityStatus =
  (typeof DESKTOP_AVAILABILITY_STATUSES)[number];
export type DesktopNodeHealthStatus = (typeof DESKTOP_HEALTH_STATUSES)[number];
export type DesktopNodeAssignmentStatus =
  (typeof DESKTOP_ASSIGNMENT_STATUSES)[number];
export type DesktopNodeCapabilityKey = (typeof DESKTOP_CAPABILITY_KEYS)[number];

export type DesktopNodeAssignment = {
  acceptByAt: string | null;
  createdAt: string;
  evidenceCount: number;
  id: string;
  lastError: string | null;
  outputKinds: string[];
  requestCallbacksEnabled: boolean;
  requestToken: string;
  requiredCapabilities: DesktopNodeCapabilityKey[];
  runtimeFamily: DesktopNodeRuntimeFamily;
  status: DesktopNodeAssignmentStatus;
  summary: string;
  title: string;
  updatedAt: string;
  workspaceHint: string | null;
};

export type DesktopNodeMetadata = {
  appVersion: string | null;
  assignments: DesktopNodeAssignment[];
  availabilityStatus: DesktopNodeAvailabilityStatus;
  capacityPolicy: {
    maxConcurrentAssignments: number;
    maxQueueDepth: number;
  };
  executionSurface: "desktop";
  healthStatus: DesktopNodeHealthStatus;
  isPrivateOperatorNode: true;
  kind: "desktop-node";
  lastHeartbeatAt: string | null;
  localMachineCapabilities: string[];
  machineLabel: string;
  platform: string | null;
  registeredAt: string;
  runtimeFamilies: DesktopNodeRuntimeFamily[];
  stableNodeId: string;
  version: 1;
};

export type DesktopNodeUpsertBody = {
  appVersion?: string | null;
  availabilityStatus?: DesktopNodeAvailabilityStatus;
  healthStatus?: DesktopNodeHealthStatus;
  localMachineCapabilities?: string[];
  machineLabel?: string;
  maxConcurrentAssignments?: number;
  maxQueueDepth?: number;
  platform?: string | null;
  runtimeFamilies?: DesktopNodeRuntimeFamily[];
  stableNodeId: string;
};

export type DesktopNodeHeartbeatBody = {
  appVersion?: string | null;
  availabilityStatus?: DesktopNodeAvailabilityStatus;
  healthStatus?: DesktopNodeHealthStatus;
  localMachineCapabilities?: string[];
  machineLabel?: string;
  maxConcurrentAssignments?: number;
  maxQueueDepth?: number;
  platform?: string | null;
  runtimeFamilies?: DesktopNodeRuntimeFamily[];
  stableNodeId?: string;
};

export type DesktopNodeAssignmentInput = {
  acceptByMinutes?: number;
  outputKinds?: string[];
  requestCallbacksEnabled?: boolean;
  requestToken?: string | null;
  requiredCapabilities?: DesktopNodeCapabilityKey[];
  runtimeFamily: DesktopNodeRuntimeFamily;
  summary: string;
  title: string;
  workspaceHint?: string | null;
};

export type DesktopNodeAssignmentPatchBody = {
  evidenceCount?: number;
  lastError?: string | null;
  status: DesktopNodeAssignmentStatus;
};

export type DesktopNodeSupplyShape = {
  _id: Id<"supplies">;
  availabilityStatus?: "available" | "limited" | "unavailable" | null;
  connectorHealthStatus?: "failing" | "healthy" | "unknown" | null;
  connectorLastHeartbeatAt?: number | null;
  createdAt?: number | null;
  metadataJson?: string | null;
  updatedAt?: number | null;
};

export type DesktopNodeEnvelope = {
  assignments: DesktopNodeAssignment[];
  node: {
    appVersion: string | null;
    availabilityStatus: DesktopNodeAvailabilityStatus;
    connectorHealthStatus: "failing" | "healthy" | "unknown" | null;
    lastHeartbeatAt: string | null;
    localMachineCapabilities: string[];
    machineLabel: string;
    platform: string | null;
    registeredAt: string;
    runtimeFamilies: DesktopNodeRuntimeFamily[];
    stableNodeId: string;
    supplyAvailabilityStatus: "available" | "limited" | "unavailable" | null;
    supplyId: string;
    updatedAt: string | null;
  };
  version: typeof DESKTOP_NODE_API_VERSION;
};

type DesktopNodeMetadataPatch = {
  appVersion?: string | null;
  assignments?: DesktopNodeAssignment[];
  availabilityStatus?: DesktopNodeAvailabilityStatus;
  capacityPolicy?: Partial<DesktopNodeMetadata["capacityPolicy"]>;
  healthStatus?: DesktopNodeHealthStatus;
  lastHeartbeatAt?: string | null;
  localMachineCapabilities?: string[];
  machineLabel?: string;
  platform?: string | null;
  runtimeFamilies?: DesktopNodeRuntimeFamily[];
  stableNodeId?: string;
};

export function parseDesktopNodeMetadata(
  metadataJson: string | null | undefined,
): DesktopNodeMetadata | null {
  if (!metadataJson) {
    return null;
  }

  try {
    const parsed = JSON.parse(metadataJson) as Partial<DesktopNodeMetadata> | null;

    if (!parsed || parsed.kind !== "desktop-node" || parsed.isPrivateOperatorNode !== true) {
      return null;
    }

    return mergeDesktopNodeMetadata(parsed as DesktopNodeMetadata | null, {});
  } catch {
    return null;
  }
}

export function isDesktopNodeSupplyRecord(input: {
  executionSurface?: string | null;
  metadataJson?: string | null;
  offerSlug?: string | null;
  sourceCapabilityId?: string | null;
}) {
  const metadata = parseDesktopNodeMetadata(input.metadataJson);

  return Boolean(
    input.executionSurface === "desktop" &&
      (metadata?.isPrivateOperatorNode === true ||
        input.offerSlug === DESKTOP_NODE_OFFER_SLUG ||
        input.sourceCapabilityId === DESKTOP_NODE_SOURCE_CAPABILITY_ID),
  );
}

export function mergeDesktopNodeMetadata(
  existing: DesktopNodeMetadata | null,
  patch: DesktopNodeMetadataPatch,
) {
  const now = new Date().toISOString();
  const stableNodeId = normalizeText(patch.stableNodeId) ?? existing?.stableNodeId ?? null;

  if (!stableNodeId) {
    throw new Error("stableNodeId is required for the Boreal desktop node.");
  }

  const registeredAt = existing?.registeredAt ?? now;

  return {
    appVersion: normalizeOptionalText(patch.appVersion ?? existing?.appVersion ?? null),
    assignments: normalizeAssignments(patch.assignments ?? existing?.assignments ?? []),
    availabilityStatus: normalizeAvailabilityStatus(
      patch.availabilityStatus ?? existing?.availabilityStatus,
    ),
    capacityPolicy: {
      maxConcurrentAssignments: Math.max(
        1,
        Number(
          patch.capacityPolicy?.maxConcurrentAssignments ??
            existing?.capacityPolicy.maxConcurrentAssignments ??
            1,
        ) || 1,
      ),
      maxQueueDepth: Math.max(
        1,
        Number(
          patch.capacityPolicy?.maxQueueDepth ??
            existing?.capacityPolicy.maxQueueDepth ??
            3,
        ) || 3,
      ),
    },
    executionSurface: "desktop",
    healthStatus: normalizeHealthStatus(patch.healthStatus ?? existing?.healthStatus),
    isPrivateOperatorNode: true,
    kind: "desktop-node",
    lastHeartbeatAt:
      normalizeOptionalText(patch.lastHeartbeatAt ?? existing?.lastHeartbeatAt ?? null) ??
      null,
    localMachineCapabilities: normalizeStringArray(
      patch.localMachineCapabilities ?? existing?.localMachineCapabilities ?? [],
    ),
    machineLabel:
      normalizeText(patch.machineLabel) ?? existing?.machineLabel ?? "Boreal Desktop",
    platform: normalizeOptionalText(patch.platform ?? existing?.platform ?? null),
    registeredAt,
    runtimeFamilies: normalizeRuntimeFamilies(
      patch.runtimeFamilies ?? existing?.runtimeFamilies ?? [],
    ),
    stableNodeId,
    version: 1,
  } satisfies DesktopNodeMetadata;
}

export function buildDesktopNodeAssignment(
  input: DesktopNodeAssignmentInput & { id: string; now?: string },
) {
  const now = input.now ?? new Date().toISOString();
  const acceptByMinutes = Math.max(1, Math.min(input.acceptByMinutes ?? 10, 24 * 60));
  const requestToken = normalizeText(input.requestToken) ?? `demo_${input.id.slice(0, 12)}`;
  const requestCallbacksEnabled =
    input.requestCallbacksEnabled ?? !requestToken.startsWith("demo_");

  return {
    acceptByAt: new Date(Date.parse(now) + acceptByMinutes * 60_000).toISOString(),
    createdAt: now,
    evidenceCount: 0,
    id: input.id,
    lastError: null,
    outputKinds: normalizeStringArray(input.outputKinds ?? []),
    requestCallbacksEnabled,
    requestToken,
    requiredCapabilities: normalizeCapabilities(input.requiredCapabilities ?? []),
    runtimeFamily: normalizeRuntimeFamily(input.runtimeFamily),
    status: "queued_for_desktop",
    summary: requireText(input.summary, "summary"),
    title: requireText(input.title, "title"),
    updatedAt: now,
    workspaceHint: normalizeOptionalText(input.workspaceHint ?? null),
  } satisfies DesktopNodeAssignment;
}

export function buildDesktopNodeEnvelope(supply: DesktopNodeSupplyShape) {
  const metadata = parseDesktopNodeMetadata(supply.metadataJson);

  if (!metadata) {
    throw new Error("Desktop node metadata is missing or invalid.");
  }

  return {
    assignments: metadata.assignments,
    node: {
      appVersion: metadata.appVersion,
      availabilityStatus: metadata.availabilityStatus,
      connectorHealthStatus: supply.connectorHealthStatus ?? null,
      lastHeartbeatAt:
        metadata.lastHeartbeatAt ??
        (typeof supply.connectorLastHeartbeatAt === "number"
          ? new Date(supply.connectorLastHeartbeatAt).toISOString()
          : null),
      localMachineCapabilities: metadata.localMachineCapabilities,
      machineLabel: metadata.machineLabel,
      platform: metadata.platform,
      registeredAt:
        metadata.registeredAt ??
        (typeof supply.createdAt === "number"
          ? new Date(supply.createdAt).toISOString()
          : new Date().toISOString()),
      runtimeFamilies: metadata.runtimeFamilies,
      stableNodeId: metadata.stableNodeId,
      supplyAvailabilityStatus: supply.availabilityStatus ?? null,
      supplyId: String(supply._id),
      updatedAt:
        typeof supply.updatedAt === "number"
          ? new Date(supply.updatedAt).toISOString()
          : null,
    },
    version: DESKTOP_NODE_API_VERSION,
  } satisfies DesktopNodeEnvelope;
}

export function isPrivateOperatorDesktopSupply(input: {
  metadataJson?: string | null;
}) {
  return Boolean(parseDesktopNodeMetadata(input.metadataJson));
}

export function toDesktopSupplyAvailabilityStatus(
  availabilityStatus: DesktopNodeAvailabilityStatus,
) {
  if (availabilityStatus === "available") {
    return "available" as const;
  }

  if (availabilityStatus === "offline") {
    return "unavailable" as const;
  }

  return "limited" as const;
}

export function toDesktopConnectorHealthStatus(
  healthStatus: DesktopNodeHealthStatus,
  availabilityStatus: DesktopNodeAvailabilityStatus,
) {
  if (availabilityStatus === "offline") {
    return "unknown" as const;
  }

  if (healthStatus === "degraded" || healthStatus === "offline") {
    return "failing" as const;
  }

  return "healthy" as const;
}

export function buildDesktopCapabilityTags(metadata: DesktopNodeMetadata) {
  return normalizeStringArray([
    "desktop-node",
    "desktop",
    "private-operator-node",
    "owner-only",
    "windows-first",
    ...metadata.runtimeFamilies.map((family) => `runtime:${family}`),
    ...metadata.localMachineCapabilities,
  ]);
}

function normalizeAssignments(value: DesktopNodeAssignment[]) {
  return value
    .map((assignment) => normalizeAssignment(assignment))
    .filter((assignment): assignment is DesktopNodeAssignment => assignment !== null);
}

function normalizeAssignment(value: DesktopNodeAssignment | null | undefined) {
  if (!value) {
    return null;
  }

  const id = normalizeText(value.id);
  const title = normalizeText(value.title);
  const summary = normalizeText(value.summary);

  if (!id || !title || !summary) {
    return null;
  }

  const requestToken = normalizeText(value.requestToken) ?? `demo_${id.slice(0, 12)}`;

  return {
    acceptByAt: normalizeOptionalText(value.acceptByAt ?? null),
    createdAt: normalizeOptionalText(value.createdAt) ?? new Date().toISOString(),
    evidenceCount:
      typeof value.evidenceCount === "number" && Number.isFinite(value.evidenceCount)
        ? Math.max(0, Math.round(value.evidenceCount))
        : 0,
    id,
    lastError: normalizeOptionalText(value.lastError ?? null),
    outputKinds: normalizeStringArray(value.outputKinds ?? []),
    requestCallbacksEnabled:
      typeof value.requestCallbacksEnabled === "boolean"
        ? value.requestCallbacksEnabled
        : !requestToken.startsWith("demo_"),
    requestToken,
    requiredCapabilities: normalizeCapabilities(value.requiredCapabilities ?? []),
    runtimeFamily: normalizeRuntimeFamily(value.runtimeFamily),
    status: normalizeAssignmentStatus(value.status),
    summary,
    title,
    updatedAt: normalizeOptionalText(value.updatedAt) ?? new Date().toISOString(),
    workspaceHint: normalizeOptionalText(value.workspaceHint ?? null),
  } satisfies DesktopNodeAssignment;
}

function normalizeStringArray(value: string[]) {
  return Array.from(
    new Set(
      value
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  ).slice(0, 48);
}

function normalizeRuntimeFamilies(value: DesktopNodeRuntimeFamily[]) {
  const normalized = value
    .filter((entry): entry is DesktopNodeRuntimeFamily => {
      return DESKTOP_RUNTIME_FAMILIES.includes(entry);
    });

  return normalized.length > 0
    ? Array.from(new Set(normalized))
    : [...DESKTOP_RUNTIME_FAMILIES];
}

function normalizeCapabilities(value: DesktopNodeCapabilityKey[]) {
  return value.filter((entry): entry is DesktopNodeCapabilityKey => {
    return DESKTOP_CAPABILITY_KEYS.includes(entry);
  });
}

function normalizeRuntimeFamily(value: DesktopNodeRuntimeFamily) {
  return DESKTOP_RUNTIME_FAMILIES.includes(value) ? value : "codex";
}

function normalizeAvailabilityStatus(
  value: DesktopNodeAvailabilityStatus | null | undefined,
) {
  return DESKTOP_AVAILABILITY_STATUSES.includes(value as DesktopNodeAvailabilityStatus)
    ? (value as DesktopNodeAvailabilityStatus)
    : "paused";
}

function normalizeHealthStatus(value: DesktopNodeHealthStatus | null | undefined) {
  return DESKTOP_HEALTH_STATUSES.includes(value as DesktopNodeHealthStatus)
    ? (value as DesktopNodeHealthStatus)
    : "offline";
}

function normalizeAssignmentStatus(
  value: DesktopNodeAssignmentStatus | null | undefined,
) {
  return DESKTOP_ASSIGNMENT_STATUSES.includes(value as DesktopNodeAssignmentStatus)
    ? (value as DesktopNodeAssignmentStatus)
    : "queued_for_desktop";
}

function requireText(value: string | null | undefined, field: string) {
  const normalized = normalizeText(value);

  if (!normalized) {
    throw new Error(`${field} is required.`);
  }

  return normalized;
}

function normalizeText(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function normalizeOptionalText(value: string | null | undefined) {
  return normalizeText(value);
}
