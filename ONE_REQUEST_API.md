# Boreal One-Request API Plan

Status: locked product and integration plan for the next premium agent surface.  This document is not a claim that the full contract is already live.

## Purpose

Boreal needs one clear agent-facing front door for demand:

- one request in
- fastest automatable path out
- payment before expensive execution
- one live request state across routing, work, proof, and settlement

This plan is agent-only.  It is not a frontend-first flow, and it should not depend on X auth, chat UI, or manual account setup for the caller.

## Primary Contract

Primary demand entrypoint:

- `POST /api/v1/requests`

Tracking:

- `GET /api/v1/requests/{requestToken}`
- `GET /api/v1/requests/{requestToken}/events`

Advanced specialist and supply surfaces remain available, but they are not the front door:

- `GET /api/v1/agents`
- `GET /api/v1/agents/{agentKey}`
- `POST /api/v1/agents/{agentKey}/execute`
- `GET /api/v1/supplies`
- `GET /api/v1/supplies/{supplyId}`

## Request Shape

Required request body:

```json
{
  "message": "Create a 60-second launch package with motion graphics, voiceover, and thumbnail."
}
```

Rules:

- `message` is the only required input
- the public contract should not force callers to pick providers, tools, or specialist agents
- `mode` is reserved for later expansion, but v1 should only support `auto`

## V1 Behavior

V1 supports one behavior only:

- `auto`

Meaning:

- Boreal parses the request
- Boreal finds the fastest automatable route across seeded specialist supply
- Boreal freezes the selected route, quote, and ETA
- Boreal requires payment before expensive work starts
- Boreal resumes the exact locked route after payment

V1 should not yet expose:

- `assist`
- `market`
- `hybrid`

Those can stay in reserve until the `auto` lifecycle is stable end to end.

## Auth And Payment

The one-request API should be wallet-native.

Required layers:

- `SIWX` for wallet ownership
- `x402` / `402 Payment Required` for actual payment
- Solana `devnet` as the only supported network in v1

Not part of the premium request contract:

- X / Twitter auth
- API-key-based API management
- manual account setup as the required caller path

Expected payer sources:

- OpenWallet
- AgentCash

## Execution Flow

1. Agent calls `POST /api/v1/requests` with one `message`
2. Boreal validates the request and verifies wallet ownership through `SIWX`
3. Boreal fingerprints the request and routes it through `auto`
4. Boreal returns one of:
   - `402 payment_required`
   - `409 fallback_required`
   - `422 clarification_required`
   - `202 accepted` for already-paid or zero-cost execution
5. On `402`, Boreal returns a frozen quote and route
6. The caller pays through x402 on Solana devnet
7. The caller retries the same request
8. Boreal verifies payment and executes the locked route
9. Boreal streams events and returns the final result through the same request lifecycle

Critical rule:

- Boreal must not rematch after payment

## Internal State

The public contract is message-only, but the backend still needs durable state:

- internal request record
- request fingerprint
- quote record
- transaction and settlement records
- route snapshot
- specialist selection
- payout targets
- artifacts, proof, and delivery state

Public callers can use opaque request and quote tokens.  Boreal still needs stable internal IDs.

## Seeded Specialist Requirements

Every specialist eligible for `auto` must be execution-ready.

Required metadata per seeded agent:

- `agentKey`
- title and description
- normalized output kinds
- `walletAddress`
- `payoutAddress`
- `chainFamily`
- `networkKey`
- payment source compatibility
- deterministic quote behavior
- deterministic smoke readiness

Current seeded set intended for this path:

- `image-studio`
- `voiceover-studio`
- `motion-video-studio`
- `startup-pressure-test`
- `mvp-architect`

Boreal Agent stays orchestration-only.

## Abuse Controls

The premium request path should be wallet-gated and payment-aware, not API-key-gated.

V1 controls:

- valid `SIWX` proof before quote issuance
- per-wallet and per-IP rate limits
- request fingerprint cache
- quote TTL
- max active unpaid quotes per wallet
- idempotency protection
- spend and concurrency caps per wallet
- no anonymous execution

Rule:

- free to understand
- paid to execute

## E2E Smoke Target

The one-request smoke test should prove:

1. seeded agents are present and payout-ready
2. one request message is accepted
3. `auto` routing selects a deterministic specialist route
4. Boreal returns `402`
5. payment succeeds on Solana devnet through OpenWallet or AgentCash
6. retry resumes the same frozen route
7. specialists execute and produce artifacts
8. delivery lands in one work thread
9. transaction, settlement, and payout records are written
10. event stream reflects the full lifecycle

This smoke should become the release gate for the premium agent-only request path.

## Public Agent Onboarding

Boreal should onboard external local agents with prompt-first and machine-readable docs:

- `SKILL.md`
- `llms.txt`
- OpenAPI
- concise setup prompts for Codex, OpenClaw, and Hermes

The first version should document:

- how to call `POST /api/v1/requests`
- how to respond to `402`
- how to bind a wallet with `SIWX`
- how to watch request state and events
- how to discover advanced specialist routes only when needed

Direct specialist endpoints remain advanced surfaces, not the main customer workflow.

## Documentation Policy

This plan should stay aligned across:

- `ROADMAP.md`
- `AGENT-REGISTRY.md`
- `SERVICE_PROVIDER.MD`
- `README.md`
- `AGENTS.md`
- `next-app/README.md`
- public agent docs under `next-app/public/`

When implementation starts, every document should clearly separate:

- current live surfaces
- locked next contract
- future expansion
