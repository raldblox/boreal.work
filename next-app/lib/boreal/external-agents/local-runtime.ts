type LocalRuntimeSupplyShape = {
  capabilityTags?: string[] | null;
  executionSurface?: string | null;
  executorUrl?: string | null;
  mcpServerUrl?: string | null;
  sourceProviderKey?: string | null;
  supportsDirectInvoke?: boolean | null;
  title?: string | null;
};

const LOCAL_RUNTIME_TAGS = new Set([
  "local",
  "local-runtime",
  "localhost",
  "lmstudio",
  "ollama",
  "request-runtime",
  "runtime",
])

export function isLoopbackHostname(hostname: string) {
  const normalized = hostname.trim().toLowerCase()
  return (
    normalized === "127.0.0.1" ||
    normalized === "::1" ||
    normalized === "[::1]" ||
    normalized === "localhost"
  )
}

export function parseRuntimeEndpoint(
  endpoint: string | null | undefined
): URL | null {
  if (!endpoint) {
    return null
  }

  try {
    return new URL(endpoint)
  } catch {
    return null
  }
}

export function isLocalRuntimeEndpoint(endpoint: string | null | undefined) {
  const parsed = parseRuntimeEndpoint(endpoint)
  if (!parsed) {
    return false
  }

  return isLoopbackHostname(parsed.hostname)
}

export function isLocalRuntimeSupply(input: LocalRuntimeSupplyShape) {
  if (
    input.sourceProviderKey !== "manual" ||
    !input.supportsDirectInvoke ||
    !(
      input.executionSurface === "http" ||
      input.executionSurface === "jsonrpc" ||
      input.executionSurface === "mcp"
    )
  ) {
    return false
  }

  if (
    isLocalRuntimeEndpoint(input.executorUrl) ||
    isLocalRuntimeEndpoint(input.mcpServerUrl)
  ) {
    return true
  }

  const tags = (input.capabilityTags ?? []).map((tag) => tag.toLowerCase())
  if (tags.some((tag) => LOCAL_RUNTIME_TAGS.has(tag))) {
    return true
  }

  const title = input.title?.trim().toLowerCase() ?? ""
  return (
    title.includes("ollama") ||
    title.includes("lm studio") ||
    title.includes("lmstudio") ||
    title.includes("local runtime")
  )
}

export function buildLocalRuntimeCapabilityTags(
  runtimeKind: "custom" | "lmstudio" | "ollama"
) {
  const kindTag =
    runtimeKind === "lmstudio"
      ? "lmstudio"
      : runtimeKind === "ollama"
        ? "ollama"
        : "custom"

  return [
    "local-runtime",
    "request-runtime",
    "runtime",
    kindTag,
    "text",
  ]
}

export function getRuntimeHealthUrl(endpoint: string) {
  const parsed = parseRuntimeEndpoint(endpoint)

  if (!parsed) {
    return null
  }

  parsed.pathname = "/health"
  parsed.search = ""
  parsed.hash = ""
  return parsed.toString()
}
