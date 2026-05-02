"use client";

import { compactHexLike } from "@/lib/boreal/solana-thread-actions";
import type { NormalizedRequestReceipt } from "@/lib/boreal/provider-routing/types";

export function RequestReceiptCard({
  compact = false,
  receipt,
}: {
  compact?: boolean;
  receipt: NormalizedRequestReceipt;
}) {
  return (
    <div className="space-y-3 border border-border bg-card px-4 py-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-sm font-medium">{receipt.routeLabel}</p>
          <p className="text-xs text-muted-foreground">
            {receipt.providerLabel} / {receipt.company}
          </p>
        </div>
        <span className="inline-flex items-center border border-border px-2 py-1 text-[10px] tracking-[0.16em] text-muted-foreground uppercase">
          {receipt.status === "verified" ? "Verified" : "Receipt recorded"}
        </span>
      </div>

      <div className="flex flex-wrap gap-2 text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
        <span className="border border-border px-2 py-1">
          {receipt.amount} {receipt.currency}
        </span>
        <span className="border border-border px-2 py-1">
          {receipt.networkKey}
        </span>
        <span className="border border-border px-2 py-1">
          {receipt.paymentProtocol}
        </span>
      </div>

      <div className="space-y-1 text-xs text-muted-foreground">
        {receipt.paymentReference ? (
          <p>Reference: {receipt.paymentReference}</p>
        ) : null}
        {receipt.txHash ? <p>Tx: {compactHexLike(receipt.txHash)}</p> : null}
        {receipt.walletAddress ? (
          <p>Wallet: {compactHexLike(receipt.walletAddress, 6)}</p>
        ) : null}
        {!compact && receipt.requestToken ? (
          <p>Receipt token: {receipt.requestToken}</p>
        ) : null}
      </div>
    </div>
  );
}
