import {
  getDefaultSolanaCaip2,
  getDefaultSolanaNetworkKey,
  getDefaultSolanaPayToAddress,
  getDefaultSolanaSettlementMode,
  type BorealSolanaNetworkKey,
  type BorealSolanaSettlementMode,
} from "../solana-network.ts";

export type OneRequestBazaarMetadata = {
  category: "agentic-commerce";
  discoverable: boolean;
  tags: string[];
};

export type OneRequestSellerMetadata = {
  bazaar: OneRequestBazaarMetadata;
  networkKey: BorealSolanaNetworkKey;
  payToAddress: string | null;
  payToAsset: "SOL" | null;
  paymentProtocol: "x402";
  sellerId: "boreal-one-request";
  sellerName: string;
  settlementMode: BorealSolanaSettlementMode;
  x402NetworkId:
    | "solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1"
    | "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp"
    | "solana:4uhcVJyU9pJkvQyS88uRDiswHXSCkY3z";
};

const DEFAULT_SELLER_NAME = "Boreal";

export function getOneRequestSellerMetadata(): OneRequestSellerMetadata {
  const payToAddress = getDefaultSolanaPayToAddress();
  const networkKey = getDefaultSolanaNetworkKey();
  const settlementMode = getDefaultSolanaSettlementMode();
  const networkLabelTag = networkKey.replace(":", "-");

  return {
    bazaar: {
      category: "agentic-commerce",
      discoverable: payToAddress !== null,
      tags: [
        "one-request",
        "request-routing",
        "specialist-execution",
        "wallet-auth",
        networkLabelTag,
      ],
    },
    networkKey,
    payToAddress,
    payToAsset: payToAddress ? "SOL" : null,
    paymentProtocol: "x402",
    sellerId: "boreal-one-request",
    sellerName: process.env.BOREAL_ONE_REQUEST_SELLER_NAME?.trim() || DEFAULT_SELLER_NAME,
    settlementMode,
    x402NetworkId: getDefaultSolanaCaip2(),
  };
}
