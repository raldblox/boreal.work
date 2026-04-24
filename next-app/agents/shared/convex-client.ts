import { ConvexHttpClient } from "convex/browser";

import { api } from "../../convex/_generated/api.js";
import { loadAgentEnv } from "./env.ts";

export { api };

export function createAgentConvexClient() {
  loadAgentEnv();
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;

  if (!url) {
    throw new Error("Missing NEXT_PUBLIC_CONVEX_URL for agent runtime.");
  }

  return new ConvexHttpClient(url);
}
