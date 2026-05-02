type LocalRuntimeSupplyShape = {
  capabilityTags?: string[] | null;
  executionSurface?: string | null;
  executorUrl?: string | null;
  mcpServerUrl?: string | null;
  sourceProviderKey?: string | null;
  supportsDirectInvoke?: boolean | null;
  title?: string | null;
};

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

  return (
    (parsed.protocol === "http:" || parsed.protocol === "https:") &&
    isLoopbackHostname(parsed.hostname)
  )
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

  // Tags and titles are discovery hints only. Treat a supply as request-scoped
  // local runtime only when the stored execution endpoint itself is loopback.
  return (
    (input.executionSurface === "http" || input.executionSurface === "jsonrpc"
      ? isLocalRuntimeEndpoint(input.executorUrl)
      : false) ||
    (input.executionSurface === "mcp"
      ? isLocalRuntimeEndpoint(input.mcpServerUrl)
      : false)
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
