"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2Icon,
  WalletIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Spinner as LoaderIcon } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import type {
  ProviderRouteOption,
  ProviderSelectionState,
} from "@/lib/boreal/provider-routing/types";
import {
  compactHexLike,
} from "@/lib/boreal/solana-thread-actions";
export type ProviderSelectionWalletProvider = {
  signTransaction?: unknown;
};

export function ProviderSelectionCard({
  headingSubtitle,
  headingTitle,
  isSubmitting,
  isWalletReady,
  onConfirmRoute,
  onConnectWallet,
  paymentMode,
  selection,
  walletAddress,
}: {
  headingSubtitle?: string;
  headingTitle?: string;
  isSubmitting: boolean;
  isWalletReady: boolean;
  onConfirmRoute: (input: { routeKey: string }) => Promise<void>;
  onConnectWallet: () => void;
  paymentMode: "prepare" | "settle";
  selection: ProviderSelectionState;
  walletAddress?: string | null;
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

    if (selectedRoute.requiresPayment && paymentMode === "settle" && (!walletAddress || !isWalletReady)) {
      onConnectWallet();
      return;
    }

    try {
      setIsPaying(true);
      await onConfirmRoute({
        routeKey: selectedRoute.routeKey,
      });
    } catch (error) {
      setLocalError(
        error instanceof Error
          ? error.message
          : "Could not prepare this payment.",
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
                  {paymentMode === "settle" &&
                  option.requiresPayment &&
                  option.deliveryMode === "boreal-hosted" ? (
                    <p className="text-[11px] text-muted-foreground">
                      wallet fallback 0.0001 SOL
                    </p>
                  ) : null}
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
            {paymentMode === "settle" && selectedRoute.deliveryMode === "boreal-hosted" ? (
              <span className="border border-border px-2 py-1">
                wallet fallback 0.0001 SOL
              </span>
            ) : null}
          </div>
          {selectedRoute.requiresPayment ? (
            <div className="space-y-1 text-xs text-muted-foreground">
              <p>
                This route is x402 gated. Boreal only starts after a connected
                Solana wallet signs the payment.
              </p>
              <p>
                {paymentMode === "settle"
                  ? walletAddress
                    ? `Wallet ${compactHexLike(walletAddress, 6)} is ready to sign the payment.`
                    : "Connect a funded Solana wallet to sign the payment."
                  : "Opening this route creates a locked x402 request thread at 0.01 USDC."}
              </p>
              {paymentMode === "settle" && selectedRoute.deliveryMode === "boreal-hosted" ? (
                <p>
                  If x402 facilitator bootstrap is unavailable, Boreal falls back
                  to a direct wallet 0.0001 SOL payment from this same thread.
                </p>
              ) : null}
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
            ? paymentMode === "settle"
              ? !isWalletReady || !walletAddress
                ? "Connect Solana wallet to pay"
                : "Sign payment and start"
              : "Open x402 request"
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
