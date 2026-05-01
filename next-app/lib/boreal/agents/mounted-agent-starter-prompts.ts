export type MountedAgentStarterPrompt = {
  prompt: string
  title: string
}

const mountedAgentStarterPrompts: Record<
  string,
  ReadonlyArray<MountedAgentStarterPrompt>
> = {
  copywriter: [
    {
      prompt:
        "Write a landing page hero for Boreal that makes request-native commerce obvious in one screen.",
      title: "Write a landing page hero",
    },
    {
      prompt:
        "Draft a launch post for an agentic commerce product with a sharp hook and clear value proposition.",
      title: "Draft a launch post",
    },
    {
      prompt:
        "Write product copy for an offer card that explains what the service does without internal jargon.",
      title: "Rewrite offer card copy",
    },
    {
      prompt:
        "Give me three headline options and a short CTA for a product that routes work from one request thread.",
      title: "Generate hooks and CTA",
    },
  ],
  "image-studio": [
    {
      prompt:
        "Create a clean hero visual for Boreal with one request thread, subtle teal accents, and a premium product feel.",
      title: "Generate a hero visual",
    },
    {
      prompt:
        "Make a cinematic thumbnail for a startup product demo about agentic commerce and request routing.",
      title: "Generate a demo thumbnail",
    },
    {
      prompt:
        "Create launch art for a product that connects agents, providers, and workers in one work thread.",
      title: "Create launch art",
    },
    {
      prompt:
        "Generate a minimal product graphic with dark UI, teal glow, and one clear focus object.",
      title: "Generate a product graphic",
    },
  ],
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
  "mvp-architect": [
    {
      prompt:
        "Design the smallest MVP for a request-native commerce product and end with a two-week launch plan.",
      title: "Scope the smallest MVP",
    },
    {
      prompt:
        "Identify the single core assumption for this startup idea and tell me what feature set actually tests it.",
      title: "Find the core assumption",
    },
    {
      prompt:
        "Cut this product idea down to a two-week build with one clear user behavior that proves demand.",
      title: "Reduce scope to two weeks",
    },
    {
      prompt:
        "Tell me what to cut from this startup concept so the first version only tests one assumption.",
      title: "Cut non-essential features",
    },
  ],
  "research-analyst": [
    {
      prompt:
        "Compare Stripe vs Lemon Squeezy for a small global SaaS launch and recommend one.",
      title: "Compare two tools",
    },
    {
      prompt:
        "Write a short market scan on request-native work platforms and the strongest differentiation gaps.",
      title: "Run a market scan",
    },
    {
      prompt:
        "Research the strongest tradeoffs between Solana and Base for an agentic commerce product.",
      title: "Analyze a strategic tradeoff",
    },
    {
      prompt:
        "Turn this open question into a concise memo with findings, recommendation, and unknowns: What is the best early pricing path for Boreal?",
      title: "Write a decision memo",
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
