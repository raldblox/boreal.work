import assert from "node:assert/strict"

import {
  getMountedAgentStarterPromptInventory,
} from "../lib/boreal/agents/mounted-agent-starter-prompts.ts"
import { planSolanaThreadAction } from "../lib/boreal/solana-thread-actions.ts"

function main() {
  const copywriterPrompts =
    getMountedAgentStarterPromptInventory("copywriter")
  assert.equal(copywriterPrompts.length, 4)
  assert.deepEqual(
    copywriterPrompts.map((entry) => entry.title),
    [
      "Write a landing page hero",
      "Draft a launch post",
      "Rewrite offer card copy",
      "Generate hooks and CTA",
    ],
  )

  const imagePrompts =
    getMountedAgentStarterPromptInventory("image-studio")
  assert.equal(imagePrompts.length, 4)
  assert.deepEqual(
    imagePrompts.map((entry) => entry.title),
    [
      "Generate a hero visual",
      "Generate a demo thumbnail",
      "Create launch art",
      "Generate a product graphic",
    ],
  )

  const voiceoverPrompts =
    getMountedAgentStarterPromptInventory("voiceover-studio")
  assert.equal(voiceoverPrompts.length, 4)
  assert.deepEqual(
    voiceoverPrompts.map((entry) => entry.title),
    [
      "Read a product intro",
      "Narrate a demo script",
      "Record a launch outro",
      "Voice a technical explainer",
    ],
  )

  const videoPrompts =
    getMountedAgentStarterPromptInventory("motion-video-studio")
  assert.equal(videoPrompts.length, 4)
  assert.deepEqual(
    videoPrompts.map((entry) => entry.title),
    [
      "Generate a product hero shot",
      "Create a launch visual loop",
      "Generate an app reveal clip",
      "Create a product teaser",
    ],
  )

  const startupPrompts =
    getMountedAgentStarterPromptInventory("startup-pressure-test")
  assert.equal(startupPrompts.length, 4)
  assert.deepEqual(
    startupPrompts.map((entry) => entry.title),
    [
      "Pressure test a startup idea",
      "Find the core assumption",
      "Rank the likely failure modes",
      "Give a blunt verdict",
    ],
  )

  const mvpPrompts =
    getMountedAgentStarterPromptInventory("mvp-architect")
  assert.equal(mvpPrompts.length, 4)
  assert.deepEqual(
    mvpPrompts.map((entry) => entry.title),
    [
      "Scope the smallest MVP",
      "Find the core assumption",
      "Reduce scope to two weeks",
      "Cut non-essential features",
    ],
  )

  const researchPrompts =
    getMountedAgentStarterPromptInventory("research-analyst")
  assert.equal(researchPrompts.length, 4)
  assert.deepEqual(
    researchPrompts.map((entry) => entry.title),
    [
      "Compare two tools",
      "Run a market scan",
      "Analyze a strategic tradeoff",
      "Write a decision memo",
    ],
  )

  const prompts = getMountedAgentStarterPromptInventory("solana-operator")

  assert.equal(prompts.length, 8)
  assert.deepEqual(
    prompts.map((entry) => entry.title),
    [
      "Record a memo onchain",
      "Sign a wallet message",
      "Send a small SOL transfer",
      "Plan a mainnet swap",
      "Plan staking safely",
      "Review wallet approval safety",
      "Explain wallet setup",
      "Compare two execution paths",
    ],
  )

  const memoPlan = planSolanaThreadAction({ message: prompts[0]!.prompt })
  assert.equal(memoPlan.kind, "preview")
  assert.equal(memoPlan.action.kind, "memo")

  const signPlan = planSolanaThreadAction({ message: prompts[1]!.prompt })
  assert.equal(signPlan.kind, "preview")
  assert.equal(signPlan.action.kind, "sign_message")

  const transferPlan = planSolanaThreadAction({ message: prompts[2]!.prompt })
  assert.equal(transferPlan.kind, "clarify")
  assert.match(
    transferPlan.message,
    /destination solana address/i,
  )

  for (const entry of prompts.slice(3)) {
    const plan = planSolanaThreadAction({ message: entry.prompt })
    assert.equal(
      plan.kind,
      "none",
      `${entry.title} should stay planning-only and not compile an onchain action`,
    )
  }

  console.log("smoke-mounted-agent-starter-prompts: ok")
}

main()
