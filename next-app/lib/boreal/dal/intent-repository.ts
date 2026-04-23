import "server-only";

import { createConvexServerClient } from "@/lib/boreal/integrations/convex/server-client";
import {
  convexFunctionRefs,
  type RecordIntentPipelineArgs,
} from "@/lib/boreal/integrations/convex/function-refs";

export async function saveIntentPipelineRecord(args: RecordIntentPipelineArgs) {
  const client = createConvexServerClient();
  return client.mutation(convexFunctionRefs.recordIntentPipeline, args);
}

