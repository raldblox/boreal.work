import "server-only";

import { createConvexServerClient } from "@/lib/boreal/integrations/convex/server-client";
import {
  convexFunctionRefs,
  type ArtifactMetadataArgs,
  type CatalogEntry,
  type MyProfileRecord,
  type RecordIntentPipelineArgs,
  type SyncVideoArtifactArgs,
  type UpdateArtifactMetadataArgs,
} from "@/lib/boreal/integrations/convex/function-refs";

export async function saveIntentPipelineRecord(args: RecordIntentPipelineArgs) {
  const client = createConvexServerClient();
  return client.mutation(convexFunctionRefs.recordIntentPipeline, args);
}

export async function saveConversationExchange(args: {
  assistantDisplayName?: string;
  assistantExternalId?: string;
  assistantHandle?: string;
  assistantMessage: string;
  assistantProvider?: string;
  conversationId?: string;
  ownerDisplayName?: string;
  ownerExternalId?: string;
  ownerHandle?: string;
  userMessage: string;
}) {
  const client = createConvexServerClient();
  return client.mutation(convexFunctionRefs.recordConversationExchange, args);
}

export async function appendConversationAssistantMessage(args: {
  assistantDisplayName?: string;
  assistantExternalId?: string;
  assistantHandle?: string;
  assistantMessage: string;
  assistantProvider?: string;
  conversationId: string;
  ownerExternalId?: string;
}) {
  const client = createConvexServerClient();
  return client.mutation(
    convexFunctionRefs.appendConversationAssistantMessage,
    args
  );
}

export async function approveRequestDraft(args: {
  assignedAgent?: string;
  assignedToolNames?: string[];
  assistantMessage?: string;
  intentId: string;
  ownerExternalId?: string;
  status?: "blocked" | "claimed" | "closed" | "fulfilled" | "in_progress" | "open" | "proposed";
}) {
  const client = createConvexServerClient();
  return client.mutation(convexFunctionRefs.approveRequest, args);
}

export async function cancelRequestDraft(args: {
  intentId: string;
  ownerExternalId?: string;
}) {
  const client = createConvexServerClient();
  return client.mutation(convexFunctionRefs.cancelRequest, args);
}

export async function archiveRequest(args: {
  intentId: string;
  ownerExternalId?: string;
}) {
  const client = createConvexServerClient();
  return client.mutation(convexFunctionRefs.archiveRequest, args);
}

export async function appendRequestExecution(args: {
  activityPayload?: string;
  activityType: string;
  assignedAgent?: string;
  assignedToolNames?: string[];
  assistantMessage: string;
  intentId: string;
  ownerExternalId?: string;
  status: string;
}) {
  const client = createConvexServerClient();
  return client.mutation(convexFunctionRefs.appendRequestExecution, args);
}

export async function rateRequest(args: {
  comment?: string;
  intentId: string;
  ownerExternalId?: string;
  rating: number;
}) {
  const client = createConvexServerClient();
  return client.mutation(convexFunctionRefs.rateRequest, args);
}

export async function postThreadMessage(args: {
  body: string;
  intentId: string;
  ownerDisplayName?: string;
  ownerExternalId?: string;
  ownerHandle?: string;
}) {
  const client = createConvexServerClient();
  return client.mutation(convexFunctionRefs.postThreadMessage, args);
}

export async function submitProposal(args: {
  currency: string;
  deliverablesBody: string;
  deliverablesType: "file" | "link" | "markdown";
  etaAt: number;
  intentId: string;
  ownerDisplayName?: string;
  ownerExternalId?: string;
  ownerHandle?: string;
  price: number;
  proposerKind?: "agent" | "human";
}) {
  const client = createConvexServerClient();
  return client.mutation(convexFunctionRefs.submitProposal, args);
}

export async function approveProposal(args: {
  intentId: string;
  ownerExternalId?: string;
  proposalId: string;
}) {
  const client = createConvexServerClient();
  return client.mutation(convexFunctionRefs.approveProposal, args);
}

export async function submitWork(args: {
  attachments?: Array<{
    fileName: string;
    mediaType: string;
    sizeBytes: number;
    storageId: string;
  }>;
  deliverablesBody: string;
  intentId: string;
  workerDisplayName?: string;
  workerExternalId?: string;
}) {
  const client = createConvexServerClient();
  return client.mutation(convexFunctionRefs.submitWork, args);
}

export async function markRequestFulfilled(args: {
  intentId: string;
  ownerExternalId?: string;
}) {
  const client = createConvexServerClient();
  return client.mutation(convexFunctionRefs.markRequestFulfilled, args);
}

export async function getRequestExecutionContext(args: {
  intentId: string;
  ownerExternalId?: string;
}) {
  const client = createConvexServerClient();
  return client.query(convexFunctionRefs.getExecutionContext, args);
}

export async function getRequestDetailRecord(args: {
  intentId: string;
  ownerExternalId?: string;
}) {
  const client = createConvexServerClient();
  return client.query(convexFunctionRefs.getRequestDetail, args);
}

export async function getMyProfileRecord(args: {
  ownerExternalId?: string;
}): Promise<MyProfileRecord> {
  const client = createConvexServerClient();
  return client.query(convexFunctionRefs.getMyProfile, args);
}

export async function ensureCatalogSeeded() {
  const client = createConvexServerClient();
  return client.mutation(convexFunctionRefs.ensureDefaultCatalog, {});
}

export async function listCatalogEntries(limit: number): Promise<CatalogEntry[]> {
  const client = createConvexServerClient();
  return client.query(convexFunctionRefs.listCatalog, { limit });
}

export async function searchCatalogEntries(
  query: string,
  limit: number,
): Promise<CatalogEntry[]> {
  const client = createConvexServerClient();
  return client.query(convexFunctionRefs.searchCatalog, { limit, query });
}

export async function saveArtifactMetadata(args: ArtifactMetadataArgs) {
  const client = createConvexServerClient();
  return client.mutation(convexFunctionRefs.recordArtifactMetadata, args);
}

export async function updateArtifactMetadata(args: UpdateArtifactMetadataArgs) {
  const client = createConvexServerClient();
  return client.mutation(convexFunctionRefs.updateArtifactMetadata, args);
}

export async function syncVideoArtifact(args: SyncVideoArtifactArgs) {
  const client = createConvexServerClient();
  return client.mutation(convexFunctionRefs.syncVideoArtifactByRemoteId, args);
}
