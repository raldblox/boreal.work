# Boreal Launch HeyGen-Style HyperFrames Cut

This project adapts Boreal's launch story into the structural pattern used by HeyGen's `hyperframes-launch-video` example:

- one root `index.html`
- multiple timed sub-compositions
- GSAP-driven local timelines registered on `window.__timelines`

## What changed

- Built a new launch composition under `projects/launch-heygen-60/`
- Kept Boreal's real product language from the existing launch cut
- Reframed the video into modular beats so each scene can be swapped or extended independently

## Scene structure

1. `opening.html` — hook
2. `request.html` — request intake
3. `routing.html` — multi-surface execution routing
4. `proof.html` — evidence and accountability
5. `audience.html` — who Boreal is for
6. `close.html` — public alpha close

## Commands

```bash
cd hyperframes/projects/launch-heygen-60
npx hyperframes lint
npx hyperframes render --quality draft --output renders/boreal-launch-heygen-60.mp4
```