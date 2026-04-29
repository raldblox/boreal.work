import assert from "node:assert/strict"

import {
  address,
  appendTransactionMessageInstructions,
  compileTransaction,
  createNoopSigner,
  createTransactionMessage,
  getTransactionEncoder,
  pipe,
  setTransactionMessageFeePayerSigner,
  setTransactionMessageLifetimeUsingBlockhash,
} from "@solana/kit"
import { getTransferSolInstruction } from "@solana-program/system"

import {
  type SolanaThreadAction,
  buildSolanaActionAssistantMessage,
  getSolanaMemoProgramAddress,
  parseSolanaThreadMessage,
  planSolanaThreadAction,
} from "../lib/boreal/solana-thread-actions.ts"

const SOURCE_ADDRESS = "FnHyam9w4NZoWR6mKN1CuGBritdsEWZQa4Z4oawLZGxa"
const DESTINATION_ADDRESS = "9xQeWvG816bUx9EPiE7D4YQENWbQKGr2vJ8puG1HsRvN"
const DUMMY_BLOCKHASH = {
  blockhash: "11111111111111111111111111111111",
  lastValidBlockHeight: BigInt(1),
}

function main() {
  const transferPlan = planSolanaThreadAction({
    message: `Send 0.25 SOL to ${DESTINATION_ADDRESS}`,
  })

  assert.equal(transferPlan.kind, "preview")
  assert.equal(transferPlan.action.kind, "transfer_sol")
  assert.equal(transferPlan.action.networkKey, "solana:mainnet")
  assert.equal(transferPlan.action.amountLamports, "250000000")

  const transferMessage = buildSolanaActionAssistantMessage(
    transferPlan.action,
    "Transfer preview ready."
  )
  const parsedTransfer = parseSolanaThreadMessage(transferMessage)

  assert.equal(parsedTransfer.text, "Transfer preview ready.")
  assert.equal(parsedTransfer.action?.kind, "transfer_sol")

  const memoPlan = planSolanaThreadAction({
    message: 'Record "hi from boreal" onchain as a memo',
  })

  assert.equal(memoPlan.kind, "preview")
  assert.equal(memoPlan.action.kind, "memo")
  assert.equal(memoPlan.action.memo, "hi from boreal")

  const signPlan = planSolanaThreadAction({
    message: 'Sign message "ownership proof for boreal"',
  })

  assert.equal(signPlan.kind, "preview")
  assert.equal(signPlan.action.kind, "sign_message")

  const clarifyPlan = planSolanaThreadAction({
    message: "Transfer SOL for me",
  })

  assert.equal(clarifyPlan.kind, "clarify")

  const transferBytes = buildUnsignedTransactionBytes(transferPlan.action)
  const memoBytes = buildUnsignedTransactionBytes(memoPlan.action)

  assert.ok(transferBytes.length > 0)
  assert.ok(memoBytes.length > 0)

  console.log("smoke-solana-thread-actions: ok")
}

function buildUnsignedTransactionBytes(
  action: Extract<SolanaThreadAction, { kind: "memo" | "transfer_sol" }>
) {
  const feePayer = createNoopSigner(address(SOURCE_ADDRESS))
  const instructions =
    action.kind === "transfer_sol"
      ? [
          getTransferSolInstruction({
            amount: BigInt(action.amountLamports),
            destination: address(action.destination),
            source: feePayer,
          }),
        ]
      : [
          {
            data: new TextEncoder().encode(action.memo),
            programAddress: address(getSolanaMemoProgramAddress()),
          },
        ]

  const transactionMessage = pipe(
    createTransactionMessage({ version: 0 }),
    (message) => setTransactionMessageFeePayerSigner(feePayer, message),
    (message) =>
      setTransactionMessageLifetimeUsingBlockhash(
        DUMMY_BLOCKHASH as Parameters<
          typeof setTransactionMessageLifetimeUsingBlockhash
        >[0],
        message
      ),
    (message) => appendTransactionMessageInstructions(instructions, message)
  )

  return getTransactionEncoder().encode(compileTransaction(transactionMessage))
}

main()
