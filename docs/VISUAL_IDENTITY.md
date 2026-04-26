# Boreal Visual Identity

This document captures Boreal's current visual identity based on the live app tokens and logo implementation in:

- `next-app/app/globals.css`
- `next-app/app/layout.tsx`
- `next-app/components/ui/logo.tsx`
- `next-app/components/home/landing-page.tsx`

It is a practical guide for keeping future design work coherent.

## Current State

Boreal already has a usable visual direction in code.

Current visual signals:

- light-first neutral base
- cool cyan-teal primary accents
- soft aqua accent surfaces
- rounded editorial panels with restrained depth
- expressive display typography
- cleaner operational sans for body copy
- geometric, north-pointing logo mark with blue-cyan-purple gradients

What is missing is not a visual identity from zero. What is missing is one document that says what to preserve and what not to drift into.

## Visual Thesis

Boreal should look like:

- a market operating surface
- crisp and modern
- directional and forward-moving
- calm under load
- credible enough for commerce
- distinct from generic SaaS dashboards

Boreal should not look like:

- crypto-neon chaos
- purple-on-black AI slop
- soft productivity beige
- enterprise admin dullness
- whimsical consumer marketplace kitsch

## Core Visual Idea

The visual system should express:

- clarity of flow
- directional movement
- visible structure
- cold precision with a human surface

Short version:

`Northern, operational, and bright.`

## Logo

Source:

- `next-app/components/ui/logo.tsx`

What the mark currently communicates:

- triangular / directional geometry
- a forward or northbound vector
- layered motion and signal
- a more energetic interior against a darker structural silhouette

Guidance:

- keep the mark geometric and directional
- preserve the sense of ascent, routing, or navigation
- use the full gradient mark for brand moments, launch surfaces, deck covers, and hero areas
- allow monochrome use in dense UI contexts
- do not redraw into a friendly blob, chat bubble, or generic spark icon

## Typography

Current fonts in code:

- `Syne` for headings via `--font-heading-display`
- `Manrope` for primary body text via `--font-sans-base`
- `Geist Mono` for code or machine-readable contexts

Role guidance:

- `Syne` is the Boreal brand voice in visual form
- `Manrope` is the product-operational voice
- `Geist Mono` is for traces, prompts, request states, IDs, technical artifacts, or protocol surfaces

Use:

- headlines: bold, sharp, slightly compressed-feeling display moments
- body: legible, clean, neutral
- mono: sparse and functional only

Avoid:

- introducing decorative serif branding
- replacing the heading system with generic sans-only layouts
- overusing mono for marketing copy

## Color System

### Live app token direction

From `next-app/app/globals.css`:

- background is near-white
- foreground is charcoal
- primary is a cyan-teal blue
- accent is a pale aqua
- borders are quiet neutral grays

This is the real UI system today.

### Brand palette roles

Primary:

- Boreal Cyan
- use for primary actions, active states, directional emphasis, and key highlights

Secondary:

- Ice / Mist neutrals
- use for surfaces, panels, separators, and calm structure

Support:

- Deep Graphite
- use for text, framing, and serious contrast

Occasional depth accent:

- the logo includes blue-to-purple energy in the gradient
- this can appear in brand moments, but should not dominate core product UI

Practical rule:

- the product should read cyan-forward, not purple-forward

## Suggested Palette Description

Use this verbally when briefing designers:

- near-white base
- charcoal type
- cyan-teal primary
- pale aqua accents
- occasional blue-violet energy from the logo gradient

## Shape Language

Current direction:

- rounded panels
- soft-but-not-playful corners
- structured modular cards
- layered shells and rails

Guidance:

- keep corners generous but controlled
- use containers that feel like work surfaces, not floating social cards
- let the layout imply routing and flow
- use lines, rails, dividers, and grouped surfaces to show system structure

Avoid:

- glassmorphism overload
- heavy gradients on every card
- bubbly consumer-app shapes

## Depth and Texture

Current code already uses:

- soft borders
- light blur in panels
- restrained drop shadows
- subtle radial and linear background fields

Guidance:

- keep depth soft and architectural
- use atmospheric backgrounds sparingly
- let the structure do more work than decoration

The page should feel:

- live
- layered
- slightly cinematic

But not:

- glossy
- noisy
- ornamental

## Motion

Recommended motion style:

- directional reveals
- subtle panel lifts
- staggered sequence entry
- route-like or signal-like movement

Avoid:

- bouncy consumer motion
- flashy AI sparkles everywhere
- over-animated gradients

The motion should feel like:

- routing
- activation
- flow

## Imagery

If Boreal uses imagery or illustration later, prefer:

- interface crops
- structured diagrams
- market activity surfaces
- workflow snapshots
- directional abstract fields

Avoid:

- smiling stock-photo freelancers
- robot mascots
- generic chat bubbles as hero art
- fake futuristic cityscapes

## Landing Page Direction

For chat-native positioning, the landing page should feel closer to a live operating surface than a detached marketing site.

Priority order:

1. request input or request example
2. visible structure turning chat into a request
3. supply / proposal / fulfillment outcomes
4. proof of live product surfaces

The hero should communicate:

- start in chat
- stabilize into a request
- route to market activity

Not:

- just a static marketing headline with abstract feature cards

## Visual Do / Do Not

Do:

- keep Boreal bright, cool, and directional
- use the heading font for strong editorial tension
- keep panels modular and operational
- show the product surface early
- preserve cyan-teal as the main UI accent

Do not:

- drift into purple-heavy AI branding
- flatten everything into generic white SaaS blocks
- over-darken the product as a default mood
- use playful illustration systems that undercut trust
- present Boreal as only a chatbot

## Implementation Notes

Current implementation sources worth preserving:

- typography in `next-app/app/layout.tsx`
- color tokens in `next-app/app/globals.css`
- panel styling in `.boreal-panel`
- logo mark in `next-app/components/ui/logo.tsx`

If visual refresh work starts later, preserve those anchors unless there is a deliberate full rebrand.
