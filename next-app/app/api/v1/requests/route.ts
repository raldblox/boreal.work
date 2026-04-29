import { NextResponse } from "next/server";

import { getDirectExecutionAgent } from "@/agents";
import type { Id } from "@/convex/_generated/dataModel";
import { api } from "@/convex/_generated/api";
import { createConvexServerClient } from "@/lib/boreal/integrations/convex/server-client";
import { deriveRequestClassification } from "@/lib/boreal/schemas/intent";
import {
  buildPaymentAuthorizationMessage,
  buildPaymentReferenceMemo,
  createOpaqueToken,
  createRequestFingerprint,
} from "@/lib/boreal/one-request/auth";
import {
  buildSessionEnvelope,
  buildTrackingUrls,
  getIdempotencyKey,
  parsePaymentReceiptHeader,
  requireAgentSession,
} from "@/lib/boreal/one-request/http";
import {
  assertOneRequestIntakeAllowed,
  ONE_REQUEST_GUARD_WINDOW_MS,
} from "@/lib/boreal/one-request/guards";
import { verifyOneRequestPayment } from "@/lib/boreal/one-request/payment";
import { buildAutoRoutePlan } from "@/lib/boreal/one-request/routing";
import { getOneRequestSellerMetadata } from "@/lib/boreal/one-request/seller";
import {
  buildPersistedIntent,
  executeAndPersistOneRequest,
  persistOneRequestThread,
  prepareOneRequest,
} from "@/lib/boreal/one-request/service";
import type {
  OneRequestPaymentReceipt,
  OneRequestRoutePlan,
  OneRequestRouteSelection,
} from "@/lib/boreal/one-request/types";
import { getDefaultSolanaNetworkKey } from "@/lib/boreal/solana-network";

const QUOTE_TTL_MS = 15 * 60 * 1000;

type RequestSessionState = {
  conversationId?: string | null;
  currency: string;
  intentId?: Id<"intents"> | null;
  intentKey?: string | null;
  message: string;
  payerSource?: "agentcash" | "openwallet" | null;
  quoteAmount: number;
  quoteAuthorizationMessage: string;
  quoteExpiresAt: number;
  quoteRefreshCount?: number | null;
  quoteToken: string;
  requestToken: string;
  requestedOutputTypes: Array<
    "image_generation" | "speech_generation" | "text" | "video_generation"
  >;
  paymentVerificationJson?: string | null;
  paymentVerifiedAt?: number | null;
  resultJson?: string | null;
  routeJson: string;
  status: string;
  summary: string;
  title: string;
  txHash?: string | null;
  walletAddress: string;
};

export async function POST(request: Request) {
  try {
    const caller = requireAgentSession(request);
    const body = (await request.json()) as {
      message?: string;
      mode?: string;
    };
    const message = body.message?.trim();

    if (!message) {
      return NextResponse.json({ error: "message is required." }, { status: 400 });
    }

    if (body.mode && body.mode !== "auto") {
      return NextResponse.json(
        { error: "Only auto mode is supported in v1." },
        { status: 400 },
      );
    }

    const requestFingerprint = createRequestFingerprint(message);
    const idempotencyKey = getIdempotencyKey(request, requestFingerprint);
    const networkKey = getDefaultSolanaNetworkKey();
    const convex = createConvexServerClient();
    const existing = await convex.query(api.requestApi.findSessionForCaller, {
      idempotencyKey,
      ownerExternalId: caller.externalId,
      requestFingerprint,
    });

    if (existing) {
      return await handleExistingSession({
        caller,
        convex,
        existing,
        paymentReceipt: parsePaymentReceiptHeader(request),
        request,
      });
    }

    const guardState = await convex.query(api.requestApi.getRequestIntakeGuardState, {
      ownerExternalId: caller.externalId,
      windowStartedAt: Date.now() - ONE_REQUEST_GUARD_WINDOW_MS,
    });
    assertOneRequestIntakeAllowed(guardState);

    const prepared = await prepareOneRequest({ message });
    const conversationId = crypto.randomUUID();
    const assistantMessageId = crypto.randomUUID();
    const userMessageId = crypto.randomUUID();
    const persistedIntent = buildPersistedIntent({
      assistantMessageId,
      conversationId,
      embedding: prepared.embedding,
      embeddingModel: prepared.runtimeConfig.embeddingModel,
      extractedIntent: prepared.extractedIntent,
      intentModel: prepared.runtimeConfig.intentModel,
      modalityScores: prepared.modalityScores,
      providerKey: prepared.providerKey,
      userMessageId,
    });
    const routePlan = buildAutoRoutePlan({
      intent: persistedIntent,
      message,
    });
    const requestToken = createOpaqueToken("req", `${caller.walletAddress}:${idempotencyKey}`);
    const quoteToken = createOpaqueToken("quote", requestToken);
    const quoteExpiresAt = Date.now() + QUOTE_TTL_MS;

    if (prepared.extractedIntent.needsClarification || prepared.extractedIntent.missingDetails.length > 0) {
      const clarificationMessage = [
        "Boreal needs more scope before it can lock an auto route.",
        ...prepared.extractedIntent.missingDetails.map((detail) => `- ${detail}`),
      ].join("\n");
      const persisted = await persistOneRequestThread({
        assistantMessage: clarificationMessage,
        caller,
        initialStatus: "blocked",
        persistedIntent,
        userMessage: message,
      });

      await convex.mutation(api.requestApi.createRequestSession, {
        chainFamily: "solana",
        conversationId,
        currency: "USD",
        idempotencyKey,
        intentId: persisted.intentId as Id<"intents">,
        intentKey: persisted.intentKey,
        message,
        networkKey,
        ownerDisplayName: caller.displayName,
        ownerExternalId: caller.externalId,
        paymentProtocol: "x402",
        quoteAmount: 0,
        quoteAuthorizationMessage: buildPaymentAuthorizationMessage({
          amount: 0,
          currency: "USD",
          quoteToken,
          requestToken,
        }),
        quoteExpiresAt,
        quoteToken,
        requestFingerprint,
        requestToken,
        requestedOutputTypes: persistedIntent.requestedOutputTypes,
        routeJson: JSON.stringify({
          message: "Clarification required before Boreal can quote this request.",
          missingDetails: prepared.extractedIntent.missingDetails,
          selectedAgents: [],
        }),
        status: "clarification_required",
        summary: persistedIntent.summary,
        title: persistedIntent.title,
        walletAddress: caller.walletAddress,
      });

      return NextResponse.json(
        buildSessionEnvelope({
          eventsUrl: buildTrackingUrls(request, requestToken).eventsUrl,
          requestToken,
          route: {
            missingDetails: prepared.extractedIntent.missingDetails,
            selectedAgents: [],
          },
          session: {
            conversationId,
            intentId: persisted.intentId,
            quoteToken,
            status: "clarification_required",
            summary: persistedIntent.summary,
            title: persistedIntent.title,
          },
          statusUrl: buildTrackingUrls(request, requestToken).statusUrl,
        }),
        { status: 422 },
      );
    }

    if (!routePlan) {
      const fallbackMessage =
        "Boreal could not lock a deterministic auto route for this request. It needs a slower manual or market path.";
      const persisted = await persistOneRequestThread({
        assistantMessage: fallbackMessage,
        caller,
        initialStatus: "blocked",
        persistedIntent,
        userMessage: message,
      });

      await convex.mutation(api.requestApi.createRequestSession, {
        chainFamily: "solana",
        conversationId,
        currency: "USD",
        idempotencyKey,
        intentId: persisted.intentId as Id<"intents">,
        intentKey: persisted.intentKey,
        message,
        networkKey,
        ownerDisplayName: caller.displayName,
        ownerExternalId: caller.externalId,
        paymentProtocol: "x402",
        quoteAmount: 0,
        quoteAuthorizationMessage: buildPaymentAuthorizationMessage({
          amount: 0,
          currency: "USD",
          quoteToken,
          requestToken,
        }),
        quoteExpiresAt,
        quoteToken,
        requestFingerprint,
        requestToken,
        requestedOutputTypes: persistedIntent.requestedOutputTypes,
        routeJson: JSON.stringify({
          message: "No deterministic auto route matched the request.",
          selectedAgents: [],
        }),
        status: "fallback_required",
        summary: persistedIntent.summary,
        title: persistedIntent.title,
        walletAddress: caller.walletAddress,
      });

      return NextResponse.json(
        buildSessionEnvelope({
          eventsUrl: buildTrackingUrls(request, requestToken).eventsUrl,
          requestToken,
          route: {
            message: "No deterministic auto route matched the request.",
            selectedAgents: [],
          },
          session: {
            conversationId,
            intentId: persisted.intentId,
            quoteToken,
            status: "fallback_required",
            summary: persistedIntent.summary,
            title: persistedIntent.title,
          },
          statusUrl: buildTrackingUrls(request, requestToken).statusUrl,
        }),
        { status: 409 },
      );
    }

    const paymentMessage = `Boreal locked the fastest automatable route across ${routePlan.selected
      .map((selection) => selection.agent.identity.displayName)
      .join(", ")}. Payment is required before execution starts.`;
    const persisted = await persistOneRequestThread({
      assistantMessage: paymentMessage,
      caller,
      initialStatus: "open",
      persistedIntent,
      routePlan,
      userMessage: message,
    });
    const quoteAuthorizationMessage = buildPaymentAuthorizationMessage({
      amount: routePlan.totalQuoteUsd,
      currency: routePlan.currency,
      quoteToken,
      requestToken,
    });

    await convex.mutation(api.requestApi.createRequestSession, {
      chainFamily: "solana",
      conversationId,
      currency: routePlan.currency,
      idempotencyKey,
      intentId: persisted.intentId as Id<"intents">,
      intentKey: persisted.intentKey,
      message,
      networkKey: routePlan.networkKey,
      ownerDisplayName: caller.displayName,
      ownerExternalId: caller.externalId,
      paymentProtocol: routePlan.paymentProtocol,
      quoteAmount: routePlan.totalQuoteUsd,
      quoteAuthorizationMessage,
      quoteExpiresAt,
      quoteToken,
      requestFingerprint,
      requestToken,
      requestedOutputTypes: persistedIntent.requestedOutputTypes,
      routeJson: JSON.stringify(serializeRoutePlan(routePlan)),
      status: "payment_required",
      summary: routePlan.summary,
      title: routePlan.title,
      walletAddress: caller.walletAddress,
    });

    return NextResponse.json(
      buildPaymentRequiredResponse({
        conversationId,
        intentId: persisted.intentId,
        quoteAuthorizationMessage,
        quoteExpiresAt,
        quoteToken,
        request,
        requestToken,
        routePlan,
      }),
      { status: 402 },
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to process Boreal one-request call.";
    const status =
      message.includes("session token") ||
      message.includes("Signed token") ||
      message.includes("Wallet")
        ? 401
        : message.includes("Too many")
          ? 429
        : 400;

    return NextResponse.json(
      { error: message },
      { status },
    );
  }
}

async function handleExistingSession(input: {
  caller: ReturnType<typeof requireAgentSession>;
  convex: ReturnType<typeof createConvexServerClient>;
  existing: RequestSessionState;
  paymentReceipt: OneRequestPaymentReceipt | null;
  request: Request;
}) {
  const route = safeParseJson(input.existing.routeJson);

  switch (input.existing.status) {
    case "clarification_required":
      return NextResponse.json(
        buildExistingEnvelope(input.request, input.existing, route),
        { status: 422 },
      );
    case "fallback_required":
      return NextResponse.json(
        buildExistingEnvelope(input.request, input.existing, route),
        { status: 409 },
      );
    case "delivered":
      return NextResponse.json(buildExistingEnvelope(input.request, input.existing, route));
    case "executing":
      return NextResponse.json(buildExistingEnvelope(input.request, input.existing, route), {
        status: 202,
      });
    case "payment_required":
      if (input.existing.quoteExpiresAt <= Date.now()) {
        const refreshed = await refreshExpiredQuote(input);

        return NextResponse.json(
          buildExistingPaymentResponse(
            input.request,
            refreshed,
            safeParseJson(refreshed.routeJson),
          ),
          { status: 402 },
        );
      }

      if (!input.paymentReceipt) {
        return NextResponse.json(
          buildExistingPaymentResponse(input.request, input.existing, route),
          { status: 402 },
        );
      }
      return executePaidSession(input, route);
    case "paid":
      return executePaidSession(input, route);
    default:
      return NextResponse.json(buildExistingEnvelope(input.request, input.existing, route), {
        status: 202,
      });
  }
}

async function executePaidSession(
  input: {
    caller: ReturnType<typeof requireAgentSession>;
    convex: ReturnType<typeof createConvexServerClient>;
    existing: RequestSessionState;
    paymentReceipt: OneRequestPaymentReceipt | null;
    request: Request;
  },
  route: Record<string, unknown>,
) {
  const routePlan = reviveRoutePlan(route);

  if (input.existing.status === "payment_required") {
    if (!input.paymentReceipt) {
      return NextResponse.json(
        buildExistingPaymentResponse(input.request, input.existing, route),
        { status: 402 },
        );
    }

    const verification = await verifyOneRequestPayment({
      amount: input.existing.quoteAmount,
      authorizationMessage: input.existing.quoteAuthorizationMessage,
      currency: input.existing.currency,
      payToAddress: getOneRequestSellerMetadata().payToAddress,
      quoteExpiresAt: input.existing.quoteExpiresAt,
      quoteToken: input.existing.quoteToken,
      receipt: input.paymentReceipt,
      requestToken: input.existing.requestToken,
      walletAddress: input.caller.walletAddress,
    });

    await input.convex.mutation(api.requestApi.recordQuotePayment, {
      ownerExternalId: input.caller.externalId,
      payerSource: input.paymentReceipt.payerSource,
      paymentReceiptJson: JSON.stringify(input.paymentReceipt),
      paymentVerificationJson: JSON.stringify(verification),
      requestToken: input.existing.requestToken,
      txHash: input.paymentReceipt.txHash,
    });
  }

  await input.convex.mutation(api.requestApi.markExecutionStarted, {
    ownerExternalId: input.caller.externalId,
    requestToken: input.existing.requestToken,
  });

  try {
    const execution = await executeAndPersistOneRequest({
      caller: input.caller,
      intentId: String(input.existing.intentId),
      intentKey: String(input.existing.intentKey),
      persistedIntent: (() => {
        const requestedOutputTypes = input.existing.requestedOutputTypes;
        const routeTarget = (routePlan.routeTarget as
          | "catalog_lookup"
          | "clarification"
          | "general_assistance"
          | "image_generation"
          | "profile_update"
          | "speech_generation"
          | "video_generation") ?? "general_assistance";
        const routing = {
          resolutionTier: "auto" as const,
          shouldCreateFulfillmentRequest: true,
          shouldPersistToBoard: true,
        };
        const shouldSearchCatalog = false;

        return {
        assistantMessageId: crypto.randomUUID(),
        assetPrompt: String(routePlan.assetPrompt ?? routePlan.summary ?? input.existing.summary),
        body: input.existing.message,
        capabilityTags: Array.isArray(routePlan.capabilityTags)
          ? routePlan.capabilityTags.map(String)
          : [],
        catalogQuery: input.existing.message,
        category: String(routePlan.category ?? "general"),
        confidence: 0.9,
        conversationId: String(input.existing.conversationId ?? crypto.randomUUID()),
        embedding: [],
        embeddingModel: "one-request",
        extractionNotes: ["Loaded from frozen one-request route."],
        generationSignals: {
          primaryMode:
            (input.existing.requestedOutputTypes[0] as
              | "image_generation"
              | "speech_generation"
              | "text"
              | "video_generation") ?? "text",
          requestsImageGeneration: input.existing.requestedOutputTypes.includes("image_generation"),
          requestsSpeechGeneration: input.existing.requestedOutputTypes.includes("speech_generation"),
          requestsText: input.existing.requestedOutputTypes.includes("text"),
          requestsVideoGeneration: input.existing.requestedOutputTypes.includes("video_generation"),
        },
        intentModel: "one-request",
        intentType: "demand",
        keywords: Array.isArray(routePlan.keywords) ? routePlan.keywords.map(String) : [],
        missingDetails: [],
        modalityScores: input.existing.requestedOutputTypes.map((kind: string) => ({
          kind: kind as "image_generation" | "speech_generation" | "text" | "video_generation",
          score: 0.8,
        })),
        needsClarification: false,
        persistence: {
          isUnresolved: false,
          reason: "Executing locked one-request route.",
          shouldPersist: true,
        },
        provider: "boreal-agent",
        requestedOutputTypes,
        responseInstructions: String(routePlan.summary ?? input.existing.summary),
        routeTarget,
        routing,
        classification: deriveRequestClassification({
          intentType: "demand",
          needsClarification: false,
          requestedOutputTypes,
          routeTarget,
          routing,
          shouldSearchCatalog,
        }),
        shouldSearchCatalog,
        speechText: String(routePlan.speechText ?? input.existing.message),
        suggestedReplies: [],
        summary: input.existing.summary,
        title: input.existing.title,
        userMessageId: crypto.randomUUID(),
        videoSeconds: String(routePlan.seconds ?? "8"),
        videoSize: String(routePlan.size ?? "1280x720"),
        voice: String(routePlan.voice ?? "alloy"),
      }})(),
      routePlan,
    });
    const payoutTargets = routePlan.selected.map((selection) => ({
      agentExternalId: selection.agent.identity.externalId,
      amount: selection.quoteUsd,
      walletAddress: selection.agent.settlement?.payoutAddress ?? "",
    }));

    await input.convex.mutation(api.requestApi.markRequestDelivered, {
      ownerExternalId: input.caller.externalId,
      payoutTargets,
      requestToken: input.existing.requestToken,
      resultJson: JSON.stringify({
        completionMessage: execution.completionMessage,
        results: execution.results,
      }),
    });

    const delivered = await input.convex.query(api.requestApi.getRequestSession, {
      ownerExternalId: input.caller.externalId,
      requestToken: input.existing.requestToken,
    });

    return NextResponse.json(
      buildExistingEnvelope(
        input.request,
        delivered ?? input.existing,
        safeParseJson((delivered ?? input.existing).routeJson),
      ),
    );
  } catch (error) {
    await input.convex.mutation(api.requestApi.markRequestFailed, {
      errorCode: "execution_failed",
      errorMessage:
        error instanceof Error ? error.message : "One-request execution failed.",
      ownerExternalId: input.caller.externalId,
      requestToken: input.existing.requestToken,
    });

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "One-request execution failed.",
      },
      { status: 500 },
    );
  }
}

async function refreshExpiredQuote(input: {
  caller: ReturnType<typeof requireAgentSession>;
  convex: ReturnType<typeof createConvexServerClient>;
  existing: RequestSessionState;
  paymentReceipt: OneRequestPaymentReceipt | null;
  request: Request;
}) {
  const quoteToken = createOpaqueToken("quote", input.existing.requestToken);
  const quoteExpiresAt = Date.now() + QUOTE_TTL_MS;
  const quoteAuthorizationMessage = buildPaymentAuthorizationMessage({
    amount: input.existing.quoteAmount,
    currency: input.existing.currency,
    quoteToken,
    requestToken: input.existing.requestToken,
  });

  await input.convex.mutation(api.requestApi.refreshQuote, {
    ownerExternalId: input.caller.externalId,
    quoteAuthorizationMessage,
    quoteExpiresAt,
    quoteToken,
    requestToken: input.existing.requestToken,
  });

  const refreshed =
    (await input.convex.query(api.requestApi.getRequestSession, {
      ownerExternalId: input.caller.externalId,
      requestToken: input.existing.requestToken,
    })) ?? input.existing;

  return refreshed;
}

function buildExistingEnvelope(
  request: Request,
  session: RequestSessionState,
  route: Record<string, unknown>,
) {
  const tracking = buildTrackingUrls(request, session.requestToken);
  const paymentReference = buildPaymentReferenceMemo({
    quoteToken: session.quoteToken,
    requestToken: session.requestToken,
  });

  return buildSessionEnvelope({
    eventsUrl: tracking.eventsUrl,
    requestToken: session.requestToken,
    route,
    session: {
      conversationId: session.conversationId ?? null,
      intentId: session.intentId ?? null,
      payment: {
        amount: session.quoteAmount,
        authorizationMessage: session.quoteAuthorizationMessage,
        currency: "USD",
        expiresAt: session.quoteExpiresAt,
        paymentReference,
        quoteToken: session.quoteToken,
      },
      paymentVerification: session.paymentVerificationJson
        ? safeParseJson(session.paymentVerificationJson)
        : null,
      result: session.resultJson ? safeParseJson(session.resultJson) : null,
      status: session.status,
      summary: session.summary,
      title: session.title,
    },
    statusUrl: tracking.statusUrl,
  });
}

function buildExistingPaymentResponse(
  request: Request,
  session: RequestSessionState,
  route: Record<string, unknown>,
) {
  const paymentReference = buildPaymentReferenceMemo({
    quoteToken: session.quoteToken,
    requestToken: session.requestToken,
  });
  const seller = getOneRequestSellerMetadata();

  return {
    ...buildExistingEnvelope(request, session, route),
    quote: {
      amount: session.quoteAmount,
      authorizationMessage: session.quoteAuthorizationMessage,
      currency: "USD",
      expiresAt: session.quoteExpiresAt,
      networkKey: getDefaultSolanaNetworkKey(),
      payerSources: ["openwallet", "agentcash"],
      paymentReference,
      paymentProtocol: "x402",
      quoteToken: session.quoteToken,
      seller,
    },
  };
}

function buildPaymentRequiredResponse(input: {
  conversationId: string;
  intentId: string;
  quoteAuthorizationMessage: string;
  quoteExpiresAt: number;
  quoteToken: string;
  request: Request;
  requestToken: string;
  routePlan: OneRequestRoutePlan;
}) {
  const tracking = buildTrackingUrls(input.request, input.requestToken);
  const paymentReference = buildPaymentReferenceMemo({
    quoteToken: input.quoteToken,
    requestToken: input.requestToken,
  });
  const seller = getOneRequestSellerMetadata();

  return {
    quote: {
      amount: input.routePlan.totalQuoteUsd,
      authorizationMessage: input.quoteAuthorizationMessage,
      currency: input.routePlan.currency,
      estimatedMinutes: input.routePlan.estimatedMinutes,
      expiresAt: input.quoteExpiresAt,
      networkKey: input.routePlan.networkKey,
      payerSources: ["openwallet", "agentcash"],
      paymentReference,
      paymentProtocol: input.routePlan.paymentProtocol,
      quoteToken: input.quoteToken,
      seller,
    },
    requestToken: input.requestToken,
    route: serializeRoutePlan(input.routePlan),
    session: {
      conversationId: input.conversationId,
      intentId: input.intentId,
      status: "payment_required",
      summary: input.routePlan.summary,
      title: input.routePlan.title,
    },
    tracking,
  };
}

function serializeRoutePlan(routePlan: OneRequestRoutePlan) {
  return {
    assetPrompt: routePlan.assetPrompt ?? "",
    category: routePlan.category ?? routePlan.selected[0]?.agent.supplyEntry.category ?? "general",
    capabilityTags: routePlan.capabilityTags ?? [],
    estimatedMinutes: routePlan.estimatedMinutes,
    keywords: routePlan.keywords ?? [],
    networkKey: routePlan.networkKey,
    paymentProtocol: routePlan.paymentProtocol,
    routeTarget: routePlan.routeTarget ?? "general_assistance",
    selected: routePlan.selected.map((selection) => ({
      agentDisplayName: selection.agent.identity.displayName,
      agentExternalId: selection.agent.identity.externalId,
      key: selection.agent.key,
      outputKinds: selection.outputKinds,
      payerSources: selection.agent.settlement?.payerSources ?? [],
      payoutAddress: selection.agent.settlement?.payoutAddress ?? "",
      quoteUsd: selection.quoteUsd,
      score: selection.score,
    })),
    speechText: routePlan.speechText ?? "",
    summary: routePlan.summary,
    title: routePlan.title,
    totalQuoteUsd: routePlan.totalQuoteUsd,
    voice: routePlan.voice ?? "alloy",
  };
}

function reviveRoutePlan(route: Record<string, unknown>): OneRequestRoutePlan {
  const selected = Array.isArray(route.selected)
    ? route.selected.map((entry) => reviveRouteSelection(entry as Record<string, unknown>))
    : [];

  return {
    assetPrompt: String(route.assetPrompt ?? ""),
    capabilityTags: Array.isArray(route.capabilityTags)
      ? route.capabilityTags.map(String)
      : [],
    category: String(route.category ?? "general"),
    currency: "USD",
    estimatedMinutes: Number(route.estimatedMinutes ?? 3),
    keywords: Array.isArray(route.keywords) ? route.keywords.map(String) : [],
    networkKey:
      route.networkKey === "solana:mainnet" ||
      route.networkKey === "solana:testnet"
        ? route.networkKey
        : getDefaultSolanaNetworkKey(),
    paymentProtocol: "x402",
    routeTarget:
      (route.routeTarget as
        | "catalog_lookup"
        | "clarification"
        | "general_assistance"
        | "image_generation"
        | "profile_update"
        | "speech_generation"
        | "video_generation") ?? "general_assistance",
    selected,
    speechText: String(route.speechText ?? ""),
    summary: String(route.summary ?? ""),
    title: String(route.title ?? ""),
    totalQuoteUsd: Number(route.totalQuoteUsd ?? 0),
    voice: String(route.voice ?? "alloy"),
  };
}

function reviveRouteSelection(entry: Record<string, unknown>): OneRequestRouteSelection {
  const agentKey = String(entry.key ?? "");
  const agent = getDirectExecutionAgent(agentKey);

  return {
    agent,
    outputKinds:
      (entry.outputKinds as Array<
        "image_generation" | "speech_generation" | "text" | "video_generation"
      >) ?? [],
    quoteUsd: Number(entry.quoteUsd ?? agent.settlement?.autoQuoteUsd ?? 0),
    score: Number(entry.score ?? 0),
  };
}

function safeParseJson(value: string) {
  try {
    return JSON.parse(value) as Record<string, unknown>;
  } catch {
    return {};
  }
}
