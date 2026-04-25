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
- Code and asset folders are scaffolded but intentionally empty until we start the actual Remotion build

## Rules

1. Boreal demo-video code belongs under this folder, not under unrelated `app/`, `components/`, or `lib/` paths.
2. Use actual Boreal UI and product language from `next-app/` as source material.
3. Keep shipped-vs-roadmap claims honest in all video assets and scripts.

## Planned next step

When implementation starts, the first renderable entrypoint should live under `src/` and register:

- `HackathonPitch3Min`
- `LaunchCut90Sec`
- `TechnicalDemo150Sec`
