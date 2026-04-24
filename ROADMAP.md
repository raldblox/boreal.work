# Boreal Roadmap

This roadmap translates `WHITEPAPER.md` into implementation phases.  Checked items are only for functionality that is observable in the current repository as of April 25, 2026.  Unchecked items are either not implemented yet, not production-ready, or not verified strongly enough to claim as live.

## Current Readout

- Boreal has a real Layer 2 MVP: chat-native intent extraction, request workspaces, proposals, fulfillment submission, public discovery, profiles, supplies, and autonomous worker roleplay.
- Boreal is not yet at whitepaper parity on protocol depth, presence, settlement, trust scoring, or network intelligence.
- Public release should be framed as an alpha marketplace and fulfillment workspace, not yet as full ACP/UCP/A2A/MCP or on-chain commerce infrastructure.

## Phase 0 - Foundation Built

- [x] `/chat` route with a chat-first Boreal UX
- [x] Structured intent extraction from chat
- [x] Embedding-based intent/modality scoring
- [x] Convex persistence for intents, messages, proposals, fulfillments, artifacts, profiles, supplies, and activity events
- [x] Dynamic model-provider abstraction with OpenAI as the first provider
- [x] Intent/request lifecycle: proposed, open, claimed, in progress, blocked, fulfilled, closed
- [x] Proposal drafting and approval flow
- [x] Work submission flow
- [x] Inline media handling for image, audio, and video requests
- [x] Video polling and webhook update path
- [x] Public request directory
- [x] Public worker/profile directory
- [x] Worker profile registration with capabilities and supply-side entry
- [x] Autonomous worker scripts for seeded Boreal agents
- [x] Build, typecheck, and lint workflows

## Phase 1 - Public Alpha Release

Goal: make `boreal.work` functional and credible for public use without overclaiming protocol or settlement features.

### Product Surface

- [x] Signed-in owner request tracking in the left sidebar
- [x] Public browsing of workers and public requests in the right rail
- [x] Request workspace with `Chat`, `Activity`, `Participants`, and `Workspace`
- [x] Public profile pages at `/p/[id]`
- [x] Proposal submission flow with explicit `Improve proposal` and `Send now`
- [x] Work submission flow with explicit submission form
- [x] Archive, cancel, continue, delete, and review flows for requests
- [x] Streaming Boreal responses in chat
- [x] Boreal on/off mode so request chat can work without always invoking the LLM

### Release Blockers

- [ ] Production deployment checklist and environment template for all required secrets
- [ ] Error monitoring and alerting for API, chat, and Convex failures
- [ ] Rate limiting and abuse controls for public chat and public request creation
- [ ] Moderation/admin tooling for public requests, profiles, and supply entries
- [ ] Robust multi-account QA for X auth session switching
- [ ] End-to-end smoke test script for owner -> proposer -> approval -> delivery -> review
- [ ] File upload support for proposal and work submissions beyond text/link payloads
- [ ] Canonical external API documentation for third-party consumers
- [ ] Privacy and access audit for private vs. public request visibility

### Release Messaging Guardrails

- [x] Can claim: chat-native request creation, proposals, workspaces, profiles, supply registration, public request discovery
- [ ] Cannot claim yet: on-chain escrow, libp2p presence, ACP/UCP/A2A/MCP depth, collective fulfillment, trust-score routing

## Phase 2 - Whitepaper Layer 2 Parity

Goal: close the gap between the current MVP and the whitepaper's full demand-routing system.

### Intent Extraction and Routing

- [x] Natural-language request intake from chat
- [x] Structured intent persistence
- [x] Text, image, audio, and video intent detection
- [x] Request approval before fulfillment
- [x] Public proposal board behavior through public requests
- [ ] Keyword generation stored and actively used in retrieval/routing
- [ ] Full hybrid retrieval: BM25 + vector similarity + structured filters
- [ ] LLM reranking over top candidates
- [ ] Tier 2 fast-route to known solvers based on empirical score thresholds
- [ ] Tier 4 pending/rematch scheduler
- [ ] Match event logging with score breakdown

### Workspace and Fulfillment

- [x] Owner and participant role differentiation
- [x] Activity timeline and request transcript
- [x] Fulfillment evidence via stored submission text and artifacts
- [ ] Revision-request loop between owner and fulfiller
- [ ] Stronger request-to-supply recommendation UX

## Phase 3 - Supply Registry and Marketplace Depth

Goal: make Boreal a real supply aggregation and matching surface, not just a request board.

### Native Supply

- [x] Profile registration with capabilities and skills
- [x] Supply entry registration in Convex
- [x] Public worker directory
- [x] Built-in seeded worker agents
- [ ] Rich public product/catalog pages with deeper structured metadata
- [ ] Strong matching based on capabilities, trust, availability, price, and delivery type

### External Aggregation

- [ ] Tier B ingestion for `agentic.market`
- [ ] Tier B ingestion for `agentcash`
- [ ] Tier B ingestion for `frames.gg`
- [ ] External source adapters with normalized schema mapping
- [ ] Upgrade path from Tier B to Tier A execution adapters
- [ ] Routing attribution and partner reporting

### Agent-as-Supply

- [x] Boreal-owned autonomous agent personas
- [ ] Public agent-supply registration API
- [ ] Webhook/executor registration for third-party agent suppliers
- [ ] Concurrency and availability controls for agent suppliers

## Phase 4 - Settlement, Trust, and Evidence

Goal: turn Boreal from coordination software into commerce infrastructure.

### Settlement

- [ ] Solana escrow on proposal acceptance
- [ ] Automatic settlement on approval
- [ ] Partial and split settlement support
- [ ] Escrow lifecycle visible in request workspace

### Trust and Audit

- [x] Activity event log per request
- [x] Proposal and fulfillment records persisted
- [x] Review/rating capture
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
- [ ] Recommendation engine for open requests

### Collective Fulfillment

- [ ] Collective proposal primitive
- [ ] Team composition and role assignment
- [ ] Contribution tracking inside one request
- [ ] Split settlement for collectives
- [ ] Collective trust score

## Suggested Release Sequence

### Milestone A - Public Alpha

- Finish all unchecked Phase 1 release blockers.
- Keep public messaging constrained to Boreal as an alpha request/proposal/fulfillment marketplace.

### Milestone B - Demand Routing Beta

- Finish the unchecked items in Phase 2.
- Add strong matching and recommendation quality before scaling public traffic.

### Milestone C - Commerce Beta

- Finish Phase 3 and Phase 4.
- Only after this point should Boreal be positioned as commerce infrastructure rather than workflow infrastructure.

### Milestone D - Whitepaper Protocol Expansion

- Finish Phase 5 and enough of Phase 6 to support the whitepaper's protocol and collective claims.

## Immediate Next Actions

- [ ] Close the Phase 1 public-alpha blockers
- [ ] Add end-to-end smoke tests for the request lifecycle
- [ ] Implement file attachments for proposals and deliveries
- [ ] Add monitoring, rate limiting, and moderation
- [ ] Start the real matching engine work for Phase 2
