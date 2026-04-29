"use client"

import { useMemo, useState } from "react"
import { Buffer } from "buffer"
import {
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js"
import { CheckCircle2Icon, ExternalLinkIcon, WalletIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Spinner as LoaderIcon } from "@/components/ui/spinner"
import { usePayment } from "@/hooks/use-payment"
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
  const {
    defaultWalletAddress,
    isWalletReady,
    openWalletModal,
    solanaConnection,
    walletProvider,
  } = usePayment()
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [recordedSignature, setRecordedSignature] = useState<string | null>(null)

  const selectedWalletAddress = useMemo(() => {
    if (!defaultWalletAddress) {
      return null
    }

    if (
      preferredWalletAddress &&
      preferredWalletAddress.toLowerCase() !== defaultWalletAddress.toLowerCase()
    ) {
      return defaultWalletAddress
    }

    return preferredWalletAddress ?? defaultWalletAddress
  }, [defaultWalletAddress, preferredWalletAddress])

  const explorerUrl =
    recordedSignature &&
    action.kind !== "sign_message"
      ? buildSolanaExplorerUrl({
          networkKey: action.networkKey,
          signature: recordedSignature,
        })
      : null

  async function handleApprove() {
    if (isSubmitting || isCompleted) {
      return
    }

    if (!walletProvider || !selectedWalletAddress || !isWalletReady) {
      void openWalletModal()
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      if (action.kind === "sign_message") {
        const signatureBytes = await walletProvider.signMessage(
          new TextEncoder().encode(action.message)
        )
        const signature = encodeBase58(signatureBytes)

        await recordSolanaThreadAction({
          action,
          intentId,
          resultKind: "signature_captured",
          signature,
          walletAddress: selectedWalletAddress,
        })

        setRecordedSignature(signature)
        onRecorded?.()
        return
      }

      if (!solanaConnection) {
        throw new Error("Solana connection is not ready yet.")
      }

      const transaction = await buildTransaction({
        action,
        connection: solanaConnection,
        walletAddress: selectedWalletAddress,
      })
      const signature = await walletProvider.sendTransaction(
        transaction,
        solanaConnection
      )
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
        walletAddress: selectedWalletAddress,
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
            {selectedWalletAddress
              ? compactHexLike(selectedWalletAddress, 6)
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
          disabled={isSubmitting || isCompleted}
          onClick={() => void handleApprove()}
          size="sm"
          type="button"
        >
          {isSubmitting ? <LoaderIcon /> : null}
          {!selectedWalletAddress || !isWalletReady
            ? "Connect Solana wallet"
            : getSolanaActionButtonLabel(action)}
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

async function buildTransaction(input: {
  action: Exclude<SolanaThreadAction, { kind: "sign_message" }>
  connection: Connection
  walletAddress: string
}) {
  const feePayer = new PublicKey(input.walletAddress)
  const { blockhash } = await input.connection.getLatestBlockhash()
  const transaction = new Transaction({
    feePayer,
    recentBlockhash: blockhash,
  })
  const instructions =
    input.action.kind === "transfer_sol"
      ? [
          SystemProgram.transfer({
            fromPubkey: feePayer,
            lamports: Number(input.action.amountLamports),
            toPubkey: new PublicKey(input.action.destination),
          }),
        ]
      : [
          new TransactionInstruction({
            data: Buffer.from(new TextEncoder().encode(input.action.memo)),
            keys: [],
            programId: new PublicKey(getSolanaMemoProgramAddress()),
          }),
        ]

  transaction.add(...instructions)

  return transaction
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
