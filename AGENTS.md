# Repository Guidelines

## Project Structure & Module Organization
- The repo is currently document-first: root holds `README.md` and `WHITEPAPER.md`, so keep additions near those files unless a new workspace (e.g., `src/`, `tests/`, `assets/`) appears later.
- When adding code, introduce clear subdirectories (e.g., `src/feature-name/`, `tests/{unit, integration}/`) and document them here so future contributors know where to look.
- Keep assets bundled with their closest consumer (for example, `docs/images/` next to the whitepaper assets) and register new directories in this guide.

## Build, Test, and Development Commands
- There are no automated build or test scripts yet; always document any new command you introduce in `README.md` and reference it here.
- Use `git status` to confirm your working tree is clean before building or testing and `git diff --stat` to review staged changes.
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
