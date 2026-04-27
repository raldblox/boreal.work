import assert from "node:assert/strict";

import type { Id } from "../convex/_generated/dataModel.js";
import { api, createAgentConvexClient } from "../agents/shared/convex-client.ts";

const now = Date.now();
const ownerExternalId = "smoke-owner-lifecycle";
const workerExternalId = "smoke-worker-lifecycle";
const matchToken = `smoke-algebra-${now}`;
const SUPPLY_TITLE = "Smoke Algebra Proof and Solution Service";

async function main() {
  const client = createAgentConvexClient();
  let verificationRunId: Id<"transactionScenarioRuns"> | null = null;
  let trackedIntentId: Id<"intents"> | null = null;
  let trackedTransactionId: Id<"transactions"> | null = null;

  await client.mutation(api.wallets.syncWalletAccount, {
    chainFamily: "solana",
    environment: "devnet",
    networkKey: "solana:devnet",
    ownerExternalId,
    roles: ["connected", "buyer"],
    setAsDefaultBuyer: true,
    setAsDefaultPayout: false,
    walletAddress: "smoke-owner-wallet-lifecycle",
  });

  await client.mutation(api.wallets.syncWalletAccount, {
    chainFamily: "solana",
    environment: "devnet",
    networkKey: "solana:devnet",
    ownerExternalId: workerExternalId,
    roles: ["connected", "payout"],
    setAsDefaultBuyer: false,
    setAsDefaultPayout: true,
    walletAddress: "smoke-worker-wallet-lifecycle",
  });

  try {
    const supply = await client.mutation(api.supplies.createSupplyEntry, {
      availabilityStatus: "available",
      capabilityTags: ["math", "algebra", "proofs", "explainer", matchToken],
      category: "education",
      deliveryType: "async",
      description:
        `I solve algebra and proof-based math requests with worked solutions in markdown and clear reasoning. Unique match token: ${matchToken}.`,
      estimatedDeliveryLabel: "1 day",
      exampleIntents: [
        `Prove an algebra identity step by step for ${matchToken}.`,
        `Solve a quadratic equation and explain the method for ${matchToken}.`,
      ],
      exclusions: ["image generation", "video generation"],
      maxConcurrentJobs: 3,
      nextAvailableAt: now,
      outputTypes: ["text"],
      ownerActorKind: "human",
      ownerDisplayName: "Smoke Math Worker",
      ownerExternalId: workerExternalId,
      ownerHandle: "smoke_math_worker",
      priceAmount: 75,
      priceMax: 100,
      priceMin: 50,
      priceType: "fixed",
      responseSlaMinutes: 30,
      supplyType: "capability",
      title: SUPPLY_TITLE,
    });

    assert.equal(supply.created, true, "expected supply creation to succeed");
    assert.ok(supply.supplyId, "expected a supply id");

    const conversationId = crypto.randomUUID();
    const intentRecord = await client.mutation(api.chats.recordIntentPipeline, {
      assistantMessage: "Structured request created for marketplace routing.",
      conversationId,
      initialStatus: "open",
      intent: {
        assistantMessageId: crypto.randomUUID(),
        assetPrompt: "",
        body: `Need a worked algebra solution for x^2 - 5x + 6 = 0, including factorization and a short explanation of each step. Match token: ${matchToken}.`,
        capabilityTags: ["math", "algebra", "worked solution", matchToken],
        catalogQuery: `algebra worked solution service ${matchToken}`,
        category: "education",
        confidence: 0.94,
        conversationId,
        embedding: [],
        embeddingModel: "smoke-test",
        extractionNotes: ["deterministic smoke request"],
        generationSignals: {
          primaryMode: "text",
          requestsImageGeneration: false,
          requestsSpeechGeneration: false,
          requestsText: true,
          requestsVideoGeneration: false,
        },
        intentModel: "smoke-test",
        intentType: "demand",
        keywords: ["algebra", "equation", "worked solution", "math", matchToken],
        missingDetails: [],
        modalityScores: [
          {
            kind: "text",
            score: 0.98,
          },
        ],
        needsClarification: false,
        persistence: {
          isUnresolved: true,
          reason: "Smoke lifecycle request",
          shouldPersist: true,
        },
        provider: "boreal-agent",
        requestedOutputTypes: ["text"],
        responseInstructions: "Return a clear markdown solution.",
        routeTarget: "catalog_lookup",
        routing: {
          resolutionTier: "open",
          shouldCreateFulfillmentRequest: true,
          shouldPersistToBoard: true,
        },
        shouldSearchCatalog: true,
        speechText: "",
        suggestedReplies: [],
        summary: `Need an algebra expert to solve and explain a quadratic equation in markdown for ${matchToken}.`,
        title: `Solve and explain a quadratic equation ${matchToken}`,
        userMessageId: crypto.randomUUID(),
        voice: "alloy",
      },
      ownerDisplayName: "Smoke Owner",
      ownerExternalId,
      ownerHandle: "smoke_owner",
      userMessage:
        "Post this as a public request for an algebra expert. I want proposals first, then delivery in markdown.",
    });

    const intentId = intentRecord.intentId as Id<"intents">;
    trackedIntentId = intentId;
    assert.ok(intentId, "expected intent creation to succeed");

    const startedRun = await client.mutation(api.commerce.startScenarioVerificationRun, {
      intentId,
      notes: "Deterministic scoped-work smoke lifecycle",
      runKey: "smoke:lifecycle",
      scenarioType: "custom_scoped_work",
    });
    verificationRunId = startedRun.runId as Id<"transactionScenarioRuns">;

    const ownerDetail = await client.query(api.intents.getRequestDetail, {
      intentId,
      ownerExternalId,
    });

    assert.ok(ownerDetail.intent, "owner should be able to load request detail");
    assert.ok(ownerDetail.intent.matchAttempts >= 1, "matching should have run at least once");
    assert.ok(ownerDetail.catalogItems.length > 0, "expected matched catalog items");
    assert.ok(
      ownerDetail.catalogItems.some((item) => item._id === supply.supplyId),
      `expected the created supply to appear in the matched catalog; saw ${ownerDetail.catalogItems
        .map((item) => `${item.title} (${item._id})`)
        .join(", ")}`,
    );

    const workerPerspective = await client.query(api.intents.getRequestDetail, {
      intentId,
      ownerExternalId: workerExternalId,
    });

    assert.equal(
      workerPerspective.access?.canSubmitProposal,
      true,
      "worker should be able to submit a proposal",
    );

    const proposal = await client.mutation(api.proposals.submitProposal, {
      currency: "USD",
      deliverablesBody:
        "I will deliver the solved equation, factorization, validation of both roots, and a concise explanation of the method in markdown.",
      deliverablesType: "markdown",
      etaAt: now + 24 * 60 * 60 * 1000,
      intentId,
      ownerDisplayName: "Smoke Math Worker",
      ownerExternalId: workerExternalId,
      ownerHandle: "smoke_math_worker",
      price: 75,
      proposerKind: "human",
    });

    assert.equal(proposal.submitted, true, "proposal should submit");
    assert.ok(proposal.proposalId, "proposal id should exist");

    const approval = await client.mutation(api.proposals.approveProposal, {
      intentId,
      ownerExternalId,
      proposalId: proposal.proposalId as Id<"proposals">,
    });

    assert.equal(approval.approved, true, "proposal approval should succeed");

    const delivery = await client.mutation(api.fulfillments.submitWork, {
      deliverablesBody: [
        "## Final solution",
        "",
        "Given `x^2 - 5x + 6 = 0`.",
        "",
        "Factorization gives `(x - 2)(x - 3) = 0`.",
        "",
        "So the roots are `x = 2` and `x = 3`.",
        "",
        "Both values satisfy the original equation.",
      ].join("\n"),
      intentId,
      workerDisplayName: "Smoke Math Worker",
      workerExternalId: workerExternalId,
    });

    assert.equal(delivery.submitted, true, "work submission should succeed");

    const rating = await client.mutation(api.chats.rateRequest, {
      comment: "Smoke lifecycle passed.",
      intentId,
      ownerExternalId,
      rating: 5,
    });

    assert.equal(rating.rated, true, "rating should succeed");

    const finalDetail = await client.query(api.intents.getRequestDetail, {
      intentId,
      ownerExternalId,
    });

    assert.equal(finalDetail.intent?.status, "fulfilled", "request should be fulfilled");
    assert.equal(finalDetail.review?.rating, 5, "review should be persisted");
    assert.equal(finalDetail.proposals[0]?.status, "accepted", "proposal should be accepted");
    assert.ok(finalDetail.fulfillment?.evidence?.body.includes("Final solution"));

    const audits = await client.query(api.commerce.listTransactionAudits, {
      intentId,
      limit: 20,
      transactionId: undefined,
    });

    assert.ok(
      audits.some((event) => event.stage === "proposal" && event.status === "passed"),
      "expected proposal audit event",
    );
    assert.ok(
      audits.some((event) => event.stage === "approval" && event.status === "passed"),
      "expected approval audit event",
    );
    assert.ok(
      audits.some((event) => event.stage === "delivery" && event.status === "passed"),
      "expected delivery audit event",
    );
    assert.ok(
      audits.some((event) => event.stage === "settlement"),
      "expected settlement audit event",
    );

    trackedTransactionId =
      (audits.find((event) => event.transactionId)?.transactionId as
        | Id<"transactions">
        | null
        | undefined) ?? null;

    const archive = await client.mutation(api.chats.archiveRequest, {
      intentId,
      ownerExternalId,
    });

    assert.equal(archive.archived, true, "archive should succeed");

    if (verificationRunId) {
      await client.mutation(api.commerce.finishScenarioVerificationRun, {
        metadataJson: JSON.stringify({
          auditCount: audits.length,
          catalogMatches: ownerDetail.catalogItems.length,
          matchedSupplyId: supply.supplyId,
          proposalId: proposal.proposalId,
          status: finalDetail.intent?.status,
        }),
        runId: verificationRunId,
        status: "passed",
        transactionId: trackedTransactionId ?? undefined,
      });
    }

    console.log(
      JSON.stringify(
        {
          archived: archive.archived,
          auditCount: audits.length,
          catalogMatches: ownerDetail.catalogItems.length,
          intentId,
          matchedSupplyId: supply.supplyId,
          proposalId: proposal.proposalId,
          status: finalDetail.intent?.status,
          transactionId: trackedTransactionId,
          verificationRunId,
        },
        null,
        2,
      ),
    );
  } catch (error) {
    if (verificationRunId) {
      await client.mutation(api.commerce.finishScenarioVerificationRun, {
        errorMessage: error instanceof Error ? error.message : "Unknown smoke failure.",
        metadataJson: JSON.stringify({
          intentId: trackedIntentId,
          transactionId: trackedTransactionId,
        }),
        runId: verificationRunId,
        status: "failed",
        transactionId: trackedTransactionId ?? undefined,
      });
    }

    throw error;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
