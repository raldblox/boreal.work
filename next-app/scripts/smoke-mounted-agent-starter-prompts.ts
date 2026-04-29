import assert from "node:assert/strict"

import {
  getMountedAgentStarterPromptInventory,
} from "../lib/boreal/agents/mounted-agent-starter-prompts.ts"
import { planSolanaThreadAction } from "../lib/boreal/solana-thread-actions.ts"

function main() {
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
