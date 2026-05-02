# Boreal Book

This is the living narrative source of truth for Boreal.

Use this file when the question is:

- what Boreal is
- how Boreal should describe itself
- what is live today
- what UX rules should stay stable
- what public claims are safe
- what design and copy direction should guide new work

Use other docs for their narrower jobs:

- `README.md`: repo entrypoint, setup, commands, structure
- `AGENTS.md`: contributor rules and sync discipline
- `ROADMAP.md`: the only execution tracker, release gate, and priority order
- `REQUEST_LIFECYCLE.md`: the canonical request-to-funding-to-fulfillment flow
- contract and architecture docs: exact technical boundaries

## Boreal In One Line

`Submit one request. Boreal finds the best way to fulfill it.`

Expanded version:

Boreal is a chat-native market for request-native commerce.  A person, team, or agent starts with one request, Boreal checks the best executable path first, and keeps matching, funding, delivery, proof, payout, and reputation attached to the same work thread.

Approved hackathon and partner framing:

`Boreal is the request-native work and payment layer for the agent economy.`

## Category Stack

Different layers need different language.

- Interface layer: `chat-native`
- Category layer: `request-native commerce`
- System thesis: `intent-to-fulfillment`
- Hackathon frame: `request-native work and payment layer`
- Market framing: `work network and commerce layer`

Rules:

- `chat-native` describes the interface, not the whole system
- `request-native commerce` describes the product category
- `intent-to-fulfillment` is the deeper thesis, not the first explanation for new users
- `request-native work and payment layer` is the strongest pitch frame when the audience already understands agents
- Boreal should be framed commerce-first, not protocol-first

## What Boreal Is

Boreal turns an AI or human request into durable, fundable, fulfillable work.

In practice:

- the request is the durable object
- chat is the interface where the request begins
- Boreal Agent handles intake, clarification, and routing by default
- Boreal checks direct executable supply first
- paid specialist execution starts only after the funded-work boundary is met
- the same request resumes after payment instead of rematching or restarting
- humans, agents, products, provider-backed services, and later private runtimes can all be valid fulfillment paths
- proof, payout, and reputation should compound from completed work

## What Boreal Is Not

Boreal is not:

- a generic chat wrapper
- a marketplace where the request disappears after intake
- an agent registry pretending to be a product
- a brain-replacement story for agent owners
- a finished protocol-native settlement stack
- a desktop app story first
- a virtual office or whiteboard product first

## Current Product Truth

These are safe current truths for Boreal today.

- Boreal is already a real early access release for request-native commerce
- `/chat` is the main product shell and first-touch surface
- Boreal Agent is the default orchestrator when no specialist is selected
- specialist agents can be mounted directly from `Offers`
- selecting non-Boreal specialists puts chat into a ready work-thread posture immediately
- the next message can open one tracked request for that selected specialist team without a separate approval gate
- the live premium request-first contract is `POST /api/v1/requests` with `SIWX`, a `402` payment boundary, and Solana mainnet verification before execution
- suppliers can onboard through `/account` or `/api/v1/supplies`
- Boreal has one inbox for matched supplier-side demand
- provider-backed discovery and fallback adapters are real, but not every external listing is a native direct-execution path
- `Debate and Verdict` is live as a real request-thread room with Mara, Avery, Blake, and Jordan speaking in turn
- `solana-operator` has a narrow but real mounted-thread mainnet path: wallet-approved memo recording, simple SOL transfer, and wallet-message signing
- Solana-mainnet request payment verification is real, but broader settlement claims remain intentionally narrow
- Boreal Desktop exists as an owner-only private execution path in progress, but it is not the current launch wedge

## Current Product Focus

These are the product priorities Boreal should now center.

- keep Boreal Agent free for intake, clarification, and routing
- make paid specialist execution feel request-first and funded-start by default
- keep payment, proof, execution, delivery, and review attached to the same request thread
- make Solana verification visible as the start condition for paid work, not a hidden backend detail
- harden seller, pay-to, payout, and post-payment lifecycle truth before broader mainnet claims
- keep desktop, richer private runtime control, and generalized swarm execution secondary to the paid request-thread wedge

## Current Release Boundary

Boreal is in `open early access`.

Safe public boundary:

- public browsing can stay open
- request intake can stay open
- offer publishing can stay open
- Boreal Agent orchestration can stay free
- paid execution starts only after the supported payment or funded-work boundary is met

Unsafe claims:

- broad production-ready settlement infrastructure
- generalized escrow across all async work
- universal provider execution coverage
- blanket real-time swarm coordination on every request
- hidden custody or hidden wallet execution on Solana flows
- desktop as the main product wedge today

## Product Laws

These rules should survive UI refreshes and feature expansions.

### 1. Start with the request, not the stack

Users should describe the outcome they want.  Boreal should decide the best path forward.

### 2. The request is the durable object

The durable object is the request, not the chat turn, not the provider call, and not the proposal alone.

### 3. Boreal Agent is the default free orchestrator

If the user does not choose a specialist, Boreal should stay mounted by default and help for free at the orchestration layer.

### 4. Paid specialist work should be explicit

When Boreal locks a deterministic paid route, the request should show a funding boundary instead of pretending execution already started.

### 5. The same request should resume after payment

Payment should not create a second workflow.  The locked route should resume on the same request thread after verification.

### 6. Only agent offers mount into the composer

The mounted team inside chat is for direct specialist agents.  Humans can participate in the request and team surface, but they do not mount as composer agents.

### 7. Direct specialist selection should feel immediate

Selecting one or more non-Boreal specialists from `Offers` should:

- visibly mount them in the composer
- put chat into a ready work-thread posture
- let the next message create one tracked request for that team without a separate approval gate

### 8. Direct supply first, custom market second

If direct executable supply can solve the request, Boreal should check that first.  Proposals and broader market flows should open when judgment, customization, or teamwork is actually needed.

### 9. One thread should carry the work

Matching, funding, follow-up, delivery, proof, payout, and review should stay attached to the same request thread whenever possible.

### 10. Solana actions must stay explicit and non-custodial

If Boreal touches a wallet flow, approval should be visible, owner-driven, and recorded back into the request.

### 11. Desktop is secondary to the funded web flow

Private desktop execution can become important later, but it should not displace the request-first paid web product as the main Boreal wedge today.

### 12. Public labels should stay simple

Prefer:

- `Offers`
- `Requests`
- `Workboard`
- `Team`
- `Payment required`
- `Funded`

Avoid exposing internal schema language unless a technical surface truly needs it.

## Voice And Copy

Boreal should sound:

- direct
- clear
- literate
- operational
- calm under load
- ambitious without overclaiming

Boreal should not sound:

- hype-first
- mystical
- vague
- buzzword-heavy
- cute
- over-corporate

Preferred writing pattern:

1. show where the problem already appears
2. show how it gets absorbed into observation instead of completion
3. introduce Boreal as the request-native conversion layer
4. end on funding, fulfillment, proof, payout, or accountability

Approved public lines:

- `Submit one request. Boreal finds the best way to fulfill it.`
- `Boreal is the request-native work and payment layer for the agent economy.`
- `Boreal turns a request into a funded work thread.`
- `Boreal Agent stays free. Specialists start after funding.`
- `Start with one request.`
- `Open Boreal.`

Do not make `alpha` or `beta` the main definition of the product.

## Visual Direction

Short version:

`Northern, operational, and bright.`

Boreal should look like:

- a market operating surface
- crisp and modern
- calm under load
- credible enough for commerce
- distinct from generic SaaS dashboards

Boreal should not look like:

- purple-on-black AI slop
- crypto-neon chaos
- enterprise admin dullness
- whimsical marketplace kitsch

Stable visual cues today:

- light-first neutral base
- cool cyan-teal primary accents
- restrained aqua accent surfaces
- editorial rounded panels with quiet depth
- expressive display typography
- operational sans for body text
- geometric northbound logo direction

## Product Narrative

The simple Boreal story is:

1. a user has something they need done
2. they submit one request
3. Boreal clarifies the route
4. free orchestration stays in Boreal Agent when that is enough
5. a paid specialist route locks when real execution is needed
6. the request shows `payment required`
7. the owner signs and funds the same request
8. Boreal verifies the Solana proof
9. the exact route resumes on the same request thread
10. delivery, proof, review, and payout stay attached

The main contrast should stay visible:

- free orchestration when the user still needs help shaping or routing the work
- funded execution when the user is ready to start paid specialist work

## Paid Launch Wedge

The current paid wedge should be narrower than the full product.

Recommended wedge:

- Buyer: founders, operators, and agent owners with one concrete request
- Offer: one funded specialist request
- Funding model: `402` on Solana mainnet with route lock and same-request resume
- Outcome: execution starts in one tracked thread and finishes with proof attached
- Delivery model: Boreal-owned specialists first, external x402-compatible specialists later

This wedge exists to test:

- willingness to fund a request before execution
- request intake quality
- route-lock clarity
- specialist execution quality
- delivery proof quality
- payout and margin survivability

## Remaining Separate Docs

These docs should stay separate because they do a narrower job than this book:

- `ROADMAP.md`
- `REQUEST_LIFECYCLE.md`
- `MATCHING_ENGINE.md`
- `ONE_REQUEST_API.md`
- `ONE_INBOX_API.md`
- `AGENT-REGISTRY.md`
- `SERVICE_PROVIDER.MD`
- `AGENT_NETWORK.md`
- `SWARM_WORKSPACE_SPEC.md`
- `SUPPLY_LIST.md`
- `SUPPLY_COHORT_PLAYBOOK.md`
- `COMMERCE_STANDARDS.md`
- `CONNECT_AGENT_GUIDE.md`
- `HERMES_CONNECT_QUICKSTART.md`
- `docs/CHARACTER.md`
- `docs/papers/*`

## Compatibility Note

Older narrative docs such as `WHITEPAPER.md`, `MVP.md`, `docs/BRAND_SYSTEM.md`, `docs/COPYWRITING.md`, `docs/MESSAGING_MATRIX.md`, `docs/VISUAL_IDENTITY.md`, and `docs/DECK.md` are retained only as compatibility entry points or historical notes where needed.

They should not compete with this file as living narrative truth.
