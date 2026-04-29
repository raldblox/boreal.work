# Boreal Early Access Tracker

`ROADMAP.md` is the broad capability tracker.  `EARLY_ACCESS.md` is the release-order tracker for Boreal's early access.  It should answer one narrower question: what must be true before we can truthfully say Boreal is open for real paid work on mainnet without making false promises.

Every item here should be auditable from shipped UI, versioned API contracts, runtime code, or deterministic smoke coverage.  If a task changes release truth, update this file in the same patch.

## Status Legend

- `Done`: live now and auditable.
- `In progress`: partially live, but not safe to widen access yet.
- `Not started`: still missing.
- `Blocked`: intentionally waiting on an earlier phase or external dependency.

## Current Release Position

- Current mode: `open early access surface`, but not broad public mainnet-paid readiness.
- Strongest live proof today: request-first work loop, supplier onboarding, matched inbox, collective proposals, connected-agent callbacks, mainnet-default payment verification, and payout state progression.
- Biggest blockers today: request classification that cleanly separates product, provider service, direct tool, and async work paths; real mainnet payment and payout hardening; funded-start rules for human and agent work; escrow for async labor; curated supply density; stronger team-assignment operations; and a complete merchant self-serve path.

## Phase Scorecard

| Phase | Theme | Status |
| --- | --- | --- |
| `0` | Truth boundary and release framing | `Done` |
| `1` | Request-first core loop | `Done` |
| `2` | Supply onboarding and market density | `In progress` |
| `3` | Payment and payout safety | `In progress` |
| `4` | Team coordination and collective fulfillment | `In progress` |
| `5` | External agents and portable reputation | `In progress` |
| `6` | Merchant and digital product flow | `In progress` |
| `7` | Rollout operations and widening access | `Not started` |

## Phase 0: Truth Boundary And Release Framing

Goal: public language matches shipped reality, and release tracking has one auditable home.

| ID | Status | Task | Auditable evidence | Deliverable |
| --- | --- | --- | --- | --- |
| `EA-0.1` | `Done` | Use `early access` instead of vague `alpha` language in public-facing release framing. | `README.md`, `ROADMAP.md`, `WHITEPAPER.md`, `docs/` narrative docs | Clear release language that does not overpromise maturity. |
| `EA-0.2` | `Done` | Keep `ROADMAP.md` as broad capability tracker instead of public launch gate. | `ROADMAP.md`, `/roadmap`, contributor docs | Public-safe roadmap and separate release gate. |
| `EA-0.3` | `Done` | Add a dedicated phase-based early access tracker with explicit exit criteria. | `EARLY_ACCESS.md` | One release-order source of truth. |
| `EA-0.4` | `Done` | Keep docs honest about the payment boundary and the gap between mainnet request verification and treasury-grade settlement claims. | `ONE_REQUEST_API.md`, `SERVICE_PROVIDER.MD` | No false settlement claim. |
| `EA-0.5` | `Done` | Tighten all public homepage and launch copy to match the current open early access promise without overclaiming mainnet or escrow readiness. | `/`, `/about`, `docs/COPYWRITING.md`, `docs/MESSAGING_MATRIX.md` | A public story that matches current operations. |

After this phase:

- We can talk about Boreal publicly without implying broad paid readiness.

Verification:

- Audit the wording in `README.md`, `ROADMAP.md`, `WHITEPAPER.md`, `ONE_REQUEST_API.md`, and `SERVICE_PROVIDER.MD`.
- Confirm this file exists and is linked from `README.md` and `AGENTS.md`.

Manual replication:

1. Open the docs named above.
2. Check that `early access` is the release term and that payment caveats stay explicit.
3. Confirm there is no statement that Boreal already supports production mainnet settlement for the one-request path.

Clean pass means:

- A new contributor can tell the difference between current early access truth, broad roadmap direction, and later architecture.

## Phase 1: Request-First Core Loop

Goal: one request can enter Boreal, move forward on one thread, and exit with delivery plus review evidence.

| ID | Status | Task | Auditable evidence | Deliverable |
| --- | --- | --- | --- | --- |
| `EA-1.1` | `Done` | Keep one message-first demand intake for the premium agent path. | `POST /api/v1/requests`, `ONE_REQUEST_API.md` | One request front door. |
| `EA-1.2` | `Done` | Persist request state, events, workboard evidence, settlement records, and payouts on one request record. | request APIs, workboard UI, payout records, `ONE_REQUEST_API.md` | One auditable request timeline. |
| `EA-1.3` | `Done` | Preview matched specialist routes before approval and keep follow-up in the same request thread. | request UI, `npm run smoke:request-thread-specialists`, README changelog | Specialist-owned next turn inside the approved request. |
| `EA-1.4` | `Done` | Capture proposal, approval, delivery, and review lifecycle in deterministic smoke coverage. | `npm run smoke:lifecycle` | Repeatable request lifecycle proof. |
| `EA-1.5` | `Done` | Protect the public one-request surface with wallet-scoped unpaid-quote and burst guards. | `npm run smoke:one-request-guards`, guard logic in `next-app/lib/boreal/one-request/` | Basic abuse resistance. |
| `EA-1.6` | `Done` | Normalize recovery paths when automatic execution fails so requests reopen safely for workers across all route types. | request timeline recovery UX, route-specific reopen logic, `npm run smoke:request-recovery` | Safer failure handling beyond the happy path. |
| `EA-1.7` | `Done` | Separate request market classification from the current UI-oriented `routeTarget`: persist `routeFamily`, `executionKind`, `paymentMode`, `matchingMode`, and candidate-pool filters on the request. | `MATCHING_ENGINE.md`, `next-app/lib/boreal/schemas/intent.ts`, `next-app/convex/schema.ts`, `npm run smoke:request-classification` | Classifier-first request contract. |
| `EA-1.8` | `Not started` | Use request classification to choose fetch and routing paths before broad ranking: direct tool, product catalog, provider x402, async worker market, or collective. | routing layer, matching layer, request lifecycle docs | Cheaper and cleaner retrieval. |

After this phase:

- We can let users post real requests and trust that Boreal can keep the work moving on one thread instead of scattering it across tools.

Verification:

- `cd next-app && npm run typecheck`
- `cd next-app && npm run build`
- `cd next-app && npm run smoke:lifecycle`
- `cd next-app && npm run smoke:one-request`
- `cd next-app && npm run smoke:one-request-guards`
- `cd next-app && npm run smoke:request-classification`
- `cd next-app && npm run smoke:request-recovery`
- `cd next-app && npm run smoke:request-thread-specialists`

Manual replication:

1. Start the app and Convex dev environment.
2. Create a request through Boreal chat or the one-request API.
3. Approve the matched route.
4. Confirm follow-up, delivery, and review stay attached to the same request thread.
5. Force a route failure and confirm the request can reopen for worker intervention instead of dead-ending silently.

Clean pass means:

- A real request can enter, get assigned, get delivered, and remain inspectable from intake to review without losing continuity.

## Phase 2: Supply Onboarding And Market Density

Goal: humans, agent operators, and seeded supply can join the market without manual database surgery.

| ID | Status | Task | Auditable evidence | Deliverable |
| --- | --- | --- | --- | --- |
| `EA-2.1` | `Done` | Support signed-in profile plus primary offer setup for Boreal-side suppliers. | `/account`, profile builder surfaces | Low-friction Boreal-native onboarding. |
| `EA-2.2` | `Done` | Support external supplier self-registration through authenticated `SIWX` plus `/api/v1/supplies`. | `ONE_INBOX_API.md`, `POST /api/v1/supplies`, `npm run smoke:supplier-onboarding` | API-based supplier onboarding. |
| `EA-2.3` | `Done` | Route matched demand into supplier inboxes with claim, proposal, delivery, and payout readiness. | `ONE_INBOX_API.md`, `npm run smoke:one-inbox` | Live matched-demand inbox loop. |
| `EA-2.4` | `Done` | Enforce active listing caps and supplier concurrency limits. | `npm run smoke:supplier-listing-guards`, `npm run smoke:supplier-capacity` | Basic market guardrails. |
| `EA-2.5` | `Done` | Keep built-in agent supply seeded idempotently from repo truth. | `npm run agent:seed`, agent runtime docs, seed code | Stable built-in market baseline. |
| `EA-2.6` | `Done` | Sync external discovery from Agentic Market into the service-provider layer. | `POST /api/service-providers/agentic-market/sync`, `SERVICE_PROVIDER.MD` | First real external supply ingestion path. |
| `EA-2.7` | `In progress` | Curate enough starting supply so early access users actually see good matches for common asks. | current seeded agents, onboarding docs, no current cohort playbook yet | Real market density for selected cohorts. |
| `EA-2.8` | `Not started` | Complete AgentCash and Frames discovery or onboarding adapters as real Boreal supply sources. | `next-app/lib/boreal/integrations/service-providers/registry.ts`, `DISCOVERY_PLAN.md` | Broader external ecosystem coverage. |
| `EA-2.9` | `Not started` | Keep `supplies` as the canonical listing table, but add subtype tables for products, async service offers, provider services, connected agents, and collectives so matching and fetch paths do not overload one row shape. | `MATCHING_ENGINE.md`, Convex schema plan, routing and fetch logic | Type-aware supply data model. |

After this phase:

- We can onboard humans and agent operators, seed a believable starting market, and let new requests hit actual supply instead of an empty shell.

Verification:

- `cd next-app && npm run smoke:supplier-onboarding`
- `cd next-app && npm run smoke:one-inbox`
- `cd next-app && npm run smoke:supplier-capacity`
- `cd next-app && npm run smoke:supplier-listing-guards`
- `cd next-app && npm run smoke:agents`
- `cd next-app && npm run agent:seed`

Manual replication:

1. Sign in and complete the minimum supplier profile plus offer.
2. Register one supplier over the API using `SIWX` and `/api/v1/supplies`.
3. Confirm the supplier appears in owned supply and becomes eligible for matched inbox flow.
4. Seed built-in agents and confirm rerunning the seed updates existing rows instead of duplicating them.

Clean pass means:

- A new supplier can join through UI or API, appear in the market, receive matched demand, and avoid duplicate-seed or over-assignment failures.

## Phase 3: Payment And Payout Safety

Goal: paying users, suppliers, and Boreal can trust the payment boundary, funded-start rule, settlement records, and payout state.

| ID | Status | Task | Auditable evidence | Deliverable |
| --- | --- | --- | --- | --- |
| `EA-3.1` | `Done` | Require `SIWX` wallet auth plus a `402` payment boundary before expensive agent execution. | `ONE_REQUEST_API.md`, one-request code, `npm run smoke:one-request` | Clear pay-before-execute boundary. |
| `EA-3.2` | `Done` | Verify signed payment authorization plus fetched Solana mainnet transaction proof before execution. | `ONE_REQUEST_API.md`, one-request verification code, `npm run smoke:one-request` | Current mainnet-default payment proof path. |
| `EA-3.3` | `Done` | Persist transaction, settlement, and payout records on the request lifecycle. | payout and settlement data model, request APIs, `npm run smoke:one-request` | Auditable economic lifecycle. |
| `EA-3.4` | `Done` | Track payout progression through `pending`, `processing`, and `paid`. | `npm run smoke:payouts`, payout mutations | Deterministic payout state machine. |
| `EA-3.5` | `In progress` | Harden the mainnet-default payment path for open early access beyond the current quote-locked proof flow. | `ONE_REQUEST_API.md`, `SERVICE_PROVIDER.MD`, current network defaults | A production payment rail. |
| `EA-3.6` | `Not started` | Add request-level funded start for non-instant human or agent work: route approved, quote locked, escrow funded, then work begins. | `ROADMAP.md`, request lifecycle docs, settlement model | Escrow-backed async labor start. |
| `EA-3.7` | `Not started` | Require independent on-chain payout verification before marking supplier payouts `paid`. | payout mutation path and smoke expectations | Stronger real-money payout safety. |
| `EA-3.8` | `Not started` | Add refund, dispute, and operator intervention runbooks for paid failures. | docs and ops flows not yet present | Safer money-handling operations. |

After this phase:

- We can take open paid traffic: x402 services execute only after payment, async human or agent work starts only after funded escrow, and payout release has a defensible proof trail.

Verification:

- `cd next-app && npm run smoke:one-request`
- `cd next-app && npm run smoke:payouts`

Manual replication:

1. Run the one-request flow end to end with wallet auth and payment.
2. Inspect the created transaction, settlement, and payout records.
3. Confirm execution does not start before payment proof is accepted.
4. Confirm payout status moves cleanly from `pending` to `paid`.
5. For launch readiness, repeat the same flow on the intended mainnet rail once it exists.
6. For async human or agent work, confirm approved work cannot start until a funded escrow state exists once that path ships.

Clean pass means:

- A paying user can cross the payment boundary, Boreal can prove why execution started, async labor cannot begin unfunded, and suppliers can be paid without ambiguous record state.

Current note:

- This phase is not complete yet.  The one-request contract is still explicit that production mainnet settlement is not yet claimed, and escrow-backed funded start for human and agent work is not live yet.

## Phase 4: Team Coordination And Collective Fulfillment

Goal: more than one worker can help on one request without external spreadsheet ops becoming the real system of record.

| ID | Status | Task | Auditable evidence | Deliverable |
| --- | --- | --- | --- | --- |
| `EA-4.1` | `Done` | Support collective proposals with `collectiveMembers`, `memberRoles`, and `splitPlan`. | `ONE_INBOX_API.md`, `npm run smoke:collective-proposals` | Team proposal contract. |
| `EA-4.2` | `Done` | Let accepted collaborators join the same request thread and contribute delivery evidence. | request thread participation, collective smoke | Shared request execution. |
| `EA-4.3` | `Done` | Derive contribution and collective trust summaries from activity and profile data. | request views, trust summary fields, collective smoke | First team-level trust layer. |
| `EA-4.4` | `In progress` | Turn `Team` and `Workboard` into the practical assignment surface with lead, task, status, blocker, and revision cues. | current request shell, `SWARM_WORKSPACE_SPEC.md`, workboard UI | Usable in-app coordination. |
| `EA-4.5` | `Not started` | Add explicit role acceptance, reassignment, validator or reviewer lane, and escalation paths. | no dedicated flow or smoke yet | Less fragile multi-party delivery. |
| `EA-4.6` | `Not started` | Add live team presence and later Swarm Workspace upgrades without changing the top-level request IA prematurely. | `SWARM_WORKSPACE_SPEC.md` later sections | Stronger real-time teamwork. |

After this phase:

- We can let small teams complete one request inside Boreal without immediately falling back to external PM and chat tools.

Verification:

- `cd next-app && npm run smoke:collective-proposals`

Manual replication:

1. Create a request that needs more than one contributor.
2. Submit a collective proposal with multiple members, roles, and a split plan.
3. Approve the proposal.
4. Confirm collaborators can join the same request, add thread activity, and contribute delivery.
5. Check that payout rows split as expected.

Clean pass means:

- A small human-plus-agent or human-plus-human team can coordinate enough inside Boreal to deliver one request and split credit plus payout.

## Phase 5: External Agents And Portable Reputation

Goal: outside agent operators can connect to Boreal, take work, and carry proof of their behavior across surfaces.

| ID | Status | Task | Auditable evidence | Deliverable |
| --- | --- | --- | --- | --- |
| `EA-5.1` | `Done` | Publish a stable specialized agent registry with route metadata, schemas, and direct execution surfaces. | `AGENT-REGISTRY.md`, public OpenAPI docs, `npm run smoke:agents` | Public callable agent directory. |
| `EA-5.2` | `Done` | Support connected HTTP and MCP runtimes as advanced adapters under Boreal control. | connected-agent UI and docs, `npm run smoke:connected-agents` | External runtime execution path. |
| `EA-5.3` | `Done` | Support one-request callbacks for status, evidence, and heartbeat. | callback endpoints, `npm run smoke:request-callbacks` | Shared request state even with external runtimes. |
| `EA-5.4` | `Done` | Provide the Hermes bridge helper as the current low-friction local connected-agent path. | `HERMES_CONNECT_QUICKSTART.md`, `npm run agent:bridge:hermes`, `npm run smoke:hermes-bridge` | Quick local operator path. |
| `EA-5.5` | `Not started` | Add portable agent identity binding such as Agent Card or ERC-8004 where it actually improves trust and review portability. | `AGENT_NETWORK.md`, `docs/papers/` architecture notes | Optional cross-platform identity layer. |
| `EA-5.6` | `Not started` | Publish exportable review or reputation snapshots that can leave Boreal cleanly. | no current public export surface | Portable proof of work quality. |
| `EA-5.7` | `Not started` | Add connector health scoring, runtime verification, and operator visibility for production-grade connected agents. | no dedicated control-plane audit yet | Safer third-party runtime operations. |

After this phase:

- We can onboard outside agent operators, let them connect real runtimes, and start turning Boreal into a real work network instead of a closed app.

Verification:

- `cd next-app && npm run smoke:agents`
- `cd next-app && npm run smoke:connected-agents`
- `cd next-app && npm run smoke:request-callbacks`
- `cd next-app && npm run smoke:hermes-bridge`

Manual replication:

1. Register or expose one specialized agent through the public registry surface.
2. Start the Hermes bridge or another supported connected runtime.
3. Connect it from Boreal.
4. Run a request that pushes status, evidence, and heartbeat callbacks.
5. Confirm the same request thread remains the source of truth.

Clean pass means:

- An outside agent can connect, work, update status, and deliver inside Boreal without inventing a parallel state system.

## Phase 6: Merchant And Digital Product Flow

Goal: merchants can onboard digital products or provider-backed services without getting trapped in half-complete routes.

| ID | Status | Task | Auditable evidence | Deliverable |
| --- | --- | --- | --- | --- |
| `EA-6.1` | `Done` | Keep `supplies` as the normalized public catalog surface across humans, agents, and provider-backed items. | schema, supply APIs, onboarding docs | One supply model. |
| `EA-6.2` | `Done` | Maintain a dedicated service-provider layer separate from model-provider adapters. | `SERVICE_PROVIDER.MD`, `next-app/lib/boreal/integrations/service-providers/` | Clean integration boundary. |
| `EA-6.3` | `Done` | Support provider-backed listing sync and payment-aware checkout state for the paths Boreal can call safely today. | Agentic Market sync route, service-provider docs, checkout flow | First merchant-style commerce foundation. |
| `EA-6.4` | `In progress` | Define the exact merchant onboarding path for digital products versus request-based services inside the app. | docs, current UI, current route split | Clear merchant user journey. |
| `EA-6.5` | `Not started` | Ship a complete merchant self-serve onboarding flow with owned listings, safe edits, and clear route boundaries. | no full public merchant flow or dedicated smoke yet | Merchant onboarding that does not require operator help. |
| `EA-6.6` | `Not started` | Add richer public product pages, merchant-safe checkout flows, and route guards that keep users out of dead-end branches. | roadmap items and current gaps | Safer buyer navigation. |
| `EA-6.7` | `Not started` | Add deterministic merchant smoke coverage for onboarding, listing, purchase, fulfillment, and payout. | no dedicated merchant smoke yet | Auditable merchant lifecycle. |

After this phase:

- We can onboard merchants with digital products or provider-backed services and trust that buyers stay on a complete path instead of falling into unfinished surfaces.

Verification:

- There is no dedicated deterministic merchant-only smoke suite yet.  That gap is itself part of this phase.
- Current partial audit is code and docs review plus the provider-backed integration path in `SERVICE_PROVIDER.MD`.

Manual replication:

1. Onboard one provider-backed listing through the current service-provider path.
2. Confirm it appears as supply with valid purchase metadata.
3. Walk the buyer flow through listing, payment boundary, and fulfillment handoff.
4. Record every point where the user must leave the supported path or rely on operator intervention.

Clean pass means:

- A merchant can list, a buyer can buy, and fulfillment can complete without the user accidentally entering incomplete routes.

## Phase 7: Rollout Operations And Widening Access

Goal: Boreal can operate open early access deliberately instead of relying on restricted access to contain risk.

| ID | Status | Task | Auditable evidence | Deliverable |
| --- | --- | --- | --- | --- |
| `EA-7.1` | `Not started` | Enforce the open early-access boundary: public browsing and open intake stay open, but paid execution starts only after x402 payment or funded escrow. | payment contracts, request lifecycle docs, settlement model | Open access with funded execution boundary. |
| `EA-7.2` | `Not started` | Define cohort seeding playbooks for buyers, human workers, agent operators, and provider-backed supply. | no current rollout runbook | Better request-match density by cohort. |
| `EA-7.3` | `Not started` | Add release metrics for request completion, paid success, payout success, onboarding completion, review capture, and multi-party completion. | no release scorecard yet | Widening decisions backed by data. |
| `EA-7.4` | `Not started` | Add operator runbooks for failed payments, failed payouts, stalled requests, and bad-supply moderation. | no complete ops handbook yet | Safer incident response. |
| `EA-7.5` | `Not started` | Add kill switches, fallback policies, and rollback discipline for public release surfaces. | no explicit early access control plane yet | Safer release operations. |
| `EA-7.6` | `In progress` | Keep public copy, roadmap, and launch messaging aligned to the actual open early access policy we are serving. | `README.md`, `/roadmap`, public copy docs | Honest public launch message. |

After this phase:

- We can run open early access without pretending operations, payments, and supply density will solve themselves.

Verification:

- No deterministic rollout-ops smoke exists yet.
- Audit should include funded-start rules, operator checklist, scorecard, and kill switches before broader paid launch.

Manual replication:

1. Create a fresh account and confirm it can browse and submit a request or supply application without prior operator approval.
2. Confirm the request can be created or quoted.
3. Confirm x402 service execution does not start before payment proof is accepted.
4. Confirm human or agent fulfillment cannot start before funded escrow once that path ships.
5. Check that release metrics and runbooks exist before widening traffic further.

Clean pass means:

- Open traffic is allowed, but unfunded execution is impossible and Boreal still has enough ops discipline to contain failures.

## Exit Rule For Broader Public Release

Do not describe Boreal as a broad public mainnet-ready paid release until all of the following are true:

- `Phase 1` is stable and repeatable under real request traffic.
- `Phase 2` has enough seeded supply for the intended cohort.
- `Phase 3` has one real payment rail and defensible payout verification.
- `Phase 4` supports the level of multi-party coordination the public promise implies.
- `Phase 6` has a complete merchant path if merchants are part of the public story.
- `Phase 7` has actual funded-start controls, metrics, incident handling, and rollback discipline.

Until then, the right promise is:

- `Boreal is in early access.`
- `Users can browse and submit real requests.`
- `Paid execution only starts after x402 payment or funded escrow.`
- `The network is still being hardened before broad public mainnet-ready release.`
