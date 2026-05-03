export type PitchSceneStatus = "ready" | "needs-component";

export type PitchScenePlan = {
  componentNeed?: string[];
  durationInFrames: number;
  id:
    | "hook"
    | "free-intake"
    | "route-lock"
    | "payment-required"
    | "solana-verify"
    | "execution-thread"
    | "proof-room"
    | "close";
  purpose: string;
  source: "accurate-home-chat" | "new-component";
  status: PitchSceneStatus;
  title: string;
  voiceover: string;
};

export const PITCH_VIDEO_TOTAL_FRAMES = 4690;

export const PITCH_VIDEO_SCENES: PitchScenePlan[] = [
  {
    id: "hook",
    title: "Requests Disappear",
    purpose: "Open on the problem before the product.",
    source: "new-component",
    status: "ready",
    durationInFrames: 930,
    voiceover:
      "Every day, people ask for real outcomes in chat, software, and workflows. Most of that demand still disappears before the work ever starts.",
  },
  {
    id: "free-intake",
    title: "Free Boreal Intake",
    purpose: "Show Boreal Agent handling intake and routing for free.",
    source: "new-component",
    status: "ready",
    durationInFrames: 570,
    voiceover:
      "Boreal is the request-native work and payment layer for the agent economy. It turns an AI or human request into a funded work thread. Boreal starts where users already think: in natural language. Boreal Agent handles intake, clarification, and routing for free, so the first step is not a checkout and not a ticket form.",
  },
  {
    id: "route-lock",
    title: "Best Route Found",
    purpose: "Show one tracked request and the locked specialist route.",
    source: "new-component",
    status: "ready",
    durationInFrames: 760,
    voiceover:
      "When the work is real, Boreal turns the ask into one tracked request. It locks the best specialist or team route it can support and keeps the work on one thread.",
  },
  {
    id: "payment-required",
    title: "Payment Required",
    purpose: "Show the funded-start boundary in the request thread itself.",
    source: "new-component",
    status: "ready",
    durationInFrames: 560,
    voiceover:
      "Paid work does not start invisibly. Boreal shows the quote, the seller, and the exact request that will resume after funding. The funding boundary is explicit because execution is the thing being bought.",
  },
  {
    id: "solana-verify",
    title: "Solana Verifies The Start",
    purpose: "Show real mainnet verification and same-request resume.",
    source: "new-component",
    status: "ready",
    durationInFrames: 520,
    voiceover:
      "Boreal verifies the signed payment authorization against a real Solana mainnet transaction before work begins. That keeps approval and payment inside the same product loop. The same request resumes after payment instead of rematching or restarting.",
  },
  {
    id: "execution-thread",
    title: "Execution On The Same Thread",
    purpose: "Show execution, evidence, delivery, and follow-up in one thread.",
    source: "new-component",
    status: "ready",
    durationInFrames: 580,
    voiceover:
      "Once funded, specialists execute on the same request thread. Messages, evidence, artifacts, delivery, and review stay attached to the work instead of scattering across tools.",
  },
  {
    id: "proof-room",
    title: "Multi-Agent And Solana Proof",
    purpose: "Support the thesis with Debate and Verdict plus wallet-approved Solana actions.",
    source: "new-component",
    status: "ready",
    durationInFrames: 520,
    voiceover:
      "Boreal can already host structured multi-agent work in that same thread. Debate and Verdict gives one moderator, two sides, and one closer without losing the request context. It can also carry explicit wallet-approved Solana actions in the same surface.",
  },
  {
    id: "close",
    title: "Category Close",
    purpose: "Land the category in one clean closing statement.",
    source: "new-component",
    status: "ready",
    durationInFrames: 250,
    voiceover:
      "Search finds information. Chat generates text. Boreal keeps the request alive until it becomes funded execution.",
  },
] as const;
