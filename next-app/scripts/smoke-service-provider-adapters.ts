import assert from "node:assert/strict";

import { agentcashDiscoveryAdapter } from "../lib/boreal/integrations/service-providers/discovery/agentcash.ts";
import { framesDiscoveryAdapter } from "../lib/boreal/integrations/service-providers/discovery/frames.ts";
import { parsePaymentRequiredHeader } from "../lib/boreal/integrations/service-providers/payments/x402.ts";

async function main() {
  const agentcash = await agentcashDiscoveryAdapter.listCapabilities({});
  assert.equal(agentcash.length, 1, "expected one curated AgentCash capability");
  assert.equal(agentcash[0].sourceProvider, "agentcash");
  assert.equal(agentcash[0].supportsDirectInvoke, false);
  assert.equal(agentcash[0].routingTier, "A-delegated");
  assert.equal(agentcash[0].paymentProtocol, "x402");
  assert.ok(
    agentcash[0].sourceUrl?.includes("agentcash.dev"),
    "expected AgentCash source URL",
  );

  const frames = await framesDiscoveryAdapter.listCapabilities({});
  assert.equal(frames.length, 1, "expected one curated Frames capability");
  assert.equal(frames[0].sourceProvider, "frames");
  assert.equal(frames[0].supportsDirectInvoke, false);
  assert.equal(frames[0].executionSurface, "handoff");
  assert.equal(frames[0].paymentProtocol, "none");

  const filtered = await agentcashDiscoveryAdapter.listCapabilities({
    query: "fallback",
  });
  assert.equal(filtered.length, 1, "expected query filter to retain AgentCash");

  const paymentRequiredPayload = {
    accepts: [
      {
        asset: "USDC",
        maxAmountRequired: "25000",
        network: "eip155:8453",
      },
    ],
    scheme: "exact",
  };
  const encodedHeader = Buffer.from(
    JSON.stringify(paymentRequiredPayload),
    "utf8",
  ).toString("base64");
  assert.deepEqual(
    parsePaymentRequiredHeader(encodedHeader),
    paymentRequiredPayload,
    "expected base64 PAYMENT-REQUIRED header to parse",
  );
  assert.deepEqual(
    parsePaymentRequiredHeader(JSON.stringify(paymentRequiredPayload)),
    paymentRequiredPayload,
    "expected raw JSON PAYMENT-REQUIRED header to parse",
  );
  assert.deepEqual(parsePaymentRequiredHeader(null), null);

  console.log("smoke-service-provider-adapters: ok");
}

await main();
