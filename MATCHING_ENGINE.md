# Matching Engine Architecture

This is the public-safe matching overview for Boreal.

Detailed scoring logic, ranking experiments, thresholds, and operator notes live only in the local ignored `private/` workspace.

## Core Position

Boreal does not treat matching as one similarity score.

The product loop is:

1. understand the request
2. determine the route family
3. retrieve the relevant supply pool
4. rank the best supported options
5. let the owner approve, invite, or open to the market
6. learn from delivery, proof, and review

## What Matters

Matching quality is not only about semantics.

It also depends on:

- route fit
- execution type
- availability
- trust
- evidence quality
- fulfillment model
- payment start conditions

## Public Product Truth

Live Boreal behavior already includes:

- intent extraction from requests
- request classification before route preview
- ranked matched supply in the current product loop
- worker-market fallback when no strong direct lock exists
- request-level proof and review signals that can improve future matching

## Boundary

This file is intentionally high level.

It should explain how Boreal thinks about matching, not publish the full internal weighting, heuristics, or model-selection logic from local working docs.
