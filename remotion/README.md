# Boreal Remotion Workspace

This folder is the dedicated standalone workspace for Boreal's code-based video system.

Keep all Remotion-specific work here so it does not mix with unrelated app, agent, or Convex files.

## Layout

- `../private/remotion/docs/`: local-only storyboard, creative brief, voiceover, shot lists, and production notes
- `src/`: Remotion compositions, components, timeline logic, and shared helpers
- `assets/`: local images, audio, fonts, exported UI captures, logos, and reusable media inputs
- `public/`: runtime-served assets loaded by Remotion using `staticFile()`
- `scripts/`: helper scripts for capture prep, asset transforms, voiceover generation, and render automation

## Current status

- Local-only storyboards and scripts now live under `../private/remotion/docs/`
- The video system now has a reusable scene architecture for full-length films and standalone short cuts
- Current registered compositions include the main hackathon / launch films plus short reusable marketing cuts
- `src/generations/request-native-2026/` holds a preserved parallel generation for `BorealDemo`, `BorealUpdate`, `BorealLaunch`, and `BorealShowcase60`
- `src/generations/request-native-2026/player-preview.tsx` exposes an `@remotion/player` preview surface for those preserved compositions

## Render commands

- `npm run voiceover:update` generates scene voiceover for the 60-second hackathon update cut using the OpenAI key from `../next-app/.env.local`
- `npm run render` renders the default 3-minute hackathon pitch
- `npm run render:launch` renders the 90-second launch cut
- `npm run render:update` renders the 60-second hackathon update cut
- `npm run render:truth:demo` renders the 90-second truthful Boreal demo cut
- `npm run render:truth:showcase` renders the premium 60-second truthful showcase/update cut
- `npm run render:truth:update` renders the 2-minute truthful Boreal project update cut
- `npm run render:truth:launch` renders the 60-second truthful Boreal launch cut
- `npm run render:technical` renders the technical demo variant
- `npm run render:short:intent` renders the problem-hook short
- `npm run render:short:flow` renders the request-workflow short
- `npm run render:short:supply` renders the supply-and-fulfillment short
- `npm run render:short:solana` renders the Solana close short

## Rules

1. Boreal demo-video code belongs under this folder, not under unrelated `app/`, `components/`, or `lib/` paths.
2. Use actual Boreal UI and product language from `next-app/` as source material.
3. Keep shipped-vs-roadmap claims honest in all video assets and scripts.
4. Preserve prior Remotion generations under `src/generations/` instead of replacing them when a new creative direction lands.

## Truthful 2026 generation notes

- The `request-native-2026` cuts deliberately use Boreal's live app typography and dark teal-accented theme, not the earlier draft prompt's Playfair / DM Mono / paper palette.
- Live claims stay inside the current public-alpha boundary: chat-native requests, workspaces, proposals, matching candidates, activity logs, and provider-backed x402 flows.
- Roadmap claims stay future-facing: on-chain escrow, deeper protocol interoperability, collective proposals, MCP tooling, and stronger matching quality remain roadmap work.

## Planned next step

The current renderable entrypoint already lives under `src/`.  Next production work should focus on:

- replacing stylized UI recreations with captured Boreal product footage where needed
- adding real voiceover, music, captions, and export presets
- adapting the short cuts into vertical or square formats for social distribution
