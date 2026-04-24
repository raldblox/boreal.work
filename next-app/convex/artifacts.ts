import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

import { artifactKindValidator, artifactStatusValidator } from "./validators";

export const recordArtifactMetadata = mutation({
  args: {
    artifactKind: artifactKindValidator,
    conversationId: v.string(),
    intentKey: v.optional(v.string()),
    mediaType: v.optional(v.string()),
    metadataJson: v.optional(v.string()),
    provider: v.string(),
    remoteId: v.optional(v.string()),
    status: artifactStatusValidator,
    subtitle: v.string(),
    title: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const artifactId = await ctx.db.insert("artifacts", {
      artifactKind: args.artifactKind,
      conversationId: args.conversationId,
      createdAt: now,
      intentKey: args.intentKey,
      mediaType: args.mediaType,
      metadataJson: args.metadataJson,
      provider: args.provider,
      remoteId: args.remoteId,
      status: args.status,
      subtitle: args.subtitle,
      title: args.title,
      updatedAt: now,
    });

    return { artifactId: artifactId as string };
  },
});

export const updateArtifactMetadata = mutation({
  args: {
    artifactId: v.id("artifacts"),
    mediaType: v.optional(v.string()),
    metadataJson: v.optional(v.string()),
    remoteId: v.optional(v.string()),
    status: artifactStatusValidator,
    subtitle: v.optional(v.string()),
    title: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const artifact = await ctx.db.get(args.artifactId);

    if (!artifact) {
      return { updated: false };
    }

    await ctx.db.patch(args.artifactId, {
      mediaType: args.mediaType ?? artifact.mediaType,
      metadataJson: args.metadataJson ?? artifact.metadataJson,
      remoteId: args.remoteId ?? artifact.remoteId,
      status: args.status,
      subtitle: args.subtitle ?? artifact.subtitle,
      title: args.title ?? artifact.title,
      updatedAt: Date.now(),
    });

    return { updated: true };
  },
});

export const syncVideoArtifactByRemoteId = mutation({
  args: {
    mediaType: v.optional(v.string()),
    metadataJson: v.optional(v.string()),
    remoteId: v.string(),
    status: artifactStatusValidator,
  },
  handler: async (ctx, args) => {
    const artifact = await ctx.db
      .query("artifacts")
      .withIndex("by_remoteId", (queryBuilder) =>
        queryBuilder.eq("remoteId", args.remoteId),
      )
      .unique();

    if (!artifact) {
      return { synced: false };
    }

    const now = Date.now();
    const metadata: Record<string, unknown> = mergeMetadata(
      artifact.metadataJson,
      args.metadataJson,
      args.remoteId,
    );

    await ctx.db.patch(artifact._id, {
      mediaType: args.mediaType ?? artifact.mediaType,
      metadataJson: JSON.stringify(metadata),
      status: args.status,
      updatedAt: now,
    });

    if (!artifact.intentKey) {
      return { synced: true };
    }

    const intent = await ctx.db
      .query("intents")
      .withIndex("by_intentKey", (queryBuilder) =>
        queryBuilder.eq("intentKey", artifact.intentKey!),
      )
      .unique();

    if (!intent) {
      return { synced: true };
    }

    const nextIntentStatus =
      args.status === "ready"
        ? "fulfilled"
        : args.status === "failed"
          ? "blocked"
          : "in_progress";

    await ctx.db.patch(intent._id, {
      completedAt: args.status === "ready" ? now : intent.completedAt,
      startedAt: intent.startedAt ?? now,
      status: nextIntentStatus,
      updatedAt: now,
    });

    await ctx.db.insert("activityEvents", {
      createdAt: now,
      entityId: intent.intentKey,
      entityType: "intent",
      payload: JSON.stringify({
        progress: typeof metadata["progress"] === "number" ? metadata["progress"] : 0,
        remoteId: args.remoteId,
        status: nextIntentStatus,
      }),
      type: args.status === "ready" ? "request.delivered" : "request.progressed",
    });

    if (
      typeof metadata["inlineMessageRecordedAt"] !== "number" &&
      (args.status === "ready" || args.status === "failed")
    ) {
      metadata["inlineMessageRecordedAt"] = now;

      await ctx.db.patch(artifact._id, {
        metadataJson: JSON.stringify(metadata),
        updatedAt: now,
      });

      await ctx.db.insert("chatMessages", {
        body:
          args.status === "ready"
            ? "Video completed. Playback and download are available in this request."
            : "Video generation failed. Adjust the prompt or retry the request.",
        conversationId: artifact.conversationId,
        createdAt: now,
        intentKey: intent.intentKey,
        messageId: crypto.randomUUID(),
        provider: artifact.provider,
        role: "assistant",
      });
    }

    return { synced: true };
  },
});

export const listConversationArtifacts = query({
  args: {
    conversationId: v.string(),
    limit: v.number(),
  },
  handler: async (ctx, args) => {
    const artifacts = await ctx.db
      .query("artifacts")
      .withIndex("by_conversationId_and_createdAt", (queryBuilder) =>
        queryBuilder.eq("conversationId", args.conversationId),
      )
      .order("desc")
      .take(args.limit);

    return artifacts.map((artifact) => ({
      _id: artifact._id,
      artifactKind: artifact.artifactKind,
      createdAt: artifact.createdAt,
      mediaType: artifact.mediaType ?? null,
      metadataJson: artifact.metadataJson ?? null,
      provider: artifact.provider,
      remoteId: artifact.remoteId ?? null,
      status: artifact.status,
      subtitle: artifact.subtitle,
      title: artifact.title,
      updatedAt: artifact.updatedAt,
    }));
  },
});

function mergeMetadata(
  existingJson: string | undefined,
  incomingJson: string | undefined,
  remoteId: string,
): Record<string, unknown> {
  const existing = parseJson(existingJson);
  const incoming = parseJson(incomingJson);

  return {
    ...existing,
    ...incoming,
    downloadUrl:
      incoming?.status === "completed" || incoming?.status === "ready"
        ? `/api/video-jobs/${remoteId}/content`
        : existing?.downloadUrl,
    jobId: remoteId,
  };
}

function parseJson(value: string | undefined) {
  if (!value) {
    return {};
  }

  try {
    return JSON.parse(value) as Record<string, unknown>;
  } catch {
    return {};
  }
}
