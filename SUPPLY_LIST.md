# Boreal Supply List

Status: repo-truthful supply inventory and build-tracker spec for the current Boreal early access surface.

This document answers four questions:

1. What kinds of supply Boreal already supports
2. What a representative buyer scenario looks like for each class
3. What delivery looks like when that class is fulfilled
4. What still needs to be built so routing, matching, and fetch logic stay clean

This is not only a catalog note.  It is also the implementation tracker for how Boreal should structure supply in Convex and how the matching engine should fetch the right classes efficiently.

## Status Legend

| Status | Meaning |
| --- | --- |
| `Live` | Observable in current repo and product contracts |
| `Partial` | Real foundation exists, but the flow is incomplete or not hardened enough to overclaim |
| `Schema only` | Enums or data fields exist, but the user-facing flow is not complete |
| `Target` | Planned direction, not yet implemented |

## Core Rule

Boreal should keep one canonical searchable `supplies` table, but different supply classes should not all pretend to be the same object at fetch and matching time.

The right pattern is:

- one canonical listing row in `supplies`
- one request classifier that decides what class of supply the user really needs
- subtype or adjunct tables keyed by `supplyId` for class-specific data
- class-specific fetch paths before broad ranking

## Current Canonical Dimensions

These are the supply dimensions already visible in repo truth.

| Axis | Current values | Why it matters |
| --- | --- | --- |
| `actorKind` | `human`, `agent`, `tool` | Who actually performs the work |
| `supplyType` | `product`, `capability`, `agent_tool`, `collective` | Broad market form |
| `deliveryType` | `instant`, `async`, `scheduled` | Turnaround and routing expectations |
| `fulfillmentKind` | `digital`, `service`, `physical`, `hybrid` | Delivery and evidence shape |
| `executionSurface` | `registry`, `http`, `mcp`, `jsonrpc`, `sdk`, `widget`, `handoff` | Invocation surface |
| `paymentProtocol` | `x402`, `mpp`, `direct-solana`, `widget`, `none` | How payment starts execution |
| `scenarioTypes` | `instant_digital_purchase`, `provider_paid_service`, `provider_handoff_service`, `custom_scoped_work`, `chat_only_fulfillment`, `consultation`, `physical_service`, `milestone_project`, `supply_publish` | Economic and workflow semantics |

## Supported Supply Classes

This is the current high-level Boreal supply matrix.

| Supply class | Status | Canonical repo shape | Primary entry path | Buyer scenario | Delivery looks like | Main gaps |
| --- | --- | --- | --- | --- | --- | --- |
| Digital product | `Live` | `supplyType=product`, usually `deliveryType=instant`, `fulfillmentKind=digital`, `isCartEnabled=true` | Boreal-side listing builder and canonical `supplies` rows | Buyer wants a downloadable kit, prompt pack, or packaged asset | Cart or checkout purchase, then access or download artifact | Richer product pages, variants, merchant self-serve flows, stronger product search |
| Human custom service offer | `Live` | usually `actorKind=human`, `supplyType=capability`, `deliveryType=async` or `scheduled`, `fulfillmentKind=service` or `hybrid` | `/account` public setup and canonical `supplies` row | Buyer wants a human to write copy, audit a workflow, design something, or advise | Request -> proposal or approval -> thread activity -> delivery -> review -> payout | Better structured scoping, SLA, revision loops, escrow-funded start, stronger availability data |
| Agent custom service offer | `Live` | usually `actorKind=agent`, `supplyType=capability`, `deliveryType=async`, optional runtime metadata such as executor URLs and callbacks | `POST /api/v1/supplies`, `/account`, connected-agent onboarding | Buyer wants an agent to research, route, analyze, or produce scoped deliverables | Request -> proposal or direct specialist approval -> in-thread updates or callbacks -> delivery -> payout | Connector health, runtime verification, escrow-funded start, mainnet hardening |
| Native direct tool or specialist | `Live` | `actorKind=tool` or `agent`, `supplyType=agent_tool` or `capability`, often `deliveryType=instant` | Built-in Boreal specialist registry and direct route surfaces | Buyer wants immediate image, speech, video, or specialist execution | Request route runs directly, artifacts or results attach to the request | Separate direct-tool fetch path from worker-market matching, clearer classification before routing |
| Provider-backed direct paid service | `Partial` | normalized into `supplies`, often paired with `serviceCapabilities`, `sourceProviderKey`, `supportsDirectInvoke=true`, paid protocol metadata | Agentic Market sync and service-provider layer | Buyer wants to invoke a paid external capability Boreal can call safely now | Quote or checkout -> payment attempt -> service invocation -> result URL or response payload | More providers, stronger normalization, mainnet settlement hardening, provider-specific fulfillment truth |
| Provider-backed handoff service | `Partial` | normalized into `supplies`, often `executionSurface=handoff` or widget-like flow, may have provider metadata without safe direct invoke | service-provider layer and synced listings | Buyer discovers a provider offer in Boreal, but fulfillment still depends on external handoff | Boreal tracks listing, payment or handoff context, then points or hands off externally | Better user truth on when Boreal is only discovery or handoff, stronger checkout-to-fulfillment continuity |
| Connected external agent executor | `Live` | agent supply row with execution metadata such as `http`, `mcp`, `jsonrpc`, callbacks, and direct-invoke flags | public supply API, `/agents`, `/developers/agents`, Hermes bridge | Buyer wants a connected external runtime to participate or execute | Same Boreal request thread remains canonical; runtime can push status, evidence, and heartbeat | Runtime health scoring, operator visibility, more explicit fetch and ranking rules for connected runtimes |
| Collective offer | `Partial` | `supplyType=collective` plus request-side collective proposal mechanics such as `memberRoles` and `splitPlan` | public supply row plus one approved collective proposal on a request | Buyer wants a small team, not a single worker, to deliver one scoped request | One request, one approved collective proposal, collaborator participation, split payouts | Dedicated collective listing semantics, member constraints, team-level matching, better collective discovery |
| Consultation-style offer | `Partial` | usually a service or capability row using `scenarioTypes=consultation` | listing builder or public supply API | Buyer wants a paid advisory session or scoped consultation | Proposal or approval -> scheduled or async consult -> notes or artifact -> payout | Scheduling, attendance verification, structured consultation evidence |
| Milestone project | `Schema only` | service row may declare `scenarioTypes=milestone_project` | canonical `supplies` row only | Buyer wants larger multi-step work with staged acceptance | Should become milestone deliveries, staged approvals, staged payouts | Milestone model, milestone UI, staged settlement, dispute handling |
| Physical or hybrid service | `Schema only` | `fulfillmentKind=physical` or `hybrid`, often `deliveryType=scheduled` | canonical `supplies` row only | Buyer wants a real-world service, visit, or hybrid deliverable | Should require schedule, attendance, evidence, and completion checks | Physical scheduling, attendance verification, geography and service-area logic |

## Scenario And Delivery Matrix

This section makes the supply classes easier to compare operationally.

| Supply class | Matching target | Payment start | Delivery proof | Final artifact or outcome |
| --- | --- | --- | --- | --- |
| Digital product | product catalog | cart or checkout payment | receipt or access event | download, access URL, or unlocked asset |
| Human custom service | worker market | today: proposal approval and payment spine; target: funded escrow before start | thread updates, uploads, artifacts, manual fulfillment notes | completed service deliverable and review |
| Agent custom service | worker market or direct specialist route | today: route-specific payment spine; target: funded escrow or prepay depending mode | callbacks, evidence push, artifacts, thread activity | structured result, artifact bundle, or answer |
| Native direct tool | direct route, not broad worker market | pay-before-execute where paid, otherwise zero-cost direct route | generated artifact or result record | image, audio, video, or specialist result |
| Provider-backed direct paid service | provider capability market | x402 or other supported protocol before execution | service invocation record, response payload, result URL | provider result or access artifact |
| Provider-backed handoff service | provider discovery plus handoff | depends on provider and checkout mode | handoff or external completion state | external service outcome |
| Collective offer | collective market | target should be funded escrow before work begins | participant activity, deliveries, split payout records | merged deliverable from a team |
| Consultation | service market | payment before scheduled consult or funded reservation | notes, transcript, summary, attendance proof | consultation summary or next-step plan |
| Milestone project | scoped project market | staged or escrowed funding | milestone submissions and approvals | milestone-by-milestone completion |
| Physical or hybrid service | geography-aware service market | scheduled service funding | attendance, receipt, media, or check-in proof | physical-world completion |

## What Delivery Looks Like In Boreal

| Delivery shape | Best fit supply classes | Current repo support |
| --- | --- | --- |
| Instant download or access URL | digital products | `Live` |
| Direct generated artifact attached to request | native tools, direct specialists | `Live` |
| Service invocation record plus result URL | provider-backed direct paid services | `Partial` |
| Thread-based scoped delivery with uploads and review | human or agent custom service | `Live` |
| Callback-driven status, evidence, and heartbeat on one request | connected external agents | `Live` |
| One request with collaborator delivery and split payout rows | collectives | `Partial` |
| Scheduled attendance or milestone acceptance | consultations, physical services, milestone projects | `Schema only` |

## Current Convex Table Map

This is the current storage surface that matters for supply.

| Table | Current role | Notes |
| --- | --- | --- |
| `profiles` | public identity and reputation anchor | good for owner identity, not enough for supply class specifics |
| `supplies` | canonical searchable listing row | should remain the unified market row |
| `serviceCapabilities` | provider capability inventory | already acts like a provider-specific adjunct table |
| `serviceProviders` | provider registry | provider-level control plane |
| `matchCandidates` | request-level evaluated supply candidates | ranking evidence, not supply storage |
| `proposals` | custom-work bid layer | especially important for async scoped work |
| `fulfillments` | delivery lifecycle | ties request work to completion |
| `transactions` / `settlements` / `payouts` | money spine | shared across product, provider, and custom-work flows |
| `agentRequestSessions` | one-request premium agent-only paid execution path | current direct paid demand front door |

## Needed Subtype Tables

These are the Convex tables Boreal should add next so each supply class can carry the fields matching and fetching actually need.

| Proposed table | Why it exists | Key fields |
| --- | --- | --- |
| `supplyProducts` | product-specific fetch and checkout metadata should not live as generic service fields | variants, SKU, asset access mode, license, inventory, versioning |
| `supplyServiceOffers` | async human or agent work needs scoped-service metadata | acceptance criteria, deliverable templates, revision policy, schedule hints, evidence expectations |
| `supplyProviderServices` | provider-backed direct invoke and handoff flows need provider-specific execution detail | quote URL, invoke URL, provider policy, direct-invoke readiness, provider health |
| `supplyAgentRuntimes` | connected-agent capabilities need runtime-specific operational metadata | executor URL, callback support, status push, evidence push, heartbeat, control mode |
| `supplyCollectives` | collectives need team-specific rules beyond one generic listing row | member constraints, default roles, split defaults, acceptance rules |
| `supplyAvailabilitySnapshots` | matching should query fresh capacity and availability data | next available, reservations, backlog, heartbeat, concurrency |
| `supplyStats` | trust and response metrics should stay denormalized and queryable at the listing level | acceptance, fulfillment, on-time, dispute, response metrics |

## Concrete Convex Schema Plan

This is the actual subtype-table plan that fits the current repo shape.

### Keep On Canonical `supplies`

`supplies` should remain the one searchable market row.  Keep only fields needed for:

- public listing identity
- search and coarse filtering
- request prefiltering
- quick ranking features

Recommended long-lived base fields:

| Keep on `supplies` | Why |
| --- | --- |
| `supplierUserId`, `title`, `subtitle`, `description`, `offerSlug` | public listing identity |
| `actorKind`, `supplyType`, `category`, `status` | first-pass market filtering |
| `deliveryType`, `fulfillmentKind`, `executionSurface` | route-family prefiltering |
| `isCartEnabled`, `paymentProtocol`, `supportsDirectInvoke`, `sourceProviderKey` | payment and execution prefiltering |
| `priceType`, `priceAmount`, `priceMin`, `priceMax`, `currency` | quick economics filtering |
| `outputTypes`, `capabilityTags`, `keywords`, `searchText` | retrieval and ranking |
| `availabilityStatus`, `nextAvailableAt`, `maxConcurrentJobs`, `activeReservations` | quick feasibility checks until snapshot tables fully drive reads |
| `trustScore`, `acceptanceRate`, `fulfillmentRate`, `matchCount` | cheap ranking features and public display |
| `scenarioTypes`, `updatedAt` | workflow and freshness hints |
| `marketKind`, `subtypeVersion` | new fetch identity and migration control |

Recommended new base-row enums:

| Field | Values | Purpose |
| --- | --- | --- |
| `marketKind` | `product`, `service_offer`, `provider_service`, `direct_tool`, `collective_offer` | stable fetch path hint |
| `subtypeVersion` | integer | migration and backfill tracking |

### `supplyProducts`

Use for digital products and later physical catalog items.

Representative shape:

```ts
type SupplyProductRecord = {
  supplyId: Id<"supplies">;
  supplierUserId: string | null;
  createdAt: number;
  updatedAt: number;
  assetAccessMode: "download" | "external_access" | "license_key" | "bundle";
  downloadUrl: string | null;
  externalAccessUrl: string | null;
  licenseTermsUrl: string | null;
  sku: string | null;
  variantJson: string | null;
  versionLabel: string | null;
  inventoryPolicy: "unlimited" | "limited" | "manual_release";
  inventoryCount: number | null;
  requiresManualRelease: boolean;
  fulfillmentNotes: string | null;
}
```

Indexes:

- `by_supplyId`
- `by_supplierUserId_and_updatedAt`
- optional later: `by_sku`

### `supplyServiceOffers`

Use for async human work, async agent work, consultation offers, and later milestone or scheduled service offers.

Representative shape:

```ts
type SupplyServiceOfferRecord = {
  supplyId: Id<"supplies">;
  supplierUserId: string | null;
  createdAt: number;
  updatedAt: number;
  serviceMode: "human" | "agent" | "hybrid";
  scopeKind: "scoped" | "retainer" | "consultation" | "milestone";
  estimatedTurnaroundHours: number | null;
  earliestStartAt: number | null;
  timezone: string | null;
  acceptanceCriteria: string[];
  deliverableChecklist: string[];
  evidenceRequirements: string[];
  revisionPolicy: "none" | "limited" | "negotiated";
  revisionCountIncluded: number | null;
  requiresEscrowFunding: boolean;
  supportsMilestones: boolean;
  requiresAttendance: boolean;
  geographyMode: "remote" | "onsite" | "hybrid";
  geographyJson: string | null;
}
```

Indexes:

- `by_supplyId`
- `by_supplierUserId_and_updatedAt`
- `by_scopeKind_and_updatedAt`

### `supplyProviderServices`

Use for provider-backed direct invoke or provider-backed handoff services.

Representative shape:

```ts
type SupplyProviderServiceRecord = {
  supplyId: Id<"supplies">;
  createdAt: number;
  updatedAt: number;
  sourceProviderKey: "agentic-market" | "agentcash" | "frames" | "moonpay" | "solana-agent-kit" | "manual";
  sourceCapabilityId: string | null;
  providerDisplayName: string | null;
  quoteUrl: string | null;
  invokeUrl: string | null;
  availabilityUrl: string | null;
  resultMode: "sync_json" | "async_job" | "external_handoff";
  directInvokeReady: boolean;
  handoffOnly: boolean;
  acceptedNetworkHints: string[];
  paymentProtocol: "x402" | "mpp" | "direct-solana" | "widget" | "none";
  providerHealthStatus: "healthy" | "failing" | "unknown";
  lastHealthCheckAt: number | null;
  normalizationVersion: number;
  providerMetadataJson: string | null;
}
```

Indexes:

- `by_supplyId`
- `by_sourceProviderKey_and_sourceCapabilityId`
- `by_sourceProviderKey_and_directInvokeReady`

### `supplyAgentRuntimes`

Use for connected external runtimes and agent-owned execution surfaces.

Representative shape:

```ts
type SupplyAgentRuntimeRecord = {
  supplyId: Id<"supplies">;
  supplierUserId: string | null;
  createdAt: number;
  updatedAt: number;
  runtimeKind: "http" | "mcp" | "jsonrpc" | "sdk" | "a2a" | "registry";
  executorUrl: string | null;
  openApiUrl: string | null;
  schemaUrl: string | null;
  a2aEndpoint: string | null;
  mcpServerUrl: string | null;
  mcpToolName: string | null;
  supportsDirectInvoke: boolean;
  supportsStatusUpdates: boolean;
  supportsEvidencePush: boolean;
  supportsHeartbeat: boolean;
  connectorHealthStatus: "healthy" | "failing" | "unknown";
  connectorLastHeartbeatAt: number | null;
  connectorLastTestedAt: number | null;
  runtimeMetadataJson: string | null;
}
```

Indexes:

- `by_supplyId`
- `by_supplierUserId_and_updatedAt`
- `by_connectorHealthStatus_and_updatedAt`

### `supplyCollectives`

Use for collective listings and team-specific defaults that should not live on every supply row.

Representative shape:

```ts
type SupplyCollectiveRecord = {
  supplyId: Id<"supplies">;
  supplierUserId: string | null;
  createdAt: number;
  updatedAt: number;
  collectiveKind: "human_team" | "agent_team" | "hybrid_team";
  minMembers: number | null;
  maxMembers: number | null;
  defaultLeadRole: string | null;
  defaultRolesJson: string | null;
  defaultSplitPolicy: "equal" | "weighted" | "custom";
  memberConstraintJson: string | null;
  requiresLeadApproval: boolean;
  supportsDirectInvite: boolean;
  collectiveMetadataJson: string | null;
}
```

Indexes:

- `by_supplyId`
- `by_supplierUserId_and_updatedAt`
- `by_collectiveKind_and_updatedAt`

### `supplyAvailabilitySnapshots`

Use as the live feasibility table.  This should become more important than stale base-row availability over time.

Representative shape:

```ts
type SupplyAvailabilitySnapshotRecord = {
  supplyId: Id<"supplies">;
  createdAt: number;
  availabilityStatus: "available" | "limited" | "unavailable";
  nextAvailableAt: number | null;
  maxConcurrentJobs: number | null;
  activeReservations: number;
  queueDepth: number | null;
  openAssignments: number | null;
  heartbeatAt: number | null;
  source: "listing" | "runtime" | "reservation" | "operator";
  expiresAt: number | null;
}
```

Indexes:

- `by_supplyId_and_createdAt`
- `by_availabilityStatus_and_createdAt`
- `by_expiresAt`

### `supplyStats`

Use for denormalized listing-level marketplace performance.  Base row can still mirror a few headline stats such as `trustScore`.

Representative shape:

```ts
type SupplyStatsRecord = {
  supplyId: Id<"supplies">;
  supplierUserId: string | null;
  updatedAt: number;
  reviewCount: number;
  reviewAverage: number | null;
  acceptanceRate: number;
  fulfillmentRate: number;
  onTimeRate: number | null;
  responseRate: number | null;
  responseP50Minutes: number | null;
  disputeRate: number | null;
  refundRate: number | null;
  evidenceAcceptanceRate: number | null;
  trustScore: number;
  statsWindowDays: number | null;
}
```

Indexes:

- `by_supplyId`
- `by_supplierUserId_and_updatedAt`

## Ownership And Integrity Rules

These rules should be explicit in Convex mutations.

| Rule | Meaning |
| --- | --- |
| one canonical row | every subtype record must reference one existing `supplies` row |
| one primary subtype per market kind | `product` -> `supplyProducts`, `service_offer` -> `supplyServiceOffers`, `provider_service` -> `supplyProviderServices`, `direct_tool` -> usually `supplyAgentRuntimes` or provider subtype, `collective_offer` -> `supplyCollectives` |
| additive subtype rows allowed | some listings can legitimately have more than one adjunct row, such as an agent service offer with runtime metadata |
| owner consistency | subtype rows must carry the same `supplierUserId` as the base `supplies` row where applicable |
| base row first | a subtype row cannot exist without the canonical base listing |
| denormalized mirrors allowed | headline stats and availability can stay mirrored on `supplies` for fast filtering, but subtype or snapshot tables remain the detailed source |

## Write Path Plan

The current `createSupplyEntry` mutation should remain the front door, but it should stop trying to be the only storage shape.

Recommended write sequence:

1. upsert or locate canonical `supplies` row
2. compute `marketKind`
3. write base-row search, filter, and ranking summary fields
4. upsert one or more subtype rows depending on `marketKind`, `actorKind`, `executionSurface`, and `sourceProviderKey`
5. refresh mirrored availability and stats if needed

Recommended subtype dispatch:

| Condition | Subtype writes |
| --- | --- |
| `marketKind=product` | `supplyProducts` |
| `marketKind=service_offer` | `supplyServiceOffers` |
| `marketKind=provider_service` | `supplyProviderServices` |
| agent-owned runtime metadata present | `supplyAgentRuntimes` |
| `marketKind=collective_offer` | `supplyCollectives` and usually `supplyServiceOffers` |

## Read Path Plan

Reads should split into three layers.

| Read kind | Query pattern |
| --- | --- |
| market search rail | query `supplies` only, using fast filters and search index |
| detail page or edit form | load `supplies` row, then hydrate the relevant subtype rows by `supplyId` |
| matching or routing | request classifier chooses target market, fetches relevant subtype rows first or alongside base rows, then ranks inside that narrowed pool |

Important rule:

- do not make the matcher search all active `supplies` for product, provider-service, and scoped-labor requests the same way

## Migration Sequence

This should be done in phases so existing rows keep working.

| Phase | Action | Outcome |
| --- | --- | --- |
| `1` | add `marketKind` and `subtypeVersion` to `supplies` | base rows gain stable fetch identity |
| `2` | create subtype tables and write helpers | schema can hold class-specific detail |
| `3` | backfill existing `supplies` into subtype tables using deterministic heuristics | current listings gain subtype records |
| `4` | update `createSupplyEntry` and public supply API to write base row plus subtype rows | new writes become class-aware |
| `5` | update matching and routing reads to use request classification plus subtype fetch paths | retrieval quality and cost improve |
| `6` | thin the base row where subtype fields have become canonical | canonical market row stays lean |

Recommended deterministic `marketKind` backfill:

| Existing row signal | Backfilled `marketKind` |
| --- | --- |
| `supplyType=product` | `product` |
| `sourceProviderKey` present and not `manual` | `provider_service` |
| `supplyType=collective` | `collective_offer` |
| `actorKind=tool` and `deliveryType=instant` and not `isCartEnabled` | `direct_tool` |
| otherwise | `service_offer` |

## Mutation Checklist

When implementation starts, these are the concrete mutation changes.

| Mutation area | Change |
| --- | --- |
| `createSupplyEntry` | compute `marketKind`, write base row, then subtype rows |
| public `/api/v1/supplies` path | accept class-specific fields without bloating base-row requirements |
| seed and sync paths | backfill subtype rows for built-in and imported supply |
| service-provider sync | write `supplyProviderServices` deterministically |
| connected-agent onboarding | write `supplyAgentRuntimes` deterministically |
| future collective listing path | write `supplyCollectives` and service-offer metadata together |

## Fetch Policy By Supply Class

This is the operational rule for routing and matching.

| Request really is... | Fetch from first | Do not start from | Why |
| --- | --- | --- | --- |
| product purchase | `supplies` filtered to product rows plus `supplyProducts` | all active supplies | product ranking is different from worker matching |
| provider-backed direct service | `serviceCapabilities`, provider-normalized `supplies`, and `supplyProviderServices` | generic human or agent offers | provider execution constraints matter before ranking |
| direct generation or native tool use | native direct routes and tool-capable supply | the whole marketplace | this is routing, not broad supply discovery |
| async human or agent custom work | capability or collective supply plus `supplyServiceOffers` and runtime adjuncts | product rows and provider-only services | scoped labor needs service and availability filters first |
| collective work | collective rows plus service-offer and team adjunct tables | single-worker-only pools | collective constraints change matching and payout logic |

## Priority Build Tracker

This is the implementation order implied by the current repo.

| Priority | Build item | Why it matters | Depends on |
| --- | --- | --- | --- |
| `P0` | request classifier that distinguishes product, provider service, direct tool, custom work, and collective work | this is the first routing and fetch breakpoint | current intent extraction and schema updates |
| `P0` | class-first fetch path before broad ranking | prevents wasteful and noisy candidate pools | request classifier |
| `P0` | subtype supply tables under canonical `supplies` | lets each class store matching-critical metadata cleanly | schema and mutation updates |
| `P0` | stronger availability and capacity snapshots | matching quality collapses without live feasibility | supply subtype work |
| `P1` | mainnet hardening for provider and one-request payment paths | paid execution needs real money truth | payment hardening work |
| `P1` | escrow-funded start for async human or agent work | open paid labor should not begin unfunded | transaction and settlement work |
| `P1` | better product catalog and merchant flow | digital products need their own polished path | product subtype table |
| `P1` | collective listing and discovery rules | team supply needs more than proposal-time assembly | collective subtype table |
| `P2` | consultation, milestone, and physical-service flows | schema exists, workflow does not | schedule, milestone, and geography systems |

## What Boreal Can Truthfully Say Today

| Claim | Truth today |
| --- | --- |
| Boreal supports supply beyond one kind of worker | `True` |
| Boreal already supports products, services, agents, provider-backed capabilities, and collectives in some form | `True`, but unevenly |
| Boreal already has one clean subtype-table model for each supply class | `False` |
| Boreal already classifies every request strongly enough to fetch the right market slice first | `False` |
| Boreal already has mainnet-hardened paid execution for every supply class | `False` |

## Short Take

The supply model is already broad enough to be interesting.  The weakness is not lack of categories.  The weakness is that request classification, fetch paths, and subtype storage have not caught up to the breadth of supply Boreal is trying to represent.

That means the next supply architecture step is not "add more categories."

It is:

1. classify the request correctly
2. fetch from the right supply class first
3. store each supply class in the canonical row plus the right adjunct table
4. rank inside the right market slice
