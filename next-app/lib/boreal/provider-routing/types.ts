import type { BorealSolanaNetworkKey } from "@/lib/boreal/solana-network";
import type {
  ExecutionSurface,
  PaymentProtocol,
  ServiceProviderKey,
} from "@/lib/boreal/integrations/service-providers/types";

export type ProviderCompany = "anthropic" | "gemini" | "openai";

export type ProviderRouteDeliveryMode =
  | "boreal-hosted"
  | "provider-backed";

export type ProviderRoutePricingPolicy =
  | {
      amount: number;
      currency: "SOL";
      kind: "flat-sol";
      networkKey: BorealSolanaNetworkKey;
    }
  | {
      amount: number;
      currency: string;
      kind: "x402-fixed";
      networkHint: string | null;
    }
  | {
      kind: "free";
    };

export type ProviderRouteReceiptExpectation = {
  requiresSignedMessage: boolean;
  requiresTxHash: boolean;
  requiresVerification: boolean;
};

export type ProviderRouteMatrixEntry = {
  company: ProviderCompany;
  deliveryMode: ProviderRouteDeliveryMode;
  displayTitle: string;
  executionSurface: ExecutionSurface;
  fallbackOrder: number;
  networkHints: string[];
  paymentProtocol: PaymentProtocol;
  pricingPolicy: ProviderRoutePricingPolicy;
  providerKey: "boreal" | ServiceProviderKey;
  receiptExpectation: ProviderRouteReceiptExpectation;
  requiresPayment: boolean;
  routeKey: string;
  sourceCapabilityId?: string | null;
  sourceProviderKey?: ServiceProviderKey | null;
  subtitle: string;
  supportsDirectInvoke: boolean;
};

export type ProviderRouteQuote = {
  amount: number;
  authorizationMessage: string;
  currency: string;
  expiresAt: number;
  networkKey: BorealSolanaNetworkKey;
  payToAddress: string | null;
  payerSources: Array<"agentcash" | "openwallet">;
  paymentProtocol: PaymentProtocol;
  paymentReference: string;
  quoteToken: string;
  requestToken: string;
};

export type ProviderRouteOption = {
  accessLabel: string;
  company: ProviderCompany;
  deliveryMode: ProviderRouteDeliveryMode;
  displayTitle: string;
  executionSurface: ExecutionSurface;
  fallbackOrder: number;
  isDefault: boolean;
  networkHints: string[];
  paymentProtocol: PaymentProtocol;
  priceLabel: string;
  pricingPolicy: ProviderRoutePricingPolicy;
  providerKey: "boreal" | ServiceProviderKey;
  quote: ProviderRouteQuote | null;
  receiptExpectation: ProviderRouteReceiptExpectation;
  requiresPayment: boolean;
  routeKey: string;
  sourceCapabilityId?: string | null;
  sourceProviderKey?: ServiceProviderKey | null;
  subtitle: string;
  supportsDirectInvoke: boolean;
};

export type ProviderSelectionState = {
  defaultRouteKey: string;
  options: ProviderRouteOption[];
  preparedAt: number;
  promptHash: string;
  promptText: string;
  rateLimitReason?: string | null;
  selectedRouteKey?: string | null;
};

export type ProviderRouteConfirmationCommand = {
  command: "confirm_provider_route";
  paymentReceipt?: ProviderRoutePaymentReceipt | null;
  promptHash: string;
  routeKey: string;
};

export type ProviderRoutePaymentReceipt = {
  amount: number;
  currency: string;
  networkKey: BorealSolanaNetworkKey;
  payerSource: "agentcash" | "openwallet";
  quoteToken: string;
  requestToken: string;
  signature: string;
  signedMessage?: string;
  txHash: string;
  walletAddress: string;
};

export type PaymentAccessPolicy = {
  freeAccessEnabled: boolean;
  matchedAllowlistEntry: string | null;
  walletAddress: string | null;
  xIdentity: string | null;
};

export type NormalizedRequestReceipt = {
  amount: number;
  company: ProviderCompany;
  currency: string;
  paymentProtocol: PaymentProtocol;
  paymentReference: string | null;
  providerLabel: string;
  providerKey: string;
  quoteToken: string | null;
  recordedAt: number;
  requestToken: string | null;
  routeKey: string;
  routeLabel: string;
  status: "recorded" | "verified";
  txHash: string | null;
  verificationStatus: "receipt_recorded" | "verified";
  verifiedAt: number | null;
  walletAddress: string | null;
  networkKey: string;
};
