export type OneRequestSellerMetadata = {
  networkKey: "solana:devnet";
  payToAddress: string | null;
  payToAsset: "SOL" | null;
  paymentProtocol: "x402";
  sellerId: "boreal-one-request";
  sellerName: string;
  settlementMode: "devnet_quote_locked";
};

const DEFAULT_SELLER_NAME = "Boreal";

export function getOneRequestSellerMetadata(): OneRequestSellerMetadata {
  const payToAddress = process.env.BOREAL_ONE_REQUEST_PAYTO_SOLANA_DEVNET?.trim() || null;

  return {
    networkKey: "solana:devnet",
    payToAddress,
    payToAsset: payToAddress ? "SOL" : null,
    paymentProtocol: "x402",
    sellerId: "boreal-one-request",
    sellerName: process.env.BOREAL_ONE_REQUEST_SELLER_NAME?.trim() || DEFAULT_SELLER_NAME,
    settlementMode: "devnet_quote_locked",
  };
}
