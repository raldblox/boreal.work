# Boreal Roadmap

This roadmap translates `WHITEPAPER.md` into implementation phases.  Checked items are only for functionality that is observable in the current repository as of April 26, 2026.  Unchecked items are either not implemented yet, not production-ready, or not verified strongly enough to claim as live.

## Current Readout

- Boreal is already a real public alpha for request-native commerce, delivered through a chat-native interface: chat intake, request workboards, proposals, fulfillment, public profiles, public supply, digital listings, cart state, and provider-backed checkout routing.
- Boreal now has a dedicated external service-provider layer, payment-aware checkout states, Privy-backed x402 payment initiation, and Agentic Market discovery sync.
- Boreal now also has a real matching layer in the product surface: persisted match candidates, request-level score breakdowns, gated-out reasons, refinement actions, and pinned matches inside the request workboard.
- Public profiles are no longer just static identity cards; they now carry cached analytics snapshots for activity, fulfillment, ratings, listings, buyer/seller behavior, and recent handled work.
- Boreal now has a dedicated manual-plus-assisted profile and supply builder, which is the right onboarding path for publishing human or agent supply without forcing every profile edit through the main request market.
- Boreal's first-touch product surface is now converging around the chat shell itself: `/` is the chat-native zero-state, `/about` carries the feature/spec narrative, and `/roadmap` is the public-safe Jira-style live-status board.
- Boreal's payment and wallet flow is materially more coherent now: checkout, proposal approval, settlements, wallet sync, scenario audits, and smoke verification all write through the same transaction spine, with Solana-first devnet defaults and explicit mainnet / EVM routing flags.
- Boreal now has the first canonical commerce spine in the schema: `walletAccounts`, `transactions`, `settlements`, `payouts`, `refunds`, and `disputes`, plus transaction-scenario and environment tagging across the active commerce paths.
- Boreal now also has a canonical transaction-scenario registry and audit stream: scenario IDs, scenario verification runs, per-stage audit events, and wallet-readiness gates are wired into checkout, proposal approval, supply publishing, provider payment, and fulfillment submission.
- Boreal now has a live premium agent contract in `ONE_REQUEST_API.md`: `POST /api/v1/requests` as the front door, `SIWX` wallet auth, a `402` payment boundary, seeded specialist payouts, and a dedicated one-request smoke target.
- Boreal's request-first payment path now verifies a real Solana devnet transaction hash, authenticated signer, confirmation status, and Boreal payment-reference memo before execution begins.
- Boreal's request-first payment verifier now also binds to the configured seller pay-to address when that address is present, tightening the devnet proof without overclaiming treasury-grade settlement.
- Boreal's public one-request surface now enforces wallet-scoped intake guards for active unpaid quote caps and recent request bursts, with a dedicated smoke gate.
- Boreal's public supplier onboarding surface now enforces an active-listing cap per supplier, with a dedicated smoke gate for overflow rejection.
- Boreal now also has a live supplier-side companion contract in `ONE_INBOX_API.md`: one matched-demand inbox for agents, request participation actions, delivery, and payout tracking.
- Boreal now has a first live collective fulfillment primitive: one approved proposal can name collective collaborators, assign member roles, derive per-participant contribution summaries, expose a first collective trust summary, let accepted collaborators share the request thread and delivery path, and split payout rows fan out from the same transaction spine.
- External agents can now self-register and update supply through the public `v1` supplies API, attach executor-surface metadata, and become routable into the inbox and matching flow without manual seeding.
- Supplier payouts no longer stop at `pending`: Boreal now advances them through `processing` and `paid`, exposes the richer payout state back to suppliers, and aggregates settlements to `paid_out` or `failed`.
- Supplier capacity is now enforced end to end: claims reserve a supply slot, delivery releases it, and routing blocks over-assignment once `maxConcurrentJobs` is exhausted.
- Boreal now has a signed machine-facing webhook surface for request, inbox, and payout lifecycle delivery, plus a deterministic local receiver smoke.
- Boreal now exposes listing-ready specialist registry entries with canonical v1 routes, request-first route hints, machine-readable input/output schemas, and normalized USD price labels for external discovery.
- Boreal now exposes Bazaar-compatible seller metadata on the one-request contract, including canonical x402 Solana devnet network id plus `bazaar` discovery fields on the live seller block.
- Boreal's primary agent-owner story should now be a work network and operating layer for agents, not a chat-brain replacement product.  Stable request, inbox, payout, webhook, and skill contracts matter more than owner-runtime brain swaps.
- Boreal now has a concrete external distribution plan in `DISCOVERY_PLAN.md`, but the actual x402 seller hardening, MCP publication, and ChatGPT app distribution work are still ahead.
- Boreal is still behind the whitepaper on protocol depth, external agent identity, portable reputation, recommendation quality, relay-backed collaboration, and generalized collective settlement.
- Boreal is effectively between Milestone A and Milestone B: the public-alpha surface is broad, but the remaining work is mostly hardening, matching quality, and commerce depth rather than basic feature absence.
- Public release should position Boreal as a chat-native market for request-native commerce, not yet as full protocol-native settlement infrastructure.

## Documentation And Positioning Consolidation

Goal: make the written story match the live alpha while recycling the strongest prior Boreal work instead of rewriting from zero.

- [x] Create `docs/POSITIONING_TRIAGE.md` to classify what to keep, rewrite, recycle, and archive from earlier Boreal repos
- [x] Create `docs/CATEGORY_LANGUAGE_RESEARCH.md` to map adjacent market language and choose a Boreal naming stack
- [x] Rewrite the top of `WHITEPAPER.md` and its `What Boreal Has Built` / `What Is Live Today` sections so live alpha claims are separated from target architecture
- [ ] Finish the rest of `WHITEPAPER.md` so `live today`, `in progress`, and `target architecture` stay clearly separated end to end
- [ ] Align `README.md`, chat zero-state copy, the `/about` feature/spec page, `ROADMAP.md`, and public alpha messaging on one canonical naming stack:
  - `chat-native` for the interface layer
  - `request-native` for the system and category layer
  - `intent-to-fulfillment` for the thesis layer
- [x] Add a permanent roadmap-hygiene rule to the main docs so shipped behavior, public contracts, and agent-control changes update `ROADMAP.md` and the most specific contract docs in the same patch
- [x] Publish `CONNECT_AGENT_GUIDE.md` as a legacy internal runtime note so dormant connector work stays documented without becoming the public product story
- [x] Reposition public agent-owner docs around Boreal as a work network, with `SKILL.md`, `llms.txt`, `ONE_REQUEST_API.md`, and `ONE_INBOX_API.md` as the main integration contract
- [x] Demote connected-runtime brain replacement from general docs so HTTP, MCP, and local bridge control stay advanced adapter topics instead of front-door positioning
- [x] Publish `SWARM_WORKSPACE_SPEC.md` to lock the current `Workboard` naming, the later `Swarm Workspace` upgrade path, and the libp2p-versus-Convex split before deeper collaboration work lands
- [x] Publish a versioned agent-operator troubleshooting matrix across auth, `402`, inbox, delivery, payout, callbacks, and webhooks
- [x] Publish behavior-first examples for agent owners: find work, post work, track progress, deliver work, and check payout
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

## Phase 1 - Core Commerce Infrastructure

Goal: build the protocol-native commerce substrate first, then layer market UX and operations on top of it.

### Wallet and Payment Base

- [x] Canonical wallet-account registry for connected, buyer, and payout wallet roles
- [x] Canonical transaction spine for checkout items and scoped-work fulfillment flows
- [x] Connected-wallet sync foundation from the chat surface into backend wallet records
- [x] Canonical transaction matrix with scenario IDs, payment behavior, fulfillment behavior, and expected audit records
- [x] Canonical `devnet` / `mainnet` environment switch across wallet broker, payment rails, provider invocation, smoke tests, and logs
- [x] Solana-first network policy with `devnet` as the local/runtime default and explicit EVM support, especially Base mainnet / Base Sepolia
- [x] Connected-wallet sync model for every signed-in user and profile record
- [x] Payout-wallet sync model for every profile that can receive payment as a seller, worker, or agent operator
- [x] Require a connected payout wallet before publishing monetized supply or accepting paid work
- [x] Require a connected buyer wallet before paid checkout and surface missing-wallet blockers clearly in product UX
- [x] Track transaction type and payment environment on the active checkout, payment-attempt, fulfillment, and settlement flows
- [x] Track canonical `chainFamily` and `networkKey` metadata across wallet records, transactions, settlements, checkout items, payment attempts, and provider invocations
- [x] Block paid checkout and paid proposal approval on wallet-network mismatch instead of silently attempting cross-network settlement
- [x] Audit records and verification-run tracking for wallet failures, transaction progression, and scenario-level smoke outcomes

### Protocol-Facing Listing and Checkout Base

- [x] Unified supply model for products, services, humans, agents, and provider-backed capabilities
- [x] Payment-aware cart and checkout records
- [x] Provider-backed payment-aware checkout states for supported listings
- [x] Privy-backed x402 payment initiation for supported provider-backed items
- [x] Schema support for ACP/UCP/A2A-oriented listing descriptors and protocol metadata
- [ ] Boreal-assisted listing flow for merchants, freelancers, and agent operators that drafts ACP/UCP-ready metadata and protocol descriptors
- [ ] Stable public catalog, checkout-capability, and offer endpoints that expose merchant, freelancer, and agent supply in ACP/UCP-aligned shapes
- [ ] UCP endpoints per listing
- [ ] ACP checkout support
- [ ] A2A endpoints per listing

### Settlement Base

- [x] Payment attempts persisted for provider-backed services
- [x] Service invocations and checkout records persisted with status
- [ ] Solana escrow on proposal acceptance
- [ ] Automatic settlement on approval
- [ ] Partial and split settlement support
- [ ] Escrow lifecycle visible in request workboard

### Transaction Scenario Matrix and Verification

- [x] Product-search request that opens a store-like request workboard
- [x] Instant digital supply purchase from directory or request workboard
- [x] Provider-backed paid service purchase for supported direct-invoke listings
- [x] Human or agent custom work through proposal -> approval -> delivery -> review
- [x] Chat-only fulfillment where the owner manually marks the request fulfilled
- [x] Human or agent supply publishing through the profile and listing builder
- [x] Scenario verification runs and per-stage transaction audit records persisted for smoke-tested commerce flows
- [ ] Paid consultation/session flow with explicit session scope, delivery, and settlement model
- [ ] Physical-world service scheduling and attendance verification flow
- [ ] Milestone, split, or partial-settlement work flows
- [ ] Refund, cancellation-after-payment, and dispute scenarios across all paid transaction types
- [x] End-to-end smoke test script for owner -> proposer -> approval -> delivery -> review
- [ ] Expand smoke coverage into product search, cart/checkout, profile builder, provider-backed service flows, and wallet-required transaction paths

## Phase 2 - Public Alpha Surface and Demand Routing

Goal: make the request-native UX and routing layer strong on top of the commerce substrate.

### Product Surface

- [x] `/` now acts as the chat-native landing state, while `/about` carries the feature/spec narrative and `/roadmap` carries the public-safe Jira-style status board
- [x] Signed-in owner request tracking in the left sidebar
- [x] Public browsing of supply and public requests in the right rail
- [x] Request workboard with `Chat`, `Activity`, `Team`, and `Workboard`
- [x] Public profile pages at `/p/[id]`
- [x] Proposal submission flow with explicit `Improve proposal` and `Send now`
- [x] Work submission flow with explicit submission form and file uploads
- [x] Archive, cancel, continue, delete, and review flows for requests
- [x] Streaming Boreal responses in chat
- [x] Boreal profile surface and public `boreal-agent` route
- [x] Manual and Boreal-assisted profile/supply builder for publishing human or agent supply
- [x] Cached profile analytics and richer public profile dashboards
- [ ] Boreal Agent capability explorer with real supported-scenario cards and ready-to-run prompt starters
- [x] Request-driven catalog/store results with add-to-cart actions
- [x] Cart dialog with checkout history and fulfilled download access

### Intent Extraction and Routing

- [x] Natural-language request intake from chat
- [x] Structured intent persistence
- [x] Text, image, audio, and video intent detection
- [x] Request approval before fulfillment
- [x] Qualified advisory requests now preview best-fit specialist routes before approval, and approval runs the matched route instead of a generic clarification-first loop
- [x] Product-search intents that open a request workboard and render matched supply
- [x] Public proposal board behavior through public requests
- [x] Keyword generation stored and actively used in retrieval/routing
- [x] Request-level persisted match candidates with score breakdowns and workspace attachment
- [x] Hybrid matching foundation: lexical retrieval, embedding similarity, structured filters, and hard gates
- [x] Match event logging with score breakdown
- [x] Matching workspace UX with explanations, gated-out reasons, refinement, and pinning
- [ ] Full hybrid retrieval: BM25 + vector similarity + structured filters
- [ ] Historical analog retrieval across prior fulfilled work
- [ ] LLM reranking over top candidates
- [ ] Tier 2 fast-route to known solvers based on empirical score thresholds
- [ ] Tier 4 pending/rematch scheduler

### Workboard and Fulfillment

- [x] Owner and participant role differentiation
- [x] Activity timeline and request transcript
- [x] Fulfillment evidence via stored submission text, uploads, and artifacts
- [x] Reviews and ratings attached to the completed lifecycle
- [x] Owner-side request workboard for proposals, delivery, and matching refinement
- [x] Manual mark-fulfilled path for chat-native work that does not produce a formal asset
- [ ] Revision-request loop between owner and fulfiller
- [x] Stronger request-to-supply recommendation UX
- [ ] Request-side deadline, SLA, and marketplace health signals fed back into routing

### Messaging Guardrails

- [x] Can claim: chat-native request intake, request workboards, proposals, public supply and request discovery, human and agent profiles, digital listings, cart flow, and provider-backed checkout routing for supported services
- [x] Can claim: Boreal is a chat-native interface for request-native commerce
- [x] Can claim: Boreal is building intent-to-fulfillment infrastructure, as long as the live alpha boundary stays explicit
- [ ] Cannot claim yet: on-chain escrow, full ACP/UCP interoperability, libp2p presence, trust-score routing, or generalized autonomous settlement

## Phase 3 - Supply Registry, External Aggregation, and Agent Market Depth

Goal: deepen the sell-side and provider-side market once the core commerce rails exist.

### Native Supply

- [x] Profile registration with capabilities and skills
- [x] Supply entry registration in Convex
- [x] Public supply directory
- [x] Built-in seeded worker agents
- [x] Manual plus Boreal-assisted profile/supply publishing flow
- [x] Cached analytics on profiles for activity, ratings, listings, buyer/seller signals, and recent handled work
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
- [x] Idempotent repo-to-DB sync for built-in autonomous agents, including shared profile, supply, payout-wallet, and analytics records
- [x] Public agent-supply registration API with authenticated create, update, and owned-supply listing routes
- [x] Executor-surface registration for third-party agent suppliers with HTTP/MCP/OpenAPI/schema metadata
- [x] Concurrency and availability controls for agent suppliers

### Open Agent Identity And Connectors

- [ ] Agent Card ingestion and cache on top of the live `/api/v1/supplies` onboarding surface
- [ ] Runtime metadata on external agent supply: model family, model tier, provider, compute class, execution mode, heartbeat, and latency band
- [x] Basic connector capability model per supply entry, including direct execute, status push, evidence push, and MCP tool metadata
- [ ] Durable connector health model per supply entry, including UI test-connection, supply-level heartbeat, and validation support
- [x] Clear routing split between direct executable connected agents and supply-only participants
- [x] Legacy owner-runtime control-plane work landed in code, but public Boreal chat no longer exposes `Connect agent` as a first-class product surface
- [x] Legacy owner-runtime mode handling exists in the repo history, but the live Boreal chat path now runs Boreal directly by default
- [x] Boreal-specific click surfaces in chat and discovery now route to Boreal work-network controls instead of a Boreal profile-first modal
- [x] Direct HTTP runtime adapter flow for self-hosted external agents that can expose a callable executor URL
- [x] Direct MCP runtime adapter flow for local or remote external agents that expose tools instead of a plain HTTP executor
- [x] Local Hermes bridge helper and short quick-connect prompt for operators who need a working advanced-runtime HTTP path before token-based quick connect lands
- [ ] Sidecar and inbox-worker bridge for agents that cannot expose a public inbound URL but still need to participate end to end
- [ ] One-time quick-connect token and manifest flow so local agents can claim a Boreal session without manual URL and field entry
- [x] Request-workspace status, evidence, and heartbeat endpoints for advanced connected runtimes so they do not need Boreal-owned LLM execution just to stay attached to work

### Agent-Only One-Request API

- [x] `POST /api/v1/requests` as the main premium demand entrypoint for external agents
- [x] `message`-only request body with `auto` as the only enabled v1 behavior
- [x] `GET /api/v1/requests/{requestToken}` and `GET /api/v1/requests/{requestToken}/events` for machine-readable tracking
- [x] `SIWX` wallet authentication before quote issuance
- [x] `402` payment boundary on Solana devnet with OpenWallet or AgentCash as the payer-source labels
- [x] Frozen quote and locked specialist route before payment, with retry resuming the same request after payment instead of rematching
- [x] Wallet and payout addresses present for every seeded specialist eligible for `auto`
- [x] Dedicated one-request end-to-end smoke covering submit -> quote -> pay -> execute -> deliver -> settle
- [x] Public onboarding docs for Codex, OpenClaw, Hermes, and similar local agents through `SKILL.md`, `llms.txt`, and the request contract docs
- [x] Independent on-chain Solana devnet receipt verification for the request-first payment path

### Agent Work Network Contract

- [x] Public agent-owner contract centered on `SKILL.md`, `llms.txt`, `ONE_REQUEST_API.md`, and `ONE_INBOX_API.md`
- [x] Primary behavior guidance that tells agents when to use Boreal: find work, post work, track progress, deliver, and get paid
- [x] Clear split between front-door work-network behavior and advanced runtime-adapter behavior
- [x] Versioned schema examples for agent-owner flows: find work, post work, claim work, deliver work, and check payout
- [x] Explicit machine-readable debugging and retry guidance across request, inbox, payout, callback, and webhook flows
- [x] One Boreal chat timeline as the public owner surface, with session separators, inline request birth and approval markers, load-more session history, and no public new-chat or thread-history split

### Supplier-Side One-Inbox API

- [x] `GET /api/v1/inbox` as the personalized matched-demand watch surface for external agents
- [x] `GET /api/v1/inbox/events` and `GET /api/v1/inbox/{entryToken}` for machine-readable inbox tracking
- [x] `POST /api/v1/requests/{requestToken}/proposals` for quote-required and proposal-first participation
- [x] Collective proposal participation through `collectiveMembers`, `memberRoles`, and `splitPlan` on the request proposal route
- [x] `POST /api/v1/requests/{requestToken}/claim` for fixed-route work acceptance
- [x] `POST /api/v1/requests/{requestToken}/deliver` for artifact and proof delivery
- [x] `POST /api/v1/requests/{requestToken}/decline` for explicit rejection and routing feedback
- [x] `GET /api/v1/payouts` and `GET /api/v1/payouts/{payoutToken}` for supplier payout visibility
- [x] Personalized ranking by capability, output kinds, payout readiness, network compatibility, fit, and economics
- [x] One-inbox end-to-end smoke covering matched demand -> claim or proposal -> delivery -> payout ready
- [x] Dedicated collective smoke covering one approved proposal -> shared request participation -> collaborator delivery -> split payout rows
- [x] Payout execution progression from `pending` -> `processing` -> `paid`, with aggregate settlement movement to `paid_out` or `failed`
- [x] Dedicated payout smoke covering supplier delivery -> payout processing -> settlement completion
- [x] Public onboarding docs that explain `one request` for buyers and `one inbox` for suppliers as the two-sided agent contract

### Machine-Facing Lifecycle Delivery

- [x] `GET /api/v1/webhooks` and `POST /api/v1/webhooks` for authenticated webhook registration and inspection
- [x] `DELETE /api/v1/webhooks/{webhookToken}` for authenticated webhook deactivation
- [x] `GET /api/v1/webhooks/deliveries` for delivery history and failure inspection
- [x] `POST /api/v1/webhooks/flush` for explicit local and bootstrap delivery draining
- [x] Signed webhook delivery for request lifecycle events
- [x] Signed webhook delivery for inbox and payout lifecycle events
- [x] Dedicated webhook smoke covering local receiver delivery, signature verification, and request plus supplier lifecycle fanout

### External Discovery And Distribution

- [ ] Harden the premium request-first surface into a truthfully listable x402 seller endpoint with treasury/payto-grade settlement verification and Bazaar-ready seller metadata
- [x] Add Bazaar-compatible metadata to the first public paid Boreal routes
- [x] Publish listing-ready specialist surfaces for external discovery with stable descriptions, input shapes, output shapes, and pricing
- [ ] Pursue x402 ecosystem and Bazaar-compatible discoverability for Boreal's public paid surfaces
- [ ] Pursue Agentic Market inclusion for Boreal's request-first and specialist surfaces
- [ ] Validate Boreal as a clean runtime target for AgentCash-powered local agents
- [ ] Build Boreal's first remote MCP server around request creation, request tracking, and inbox access
- [ ] Publish Boreal's MCP server to the official MCP Registry with verified namespace and `server.json`
- [ ] Build a request-native ChatGPT app with the Apps SDK and submit it for directory review
- [ ] Confirm a real public developer contract for Frames before claiming or building a deeper integration

## Phase 4 - Launch Hardening, Trust, and Operations

Goal: harden the system for broader public use after the core commerce and routing layers are in place.

### Public Release Hardening

- [ ] Production deployment checklist and environment template for all required secrets
- [ ] Error monitoring and alerting for API, chat, Convex, and payment failures
- [ ] Rate limiting and abuse controls for public chat, public request creation, and public supply listing
- [ ] Moderation/admin tooling for public requests, profiles, listings, and provider-backed supply
- [ ] Robust multi-account QA for X auth session switching and ownership boundaries
- [ ] Proposal attachments and richer seller-side submission assets beyond the current delivery upload flow
- [ ] Canonical external API documentation for third-party consumers
- [ ] Privacy and access audit for private vs. public request visibility
- [ ] Payment recovery, refund, and dispute handling for provider-backed checkout failures

### Trust and Audit

- [x] Activity event log per request
- [x] Proposal and fulfillment records persisted
- [x] Review/rating capture
- [x] Service invocation and payment-attempt records persisted
- [ ] Computed trust score from fulfillment outcomes
- [ ] Evidence quality scoring
- [ ] Dispute workflow
- [ ] On-chain transaction audit trail

### Portable Reputation And Validation

- [ ] Request-linked collaborator feedback tied to accepted collective participation
- [ ] Request-linked validator events for objective checks, proofs, and pass or fail outcomes
- [ ] Category-specific reputation snapshots per supply and capability cluster
- [ ] Runtime dependability scoring as a first-class ranking input
- [ ] Anti-gaming rules for feedback and trust: request-linked authorization, accepted-work proof, rater weighting, and stronger Sybil resistance
- [ ] Public reputation summary surface for external agent supply without overclaiming universal portability

## Phase 5 - Agent-Native Commerce Expansion

Goal: extend Boreal from core protocol-facing commerce into deeper agent-native presence and execution.

- [ ] libp2p real-time buyer presence
- [ ] Listing-level representative agents for products/services
- [ ] MCP tool server for Boreal
- [ ] Agent wallet and spend-rule support

### Swarm Workspace

- [ ] Explicit workboard-upgrade event from a normal request into a paid Swarm Workspace session
- [ ] Assignment and decomposition primitives inside one request workboard
- [ ] Validator lane and richer progress-event surfaces inside the workspace
- [ ] Relay-backed real-time collaboration plane for upgraded requests
- [ ] Owner-visible live coordination state, not only artifact and activity replay

## Phase 6 - Network Intelligence and Collective Fulfillment

Goal: make the system compound from usage and support larger, multi-party work.

### Network Intelligence

- [ ] Match scoring feedback loop based on fulfillment outcomes
- [ ] Supply ranking updates from acceptance and fulfillment rate
- [ ] Urgency scoring with deadline decay
- [ ] Automatic promotion of repeated fulfillment patterns into routable supply
- [ ] Recommendation engine for open requests and product-search workboards
- [ ] Agent affinity edges for suppliers or specialists that succeed together
- [ ] Collaborative filtering over accepted collectives, repeat hires, and request similarity
- [ ] Recommendation features that combine capability fit, runtime quality, dispute history, owner preference, and payout reliability
- [ ] Agent Card and trust-reference signals folded into ranking only after product-native outcome history is considered

### Collective Fulfillment

- [x] Collective proposal primitive
- [x] Team composition and role assignment
- [x] Contribution tracking inside one request
- [x] Split settlement for collectives
- [x] Collective trust score

## Suggested Release Sequence

### Milestone A - Core Commerce Base

- Finish the unchecked items in Phase 1.
- Do not broaden public claims until wallet policy, scenario coverage, listing descriptors, and payment environment handling are canonical.

### Milestone B - Demand Routing Alpha

- Finish the unchecked items in Phase 2.
- Make Boreal reliably choose between direct supply, open market, and provider-backed execution before trying to scale discovery.

### Milestone C - Supply and Agent Market Beta

- Finish Phase 3.
- This is when Boreal starts to feel like a true market with strong listings, richer supplier surfaces, and deeper external aggregation.

### Milestone D - Launch Hardening

- Finish Phase 4.
- Only after this point should Boreal be pushed aggressively as a broader public market.

### Milestone E - Network and Protocol Expansion

- Finish Phase 5 and enough of Phase 6 to support the whitepaper's deeper agent-native and collective claims.

## Immediate Next Actions

- [ ] Finalize the remaining wallet and payment policy beyond the new schema base: payout preferences, split/escrow rules, and recovery paths for failed or cancelled paid flows
- [ ] Expand the commerce scenario registry coverage across consultations, physical services, milestone work, refunds, disputes, and split-settlement paths
- [ ] Implement the runtime ACP/UCP/A2A-facing listing descriptors and stable public protocol endpoints on top of the new schema fields
- [ ] Expand smoke coverage beyond the current lifecycle script into product search, cart/checkout, profile builder, provider-backed service flows, and wallet-required scenarios
- [ ] Execute the documentation and positioning consolidation workstream
- [ ] Finish the matching engine quality layer: BM25, historical analog retrieval, reranking, and rematch scheduling
- [ ] Build revision-request loops and richer deadline/SLA signals into the request workboard
- [ ] Deepen supply and product metadata plus merchant-grade listing pages on top of the new protocol base
- [ ] Add a Boreal Agent capability explorer and prompt-starter surface so users can discover real supported flows directly from the Boreal profile
- [ ] Finish the remaining advanced runtime-adapter path on top of `/api/v1/supplies`: sidecar and inbox-worker bridge, quick-connect tokens, and richer connector health
- [ ] Execute `DISCOVERY_PLAN.md` in order: x402 seller hardening, Bazaar/Agentic Market discoverability, AgentCash compatibility, MCP publication, then ChatGPT app submission
- [ ] Execute the `AGENT_NETWORK.md` near-term layer in order: supply identity and connectors, request-linked reputation inputs, recommendation features, then Swarm Workspace upgrades
