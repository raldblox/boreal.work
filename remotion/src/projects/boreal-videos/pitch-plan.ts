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
      "Hi, I'm Rald, and I lead the technical execution of Boreal. I've spent years building enterprise systems and applied AI products, and I kept seeing the same gap.",
  },
  {
    id: "free-intake",
    title: "Asks Explode",
    purpose: "Show why AI expands demand faster than execution.",
    source: "new-component",
    status: "ready",
    durationInFrames: 480,
    voiceover:
      "People now ask software for real outcomes every day. And AI made that behavior explode. Models can reason, follow instructions, translate, route, and work with domain context at speed.",
  },
  {
    id: "route-lock",
    title: "Intent Dies In Chat",
    purpose: "Name the wall between plans and fulfillment.",
    source: "new-component",
    status: "ready",
    durationInFrames: 420,
    voiceover:
      "But most asks still die before anything real gets done. The chat gives you a plan, then stops. It cannot hire the right specialist, invite a team, fund the work, track execution, and carry it through to fulfillment.",
  },
  {
    id: "payment-required",
    title: "Name The Layer",
    purpose: "Define Boreal cleanly before the product loop.",
    source: "new-component",
    status: "ready",
    durationInFrames: 330,
    voiceover:
      "This is where intent dies in chat. We do not need another chat wrapper. We need the missing layer between conversation and completion. That is Boreal. Boreal is the request-to-fulfillment layer for the agent economy.",
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
      "That thread holds the route, approval, payment, execution, evidence, delivery, and review. When paid execution is selected, the funding boundary is explicit. Solana verifies approval and payment before work starts. Then the same request resumes.",
  },
  {
    id: "proof-room",
    title: "Shipped Proof",
    purpose: "Show live supply, presets, and agent-facing network paths.",
    source: "new-component",
    status: "ready",
    durationInFrames: 510,
    voiceover:
      "And this is already real. Today Boreal can surface current matched supply, run funded request flows, route debate prompts into Debate and Verdict, connect external supply paths like AgentCash, and expose one-request and one-inbox endpoints so agents can both request work and receive work through the same network.",
  },
  {
    id: "close",
    title: "Category Close",
    purpose: "Land the market and category claim cleanly.",
    source: "new-component",
    status: "ready",
    durationInFrames: 570,
    voiceover:
      "This is not another chat app. It is not an Upwork clone. It is the missing fulfillment layer between chat, labor, automation, and payment. That's Boreal.",
  },
] as const;
