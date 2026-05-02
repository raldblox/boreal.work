"use client";

import { useEffect, useMemo, useState } from "react";
import { Buffer } from "buffer";
import {
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
  type Connection,
} from "@solana/web3.js";
import {
  CheckCircle2Icon,
  WalletIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Spinner as LoaderIcon } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import type {
  ProviderRouteOption,
  ProviderRoutePaymentReceipt,
  ProviderSelectionState,
} from "@/lib/boreal/provider-routing/types";
import {
  compactHexLike,
  getSolanaMemoProgramAddress,
} from "@/lib/boreal/solana-thread-actions";

type SolanaWalletProvider = {
  sendTransaction: (
    transaction: Transaction,
    connection: Connection,
  ) => Promise<string>;
  signMessage: (message: Uint8Array) => Promise<Uint8Array>;
};

export type ProviderSelectionWalletProvider = SolanaWalletProvider;

export function ProviderSelectionCard({
  headingSubtitle,
  headingTitle,
  isSubmitting,
  isWalletReady,
  onConfirmRoute,
  onConnectWallet,
  selection,
  walletAddress,
  walletConnection,
  walletProvider,
}: {
  headingSubtitle?: string;
  headingTitle?: string;
  isSubmitting: boolean;
  isWalletReady: boolean;
  onConfirmRoute: (input: {
    paymentReceipt?: ProviderRoutePaymentReceipt | null;
    routeKey: string;
  }) => Promise<void>;
  onConnectWallet: () => void;
  selection: ProviderSelectionState;
  walletAddress?: string | null;
  walletConnection?: Connection | null;
  walletProvider?: SolanaWalletProvider | null;
}) {
  const [selectedRouteKey, setSelectedRouteKey] = useState(
    selection.selectedRouteKey ?? selection.defaultRouteKey,
  );
  const [localError, setLocalError] = useState<string | null>(null);
  const [isPaying, setIsPaying] = useState(false);
  const selectedRoute = useMemo(
    () =>
      selection.options.find((option) => option.routeKey === selectedRouteKey) ??
      selection.options[0] ??
      null,
    [selectedRouteKey, selection.options],
  );

  useEffect(() => {
    setSelectedRouteKey(selection.selectedRouteKey ?? selection.defaultRouteKey);
    setLocalError(null);
  }, [selection.defaultRouteKey, selection.preparedAt, selection.selectedRouteKey]);

  async function handleConfirm() {
    if (!selectedRoute || isSubmitting || isPaying) {
      return;
    }

    setLocalError(null);

    if (!selectedRoute.requiresPayment) {
      await onConfirmRoute({ routeKey: selectedRoute.routeKey });
      return;
    }

    if (!walletProvider || !walletConnection || !walletAddress || !isWalletReady) {
      onConnectWallet();
      return;
    }

    if (!selectedRoute.quote) {
      setLocalError("This payment quote is missing. Pick the provider again.");
      return;
    }

    setIsPaying(true);

    try {
      const signedMessage = selectedRoute.quote.authorizationMessage;
      const signatureBytes = await walletProvider.signMessage(
        new TextEncoder().encode(signedMessage),
      );
      const paymentTransaction = await buildPaymentTransaction({
        amount: selectedRoute.quote.amount,
        connection: walletConnection,
        memo: selectedRoute.quote.paymentReference,
        payToAddress: selectedRoute.quote.payToAddress,
        walletAddress,
      });
      const txHash = await walletProvider.sendTransaction(
        paymentTransaction,
        walletConnection,
      );

      await onConfirmRoute({
        paymentReceipt: {
          amount: selectedRoute.quote.amount,
          currency: selectedRoute.quote.currency,
          networkKey: selectedRoute.quote.networkKey,
          payerSource: "openwallet",
          quoteToken: selectedRoute.quote.quoteToken,
          requestToken: selectedRoute.quote.requestToken,
          signature: Buffer.from(signatureBytes).toString("base64"),
          signedMessage,
          txHash,
          walletAddress,
        },
        routeKey: selectedRoute.routeKey,
      });
    } catch (error) {
      setLocalError(
        error instanceof Error
          ? error.message
          : "Could not prepare this provider payment.",
      );
    } finally {
      setIsPaying(false);
    }
  }

  return (
    <div className="space-y-4 border border-border bg-card px-4 py-4">
      <div className="space-y-1">
        <p className="text-sm font-medium">
          {headingTitle ?? "Pick your provider"}
        </p>
        <p className="text-xs text-muted-foreground">
          {headingSubtitle ??
            "Boreal keeps the prompt local until you confirm the route."}
        </p>
      </div>

      <div className="space-y-3">
        {selection.options.map((option) => {
          const isSelected = option.routeKey === selectedRoute?.routeKey;

          return (
            <button
              className={cn(
                "w-full border px-4 py-3 text-left transition",
                isSelected
                  ? "border-accent bg-accent/5"
                  : "border-border bg-background hover:border-accent/40",
              )}
              key={option.routeKey}
              onClick={() => {
                setLocalError(null);
                setSelectedRouteKey(option.routeKey);
              }}
              type="button"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium">{option.displayTitle}</p>
                    {option.isDefault ? (
                      <span className="inline-flex items-center border border-border px-2 py-1 text-[10px] tracking-[0.16em] text-muted-foreground uppercase">
                        Default
                      </span>
                    ) : null}
                    {isSelected ? (
                      <span className="inline-flex items-center gap-1 border border-accent px-2 py-1 text-[10px] tracking-[0.16em] text-accent-foreground uppercase">
                        <CheckCircle2Icon className="size-3" />
                        Selected
                      </span>
                    ) : null}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {option.subtitle}
                  </p>
                </div>
                <div className="space-y-1 text-right">
                  <p className="text-xs tracking-[0.16em] text-muted-foreground uppercase">
                    {option.accessLabel}
                  </p>
                  <p className="text-sm font-medium">{option.priceLabel}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {selectedRoute ? (
        <div className="space-y-3 border border-border bg-background px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-medium">{selectedRoute.displayTitle}</p>
            <span className="text-xs text-muted-foreground">
              {selectedRoute.deliveryMode === "boreal-hosted"
                ? "Boreal-hosted"
                : "Provider-backed"}
            </span>
          </div>
          <div className="flex flex-wrap gap-2 text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
            <span className="border border-border px-2 py-1">
              {selectedRoute.company}
            </span>
            <span className="border border-border px-2 py-1">
              {selectedRoute.paymentProtocol}
            </span>
            <span className="border border-border px-2 py-1">
              {selectedRoute.executionSurface}
            </span>
          </div>
          {selectedRoute.requiresPayment ? (
            <div className="space-y-1 text-xs text-muted-foreground">
              <p>
                Boreal will attach a signed wallet receipt and transaction proof
                to the request thread before work starts.
              </p>
              <p>
                {walletAddress
                  ? `Wallet ${compactHexLike(walletAddress, 6)}`
                  : "Connect a Solana wallet to continue."}
              </p>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              This route is free for the current access policy and starts
              immediately after confirmation.
            </p>
          )}
        </div>
      ) : null}

      {selection.rateLimitReason ? (
        <div className="border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs text-amber-100">
          {selection.rateLimitReason}
        </div>
      ) : null}

      {localError ? (
        <div className="border border-destructive/30 bg-destructive/10 px-4 py-3 text-xs text-destructive">
          {localError}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <Button
          disabled={!selectedRoute || isSubmitting || isPaying}
          onClick={() => void handleConfirm()}
          type="button"
        >
          {isSubmitting || isPaying ? <LoaderIcon /> : null}
          {selectedRoute?.requiresPayment
            ? !isWalletReady || !walletAddress
              ? "Connect wallet"
              : `Pay ${selectedRoute.priceLabel} and start`
            : `Run with ${selectedRoute?.displayTitle ?? "Boreal"}`}
        </Button>
        {selectedRoute?.requiresPayment && walletAddress ? (
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <WalletIcon className="size-3" />
            {compactHexLike(walletAddress, 6)}
          </span>
        ) : null}
      </div>
    </div>
  );
}

async function buildPaymentTransaction(input: {
  amount: number;
  connection: Connection;
  memo: string;
  payToAddress: string | null;
  walletAddress: string;
}) {
  const feePayer = new PublicKey(input.walletAddress);
  const { blockhash } = await input.connection.getLatestBlockhash();
  const transaction = new Transaction({
    feePayer,
    recentBlockhash: blockhash,
  });
  const instructions = [
    new TransactionInstruction({
      data: Buffer.from(new TextEncoder().encode(input.memo)),
      keys: [],
      programId: new PublicKey(getSolanaMemoProgramAddress()),
    }),
  ];

  if (input.payToAddress?.trim()) {
    instructions.unshift(
      SystemProgram.transfer({
        fromPubkey: feePayer,
        lamports: Math.max(1, Math.round(input.amount * 1_000_000_000)),
        toPubkey: new PublicKey(input.payToAddress),
      }),
    );
  }

  transaction.add(...instructions);
  return transaction;
}
