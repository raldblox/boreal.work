"use client"

import { useMemo, useState } from "react"
import {
  address,
  appendTransactionMessageInstructions,
  compileTransaction,
  createNoopSigner,
  createSolanaRpc,
  createTransactionMessage,
  getTransactionEncoder,
  pipe,
  setTransactionMessageFeePayerSigner,
  setTransactionMessageLifetimeUsingBlockhash,
} from "@solana/kit"
import { getTransferSolInstruction } from "@solana-program/system"
import {
  useSignAndSendTransaction,
  useSignMessage,
  useWallets,
} from "@privy-io/react-auth/solana"
import { CheckCircle2Icon, ExternalLinkIcon, Loader2Icon, WalletIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  buildSolanaExplorerUrl,
  compactHexLike,
  encodeBase58,
  getSolanaActionButtonLabel,
  getSolanaActionKindLabel,
  getSolanaActionNetworkLabel,
  getSolanaActionSummary,
  getSolanaMemoProgramAddress,
  getSolanaRpcUrlForNetwork,
  type SolanaThreadAction,
} from "@/lib/boreal/solana-thread-actions"

export function SolanaThreadActionCard({
  action,
  intentId,
  isCompleted,
  preferredWalletAddress,
  onRecorded,
}: {
  action: SolanaThreadAction
  intentId: string
  isCompleted: boolean
  onRecorded?: () => void
  preferredWalletAddress?: string | null
}) {
  const { wallets } = useWallets()
  const { signAndSendTransaction } = useSignAndSendTransaction()
  const { signMessage } = useSignMessage()
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [recordedSignature, setRecordedSignature] = useState<string | null>(null)

  const selectedWallet = useMemo(() => {
    if (!wallets.length) {
      return null
    }

    return (
      wallets.find((wallet) => wallet.address === preferredWalletAddress) ??
      wallets[0] ??
      null
    )
  }, [preferredWalletAddress, wallets])

  const explorerUrl =
    recordedSignature &&
    action.kind !== "sign_message"
      ? buildSolanaExplorerUrl({
          networkKey: action.networkKey,
          signature: recordedSignature,
        })
      : null

  async function handleApprove() {
    if (!selectedWallet || isSubmitting || isCompleted) {
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      if (action.kind === "sign_message") {
        const result = await signMessage({
          message: new TextEncoder().encode(action.message),
          options: {
            uiOptions: {
              description: "Approve this wallet signature request from Boreal.",
            },
          },
          wallet: selectedWallet,
        })
        const signature = encodeBase58(result.signature)

        await recordSolanaThreadAction({
          action,
          intentId,
          resultKind: "signature_captured",
          signature,
          walletAddress: selectedWallet.address,
        })

        setRecordedSignature(signature)
        onRecorded?.()
        return
      }

      const transaction = await buildTransactionBytes({
        action,
        walletAddress: selectedWallet.address,
      })
      const result = await signAndSendTransaction({
        chain: action.networkKey,
        options: {
          uiOptions: {
            buttonText: "Approve",
            description: "Approve this Solana transaction from Boreal.",
          },
        },
        transaction: Uint8Array.from(transaction),
        wallet: selectedWallet,
      })
      const signature = encodeBase58(result.signature)
      const nextExplorerUrl = buildSolanaExplorerUrl({
        networkKey: action.networkKey,
        signature,
      })

      await recordSolanaThreadAction({
        action,
        explorerUrl: nextExplorerUrl,
        intentId,
        resultKind: "transaction_submitted",
        signature,
        walletAddress: selectedWallet.address,
      })

      setRecordedSignature(signature)
      onRecorded?.()
    } catch (nextError) {
      setError(
        nextError instanceof Error
          ? nextError.message
          : "Could not complete this Solana action."
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="mt-3 space-y-3 border border-accent/30 bg-accent/5 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center border border-accent/30 bg-background px-2 py-1 text-[11px] tracking-[0.16em] text-accent-foreground uppercase">
              {getSolanaActionKindLabel(action)}
            </span>
            <span className="inline-flex items-center border border-border bg-background px-2 py-1 text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
              {getSolanaActionNetworkLabel(action.networkKey)}
            </span>
            {isCompleted || recordedSignature ? (
              <span className="inline-flex items-center gap-1 border border-border bg-background px-2 py-1 text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
                <CheckCircle2Icon className="size-3" />
                Recorded
              </span>
            ) : null}
          </div>
          <p className="text-sm font-medium">{getSolanaActionSummary(action)}</p>
          <p className="text-xs text-muted-foreground">
            Solana Operator prepared this for explicit wallet approval. Boreal
            does not sign on your behalf.
          </p>
        </div>
        <div className="space-y-1 text-right text-xs text-muted-foreground">
          <p className="inline-flex items-center gap-1">
            <WalletIcon className="size-3" />
            {selectedWallet
              ? compactHexLike(selectedWallet.address, 6)
              : "No Solana wallet connected"}
          </p>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {action.kind === "transfer_sol" ? (
          <>
            <Detail label="Amount" value={`${action.amountSol} SOL`} />
            <Detail label="Destination" value={action.destination} />
          </>
        ) : null}
        {action.kind === "memo" ? (
          <Detail
            label="Memo text"
            value={action.memo}
            wide
          />
        ) : null}
        {action.kind === "sign_message" ? (
          <Detail
            label="Message"
            value={action.message}
            wide
          />
        ) : null}
      </div>

      {error ? (
        <p className="text-xs text-destructive">{error}</p>
      ) : null}

      {recordedSignature ? (
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span>Signature {compactHexLike(recordedSignature)}</span>
          {explorerUrl ? (
            <Button asChild size="sm" type="button" variant="outline">
              <a href={explorerUrl} rel="noreferrer" target="_blank">
                <ExternalLinkIcon />
                Explorer
              </a>
            </Button>
          ) : null}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button
          disabled={!selectedWallet || isSubmitting || isCompleted}
          onClick={() => void handleApprove()}
          size="sm"
          type="button"
        >
          {isSubmitting ? <Loader2Icon className="animate-spin" /> : null}
          {getSolanaActionButtonLabel(action)}
        </Button>
        {explorerUrl ? (
          <Button asChild size="sm" type="button" variant="outline">
            <a href={explorerUrl} rel="noreferrer" target="_blank">
              <ExternalLinkIcon />
              Open explorer
            </a>
          </Button>
        ) : null}
      </div>
    </div>
  )
}

function Detail({
  label,
  value,
  wide,
}: {
  label: string
  value: string
  wide?: boolean
}) {
  return (
    <div
      className={
        wide
          ? "space-y-2 border border-border bg-background p-3 md:col-span-2"
          : "space-y-2 border border-border bg-background p-3"
      }
    >
      <p className="text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
        {label}
      </p>
      <p className="break-all text-sm">{value}</p>
    </div>
  )
}

async function buildTransactionBytes(input: {
  action: Exclude<SolanaThreadAction, { kind: "sign_message" }>
  walletAddress: string
}) {
  const rpc = createSolanaRpc(getSolanaRpcUrlForNetwork(input.action.networkKey))
  const { value: latestBlockhash } = await rpc.getLatestBlockhash().send()
  const feePayer = createNoopSigner(address(input.walletAddress))
  const instructions =
    input.action.kind === "transfer_sol"
      ? [
          getTransferSolInstruction({
            amount: BigInt(input.action.amountLamports),
            destination: address(input.action.destination),
            source: feePayer,
          }),
        ]
      : [
          {
            data: new TextEncoder().encode(input.action.memo),
            programAddress: address(getSolanaMemoProgramAddress()),
          },
        ]

  const transactionMessage = pipe(
    createTransactionMessage({ version: 0 }),
    (message) => setTransactionMessageFeePayerSigner(feePayer, message),
    (message) => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, message),
    (message) => appendTransactionMessageInstructions(instructions, message)
  )

  return getTransactionEncoder().encode(compileTransaction(transactionMessage))
}

async function recordSolanaThreadAction(input: {
  action: SolanaThreadAction
  explorerUrl?: string
  intentId: string
  resultKind: "signature_captured" | "transaction_submitted"
  signature: string
  walletAddress: string
}) {
  const response = await fetch(`/api/requests/${input.intentId}/solana`, {
    body: JSON.stringify({
      action: input.action,
      explorerUrl: input.explorerUrl,
      resultKind: input.resultKind,
      signature: input.signature,
      walletAddress: input.walletAddress,
    }),
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
  })

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as
      | { error?: string }
      | null

    throw new Error(payload?.error ?? "Could not record this Solana action.")
  }
}
