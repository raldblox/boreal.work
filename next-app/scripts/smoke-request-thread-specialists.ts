import assert from "node:assert/strict";

import {
  buildDirectSpecialistThreadGreeting,
  buildInitialInteractiveFollowUpQuestion,
  isGreetingLikeThreadMessage,
  isInteractiveRequestAgentKey,
  planInteractiveRequestThread,
} from "../lib/boreal/agents/request-thread-specialists.ts";
import { isVideoProviderAccessUnavailableError } from "../lib/boreal/request-route-errors.ts";
import type { RequestDetail } from "../lib/boreal/integrations/convex/function-refs.ts";
import { createPublicRequestToken } from "../lib/boreal/one-inbox/tokens.ts";

const now = Date.now();

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

console.log(
  JSON.stringify(
    {
      initialHandoff: initialPlan?.kind,
      interactiveAgent: initialPlan?.agent.key,
      greetingHandled: true,
      videoProviderErrorDetected: true,
      followUpExecution: executionPlan?.kind,
    },
    null,
    2,
  ),
);
