import assert from "node:assert/strict";

import { directExecutionAgents } from "../agents/index.ts";
import {
  canAutoConfirmProviderSelection,
  resolvePromptPresetTeamDefinition,
} from "../lib/boreal/routing/chat-route-helpers.ts";
import {
  buildDirectSpecialistThreadGreeting,
  buildInitialInteractiveFollowUpQuestion,
  isGreetingLikeThreadMessage,
  isInteractiveRequestAgentKey,
  planInteractiveRequestThread,
} from "../lib/boreal/agents/request-thread-specialists.ts";
import {
  buildSpecialistPaymentWorkspace,
  buildTrackedPresetTeamRouteOption,
  buildTrackedSpecialistRouteOption,
} from "../lib/boreal/provider-routing/tracked-request-payment.ts";
import {
  buildTrackedProviderSelectionStateFromSession,
  serializeTrackedProviderSelectionSnapshot,
  SPECIALIST_FUNDED_START_USDC_AMOUNT,
} from "../lib/boreal/provider-routing/tracked-request-selection.ts";
import { isVideoProviderAccessUnavailableError } from "../lib/boreal/request-route-errors.ts";
import type { RequestDetail } from "../lib/boreal/integrations/convex/function-refs.ts";
import { createPublicRequestToken } from "../lib/boreal/one-inbox/tokens.ts";
import type { OneRequestRoutePlan } from "../lib/boreal/one-request/types.ts";
import { getPresetTeamDefinition } from "../lib/boreal/swarm/preset-teams.ts";

const now = Date.now();
process.env.BOREAL_ONE_REQUEST_PAYTO_SOLANA_MAINNET =
  process.env.BOREAL_ONE_REQUEST_PAYTO_SOLANA_MAINNET ||
  "11111111111111111111111111111111";

const baseDetail: RequestDetail = {
  access: {
    canApproveProposals: true,
    canSubmitProposal: false,
    canSubmitWork: false,
    canViewChat: true,
    isOwner: true,
    visibility: "private",
  },
  activity: [],
  artifact: null,
  assignment: {
    agent: "Startup Pressure Test",
    provider: "boreal-agent",
    runtimeSupplyIds: [],
    team: null,
    tools: ["startup-pressure-test"],
  },
  catalogItems: [],
  collectiveTrust: null,
  contributions: [],
  conversationId: "smoke-thread-conversation",
  fulfillment: null,
  intent: {
    _creationTime: now,
    _id: "smoke-intent",
    approvedAt: now,
    body: "Can you help me pressure test my agentic commerce idea?",
    cancelledAt: null,
    catalogQuery: "startup pressure test",
    category: "advisory",
    closedReason: null,
    classification: {
      candidatePool: {
        actorKinds: ["agent", "tool"],
        deliveryTypes: ["async"],
        fulfillmentKinds: ["digital", "service", "hybrid"],
        requiresCartEnabled: false,
        requiresDirectInvoke: true,
        requiresSourceProvider: false,
        supplyTypes: ["capability", "agent_tool"],
      },
      executionKind: "async_agent",
      matchingMode: "catalog",
      paymentMode: "x402_prepay",
      routeFamily: "custom_work",
    },
    completedAt: null,
    confidence: 0.9,
    matchAttempts: 1,
    missingDetails: [],
    needsClarification: false,
    pinnedSupplyIds: [],
    provider: "boreal-agent",
    requestToken: createPublicRequestToken("smoke-intent"),
    requestedOutputTypes: ["text"],
    resolutionTier: "auto",
    responseInstructions: "",
    reviewPending: false,
    routeTarget: "general_assistance",
    shouldSearchCatalog: true,
    startedAt: now,
    status: "claimed",
    suggestedReplies: [],
    summary: "Need a startup pressure test.",
    title: "Pressure test this startup idea",
    videoSeconds: "8",
    videoSize: "1280x720",
  },
  matchCandidates: [],
  messages: [
    {
      _id: "owner-request",
      body: "Can you help me pressure test my agentic commerce idea?",
      createdAt: now,
      role: "user",
      sender: {
        actorKind: "human",
        displayName: "Owner",
        externalId: "owner",
        handle: "owner",
        isCurrentUser: true,
        profileId: null,
      },
    },
  ],
  pendingPayment: null,
  participants: [],
  proposals: [],
  receipts: [],
  review: null,
};

const initialPlan = planInteractiveRequestThread(baseDetail);

assert.ok(initialPlan, "expected startup request thread to hand off");
assert.equal(initialPlan?.kind, "ask");
assert.equal(initialPlan?.agent.key, "startup-pressure-test");
assert.match(
  initialPlan?.assistantMessage ?? "",
  /startup pressure test here/i,
);

const followUpDetail: RequestDetail = {
  ...baseDetail,
  messages: [
    ...baseDetail.messages,
    {
      _id: "agent-follow-up",
      body: buildInitialInteractiveFollowUpQuestion("startup-pressure-test"),
      createdAt: now + 1,
      role: "assistant",
      sender: {
        actorKind: "agent",
        displayName: "Startup Pressure Test",
        externalId: "agent:startup-pressure-test",
        handle: "startup-pressure-test",
        isCurrentUser: false,
        profileId: null,
      },
    },
    {
      _id: "owner-follow-up",
      body: "It is a request-native commerce network for agents and service providers. Small teams send one request, Boreal routes the work, and we take a fee when the work is fulfilled. The pain is fragmented coordination and no clean way to get paid across agent and human supply.",
      createdAt: now + 2,
      role: "user",
      sender: {
        actorKind: "human",
        displayName: "Owner",
        externalId: "owner",
        handle: "owner",
        isCurrentUser: true,
        profileId: null,
      },
    },
  ],
};

const executionPlan = planInteractiveRequestThread(followUpDetail);

assert.ok(executionPlan, "expected follow-up reply to continue");
assert.equal(executionPlan?.kind, "execute");
assert.equal(executionPlan?.agent.key, "startup-pressure-test");
assert.match(
  `${(executionPlan?.kind === "execute" && executionPlan.payload.idea) || ""}`,
  /request-native commerce network/i,
);

assert.equal(isInteractiveRequestAgentKey("startup-pressure-test"), true);
assert.equal(isInteractiveRequestAgentKey("motion-video-studio"), false);
assert.equal(isGreetingLikeThreadMessage("hi"), true);
assert.equal(isGreetingLikeThreadMessage("what is solana"), false);
assert.match(
  buildDirectSpecialistThreadGreeting({
    agentDisplayName: "Solana Operator",
    agentKey: "solana-operator",
  }),
  /solana task or question/i,
);
assert.equal(
  isVideoProviderAccessUnavailableError(
    "OpenAI video route is unavailable for the current project or API key.",
  ),
  true,
);

const startupPressureTest = directExecutionAgents.find(
  (agent) => agent.key === "startup-pressure-test",
);
assert.ok(startupPressureTest, "expected startup specialist definition");

const specialistRoutePlan: OneRequestRoutePlan = {
  category: "advisory",
  currency: "USDC",
  estimatedMinutes: 3,
  networkKey: "solana:mainnet",
  paymentProtocol: "x402",
  routeTarget: "general_assistance",
  selected: [
    {
      agent: startupPressureTest,
      outputKinds: ["text"],
      quoteUsd: startupPressureTest.settlement?.autoQuoteUsd ?? 0,
      score: 99,
    },
  ],
  summary: "Mounted route locked to Startup Pressure Test.",
  title: "Pressure test this startup idea",
  totalQuoteUsd: startupPressureTest.settlement?.autoQuoteUsd ?? 0,
};

const specialistRoute = buildTrackedSpecialistRouteOption(specialistRoutePlan);
assert.equal(specialistRoute.pricingPolicy.kind, "flat-usdc");
assert.equal(
  specialistRoute.pricingPolicy.amount,
  SPECIALIST_FUNDED_START_USDC_AMOUNT,
);
assert.equal(specialistRoute.pricingPolicy.currency, "USDC");
assert.equal(specialistRoute.priceLabel, "0.01 USDC");
assert.equal(specialistRoute.paymentProtocol, "x402");
assert.equal(specialistRoute.requiresPayment, true);
assert.match(specialistRoute.subtitle, /starts after funding/i);

const debateAndVerdict = getPresetTeamDefinition("debate-and-verdict");
assert.ok(debateAndVerdict, "expected preset team definition");

const presetTeamRoute = buildTrackedPresetTeamRouteOption(debateAndVerdict);
assert.equal(presetTeamRoute.pricingPolicy.kind, "flat-usdc");
assert.equal(
  presetTeamRoute.pricingPolicy.amount,
  SPECIALIST_FUNDED_START_USDC_AMOUNT,
);
assert.equal(presetTeamRoute.pricingPolicy.currency, "USDC");
assert.equal(presetTeamRoute.priceLabel, "0.01 USDC");
assert.equal(presetTeamRoute.executionSurface, "sdk");
assert.equal(presetTeamRoute.paymentProtocol, "x402");
assert.equal(
  presetTeamRoute.sourceCapabilityId,
  "preset-team:debate-and-verdict",
);
assert.equal(
  canAutoConfirmProviderSelection({
    defaultRouteKey: "openai-by-boreal",
    options: [
      {
        accessLabel: "Free access",
        company: "openai",
        deliveryMode: "boreal-hosted",
        displayTitle: "OpenAI by Boreal",
        executionSurface: "http",
        fallbackOrder: 0,
        isDefault: true,
        networkHints: ["solana:mainnet"],
        paymentProtocol: "none",
        priceLabel: "Free",
        pricingPolicy: { kind: "free" },
        providerKey: "boreal",
        quote: null,
        receiptExpectation: {
          requiresSignedMessage: true,
          requiresTxHash: true,
          requiresVerification: true,
        },
        requiresPayment: false,
        routeKey: "openai-by-boreal",
        sourceCapabilityId: "boreal:openai-default",
        sourceProviderKey: null,
        subtitle: "Boreal-hosted default lane for fast text work.",
        supportsDirectInvoke: true,
      },
    ],
    preparedAt: now,
    promptHash: "smoke-hash",
    promptText: "hello world",
    rateLimitReason: null,
    selectedRouteKey: "openai-by-boreal",
  }),
  true,
  "single free Boreal route should auto-confirm instead of showing the provider picker",
);
assert.equal(
  resolvePromptPresetTeamDefinition({
    message: "debate: solana vs ethereum",
    summary: "Comparative debate ending with a judge verdict.",
  })?.key,
  "debate-and-verdict",
  "debate-prefixed prompts should resolve to Debate and Verdict",
);

const specialistSelection = buildTrackedProviderSelectionStateFromSession({
  lockedAt: now,
  message: "Pressure test this startup idea",
  networkKey: "solana:mainnet",
  quoteAmount: SPECIALIST_FUNDED_START_USDC_AMOUNT,
  quoteAuthorizationMessage: "Authorize 0.01 USDC for this Boreal request.",
  quoteExpiresAt: now + 15 * 60 * 1000,
  quoteToken: "quote_smoke_specialist",
  requestFingerprint: "fingerprint_smoke_specialist",
  requestToken: "req_smoke_specialist",
  routeJson: serializeTrackedProviderSelectionSnapshot({
    company: specialistRoute.company,
    deliveryMode: specialistRoute.deliveryMode,
    displayTitle: specialistRoute.displayTitle,
    executionSurface: specialistRoute.executionSurface,
    fallbackOrder: specialistRoute.fallbackOrder,
    networkHints: specialistRoute.networkHints,
    paymentProtocol: specialistRoute.paymentProtocol,
    pricingPolicy: specialistRoute.pricingPolicy,
    providerKey: specialistRoute.providerKey,
    receiptExpectation: specialistRoute.receiptExpectation,
    requiresPayment: specialistRoute.requiresPayment,
    routeKey: specialistRoute.routeKey,
    sourceCapabilityId: specialistRoute.sourceCapabilityId ?? null,
    sourceProviderKey: specialistRoute.sourceProviderKey ?? null,
    subtitle: specialistRoute.subtitle,
    supportsDirectInvoke: specialistRoute.supportsDirectInvoke,
  }),
});
assert.ok(specialistSelection, "expected locked specialist selection");
assert.equal(specialistSelection?.options[0]?.quote?.currency, "USDC");
assert.equal(specialistSelection?.options[0]?.quote?.payToAsset, "USDC");
assert.ok(
  specialistSelection?.options[0]?.quote?.payToMintAddress,
  "expected seller USDC mint metadata",
);
assert.ok(
  specialistSelection?.options[0]?.quote?.payToTokenAccountAddress,
  "expected seller USDC destination token account metadata",
);

const paymentWorkspace = buildSpecialistPaymentWorkspace({
  selection: specialistSelection!,
});
assert.equal(paymentWorkspace.kind, "provider_selection");
assert.match(paymentWorkspace.subtitle, /0\.01 USDC is required/i);
assert.match(paymentWorkspace.subtitle, /verified Solana transaction/i);

console.log(
  JSON.stringify(
    {
      fundedPresetTeamPrice: presetTeamRoute.priceLabel,
      fundedSpecialistPrice: specialistRoute.priceLabel,
      initialHandoff: initialPlan?.kind,
      interactiveAgent: initialPlan?.agent.key,
      paymentWorkspaceConfirmed: true,
      providerAutoConfirm: true,
      presetDebateDetected: true,
      greetingHandled: true,
      videoProviderErrorDetected: true,
      followUpExecution: executionPlan?.kind,
    },
    null,
    2,
  ),
);
