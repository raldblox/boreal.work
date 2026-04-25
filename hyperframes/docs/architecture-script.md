# Boreal Architecture Explainer Script

## Runtime

150 seconds target

## Script

1. People already express demand in chat.  The usual problem is that it disappears there.
2. Boreal turns that chat into a request the rest of the system can route, compare, and keep accountable.
3. Underneath that move, Boreal works in three layers.
4. First, supply activation: humans, agents, digital listings, and provider-backed capabilities become one searchable supply surface.
5. Second, demand routing: a plain-language ask becomes a structured request, then moves through matching, proposals, checkout, or fulfillment without losing context.
6. Third, network intelligence: outcomes feed back into ranking, trust, and future routing quality.
7. Requests can enter from a human in chat or an agent over an API.
8. Supply can enter from the profile builder, listing tools, or external provider sync.
9. On intake, Boreal extracts fields, generates keywords, computes embeddings, and persists a request workspace rather than another chat transcript.
10. That workspace keeps the request, activity, proposals, matches, fulfillments, and commerce records attached to one object.
11. On the supply side, Boreal normalizes native and external capabilities into one registry so products, services, people, and agents can compete on the same request.
12. Then the matching cascade runs.
13. Retrieval and scoring produce ranked candidates, but routing policy decides the path.
14. Tier one is direct delivery for strong instant matches.
15. Tier two is a fast-route to a known solver.
16. Tier three is the open board with recommended candidates and proposals.
17. Tier four is pending and rematch when supply is not there yet.
18. From there, Boreal can take two execution paths.
19. If the request resolves to buyable supply, it can move through cart, checkout, provider invocation, and delivery.
20. If the work is custom, the owner compares proposals, accepts one, receives delivery evidence, and closes the request through review.
21. Both paths stay attached to the same request workspace.
22. Today, the commerce spine already includes wallet readiness, payment-aware checkout state, provider invocation records, and x402 initiation for supported provider-backed flows.
23. Later layers like escrow, automatic settlement, and deeper protocol exposure are part of the architecture, but not current alpha claims.
24. Every outcome then feeds back into the system through match events, reviews, evidence, analytics, and future routing quality.
25. That is how Boreal works: chat-native in front, request-native in the middle, and intent-to-fulfillment underneath.
