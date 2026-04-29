import type {
  ConnectWalletModalOptions,
  LoginModalOptions,
  PrivyClientConfig,
  WalletListEntry,
} from "@privy-io/react-auth"
import { toSolanaWalletConnectors } from "@privy-io/react-auth/solana"

const BOREAL_PRIVY_WALLET_LIST: WalletListEntry[] = [
  "phantom",
  "detected_solana_wallets",
  "metamask",
  "detected_ethereum_wallets",
  "wallet_connect_qr_solana",
]

export const BOREAL_PRIVY_WALLET_CHAIN_TYPE = "ethereum-and-solana" as const

export const borealPrivyConfig = {
  appearance: {
    showWalletLoginFirst: true,
    walletChainType: BOREAL_PRIVY_WALLET_CHAIN_TYPE,
    walletList: BOREAL_PRIVY_WALLET_LIST,
  },
  embeddedWallets: {
    ethereum: {
      createOnLogin: "off",
    },
    solana: {
      createOnLogin: "off",
    },
  },
  externalWallets: {
    solana: {
      connectors: toSolanaWalletConnectors({
        shouldAutoConnect: true,
      }),
    },
  },
} satisfies PrivyClientConfig

export function buildBorealPrivyLoginOptions(): LoginModalOptions {
  return {
    loginMethods: ["wallet"],
    walletChainType: BOREAL_PRIVY_WALLET_CHAIN_TYPE,
  }
}

export function buildBorealPrivyConnectWalletOptions(): ConnectWalletModalOptions {
  return {
    description:
      "Connect Phantom or another non-custodial Solana mainnet wallet for Boreal checkout and payouts.",
    walletChainType: BOREAL_PRIVY_WALLET_CHAIN_TYPE,
    walletList: BOREAL_PRIVY_WALLET_LIST,
  }
}

export function openBorealPrivyWalletModal(input: {
  authenticated: boolean
  connectWallet: (options?: ConnectWalletModalOptions) => void
  login: (options?: LoginModalOptions) => void
}) {
  if (input.authenticated) {
    input.connectWallet(buildBorealPrivyConnectWalletOptions())
    return
  }

  input.login(buildBorealPrivyLoginOptions())
}
