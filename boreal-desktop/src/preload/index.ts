import { contextBridge, ipcRenderer } from "electron";

import type {
  AvailabilityStatus,
  ConnectionConfigInput,
  DesktopPolicy,
  DesktopSnapshot,
  RegisterNodeInput,
} from "../shared/contracts.js";
import { IPC_CHANNELS } from "../shared/ipc.js";

const api = {
  acceptAssignment(id: string) {
    return ipcRenderer.invoke(IPC_CHANNELS.invoke.acceptAssignment, id) as Promise<DesktopSnapshot>;
  },
  clearFinishedAssignments() {
    return ipcRenderer.invoke(
      IPC_CHANNELS.invoke.clearFinishedAssignments,
    ) as Promise<DesktopSnapshot>;
  },
  deliverAssignment(id: string) {
    return ipcRenderer.invoke(IPC_CHANNELS.invoke.deliverAssignment, id) as Promise<DesktopSnapshot>;
  },
  failAssignment(id: string) {
    return ipcRenderer.invoke(IPC_CHANNELS.invoke.failAssignment, id) as Promise<DesktopSnapshot>;
  },
  getSnapshot() {
    return ipcRenderer.invoke(IPC_CHANNELS.invoke.getSnapshot) as Promise<DesktopSnapshot>;
  },
  probeRuntimes() {
    return ipcRenderer.invoke(IPC_CHANNELS.invoke.probeRuntimes) as Promise<DesktopSnapshot>;
  },
  registerNode(input: RegisterNodeInput) {
    return ipcRenderer.invoke(IPC_CHANNELS.invoke.registerNode, input) as Promise<DesktopSnapshot>;
  },
  saveConnectionConfig(input: ConnectionConfigInput) {
    return ipcRenderer.invoke(
      IPC_CHANNELS.invoke.saveConnectionConfig,
      input,
    ) as Promise<DesktopSnapshot>;
  },
  rejectAssignment(id: string) {
    return ipcRenderer.invoke(IPC_CHANNELS.invoke.rejectAssignment, id) as Promise<DesktopSnapshot>;
  },
  seedDemoAssignments() {
    return ipcRenderer.invoke(IPC_CHANNELS.invoke.seedDemoAssignments) as Promise<DesktopSnapshot>;
  },
  setAvailability(status: AvailabilityStatus) {
    return ipcRenderer.invoke(
      IPC_CHANNELS.invoke.setAvailability,
      status,
    ) as Promise<DesktopSnapshot>;
  },
  startAssignment(id: string) {
    return ipcRenderer.invoke(IPC_CHANNELS.invoke.startAssignment, id) as Promise<DesktopSnapshot>;
  },
  subscribe(listener: (snapshot: DesktopSnapshot) => void) {
    const handler = (_event: Electron.IpcRendererEvent, snapshot: DesktopSnapshot) => {
      listener(snapshot);
    };
    ipcRenderer.on(IPC_CHANNELS.events.stateChanged, handler);
    return () => {
      ipcRenderer.removeListener(IPC_CHANNELS.events.stateChanged, handler);
    };
  },
  updatePolicy(policy: DesktopPolicy) {
    return ipcRenderer.invoke(IPC_CHANNELS.invoke.updatePolicy, policy) as Promise<DesktopSnapshot>;
  },
  waitAssignment(id: string) {
    return ipcRenderer.invoke(IPC_CHANNELS.invoke.waitAssignment, id) as Promise<DesktopSnapshot>;
  },
};

contextBridge.exposeInMainWorld("borealDesktop", api);
