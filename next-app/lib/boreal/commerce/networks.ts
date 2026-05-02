export type BorealChainEnvironment = "mainnet" | "testnet";
export type BorealChainFamily = "evm" | "solana";
export type BorealSupportedNetworkKey =
  | "base:mainnet"
  | "base:sepolia"
  | "ethereum:mainnet"
  | "ethereum:sepolia"
  | "polygon:amoy"
  | "polygon:mainnet"
  | "solana:mainnet"
  | "solana:testnet";

type NetworkDescriptor = {
  caip2: string;
  chainFamily: BorealChainFamily;
  chainId?: string;
  environment: BorealChainEnvironment;
  key: BorealSupportedNetworkKey;
  label: string;
};

const NETWORKS: Record<BorealSupportedNetworkKey, NetworkDescriptor> = {
  "base:mainnet": {
    caip2: "eip155:8453",
    chainFamily: "evm",
    chainId: "8453",
    environment: "mainnet",
    key: "base:mainnet",
    label: "Base Mainnet",
  },
  "base:sepolia": {
    caip2: "eip155:84532",
    chainFamily: "evm",
    chainId: "84532",
    environment: "testnet",
    key: "base:sepolia",
    label: "Base Sepolia",
  },
  "ethereum:mainnet": {
    caip2: "eip155:1",
    chainFamily: "evm",
    chainId: "1",
    environment: "mainnet",
    key: "ethereum:mainnet",
    label: "Ethereum Mainnet",
  },
  "ethereum:sepolia": {
    caip2: "eip155:11155111",
    chainFamily: "evm",
    chainId: "11155111",
    environment: "testnet",
    key: "ethereum:sepolia",
    label: "Ethereum Sepolia",
  },
  "polygon:amoy": {
    caip2: "eip155:80002",
    chainFamily: "evm",
    chainId: "80002",
    environment: "testnet",
    key: "polygon:amoy",
    label: "Polygon Amoy",
  },
  "polygon:mainnet": {
    caip2: "eip155:137",
    chainFamily: "evm",
    chainId: "137",
    environment: "mainnet",
    key: "polygon:mainnet",
    label: "Polygon Mainnet",
  },
  "solana:mainnet": {
    caip2: "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp",
    chainFamily: "solana",
    environment: "mainnet",
    key: "solana:mainnet",
    label: "Solana Mainnet",
  },
  "solana:testnet": {
    caip2: "solana:4uhcVJyU9pJkvQyS88uRDiswHXSCkY3z",
    chainFamily: "solana",
    environment: "testnet",
    key: "solana:testnet",
    label: "Solana Testnet",
  },
};

const NETWORK_BY_CAIP2 = new Map(
  Object.values(NETWORKS).map((network) => [network.caip2.toLowerCase(), network.key]),
);

const NETWORK_BY_CHAIN_ID = new Map(
  Object.values(NETWORKS)
    .filter((network) => network.chainId)
    .flatMap((network) => [
      [network.chainId!.toLowerCase(), network.key] as const,
      [`0x${Number(network.chainId).toString(16)}`.toLowerCase(), network.key] as const,
    ]),
);

export function listBorealSupportedNetworks() {
  return Object.values(NETWORKS);
}

export function getBorealNetworkDescriptor(
  key: BorealSupportedNetworkKey,
) {
  return NETWORKS[key];
}

export function getBorealChainEnvironment(
  explicit?: string | null,
): BorealChainEnvironment {
  const candidate =
    explicit ??
    process.env.BOREAL_CHAIN_ENV ??
    process.env.NEXT_PUBLIC_BOREAL_CHAIN_ENV ??
    process.env.NEXT_PUBLIC_SOLANA_ENV ??
    process.env.SOLANA_ENV ??
    "mainnet";
  const normalized = candidate.trim().toLowerCase();

  if (normalized === "mainnet") {
    return "mainnet";
  }

  if (normalized === "testnet") {
    return "testnet";
  }

  if (normalized === "devnet") {
    return "testnet";
  }

  return "mainnet";
}

export function getBorealPrimaryChainFamily(
  explicit?: string | null,
): BorealChainFamily {
  const candidate =
    explicit ??
    process.env.BOREAL_PRIMARY_CHAIN_FAMILY ??
    process.env.NEXT_PUBLIC_BOREAL_PRIMARY_CHAIN_FAMILY ??
    "solana";

  return candidate.trim().toLowerCase() === "evm" ? "evm" : "solana";
}

export function getDefaultBorealNetworkKey(input?: {
  chainFamily?: BorealChainFamily | null;
  environment?: BorealChainEnvironment | null;
}): BorealSupportedNetworkKey {
  const environment = input?.environment ?? getBorealChainEnvironment();
  const chainFamily = input?.chainFamily ?? getBorealPrimaryChainFamily();

  if (chainFamily === "solana") {
    if (environment === "testnet") {
      return "solana:testnet" satisfies BorealSupportedNetworkKey;
    }

    return "solana:mainnet" satisfies BorealSupportedNetworkKey;
  }

  if (environment === "mainnet") {
    return "base:mainnet" satisfies BorealSupportedNetworkKey;
  }

  return "base:sepolia" satisfies BorealSupportedNetworkKey;
}

export function normalizeBorealChainFamily(
  value?: string | null,
): BorealChainFamily | null {
  if (!value) {
    return null;
  }

  const normalized = value.trim().toLowerCase();

  if (
    normalized === "ethereum" ||
    normalized === "evm"
  ) {
    return "evm";
  }

  if (normalized === "solana") {
    return "solana";
  }

  return null;
}

export function normalizeBorealNetworkKey(
  value?: string | null,
): BorealSupportedNetworkKey | null {
  if (!value) {
    return null;
  }

  const normalized = value.trim().toLowerCase();

  if (normalized in NETWORKS) {
    return normalized as BorealSupportedNetworkKey;
  }

  if (NETWORK_BY_CAIP2.has(normalized)) {
    return NETWORK_BY_CAIP2.get(normalized)!;
  }

  if (NETWORK_BY_CHAIN_ID.has(normalized)) {
    return NETWORK_BY_CHAIN_ID.get(normalized)!;
  }

  switch (normalized) {
    case "base":
      return "base:mainnet";
    case "base sepolia":
      return "base:sepolia";
    case "ethereum":
      return "ethereum:mainnet";
    case "ethereum sepolia":
      return "ethereum:sepolia";
    case "polygon":
      return "polygon:mainnet";
    case "polygon amoy":
      return "polygon:amoy";
    case "solana":
      return "solana:mainnet";
    case "solana testnet":
      return "solana:testnet";
    default:
      return null;
  }
}

export function inferBorealNetworkSelection(input?: {
  chainFamily?: string | null;
  chainId?: string | null;
  environment?: BorealChainEnvironment | string | null;
  networkKey?: string | null;
}): {
  chainFamily: BorealChainFamily;
  environment: BorealChainEnvironment;
  networkKey: BorealSupportedNetworkKey;
} {
  const environment = getBorealChainEnvironment(input?.environment);
  const explicitFamily = normalizeBorealChainFamily(input?.chainFamily);
  const explicitNetworkKey =
    normalizeBorealNetworkKey(input?.networkKey) ??
    normalizeBorealNetworkKey(input?.chainId);

  if (explicitNetworkKey) {
    const descriptor = getBorealNetworkDescriptor(explicitNetworkKey);
    return {
      chainFamily: descriptor.chainFamily,
      environment: descriptor.environment,
      networkKey: descriptor.key,
    };
  }

  const fallbackFamily = explicitFamily ?? getBorealPrimaryChainFamily();
  const networkKey = getDefaultBorealNetworkKey({
    chainFamily: fallbackFamily,
    environment,
  });

  return {
    chainFamily: fallbackFamily,
    environment,
    networkKey,
  };
}

export function areBorealNetworksCompatible(input: {
  left?: BorealSupportedNetworkKey | null;
  right?: BorealSupportedNetworkKey | null;
}) {
  if (!input.left || !input.right) {
    return true;
  }

  return input.left === input.right;
}
