# Boreal Remotion Workspace

This folder is the dedicated standalone workspace for Boreal's code-based video system.

Keep all Remotion-specific work here so it does not mix with unrelated app, agent, or Convex files.

## Layout

- `docs/`: storyboard, creative brief, voiceover, shot lists, and production notes
- `src/`: Remotion compositions, components, timeline logic, and shared helpers
- `assets/`: local images, audio, fonts, exported UI captures, logos, and reusable media inputs
- `public/`: runtime-served assets loaded by Remotion using `staticFile()`
- `scripts/`: helper scripts for capture prep, asset transforms, voiceover generation, and render automation

## Current status

- The creative brief lives in `docs/creative-brief.md`
- The scene-by-scene storyboard lives in `docs/scenes.md`
- The video system now has a reusable scene architecture for full-length films and standalone short cuts
- Current registered compositions include the main hackathon / launch films plus short reusable marketing cuts

## Render commands

- `npm run voiceover:update` generates scene voiceover for the 60-second hackathon update cut using the OpenAI key from `../next-app/.env.local`
- `npm run render` renders the default 3-minute hackathon pitch
- `npm run render:launch` renders the 90-second launch cut
- `npm run render:update` renders the 60-second hackathon update cut
- `npm run render:technical` renders the technical demo variant
- `npm run render:short:intent` renders the problem-hook short
- `npm run render:short:flow` renders the request-workflow short
- `npm run render:short:supply` renders the supply-and-fulfillment short
- `npm run render:short:solana` renders the Solana close short

## Rules

1. Boreal demo-video code belongs under this folder, not under unrelated `app/`, `components/`, or `lib/` paths.
2. Use actual Boreal UI and product language from `next-app/` as source material.
3. Keep shipped-vs-roadmap claims honest in all video assets and scripts.

## Planned next step

The current renderable entrypoint already lives under `src/`.  Next production work should focus on:

- replacing stylized UI recreations with captured Boreal product footage where needed
- adding real voiceover, music, captions, and export presets
- adapting the short cuts into vertical or square formats for social distribution
