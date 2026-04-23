import "server-only";

import { getBorealRuntimeConfig } from "@/lib/boreal/config";

import { createOpenAIProviderAdapter } from "./openai";
import type { BorealProviderAdapter } from "./types";

const providerFactories: Record<string, () => BorealProviderAdapter> = {
  openai: createOpenAIProviderAdapter,
};

export function resolveProviderAdapter(): BorealProviderAdapter {
  const config = getBorealRuntimeConfig();
  const factory = providerFactories[config.provider];

  if (!factory) {
    throw new Error(`No provider adapter registered for "${config.provider}".`);
  }

  return factory();
}

