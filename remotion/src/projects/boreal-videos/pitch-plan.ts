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
    title: "Founder Intro",
    purpose: "Open with the founder and the gap he kept seeing.",
    source: "new-component",
    status: "ready",
    durationInFrames: 330,
    voiceover:
      "Hi, I'm Rald, founder of Boreal. My background is in enterprise systems, sales, and applied AI, so I have spent a lot of time at the boundary between software plans and real-world execution.",
  },
  {
    id: "free-intake",
    title: "Asks Explode",
    purpose: "Show why AI expands demand faster than execution.",
    source: "new-component",
    status: "ready",
    durationInFrames: 480,
    voiceover:
      "I kept seeing the same gap. People now ask software for real outcomes every day. And AI made that behavior explode. Agents can now reason, route, translate, and work with real domain context.",
  },
  {
    id: "route-lock",
    title: "Intent Dies In Chat",
    purpose: "Name the wall between plans and fulfillment.",
    source: "new-component",
    status: "ready",
    durationInFrames: 420,
    voiceover:
      "But most of that intent still dies in chat. The model gives you a plan, then the work fragments across marketplaces, task tools, payments, and inboxes. The moment execution has to begin, momentum breaks.",
  },
  {
    id: "payment-required",
    title: "Name The Layer",
    purpose: "Define Boreal cleanly before the product loop.",
    source: "new-component",
    status: "ready",
    durationInFrames: 330,
    voiceover:
      "That is the problem I am building Boreal to solve. Boreal is the request-to-fulfillment layer for the agent economy.",
  },
  {
    id: "solana-verify",
    title: "Matched Supply And Control",
    purpose: "Show the main request-to-thread loop and owner control.",
    source: "new-component",
    status: "ready",
    durationInFrames: 480,
    voiceover:
      "A request starts in chat. Boreal shows matched supply. The owner can approve the best route, invite someone they already know, or open the work to the market. Once the route is selected, the request becomes one funded work thread.",
  },
  {
    id: "execution-thread",
    title: "Funding Starts Execution",
    purpose: "Show the funded boundary and same-thread resume.",
    source: "new-component",
    status: "ready",
    durationInFrames: 480,
    voiceover:
      "That thread keeps approval, payment, execution, evidence, delivery, and review attached to the same object. Humans and agents can both open work, join work, fulfill work, and get paid through the same loop.",
  },
  {
    id: "proof-room",
    title: "Shipped Proof",
    purpose: "Show live supply, presets, and agent-facing network paths.",
    source: "new-component",
    status: "ready",
    durationInFrames: 510,
    voiceover:
      "When paid execution starts, Solana is the approval and payment boundary. The owner signs, Boreal verifies the transaction, and the same request resumes. And this is already real. Today Boreal can surface matched supply, run funded request flows, route into Debate and Verdict, and connect external supply paths like AgentCash.",
  },
  {
    id: "close",
    title: "Category Close",
    purpose: "Land the market and category claim cleanly.",
    source: "new-component",
    status: "ready",
    durationInFrames: 570,
    voiceover:
      "I am building Boreal because the internet already has search, chat, labor, and payments. What it still lacks is the layer that carries one request all the way to completion. That's Boreal.",
  },
] as const;
