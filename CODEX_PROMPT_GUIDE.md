# Boreal Codex prompt guide

Use these prompts from the main repo root:
- `CODEX_PROMPT_ABOUT_DOCS.md`
- `CODEX_PROMPT_PAPERS_UI.md`

## Best run pattern

From WSL, if Codex is authenticated on Windows:

```bash
powershell.exe -NoProfile -Command "Set-Location 'C:\Users\raldb\boreal.work'; Get-Content -Raw 'C:\Users\raldb\boreal.work\CODEX_PROMPT_ABOUT_DOCS.md' | codex exec -"
```

Swap in `CODEX_PROMPT_PAPERS_UI.md` for the papers lane.

If you want a dedicated branch first:

```bash
git checkout -b feat/about-docs-refresh
powershell.exe -NoProfile -Command "Set-Location 'C:\Users\raldb\boreal.work'; Get-Content -Raw 'C:\Users\raldb\boreal.work\CODEX_PROMPT_ABOUT_DOCS.md' | codex exec -"
```

## Prompt structure that worked

Keep the prompt in tagged sections:
- `<role>`
- `<objective>`
- `<context>`
- `<acceptance_criteria>`
- `<workflow>`
- `<output_expectation>`

That gives Codex:
- a clear persona
- a specific target surface
- exact files to inspect
- design direction and non-goals
- verification steps like `npm run typecheck`
- a bias toward shipping changes instead of just planning

## Good Boreal prompt rules

1. Name the exact files Codex should inspect.
2. State the founder ask in plain language.
3. Include style constraints such as premium, restrained, literary, no em dashes.
4. Define scope boundaries so lanes do not overlap.
5. Require a visible diff plus typecheck.
6. Tell Codex to start editing, not stop at analysis.
7. Keep claims honest about product maturity.

## Reusable template

```md
<role>
You are the lead [discipline] for Boreal. Your taste should be [adjectives].
</role>

<objective>
Improve [surface] so it feels [target outcome].
Immediate execution rule: do not stop at analysis. Inspect the files quickly, then make the first real code and content changes in this run. Leave a visible diff, run typecheck, and keep pushing until the branch is materially improved.

Core asks from the founder:
1. ...
2. ...
3. ...
</objective>

<context>
Relevant files:
- path/to/file
- path/to/file

Observed issues:
- ...
- ...

Design direction:
- ...
- ...
- No em dashes in copy.
</context>

<acceptance_criteria>
1. ...
- ...
- ...

2. ...
- ...
- ...

3. Scope discipline
- Keep changes focused on ...
- Do not drift into ...
</acceptance_criteria>

<workflow>
1. Inspect the relevant files before editing.
2. Implement the strongest tasteful improvements directly.
3. Run at least: cd next-app && npm run typecheck
4. Review your own diff.
5. Leave the branch in a clean, reviewable state.
</workflow>

<output_expectation>
Make the changes. Do not stop with a plan. Do not stop with notes. Improve the product now.
</output_expectation>
```

## Quick self-check before you launch

- `git status --short`
- correct branch checked out
- prompt file updated
- scope is isolated
- target files are real
- acceptance criteria are concrete

## After Codex finishes

Run:

```bash
git status --short
git diff --stat
cd next-app && npm run typecheck
```

Then review the copy yourself for tone, truthfulness, and whether the UI actually feels more premium instead of merely more busy.
