import assert from "node:assert/strict";

import {
  buildDirectAgentTeamBlueprint,
  parseRequestTeamBlueprint,
  serializeRequestTeamBlueprint,
  shouldAskTeam,
  stripTeamDirective,
} from "../lib/boreal/swarm/team-blueprint.ts";

const blueprint = buildDirectAgentTeamBlueprint([
  {
    identity: {
      displayName: "Research Analyst",
    },
    key: "research-analyst",
  },
  {
    identity: {
      displayName: "Copywriter",
    },
    key: "copywriter",
  },
]);

assert.ok(blueprint, "expected a blueprint for mounted agents");
assert.equal(blueprint?.executionMode, "lead_only");
assert.equal(blueprint?.leadAgentKey, "research-analyst");
assert.deepEqual(
  blueprint?.members.map((member) => ({
    key: member.agentKey,
    replyPolicy: member.replyPolicy,
    role: member.role,
  })),
  [
    {
      key: "research-analyst",
      replyPolicy: "lead_only",
      role: "lead",
    },
    {
      key: "copywriter",
      replyPolicy: "ask_team",
      role: "worker",
    },
  ],
);

const serialized = serializeRequestTeamBlueprint(blueprint);
assert.ok(serialized, "expected serialized team blueprint");

const parsed = parseRequestTeamBlueprint(serialized);
assert.deepEqual(parsed, blueprint);

assert.equal(shouldAskTeam("ask team: pressure test this launch brief"), true);
assert.equal(shouldAskTeam("@team weigh in on the pitch"), true);
assert.equal(shouldAskTeam("/team compare both routes"), true);
assert.equal(shouldAskTeam("just answer normally"), false);
assert.equal(
  stripTeamDirective("ask team: compare the buyer and seller risks"),
  "compare the buyer and seller risks",
);

console.log("smoke-swarm-team-blueprint passed");
