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

export type SceneBeat = {
  overlay: string;
  startAtSecond: number;
  voiceover: string;
};

export type SceneSpec = {
  beats: SceneBeat[];
  durationInSeconds: number;
  id: SceneId;
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
  surfaceMode?: "hackathon-update" | "standard";
  surfaceTitles?: Partial<Record<SceneId, string>>;
  subheadline: string;
  voiceoverMode?: "scene";
};

const SCENE_LIBRARY: Record<
  SceneId,
  {
    beats: SceneBeat[];
    title: string;
  }
> = {
  "intent-disappears": {
    title: "Intent Disappears",
    beats: [
      {
        startAtSecond: 0,
        overlay: "Need this done by Friday.",
        voiceover: "Every day, people ask for outcomes in chat, search, and software.",
      },
      {
        startAtSecond: 4.5,
        overlay: "Can someone handle this?",
        voiceover: "Most of that demand gets answered, summarized, or pushed into a log.",
      },
      {
        startAtSecond: 10.5,
        overlay: "Still unresolved.",
        voiceover: "The request disappears before the work ever gets routed.",
      },
      {
        startAtSecond: 14.5,
        overlay: "Intent disappears.",
        voiceover: "That is the gap Boreal is built to close.",
      },
    ],
  },
  "missing-layer": {
    title: "The Missing Layer",
    beats: [
      {
        startAtSecond: 0,
        overlay: "A request should not die in chat.",
        voiceover: "Boreal is the missing layer between asking and getting something real done.",
      },
      {
        startAtSecond: 5.5,
        overlay: "Demand becomes structured work.",
        voiceover: "It turns a vague ask into a tracked request with scope, approval, and context.",
      },
      {
        startAtSecond: 11,
        overlay: "Supply becomes reachable.",
        voiceover: "It makes the right humans, agents, tools, and products visible at the moment they matter.",
      },
      {
        startAtSecond: 15.5,
        overlay: "Fulfillment stays attached.",
        voiceover: "And it keeps the outcome attached until the work is actually delivered.",
      },
    ],
  },
  "chat-to-workspace": {
    title: "Chat Becomes Structure",
    beats: [
      {
        startAtSecond: 0,
        overlay: "Start where the ask already exists.",
        voiceover: "Boreal starts where users already think: in natural language.",
      },
      {
        startAtSecond: 6,
        overlay: "The ask becomes a request.",
        voiceover: "A rough prompt becomes a structured workspace instead of another answer in a thread.",
      },
      {
        startAtSecond: 12,
        overlay: "Scope and approval stay explicit.",
        voiceover: "The system can clarify the outcome, ask for approval, or open the work for the right participants.",
      },
      {
        startAtSecond: 19,
        overlay: "Matching stays visible.",
        voiceover: "Matching, proposals, direct fulfillment, and spend all stay reviewable in the same surface.",
      },
      {
        startAtSecond: 25,
        overlay: "Chat becomes an operating surface.",
        voiceover: "That is the shift. The chat is no longer the product. It is the entry into accountable work.",
      },
    ],
  },
  "real-supply": {
    title: "Demand Meets Real Supply",
    beats: [
      {
        startAtSecond: 0,
        overlay: "This is a market, not a private thread.",
        voiceover: "Boreal is not a closed assistant. It is a live market surface.",
      },
      {
        startAtSecond: 6,
        overlay: "Profiles make supply legible.",
        voiceover: "Humans and agents show up as real profiles with capabilities, trust signals, activity, and packaging.",
      },
      {
        startAtSecond: 13,
        overlay: "Listings stay searchable.",
        voiceover: "Services, digital products, and provider-backed tools become searchable supply with structured metadata.",
      },
      {
        startAtSecond: 20,
        overlay: "The right path can be chosen in context.",
        voiceover: "That makes discovery useful at the exact moment a request needs a route.",
      },
    ],
  },
  "proposal-delivery": {
    title: "Proposal To Delivery",
    beats: [
      {
        startAtSecond: 0,
        overlay: "The request stays alive.",
        voiceover: "Instead of vanishing into a transcript, the request persists as a real workspace.",
      },
      {
        startAtSecond: 6,
        overlay: "Proposal.",
        voiceover: "Participants can propose price, timing, and deliverables directly against the request.",
      },
      {
        startAtSecond: 12.5,
        overlay: "Approval.",
        voiceover: "Owners approve the right path explicitly before work or spend moves forward.",
      },
      {
        startAtSecond: 18.5,
        overlay: "Delivery and review.",
        voiceover: "Messages, files, fulfillment, and review all stay attached to the same accountable thread.",
      },
    ],
  },
  "direct-fulfillment": {
    title: "Direct Fulfillment",
    beats: [
      {
        startAtSecond: 0,
        overlay: "Some work needs a specialist.",
        voiceover: "Some requests should route to people or specialist agents.",
      },
      {
        startAtSecond: 6,
        overlay: "Some work should resolve right here.",
        voiceover: "Others should resolve immediately through known supply, products, or provider-backed services.",
      },
      {
        startAtSecond: 12,
        overlay: "One request. Multiple routes.",
        voiceover: "Boreal handles both inside one operating surface without losing the original context.",
      },
      {
        startAtSecond: 17,
        overlay: "The result still lands on the request.",
        voiceover: "The result comes back to the same request instead of getting scattered across tools.",
      },
    ],
  },
  "solana-fit": {
    title: "Why Solana",
    beats: [
      {
        startAtSecond: 0,
        overlay: "Approval can become economic coordination.",
        voiceover: "This market eventually needs more than chat-native workflow. It needs economic coordination.",
      },
      {
        startAtSecond: 5,
        overlay: "Fast enough to stay in flow.",
        voiceover: "Solana fits because approvals, payment, and settlement need to be fast enough to stay inside the product loop.",
      },
      {
        startAtSecond: 10,
        overlay: "Programmable enough to stay trustworthy.",
        voiceover: "It also needs programmable trust, evidence, and composable payment logic for human-and-agent commerce.",
      },
      {
        startAtSecond: 15,
        overlay: "The market deserves settlement.",
        voiceover: "That is why Boreal belongs on Solana.",
      },
    ],
  },
  "missing-piece": {
    title: "The Missing Piece",
    beats: [
      {
        startAtSecond: 0,
        overlay: "Search finds information.",
        voiceover: "Search finds information.",
      },
      {
        startAtSecond: 6,
        overlay: "Chat generates text.",
        voiceover: "Chat generates text.",
      },
      {
        startAtSecond: 12.5,
        overlay: "Boreal keeps work alive to fulfillment.",
        voiceover: "Boreal keeps intent alive until it becomes supply, work, commerce, and fulfillment.",
      },
    ],
  },
};

const makeScene = (id: SceneId, durationInSeconds: number): SceneSpec => ({
  beats: SCENE_LIBRARY[id].beats,
  durationInSeconds,
  id,
  title: SCENE_LIBRARY[id].title,
});

const makeCustomScene = (
  id: SceneId,
  durationInSeconds: number,
  beats: SceneBeat[],
  title = SCENE_LIBRARY[id].title,
): SceneSpec => ({
  beats,
  durationInSeconds,
  id,
  title,
});

export const HACKATHON_UPDATE: VideoVariant = {
  compositionId: "HackathonUpdate60Sec",
  folderName: "Boreal-Film",
  label: "Hackathon update",
  kicker: "Solana hackathon update",
  headline: "Intent routing is live.",
  subheadline: "Matching engine, swarm routing, and accountable fulfillment.",
  accent: "#14b8a6",
  overlayMode: "detailed",
  surfaceMode: "hackathon-update",
  voiceoverMode: "scene",
  surfaceTitles: {
    "chat-to-workspace": "Routing engine",
    "direct-fulfillment": "Instant fulfillment",
    "real-supply": "Open swarm",
    "proposal-delivery": "Delivery thread",
    "missing-piece": "Launch status",
  },
  scenes: [
    makeCustomScene("intent-disappears", 7, [
      {
        startAtSecond: 0,
        overlay: "Intent disappears into logs, dashboards, and dead threads.",
        voiceover: "Every day, valuable requests disappear into chat logs, dashboards, and dead threads.",
      },
      {
        startAtSecond: 3.5,
        overlay: "The demand signal is there. The route is not.",
        voiceover: "The demand signal exists. What is missing is a route to real fulfillment.",
      },
    ]),
    makeCustomScene("chat-to-workspace", 13, [
      {
        startAtSecond: 0,
        overlay: "Boreal turns the ask into a live request.",
        voiceover: "Boreal turns the ask into a live request instead of another dead message.",
      },
      {
        startAtSecond: 4.5,
        overlay: "The matching engine scores the route.",
        voiceover: "Its matching engine scores humans, agents, products, and provider-backed services against the request.",
      },
      {
        startAtSecond: 9,
        overlay: "Direct supply, open market, or both.",
        voiceover: "Then it picks the best path: direct supply, open market, or both together.",
      },
    ]),
    makeCustomScene("direct-fulfillment", 13, [
      {
        startAtSecond: 0,
        overlay: "When supply already exists, Boreal resolves it fast.",
        voiceover: "When supply already exists, Boreal resolves the request fast.",
      },
      {
        startAtSecond: 4.5,
        overlay: "A provider-backed workflow is matched now.",
        voiceover: "The system surfaces the best ready path, including provider-backed workflows that can execute now.",
      },
      {
        startAtSecond: 8.5,
        overlay: "Approval starts fulfillment.",
        voiceover: "One approval moves the request into fulfillment.",
      },
      {
        startAtSecond: 10.8,
        overlay: "Evidence and delivery attach automatically.",
        voiceover: "Evidence, artifacts, and the result all attach back to the same request.",
      },
    ]),
    makeCustomScene("real-supply", 11, [
      {
        startAtSecond: 0,
        overlay: "When it does not, Boreal opens a swarm.",
        voiceover: "When the right supply does not already exist, Boreal opens a swarm around the request.",
      },
      {
        startAtSecond: 4,
        overlay: "Humans and agents converge on the work.",
        voiceover: "Humans and agents converge through searchable profiles, proposals, and open requests in one market surface.",
      },
      {
        startAtSecond: 8.2,
        overlay: "The right builders can find the work.",
        voiceover: "That makes the work legible to the right builders before it disappears again.",
      },
    ]),
    makeCustomScene("proposal-delivery", 10, [
      {
        startAtSecond: 0,
        overlay: "Proposal, approval, delivery.",
        voiceover: "Proposal, approval, and delivery stay attached to one accountable thread.",
      },
      {
        startAtSecond: 4.5,
        overlay: "The request stays accountable to completion.",
        voiceover: "The request does not disappear. It stays accountable all the way to completion.",
      },
    ]),
    makeCustomScene("missing-piece", 6, [
      {
        startAtSecond: 0,
        overlay: "Matching live. Profiles live. Requests live.",
        voiceover: "What you are seeing now is already live: matching, profiles, requests, and accountable delivery.",
      },
      {
        startAtSecond: 3,
        overlay: "Provider sync wired. Closing in on launch.",
        voiceover: "Boreal is closing in on launch. Commerce, headed north.",
      },
    ], "Hackathon update close"),
  ],
};

export const HACKATHON_PITCH: VideoVariant = {
  compositionId: "HackathonPitch3Min",
  folderName: "Boreal-Film",
  label: "Hackathon pitch",
  kicker: "Boreal x Solana",
  headline: "Intent to Fulfillment",
  subheadline: "Product proof first. Architecture second.",
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
  subheadline: "Tighter category and product reveal.",
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
  subheadline: "Implementation first. Market and architecture second.",
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

export const PRODUCT_PITCH: VideoVariant = {
  compositionId: "ProductPitch2Min",
  folderName: "Boreal-Film",
  label: "Product pitch",
  kicker: "Boreal",
  headline: "Intent to Fulfillment",
  subheadline: "Category framing, product proof, and close.",
  accent: "#14b8a6",
  overlayMode: "detailed",
  scenes: [
    makeScene("intent-disappears", 15),
    makeScene("missing-layer", 18),
    makeScene("chat-to-workspace", 28),
    makeScene("real-supply", 22),
    makeScene("proposal-delivery", 20),
    makeScene("missing-piece", 17),
  ],
};

export const SHORT_INTENT_HOOK: VideoVariant = {
  compositionId: "ShortIntentHook20Sec",
  folderName: "Boreal-Shorts",
  label: "Short hook",
  kicker: "Intent disappears",
  headline: "Intent Disappears",
  subheadline: "Core market problem.",
  accent: "#f97316",
  overlayMode: "minimal",
  scenes: [makeScene("intent-disappears", 8), makeScene("missing-layer", 12)],
};

export const SHORT_CHAT_TO_OUTCOME: VideoVariant = {
  compositionId: "ShortChatToOutcome30Sec",
  folderName: "Boreal-Shorts",
  label: "Short request flow",
  kicker: "Chat to outcome",
  headline: "Chat to Outcome",
  subheadline: "From ask to accountable thread.",
  accent: "#14b8a6",
  overlayMode: "minimal",
  scenes: [makeScene("chat-to-workspace", 15), makeScene("proposal-delivery", 15)],
};

export const SHORT_SUPPLY_MARKET: VideoVariant = {
  compositionId: "ShortSupplyMarket25Sec",
  folderName: "Boreal-Shorts",
  label: "Short supply market",
  kicker: "Supply and execution",
  headline: "Supply and Execution",
  subheadline: "Packaged supply in context.",
  accent: "#22c55e",
  overlayMode: "minimal",
  scenes: [makeScene("real-supply", 12), makeScene("direct-fulfillment", 13)],
};

export const SHORT_SOLANA_CLOSE: VideoVariant = {
  compositionId: "ShortSolanaClose20Sec",
  folderName: "Boreal-Shorts",
  label: "Short Solana close",
  kicker: "Solana and category close",
  headline: "Solana and Category Close",
  subheadline: "Economic coordination for the market layer.",
  accent: "#38bdf8",
  overlayMode: "minimal",
  scenes: [makeScene("solana-fit", 10), makeScene("missing-piece", 10)],
};

export const FEATURE_VARIANTS = [
  HACKATHON_UPDATE,
  HACKATHON_PITCH,
  LAUNCH_CUT,
  TECHNICAL_DEMO,
  PRODUCT_PITCH,
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

export const getSceneBeat = (scene: SceneSpec, timeInSeconds: number) => {
  let beat = scene.beats[0];
  let index = 0;

  for (let currentIndex = 0; currentIndex < scene.beats.length; currentIndex += 1) {
    const candidate = scene.beats[currentIndex];
    if (timeInSeconds >= candidate.startAtSecond) {
      beat = candidate;
      index = currentIndex;
      continue;
    }

    break;
  }

  const nextStartAtSecond = scene.beats[index + 1]?.startAtSecond ?? scene.durationInSeconds;

  return {
    beat,
    index,
    nextStartAtSecond,
  };
};

export const getSceneVoiceoverFile = (
  compositionId: string,
  sceneIndex: number,
  sceneId: SceneId,
) => {
  return `voiceover/${compositionId}/${String(sceneIndex + 1).padStart(2, "0")}-${sceneId}.mp3`;
};
