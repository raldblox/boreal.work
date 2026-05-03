import {
  getDefaultSolanaCaip2,
  getDefaultSolanaNetworkKey,
  getDefaultSolanaPayToAddress,
  getDefaultSolanaSettlementMode,
  type BorealSolanaNetworkKey,
  type BorealSolanaSettlementMode,
} from "../solana-network.ts";
import {
  deriveAssociatedTokenAddress,
  getDefaultSolanaUsdcDecimals,
  getDefaultSolanaUsdcMintAddress,
  getDefaultSolanaUsdcTokenProgramAddress,
} from "./solana-usdc.ts";

export type OneRequestBazaarMetadata = {
  category: "agentic-commerce";
  discoverable: boolean;
  tags: string[];
};

export type OneRequestSellerMetadata = {
  bazaar: OneRequestBazaarMetadata;
  networkKey: BorealSolanaNetworkKey;
  payToAddress: string | null;
  payToAsset: "USDC" | null;
  payToMintAddress: string | null;
  payToTokenAccountAddress: string | null;
  payToTokenDecimals: number | null;
  payToTokenProgramAddress: string | null;
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
  const payToMintAddress = payToAddress
    ? getDefaultSolanaUsdcMintAddress(networkKey)
    : null;
  const payToTokenProgramAddress = payToAddress
    ? getDefaultSolanaUsdcTokenProgramAddress()
    : null;
  const payToTokenDecimals = payToAddress
    ? getDefaultSolanaUsdcDecimals()
    : null;
  const payToTokenAccountAddress =
    payToAddress && payToMintAddress && payToTokenProgramAddress
      ? deriveAssociatedTokenAddress({
          mintAddress: payToMintAddress,
          ownerAddress: payToAddress,
          tokenProgramAddress: payToTokenProgramAddress,
        })
      : null;

  return {
    bazaar: {
      category: "agentic-commerce",
      discoverable: payToAddress !== null,
      tags: [
        "one-request",
        "request-routing",
        "specialist-execution",
        "usdc",
        "wallet-auth",
        networkLabelTag,
      ],
    },
    networkKey,
    payToAddress,
    payToAsset: payToAddress ? "USDC" : null,
    payToMintAddress,
    payToTokenAccountAddress,
    payToTokenDecimals,
    payToTokenProgramAddress,
    paymentProtocol: "x402",
    sellerId: "boreal-one-request",
    sellerName: process.env.BOREAL_ONE_REQUEST_SELLER_NAME?.trim() || DEFAULT_SELLER_NAME,
    settlementMode,
    x402NetworkId: getDefaultSolanaCaip2(),
  };
}
