# Repository Guidelines

## Project Structure & Module Organization
- The repo is currently document-first: root holds `README.md` and `WHITEPAPER.md`, so keep additions near those files unless a new workspace (e.g., `src/`, `tests/`, `assets/`) appears later.
- The active application workspace is `next-app/`, with feature code split across `next-app/app/`, `next-app/components/`, `next-app/lib/boreal/`, and `next-app/convex/`.
- Autonomous worker definitions and their runtime scripts live under `next-app/agents/`.
- Boreal domain code should live under `next-app/lib/boreal/` with clear subfolders such as `agents/`, `tools/`, `integrations/`, `dal/`, and `schemas/`.
- When adding code, introduce clear subdirectories (e.g., `src/feature-name/`, `tests/{unit, integration}/`) and document them here so future contributors know where to look.
- Keep assets bundled with their closest consumer (for example, `docs/images/` next to the whitepaper assets) and register new directories in this guide.

## Build, Test, and Development Commands
- There are no automated build or test scripts yet; always document any new command you introduce in `README.md` and reference it here.
- Use `git status` to confirm your working tree is clean before building or testing and `git diff --stat` to review staged changes.
- For the app in `next-app/`, use `npm run dev` for Next.js, `npm run convex:dev` for Convex sync/codegen, `npm run typecheck` for TypeScript checks, and `npm run lint` for ESLint.
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

### Boreal Agent Surface

- The first production agent is `intent-extraction`, implemented in `next-app/lib/boreal/agents/intent-extraction/`.
- Agents should stay composable: provider access belongs in `integrations/`, persistence in `dal/`, and reusable execution units in `tools/`.
- The UI-facing Boreal character and surface-aware behavior are grounded in `CHARACTER.md`, with prompt selection implemented from frontend state hints rather than full thread reconstruction.
- Autonomous worker personas for end-to-end stress testing live in `next-app/agents/profiles/` and act through Convex mutations instead of the main Boreal chat agent.
