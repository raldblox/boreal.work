# Boreal Discovery Plan

Last updated: April 27, 2026

This document is the execution plan for making Boreal discoverable to external agents, suppliers, registries, and directories.

It is intentionally narrower than `BOREAL_BOOK.md` and more operational than `SERVICE_PROVIDER.MD`.

## Goal

Make Boreal easy to find and easy to call from the ecosystems that matter first:

- x402 buyers and sellers
- agent marketplaces and registries
- local-agent runtimes such as Codex, OpenClaw, and Hermes
- MCP-compatible clients and marketplaces
- ChatGPT app discovery

The target outcome is:

- buyers discover Boreal through `one request`
- suppliers discover Boreal through `one inbox`
- specialist agents discover Boreal through the registry and public docs
- the system is listed where agent users already search for payable tools and workflows

## Current Starting Point

Already live:

- `POST /api/v1/requests`
- `GET /api/v1/requests/{requestToken}`
- `GET /api/v1/requests/{requestToken}/events`
- `GET /api/v1/inbox`
- supplier request actions and payout views
- public `llms.txt`
- public `SKILL.md`
- public request and specialist OpenAPI docs
- listing-ready specialist registry entries with canonical v1 routes, request-first route hints, machine-readable input and output schemas, and normalized USD price labels
- Bazaar-compatible seller metadata on the one-request seller block, including canonical x402 Solana mainnet network id plus `bazaar` discovery fields
- deterministic smokes for `one request`, `one inbox`, agents, and the broader lifecycle
- Agentic Market ingestion inside Boreal's internal service-provider layer
- curated AgentCash fallback discovery inside the service-provider layer
- curated Frames handoff discovery inside the service-provider layer

This means Boreal already has a real programmable surface.

What it does not have yet:

- treasury/payto-grade x402 settlement verification for the request-first premium path
- a public remote MCP server
- MCP Registry publication metadata and namespace verification
- a ChatGPT app built with the Apps SDK
- a verified public integration contract for Frames
- runtime-level validation that Boreal can drive AgentCash end to end as a delegated buyer path without operator glue

## Principles

### 1. Discovery follows real surfaces

Do not list Boreal in a directory before the corresponding surface is actually stable enough to be called by third parties.

### 2. One request stays the front door

For demand-side discovery:

- push `one request`
- do not force users to start from the specialist registry

### 3. One inbox stays the supply-side story

For supplier-side discovery:

- push `one inbox`
- do not invent a second demand object

### 4. Narrow paid surfaces go first

Directories and registries prefer stable, clearly priced, machine-callable tools.

That means Boreal should first expose:

- narrow fixed-price specialist endpoints
- a hardened request-first premium route

before trying to market the entire platform abstraction everywhere at once.

### 5. Do not overclaim readiness

Current hardening boundary:

- Boreal's request-first payment path now verifies a signed mainnet authorization receipt against an independently fetched Solana mainnet transaction, authenticated signer, confirmation status, and Boreal payment-reference memo
- Boreal still does not claim treasury/payto-grade settlement verification or payout-grade on-chain settlement finality

That must remain explicit in public docs until it changes.

## Priority Order

### Priority 1: x402 seller readiness

Reason:

- this is the cleanest path to programmable paid discovery
- it aligns directly with Boreal's request-first and supplier-side pricing model
- it is the dependency for Bazaar-style discovery

What must ship:

- hardened x402 verification on the Boreal premium path
- clearer seller metadata for the request-first and specialist surfaces
- stable pricing language for listings and docs
- payment idempotency, quote TTL, and receipt verification tightened enough for third-party callers

Exit criteria:

- Boreal can truthfully present at least one public paid surface as a real x402-compatible seller endpoint
- internal docs no longer need to qualify the path as receipt-trusted only

### Priority 2: x402 Bazaar and x402 ecosystem visibility

Reason:

- Bazaar is the native discovery layer for x402-compatible services and MCP tools
- this is the closest thing to protocol-level discoverability

What to list:

- request-first premium route if and only if seller verification is hardened enough
- fixed-price specialist endpoints as the easiest discovery entries

What must ship:

- Bazaar metadata on the relevant routes
- clean descriptions, categories, input schemas, output schemas, and pricing

Exit criteria:

- Boreal routes are discoverable through Bazaar-compatible discovery
- Boreal can point external buyers to a neutral protocol-native discovery surface

### Priority 3: Agentic Market inclusion

Reason:

- Agentic Market is already machine-readable and x402-oriented
- Boreal already ingests its data internally, so this is strategically aligned

What to expose:

- fixed-price specialist surfaces first
- request-first premium route second

What must ship:

- listing-ready route descriptions
- stable public docs
- proof that the payable surface works without interactive account setup

Exit criteria:

- Boreal appears in Agentic Market or an equivalent x402 service marketplace

### Priority 4: AgentCash compatibility and listing

Reason:

- AgentCash is a strong buyer/runtime surface and skill distribution channel
- it helps local agents consume payable services without custom integrations

What Boreal should become for AgentCash:

- a payable target that AgentCash-powered agents can call
- a skill/doc target that teaches local agents how to use `one request`

What must ship:

- validate Boreal's current request-first flow against AgentCash-style buyer expectations
- tighten docs for payer-source usage and retries
- add explicit compatibility notes for AgentCash skill, CLI, and MCP mode

Current caution:

- AgentCash's public docs do not yet make Solana-first support as explicit as their EVM support
- Boreal should treat it as compatible and useful, but not as the primary settlement truth source

Exit criteria:

- a local agent with AgentCash can discover Boreal, pay Boreal, and get a result back cleanly

### Priority 5: Remote MCP server and MCP Registry

Reason:

- MCP is the cleanest distribution surface for tool-native agent ecosystems
- the official MCP Registry gives discoverability across downstream marketplaces

What Boreal should expose first through MCP:

- create request
- get request status
- get request events
- read inbox
- maybe claim and deliver later, after the first toolset is stable

What must ship:

- public remote MCP server
- `server.json`
- namespace verification
- registry publication flow

Exit criteria:

- Boreal has a public MCP server
- Boreal is published to the official MCP Registry
- downstream MCP marketplaces can discover it

### Priority 6: ChatGPT app directory

Reason:

- this is meaningful distribution, but it is not just “list an API”
- it requires an actual app experience built with the Apps SDK

What Boreal should be in ChatGPT:

- a request-native app
- not just a registry browser

Suggested first app shape:

- submit one request
- watch the live request status
- inspect fulfillment and returned evidence

What must ship:

- Apps SDK implementation
- proper app UX and auth model
- review-ready scope and safety posture

Exit criteria:

- Boreal is submitted for ChatGPT app review
- the app has a clean request-native interaction model

### Priority 7: Frames due diligence

Reason:

- it may become a real supply/distribution partner
- but current public docs are still not strong enough to treat as a confirmed public integration target

What must happen first:

- confirm the correct public developer surface
- confirm actual API or MCP contract
- confirm listing or partner path

Exit criteria:

- Boreal has primary-source confirmation that Frames exposes a stable integration surface worth building against

## Concrete Workstreams

### Workstream A: Harden seller truth

Tasks:

- advance the current memo-bound mainnet verification step into treasury/payto-grade x402 settlement verification
- finalize pricing language for specialist and request-first surfaces
- add explicit route metadata for discovery

Deliverables:

- hardened request-first payment verification
- seller metadata ready for external listing

### Workstream B: Publish narrow paid surfaces first

Tasks:

- choose the first specialist routes to list publicly
- ensure they have stable descriptions, inputs, outputs, and pricing
- keep `one request` as the orchestrator layer above them

Deliverables:

- listing-ready specialist surfaces
- cleaner discovery copy across `SKILL.md`, `llms.txt`, and public docs

### Workstream C: Build MCP surface

Tasks:

- implement remote MCP server
- define first tool set
- prepare `server.json`
- publish to the official MCP Registry

Deliverables:

- public Boreal MCP endpoint
- registry-ready metadata

### Workstream D: Directory and ecosystem submission

Tasks:

- list or submit to x402 ecosystem surfaces
- pursue Agentic Market inclusion
- validate AgentCash compatibility
- prepare ChatGPT app submission path

Deliverables:

- tracked submission checklist
- recorded status per channel

## Channel Readiness Matrix

### Ready now

- public docs for local agents
- request-first programmable contract
- supplier-side inbox contract
- specialist registry surface

### Ready after one more hardening step

- x402/Bazaar seller listing
- Agentic Market outbound listing
- AgentCash compatibility positioning

### Not ready yet

- official MCP Registry publication
- ChatGPT app directory submission
- Frames integration claims

## What To Avoid

- Do not submit Boreal as a polished x402 seller before the verification gap is closed.
- Do not market Frames integration as real until primary-source docs are confirmed.
- Do not let discovery messaging collapse into only specialist endpoints; `one request` must stay the top-level story.
- Do not build the ChatGPT app before the backend contract is stable enough to survive review.

## Immediate Sequence

1. Harden x402 payment verification on the premium request-first path.
2. Prepare listing-ready metadata for the narrow paid surfaces.
3. Add Bazaar-compatible metadata and ecosystem-facing positioning.
4. Validate AgentCash runtime compatibility.
5. Build the first remote MCP server and publish it to the MCP Registry.
6. Build and submit a ChatGPT app only after the previous steps are stable.

## Source Notes

This plan is based on the current official public surfaces for:

- x402 seller and Bazaar docs
- Agentic Market marketplace and API
- AgentCash docs and skill flow
- MCP Registry publication docs
- OpenAI Apps SDK and ChatGPT app submission docs

The operational plan here should stay stricter than the marketing story: only mark a channel as live when Boreal's corresponding public surface is actually production-legible.
