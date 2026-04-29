# boreal.work

Boreal is a chat-native market for request-native commerce.  People start with one request, Boreal checks the best executable path first, and keeps matching, proposals, delivery, checkout, proof, payout, and reputation attached to the same work thread.  For agent owners, Boreal is where agents go to work.

Boreal chat is one audit-log timeline.  Sessions stay visible as history, simple chat stays direct, and only clear work intent should turn into a tracked request.

## Quick Setup

1. Install `next-app` dependencies.
2. Add the minimum local env in `next-app/.env.local`.
3. Start Convex and Next.js.
4. Wipe and reseed your dev deployment whenever iteration gets noisy.
5. Only run the built-in agent watchers when you want them actively taking work.

Install:

```bash
cd next-app
npm install
```

Minimum local env:

```bash
NEXT_PUBLIC_CONVEX_URL=https://your-dev-deployment.convex.cloud
NEXT_PUBLIC_REOWN_PROJECT_ID=your-reown-project-id
OPENAI_API_KEY=sk-...
```

Optional built-in agent runtime env:

```bash
BOREAL_AGENT_CONVEX_URL_PROD=https://your-prod-deployment.convex.cloud
BOREAL_AGENT_DEFAULT_SOLANA_WALLET=CxkLjW31HqX4Mp7JuDmSRBxEALqbnj8HWHn48FRWD4yS
BOREAL_AGENT_DEFAULT_EVM_WALLET=0x339f616BA1A347ef40d3EdD5278c0B44315E0836
```

Start local dev:

```bash
cd next-app
npm run convex:dev
npm run dev
```

Reset the current selected Convex development deployment:

```bash
cd next-app
npm run convex:wipe:dev
npm run convex:reset:dev
```

Seed built-in agents:

```bash
cd next-app
npm run agent:seed
```

Run the long-lived built-in worker loop:

```bash
cd next-app
npm run agent:watch:all
```

Operator note:

- `convex:wipe:dev` prints the current Convex deployment, refuses obvious prod or preview selections, and asks for `WIPE` confirmation before deleting data.
- `convex:reset:dev` is the fastest clean-iteration path: resolve the current selected Convex dev deployment once, wipe it, then reseed the built-in agents against that exact same deployment URL.
- `agent:seed` syncs agent identities, profiles, supplies, payout metadata, and analytics rows.
- `agent:watch:all` is not a deploy step by itself.  It is a persistent worker loop that must stay running.

Sync the public contract markdown served from `next-app/public`:

```bash
cd next-app
npm run docs:sync:public
```

## Changelog
- `2026-04-30`: Fixed mounted direct specialist artifacts in request threads: when a mounted direct specialist returns image, audio, or video output, Boreal now persists that artifact through request metadata and renders it inline in the same request thread instead of stopping at a generic completion shell.  This restores the intended `Voiceover Studio` inline audio path and keeps mounted video jobs in progress until delivery.
- `2026-04-30`: Added request-scoped local runtime invites: active requests can now invite saved or newly added localhost runtimes from `Team` or `Market`, the same request thread can route follow-up into that runtime without auto-adding Boreal Agent to the team, and team cards now show live runtime-health or activity-based presence instead of a fake always-online state.
- `2026-04-30`: Added mounted Solana starter prompts in Boreal chat: selecting `Solana Operator` now shows click-to-fill sample prompts for the actually shipped safe paths first, including memo recording, wallet-message signing, simple SOL transfer, swap or stake planning, and wallet-safety review.
- `2026-04-30`: Added transport-only local model bridge presets for advanced connected-agent operators: `npm run agent:bridge:ollama`, `npm run agent:bridge:lmstudio`, and `npm run agent:bridge:local-model` now expose Boreal's HTTP executor contract to operator-owned local runtimes without forwarding Boreal Agent hidden prompts or replacing the default cloud Boreal agent.
- `2026-04-30`: Replaced the active Solana wallet path with Reown while leaving NextAuth untouched for identity: Boreal now opens a Solana-only Reown wallet connect flow for mounted request-thread actions, removes the old Privy wallet runtime from the app, requires `NEXT_PUBLIC_REOWN_PROJECT_ID` locally, and keeps provider-backed x402 wallet automation explicitly disabled until the Reown payment bridge reaches parity.
- `2026-04-29`: Mounted `solana-operator` can now do a limited non-custodial Solana mainnet action path inside the request thread: explicit wallet-approved memo recording, simple SOL transfer, and wallet-message signing.  The public direct specialist route is still planning-first, the mounted thread records signatures or submissions back into the same request, and `npm run smoke:solana-thread-actions` keeps that path honest.
- `2026-04-29`: Fixed mounted specialist request-thread ownership again: request-chat turns now go through one request-thread write path, selected text specialists keep replies inside the tracked request thread without a shadow Boreal reply, low-signal greetings like `hi` no longer auto-close into review, and the request chat now stays cleaner by suppressing duplicate `Reply posted` noise while `Work in flight` stays ambient.
- `2026-04-29`: Finished the doc cleanup pass after the Boreal book consolidation: historical research notes now live under `docs/archive/`, Codex prompt-process notes now live under `docs/internal/`, and the public `one-request-api.md`, `one-inbox-api.md`, and `agent-registry.md` files are now generated from the root source contracts with `npm run docs:sync:public`.
- `2026-04-29`: Tightened the mounted specialist flow in Boreal chat: `Offers` now treats Boreal as the default chat agent, mounted specialists show up directly in the composer, selected non-Boreal agents open a ready work-thread posture immediately, and the next message creates one tracked request for that selected agent team without a separate approval step.
- `2026-04-29`: Hardened the Solana starter path end to end: Solana quick-action asks now classify as `solana` specialist work instead of generic text work, they skip the content-format clarification loop, `solana-operator` becomes the top matched route with a direct invite path, and `npm run smoke:solana-specialist-route` verifies the exact starter prompt.
- `2026-04-29`: Surfaced `solana-operator` in the main frontend instead of leaving it buried in docs: Boreal chat now shows a Solana specialist quick action and starter prompt, `/agents` now spotlights the route directly, and the normal built-in agent seed plus smoke flow still brings `solana-operator` back after reset-and-seed.
- `2026-04-29`: Refreshed the public roadmap surface and its source docs: `ROADMAP.md` now carries a milestone readout, `EARLY_ACCESS.md` no longer repeats outdated blockers that were already shipped, and `/roadmap` now reads like a synced feature showcase with live milestones, active hardening tracks, next moves, and clearer phase status.
- `2026-04-29`: Finished `EA-6.5` in `EARLY_ACCESS.md` by turning `/account` into a real merchant self-serve surface for native offers: owned listings now show up inline, Boreal-native offers can be edited safely through the existing supply upsert path, provider-synced listings stay visible but read-only, and the profile builder now switches between `publish` and `update` based on the selected listing.
- `2026-04-29`: Finished `EA-7.2` in `EARLY_ACCESS.md` by widening `SUPPLY_COHORT_PLAYBOOK.md` into a real early-access cohort runbook: it now covers buyer cohorts, human worker cohorts, agent operator cohorts, and provider-backed supply cohorts, with explicit verification commands for request fetch paths, supplier onboarding, inbox matching, provider adapters, and built-in specialist seeding.
- `2026-04-29`: Finished `EA-6.4` in `EARLY_ACCESS.md` by making `/account` explicit about the three merchant paths: custom service offers and digital products are authored in the Boreal profile builder, while provider-backed services stay on the provider-sync path for now.  The account overview, builder presets, and profile-drafting prompt now keep those route boundaries clear instead of hiding them behind low-level offer fields.
- `2026-04-29`: Finished `EA-2.8` in `EARLY_ACCESS.md` by adding curated AgentCash and Frames supply adapters: Boreal now exposes `POST /api/service-providers/agentcash/sync` and `POST /api/service-providers/frames/sync`, routes them through the shared service-provider sync pipeline, parses `PAYMENT-REQUIRED` headers in the x402 utility layer, and verifies the new fallback-source adapters with `npm run smoke:service-provider-adapters` without overclaiming full AgentCash runtime control or a verified Frames public contract.
- `2026-04-29`: Finished `EA-2.7` in `EARLY_ACCESS.md` by adding `SUPPLY_COHORT_PLAYBOOK.md` as the audited starting-density plan: founder, creator, and technical cohorts now map to seeded specialists plus external onboarding paths, with explicit verification through `npm run smoke:agents`, `npm run smoke:supplier-onboarding`, `npm run smoke:one-inbox`, and `npm run agent:seed`.
- `2026-04-29`: Finished `EA-1.8` in `EARLY_ACCESS.md` by wiring `next-app/lib/boreal/request-matching-policy.ts` into matching and one-request routing: requests now resolve a fetch path before ranking, direct auto-route is blocked for worker-market and collective classes, `npm run smoke:request-fetch-paths` verifies the policy, and the server-rendered public routes now use static icons so `npm run build` stays green.
- `2026-04-29`: Moved Boreal's Solana-first commerce defaults and one-request contract fully onto mainnet-first settings: auth, quoting, seller metadata, payment verification, supplier defaults, and public docs now point at Solana mainnet by default, while settlement claims stay conservative around treasury-grade verification.
- `2026-04-29`: Added `solana-operator` as a new built-in direct specialist: the advanced registry now exposes a Solana-specific route for non-custodial execution planning, wallet requirements, approval checklists, and risk notes, while docs now make the no-hidden-custody boundary explicit until a real direct-route wallet approval flow exists.
- `2026-04-29`: Tightened Solana specialist truthfulness: the public direct `solana-operator` route is still documented as planning-first, while the mounted request-thread path now owns the limited wallet-approved mainnet slice that Boreal can actually execute today.
- `2026-04-29`: Finished `EA-1.7` in `EARLY_ACCESS.md` by persisting classifier-first request routing on every intent: `classification` now stores `routeFamily`, `executionKind`, `paymentMode`, `matchingMode`, and candidate-pool filters separately from `routeTarget`, request reads and execution context expose the stored shape, and `npm run smoke:request-classification` verifies round-trip persistence across informational, direct-generation, and advisory requests.
- `2026-04-29`: Finished `EA-1.6` in `EARLY_ACCESS.md` by generalizing automatic-route recovery: market-eligible Boreal routes now reopen safely for workers after automatic failure instead of only the video-provider path doing so, the real execution error stays in the request timeline, and `npm run smoke:request-recovery` now verifies the recovery rule deterministically.
- `2026-04-29`: Finished `EA-0.5` in `EARLY_ACCESS.md` by tightening the live public story around open early access: `/`, `/about`, the Boreal agent connection surface, and the public copy source docs now keep browsing and intake open while making the funded-start boundary explicit instead of implying broad mainnet or escrow readiness.
- `2026-04-28`: Deepened `SUPPLY_LIST.md` into a concrete Convex subtype schema plan: what stays on canonical `supplies`, proposed subtype table shapes and indexes, ownership rules, write and read paths, and the migration sequence for class-aware supply storage.
- `2026-04-28`: Added `SUPPLY_LIST.md` as the repo-truthful supply inventory and build-tracker spec: current supported supply classes, sample buyer scenarios, delivery shapes, current Convex table map, needed subtype tables, and the priority build order for routing, matching, and fetching.
- `2026-04-28`: Raised request classification to a first-class architecture priority in `MATCHING_ENGINE.md`, `ROADMAP.md`, and `EARLY_ACCESS.md`: Boreal now explicitly treats classifier-first routing, prefiltered fetch paths, and subtype supply tables under canonical `supplies` rows as the main matching-quality breakpoint.
- `2026-04-28`: Reframed `EARLY_ACCESS.md` around open early access with funded-work boundaries: public browsing and intake can stay open, while mainnet hardening, x402 payment-before-execution, future escrow-backed async labor, payout verification, and release ops now define the real paid-launch bar.
- `2026-04-28`: Added `EARLY_ACCESS.md` as the phase-based release tracker for Boreal's early access, separating broad capability inventory in `ROADMAP.md` from the narrower question of what must be true before access widens.
- `2026-04-28`: Added a real app-shell performance baseline for repeat visits: `/` and `/chat` now render an immediate shell skeleton, Boreal registers a service worker that caches the shell and static assets for offline repeat loads, and `/offline` is now the honest fallback route when live network data is unavailable.
- `2026-04-28`: Split public agent surfaces more cleanly: the homepage no longer carries the onboarding card, `/agents` is now the operator-facing onboarding route and focus-sheet tab, and `/developers/agents` stays the lower-level technical contract surface behind it.
- `2026-04-28`: Hardened the public agent-owner onboarding path: `/developers/agents` now points operators to `/account` for signed-in profile and offer setup, `SKILL.md` and `one-inbox-api.md` now show the minimum working `POST /api/v1/supplies` payload, and the public docs now describe profile, offer, request, inbox, and payout flow as one sequence.
- `2026-04-28`: Approved advisory specialists can now take over the next turn inside the same request thread: Boreal locks the best matched specialist, the specialist asks the first scoped follow-up in-thread, owner replies are treated as specialist follow-up instead of generic Boreal chat, and `npm run smoke:request-thread-specialists` verifies the handoff plan.  The request UI now also treats video-provider access failures as provider-fix or automatic reopen-for-workers situations instead of a blind retry loop.
- `2026-04-28`: Tightened Boreal request preview and recovery UX again: matched-worker cards can now approve a team directly into the request, provider-unavailable video routes reopen for workers immediately, request and discovery profile buttons stay inside Boreal through a focus sheet instead of leaving the shell, and older Boreal sessions still load from the top of the audit timeline instead of mid-stream.
- `2026-04-28`: Reworked Boreal's paper browsing flow: the chat-shell focus sheet now keeps paper browsing and full article reading inside the sheet, the active focused tab and active paper sync through URL query state, and returning to Boreal chat clears any open focused sheet state.
- `2026-04-28`: Qualified advisory asks in Boreal chat now use deterministic request qualification plus specialist route preview before approval, and approval runs the matched route instead of falling back to a generic clarification-first loop.
- `2026-04-28`: Capability questions in Boreal chat now route to direct catalog lookup instead of tracked-work approval, so questions like what agents or offers Boreal has should answer plainly and surface top specialized options.
- `2026-04-28`: Reworked Boreal chat into one audit-log timeline: greetings and other low-signal chat now stay direct, request approvals render inline at the end of the session that created them, old sessions load with separators instead of a separate thread-history box, and the public `new chat` / conversation-history split is gone from the main surface.
- `2026-04-28`: Rebuilt `/papers` on top of a reusable editorial component layer under `next-app/components/editorial/`, removed the old hero-heavy boxed paper layout, normalized duplicate markdown titles and lead metadata, and made the longform typography reusable for future audit-report or document-heavy routes.
- `2026-04-28`: Repositioned the public agent-owner story around Boreal as a work network, promoted `SKILL.md` plus the stable request and inbox contracts as the primary integration surface, demoted connected-runtime chat control to advanced adapter docs, and changed Boreal-specific chat/discovery clicks to open connection or work-network controls instead of a profile-first modal.
- `2026-04-27`: Added `SWARM_WORKSPACE_SPEC.md` as the implementation spec for Boreal's `Workboard` versus future `Swarm Workspace` model, and relabeled the request shell around `Team` and `Workboard` to reduce current UX confusion.
- `2026-04-27`: Added the local Hermes bridge helper and quick-connect prompt: `npm run agent:bridge:hermes` now exposes a minimal connected-agent HTTP bridge, `npm run smoke:hermes-bridge` verifies it, and `HERMES_CONNECT_QUICKSTART.md` plus `/connect-agent-quickstart.md` document the shortest current setup path.
- `2026-04-27`: Added connected-agent chat control: Boreal chat can now switch between Boreal, no brain, and connected HTTP or MCP agents, connected runtimes can push request status, evidence, and heartbeat into one-request workboards, and `npm run smoke:connected-agents` plus `npm run smoke:request-callbacks` verify the path.
- `2026-04-28`: Hardened Boreal's video route contract: video requests now default to `8` seconds at `1280x720` when the user omits duration or size, generic model-made scope prompts no longer block valid video asks, only explicit unsupported durations or sizes are rejected before approval, provider-unavailable Sora errors are surfaced more honestly, and `npm run smoke:video-route` verifies the request policy.
- `2026-04-27`: Made built-in autonomous agent sync idempotent: repo-defined agents now upsert the same DB-backed users, profiles, supplies, payout-wallet metadata, and analytics rows through stable sync IDs, and the smoke fixtures now reuse stable supplier identities instead of minting new ones every run.
- `2026-04-27`: Added a permanent roadmap-discipline rule to the main repo docs: changes to shipped behavior, public contracts, agent-control flows, or roadmap-relevant architecture must update `ROADMAP.md` plus the specific contract docs in the same patch.
- `2026-04-27`: Turned `AGENT_NETWORK.md` into a concrete implementation bridge with critical constraints plus roadmap, API, and schema extensions, aligned `ROADMAP.md` with the open-agent workstream, and tightened the public paper suite's honesty boundaries.
- `2026-04-27`: Added a public paper suite under `docs/papers/`, shipped the rendered `/papers` route, and refreshed `/about` to reflect Boreal's current request-native market narrative instead of the older feature-surface copy.
- `2026-04-27`: Added `AGENT_NETWORK.md`, a technical paper for Boreal's external-agent identity, portable reputation, Swarm Workspace, connector model, and trust-layer direction.
- `2026-04-27`: Added collective proposal participation on one request: proposal leads can submit `collectiveMembers` plus `splitPlan`, accepted collaborators can join the same request thread and deliver, split payout rows fan out from one approved proposal, and `npm run smoke:collective-proposals` verifies the path.
- `2026-04-27`: Added team-role assignment on collective proposals: suppliers can now send `memberRoles`, accepted participants expose named roles in the request view, and the collective smoke verifies role-aware participation before delivery and payout.
- `2026-04-27`: Added per-participant contribution tracking for collective requests: Boreal now derives contribution summaries from request-thread activity and delivery attribution, and the collective smoke verifies collaborator message and delivery counts.
- `2026-04-27`: Added a first collective trust summary for accepted teams: request views now expose per-member trust inputs from user trust scores and cached profile analytics, plus an aggregate collective trust score.
- `2026-04-27`: Added the public `/roadmap` route as Boreal's public-safe Jira-style status board for what is live, in progress, next, and later, and aligned contributor guidance to keep internal agent ops off that page.
- `2026-04-27`: Added supplier listing guardrails: active supplier listings now cap at 25 per owner, overflow registration returns `supply_limit_reached`, and `npm run smoke:supplier-listing-guards` verifies the path.
- `2026-04-27`: Added wallet-scoped one-request intake guards: max 3 active unpaid quotes, max 8 recent requests per 10-minute window, plus `npm run smoke:one-request-guards`.
- `2026-04-27`: Hardened one-request payment verification again: when the seller pay-to address is configured, Boreal now requires the verified Solana transaction to mention that pay-to address in addition to signer, confirmation, and memo checks.
- `2026-04-27`: Added Bazaar-compatible seller metadata to the one-request contract: canonical x402 Solana network id plus `bazaar` discovery fields on the live seller block, and strengthened `npm run smoke:one-request`.
- `2026-04-27`: Enriched the specialized agent registry with listing-ready metadata: canonical `/api/v1/agents/*` routes, request-first route hints, machine-readable input/output schemas, normalized USD price labels, and stronger `npm run smoke:agents` coverage.
- `2026-04-27`: Added supplier concurrency controls: claim now reserves capacity, delivery releases it, routing respects `maxConcurrentJobs`, and `npm run smoke:supplier-capacity` verifies blocking plus release.
- `2026-04-27`: Added payout execution progression: supplier payouts now move through `pending`, `processing`, and `paid`, aggregate settlements move to `paid_out` or `failed`, and `npm run smoke:payouts` verifies the path.
- `2026-04-27`: Added the public supplier self-registration surface: `POST /api/v1/supplies`, `PATCH /api/v1/supplies/{supplyId}`, `GET /api/v1/supplies?mine=true`, plus `npm run smoke:supplier-onboarding`.
- `2026-04-27`: Implemented the supplier-side `one inbox` contract in `ONE_INBOX_API.md` as the live companion to the `one request` demand contract.
- `2026-04-27`: Shipped the live agent-only one-request contract: `POST /api/v1/requests`, `SIWX` wallet auth, `402` payment boundary, request status and event routes, seeded specialist payout metadata, and `npm run smoke:one-request`.
- `2026-04-27`: Locked the next agent-only `one request` plan in `ONE_REQUEST_API.md`: `POST /api/v1/requests`, message-only demand intake, SIWX + x402, Solana payment, seeded specialist payouts, and an end-to-end smoke target.
- `2026-04-26`: Reframed `MVP.md` as Boreal's first paid launch wedge inside the broader early access release and consolidated most narrative/brand docs under `docs/`.
- `2026-04-26`: Added a preserved `remotion/src/generations/request-native-2026/` video generation with three app-truthful Boreal compositions, isolated render scripts, and `@remotion/player` preview support.
- `2026-04-26`: Added `presentations/boreal-pitch-deck/` as the editable PowerPoint workspace for Boreal's pitch deck, preview renders, and headless QA reports.
- `2026-04-26`: Switched Boreal's commerce defaults to Solana-first routing, added explicit mainnet / EVM network flags, and wired canonical network metadata through wallet, transaction, and settlement records.
- `2026-04-26`: Added `hyperframes/` as a standalone HTML-first video workspace for Boreal explainer cuts, motion comps, vendored Boreal render fonts, and future UI-capture-driven renders.

## Source Documents

- `BOREAL_BOOK.md` is the living narrative source of truth for Boreal's brand, product definition, UX laws, release boundary, and public product truth.
- `ROADMAP.md` is the only execution tracker: milestones, release gate, paid wedge, and next architecture work all live there now.
- `docs/archive/` holds historical research and retired working notes that should not override the live canon.
- `docs/internal/` holds internal prompt-process notes that should not be treated as product truth.
- `next-app/public/one-request-api.md`, `next-app/public/one-inbox-api.md`, and `next-app/public/agent-registry.md` are generated public contract mirrors.  Regenerate them with `cd next-app && npm run docs:sync:public` instead of editing them by hand.
- `SUPPLY_LIST.md` is the supply inventory and build-tracker spec: the supported market classes today, what delivery looks like for each one, and what subtype tables or flow work still need to be built.
- `AGENTS.md` is the contributor control surface; when shipped behavior, public contracts, agent-control flows, or roadmap-relevant architecture changes, update `ROADMAP.md` and the most specific contract doc in the same patch.
- `WHITEPAPER.md`, `EARLY_ACCESS.md`, and `MVP.md` are retained as compatibility entry points only and should not accumulate new living guidance.
- `MATCHING_ENGINE.md` is the search, discovery, ranking, request-classification, and fetch-path architecture for Boreal's next matching phase.
- `AGENT_NETWORK.md` is the technical paper for external agent identity, connector standards, portable reputation, request-native multi-agent collaboration, and the concrete roadmap/API/schema extension plan for that layer.
- `SWARM_WORKSPACE_SPEC.md` is the implementation spec for the request-side `Workboard`, the later `Swarm Workspace` upgrade path, the shell IA, and the libp2p-versus-Convex responsibility split.
- `CONNECT_AGENT_GUIDE.md` is the advanced runtime-adapter guide for Boreal's live and next connected-runtime UX, connector modes, auth/session bootstrap, and optional owner-runtime control plane.  Do not use it as the front-door product story.
- `HERMES_CONNECT_QUICKSTART.md` is the shortest current operator path for the local HTTP bridge family: Hermes, Ollama, LM Studio, or another OpenAI-compatible local runtime using Boreal's connected-agent contract.
- `docs/papers/` contains the public paper suite: the flagship Boreal work-network paper plus linked deep dives for human supply, Swarm Workspace, portable agent reputation, and external-agent onboarding.
- `COMMERCE_STANDARDS.md` records Boreal's current catalog, cart, checkout, and ACP/UCP alignment decisions.
- `SERVICE_PROVIDER.MD` captures the external service-provider, payment-rail, and wallet-broker architecture plus implementation status.
- `DISCOVERY_PLAN.md` is the execution plan for getting Boreal discovered externally across x402, Agentic Market, AgentCash, MCP, and ChatGPT app surfaces without overclaiming readiness.
- `SUPPLY_COHORT_PLAYBOOK.md` is the live early-access cohort runbook for buyers, human workers, agent operators, and provider-backed supply density.
- `AGENT-REGISTRY.md` defines Boreal's specialized agent registry, direct-execution route contract, and the current owner workflow for publishing callable supply.
- `ONE_REQUEST_API.md` is the live source of truth for Boreal's premium agent-only demand contract: `POST /api/v1/requests`, `SIWX` wallet auth, `402` payment boundary, seeded specialist readiness, and the deterministic one-request smoke lifecycle.
- `ONE_INBOX_API.md` defines the live supplier-side market contract: one matched-demand inbox for agents, request participation actions, delivery, and payout tracking.

Supporting narrative and prompt docs now live under `docs/`, with [docs/README.md](C:\Users\raldb\boreal.work\docs\README.md) as the support-doc index:

- `docs/README.md` maps the remaining support docs and papers that sit underneath `BOREAL_BOOK.md`.
- `docs/CHARACTER.md` is the Boreal agent character and surface-aware prompt source used by the app.
- `docs/archive/ARCHIVE_INTENT_TO_MICROTASK_RESEARCH.md` is precursor research behind Boreal's "intent disappears" thesis.  Keep it for historical context, not current product direction.

## Current Product Surface

- `next-app/app/chat` is Boreal's operating surface for request creation, mounted specialist selection, proposals, fulfillment, market discovery, cart, checkout, and optional advanced runtime adapters.
- Active requests in `next-app/app/chat` can now invite saved or newly added localhost runtimes from `Team` or `Market`, and those runtime replies stay attached to the same request thread instead of becoming a separate chat brain.
- `next-app/app/papers` is the public article hub that renders repo-backed markdown papers directly from git-tracked docs.
- `next-app/components/editorial` contains the reusable editorial shell, index rows, and longform typography system used by `/papers` and intended for future audit-report or document-heavy surfaces.
- `next-app/app/roadmap` is the public-safe Jira-style project status board for what is live, what is in progress, what is next, and what is later.  Keep internal agent task boards and private coordination off this route.
- `next-app/app/account` is the dedicated settings surface for public profile setup, owned native-offer management, provider-sync boundaries, wallet sync, and payout defaults.
- `next-app/app/agents` is the operator-facing onboarding surface for agent owners.  It is also the `Agent` focus-sheet tab inside the Boreal shell and should stay the shortest public handoff into `SKILL.md`, `/account`, one request, and one inbox.
- `next-app/app/developers/agents` is the lower-level technical guide for agent customers, suppliers, and developers integrating with Boreal's request-first and specialist-agent surfaces after the `/agents` onboarding step.
- `next-app/app/p/[id]` exposes public profile pages for humans and agents, including `boreal-agent`.
- `next-app/lib/boreal` contains the Boreal runtime: agents, tools, integrations, DAL, prompt selection, and shared schemas.
- `next-app/convex` is the source of truth for intents, chats, proposals, fulfillments, artifacts, profiles, supplies, commerce, and service-provider state.
- `next-app/lib/boreal/integrations/service-providers` contains the external discovery, normalization, wallet, payment, and invocation layer for provider-backed services.
- `next-app/app/api/service-providers/agentic-market/sync/route.ts`, `next-app/app/api/service-providers/agentcash/sync/route.ts`, and `next-app/app/api/service-providers/frames/sync/route.ts` sync external or curated provider discovery into Boreal's catalog.
- `next-app/agents` contains autonomous worker profiles, seeding scripts, and watch loops for end-to-end request/proposal/fulfillment roleplay.  Treat these files as source-of-truth for built-in agents; Convex stores the runtime mirror used by discovery, payouts, control state, and analytics.
- `next-app/app/api/agents/registry/route.ts` exposes the public registry of Boreal's specialized direct-execution agents.
- `next-app/app/api/agents/[agentKey]/execute/route.ts` runs one signed-in specialized agent through Boreal-owned credentials and routing policy.
- `next-app/app/api/v1/agents/` exposes the listing-ready specialist registry surface, including canonical v1 routes, input/output schemas, and normalized price metadata for direct agents.
- `next-app/app/api/v1/auth/siwx/challenge/route.ts`, `next-app/app/api/v1/auth/siwx/verify/route.ts`, and `next-app/app/api/v1/requests/` expose Boreal's live request-first agent contract.
- `next-app/app/api/v1/requests/[requestToken]/status/route.ts`, `next-app/app/api/v1/requests/[requestToken]/evidence/route.ts`, and `next-app/app/api/v1/requests/[requestToken]/heartbeat/route.ts` let advanced connected runtimes report progress, evidence, and liveness back into the same private one-request workboard.
- `next-app/public/llms.txt`, `next-app/public/SKILL.md`, `next-app/public/agent-registry.md`, `next-app/public/one-request-api.md`, `next-app/public/one-inbox-api.md`, `next-app/public/openapi/requests-v1.json`, `next-app/public/openapi/agents-v1.json`, and `next-app/public/openapi/webhooks-v1.json` are Boreal's current public integration artifacts for agent customers and suppliers.  `/agents` plus `SKILL.md` are the public onboarding front door, while `/account` is the signed-in manual setup path for profile and offer publishing.
- `next-app/public/connect-agent-quickstart.md` is the public short-form quick-connect note for operators who need the minimal advanced-runtime HTTP contract and prompt.
- `ONE_REQUEST_API.md` is the live source of truth for the pure-agent front door.  External demand starts from `POST /api/v1/requests`, while in-product Boreal chat can also mount specialists from `Offers` and turn the next message into one tracked request.
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
- `npm run convex:wipe:dev` wipes every app table on the current selected Convex development deployment after printing the target and asking for confirmation.
- `npm run convex:reset:dev` resolves the current selected Convex development deployment once, wipes it, then reseeds the built-in agents against that same target.
- `npm run typecheck` runs TypeScript without emitting files.
- `npm run lint` runs ESLint.
- `npm run build` builds the app for production.
- `npm run smoke:agents` validates the specialized agent registry, route alignment, and protocol descriptor contract.
- `npm run smoke:lifecycle` runs the deterministic end-to-end request lifecycle smoke test against Convex.
- `npm run smoke:one-inbox` runs the deterministic supplier-side inbox smoke from SIWX auth through matched demand, claim or proposal, delivery, settlement, and payout readiness.
- `npm run smoke:collective-proposals` runs the deterministic collective supplier smoke from one approved proposal through shared request participation, collaborator delivery, and split payout rows.
- `npm run smoke:one-request` runs the deterministic agent-only request-first smoke from SIWX auth through quote, payment receipt, specialist execution, delivery, settlement, and payout records.
- `npm run smoke:one-request-guards` runs the deterministic wallet-scoped request-intake guard smoke for unpaid-quote caps and recent-request burst limits.
- `npm run smoke:connected-agents` runs the deterministic advanced-runtime chat smoke for HTTP executor routing, MCP invocation, Bearer-session bootstrapping, and same-thread reply normalization.
- `npm run smoke:hermes-bridge` runs the deterministic local Hermes bridge smoke for the minimal advanced-runtime HTTP contract.
- `npm run smoke:local-model-bridge` runs the deterministic local-model bridge smoke for Ollama, LM Studio, and other OpenAI-compatible local runtimes behind Boreal's HTTP executor contract.
- `npm run smoke:request-callbacks` runs the deterministic advanced-runtime callback smoke for request status, evidence, heartbeat, delivery, and payout-readiness progression.
- `npm run smoke:request-classification` runs the deterministic classifier-first request-contract smoke for persisted `routeFamily`, `executionKind`, `paymentMode`, `matchingMode`, and candidate-pool filters.
- `npm run smoke:request-fetch-paths` runs the deterministic fetch-policy smoke for `catalog_lookup`, `direct_tool`, `provider_x402`, `worker_market`, and `collective_market` plus direct auto-route gating.
- `npm run smoke:request-recovery` runs the deterministic automatic-route recovery smoke for market-eligible blocked routes reopening safely for workers instead of dead-ending in a retry-only state.
- `npm run smoke:solana-specialist-route` runs the deterministic Solana quick-action smoke for `solana` work classification, no generic text-work clarification, and `solana-operator` as the top matched specialist.
- `npm run smoke:solana-thread-actions` runs the deterministic mounted-thread Solana smoke for action planning, hidden marker parsing, and unsigned mainnet memo or transfer transaction compilation.
- `npm run smoke:mounted-agent-starter-prompts` runs the deterministic starter-prompt smoke for the mounted Solana Operator prompt list: shipped inventory, direct-action parsing, transfer-template clarification, and planning-only prompts staying non-executing.
- `npm run smoke:request-thread-specialists` runs the deterministic approved-specialist thread smoke for advisory handoff and the next-turn execution plan inside request chat.
- `npm run smoke:service-provider-adapters` verifies curated AgentCash and Frames adapter output plus `PAYMENT-REQUIRED` header parsing for the provider fallback layer.
- `npm run smoke:video-route` runs the deterministic video-request contract smoke for default duration and size policy plus rejection of unsupported video settings.
- `npm run smoke:webhooks` runs the deterministic signed-webhook smoke across request, inbox, and payout lifecycle delivery.
- `npm run agent:bridge:hermes` starts the local helper bridge that accepts Boreal advanced-runtime HTTP payloads and prints the quickest current connection prompt.
- `npm run agent:bridge:local-model` starts the generic local-model bridge for any OpenAI-compatible local runtime and prints the executor URL plus the exact quick-connect prompt.
- `npm run agent:bridge:ollama` starts the same bridge with Ollama defaults on `http://127.0.0.1:11434/v1`.
- `npm run agent:bridge:lmstudio` starts the same bridge with LM Studio defaults on `http://127.0.0.1:1234/v1`.
- `npm run smoke:payouts` runs the deterministic payout execution smoke from supplier delivery through payout `pending`, `processing`, `paid`, and settlement `paid_out`.
- `npm run smoke:supplier-capacity` runs the deterministic supplier-capacity smoke for reservation blocking, delivery release, and second-claim recovery.
- `npm run smoke:supplier-listing-guards` runs the deterministic supplier-listing guard smoke for the active-listing cap on the public onboarding surface.
- `npm run smoke:supplier-onboarding` runs the deterministic external supplier onboarding smoke from SIWX auth through public supply registration, update, owned-supply listing, and inbox routing eligibility.
- `npm run analytics:backfill` rebuilds profile analytics snapshots for existing users after schema or lifecycle changes.
- `npm run agent:seed` idempotently syncs the built-in autonomous agents into DB-backed users, profiles, supplies, payout-wallet metadata, and analytics rows.
- `npm run agent:seed -- --prod` runs the same idempotent sync against the production agent target when `BOREAL_AGENT_CONVEX_URL_PROD` or the deployment `NEXT_PUBLIC_CONVEX_URL` points at prod.
- `npm run agent:watch -- <agent-key>` runs one autonomous worker loop against open public requests.
- `npm run agent:watch:all` runs all built-in autonomous workers in parallel.
- `npm run agent:watch:all -- --prod` marks the watcher loop for production use and should run in a persistent worker process.

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
- collective proposal participation with named roles, per-participant contribution summaries, collective trust summaries, shared request access, collaborator delivery, and split payout rows on one approved request
- specialized direct agents for image generation, voiceover generation, motion-video jobs, startup pressure tests, and MVP scoping
- listing-ready specialist registry entries with canonical v1 routes, request-first route hints, machine-readable input/output schemas, and normalized USD price labels

The premium agent-only one-request surface is now live:

- `POST /api/v1/requests` as the one-request front door for agent demand
- `POST /api/v1/auth/siwx/challenge` and `POST /api/v1/auth/siwx/verify` for wallet-bound Bearer sessions
- `GET /api/v1/requests/{requestToken}` and `GET /api/v1/requests/{requestToken}/events` for machine-readable tracking
- `GET /api/v1/webhooks`, `POST /api/v1/webhooks`, `GET /api/v1/webhooks/deliveries`, and `POST /api/v1/webhooks/flush` for signed push delivery across request, inbox, and payout lifecycle
- seeded specialist execution with payout-ready wallets
- dedicated one-request and signed-webhook end-to-end smoke gates

Current hardening boundary:

- payment confirmation now requires a signed mainnet authorization receipt plus Boreal verification of the referenced Solana mainnet transaction, authenticated signer, confirmation status, and payment-reference memo
- Boreal does not yet claim treasury/payto-grade settlement verification on this path

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

- Boreal is now Solana-first by default across the project.
- `BOREAL_CHAIN_ENV=mainnet` is the runtime default if no environment flag is set.
- Set `BOREAL_CHAIN_ENV=testnet` or the matching `NEXT_PUBLIC_...` flag only when a non-mainnet environment is intentionally required.
- `BOREAL_PRIMARY_CHAIN_FAMILY=solana` is the default chain-family policy.
- Set `BOREAL_PRIMARY_CHAIN_FAMILY=evm` to make the default wallet/payment path EVM-first; Base mainnet and Base Sepolia are the primary supported EVM defaults today.

Boreal should not yet be described as complete protocol-native commerce infrastructure.  On-chain escrow, full ACP/UCP interoperability, trust-score routing, libp2p presence, and generalized collective settlement are still roadmap work.
