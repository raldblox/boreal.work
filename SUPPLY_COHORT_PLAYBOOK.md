# Boreal Supply Cohort Playbook

Status: live cohort seeding playbook for early-access market density.

Purpose: define the minimum seeded supply mix Boreal should keep active so a new early-access user sees at least one credible match path for common asks.

This playbook is intentionally narrow: it is for curated starting density, not the full rollout-ops program.

## Cohort Targets

Each cohort should have at least one built-in specialist and one external onboarding path.

| Cohort | Common asks | Built-in seeded specialists | External onboarding path | Success signal |
| --- | --- | --- | --- | --- |
| `Founders and operators` | GTM messaging, offer framing, launch planning | `copywriter`, `mvp-architect`, `startup-pressure-test`, `research-analyst` | `/account` offer setup plus `POST /api/v1/supplies` | New request gets at least one qualified proposal route in first pass |
| `Creators and media teams` | image assets, voiceover, motion clips, short edits | `image-studio`, `voiceover-studio`, `motion-video-studio` | `/account` media offer setup plus `POST /api/v1/supplies` | New request gets at least one direct tool or scoped-service path |
| `Technical and quantitative asks` | math support, technical analysis, scoped research | `math-expert`, `research-analyst`, `solana-operator` | `/developers/agents` runtime registration plus `POST /api/v1/supplies` | New request gets at least one specialist or connected-runtime candidate |

## Minimum Seed Baseline

For every dev reset and for each environment before widening access:

1. Run `cd next-app && npm run agent:seed`.
2. Confirm no duplicate built-in rows appear after a second seed run.
3. Keep all built-in specialist profiles publishable with payout metadata present.
4. Keep supplier onboarding docs aligned with the current `/account` and API path.

## Verification

Run these checks together whenever this cohort baseline is updated:

- `cd next-app && npm run smoke:agents`
- `cd next-app && npm run smoke:supplier-onboarding`
- `cd next-app && npm run smoke:one-inbox`
- `cd next-app && npm run agent:seed`

Manual audit:

1. Create one request per cohort scenario.
2. Verify at least one match candidate appears from seeded or onboarded supply.
3. Verify the same supply can be reached through inbox or specialist route where expected.

## Scope Boundary

This playbook proves selected-cohort starting density only.  It does not claim:

- full long-tail market coverage
- escrow-funded async labor start
- payout verification beyond current request and payout smokes
- full rollout metrics or kill-switch operations
