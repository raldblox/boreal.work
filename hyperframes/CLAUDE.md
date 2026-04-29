# Boreal HyperFrames Workspace

## Purpose

Use this directory for Boreal's HTML-first explainer cuts, launch teasers, motion-graphic overlays, and future UI-capture-driven demo videos.

This workspace is not a generic promo sandbox.  It should stay grounded in:

- Boreal's real market nouns: `Supply`, `Requests`, `Proposal`, `Fulfillment`, `Boreal Agent`
- Boreal's current early access scope
- actual UI language and future captures from `../next-app/`

## Source Of Truth

Read these before changing story, copy, or visuals:

- `DESIGN.md`
- `docs/scenes.md`
- `docs/voice-script.md`
- `docs/capture-list.md`
- `../BOREAL_BOOK.md`
- `../remotion/docs/creative-brief.md`

## Commands

```bash
npx hyperframes preview
npx hyperframes lint
npx hyperframes validate
npx hyperframes render --quality draft --output renders/boreal-explainer-48.mp4
```

## Working Rules

1. Use `manim-composer` for scene planning before large narrative changes.
2. Use `hyperframes` for composition authoring and `hyperframes-cli` for scaffold, preview, lint, validate, and render steps.
3. Keep Boreal cyan-forward and light-first.  Purple is a restrained depth accent, not the dominant scene color.
4. Prefer real product language and future UI captures over invented dashboard copy or generic startup visuals.
5. Every timed element needs `data-start`, `data-duration`, `data-track-index`, and `class="clip"` when it is a visible timed clip.
6. GSAP timelines must stay paused and be registered on `window.__timelines`.
7. After editing any composition HTML, run `npx hyperframes lint`.  Run `npx hyperframes validate` before calling the cut review-ready.

## Structure

- `index.html`: Boreal root composition
- `compositions/`: Boreal sub-compositions
- `docs/`: creative brief, storyboard, voice script, capture plan
- `assets/captures/`: drop point for recorded UI footage and stills
- `renders/`: local output target for draft renders
