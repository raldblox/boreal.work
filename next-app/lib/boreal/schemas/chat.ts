import type { ToolUIPart } from "ai";

import type { PersistedIntent } from "@/lib/boreal/schemas/intent";
import type { ProfileBuilderDraft } from "@/lib/boreal/schemas/profile-builder";

export type ChatAssistantDebugEvent = {
  errorText?: string | null;
  id: string;
  input?: unknown;
  output?: unknown;
  state: ToolUIPart["state"];
  title: string;
  type: ToolUIPart["type"];
};

export type ChatUiContext = {
  browseTab?: "requests" | "workers" | null;
  canApproveProposals?: boolean;
  canSubmitProposal?: boolean;
  centerTab?: "activity" | "chat" | "participants" | "proposals" | "workspace" | "workers" | null;
  mountedSupplyActorKind?: "agent" | "human" | "tool" | null;
  mountedSupplyId?: string | null;
  mountedSupplyTitle?: string | null;
  requestId?: string | null;
  requestRole?: "none" | "owner" | "supplier" | "viewer";
  requestStatus?: string | null;
  surface: "home" | "request";
};

export type CatalogItem = {
  actorKind: "agent" | "human" | "tool";
  averageRating: number | null;
  brand: string | null;
  capabilityTags: string[];
  category: string;
  checkoutProtocol: "acp" | "custom" | "ucp" | null;
  currency: string;
  deliveryType: string;
  description: string;
  estimatedDeliveryLabel: string | null;
  executionSurface: "handoff" | "http" | "jsonrpc" | "mcp" | "registry" | "sdk" | "widget" | null;
  executorUrl: string | null;
  fulfillmentKind: string;
  gatedOutReasons: string[];
  id: string;
  isCartEnabled: boolean;
  isPinned: boolean;
  matchReasons: string[];
  matchScore: number | null;
  matchStage: "feasible" | "notified" | "ranked" | "reserved" | "retrieved" | null;
  paymentNetworkHints: string[];
  paymentProtocol: "direct-solana" | "mpp" | "none" | "widget" | "x402" | null;
  priceAmount: number | null;
  priceLabel: string;
  requiresHumanApproval: boolean;
  reviewCount: number;
  seller: {
    actorKind: "agent" | "human" | "tool";
    displayName: string;
    handle: string | null;
    profileId: string | null;
  } | null;
  sourceListingUrl: string | null;
  sourceProviderKey: "agentcash" | "agentic-market" | "frames" | "manual" | "moonpay" | "solana-agent-kit" | null;
  subtitle: string | null;
  supplyType: string;
  supportsDirectInvoke: boolean;
  supportsPrivyWallet: boolean;
  successProbability: number | null;
  title: string;
};

export type MediaArtifact =
  | {
      kind: "image";
      title: string;
      prompt: string;
      mediaType: string;
      base64: string;
    }
  | {
      kind: "audio";
      title: string;
      transcript: string;
      mediaType: string;
      base64: string;
      format: string;
      voice: string;
    }
  | {
      kind: "video";
      title: string;
      prompt: string;
      status: "queued" | "in_progress" | "completed" | "failed";
      jobId: string;
      model: string;
      progress: number;
      seconds: string;
      size: string;
      downloadUrl?: string;
      errorMessage?: string;
      expiresAt?: number;
    };

export type WorkspaceState =
  | {
      kind: "artifact";
      title: string;
      subtitle: string;
      artifact: MediaArtifact;
    }
  | {
      kind: "catalog";
      title: string;
      subtitle: string;
      items: CatalogItem[];
      highlightedId?: string;
    }
  | {
      kind: "clarification";
      title: string;
      subtitle: string;
      questions: string[];
      suggestions: string[];
    }
  | {
      kind: "profile_builder";
      title: string;
      subtitle: string;
      draft: ProfileBuilderDraft;
      sourceBrief: string;
    }
  | {
      kind: "empty";
      title: string;
      subtitle: string;
    };

export type ChatAssistantResponse = {
  conversationId: string;
  assistantMessage: string;
  intent: PersistedIntent;
  intentId?: string;
  requiresApproval: boolean;
  workspace: WorkspaceState;
  relatedCatalogItems: CatalogItem[];
  persisted: boolean;
};
