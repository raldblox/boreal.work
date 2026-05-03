import type { ProviderSelectionState } from "@/lib/boreal/provider-routing/types";
import { inferPresetTeamDefinitionFromRequestLike } from "@/lib/boreal/swarm/preset-teams";

const BOREAL_OPENAI_ROUTE_KEY = "openai-by-boreal";

export function canAutoConfirmProviderSelection(
  selection: ProviderSelectionState,
) {
  return (
    selection.options.length === 1 &&
    !selection.options[0]?.requiresPayment &&
    selection.defaultRouteKey === selection.options[0]?.routeKey &&
    selection.options[0].routeKey === BOREAL_OPENAI_ROUTE_KEY
  );
}

export function resolvePromptPresetTeamDefinition(input: {
  assignedAgent?: string | null;
  body?: string | null;
  message?: string | null;
  summary?: string | null;
  title?: string | null;
}) {
  const preferredTitle =
    input.message?.trim() ||
    input.title?.trim() ||
    input.body?.trim() ||
    undefined;
  const preferredSummary = [
    input.summary?.trim(),
    input.title?.trim(),
    input.body?.trim(),
  ]
    .filter((value): value is string => Boolean(value))
    .join(" ")
    .trim();

  return inferPresetTeamDefinitionFromRequestLike({
    assignedAgent: input.assignedAgent ?? null,
    summary: preferredSummary || null,
    title: preferredTitle ?? null,
  });
}
