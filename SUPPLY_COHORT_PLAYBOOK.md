# Boreal Early Access Cohort Playbook

Status: live cohort seeding and widening playbook for early access.

Purpose: define the minimum cohort coverage Boreal should keep active so open browsing and open intake lead into a real, supported path for buyers, human workers, agent operators, and provider-backed supply.

This playbook is still intentionally scoped: it is the widening matrix for early access, not the full incident-response or treasury operations handbook.

## Buyer Cohorts

Each buyer cohort should have at least one believable request path that reaches either direct execution, a provider-backed listing, or a qualified worker route.

| Buyer cohort | Common asks | First path Boreal should try | Backing supply expectation | Success signal |
| --- | --- | --- | --- | --- |
| `Founders and operators` | GTM messaging, offer framing, launch planning | request-first advisory or scoped service routing | seeded specialists plus at least one supplier onboarding path | One request shows a specialist preview or a qualified supplier proposal path on first pass |
| `Creators and media teams` | image assets, voiceover, motion clips, short edits | direct tool, provider-backed media route, or scoped service routing | seeded media specialists plus one provider or catalog fallback | One request shows a direct route or paid supply path without dead-ending |
| `Technical and protocol teams` | Solana planning, math support, technical research | specialist route or connected-agent path | seeded specialists plus connected-agent onboarding path | One request reaches either a seeded specialist or a connected runtime candidate |

## Human Worker Cohorts

Each human-supply cohort should have at least one Boreal-native authoring path and one API path.

| Worker cohort | Common asks | Boreal-native path | API path | Success signal |
| --- | --- | --- | --- | --- |
| `Founders and operators` | GTM advisory, launch planning, research | `/account` custom service offer | `POST /api/v1/supplies` | New request gets at least one qualified proposal route in first pass |
| `Creators and media teams` | asset packs, voice work, editing, clips | `/account` digital product or service offer | `POST /api/v1/supplies` | New request gets at least one direct tool or scoped-service path |
| `Technical and quantitative workers` | research, modeling, protocol support | `/account` custom service offer | `POST /api/v1/supplies` | New request gets at least one specialist or human-supply candidate |

## Agent Operator Cohorts

Each operator cohort should have one low-friction control path and one request or inbox proof path.

| Operator cohort | Typical shape | Primary onboarding path | Proof path | Success signal |
| --- | --- | --- | --- | --- |
| `Built-in specialist coverage` | repo-defined specialist supply | `npm run agent:seed` | request preview, one request, one inbox | Built-in specialists stay publishable, unique, and routable after reseed |
| `Connected runtime operators` | HTTP or MCP runtime under Boreal control | `/developers/agents`, Hermes bridge, `POST /api/v1/supplies` | request callbacks plus inbox participation | Connected runtime can receive work, update status, and deliver in-thread |
| `Direct specialist operators` | specialized callable route with pricing and schema | `/agents`, `SKILL.md`, public registry | `GET /api/v1/agents`, direct execute routes | Operator can publish one callable surface without inventing a second product story |

## Provider-Backed Supply Cohorts

Each provider-backed cohort should have one honest ingestion path plus one explicit execution boundary.

| Provider cohort | Current path | Boundary today | Success signal |
| --- | --- | --- | --- |
| `Agentic Market direct listings` | `POST /api/service-providers/agentic-market/sync` | direct invoke only when Boreal has a safe normalized x402 endpoint | Listing syncs into supply and can enter checkout when supported |
| `AgentCash delegated fallback` | `POST /api/service-providers/agentcash/sync` | curated discovery only until Boreal validates the runtime path end to end | Fallback listing appears with the right payment and invoke boundary |
| `Frames handoff listings` | `POST /api/service-providers/frames/sync` | handoff or discovery only, not native provider invocation yet | Listing appears as a provider-backed handoff surface without pretending direct execution |

## Minimum Release Baseline

Before widening access in any environment:

1. Run `cd next-app && npm run agent:seed`.
2. Confirm a second seed run does not duplicate built-in specialist rows.
3. Keep built-in specialist profiles publishable with payout metadata present.
4. Keep `/account`, `/agents`, `SKILL.md`, `ONE_REQUEST_API.md`, and `ONE_INBOX_API.md` aligned with the live onboarding split.
5. Sync or recheck provider-backed cohorts before promising those routes to new users.

## Verification

Run these checks together whenever this cohort baseline is updated:

- `cd next-app && npm run smoke:agents`
- `cd next-app && npm run smoke:supplier-onboarding`
- `cd next-app && npm run smoke:one-inbox`
- `cd next-app && npm run smoke:request-fetch-paths`
- `cd next-app && npm run smoke:service-provider-adapters`
- `cd next-app && npm run agent:seed`

Manual audit:

1. Create one buyer scenario per cohort.
2. Verify at least one specialist, supplier, or provider-backed path appears from the intended cohort.
3. Verify one human worker can onboard through `/account` and through `POST /api/v1/supplies`.
4. Verify one connected operator can still point to `/agents`, `SKILL.md`, and the live request or inbox path without extra operator help.
5. Verify provider-backed listings surface honest payment and invoke boundaries instead of pretending native support.

## Scope Boundary

This playbook now proves early-access cohort coverage, but it still does not claim:

- full long-tail market coverage
- escrow-funded async labor start
- payout verification beyond current request and payout smokes
- release metrics, incident runbooks, or kill-switch operations
