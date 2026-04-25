import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";

type MatchStage = "feasible" | "notified" | "ranked" | "reserved" | "retrieved";

type MatchingCtx = MutationCtx | QueryCtx;

type MatchingIntentInput = {
  body: string;
  budgetMax?: number;
  budgetMin?: number;
  capabilityTags?: string[];
  catalogQuery?: string;
  category?: string;
  deadlineAt?: number | null;
  embedding?: number[];
  intentId?: Id<"intents">;
  intentKey?: string;
  keywords?: string[];
  requestedOutputTypes?: Array<
    "image_generation" | "speech_generation" | "text" | "video_generation"
  >;
  summary?: string;
  title?: string;
};

type RetrievalBreakdown = {
  lexicalRank: number | null;
  rrfScore: number;
  vectorRank: number | null;
};

type FeatureBreakdown = {
  availabilityFit: number;
  capabilityFit: number;
  deadlineFit: number;
  evidenceFit: number;
  freshnessFit: number;
  lexicalFit: number;
  priceFit: number;
  relationshipFit: number;
  semanticFit: number;
  trustFit: number;
};

export type RankedSupplyMatch = {
  calibratedSuccessProb: number;
  features: FeatureBreakdown;
  gatedOutReasons: string[];
  heuristicScore: number;
  matchReasons: string[];
  retrieval: RetrievalBreakdown;
  stage: MatchStage;
  supply: Doc<"supplies">;
};

const RRF_K = 60;
const DEFAULT_LIMIT = 8;

export async function buildRankedSupplyMatches(
  ctx: MatchingCtx,
  input: MatchingIntentInput,
) {
  const queryText = buildIntentQueryText(input);
  const lexicalCandidates = queryText
    ? await ctx.db
        .query("supplies")
        .withSearchIndex("search_market", (queryBuilder) =>
          queryBuilder.search("searchText", queryText).eq("status", "active"),
        )
        .take(72)
    : [];
  const categoryCandidates = input.category
    ? await ctx.db
        .query("supplies")
        .withIndex("by_category", (queryBuilder) => queryBuilder.eq("category", input.category!))
        .take(48)
    : [];
  const trustedCandidates = await ctx.db
    .query("supplies")
    .withIndex("by_status_and_trustScore", (queryBuilder) =>
      queryBuilder.eq("status", "active"),
    )
    .order("desc")
    .take(120);
  const candidates = dedupeSupplies([
    ...lexicalCandidates,
    ...categoryCandidates,
    ...trustedCandidates,
  ]).filter((candidate) => candidate.status === "active");
  const lexicalRanks = buildRankMap(lexicalCandidates.map((candidate) => candidate._id));
  const vectorRanks = buildVectorRankMap(candidates, input.embedding);

  return candidates
    .map((supply) =>
      scoreSupplyMatch({
        intent: input,
        lexicalRank: lexicalRanks.get(supply._id) ?? null,
        supply,
        vectorRank: vectorRanks.get(supply._id) ?? null,
      }),
    )
    .sort(compareRankedMatches);
}

export async function persistIntentMatchCandidates(
  ctx: MutationCtx,
  input: MatchingIntentInput & { intentId: Id<"intents">; intentKey: string; limit?: number },
) {
  const intent = await ctx.db.get(input.intentId);

  if (!intent) {
    return { persistedCount: 0, topMatchScore: null };
  }

  const existing = await ctx.db
    .query("matchCandidates")
    .withIndex("by_intentId_and_createdAt", (queryBuilder) =>
      queryBuilder.eq("intentId", input.intentId),
    )
    .collect();

  for (const candidate of existing) {
    await ctx.db.delete(candidate._id);
  }

  const ranked = await buildRankedSupplyMatches(ctx, input);
  const limit = input.limit ?? 24;
  const now = Date.now();
  const topRankedIds = new Set(
    ranked
      .filter((candidate) => candidate.gatedOutReasons.length === 0)
      .slice(0, limit)
      .map((candidate) => candidate.supply._id),
  );

  let persistedCount = 0;

  for (const candidate of ranked.slice(0, Math.max(limit * 2, 24))) {
    const stage: MatchStage =
      candidate.gatedOutReasons.length > 0
        ? "retrieved"
        : topRankedIds.has(candidate.supply._id)
          ? "ranked"
          : "feasible";

    await ctx.db.insert("matchCandidates", {
      availabilityFit: candidate.features.availabilityFit,
      calibratedSuccessProb: candidate.calibratedSuccessProb,
      capabilityFit: candidate.features.capabilityFit,
      createdAt: now,
      deadlineFit: candidate.features.deadlineFit,
      evidenceFit: candidate.features.evidenceFit,
      freshnessFit: candidate.features.freshnessFit,
      gatedOutReasons: candidate.gatedOutReasons,
      heuristicScore: candidate.heuristicScore,
      intentId: input.intentId,
      intentKey: input.intentKey,
      lexicalFit: candidate.features.lexicalFit,
      lexicalRank: candidate.retrieval.lexicalRank ?? undefined,
      matchReasons: candidate.matchReasons,
      priceFit: candidate.features.priceFit,
      relationshipFit: candidate.features.relationshipFit,
      rrfScore: candidate.retrieval.rrfScore,
      semanticFit: candidate.features.semanticFit,
      stage,
      supplyId: candidate.supply._id,
      titleSnapshot: candidate.supply.title,
      trustFit: candidate.features.trustFit,
      updatedAt: now,
      vectorRank: candidate.retrieval.vectorRank ?? undefined,
    });
    persistedCount += 1;
  }

  await ctx.db.patch(input.intentId, {
    matchAttempts: (intent.matchAttempts ?? 0) + 1,
    updatedAt: now,
  });

  return {
    persistedCount,
    topMatchScore: ranked[0]?.heuristicScore ?? null,
  };
}

export async function getPersistedIntentMatches(
  ctx: MatchingCtx,
  input: { intentId: Id<"intents">; limit?: number },
) {
  const candidates = await ctx.db
    .query("matchCandidates")
    .withIndex("by_intentId_and_heuristicScore", (queryBuilder) =>
      queryBuilder.eq("intentId", input.intentId),
    )
    .order("desc")
    .take(input.limit ?? DEFAULT_LIMIT);

  return Promise.all(
    candidates.map(async (candidate) => {
      const supply = await ctx.db.get(candidate.supplyId);

      if (!supply) {
        return null;
      }

      return {
        calibratedSuccessProb: candidate.calibratedSuccessProb ?? clamp(candidate.heuristicScore / 100),
        features: {
          availabilityFit: candidate.availabilityFit,
          capabilityFit: candidate.capabilityFit,
          deadlineFit: candidate.deadlineFit,
          evidenceFit: candidate.evidenceFit,
          freshnessFit: candidate.freshnessFit,
          lexicalFit: candidate.lexicalFit,
          priceFit: candidate.priceFit,
          relationshipFit: candidate.relationshipFit,
          semanticFit: candidate.semanticFit,
          trustFit: candidate.trustFit,
        },
        gatedOutReasons: candidate.gatedOutReasons,
        heuristicScore: candidate.heuristicScore,
        matchReasons: candidate.matchReasons,
        retrieval: {
          lexicalRank: candidate.lexicalRank ?? null,
          rrfScore: candidate.rrfScore,
          vectorRank: candidate.vectorRank ?? null,
        },
        stage: candidate.stage,
        supply,
      } satisfies RankedSupplyMatch;
    }),
  ).then((results) => results.filter(Boolean) as RankedSupplyMatch[]);
}

function scoreSupplyMatch(input: {
  intent: MatchingIntentInput;
  lexicalRank: number | null;
  supply: Doc<"supplies">;
  vectorRank: number | null;
}) {
  const queryText = buildIntentQueryText(input.intent);
  const intentTokens = buildIntentTokens(input.intent);
  const supplyTextTokens = buildSupplyTextTokens(input.supply);
  const supplyCapabilityTokens = buildSupplyCapabilityTokens(input.supply);
  const lexicalSignals = scoreLexicalSignals(intentTokens, input.supply);
  const semanticFit = scoreSemanticFit(input.intent.embedding, input.supply.embedding, intentTokens, supplyTextTokens);
  const capabilityFit = scoreCapabilityFit(intentTokens, input.intent.requestedOutputTypes, input.supply, supplyCapabilityTokens);
  const priceFit = scorePriceFit(input.intent.budgetMin, input.intent.budgetMax, input.supply.priceAmount);
  const deadlineFit = scoreDeadlineFit(input.intent.deadlineAt, input.supply);
  const availabilityFit = scoreAvailabilityFit(input.supply);
  const trustFit = clamp(
    input.supply.trustScore / 100 * 0.7 +
      input.supply.acceptanceRate * 0.15 +
      input.supply.fulfillmentRate * 0.15,
  );
  const evidenceFit = clamp(
    (input.supply.fulfillmentRate + input.supply.acceptanceRate) / 2 * 0.7 +
      scoreEvidenceMode(input.supply.evidenceMode) * 0.3,
  );
  const freshnessFit = scoreFreshnessFit(input.supply.updatedAt);
  const relationshipFit = clamp((input.supply.matchCount ?? 0) / 20);
  const rrfScore = scoreRrf(input.lexicalRank) + scoreRrf(input.vectorRank);
  const rrfFit = clamp(rrfScore * (RRF_K + 1));
  const preliminaryHeuristicScore = clamp(
    (
      semanticFit * 0.22 +
      capabilityFit * 0.22 +
      lexicalSignals.score * 0.16 +
      priceFit * 0.1 +
      deadlineFit * 0.08 +
      availabilityFit * 0.08 +
      trustFit * 0.06 +
      evidenceFit * 0.03 +
      freshnessFit * 0.03 +
      relationshipFit * 0.01 +
      rrfFit * 0.01
    ) /
      1,
  ) * 100;
  const gatedOutReasons = getGateFailures({
    availabilityFit,
    capabilityFit,
    deadlineAt: input.intent.deadlineAt,
    exclusions: input.supply.exclusions ?? [],
    heuristicScore: preliminaryHeuristicScore,
    intentTokens,
    lexicalSignals,
    priceAmount: input.supply.priceAmount,
    budgetMax: input.intent.budgetMax,
    semanticFit,
    supply: input.supply,
  });

  const features: FeatureBreakdown = {
    availabilityFit,
    capabilityFit,
    deadlineFit,
    evidenceFit,
    freshnessFit,
    lexicalFit: lexicalSignals.score,
    priceFit,
    relationshipFit,
    semanticFit,
    trustFit,
  };
  const heuristicScore = preliminaryHeuristicScore;
  const calibratedSuccessProb = clamp(heuristicScore / 100);
  const matchReasons = buildMatchReasons({
    availabilityFit,
    capabilityFit,
    lexicalSignals,
    priceFit,
    queryText,
    rrfFit,
    supply: input.supply,
    trustFit,
  });

  return {
    calibratedSuccessProb,
    features,
    gatedOutReasons,
    heuristicScore: round2(heuristicScore),
    matchReasons,
    retrieval: {
      lexicalRank: input.lexicalRank,
      rrfScore: round4(rrfScore),
      vectorRank: input.vectorRank,
    },
    stage: gatedOutReasons.length > 0 ? ("retrieved" as const) : ("ranked" as const),
    supply: input.supply,
  } satisfies RankedSupplyMatch;
}

function getGateFailures(input: {
  availabilityFit: number;
  capabilityFit: number;
  budgetMax?: number;
  deadlineAt?: number | null;
  exclusions: string[];
  heuristicScore: number;
  intentTokens: string[];
  lexicalSignals: ReturnType<typeof scoreLexicalSignals>;
  priceAmount?: number;
  semanticFit: number;
  supply: Doc<"supplies">;
}) {
  const failures: string[] = [];

  if (input.supply.status !== "active") {
    failures.push("listing inactive");
  }

  if (input.supply.availabilityStatus === "unavailable") {
    failures.push("currently unavailable");
  }

  if (
    typeof input.supply.maxConcurrentJobs === "number" &&
    typeof input.supply.activeReservations === "number" &&
    input.supply.activeReservations >= input.supply.maxConcurrentJobs
  ) {
    failures.push("capacity exhausted");
  }

  if (
    input.deadlineAt &&
    typeof input.supply.nextAvailableAt === "number" &&
    input.supply.nextAvailableAt > input.deadlineAt
  ) {
    failures.push("misses deadline");
  }

  if (
    typeof input.budgetMax === "number" &&
    typeof input.priceAmount === "number" &&
    input.priceAmount > input.budgetMax * 1.35
  ) {
    failures.push("price exceeds budget");
  }

  const exclusionOverlap = countOverlap(
    input.intentTokens,
    input.exclusions.flatMap((value) => tokenize(value)),
  );

  if (exclusionOverlap > 0) {
    failures.push("listing exclusions conflict");
  }

  if (input.availabilityFit <= 0.15) {
    failures.push("availability too weak");
  }

  const specializedIntent = hasSpecializedIntentSignal(input.intentTokens);
  const hardEvidence =
    input.lexicalSignals.titleHits +
      input.lexicalSignals.capabilityHits +
      input.lexicalSignals.keywordHits +
      input.lexicalSignals.categoryHits +
      input.lexicalSignals.descriptionHits >
    0;

  if (
    specializedIntent &&
    !hardEvidence &&
    input.capabilityFit < 0.26 &&
    input.semanticFit < 0.18
  ) {
    failures.push("domain mismatch");
  }

  if (
    input.heuristicScore < 58 &&
    input.lexicalSignals.score < 0.18 &&
    input.capabilityFit < 0.3 &&
    input.semanticFit < 0.22
  ) {
    failures.push("confidence too low");
  }

  return Array.from(new Set(failures));
}

function buildMatchReasons(input: {
  availabilityFit: number;
  capabilityFit: number;
  lexicalSignals: ReturnType<typeof scoreLexicalSignals>;
  priceFit: number;
  queryText: string;
  rrfFit: number;
  supply: Doc<"supplies">;
  trustFit: number;
}) {
  const reasons: Array<{ label: string; score: number }> = [];

  if (input.lexicalSignals.titleHits > 0) {
    reasons.push({ label: "strong title match", score: input.lexicalSignals.titleHits * 2 });
  }

  if (input.capabilityFit >= 0.7) {
    reasons.push({ label: "capability fit", score: input.capabilityFit * 10 });
  }

  if (input.priceFit >= 0.8 && typeof input.supply.priceAmount === "number") {
    reasons.push({ label: "within budget", score: input.priceFit * 8 });
  }

  if (input.availabilityFit >= 0.8) {
    reasons.push({
      label: input.supply.deliveryType === "instant" ? "instant delivery" : "available now",
      score: input.availabilityFit * 7,
    });
  }

  if (input.trustFit >= 0.78) {
    reasons.push({ label: "strong track record", score: input.trustFit * 6 });
  }

  if (input.rrfFit >= 0.45) {
    reasons.push({ label: "retrieval confidence", score: input.rrfFit * 5 });
  }

  if (input.supply.supportsDirectInvoke) {
    reasons.push({ label: "direct invoke ready", score: 4.5 });
  }

  if (
    input.queryText.toLowerCase().includes("product") &&
    input.supply.supplyType === "product"
  ) {
    reasons.push({ label: "product listing", score: 4 });
  }

  return reasons
    .sort((left, right) => right.score - left.score)
    .slice(0, 4)
    .map((reason) => reason.label);
}

function scoreLexicalSignals(
  intentTokens: string[],
  supply: Doc<"supplies">,
) {
  const titleTokens = tokenize(supply.title);
  const subtitleTokens = tokenize(supply.subtitle ?? "");
  const descriptionTokens = tokenize(supply.description);
  const categoryTokens = tokenize(supply.category);
  const keywordTokens = (supply.keywords ?? []).flatMap((value) => tokenize(value));
  const capabilityTokens = (supply.capabilityTags ?? []).flatMap((value) => tokenize(value));
  const titleHits = countOverlap(intentTokens, titleTokens);
  const capabilityHits = countOverlap(intentTokens, capabilityTokens);
  const keywordHits = countOverlap(intentTokens, keywordTokens);
  const categoryHits = countOverlap(intentTokens, categoryTokens);
  const descriptionHits =
    countOverlap(intentTokens, subtitleTokens) + countOverlap(intentTokens, descriptionTokens);
  const score = clamp(
    (titleHits * 2 + capabilityHits * 1.5 + keywordHits + categoryHits + descriptionHits * 0.5) /
      Math.max(intentTokens.length * 1.8, 1),
  );

  return {
    capabilityHits,
    categoryHits,
    descriptionHits,
    keywordHits,
    score,
    titleHits,
  };
}

function scoreSemanticFit(
  intentEmbedding: number[] | undefined,
  supplyEmbedding: number[],
  intentTokens: string[],
  supplyTokens: string[],
) {
  const cosine = cosineSimilarity(intentEmbedding, supplyEmbedding);

  if (cosine !== null) {
    return clamp((cosine + 1) / 2);
  }

  return clamp(jaccard(intentTokens, supplyTokens) * 1.2);
}

function scoreCapabilityFit(
  intentTokens: string[],
  requestedOutputTypes: MatchingIntentInput["requestedOutputTypes"],
  supply: Doc<"supplies">,
  supplyCapabilityTokens: string[],
) {
  const overlap = clamp(
    countOverlap(intentTokens, supplyCapabilityTokens) /
      Math.max(Math.min(intentTokens.length, 8), 1),
  );
  const modalityFit = scoreModalityFit(requestedOutputTypes, supply);

  return clamp(overlap * 0.88 + modalityFit * 0.12);
}

function scoreModalityFit(
  requestedOutputTypes: MatchingIntentInput["requestedOutputTypes"],
  supply: Doc<"supplies">,
) {
  if (!requestedOutputTypes || requestedOutputTypes.length === 0) {
    return 0.35;
  }

  const mappedSupplyOutputs =
    supply.outputTypes?.map(normalizeOutputTypeToken) ??
    inferSupplyOutputsFromListing(supply).map(normalizeOutputTypeToken);
  const requested = requestedOutputTypes.map(normalizeOutputTypeToken);
  const textOnly = requested.length === 1 && requested[0] === "text";

  if (textOnly) {
    return mappedSupplyOutputs.includes("text") ? 0.35 : 0.1;
  }

  const overlap = requested.filter((output) => mappedSupplyOutputs.includes(output)).length;

  return clamp(overlap / requested.length || 0.2);
}

function scorePriceFit(
  budgetMin: number | undefined,
  budgetMax: number | undefined,
  priceAmount: number | undefined,
) {
  if (typeof priceAmount !== "number") {
    return 0.55;
  }

  if (typeof budgetMin !== "number" && typeof budgetMax !== "number") {
    return 0.7;
  }

  if (typeof budgetMax === "number" && priceAmount <= budgetMax) {
    if (typeof budgetMin === "number" && priceAmount < budgetMin) {
      return 0.72;
    }

    return 1;
  }

  if (typeof budgetMax === "number") {
    const overshoot = (priceAmount - budgetMax) / Math.max(budgetMax, 1);
    return clamp(1 - overshoot * 1.8);
  }

  return 0.7;
}

function scoreDeadlineFit(deadlineAt: number | null | undefined, supply: Doc<"supplies">) {
  if (!deadlineAt) {
    return supply.deliveryType === "instant" ? 0.92 : 0.68;
  }

  const now = Date.now();
  const availableAt = supply.nextAvailableAt ?? now;
  const estimatedHours = estimateDeliveryHours(supply);
  const projectedFinish = availableAt + estimatedHours * 60 * 60 * 1000;

  if (projectedFinish <= deadlineAt) {
    return 1;
  }

  const latenessHours = (projectedFinish - deadlineAt) / (1000 * 60 * 60);
  return clamp(1 - latenessHours / 72);
}

function scoreAvailabilityFit(supply: Doc<"supplies">) {
  const statusBase =
    supply.availabilityStatus === "unavailable"
      ? 0.05
      : supply.availabilityStatus === "limited"
        ? 0.55
        : 0.92;
  const capacityPenalty =
    typeof supply.maxConcurrentJobs === "number" &&
    typeof supply.activeReservations === "number" &&
    supply.maxConcurrentJobs > 0
      ? clamp(1 - supply.activeReservations / supply.maxConcurrentJobs)
      : 0.8;

  return clamp(statusBase * 0.75 + capacityPenalty * 0.25);
}

function scoreFreshnessFit(updatedAt: number | undefined) {
  if (!updatedAt) {
    return 0.55;
  }

  const ageDays = (Date.now() - updatedAt) / (1000 * 60 * 60 * 24);

  if (ageDays <= 7) {
    return 1;
  }

  if (ageDays <= 30) {
    return 0.8;
  }

  if (ageDays <= 90) {
    return 0.6;
  }

  return 0.38;
}

function scoreEvidenceMode(mode: Doc<"supplies">["evidenceMode"]) {
  switch (mode) {
    case "receipt":
      return 1;
    case "response":
      return 0.8;
    case "none":
      return 0.45;
    default:
      return 0.6;
  }
}

function buildIntentQueryText(intent: MatchingIntentInput) {
  return [
    intent.catalogQuery,
    intent.title,
    intent.summary,
    intent.body,
    ...(intent.keywords ?? []),
    ...(intent.capabilityTags ?? []),
    ...(intent.requestedOutputTypes ?? []).map(normalizeOutputTypeToken),
  ]
    .filter(Boolean)
    .join(" ")
    .trim();
}

function buildIntentTokens(intent: MatchingIntentInput) {
  return Array.from(
    new Set(
      [
        ...tokenize(buildIntentQueryText(intent)),
        ...(intent.keywords ?? []).flatMap((value) => tokenize(value)),
        ...(intent.capabilityTags ?? []).flatMap((value) => tokenize(value)),
      ].filter(Boolean),
    ),
  ).slice(0, 64);
}

function buildSupplyTextTokens(supply: Doc<"supplies">) {
  return Array.from(
    new Set(
      [
        ...tokenize(supply.title),
        ...tokenize(supply.subtitle ?? ""),
        ...tokenize(supply.description),
        ...tokenize(supply.category),
        ...(supply.keywords ?? []).flatMap((value) => tokenize(value)),
        ...(supply.capabilityTags ?? []).flatMap((value) => tokenize(value)),
        ...(supply.exampleIntents ?? []).flatMap((value) => tokenize(value)),
      ],
    ),
  );
}

function buildSupplyCapabilityTokens(supply: Doc<"supplies">) {
  return Array.from(
    new Set(
      [
        ...(supply.capabilityTags ?? []).flatMap((value) => tokenize(value)),
        ...(supply.keywords ?? []).flatMap((value) => tokenize(value)),
        ...(supply.outputTypes ?? []).flatMap((value) => tokenize(normalizeOutputTypeToken(value))),
      ],
    ),
  );
}

function inferSupplyOutputsFromListing(supply: Doc<"supplies">) {
  const tags = `${supply.title} ${supply.subtitle ?? ""} ${supply.description} ${supply.capabilityTags.join(" ")}`.toLowerCase();

  if (tags.includes("image")) {
    return ["image_generation"];
  }

  if (tags.includes("voice") || tags.includes("audio") || tags.includes("speech")) {
    return ["speech_generation"];
  }

  if (tags.includes("video")) {
    return ["video_generation"];
  }

  return ["text"];
}

function normalizeOutputTypeToken(value: string) {
  if (value === "speech_generation") {
    return "speech";
  }

  if (value === "image_generation") {
    return "image";
  }

  if (value === "video_generation") {
    return "video";
  }

  return value.replaceAll("_generation", "").replaceAll("_", " ");
}

function buildRankMap(ids: string[]) {
  return new Map(ids.map((id, index) => [id, index + 1]));
}

function buildVectorRankMap(candidates: Doc<"supplies">[], intentEmbedding?: number[]) {
  if (!intentEmbedding || intentEmbedding.length === 0) {
    return new Map<string, number>();
  }

  return new Map(
    candidates
      .map((candidate) => ({
        id: candidate._id,
        score: cosineSimilarity(intentEmbedding, candidate.embedding),
      }))
      .filter((candidate) => candidate.score !== null && candidate.score > 0)
      .sort((left, right) => (right.score ?? 0) - (left.score ?? 0))
      .map((candidate, index) => [candidate.id, index + 1]),
  );
}

function compareRankedMatches(left: RankedSupplyMatch, right: RankedSupplyMatch) {
  const leftGated = left.gatedOutReasons.length > 0;
  const rightGated = right.gatedOutReasons.length > 0;

  if (leftGated !== rightGated) {
    return leftGated ? 1 : -1;
  }

  return (
    right.heuristicScore - left.heuristicScore ||
    right.retrieval.rrfScore - left.retrieval.rrfScore ||
    right.supply.trustScore - left.supply.trustScore
  );
}

function dedupeSupplies(supplies: Doc<"supplies">[]) {
  const seen = new Map<string, Doc<"supplies">>();

  for (const supply of supplies) {
    if (!seen.has(supply._id)) {
      seen.set(supply._id, supply);
    }
  }

  return Array.from(seen.values());
}

function tokenize(value: string) {
  return value
    .toLowerCase()
    .split(/[^a-z0-9-]+/i)
    .filter((token) => token.length > 2 && !MATCH_STOPWORDS.has(token))
    .slice(0, 96);
}

const MATCH_STOPWORDS = new Set([
  "about",
  "anyone",
  "build",
  "can",
  "create",
  "explain",
  "for",
  "from",
  "help",
  "helped",
  "helping",
  "helps",
  "how",
  "make",
  "needed",
  "need",
  "someone",
  "that",
  "the",
  "this",
  "tutorial",
  "want",
  "week",
  "with",
  "write",
]);

function hasSpecializedIntentSignal(tokens: string[]) {
  return tokens.some((token) => token.length >= 5);
}

function countOverlap(source: string[], target: string[]) {
  const targetSet = new Set(target);
  return source.filter((token) => targetSet.has(token)).length;
}

function jaccard(left: string[], right: string[]) {
  if (left.length === 0 || right.length === 0) {
    return 0;
  }

  const leftSet = new Set(left);
  const rightSet = new Set(right);
  let intersection = 0;

  for (const token of leftSet) {
    if (rightSet.has(token)) {
      intersection += 1;
    }
  }

  return intersection / Math.max(leftSet.size + rightSet.size - intersection, 1);
}

function cosineSimilarity(left?: number[], right?: number[]) {
  if (!left || !right || left.length === 0 || right.length === 0 || left.length !== right.length) {
    return null;
  }

  let dot = 0;
  let leftMagnitude = 0;
  let rightMagnitude = 0;

  for (let index = 0; index < left.length; index += 1) {
    const leftValue = left[index] ?? 0;
    const rightValue = right[index] ?? 0;
    dot += leftValue * rightValue;
    leftMagnitude += leftValue * leftValue;
    rightMagnitude += rightValue * rightValue;
  }

  const denominator = Math.sqrt(leftMagnitude) * Math.sqrt(rightMagnitude);

  if (denominator === 0) {
    return null;
  }

  return dot / denominator;
}

function scoreRrf(rank: number | null) {
  if (!rank) {
    return 0;
  }

  return 1 / (RRF_K + rank);
}

function estimateDeliveryHours(supply: Doc<"supplies">) {
  if (supply.deliveryType === "instant") {
    return 1;
  }

  const label = supply.estimatedDeliveryLabel?.toLowerCase() ?? "";
  const numberMatch = label.match(/(\d+(?:\.\d+)?)/);
  const value = numberMatch ? Number(numberMatch[1]) : null;

  if (value !== null) {
    if (label.includes("week")) {
      return value * 24 * 7;
    }

    if (label.includes("day")) {
      return value * 24;
    }

    if (label.includes("hour")) {
      return value;
    }
  }

  return supply.deliveryType === "scheduled" ? 24 * 7 : 24 * 3;
}

function clamp(value: number) {
  return Math.max(0, Math.min(1, value));
}

function round2(value: number) {
  return Math.round(value * 100) / 100;
}

function round4(value: number) {
  return Math.round(value * 10000) / 10000;
}
