import "server-only";

import { generateText } from "ai";

import type { MyProfileRecord } from "@/lib/boreal/integrations/convex/function-refs";
import type { BorealProviderAdapter } from "@/lib/boreal/integrations/providers/types";
import {
  buildProfileBuilderDraftFromRecord,
  normalizeProfileBuilderDraft,
  type ProfileBuilderDraft,
} from "@/lib/boreal/schemas/profile-builder";

export async function draftProfileBuilder(input: {
  currentProfile: MyProfileRecord | null;
  message: string;
  modelId: string;
  provider: BorealProviderAdapter;
}): Promise<ProfileBuilderDraft> {
  const current = buildProfileBuilderDraftFromRecord(input.currentProfile);
  const { text } = await generateText({
    model: input.provider.getAssistantModel(input.modelId),
    prompt: buildPrompt({
      current,
      currentProfile: input.currentProfile,
      message: input.message,
    }),
  });

  return normalizeProfileBuilderDraft(extractJsonObject(text), {
    current,
    displayName: input.currentProfile?.profile.displayName ?? input.currentProfile?.user.displayName,
  });
}

function buildPrompt(input: {
  current: ProfileBuilderDraft;
  currentProfile: MyProfileRecord | null;
  message: string;
}) {
  return [
    "You are Boreal's profile and supply listing drafter.",
    "Turn the user's freeform brief into one JSON object only.",
    "Do not use markdown fences.",
    "{",
    '  "profile": {',
    '    "displayName": string,',
    '    "headline": string,',
    '    "bio": string,',
    '    "availabilityStatus": "available" | "limited" | "unavailable",',
    '    "isPublic": boolean,',
    '    "skillTags": string[],',
    '    "capabilityTags": string[],',
    '    "productLabels": string[]',
    "  },",
    '  "listing": {',
    '    "enabled": boolean,',
    '    "title": string,',
    '    "subtitle": string,',
    '    "description": string,',
    '    "category": string,',
    '    "supplyType": "product" | "capability" | "agent_tool" | "collective",',
    '    "deliveryType": "async" | "instant" | "scheduled",',
    '    "priceType": "fixed" | "hourly" | "scoped",',
    '    "priceAmount": number | null,',
    '    "estimatedDeliveryLabel": string,',
    '    "capabilityTags": string[]',
    "  }",
    "}",
    "Rules:",
    "- Keep every field practical and concise.",
    "- Draft a public professional profile, not a chat reply.",
    "- When the brief mentions selling digital items or downloadable goods, set listing.enabled true and choose supplyType product.",
    "- When the brief is about services or expertise, set listing.enabled true and choose supplyType capability unless a stronger fit is obvious.",
    "- When the brief is really about syncing or reselling an external provider-backed service, do not invent a Boreal-native listing. Keep listing.enabled false unless the user clearly also wants a direct Boreal offer draft.",
    "- If the user is too vague, keep the draft safe and generic but still useful to edit manually.",
    "- Never invent fake credentials, employers, portfolio clients, or exact prices unless the user gave enough signal. Use null for priceAmount when uncertain.",
    "- capabilityTags and skillTags should be short searchable tags.",
    "- bio should explain what the person offers, who it is for, and what makes them useful on Boreal.",
    `Current profile snapshot: ${JSON.stringify(input.current)}`,
    input.currentProfile
      ? `Current Boreal record: ${JSON.stringify({
          actorKind: input.currentProfile.profile.actorKind,
          displayName: input.currentProfile.profile.displayName,
          handle: input.currentProfile.profile.handle,
          supplyCount: input.currentProfile.supplies.length,
        })}`
      : "Current Boreal record: none",
    `User brief: """${input.message}"""`,
  ].join("\n");
}

function extractJsonObject(text: string): Record<string, unknown> {
  const trimmed = text.trim();

  try {
    return JSON.parse(trimmed) as Record<string, unknown>;
  } catch {
    const firstBrace = trimmed.indexOf("{");
    const lastBrace = trimmed.lastIndexOf("}");

    if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
      return {};
    }

    try {
      return JSON.parse(trimmed.slice(firstBrace, lastBrace + 1)) as Record<string, unknown>;
    } catch {
      return {};
    }
  }
}
