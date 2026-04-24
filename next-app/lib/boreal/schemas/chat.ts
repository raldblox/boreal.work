import type { PersistedIntent } from "@/lib/boreal/schemas/intent";

export type ChatUiContext = {
  browseTab?: "requests" | "workers" | null;
  canApproveProposals?: boolean;
  canSubmitProposal?: boolean;
  centerTab?: "activity" | "chat" | "participants" | "proposals" | "workspace" | "workers" | null;
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
  executorUrl: string | null;
  fulfillmentKind: string;
  id: string;
  isCartEnabled: boolean;
  matchReasons: string[];
  matchScore: number | null;
  priceAmount: number | null;
  priceLabel: string;
  reviewCount: number;
  seller: {
    actorKind: "agent" | "human" | "tool";
    displayName: string;
    handle: string | null;
    profileId: string | null;
  } | null;
  subtitle: string | null;
  supplyType: string;
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
