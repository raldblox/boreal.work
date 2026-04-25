# Repository Guidelines

## Project Structure & Module Organization
- The repo is currently document-first: root holds `README.md`, `WHITEPAPER.md`, `ROADMAP.md`, `MATCHING_ENGINE.md`, `COMMERCE_STANDARDS.md`, and `SERVICE_PROVIDER.MD`, so keep additions near those files unless a new workspace (e.g., `src/`, `tests/`, `assets/`) appears later.
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
- For the app in `next-app/`, use `npm run smoke:lifecycle` for the deterministic request/proposal/approval/delivery/review smoke test against Convex.
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
- `ROADMAP.md` is the execution tracker derived from `WHITEPAPER.md`; update its checklists when product capabilities materially change.
- `MATCHING_ENGINE.md` is the search, discovery, and ranking architecture note for Boreal's next matching phase.
- `COMMERCE_STANDARDS.md` is the current reference for ACP/UCP alignment and Boreal's product, cart, and checkout schema direction.
- `SERVICE_PROVIDER.MD` tracks the external provider, payment-rail, and wallet-broker architecture plus implementation status.
- Boreal's network-default policy lives in `next-app/lib/boreal/commerce/networks.ts`; default to Solana `devnet` locally unless deployment env flags intentionally switch the commerce layer to `mainnet` or EVM-first defaults.
- `presentations/` is the standalone workspace for editable Boreal decks; `presentations/boreal-pitch-deck/` is the current pitch-deck source of truth and should be regenerated from `src/build-deck.mjs` rather than edited inside the exported `.pptx`.
- `remotion/` is the dedicated standalone workspace for Boreal's hackathon / launch video, including storyboard docs, media assets, helper scripts, and Remotion render code.
- `remotion/src/generations/` is the preservation layer for parallel Boreal video generations that should remain renderable side by side.
- `hyperframes/` is the dedicated standalone workspace for Boreal's HTML-first explainer and demo cuts, with `DESIGN.md` as the visual gate, `hyperframes/docs/` as the storyboard and claim-alignment source of truth, `hyperframes/fonts/` as the vendored Boreal type layer, and `hyperframes/projects/` as the preservation layer for separate HyperFrames generations.

### Boreal Agent Surface

- The first production agent is `intent-extraction`, implemented in `next-app/lib/boreal/agents/intent-extraction/`.
- Agents should stay composable: provider access belongs in `integrations/`, persistence in `dal/`, and reusable execution units in `tools/`.
- The UI-facing Boreal character and surface-aware behavior are grounded in `CHARACTER.md`, with prompt selection implemented from frontend state hints rather than full thread reconstruction.
- Autonomous worker personas for end-to-end stress testing live in `next-app/agents/profiles/` and act through Convex mutations instead of the main Boreal chat agent.
- External service discovery, payment, and invocation adapters live under `next-app/lib/boreal/integrations/service-providers/`.
- Service-provider sync and integration endpoints live under `next-app/app/api/service-providers/`.
- Boreal's public market language is `Supply` and `Requests`; avoid introducing alternative navigation nouns unless the UX clearly benefits.
