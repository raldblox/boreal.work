import { readFile, writeFile } from "node:fs/promises";
import { homedir, hostname } from "node:os";
import { join } from "node:path";

import type {
  AvailabilityStatus,
  DesktopAssignment,
  DesktopConnectionState,
  DesktopEvent,
  DesktopNode,
  DesktopPolicy,
  RuntimeProbe,
} from "../../shared/contracts.js";

export type PersistedDesktopState = {
  assignments: DesktopAssignment[];
  connection: Omit<DesktopConnectionState, "hasSessionToken" | "status">;
  events: DesktopEvent[];
  node: Omit<DesktopNode, "hasNodeToken">;
  policy: DesktopPolicy;
  runtimes: RuntimeProbe[];
};

const defaultPolicy: DesktopPolicy = {
  allowedWorkspaceRoots: [join(homedir(), "boreal.work")],
  capabilities: {
    browser_automation: false,
    filesystem_read: true,
    filesystem_write: false,
    git_read: true,
    git_write: false,
    long_running_tasks: false,
    network_egress: true,
    shell: false,
  },
  maxTaskDurationMinutes: 45,
};

const defaultNode = (): Omit<DesktopNode, "hasNodeToken"> => ({
  availabilityStatus: "paused",
  capacity: {
    activeCount: 0,
    maxConcurrentAssignments: 1,
    maxQueueDepth: 3,
    queuedCount: 0,
  },
  healthStatus: "offline",
  lastHeartbeatAt: null,
  localCapabilityTags: [],
  machineLabel: hostname(),
  registeredAt: null,
  runtimeFamilies: ["codex", "qvac"],
  stableNodeId: `desktop-${hostname().toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
});

const defaultConnection = (): Omit<DesktopConnectionState, "hasSessionToken" | "status"> => ({
  apiBaseUrl: "http://localhost:3000",
  lastSyncAt: null,
  lastSyncError: null,
  registeredSupplyId: null,
});

export const createDefaultState = (): PersistedDesktopState => ({
  assignments: [],
  connection: defaultConnection(),
  events: [],
  node: defaultNode(),
  policy: defaultPolicy,
  runtimes: [],
});

export class StateStore {
  constructor(private readonly filePath: string) {}

  async read(): Promise<PersistedDesktopState> {
    try {
      const raw = await readFile(this.filePath, "utf8");
      const parsed = JSON.parse(raw) as PersistedDesktopState;
      return {
        assignments: (parsed.assignments ?? []).map((assignment) => ({
          ...assignment,
          requestCallbacksEnabled:
            typeof assignment.requestCallbacksEnabled === "boolean"
              ? assignment.requestCallbacksEnabled
              : !assignment.requestToken.startsWith("demo_"),
        })),
        connection: parsed.connection ?? defaultConnection(),
        events: parsed.events ?? [],
        node: parsed.node ?? defaultNode(),
        policy: parsed.policy ?? defaultPolicy,
        runtimes: parsed.runtimes ?? [],
      };
    } catch {
      return createDefaultState();
    }
  }

  async write(state: PersistedDesktopState): Promise<void> {
    await writeFile(this.filePath, JSON.stringify(state, null, 2), "utf8");
  }
}
