# Boreal Desktop V1

Status: target architecture note plus implementation handoff.  As of May 2, 2026, Boreal Desktop is partially implemented: the Electron app now exists under `boreal-desktop/`, Boreal has private owner-only desktop-node APIs under `/api/v1/desktop-nodes`, signed-in `/account` can launch a real `Connect desktop` flow through `/api/account/desktop-connect` plus `/api/v1/desktop-connect/redeem`, the signed-in web request `Team` tab can queue work into a linked private desktop node through `/api/requests/[intentId]/desktop`, and the app can register, heartbeat, and sync assignments with the owner's Bearer session.  Boreal's more mature shipped local-runtime path is still the request-scoped invite flow plus the bridge-helper family documented in `CONNECT_AGENT_GUIDE.md` and `HERMES_CONNECT_QUICKSTART.md`, and full automatic routing, richer web operator UX, and public-request callback parity are still unfinished.

## Purpose

Boreal Desktop should productize Boreal's local execution path as a real owner-owned node, not a localhost hack.

V1 should be a Windows-first Electron app that:

- signs into the same Boreal account as the web app
- registers one persistent private desktop execution node in Boreal
- accepts qualifying assigned work without a per-request manual invite
- runs that work locally through distinct Codex and QVAC runtime adapters
- reports status, evidence, artifacts, and delivery back into the same Boreal request thread

The Boreal web app remains the front door and system of record for:

- market discovery
- request creation
- routing
- payment and payout state
- team participation
- audit log and thread history

## Product Truth Boundary

### Live now

- request-scoped localhost runtime invite from active request `Team` and `Market`
- signed-in request owner can queue an active request into a linked private Boreal Desktop node from the `Team` tab
- Boreal-owned direct specialists
- connected-runtime request callbacks for `status`, `evidence`, and `heartbeat`
- Hermes, Ollama, LM Studio, and generic local-model bridge helpers

### Not live yet

- automatic routing into the private desktop node without an owner click
- full desktop assignment accept or execute or delivery lifecycle reflected back for normal public request threads
- richer Windows Electron operator UX across logs, artifacts, and delivery review
- first-class local Codex runtime ownership inside Boreal
- first-class local QVAC runtime ownership inside Boreal

Boreal Desktop must stay clearly on the `not live yet` side until the app, supply model, routing rules, and lifecycle verification all exist.

## V1 Defaults

- Platform: Windows first
- Desktop shell: Electron
- Visibility: owner-only private supply
- Node count: one primary node per owner account in V1
- Runtime families: `codex` and `qvac`
- Routing model: Boreal web routes to the desktop node only when the node is eligible and the request class fits the node policy
- Capacity default: `1` active assignment
- Accept model: explicit accept or reject before execution
- System of record: Boreal request thread, not the desktop app

## Product Model

### Core nouns

- `Boreal Desktop`: the Windows app
- `desktop node`: the owner-owned private execution node registered by the app
- `runtime family`: one local execution stack inside the node, initially `codex` or `qvac`
- `desktop assignment`: one request-to-node execution handoff with accept, run, and delivery state

### Core flow

1. The owner signs into Boreal Desktop with the same Boreal identity used on the web app.
2. The desktop app registers or refreshes one private desktop-node supply record in Boreal.
3. Boreal routes eligible work to that node without requiring a per-request localhost invite.
4. The desktop app polls for queued assignments, then accepts or rejects them explicitly.
5. The selected local runtime executes with the local policy and workspace limits applied by the desktop app.
6. The desktop app posts progress, evidence, artifacts, and final delivery into the same Boreal request thread.

## Product Rules

### Boreal web stays canonical

Desktop is an execution participant.  It does not replace:

- request creation
- proposal or payment state
- payout readiness
- thread history
- team membership truth

### Desktop is private infrastructure

The node should reuse Boreal supply primitives internally, but V1 should not expose it:

- in public search
- in `/agents`
- in general supplier discovery
- as a public market offer

### Codex and QVAC stay separate

Do not collapse them into one generic `AI runtime`.

- `codex` handles code and complex machine tasks through the owner's local Codex auth and machine context.
- `qvac` handles private local inference, embeddings, transcription, OCR, and future private-document retrieval.

## Proposed Repo Layout

Create a new root workspace:

```text
boreal-desktop/
  package.json
  electron-builder.yml
  tsconfig.json
  src/
    main/
      app.ts
      auth/
      node-registration/
      assignment-sync/
      runtimes/
        codex/
        qvac/
      artifacts/
      policy/
      store/
    preload/
      index.ts
    renderer/
      app/
      components/
      routes/
      state/
    shared/
      ipc/
      contracts/
      types/
```

Keep the privilege split hard:

- `main`: filesystem, process launch, secure storage, runtime adapters, assignment sync
- `renderer`: queue, status, logs, approvals, policy controls, artifact review
- `preload`: typed IPC surface only
- `shared`: request and IPC types shared across both sides

Do not let the renderer call shell, filesystem, or runtime processes directly.

## Boreal Web And Data Model Changes

### Canonical supply shape

Boreal Desktop should still upsert a canonical `supplies` row so routing, request participation, and future analytics reuse the same market backbone.

Recommended canonical row:

- `actorKind=agent`
- `supplyType=capability`
- `marketKind=private_execution_node`
- `executionSurface=desktop`
- `status=active` or `paused`
- `visibility=private`
- `supportsDirectInvoke=false`
- `availabilityStatus`
- `maxConcurrentJobs`
- `capabilityTags`
- `outputTypes`
- `isPrivateOperatorNode=true`

This row exists for routing and request participation, not public listing.

### New subtype tables

### `supplyDesktopNodes`

Use a dedicated subtype for node-specific metadata that should not be stuffed into generic runtime rows.

```ts
type SupplyDesktopNodeRecord = {
  supplyId: Id<"supplies">;
  ownerUserId: string;
  createdAt: number;
  updatedAt: number;
  stableNodeId: string;
  machineLabel: string;
  osFamily: "windows";
  osVersion: string | null;
  appVersion: string | null;
  runtimeFamilies: Array<"codex" | "qvac">;
  isPrivateOperatorNode: true;
  nodeHealthStatus: "active" | "idle" | "busy" | "offline" | "degraded";
  availabilityStatus: "available" | "paused" | "draining" | "offline";
  capacityPolicy: {
    maxConcurrentAssignments: number;
    maxQueueDepth: number;
    acceptBySeconds: number;
  };
  localCapabilityTags: string[];
  policyVersion: number;
  policySnapshotJson: string;
  lastHeartbeatAt: number | null;
  lastSeenAt: number | null;
  lastAssignmentAt: number | null;
}
```

Indexes:

- `by_supplyId`
- `by_ownerUserId`
- `by_stableNodeId`
- `by_nodeHealthStatus_and_lastHeartbeatAt`

### `desktopAssignments`

Represent the node-specific claim and execution lifecycle without inventing a parallel public job system.

```ts
type DesktopAssignmentRecord = {
  assignmentId: string;
  supplyId: Id<"supplies">;
  requestId: Id<"requests">;
  requestToken: string;
  ownerUserId: string;
  runtimeFamily: "codex" | "qvac";
  status:
    | "queued_for_desktop"
    | "accepted_by_desktop"
    | "executing_on_desktop"
    | "waiting_for_owner_input"
    | "delivered_by_desktop"
    | "failed_on_desktop"
    | "rejected_by_desktop"
    | "expired";
  workspaceRef: string | null;
  localRunId: string | null;
  createdAt: number;
  updatedAt: number;
  acceptByAt: number | null;
  acceptedAt: number | null;
  rejectedAt: number | null;
  deliveredAt: number | null;
  failedAt: number | null;
  lastHeartbeatAt: number | null;
  lastErrorSummary: string | null;
  requestSummaryJson: string;
}
```

Indexes:

- `by_supplyId_and_status`
- `by_requestId`
- `by_ownerUserId_and_createdAt`
- `by_acceptByAt`

### `supplyAgentRuntimes`

Keep using the existing connected-runtime adjunct for per-runtime descriptors, but let Boreal Desktop write one row per runtime family.

Recommended `runtimeMetadataJson` for desktop-backed rows:

- runtime family
- executable path or endpoint hint
- detected version
- auth state
- supported job kinds
- model or profile label
- last probe result

## Availability and heartbeat

Reuse `supplyAvailabilitySnapshots` for quick routing reads.

Desktop heartbeats should write:

- `availabilityStatus`
- `activeReservations`
- `queueDepth`
- `openAssignments`
- `heartbeatAt`
- `source=runtime`

## API Contracts

Desktop-node routes should be private operator APIs under a dedicated route family:

- `GET /api/v1/desktop-nodes`
- `POST /api/v1/desktop-nodes/register`
- `POST /api/v1/desktop-nodes/heartbeat`
- `GET /api/v1/desktop-nodes/assignments`
- `POST /api/v1/desktop-nodes/assignments`
- `POST /api/v1/desktop-nodes/assignments/{assignmentId}/accept`
- `POST /api/v1/desktop-nodes/assignments/{assignmentId}/reject`
- `POST /api/v1/desktop-nodes/assignments/{assignmentId}/status`
- `DELETE /api/v1/desktop-nodes/assignments/{assignmentId}/status`

Request-thread callbacks should keep reusing existing Boreal request routes:

- `POST /api/v1/requests/{requestToken}/status`
- `POST /api/v1/requests/{requestToken}/evidence`
- `POST /api/v1/requests/{requestToken}/heartbeat`
- `POST /api/v1/requests/{requestToken}/deliver`

### Auth model

The desktop app should not reuse a browser cookie blindly.

Current implemented split:

1. owner signs into Boreal web and links a Solana mainnet wallet to the same Boreal account
2. signed-in `/account` mints a short-lived desktop connect grant and launches `boreal-desktop://connect`
3. Electron redeems that grant at `/api/v1/desktop-connect/redeem` and stores the returned Boreal Bearer session in main-process secure storage
4. register, heartbeat, and assignment calls use that owner Bearer session over the private desktop-node route family
5. future hardening can replace the owner session with a narrower desktop-scoped connector token once the web onboarding and token-claim UX exist

This keeps long-lived node traffic out of browser cookies today, while still leaving room for a tighter desktop-specific token later.

### Registration payload

```json
{
  "stableNodeId": "desktop-node-01",
  "machineLabel": "Rald-PC",
  "osFamily": "windows",
  "osVersion": "11",
  "runtimeFamilies": ["codex", "qvac"],
  "availabilityStatus": "available",
  "capacityPolicy": {
    "maxConcurrentAssignments": 1,
    "maxQueueDepth": 3,
    "acceptBySeconds": 300
  },
  "localCapabilityTags": [
    "code_execution",
    "repo_analysis",
    "local_filesystem",
    "transcription",
    "ocr"
  ],
  "policySnapshot": {
    "allowedWorkspaceRoots": ["C:\\\\Users\\\\raldb"],
    "allowShell": false,
    "allowGitWrite": false,
    "allowBrowserAutomation": false,
    "allowNetworkEgress": true
  },
  "runtimeDescriptors": [
    {
      "runtimeFamily": "codex",
      "availability": "available",
      "authState": "authenticated",
      "version": "local"
    },
    {
      "runtimeFamily": "qvac",
      "availability": "missing",
      "authState": "not_required",
      "version": null
    }
  ]
}
```

Response should include:

- `nodeToken`
- `supplyId`
- `assignmentPollIntervalMs`
- `heartbeatIntervalMs`
- `offlineAfterMs`

Recommended defaults:

- assignment poll: `10000`
- heartbeat: `30000`
- offline after missed heartbeats: `90000`

### Assignment payload

Desktop should receive a bounded execution payload, not a copy of the full request database shape.

Required fields:

- `assignmentToken`
- `requestToken`
- `requestTitle`
- `requestSummary`
- `runtimeFamily`
- `workspaceRequirement`
- `allowedOutputKinds`
- `policySnapshot`
- `callbackUrls`
- `acceptByAt`

If a request needs a local repo and no `workspaceRequirement` can be resolved automatically, the assignment should still be created but must start in `waiting_for_owner_input` after accept until the owner maps a local workspace.

## Routing Rules

Route to Boreal Desktop only when all of these are true:

- owner has registered an active desktop node
- node availability is `available`
- queue depth and concurrency allow one more assignment
- request class matches one supported runtime family
- required local capabilities are enabled by node policy
- request is owner-routable and not a public market request meant for third-party suppliers

Initial routing fit:

- Codex: code changes, repo analysis, debugging, local build or test work, artifact packaging
- QVAC: local inference, embeddings, transcription, OCR, private document processing

Do not route:

- public market work intended for outside suppliers
- requests that require a disabled local capability
- work that implies silent wallet custody or uncontrolled browser automation

## Assignment Lifecycle

### Node states

- `active`
- `idle`
- `busy`
- `offline`
- `degraded`

### Assignment states

- `queued_for_desktop`
- `accepted_by_desktop`
- `executing_on_desktop`
- `waiting_for_owner_input`
- `delivered_by_desktop`
- `failed_on_desktop`
- `rejected_by_desktop`
- `expired`

### State rules

1. Boreal creates `queued_for_desktop`.
2. Desktop accepts or rejects before `acceptByAt`.
3. Accept moves to `accepted_by_desktop`, then `executing_on_desktop` when the runtime starts.
4. Missing local workspace or blocked capability moves to `waiting_for_owner_input`.
5. Final request delivery moves to `delivered_by_desktop`.
6. Runtime or policy failure moves to `failed_on_desktop`.
7. No response before deadline moves to `expired`, then Boreal should reopen normal routing or hand the choice back to the owner.

## Codex Runtime Adapter

Codex must run on the owner's machine, with the owner's local auth and filesystem access.

### Detection

- probe configured executable path first
- fall back to `codex` or `codex.cmd` on `PATH`
- probe version and auth health without reading or transmitting raw auth secrets

### Execution model

The main process should:

1. build a bounded task payload from the request
2. choose a workspace root from approved local mappings
3. write one local run directory for logs and generated artifacts
4. launch Codex as a subprocess
5. stream stdout and stderr into the desktop log pane
6. push request status and evidence callbacks into Boreal
7. attach final artifacts and delivery back into the same request thread

### Codex-scoped job types

- repo analysis
- implementation
- debugging
- local build or test execution
- artifact generation
- optional browser or shell usage only when policy permits

### Codex non-goals in V1

- Boreal-hosted Codex service
- shared or multi-tenant Codex auth
- arbitrary machine-wide unattended execution outside the approved policy

## QVAC Runtime Adapter

QVAC should be a separate runtime family with its own health, capability disclosure, and execution policy.

### Supported V1 QVAC job types

- local chat or completion
- embeddings
- transcription
- OCR
- optional private-document retrieval support when local indexing is enabled

### QVAC execution rules

- if QVAC is not installed or not healthy, the node still registers but excludes `qvac` work from routing
- QVAC runs should write evidence and outputs back into the same request thread
- QVAC-generated files such as transcripts or OCR bundles should attach as request artifacts, not remain desktop-only

## Renderer to Main IPC

All privileged actions must cross typed IPC.

Recommended IPC surface:

- `desktop.getNodeState`
- `desktop.registerNode`
- `desktop.setAvailability`
- `desktop.listAssignments`
- `desktop.acceptAssignment`
- `desktop.rejectAssignment`
- `desktop.cancelAssignment`
- `runtime.probeAll`
- `runtime.launchCodexJob`
- `runtime.launchQvacJob`
- `runtime.stopJob`
- `runtime.streamLogs`
- `artifacts.list`
- `artifacts.attachToRequest`
- `policy.get`
- `policy.update`
- `workspace.listMappings`
- `workspace.setMapping`

The preload layer should expose only typed methods and event streams.  No raw `ipcRenderer.send` usage in the renderer.

## Local Policy Model

V1 should be deny-by-default for dangerous capabilities until the owner enables them.

### Policy categories

- shell access
- filesystem read scope
- filesystem write scope
- git read
- git write
- browser automation
- outbound network access
- long-running background tasks

### Recommended stored policy shape

```ts
type DesktopPolicy = {
  allowedWorkspaceRoots: string[];
  allowShell: boolean;
  allowFilesystemWrite: boolean;
  allowGitRead: boolean;
  allowGitWrite: boolean;
  allowBrowserAutomation: boolean;
  allowNetworkEgress: boolean;
  allowLongRunningTasks: boolean;
  maxTaskDurationMinutes: number;
}
```

### Security rules

- store node token and any desktop-specific refresh secret in Windows-backed secure storage
- keep all privileged execution in the main process
- never expose raw machine paths or secrets to Boreal unless the request or artifact explicitly needs them
- require explicit owner enablement before shell, write, git-write, or browser automation runs
- log blocked policy decisions back into the desktop UI and Boreal request thread when they affect delivery

## Desktop UX

V1 should stay utilitarian.

Primary surfaces:

- node status header
- assignment queue
- active execution panel
- runtime health and controls
- logs and evidence stream
- artifact review and submit
- availability and policy settings

Recommended renderer tabs:

- `Queue`
- `Active run`
- `Runtimes`
- `Artifacts`
- `Policy`
- `Settings`

Do not rebuild Boreal discovery, checkout, or the full market inside the desktop app.

## Web UX Changes

### Account and operator surfaces

Add an owner-only desktop section, likely under `/account`, that shows:

- desktop node registered or not
- machine label
- runtime families
- node health
- availability
- current capacity and queue depth
- last heartbeat

### Request thread

When a desktop node owns execution, the request thread should show:

- `Boreal Desktop`
- machine label
- runtime badge such as `Codex` or `QVAC`
- explicit status transitions from the desktop assignment lifecycle

Do not present the node as a generic public supplier card.

### Routing and team display

If the request is assigned to the desktop node, the `Team` or execution area should render it as one execution participant with a private-node badge.

## Implementation Sequence

### Phase 1: schema and contracts

- add `executionSurface=desktop`
- add `marketKind=private_execution_node`
- add `supplyDesktopNodes`
- add `desktopAssignments`
- add private desktop-node API routes
- wire request-thread callback reuse

### Phase 2: Electron shell

- scaffold `boreal-desktop/`
- add secure auth storage
- add typed IPC layer
- add renderer queue and settings shells

### Phase 3: registration and lifecycle

- register or refresh one private node
- heartbeat into Boreal
- poll assignments
- accept or reject assignments
- show state in web and desktop UI

### Phase 4: Codex runtime

- detect local Codex
- probe auth and health
- run one bounded code task
- stream logs and attach artifacts

### Phase 5: QVAC runtime

- detect local QVAC
- run one local inference or utility task
- attach evidence and artifacts

### Phase 6: hardening

- policy enforcement
- queue and timeout behavior
- richer health states
- regression coverage

## Verification Plan

### Product and lifecycle

- desktop node registers as one private persistent supply
- Boreal web shows the node only to the owner
- Boreal can queue work to the node without a per-request local invite
- desktop can accept, execute, and deliver in the same request thread

### Codex path

- desktop detects Codex availability and local auth health
- one scoped code task can run locally and return progress plus delivery
- Codex failure becomes a Boreal request-thread failure event, not a silent local log only

### QVAC path

- desktop detects QVAC health
- QVAC can run one inference task and one utility task such as transcription or OCR
- QVAC artifacts attach back into the request thread

### Policy and security

- disabled shell or write access blocks execution before runtime launch
- blocked capability decisions surface in the desktop UI and request thread
- node token stays in secure local storage
- renderer cannot trigger privileged actions without IPC

### Regression

- existing request-scoped localhost invite flow keeps working
- built-in specialists remain unchanged
- one-request, one-inbox, collective, and preset-room flows are unaffected unless a request is explicitly routed to the desktop node

## Explicit Non-Goals

- public market listing for the desktop node
- full Boreal web parity inside Electron
- Vercel-hosted or shared Codex execution
- silent wallet custody or hidden Solana signing
- blanket machine control without owner policy gates
- collapsing Codex and QVAC into one generic runtime

## Acceptance Bar For Claiming V1

Do not call Boreal Desktop V1 shipped until all of these are true:

- Windows Electron app exists and signs into Boreal
- one persistent private node registers successfully
- Boreal routes at least one request into that node without manual local invite
- Codex completes one bounded code task end to end
- QVAC completes one bounded local utility task end to end
- request-thread status, evidence, and delivery stay canonical in Boreal
- local policy gates block disabled capabilities before execution
