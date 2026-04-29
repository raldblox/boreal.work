export type MountedAgentStarterPrompt = {
  prompt: string
  title: string
}

const mountedAgentStarterPrompts: Record<
  string,
  ReadonlyArray<MountedAgentStarterPrompt>
> = {
  "solana-operator": [
    {
      prompt: 'Record "hello from Boreal" on Solana mainnet with a memo.',
      title: "Record a memo onchain",
    },
    {
      prompt: 'Sign message "hello from Boreal" with my Solana wallet.',
      title: "Sign a wallet message",
    },
    {
      prompt:
        "Send 0.001 SOL to <replace with destination address> on Solana mainnet.",
      title: "Send a small SOL transfer",
    },
    {
      prompt:
        "Plan a low-risk USDC to SOL swap on Solana mainnet with approval steps and risk notes.",
      title: "Plan a mainnet swap",
    },
    {
      prompt:
        "Plan how to stake SOL on Solana mainnet after swapping, including wallet checks, approvals, and risks.",
      title: "Plan staking safely",
    },
    {
      prompt:
        "Review a Solana wallet approval flow for safety and explain what I should check before signing.",
      title: "Review wallet approval safety",
    },
    {
      prompt:
        "Explain how Phantom or Solflare wallet setup works on Solana mainnet and what each approval step means.",
      title: "Explain wallet setup",
    },
    {
      prompt:
        "Compare two Solana execution paths for me and recommend the safer one with tradeoffs and irreversible risks.",
      title: "Compare two execution paths",
    },
  ],
}

export function getMountedAgentStarterPrompts(
  directAgentKeys: ReadonlyArray<string | null | undefined>,
) {
  if (directAgentKeys.length !== 1) {
    return []
  }

  const directAgentKey = directAgentKeys[0]

  if (!directAgentKey) {
    return []
  }

  return [...(mountedAgentStarterPrompts[directAgentKey] ?? [])]
}

export function getMountedAgentStarterPromptInventory(agentKey: string) {
  return [...(mountedAgentStarterPrompts[agentKey] ?? [])]
}
