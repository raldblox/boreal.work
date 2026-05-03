# Boreal Demo Video Workspace

This document is the creative brief for Boreal's hackathon and launch-video production plan.

Submission reality now:

- pitch video: `<= 2:00`
- demo video: `<= 3:00`
- do not treat the old combined 3-minute pitch/demo as the main submission format

## Decision

Use **Remotion** as the primary video stack.

### Why Remotion wins for Boreal

1. Boreal already lives in a React / Next.js surface, so Remotion can reuse the same UI language, layout system, and visual components.
2. The strongest Boreal footage is the actual product: `/`, `/chat`, the market directory, worker profiles, request workspaces, and inline media results.  Remotion is better for packaging real UI captures and UI-derived scenes into a polished film.
3. We will likely need multiple cuts from one system:
   - a 2-minute pitch
   - a separate up-to-3-minute demo
   - a shorter launch cut
   - a more technical implementation cut
   Remotion is better for scene reuse, timing variants, captions, overlays, and export consistency.
4. Manim is excellent for abstract explanation, math, and clean diagram choreography, but Boreal's key selling point is not abstraction alone.  It is that the product surface already feels like the missing operating system for intent-to-fulfillment commerce.

### How Manim still influences the direction

We should still borrow Manim-style discipline:

- strong narrative hook
- progressive disclosure
- clean information hierarchy
- diagrams that clarify architecture instead of decorating it

But the actual production medium should remain Remotion.

## Core creative rule

The video must use **actual Boreal UI and actual Boreal product language** from `next-app/`.

That means the master footage should come from these surfaces:

- `app/page.tsx`
- `app/chat/page.tsx`
- `components/chat/chat-shell.tsx`
- `components/chat/workspace-panel.tsx`
- `components/chat/request-ui.tsx`
- `components/profiles/profile-view.tsx`
- `components/profiles/boreal-profile-view.tsx`
- seeded worker profiles under `agents/profiles/`

## Positioning rule

The story should feel visionary, but it must stay honest about shipped vs. roadmap scope.

- Use the current alpha to prove the product thesis.
- Use motion-graphic overlays to explain the larger Boreal architecture.
- Do not present Solana escrow, libp2p presence, ACP/UCP depth, or collective fulfillment as already shipped unless they are live in the build by render time.
- If a capability is still in-progress at render time, label it as `next layer`, `hackathon build`, or `coming online`.

## Planned outputs

- `scenes.md`: master narrative and scene-by-scene structure
- future voiceover script
- future capture list for actual UI footage
- future Remotion compositions and render targets

## Planned render targets

1. `HackathonPitch3Min`
2. `LaunchCut90Sec`
3. `TechnicalDemo150Sec`

All three should share the same scene system and asset pool.

## Hackathon scoring lens

The master video should be structured so it naturally covers the Frontier criteria:

- **Functionality**: real UI, real request flow, real artifact and workspace states
- **Potential impact**: the market problem and why intent-to-fulfillment matters
- **Novelty**: one surface for humans, agents, tools, and routable supply
- **UX**: why Boreal is better than fragmented search / chat / ops flows
- **Open-source and ecosystem composability**: protocol-native direction and Solana fit
- **Business plan**: light but credible explanation that Boreal can become real infrastructure, not a demo-only toy
