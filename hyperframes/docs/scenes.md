# Boreal Explainer 48s

## Overview

- **Topic**: Boreal as request-native commerce
- **Hook**: Demand keeps getting expressed, but most of it disappears before it becomes accountable work
- **Target Audience**: Hackathon judges, early operators, and partners who need a fast product explanation
- **Estimated Length**: 48 seconds
- **Key Insight**: Boreal keeps the original request alive long enough to search supply, open proposals only when needed, and keep fulfillment attached

## Narrative Arc

Start with disappearing demand as the failure mode of today's chat and search surfaces.  Then show Boreal as the missing operational layer where plain language becomes a request, supply becomes visible, and work stays accountable until fulfillment lands.  Close on the category claim rather than a feature list.

---

## Scene 1: Demand Disappears

**Duration**: ~8.4 seconds  
**Purpose**: Establish the problem before introducing Boreal

### Visual Elements

- dark graphite canvas
- floating request fragments
- route arc that never resolves
- closing note that intent disappears into dead threads

### Content

Show demand fragments like deadlines, vague asks, and routing language appearing in isolated cards.  The scene should feel active but unresolved, with the visual system suggesting motion without completion.

### Narration Notes

Open hard and fast.  Focus on the operational failure, not branding.

### Technical Notes

- scene wrapper transition target for Scene 2
- fragment cards enter from varied directions
- route line grows in but never lands on a resolved state

---

## Scene 2: The Ask Becomes A Request

**Duration**: ~9.6 seconds  
**Purpose**: Deliver the first product aha moment

### Visual Elements

- bright Boreal work surface
- prompt card using real Boreal copy
- structured request panel
- signal chips for `Request drafted` and `Supply first`

### Content

Use a real prompt based on the homepage flow: launch page, onboarding copy, and a checkout-ready listing by Friday.  Pair it with a request draft showing deliverables, routing, and execution rules.

### Narration Notes

Explain that Boreal starts where people already think: natural language.

### Technical Notes

- use the real product nouns from `next-app/components/home/landing-page.tsx`
- prompt and request panels should animate separately to show transformation, not just appearance

---

## Scene 3: Supply First

**Duration**: ~9.8 seconds  
**Purpose**: Show Boreal as a market surface, not a private chat thread

### Visual Elements

- three-column market board
- supply cards
- request status rail
- matched path and profile detail card

### Content

Show that humans, agents, products, and services become searchable supply in the same surface.  Emphasize that Boreal scores options first and keeps proposal work gated to the missing custom pieces.

### Narration Notes

This scene should feel precise and market-like, not chatty.

### Technical Notes

- use visible route scoring and request-state chips
- keep the layout editorial and structured

---

## Scene 4: Direct Or Custom

**Duration**: ~10.2 seconds  
**Purpose**: Show hybrid fulfillment paths without losing context

### Visual Elements

- central request node
- left lane for ready supply
- right lane for custom proposal flow
- evidence bar tying artifacts and review back to the request

### Content

Explain that some work should resolve directly through ready supply while other work needs open proposals.  Both paths must return to the same request thread with approvals, artifacts, and delivery attached.

### Narration Notes

This is the second product aha moment.  Keep the explanation tight.

### Technical Notes

- route branches animate outward from one request node
- evidence bar lands last to reinforce accountability

---

## Scene 5: Accountable Close

**Duration**: ~10.0 seconds  
**Purpose**: End on the category claim

### Visual Elements

- Boreal mark
- closing thesis line
- proof pills for live alpha capabilities
- final tagline pill

### Content

Return to a darker brand field and state that commerce should not end at the prompt.  Boreal keeps requests alive until they become supply, work, and fulfillment.

### Narration Notes

Slow down slightly here.  Let the claim land.

### Technical Notes

- this is the only scene allowed a final fade-out
- keep the logo energy restrained and cyan-forward

---

## Transitions & Flow

- Use one primary transition throughout: push slide with a brief blur handoff
- Scene 1 -> Scene 2 should feel like a system snapping into structure
- Scene 2 -> Scene 3 should feel like the request opening into a market surface
- Scene 3 -> Scene 4 should feel like one route splitting into two valid paths
- Scene 4 -> Scene 5 should feel like convergence and resolution

## Color Palette

- Primary: `#22C1F3` for route signals and primary emphasis
- Secondary: `#62FFCE` for active highlights and route confirmation
- Accent: `#6537C6` for minimal depth in brand moments only
- Background: `#F7FAF9` for work surfaces and `#071311` for problem / close scenes

## Mathematical Content

- route scoring values
- structured request metadata
- proof counters and stage chips

## Implementation Order

1. Establish global design tokens and scene backgrounds
2. Build the five hero frames statically
3. Add scene entrances
4. Add scene-to-scene transitions
5. Add polish accents like route sweeps and proof-chip motion
