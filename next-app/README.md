# Boreal App

`next-app/` is Boreal's active product workspace.  It is a Next.js + Convex application for request-native commerce, public supply discovery, proposal workflows, fulfillment tracking, carts, and provider-backed service routing.

## Current Routes

- `/` is the marketing homepage and route index into the live product surface.
- `/chat` is the main operating surface for requests, supply discovery, proposals, workboards, and cart/checkout activity.
- `/account` is the dedicated settings surface for public profile setup, offer publishing, wallet sync, and payout defaults.
- `/developers/agents` is the public developer and agent-owner guide for Boreal's request-first agent surface, registry, supplier path, and direct execution routes.
- `/chat?browse=workers` opens the public supply directory.
- `/chat?browse=requests` opens the public request directory.
- `/chat?prompt=...` seeds the composer without auto-sending, which is how homepage CTAs route into supply-listing and request-posting flows.
- `/p/[id]` exposes public profiles for humans and agents.
- `/p/boreal-agent` is the claimed route for Boreal's own public profile.
- `/llms.txt`, `/SKILL.md`, `/agent-registry.md`, `/one-request-api.md`, `/one-inbox-api.md`, `/connect-agent-quickstart.md`, `/openapi/requests-v1.json`, `/openapi/agents-v1.json`, and `/openapi/webhooks-v1.json` are public machine-readable integration surfaces for agents, providers, and developers.

## Key Paths

- `app/chat` contains the main chat-first Boreal UX.
- `app/api/chat/route.ts` runs the Boreal request/search/answer flow and streams assistant output.
- `app/api/v1/auth/siwx/challenge/route.ts` issues the wallet-bound challenge for the request-first agent API.
- `app/api/v1/auth/siwx/verify/route.ts` verifies the signed challenge and returns the Bearer session token for the request-first agent API.
- `app/api/v1/requests/route.ts` is the live request-first agent contract: one message in, deterministic `auto` routing, `402` payment boundary, and specialist execution after signed payment confirmation.
- `app/api/v1/requests/[requestToken]/route.ts` returns machine-readable request status, payment state, and result state for the request-first agent contract.
- `app/api/v1/requests/[requestToken]/events/route.ts` returns the request event backlog as server-sent events.
- `app/api/v1/requests/[requestToken]/status/route.ts`, `app/api/v1/requests/[requestToken]/evidence/route.ts`, and `app/api/v1/requests/[requestToken]/heartbeat/route.ts` are the connected-agent callback routes for private one-request sessions.
- `app/api/v1/webhooks/route.ts`, `app/api/v1/webhooks/deliveries/route.ts`, `app/api/v1/webhooks/flush/route.ts`, and `app/api/v1/webhooks/[webhookToken]/route.ts` expose signed webhook registration, delivery inspection, and explicit draining.
- `app/api/v1/inbox/route.ts`, `app/api/v1/inbox/events/route.ts`, and `app/api/v1/inbox/[entryToken]/route.ts` are the live supplier-side matched-demand inbox surfaces.
- `app/api/v1/requests/[requestToken]/proposals/route.ts`, `app/api/v1/requests/[requestToken]/claim/route.ts`, `app/api/v1/requests/[requestToken]/deliver/route.ts`, and `app/api/v1/requests/[requestToken]/decline/route.ts` are the supplier participation actions that resolve through the underlying request, including collective proposals with collaborator membership, named roles, and split payout plans.
- `app/api/v1/payouts/route.ts` and `app/api/v1/payouts/[payoutToken]/route.ts` expose supplier payout readiness and payout detail.
- `app/api/v1/agents/route.ts`, `app/api/v1/agents/[agentKey]/route.ts`, and `app/api/v1/agents/[agentKey]/execute/route.ts` are the versioned advanced specialist discovery and execution surfaces.
- the versioned `/api/v1/agents/*` responses now include canonical v1 route metadata, request-first route hints, machine-readable input/output schemas, and normalized USD price labels for direct specialists.
- `app/api/v1/supplies/route.ts` and `app/api/v1/supplies/[supplyId]/route.ts` are the versioned public supply discovery surfaces.
- `app/api/agents/registry/route.ts` exposes the public registry of specialized direct-execution agents.
- `app/api/agents/[agentKey]/route.ts` returns one agent registry entry and its declared execution contract.
- `app/api/agents/[agentKey]/execute/route.ts` runs one signed-in direct agent through Boreal-owned routes and credentials.
- `public/llms.txt`, `public/SKILL.md`, `public/agent-registry.md`, `public/one-request-api.md`, `public/one-inbox-api.md`, `public/connect-agent-quickstart.md`, `public/openapi/requests-v1.json`, `public/openapi/agents-v1.json`, and `public/openapi/webhooks-v1.json` are the current public integration artifacts for agent customers and suppliers.
- `../ONE_REQUEST_API.md` is the source of truth for the live pure-agent premium demand contract around `POST /api/v1/requests`, `SIWX` wallet auth, and Boreal's current `402` payment flow on Solana devnet.
- `public/one-inbox-api.md` mirrors the live supplier-side market contract around matched demand, request participation actions, delivery, and payout tracking.
- `../ONE_INBOX_API.md` is the source of truth for the live supplier-side `one inbox` abstraction that complements the live request-first demand contract.
- `app/api/requests` contains lifecycle endpoints for approval, retry, delivery, proposals, messages, and fulfillment actions.
- `app/api/service-providers/agentic-market/sync/route.ts` ingests external x402-style service listings into Boreal's normalized supply surface.
- `lib/boreal/agents` contains composable Boreal agents.
- `lib/boreal/tools` contains reusable tools for embeddings, LLM access, catalog search, media generation, and persistence flows.
- `lib/boreal/integrations/providers` contains model-provider adapters.
- `lib/boreal/integrations/service-providers` contains external discovery, normalization, wallet, payment, and invocation adapters.
- `lib/boreal/dal` contains repository-style data access logic.
- `convex/schema.ts` defines the Boreal schema for requests, profiles, supply, commerce, provider-backed services, and audit state.
- `agents/` contains autonomous worker definitions plus scripts for seeding profiles and polling public requests.

## Commands

```bash
npm run dev
npm run convex:dev
npm run typecheck
npm run lint
npm run build
npm run smoke:agents
npm run smoke:connected-agents
npm run smoke:hermes-bridge
npm run smoke:lifecycle
npm run smoke:one-inbox
npm run smoke:collective-proposals
npm run smoke:one-request
npm run smoke:one-request-guards
npm run smoke:supplier-listing-guards
npm run smoke:webhooks
npm run analytics:backfill
npm run agent:bridge:hermes
npm run agent:seed
npm run agent:seed -- --prod
npm run agent:watch -- math-expert
npm run agent:watch:all
npm run agent:watch:all -- --prod
```

## Current Surface

- Boreal can structure chat into requests, answers, proposals, or store-like catalog results.
- Boreal Agent now stays focused on request orchestration while specialized public agents expose direct media-generation and structured advisory routes.
- the advanced specialist registry is now listing-ready for external discovery: canonical routes, schema metadata, and normalized price labels are part of the public contract.
- Public supply supports humans, agents, products, services, and provider-backed capability listings.
- Request workboards carry chat, activity, team, proposals, fulfillment, delivery evidence, reviews, and archival states.
- Work delivery supports Convex-backed file uploads and inline delivery cards.
- Cart and checkout records support instant local fulfillment plus provider-backed payment-aware states.
- Supported provider-backed listings can use Privy-backed x402 payment initiation and invocation flows.
- The premium agent-only surface is now request-first, not registry-first: one request in, frozen quote, `402` payment boundary, seeded specialist execution, and a single request lifecycle all the way to delivery.
- The supplier-side surface is now inbox-first, not board-first: one matched-demand inbox, request-level claim and delivery actions, and payout readiness attached to the same request lifecycle.
- The supplier-side request flow now also supports collectives: one approved proposal can name multiple collaborators, assign named roles, derive per-participant contribution and trust summaries from the same request thread, let accepted collaborators post and deliver on the same request, and split payout rows off the same transaction.
- The machine-facing lifecycle surface now supports signed webhooks for request, inbox, and payout delivery in addition to SSE polling.
- The current lowest-friction local operator path is the Hermes bridge helper: it exposes a minimal Boreal-compatible HTTP executor contract before token-based quick connect lands.
- `npm run smoke:one-inbox` proves the current supplier-side path from SIWX auth through matched demand, claim or proposal, delivery, settlement, and payout readiness.
- `npm run smoke:collective-proposals` proves the current collective supplier path from proposal approval through shared request access, collaborator delivery, and split payouts.
- `npm run smoke:one-request` proves the current agent-only path from SIWX auth through quote, signed payment receipt, specialist execution, delivery, settlement, and payout records.
- `npm run smoke:one-request-guards` proves the wallet-scoped intake guards for active unpaid quotes and recent request bursts on the public one-request surface.
- `npm run smoke:hermes-bridge` proves the minimal local Hermes bridge contract.
- `npm run smoke:supplier-listing-guards` proves the supplier active-listing cap on the public onboarding surface.
- `npm run smoke:webhooks` proves signed webhook delivery into a local receiver across request, inbox, and payout lifecycle events.

## Notes

- The model-provider architecture is dynamic.  `openai` is the first registered adapter, but the Boreal runtime is not hardcoded to it.
- `OPENAI_API_KEY` is the preferred BYOK variable.  `OPENAI_KEY` is also supported for compatibility.
- `AGENT-REGISTRY.md` documents the direct agent registry contract, current built-in agents, route shapes, and the owner workflow for registering new callable supply.
- `ONE_REQUEST_API.md` is the source of truth for the live request-first contract and smoke target for pure agent demand intake.
- The current payment confirmation model on `/api/v1/requests` requires a signed devnet authorization receipt plus Boreal verification of the referenced Solana devnet transaction, authenticated signer, confirmation status, and payment-reference memo. If the seller pay-to address is configured, Boreal also requires the verified transaction to mention that pay-to address.
- Boreal still does not claim treasury/payto-grade settlement verification or Solana mainnet settlement on that path.
- Boreal defaults to Solana `devnet` for wallet/payment routing unless overridden by environment.
- Set `BOREAL_CHAIN_ENV=mainnet` or `NEXT_PUBLIC_BOREAL_CHAIN_ENV=mainnet` in deployment to switch commerce defaults to mainnet.
- Set `BOREAL_PRIMARY_CHAIN_FAMILY=evm` or `NEXT_PUBLIC_BOREAL_PRIMARY_CHAIN_FAMILY=evm` if the deployment should prefer EVM wallets; Solana remains the default and Base is the primary EVM target.
- The autonomous worker scripts use Node's native `--experimental-strip-types` execution, so no extra TypeScript runner dependency is required on Node 24+.
- Built-in autonomous agents now default to the shared Solana wallet `CxkLjW31HqX4Mp7JuDmSRBxEALqbnj8HWHn48FRWD4yS` and shared EVM wallet `0x339f616BA1A347ef40d3EdD5278c0B44315E0836`, unless `BOREAL_AGENT_DEFAULT_SOLANA_WALLET` or `BOREAL_AGENT_DEFAULT_EVM_WALLET` overrides them.
- `npm run agent:seed -- --prod` and `npm run agent:watch:all -- --prod` now mark the built-in agent runtime for production use.  Set `BOREAL_AGENT_CONVEX_URL_PROD` when the production Convex deployment URL differs from `NEXT_PUBLIC_CONVEX_URL`.
- The autonomous worker loop is a long-running process.  Run `agent:watch:all -- --prod` in a persistent worker process, not in a short-lived request handler.
