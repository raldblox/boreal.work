# Boreal Category Language Research

Last updated: April 25, 2026

This note is for choosing clearer category language for Boreal.

The main conclusion is simple:

- no single existing market term cleanly covers what Boreal is doing
- Boreal spans both `work marketplace` and `agentic commerce`
- Boreal needs a layered naming system, not one magic label

## What Adjacent Markets Call Themselves

### 1. Product and checkout infrastructure

Current dominant term: `agentic commerce`

Observed from current primary sources:

- Stripe describes agentic commerce as AI agents discovering, evaluating, and completing transactions for buyers in digital interfaces.
- Stripe describes ACP as an open-source specification enabling commerce between compatible applications and sellers.
- Shopify describes UCP as an open standard for AI agents to connect and transact with any merchant.
- UCP describes itself as the common language for platforms, agents, and businesses.

What this term implies:

- product catalogs
- checkout flows
- merchant integration
- payment and protocol interoperability
- AI-assisted or AI-executed buying

What it does not naturally imply:

- open-ended work requests
- proposals
- scoped services
- human fulfillment for messy custom work

Reading for Boreal:

- `agentic commerce` is real and current, but it is too SKU and checkout centric to be Boreal's only umbrella term.

### 2. Work and services marketplaces

Current dominant terms:

- `work marketplace`
- `freelance marketplace`
- `marketplace for freelance services`
- `home services marketplace`

Observed from current primary sources:

- Upwork currently describes itself as `the world's human and AI-powered work marketplace`.
- Upwork introduced `work marketplace` in May 2021 as a broader category than a classic freelance or gig platform.
- Fiverr describes itself in official support material as `an online marketplace for freelance services`.
- Thumbtack's public consumer language centers on `find local pros, compare quotes and book home services`.

What these terms imply:

- hiring and service delivery
- requests, jobs, projects, and quotes
- human experts and managed fulfillment
- ongoing or scoped work, not just checkout

What they do not naturally imply:

- protocol-native agent interoperability
- agent-mediated checkout
- product + service + agent supply in one model

Reading for Boreal:

- `work marketplace` is the strongest adjacent category for Boreal's service and proposal side.
- It still undershoots Boreal's product, cart, checkout, and protocol ambitions.

### 3. Conversation-led buying

Existing term: `conversational commerce`

This term is already crowded and usually means:

- shopping through chat, voice, or messaging
- brand assistance during discovery and checkout
- CX and conversion tooling

Reading for Boreal:

- Boreal uses chat, but chat is not the category.
- `conversational commerce` is too interface-level and too established in another lane.

### 4. Intent-native wording

`intent-native commerce` is directionally strong, but it is not empty territory.

Observed from current web scan:

- aBay is already using `Intent-Native AI Commerce` publicly.

Reading for Boreal:

- the phrase is philosophically aligned
- it is not obviously ownable
- it also leans more toward autonomous commerce than toward request, proposals, and fulfillment

## Reading Boreal Correctly

Boreal is not only:

- a commerce protocol
- a work marketplace
- a services marketplace
- a conversational commerce tool
- an AI shopping layer

Boreal is combining:

1. request creation
2. supply matching
3. proposal collection for custom work
4. fulfillment tracking
5. product and service listings
6. checkout for supported supply
7. human and agent participation

That means Boreal needs one term for the thesis and another for the product surface.

## Candidate Term Evaluation

### `intent-to-task`

Good:

- concrete
- operational
- sounds executable

Bad:

- too narrow
- collapses everything into task execution
- weak for products, carts, checkout, and broader commerce

Best use:

- internal workflow language for a subset of Boreal
- not the company category

### `intent-to-fulfillment`

Good:

- best high-level thesis
- captures the movement from expression to delivered outcome
- broad enough to include products, services, tools, and humans

Bad:

- not immediately legible as a market category
- sounds architectural or conceptual before it sounds productized

Best use:

- thesis line
- whitepaper umbrella
- investor and technical framing

### `intent-native commerce`

Good:

- ambitious
- differentiates from browse-first commerce
- signals a new stack

Bad:

- still abstract
- already in public use elsewhere
- too commerce-heavy for work and fulfillment positioning

Best use:

- occasional technical or visionary wording
- not the default public category

### `early access market`

Good:

- clear about stage

Bad:

- not a category
- says nothing about what kind of market Boreal is

Best use:

- modifier only
- `early access`, not the main noun

### `request-native commerce`

Good:

- the clearest original phrase in the current repo
- maps well to how Boreal actually starts: the request
- differentiates from catalog-first or storefront-first systems
- works for both products and custom work

Bad:

- new phrase, so it needs an explainer tail
- `commerce` alone can still under-signal the labor and proposal side

Best use:

- main category invention, but paired with a clarifying phrase

## Recommendation

Do not force one phrase to carry every layer.

Use a naming stack.

### 1. Thesis term

Recommended:

`intent-to-fulfillment infrastructure`

Why:

- strongest umbrella for the big vision
- includes humans, agents, tools, services, and products
- survives changes in interface and protocol

### 2. Product category term

Recommended:

`request-native work-and-commerce marketplace`

Why:

- `request-native` explains the starting point
- `work-and-commerce` makes the hybrid scope explicit
- `marketplace` is legible today

### 3. Early access descriptor

Recommended:

`an early access request market for work, products, and services`

Why:

- very clear
- less abstract than infrastructure language
- matches the current app reality

### 4. Technical descriptor

Recommended:

`a request-native commerce layer that routes human and agent demand to supply, proposals, fulfillment, and checkout`

Why:

- most accurate long-form explanation
- useful for docs, decks, and partner conversations

## Recommended Default Phrases

### Strongest overall

`Boreal is building request-native commerce: an intent-to-fulfillment layer for work, products, and services.`

### Strongest homepage/early access

`Boreal is an early access request-native market for work, products, and services.`

### Strongest investor/technical

`Boreal is intent-to-fulfillment infrastructure for human and agent demand, starting with a request and ending in fulfillment or checkout.`

### Strongest short explanation

`Start with a request. Match supply. Compare proposals. Keep delivery attached.`

## Terms To De-emphasize

- `early access market` as a standalone description
- `intent-to-task` as the umbrella category
- `intent-native commerce` as the default public label
- `agentic commerce` as the whole story
- `work marketplace` as the whole story

Each of those is missing an important part of Boreal.

## Naming Options Worth Testing

### Recommended top tier

1. `request-native commerce`
2. `request-native work-and-commerce marketplace`
3. `intent-to-fulfillment infrastructure`

### Secondary options

4. `request-led market for work, products, and services`
5. `demand-routing and fulfillment marketplace`
6. `intent-to-fulfillment marketplace`
7. `request-native demand routing for commerce and work`

### Not recommended as primary

8. `agentic commerce marketplace`
9. `intent-native commerce`
10. `AI work marketplace`

## Practical Rule

Use different language by layer:

- homepage:
  - `early access request-native market for work, products, and services`
- README and product docs:
  - `request-native commerce`
- whitepaper:
  - `intent-to-fulfillment infrastructure`
- protocol docs:
  - `request-native commerce layer`
- seller-specific pages:
  - `representatives`, `selling`, `catalog`, `checkout`
- request/workflow pages:
  - `requests`, `proposals`, `fulfillment`, `workspace`

## Sources

- Stripe agentic commerce docs:
  - https://docs.stripe.com/agentic-commerce
- Stripe ACP docs:
  - https://docs.stripe.com/agentic-commerce/protocol
- Shopify UCP page:
  - https://www.shopify.com/ucp
- Shopify agentic commerce announcement, January 11, 2026:
  - https://www.shopify.com/news/ai-commerce-at-scale
- UCP home/spec overview:
  - https://ucp.dev/
- Upwork about page:
  - https://www.upwork.com/about/
- Upwork work marketplace announcement, May 4, 2021:
  - https://www.upwork.com/press/releases/upwork-introduces-work-marketplace-category
- Fiverr vendor/help description:
  - https://help.fiverr.com/hc/en-us/articles/360017651238-How-to-set-Fiverr-as-a-vendor-United-States
- Thumbtack home services page:
  - https://www.thumbtack.com/content/home-services
- aBay intent-native commerce page:
  - https://abay.app/
