# boreal.work

Boreal is building the request-native commerce layer for human and agent work.  The current public alpha already turns chat into structured requests, matched supply, proposals, tracked fulfillment, digital listings, carts, and payment-aware provider-backed service flows.

## Source Documents

- `WHITEPAPER.md` is the product and architecture source of truth.
- `ROADMAP.md` is the execution and release-tracking document derived from the whitepaper.
- `MATCHING_ENGINE.md` is the search, discovery, and ranking architecture for Boreal's next matching phase.
- `COMMERCE_STANDARDS.md` records Boreal's current catalog, cart, checkout, and ACP/UCP alignment decisions.
- `SERVICE_PROVIDER.MD` captures the external service-provider, payment-rail, and wallet-broker architecture plus implementation status.
- `CATEGORY_LANGUAGE_RESEARCH.md` maps the current market language around agentic commerce, work marketplaces, and Boreal's request-native positioning.
- `BRAND_SYSTEM.md` consolidates Boreal's current brand foundation, voice rules, messaging hierarchy, and reusable language.
- `POSITIONING_TRIAGE.md` is the working map for reconciling the current repo docs with reusable material from earlier Boreal directories.
- `ARCHIVE_INTENT_TO_MICROTASK_RESEARCH.md` is precursor research behind Boreal's "intent disappears" thesis.  Keep it for historical context, not current product direction.

## Current Product Surface

- `next-app/app/chat` is Boreal's operating surface for request creation, proposals, fulfillment, market discovery, cart, and checkout.
- `next-app/app/p/[id]` exposes public profile pages for humans and agents, including `boreal-agent`.
- `next-app/lib/boreal` contains the Boreal runtime: agents, tools, integrations, DAL, prompt selection, and shared schemas.
- `next-app/convex` is the source of truth for intents, chats, proposals, fulfillments, artifacts, profiles, supplies, commerce, and service-provider state.
- `next-app/lib/boreal/integrations/service-providers` contains the external discovery, normalization, wallet, payment, and invocation layer for provider-backed services.
- `next-app/app/api/service-providers/agentic-market/sync/route.ts` syncs external service discovery into Boreal's catalog.
- `next-app/agents` contains autonomous worker profiles, seeding scripts, and watch loops for end-to-end request/proposal/fulfillment roleplay.
- `remotion/` is Boreal's standalone Remotion workspace for launch and product video production based on the real app surface.

## Commands

From `next-app/`:

- `npm run dev` starts the Next.js app.
- `npm run convex:dev` starts the Convex dev loop and syncs schema/functions.
- `npm run typecheck` runs TypeScript without emitting files.
- `npm run lint` runs ESLint.
- `npm run build` builds the app for production.
- `npm run smoke:lifecycle` runs the deterministic end-to-end request lifecycle smoke test against Convex.
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
- `npm run render:technical` renders the technical demo cut.
- `npm run render:short:intent` renders the problem-hook short.
- `npm run render:short:flow` renders the request-workflow short.
- `npm run render:short:supply` renders the supply-and-fulfillment short.
- `npm run render:short:solana` renders the Solana close short.
- `npm run typecheck` runs TypeScript checks for the Remotion package.

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

Boreal should not yet be described as complete protocol-native commerce infrastructure.  On-chain escrow, full ACP/UCP interoperability, trust-score routing, libp2p presence, and collective settlement are still roadmap work.
