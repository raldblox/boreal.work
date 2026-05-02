import type {
  AssignmentStatus,
  AvailabilityStatus,
  DesktopAssignment,
  PolicyCapabilityKey,
  RuntimeFamily,
} from "../shared/contracts.js";

type DesktopNodeEnvelope = {
  assignments: DesktopAssignment[];
  node: {
    availabilityStatus: AvailabilityStatus;
    lastHeartbeatAt: string | null;
    localMachineCapabilities: string[];
    machineLabel: string;
    platform: string | null;
    registeredAt: string;
    runtimeFamilies: RuntimeFamily[];
    stableNodeId: string;
    supplyId: string;
  };
  version: string;
};

type DesktopNodeRegisterBody = {
  appVersion: string;
  availabilityStatus: AvailabilityStatus;
  healthStatus: "active" | "busy" | "degraded" | "idle" | "offline";
  localMachineCapabilities: string[];
  machineLabel: string;
  maxConcurrentAssignments: number;
  maxQueueDepth: number;
  platform: string;
  runtimeFamilies: RuntimeFamily[];
  stableNodeId: string;
};

type DesktopNodeAssignmentCreateBody = {
  outputKinds: string[];
  requestCallbacksEnabled: boolean;
  requestToken?: string | null;
  requiredCapabilities: PolicyCapabilityKey[];
  runtimeFamily: RuntimeFamily;
  summary: string;
  title: string;
  workspaceHint: string | null;
};

type DesktopNodeAssignmentPatchBody = {
  evidenceCount?: number;
  lastError?: string | null;
  status: AssignmentStatus;
};

type DesktopConnectRedeemResponse = {
  ownerExternalId: string;
  sessionToken: string;
  walletAddress: string;
};

export class BorealApiClient {
  private readonly baseUrl: string;

  constructor(
    baseUrl: string,
    private readonly sessionToken: string,
  ) {
    this.baseUrl = baseUrl.replace(/\/+$/, "");
  }

  getNode() {
    return this.request<DesktopNodeEnvelope>("GET", "/api/v1/desktop-nodes");
  }

  registerNode(body: DesktopNodeRegisterBody) {
    return this.request<DesktopNodeEnvelope>(
      "POST",
      "/api/v1/desktop-nodes/register",
      body,
    );
  }

  heartbeatNode(body: Partial<DesktopNodeRegisterBody> & { stableNodeId?: string }) {
    return this.request<DesktopNodeEnvelope>(
      "POST",
      "/api/v1/desktop-nodes/heartbeat",
      body,
    );
  }

  listAssignments() {
    return this.request<DesktopNodeEnvelope>(
      "GET",
      "/api/v1/desktop-nodes/assignments",
    );
  }

  createAssignment(body: DesktopNodeAssignmentCreateBody) {
    return this.request<DesktopNodeEnvelope>(
      "POST",
      "/api/v1/desktop-nodes/assignments",
      body,
    );
  }

  acceptAssignment(assignmentId: string) {
    return this.request<DesktopNodeEnvelope>(
      "POST",
      `/api/v1/desktop-nodes/assignments/${assignmentId}/accept`,
    );
  }

  rejectAssignment(assignmentId: string) {
    return this.request<DesktopNodeEnvelope>(
      "POST",
      `/api/v1/desktop-nodes/assignments/${assignmentId}/reject`,
    );
  }

  patchAssignment(assignmentId: string, body: DesktopNodeAssignmentPatchBody) {
    return this.request<DesktopNodeEnvelope>(
      "POST",
      `/api/v1/desktop-nodes/assignments/${assignmentId}/status`,
      body,
    );
  }

  deleteAssignment(assignmentId: string) {
    return this.request<DesktopNodeEnvelope>(
      "DELETE",
      `/api/v1/desktop-nodes/assignments/${assignmentId}/status`,
    );
  }

  postRequestStatus(
    requestToken: string,
    body: {
      data?: unknown;
      errorCode?: string;
      message?: string;
      result?: unknown;
      status: "delivered" | "executing" | "failed";
    },
  ) {
    return this.request<Record<string, unknown>>(
      "POST",
      `/api/v1/requests/${requestToken}/status`,
      body,
    );
  }

  postRequestHeartbeat(
    requestToken: string,
    body: {
      data?: unknown;
      message?: string;
    },
  ) {
    return this.request<Record<string, unknown>>(
      "POST",
      `/api/v1/requests/${requestToken}/heartbeat`,
      body,
    );
  }

  private async request<T>(
    method: "DELETE" | "GET" | "POST",
    path: string,
    body?: unknown,
  ): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      body: body ? JSON.stringify(body) : undefined,
      headers: {
        Authorization: `Bearer ${this.sessionToken}`,
        "Content-Type": "application/json",
      },
      method,
    });

    const payload = (await response.json().catch(() => ({}))) as {
      error?: string;
      [key: string]: unknown;
    };

    if (!response.ok) {
      throw new Error(payload.error?.trim() || `Boreal desktop request failed: ${response.status}.`);
    }

    return payload as T;
  }
}

export async function redeemDesktopConnectGrant(
  baseUrl: string,
  grantToken: string,
): Promise<DesktopConnectRedeemResponse> {
  const normalizedBaseUrl = baseUrl.replace(/\/+$/, "");
  const response = await fetch(
    `${normalizedBaseUrl}/api/v1/desktop-connect/redeem`,
    {
      body: JSON.stringify({ grantToken }),
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
    },
  );

  const payload = (await response.json().catch(() => ({}))) as {
    error?: string;
    [key: string]: unknown;
  };

  if (!response.ok) {
    throw new Error(
      payload.error?.trim() ||
        `Boreal desktop connect redeem failed: ${response.status}.`,
    );
  }

  return payload as DesktopConnectRedeemResponse;
}
