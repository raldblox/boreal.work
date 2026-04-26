# Boreal Positioning Triage

This note consolidates the current repo docs with reusable material from earlier Boreal directories:

- `../BorealWork`
- `../boreal-commerce`
- `../boreal`
- `../boreal-work`

It is an editorial working map, not the final public whitepaper.

## Canonical Position For The Current Repo

Recommended public product sentence:

`Boreal is a public alpha request router for paid agentic services that starts with one request, routes executable supply first, and opens human fallback only when automation cannot complete the job.`

Recommended thesis sentence:

`Boreal is building request-native commerce: infrastructure that turns expressed demand from humans and agents into fulfilled outcomes, starting with a narrow wedge in paid agentic services.`

Why this should lead:

- It matches the current homepage and README more closely than the older merchant-only or protocol-only narratives.
- It is honest about the current alpha.
- It gives Boreal a clearer wedge than the broader `market for work, products, and services` framing.
- It leaves room for the bigger protocol and settlement story without claiming that Phase 4 and Phase 5 work is already live.
- It still leaves room for work, products, services, humans, and agents in the longer-term expansion story.

## Current Source Doc Triage

### Keep as canonical

- `../README.md`
  - Best short truth layer for what is actually in the repo now.
- `COPYWRITING.md`
  - Strongest current public-facing positioning.
  - Keeps Boreal grounded as a usable market, not only an infrastructure thesis.
- `../ROADMAP.md`
  - Best claim boundary document.
  - Already distinguishes alpha truth from longer-range architecture.
- `../MATCHING_ENGINE.md`
  - Good technical expansion of the routing thesis.
- `../COMMERCE_STANDARDS.md`
  - Good naming and protocol-alignment guardrails.
- `../SERVICE_PROVIDER.MD`
  - Good reality-based document for external capability and payment integration.
- `CHARACTER.md`
  - Strong product-behavior definition, but it is not company positioning.

### Rewrite soon

- `../WHITEPAPER.md`
  - The thesis is strong, but the live-claim layer is too aggressive for the current repo.
  - It currently reads as if listing-level representatives, libp2p presence, A2A/UCP endpoints per listing, and on-chain escrow are operational, while `../ROADMAP.md` still marks most of that as future work.
  - It should be split cleanly into:
    - what is live in the public alpha
    - what is partially built or in progress
    - what is target architecture
  - The table of contents says `What Is Live Today`, but the body section is still titled `MVP Build`, which weakens the document's trust boundary.

## Legacy Material To Recycle

### `../BorealWork`

Best reusable ideas:

- `LITEPAPER.md`
  - Strongest statement of the intent-to-fulfillment thesis.
  - Clear framing that chat is the entry point, not the truth source.
- `I2F_SPEC.md`
  - Strong product laws:
    - request describes the problem
    - proposal describes the solution
    - fulfillment describes the proof
  - Strong matching order:
    - answer directly
    - search existing supply
    - execute with tools
    - post live intent only when unresolved

Recommended action:

- Recycle this material into the next whitepaper rewrite and product-principles docs.
- Treat this repo as the main ancestor of Boreal's current request/workspace model.

### `../boreal-commerce`

Best reusable ideas:

- Canonical schema and adapter discipline.
- Protocol surface thinking around ACP, UCP, A2A, x402, and MPP.
- Discovery-first framing for machine-readable commerce surfaces.

Recommended action:

- Recycle into `../COMMERCE_STANDARDS.md`, `../SERVICE_PROVIDER.MD`, future partner docs, and API docs.
- Do not use this as the main homepage narrative. It is too infrastructure-forward for the current alpha.

### `../boreal`

Best reusable ideas:

- Merchant and seller-side copy:
  - `static product pages are dead ends`
  - `someone is here`
  - representative framing
- Useful for future seller landing pages, listing pages, and merchant outreach.

Recommended action:

- Recycle as a vertical story inside Boreal, not the company umbrella.
- Use it for supply-side and merchant-specific surfaces only.
- Do not let it replace the broader request/work/products/services framing now present in this repo.

### `../boreal-work`

Best reusable ideas:

- Qualification and scoring ideas for gated intake or protected profile flows.
- Some of the lead-quality logic may later fit profile screening, concierge request intake, or premium supply onboarding.

Recommended action:

- Archive as a previous product branch, not the current company definition.
- Do not lead with `AI gatekeeper` or `attention protection` in Boreal's main positioning.

## What To De-emphasize

- `AI gatekeeper for valuable inbound` as the umbrella story
- `agent registry and orchestration platform` as the first public sentence
- `every listing has a representative` as a live claim
- `every listing exposes A2A and UCP endpoints` as a live claim
- `every transaction is escrowed and settled on-chain` as a live claim
- `libp2p presence` as part of current public positioning

These can remain in future architecture, investor discussion, or roadmap material, but not as the primary description of what Boreal already is.

## Naming Guardrails

Keep:

- `Supply`
- `Requests`
- `Request`
- `Proposal`
- `Workspace`
- `work, products, and services`
- `request-native commerce`
- `intent-to-fulfillment`

Use carefully:

- `representative`
  - good for listing-specific seller flows
  - too narrow as the umbrella term for all of Boreal today
- `infrastructure`
  - good in technical and investor docs
  - too abstract as the lead line for the public alpha homepage

Avoid in main navigation and primary homepage copy:

- `Demand`
- `agent registry`
- `orchestration platform`
- `AI gatekeeper`

## Recommended Whitepaper Rewrite Order

1. Rewrite the abstract so it matches the alpha truth boundary.
2. Rewrite Section 3 (`What Boreal Has Built`) to separate live surfaces from target surfaces.
3. Rewrite Section 4 (`Architecture`) so Layers 1 to 3 clearly distinguish current foundation from future expansion.
4. Rewrite Section 9 (`Settlement and Trust`) to describe current evidence and payment records separately from future escrow and on-chain settlement.
5. Rename or rebuild Section 15 so `What Is Live Today` is a real proof section instead of a future-looking build list.
6. Publish a separate litepaper or one-pager if a more visionary investor narrative is still needed.

## Practical Consolidation Rule

For now, Boreal should tell one simple story consistently:

- Public product story:
  - a market for work, products, and services
  - starts with a request
  - searches supply before opening custom work
  - keeps proposals, approvals, delivery, and checkout attached to the request

- Technical thesis:
  - request-native commerce
  - intent-to-fulfillment infrastructure
  - protocol and settlement depth grows over time

That is the cleanest bridge between what is already usable and what Boreal is trying to become.
