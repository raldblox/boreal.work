# Boreal HyperFrames

HTML-first video workspace for Boreal explainer and demo cuts.

## Current Composition

- `index.html` loads `compositions/boreal-launch-explainer.html`
- runtime: `48s`
- focus: disappearing demand -> request workspace -> matched supply -> hybrid fulfillment -> accountable close

## Additional Series Projects

- `projects/demo-90/`: adapted 90-second proof loop
- `projects/update-120/`: adapted 2-minute builder update
- `projects/launch-60/`: adapted 60-second public launch cut
- `projects/architecture-150/`: diagram-first 150-second end-to-end architecture explainer
- `fonts/`: vendored `Syne`, `Manrope`, and `Geist Mono` assets for deterministic Boreal renders

## Commands

```bash
cd hyperframes
npx hyperframes preview
npx hyperframes lint
npx hyperframes validate
npx hyperframes render --quality draft --output renders/boreal-explainer-48.mp4
```

## Workspace Files

- Local-only HyperFrames planning docs now live under `../private/hyperframes/`
- `compositions/boreal-launch-explainer.html`: first Boreal HyperFrames cut

## Working Rule

Use Boreal's real product language and alpha scope.  When actual UI captures are available, drop them into `assets/captures/` and upgrade the composition from abstracted UI panels to footage-backed scenes.
