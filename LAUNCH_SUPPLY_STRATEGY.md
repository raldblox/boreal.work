# Boreal Launch Supply Strategy

Status: CTO working note for the first paid early-access wedge.

This note is narrower than `BOREAL_BOOK.md` and more execution-focused than `ROADMAP.md`.
Its purpose is to answer one practical question:

What supply should Boreal push first so the product can route real requests, deliver with quality, defend margin, and avoid becoming a thin wrapper around other marketplaces?

## Repo-grounded starting point

Current repo truth already supports:
- Boreal-owned direct agents and specialist routes: `next-app/agents/`, `next-app/app/api/agents/`, `next-app/app/api/v1/agents/`
- request-first work loop and one-thread lifecycle: `ONE_REQUEST_API.md`, `next-app/scripts/smoke-lifecycle.ts`
- supplier onboarding and matched inbox flow: `ONE_INBOX_API.md`, `next-app/scripts/smoke-one-inbox.ts`
- request classification fields now persisted on intents: `next-app/lib/boreal/schemas/intent.ts`
- provider-backed capability sync from Agentic Market: `next-app/lib/boreal/integrations/service-providers/registry.ts`, `next-app/app/api/service-providers/agentic-market/sync/route.ts`
- connected-agent direct execution and callbacks: `HERMES_CONNECT_QUICKSTART.md`, `next-app/scripts/smoke-connected-agents.ts`, `next-app/scripts/smoke-request-callbacks.ts`
- built-in watcher loops for Boreal-owned agents: `next-app/agents/scripts/watch-agent.ts`, `next-app/agents/scripts/watch-all-agents.ts`

Current repo truth does not yet fully support:
- one hardened mainnet payment rail for the broad public paid path
- funded-start escrow for async labor
- payout verification before marking paid
- merchant self-serve onboarding with deterministic smoke coverage
- provider subtype tables and merchant-grade product pages
- connected external-agent inbox worker sidecar that watches open work and acts autonomously

## Core launch decision

For early paid launch, Boreal should prioritize supply in this order:

1. Boreal-owned direct supplies
2. Boreal-owned async specialist supplies
3. Boreal-owned digital products
4. Carefully selected provider-backed direct services
5. External connected-agent and human market supply
6. Broad third-party registry ingestion

Reason:
- Boreal-owned supply gives the highest control over quality, SLA, delivery format, and margin.
- Provider-backed direct services are useful when Boreal can wrap them cleanly and truthfully.
- Open external supply should help coverage, not define the first promise.
- Registry breadth before owned quality creates a noisy market with weak trust.

## The first launch wedge

Boreal should launch around requests that can be fulfilled by a small owned supply spine.

Recommended first paid wedge:
- launch copy
- product messaging
- landing-page copy
- founder research briefs
- simple image generation
- simple voice generation
- selected motion generation

These already map well to repo truth:
- `copywriter`
- `research-analyst`
- `image-studio`
- `voiceover-studio`
- `motion-video-studio`
- `mvp-architect`
- `startup-pressure-test`

The launch promise should be:
- submit one request
- Boreal chooses the fastest viable fulfillment path
- if direct owned execution is enough, deliver fast
- if judgment is needed, route into Boreal-owned async service or controlled worker flow
- keep everything attached to one request thread

## Recommended supply stack

### Tier 1: Boreal-owned direct supplies

These should be the first-class default because they are immediately callable, quality-controllable, and margin-defensible.

Recommended generic public names:
- Copy Studio
- Research Studio
- Image Studio
- Voice Studio
- Motion Studio
- Plan Studio
- Pressure Test

Internal mapping can still point to the current repo agent keys.
Public naming should emphasize the job, not the implementation.

### Tier 2: Boreal-owned async specialists

These are still Boreal-controlled, but they behave like scoped work rather than instant tools.

Recommended generic public names:
- Launch Copy Pack
- Product Positioning Brief
- Founder Research Brief
- MVP Architecture Plan
- Request Routing Audit
- Conversion Copy Revision

These should sit on top of the request thread and funded-start model once escrow exists.
Until funded-start exists, keep them in early access with explicit truth boundaries.

### Tier 3: Boreal-owned digital products

These are valuable because they smooth delivery and add revenue without synchronous labor.

Recommended product classes:
- prompt packs
- launch kits
- positioning templates
- request intake templates
- audit checklists
- operator playbooks
- ebooks and PDF guides

Recommended generic public names:
- Launch Kit
- Positioning Kit
- Prompt Kit
- Operator Handbook
- Request Playbook

These should use the product path, not the custom-work path.
`SUPPLY_LIST.md` and `COMMERCE_STANDARDS.md` already support this distinction.

### Tier 4: Provider-backed direct services

Use only where Boreal can safely invoke and return a clean result.
Examples:
- image generation providers
- video generation providers
- model-backed enrichment or research endpoints
- narrow paid APIs with deterministic result shapes

Policy:
- Boreal should wrap these as provider-backed direct services
- Boreal should keep the user-facing noun generic
- the upstream provider is implementation detail unless disclosure is necessary
- Boreal should prefer providers that fit `x402` or similarly auditable prepay paths

Example generic listing names:
- Image Render
- Voice Render
- Motion Render
- Data Enrichment
- Transcript Cleanroom

### Tier 5: External connected agents and human supply

This is important for market depth, but should not lead the first quality promise.
Use it to absorb overflow, niche demand, or categories Boreal cannot yet fulfill itself.

### Tier 6: Third-party supply registries

Agentic Market, AgentCash, Frames, and similar sources should be treated as expansion rails, not the first trust layer.

Policy:
- ingest selectively
- normalize aggressively
- rank behind Boreal-owned supply when quality is comparable
- only show them when they improve fulfillment probability or speed materially

## Routing policy

Request classification should choose the route before broad retrieval.
This is already directionally supported by `next-app/lib/boreal/schemas/intent.ts` and `MATCHING_ENGINE.md`.

Recommended route order:

1. Informational or onboarding
- no market fetch
- answer directly or send to setup flow

2. Boreal-owned direct route
- use when the request clearly maps to owned direct specialists
- examples: image, voice, copy, research brief, motion

3. Boreal-owned product route
- use for kits, templates, ebooks, prompt packs, packaged assets
- use cart or checkout rather than worker-market logic

4. Provider-backed direct route
- use when Boreal can safely invoke a paid external capability and return the result in-thread
- require pay-before-execute

5. Boreal-owned async specialist route
- use when judgment is needed but Boreal still wants to own the supply side
- examples: stronger launch copy, deeper founder research, product positioning

6. External connected-agent route
- use when Boreal lacks the owned capability or wants overflow capacity
- only after quality, runtime health, and callback/watch surfaces are trustworthy

7. Human or collective market route
- use for broader scoped work, collaboration-heavy work, or requests that exceed direct and provider rails
- should eventually require funded-start escrow before work begins

Tie-break policy:
- prefer Boreal-owned supply over external supply when quality is comparable
- prefer direct over async when the outcome quality is genuinely enough
- prefer provider-backed direct invocation only when fulfillment truth is clean and stable
- reject or reroute requests that do not fit the current quality boundary

## Recommended generic taxonomy

Keep user-facing taxonomy clean and generic.

### Public route families
- Instant
- Guided
- Scoped
- Team
- Product

### Public supply nouns
- Studio
- Pack
- Brief
- Kit
- Review
- Audit
- Plan
- Render
- Assistant

### Internal market kinds
- direct_tool
- boreal_direct_agent
- boreal_async_service
- digital_product
- provider_service
- connected_agent
- human_service
- collective_service

This lets Boreal keep user-facing names elegant while preserving precise internal routing.

## The strongest near-term supply strategy

Near-term, Boreal should deliberately become a quality-controlled routed execution layer with a Boreal-owned starter catalog.

That means:
- Boreal should seed and spotlight its own direct specialists first
- Boreal should add a small number of polished async offers that feel like products, not vague freelancing
- Boreal should add digital products that can be sold instantly and delivered smoothly
- Boreal should integrate external providers only where the invocation path is deterministic and margin-positive
- Boreal should use outside marketplaces as expansion supply, not identity

## What is still missing for this strategy

### Product and merchant model gaps
- product subtype tables and richer product metadata from `SUPPLY_LIST.md`
- merchant self-serve listing flow with safe edits
- merchant-only deterministic smoke coverage
- better public product pages

### Async work safety gaps
- funded-start escrow for async labor
- payout verification before marking paid
- clearer revision and SLA structure for async offers

### Connected-agent expansion gaps
- external inbox-worker sidecar for connected agents
- webhook-driven autonomous claim/propose/deliver loop
- combined smoke for watch -> claim/propose -> deliver -> payout

### Ranking and fetch gaps
- fetch-by-class before broad ranking everywhere
- subtype-aware supply tables
- stronger policy layer that explicitly prefers Boreal-owned supply first

## Immediate implementation priorities

1. Finish `EA-1.8`
- classification should decide direct tool vs product vs provider x402 vs async work before broad retrieval

2. Add a Boreal-owned launch catalog
- expose a small number of named owned supplies with clean pricing and delivery truth

3. Build the connected-agent inbox worker sidecar
- webhook-first, not SSE-first
- lets external agents watch and act on open work cleanly

4. Add product subtype support and one polished digital-product path
- use this for kits, prompt packs, and ebooks

5. Harden one real paid execution rail
- mainnet-capable, auditable, and tied to route policy

6. Add a release scorecard and smoke bundle
- direct route smoke
- provider-backed invocation smoke
- product purchase smoke
- request worker-market smoke
- webhook/connected-agent smoke

## Release rule

Do not widen the public paid promise until Boreal can demonstrate all of the following:
- owned direct routes work reliably
- at least one paid path is hardened enough for real execution
- at least one Boreal-owned async offer can route, deliver, and review cleanly
- at least one digital product path can sell and deliver cleanly
- external connected agents can watch, claim, and deliver through a tested worker loop if they are part of the release story
- Boreal can explain, per route, whether it is executing, invoking, or handing off

## Short version

Boreal should not launch first as a broad aggregator.
Boreal should launch first as a routed execution layer with its own starter supply.

That means:
- own the first quality impression
- own the first margin layer
- own the first delivery loop
- then widen into external supply once the trust spine is real
