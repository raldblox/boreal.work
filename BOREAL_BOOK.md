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
- `ROADMAP.md`: the only execution tracker, release gate, and paid wedge tracker
- contract and architecture docs: exact technical boundaries

## Boreal In One Line

`Submit one request. Boreal finds the best way to fulfill it.`

Expanded version:

Boreal is a chat-native market for request-native commerce.  A person, team, or agent starts with one request, Boreal checks the best executable path first, and keeps matching, delivery, proof, payout, and reputation attached to the same work thread.

## Category Stack

Different layers need different language.

- Interface layer: `chat-native`
- Category layer: `request-native commerce`
- System thesis: `intent-to-fulfillment`
- Market framing: `work network and commerce layer`

Rules:

- `chat-native` describes the interface, not the whole system
- `request-native commerce` describes the product category
- `intent-to-fulfillment` is the deeper thesis, not the first explanation for new users
- Boreal should be framed commerce-first, not protocol-first

## What Boreal Is

Boreal turns visible demand into durable, fulfillable work.

In practice:

- the request is the durable object
- chat is the interface where the request begins
- Boreal checks direct executable supply first
- Boreal opens proposals when the work is custom
- humans, agents, products, and provider-backed services can all be valid fulfillment paths
- proof, payout, and reputation should compound from completed work

## What Boreal Is Not

Boreal is not:

- a generic chat wrapper
- a marketplace where the request disappears after intake
- an agent registry pretending to be a product
- a brain-replacement story for agent owners
- a finished protocol-native settlement stack
- a virtual office or whiteboard product first

## Current Product Truth

These are safe current truths for Boreal today.

- Boreal is already a real early access release for request-native commerce
- `/chat` is the main product shell and first-touch surface
- one request can move through request thread, route preview, follow-up, delivery, review, and attached checkout state
- Boreal Agent is the default orchestrator when no specialist is selected
- specialist agents can be mounted directly from `Offers`
- selecting non-Boreal specialists puts chat into a ready work-thread posture immediately
- the next message can open one tracked request for that selected specialist team without a separate approval step
- suppliers can onboard through `/account` or `/api/v1/supplies`
- Boreal has one inbox for matched supplier-side demand
- provider-backed discovery and fallback adapters are real, but not every external listing is a native direct-execution path
- Solana-mainnet request payment verification is real, but broader settlement claims remain intentionally narrow

## Current Release Boundary

Boreal is in `open early access`.

Safe public boundary:

- public browsing can stay open
- request intake can stay open
- offer publishing can stay open
- paid execution starts only after the supported payment or funded-work boundary is met

Unsafe claims:

- broad production-ready settlement infrastructure
- generalized escrow across all async work
- universal provider execution coverage
- blanket real-time swarm coordination on every request
- hidden custody or hidden wallet execution on Solana flows

## Product Laws

These rules should survive UI refreshes and feature expansions.

### 1. Start with the request, not the stack

Users should describe the outcome they want.  Boreal should decide the best path forward.

### 2. The request is the durable object

The durable object is the request, not the chat turn, not the provider call, and not the proposal alone.

### 3. Boreal is the default orchestrator

If the user does not choose a specialist, Boreal should stay mounted by default.

### 4. Only agent offers mount into the composer

The mounted team inside chat is for direct specialist agents.  Humans can participate in the request and team surface, but they do not mount as composer agents.

### 5. Direct specialist selection should feel immediate

Selecting one or more non-Boreal specialists from `Offers` should:

- visibly mount them in the composer
- put chat into a ready work-thread posture
- let the next message create one tracked request for that team without a separate approval gate

### 6. Approval is contextual, not universal

Normal route-review paths can still require approval.

Mounted direct specialists do not need to be forced back through the same generic approval loop if the user intentionally selected them.

### 7. Direct supply first, custom market second

If direct executable supply can solve the request, Boreal should check that first.  Proposals and broader market flows should open when judgment, customization, or teamwork is actually needed.

### 8. Humans are first-class supply

Humans are not only a fallback.  Some requests should go to humans or hybrid teams first.

### 9. One thread should carry the work

Matching, follow-up, delivery, proof, payout, and review should stay attached to the same request thread whenever possible.

### 10. Public labels should stay simple

Prefer:

- `Offers`
- `Requests`
- `Workboard`
- `Team`

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
4. end on fulfillment, proof, payout, or accountability

Preferred public lines:

- `Submit one request. Boreal finds the best way to fulfill it.`
- `Start with one request.`
- `Publish an offer.`
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
3. Boreal checks the best fulfillment path
4. direct supply resolves it fast when possible
5. proposals or team assignment open when the work is custom
6. the full trail stays attached to the request

The main contrast should stay visible:

- instant path when supply already exists
- market path when the request needs custom work

## Paid Launch Wedge

The current paid wedge is intentionally narrower than the full product.

Recommended wedge:

- Buyer: early-stage founders shipping in the next 30 days
- Offer: `Launch Copy Pack`
- Outcome: launch page copy, onboarding copy, and a checkout-ready listing draft
- SLA: 24 hours
- Delivery model: direct Boreal execution first, human or hybrid polish only when judgment is required

This wedge exists to test:

- willingness to pay
- request intake quality
- routing quality
- fulfillment quality
- human-assist rate
- margin survivability

## Remaining Separate Docs

These docs should stay separate because they do a narrower job than this book:

- `ROADMAP.md`
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
