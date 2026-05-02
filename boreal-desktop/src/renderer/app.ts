import type {
  AssignmentStatus,
  ConnectionConfigInput,
  DesktopAssignment,
  DesktopEvent,
  DesktopPolicy,
  DesktopSnapshot,
  RuntimeProbe,
} from "../shared/contracts";

type TabKey = "active" | "node" | "queue" | "runtimes" | "policy";

const tabs: Array<{ key: TabKey; label: string }> = [
  { key: "queue", label: "Queue" },
  { key: "active", label: "Active run" },
  { key: "node", label: "Node" },
  { key: "runtimes", label: "Runtimes" },
  { key: "policy", label: "Policy" },
];

let activeTab: TabKey = "queue";
let snapshot: DesktopSnapshot | null = null;
let fatalBootError: string | null = null;

const nav = document.querySelector<HTMLDivElement>("#nav");
const panelTitle = document.querySelector<HTMLHeadingElement>("#panel-title");
const panelBody = document.querySelector<HTMLDivElement>("#panel-body");
const eventFeed = document.querySelector<HTMLDivElement>("#event-feed");
const heroTitle = document.querySelector<HTMLHeadingElement>("#hero-title");
const heroCopy = document.querySelector<HTMLParagraphElement>("#hero-copy");
const notice = document.querySelector<HTMLDivElement>("#notice");

void init();

async function init() {
  if (!nav || !panelTitle || !panelBody || !eventFeed || !heroTitle || !heroCopy || !notice) {
    throw new Error("Renderer shell did not mount.");
  }

  renderNav();
  registerGlobalEvents();
  renderLoadingState();

  try {
    const bridge = readDesktopBridge();
    snapshot = await bridge.getSnapshot();
    fatalBootError = null;
    maybeSwitchToNodeTab(null, snapshot);
    render();
    bridge.subscribe((nextSnapshot) => {
      const previousSnapshot = snapshot;
      snapshot = nextSnapshot;
      fatalBootError = null;
      maybeSwitchToNodeTab(previousSnapshot, nextSnapshot);
      render();
    });
  } catch (error) {
    fatalBootError =
      error instanceof Error
        ? error.message
        : "Desktop renderer could not load the main-process bridge.";
    renderFatalState(fatalBootError);
  }
}

function registerGlobalEvents() {
  document.body.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) {
      return;
    }

    const actionTarget = target.closest<HTMLElement>("[data-action]");
    const action = actionTarget?.dataset.action;
    if (!action) {
      return;
    }

    void handleAction(action, actionTarget?.dataset.assignmentId ?? null);
  });

  nav?.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) {
      return;
    }

    const tabTarget = target.closest<HTMLButtonElement>("button[data-tab]");
    const nextTab = tabTarget?.dataset.tab as TabKey | undefined;
    if (!nextTab) {
      return;
    }

    activeTab = nextTab;
    renderNav();
    render();
  });
}

async function handleAction(action: string, assignmentId: string | null) {
  try {
    const bridge = readDesktopBridge();
    setNotice("Working...", "success");
    if (action === "probe") {
      snapshot = await bridge.probeRuntimes();
    } else if (action === "seed-demo") {
      snapshot = await bridge.seedDemoAssignments();
    } else if (action === "clear-finished") {
      snapshot = await bridge.clearFinishedAssignments();
    } else if (action === "save-policy") {
      snapshot = await bridge.updatePolicy(readPolicyForm());
    } else if (action === "save-connection") {
      snapshot = await bridge.saveConnectionConfig(readConnectionConfig());
    } else if (action === "clear-session") {
      snapshot = await bridge.saveConnectionConfig({
        apiBaseUrl:
          document.querySelector<HTMLInputElement>("#boreal-base-url")?.value.trim() ??
          "http://localhost:3000",
        sessionToken: null,
      });
    } else if (action === "register-node") {
      snapshot = await bridge.registerNode({
        machineLabel: readMachineLabel(),
      });
    } else if (action === "set-availability") {
      const select = document.querySelector<HTMLSelectElement>("#availability-select");
      if (!select) {
        throw new Error("Availability control is missing.");
      }
      snapshot = await bridge.setAvailability(select.value as any);
    } else if (!assignmentId) {
      throw new Error("Assignment action is missing an id.");
    } else if (action === "accept-assignment") {
      snapshot = await bridge.acceptAssignment(assignmentId);
    } else if (action === "reject-assignment") {
      snapshot = await bridge.rejectAssignment(assignmentId);
    } else if (action === "start-assignment") {
      snapshot = await bridge.startAssignment(assignmentId);
    } else if (action === "wait-assignment") {
      snapshot = await bridge.waitAssignment(assignmentId);
    } else if (action === "deliver-assignment") {
      snapshot = await bridge.deliverAssignment(assignmentId);
    } else if (action === "fail-assignment") {
      snapshot = await bridge.failAssignment(assignmentId);
    }

    fatalBootError = null;
    setNotice("Action completed.", "success");
    render();
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Desktop action failed.";
    fatalBootError = fatalBootError ?? null;
    setNotice(message, "error");
    if (!snapshot) {
      renderFatalState(message);
    }
  }
}

function render() {
  if (!panelTitle || !panelBody || !eventFeed || !heroTitle || !heroCopy) {
    return;
  }

  if (!snapshot) {
    if (fatalBootError) {
      renderFatalState(fatalBootError);
    } else {
      renderLoadingState();
    }
    return;
  }

  const active = snapshot.assignments.find((assignment) =>
    ["accepted_by_desktop", "executing_on_desktop", "waiting_for_owner_input"].includes(
      assignment.status,
    ),
  );

  const hero = describeHero(snapshot);
  heroTitle.textContent = hero.title;
  heroCopy.textContent = hero.copy;

  renderEvents(snapshot.events);

  if (activeTab === "queue") {
    panelTitle.textContent = "Assignment queue";
    panelBody.innerHTML = renderQueue(snapshot.assignments);
  } else if (activeTab === "active") {
    panelTitle.textContent = "Active execution";
    panelBody.innerHTML = renderActiveRun(active);
  } else if (activeTab === "node") {
    panelTitle.textContent = "Private node";
    panelBody.innerHTML = renderNode(snapshot);
  } else if (activeTab === "runtimes") {
    panelTitle.textContent = "Runtime probes";
    panelBody.innerHTML = renderRuntimes(snapshot.runtimes);
  } else if (activeTab === "policy") {
    panelTitle.textContent = "Local policy";
    panelBody.innerHTML = renderPolicy(snapshot.policy);
  }
}

function renderNav() {
  if (!nav) {
    return;
  }

  nav.innerHTML = tabs
    .map((tab) => {
      const active = tab.key === activeTab ? "active" : "";
      return `<button class="${active}" data-tab="${tab.key}">${tab.label}</button>`;
    })
    .join("");
}

function renderLoadingState() {
  if (!panelTitle || !panelBody || !eventFeed || !heroTitle || !heroCopy) {
    return;
  }

  heroTitle.textContent = "Loading node state";
  heroCopy.textContent = "Probing local runtimes and restoring queue state.";
  panelTitle.textContent = "Queue";
  panelBody.innerHTML =
    '<div class="empty">Desktop renderer is loading the main-process state bridge.</div>';
  eventFeed.innerHTML = '<div class="empty">No local events yet.</div>';
}

function renderFatalState(message: string) {
  if (!panelTitle || !panelBody || !eventFeed || !heroTitle || !heroCopy) {
    return;
  }

  heroTitle.textContent = "Desktop bridge failed";
  heroCopy.textContent =
    "The static shell loaded, but the renderer could not talk to Electron main.";
  panelTitle.textContent = "Boot diagnostics";
  panelBody.innerHTML = `
    <div class="empty">
      <strong>Renderer boot failed.</strong><br />
      ${escapeHtml(message)}
    </div>
  `;
  eventFeed.innerHTML = '<div class="empty">No local events yet.</div>';
  setNotice(message, "error");
}

function renderNode(state: DesktopSnapshot) {
  const node = state.node;
  const connection = state.connection;
  return `
    <div class="metric-grid">
      ${renderMetric("Health", node.healthStatus, "Derived from registration, runtime health, and queue load.")}
      ${renderMetric("Availability", node.availabilityStatus, "Controls whether new work should route into the node.")}
      ${renderMetric("Capacity", `${node.capacity.activeCount}/${node.capacity.maxConcurrentAssignments}`, "Active assignments against configured concurrency.")}
      ${renderMetric("Queue", `${node.capacity.queuedCount}/${node.capacity.maxQueueDepth}`, "Queued assignments waiting on accept or start.")}
    </div>

    <div class="form-card">
      <div style="margin-bottom: 1rem;">
        <p class="eyebrow">Preferred connect flow</p>
        <p class="assignment-copy">
          Open Boreal web, go to Account settings, then click Connect desktop.
          Boreal will open this app through <code>boreal-desktop://</code>, redeem a short-lived grant,
          and store the Boreal session locally. Manual session paste stays available as a fallback.
        </p>
      </div>
      <div class="field-grid two">
        <label class="field">
          <span>Boreal base URL</span>
          <input id="boreal-base-url" value="${escapeHtml(connection.apiBaseUrl)}" />
          <span class="field-help">Desktop-node register, heartbeat, and assignment sync target.</span>
        </label>
        <label class="field">
          <span>Stored Boreal session</span>
          <input id="boreal-session-token" type="password" placeholder="${connection.hasSessionToken ? "Stored in secure storage" : "Filled by Connect desktop or paste fallback session"}" />
          <span class="field-help">Leave blank to keep the current stored session. Paste only for manual recovery.</span>
        </label>
      </div>
      <div class="field-actions">
        <button data-action="save-connection">Save connection</button>
        ${
          connection.hasSessionToken
            ? '<button data-action="clear-session" class="ghost">Clear stored session</button>'
            : ""
        }
      </div>
      <div class="runtime-meta">
        <div>Connection status: ${connection.status.replace(/_/g, " ")}</div>
        <div>Stored session: ${connection.hasSessionToken ? "yes" : "no"}</div>
        <div>Registered supply id: ${escapeHtml(connection.registeredSupplyId ?? "not yet")}</div>
        <div>Last remote sync: ${formatDate(connection.lastSyncAt)}</div>
        ${connection.lastSyncError ? `<div>Last sync error: ${escapeHtml(connection.lastSyncError)}</div>` : ""}
      </div>
    </div>

    <div class="form-card">
      <div class="field-grid two">
        <label class="field">
          <span>Machine label</span>
          <input id="machine-label" value="${escapeHtml(node.machineLabel)}" />
          <span class="field-help">Owner-facing label for the private desktop node.</span>
        </label>
        <label class="field">
          <span>Availability</span>
          <select id="availability-select">
            ${renderAvailabilityOption(node.availabilityStatus, "available")}
            ${renderAvailabilityOption(node.availabilityStatus, "paused")}
            ${renderAvailabilityOption(node.availabilityStatus, "draining")}
            ${renderAvailabilityOption(node.availabilityStatus, "offline")}
          </select>
          <span class="field-help">Boreal should route only while the node is eligible.</span>
        </label>
      </div>
      <div class="field-actions">
        <button data-action="register-node">${node.hasNodeToken ? "Refresh node" : "Register node"}</button>
        <button data-action="set-availability" class="ghost">Apply availability</button>
      </div>
    </div>

    <div class="runtime-card">
      <div class="runtime-top">
        <div>
          <p class="eyebrow">Desktop identity</p>
          <h4 class="runtime-title">${escapeHtml(node.stableNodeId)}</h4>
        </div>
        <div class="badge-row">
          ${renderBadge(node.hasNodeToken ? "Token stored" : "No token", node.hasNodeToken ? "good" : "warn")}
          ${renderBadge(node.lastHeartbeatAt ? "Heartbeat ticking" : "No heartbeat yet", node.lastHeartbeatAt ? "good" : "warn")}
        </div>
      </div>
      <div class="runtime-meta">
        <div>Registered at: ${formatDate(node.registeredAt)}</div>
        <div>Last heartbeat: ${formatDate(node.lastHeartbeatAt)}</div>
        <div>Build mode: ${state.buildMode.replace(/_/g, " ")}</div>
        <div>Runtime families: ${node.runtimeFamilies.join(", ") || "none detected"}</div>
        <div>Local capability tags: ${node.localCapabilityTags.join(", ") || "none"}</div>
      </div>
    </div>
  `;
}

function renderQueue(assignments: DesktopAssignment[]) {
  if (assignments.length === 0) {
    return `<div class="empty">${
      snapshot?.connection.status === "configured"
        ? "Desktop is connected. Register this machine as a private node to start syncing real assignments."
        : "No assignments yet. Seed the demo queue or wire the Boreal desktop assignment API next."
    }</div>`;
  }

  return `
    <div class="assignment-list">
      ${assignments.map((assignment) => renderAssignment(assignment)).join("")}
    </div>
  `;
}

function renderAssignment(assignment: DesktopAssignment) {
  return `
    <article class="assignment-card">
      <div class="assignment-top">
        <div>
          <p class="eyebrow">${assignment.runtimeFamily} | ${assignment.requestToken}</p>
          <h4 class="assignment-title">${escapeHtml(assignment.title)}</h4>
        </div>
        ${renderStatusBadge(assignment.status)}
      </div>
      <p class="assignment-copy">${escapeHtml(assignment.summary)}</p>
      <div class="assignment-meta">
        <div>Workspace hint: ${escapeHtml(assignment.workspaceHint ?? "none yet")}</div>
        <div>Required capabilities: ${assignment.requiredCapabilities.join(", ") || "none"}</div>
        <div>Output kinds: ${assignment.outputKinds.join(", ")}</div>
        <div>Request-thread callbacks: ${assignment.requestCallbacksEnabled ? "enabled" : "disabled"}</div>
        <div>Evidence bundles: ${assignment.evidenceCount}</div>
        <div>Updated: ${formatDate(assignment.updatedAt)}</div>
        ${assignment.lastError ? `<div>Last error: ${escapeHtml(assignment.lastError)}</div>` : ""}
      </div>
      <div class="assignment-actions">
        ${renderAssignmentActions(assignment)}
      </div>
    </article>
  `;
}

function renderAssignmentActions(assignment: DesktopAssignment) {
  const id = assignment.id;
  if (assignment.status === "queued_for_desktop") {
    return `
      <button class="small" data-action="accept-assignment" data-assignment-id="${id}">Accept</button>
      <button class="small ghost" data-action="reject-assignment" data-assignment-id="${id}">Reject</button>
    `;
  }

  if (assignment.status === "accepted_by_desktop") {
    return `
      <button class="small" data-action="start-assignment" data-assignment-id="${id}">Start run</button>
      <button class="small ghost" data-action="wait-assignment" data-assignment-id="${id}">Need owner input</button>
    `;
  }

  if (assignment.status === "waiting_for_owner_input") {
    return `
      <button class="small" data-action="start-assignment" data-assignment-id="${id}">Resume run</button>
      <button class="small ghost" data-action="fail-assignment" data-assignment-id="${id}">Fail</button>
    `;
  }

  if (assignment.status === "executing_on_desktop") {
    return `
      <button class="small" data-action="deliver-assignment" data-assignment-id="${id}">Deliver</button>
      <button class="small ghost" data-action="fail-assignment" data-assignment-id="${id}">Fail</button>
    `;
  }

  return `<span class="badge">${assignment.status.replace(/_/g, " ")}</span>`;
}

function renderActiveRun(active: DesktopAssignment | undefined) {
  if (!active) {
    return `<div class="empty">No active assignment. Accept one queued item or seed the demo queue.</div>`;
  }

  return `
    <div class="active-card">
      <div class="assignment-top">
        <div>
          <p class="eyebrow">Current desktop run</p>
          <h4 class="assignment-title">${escapeHtml(active.title)}</h4>
        </div>
        ${renderStatusBadge(active.status)}
      </div>
      <p class="assignment-copy">${escapeHtml(active.summary)}</p>
      <div class="assignment-meta">
        <div>Runtime family: ${active.runtimeFamily}</div>
        <div>Workspace hint: ${escapeHtml(active.workspaceHint ?? "none yet")}</div>
        <div>Accept by: ${formatDate(active.acceptByAt)}</div>
        <div>Required capabilities: ${active.requiredCapabilities.join(", ") || "none"}</div>
        <div>Output kinds: ${active.outputKinds.join(", ")}</div>
        <div>Request-thread callbacks: ${active.requestCallbacksEnabled ? "enabled" : "disabled"}</div>
      </div>
      <div class="assignment-actions">
        ${renderAssignmentActions(active)}
      </div>
    </div>
  `;
}

function renderRuntimes(runtimes: RuntimeProbe[]) {
  if (runtimes.length === 0) {
    return `<div class="empty">Run the local probe to populate Codex and QVAC availability.</div>`;
  }

  return `
    <div class="runtime-grid">
      ${runtimes
        .map((runtime) => {
          return `
            <article class="runtime-card">
              <div class="runtime-top">
                <div>
                  <p class="eyebrow">${runtime.family}</p>
                  <h4 class="runtime-title">${runtime.command ?? "Not detected"}</h4>
                </div>
                <div class="runtime-badges">
                  ${renderBadge(runtime.availability, runtime.availability === "available" ? "good" : "warn")}
                  ${renderBadge(runtime.authState.replace(/_/g, " "), runtime.authState === "authenticated" || runtime.authState === "not_required" ? "good" : "warn")}
                </div>
              </div>
              <p class="runtime-copy">${escapeHtml(runtime.path ?? "Command path not found on this machine.")}</p>
              <div class="runtime-meta">
                <div>Version: ${escapeHtml(runtime.version ?? "unknown")}</div>
                <div>Checked: ${formatDate(runtime.lastCheckedAt)}</div>
                <div>Job types: ${runtime.supportedJobTypes.join(", ")}</div>
                <div>Notes: ${runtime.notes.map((note) => escapeHtml(note)).join(" | ") || "none"}</div>
              </div>
            </article>
          `;
        })
        .join("")}
    </div>
  `;
}

function renderPolicy(policy: DesktopPolicy) {
  return `
    <div class="form-card">
      <div class="field-grid">
        <label class="field">
          <span>Allowed workspace roots</span>
          <textarea id="policy-roots">${escapeHtml(policy.allowedWorkspaceRoots.join("\n"))}</textarea>
          <span class="field-help">One path per line. Desktop runs should stay inside these roots by default.</span>
        </label>
        <label class="field">
          <span>Max task duration in minutes</span>
          <input id="policy-max-duration" type="number" min="5" value="${policy.maxTaskDurationMinutes}" />
        </label>
      </div>
    </div>

    <div class="capability-grid">
      ${Object.entries(policy.capabilities)
        .map(([key, enabled]) => {
          return `
            <label class="checkbox">
              <input type="checkbox" id="capability-${key}" ${enabled ? "checked" : ""} />
              <span>
                <strong>${key.replace(/_/g, " ")}</strong>
                <span class="field-help">Local gate for ${key.replace(/_/g, " ")}.</span>
              </span>
            </label>
          `;
        })
        .join("")}
    </div>

    <div class="field-actions" style="margin-top: 1rem;">
      <button data-action="save-policy">Save policy</button>
    </div>
  `;
}

function renderEvents(events: DesktopEvent[]) {
  if (!eventFeed) {
    return;
  }

  if (events.length === 0) {
    eventFeed.innerHTML = `<div class="empty">No local events yet.</div>`;
    return;
  }

  eventFeed.innerHTML = events
    .map((event) => {
      return `
        <article class="event-card">
          <div class="event-top">
            <h4 class="event-title">${escapeHtml(event.title)}</h4>
            ${renderBadge(event.tone, toneToBadge(event.tone))}
          </div>
          <p class="event-detail">${escapeHtml(event.detail)}</p>
          <div class="event-time">${formatDate(event.occurredAt)}</div>
        </article>
      `;
    })
    .join("");
}

function maybeSwitchToNodeTab(
  previousSnapshot: DesktopSnapshot | null,
  nextSnapshot: DesktopSnapshot,
) {
  const justConnected =
    previousSnapshot?.connection.status !== nextSnapshot.connection.status &&
    nextSnapshot.connection.status === "configured";
  const hasNoQueue = nextSnapshot.assignments.length === 0;

  if (
    nextSnapshot.connection.status === "configured" &&
    !nextSnapshot.node.hasNodeToken &&
    (justConnected || hasNoQueue)
  ) {
    activeTab = "node";
    renderNav();
  }
}

function describeHero(state: DesktopSnapshot) {
  if (state.connection.status === "configured" && !state.node.hasNodeToken) {
    return {
      copy:
        "Boreal Desktop is connected to your Boreal account. Register this machine next to create the private desktop node and start syncing assignments.",
      title: "Desktop connected",
    };
  }

  if (state.connection.status === "error") {
    return {
      copy:
        "Desktop has a stored Boreal session, but the last sync failed. Open the Node tab to inspect the error and retry registration or heartbeat.",
      title: "Desktop needs attention",
    };
  }

  if (state.node.hasNodeToken) {
    return {
      copy:
        state.connection.status === "connected"
          ? "Boreal Desktop is registered as a private execution node, syncing heartbeats and assignments into the same Boreal request lifecycle."
          : "Desktop state is ready locally. Use Boreal web account settings to connect this app, then register or refresh the private node.",
      title: `${state.node.machineLabel} | ${state.node.healthStatus}`,
    };
  }

  return {
    copy:
      "Connect this app from Boreal web account settings, then register the private desktop node and probe runtimes.",
    title: "Desktop node not registered yet",
  };
}

function renderMetric(title: string, value: string, copy: string) {
  return `
    <article class="metric-card">
      <p class="eyebrow">${title}</p>
      <p class="metric-value">${escapeHtml(value)}</p>
      <p class="metric-copy">${escapeHtml(copy)}</p>
    </article>
  `;
}

function renderAvailabilityOption(current: string, value: string) {
  return `<option value="${value}" ${current === value ? "selected" : ""}>${value}</option>`;
}

function renderStatusBadge(status: AssignmentStatus) {
  if (status === "executing_on_desktop" || status === "delivered_by_desktop") {
    return renderBadge(status.replace(/_/g, " "), "good");
  }
  if (status === "failed_on_desktop" || status === "rejected_by_desktop") {
    return renderBadge(status.replace(/_/g, " "), "danger");
  }
  return renderBadge(status.replace(/_/g, " "), "warn");
}

function renderBadge(label: string, tone: "danger" | "good" | "warn" | "") {
  return `<span class="badge ${tone}">${escapeHtml(label)}</span>`;
}

function toneToBadge(tone: DesktopEvent["tone"]): "danger" | "good" | "warn" | "" {
  if (tone === "success") {
    return "good";
  }
  if (tone === "error") {
    return "danger";
  }
  if (tone === "warn") {
    return "warn";
  }
  return "";
}

function readMachineLabel() {
  return document.querySelector<HTMLInputElement>("#machine-label")?.value.trim() ?? "";
}

function readConnectionConfig(): ConnectionConfigInput {
  const sessionToken =
    document.querySelector<HTMLInputElement>("#boreal-session-token")?.value.trim() ?? "";

  return {
    apiBaseUrl:
      document.querySelector<HTMLInputElement>("#boreal-base-url")?.value.trim() ??
      "http://localhost:3000",
    sessionToken: sessionToken.length > 0 ? sessionToken : undefined,
  };
}

function readDesktopBridge() {
  if (
    typeof window.borealDesktop !== "object" ||
    window.borealDesktop === null
  ) {
    throw new Error(
      "Boreal Desktop preload bridge is missing. Restart the Electron app after rebuilding.",
    );
  }

  return window.borealDesktop;
}

function readPolicyForm(): DesktopPolicy {
  return {
    allowedWorkspaceRoots:
      document
        .querySelector<HTMLTextAreaElement>("#policy-roots")
        ?.value.split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean) ?? [],
    capabilities: {
      browser_automation: readCheckbox("capability-browser_automation"),
      filesystem_read: readCheckbox("capability-filesystem_read"),
      filesystem_write: readCheckbox("capability-filesystem_write"),
      git_read: readCheckbox("capability-git_read"),
      git_write: readCheckbox("capability-git_write"),
      long_running_tasks: readCheckbox("capability-long_running_tasks"),
      network_egress: readCheckbox("capability-network_egress"),
      shell: readCheckbox("capability-shell"),
    },
    maxTaskDurationMinutes: Number(
      document.querySelector<HTMLInputElement>("#policy-max-duration")?.value ?? 45,
    ),
  };
}

function readCheckbox(id: string) {
  return document.querySelector<HTMLInputElement>(`#${id}`)?.checked ?? false;
}

function setNotice(message: string, tone: "error" | "success") {
  if (!notice) {
    return;
  }
  notice.textContent = message;
  notice.className = `notice ${tone}`;
  window.setTimeout(() => {
    if (notice.textContent === message) {
      notice.className = "notice hidden";
      notice.textContent = "";
    }
  }, 2400);
}

function formatDate(value: string | null) {
  if (!value) {
    return "Not yet";
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
