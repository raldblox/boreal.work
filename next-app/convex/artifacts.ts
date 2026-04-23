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
