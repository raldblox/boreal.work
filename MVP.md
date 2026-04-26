# Boreal MVP

This document defines the smallest possible Boreal launch wedge for testing whether buyers will pay for automation-first execution with human fallback.  It is not the full product roadmap.  It is the narrowest test that can generate real signal in two weeks.

## Core Assumption

Boreal only works as a business if buyers will pay to hand over an outcome request instead of choosing tools themselves.

For the first test, the assumption is:

`Early-stage founders with launch pressure will pay Boreal to complete a scoped AI-executable request through a tool-first flow, with human fallback only when automation is not enough.`

If this assumption is wrong, Boreal is not a request router for paid agentic services.  It becomes either:

- a services marketplace with extra routing
- a tool wrapper with weak monetization
- a concierge product that does not compound

## Recommended Wedge

Start with one paid request type for one buyer segment.

- Buyer: early-stage founders shipping in the next 30 days
- Offer: `Launch Copy Pack`
- Outcome: launch page copy, onboarding copy, and a checkout-ready listing draft
- SLA: 24 hours
- Delivery model: tool-first generation, human fallback polish

This wedge is strong enough to test payment, routing, delivery quality, and fallback behavior without needing a marketplace.

## Minimum Feature Set

Build only what is required to test the assumption.

### Buyer-facing

- One landing page
- One plain-language intake form
- One fixed-price checkout
- One confirmation page or email
- One delivery page or email with `Accept` / `Needs revision`

### Operator-facing

- One internal request queue in Airtable or Notion
- One runbook for tool execution order
- One fallback rule for human rescue
- One delivery template
- One metrics log

### Product behavior

- Buyer submits one request
- Boreal structures the request
- Boreal runs the tool-first path
- Human fallback triggers only when the output is below threshold
- Delivery returns in one thread or one delivery packet

## What Gets Cut

Everything below is out of scope for the MVP because it does not test the core assumption directly.

- public request directory
- public supply directory
- profiles
- proposals
- carts
- wallets
- protocol endpoints
- external provider registry sync
- autonomous workers
- multi-category matching
- agent-to-agent routing
- open marketplace dynamics
- generalized checkout flows
- reputation systems
- review systems beyond simple acceptance
- multimodal intake
- multi-offer packaging

## Fixed-Price Offer

Use one fixed offer so pricing does not confuse the test.

- Offer name: `Launch Copy Pack`
- Price: `$149`
- Included:
  - landing page headline and subheadline
  - 3 to 5 core benefit sections
  - onboarding email or onboarding copy block
  - checkout-ready listing copy draft
  - one revision pass
- Delivery time: `within 24 hours`
- Escalation rule: if the request needs original strategic thinking beyond the pack scope, reject or refund instead of quietly turning the MVP into a custom agency service

## Landing Page Copy

Use direct copy that sells the wedge, not the whole Boreal vision.

### Hero

- Eyebrow: `24-hour launch copy`
- Headline: `Submit one request. Get launch-ready copy without choosing AI tools.`
- Subheadline: `Boreal turns your launch request into a paid execution flow, runs the best available tools first, and adds human fallback only when the output needs polish.`
- Primary CTA: `Start your request`
- Secondary proof line: `Fixed price. 24-hour turnaround. One revision included.`

### Problem section

- Title: `Founders should not have to assemble a tool stack for every launch task.`
- Body: `Most founders know the outcome they need, not which AI tools to combine to get there. Boreal takes one request, runs the tool-first path, and delivers usable launch assets in one package.`

### What you get

- `Landing page copy draft`
- `Onboarding copy block`
- `Checkout-ready listing copy`
- `Delivery in 24 hours`
- `Human polish when automation misses`

### CTA section

- Title: `Describe the launch outcome you need.`
- Body: `If this fits the pack, you can pay and submit in minutes. If it does not, Boreal should reject it instead of pretending the wedge is broader than it is.`

## Intake Form Spec

Ask only for fields that change execution quality.

- `What are you launching?`
- `Product URL or product description`
- `Who is the target user?`
- `What is the launch date?`
- `What assets do you need?`
- `Any constraints, claims, or words to avoid?`
- `Email for delivery`

Optional:

- `Reference links`
- `Current draft copy`

Do not ask for:

- budget negotiation
- team size
- long company background
- brand workshop questions
- anything that turns the form into discovery consulting

## Manual Ops Runbook

The first version should be mostly manual behind the scenes.

### Intake triage

1. Confirm the request fits the `Launch Copy Pack` scope.
2. Reject and refund requests that need deep strategy, legal review, or custom research.
3. Normalize the request into:
   - product
   - target user
   - launch date
   - required deliverables
   - constraints

### Tool-first execution order

1. Generate the first draft with the primary LLM prompt.
2. Run a second pass for structure, clarity, and conversion polish.
3. Run a lightweight consistency check against the user constraints.
4. Package the draft into the delivery template.

### Human fallback rule

Use a human editor only when one of these is true:

- the copy is generic relative to the product description
- the output ignores the target user
- the listing copy is not commercially usable
- the request contains nuance the automated path missed

Human fallback should polish or repair the output, not rewrite the deliverable from zero unless the test itself shows automation is too weak.

### Delivery template

Deliver in one structured packet:

- headline and subheadline
- body sections
- onboarding block
- listing copy
- short usage note
- `Accept` link
- `Needs revision` link

## Test Criteria

Success or failure must come from behavior, not compliments.

### Success threshold

Within 14 days:

- at least `20` qualified prospects are reached directly
- at least `5` people pay
- at least `70%` of paid requests are completed tool-first with only light human polish
- at least `60%` of deliveries are accepted on first pass
- at least `2` customers ask for another paid task or a clear adjacent upsell

### Failure threshold

The wedge is wrong if any of these dominate:

- prospects are curious but do not pay
- paid requests require heavy custom human work from scratch
- outputs need repeated clarification before delivery
- customers would rather use a known tool directly
- the effective margin disappears because fallback becomes the main labor path

## Metrics Log

Track the same fields for every request:

- source
- request type
- paid or not paid
- delivery time
- tool-first or fallback-assisted
- accepted first pass or revision needed
- refund or no refund
- follow-up paid request or none

## 2-Week Launch Plan

### Day 1

- Lock the wedge.
- Finalize the offer, price, and rejection rules.

### Day 2

- Write the landing page copy.
- Build the intake form and payment link.

### Day 3

- Build the internal ops queue and delivery template.
- Write the execution and fallback runbook.

### Day 4

- Run 3 internal sample requests end to end.
- Tighten the form, prompts, and delivery packet.

### Day 5

- Prepare 3 example outputs from fake but realistic launches.
- Add those examples to the landing page or outreach material.

### Day 6

- Build the prospect list of 30 qualified founders:
  - personal network
  - founder communities
  - builders posting active launches
  - operators with visible shipping deadlines

### Day 7

- Send the first outbound wave.
- Book the first buyers manually if needed through DMs or email.

### Day 8

- Close the first 1 to 2 paid requests.
- Fulfill them through the tool-first path.

### Day 9

- Deliver those requests.
- Record acceptance, revision demand, and fallback effort.

### Day 10

- Send the second outbound wave using the first delivery examples and early proof.
- Close the next 2 to 3 paid requests.

### Day 11

- Fulfill the second batch.
- Tighten the fallback rule if the human rescue path is too heavy.

### Day 12

- Deliver the second batch.
- Ask each customer for the next adjacent paid job, not general feedback.

### Day 13

- Review the metrics log.
- Compare actual behavior against the success and failure thresholds.

### Day 14

- Make one decision only:
  - continue the wedge
  - change the wedge
  - kill the assumption

## Decision Rule

Do not expand the product surface until this wedge proves that buyers pay for outcome routing itself.

If the launch copy wedge fails, Boreal should not add more infrastructure.  It should either:

- choose a more automation-friendly paid request type
- choose a tighter buyer segment
- or admit that the real business is human services, not paid agentic routing
