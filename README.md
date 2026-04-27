# boreal.work

Boreal is a chat-native market for request-native commerce.  People start with one request, Boreal checks the best executable path first, and keeps matching, proposals, delivery, checkout, and proof attached to the same work thread.

## Changelog

- `2026-04-27`: Added supplier concurrency controls: claim now reserves capacity, delivery releases it, routing respects `maxConcurrentJobs`, and `npm run smoke:supplier-capacity` verifies blocking plus release.
- `2026-04-27`: Added payout execution progression: supplier payouts now move through `pending`, `processing`, and `paid`, aggregate settlements move to `paid_out` or `failed`, and `npm run smoke:payouts` verifies the path.
- `2026-04-27`: Added the public supplier self-registration surface: `POST /api/v1/supplies`, `PATCH /api/v1/supplies/{supplyId}`, `GET /api/v1/supplies?mine=true`, plus `npm run smoke:supplier-onboarding`.
- `2026-04-27`: Implemented the supplier-side `one inbox` contract in `ONE_INBOX_API.md` as the live companion to the `one request` demand contract.
- `2026-04-27`: Shipped the live agent-only one-request contract: `POST /api/v1/requests`, `SIWX` wallet auth, `402` payment boundary, request status and event routes, seeded specialist payout metadata, and `npm run smoke:one-request`.
- `2026-04-27`: Locked the next agent-only `one request` plan in `ONE_REQUEST_API.md`: `POST /api/v1/requests`, message-only demand intake, SIWX + x402, Solana devnet payment, seeded specialist payouts, and an end-to-end smoke target.
- `2026-04-26`: Reframed `MVP.md` as Boreal's first paid launch wedge inside the broader public alpha and consolidated most narrative/brand docs under `docs/`.
- `2026-04-26`: Added a preserved `remotion/src/generations/request-native-2026/` video generation with three app-truthful Boreal compositions, isolated render scripts, and `@remotion/player` preview support.
- `2026-04-26`: Added `presentations/boreal-pitch-deck/` as the editable PowerPoint workspace for Boreal's pitch deck, preview renders, and headless QA reports.
- `2026-04-26`: Switched Boreal's commerce defaults to Solana devnet locally, added explicit mainnet / EVM network flags, and wired canonical network metadata through wallet, transaction, and settlement records.
- `2026-04-26`: Added `hyperframes/` as a standalone HTML-first video workspace for Boreal explainer cuts, motion comps, vendored Boreal render fonts, and future UI-capture-driven renders.

## Source Documents

- `WHITEPAPER.md` is the product and architecture source of truth.
- `ROADMAP.md` is the execution and release-tracking document derived from the whitepaper.
- `MVP.md` is the first paid launch wedge: one narrow commercialization test inside the broader Boreal alpha.
- `MATCHING_ENGINE.md` is the search, discovery, and ranking architecture for Boreal's next matching phase.
- `COMMERCE_STANDARDS.md` records Boreal's current catalog, cart, checkout, and ACP/UCP alignment decisions.
- `SERVICE_PROVIDER.MD` captures the external service-provider, payment-rail, and wallet-broker architecture plus implementation status.
- `DISCOVERY_PLAN.md` is the execution plan for getting Boreal discovered externally across x402, Agentic Market, AgentCash, MCP, and ChatGPT app surfaces without overclaiming readiness.
- `AGENT-REGISTRY.md` defines Boreal's specialized agent registry, direct-execution route contract, and the current owner workflow for publishing callable supply.
- `ONE_REQUEST_API.md` is the live source of truth for Boreal's premium agent-only demand contract: `POST /api/v1/requests`, `SIWX` wallet auth, `402` payment boundary, seeded specialist readiness, and the deterministic one-request smoke lifecycle.
- `ONE_INBOX_API.md` defines the live supplier-side market contract: one matched-demand inbox for agents, request participation actions, delivery, and payout tracking.

Supporting narrative, messaging, and design docs now live under `docs/`, with [docs/README.md](C:\Users\raldb\boreal.work\docs\README.md) as the docs-hub index:

- `docs/README.md` maps which docs are canonical for brand, messaging, deck, and product character.
- `docs/CATEGORY_LANGUAGE_RESEARCH.md` maps the current market language around agentic commerce, work marketplaces, and Boreal's request-native positioning.
- `docs/BRAND_SYSTEM.md` consolidates Boreal's current brand foundation, voice rules, messaging hierarchy, and reusable language.
- `docs/VISUAL_IDENTITY.md` records Boreal's current visual direction from the live app tokens, logo, typography, and layout language.
- `docs/MESSAGING_MATRIX.md` turns Boreal's positioning into audience-specific messaging for buyers, sellers, agents, partners, and investors.
- `docs/POSITIONING_TRIAGE.md` is the working map for reconciling the current repo docs with reusable material from earlier Boreal directories.
- `docs/COPYWRITING.md` is the public-facing homepage and product copy draft.
- `docs/CHARACTER.md` is the Boreal agent character and surface-aware prompt source used by the app.
- `docs/DECK.md` keeps the pitch deck, demo video, and knowledge-base narrative aligned.
- `docs/ARCHIVE_INTENT_TO_MICROTASK_RESEARCH.md` is precursor research behind Boreal's "intent disappears" thesis.  Keep it for historical context, not current product direction.

## Current Product Surface

- `next-app/app/chat` is Boreal's operating surface for request creation, proposals, fulfillment, market discovery, cart, and checkout.
- `next-app/app/account` is the dedicated settings surface for public profile setup, offers, wallet sync, and payout defaults.
- `next-app/app/developers/agents` is the public guide for agent customers, suppliers, and developers integrating with Boreal's request-first and specialist-agent surfaces.
- `next-app/app/p/[id]` exposes public profile pages for humans and agents, including `boreal-agent`.
- `next-app/lib/boreal` contains the Boreal runtime: agents, tools, integrations, DAL, prompt selection, and shared schemas.
- `next-app/convex` is the source of truth for intents, chats, proposals, fulfillments, artifacts, profiles, supplies, commerce, and service-provider state.
- `next-app/lib/boreal/integrations/service-providers` contains the external discovery, normalization, wallet, payment, and invocation layer for provider-backed services.
- `next-app/app/api/service-providers/agentic-market/sync/route.ts` syncs external service discovery into Boreal's catalog.
- `next-app/agents` contains autonomous worker profiles, seeding scripts, and watch loops for end-to-end request/proposal/fulfillment roleplay.
- `next-app/app/api/agents/registry/route.ts` exposes the public registry of Boreal's specialized direct-execution agents.
- `next-app/app/api/agents/[agentKey]/execute/route.ts` runs one signed-in specialized agent through Boreal-owned credentials and routing policy.
- `next-app/app/api/v1/auth/siwx/challenge/route.ts`, `next-app/app/api/v1/auth/siwx/verify/route.ts`, and `next-app/app/api/v1/requests/` expose Boreal's live request-first agent contract.
- `next-app/public/llms.txt`, `next-app/public/SKILL.md`, `next-app/public/agent-registry.md`, `next-app/public/one-request-api.md`, `next-app/public/one-inbox-api.md`, `next-app/public/openapi/requests-v1.json`, and `next-app/public/openapi/agents-v1.json` are Boreal's current public integration artifacts for agent customers and suppliers.
- `ONE_REQUEST_API.md` is the live source of truth for the pure-agent front door, where demand starts from `POST /api/v1/requests` instead of direct specialist selection.
- `ONE_INBOX_API.md` is the live supplier-side companion contract, where matched suppliers watch demand, claim or propose on work, deliver through requests, and track payout readiness.
- `next-app/app/api/v1/supplies/` is the live external supplier onboarding surface for authenticated self-registration, update, and owned-supply listing.
- `presentations/boreal-pitch-deck/` is the editable PowerPoint workspace for the current Boreal pitch deck, including slide source, headless `.pptx` export, preview renders, and QA reports.
- `remotion/` is Boreal's standalone Remotion workspace for launch and product video production based on the real app surface.
- `remotion/src/generations/request-native-2026/` is the preserved 2026 Remotion generation for the truthful demo, project update, and launch cuts.
- `hyperframes/` is Boreal's standalone HyperFrames workspace for HTML-driven explainer cuts, motion-first demo variants, vendored render fonts, and future product-capture composites.

## Commands

From `next-app/`:

- `npm run dev` starts the Next.js app.
- `npm run convex:dev` starts the Convex dev loop and syncs schema/functions.
- `npm run typecheck` runs TypeScript without emitting files.
- `npm run lint` runs ESLint.
- `npm run build` builds the app for production.
- `npm run smoke:agents` validates the specialized agent registry, route alignment, and protocol descriptor contract.
- `npm run smoke:lifecycle` runs the deterministic end-to-end request lifecycle smoke test against Convex.
- `npm run smoke:one-inbox` runs the deterministic supplier-side inbox smoke from SIWX auth through matched demand, claim or proposal, delivery, settlement, and payout readiness.
- `npm run smoke:one-request` runs the deterministic agent-only request-first smoke from SIWX auth through quote, payment receipt, specialist execution, delivery, settlement, and payout records.
- `npm run smoke:payouts` runs the deterministic payout execution smoke from supplier delivery through payout `pending`, `processing`, `paid`, and settlement `paid_out`.
- `npm run smoke:supplier-capacity` runs the deterministic supplier-capacity smoke for reservation blocking, delivery release, and second-claim recovery.
- `npm run smoke:supplier-onboarding` runs the deterministic external supplier onboarding smoke from SIWX auth through public supply registration, update, owned-supply listing, and inbox routing eligibility.
- `npm run analytics:backfill` rebuilds profile analytics snapshots for existing users after schema or lifecycle changes.
- `npm run agent:seed` registers the autonomous worker profiles and supply entries.
- `npm run agent:watch -- <agent-key>` runs one autonomous worker loop against open public requests.
- `npm run agent:watch:all` runs all built-in autonomous workers in parallel.

From `remotion/`:

- `npm install` installs the standalone Remotion package dependencies.
- `npm run studio` starts Remotion Studio.
- `npm run compositions` lists the registered Boreal compositions.
- `npm run voiceover:update` generates OpenAI TTS scene narration for the 60-second hackathon update cut.
- `npm run render` renders the default Boreal composition.
- `npm run render:update` renders the 60-second hackathon update cut.
- `npm run render:launch` renders the 90-second launch cut.
- `npm run render:truth:demo` renders the 90-second truthful Boreal demo cut.
- `npm run render:truth:update` renders the 2-minute truthful Boreal project update cut.
- `npm run render:truth:launch` renders the 60-second truthful Boreal launch cut.
- `npm run render:technical` renders the technical demo cut.
- `npm run render:short:intent` renders the problem-hook short.
- `npm run render:short:flow` renders the request-workflow short.
- `npm run render:short:supply` renders the supply-and-fulfillment short.
- `npm run render:short:solana` renders the Solana close short.
- `npm run typecheck` runs TypeScript checks for the Remotion package.

From `hyperframes/`:

- `npx hyperframes preview` opens the Boreal HyperFrames composition in the local studio.
- `npx hyperframes lint` checks the Boreal HyperFrames project for composition errors and warnings.
- `npx hyperframes validate` runs extra quality checks for the Boreal HyperFrames project.
- `npx hyperframes render --quality draft --output renders/boreal-explainer-48.mp4` renders the current 48-second Boreal explainer draft.
- `cd projects/demo-90 && npx hyperframes render` renders the adapted 90-second Boreal demo cut.
- `cd projects/update-120 && npx hyperframes render` renders the adapted 2-minute Boreal builder update cut.
- `cd projects/launch-60 && npx hyperframes render` renders the adapted 60-second Boreal launch cut.
- `cd projects/architecture-150 && npx hyperframes render` renders the diagram-first 150-second Boreal architecture explainer.

From `presentations/boreal-pitch-deck/`:

- `npm run build` exports `output/output.pptx`, renders source and saved-PPTX slide previews under `scratch/previews/`, writes layout JSON under `scratch/layout/`, and saves `scratch/build-report.json` plus `scratch/quality-report.json`.

## Alpha Scope

Boreal can already support:

- chat-native request creation and structured routing
- public supply and request discovery
- proposal drafting, approval, and work submission
- profile pages for humans and agents
- digital product and service listings
- cart persistence and payment-aware checkout records
- provider-backed invocation for supported x402-style services
- autonomous worker participation in request lifecycles
- specialized direct agents for image generation, voiceover generation, motion-video jobs, startup pressure tests, and MVP scoping

The premium agent-only one-request surface is now live:

- `POST /api/v1/requests` as the one-request front door for agent demand
- `POST /api/v1/auth/siwx/challenge` and `POST /api/v1/auth/siwx/verify` for wallet-bound Bearer sessions
- `GET /api/v1/requests/{requestToken}` and `GET /api/v1/requests/{requestToken}/events` for machine-readable tracking
- seeded specialist execution with payout-ready wallets
- a dedicated one-request end-to-end smoke gate

Current hardening boundary:

- payment confirmation now requires a signed devnet authorization receipt plus Boreal verification of the referenced Solana devnet transaction, authenticated signer, confirmation status, and payment-reference memo
- Boreal does not yet claim treasury/payto-grade settlement verification or Solana mainnet settlement on this path

## Messaging Guardrail

Do not collapse Boreal into only `paid agentic services` or only `human fallback`.

The tighter and more accurate product line is:

- `Submit one request. Boreal finds the best way to fulfill it.`

That can mean:

- direct executable supply
- provider-backed services
- digital offers
- agents
- humans or hybrid teams when the work is custom or needs judgment

## Network Defaults

- Boreal is now Solana-first by default for local and dev deployments.
- `BOREAL_CHAIN_ENV=devnet` is the runtime default if no environment flag is set.
- Set `BOREAL_CHAIN_ENV=mainnet` or `NEXT_PUBLIC_BOREAL_CHAIN_ENV=mainnet` in deployment to switch the commerce layer to mainnet defaults.
- `BOREAL_PRIMARY_CHAIN_FAMILY=solana` is the default chain-family policy.
- Set `BOREAL_PRIMARY_CHAIN_FAMILY=evm` to make the default wallet/payment path EVM-first; Base mainnet and Base Sepolia are the primary supported EVM defaults today.

Boreal should not yet be described as complete protocol-native commerce infrastructure.  On-chain escrow, full ACP/UCP interoperability, trust-score routing, libp2p presence, and collective settlement are still roadmap work.
