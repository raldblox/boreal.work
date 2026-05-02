export type RuntimeFamily = "codex" | "qvac";

export type RuntimeAvailability = "available" | "missing" | "error";

export type RuntimeAuthState =
  | "authenticated"
  | "missing"
  | "not_required"
  | "unknown";

export type NodeHealthStatus =
  | "active"
  | "idle"
  | "busy"
  | "offline"
  | "degraded";

export type AvailabilityStatus =
  | "available"
  | "paused"
  | "draining"
  | "offline";

export type ConnectionStatus =
  | "local_only"
  | "configured"
  | "connected"
  | "error";

export type AssignmentStatus =
  | "queued_for_desktop"
  | "accepted_by_desktop"
  | "executing_on_desktop"
  | "waiting_for_owner_input"
  | "delivered_by_desktop"
  | "failed_on_desktop"
  | "rejected_by_desktop"
  | "expired";

export type PolicyCapabilityKey =
  | "shell"
  | "filesystem_read"
  | "filesystem_write"
  | "git_read"
  | "git_write"
  | "browser_automation"
  | "network_egress"
  | "long_running_tasks";

export type DesktopPolicy = {
  allowedWorkspaceRoots: string[];
  capabilities: Record<PolicyCapabilityKey, boolean>;
  maxTaskDurationMinutes: number;
};

export type RuntimeProbe = {
  family: RuntimeFamily;
  command: string | null;
  path: string | null;
  version: string | null;
  availability: RuntimeAvailability;
  authState: RuntimeAuthState;
  lastCheckedAt: string;
  notes: string[];
  supportedJobTypes: string[];
};

export type DesktopNode = {
  machineLabel: string;
  stableNodeId: string;
  registeredAt: string | null;
  lastHeartbeatAt: string | null;
  healthStatus: NodeHealthStatus;
  availabilityStatus: AvailabilityStatus;
  runtimeFamilies: RuntimeFamily[];
  capacity: {
    maxConcurrentAssignments: number;
    maxQueueDepth: number;
    activeCount: number;
    queuedCount: number;
  };
  localCapabilityTags: string[];
  hasNodeToken: boolean;
};

export type DesktopAssignment = {
  id: string;
  requestToken: string;
  requestCallbacksEnabled: boolean;
  title: string;
  summary: string;
  runtimeFamily: RuntimeFamily;
  status: AssignmentStatus;
  createdAt: string;
  updatedAt: string;
  acceptByAt: string | null;
  workspaceHint: string | null;
  requiredCapabilities: PolicyCapabilityKey[];
  outputKinds: string[];
  evidenceCount: number;
  lastError: string | null;
};

export type DesktopEventTone = "info" | "success" | "warn" | "error";

export type DesktopEvent = {
  id: string;
  occurredAt: string;
  title: string;
  detail: string;
  tone: DesktopEventTone;
};

export type DesktopConnectionState = {
  apiBaseUrl: string;
  hasSessionToken: boolean;
  lastSyncAt: string | null;
  lastSyncError: string | null;
  registeredSupplyId: string | null;
  status: ConnectionStatus;
};

export type DesktopSnapshot = {
  appVersion: string;
  buildMode: "boreal_connected" | "local_scaffold";
  connection: DesktopConnectionState;
  events: DesktopEvent[];
  node: DesktopNode;
  platform: string;
  policy: DesktopPolicy;
  runtimes: RuntimeProbe[];
  assignments: DesktopAssignment[];
};

export type RegisterNodeInput = {
  machineLabel?: string;
  maxConcurrentAssignments?: number;
  maxQueueDepth?: number;
};

export type ConnectionConfigInput = {
  apiBaseUrl: string;
  sessionToken?: string | null;
};
