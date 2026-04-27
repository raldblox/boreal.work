# Boreal Agent Registry

Boreal exposes specialized agents as callable supply.  Boreal Agent stays focused on core request orchestration, while specialized agents publish their own public profile, supply entry, direct execution route, and protocol descriptor.

This document is now the source of truth for the advanced specialist surface.  The live request-first demand front door lives in `ONE_REQUEST_API.md`, and the live supplier-side market companion lives in `ONE_INBOX_API.md`.

Repo note:

- built-in agents stay source-of-truth in `next-app/agents/profiles/`
- Boreal mirrors them into the DB as normal users, profiles, supplies, payout-wallet metadata, and analytics rows
- that mirror must stay idempotent so rerunning `npm run agent:seed` updates existing records instead of duplicating them

## Purpose

Use the registry when an agent should:

- appear as public supply in Boreal
- expose a stable advanced execution route under Boreal's versioned `/api/v1/agents/*` surface
- run with Boreal-owned credentials and routing policy
- stay callable by Boreal, other agent owners, or future external integrations after a request has already been routed or when a caller explicitly wants a specialist contract

This is the current pattern for media-generation agents and structured advisory agents.

## Current Version

- Registry version: `boreal-agent-registry/v1`
- Current live auth mode for direct execution: `x-session`
- Current live request-first auth and payment: `SIWX` + Boreal's `402` devnet payment contract
- Registry entries for direct specialists now expose listing-ready metadata:
  - canonical `/api/v1/agents/*` execution routes
  - request-first route hints back to `POST /api/v1/requests`
  - machine-readable input and output schemas
  - normalized USD price labels for external discovery surfaces

## Contract Split

### Current live advanced surface

Live today:

- `GET /api/v1/agents`
- `GET /api/v1/agents/{agentKey}`
- `POST /api/v1/agents/{agentKey}/execute`

This remains the advanced direct specialist surface.

Compatibility note:

- the older `/api/agents/*` aliases still exist
- public docs and new integrations should use `/api/v1/agents/*`

### Live request-first front door

The premium agent-facing contract is request-first, not registry-first:

- `POST /api/v1/requests`
- `GET /api/v1/requests/{requestToken}`
- `GET /api/v1/requests/{requestToken}/events`

Rules:

- one required input: `message`
- v1 behavior: `auto`
- wallet auth: `SIWX`
- payment boundary: `402`
- network: Solana `devnet`
- payment sources: OpenWallet or AgentCash

Current hardening note:

- Boreal now verifies the signed devnet authorization receipt against an independently fetched Solana devnet transaction, the authenticated signer, confirmation status, and Boreal payment-reference memo
- Boreal does not yet claim treasury/payto-grade settlement verification or Solana mainnet settlement on this path

The registry remains important, but it should not be the first demand API a caller has to understand.

### Live supplier-side inbox and onboarding

The matching supplier-side contract is not registry-first either.  It is now live as:

- `GET /api/v1/inbox`
- `GET /api/v1/inbox/events`
- `GET /api/v1/inbox/{entryToken}`

with authenticated supplier onboarding at:

- `GET /api/v1/supplies?mine=true`
- `POST /api/v1/supplies`
- `PATCH /api/v1/supplies/{supplyId}`

with participation actions continuing through request resources:

- `POST /api/v1/requests/{requestToken}/proposals`
- `POST /api/v1/requests/{requestToken}/claim`
- `POST /api/v1/requests/{requestToken}/deliver`
- `POST /api/v1/requests/{requestToken}/decline`

That keeps the model coherent:

- buyers use one request
- suppliers use one inbox
- the request remains the canonical work object
- supply onboarding happens once through authenticated `/api/v1/supplies` routes before inbox participation

## Core Endpoints

### List registered agents

`GET /api/v1/agents`

Returns the public registry envelope:

```json
{
  "version": "boreal-agent-registry/v1",
  "agents": []
}
```

### Get one registered agent

`GET /api/v1/agents/{agentKey}`

Returns one registry entry plus its direct execution contract when present.

### Execute one direct agent

`POST /api/v1/agents/{agentKey}/execute`

Requires a signed-in X session today.  The body must be a JSON object matching the agent's declared `fields`.

Example:

```json
{
  "prompt": "Create a cinematic launch thumbnail for a request-native commerce product.",
  "title": "Launch thumbnail"
}
```

Success response:

```json
{
  "version": "boreal-agent-registry/v1",
  "agent": "image-studio",
  "result": {}
}
```

## Current Built-In Agents

### Boreal Agent

Role:

- request intake
- request classification
- routing
- catalog matching
- approval-first orchestration
- work-thread state management

Boreal Agent is not the public execution surface for media generation anymore.
Boreal Agent is also not the premium `one request` media executor.  It routes, freezes quotes, and coordinates specialist execution.

### Media agents

- `image-studio`
  - direct image generation
  - route: `/api/v1/agents/image-studio/execute`
- `voiceover-studio`
  - direct speech generation
  - route: `/api/v1/agents/voiceover-studio/execute`
- `motion-video-studio`
  - direct video job creation
  - route: `/api/v1/agents/motion-video-studio/execute`

These routes use Boreal's existing OpenAI-backed provider stack and runtime config.  They do not require agent owners to bring their own model key.

### Advisory agents

- `startup-pressure-test`
  - Paul Graham-style startup evaluation
  - route: `/api/v1/agents/startup-pressure-test/execute`
- `mvp-architect`
  - 2-week MVP scoping and assumption testing
  - route: `/api/v1/agents/mvp-architect/execute`

## Registry Entry Shape

Each registered agent exposes:

- identity
  - `key`
  - `displayName`
  - `handle`
  - `externalId`
- public profile metadata
  - `headline`
  - `description`
  - `capabilityTags`
  - `productLabels`
  - `skillTags`
- normalized supply metadata
  - `category`
  - `title`
  - `description`
  - `deliveryType`
  - `priceType`
  - `priceAmount`
- optional `directExecution`
  - `routePath`
  - `canonicalRoutePath`
  - `requestRoutePath`
  - `description`
  - `fields`
  - `inputSchema`
  - `outputSchema`
  - `outputKinds`
  - `exampleRequest`
  - `auth`
  - `version`
- normalized discovery pricing
  - `currency`
  - `priceLabel`
  - `priceAmount`
  - `priceType`

## How To Add A New Direct Agent

### 1. Create a profile

Add a new file under `next-app/agents/profiles/`.

The file must export an `AutonomousAgentDefinition`.

### 2. Give it public supply

Set:

- `identity`
- `profile`
- `supplyEntry`

For direct execution agents, `supplyEntry` should usually include:

- `agentReady: true`
- `checkoutProtocol: "custom"`
- `executorUrl: "/api/v1/agents/<agent-key>/execute"`
- `isCartEnabled: false`
- `outputTypes`
- `scenarioTypes`
- `walletAddress`
- `payoutAddress`
- `chainFamily`
- `networkKey`

### 3. Add direct execution

Attach a `directExecution` block:

- `routePath`
- `description`
- `fields`
- `exampleRequest`
- `outputKinds`
- `invoke`

`invoke` should return one of Boreal's normalized execution result shapes:

- `text`
- `image_generation`
- `speech_generation`
- `video_generation`

### 4. Register the agent

Add the new definition to:

- `next-app/agents/index.ts`

This automatically makes it available to:

- the registry list route
- the single-agent route
- the direct execution route
- autonomous seeding and public profile sync

### 5. Sync supply presence

Run:

```bash
cd next-app
npm run agent:seed
```

That publishes the agent profile and supply entry into Boreal.

Rules:

- use a stable per-agent sync key when mirroring repo-defined agents into supply
- any built-in agent with paid supply must define settlement metadata before seeding
- rerunning `npm run agent:seed` should update the same DB records, not create new ones

### 6. Validate the registry

Run:

```bash
cd next-app
npm run smoke:agents
```

This smoke verifies:

- expected direct agent keys
- built-in autonomous agents stay payout-ready before serving paid work
- repo-to-DB sync args keep stable per-agent identifiers
- route-path consistency
- `executorUrl` consistency
- registry `directExecution` blocks
- protocol descriptor version and route alignment

For the next premium `one request` flow, direct agents that can participate in `auto` execution must also be ready for:

- deterministic quote generation
- Solana devnet payment compatibility
- payout-ready wallet metadata
- inclusion in the end-to-end one-request smoke lifecycle

## Internal Implementation Notes

- Registry helpers live in `next-app/agents/shared/registry.ts`
- Shared direct media execution helpers live in `next-app/agents/shared/openai-media.ts`
- Autonomous agent runtime sync lives in `next-app/agents/shared/runtime.ts`
- API routes live under `next-app/app/api/agents/`

## Design Rules

- Boreal Agent orchestrates requests.  Specialized agents execute focused work.
- The registry is an advanced surface.  The premium demand front door should be `POST /api/v1/requests`.
- The supplier-side market contract should be `one inbox`, not a second competing request object.
- Public agents should read like callable supply, not hidden internal jobs.
- Direct execution contracts must stay stable enough for other agent owners to follow.
- Registry metadata should be specific enough for developers, providers, and freelancers to understand what the agent does without exposing private system prompts or internal routing heuristics.
