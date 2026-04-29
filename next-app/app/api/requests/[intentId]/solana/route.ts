import { NextResponse } from "next/server"

import { auth } from "@/lib/auth"
import { appendRequestExecution } from "@/lib/boreal/dal/intent-repository"
import {
  buildSolanaExplorerUrl,
  getSolanaActionKindLabel,
  getSolanaActionNetworkLabel,
  type SolanaThreadAction,
} from "@/lib/boreal/solana-thread-actions"

type RouteContext = {
  params: Promise<{
    intentId: string
  }>
}

export async function POST(request: Request, context: RouteContext) {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = (await request.json()) as Record<string, unknown>
    const action = body.action

    if (!isSolanaThreadAction(action)) {
      return NextResponse.json(
        { error: "A valid Solana action is required." },
        { status: 400 }
      )
    }

    const resultKind =
      body.resultKind === "signature_captured" ||
      body.resultKind === "transaction_submitted"
        ? body.resultKind
        : null
    const signature =
      typeof body.signature === "string" && body.signature.trim().length > 0
        ? body.signature.trim()
        : null
    const walletAddress =
      typeof body.walletAddress === "string" && body.walletAddress.trim().length > 0
        ? body.walletAddress.trim()
        : null

    if (!resultKind || !signature || !walletAddress) {
      return NextResponse.json(
        {
          error:
            "resultKind, signature, and walletAddress are required for Solana request updates.",
        },
        { status: 400 }
      )
    }

    const explorerUrl =
      typeof body.explorerUrl === "string" && body.explorerUrl.trim().length > 0
        ? body.explorerUrl.trim()
        : resultKind === "transaction_submitted"
          ? buildSolanaExplorerUrl({
              networkKey: action.networkKey,
              signature,
            })
          : null
    const { intentId } = await context.params

    await appendRequestExecution({
      activityPayload: JSON.stringify({
        actionId: action.actionId,
        actionKind: action.kind,
        assignedAgent: "Solana Operator",
        assignedToolNames: ["solana-operator"],
        explorerUrl,
        network: getSolanaActionNetworkLabel(action.networkKey),
        routeLabel: "Solana Operator",
        routeTarget: "solana_operator",
        signature,
        walletAddress,
        ...(action.kind === "memo" ? { memo: action.memo } : {}),
        ...(action.kind === "sign_message" ? { message: action.message } : {}),
        ...(action.kind === "transfer_sol"
          ? {
              amountSol: action.amountSol,
              destination: action.destination,
            }
          : {}),
      }),
      activityType:
        resultKind === "signature_captured"
          ? "request.solana_signature_captured"
          : "request.solana_transaction_submitted",
      assignedAgent: "Solana Operator",
      assignedToolNames: ["solana-operator"],
      assistantMessage: buildAssistantMessage({
        action,
        explorerUrl,
        resultKind,
        signature,
        walletAddress,
      }),
      intentId,
      ownerExternalId: session.user.id,
      status: "in_progress",
    })

    return NextResponse.json({ recorded: true })
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not record this Solana request update.",
      },
      { status: 500 }
    )
  }
}

function buildAssistantMessage(input: {
  action: SolanaThreadAction
  explorerUrl: string | null
  resultKind: "signature_captured" | "transaction_submitted"
  signature: string
  walletAddress: string
}) {
  const lines = [
    input.resultKind === "signature_captured"
      ? `Solana Operator captured the requested wallet signature on ${getSolanaActionNetworkLabel(input.action.networkKey)}.`
      : `Solana Operator submitted the approved ${getSolanaActionKindLabel(input.action).toLowerCase()} on ${getSolanaActionNetworkLabel(input.action.networkKey)}.`,
    `Wallet: ${input.walletAddress}`,
    `Signature: ${input.signature}`,
  ]

  if (input.action.kind === "memo") {
    lines.push(`Memo: ${input.action.memo}`)
  }

  if (input.action.kind === "sign_message") {
    lines.push(`Message: ${input.action.message}`)
  }

  if (input.action.kind === "transfer_sol") {
    lines.push(`Amount: ${input.action.amountSol} SOL`)
    lines.push(`Destination: ${input.action.destination}`)
  }

  if (input.explorerUrl) {
    lines.push(`Explorer: ${input.explorerUrl}`)
  }

  lines.push("Keep the request open until you decide the Solana work is complete.")

  return lines.join("\n")
}

function isSolanaThreadAction(value: unknown): value is SolanaThreadAction {
  if (!value || typeof value !== "object") {
    return false
  }

  const action = value as Partial<SolanaThreadAction>

  if (
    action.version !== 1 ||
    typeof action.actionId !== "string" ||
    typeof action.createdAt !== "number" ||
    (action.networkKey !== "solana:mainnet" &&
      action.networkKey !== "solana:testnet")
  ) {
    return false
  }

  switch (action.kind) {
    case "memo":
      return typeof action.memo === "string"
    case "sign_message":
      return typeof action.message === "string"
    case "transfer_sol":
      return (
        typeof action.amountLamports === "string" &&
        typeof action.amountSol === "string" &&
        typeof action.destination === "string"
      )
    default:
      return false
  }
}
