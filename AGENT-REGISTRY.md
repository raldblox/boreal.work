# Boreal Agent Registry

Boreal exposes specialized agents as callable supply.  Boreal Agent stays focused on core request orchestration, while specialized agents publish their own public profile, supply entry, direct execution route, and protocol descriptor.

This document is now the source of truth for the advanced specialist surface.  The live request-first demand front door lives in `ONE_REQUEST_API.md`, and the live supplier-side market companion lives in `ONE_INBOX_API.md`.

Repo note:

- built-in agents stay source-of-truth in `next-app/agents/profiles/`
- Boreal mirrors them into the DB as normal users, profiles, supplies, payout-wallet metadata, and analytics rows
- that mirror must stay idempotent so rerunning `npm run agent:seed` updates existing records instead of duplicating them
- default `npm run agent:seed` restores the stable public-ready specialists only; use `npm run agent:seed -- --all` when internal-only agents also need reseeding
- built-in agents now share the default Solana wallet `CxkLjW31HqX4Mp7JuDmSRBxEALqbnj8HWHn48FRWD4yS` and default EVM wallet `0x339f616BA1A347ef40d3EdD5278c0B44315E0836` unless runtime env overrides them

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
- Current live request-first auth and payment: `SIWX` + Boreal's `402` mainnet payment contract
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
- network: Solana `mainnet`
- payment sources: OpenWallet or AgentCash

Current hardening note:

- Boreal now verifies the signed mainnet authorization receipt against an independently fetched Solana mainnet transaction, the authenticated signer, confirmation status, and Boreal payment-reference memo
- Boreal does not yet claim treasury/payto-grade settlement verification on this path

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
  "prompt": "Generate a cinematic sad cat video with soft rain and a slow dolly-in.",
  "seconds": "8",
  "size": "1280x720",
  "title": "Sad cat video"
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
- default home-chat orchestration when no specialist is mounted
- work-thread state management

Boreal Agent is not the public execution surface for media generation anymore.
Boreal Agent is also not the premium `one request` media executor.  It routes, freezes quotes, and coordinates specialist execution.

In-product chat behavior:

- Boreal chat defaults to Boreal Agent when no specialist is selected from `Offers`
- only agent offers mount into the composer team
- mounting one or more non-Boreal specialists puts chat into a ready work-thread posture immediately
- the next submit opens one tracked request for that selected specialist team without a separate approval gate
- once mounted text specialists own the request, follow-up messages stay on that request thread, the assigned specialist team should answer there instead of bouncing the owner back into generic Boreal sessions, and request chat should not shadow those replies with duplicate Boreal-agent output

### Public-ready specialists

- `copywriter`
  - direct product and launch copy in markdown
  - route: `/api/v1/agents/copywriter/execute`
- `image-studio`
  - direct image generation
  - route: `/api/v1/agents/image-studio/execute`
- `voiceover-studio`
  - direct speech generation
  - route: `/api/v1/agents/voiceover-studio/execute`
  - mounted specialist behavior: speech-generation requests should persist the audio artifact in Boreal request metadata and render the player inline in the same request thread instead of closing with a generic completion shell
- `motion-video-studio`
  - surfaced in product as `Video Generation`
  - direct short video job creation
  - route: `/api/v1/agents/motion-video-studio/execute`
  - accepts optional `seconds` (`4`, `8`, `12`) and `size` (`720x1280`, `1280x720`, `1024x1792`, `1792x1024`)
- `mvp-architect`
  - smallest-possible MVP scoping and 2-week launch planning
  - route: `/api/v1/agents/mvp-architect/execute`
- `research-analyst`
  - direct comparison briefs and decision-ready research memos
  - route: `/api/v1/agents/research-analyst/execute`
- `startup-pressure-test`
  - unbranded early-stage startup evaluation
  - route: `/api/v1/agents/startup-pressure-test/execute`
- `solana-operator`
  - non-custodial Solana execution planning in markdown
  - route: `/api/v1/agents/solana-operator/execute`
  - current public direct-route scope: planning, wallet requirements, approval checklist, and risk notes only
  - current mounted request-thread scope: explicit wallet-approved Solana mainnet memo recording, simple SOL transfer, and wallet-message signing
  - mounted starter prompts should stay honest to shipped scope: memo recording, message signing, simple SOL transfer, swap or stake planning, wallet setup, and safety review
  - current runtime boundary: the public direct route still receives plain request context only; no signer, wallet session, or transaction send path is passed there today
  - request-first routing: Solana planning asks should classify as `solana` work, preview `solana-operator` first, and invite directly without generic content-format clarification
  - mounted request-thread behavior: the action card lives inside the Boreal request thread, the owner approves from the connected wallet, and the resulting signature or transaction submission is recorded back into the same request
  - must not imply hidden server-side execution from the user's wallet or silent custody
  - legacy wallet capability flag: `supportsPrivyWallet` must stay false until Boreal actually passes a working Solana wallet adapter into the public direct-execution route, not only the mounted request-thread UI
  - current mounted wallet path: Solana-only Reown wallet connect in the request thread, while NextAuth still owns app identity
  - product surfacing: separate specialist surfaced through Boreal chat hints and `/agents`, not a hidden generic Boreal sub-capability

These eight are the built-in specialists Boreal should currently treat as public-ready in market and profile surfaces.  Each one should show provider-company plus model transparency in the visible UI.  `math-expert` still exists in repo but is intentionally not promoted as public-ready yet.

These routes use Boreal's existing OpenAI-backed provider stack and runtime config.  They do not require agent owners to bring their own model key.
If the current OpenAI project or API key does not actually expose the video route, Boreal now reports that provider-access failure explicitly instead of leaving a vague blocked message.

### Other repo-defined direct routes

- no additional non-public direct routes right now

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
npm run agent:seed -- --all
npm run agent:seed -- --prod
```

That publishes the agent profile and supply entry into Boreal.

Rules:

- use a stable per-agent sync key when mirroring repo-defined agents into supply
- any built-in agent with paid supply must define settlement metadata before seeding
- rerunning `npm run agent:seed` should update the same DB records, not create new ones
- when seeding against production Convex, use `--prod` and set `BOREAL_AGENT_CONVEX_URL_PROD` if the production deployment URL is not already exposed as `NEXT_PUBLIC_CONVEX_URL`

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
- Solana mainnet payment compatibility
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
- Solana-specialist direct routes must stay non-custodial by default until Boreal ships explicit user approval for onchain signing.  Payment to Boreal is not blanket permission for hidden wallet custody.
