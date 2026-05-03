import { Buffer } from "buffer";
import {
  PublicKey,
  TransactionInstruction,
} from "@solana/web3.js";

import {
  getDefaultSolanaNetworkKey,
  type BorealSolanaNetworkKey,
} from "../solana-network.ts";

export const SOLANA_SPL_TOKEN_PROGRAM_ADDRESS =
  "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
export const SOLANA_ASSOCIATED_TOKEN_PROGRAM_ADDRESS =
  "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL";
export const SOLANA_USDC_MAINNET_MINT_ADDRESS =
  "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
export const SOLANA_USDC_TESTNET_MINT_ADDRESS =
  "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU";
export const SOLANA_USDC_DECIMALS = 6;
const TOKEN_TRANSFER_CHECKED_INSTRUCTION_INDEX = 12;

export function getDefaultSolanaUsdcMintAddress(
  networkKey: BorealSolanaNetworkKey = getDefaultSolanaNetworkKey(),
) {
  return networkKey === "solana:testnet"
    ? SOLANA_USDC_TESTNET_MINT_ADDRESS
    : SOLANA_USDC_MAINNET_MINT_ADDRESS;
}

export function getDefaultSolanaUsdcTokenProgramAddress() {
  return SOLANA_SPL_TOKEN_PROGRAM_ADDRESS;
}

export function getDefaultSolanaUsdcDecimals() {
  return SOLANA_USDC_DECIMALS;
}

export function deriveAssociatedTokenAddress(input: {
  mintAddress: string;
  ownerAddress: string;
  tokenProgramAddress?: string;
}) {
  const mint = new PublicKey(input.mintAddress);
  const owner = new PublicKey(input.ownerAddress);
  const tokenProgram = new PublicKey(
    input.tokenProgramAddress ?? getDefaultSolanaUsdcTokenProgramAddress(),
  );
  const [address] = PublicKey.findProgramAddressSync(
    [owner.toBuffer(), tokenProgram.toBuffer(), mint.toBuffer()],
    new PublicKey(SOLANA_ASSOCIATED_TOKEN_PROGRAM_ADDRESS),
  );

  return address.toBase58();
}

export function toTokenAmountAtomic(
  amount: number,
  decimals = SOLANA_USDC_DECIMALS,
) {
  if (!Number.isFinite(amount) || amount < 0) {
    throw new Error("Token amount must be a positive number.");
  }

  const normalized = amount.toFixed(decimals);
  const [wholePart, fractionalPart = ""] = normalized.split(".");

  return BigInt(`${wholePart}${fractionalPart.padEnd(decimals, "0")}`);
}

export function createTransferCheckedInstruction(input: {
  amount: number;
  authorityAddress: string;
  decimals?: number;
  destinationTokenAccountAddress: string;
  mintAddress: string;
  sourceTokenAccountAddress: string;
  tokenProgramAddress?: string;
}) {
  const decimals = input.decimals ?? SOLANA_USDC_DECIMALS;
  const data = Buffer.alloc(10);
  data.writeUInt8(TOKEN_TRANSFER_CHECKED_INSTRUCTION_INDEX, 0);
  data.writeBigUInt64LE(toTokenAmountAtomic(input.amount, decimals), 1);
  data.writeUInt8(decimals, 9);

  return new TransactionInstruction({
    data,
    keys: [
      {
        isSigner: false,
        isWritable: true,
        pubkey: new PublicKey(input.sourceTokenAccountAddress),
      },
      {
        isSigner: false,
        isWritable: false,
        pubkey: new PublicKey(input.mintAddress),
      },
      {
        isSigner: false,
        isWritable: true,
        pubkey: new PublicKey(input.destinationTokenAccountAddress),
      },
      {
        isSigner: true,
        isWritable: false,
        pubkey: new PublicKey(input.authorityAddress),
      },
    ],
    programId: new PublicKey(
      input.tokenProgramAddress ?? getDefaultSolanaUsdcTokenProgramAddress(),
    ),
  });
}
