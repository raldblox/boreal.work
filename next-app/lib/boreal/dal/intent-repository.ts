import "server-only";

import { createConvexServerClient } from "@/lib/boreal/integrations/convex/server-client";
import {
  convexFunctionRefs,
  type ArtifactMetadataArgs,
  type CatalogEntry,
  type RecordIntentPipelineArgs,
  type UpdateArtifactMetadataArgs,
} from "@/lib/boreal/integrations/convex/function-refs";

export async function saveIntentPipelineRecord(args: RecordIntentPipelineArgs) {
  const client = createConvexServerClient();
  return client.mutation(convexFunctionRefs.recordIntentPipeline, args);
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
