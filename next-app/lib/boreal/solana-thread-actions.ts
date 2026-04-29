import { getDefaultSolanaNetworkKey, type BorealSolanaNetworkKey } from "./solana-network.ts"

const SOLANA_ACTION_MARKER = "BOREAL_SOLANA_ACTION"
const BASE58_ALPHABET =
  "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz"
const MAINNET_RPC_URL = "https://api.mainnet-beta.solana.com"
const TESTNET_RPC_URL = "https://api.testnet.solana.com"
const MEMO_PROGRAM_ADDRESS = "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr"

type SolanaThreadActionBase = {
  actionId: string
  createdAt: number
  networkKey: BorealSolanaNetworkKey
  version: 1
}

export type SolanaTransferSolAction = SolanaThreadActionBase & {
  amountLamports: string
  amountSol: string
  destination: string
  kind: "transfer_sol"
}

export type SolanaMemoAction = SolanaThreadActionBase & {
  kind: "memo"
  memo: string
}

export type SolanaSignMessageAction = SolanaThreadActionBase & {
  kind: "sign_message"
  message: string
}

export type SolanaThreadAction =
  | SolanaTransferSolAction
  | SolanaMemoAction
  | SolanaSignMessageAction

export type SolanaThreadActionPlan =
  | { action: SolanaThreadAction; kind: "preview" }
  | { kind: "clarify"; message: string }
  | { kind: "none" }

export type ParsedSolanaThreadMessage = {
  action: SolanaThreadAction | null
  text: string
}

export function planSolanaThreadAction(input: {
  actionId?: string
  message: string
  networkKey?: BorealSolanaNetworkKey
}): SolanaThreadActionPlan {
  const normalizedMessage = input.message.trim()
  const networkKey = input.networkKey ?? getDefaultSolanaNetworkKey()
  const actionId = input.actionId ?? crypto.randomUUID()
  const createdAt = Date.now()

  const transferIntent = extractTransferIntent(normalizedMessage)

  if (transferIntent.detected) {
    if (!transferIntent.amountSol) {
      return {
        kind: "clarify",
        message: "I can send SOL on mainnet. What amount of SOL should I send?",
      }
    }

    if (!transferIntent.destination) {
      return {
        kind: "clarify",
        message:
          "I can send that on mainnet. What destination Solana address should receive the SOL?",
      }
    }

    const amountLamports = parseSolAmountToLamports(transferIntent.amountSol)

    if (amountLamports === null) {
      return {
        kind: "clarify",
        message:
          "I could not parse that SOL amount safely. Send it as a plain number like `0.01 SOL`.",
      }
    }

    if (!isValidSolanaAddress(transferIntent.destination)) {
      return {
        kind: "clarify",
        message:
          "That destination does not look like a valid Solana address. Send the full base58 wallet address again.",
      }
    }

    return {
      action: {
        actionId,
        amountLamports: amountLamports.toString(),
        amountSol: normalizeSolAmount(transferIntent.amountSol),
        createdAt,
        destination: transferIntent.destination,
        kind: "transfer_sol",
        networkKey,
        version: 1,
      },
      kind: "preview",
    }
  }

  const memoIntent = extractMemoIntent(normalizedMessage)

  if (memoIntent.detected) {
    if (!memoIntent.memo) {
      return {
        kind: "clarify",
        message:
          "I can record a Solana memo on mainnet. What exact text should the memo contain?",
      }
    }

    return {
      action: {
        actionId,
        createdAt,
        kind: "memo",
        memo: memoIntent.memo,
        networkKey,
        version: 1,
      },
      kind: "preview",
    }
  }

  const signIntent = extractSignMessageIntent(normalizedMessage)

  if (signIntent.detected) {
    if (!signIntent.message) {
      return {
        kind: "clarify",
        message:
          "I can capture a wallet signature. What exact message should the wallet sign?",
      }
    }

    return {
      action: {
        actionId,
        createdAt,
        kind: "sign_message",
        message: signIntent.message,
        networkKey,
        version: 1,
      },
      kind: "preview",
    }
  }

  return { kind: "none" }
}

export function buildSolanaActionAssistantMessage(
  action: SolanaThreadAction,
  visibleText: string,
) {
  return `${visibleText.trim()}\n\n${serializeSolanaActionComment(action)}`
}

export function parseSolanaThreadMessage(message: string): ParsedSolanaThreadMessage {
  const match = message.match(/<!--\s*BOREAL_SOLANA_ACTION:([\s\S]+?)-->/)

  if (!match?.[1]) {
    return {
      action: null,
      text: message.trim(),
    }
  }

  try {
    const action = JSON.parse(match[1].trim()) as SolanaThreadAction

    if (!isSolanaThreadAction(action)) {
      throw new Error("Invalid Solana action marker.")
    }

    return {
      action,
      text: message.replace(match[0], "").trim(),
    }
  } catch {
    return {
      action: null,
      text: message.replace(match[0], "").trim(),
    }
  }
}

export function stripSolanaActionMarker(message: string) {
  return parseSolanaThreadMessage(message).text
}

export function getSolanaActionNetworkLabel(networkKey: BorealSolanaNetworkKey) {
  return networkKey === "solana:testnet" ? "Solana Testnet" : "Solana Mainnet"
}

export function getSolanaActionKindLabel(action: SolanaThreadAction) {
  switch (action.kind) {
    case "memo":
      return "Onchain memo"
    case "sign_message":
      return "Wallet signature"
    case "transfer_sol":
      return "SOL transfer"
  }
}

export function getSolanaActionButtonLabel(action: SolanaThreadAction) {
  switch (action.kind) {
    case "memo":
      return "Approve and send"
    case "sign_message":
      return "Approve signature"
    case "transfer_sol":
      return "Approve and send"
  }
}

export function getSolanaActionSummary(action: SolanaThreadAction) {
  switch (action.kind) {
    case "memo":
      return `Record "${action.memo}" as a Solana memo.`
    case "sign_message":
      return `Sign "${action.message}".`
    case "transfer_sol":
      return `Send ${action.amountSol} SOL to ${action.destination}.`
  }
}

export function getSolanaRpcUrlForNetwork(networkKey: BorealSolanaNetworkKey) {
  return networkKey === "solana:testnet" ? TESTNET_RPC_URL : MAINNET_RPC_URL
}

export function getSolanaMemoProgramAddress() {
  return MEMO_PROGRAM_ADDRESS
}

export function buildSolanaExplorerUrl(input: {
  networkKey: BorealSolanaNetworkKey
  signature: string
}) {
  const baseUrl = `https://explorer.solana.com/tx/${input.signature}`

  if (input.networkKey === "solana:testnet") {
    return `${baseUrl}?cluster=testnet`
  }

  return baseUrl
}

export function encodeBase58(bytes: Uint8Array) {
  if (bytes.length === 0) {
    return ""
  }

  const digits = [0]

  for (const value of bytes) {
    let carry = value

    for (let digitIndex = 0; digitIndex < digits.length; digitIndex += 1) {
      carry += digits[digitIndex]! << 8
      digits[digitIndex] = carry % 58
      carry = Math.floor(carry / 58)
    }

    while (carry > 0) {
      digits.push(carry % 58)
      carry = Math.floor(carry / 58)
    }
  }

  let encoded = ""

  for (const value of bytes) {
    if (value === 0) {
      encoded += BASE58_ALPHABET[0]
      continue
    }

    break
  }

  for (let index = digits.length - 1; index >= 0; index -= 1) {
    encoded += BASE58_ALPHABET[digits[index]!]!
  }

  return encoded
}

export function isValidSolanaAddress(value: string) {
  try {
    const decoded = decodeBase58(value)
    return decoded.length === 32
  } catch {
    return false
  }
}

export function parseSolAmountToLamports(amountSol: string) {
  const trimmed = amountSol.trim()

  if (!/^\d+(?:\.\d{1,9})?$/.test(trimmed)) {
    return null
  }

  const [whole, fraction = ""] = trimmed.split(".")
  const fractionPadded = fraction.padEnd(9, "0")

  try {
    const lamports =
      BigInt(whole) * BigInt(1_000_000_000) + BigInt(fractionPadded || "0")

    return lamports > BigInt(0) ? lamports : null
  } catch {
    return null
  }
}

export function compactHexLike(value: string, edgeLength = 8) {
  const trimmed = value.trim()

  if (trimmed.length <= edgeLength * 2 + 3) {
    return trimmed
  }

  return `${trimmed.slice(0, edgeLength)}...${trimmed.slice(-edgeLength)}`
}

function extractTransferIntent(message: string) {
  const detected = /\b(?:send|transfer)\b/i.test(message) && /\bsol\b/i.test(message)
  const amountMatch = message.match(/\b(\d+(?:\.\d{1,9})?)\s*sol\b/i)
  const destination = extractFirstSolanaAddress(message)

  return {
    amountSol: amountMatch?.[1] ?? null,
    destination,
    detected,
  }
}

function extractMemoIntent(message: string) {
  const detected =
    /\bmemo\b/i.test(message) ||
    /\bon[\s-]?chain\b/i.test(message) ||
    /\b(?:record|write|post)\b/i.test(message)

  if (!detected) {
    return {
      detected: false,
      memo: null,
    }
  }

  const quotedText = extractQuotedText(message)

  if (quotedText) {
    return {
      detected: true,
      memo: clampThreadText(quotedText),
    }
  }

  const recordMatch = message.match(
    /\b(?:record|write|post)\b\s+(.+?)\s+(?:on[\s-]?chain|to the chain|as a memo)\b/i,
  )

  if (recordMatch?.[1]) {
    return {
      detected: true,
      memo: clampThreadText(recordMatch[1]),
    }
  }

  return {
    detected: true,
    memo: null,
  }
}

function extractSignMessageIntent(message: string) {
  const detected =
    /\bsign\b/i.test(message) &&
    (/\bmessage\b/i.test(message) ||
      /\bownership\b/i.test(message) ||
      /\bprove\b/i.test(message))

  if (!detected) {
    return {
      detected: false,
      message: null,
    }
  }

  const quotedText = extractQuotedText(message)

  if (quotedText) {
    return {
      detected: true,
      message: clampThreadText(quotedText),
    }
  }

  const signMatch = message.match(/\bsign(?:\s+this|\s+message)?[:\s]+(.+)$/i)

  if (signMatch?.[1]) {
    const remainder = signMatch[1]
      .replace(/\bwith my wallet\b/i, "")
      .trim()

    if (remainder.length > 0) {
      return {
        detected: true,
        message: clampThreadText(remainder),
      }
    }
  }

  return {
    detected: true,
    message: null,
  }
}

function extractQuotedText(message: string) {
  const quoteMatch =
    message.match(/"([^"]+)"/) ??
    message.match(/'([^']+)'/) ??
    message.match(/[“”]([^“”]+)[“”]/)

  return quoteMatch?.[1]?.trim() || null
}

function extractFirstSolanaAddress(message: string) {
  const matches = message.match(/\b[1-9A-HJ-NP-Za-km-z]{32,44}\b/g) ?? []

  for (const candidate of matches) {
    if (isValidSolanaAddress(candidate)) {
      return candidate
    }
  }

  return null
}

function clampThreadText(value: string) {
  return value.trim().replace(/\s+/g, " ").slice(0, 240)
}

function decodeBase58(value: string) {
  const digits = [0]

  for (const character of value) {
    const index = BASE58_ALPHABET.indexOf(character)

    if (index === -1) {
      throw new Error("Invalid base58 value.")
    }

    let carry = index

    for (let digitIndex = 0; digitIndex < digits.length; digitIndex += 1) {
      carry += digits[digitIndex]! * 58
      digits[digitIndex] = carry & 0xff
      carry >>= 8
    }

    while (carry > 0) {
      digits.push(carry & 0xff)
      carry >>= 8
    }
  }

  for (const character of value) {
    if (character === "1") {
      digits.push(0)
    } else {
      break
    }
  }

  return Uint8Array.from(digits.reverse())
}

function normalizeSolAmount(value: string) {
  const [whole, fraction = ""] = value.trim().split(".")
  const trimmedFraction = fraction.replace(/0+$/, "")

  return trimmedFraction.length > 0 ? `${whole}.${trimmedFraction}` : whole
}

function serializeSolanaActionComment(action: SolanaThreadAction) {
  return `<!-- ${SOLANA_ACTION_MARKER}:${JSON.stringify(action)} -->`
}

function isSolanaThreadAction(value: unknown): value is SolanaThreadAction {
  if (!value || typeof value !== "object") {
    return false
  }

  const action = value as Partial<SolanaThreadAction>

  if (
    action.version !== 1 ||
    typeof action.actionId !== "string" ||
    typeof action.createdAt !== "number" ||
    (action.networkKey !== "solana:mainnet" &&
      action.networkKey !== "solana:testnet")
  ) {
    return false
  }

  switch (action.kind) {
    case "memo":
      return typeof action.memo === "string"
    case "sign_message":
      return typeof action.message === "string"
    case "transfer_sol":
      return (
        typeof action.amountLamports === "string" &&
        typeof action.amountSol === "string" &&
        typeof action.destination === "string"
      )
    default:
      return false
  }
}
