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

export const PITCH_VIDEO_TOTAL_FRAMES = 3600;

export const PITCH_VIDEO_SCENES: PitchScenePlan[] = [
  {
    id: "hook",
    title: "Requests Disappear",
    purpose: "Open on real demand dying before fulfillment starts.",
    source: "new-component",
    status: "ready",
    durationInFrames: 450,
    voiceover:
      "People ask for real outcomes in chat every day. Most of that demand still dies before anything real happens.",
  },
  {
    id: "free-intake",
    title: "AI Increased Asks",
    purpose: "Make the why-now explicit.",
    source: "new-component",
    status: "ready",
    durationInFrames: 360,
    voiceover:
      "AI increased asks. It did not solve execution.",
  },
  {
    id: "route-lock",
    title: "Boreal Names The Layer",
    purpose: "Say what Boreal is and show the one-thread model.",
    source: "new-component",
    status: "ready",
    durationInFrames: 510,
    voiceover:
      "Boreal is the request-to-fulfillment layer for the agent economy. One request becomes the system object.",
  },
  {
    id: "payment-required",
    title: "Matched Supply And Control",
    purpose: "Show matching, owner approval, and market-open options.",
    source: "new-component",
    status: "ready",
    durationInFrames: 390,
    voiceover:
      "A request starts in chat. Boreal shows matched supply. The owner can approve the best route or open the work to the market.",
  },
  {
    id: "solana-verify",
    title: "Funding Starts Execution",
    purpose: "Show the explicit payment boundary and verified start.",
    source: "new-component",
    status: "ready",
    durationInFrames: 360,
    voiceover:
      "When paid execution is selected, the funding boundary is explicit. Solana verifies approval and payment before work begins.",
  },
  {
    id: "execution-thread",
    title: "The Same Request Resumes",
    purpose: "Show continuity instead of rematch or detached checkout.",
    source: "new-component",
    status: "ready",
    durationInFrames: 450,
    voiceover:
      "Then the same request resumes. No rematch. No detached checkout. No scattered handoff across tools.",
  },
  {
    id: "proof-room",
    title: "Shipped Proof",
    purpose: "Show specialists, Debate and Verdict, and external supply proof like AgentCash.",
    source: "new-component",
    status: "ready",
    durationInFrames: 510,
    voiceover:
      "Today Boreal can surface current matched supply, run funded request flows, route debate prompts into Debate and Verdict, and connect external supply paths like AgentCash.",
  },
  {
    id: "close",
    title: "Category Close",
    purpose: "Land the market and category claim cleanly.",
    source: "new-component",
    status: "ready",
    durationInFrames: 570,
    voiceover:
      "The internet has tools for search, chat, labor, and payments. What it still lacks is a clean way to carry one request all the way to completion. That's Boreal.",
  },
] as const;
