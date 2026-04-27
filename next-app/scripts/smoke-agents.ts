import assert from "node:assert/strict";

import {
  autonomousAgents,
  directExecutionAgents,
  getDirectExecutionAgent,
  listRegisteredAgents,
} from "../agents/index.ts";
import { buildDirectExecutionProtocolDescriptor } from "../agents/shared/registry.ts";
import { buildAgentSupplyMutationArgs } from "../agents/shared/runtime.ts";

const expectedDirectAgents = [
  "image-studio",
  "motion-video-studio",
  "mvp-architect",
  "startup-pressure-test",
  "voiceover-studio",
] as const;

function main() {
  const registered = listRegisteredAgents();
  const directKeys = directExecutionAgents.map((agent) => agent.key).sort();

  assert.ok(
    autonomousAgents.length >= expectedDirectAgents.length,
    "expected the autonomous agent list to include the new direct agents",
  );

  assert.deepEqual(
    directKeys,
    [...expectedDirectAgents].sort(),
    "direct execution agent keys drifted from the expected launch set",
  );

  for (const key of expectedDirectAgents) {
    const agent = getDirectExecutionAgent(key);
    const registeredEntry = registered.find((entry) => entry.key === key);

    assert.ok(registeredEntry, `missing registry entry for ${key}`);
    assert.ok(agent.directExecution, `missing direct execution spec for ${key}`);
    assert.equal(
      agent.directExecution!.routePath,
      `/api/agents/${key}/execute`,
      `unexpected route path for ${key}`,
    );
    assert.equal(
      agent.supplyEntry.executorUrl,
      agent.directExecution!.routePath,
      `supply executorUrl should match route path for ${key}`,
    );
    assert.ok(
      registeredEntry?.directExecution,
      `registry output missing directExecution block for ${key}`,
    );
    assert.equal(
      registeredEntry?.directExecution?.canonicalRoutePath,
      `/api/v1/agents/${key}/execute`,
      `canonical route path drifted for ${key}`,
    );
    assert.deepEqual(
      registeredEntry?.directExecution?.outputKinds,
      agent.directExecution!.outputKinds,
      `outputKinds drifted for ${key}`,
    );
    assert.equal(
      registeredEntry?.directExecution?.requestRoutePath,
      "/api/v1/requests",
      `request-first route hint drifted for ${key}`,
    );
    assert.equal(
      registeredEntry?.directExecution?.inputSchema?.type,
      "object",
      `input schema missing for ${key}`,
    );
    assert.ok(
      Array.isArray(registeredEntry?.directExecution?.outputSchema?.oneOf) &&
        registeredEntry.directExecution.outputSchema.oneOf.length > 0,
      `output schema missing for ${key}`,
    );
    assert.equal(
      registeredEntry?.supply?.currency,
      "USD",
      `supply currency drifted for ${key}`,
    );
    assert.ok(
      typeof registeredEntry?.supply?.priceLabel === "string" &&
        registeredEntry.supply.priceLabel.length > 0,
      `supply price label missing for ${key}`,
    );

    const descriptor = buildDirectExecutionProtocolDescriptor(
      agent,
      agent.directExecution!,
    );

    assert.equal(
      descriptor.routePath,
      agent.directExecution!.routePath,
      `protocol descriptor route mismatch for ${key}`,
    );
    assert.equal(
      descriptor.version,
      "boreal-agent-registry/v1",
      `protocol descriptor version mismatch for ${key}`,
    );
    assert.equal(
      descriptor.canonicalRoutePath,
      `/api/v1/agents/${key}/execute`,
      `protocol descriptor canonical route mismatch for ${key}`,
    );
    assert.equal(
      descriptor.requestRoutePath,
      "/api/v1/requests",
      `protocol descriptor request route mismatch for ${key}`,
    );
    assert.equal(
      descriptor.inputSchema.type,
      "object",
      `protocol descriptor input schema missing for ${key}`,
    );
    assert.ok(
      Array.isArray(descriptor.outputSchema.oneOf) &&
        descriptor.outputSchema.oneOf.length > 0,
      `protocol descriptor output schema missing for ${key}`,
    );
  }

  for (const agent of autonomousAgents) {
    const syncArgs = buildAgentSupplyMutationArgs(agent, 1_746_000_000_000);

    assert.ok(
      agent.settlement,
      `autonomous agent ${agent.key} should define settlement metadata before it can serve paid work`,
    );
    assert.equal(
      syncArgs.offerSlug,
      agent.key,
      `expected stable offer slug for ${agent.key}`,
    );
    assert.equal(
      syncArgs.sourceCapabilityId,
      `autonomous-agent:${agent.key}`,
      `expected stable source capability id for ${agent.key}`,
    );
    assert.equal(
      syncArgs.paymentNetworkHints?.includes(agent.settlement!.networkKey),
      true,
      `expected payment network hint for ${agent.key}`,
    );

    if (agent.directExecution) {
      assert.equal(
        syncArgs.executionSurface,
        "http",
        `expected direct agent execution surface to stay http for ${agent.key}`,
      );
      assert.equal(
        syncArgs.supportsDirectInvoke,
        true,
        `expected direct invoke support for ${agent.key}`,
      );
    } else {
      assert.equal(
        syncArgs.executionSurface,
        "handoff",
        `expected worker agent execution surface to stay handoff for ${agent.key}`,
      );
      assert.equal(
        syncArgs.supportsEvidencePush,
        true,
        `expected worker agent evidence push for ${agent.key}`,
      );
    }
  }

  console.log(
    JSON.stringify(
      {
        autonomousAgentCount: autonomousAgents.length,
        directAgentCount: directExecutionAgents.length,
        directAgentKeys: directKeys,
        registeredCount: registered.length,
        status: "ok",
      },
      null,
      2,
    ),
  );
}

main();
