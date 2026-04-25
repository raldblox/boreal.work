type ConnectedWalletLike = {
  address?: string;
};

export function getDefaultPrivyWalletAddress(wallets: ConnectedWalletLike[]) {
  return wallets.find((wallet) => Boolean(wallet.address))?.address ?? null;
}
