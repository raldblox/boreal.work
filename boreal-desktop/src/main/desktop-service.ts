import { randomUUID } from "node:crypto";

import type {
  AssignmentStatus,
  AvailabilityStatus,
  ConnectionConfigInput,
  DesktopAssignment,
  DesktopConnectionState,
  DesktopEvent,
  DesktopEventTone,
  DesktopPolicy,
  DesktopSnapshot,
  PolicyCapabilityKey,
  RegisterNodeInput,
  RuntimeProbe,
} from "../shared/contracts.js";
import { SecureStore } from "./auth/secure-store.js";
import {
  BorealApiClient,
  redeemDesktopConnectGrant,
} from "./boreal-api-client.js";
import { probeAllRuntimes } from "./runtimes/probe.js";
import type { PersistedDesktopState } from "./store/state-store.js";
import { StateStore } from "./store/state-store.js";

type Listener = (snapshot: DesktopSnapshot) => void;

export class DesktopService {
  private listeners = new Set<Listener>();
  private state: PersistedDesktopState | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;

  constructor(
    private readonly stateStore: StateStore,
    private readonly secureStore: SecureStore,
    private readonly appVersion: string,
  ) {}

  async initialize(): Promise<void> {
    const state = await this.stateStore.read();
    state.runtimes = await probeAllRuntimes();
    this.state = state;
    this.recalculateNode();
    await this.bootstrapRemoteState();
    await this.persist();
    this.startHeartbeatLoop();
  }

  onChange(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  async getSnapshot(): Promise<DesktopSnapshot> {
    const [hasNodeToken, hasSessionToken] = await Promise.all([
      this.secureStore.getNodeToken(),
      this.secureStore.getSessionToken(),
    ]);
    return this.buildSnapshot(Boolean(hasNodeToken), Boolean(hasSessionToken));
  }

  async connectFromLaunchUrl(launchUrl: string): Promise<DesktopSnapshot> {
    return this.mutate(async (state) => {
      const launch = parseDesktopConnectLaunchUrl(
        launchUrl,
        state.connection.apiBaseUrl,
      );

      try {
        state.connection.apiBaseUrl = launch.apiBaseUrl;
        state.connection.lastSyncError = null;
        const redeemed = await redeemDesktopConnectGrant(
          launch.apiBaseUrl,
          launch.grantToken,
        );

        await this.secureStore.setSessionToken(redeemed.sessionToken);
        const client = await this.getApiClient(state.connection.apiBaseUrl);

        if (!client) {
          throw new Error("Boreal Desktop could not load the redeemed session.");
        }

        await this.pullRemoteNodeIntoState(state, client, false);
        this.pushEvent(
          "Desktop connected from Boreal web",
          state.connection.registeredSupplyId
            ? `Boreal Desktop linked ${formatWalletAddress(
                redeemed.walletAddress,
              )} and reloaded the private node queue.`
            : `Boreal Desktop linked ${formatWalletAddress(
                redeemed.walletAddress,
              )}. Register this machine if the private node has not been created yet.`,
          "success",
        );
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Unable to complete the Boreal Desktop connect flow.";
        state.connection.lastSyncError = message;
        this.pushEvent("Desktop connect failed", message, "error");
        throw new Error(message);
      }
    });
  }

  async saveConnectionConfig(input: ConnectionConfigInput): Promise<DesktopSnapshot> {
    return this.mutate(async (state) => {
      state.connection.apiBaseUrl = normalizeBaseUrl(input.apiBaseUrl);
      state.connection.lastSyncError = null;
      if (typeof input.sessionToken === "string" || input.sessionToken === null) {
        await this.secureStore.setSessionToken(input.sessionToken);
      }
      const hasSessionToken = (await this.secureStore.getSessionToken()) !== null;

      this.pushEvent(
        "Boreal connection saved",
        hasSessionToken
          ? "Desktop will use the stored Boreal bearer session for register, heartbeat, and assignment sync."
          : "Boreal bearer session was cleared. Desktop remains local-only until a new session is stored.",
        hasSessionToken ? "success" : "warn",
      );

      const client = await this.getApiClient(state.connection.apiBaseUrl);
      if (!client) {
        state.connection.registeredSupplyId = null;
        return;
      }

      await this.pullRemoteNodeIntoState(state, client, false);
    });
  }

  async probeRuntimes(): Promise<DesktopSnapshot> {
    return this.mutate(async (state) => {
      state.runtimes = await probeAllRuntimes();
      this.recalculateNode();
      await this.syncRemoteNode(state, false);
      this.pushEvent(
        "Runtime probe finished",
        this.describeRuntimeProbe(state.runtimes),
        "info",
      );
    });
  }

  async registerNode(input: RegisterNodeInput): Promise<DesktopSnapshot> {
    return this.mutate(async (state) => {
      state.runtimes = await probeAllRuntimes();
      const nodeToken = (await this.secureStore.getNodeToken()) ?? randomUUID();
      await this.secureStore.setNodeToken(nodeToken);

      const now = new Date().toISOString();
      state.node.machineLabel = input.machineLabel?.trim() || state.node.machineLabel;
      state.node.capacity.maxConcurrentAssignments =
        input.maxConcurrentAssignments ?? state.node.capacity.maxConcurrentAssignments;
      state.node.capacity.maxQueueDepth =
        input.maxQueueDepth ?? state.node.capacity.maxQueueDepth;
      state.node.registeredAt = now;
      state.node.lastHeartbeatAt = now;
      state.node.availabilityStatus = "available";

      this.recalculateNode();

      const client = await this.getApiClient(state.connection.apiBaseUrl);
      if (client) {
        const remote = await client.registerNode(this.buildRemoteNodePayload(state));
        this.applyRemoteEnvelope(state, remote);
        this.pushEvent(
          "Private desktop node registered",
          "Boreal Desktop registered the owner-only execution node and synced the assignment queue.",
          "success",
        );
        return;
      }

      this.pushEvent(
        "Private desktop node registered",
        "Local scaffold registration completed. Add a Boreal session token to sync this node remotely.",
        "success",
      );
    });
  }

  async setAvailability(status: AvailabilityStatus): Promise<DesktopSnapshot> {
    return this.mutate(async (state) => {
      state.node.availabilityStatus = status;
      this.recalculateNode();
      await this.syncRemoteNode(state, false);
      this.pushEvent(
        "Availability updated",
        `Desktop node is now ${status.replace(/_/g, " ")}.`,
        "info",
      );
    });
  }

  async updatePolicy(policy: DesktopPolicy): Promise<DesktopSnapshot> {
    return this.mutate(async (state) => {
      state.policy = policy;
      this.recalculateNode();
      await this.syncRemoteNode(state, false);
      this.pushEvent(
        "Policy updated",
        "Local capability gates were saved to the desktop policy store.",
        "success",
      );
    });
  }

  async seedDemoAssignments(): Promise<DesktopSnapshot> {
    return this.mutate(async (state) => {
      const client = await this.getApiClient(state.connection.apiBaseUrl);
      if (client && state.connection.registeredSupplyId) {
        const samples = this.buildDemoAssignments();
        let remote = await client.listAssignments();

        for (const sample of samples) {
          if (remote.assignments.some((assignment) => assignment.title === sample.title)) {
            continue;
          }

          remote = await client.createAssignment(sample);
        }

        this.applyRemoteEnvelope(state, remote);
        this.pushEvent(
          "Demo queue seeded",
          "Placeholder desktop assignments were added to the Boreal desktop queue.",
          "success",
        );
        return;
      }

      const existingTitles = new Set(state.assignments.map((assignment) => assignment.title));
      let inserted = 0;
      for (const assignment of this.buildLocalDemoAssignments()) {
        if (existingTitles.has(assignment.title)) {
          continue;
        }

        state.assignments.unshift(assignment);
        inserted += 1;
      }

      this.recalculateNode();
      this.pushEvent(
        inserted > 0 ? "Demo queue seeded" : "Demo queue already present",
        inserted > 0
          ? `${inserted} placeholder desktop assignments were added locally.`
          : "The local queue already has the scaffold demo assignments.",
        inserted > 0 ? "success" : "info",
      );
    });
  }

  async acceptAssignment(id: string): Promise<DesktopSnapshot> {
    return this.mutate(async (state) => {
      const client = await this.getApiClient(state.connection.apiBaseUrl);
      if (client && state.connection.registeredSupplyId) {
        this.applyRemoteEnvelope(state, await client.acceptAssignment(id));
      } else {
        const assignment = this.findAssignment(state, id);
        assignment.status = "accepted_by_desktop";
        assignment.updatedAt = new Date().toISOString();
      }

      this.recalculateNode();
      this.pushEvent(
        "Assignment accepted",
        "Assignment accepted into the Boreal desktop queue.",
        "success",
      );
    });
  }

  async rejectAssignment(id: string): Promise<DesktopSnapshot> {
    return this.mutate(async (state) => {
      const client = await this.getApiClient(state.connection.apiBaseUrl);
      if (client && state.connection.registeredSupplyId) {
        this.applyRemoteEnvelope(state, await client.rejectAssignment(id));
      } else {
        const assignment = this.findAssignment(state, id);
        assignment.status = "rejected_by_desktop";
        assignment.updatedAt = new Date().toISOString();
      }

      this.recalculateNode();
      this.pushEvent(
        "Assignment rejected",
        "Assignment was explicitly rejected by the desktop operator.",
        "warn",
      );
    });
  }

  async startAssignment(id: string): Promise<DesktopSnapshot> {
    return this.mutate(async (state) => {
      const assignment = this.findAssignment(state, id);
      const missingCapabilities = assignment.requiredCapabilities.filter((capability) => {
        return !state.policy.capabilities[capability];
      });

      if (missingCapabilities.length > 0) {
        throw new Error(
          `Blocked by local policy: ${missingCapabilities
            .map((capability) => capability.replace(/_/g, " "))
            .join(", ")}.`,
        );
      }

      const client = await this.getApiClient(state.connection.apiBaseUrl);
      if (client && state.connection.registeredSupplyId) {
        if (assignment.requestCallbacksEnabled) {
          await client.postRequestStatus(assignment.requestToken, {
            data: {
              runtimeFamily: assignment.runtimeFamily,
              workspaceHint: assignment.workspaceHint,
            },
            message: `${assignment.title} started on Boreal Desktop.`,
            status: "executing",
          });
        }

        this.applyRemoteEnvelope(
          state,
          await client.patchAssignment(id, {
            lastError: null,
            status: "executing_on_desktop",
          }),
        );
      } else {
        assignment.status = "executing_on_desktop";
        assignment.updatedAt = new Date().toISOString();
        assignment.lastError = null;
      }

      this.recalculateNode();
      this.pushEvent(
        "Assignment started",
        `${assignment.title} is now executing on the local ${assignment.runtimeFamily} runtime.`,
        "success",
      );
    });
  }

  async waitAssignment(id: string): Promise<DesktopSnapshot> {
    return this.mutate(async (state) => {
      const assignment = this.findAssignment(state, id);
      const client = await this.getApiClient(state.connection.apiBaseUrl);

      if (client && state.connection.registeredSupplyId) {
        if (assignment.requestCallbacksEnabled) {
          await client.postRequestHeartbeat(assignment.requestToken, {
            data: {
              runtimeFamily: assignment.runtimeFamily,
              workspaceHint: assignment.workspaceHint,
            },
            message: `${assignment.title} is waiting for owner input on Boreal Desktop.`,
          });
        }

        this.applyRemoteEnvelope(
          state,
          await client.patchAssignment(id, {
            lastError: null,
            status: "waiting_for_owner_input",
          }),
        );
      } else {
        assignment.status = "waiting_for_owner_input";
        assignment.updatedAt = new Date().toISOString();
      }

      this.recalculateNode();
      this.pushEvent(
        "Waiting for owner input",
        "Execution is blocked until the owner provides more local context or workspace access.",
        "warn",
      );
    });
  }

  async deliverAssignment(id: string): Promise<DesktopSnapshot> {
    return this.mutate(async (state) => {
      const assignment = this.findAssignment(state, id);
      const client = await this.getApiClient(state.connection.apiBaseUrl);

      if (client && state.connection.registeredSupplyId) {
        if (assignment.requestCallbacksEnabled) {
          await client.postRequestStatus(assignment.requestToken, {
            message: `${assignment.title} was delivered from Boreal Desktop.`,
            result: {
              deliveredAt: new Date().toISOString(),
              runtimeFamily: assignment.runtimeFamily,
              title: assignment.title,
            },
            status: "delivered",
          });
        }

        this.applyRemoteEnvelope(
          state,
          await client.patchAssignment(id, {
            evidenceCount: assignment.evidenceCount + 1,
            lastError: null,
            status: "delivered_by_desktop",
          }),
        );
      } else {
        assignment.status = "delivered_by_desktop";
        assignment.updatedAt = new Date().toISOString();
        assignment.evidenceCount += 1;
        assignment.lastError = null;
      }

      this.recalculateNode();
      this.pushEvent(
        "Assignment delivered",
        `${assignment.title} was marked delivered with one evidence bundle attached.`,
        "success",
      );
    });
  }

  async failAssignment(id: string): Promise<DesktopSnapshot> {
    return this.mutate(async (state) => {
      const assignment = this.findAssignment(state, id);
      const lastError = "Local execution failed inside the desktop runtime path.";
      const client = await this.getApiClient(state.connection.apiBaseUrl);

      if (client && state.connection.registeredSupplyId) {
        if (assignment.requestCallbacksEnabled) {
          await client.postRequestStatus(assignment.requestToken, {
            errorCode: "desktop_runtime_failure",
            message: `${assignment.title} failed on Boreal Desktop.`,
            status: "failed",
          });
        }

        this.applyRemoteEnvelope(
          state,
          await client.patchAssignment(id, {
            lastError,
            status: "failed_on_desktop",
          }),
        );
      } else {
        assignment.status = "failed_on_desktop";
        assignment.updatedAt = new Date().toISOString();
        assignment.lastError = lastError;
      }

      this.recalculateNode();
      this.pushEvent(
        "Assignment failed",
        `${assignment.title} failed locally and was recorded on the desktop queue.`,
        "error",
      );
    });
  }

  async clearFinishedAssignments(): Promise<DesktopSnapshot> {
    return this.mutate(async (state) => {
      const finishedStatuses = new Set<AssignmentStatus>([
        "delivered_by_desktop",
        "failed_on_desktop",
        "rejected_by_desktop",
        "expired",
      ]);
      const finishedIds = state.assignments
        .filter((assignment) => finishedStatuses.has(assignment.status))
        .map((assignment) => assignment.id);

      const client = await this.getApiClient(state.connection.apiBaseUrl);
      if (client && state.connection.registeredSupplyId && finishedIds.length > 0) {
        let remote = await client.listAssignments();
        for (const assignmentId of finishedIds) {
          remote = await client.deleteAssignment(assignmentId);
        }
        this.applyRemoteEnvelope(state, remote);
      } else if (!client || !state.connection.registeredSupplyId) {
        state.assignments = state.assignments.filter((assignment) => {
          return !finishedStatuses.has(assignment.status);
        });
      }

      this.recalculateNode();
      this.pushEvent(
        "Finished assignments cleared",
        finishedIds.length > 0
          ? `${finishedIds.length} finished assignments were removed from the queue.`
          : "No finished assignments were present to clear.",
        "info",
      );
    });
  }

  dispose(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private async mutate(
    work: (state: PersistedDesktopState) => Promise<void>,
  ): Promise<DesktopSnapshot> {
    const state = this.requireState();

    try {
      await work(state);
    } catch (error) {
      await this.persist();
      await this.emitSnapshot();
      throw error;
    }

    await this.persist();
    return this.emitSnapshot();
  }

  private async emitSnapshot(): Promise<DesktopSnapshot> {
    const [hasNodeToken, hasSessionToken] = await Promise.all([
      this.secureStore.getNodeToken(),
      this.secureStore.getSessionToken(),
    ]);
    const snapshot = this.buildSnapshot(Boolean(hasNodeToken), Boolean(hasSessionToken));
    for (const listener of this.listeners) {
      listener(snapshot);
    }
    return snapshot;
  }

  private async persist(): Promise<void> {
    await this.stateStore.write(this.requireState());
  }

  private buildSnapshot(
    hasNodeToken: boolean,
    hasSessionToken: boolean,
  ): DesktopSnapshot {
    const state = this.requireState();
    const connectionStatus = deriveConnectionStatus(state.connection, hasSessionToken);

    return {
      appVersion: this.appVersion,
      assignments: state.assignments,
      buildMode:
        connectionStatus === "connected" ? "boreal_connected" : "local_scaffold",
      connection: {
        ...state.connection,
        hasSessionToken,
        status: connectionStatus,
      },
      events: state.events,
      node: {
        ...state.node,
        hasNodeToken,
      },
      platform: process.platform,
      policy: state.policy,
      runtimes: state.runtimes,
    };
  }

  private buildDemoAssignments(): Array<{
    outputKinds: string[];
    requestCallbacksEnabled: boolean;
    requiredCapabilities: PolicyCapabilityKey[];
    runtimeFamily: DesktopAssignment["runtimeFamily"];
    summary: string;
    title: string;
    workspaceHint: string | null;
  }> {
    return [
      {
        outputKinds: ["patch", "log", "artifact"],
        requestCallbacksEnabled: false,
        requiredCapabilities: [
          "filesystem_read",
          "filesystem_write",
          "git_read",
        ] as PolicyCapabilityKey[],
        runtimeFamily: "codex" as const,
        summary:
          "Inspect a local repo, patch the failing request-thread specialist path, run the narrow verification, and attach the diff summary back into Boreal.",
        title: "Fix request-thread specialist regression",
        workspaceHint: "C:\\Users\\raldb\\boreal.work\\next-app",
      },
      {
        outputKinds: ["transcript", "ocr_bundle"],
        requestCallbacksEnabled: false,
        requiredCapabilities: ["filesystem_read"] as PolicyCapabilityKey[],
        runtimeFamily: "qvac" as const,
        summary:
          "Transcribe a local demo clip, extract OCR from attached screenshots, and upload the transcript bundle as request evidence.",
        title: "Transcribe launch-demo notes",
        workspaceHint: "C:\\Users\\raldb\\boreal.work\\artifacts",
      },
    ];
  }

  private buildLocalDemoAssignments() {
    const now = new Date().toISOString();
    return this.buildDemoAssignments().map((assignment) =>
      this.createAssignment({
        now,
        ...assignment,
      }),
    );
  }

  private buildRemoteNodePayload(state: PersistedDesktopState) {
    return {
      appVersion: this.appVersion,
      availabilityStatus: state.node.availabilityStatus,
      healthStatus: state.node.healthStatus,
      localMachineCapabilities: state.node.localCapabilityTags,
      machineLabel: state.node.machineLabel,
      maxConcurrentAssignments: state.node.capacity.maxConcurrentAssignments,
      maxQueueDepth: state.node.capacity.maxQueueDepth,
      platform: process.platform,
      runtimeFamilies: state.node.runtimeFamilies,
      stableNodeId: state.node.stableNodeId,
    };
  }

  private createAssignment(
    input: {
      now?: string;
      outputKinds: string[];
      requestCallbacksEnabled: boolean;
      requiredCapabilities: PolicyCapabilityKey[];
      runtimeFamily: DesktopAssignment["runtimeFamily"];
      summary: string;
      title: string;
      workspaceHint: string | null;
    },
  ): DesktopAssignment {
    const now = input.now ?? new Date().toISOString();
    return {
      acceptByAt: new Date(Date.parse(now) + 5 * 60_000).toISOString(),
      createdAt: now,
      evidenceCount: 0,
      id: randomUUID(),
      lastError: null,
      outputKinds: input.outputKinds,
      requestCallbacksEnabled: input.requestCallbacksEnabled,
      requestToken: `demo_${randomUUID().slice(0, 12)}`,
      requiredCapabilities: input.requiredCapabilities,
      runtimeFamily: input.runtimeFamily,
      status: "queued_for_desktop",
      summary: input.summary,
      title: input.title,
      updatedAt: now,
      workspaceHint: input.workspaceHint,
    };
  }

  private describeRuntimeProbe(runtimes: RuntimeProbe[]): string {
    return runtimes
      .map((runtime) => {
        const status = runtime.availability === "available" ? "ready" : runtime.availability;
        return `${runtime.family}: ${status}`;
      })
      .join(" | ");
  }

  private findAssignment(state: PersistedDesktopState, id: string): DesktopAssignment {
    const assignment = state.assignments.find((item) => item.id === id);
    if (!assignment) {
      throw new Error("Assignment not found.");
    }
    return assignment;
  }

  private pushEvent(title: string, detail: string, tone: DesktopEventTone): void {
    const state = this.requireState();
    const event: DesktopEvent = {
      detail,
      id: randomUUID(),
      occurredAt: new Date().toISOString(),
      title,
      tone,
    };
    state.events = [event, ...state.events].slice(0, 60);
  }

  private recalculateNode(): void {
    const state = this.requireState();
    const activeStatuses = new Set<AssignmentStatus>([
      "accepted_by_desktop",
      "executing_on_desktop",
      "waiting_for_owner_input",
    ]);
    const activeCount = state.assignments.filter((assignment) => {
      return activeStatuses.has(assignment.status);
    }).length;
    const queuedCount = state.assignments.filter((assignment) => {
      return assignment.status === "queued_for_desktop";
    }).length;
    const availableFamilies = state.runtimes
      .filter((runtime) => runtime.availability === "available")
      .map((runtime) => runtime.family);

    state.node.runtimeFamilies =
      availableFamilies.length > 0 ? availableFamilies : ["codex", "qvac"];
    state.node.capacity.activeCount = activeCount;
    state.node.capacity.queuedCount = queuedCount;
    state.node.localCapabilityTags = buildCapabilityTags(state.policy, state.runtimes);
    state.node.healthStatus = deriveHealthStatus(
      state.node.availabilityStatus,
      activeCount,
      state.runtimes,
      state.node.registeredAt !== null,
    );
  }

  private requireState(): PersistedDesktopState {
    if (!this.state) {
      throw new Error("Desktop service was used before initialization.");
    }
    return this.state;
  }

  private startHeartbeatLoop(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
    }

    this.heartbeatTimer = setInterval(() => {
      void this.mutate(async (state) => {
        if (!state.node.registeredAt || state.node.availabilityStatus === "offline") {
          return;
        }
        state.node.lastHeartbeatAt = new Date().toISOString();
        this.recalculateNode();
        await this.syncRemoteNode(state, false);
      });
    }, 30_000);
  }

  private async bootstrapRemoteState() {
    const state = this.requireState();
    const client = await this.getApiClient(state.connection.apiBaseUrl);

    if (!client) {
      return;
    }

    try {
      await this.pullRemoteNodeIntoState(state, client, false);
      this.recalculateNode();
    } catch {
      // Keep startup resilient. The saved connection state already carries the error.
    }
  }

  private async syncRemoteNode(
    state: PersistedDesktopState,
    requireRegistration: boolean,
  ) {
    const client = await this.getApiClient(state.connection.apiBaseUrl);

    if (!client) {
      return;
    }

    if (requireRegistration && !state.connection.registeredSupplyId) {
      throw new Error("Desktop node is not registered in Boreal yet.");
    }

    if (!state.connection.registeredSupplyId) {
      return;
    }

    try {
      const remote = await client.heartbeatNode(this.buildRemoteNodePayload(state));
      this.applyRemoteEnvelope(state, remote);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to reach Boreal.";
      state.connection.lastSyncError = message;
      this.pushEvent("Boreal sync failed", message, "error");
      throw new Error(message);
    }
  }

  private applyRemoteEnvelope(
    state: PersistedDesktopState,
    remote: Awaited<ReturnType<BorealApiClient["getNode"]>>,
  ) {
    state.assignments = remote.assignments;
    state.connection.lastSyncAt = new Date().toISOString();
    state.connection.lastSyncError = null;
    state.connection.registeredSupplyId = remote.node.supplyId;
    state.node.availabilityStatus = remote.node.availabilityStatus;
    state.node.machineLabel = remote.node.machineLabel;
    state.node.lastHeartbeatAt = remote.node.lastHeartbeatAt;
    state.node.registeredAt = remote.node.registeredAt;
    state.node.stableNodeId = remote.node.stableNodeId;
    this.recalculateNode();
  }

  private async pullRemoteNodeIntoState(
    state: PersistedDesktopState,
    client: BorealApiClient,
    throwWhenMissing: boolean,
  ) {
    try {
      this.applyRemoteEnvelope(state, await client.getNode());
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to reach Boreal.";

      if (message.includes("not registered")) {
        state.connection.registeredSupplyId = null;
        state.connection.lastSyncError = null;
        if (throwWhenMissing) {
          throw new Error(message);
        }
        return;
      }

      state.connection.lastSyncError = message;
      this.pushEvent(
        "Boreal sync failed",
        message,
        "error",
      );
      throw new Error(message);
    }
  }

  private async getApiClient(apiBaseUrl: string) {
    const sessionToken = await this.secureStore.getSessionToken();
    const normalizedBaseUrl = normalizeBaseUrl(apiBaseUrl);

    if (!sessionToken) {
      return null;
    }

    return new BorealApiClient(normalizedBaseUrl, sessionToken);
  }
}

function buildCapabilityTags(policy: DesktopPolicy, runtimes: RuntimeProbe[]): string[] {
  const tags = new Set<string>();

  for (const runtime of runtimes) {
    if (runtime.availability !== "available") {
      continue;
    }

    if (runtime.family === "codex") {
      tags.add("code_execution");
      tags.add("repo_analysis");
      tags.add("artifact_delivery");
    }

    if (runtime.family === "qvac") {
      tags.add("local_inference");
      tags.add("embeddings");
      tags.add("transcription");
      tags.add("ocr");
    }
  }

  for (const [capability, enabled] of Object.entries(policy.capabilities)) {
    if (enabled) {
      tags.add(capability);
    }
  }

  return [...tags];
}

function deriveHealthStatus(
  availability: AvailabilityStatus,
  activeCount: number,
  runtimes: RuntimeProbe[],
  isRegistered: boolean,
) {
  if (!isRegistered || availability === "offline") {
    return "offline";
  }

  if (activeCount > 0) {
    return "busy";
  }

  const availableCount = runtimes.filter((runtime) => runtime.availability === "available").length;
  if (availableCount === 0) {
    return "degraded";
  }

  if (availability === "paused" || availability === "draining") {
    return "idle";
  }

  return "active";
}

function deriveConnectionStatus(
  connection: PersistedDesktopState["connection"],
  hasSessionToken: boolean,
): DesktopConnectionState["status"] {
  if (!hasSessionToken) {
    return "local_only";
  }

  if (connection.lastSyncError) {
    return "error";
  }

  if (connection.registeredSupplyId) {
    return "connected";
  }

  return "configured";
}

function normalizeBaseUrl(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed.replace(/\/+$/, "") : "http://localhost:3000";
}

function parseDesktopConnectLaunchUrl(launchUrl: string, fallbackBaseUrl: string) {
  const parsed = new URL(launchUrl);
  const route = parsed.hostname || parsed.pathname.replace(/^\/+/, "");

  if (parsed.protocol !== "boreal-desktop:") {
    throw new Error("Unsupported Boreal Desktop launch protocol.");
  }

  if (route !== "connect") {
    throw new Error("Unsupported Boreal Desktop launch route.");
  }

  const grantToken = parsed.searchParams.get("grant")?.trim();

  if (!grantToken) {
    throw new Error("Boreal Desktop launch is missing its connect grant.");
  }

  return {
    apiBaseUrl: normalizeBaseUrl(
      parsed.searchParams.get("apiBaseUrl") ?? fallbackBaseUrl,
    ),
    grantToken,
  };
}

function formatWalletAddress(walletAddress: string) {
  const trimmed = walletAddress.trim();

  if (trimmed.length <= 12) {
    return trimmed;
  }

  return `${trimmed.slice(0, 4)}...${trimmed.slice(-4)}`;
}
