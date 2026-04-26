import assert from "node:assert/strict";

import {
  autonomousAgents,
  directExecutionAgents,
  getDirectExecutionAgent,
  listRegisteredAgents,
} from "../agents/index.ts";
import { buildDirectExecutionProtocolDescriptor } from "../agents/shared/registry.ts";

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
    assert.deepEqual(
      registeredEntry?.directExecution?.outputKinds,
      agent.directExecution!.outputKinds,
      `outputKinds drifted for ${key}`,
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
  }

  console.log(
    JSON.stringify(
      {
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
