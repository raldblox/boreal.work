export type MountedAgentStarterPrompt = {
  prompt: string
  title: string
}

const mountedAgentStarterPrompts: Record<
  string,
  ReadonlyArray<MountedAgentStarterPrompt>
> = {
  "motion-video-studio": [
    {
      prompt:
        "Generate an 8-second product hero video with a slow push-in, soft shadows, and a clean studio background.",
      title: "Generate a product hero shot",
    },
    {
      prompt:
        "Create a short launch visual loop with glowing UI panels, subtle camera motion, and a calm cinematic pace.",
      title: "Create a launch visual loop",
    },
    {
      prompt:
        "Generate a short app reveal clip that starts on a blurred interface and resolves into one clear product moment.",
      title: "Generate an app reveal clip",
    },
    {
      prompt:
        "Create a simple product teaser video with one object, one camera move, and a premium minimal look.",
      title: "Create a product teaser",
    },
  ],
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
  "startup-pressure-test": [
    {
      prompt:
        "Pressure test this startup idea and return the core assumption, three failure modes, problem validation, founder-market fit, and a blunt verdict: A request-native commerce layer that turns one chat ask into routed work across agents, providers, and freelancers.",
      title: "Pressure test a startup idea",
    },
    {
      prompt:
        "Tell me the single core assumption that must be true for this startup to work, then explain how to test it before building: A marketplace where buyers describe work in chat and the system routes it to the best executable path.",
      title: "Find the core assumption",
    },
    {
      prompt:
        "Find the three strongest reasons this startup could fail and rank them by severity: A tool that turns startup docs and chat threads into tracked execution work automatically.",
      title: "Rank the likely failure modes",
    },
    {
      prompt:
        "Give me a blunt verdict on whether this startup solves a painful enough problem to pay for: A browser-native workspace for founders to coordinate agents, freelancers, and providers from one request thread.",
      title: "Give a blunt verdict",
    },
  ],
  "voiceover-studio": [
    {
      prompt:
        'Turn this into a calm product voiceover: "One request in. Boreal finds the best path to work, delivery, proof, payout, and reputation."',
      title: "Read a product intro",
    },
    {
      prompt:
        'Generate a crisp demo narration for this script: "Describe the task, approve the route, and keep every update attached to the same work thread."',
      title: "Narrate a demo script",
    },
    {
      prompt:
        'Read this launch outro with a clear, confident tone: "Boreal keeps buyer intent, matched work, and delivery proof in one live thread."',
      title: "Record a launch outro",
    },
    {
      prompt:
        'Create a technical explainer voiceover from this script: "Boreal checks the executable path first, then routes requests across direct tools, providers, workers, or collectives."',
      title: "Voice a technical explainer",
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
