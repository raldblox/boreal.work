import type { ToolRoute } from "./schemas/intent.ts";

import { isVideoProviderAccessUnavailableError } from "./request-route-errors.ts";

const WORKER_RECOVERY_ROUTES = new Set<ToolRoute>([
  "general_assistance",
  "image_generation",
  "speech_generation",
  "video_generation",
]);

export function supportsWorkerRecovery(routeTarget: ToolRoute) {
  return WORKER_RECOVERY_ROUTES.has(routeTarget);
}

export function shouldAutoReopenRequestForWorkers(
  routeTarget: ToolRoute,
  message: string,
) {
  if (!supportsWorkerRecovery(routeTarget)) {
    return false;
  }

  if (
    routeTarget === "video_generation" &&
    isVideoProviderAccessUnavailableError(message)
  ) {
    return true;
  }

  return true;
}

export function buildAutoReopenForWorkersCopy(input: {
  assignedAgent: string;
  message: string;
  routeTarget: ToolRoute;
}) {
  if (
    input.routeTarget === "video_generation" &&
    isVideoProviderAccessUnavailableError(input.message)
  ) {
    return {
      approvalMessage:
        "Video Generation is unavailable under the current OpenAI project or key, so Boreal reopened this request for workers immediately. Matched offers and proposals stay attached here.",
      assistantMessage:
        `Video Generation is unavailable under the current OpenAI project or key. Boreal reopened this request for workers immediately so you can approve a team instead of waiting on the blocked route. Last error: ${input.message}`,
    };
  }

  return {
    approvalMessage:
      `${input.assignedAgent} stalled on the automatic route, so Boreal reopened this request for workers. Matching and proposals stay attached here.`,
    assistantMessage:
      `${input.assignedAgent} could not complete this request automatically. Boreal reopened it for workers immediately so you can approve a team instead of waiting on the blocked route. Last error: ${input.message}`,
  };
}
