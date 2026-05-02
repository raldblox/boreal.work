# Boreal Request Lifecycle

This document locks the canonical Boreal flow from request intake through funding, execution, fulfillment, and payout.

Use it when the question is:

- what Boreal should do after a user types a request
- where free orchestration stops and paid execution begins
- how `402`, Solana verification, and request-thread execution should fit together
- how frontend copy, API contracts, and pitch demos should describe the same flow

## Core Thesis

Boreal turns a request into a funded work thread.

That means:

- the request is the durable object
- Boreal Agent handles free intake, clarification, and routing
- paid specialist work starts only after the funded-work boundary is met
- the same request resumes after payment instead of starting a second workflow
- proof, delivery, review, and payout stay attached to that request

## Canonical Route Types

### 1. Free Boreal orchestration

Use this when:

- the user is still shaping the work
- Boreal can answer directly without committing paid execution
- the user is browsing offers, asking capability questions, or clarifying scope

Rules:

- Boreal Agent stays mounted by default
- no `402`
- no hidden provider or wallet flow
- the request may still be opened if the conversation crosses into real work

### 2. Funded specialist execution

Use this when:

- Boreal can lock a deterministic specialist route
- the route is paid
- execution should not begin until the owner funds it

Rules:

- open one tracked request
- lock the route and quote
- return or show `payment required`
- after funding, resume the exact same request and route

### 3. Wallet-approved Solana action

Use this when:

- the mounted specialist is `solana-operator`
- the action needs explicit connected-wallet approval

Rules:

- keep the request thread as the record
- require explicit wallet approval from the owner
- record the resulting signature or submission back into the same request
- never imply hidden custody or silent execution

### 4. Custom market or proposal work

Use this when:

- direct supply is not enough
- human judgment, teamwork, or negotiation is needed

Rules:

- open the request
- collect proposals or team participation
- later add funded acceptance or escrow

This is important, but it is not the main paid-launch wedge right now.

## Canonical States

The main request states Boreal should make visible are:

- `draft`
- `open`
- `payment required`
- `funded`
- `executing`
- `waiting for owner`
- `delivered`
- `reviewed`
- `cancelled`
- `failed`

Avoid internal-only state names on user-facing surfaces unless a technical route truly needs them.

## Canonical Request Flow

### Step 1. Intake

The owner starts in Boreal chat.

Expected UX:

- Boreal Agent is mounted by default
- the ask is accepted in plain language
- Boreal can answer for free if orchestration is enough

### Step 2. Request formation

If the ask is real work, Boreal should convert it into one tracked request.

Expected UX:

- the request becomes visible
- the route becomes visible
- the thread becomes the canonical place for work

### Step 3. Route decision

Boreal chooses among:

- free Boreal orchestration
- funded specialist execution
- wallet-approved Solana action
- custom market or proposal path

Expected UX:

- users see the route type
- users do not need to infer whether execution is free or funded

### Step 4. Funding boundary

If the route is paid, the request should move into `payment required`.

Expected UX:

- show specialist or team
- show quote and currency
- show seller block
- show that execution starts after payment verification
- keep the request thread visible while payment is pending

### Step 5. Sign and fund

For the current premium request-first contract:

- the owner signs the payment authorization
- Boreal receives the signed receipt
- Boreal verifies the Solana mainnet proof

Expected UX:

- payment feels like the start condition for work
- funding does not bounce the user into a second workflow

### Step 6. Resume the same request

After successful verification:

- the same request moves to `funded` or `executing`
- the same locked specialist route resumes
- Boreal does not rematch by default

### Step 7. Execution

Execution happens inside the same request thread.

Expected UX:

- progress updates appear in-thread
- evidence appears in-thread
- artifacts appear in-thread
- follow-up stays attached to the same request

### Step 8. Delivery and review

Expected UX:

- delivery lands in the same thread
- proof stays attached
- the owner can review without leaving the request
- payout progression can be derived from the same transaction spine

## Frontend Rules

### Chat shell

- Boreal Agent stays free and default
- mounted specialists should feel immediate
- if a mounted specialist is paid, the request should still open immediately, but execution should wait on funding

### Offers

- keep specialist cards honest
- show when execution is funded
- do not bury payment-required behavior behind provider jargon

### Request thread

- the request thread is the work container
- payment, proof, execution, delivery, and review should all be visible there

### Solana

- payment verification should be visible as a trust boundary
- wallet-approved action cards should stay explicit and non-custodial

## API and Architecture Rules

The canonical funded-execution primitives are:

- request
- route lock
- quote
- seller block
- `402 payment_required`
- signed payment receipt
- Solana verification
- status callbacks
- evidence callbacks
- delivery
- payout records

Internal Boreal specialists should use these first.

Later, external x402-compatible specialists should be able to use the same shape.

## Priority Order

This is the right product order right now:

1. free Boreal orchestration
2. funded specialist request threads
3. visible Solana verification and payment UX
4. same-thread execution and delivery proof
5. external x402-compatible specialist reuse
6. funded acceptance or escrow for custom async work
7. desktop productization and richer private runtime control

## What Is Explicitly Later

- generalized escrow for all async work
- treasury-grade settlement proof claims
- public desktop-node product positioning
- broad swarm collaboration as the hero story
- universal provider execution parity

## Canon Summary

Use this summary when alignment is needed fast:

- Boreal Agent is free orchestration
- specialists are funded execution
- the request is the durable object
- `402` is the paid start boundary
- Solana verification starts execution
- the same request resumes after payment
- fulfillment, proof, review, and payout stay attached
