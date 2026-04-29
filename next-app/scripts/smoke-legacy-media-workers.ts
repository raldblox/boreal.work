import assert from "node:assert/strict";

import {
  buildLegacyMediaDirectExecutionPayload,
  hasPendingQueuedArtifact,
  maybeRunDirectArtifactDelivery,
  toAgentArtifactDelivery,
} from "../agents/shared/runtime.ts";
import type { RequestDetail } from "../lib/boreal/integrations/convex/function-refs.ts";
import type {
  AgentExecutionResult,
  AutonomousAgentDefinition,
} from "../agents/shared/types.ts";

const now = Date.now();

const baseDetail: RequestDetail = {
  access: {
    canApproveProposals: false,
    canSubmitProposal: false,
    canSubmitWork: true,
    canViewChat: true,
    isOwner: false,
    visibility: "private",
  },
  activity: [],
  artifact: null,
  assignment: {
    agent: "Voiceover Studio",
    provider: "boreal-agent",
    runtimeSupplyIds: [],
    team: null,
    tools: ["voiceover-studio"],
  },
  catalogItems: [],
  collectiveTrust: null,
  contributions: [],
  conversationId: "smoke-legacy-media-workers",
  fulfillment: null,
  intent: {
    _creationTime: now,
    _id: "smoke-intent",
    approvedAt: now,
    body: "Turn this into a calm product voiceover about Boreal request-native commerce.",
    cancelledAt: null,
    catalogQuery: "",
    category: "audio",
    closedReason: null,
    classification: {
      candidatePool: {
        actorKinds: ["agent", "tool"],
        deliveryTypes: ["instant"],
        fulfillmentKinds: ["digital"],
        requiresCartEnabled: false,
        requiresDirectInvoke: true,
        requiresSourceProvider: false,
        supplyTypes: ["agent_tool"],
      },
      executionKind: "direct_tool",
      matchingMode: "catalog",
      paymentMode: "x402_prepay",
      routeFamily: "direct_generation",
    },
    completedAt: null,
    confidence: 0.98,
    matchAttempts: 1,
    missingDetails: [],
    needsClarification: false,
    pinnedSupplyIds: [],
    provider: "boreal-agent",
    requestedOutputTypes: ["speech_generation"],
    resolutionTier: "auto",
    responseInstructions: "Calm, clear, slightly brisk delivery.",
    reviewPending: false,
    routeTarget: "speech_generation",
    shouldSearchCatalog: false,
    startedAt: now,
    status: "claimed",
    suggestedReplies: [],
    summary: "Need a spoken version of the product statement.",
    title: "Boreal launch voiceover",
    videoSeconds: "8",
    videoSize: "1280x720",
  },
  matchCandidates: [],
  messages: [],
  participants: [],
  proposals: [],
  review: null,
};

function createDirectAgent(
  key: string,
  result: AgentExecutionResult,
  outputKinds: NonNullable<AutonomousAgentDefinition["directExecution"]>["outputKinds"],
): AutonomousAgentDefinition {
  return {
    buildDelivery: async () => ({
      deliverablesBody: "legacy markdown fallback",
      deliverablesType: "markdown",
    }),
    buildProposal: () => ({
      currency: "USD",
      deliverablesBody: "proposal",
      etaAt: now,
      price: 0.01,
    }),
    directExecution: {
      auth: "x-session",
      description: `${key} direct execution`,
      exampleRequest: {},
      fields: [],
      invoke: async () => result,
      outputKinds,
      routePath: `/api/agents/${key}/execute`,
      version: "boreal-agent-registry/v1",
    },
    identity: {
      actorKind: "agent",
      displayName: key,
      externalId: `agent:${key}`,
      handle: key,
    },
    key,
    match: () => 100,
    profile: {
      availabilityStatus: "available",
      bio: `${key} bio`,
      capabilityTags: [],
      headline: `${key} headline`,
      isPublic: true,
      productLabels: [],
      skillTags: [],
    },
    settlement: {
      autoQuoteUsd: 0.01,
      chainFamily: "solana",
      environment: "mainnet",
      networkKey: "solana:mainnet",
      payerSources: ["openwallet"],
      payoutAddress: "CxkLjW31HqX4Mp7JuDmSRBxEALqbnj8HWHn48FRWD4yS",
      walletAddress: "CxkLjW31HqX4Mp7JuDmSRBxEALqbnj8HWHn48FRWD4yS",
    },
    supplyEntry: {
      capabilityTags: [],
      category: "design",
      deliveryType: "instant",
      description: `${key} description`,
      priceAmount: 0,
      priceType: "fixed",
      supplyType: "agent_tool",
      title: key,
    },
  };
}

async function main() {
  const imagePayload = buildLegacyMediaDirectExecutionPayload({
    agentKey: "image-studio",
    detail: {
      body: "Create an aurora-lit Boreal hero image.",
      responseInstructions: "",
      summary: "Need a launch hero visual.",
      title: "Boreal hero image",
      videoSeconds: "8",
      videoSize: "1280x720",
    },
  });
  assert.match(String(imagePayload.prompt), /Boreal hero image/);

  const voicePayload = buildLegacyMediaDirectExecutionPayload({
    agentKey: "voiceover-studio",
    detail: {
      body: "Read this like a crisp product launch voiceover.",
      responseInstructions: "Warm, clear, direct.",
      summary: "Need a narrated product statement.",
      title: "Boreal launch voiceover",
      videoSeconds: "8",
      videoSize: "1280x720",
    },
  });
  assert.equal(voicePayload.instructions, "Warm, clear, direct.");
  assert.match(String(voicePayload.text), /crisp product launch voiceover/i);

  const videoPayload = buildLegacyMediaDirectExecutionPayload({
    agentKey: "motion-video-studio",
    detail: {
      body: "Create a cinematic promo shot for Boreal.",
      responseInstructions: "",
      summary: "Need a short promo shot.",
      title: "Boreal promo video",
      videoSeconds: "12",
      videoSize: "1792x1024",
    },
  });
  assert.equal(videoPayload.seconds, "12");
  assert.equal(videoPayload.size, "1792x1024");

  const audioDelivery = toAgentArtifactDelivery({
    base64: "ZmFrZQ==",
    format: "mp3",
    kind: "speech_generation",
    mediaType: "audio/mpeg",
    title: "Voiceover artifact",
    transcript: "Boreal transcript",
    voice: "alloy",
  });
  assert.equal(audioDelivery?.artifact.kind, "audio");
  assert.match(audioDelivery?.deliverablesBody ?? "", /audio artifact is attached/i);

  const imageDelivery = await maybeRunDirectArtifactDelivery({
    agent: createDirectAgent(
      "image-studio",
      {
        base64: "ZmFrZQ==",
        kind: "image_generation",
        mediaType: "image/png",
        prompt: "Boreal hero image",
        title: "Hero image",
      },
      ["image_generation"],
    ),
    detail: {
      ...baseDetail,
      intent: {
        ...baseDetail.intent!,
        body: "Create an aurora-lit Boreal hero image.",
        requestedOutputTypes: ["image_generation"],
        routeTarget: "image_generation",
        summary: "Need a launch hero visual.",
        title: "Boreal hero image",
      },
    },
    modelId: "gpt-4.1-mini",
  });
  assert.equal(imageDelivery?.artifact.kind, "image");
  assert.match(imageDelivery?.deliverablesBody ?? "", /image asset delivered/i);

  const voiceDelivery = await maybeRunDirectArtifactDelivery({
    agent: createDirectAgent(
      "voiceover-studio",
      {
        base64: "ZmFrZQ==",
        format: "mp3",
        kind: "speech_generation",
        mediaType: "audio/mpeg",
        title: "Voiceover artifact",
        transcript: "Boreal transcript",
        voice: "alloy",
      },
      ["speech_generation"],
    ),
    detail: baseDetail,
    modelId: "gpt-4.1-mini",
  });
  assert.equal(voiceDelivery?.artifact.kind, "audio");
  assert.match(voiceDelivery?.deliverablesBody ?? "", /voiceover delivered/i);

  const videoDelivery = await maybeRunDirectArtifactDelivery({
    agent: createDirectAgent(
      "motion-video-studio",
      {
        jobId: "video-job-1",
        kind: "video_generation",
        model: "sora-2",
        progress: 0,
        prompt: "Boreal promo",
        seconds: "8",
        size: "1280x720",
        status: "queued",
        title: "Promo video",
      },
      ["video_generation"],
    ),
    detail: {
      ...baseDetail,
      intent: {
        ...baseDetail.intent!,
        body: "Create a cinematic promo shot for Boreal.",
        requestedOutputTypes: ["video_generation"],
        routeTarget: "video_generation",
        summary: "Need a short promo shot.",
        title: "Boreal promo video",
      },
    },
    modelId: "gpt-4.1-mini",
  });
  assert.equal(videoDelivery?.artifact.kind, "video");
  assert.match(videoDelivery?.deliverablesBody ?? "", /will update as the render progresses/i);
  assert.equal(
    hasPendingQueuedArtifact({
      ...baseDetail,
      artifact: {
        _id: "artifact-1",
        artifactKind: "video",
        createdAt: now,
        mediaType: "video/mp4",
        metadata: { jobId: "video-job-1" },
        provider: "boreal-agent",
        remoteId: "video-job-1",
        status: "queued",
        subtitle: "Queued now",
        title: "Promo video",
        updatedAt: now,
      },
    }),
    true,
  );

  const textAgent = createDirectAgent(
    "startup-pressure-test",
    {
      content: "text result",
      contentType: "text/markdown",
      kind: "text",
      title: "Startup Pressure Test",
    },
    ["text"],
  );
  const textDelivery = await maybeRunDirectArtifactDelivery({
    agent: textAgent,
    detail: baseDetail,
    modelId: "gpt-4.1-mini",
  });
  assert.equal(textDelivery, null);

  console.log("smoke-legacy-media-workers: ok");
}

main();
