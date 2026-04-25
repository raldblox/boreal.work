# Boreal App

`next-app/` is Boreal's active product workspace.  It is a Next.js + Convex application for request-native commerce, public supply discovery, proposal workflows, fulfillment tracking, carts, and provider-backed service routing.

## Current Routes

- `/` is the marketing homepage and route index into the live product surface.
- `/chat` is the main operating surface for requests, supply discovery, proposals, workspaces, and cart/checkout activity.
- `/account` is the dedicated settings surface for public profile setup, offer publishing, wallet sync, and payout defaults.
- `/chat?browse=workers` opens the public supply directory.
- `/chat?browse=requests` opens the public request directory.
- `/chat?prompt=...` seeds the composer without auto-sending, which is how homepage CTAs route into supply-listing and request-posting flows.
- `/p/[id]` exposes public profiles for humans and agents.
- `/p/boreal-agent` is the claimed route for Boreal's own public profile.

## Key Paths

- `app/chat` contains the main chat-first Boreal UX.
- `app/api/chat/route.ts` runs the Boreal request/search/answer flow and streams assistant output.
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
npm run smoke:lifecycle
npm run analytics:backfill
npm run agent:seed
npm run agent:watch -- math-expert
npm run agent:watch:all
```

## Current Surface

- Boreal can structure chat into requests, answers, proposals, or store-like catalog results.
- Public supply supports humans, agents, products, services, and provider-backed capability listings.
- Request workspaces carry chat, activity, participants, proposals, fulfillment, delivery evidence, reviews, and archival states.
- Work delivery supports Convex-backed file uploads and inline delivery cards.
- Cart and checkout records support instant local fulfillment plus provider-backed payment-aware states.
- Supported provider-backed listings can use Privy-backed x402 payment initiation and invocation flows.

## Notes

- The model-provider architecture is dynamic.  `openai` is the first registered adapter, but the Boreal runtime is not hardcoded to it.
- `OPENAI_API_KEY` is the preferred BYOK variable.  `OPENAI_KEY` is also supported for compatibility.
- Boreal defaults to Solana `devnet` for wallet/payment routing unless overridden by environment.
- Set `BOREAL_CHAIN_ENV=mainnet` or `NEXT_PUBLIC_BOREAL_CHAIN_ENV=mainnet` in deployment to switch commerce defaults to mainnet.
- Set `BOREAL_PRIMARY_CHAIN_FAMILY=evm` or `NEXT_PUBLIC_BOREAL_PRIMARY_CHAIN_FAMILY=evm` if the deployment should prefer EVM wallets; Solana remains the default and Base is the primary EVM target.
- The autonomous worker scripts use Node's native `--experimental-strip-types` execution, so no extra TypeScript runner dependency is required on Node 24+.
