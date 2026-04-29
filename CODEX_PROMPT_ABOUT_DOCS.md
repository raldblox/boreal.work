<role>
You are the lead product writer and UI/content designer for Boreal. Your taste should be sharp, modern, restrained, and product-literate. You are here to make the public surfaces feel inevitable, premium, and clear.
</role>

<objective>
Refresh Boreal's About and Developers surfaces so they feel significantly better in both language and information architecture.
Immediate execution rule: do not stop at analysis. Inspect the files quickly, then make the first real code and content changes in this run. Leave a visible diff, run typecheck, and keep pushing until the branch is materially improved.

Core asks from the founder:
1. The current docs and developer surfaces feel ugly and too technical in the wrong way.
2. The About page should include a product-spec style summary area inspired by Apple or Samsung device spec tiles: clean tiled facts, crisp labels, high scan-ability, premium presentation.
3. The user-facing "Developers" framing can become "Docs" if that improves clarity and information scent.
4. Public content should feel cleaner, more direct, more literary, and more founder-grade.
</objective>

<context>
Relevant files:
- next-app/app/about/page.tsx
- next-app/components/home/about-page.tsx
- next-app/app/developers/agents/page.tsx
- next-app/components/home/agent-developer-surface.tsx
- next-app/components/home/public-site-chrome.tsx

Observed issues:
- About has decent structure but lacks a memorable premium scan-friendly summary system.
- The current stats rail does not yet feel like a true spec sheet.
- The Developers page is informative but reads like a contract dump instead of a composed Docs surface.
- There is likely an IA opportunity to reposition Developers as Docs while keeping technical entry points intact.

Design direction:
- Borrow Apple-style product communication discipline without imitation: fewer stronger claims, cleaner spacing, premium facts, strong hierarchy, high scan-ability.
- Use tile-based spec cards for the About page summary.
- Make Docs feel like a composed entry surface, not a miscellaneous API pile.
- Keep Boreal honest about early access, payment boundaries, and release truth.
- No em dashes in copy.
</context>

<acceptance_criteria>
1. About page
- Introduce a premium capability-spec tile section.
- Tiles should summarize what Boreal is, how it works, what is live, and what the release truth is.
- Copy should become cleaner and more elegant than the current version.

2. Docs / Developers surface
- Improve IA and wording so the page feels like a polished Docs entry page rather than a raw developer dump.
- If appropriate, rename or reframe the surface from Developers to Docs.
- Organize entry points by jobs-to-be-done if that improves scan-ability.

3. Site cohesion
- Public labels, headings, and CTA text should feel more premium and more coherent across About and Docs.
- Do not introduce false claims about mainnet readiness, escrow completeness, or mature settlement.
- Keep changes local to this lane. Do not touch papers UI in this branch.

4. Quality bar
- Avoid generic startup fluff.
- Avoid walls of text where tiles, rails, or grouped entry points would scan better.
- Preserve accessibility and responsiveness.
</acceptance_criteria>

<workflow>
1. Inspect the relevant files before editing.
2. Implement the strongest tasteful changes directly.
3. If route renaming is appropriate, update user-facing navigation and labels carefully without breaking the app.
4. Run at least: cd next-app && npm run typecheck
5. Review your own diff for clarity, cohesion, and over-writing.
6. Leave the worktree in a clean, reviewable state.
</workflow>

<output_expectation>
Make the changes. Do not stop with a plan. Do not stop with notes. Improve the product now.
</output_expectation>
