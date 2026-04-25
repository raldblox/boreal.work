# Boreal Architecture Explainer

## Overview

- **Topic**: Boreal's end-to-end request-native commerce architecture
- **Hook**: Demand keeps getting expressed in chat, but most of it disappears before it becomes accountable work or checkout
- **Target Audience**: builders, technical evaluators, protocol-aware operators, early product partners
- **Estimated Length**: 150 seconds
- **Key Insight**: Boreal is not just a chat UI; it is a routing and accountability layer that keeps one request attached to matching, proposals, checkout, fulfillment, evidence, and future learning

## Narrative Arc

Start from the problem of disappearing demand, then reframe Boreal as a three-layer system.  Walk the viewer through the full path: request intake, structured extraction, supply normalization, match cascade, execution branches, payment and audit rails, and the feedback loop that compounds into stronger routing.

---

## Scene 1: Demand Should Not Disappear
**Duration**: ~12 seconds  
**Purpose**: Establish the problem and the durable request abstraction.

### Visual Elements
- chat bubble becoming a request card
- directional route line
- dark thesis wrapper

### Content
Show a plain-language ask entering chat.  The bubble does not fade into a transcript.  It transforms into a request object with fields, giving the viewer the first architectural shift: Boreal's durable object is the request, not the conversation.

### Narration Notes
Plain language enters as chat.  Boreal turns it into a request the rest of the system can route and account for.

---

## Scene 2: Three Layers
**Duration**: ~16 seconds  
**Purpose**: Introduce the architecture stack.

### Visual Elements
- three stacked architectural bands
- `Supply activation`, `Demand routing`, `Network intelligence`
- `alpha today` and `later expansion` badges

### Content
Show the system in three layers.  Supply activation makes supply searchable.  Demand routing keeps requests alive and moves them toward resolution.  Network intelligence compounds outcomes back into better routing and deeper protocol reach.

### Narration Notes
Anchor the architecture before diving into flow details.

---

## Scene 3: Entry Surfaces
**Duration**: ~18 seconds  
**Purpose**: Show how requests and supply enter Boreal.

### Visual Elements
- actors: user, agent, merchant, external provider
- entry surfaces: chat, API, profile builder, provider sync
- central Boreal core node

### Content
Multiple actors feed the same core: humans and agents start with chat or API requests; merchants and operators publish supply through profile and listing tools; external providers sync capabilities through adapters.

### Narration Notes
This is one market surface with multiple entry points, not multiple disconnected products.

---

## Scene 4: Intake And Persistence
**Duration**: ~20 seconds  
**Purpose**: Show request creation and the persistence spine.

### Visual Elements
- pipeline: expression -> extraction -> keyword / embedding -> request workspace
- record row: request, activity, proposals, fulfillments, cart, matches

### Content
Show natural-language intake becoming structured fields, keywords, and embeddings.  Then show those outputs writing into a durable workspace and the backing record set that keeps future steps attached.

### Narration Notes
The point is not just AI extraction.  The point is that the request remains an operational object.

---

## Scene 5: Supply Activation
**Duration**: ~20 seconds  
**Purpose**: Explain the supply layer.

### Visual Elements
- source cards: human supply, agent supply, digital listings, provider-backed capabilities
- normalization hub
- public supply directory and request workspace outputs

### Content
Show native and external supply flowing through normalization into one canonical Boreal supply surface.  This is where products, services, humans, agents, and provider-backed capabilities become comparable.

### Narration Notes
Supply activation is what makes later matching possible.

---

## Scene 6: Matching Cascade
**Duration**: ~24 seconds  
**Purpose**: Explain how Boreal decides where a request goes.

### Visual Elements
- retrieval and scoring core
- lexical, embedding, structured-filter, history inputs
- tier cascade: Tier 1, Tier 2, Tier 3, Tier 4

### Content
Show candidate generation and score breakdown flowing into a resolution cascade.  Tier 1 is direct delivery.  Tier 2 is a known solver fast-route.  Tier 3 is open market proposals.  Tier 4 is pending and rematch.

### Narration Notes
Keep the focus on routing policy, not only model scores.

---

## Scene 7: Two Execution Paths
**Duration**: ~22 seconds  
**Purpose**: Show how Boreal handles buyable supply versus custom work.

### Visual Elements
- split flow: `buyable path` and `custom work path`
- left path: listing -> cart -> checkout -> provider invocation -> delivery
- right path: proposals -> acceptance -> fulfillment -> evidence -> review

### Content
Show that Boreal does not force every request into one transaction pattern.  Some requests resolve into direct checkout.  Others become scoped work with proposals and deliveries.  Both stay attached to the same request and workspace logic.

### Narration Notes
This is the core unification move in the system.

---

## Scene 8: Commerce And Audit Spine
**Duration**: ~10 seconds  
**Purpose**: Clarify what is live today versus later settlement ambitions.

### Visual Elements
- `alpha today` column
- `later architecture` column
- wallet, payment attempt, service invocation, transaction, settlement, payout cards

### Content
On the left, show the live alpha spine: wallet readiness, Privy-backed x402 initiation for supported provider flows, transaction and invocation records, payment-aware checkout, audit events.  On the right, show later layers as clearly future-facing: escrow, automatic settlement, protocol-native interoperability, collective fulfillment.

### Narration Notes
This scene prevents overclaiming while still explaining the intended architecture.

---

## Scene 9: Feedback Loop And Close
**Duration**: ~8 seconds  
**Purpose**: Close on compounding behavior.

### Visual Elements
- outcome ring feeding back into matching
- match events, reviews, evidence, analytics, trust
- final thesis line

### Content
Show fulfilled outcomes feeding back into ranking and reputation.  End on Boreal's thesis: chat-native in front, request-native in the middle, intent-to-fulfillment underneath.

### Narration Notes
Close with confidence, not hype.

---

## Claim Boundary

- **Live alpha**: request intake, request workspaces, supply directory, proposals, fulfillments, delivery evidence, activity logs, provider-backed checkout routing, x402 initiation for supported provider flows, persistent match candidates and score breakdowns
- **Target architecture**: escrow, automatic settlement, full ACP/UCP/A2A exposure, collective fulfillment, generalized autonomous settlement
