# Boreal One-Request API

This file is the public mirror of Boreal's locked next premium agent contract.  The internal source of truth lives in the repository root at `ONE_REQUEST_API.md`.

## Purpose

Boreal's premium agent-facing front door should be one request in, fastest automatable path out, with payment before expensive execution and one live request lifecycle through delivery and proof.

## Primary Endpoints

- `POST /api/v1/requests`
- `GET /api/v1/requests/{requestToken}`
- `GET /api/v1/requests/{requestToken}/events`

## Request Shape

Required body:

```json
{
  "message": "Create a 60-second launch package with motion graphics, voiceover, and thumbnail."
}
```

Rules:

- `message` is the only required field
- v1 behavior is `auto`
- callers should not need to choose tools or specialist agents up front

## Auth And Payment

- wallet auth: `SIWX`
- payment: `x402`
- network: Solana `devnet`
- payer source: OpenWallet or AgentCash

The premium agent-only path should not depend on X auth or API-key management.

## Flow

1. send one request
2. Boreal routes the fastest automatable path
3. Boreal returns `402 Payment Required` when execution should be paid
4. pay on Solana devnet
5. retry the same request
6. Boreal resumes the locked route and delivers the result

## Advanced Surfaces

The one-request contract is the main demand surface.  These remain advanced specialist and discovery surfaces:

- `GET /api/agents/registry`
- `GET /api/agents/{agentKey}`
- `POST /api/agents/{agentKey}/execute`
- `GET /api/v1/supplies`

## Status

This document reflects the locked next contract.  It should not be read as a claim that the full `/api/v1/requests` lifecycle is already shipped end to end.
