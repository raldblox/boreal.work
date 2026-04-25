export const VIDEO_FPS = 30;
export const VIDEO_WIDTH = 1920;
export const VIDEO_HEIGHT = 1080;

export type SceneId =
  | "intent-disappears"
  | "missing-layer"
  | "chat-to-workspace"
  | "real-supply"
  | "proposal-delivery"
  | "direct-fulfillment"
  | "solana-fit"
  | "missing-piece";

export type SceneSpec = {
  durationInSeconds: number;
  id: SceneId;
  message: string;
  title: string;
};

export type VideoVariant = {
  accent: string;
  compositionId: string;
  folderName: "Boreal-Film" | "Boreal-Shorts";
  headline: string;
  kicker: string;
  label: string;
  overlayMode: "detailed" | "minimal";
  scenes: SceneSpec[];
  subheadline: string;
};

const SCENE_LIBRARY: Record<
  SceneId,
  {
    message: string;
    title: string;
  }
> = {
  "intent-disappears": {
    title: "Intent Disappears",
    message:
      "Demand gets expressed everywhere, but most requests are answered, summarized, and forgotten instead of being routed to a real outcome.",
  },
  "missing-layer": {
    title: "The Missing Layer",
    message:
      "Boreal reframes the category around a single point: the next serious ask should not die inside a transcript or analytics log.",
  },
  "chat-to-workspace": {
    title: "Chat Becomes Structure",
    message:
      "A messy natural-language prompt becomes a request draft, an execution path, and a reviewable workspace instead of a dead-end answer.",
  },
  "real-supply": {
    title: "Demand Meets Real Supply",
    message:
      "Humans, agents, products, and tools become searchable supply with metadata, trust signals, pricing, and routing context.",
  },
  "proposal-delivery": {
    title: "Proposal To Delivery",
    message:
      "The request persists through assignment, approvals, activity, deliverables, and review. That accountability is the product.",
  },
  "direct-fulfillment": {
    title: "Direct Fulfillment",
    message:
      "Some work should route to specialists. Some should resolve instantly through known supply. Boreal handles both inside one operating surface.",
  },
  "solana-fit": {
    title: "Why Solana",
    message:
      "Boreal needs fast, low-friction economic coordination. Solana is the settlement and trust layer that fits the architecture.",
  },
  "missing-piece": {
    title: "The Missing Piece",
    message:
      "Search finds information. Chat generates text. Boreal routes live demand into supply, work, commerce, and outcomes.",
  },
};

const makeScene = (id: SceneId, durationInSeconds: number): SceneSpec => ({
  durationInSeconds,
  id,
  message: SCENE_LIBRARY[id].message,
  title: SCENE_LIBRARY[id].title,
});

export const HACKATHON_PITCH: VideoVariant = {
  compositionId: "HackathonPitch3Min",
  folderName: "Boreal-Film",
  label: "Hackathon pitch",
  kicker: "Boreal x Solana",
  headline: "Intent to Fulfillment",
  subheadline:
    "The full 3-minute submission cut: product proof first, architecture second, category thesis throughout.",
  accent: "#14b8a6",
  overlayMode: "detailed",
  scenes: [
    makeScene("intent-disappears", 18),
    makeScene("missing-layer", 20),
    makeScene("chat-to-workspace", 30),
    makeScene("real-supply", 27),
    makeScene("proposal-delivery", 25),
    makeScene("direct-fulfillment", 22),
    makeScene("solana-fit", 20),
    makeScene("missing-piece", 18),
  ],
};

export const LAUNCH_CUT: VideoVariant = {
  compositionId: "LaunchCut90Sec",
  folderName: "Boreal-Film",
  label: "Launch cut",
  kicker: "Boreal launch",
  headline: "The Supply Layer",
  subheadline:
    "A tighter product film for launch: category framing, product reveal, direct fulfillment, and closing market thesis.",
  accent: "#22c55e",
  overlayMode: "detailed",
  scenes: [
    makeScene("intent-disappears", 12),
    makeScene("missing-layer", 15),
    makeScene("chat-to-workspace", 24),
    makeScene("direct-fulfillment", 18),
    makeScene("missing-piece", 21),
  ],
};

export const TECHNICAL_DEMO: VideoVariant = {
  compositionId: "TechnicalDemo150Sec",
  folderName: "Boreal-Film",
  label: "Technical demo",
  kicker: "Boreal implementation",
  headline: "Request-Native Workflow",
  subheadline:
    "An implementation-led variant focused on request flow, market structure, direct fulfillment, and the Solana-aligned architecture.",
  accent: "#38bdf8",
  overlayMode: "detailed",
  scenes: [
    makeScene("chat-to-workspace", 34),
    makeScene("real-supply", 28),
    makeScene("proposal-delivery", 30),
    makeScene("direct-fulfillment", 28),
    makeScene("solana-fit", 30),
  ],
};

export const SHORT_INTENT_HOOK: VideoVariant = {
  compositionId: "ShortIntentHook20Sec",
  folderName: "Boreal-Shorts",
  label: "Short hook",
  kicker: "Intent disappears",
  headline: "Intent Disappears",
  subheadline:
    "A standalone opener that frames Boreal around the core market problem and the missing category layer.",
  accent: "#f97316",
  overlayMode: "minimal",
  scenes: [
    makeScene("intent-disappears", 8),
    makeScene("missing-layer", 12),
  ],
};

export const SHORT_CHAT_TO_OUTCOME: VideoVariant = {
  compositionId: "ShortChatToOutcome30Sec",
  folderName: "Boreal-Shorts",
  label: "Short request flow",
  kicker: "Chat to outcome",
  headline: "Chat to Outcome",
  subheadline:
    "A standalone demo of Boreal's request-native operating surface from intake through delivery.",
  accent: "#14b8a6",
  overlayMode: "minimal",
  scenes: [
    makeScene("chat-to-workspace", 15),
    makeScene("proposal-delivery", 15),
  ],
};

export const SHORT_SUPPLY_MARKET: VideoVariant = {
  compositionId: "ShortSupplyMarket25Sec",
  folderName: "Boreal-Shorts",
  label: "Short supply market",
  kicker: "Supply and execution",
  headline: "Supply and Execution",
  subheadline:
    "A standalone cut for market discovery, packaged supply, and direct fulfillment moments.",
  accent: "#22c55e",
  overlayMode: "minimal",
  scenes: [
    makeScene("real-supply", 12),
    makeScene("direct-fulfillment", 13),
  ],
};

export const SHORT_SOLANA_CLOSE: VideoVariant = {
  compositionId: "ShortSolanaClose20Sec",
  folderName: "Boreal-Shorts",
  label: "Short Solana close",
  kicker: "Solana and category close",
  headline: "Solana and Category Close",
  subheadline:
    "A standalone closing cut that ties Boreal's request-native market thesis to its Solana-aligned economic layer.",
  accent: "#38bdf8",
  overlayMode: "minimal",
  scenes: [
    makeScene("solana-fit", 10),
    makeScene("missing-piece", 10),
  ],
};

export const FEATURE_VARIANTS = [
  HACKATHON_PITCH,
  LAUNCH_CUT,
  TECHNICAL_DEMO,
] as const;

export const SHORT_VARIANTS = [
  SHORT_INTENT_HOOK,
  SHORT_CHAT_TO_OUTCOME,
  SHORT_SUPPLY_MARKET,
  SHORT_SOLANA_CLOSE,
] as const;

export const ALL_VARIANTS = [...FEATURE_VARIANTS, ...SHORT_VARIANTS];

export const getDurationInFrames = (variant: VideoVariant) => {
  return variant.scenes.reduce((sum, scene) => {
    return sum + scene.durationInSeconds * VIDEO_FPS;
  }, 0);
};
