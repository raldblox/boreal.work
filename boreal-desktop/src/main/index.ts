import { app, BrowserWindow, ipcMain } from "electron";
import { join, resolve } from "node:path";

import { IPC_CHANNELS } from "../shared/ipc.js";
import type {
  AvailabilityStatus,
  ConnectionConfigInput,
  DesktopPolicy,
  RegisterNodeInput,
} from "../shared/contracts.js";
import { SecureStore } from "./auth/secure-store.js";
import { DesktopService } from "./desktop-service.js";
import { StateStore } from "./store/state-store.js";

let service: DesktopService | null = null;
const windows = new Set<BrowserWindow>();
const pendingLaunchUrls: string[] = [];
const DESKTOP_PROTOCOL = "boreal-desktop";

const hasSingleInstanceLock = app.requestSingleInstanceLock();

if (!hasSingleInstanceLock) {
  app.quit();
} else {
  const initialLaunchUrl = extractDesktopLaunchUrl(process.argv);
  if (initialLaunchUrl) {
    pendingLaunchUrls.push(initialLaunchUrl);
  }

  app.on("second-instance", (_event, argv) => {
    const launchUrl = extractDesktopLaunchUrl(argv);
    if (!launchUrl) {
      focusMainWindow();
      return;
    }

    void handleDesktopLaunchUrl(launchUrl);
  });

  app.on("open-url", (event, launchUrl) => {
    event.preventDefault();
    void handleDesktopLaunchUrl(launchUrl);
  });

  void bootstrap();
}

async function bootstrap() {
  await app.whenReady();
  registerDesktopProtocolClient();

  service = new DesktopService(
    new StateStore(join(app.getPath("userData"), "desktop-state.json")),
    new SecureStore(join(app.getPath("userData"), "desktop-secrets.json")),
    app.getVersion(),
  );
  await service.initialize();
  service.onChange((snapshot) => {
    for (const window of windows) {
      if (!window.isDestroyed()) {
        window.webContents.send(IPC_CHANNELS.events.stateChanged, snapshot);
      }
    }
  });

  registerIpc(service);
  await createMainWindow();
  await flushPendingLaunchUrls();

  app.on("activate", async () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      await createMainWindow();
    }
    focusMainWindow();
  });
}

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("before-quit", () => {
  service?.dispose();
});

async function createMainWindow() {
  const window = new BrowserWindow({
    backgroundColor: "#0b1020",
    height: 960,
    minHeight: 760,
    minWidth: 1180,
    show: false,
    title: "Boreal Desktop",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: join(app.getAppPath(), "dist", "preload", "index.mjs"),
      sandbox: false,
    },
    width: 1480,
  });

  windows.add(window);
  window.on("closed", () => {
    windows.delete(window);
  });
  window.once("ready-to-show", () => {
    window.show();
  });

  await window.loadFile(join(app.getAppPath(), "dist", "renderer", "index.html"));
  return window;
}

function registerIpc(desktopService: DesktopService) {
  ipcMain.handle(IPC_CHANNELS.invoke.getSnapshot, () => desktopService.getSnapshot());
  ipcMain.handle(IPC_CHANNELS.invoke.probeRuntimes, () => desktopService.probeRuntimes());
  ipcMain.handle(IPC_CHANNELS.invoke.registerNode, (_event, input: RegisterNodeInput) =>
    desktopService.registerNode(input),
  );
  ipcMain.handle(
    IPC_CHANNELS.invoke.saveConnectionConfig,
    (_event, input: ConnectionConfigInput) => desktopService.saveConnectionConfig(input),
  );
  ipcMain.handle(IPC_CHANNELS.invoke.setAvailability, (_event, status: AvailabilityStatus) =>
    desktopService.setAvailability(status),
  );
  ipcMain.handle(IPC_CHANNELS.invoke.updatePolicy, (_event, policy: DesktopPolicy) =>
    desktopService.updatePolicy(policy),
  );
  ipcMain.handle(IPC_CHANNELS.invoke.seedDemoAssignments, () =>
    desktopService.seedDemoAssignments(),
  );
  ipcMain.handle(IPC_CHANNELS.invoke.acceptAssignment, (_event, id: string) =>
    desktopService.acceptAssignment(id),
  );
  ipcMain.handle(IPC_CHANNELS.invoke.rejectAssignment, (_event, id: string) =>
    desktopService.rejectAssignment(id),
  );
  ipcMain.handle(IPC_CHANNELS.invoke.startAssignment, (_event, id: string) =>
    desktopService.startAssignment(id),
  );
  ipcMain.handle(IPC_CHANNELS.invoke.waitAssignment, (_event, id: string) =>
    desktopService.waitAssignment(id),
  );
  ipcMain.handle(IPC_CHANNELS.invoke.deliverAssignment, (_event, id: string) =>
    desktopService.deliverAssignment(id),
  );
  ipcMain.handle(IPC_CHANNELS.invoke.failAssignment, (_event, id: string) =>
    desktopService.failAssignment(id),
  );
  ipcMain.handle(IPC_CHANNELS.invoke.clearFinishedAssignments, () =>
    desktopService.clearFinishedAssignments(),
  );
}

async function handleDesktopLaunchUrl(launchUrl: string) {
  pendingLaunchUrls.push(launchUrl);
  focusMainWindow();
  await flushPendingLaunchUrls();
}

async function flushPendingLaunchUrls() {
  if (!service) {
    return;
  }

  while (pendingLaunchUrls.length > 0) {
    const launchUrl = pendingLaunchUrls.shift();

    if (!launchUrl) {
      continue;
    }

    try {
      await service.connectFromLaunchUrl(launchUrl);
    } catch (error) {
      console.error(
        "Boreal Desktop failed to handle the connect launch URL.",
        error,
      );
    }
  }
}

function focusMainWindow() {
  const window = BrowserWindow.getAllWindows()[0];

  if (!window) {
    return;
  }

  if (window.isMinimized()) {
    window.restore();
  }

  if (!window.isVisible()) {
    window.show();
  }

  window.focus();
}

function extractDesktopLaunchUrl(argv: string[]) {
  return (
    argv.find((value) => value.startsWith(`${DESKTOP_PROTOCOL}://`)) ?? null
  );
}

function registerDesktopProtocolClient() {
  if (process.defaultApp) {
    const appEntry = process.argv[1] ? resolve(process.argv[1]) : app.getAppPath();
    app.setAsDefaultProtocolClient(
      DESKTOP_PROTOCOL,
      process.execPath,
      [appEntry],
    );
    return;
  }

  app.setAsDefaultProtocolClient(DESKTOP_PROTOCOL);
}
