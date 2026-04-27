# Repository Guidelines

## Project Structure & Module Organization
- The repo is currently document-first: root holds the product, architecture, and execution docs `README.md`, `MVP.md`, `WHITEPAPER.md`, `ROADMAP.md`, `MATCHING_ENGINE.md`, `AGENT_NETWORK.md`, `COMMERCE_STANDARDS.md`, and `SERVICE_PROVIDER.MD`, while the brand, messaging, character, deck, and visual source-of-truth docs live under `docs/`.
- The active application workspace is `next-app/`, with feature code split across `next-app/app/`, `next-app/components/`, `next-app/lib/boreal/`, and `next-app/convex/`.
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
- For the app in `next-app/`, use `npm run smoke:agents` to validate the specialized agent registry, direct route contract, and protocol descriptor alignment.
- For the app in `next-app/`, use `npm run smoke:lifecycle` for the deterministic request/proposal/approval/delivery/review smoke test against Convex.
- For the app in `next-app/`, use `npm run smoke:one-inbox` for the deterministic supplier-side inbox smoke from `SIWX` auth through matched demand, claim or proposal, delivery, settlement, and payout readiness.
- For the app in `next-app/`, use `npm run smoke:collective-proposals` for the deterministic collective supplier smoke covering one approved proposal, shared request participation, collaborator delivery, and split payout rows.
- For the app in `next-app/`, use `npm run smoke:one-request` for the deterministic agent-only request-first lifecycle smoke from SIWX auth through `402`, signed payment receipt, Solana devnet transaction verification, specialist execution, delivery, settlement, and payout records.
- For the app in `next-app/`, use `npm run smoke:one-request-guards` for the deterministic wallet-scoped intake guard smoke covering active unpaid quote caps and recent request burst limits on the public one-request surface.
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
- Autonomous worker utilities are exposed as `npm run agent:seed`, `npm run agent:watch -- <agent-key>`, and `npm run agent:watch:all` from `next-app/`.
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
- `ROADMAP.md` is the execution tracker derived from `WHITEPAPER.md`; update its checklists when product capabilities materially change.
- `next-app/app/roadmap` is the public-safe Jira-style status board for what is live, in progress, next, and later.  Keep it aligned with `ROADMAP.md` and `README.md`, and do not expose internal agent task boards, private blockers, or merge coordination there.
- `MATCHING_ENGINE.md` is the search, discovery, and ranking architecture note for Boreal's next matching phase.
- `AGENT_NETWORK.md` is the technical paper for Boreal's external-agent identity, portable reputation, connector adapters, and request-native Swarm Workspace direction.  Keep it honest about what is live versus target architecture.
- `COMMERCE_STANDARDS.md` is the current reference for ACP/UCP alignment and Boreal's product, cart, and checkout schema direction.
- `SERVICE_PROVIDER.MD` tracks the external provider, payment-rail, and wallet-broker architecture plus implementation status.
- `DISCOVERY_PLAN.md` is the execution plan for external discoverability across x402, Agentic Market, AgentCash, MCP, and ChatGPT app surfaces.
- `AGENT-REGISTRY.md` is the source of truth for Boreal's specialized agent registry, public direct-execution contract, listing-ready specialist metadata, and the workflow other agent owners should follow to publish callable supply.
- `ONE_REQUEST_API.md` is the live source of truth for Boreal's pure-agent premium front door: `POST /api/v1/requests`, message-only demand intake, `SIWX`, the current `402` devnet payment contract with Solana devnet transaction verification, seeded specialist payouts, and the deterministic one-request smoke lifecycle.
- `ONE_INBOX_API.md` is the live supplier-side companion contract for matched-demand inboxes, request participation actions, collective proposals with member roles, delivery, and payout tracking.
- `ONE_INBOX_API.md` also records the live external supplier self-registration surface under `/api/v1/supplies`.
- `next-app/public/llms.txt`, `next-app/public/SKILL.md`, `next-app/public/agent-registry.md`, `next-app/public/one-request-api.md`, `next-app/public/one-inbox-api.md`, `next-app/public/openapi/requests-v1.json`, `next-app/public/openapi/agents-v1.json`, and `next-app/public/openapi/webhooks-v1.json` are the public machine-readable integration surfaces served from `boreal.work`.
- `docs/README.md` is the hub for the Boreal narrative layer.  Use it to find the current source of truth for positioning, category language, copywriting, brand system, visual identity, deck guidance, archive notes, and the Boreal agent character prompt source.
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
- Specialized public agents can additionally expose signed-in direct execution under `next-app/app/api/agents/`; the registry contract and required metadata live in `AGENT-REGISTRY.md`.
- The live agent-only demand contract treats `/api/v1/requests` as the main public entrypoint for callers, while `/api/v1/agents` and `/api/v1/supplies` remain secondary discovery and advanced execution surfaces.
- The supplier-side contract treats `/api/v1/inbox` as the personalized matched-demand watch surface for suppliers, while proposal, claim, delivery, and payout actions still resolve through underlying request resources.
- The supplier-side contract now supports collective proposals: one supplier can submit `collectiveMembers`, `memberRoles`, and `splitPlan`, accepted collaborators can participate on the same request thread with named roles, and payout rows can split from one approved proposal.
- The supplier-side contract also treats authenticated `/api/v1/supplies` create, update, and owned-list routes as the onboarding path for external agent supply before it becomes routable into inbox matching.
- External service discovery, payment, and invocation adapters live under `next-app/lib/boreal/integrations/service-providers/`.
- Service-provider sync and integration endpoints live under `next-app/app/api/service-providers/`.
- Boreal's internal schema language can stay `supply`, but public-facing product copy should prefer `Offers` and `Requests` unless a more specific surface needs different wording.
