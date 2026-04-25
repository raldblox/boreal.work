# Boreal Roadmap

This roadmap translates `WHITEPAPER.md` into implementation phases.  Checked items are only for functionality that is observable in the current repository as of April 25, 2026.  Unchecked items are either not implemented yet, not production-ready, or not verified strongly enough to claim as live.

## Current Readout

- Boreal is already a real public alpha for request-native commerce, delivered through a chat-native interface: chat intake, request workspaces, proposals, fulfillment, public profiles, public supply, digital listings, cart state, and provider-backed checkout routing.
- Boreal now has a dedicated external service-provider layer, payment-aware checkout states, Privy-backed x402 payment initiation, and Agentic Market discovery sync.
- Boreal is still behind the whitepaper on protocol depth, matching quality, settlement, trust scoring, collective fulfillment, and network intelligence.
- Public release should position Boreal as a chat-native market for request-native commerce, not yet as full protocol-native settlement infrastructure.

## Documentation And Positioning Consolidation

Goal: make the written story match the live alpha while recycling the strongest prior Boreal work instead of rewriting from zero.

- [x] Create `POSITIONING_TRIAGE.md` to classify what to keep, rewrite, recycle, and archive from earlier Boreal repos
- [x] Create `CATEGORY_LANGUAGE_RESEARCH.md` to map adjacent market language and choose a Boreal naming stack
- [x] Rewrite the top of `WHITEPAPER.md` and its `What Boreal Has Built` / `What Is Live Today` sections so live alpha claims are separated from target architecture
- [ ] Finish the rest of `WHITEPAPER.md` so `live today`, `in progress`, and `target architecture` stay clearly separated end to end
- [ ] Align `README.md`, homepage copy, the actual landing-page implementation, `ROADMAP.md`, and public alpha messaging on one canonical naming stack:
  - `chat-native` for the interface layer
  - `request-native` for the system and category layer
  - `intent-to-fulfillment` for the thesis layer
- [ ] Recycle the intent-to-fulfillment product laws and matching order from `../BorealWork`
- [ ] Recycle the canonical schema, adapter, and protocol framing from `../boreal-commerce`
- [ ] Recycle seller-specific representative and merchant copy from `../boreal/.boreal` and `../boreal/.private-docs`
- [ ] Archive `../boreal-work` as a previous attention-gate branch, pulling forward only reusable qualification and scoring ideas
- [ ] Publish a separate litepaper or one-pager if Boreal still needs a more visionary investor and partner narrative than the public alpha story

## Phase 0 - Foundation Built

- [x] `/chat` route with a chat-first Boreal UX
- [x] Structured intent extraction from chat
- [x] Embedding-based intent and modality scoring
- [x] Convex persistence for intents, messages, proposals, fulfillments, artifacts, profiles, supplies, carts, checkout records, service providers, and service invocations
- [x] Dynamic model-provider abstraction with OpenAI as the first provider
- [x] Dedicated service-provider integration layer separate from model providers
- [x] Intent/request lifecycle: proposed, open, claimed, in progress, blocked, fulfilled, closed, archived
- [x] Proposal drafting and approval flow
- [x] Work submission flow with Convex-backed file uploads
- [x] Inline media handling for image, audio, and video requests
- [x] Video polling and webhook update path
- [x] Public request directory
- [x] Public supply/profile directory
- [x] Human and agent profile pages at `/p/[id]`
- [x] Worker/profile registration with capabilities and supply-side entry
- [x] Digital product and service listings inside the supply model
- [x] Request-driven catalog rendering and add-to-cart flow
- [x] Payment-aware cart and checkout records
- [x] Agentic Market sync route and normalization into Boreal supply
- [x] Privy-backed x402 payment initiation for supported provider-backed items
- [x] Autonomous worker scripts for seeded Boreal agents
- [x] Build, typecheck, and lint workflows

## Phase 1 - Public Alpha Release

Goal: make `boreal.work` functional and credible for public use without overclaiming settlement or protocol completeness.

### Product Surface

- [x] Signed-in owner request tracking in the left sidebar
- [x] Public browsing of supply and public requests in the right rail
- [x] Request workspace with `Chat`, `Activity`, `Participants`, and `Workspace`
- [x] Public profile pages at `/p/[id]`
- [x] Proposal submission flow with explicit `Improve proposal` and `Send now`
- [x] Work submission flow with explicit submission form and file uploads
- [x] Archive, cancel, continue, delete, and review flows for requests
- [x] Streaming Boreal responses in chat
- [x] Boreal profile surface and public `boreal-agent` route
- [x] Request-driven catalog/store results with add-to-cart actions
- [x] Cart dialog with checkout history and fulfilled download access
- [x] Provider-backed payment-aware checkout states for supported listings

### Release Blockers

- [ ] Production deployment checklist and environment template for all required secrets
- [ ] Error monitoring and alerting for API, chat, Convex, and payment failures
- [ ] Rate limiting and abuse controls for public chat, public request creation, and public supply listing
- [ ] Moderation/admin tooling for public requests, profiles, listings, and provider-backed supply
- [ ] Robust multi-account QA for X auth session switching and ownership boundaries
- [x] End-to-end smoke test script for owner -> proposer -> approval -> delivery -> review
- [ ] Proposal attachments and richer seller-side submission assets beyond the current delivery upload flow
- [ ] Canonical external API documentation for third-party consumers
- [ ] Privacy and access audit for private vs. public request visibility
- [ ] Payment recovery, refund, and dispute handling for provider-backed checkout failures

### Release Messaging Guardrails

- [x] Can claim: chat-native request intake, request workspaces, proposals, public supply and request discovery, human and agent profiles, digital listings, cart flow, and provider-backed checkout routing for supported services
- [x] Can claim: Boreal is a chat-native interface for request-native commerce
- [x] Can claim: Boreal is building intent-to-fulfillment infrastructure, as long as the live alpha boundary stays explicit
- [ ] Cannot claim yet: on-chain escrow, full ACP/UCP interoperability, libp2p presence, collective fulfillment, trust-score routing, or generalized autonomous settlement

## Phase 2 - Whitepaper Layer 2 Parity

Goal: close the gap between the current alpha and the whitepaper's full demand-routing system.

### Intent Extraction and Routing

- [x] Natural-language request intake from chat
- [x] Structured intent persistence
- [x] Text, image, audio, and video intent detection
- [x] Request approval before fulfillment
- [x] Product-search intents that open a request workspace and render matched supply
- [x] Public proposal board behavior through public requests
- [x] Keyword generation stored and actively used in retrieval/routing
- [ ] Full hybrid retrieval: BM25 + vector similarity + structured filters
- [ ] Historical analog retrieval across prior fulfilled work
- [ ] LLM reranking over top candidates
- [ ] Tier 2 fast-route to known solvers based on empirical score thresholds
- [ ] Tier 4 pending/rematch scheduler
- [ ] Match event logging with score breakdown

### Workspace and Fulfillment

- [x] Owner and participant role differentiation
- [x] Activity timeline and request transcript
- [x] Fulfillment evidence via stored submission text, uploads, and artifacts
- [x] Reviews and ratings attached to the completed lifecycle
- [ ] Revision-request loop between owner and fulfiller
- [ ] Stronger request-to-supply recommendation UX
- [ ] Request-side deadline, SLA, and marketplace health signals fed back into routing

## Phase 3 - Supply Registry and Marketplace Depth

Goal: make Boreal a real supply aggregation and matching surface, not just a request board.

### Native Supply

- [x] Profile registration with capabilities and skills
- [x] Supply entry registration in Convex
- [x] Public supply directory
- [x] Built-in seeded worker agents
- [x] Digital product and service listings within the unified supply model
- [x] Cart and checkout records connected to supply listings
- [ ] Rich public product/catalog pages with deeper structured metadata and merchant-grade presentation
- [ ] Strong matching based on capabilities, trust, availability, price, delivery type, and execution surface

### External Aggregation

- [x] Agentic Market discovery sync route and normalized ingestion foundation
- [x] External service-provider adapters with normalized schema mapping
- [x] Upgrade path for supported direct x402 invocation on concrete endpoints
- [ ] Tier B ingestion for `agentcash`
- [ ] Tier B ingestion for `frames`
- [ ] MoonPay funding and bridge adapters
- [ ] Routing attribution and partner reporting

### Agent-as-Supply

- [x] Boreal-owned autonomous agent personas
- [ ] Public agent-supply registration API
- [ ] Webhook/executor registration for third-party agent suppliers
- [ ] Concurrency and availability controls for agent suppliers

## Phase 4 - Settlement, Trust, and Evidence

Goal: turn Boreal from coordination software into stronger commerce infrastructure.

### Settlement

- [x] Payment attempts persisted for provider-backed services
- [x] Service invocations and checkout records persisted with status
- [ ] Solana escrow on proposal acceptance
- [ ] Automatic settlement on approval
- [ ] Partial and split settlement support
- [ ] Escrow lifecycle visible in request workspace

### Trust and Audit

- [x] Activity event log per request
- [x] Proposal and fulfillment records persisted
- [x] Review/rating capture
- [x] Service invocation and payment-attempt records persisted
- [ ] Computed trust score from fulfillment outcomes
- [ ] Evidence quality scoring
- [ ] Dispute workflow
- [ ] On-chain transaction audit trail

## Phase 5 - Protocol and Presence Layer

Goal: reach the whitepaper's protocol-native commerce surface.

- [ ] libp2p real-time buyer presence
- [ ] Listing-level representative agents for products/services
- [ ] A2A endpoints per listing
- [ ] UCP endpoints per listing
- [ ] ACP checkout support
- [ ] MCP tool server for Boreal
- [ ] Agent wallet and spend-rule support

## Phase 6 - Network Intelligence and Collective Fulfillment

Goal: make the system compound from usage and support larger, multi-party work.

### Network Intelligence

- [ ] Match scoring feedback loop based on fulfillment outcomes
- [ ] Supply ranking updates from acceptance and fulfillment rate
- [ ] Urgency scoring with deadline decay
- [ ] Automatic promotion of repeated fulfillment patterns into routable supply
- [ ] Recommendation engine for open requests and product-search workspaces

### Collective Fulfillment

- [ ] Collective proposal primitive
- [ ] Team composition and role assignment
- [ ] Contribution tracking inside one request
- [ ] Split settlement for collectives
- [ ] Collective trust score

## Suggested Release Sequence

### Milestone A - Public Alpha

- Finish all unchecked Phase 1 release blockers.
- Keep public messaging constrained to Boreal as a chat-native market and operating surface for request-native commerce.

### Milestone B - Demand Routing Beta

- Finish the unchecked items in Phase 2.
- Add strong matching and recommendation quality before scaling public traffic.

### Milestone C - Commerce Beta

- Finish Phase 3 and Phase 4.
- Only after this point should Boreal be positioned as deeper commerce infrastructure rather than mostly workflow infrastructure.

### Milestone D - Whitepaper Protocol Expansion

- Finish Phase 5 and enough of Phase 6 to support the whitepaper's protocol and collective claims.

## Immediate Next Actions

- [ ] Close the Phase 1 public-alpha blockers
- [ ] Execute the documentation and positioning consolidation workstream
- [ ] Add end-to-end smoke tests for the request lifecycle
- [ ] Implement proposal attachments and richer seller-side submission assets
- [ ] Add monitoring, rate limiting, moderation, and refund handling
- [ ] Start the real matching engine work for Phase 2
