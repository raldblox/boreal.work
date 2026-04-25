# Boreal Commerce Standards Note

This note captures the current direction for Boreal's product, catalog, cart, and checkout layer so implementation stays consistent with external agent-commerce standards.

## Decision

- Use **UCP** as Boreal's primary reference for:
  - public catalog and search
  - cart sessions
  - checkout handoff shape
  - order lifecycle
  - transport-ready capability naming
- Use **ACP** as Boreal's primary reference for:
  - agent-ready checkout execution
  - payment handler declaration
  - checkout capability negotiation
  - checkout extensions

In practice: **UCP for discovery and basket-building, ACP for merchant checkout execution**.

## Why

### UCP fit

- UCP already defines catalog, cart, checkout, and order as separate capabilities.
- UCP explicitly supports REST, MCP, A2A, and embedded transports.
- UCP treats catalog IDs and checkout line item IDs as a stable bridge, which matches Boreal's need to move from chat discovery into store-like request workspaces.

### ACP fit

- ACP is centered on seller-implemented checkout sessions.
- ACP has a clearer payment handler model for agent-mediated purchase flows.
- ACP extensions are explicit and composable, which is useful once Boreal needs discounts, loyalty, subscriptions, or vendor-specific checkout fields.

## User-facing naming

For broad public UX, Boreal should avoid market jargon where it increases ambiguity.

- Prefer `Supply` for the public sell-side directory.
- Prefer `Requests` for the public buy-side and ask-side directory.
- Avoid `Demand` in the main navigation.  It is accurate, but more abstract for ordinary buyers, freelancers, merchants, and investors.
- Keep `Request` as the core workspace noun for user-submitted work or shopping asks.
- Keep `Proposal` for seller or worker responses to a request.
- Use `Cart` only for product purchase intent, not for general work requests.

## Current Implementation Status

As of April 25, 2026, Boreal already has:

- a unified `supplies`-driven public listing surface for products, services, human supply, agent supply, and provider-backed capabilities
- request-driven product and service search that renders matched listings inside a request workspace
- add-to-cart actions from both the public supply directory and request workspaces
- cart persistence and checkout history in the main product surface
- payment-aware checkout states for provider-backed items
- direct invocation support for supported concrete x402 HTTP endpoints

Boreal does **not** yet have:

- full UCP-compatible catalog, cart, checkout, and order endpoints
- full ACP-compatible checkout capability descriptors across all listings
- merchant-grade order management, refunds, returns, or disputes
- stable public protocol descriptors per listing

## Boreal product-listing schema direction

Every public product-like listing should be rich enough for:

- search and matching
- agent-readable comparison
- cart insertion
- checkout handoff
- future A2A, MCP, ACP, or UCP exposure

### Minimum identity

- `listingId`
- `sellerProfileId`
- `sellerUserId`
- `listingType`
  - `product`
  - `service`
  - `agent_tool`
  - `capability`
  - `collective_offer`
- `status`
- `visibility`
- `slug`

### Discovery metadata

- `title`
- `subtitle`
- `description`
- `category`
- `subcategories[]`
- `keywords[]`
- `capabilityTags[]`
- `searchText`
- `brand`
- `localeHints`
- `marketHints`
- `trustScore`

### Product structure

- `productId`
- `variants[]`
  - `variantId`
  - `sku`
  - `title`
  - `optionValues[]`
  - `availability`
  - `price`
    - `amountMinor`
    - `currency`
  - `compareAtAmountMinor`
- `media[]`
  - `type`
  - `url`
  - `alt`
- `links[]`
- `attributes`

### Fulfillment and delivery

- `deliveryType`
- `fulfillmentKind`
  - `digital`
  - `service`
  - `physical`
  - `hybrid`
- `estimatedDelivery`
- `serviceArea`
- `downloadPolicy`
- `refundPolicy`

### Agent-readiness

- `agentReady`
- `a2aEndpoint`
- `mcpServerUrl`
- `continueUrl`
- `checkoutProvider`
- `checkoutCapability`
  - `protocol`
    - `ucp`
    - `acp`
    - `custom`
  - `version`
  - `endpoint`
  - `supportedHandlers[]`
  - `supportedExtensions[]`

## Boreal flow rules

### Product search is still a request

If a user asks Boreal to find a product, compare products, or assemble a buyable shortlist:

- create or continue a request workspace
- resolve matched listings into a store-like result surface
- let the user add items to cart from that workspace

This keeps chat, auditability, and later handoff to checkout in one place.

### Cart is separate from checkout

Mirror UCP here:

- cart for exploration and basket persistence
- checkout only after purchase intent is explicit

Do not overload request approval with checkout.  Approval is for work execution or proposal acceptance.  Cart and checkout are commerce-specific flows.

### Stable IDs matter

- listing IDs must stay stable
- product IDs must stay stable
- variant IDs must be the exact IDs Boreal can pass to checkout or cart line items

If checkout expects different item IDs than discovery returns, the model is wrong.

## Implementation guidance

### Already true in the current app

1. `supplies` is Boreal's canonical user-facing listing model.
2. Catalog matches can render inside request workspaces.
3. A first-class cart and checkout-history surface exists.
4. Provider-backed listings can advance through payment-aware checkout state.

### Next upgrades

1. Deepen `supplies` with stable structured `variants`, `media`, `pricing`, and richer merchant metadata.
2. Add stronger `checkoutCapability` descriptors per listing without claiming interoperability before the endpoints are real.
3. Add order, refund, dispute, and fulfillment lifecycle records beyond the current checkout history model.
4. Expose protocol descriptors only where Boreal can actually honor them.

## Current claim boundary

As of April 25, 2026:

- Boreal can honestly claim public supply and request discovery.
- Boreal can honestly claim request-driven catalog rendering, add-to-cart behavior, and cart persistence.
- Boreal can honestly claim payment-aware checkout routing for supported provider-backed services.
- Boreal cannot yet claim full UCP catalog/cart/order support.
- Boreal cannot yet claim full ACP checkout compatibility.
- Those remain implementation targets, not shipped protocol interoperability.
