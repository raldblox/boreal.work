export const VIDEO_FPS = 30;
export const VIDEO_WIDTH = 1920;
export const VIDEO_HEIGHT = 1080;

export type SceneSpec = {
  durationInSeconds: number;
  key: string;
  message: string;
  title: string;
};

export type VideoVariant = {
  accent: string;
  headline: string;
  kicker: string;
  label: string;
  scenes: SceneSpec[];
  subheadline: string;
};

const MASTER_SCENES: SceneSpec[] = [
  {
    key: "intent-disappears",
    title: "Intent Disappears",
    durationInSeconds: 18,
    message:
      "Demand gets expressed everywhere, but most requests are answered, summarized, and forgotten instead of being routed to a real outcome.",
  },
  {
    key: "missing-layer",
    title: "The Missing Layer",
    durationInSeconds: 20,
    message:
      "Boreal positions itself as the supply layer for the agent economy, where intent stays alive until fulfillment happens.",
  },
  {
    key: "chat-to-workspace",
    title: "Chat To Workspace",
    durationInSeconds: 30,
    message:
      "Natural language becomes a tracked request with structure, routing context, and a clear execution path instead of a dead-end transcript.",
  },
  {
    key: "real-supply",
    title: "Real Supply",
    durationInSeconds: 27,
    message:
      "Humans, agents, and tools are packaged as searchable supply with discoverable capabilities, pricing, delivery type, and trust signals.",
  },
  {
    key: "proposal-delivery",
    title: "Proposal To Delivery",
    durationInSeconds: 25,
    message:
      "The request thread persists through proposal review, assignment, activity, evidence, and final approval in one accountable workspace.",
  },
  {
    key: "direct-fulfillment",
    title: "Direct Fulfillment",
    durationInSeconds: 22,
    message:
      "Known supply can resolve requests directly through inline artifacts and media outputs while harder work still routes to specialists.",
  },
  {
    key: "solana-fit",
    title: "Why Solana",
    durationInSeconds: 20,
    message:
      "Solana gives Boreal the economic coordination layer it needs: fast settlement, programmable trust, and verifiable execution rails.",
  },
  {
    key: "missing-piece",
    title: "The Missing Piece",
    durationInSeconds: 18,
    message:
      "Boreal is framed as the missing operating layer between expressed demand and fulfilled outcomes for the human-and-agent economy.",
  },
];

export const HACKATHON_PITCH: VideoVariant = {
  label: "Hackathon pitch",
  kicker: "Boreal x Solana",
  headline: "HackathonPitch3Min",
  subheadline:
    "Full 3-minute startup pitch and product-demo structure aligned to functionality, impact, novelty, UX, composability, and business potential.",
  accent: "#14b8a6",
  scenes: MASTER_SCENES,
};

export const LAUNCH_CUT: VideoVariant = {
  label: "Launch cut",
  kicker: "Boreal launch",
  headline: "LaunchCut90Sec",
  subheadline:
    "Compressed narrative for launch distribution. Lead with category framing, show the product quickly, and end on the market thesis.",
  accent: "#22c55e",
  scenes: [
    MASTER_SCENES[0],
    MASTER_SCENES[1],
    MASTER_SCENES[2],
    MASTER_SCENES[5],
    MASTER_SCENES[7],
  ].map((scene, index) => ({
    ...scene,
    durationInSeconds: [12, 15, 24, 18, 21][index],
  })),
};

export const TECHNICAL_DEMO: VideoVariant = {
  label: "Technical demo",
  kicker: "Boreal implementation",
  headline: "TechnicalDemo150Sec",
  subheadline:
    "Implementation-led variant that prioritizes request flow, supply routing, direct fulfillment, and the Solana architecture layer.",
  accent: "#38bdf8",
  scenes: [
    MASTER_SCENES[2],
    MASTER_SCENES[3],
    MASTER_SCENES[4],
    MASTER_SCENES[5],
    MASTER_SCENES[6],
  ].map((scene, index) => ({
    ...scene,
    durationInSeconds: [34, 28, 30, 28, 30][index],
  })),
};

export const getDurationInFrames = (variant: VideoVariant) => {
  return variant.scenes.reduce((sum, scene) => {
    return sum + scene.durationInSeconds * VIDEO_FPS;
  }, 0);
};
