# Swarm Workspace Spec

Status: implementation spec for Boreal's request-side collaboration UX and the later libp2p upgrade path.

Last updated: April 27, 2026

## 1. Purpose

This spec defines how Boreal should present multi-party collaboration without confusing the current product surface.

The immediate problem is naming.  Boreal already has:

- a right-side `Discovery` rail
- a request-side tab labeled `Workspace`
- several internal panels labeled `Matching workspace`, `Proposal workspace`, and `Delivery workspace`

That language is too muddy for users and too weak for the later libp2p collaboration layer.

This spec fixes the information architecture first, then defines how the future live collaboration mode should work.

## 2. Naming rules

These names should be treated as product rules.

### 2.1 Current request shell

- `Chat`
  The request conversation thread.
- `Activity`
  The lifecycle and event timeline.
- `Team`
  The current participants and collaborator entry path.
- `Workboard`
  The structured execution surface for matching, proposals, approvals, delivery, and attached artifacts.

### 2.2 Right rail

- `Discovery`
  The browse and search rail for `Offers` and `Requests`.

This is not a workspace.

### 2.3 Future live collaboration mode

- `Swarm Workspace`
  The realtime collaboration upgrade for selected requests.

This is not the default request tab.  It is a richer live mode opened when a request actually needs realtime human-plus-agent coordination.

## 3. Core UX decision

Do not add more top-level request tabs in phase 1.

The request shell should remain:

- `Chat`
- `Activity`
- `Team`
- `Workboard`

The `Swarm Workspace` should first ship as a mode or session opened from inside `Workboard`, not as a permanent peer tab beside `Chat`.

Reason:

- the current default request flow is still mostly matching, proposals, approvals, and delivery
- always-visible `Live` or `Swarm` tabs would add noise to simple requests
- most requests do not need a paid realtime collaboration layer

## 4. Product model

There are now two different request-side surfaces:

### 4.1 Workboard

The default structured work surface for a request.

It should contain:

- matching
- proposal drafting or review
- delivery submission
- attached artifacts
- next actions
- state summaries

It is durable, auditable, and Convex-backed.

### 4.2 Swarm Workspace

The live collaboration session for harder requests.

It should contain:

- realtime presence
- assignments
- short live updates
- shared notes
- artifacts and evidence
- validator or reviewer lane when needed

It is a premium upgrade path, not the default for every request.

## 5. Entry conditions for Swarm Workspace

A request should not open a live collaboration session by default.

Open or offer `Swarm Workspace` only when one or more are true:

- multiple accepted collaborators exist
- one or more external agents are actively attached
- the request is decomposed into parallel subtasks
- the owner pays for realtime coordination
- a validator or reviewer lane is required
- the request is explicitly marked as complex or multi-stage

Simple requests should stay in the ordinary request shell.

## 6. Phase 1 user flow

### 6.1 Default request

1. User submits request in chat.
2. Boreal creates request.
3. Request opens with `Chat / Activity / Team / Workboard`.
4. `Workboard` handles matching, proposals, approvals, delivery, and attached evidence.

### 6.2 Upgrade path

When the request qualifies for live coordination, show a card at the top of `Workboard`:

- `Swarm Workspace available`
- `3 collaborators ready`
- `1 agent connected`
- `Open live session`

This card should explain why the upgrade exists and what the owner gets.

### 6.3 Live session open

Clicking `Open live session` should open:

- a full-screen mode
- or a very large dialog / dedicated route

Do not cram the live session into a small nested card under the normal `Workboard`.

## 7. Live session layout

The first useful Swarm Workspace layout should be:

- left rail: session outline, assignments, files
- center: live feed and shared notes
- right rail: participants, presence, status, validator lane

Minimum visible data:

- who is here now
- role of each participant
- active tasks
- blockers
- newly attached artifacts
- last validated state

This must feel like a virtual operations room, not a chat transcript with extra badges.

## 8. Data model split

### 8.1 Convex remains the system of record

Convex should own:

- request
- participants
- assignments
- artifacts
- approvals
- delivery state
- payout state
- snapshots
- audit history

### 8.2 libp2p is the live coordination plane

libp2p should own:

- presence
- peer discovery
- live event propagation
- low-latency coordination messages
- optional media or peer channels when needed

### 8.3 Rule

libp2p is for liveness.
Convex is for truth.

Do not make libp2p the only storage layer for request-critical state.

## 9. Suggested schema additions

These can start in Convex even before libp2p ships.

### 9.1 `swarmWorkspaces`

- `requestId`
- `status` = `idle | available | active | paused | closed`
- `openedAt`
- `openedBy`
- `pricingTier`
- `liveSessionId`
- `taskCount`
- `activeParticipantCount`
- `validatorEnabled`

### 9.2 `swarmAssignments`

- `workspaceId`
- `requestId`
- `title`
- `description`
- `ownerParticipantId`
- `status` = `todo | doing | blocked | done`
- `dependsOn`
- `artifactIds`

### 9.3 `swarmPresence`

- `workspaceId`
- `participantId`
- `status` = `online | idle | offline`
- `lastSeenAt`
- `runtimeKind` = `human | agent`
- `sessionPeerId`

### 9.4 `swarmEvents`

- `workspaceId`
- `requestId`
- `type`
- `actorId`
- `body`
- `createdAt`
- `source` = `convex | libp2p-bridge | system`

## 10. UI implementation phases

### Phase A: naming cleanup

- relabel request tabs to `Chat / Activity / Team / Workboard`
- keep right rail as `Discovery`
- remove nested `workspace` wording inside `Workboard` sections
- sync docs and route copy

### Phase B: dormant workboard upgrade model

- add `Swarm Workspace available` card inside `Workboard`
- add `available` and `active` workspace states
- add request-level assignment and readiness summaries

### Phase C: live session shell

- build fullscreen `Swarm Workspace`
- render presence, tasks, notes, and artifacts
- use Convex-only state first if needed

### Phase D: libp2p live transport

- attach peer identity and presence
- sync live updates through a libp2p bridge
- keep Convex persistence for durable state

### Phase E: validator and premium lanes

- validator role
- paid realtime session gating
- richer external-agent collaboration paths

## 11. Routing and URL model

Phase 1 should keep current internal URL values if needed for compatibility:

- `view=chat`
- `view=activity`
- `view=participants`
- `view=workspace`

User-facing labels should still render as:

- `Chat`
- `Activity`
- `Team`
- `Workboard`

Do not break existing links just to rename internal query values in the same pass.

When the live session ships, prefer either:

- `view=workspace&session=live`
- or a dedicated route such as `/request/[id]/swarm`

Choose one only after the live shell is real.

## 12. Acceptance criteria

This spec is correctly implemented when:

- users no longer confuse the right rail with the request execution surface
- users no longer see `workspace` used for three different meanings
- `Workboard` clearly means structured request execution
- `Swarm Workspace` clearly means live upgraded collaboration
- the product can add libp2p later without renaming the shell again

## 13. Immediate repo changes required

- relabel current request tabs and request-card buttons
- rename internal section titles from `* workspace` to plain task names
- update route-copy and docs to use `Workboard` for the current request-side execution surface
- register this spec in `README.md`, `AGENTS.md`, and `docs/README.md`
