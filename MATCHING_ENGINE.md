# Matching Engine Architecture

Status: Phase 2 and Phase 3 architecture with some alpha foundations already shipped.

Current alpha foundations already in the repo:

- structured intent extraction from chat
- embedding-based intent and modality scoring
- public supply and request discovery
- request-driven catalog rendering for product and service search
- profiles, proposals, fulfillment records, reviews, and activity logs
- cart and checkout-history surfaces tied back to supply and request workspaces

Not shipped yet:

- true hybrid retrieval with BM25 + vector + RRF
- hard feasibility filters based on live availability and price
- ranked match candidates with score breakdowns
- reservation-aware assignment
- learned reranking and calibrated success thresholds

This document turns the whitepaper's matching section into an implementation-grade design for `next-app/` and the current Convex schema.  It assumes Boreal is matching broad, messy incoming intent to a mixed supply base of humans, agents, tools, products, and collectives.

## 1. Core Position

Matching is not one algorithm.  It is a pipeline:

1. Normalize intent and supply into comparable forms.
2. Retrieve a wide candidate set with high recall.
3. Eliminate impossible matches with hard feasibility gates.
4. Rank the viable set with a learnable success model.
5. Assign, notify, or post based on confidence and capacity.
6. Learn from outcomes, not clicks alone.

If Boreal tries to solve everything with "semantic similarity", quality will look impressive in demos and fail in production.  Availability, price, trust, latency, geography, concurrency, and evidence quality are not semantic problems.  They are structured feasibility and marketplace policy problems.

## 2. What The Engine Must Optimize

For Boreal, a "good match" is not just relevance.  It is expected successful fulfillment under constraints.

North-star objective:

`maximize P(successful fulfillment within SLA and budget) * value(intent, supply)`

Subject to:

- supplier capacity and availability
- price and budget constraints
- routing and compliance constraints
- evidence and quality requirements
- marketplace health constraints
- fairness and exploration limits

Secondary objectives:

- reduce time-to-first-qualified-match
- reduce time-to-accept
- improve fill rate
- increase repeat-success routing
- avoid overloading the same suppliers
- give high-quality new suppliers a path to discovery

## 3. Recommended Architecture

### 3.1 Flow At A Glance

```text
intent arrives
  -> structured extraction
  -> capability normalization
  -> embeddings + lexical query build
  -> candidate generation
  -> RRF fusion
  -> hard feasibility filters
  -> feature computation
  -> reranking
  -> policy decision
       -> Tier 1 auto-deliver
       -> Tier 2 fast-route / notify / reserve
       -> Tier 3 open board + recommended candidates
       -> Tier 4 pending + rematch scheduler
  -> outcome logging
  -> model and score updates
```

### 3.2 Retrieval Layers

Use multiple retrieval views in parallel, then fuse.

Recommended recall stack:

| Layer | Purpose | Why it matters |
| --- | --- | --- |
| BM25 / lexical search | Exact capability terms, brand names, acronyms, explicit deliverables | Dense vectors miss exact terms; lexical search catches them |
| Dense vector search | Semantic recall for broad or messy intent | Handles synonyms and indirect phrasing |
| Structured filter preselection | Category, modality, delivery type, active status | Cheap precision boost |
| Historical analog retrieval | Retrieve prior fulfilled intents similar to this one, then suppliers that fulfilled them well | Strong signal for real-world success |
| Explicit capability graph | Taxonomy neighbor expansion, aliases, parent/child capability recall | Broad intent needs structured expansion |

Recommended fusion:

- Use Reciprocal Rank Fusion for the first production version.
- RRF is the right default because it fuses lexical and semantic rankings without score calibration.
- Start with `k = 60`, which is the classic default from the RRF paper and is also the value Elastic documents around RRF.

Initial candidate sizes:

- lexical top 100
- vector top 100
- analog top 50
- taxonomy expansion top 50
- fused deduped set target: 100 to 250 candidates before gating

### 3.3 Hard Feasibility Gates

Hard filters should run before expensive reranking.  If a listing cannot actually fulfill, do not let it compete on semantic fit.

Gate families:

| Gate | Examples |
| --- | --- |
| Status | `active`, not suspended, healthy heartbeat |
| Capability must-haves | required output type, category support, executor compatibility |
| Capability must-not-haves | explicit exclusions, unsupported domain, legal/compliance blocks |
| Availability | available now, next available before deadline, backlog below threshold |
| Capacity | concurrency slots, queue depth, reservation tokens |
| Geography | remote only, on-site city coverage, timezone overlap |
| Pricing | inside budget band or inside allowed over-budget tolerance |
| Delivery | instant, async, scoped project, recurring |
| Trust floor | minimum trust or evidence threshold for certain categories |
| Access / routing | native, external handoff, private supplier, premium tier |

Important rule:

- Availability should be both a hard gate and a ranking feature.
- A supplier that is truly unavailable should fail fast.
- Among available suppliers, better availability should score higher.

### 3.4 Ranking Layers

Use a three-stage ranking stack.

#### Stage A: Heuristic score

Needed immediately because Boreal does not yet have enough outcomes for a trained ranker.

Suggested starting feature weights:

| Feature | Weight | Notes |
| --- | --- | --- |
| semantic fit | 0.20 | cosine or dot product on normalized embeddings |
| explicit capability fit | 0.18 | required/optional/excluded capability coverage |
| lexical fit | 0.12 | BM25 or keyword overlap |
| price fit | 0.12 | expected price within budget or tolerance |
| deadline fit | 0.10 | estimated completion vs remaining time |
| live availability fit | 0.10 | queue, next available, timezone overlap |
| trust and reputation | 0.10 | smoothed acceptance, fulfillment, review quality |
| evidence fit | 0.04 | prior evidence similar to requested output |
| responsiveness | 0.05 | response SLA, decline rate, stale listing penalty |
| freshness and completeness | 0.05 | listing updated recently, high schema completeness |
| relationship / analog success | 0.04 | same supplier succeeded on similar intents before |

Do not treat these weights as permanent.  They are bootstrap weights only.

#### Stage B: Learnable reranker

Best long-term default: LambdaMART or another gradient-boosted learning-to-rank model.

Why:

- It handles heterogeneous numeric and categorical features well.
- It is strong in real production ranking systems.
- It is easier to debug and iterate than a fully neural end-to-end ranker.
- It works well once Boreal has enough outcome labels.

Training target recommendation:

- primary label: fulfilled and accepted within SLA
- secondary labels: proposal accepted, supplier responded, owner rated >= threshold
- negative labels: expired, declined, canceled for supplier reasons, low evidence quality

Do not train the reranker on raw chat satisfaction alone.  Boreal is an outcome system, not a content feed.

#### Stage C: High-cost semantic rerank

Use only on a small shortlist.

Recommended use:

- top 10 to 20 candidates only
- for ambiguous, broad, high-value intents
- especially before Tier 2 fast-route or direct notifications

Options:

- cross-encoder reranker
- LLM judge/reranker

Guideline:

- Keep LLM reranking off the hot path for every request.
- Use it as a precision layer, not as the primary engine.

### 3.5 Assignment Policy

Ranking and assignment are different.

Recommended policy by scale:

| Market shape | Recommended policy |
| --- | --- |
| abundant supply, low conflict | top-1 or top-N notification with reservation |
| scarce supply, many simultaneous intents | batched assignment optimizer |
| supplier can handle many concurrent jobs | capacity-constrained top-N with concurrency ledger |
| mutual preference batch market | stable matching only if both sides expose explicit preferences |

Default Boreal policy:

- single-intent online ranking for most traffic
- reservation step before final fast-route
- periodic batch optimizer for high-conflict scarce suppliers

### 3.6 Marketplace Learning Loop

The engine should learn from outcomes in this order:

1. Did the supplier respond?
2. Was the supplier willing to accept?
3. Was the proposal accepted?
4. Was the work fulfilled?
5. Was it fulfilled on time?
6. Was the evidence accepted?
7. What was the review and dispute outcome?

Every stage should update different features.  Do not collapse all failures into one penalty.

Example:

- semantic false positive -> lower semantic trust for that supplier-capability region
- price mismatch -> update price expectation model, not semantic relevance
- missed SLA -> availability and deadline reliability penalty
- weak evidence -> evidence quality penalty
- user canceled before response -> may be neutral, not negative

## 4. Which Algorithms To Use, And Where

### 4.1 Recommended Defaults

| Problem | Best default | Why |
| --- | --- | --- |
| candidate recall | BM25 + dense vector + RRF | high recall, low tuning overhead |
| ANN vector search | HNSW-backed vector index | strong recall/latency tradeoff |
| early-stage ranker | weighted heuristic score | interpretable while data is sparse |
| mature reranker | LambdaMART / LTR | proven, debuggable, handles mixed features |
| broad intent disambiguation | small top-K cross-encoder or LLM rerank | adds semantic precision |
| scarce capacity assignment | min-cost max-flow or bipartite matching with capacities | globally better than greedy |
| exploration | contextual bandit on near-ties | helps cold start without destroying quality |
| long-term network effects | RL signals later, not first | useful only after strong simulators and offline evals |

### 4.2 When To Use Online Bipartite Matching

Use online bipartite matching ideas when:

- intents arrive continuously
- each assignment is partly irreversible
- capacity is limited
- you need competitive online decisions

Use it for:

- dispatching scarce on-demand supply
- choosing among multiple simultaneous fast-route candidates
- rematch queues where the same supplier cannot accept every intent

Do not use pure online matching as the entire engine.  It needs good edge weights first, and those weights come from retrieval, feasibility, and ranking.

### 4.3 When To Use Stable Matching

Stable matching is not the primary Boreal algorithm.

Use stable matching only when all are true:

- both sides express ranked preferences
- the market clears in batches or windows
- pair stability matters more than instant reaction time

Good fits:

- mentorship matching
- fixed cohort programs
- some collective team assembly windows

Poor fit for the main Boreal path:

- real-time intent arrival
- supplier capacity greater than one
- partial information
- need for sub-second recommendation

### 4.4 When To Use Contextual Bandits

Use contextual bandits for exploration among near-equals, not for core feasibility.

Good fits:

- deciding who gets notification slot 3 to 5
- deciding which new supplier to expose in a near-tie
- balancing exploitation with cold-start discovery

Not good fits:

- deciding whether an unavailable supplier should be shown
- replacing hard constraints
- replacing pricing and trust controls

### 4.5 When To Use Reinforcement Learning

RL can matter later for long-horizon marketplace health, but Boreal should not begin there.

Use RL only after:

- strong event logging
- offline simulator or replay framework
- clear counterfactual evaluation
- guardrails for fairness and revenue concentration

Practical Boreal use later:

- supplier load balancing over time
- positioning supply toward likely future demand
- deciding how much to reserve high-performing suppliers

## 5. Why Text Embeddings Help

Yes, text embeddings help a lot.  They are necessary, but they are not sufficient.

They help with:

- broad natural language intent
- synonyms and indirect phrasing
- cross-category analogies
- cold-start supplier recall
- retrieving similar past fulfilled intents
- clustering unresolved demand into reusable supply patterns
- deduplicating near-identical listings and spam

They do not solve:

- live availability
- hard capability gaps
- budget fit
- trust and compliance
- supplier capacity
- evidence quality

### 5.1 Best Embedding Practice For Boreal

Do not rely on one embedding per listing.

Recommended multi-view embedding set:

| Embedding | Built from | Why |
| --- | --- | --- |
| listing core embedding | title + summary + description + canonical capabilities | main recall vector |
| use-case embedding set | example intents the supplier handles well | broad-intent coverage |
| exclusions embedding | explicit "not for" cases | suppress false positives |
| evidence embedding | summarized deliverables and evidence from fulfilled work | outcome-aware recall |
| review summary embedding | summarized verified feedback themes | quality and style fit |

Recommended intent vectors:

| Embedding | Built from |
| --- | --- |
| intent core embedding | title + summary + full body |
| required capability embedding | normalized must-have capability text |
| outcome embedding | desired deliverable and acceptance criteria |
| urgency / context text embedding | business context, domain, deadline pressure |

Important:

- store normalized text used to produce the embedding
- version embeddings by model and generation recipe
- re-embed when meaningfully changed
- keep structured filters alongside vectors

## 6. Best Practices For Listings In A Broad-Intent System

If intent is broad, listings must become more structured, not less.

The best Boreal listing is a multi-view supply object with explicit examples and constraints.

### 6.1 Listing Principles

- Say what the supplier does in outcome language, not only category language.
- Include specific examples of solved problems.
- Include explicit exclusions.
- Publish real delivery constraints.
- Publish price bands or quoting rules.
- Publish response and execution latency expectations.
- Keep capability tags canonical and mapped to taxonomy nodes.
- Keep reviews attached to actual capability clusters, not just one global star number.
- Publish evidence of prior work in normalized form.

### 6.2 Listing Fields That Matter Most

These are the highest-value listing fields for matchmaking quality:

| Field | Why |
| --- | --- |
| canonical title | short primary retrieval anchor |
| structured summary | crisp description of the outcome |
| capability taxonomy nodes | strong structured recall and filter support |
| example intents | critical for broad-intent semantic coverage |
| deliverable types | connects intent to expected outputs |
| exclusions | avoids costly false positives |
| price model and range | prevents impossible matches |
| next available / concurrency | separates "good fit" from "available fit" |
| proof and evidence | supports trust and evidence fit |
| service area and timezone | reduces operational mismatch |
| freshness | stale listings should decay |
| response SLA | strong predictor of fulfillment speed |

### 6.3 Listing Anti-Patterns

- only a catchy title with no structured details
- only free-form description, no canonical capabilities
- no example use cases
- no explicit exclusions
- no price metadata
- no availability signal
- globally inflated ratings with only two reviews
- stale listings that have not been updated in months

## 7. Proposed Boreal Data Model

Current repo state already has strong starting points:

- `intents`
- `supplies`
- `proposals`
- `fulfillments`
- `activityEvents`
- `matchEvents`

The main issue is not absence of matching tables.  It is that the current `supplies` object is still too shallow for serious matchmaking.

### 7.1 Recommended Intent Shape

```ts
type MatchingIntent = {
  intentKey: string;
  title: string;
  summary: string;
  body: string;
  category: string;
  intentType: "demand" | "supply";
  requestedOutputTypes: Array<
    "text" | "image_generation" | "speech_generation" | "video_generation"
  >;
  routing: {
    resolutionTier: "auto" | "fast" | "open" | "pending";
    shouldPersistToBoard: boolean;
    shouldCreateFulfillmentRequest: boolean;
  };
  budget: {
    currency: string | null;
    min: number | null;
    max: number | null;
    type: "fixed" | "range" | "open";
  };
  schedule: {
    deadlineAt: number | null;
    urgencyScore: number;
    earliestStartAt: number | null;
    timezone: string | null;
  };
  geography: {
    mode: "remote" | "onsite" | "hybrid";
    countryCodes: string[];
    city: string | null;
  };
  capabilityNeeds: {
    required: Array<{ taxonId: string; weight: number }>;
    optional: Array<{ taxonId: string; weight: number }>;
    excluded: string[];
    freeformTags: string[];
  };
  deliverable: {
    type: string[];
    acceptanceCriteria: string[];
    evidenceRequired: string[];
  };
  embeddings: {
    core: number[];
    outcome?: number[];
    capability?: number[];
    model: string;
    recipeVersion: string;
  };
};
```

### 7.2 Recommended Supply Listing Shape

```ts
type SupplyListing = {
  supplyId: string;
  supplierUserId: string | null;
  title: string;
  description: string;
  category: string;
  supplyType: "product" | "capability" | "agent_tool" | "collective";
  status: "active" | "paused" | "suspended" | "draft";
  delivery: {
    type: "instant" | "async" | "scoped" | "recurring";
    estimatedTurnaroundHours: number | null;
    outputTypes: string[];
  };
  pricing: {
    currency: string | null;
    priceType: "fixed" | "hourly" | "scoped" | "quote";
    minPrice: number | null;
    maxPrice: number | null;
    typicalPrice: number | null;
  };
  availability: {
    status: "available" | "limited" | "unavailable";
    nextAvailableAt: number | null;
    weeklyCapacityHours: number | null;
    activeReservations: number;
    maxConcurrentJobs: number | null;
    timezone: string | null;
  };
  geography: {
    mode: "remote" | "onsite" | "hybrid";
    countryCodes: string[];
    city: string | null;
    serviceRadiusKm: number | null;
  };
  capabilities: {
    taxonomyNodes: string[];
    freeformTags: string[];
    examples: string[];
    exclusions: string[];
    toolNames: string[];
  };
  reputation: {
    trustScore: number;
    reviewCount: number;
    reviewAverage: number | null;
    acceptanceRate: number;
    fulfillmentRate: number;
    onTimeRate: number | null;
    disputeRate: number | null;
    responseRate: number | null;
    responseP50Minutes: number | null;
  };
  quality: {
    completenessScore: number;
    freshnessScore: number;
    evidenceScore: number;
    listingVersion: number;
    updatedAt: number;
  };
  routing: {
    executorUrl: string | null;
    quoteUrl: string | null;
    availabilityUrl: string | null;
    supportsReserve: boolean;
    supportsInstantExecution: boolean;
  };
  embeddings: {
    core: number[];
    exampleCentroid?: number[];
    evidenceCentroid?: number[];
    exclusions?: number[];
    model: string;
    recipeVersion: string;
  };
};
```

### 7.3 Recommended Schema Delta Against Current Convex Tables

Keep `supplies` as the canonical listing table, but add richer nested objects or adjunct tables.

Recommended additions:

| Table | Purpose |
| --- | --- |
| `capabilityTaxonomy` | canonical nodes, aliases, parents, modality, domain |
| `supplyExamples` | example intents and deliverables per supplier, embedded |
| `supplyAvailabilitySnapshots` | next available, backlog, concurrency, heartbeat |
| `supplyReservations` | temporary capacity holds for Tier 2 fast-route |
| `matchCandidates` | all evaluated candidates with stage-by-stage breakdown |
| `supplierStats` | denormalized smoothed acceptance, fulfillment, SLA metrics |
| `intentAnalogs` | historical similar fulfilled intents for training and inspection |

Recommended `matchCandidates` shape:

```ts
type MatchCandidate = {
  intentKey: string;
  supplyId: string;
  stage: "retrieved" | "feasible" | "ranked" | "notified" | "reserved";
  retrieval: {
    lexicalRank: number | null;
    vectorRank: number | null;
    analogRank: number | null;
    rrfScore: number;
  };
  features: {
    semanticFit: number;
    capabilityFit: number;
    lexicalFit: number;
    priceFit: number;
    deadlineFit: number;
    availabilityFit: number;
    trustFit: number;
    evidenceFit: number;
    freshnessFit: number;
    relationshipFit: number;
  };
  rank: {
    heuristicScore: number;
    rerankerScore: number | null;
    calibratedSuccessProb: number | null;
  };
  decisions: {
    gatedOutReasons: string[];
    notifiedAt: number | null;
    reservedAt: number | null;
  };
  createdAt: number;
};
```

## 8. Reputation And Review Modeling

Do not use raw average rating as trust.

Recommended trust model components:

- smoothed review average
- smoothed acceptance rate
- smoothed fulfillment rate
- on-time delivery rate
- evidence acceptance rate
- dispute and refund rate
- response speed
- freshness penalty
- category-specific performance

Recommended techniques:

- Bayesian smoothing for low review counts
- category-local scores in addition to global scores
- decay older events slowly
- separate demand-side and supply-side cancellations
- keep trust explainable

Example smoothing:

```text
smoothed_rate = (successes + alpha) / (trials + alpha + beta)
bayesian_rating = (prior_mean * m + observed_mean * n) / (m + n)
```

## 9. Scoring And Calibration

Use raw scores for ranking, but calibrated probabilities for thresholds.

Why:

- Tier 2 fast-route thresholds need stable meaning over time
- categories differ a lot in score distributions
- a 0.82 score from one ranker may not equal 82 percent success probability

Recommended practice:

- train ranker on fulfillment labels
- calibrate with isotonic regression or Platt scaling per major market slice
- store both `rank_score` and `success_probability`
- threshold fast-route on calibrated probability, not raw score

Suggested first thresholds:

- Tier 1 auto-deliver:
  - supplier supports instant execution
  - hard filters pass
  - calibrated success probability >= 0.90
  - price within strict budget
- Tier 2 fast-route:
  - hard filters pass
  - calibrated success probability >= 0.70
  - trust score above category floor
  - live availability positive
- Tier 3 open board:
  - some feasible candidates exist but confidence too low for direct route
- Tier 4 pending:
  - no feasible candidates

## 10. Assignment Optimizer For Scarce Supply

When multiple open intents compete for the same suppliers, ranking each intent independently is not enough.

Run a periodic optimizer on the top feasible candidates.

Recommended objective:

```text
maximize sum(x_ij * match_value_ij)
  - lambda_overload * supplier_load_penalty
  - lambda_starvation * fairness_penalty
  - lambda_deadline * lateness_risk
```

Subject to:

- each intent gets at most one reserved supplier in fast-route mode
- each supplier stays within concurrency limit
- reserved capacity cannot overlap
- special compliance constraints

Recommended algorithms:

- small one-to-one batches: Hungarian algorithm
- general capacity case: min-cost max-flow
- online fallback: greedy by calibrated value with reservation ledger

## 11. Supplier Protocol Contract

Transport protocols like A2A, UCP, MCP, and plain HTTPS matter for integration, but they do not solve matching quality.  The real requirement is a normalized supplier contract.

Every routable supplier should eventually expose:

| Operation | Purpose |
| --- | --- |
| `describeCapabilities()` | canonical capability and constraint metadata |
| `checkAvailability(intent)` | can this supplier start and finish this work |
| `quote(intent)` | budget fit and pricing logic |
| `reserveCapacity(intent)` | soft hold before fast-route assignment |
| `execute(intent)` | perform work or begin workflow |
| `submitEvidence(result)` | standardized evidence payload |
| `cancel(reservation)` | release reserved capacity |
| `heartbeat()` | liveness and health |

Minimum request contract:

```ts
type SupplierExecutionRequest = {
  intentKey: string;
  normalizedIntent: MatchingIntent;
  requestedEvidenceSchema: string[];
  responseDeadlineAt: number | null;
  idempotencyKey: string;
};
```

This lets Boreal stay protocol-agnostic internally while supporting multiple external agent ecosystems.

## 12. Reliability And Safety Requirements

The matching engine should be designed as operational infrastructure, not just relevance infrastructure.

Required protections:

- idempotent match jobs
- reservation timeouts
- stale availability expiry
- score breakdown logging for every candidate
- feature snapshot logging for model training and debugging
- shadow evaluation before changing weight sets
- per-category kill switches
- supplier health monitoring
- abuse and spam suppression
- safe fallback when vector service or reranker is degraded

Fallback order:

1. full engine
2. no high-cost reranker
3. lexical + structured only
4. board posting only

## 13. Metrics That Matter

Offline metrics:

- recall@50 for eventually successful suppliers
- NDCG@10 on accepted and fulfilled outcomes
- calibration error for fast-route probabilities
- false-positive rate on unavailable or over-budget suppliers

Online metrics:

- time-to-first-qualified-match
- proposal rate@k
- accept rate@k
- fill rate
- median time-to-fill
- cancellation rate
- evidence rejection rate
- concentration index of assignments across suppliers
- cold-start supplier exposure and conversion

Guardrail metrics:

- supplier overload rate
- stale listing exposure rate
- budget overshoot rate
- low-trust routing rate
- fairness by supplier cohort

## 14. Recommended Boreal Implementation Sequence

### Phase A: Upgrade Current MVP Without Re-Platforming

- keep Convex as source of truth
- keep current `intents`, `supplies`, and `matchEvents`
- add richer supply metadata
- add `matchCandidates`
- add vector-backed candidate retrieval outside Convex if needed
- implement BM25 plus vector plus RRF
- implement hard feasibility filters
- implement weighted heuristic scorer
- keep LLM rerank only for top 10 ambiguous candidates

### Phase B: Make Availability Real

- add availability snapshots
- add reservations and concurrency ledger
- distinguish available vs limited vs unavailable from actual capacity
- feed deadline and backlog into ranking

### Phase C: Make Ranking Learnable

- log feature snapshots and outcomes
- train LambdaMART on fulfillment labels
- calibrate fast-route probabilities
- replace fixed weights with learned reranker

### Phase D: Add Marketplace Intelligence

- add analog retrieval from prior fulfilled intents
- add contextual bandit for notification slot exploration
- add periodic batch optimizer for scarce supply
- add automatic rematch scheduler

### Phase E: Long-Horizon Optimization

- simulate marketplace dynamics
- test RL-derived long-term value features
- apply only under strong guardrails

## 15. Explicit Answers To The Main Questions

### Can text embeddings help?

Yes.  They are essential for broad intent recall, but they should sit beside lexical retrieval, structured filters, and outcome-based ranking.

### What is the best algorithm?

There is no single best algorithm.  For Boreal, the best stack is:

- candidate generation: BM25 + dense vector + RRF
- feasibility: hard filters over capability, price, deadline, geography, availability
- ranking: heuristic score now, LambdaMART later
- precision boost: top-K cross-encoder or LLM rerank
- assignment: greedy with reservations now, min-cost flow for scarce supply later
- exploration: contextual bandit for near-ties later

### Should stable matching be the core?

No.  Not for the main Boreal real-time market.

### What makes a listing highly matchable?

- strong structured metadata
- canonical capability taxonomy
- clear examples of solved intents
- explicit exclusions
- live availability
- realistic pricing
- proof and evidence
- strong response behavior
- updated, complete profile data

## 16. Research Notes

These sources most directly informed the architecture choices:

- Elastic hybrid search docs on lexical plus semantic retrieval and RRF:
  - https://www.elastic.co/docs/solutions/search/hybrid-search
- Original RRF paper:
  - https://cormack.uwaterloo.ca/cormacksigir09-rrf.pdf
- OpenAI embeddings guide and model docs:
  - https://platform.openai.com/docs/guides/embeddings
  - https://platform.openai.com/docs/models/text-embedding-3-small
  - https://help.openai.com/en/articles/6824809-embeddings-frequently-asked-questions
- Microsoft overview of RankNet, LambdaRank, and LambdaMART:
  - https://www.microsoft.com/en-us/research/publication/from-ranknet-to-lambdarank-to-lambdamart-an-overview/
- Karp-Vazirani-Vazirani on online bipartite matching:
  - https://ics.uci.edu/~vazirani/KVV.pdf
- Google Research on edge-weighted online bipartite matching:
  - https://research.google/pubs/edge-weighted-online-bipartite-matching/
- Google Research on contextual blocking bandits:
  - https://research.google/pubs/contextual-blocking-bandits/
- Uber on batched matching and long-horizon marketplace optimization:
  - https://www.uber.com/cr/en/marketplace/matching/
  - https://www.uber.com/us/en/blog/reinforcement-learning-for-modeling-marketplace-balance/
- Stanford work on online assortment optimization for two-sided matching platforms:
  - https://gsbpreserve.stanford.edu/view/25157/online-assortment-optimization-for-two-sided-matching-platforms
- Airbnb and Fiverr help pages on listing quality, price, availability, reviews, responsiveness, and personalized ranking:
  - https://www.airbnb.com/help/article/39
  - https://help.fiverr.com/hc/en-us/articles/4599361153809-Can-t-find-your-Gig

## 17. Boreal Recommendation

The right Boreal matching engine is not "AI picks the best supplier".

It is:

- protocol-agnostic internally
- hybrid at retrieval time
- strict about feasibility
- outcome-trained at ranking time
- reservation-aware at assignment time
- explainable at debug time
- data-hungry and self-improving over time

That is the path from an impressive board of requests to a real intent-to-fulfillment routing network.
