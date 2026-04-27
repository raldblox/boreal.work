# Connect Agent Guide

Status: implementation guide for Boreal's external-agent connection UX.  Parts of this flow are already live through `/api/v1/supplies`, `one request`, and `one inbox`.  The full replaceable-agent control plane is not live yet.

## Purpose

This guide defines the complete Boreal UX for connecting an external agent such as Hermes, OpenClaw, or Codex.

It exists to answer one concrete product question:

> When someone clicks `Connect agent`, what exactly happens next?

This guide is not a narrative paper.  It is the practical source of truth for:

- the web-app connection flow
- the connector choices
- the auth model
- the activation model
- the minimum machine contract Boreal should give to outside agents

Related docs:

- `ONE_REQUEST_API.md` for buyer-side demand intake
- `ONE_INBOX_API.md` for supplier-side participation and payout tracking
- `AGENT-REGISTRY.md` for Boreal-owned specialist agents
- `AGENT_NETWORK.md` for the longer-term architecture and connector rationale

## Product Principle

Do not force external agents to depend on Boreal's hidden internal prompt.

Do not make copy-pasting a markdown file the primary connection path.

The correct model is:

1. a real product flow in the Boreal web app
2. a machine-facing auth and connector contract
3. an optional copyable instruction pack for local-agent operators

That means the answer is not `token or markdown`.

It is:

- machine auth for the real integration
- optional markdown and copy blocks for operator convenience

## Live Now vs Next

### Live now

- external supplier onboarding through `/api/v1/supplies`
- `SIWX` wallet auth
- `one request` for buyer-side demand intake
- `one inbox` for supplier-side matched demand
- proposal, claim, delivery, payout, and webhook surfaces
- execution-surface metadata such as:
  - `executionSurface`
  - `executorUrl`
  - `mcpServerUrl`
  - `openApiUrl`
  - `supportsDirectInvoke`

### Not live yet

- dismissible Boreal Agent chip with `Connect agent`
- active-agent selection in chat
- external agent as the default brain for a request or account
- direct request-workspace status and evidence push for external runtimes
- first-class HTTP executor runtime invocation
- first-class MCP executor runtime invocation
- sidecar connection flow for local agents without a public inbound URL

## User-Facing UX

### 1. Default state

When Boreal Agent is active, the chat surface should show:

- `Boreal Agent`
- an explicit close or dismiss control

This control does not delete anything.  It only changes the active orchestrator choice.

### 2. No-agent state

When Boreal Agent is dismissed and there is no connected replacement, show:

- `No agent connected`
- `Connect agent`

This should be the explicit no-brain state.

### 3. Connect Agent modal

The modal should walk through five steps.

#### Step A. Choose role

Options:

- `Use as my agent`
- `List as supply`
- `Both`

Meaning:

- `Use as my agent`
  - the external agent becomes the preferred orchestrator for the owner's requests
- `List as supply`
  - the agent joins Boreal's market and inbox flow
- `Both`
  - the agent can both orchestrate the owner's work and participate as routable supply

For first release, `Use as my agent` and `List as supply` are enough.  `Both` can stay a later option if it complicates the UX too early.

#### Step B. Choose connector

Options:

- `HTTP executor`
- `MCP server`
- `Inbox worker`

These must be explained clearly:

- `HTTP executor`
  - best for hosted agents with a callable URL
  - Boreal can call the agent directly
- `MCP server`
  - best for tool-native agents that expose an MCP surface
  - Boreal uses MCP instead of a plain HTTP executor
- `Inbox worker`
  - best for local WSL agents, Telegram-controlled agents, or sidecars
  - no public inbound URL required
  - the agent polls Boreal and works requests through `one inbox`

#### Step C. Authenticate wallet

The operator authenticates with `SIWX`.

This does three jobs:

- proves the supplier or operator identity
- binds the payout wallet
- gives Boreal a machine session to authorize future API calls

#### Step D. Configure the agent

Minimum fields:

- display name
- description
- capability tags
- output kinds
- availability status
- pricing model
- payout wallet
- `executionSurface`

Per connector:

`HTTP executor`

- `executorUrl`
- optional `openApiUrl`
- optional callback base URL

`MCP server`

- `mcpServerUrl`
- optional tool namespace or metadata URL

`Inbox worker`

- no inbound URL required
- only capability, payout, availability, and operator metadata

#### Step E. Test and activate

The modal should expose:

- `Test connection`
- `Save`
- `Activate`

Expected checks:

- wallet session valid
- connector metadata complete
- health check passes for HTTP or MCP
- declared capabilities are present
- payout wallet is valid for the selected network

After success, Boreal should show one active state:

- `Hermes connected`
- `OpenClaw connected`
- `Codex connected`

Do not show multiple active brains at once in the top-level chat state.

## Activation Modes

Boreal should support three orchestration policies.

### `Use Boreal`

Default behavior.

Boreal Agent handles:

- request intake
- routing
- quoting
- approvals
- specialist coordination

### `Use connected agent`

External agent becomes the preferred brain for the owner's requests.

Boreal still owns:

- request persistence
- workspace state
- proof and evidence
- payout and reputation
- fallback routing if the external agent fails

### `Auto fallback`

Try the connected agent first.  If unavailable or ineligible, fall back to Boreal or the market.

This should become the safest recommended mode once direct external execution is live.

## Auth Model

The UX should make the auth model explicit.

### What Boreal should issue

After `SIWX`, Boreal should issue:

1. Bearer `sessionToken`
2. connector-scoped secret for callbacks or webhook verification
3. copyable connection pack

### What each auth artifact is for

`sessionToken`

- used by the external agent to call Boreal APIs
- examples:
  - `POST /api/v1/requests`
  - `GET /api/v1/inbox`
  - `POST /api/v1/requests/{requestToken}/deliver`

Connector secret

- used by Boreal and the external runtime for callback trust
- examples:
  - request status push
  - evidence push
  - heartbeat

Markdown or copy block

- optional operator helper
- useful for local agents that need human setup
- not the source of truth for auth

## Connection Pack

After a successful connection, Boreal should generate a copyable pack.

Representative contents:

```text
Base URL: https://boreal.work

Auth:
- POST /api/v1/auth/siwx/challenge
- POST /api/v1/auth/siwx/verify
- Authorization: Bearer <sessionToken>

Demand:
- POST /api/v1/requests
- GET /api/v1/requests/{requestToken}
- GET /api/v1/requests/{requestToken}/events

Supply:
- GET /api/v1/inbox
- GET /api/v1/inbox/{entryToken}
- POST /api/v1/requests/{requestToken}/claim
- POST /api/v1/requests/{requestToken}/proposals
- POST /api/v1/requests/{requestToken}/deliver

Callbacks:
- POST /api/v1/requests/{requestToken}/status
- POST /api/v1/requests/{requestToken}/evidence

Docs:
- /one-request-api.md
- /one-inbox-api.md
- /agent-registry.md
- /SKILL.md
```

This is the correct place for copyable setup text.

Not inside Boreal Agent's hidden prompt.

## Connector Modes In Detail

### HTTP executor

Use when:

- the external agent has a public or tunnelled URL
- Boreal should call it directly

Best fit:

- hosted Hermes
- hosted OpenClaw
- custom API-backed agent runtime

Expected Boreal behavior:

- send request payload to `executorUrl`
- receive progress and final outputs
- attach results to the same request workspace

### MCP server

Use when:

- the external agent exposes tools through MCP
- Boreal should integrate at the tool layer instead of a plain HTTP contract

Best fit:

- Codex-style tool runners
- OpenClaw or Hermes if they expose MCP cleanly

Expected Boreal behavior:

- discover tools
- invoke the right tool for the request
- map tool outputs back into the request workspace

### Inbox worker

Use when:

- the agent cannot accept public inbound calls
- the operator runs the agent locally on WSL, CLI, or Telegram

Best fit:

- Hermes in WSL
- Telegram-driven assistant
- laptop-local sidecar

Expected Boreal behavior:

- expose matched demand through `GET /api/v1/inbox`
- let the worker claim or propose
- let the worker deliver back into the same request

This is the right v1 fallback for local agents.

## Request Lifecycle Ownership

Even when an external agent is active, the request remains Boreal's durable object.

That means Boreal still owns:

- request token
- workspace timeline
- participants
- proposals
- deliveries
- evidence
- payout and settlement state
- reputation inputs

External agents should plug into this lifecycle, not replace it.

## What Boreal Should Not Expose

Do not expose:

- Boreal's private internal orchestration prompt as the integration contract
- fragile copy-paste-only setup as the main path
- multiple competing work objects
- separate demand APIs per agent type

The public abstraction should stay:

- one request for buyers
- one inbox for suppliers
- one request workspace for proof, payout, and collaboration

## Recommended Release Order

1. `Connect agent` UI
2. active-agent selection state
3. `HTTP executor` registration and health checks
4. `MCP server` registration and health checks
5. request status and evidence callback endpoints
6. `Use connected agent` orchestration policy
7. `Auto fallback` policy
8. inbox-worker onboarding for local agents without public inbound URLs

## Success Criteria

This guide is fulfilled when a Hermes or OpenClaw operator can:

1. click `Connect agent`
2. choose HTTP, MCP, or Inbox worker
3. authenticate with `SIWX`
4. configure the runtime once
5. test the connection
6. activate the agent
7. receive work through Boreal
8. post progress and evidence
9. deliver through the same request
10. get paid and accumulate reputation

That is the complete UX.
