export type OneRequestBazaarMetadata = {
  category: "agentic-commerce";
  discoverable: boolean;
  tags: string[];
};

export type OneRequestSellerMetadata = {
  bazaar: OneRequestBazaarMetadata;
  networkKey: "solana:devnet";
  payToAddress: string | null;
  payToAsset: "SOL" | null;
  paymentProtocol: "x402";
  sellerId: "boreal-one-request";
  sellerName: string;
  settlementMode: "devnet_quote_locked";
  x402NetworkId: "solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1";
};

const DEFAULT_SELLER_NAME = "Boreal";
const X402_SOLANA_DEVNET_NETWORK_ID = "solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1";

export function getOneRequestSellerMetadata(): OneRequestSellerMetadata {
  const payToAddress = process.env.BOREAL_ONE_REQUEST_PAYTO_SOLANA_DEVNET?.trim() || null;

  return {
    bazaar: {
      category: "agentic-commerce",
      discoverable: payToAddress !== null,
      tags: [
        "one-request",
        "request-routing",
        "specialist-execution",
        "wallet-auth",
        "solana-devnet",
      ],
    },
    networkKey: "solana:devnet",
    payToAddress,
    payToAsset: payToAddress ? "SOL" : null,
    paymentProtocol: "x402",
    sellerId: "boreal-one-request",
    sellerName: process.env.BOREAL_ONE_REQUEST_SELLER_NAME?.trim() || DEFAULT_SELLER_NAME,
    settlementMode: "devnet_quote_locked",
    x402NetworkId: X402_SOLANA_DEVNET_NETWORK_ID,
  };
}
