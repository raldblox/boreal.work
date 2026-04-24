# Boreal Commerce Standards Note

This note captures the current direction for Boreal's product, catalog, cart, and checkout layer so implementation stays consistent with external agent-commerce standards.

## Decision

- Use **UCP** as Boreal's primary reference for:
  - public catalog/search
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
- Prefer `Requests` for the public buy-side / ask-side directory.
- Avoid `Demand` in the main navigation.  It is accurate, but more abstract for ordinary buyers, freelancers, and merchants.
- Keep `Request` as the core workspace noun for user-submitted work or shopping asks.
- Keep `Proposal` for seller/worker responses to a request.
- Use `Cart` only for product purchase intent, not for general work requests.

## Boreal product-listing schema direction

Every public product-like listing should be rich enough for:

- search and matching
- agent-readable comparison
- cart insertion
- checkout handoff
- future A2A / MCP exposure

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

- create a request workspace
- resolve matched listings into a store-like result surface
- let the user add variants to cart from that workspace

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

## Implementation guidance for the next phase

1. Extend `supplies` into a richer public listing model rather than creating a second incompatible product table immediately.
2. Add structured `variants`, `media`, `pricing`, and `checkoutCapability` metadata.
3. Add a first-class `cart` table and `cartLineItems`.
4. Let product-search intents render a catalog workspace with add-to-cart actions.
5. Add ACP/UCP protocol descriptors without claiming full interoperability until actual endpoints exist.

## Current claim boundary

As of April 25, 2026:

- Boreal can honestly claim public supply and request discovery.
- Boreal cannot yet claim real UCP catalog/cart/order support.
- Boreal cannot yet claim ACP checkout support.

Those remain implementation targets, not shipped protocol compatibility.
