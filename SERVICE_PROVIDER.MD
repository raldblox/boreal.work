# Service Provider Research and Implementation Status

Last updated: April 25, 2026

This document captures the current research and implementation guidance for adding external payable service providers, registries, and Solana-native execution surfaces to Boreal.

The target outcome is a universal adapter layer that lets:

- Boreal discover external capabilities
- Boreal normalize them into the Boreal supply model
- a human user invoke them from Boreal
- the user pay with a wallet managed through Privy
- Boreal store receipts, evidence, and execution metadata

This note is based on the current repo shape plus current public documentation from primary sources.

Distribution and listing execution now lives in `DISCOVERY_PLAN.md`.  Keep this file focused on integration architecture, provider research, and payment-rail decisions.

## Agent-Only Request Payment Contract

The request-first premium surface is now live in `ONE_REQUEST_API.md`.

For that surface:

- demand starts from `POST /api/v1/requests`
- the caller is an external or local agent, not a signed-in web user
- the request body should require only `message`
- `SIWX` proves wallet ownership
- Boreal uses `402` as the payment boundary
- Solana `mainnet` is the supported settlement network in v1
- OpenWallet or AgentCash should be the payer source
- Boreal freezes the route and quote before payment and resumes the same request after payment

Important distinction:

- the human web app can still use Privy where needed
- the premium agent-only request API should not depend on X auth, API-key management, or frontend-first wallet flows

Current hardening note:

- payment confirmation is currently a signed mainnet payment authorization receipt plus independently fetched Solana mainnet transaction verification, Boreal transaction, settlement, and payout records
- Boreal still does not claim treasury/payto-grade settlement verification or payout-grade on-chain payout verification for this path

## Implementation Progress

The first real service-provider layer is now in the repo.

### Shipped foundation

- A dedicated `next-app/lib/boreal/integrations/service-providers/` layer now exists, separate from LLM and media providers.
- Convex now tracks `serviceProviders`, `serviceCapabilities`, `serviceProviderSyncs`, `serviceInvocations`, `paymentAttempts`, `transactionApprovals`, and `walletSessions`.
- `supplies` now carries external execution and payment metadata for provider-backed listings.
- Boreal can sync external listings from Agentic Market through `POST /api/service-providers/agentic-market/sync`.
- Boreal can place supported provider-backed listings into cart and move them through payment-aware checkout state.
- Boreal uses Privy-backed x402 payment initiation for supported direct-invoke endpoints.

### Current boundary

- Boreal only invokes concrete x402 HTTP endpoints it can call safely right now.
- Parameterized, ambiguous, or insufficiently normalized external listings are still discovery and handoff surfaces, not fully automatic execution.
- MoonPay and MPP remain architecture targets.
- AgentCash and Frames now have curated discovery or onboarding adapters in Boreal's service-provider layer, but they are still not end-to-end shipped execution paths in the current alpha.
- The premium one-request path now ships as a public `POST /api/v1/requests` contract with SIWX auth, `402`, request events, specialist execution, and a deterministic smoke test.

## Executive Summary

Boreal should not extend the existing `lib/boreal/integrations/providers` abstraction for this work.  That adapter is clearly model-provider focused today.  Instead, add a second integration layer for service providers and payment rails.

Recommended foundation:

1. Keep the existing model-provider adapter for LLM/media models only.
2. Add a new `service-provider` adapter layer for registries, callable APIs, MCP servers, widgets, and Solana execution toolkits.
3. Make `x402` the first payment rail Boreal supports directly.
4. Use `Privy` as the human wallet broker and approval surface.
5. Treat `Solana Agent Kit` as Boreal's first native Solana execution engine.
6. Use `MoonPay` as the first funding, bridge, and on/off-ramp adapter.
7. Ingest `agentic.market` first as a registry source because it already exposes a machine-readable service index and includes listings with Solana network support.
8. Treat `Frames` and `AgentCash` as second-wave integrations:
   - `Frames` because the public product surface is clear, but public API docs are still shallow.
   - `AgentCash` because it is useful and supports both x402 and MPP, but its public docs are inconsistent on Solana payment support.
9. Add `MPP` after `x402`, mainly for payable MCP / JSON-RPC flows and Stripe-linked providers, not as the first Solana payment rail.

If Boreal wants to be Solana-first, the first shippable stack should be:

- `Privy` for user auth and wallet approval
- `x402` with Solana support for paid HTTP services
- `agentic.market` for external service discovery
- `Solana Agent Kit` for Boreal-controlled Solana actions
- `MoonPay` for funding and bridging into the right wallet and chain

## What Already Exists In This Repo

Current seams that matter:

- `next-app/lib/boreal/integrations/providers/types.ts`
- `next-app/lib/boreal/integrations/providers/registry.ts`
- `next-app/components/privy-provider.tsx`
- `next-app/hooks/use-payment.ts`
- `next-app/components/chat/intent-sidebar.tsx`
- `next-app/convex/schema.ts`
- `next-app/convex/supplies.ts`
- `COMMERCE_STANDARDS.md`

Important current state:

- Boreal already has a dynamic provider registry for LLM and media providers, and now also has a dedicated service-provider layer for external paid services.
- Boreal already exposes `Privy` in the UI and uses it in the payment path for supported provider-backed items.
- `supplies` remains the normalized user-facing catalog surface and now carries external-service metadata needed for discovery and controlled invocation.

## Core Design Decision

Do not overload `BorealProviderAdapter`.

Today it is shaped like this:

```ts
type BorealProviderAdapter = {
  key: string;
  displayName: string;
  getIntentModel(...): LanguageModel;
  getAssistantModel(...): LanguageModel;
  getEmbeddingModel(...): EmbeddingModel;
  getImageModel(...): ImageModel;
  getSpeechModel(...): SpeechModel;
  startVideoGeneration?(...): Promise<VideoGenerationJob>;
  getVideoGeneration?(...): Promise<VideoGenerationJob>;
  downloadVideoContent?(...): Promise<...>;
}
```

That is not the right abstraction for:

- external registries
- x402 or MPP payment negotiation
- MCP tool invocation
- widget handoff
- Solana wallet execution
- on-ramp / swap / bridge flows

Create a separate integration surface.

## Recommended Architecture

Add a new folder:

```text
next-app/lib/boreal/integrations/service-providers/
```

Recommended substructure:

```text
service-providers/
  types.ts
  registry.ts
  discovery/
    agentic-market.ts
    agentcash.ts
    frames.ts
  execution/
    x402-http.ts
    mpp-http.ts
    mpp-jsonrpc.ts
    solana-agent-kit.ts
    moonpay.ts
  payments/
    x402.ts
    mpp.ts
  wallets/
    privy.ts
  policies/
    spend-rules.ts
    approval-rules.ts
  normalization/
    to-supply.ts
    to-execution-record.ts
```

### Adapter Split

Use five distinct interfaces.

```ts
type ServiceProviderKey =
  | "agentic-market"
  | "agentcash"
  | "frames"
  | "moonpay"
  | "solana-agent-kit"
  | "manual";

type PaymentProtocol =
  | "x402"
  | "mpp"
  | "direct-solana"
  | "widget"
  | "none";

type ExecutionSurface =
  | "registry"
  | "http"
  | "mcp"
  | "jsonrpc"
  | "sdk"
  | "widget"
  | "handoff";

type WalletExecutionMode =
  | "client-sign"
  | "server-execute-with-user-authorization"
  | "external-wallet"
  | "provider-managed";

interface ServiceDiscoveryAdapter {
  key: ServiceProviderKey;
  listCapabilities(input: DiscoveryInput): Promise<NormalizedCapability[]>;
  refreshCapability?(capabilityId: string): Promise<NormalizedCapability | null>;
}

interface ServiceExecutionAdapter {
  key: ServiceProviderKey;
  prepareInvocation(input: InvocationInput): Promise<InvocationPlan>;
  invoke(plan: InvocationPlan): Promise<InvocationResult>;
  poll?(externalJobId: string): Promise<InvocationResult>;
}

interface PaymentRailAdapter {
  protocol: PaymentProtocol;
  preparePayment(input: PaymentInput): Promise<PaymentPlan>;
  submitPayment(plan: PaymentPlan): Promise<PaymentReceipt>;
}

interface WalletBroker {
  walletProvider: "privy";
  getWalletContext(input: WalletContextInput): Promise<WalletContext>;
  requestApproval(input: ApprovalInput): Promise<ApprovalResult>;
  signOrSend(input: WalletActionInput): Promise<WalletActionResult>;
}

interface CapabilityNormalizer {
  normalize(raw: unknown, source: ServiceProviderKey): Promise<NormalizedCapability>;
}
```

This keeps discovery, execution, payment, and wallet control independent.

## Normalized Capability Schema

Boreal needs one canonical representation for all external services before inserting them into search, matching, or checkout flows.

Recommended normalized schema:

```ts
type NormalizedCapability = {
  sourceProvider: ServiceProviderKey;
  sourceId: string;
  sourceUrl?: string;
  title: string;
  subtitle?: string;
  description: string;
  category: string;
  capabilityTags: string[];
  keywords: string[];

  executionSurface: ExecutionSurface;
  paymentProtocol: PaymentProtocol;
  paymentNetworkHints: string[]; // CAIP-2 or provider-native ids
  acceptedCurrencies: string[];  // USDC, usd, etc.

  endpoint?: {
    method?: string;
    url?: string;
    mcpServerUrl?: string;
    jsonRpcMethod?: string;
    toolName?: string;
  };

  pricing?: {
    type: "fixed" | "metered" | "quote-required" | "free";
    amount?: string;
    currency?: string;
    raw?: unknown;
  };

  evidence?: {
    returnsReceipt: boolean;
    returnsTxHash: boolean;
    supportsSchemaMetadata: boolean;
  };

  walletRequirements?: {
    humanApprovalRequired: boolean;
    privyCompatible: boolean;
    supportedWalletModes: WalletExecutionMode[];
  };

  routingTier: "A-direct" | "A-delegated" | "B-ingest-handoff" | "C-manual";
  trustSignals?: Record<string, unknown>;
  raw?: unknown;
};
```

## How This Maps To Boreal

### Keep `supplies` as the user-facing catalog

The existing `supplies` table is still the right user-facing surface, but it needs more external-source metadata.

Recommended additions to `supplies`:

- `sourceProviderKey`
- `sourceProviderUrl`
- `sourceCapabilityId`
- `sourceListingUrl`
- `executionSurface`
- `paymentProtocol`
- `paymentNetworkHints[]`
- `schemaUrl`
- `openApiUrl`
- `mcpServerUrl`
- `supportsDirectInvoke`
- `supportsPrivyWallet`
- `requiresHumanApproval`
- `evidenceMode`
- `priceRawJson`
- `routingTier`

### Add new Convex tables

Recommended new tables:

- `serviceProviders`
- `serviceCapabilities`
- `serviceProviderSyncs`
- `serviceInvocations`
- `paymentAttempts`
- `transactionApprovals`
- `walletSessions`

Minimal `serviceInvocations` shape:

```ts
{
  intentId,
  supplyId,
  sourceProviderKey,
  sourceCapabilityId,
  executionSurface,
  paymentProtocol,
  network,
  amount,
  currency,
  status,
  externalRequestId,
  externalJobId,
  txHash,
  receiptJson,
  requestJson,
  responseJson,
  createdAt,
  updatedAt
}
```

## Privy Integration Model

Privy is the most important Boreal-side dependency for human-triggered transactions.

### What current Privy docs support

Privy currently documents:

- embedded and external wallets across EVM and SVM
- Solana `signAndSendTransaction`
- server-executed transactions with user-owner wallets plus authorization signatures
- Solana batch behavior by packing multiple instructions into one transaction

Key practical implication:

- Boreal can keep the user in control of funds while still letting Boreal orchestrate execution.

### Recommended Privy usage modes

#### 1. Human-in-the-loop client signing

Use for:

- x402 payments initiated from the web app
- direct Solana actions through Solana Agent Kit
- MoonPay swap deposits where the user must approve the transaction

Flow:

1. Boreal shows the provider, amount, network, and action.
2. User approves in UI.
3. Privy signs and sends.
4. Boreal stores the tx hash and receipt.

#### 2. Server execution with user authorization

Use for:

- async jobs
- retriable execution
- Boreal-managed workflows where the server should submit after user approval

Privy's documented pattern:

1. create user-owned wallets
2. request a signature over the transaction request on the client
3. send the authorization signature to the server
4. execute from the server through Privy's API

Use this when Boreal needs reliability, retries, or webhook-based completion handling.

#### 3. External-wallet passthrough

Use for:

- existing Phantom or other Solana wallets connected through Privy
- advanced users who do not want embedded wallets

### Boreal implementation note

The repo currently only uses basic `@privy-io/react-auth` hooks for auth state and wallet display.

To support actual Solana execution, Boreal will likely need the Solana-specific wallet hooks and methods documented by Privy, especially:

- wallet access
- message signing
- transaction signing
- sign-and-send

### Important constraint

Coinbase documents a `useX402` helper for Coinbase embedded wallets, not for Privy.

That means Boreal should assume:

- x402 + Privy is possible
- x402 + Privy is not an off-the-shelf documented path from Coinbase
- Boreal will need its own Privy-backed x402 buyer adapter

This is an important engineering distinction.

## Protocol Findings

## x402

### What it is

x402 is Coinbase's HTTP-native payment protocol built around `402 Payment Required`.

Core flow:

1. request resource
2. receive `402`
3. sign payment
4. retry with proof
5. receive resource

### Why it fits Boreal

- designed exactly for per-call payable APIs
- explicit support for AI agents
- first-class Solana support in the official network docs
- supports discovery through Bazaar
- already has an MCP example

### Solana support

Current official x402 network docs say:

- `@x402/svm` supports Solana clusters with SPL Token Program and Token2022 tokens
- the CDP facilitator supports Solana mainnet and additional non-mainnet Solana clusters
- CAIP-2 ids are used for Solana networks

This makes x402 the strongest Solana-aligned payment rail in this research set.

### Direct Boreal recommendation

Make x402 the first direct payment rail in Boreal.

Support these surfaces first:

- paid HTTP endpoints
- agentic.market-discovered services
- MCP bridge pattern for paid tools

### Implementation note

Use CAIP-2 everywhere in Boreal for network identifiers.

Examples:

- `eip155:8453`
- `solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp`

## MPP

### What it is

MPP, the Machine Payments Protocol, is an open payment standard designed by Tempo and Stripe.

The current public stack matters in three layers:

- `mpp.dev` as the protocol home
- Stripe's machine payments docs
- `paymentauth.org` IETF-style protocol drafts

### What is strong about MPP

- supports HTTP 402-style payment negotiation
- defines payable JSON-RPC and MCP transport behavior
- supports multiple payment methods, including Stripe-linked flows
- adds a session model, which is better than pure per-request payments for longer-running interactions

### Important current limitation for Boreal

Stripe's current machine payments docs show:

- crypto on Tempo
- fiat via Shared Payment Tokens (SPTs)

That is not Solana-first.

The broader protocol drafts do include:

- a Solana charge draft
- a JSON-RPC and MCP transport draft

But Boreal should separate:

- protocol potential
- currently productized provider support

### Direct Boreal recommendation

Support MPP after x402.

Initial MPP use cases:

- payable MCP tools
- payable JSON-RPC resources
- providers that choose MPP instead of x402
- future sessionized billing

Do not make MPP the first Solana payment rail unless the actual provider implementation Boreal targets is confirmed to support Solana in production.

## Provider Findings

## 1. agentic.market

Public sources found:

- `https://agentic.market/`
- `https://agentic.market/llms.txt`
- `https://api.agentic.market/v1/services`

### What it is

`agentic.market` is a machine-readable x402 service marketplace.

Its public `llms.txt` explicitly states:

- services are x402-enabled
- no API keys or accounts are needed
- discovery endpoints exist at:
  - `GET https://api.agentic.market/v1/services`
  - `GET https://api.agentic.market/v1/services/search?q={query}`

### Why it is important

This is the cleanest current external registry source for Boreal.

It already provides normalized discovery data:

- name
- description
- category
- networks
- endpoints
- pricing
- quality metrics

### Solana status

The public services API currently includes listings whose `networks` contain both `Base` and `Solana`.

That makes it a strong first registry source for Solana-prioritized routing.

### Privy fit

High.

If Boreal supports x402 with Privy-backed signing, a human user can:

1. search a capability through Boreal
2. pick a service indexed by `agentic.market`
3. pay with their Privy-backed wallet
4. receive the data back inside Boreal

### Boreal recommendation

Tier: `A-direct`

Implement two adapters:

- `AgenticMarketDiscoveryAdapter`
- `X402HttpExecutionAdapter`

Operationally:

- ingest discovery data into `serviceCapabilities`
- mirror selected records into `supplies`
- execute directly against the provider endpoint, not through `agentic.market` as a payment proxy

This should be the first external source Boreal integrates.

## 2. AgentCash

Public sources found:

- `https://agentcash.dev/docs`
- `https://agentcash.dev/docs/quickstart`
- `https://agentcash.dev/docs/how-it-works`
- `https://agentcash.dev/docs/wallet/funding`
- `https://agentcash.dev/docs/wallet/networks`

### What it is

AgentCash is:

- a CLI
- an agent skill
- an MCP mode
- a discovery/payment layer over premium APIs

Its public docs say it supports:

- 300+ premium APIs
- x402 and MPP
- discovery via `/openapi.json`
- fallback discovery via `/.well-known/x402`
- `x-payment-info` annotations in OpenAPI

### Strong points

- very practical agent product
- supports both x402 and MPP
- already solves endpoint discovery plus automatic payment
- has CLI, skill, and MCP modes

### Solana finding: docs are inconsistent

This is the most important AgentCash research finding.

The public docs are not fully aligned:

- `Supported networks` says AgentCash supports USDC payments across multiple EVM networks and lists Base, Ethereum, Optimism, Arbitrum, and Polygon.
- `How it works` says AgentCash stores both an EVM keypair and a Solana keypair.
- `Funding your wallet` says the wallet also holds USDC on Solana and that users can fund Solana if they plan to call endpoints that require Solana.

Interpretation:

- AgentCash clearly has Solana wallet concepts in the product.
- AgentCash's public network support page does not yet present Solana as a first-class supported payment network in the same way it presents EVM networks.
- Boreal should treat AgentCash Solana support as plausible but not fully verified for production use from public docs alone.

### Privy fit

Medium.

AgentCash is opinionated around its own local wallet and CLI/MCP runtime.

That makes it less native to Boreal's Privy-based human wallet story than direct x402 integration.

### Boreal recommendation

Tier: `A-delegated` or `B-ingest-handoff`

Use AgentCash in one of two ways:

1. as a delegated gateway when Boreal wants access to AgentCash's upstream catalog without directly implementing every provider
2. as an MCP-compatible sidecar for power users

Do not make AgentCash the first Solana path for Boreal.

Use it after Boreal ships:

- direct x402
- agentic.market ingestion
- Privy-backed wallet execution

## 3. Frames

Public sources found:

- public product site at `https://frames.ag/`
- tool registry at `https://frames.ag/tools`
- wallet pages surfaced via search results such as `https://frames.ag/u/...`
- public GitHub org at `https://github.com/frames-engineering`

Important naming note:

- the user asked for `frames.gg`
- the public docs and product surface I found are on `frames.ag`

I did not find a current public documentation surface on `frames.gg`.

### What it is

Frames presents itself as:

- a registry of maintained, production-ready tools
- a wallet and policy layer for agents
- a way to use tools without API keys, subscriptions, or package installs
- a system where stablecoin payments are abstracted away

### Strong points

- explicitly agent-oriented
- strong product focus on spending policies
- public tool registry includes Solana-adjacent tools like Jupiter and cross-chain quote surfaces
- search results show both Solana and EVM wallets in user wallet pages
- public GitHub org includes `ows`, described as local, policy-gated signing and wallet management for every chain

### Weak point

Public API and developer docs are still shallow compared with x402, MoonPay, or Solana Agent Kit.

That means:

- the product is clear
- the direct integration contract is not yet sufficiently documented

### Privy fit

Medium.

Frames already wants to manage wallet behavior and policy boundaries.

That overlaps with Boreal + Privy responsibility.  A direct embedded integration is possible, but Boreal must avoid ending up with two competing wallet-policy systems.

### Boreal recommendation

Tier: `B-ingest-handoff` first, then `A-direct` only with stronger API docs or partnership access.

First Boreal integration should be:

- ingest tool metadata
- show Frames-origin capabilities in Boreal search
- hand off to Frames when direct invocation is not yet safe

Second Boreal integration can be:

- direct tool invocation if Frames exposes a stable public API or MCP surface

Do not make Frames the first deep service adapter until the integration contract is clearer.

## 4. MoonPay

Public sources found:

- `https://support.moonpay.com/en/articles/586583-moonpay-cli-for-ai-agents`
- `https://support.moonpay.com/en/articles/586487-moonpay-agents-fund-your-ai`
- `https://support.moonpay.com/en/articles/629097-what-you-can-build-with-moonpay-skills`
- `https://dev.moonpay.com/docs/on-ramp-overview`
- `https://dev.moonpay.com/v1.0/docs/ramps-swap`

### What it is

MoonPay is not just a ramp here.  The current agent surface includes:

- CLI
- local MCP server
- REST API
- multi-chain wallets
- swaps
- bridges
- transfers
- deposit links
- fiat on-ramp
- x402 request tooling

### Solana status

Strong.

Current MoonPay CLI docs explicitly say:

- multi-chain support includes Solana
- Solana offers the most comprehensive trading capabilities
- Solana supports full trading, limit orders, and DCA

### Why it matters to Boreal

MoonPay solves the balance problem.

When a Boreal user wants to call a paid service, the hard failure case is often not discovery, but funding the correct chain and wallet.

MoonPay gives Boreal a clean answer for:

- insufficient balance
- chain mismatch
- fiat to USDC funding
- bridge to the target network

### Privy fit

High.

MoonPay's on-ramp and swap docs assume the user has a destination wallet or a wallet partner that can sign and send.

That maps well to Privy:

- Privy supplies the user wallet address
- Boreal can prefill the destination
- the user approves transactions through Privy

### Boreal recommendation

Tier: `A-direct`

Integrate MoonPay in three separate ways:

1. `FundingAdapter`
   - when Boreal detects insufficient user balance for a target call
2. `BridgeAdapter`
   - when a service requires a different network than the user currently funded
3. `TradeAdapter`
   - optional, for token swaps and execution flows where the user asked Boreal to perform onchain actions

Do not use MoonPay as the primary external service catalog.
Use it as the wallet liquidity, bridge, and funding layer.

## 5. Solana Agent Kit

Public sources found:

- `https://docs.sendai.fun/docs/v2/introduction`
- `https://docs.sendai.fun/docs/v2/setup/embedded-wallets`
- `https://docs.sendai.fun/docs/v2/examples/embedded-wallets/privy`

### What it is

Solana Agent Kit is an open-source toolkit for Solana-powered agent applications.

The current v2 docs explicitly emphasize:

- modular plugin architecture
- embedded wallet support
- Privy integration
- human-in-the-loop confirmation

### Why it matters to Boreal

This is the best fit when Boreal itself wants to execute Solana actions, not just buy access to external APIs.

Examples:

- Jupiter quote and swap
- token transfer
- staking
- DeFi actions
- domain registration
- price feeds

### Privy fit

Very high.

The official example shows Solana Agent Kit constructed directly from a Privy wallet adapter with:

- `publicKey`
- `signTransaction`
- `signMessage`
- `sendTransaction`
- `signAllTransactions`

This is the cleanest documented path in the entire research set for Solana + human approval + agent execution.

### Boreal recommendation

Tier: `A-direct`

Use Solana Agent Kit as Boreal's native Solana action engine.

That means:

- Boreal does not need to wait for third-party payable registries for core Solana actions
- Boreal can expose first-party callable Solana capabilities through its own supply layer
- user approval remains in Privy

This should be one of the first two direct integrations Boreal ships.

## Recommended Priority Order

### Phase 1: foundation

- [x] add `service-provider` adapters
- [x] add `payment` adapters
- [x] add `wallet` broker for Privy
- [x] add Convex tables for invocations and receipts
- [x] add CAIP-2-aware payment and invocation metadata
- [x] add explicit direct `x402` dependency to the app workspace

### Phase 2: first direct integrations

- [x] `x402` direct HTTP execution for supported concrete endpoints
- [x] `agentic.market` discovery ingestion
- [ ] `Solana Agent Kit` execution with Privy

This is the first credible Solana-first stack.

### Phase 3: liquidity and funding

- [ ] `MoonPay` on-ramp
- [ ] `MoonPay` bridge and swap
- [ ] automatic "fund before invoke" flow

### Phase 4: second-wave providers

- [x] `Frames` curated ingest and handoff adapter
- [x] `AgentCash` curated delegated gateway adapter
- [ ] `AgentCash` runtime-level MCP or delegated invoke integration

### Phase 5: second payment rail

- [ ] `MPP` support for payable MCP / JSON-RPC
- [ ] sessionized or Stripe-linked provider support

## Transaction Flow Recommendations

## Flow A: x402 direct call from Boreal

Best for:

- agentic.market-discovered services
- direct x402 endpoints
- Solana or EVM USDC per-call payments

Flow:

1. user asks Boreal for a paid capability
2. Boreal discovers and ranks capabilities
3. Boreal selects a provider and gets the endpoint details
4. Boreal makes a dry request
5. provider returns `402 Payment Required`
6. Boreal shows:
   - provider
   - endpoint
   - chain
   - amount
   - protocol
7. user approves
8. Boreal uses Privy-backed signing and payment submission
9. Boreal retries request with payment proof
10. Boreal stores:
    - tx hash
    - receipt
    - response payload
    - provider metadata

## Flow B: insufficient balance

Best for:

- no USDC on required chain
- wrong chain funded

Flow:

1. Boreal detects the user cannot pay
2. Boreal offers:
   - on-ramp with MoonPay
   - bridge with MoonPay
   - switch network if already funded elsewhere
3. user completes funding
4. Boreal resumes invocation

## Flow C: native Solana action

Best for:

- swaps
- transfers
- first-party Solana tools
- DeFi actions

Flow:

1. Boreal routes intent to Solana Agent Kit
2. Solana Agent Kit builds the transaction
3. Boreal presents quote and risk summary
4. user approves through Privy
5. Boreal executes and stores tx evidence

## Flow D: payable MCP or JSON-RPC

Best for:

- future MPP providers
- paid MCP tools
- paid prompt/resource retrieval

Flow:

1. Boreal calls tool
2. server returns JSON-RPC `-32042`
3. Boreal shows payment challenge to user or policy engine
4. Boreal sends credential through `_meta`
5. server returns result plus `_meta` receipt

## Policy Model

Do not let providers auto-spend user funds without Boreal policy enforcement.

Recommended policies:

- per-call max spend
- daily max spend
- allowed chains
- allowed protocols
- allowed providers
- auto-approve threshold
- always-confirm for bridge / swap / transfer
- always-confirm for unknown provider
- sandbox vs mainnet separation

Recommended default policy:

- auto-approve read-only x402 calls up to a small threshold
- require explicit approval for:
  - MoonPay swaps and bridges
  - all token transfers
  - any write action on Solana
  - any provider without a trust score or receipt guarantees

## Practical Implementation Notes

## 1. Use CAIP-2 internally

This avoids EVM-vs-Solana ambiguity and aligns with x402.

Examples:

- `eip155:8453`
- `solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp`

## 2. Separate registry ingestion from execution

Not every listed provider should be directly callable on day one.

Boreal should support:

- discovery-only
- discovery + handoff
- discovery + direct invoke

as separate capability states.

## 3. Persist receipts and evidence

For every paid invocation, Boreal should store:

- amount
- currency
- protocol
- chain
- tx hash or payment reference
- provider response
- normalized evidence pointer

This is essential for Boreal's stated auditability model.

## 4. Add direct dependencies explicitly

Because `x402` is only in the lockfile today, add the direct packages when implementation starts.

Likely package set:

- `x402`
- `@x402/fetch`
- `@x402/axios`
- `@x402/evm`
- `@x402/svm`

Final exact package list should follow the version line current at implementation time.

## 5. Use Solana-specific Privy wallet methods

For true Solana execution Boreal should not stop at generic wallet presence.
It needs:

- signing
- sign-and-send
- batch / multi-instruction support

## Risks And Open Questions

## 1. x402 + Privy is custom integration work

Official Coinbase embedded-wallet helpers are Coinbase-specific.
Boreal will need its own Privy-backed x402 buyer implementation.

## 2. AgentCash docs conflict on Solana support

Current docs simultaneously imply:

- EVM-only supported payment networks
- a Solana wallet exists
- some endpoints may require Solana

Boreal should not treat AgentCash as confirmed Solana-first infrastructure until this is validated.

## 3. Frames public API contract is not yet deep enough

The product is clear.
The public developer contract for direct invocation is not.

## 4. MPP protocol breadth is ahead of productized Solana support

The protocol drafts include Solana.
Stripe's current public machine-payments docs emphasize Tempo for crypto.

## 5. MoonPay adds KYC and compliance friction

That is acceptable for funding and swap flows.
It is not a substitute for low-friction x402 calls.

## 6. Privy does not solve Stripe SPT

Privy is excellent for wallet-based onchain approvals.
It does not replace Stripe Elements or Stripe-native SPT issuance.

## Recommended Shipping Order

If the goal is "support these projects and make them callable" with Solana priority, the practical shipping order is:

1. `Privy` wallet broker and policy engine
2. direct `x402` execution with Solana support
3. `agentic.market` ingestion and execution routing
4. `Solana Agent Kit` as Boreal-native Solana action engine
5. `MoonPay` funding / bridge / swap adapter
6. `Frames` metadata ingestion and controlled handoff
7. `AgentCash` delegated gateway or MCP sidecar
8. `MPP` payable MCP / JSON-RPC support

## Final Recommendation

The best architecture for Boreal is:

- `x402` as the first direct payment rail
- `Privy` as the user wallet broker
- `agentic.market` as the first registry source
- `Solana Agent Kit` as the first native Solana executor
- `MoonPay` as the funding and bridge layer
- `Frames` and `AgentCash` as second-wave adapters
- `MPP` as the second protocol rail for MCP / JSON-RPC and Stripe-linked providers

That path is the strongest match for:

- Boreal's current codebase
- Boreal's supply-layer thesis
- human-controlled payment approval
- a Solana-first execution strategy

## Sources

### Repo context

- `COMMERCE_STANDARDS.md`
- `next-app/README.md`
- `next-app/lib/boreal/integrations/providers/types.ts`
- `next-app/lib/boreal/integrations/providers/registry.ts`
- `next-app/components/privy-provider.tsx`
- `next-app/hooks/use-payment.ts`
- `next-app/convex/schema.ts`
- `next-app/convex/supplies.ts`

### x402

- https://docs.cdp.coinbase.com/x402/welcome
- https://docs.cdp.coinbase.com/x402/network-support
- https://docs.cdp.coinbase.com/x402/bazaar
- https://docs.cdp.coinbase.com/x402/mcp-server
- https://docs.cdp.coinbase.com/embedded-wallets/x402-payments
- https://www.x402.org/

### MPP

- https://mpp.dev/
- https://docs.stripe.com/payments/machine
- https://docs.stripe.com/payments/machine/mpp.md
- https://stripe.com/au/blog/machine-payments-protocol
- https://paymentauth.org/
- https://paymentauth.org/draft-payment-transport-mcp-00.txt
- https://paymentauth.org/draft-solana-charge-00.pdf

### Agentic Market

- https://agentic.market/
- https://agentic.market/llms.txt
- https://api.agentic.market/v1/services

### AgentCash

- https://agentcash.dev/docs
- https://agentcash.dev/docs/quickstart
- https://agentcash.dev/docs/how-it-works
- https://agentcash.dev/docs/wallet/funding
- https://agentcash.dev/docs/wallet/networks

### Frames

- https://frames.ag/
- https://frames.ag/tools
- https://frames.ag/agentwallet
- https://github.com/frames-engineering

### MoonPay

- https://support.moonpay.com/en/articles/586583-moonpay-cli-for-ai-agents
- https://support.moonpay.com/en/articles/586487-moonpay-agents-fund-your-ai
- https://support.moonpay.com/en/articles/629097-what-you-can-build-with-moonpay-skills
- https://dev.moonpay.com/docs/on-ramp-overview
- https://dev.moonpay.com/v1.0/docs/ramps-swap

### Solana Agent Kit

- https://docs.sendai.fun/docs/v2/introduction
- https://docs.sendai.fun/docs/v2/setup/embedded-wallets
- https://docs.sendai.fun/docs/v2/examples/embedded-wallets/privy

### Privy

- https://docs.privy.io/wallets/overview
- https://docs.privy.io/wallets/connectors/overview
- https://docs.privy.io/wallets/using-wallets/solana/send-a-transaction
- https://docs.privy.io/controls/authorization-keys/owners/configuration/user/server-transactions
- https://docs.privy.io/recipes/batch-transactions
