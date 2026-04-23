import { makeFunctionReference } from "convex/server";

import type { PersistedIntent } from "@/lib/boreal/schemas/intent";

export type RecordIntentPipelineArgs = {
  conversationId?: string;
  userMessage: string;
  assistantMessage: string;
  intent: PersistedIntent;
};

export type RecordIntentPipelineResult = {
  conversationId: string;
  intentId: string;
  userMessageId: string;
  assistantMessageId: string;
};

export type RecentIntentPreview = {
  _id: string;
  _creationTime: number;
  title: string;
  summary: string;
  category: string;
  requestedOutputTypes: PersistedIntent["requestedOutputTypes"];
  routing: PersistedIntent["routing"];
  generationSignals: PersistedIntent["generationSignals"];
};

export const convexFunctionRefs = {
  recordIntentPipeline: makeFunctionReference<
    "mutation",
    RecordIntentPipelineArgs,
    RecordIntentPipelineResult
  >("chats:recordIntentPipeline"),
  listRecentIntents: makeFunctionReference<
    "query",
    { limit: number },
    RecentIntentPreview[]
  >("intents:listRecent"),
};
