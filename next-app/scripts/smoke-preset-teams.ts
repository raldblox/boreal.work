import assert from "node:assert/strict"

import {
  buildPresetTeamSourceCapabilityId,
  getPresetTeamDefinition,
  getPresetTeamDefinitionFromSourceCapabilityId,
  getPresetTeamStarterPromptInventory,
  listPublicPresetTeamCatalogEntries,
} from "../lib/boreal/swarm/preset-teams.ts"
import {
  buildPresetTeamBlueprint,
  parseRequestTeamBlueprint,
  serializeRequestTeamBlueprint,
} from "../lib/boreal/swarm/team-blueprint.ts"

const definition = getPresetTeamDefinition("debate-and-verdict")

assert.ok(definition, "expected the debate preset team definition")
assert.equal(definition?.teamDisplayName, "Debate and Verdict")
assert.equal(definition?.executionMode, "sequential_handoff")
assert.equal(definition?.members.length, 4)
assert.equal(definition?.memberPreview.length, 4)
assert.equal(definition?.members[0]?.senderHandle, "mara")
assert.equal(definition?.members[1]?.senderHandle, "avery")
assert.equal(definition?.members[2]?.senderHandle, "blake")
assert.equal(definition?.members[3]?.senderHandle, "jordan")
assert.equal(definition?.members[1]?.roleLabel, "Case A")
assert.equal(definition?.members[2]?.roleLabel, "Case B")
assert.equal(definition?.members[0]?.accentTone, "sky")
assert.equal(definition?.members[1]?.accentTone, "emerald")
assert.equal(definition?.members[2]?.accentTone, "amber")
assert.equal(definition?.members[3]?.accentTone, "violet")
assert.equal(
  new Set(definition?.members.map((member) => member.senderExternalId)).size,
  definition?.members.length,
)

const sourceCapabilityId = buildPresetTeamSourceCapabilityId("debate-and-verdict")
assert.equal(sourceCapabilityId, "preset-team:debate-and-verdict")
assert.equal(
  getPresetTeamDefinitionFromSourceCapabilityId(sourceCapabilityId)?.key,
  "debate-and-verdict",
)

const starterPrompts = getPresetTeamStarterPromptInventory("debate-and-verdict")
assert.equal(starterPrompts.length, 4)
assert.ok(
  starterPrompts.some((entry) => entry.prompt.includes("Stripe vs Lemon Squeezy")),
  "expected shipped debate starter prompts",
)

const blueprint = buildPresetTeamBlueprint({
  executionMode: definition!.executionMode,
  key: definition!.key,
  members: definition!.members.map((member) => ({
    agentKey: member.agentKey,
    displayName: member.displayName,
    replyPolicy: member.replyPolicy,
    role: member.role,
  })),
  teamDisplayName: definition!.teamDisplayName,
})

assert.ok(blueprint, "expected a version 3 preset-team blueprint")
assert.equal(blueprint?.version, 3)
assert.equal(blueprint?.presetKey, "debate-and-verdict")
assert.equal(blueprint?.teamDisplayName, "Debate and Verdict")
assert.equal(blueprint?.leadAgentKey, "preset:debate-and-verdict:moderator")
assert.equal(
  blueprint?.presetState?.currentSpeakerKey,
  "preset:debate-and-verdict:moderator",
)
assert.equal(blueprint?.presetState?.nextTurnIndex, 0)
assert.equal(blueprint?.presetState?.runStatus, "running")
assert.equal(blueprint?.presetState?.cycleNumber, 1)

const serialized = serializeRequestTeamBlueprint(blueprint)
assert.ok(serialized, "expected serialized preset-team blueprint")
assert.deepEqual(parseRequestTeamBlueprint(serialized), blueprint)

const listings = listPublicPresetTeamCatalogEntries()
assert.equal(listings.length, 1)
assert.equal(listings[0]?.title, "Debate and Verdict")
assert.equal(listings[0]?.sourceCapabilityId, sourceCapabilityId)
assert.equal(listings[0]?.supplyType, "collective")

console.log("smoke-preset-teams passed")
