# Repository Guidelines

## Project Structure & Module Organization
- The repo is currently document-first: root holds the product, architecture, and execution docs `README.md`, `MVP.md`, `WHITEPAPER.md`, `ROADMAP.md`, `MATCHING_ENGINE.md`, `AGENT_NETWORK.md`, `COMMERCE_STANDARDS.md`, and `SERVICE_PROVIDER.MD`, while the brand, messaging, character, deck, visual source-of-truth docs, and public paper suite live under `docs/`.
- The public paper suite lives under `docs/papers/` and is the repo-backed source for Boreal's flagship thesis and linked deep-dive articles.
- The active application workspace is `next-app/`, with feature code split across `next-app/app/`, `next-app/components/`, `next-app/lib/boreal/`, and `next-app/convex/`.
- Reusable longform reading and text-heavy layout primitives now live under `next-app/components/editorial/` so papers, audit reports, and future document-heavy surfaces can share one editorial system instead of route-specific markup.
- The public roadmap board composition now lives under `next-app/components/roadmap/`, while reusable kanban and workboard card primitives live under `next-app/components/workboard/` so roadmap, task, and workboard surfaces can share the same visual system.
- Autonomous worker definitions and their runtime scripts live under `next-app/agents/`.
- Demo-video planning, assets, scripts, and future Remotion compositions live under the root-level `remotion/` package, using actual UI and product language from `next-app/` rather than standalone mockups.
- Preserved Remotion generations should live under `remotion/src/generations/` so new video directions do not overwrite earlier Boreal cuts.
- HTML-first explainer cuts, Boreal-specific motion comps, and future capture-driven HyperFrames renders live under the root-level `hyperframes/` workspace, with planning docs in `hyperframes/docs/`, reusable compositions in `hyperframes/compositions/`, shared vendored type assets in `hyperframes/fonts/`, project-specific cuts in `hyperframes/projects/`, and capture drop points in `hyperframes/assets/captures/`.
- Editable PowerPoint decks live under the root-level `presentations/` workspace; the current Boreal pitch deck is in `presentations/boreal-pitch-deck/` with slide source in `src/`, previews and QA artifacts in `scratch/`, and the final `.pptx` in `output/`.
- Boreal domain code should live under `next-app/lib/boreal/` with clear subfolders such as `agents/`, `tools/`, `integrations/`, `dal/`, and `schemas/`.
- When adding code, introduce clear subdirectories (e.g., `src/feature-name/`, `tests/{unit, integration}/`) and document them here so future contributors know where to look.
- Keep assets bundled with their closest consumer (for example, `docs/images/` next to the whitepaper assets) and register new directories in this guide.

## Build, Test, and Development Commands
- There are no automated build or test scripts yet; always document any new command you introduce in `README.md` and reference it here.
- Use `git status` to confirm your working tree is clean before building or testing and `git diff --stat` to review staged changes.
- For the app in `next-app/`, use `npm run dev` for Next.js, `npm run convex:dev` for Convex sync/codegen, `npm run typecheck` for TypeScript checks, and `npm run lint` for ESLint.
- For the app in `next-app/`, use `npm run convex:wipe:dev` to wipe every app table on the current selected Convex development deployment during fast iteration.  It must stay development-only, print the target deployment first, refuse obvious prod or preview selections, and require explicit confirmation before deleting data.
- For the app in `next-app/`, use `npm run convex:reset:dev` when you want a clean dev deployment plus the built-in seeded agents restored in one step.
- For the app in `next-app/`, use `npm run smoke:agents` to validate the specialized agent registry, direct route contract, and protocol descriptor alignment.
- For the app in `next-app/`, use `npm run smoke:lifecycle` for the deterministic request/proposal/approval/delivery/review smoke test against Convex.
- For the app in `next-app/`, use `npm run smoke:one-inbox` for the deterministic supplier-side inbox smoke from `SIWX` auth through matched demand, claim or proposal, delivery, settlement, and payout readiness.
- For the app in `next-app/`, use `npm run smoke:collective-proposals` for the deterministic collective supplier smoke covering one approved proposal, shared request participation, collaborator delivery, and split payout rows.
- For the app in `next-app/`, use `npm run smoke:one-request` for the deterministic agent-only request-first lifecycle smoke from SIWX auth through `402`, signed payment receipt, Solana devnet transaction verification, specialist execution, delivery, settlement, and payout records.
- For the app in `next-app/`, use `npm run smoke:one-request-guards` for the deterministic wallet-scoped intake guard smoke covering active unpaid quote caps and recent request burst limits on the public one-request surface.
- For the app in `next-app/`, use `npm run smoke:connected-agents` for the deterministic advanced-runtime smoke covering HTTP executor routing, MCP invocation, Bearer-session bootstrapping, and same-thread reply normalization.
- For the app in `next-app/`, use `npm run smoke:hermes-bridge` for the deterministic local Hermes bridge smoke covering the minimal advanced-runtime HTTP contract.
- For the app in `next-app/`, use `npm run smoke:request-callbacks` for the deterministic advanced-runtime callback smoke covering private one-request status, evidence, heartbeat, delivery, and payout-readiness progression.
- For the app in `next-app/`, use `npm run smoke:payouts` for the deterministic payout execution smoke from supplier delivery through payout `pending`, `processing`, `paid`, and aggregate settlement `paid_out`.
- For the app in `next-app/`, use `npm run smoke:supplier-capacity` for the deterministic supplier-capacity smoke covering capacity reservation on claim, release on delivery, and blocked over-assignment before the slot reopens.
- For the app in `next-app/`, use `npm run smoke:supplier-listing-guards` for the deterministic supplier-listing guard smoke covering the active-listing cap on the public supplier onboarding surface.
- For the app in `next-app/`, use `npm run smoke:supplier-onboarding` for the deterministic external-supplier onboarding smoke from `SIWX` auth through public supply registration, update, owned-supply listing, and inbox match eligibility.
- For the app in `next-app/`, use `npm run smoke:webhooks` for the deterministic signed-webhook smoke covering request, inbox, and payout lifecycle delivery into a local receiver.
- For the app in `next-app/`, use `npm run analytics:backfill` when profile analytics schema or lifecycle tracking changes and existing profiles need rebuilt snapshots.
- For the video app in `remotion/`, install dependencies once with `cd remotion && npm install`, then use `npm run studio`, `npm run compositions`, `npm run voiceover:update`, `npm run render`, `npm run render:update`, `npm run render:launch`, `npm run render:truth:demo`, `npm run render:truth:update`, `npm run render:truth:launch`, `npm run render:technical`, the `npm run render:short:*` scripts, and `npm run typecheck`.
- For the video app in `hyperframes/`, use `cd hyperframes && npx hyperframes preview` for local review, `npx hyperframes lint` for composition validation, `npx hyperframes validate` for additional quality checks, and `npx hyperframes render --quality draft --output renders/boreal-explainer-48.mp4` for the preserved root explainer draft.
- For the Boreal HyperFrames series cuts, use `cd hyperframes/projects/demo-90 && npx hyperframes render`, `cd hyperframes/projects/update-120 && npx hyperframes render`, and `cd hyperframes/projects/launch-60 && npx hyperframes render` to produce the adapted demo, update, and launch outputs.
- For the Boreal HyperFrames architecture cut, use `cd hyperframes/projects/architecture-150 && npx hyperframes render` to produce the diagram-first end-to-end system explainer.
- For the deck workspace in `presentations/boreal-pitch-deck/`, use `npm run build` to export the `.pptx`, render source and saved-PPTX slide previews, write layout JSON, and refresh the headless QA reports.
- Autonomous worker utilities are exposed as `npm run agent:seed`, `npm run agent:seed -- --prod`, `npm run agent:watch -- <agent-key>`, and `npm run agent:watch:all` from `next-app/`.  `npm run agent:seed` should stay idempotent: it is the repo-to-DB sync bridge for built-in agent users, profiles, supplies, payout-wallet metadata, and runtime analytics.  Use `--prod` plus `BOREAL_AGENT_CONVEX_URL_PROD` when the seed or watcher loop should target production Convex explicitly.
- Local connected-agent helpers now also include `npm run agent:bridge:hermes`, which starts the minimal Boreal-compatible HTTP bridge for Hermes-style runtimes and prints the short quick-connect prompt.
- If you add npm/yarn tooling, include normal commands such as `npm run build` or `npm test`, and describe their effects in this section.

## Coding Style & Naming Conventions
- Prefer Markdown consistency: two spaces after sentences inside paragraphs, descriptive alt text for images, and logical heading hierarchies (`##` before `###`).
- For code, align with the language-specific formatter you introduce (Prettier, clang-format, etc.); mention it here and commit the generated config.
- Name files to reflect purpose: `whitepaper.md` stays lowercase, `aggreement-service.ts` uses kebab or camel case based on the language you add.

## Testing Guidelines
- No framework currently exists; propose one (e.g., Jest/pytest) if you add tests and mention the command to run it.
- Organize tests under a dedicated directory (`tests/` or `__tests__/`) and name files after the module they cover (e.g., `compute-rate.test.js`).
- Document expected coverage thresholds in this section when you introduce them.

## Commit & Pull Request Guidelines
- Follow the implicit imperative style: `Add agent guide`, `Fix typo in whitepaper`. Reference issue IDs like `#42` when available.
- Each PR should describe the change, list any linked issues, and include screenshots or terminal output if UI/CLI behavior changes.
- Mention any manual verification steps (e.g., `Manual: run README link check`).

## Documentation & Agent Notes
- Keep this guide and `README.md` in sync; add a changelog entry whenever you alter structural expectations.
- When a new agent, SDK, or process is introduced, create a short subsection here summarizing how contributors should interact with it.
- `MVP.md` is the current paid launch wedge doc.  It should stay focused on one assumption, one offer, and one commercialization path inside the broader Boreal alpha rather than replacing the full product narrative.
- `ROADMAP.md` is the execution tracker derived from `WHITEPAPER.md`; update its checklists when product capabilities, public contracts, agent-control flows, or roadmap-relevant architecture materially change.
- If a change introduces missing roadmap work, add the task in the same patch.  If a change completes roadmap work, check it in the same patch.
- If a change affects how agents connect, execute, route, or should be instructed, update `AGENTS.md`, `README.md`, and the most specific contract doc in the same patch (`ONE_REQUEST_API.md`, `ONE_INBOX_API.md`, `AGENT-REGISTRY.md`, `AGENT_NETWORK.md`, or `DISCOVERY_PLAN.md`).
- `next-app/app/roadmap` is the public-safe Jira-style status board for what is live, in progress, next, and later.  Keep it aligned with `ROADMAP.md` and `README.md`, and do not expose internal agent task boards, private blockers, or merge coordination there.
- `MATCHING_ENGINE.md` is the search, discovery, and ranking architecture note for Boreal's next matching phase.
- `AGENT_NETWORK.md` is the technical paper for Boreal's external-agent identity, portable reputation, connector adapters, request-native Swarm Workspace direction, and the concrete roadmap/API/schema extension plan for that layer.  Keep it honest about what is live versus target architecture.
- `SWARM_WORKSPACE_SPEC.md` is the implementation spec for the current request-side `Workboard`, the later `Swarm Workspace` upgrade path, and the libp2p-versus-Convex collaboration split.  Keep UI labels and architecture docs aligned to this naming.
- `CONNECT_AGENT_GUIDE.md` is the advanced runtime-adapter guide for Boreal's live and next `Connect agent` UX, connector choices, auth/session bootstrap, activation modes, and optional owner-runtime control plane.  Do not use it as the main product story.
- `HERMES_CONNECT_QUICKSTART.md` is the shortest current operator guide for getting a local Hermes-style runtime onto Boreal chat through the bridge helper and minimal prompt contract.
- `COMMERCE_STANDARDS.md` is the current reference for ACP/UCP alignment and Boreal's product, cart, and checkout schema direction.
- `SERVICE_PROVIDER.MD` tracks the external provider, payment-rail, and wallet-broker architecture plus implementation status.
- `DISCOVERY_PLAN.md` is the execution plan for external discoverability across x402, Agentic Market, AgentCash, MCP, and ChatGPT app surfaces.
- `AGENT-REGISTRY.md` is the source of truth for Boreal's specialized agent registry, public direct-execution contract, listing-ready specialist metadata, and the workflow other agent owners should follow to publish callable supply.
- `ONE_REQUEST_API.md` is the live source of truth for Boreal's pure-agent premium front door: `POST /api/v1/requests`, message-only demand intake, `SIWX`, the current `402` devnet payment contract with Solana devnet transaction verification, seeded specialist payouts, and the deterministic one-request smoke lifecycle.
- `ONE_INBOX_API.md` is the live supplier-side companion contract for matched-demand inboxes, request participation actions, collective proposals with member roles, per-participant contribution tracking, collective trust summaries, delivery, and payout tracking.
- `ONE_INBOX_API.md` also records the live external supplier self-registration surface under `/api/v1/supplies`.
- `next-app/public/llms.txt`, `next-app/public/SKILL.md`, `next-app/public/agent-registry.md`, `next-app/public/one-request-api.md`, `next-app/public/one-inbox-api.md`, `next-app/public/openapi/requests-v1.json`, `next-app/public/openapi/agents-v1.json`, and `next-app/public/openapi/webhooks-v1.json` are the public machine-readable integration surfaces served from `boreal.work`.
- `docs/README.md` is the hub for the Boreal narrative layer.  Use it to find the current source of truth for positioning, category language, copywriting, brand system, visual identity, deck guidance, archive notes, and the Boreal agent character prompt source.
- `docs/papers/` is the public paper layer rendered at `/papers`; keep the flagship thesis and each linked deep dive aligned with actual shipped product truth.
- Boreal's network-default policy lives in `next-app/lib/boreal/commerce/networks.ts`; default to Solana `devnet` locally unless deployment env flags intentionally switch the commerce layer to `mainnet` or EVM-first defaults.
- `presentations/` is the standalone workspace for editable Boreal decks; `presentations/boreal-pitch-deck/` is the current pitch-deck source of truth and should be regenerated from `src/build-deck.mjs` rather than edited inside the exported `.pptx`.
- `remotion/` is the dedicated standalone workspace for Boreal's hackathon / launch video, including storyboard docs, media assets, helper scripts, and Remotion render code.
- `remotion/src/generations/` is the preservation layer for parallel Boreal video generations that should remain renderable side by side.
- `hyperframes/` is the dedicated standalone workspace for Boreal's HTML-first explainer and demo cuts, with `DESIGN.md` as the visual gate, `hyperframes/docs/` as the storyboard and claim-alignment source of truth, `hyperframes/fonts/` as the vendored Boreal type layer, and `hyperframes/projects/` as the preservation layer for separate HyperFrames generations.

### Boreal Agent Surface

- The first production agent is `intent-extraction`, implemented in `next-app/lib/boreal/agents/intent-extraction/`.
- Agents should stay composable: provider access belongs in `integrations/`, persistence in `dal/`, and reusable execution units in `tools/`.
- The UI-facing Boreal character and surface-aware behavior are grounded in `docs/CHARACTER.md`, with prompt selection implemented from frontend state hints rather than full thread reconstruction.
- Autonomous worker personas for end-to-end stress testing live in `next-app/agents/profiles/` and act through Convex mutations instead of the main Boreal chat agent.
- Built-in specialized agents should stay source-of-truth in `next-app/agents/profiles/`, while Convex remains the runtime mirror for discovery, payouts, control state, and analytics.  Use stable per-agent sync identifiers so `agent:seed` updates existing DB records instead of duplicating them.  Their default shared payout identities now resolve from `next-app/agents/shared/runtime-config.ts`, with Solana and EVM defaults overridable by `BOREAL_AGENT_DEFAULT_SOLANA_WALLET` and `BOREAL_AGENT_DEFAULT_EVM_WALLET`.
- Specialized public agents can additionally expose signed-in direct execution under `next-app/app/api/agents/`; the registry contract and required metadata live in `AGENT-REGISTRY.md`.
- The live agent-only demand contract treats `/api/v1/requests` as the main public entrypoint for callers, while `/api/v1/agents` and `/api/v1/supplies` remain secondary discovery and advanced execution surfaces.
- Primary public agent-owner story is not `replace Boreal Agent`.  It is Boreal skill plus stable request, inbox, payout, and webhook contracts so any agent can find work, post work, track progress, deliver, and get paid through Boreal.
- Boreal Agent is still the default orchestrator, but the chat surface now supports `Use Boreal`, `No agent`, `Use connected agent`, and `Auto fallback` as advanced runtime controls.  Document any connector, callback, or fallback-policy changes in the main docs and roadmap instead of leaving them implicit in UI code.
- Public Boreal chat should behave as one audit-log timeline, not a public multi-thread chat product: old sessions stay visible with separators, they do not automatically become active context, greetings should stay direct, and request approval or `Open request` markers should sit inline at the end of the session that created them.
- Capability questions about Boreal agents, offers, or services should route to direct catalog lookup with top specialized options, not to tracked-work approval.
- Qualified advisory asks should preview best-fit specialist routes before approval, and approval should run that matched route instead of reopening a generic clarification loop.
- Connected HTTP and MCP runtimes are advanced adapters, not the front-door product story.  Boreal stays the system of record, persists the same thread, and exposes one-request callback routes for status, evidence, and heartbeat updates when that advanced path is intentionally used.
- Boreal-specific click surfaces in chat and discovery should open connection or work-network controls, not a Boreal profile-first modal.
- The current low-friction local path is the Hermes bridge helper plus the short prompt contract, not a fully token-claimed quick-connect session yet.
- `next-app/app/papers` is the public markdown-backed paper hub for Boreal's flagship article and specialized deep dives.
- The supplier-side contract treats `/api/v1/inbox` as the personalized matched-demand watch surface for suppliers, while proposal, claim, delivery, and payout actions still resolve through underlying request resources.
- The supplier-side contract now supports collective proposals: one supplier can submit `collectiveMembers`, `memberRoles`, and `splitPlan`, accepted collaborators can participate on the same request thread with named roles, request views derive per-participant contribution and trust summaries, and payout rows can split from one approved proposal.
- The supplier-side contract also treats authenticated `/api/v1/supplies` create, update, and owned-list routes as the onboarding path for external agent supply before it becomes routable into inbox matching.
- External service discovery, payment, and invocation adapters live under `next-app/lib/boreal/integrations/service-providers/`.
- Service-provider sync and integration endpoints live under `next-app/app/api/service-providers/`.
- Boreal's internal schema language can stay `supply`, but public-facing product copy should prefer `Offers` and `Requests` unless a more specific surface needs different wording.
