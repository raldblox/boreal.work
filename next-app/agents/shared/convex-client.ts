import { ConvexHttpClient } from "convex/browser";

import { api } from "../../convex/_generated/api.js";
import {
  assertAgentRuntimeReady,
  resolveAgentConvexUrl,
} from "./runtime-config.ts";

export { api };

export function createAgentConvexClient() {
  // Refuse to boot until the selected runtime target has a usable Convex URL.
  assertAgentRuntimeReady();
  const url = resolveAgentConvexUrl();

  return new ConvexHttpClient(url);
}
