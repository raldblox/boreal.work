import assert from "node:assert/strict";
import { createServer } from "node:http";

import { api, createAgentConvexClient } from "../agents/shared/convex-client.ts";
import {
  resolveConnectedAgent,
  runConnectedAgentChat,
} from "../lib/boreal/external-agents/runtime.ts";
import { createSmokeWalletIdentity } from "./lib/smoke-wallet-identities.ts";

async function main() {
  const client = createAgentConvexClient();
  const ownerExternalId = `x-smoke-connected-${Date.now()}`;
  const ownerDisplayName = "Connected Agent Owner";
  const wallet = createSmokeWalletIdentity("supplier-onboarding-supplier", "connected-chat");

  await client.mutation(api.profiles.upsertMyProfile, {
    availabilityStatus: "available",
    bio: "Connected agent owner for smoke coverage.",
    capabilityTags: ["agents", "chat", "automation"],
    headline: "Connected agent smoke",
    isPublic: true,
    ownerActorKind: "human",
    ownerDisplayName,
    ownerExternalId,
    productLabels: [],
    skillTags: ["operators"],
  });
  await client.mutation(api.wallets.syncWalletAccount, {
    chainFamily: "solana",
    environment: "mainnet",
    networkKey: "solana:mainnet",
    ownerDisplayName,
    ownerExternalId,
    roles: ["connected", "buyer"],
    setAsDefaultBuyer: true,
    setAsDefaultPayout: false,
    walletAddress: wallet.walletAddress,
    walletProvider: "siwx",
  });

  let receivedPayload: unknown = null;
  const server = createServer((request, response) => {
    const chunks: Buffer[] = [];
    request.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    request.on("end", () => {
      receivedPayload = JSON.parse(Buffer.concat(chunks).toString("utf8"));
      response.writeHead(200, { "Content-Type": "application/json" });
      response.end(
        JSON.stringify({
          assistantMessage:
            "Hermes received the Boreal message and replied from the connected runtime.",
          workspace: {
            kind: "empty",
            subtitle: "Connected runtime smoke reply.",
            title: "Connected runtime",
          },
        }),
      );
    });
  });

  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address();

  if (!address || typeof address === "string") {
    throw new Error("Connected-agent smoke server did not expose a TCP port.");
  }

  try {
    const supply = await client.mutation(api.supplies.createSupplyEntry, {
      agentReady: true,
      availabilityStatus: "available",
      capabilityTags: ["agents", "chat", "automation"],
      category: "services",
      currency: "USD",
      deliveryType: "instant",
      description: "HTTP-connected Hermes runtime for Boreal chat.",
      executionSurface: "http",
      fulfillmentKind: "service",
      outputTypes: ["text"],
      ownerActorKind: "agent",
      ownerDisplayName,
      ownerExternalId,
      priceAmount: 0.01,
      priceType: "scoped",
      responseSlaMinutes: 5,
      supplyType: "capability",
      supportsDirectInvoke: true,
      supportsEvidencePush: true,
      supportsStatusUpdates: true,
      title: "Hermes HTTP Runtime",
      executorUrl: `http://127.0.0.1:${address.port}/boreal/chat`,
    });

    assert.equal(supply.created, true, "expected connected runtime supply to be created");
    assert.ok(supply.supplyId, "expected connected runtime supply id");

    await client.mutation(api.profiles.setAgentControlState, {
      activeAgentRole: "agent",
      activeSupplyId: supply.supplyId,
      mode: "connected",
      ownerExternalId,
    });

    const connected = await resolveConnectedAgent({ ownerExternalId });

    assert.ok(connected, "expected connected agent state");
    assert.equal(connected?.control.mode, "connected", "expected connected mode");
    assert.ok(connected?.sessionToken, "expected session token for downstream Boreal APIs");
    assert.equal(connected?.supply?.title, "Hermes HTTP Runtime");

    const result = await runConnectedAgentChat({
      connectedAgent: connected as NonNullable<typeof connected> & {
        supply: NonNullable<NonNullable<typeof connected>["supply"]>;
      },
      conversationId: "conv-connected-smoke",
      message: "Say hi from Boreal chat.",
      requestUrl: "https://boreal.work/api/chat",
      requester: {
        displayName: ownerDisplayName,
        externalId: ownerExternalId,
      },
      uiContext: {
        centerTab: "chat",
        requestRole: "none",
        surface: "home",
      },
    });

    assert.equal(
      result.assistantDisplayName,
      "Hermes HTTP Runtime",
      "expected connected supply title to become the assistant identity",
    );
    assert.match(
      result.assistantMessage,
      /connected runtime/i,
      "expected connected runtime message",
    );

    const payload = receivedPayload as Record<string, unknown>;
    const boreal = payload.boreal as Record<string, unknown>;
    const auth = boreal.auth as Record<string, unknown>;
    const endpoints = boreal.endpoints as Record<string, unknown>;

    assert.equal(
      payload.message,
      "Say hi from Boreal chat.",
      "expected Boreal to send the chat message to the connected runtime",
    );
    assert.equal(
      auth.walletAddress,
      wallet.walletAddress,
      "expected Boreal connection pack to include the default wallet address",
    );
    assert.ok(
      typeof auth.bearerToken === "string" && auth.bearerToken.length > 20,
      "expected Boreal connection pack to include a bearer session token",
    );
    assert.equal(
      endpoints.requestPost,
      "https://boreal.work/api/v1/requests",
      "expected Boreal connection pack to expose the one-request entrypoint",
    );

    console.log(
      JSON.stringify(
        {
          assistantProvider: result.assistantProvider,
          conversationId: result.conversationId,
          sessionTokenPresent: Boolean(connected?.sessionToken),
          supplyTitle: connected?.supply?.title ?? null,
        },
        null,
        2,
      ),
    );
  } finally {
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
