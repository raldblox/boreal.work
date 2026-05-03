# Boreal Submission Guide

Use this file as the submission canon.  It is the shortest judge-facing map of what Boreal is, what to show, and what each artifact must prove.

## One-line Product

Boreal is the request-to-fulfillment layer for the agent economy.  It turns a request from a human or an agent into one funded work thread where routing, approval, payment, execution, and delivery stay attached.

## What Judges Must Understand

1. The problem is not more AI generation.  The problem is that real requests still die before fulfillment starts.
2. AI increased asks, but it did not solve execution.
3. Boreal is not another chat app, not an Upwork clone, and not a general multi-agent platform.
4. Boreal keeps one request alive from intake to routing to approval to payment to execution to delivery.
5. Solana is not decorative here.  It is the payment and approval boundary before paid work starts.
6. Humans and agents can both open work, join work, fulfill work, and get paid on the same request thread.

## High-value Review Surfaces

### 1. Live URL

Primary URL:

- `https://boreal.work/`

This page must prove, in under `30 seconds`:

- Boreal starts from one request
- Boreal can match the best route it can support
- Boreal can open tracked work instead of leaving the ask in chat
- paid execution has a visible funded-start boundary

The homepage is the product shell.  Do not treat `/chat` as the public front door in submission copy.

### 2. README

The README must do four things fast:

1. state the problem in plain language
2. state the solution in one sentence
3. link the live URL immediately
4. tell judges exactly what to try

The README should feel submission-first at the top and developer-first below that.

### 3. Pitch Video

Source of truth:

- [submission/pitch.md](/C:/Users/raldb/boreal.work/remotion/docs/submission/pitch.md)

The pitch must prove:

- why the problem matters
- why current tools still leave a fulfillment gap
- why AI increased asks but not execution
- why Boreal is the right product category
- why this is a real company wedge
- why Solana matters in the loop
- what is already shipped right now

The pitch sells the company and category.  It should not try to be the whole product walkthrough.

Runtime target:

- `<= 2:00`

### 4. Demo Video

Source of truth:

- [submission/demo.md](/C:/Users/raldb/boreal.work/remotion/docs/submission/demo.md)

The demo must prove:

- request in
- matched supply visible
- owner control stays intact
- payment boundary is explicit
- Solana verification happens before paid execution
- the same request resumes
- delivery stays attached

The demo sells the product loop.

Runtime target:

- `<= 3:00`

## Submission Story Order

Use this order everywhere:

1. people ask for real outcomes
2. most requests still die before fulfillment
3. AI increased asks, not execution
4. Boreal is the request-to-fulfillment layer
5. Boreal shows matched supply
6. owner can approve, invite, or open to the market
7. paid execution starts only after Solana-verified approval and payment
8. the same request resumes and keeps proof, delivery, and review attached

## What To Show Live

Use these as the primary prompts:

- `debate: solana vs ethereum`
- `Pressure test this startup idea, define the smallest MVP, and route the right work.`
- `I need a human operator to clean up my product catalog this week.`

These three prompts cover:

- preset team route
- specialist route
- worker-market route

## What Not To Overclaim

Do not imply:

- Boreal always knows the perfect winner
- every route auto-executes
- all supply is already deeply reputation-trained
- Solana actions happen without user approval

The honest claim is:

- Boreal shows the best route it can support now
- when confidence is weak, the request can open to the market
- paid execution starts after verified approval and payment
- the winning wedge is one request thread, not ten product surfaces

## Judge Checklist

Before submission, Boreal should score well on all of these:

- the homepage feels like a product, not a project
- the README explains Boreal in plain language in the first screenful
- the pitch and demo do not contradict the live UX
- `debate:` resolves to `Debate and Verdict`
- default Boreal-hosted text flow does not ask the user to pick a provider when only one free default lane exists
- matched supply can actually appear in the default request flow
- worker-market fallback is honest when no strong direct route exists
- Solana payment verification is described and shown as the start boundary for paid work

## Final Submission Standard

If a judge only sees these four artifacts:

- homepage
- README
- pitch
- demo

they should still understand the core thesis:

Boreal is the request-to-fulfillment layer for the agent economy, where humans and agents can both turn real demand into funded execution on one thread.

## Final Form Draft

Use this section as the copy-ready draft for the actual submission form.  Founder-only fields that the repo cannot answer yet are marked clearly.

### Project name

Boreal

### Brief description

Boreal is the request-to-fulfillment layer for the agent economy.  It turns a request from a human or an agent into one funded work thread where routing, approval, payment, execution, and delivery stay attached.

### Project website

`https://boreal.work/`

### What are you building, and who is it for?

We are building the request-to-fulfillment layer for the agent economy.  Boreal starts from one request in chat, shows matched supply, turns that request into a tracked work thread, and keeps approval, payment, execution, proof, and delivery attached to the same thread.

It is for founders, operators, and agent builders who already start real work in chat but still have to stitch together execution manually.  It is also for specialists, agent owners, and worker teams who want to discover work, join funded requests, fulfill them, and get paid through the same product loop.

### Why did you decide to build this, and why build it now?

Most AI tools are still good at answering, but not very good at actually getting work done.  Search helps people find information.  Chat helps generate text.  Marketplaces help find labor.  Task tools help track work after someone already owns it.  But there is still no clean layer between asking for something and actually getting it fulfilled.

That gap matters more now because AI has increased the volume of requests dramatically, but it has not solved execution.  We built Boreal because more of the internet is becoming request-driven, but fulfillment is still fragmented across chat logs, software tools, labor markets, and payment flows that were not designed to carry one request all the way through to completion.

### What technologies are you using or integrating with to build your product? Please include notable developer tools and AI tools as well.

- Next.js 16 and React 19 for the chat-native web app and request workspace
- Convex for request, supply, inbox, payout, and lifecycle state
- OpenAI through the AI SDK for Boreal-hosted text, image, voice, and video execution
- Reown plus Solana wallet tooling for connected-wallet approvals inside request threads
- `@solana/kit` and `@solana/web3.js` for Solana-aware request actions and verification paths
- x402 plus Solana mainnet verification for funded specialist starts
- NextAuth for signed-in account flows
- Remotion for the product pitch and demo video pipeline
- Electron for Boreal Desktop, the owner-run private execution node path
- AgentCash and other provider-adapter discovery routes for external paid supply

### What category best describes your product?

Best fit: request-to-fulfillment infrastructure for the agent economy.

If the form only offers fixed categories, choose the closest commerce, payments, or infrastructure category rather than generic AI chat or multi-agent tooling.

### Is your project a mobile-focused dApp?

No

### Please share any important context about your repo. For example, if it only represents part of the product, or includes elements of unrelated products.

This repo is the main Boreal workspace.  The live product is in `next-app/`.  The root docs are the product and contract canon.  `remotion/` contains the video workspace for pitch and demo production.  `boreal-desktop/` contains the private desktop execution-node workspace, which is real but not the main submission surface.  The repo is not a mixed dump of unrelated products, but it does include supporting video, deck, and desktop workspaces alongside the main web app.

### Please submit a demo video of your product.  Up to 3 minutes.  Should show the live product, not a slide deck, not a code walkthrough.

`TODO: add public YouTube, Loom, or Vimeo demo link`

Source script:

- [submission/demo.md](/C:/Users/raldb/boreal.work/remotion/docs/submission/demo.md)

### Live product link

`https://boreal.work/`

### Access instructions

No special credentials should be required for the homepage or the public product shell.  If a signed-in path is needed, use the X sign-in flow.  Boreal should be judged primarily from the public live surface plus the demo and pitch videos, not from a private admin path.

### Pitch video.  Separate from the demo video.  Up to 2 minutes.

`TODO: add public YouTube, Loom, or Vimeo pitch link`

Source script:

- [submission/pitch.md](/C:/Users/raldb/boreal.work/remotion/docs/submission/pitch.md)

### How do you know people actually need, or will need this product?

We think the need is already visible in how people use AI today.  They are no longer only asking for information.  They are asking for outcomes: research this, build this, pressure test this, find the right person, start the work.

But those asks still die before fulfillment starts.  They get lost in chat, buried in software, or split across marketplaces, payment rails, and project tools.  The current stack captures intent, but it does not carry that intent cleanly into funded execution.  Boreal exists because that gap is already large, and it gets larger as more human and agent demand starts from natural-language requests.

### How far along are you? Do you have users? Please be as specific as possible.

We are at working alpha.  The live product already supports a real request-first flow with tracked work threads, current market matching, specialist routing, preset teams, worker-market fallback, and paid specialist starts gated by x402 plus Solana mainnet verification.  The current product already includes eight public-ready specialist routes, the shipped `Debate and Verdict` preset team, external service-provider adapters such as AgentCash discovery, and a private desktop execution-node path.

We are not claiming scaled distribution or large public user numbers in this repo-backed submission.  The strongest proof today is shipped product truth: the live request lifecycle, real Solana-gated payment start, current matched supply, and working execution surfaces for agents, teams, and human fallback.

### Who else is building in this space, and what do you think they're getting wrong?

Chat tools, agent builders, freelancer marketplaces, and automation tools each cover one slice of the workflow, but not the whole loop.  Chat products are good at answering but usually stop before fulfillment.  Marketplaces like Upwork help people find labor, but they do not treat the request itself as the main system object from intake through approval, funding, execution, proof, and delivery.  Automation tools can connect steps, but they do not own the funded request lifecycle.  Agent marketplaces improve discovery, but many still focus on listing or invocation rather than the full fulfillment loop.

What they are getting wrong is the boundary between intent and execution.  The request is still fragmented across chat, marketplace search, automation, payment, and task tracking.  We think the missing product is the layer that keeps one request alive all the way to funded completion.

### How do you make money, or how do you plan to?

We plan to monetize funded work flowing through Boreal.  The first clear revenue surface is paid specialist execution that starts from one funded request thread.  Over time that expands into take-rate or routing revenue across external agents, specialists, teams, and worker-market fulfillment, with Boreal owning the request, approval, payment, and lifecycle layer rather than only one narrow execution surface.

### How long have you each been working on this? Have you been working on it full time?

`TODO: founder-only answer`

### Where is each member of the team currently based, and do you work in-person together? Would this change after receiving funding? If so, please provide details.

`TODO: founder-only answer`

### Have you formed a legal entity yet?

`TODO: founder-only answer`

### Have you taken any investment yet?

`TODO: founder-only answer`

### Are you currently fundraising?

`TODO: founder-only answer`

### Do you have a live token?

No
