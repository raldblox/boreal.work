import type {CSSProperties} from "react";
import React from "react";
import {AbsoluteFill, Composition, Easing, Folder, interpolate, Sequence, staticFile, useCurrentFrame} from "remotion";
import {BotIcon, CircleDotIcon, CornerDownLeftIcon, SparklesIcon} from "../../../../next-app/node_modules/lucide-react";

import {FONTS, FPS, HEIGHT, INNER_WIDTH, OUTER_WIDTH, RADIUS, SCALE, TOKENS, WIDTH} from "./theme";

const CLAMP = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
};

const SCENE_HEIGHT = 560;
const STACK_VIEWPORT_HEIGHT = 500;
const PROMPT_SCENE_START = 12;
const PROMPT_CHARS_PER_FRAME = 2.25;
const PROMPT_POST_TYPE_HOLD = 5;
const PROMPT_SEND_DURATION = 10;
const REQUEST_CARD_PRESS_DURATION = PROMPT_SEND_DURATION;
const PROMPT_GAP_DURATION = 6;
const CARD_ENTRY_DURATION = 10;
const CARD_ENTRY_STAGGER = 34;
const FIRST_CARD_ASSIGN_DELAY = 22;
const ASSIGNING_DURATION = 8;
const FEED_SCROLL_SPEED = 0.95;
const LOADER_FADE_DURATION = 10;
const LOADER_HOLD_DURATION = 84;
const THREAD_SCENE_DURATION = 128;
const THREAD_SHELL_FADE_DURATION = 12;
const THREAD_REQUEST_BUBBLE_START = 8;
const THREAD_REQUEST_BUBBLE_DURATION = 12;
const THREAD_LOADER_START = 28;
const THREAD_LOADER_DURATION = 12;
const THREAD_COMPOSER_REVEAL_DURATION = 12;
const FIRST_CARD_TOP = 86;
const CARD_STACK_GAP = 132;
const REQUEST_SCROLL_HOLD_DURATION = 90;
const REQUEST_SCROLL_SLOWDOWN_DURATION = 54;
const REQUEST_STOP_HOLD_DURATION = 18;
const REQUEST_POST_PRESS_HOLD_DURATION = 12;
const REQUEST_FEED_CUT_FADE_DURATION = 4;
const CENTERED_REQUEST_INDEX = 2;
const REQUEST_CARD_HEIGHT = 124;

type AvatarKind = "agent" | "solana" | "tool";
type AvatarTone = "amber" | "coral" | "lime" | "sky" | "teal";

type StoryParticipant = {
  kind: AvatarKind;
  label: string;
  tone: AvatarTone;
};

type StoryRequest = {
  participants: StoryParticipant[];
  prompt: string;
  summary: string;
  timeLabel: string;
  title: string;
};

type PromptCycle = {
  end: number;
  index: number;
  sendEnd: number;
  sendStart: number;
  start: number;
  submitFrame: number;
  typingEnd: number;
};

const STORY_REQUESTS: StoryRequest[] = [
  {
    participants: [{kind: "solana", label: "Solana Operator", tone: "teal"}],
    prompt: "Fix Solana wallet edge cases",
    summary: "Route the right specialists and keep the work thread moving until the delivery is actually done.",
    timeLabel: "Just now",
    title: "Fix Solana wallet edge cases",
  },
  {
    participants: [
      {kind: "solana", label: "Solana Operator", tone: "teal"},
      {kind: "agent", label: "Payments Agent", tone: "amber"},
    ],
    prompt: "Trace payout confirmation gaps",
    summary: "Match wallet verification, callback updates, and payout state inside one tracked request.",
    timeLabel: "1m",
    title: "Trace payout confirmation gaps",
  },
  {
    participants: [
      {kind: "agent", label: "Runtime Agent", tone: "sky"},
      {kind: "tool", label: "Protocol Tooling", tone: "lime"},
      {kind: "agent", label: "Ops Agent", tone: "coral"},
    ],
    prompt: "Review MCP callback delivery contract",
    summary: "Pull runtime, webhook, and request-thread specialists into one execution path without drift.",
    timeLabel: "3m",
    title: "Review MCP callback delivery contract",
  },
  {
    participants: [
      {kind: "tool", label: "Voice Tool", tone: "amber"},
      {kind: "agent", label: "Editorial Agent", tone: "coral"},
    ],
    prompt: "Draft launch voiceover",
    summary: "Bring voice, product, and editorial workers together without drifting from repo truth.",
    timeLabel: "6m",
    title: "Draft launch voiceover from product truth",
  },
  {
    participants: [
      {kind: "agent", label: "Routing Agent", tone: "sky"},
      {kind: "agent", label: "Recovery Agent", tone: "coral"},
      {kind: "tool", label: "Market Tooling", tone: "lime"},
    ],
    prompt: "Recover blocked request routes",
    summary: "Keep failed automatic routes reopenable for workers instead of stalling in retry-only states.",
    timeLabel: "8m",
    title: "Recover blocked request routes",
  },
  {
    participants: [
      {kind: "agent", label: "Classifier Agent", tone: "amber"},
      {kind: "tool", label: "Route Tooling", tone: "lime"},
      {kind: "agent", label: "Policy Agent", tone: "sky"},
    ],
    prompt: "Classify one-request fetch paths",
    summary: "Resolve catalog, direct tool, provider, or worker-market fetch policy before execution drifts.",
    timeLabel: "10m",
    title: "Classify one-request fetch paths",
  },
];

const TRAILING_PROMPT = "Rank worker-market candidates";
const PROMPT_SCRIPT = [...STORY_REQUESTS.map((item) => item.prompt), TRAILING_PROMPT];
const FOCUSED_REQUEST = STORY_REQUESTS[CENTERED_REQUEST_INDEX] ?? STORY_REQUESTS[0];

const TONE_STYLES: Record<AvatarTone, {background: string; border: string; color: string}> = {
  amber: {
    background: "rgba(251, 191, 36, 0.12)",
    border: "rgba(251, 191, 36, 0.24)",
    color: "#FCD34D",
  },
  coral: {
    background: "rgba(251, 146, 60, 0.12)",
    border: "rgba(251, 146, 60, 0.22)",
    color: "#FB923C",
  },
  lime: {
    background: "rgba(134, 239, 172, 0.12)",
    border: "rgba(134, 239, 172, 0.2)",
    color: "#86EFAC",
  },
  sky: {
    background: "rgba(125, 211, 252, 0.12)",
    border: "rgba(125, 211, 252, 0.24)",
    color: "#7DD3FC",
  },
  teal: {
    background: "rgba(104, 216, 208, 0.12)",
    border: "rgba(104, 216, 208, 0.24)",
    color: TOKENS.accent,
  },
};

const fontFaceCss = `
@font-face {
  font-family: "Boreal Sans";
  font-style: normal;
  font-weight: 200 800;
  font-display: swap;
  src: url("${staticFile("fonts/manrope-latin.woff2")}") format("woff2");
}

@font-face {
  font-family: "Boreal Heading";
  font-style: normal;
  font-weight: 400 800;
  font-display: swap;
  src: url("${staticFile("fonts/syne-latin.woff2")}") format("woff2");
}

@font-face {
  font-family: "Boreal Mono";
  font-style: normal;
  font-weight: 100 900;
  font-display: swap;
  src: url("${staticFile("fonts/geist-mono-latin.woff2")}") format("woff2");
}
`;

const centeredColumn: CSSProperties = {
  alignItems: "center",
  display: "flex",
  flexDirection: "column",
};

const heroCopyStyle: CSSProperties = {
  color: TOKENS.mutedForeground,
  fontFamily: FONTS.sans,
  fontSize: 16,
  fontWeight: 400,
  lineHeight: "28px",
  margin: 0,
  maxWidth: 720,
  textAlign: "center",
  textWrap: "balance",
};

const composerTextStyle: CSSProperties = {
  color: TOKENS.foreground,
  fontFamily: FONTS.sans,
  fontSize: 19,
  fontWeight: 500,
  letterSpacing: "-0.02em",
  lineHeight: "28px",
  margin: 0,
  whiteSpace: "pre-wrap",
};

const LONGEST_PROMPT = PROMPT_SCRIPT.reduce(
  (longest, item) => (item.length > longest.length ? item : longest),
  "",
);

const buildPromptCycles = () => {
  let cursor = PROMPT_SCENE_START;

  return PROMPT_SCRIPT.map((prompt, index) => {
    const typingFrames = Math.ceil(prompt.length / PROMPT_CHARS_PER_FRAME);
    const typingEnd = cursor + typingFrames;
    const sendStart = typingEnd + PROMPT_POST_TYPE_HOLD;
    const sendEnd = sendStart + PROMPT_SEND_DURATION;
    const submitFrame = sendStart + Math.floor(PROMPT_SEND_DURATION / 2);
    const end = sendEnd + PROMPT_GAP_DURATION;

    const cycle: PromptCycle = {
      end,
      index,
      sendEnd,
      sendStart,
      start: cursor,
      submitFrame,
      typingEnd,
    };

    cursor = end;
    return cycle;
  });
};

const PROMPT_CYCLES = buildPromptCycles();
const LAST_PROMPT_CYCLE = PROMPT_CYCLES[PROMPT_CYCLES.length - 1];
const LAST_SUBMITTED_PROMPT_CYCLE = PROMPT_CYCLES[Math.max(0, STORY_REQUESTS.length - 1)] ?? LAST_PROMPT_CYCLE;
const THIRD_TO_LAST_PROMPT_CYCLE = PROMPT_CYCLES[Math.max(0, STORY_REQUESTS.length - 3)] ?? LAST_SUBMITTED_PROMPT_CYCLE;
const HALF_TRAILING_PROMPT_FRAMES = Math.max(1, Math.ceil(TRAILING_PROMPT.length / PROMPT_CHARS_PER_FRAME / 2));
const CHAT_EXIT_START = Math.max(PROMPT_SCENE_START, THIRD_TO_LAST_PROMPT_CYCLE.start + 4);
const REQUEST_SCENE_START = LAST_PROMPT_CYCLE.start + HALF_TRAILING_PROMPT_FRAMES;
const CHAT_ZOOM_START = PROMPT_SCENE_START + Math.floor((REQUEST_SCENE_START - PROMPT_SCENE_START) * 0.5);
const CHAT_SNAP_EXIT_DURATION = 8;
const FIRST_CARD_START = REQUEST_SCENE_START;
const CARD_START_FRAMES = STORY_REQUESTS.map((_, index) =>
  index === 0 ? FIRST_CARD_START : FIRST_CARD_START + 44 + (index - 1) * CARD_ENTRY_STAGGER,
);
const SECOND_CARD_START = CARD_START_FRAMES[1] ?? FIRST_CARD_START + 44;
const LAST_CARD_START = CARD_START_FRAMES[CARD_START_FRAMES.length - 1] ?? FIRST_CARD_START;
const FEED_SCROLL_START = REQUEST_SCENE_START + 16;
const REQUEST_SCROLL_HOLD_END = FEED_SCROLL_START + REQUEST_SCROLL_HOLD_DURATION;
const REQUEST_CENTER_TOP = (STACK_VIEWPORT_HEIGHT - REQUEST_CARD_HEIGHT) / 2;
const REQUEST_SCROLL_CONSTANT_DISTANCE = REQUEST_SCROLL_HOLD_DURATION * FEED_SCROLL_SPEED;
const REQUEST_CENTER_SCROLL_TARGET = Math.max(
  REQUEST_SCROLL_CONSTANT_DISTANCE,
  FIRST_CARD_TOP + CENTERED_REQUEST_INDEX * CARD_STACK_GAP - REQUEST_CENTER_TOP,
);
const REQUEST_SCROLL_STOP = REQUEST_SCROLL_HOLD_END + REQUEST_SCROLL_SLOWDOWN_DURATION;
const REQUEST_CARD_CLICK_START = REQUEST_SCROLL_STOP + REQUEST_STOP_HOLD_DURATION;
const LOADING_START = REQUEST_CARD_CLICK_START + REQUEST_CARD_PRESS_DURATION + REQUEST_POST_PRESS_HOLD_DURATION;
const FEED_FADE_START = LOADING_START - REQUEST_FEED_CUT_FADE_DURATION;
const CHAT_SEQUENCE_DURATION = REQUEST_SCENE_START;
const REQUEST_SEQUENCE_DURATION = LOADING_START - REQUEST_SCENE_START;
const LOADING_SEQUENCE_DURATION = LOADER_HOLD_DURATION;
const THREAD_SCENE_START = LOADING_START + LOADING_SEQUENCE_DURATION;
const THREAD_SEQUENCE_DURATION = THREAD_SCENE_DURATION;
export const HOME_CHAT_DURATION = THREAD_SCENE_START + THREAD_SEQUENCE_DURATION;

const getDotMatrixProgress = (frame: number) => {
  const elapsedFrames = Math.max(0, frame - LOADING_START);
  const elapsedMs = (elapsedFrames / FPS) * 1000;
  const cycleMs = 1600 / 2;
  return (((elapsedMs % cycleMs) + cycleMs) % cycleMs) / cycleMs;
};

const getSinePressProgress = (frame: number, start: number, duration: number) => {
  if (frame < start || frame > start + duration) {
    return 0;
  }

  return Math.sin(((frame - start) / duration) * Math.PI);
};

const getPromptComposerState = (frame: number) => {
  const activeCycle = PROMPT_CYCLES.find((cycle) => frame < cycle.end) ?? LAST_PROMPT_CYCLE;
  const activePrompt = PROMPT_SCRIPT[activeCycle.index] ?? TRAILING_PROMPT;
  const rawChars = Math.floor((frame - activeCycle.start) * PROMPT_CHARS_PER_FRAME);
  const charsVisible = Math.max(0, Math.min(activePrompt.length, rawChars));
  const pressProgress = getSinePressProgress(frame, activeCycle.sendStart, PROMPT_SEND_DURATION);

  return {
    cursorVisible: frame < activeCycle.sendStart && frame % 14 < 7,
    pressProgress,
    text: activePrompt.slice(0, charsVisible),
  };
};

const getSubmittedRequestCount = (frame: number) =>
  PROMPT_CYCLES.slice(0, STORY_REQUESTS.length).reduce((count, cycle) => count + (frame >= cycle.submitFrame ? 1 : 0), 0);

const getRequestScrollOffset = (frame: number) => {
  if (frame <= FEED_SCROLL_START) {
    return 0;
  }

  if (frame <= REQUEST_SCROLL_HOLD_END) {
    return (frame - FEED_SCROLL_START) * FEED_SCROLL_SPEED;
  }

  if (frame <= REQUEST_SCROLL_STOP) {
    return interpolate(
      frame,
      [REQUEST_SCROLL_HOLD_END, REQUEST_SCROLL_STOP],
      [REQUEST_SCROLL_CONSTANT_DISTANCE, REQUEST_CENTER_SCROLL_TARGET],
      {
        ...CLAMP,
        easing: Easing.out(Easing.cubic),
      },
    );
  }

  return REQUEST_CENTER_SCROLL_TARGET;
};

const formatParticipantCount = (count: number) => `${count} agent${count === 1 ? "" : "s"} joined`;

const BorealCue: React.FC = () => {
  return (
    <div
      style={{
        alignItems: "center",
        background: TOKENS.background,
        border: `1px solid ${TOKENS.border}`,
        borderRadius: 999,
        color: TOKENS.foreground,
        display: "inline-flex",
        fontFamily: FONTS.sans,
        fontSize: 12,
        fontWeight: 500,
        gap: 8,
        height: 28,
        padding: "0 12px",
      }}
    >
      <BotIcon size={14} strokeWidth={2} />
      <span>Boreal Agent</span>
    </div>
  );
};

const SubmitButton: React.FC<{pressProgress: number}> = ({pressProgress}) => {
  return (
    <div
      style={{
        alignItems: "center",
        background: TOKENS.accent,
        borderRadius: RADIUS.lg,
        color: TOKENS.accentForeground,
        display: "flex",
        height: 28,
        justifyContent: "center",
        transform: `translateY(${pressProgress * 1.5}px) scale(${1 - pressProgress * 0.08})`,
        width: 28,
      }}
    >
      <CornerDownLeftIcon size={16} strokeWidth={1.9} />
    </div>
  );
};

const StatusBadge: React.FC<{accent?: boolean; label: string}> = ({accent = false, label}) => {
  return (
    <div
      style={{
        alignItems: "center",
        background: accent ? TOKENS.accentGlow : "transparent",
        border: `1px solid ${accent ? "rgba(104, 216, 208, 0.26)" : TOKENS.border}`,
        boxShadow: accent ? `0 0 0 1px rgba(104, 216, 208, 0.06) inset` : "none",
        color: accent ? TOKENS.foreground : TOKENS.mutedForeground,
        display: "inline-flex",
        fontFamily: FONTS.sans,
        fontSize: 11,
        fontWeight: 500,
        gap: 6,
        letterSpacing: "0.16em",
        padding: "6px 8px",
        textTransform: "uppercase",
      }}
    >
      <CircleDotIcon size={12} strokeWidth={1.9} />
      <span>{label}</span>
    </div>
  );
};

const CounterPill: React.FC<{count: number; label: string; muted?: boolean}> = ({count, label, muted = false}) => {
  return (
    <div
      style={{
        alignItems: "center",
        background: muted ? "rgba(255, 255, 255, 0.03)" : "rgba(104, 216, 208, 0.08)",
        border: `1px solid ${muted ? "rgba(255, 255, 255, 0.08)" : "rgba(104, 216, 208, 0.16)"}`,
        borderRadius: 999,
        color: TOKENS.foreground,
        display: "inline-flex",
        fontFamily: FONTS.sans,
        fontSize: 12,
        fontWeight: 500,
        gap: 6,
        height: 34,
        padding: "0 14px",
      }}
    >
      <span
        style={{
          color: muted ? TOKENS.foreground : TOKENS.accent,
          fontFamily: FONTS.mono,
          fontSize: 12,
          letterSpacing: "0.02em",
        }}
      >
        {count}
      </span>
      <span
        style={{
          color: TOKENS.mutedForeground,
          fontSize: 11,
          letterSpacing: "0.16em",
          textTransform: "uppercase",
        }}
      >
        {label}
      </span>
    </div>
  );
};

const SolanaLogoMark: React.FC<{size?: number}> = ({size = 13}) => {
  return (
    <svg
      aria-hidden="true"
      height={size * 0.75}
      style={{display: "block"}}
      viewBox="0 0 128 96"
      width={size}
    >
      <path
        d="M20 12c1.7-1.7 4-2.7 6.4-2.7h83.8c5.7 0 8.6 6.9 4.6 10.9l-11.4 11.4c-1.7 1.7-4 2.7-6.4 2.7H13.2c-5.7 0-8.6-6.9-4.6-10.9L20 12Z"
        fill="currentColor"
      />
      <path
        d="M20 62.8c1.7-1.7 4-2.7 6.4-2.7h83.8c5.7 0 8.6 6.9 4.6 10.9L103.4 82.4c-1.7 1.7-4 2.7-6.4 2.7H13.2c-5.7 0-8.6-6.9-4.6-10.9L20 62.8Z"
        fill="currentColor"
      />
      <path
        d="M108 37.5c-1.7-1.7-4-2.7-6.4-2.7H17.8c-5.7 0-8.6 6.9-4.6 10.9l11.4 11.4c1.7 1.7 4 2.7 6.4 2.7h83.8c5.7 0 8.6-6.9 4.6-10.9L108 37.5Z"
        fill="currentColor"
      />
    </svg>
  );
};

const AgentAvatar: React.FC<{index: number; participant: StoryParticipant; progress: number}> = ({
  index,
  participant,
  progress,
}) => {
  const tone = TONE_STYLES[participant.tone];

  return (
    <span
      style={{
        alignItems: "center",
        background: tone.background,
        border: `1px solid ${tone.border}`,
        borderRadius: 999,
        color: tone.color,
        display: "inline-flex",
        height: 28,
        justifyContent: "center",
        marginLeft: index === 0 ? 0 : -6,
        opacity: progress,
        transform: `translateY(${(1 - progress) * 7}px) scale(${0.82 + progress * 0.18})`,
        width: 28,
      }}
      title={participant.label}
    >
      {participant.kind === "solana" ? (
        <SolanaLogoMark size={13} />
      ) : participant.kind === "tool" ? (
        <SparklesIcon size={12} strokeWidth={1.9} />
      ) : (
        <BotIcon size={12} strokeWidth={1.9} />
      )}
    </span>
  );
};

const AvatarRow: React.FC<{frame: number; participants: StoryParticipant[]; revealStartFrame: number}> = ({
  frame,
  participants,
  revealStartFrame,
}) => {
  return (
    <div
      style={{
        alignItems: "center",
        display: "flex",
        minHeight: 28,
      }}
    >
      {participants.map((participant, index) => {
        const progress = interpolate(frame, [revealStartFrame + index * 7, revealStartFrame + index * 7 + 10], [0, 1], CLAMP);

        return (
          <AgentAvatar
            index={index}
            key={`${participant.label}-${index}`}
            participant={participant}
            progress={progress}
          />
        );
      })}
    </div>
  );
};

const DOT_MATRIX_SIZE = 5;
const DOT_MATRIX_BASE_OPACITY = 0.08;
const DOT_MATRIX_NEAR_OPACITY = 0.24;
const DOT_MATRIX_PEAK_OPACITY = 1;
const DOT_MATRIX_TARGET_BASE = 0.2;
const DOT_MATRIX_TARGET_MID = 0.5;
const DOT_MATRIX_STEP_COUNT = 20;
const DOT_MATRIX_HELIX_LOOP_RADIANS = (Math.PI * 2) / (DOT_MATRIX_STEP_COUNT - 1);

const smoothstep01 = (edge0: number, edge1: number, value: number) => {
  if (edge1 <= edge0) {
    return value >= edge1 ? 1 : 0;
  }

  const t = Math.max(0, Math.min(1, (value - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
};

const remapDotMatrixOpacity = (opacity: number) => {
  if (opacity <= DOT_MATRIX_BASE_OPACITY) {
    return DOT_MATRIX_TARGET_BASE * smoothstep01(0, DOT_MATRIX_BASE_OPACITY, opacity);
  }

  if (opacity <= 0.34) {
    return DOT_MATRIX_TARGET_BASE + (DOT_MATRIX_TARGET_MID - DOT_MATRIX_TARGET_BASE) * smoothstep01(DOT_MATRIX_BASE_OPACITY, 0.34, opacity);
  }

  if (opacity <= 0.94) {
    return DOT_MATRIX_TARGET_MID + (0.94 - DOT_MATRIX_TARGET_MID) * smoothstep01(0.34, 0.94, opacity);
  }

  return 0.94 + (1 - 0.94) * smoothstep01(0.94, 1, opacity);
};

const dotMatrixOpacityForCell = (row: number, col: number, progress: number) => {
  const t = progress * DOT_MATRIX_STEP_COUNT;
  const rowPhase = t * DOT_MATRIX_HELIX_LOOP_RADIANS + row * 1.24;
  const strandCol = Math.round(2 + 2 * Math.sin(rowPhase));

  if (col === strandCol) {
    return remapDotMatrixOpacity(DOT_MATRIX_PEAK_OPACITY);
  }

  if (Math.abs(col - strandCol) === 1) {
    return remapDotMatrixOpacity(DOT_MATRIX_NEAR_OPACITY);
  }

  return remapDotMatrixOpacity(DOT_MATRIX_BASE_OPACITY);
};

const DotMatrixSquare17: React.FC<{dotSize?: number; progress: number; size?: number}> = ({
  dotSize = 5,
  progress,
  size = 34,
}) => {
  const gap = Math.max(1, Math.floor((size - dotSize * DOT_MATRIX_SIZE) / (DOT_MATRIX_SIZE - 1)));
  const cell = dotSize + gap;

  return (
    <svg
      aria-hidden="true"
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      width={size}
    >
      {Array.from({length: DOT_MATRIX_SIZE * DOT_MATRIX_SIZE}).map((_, index) => {
        const row = Math.floor(index / DOT_MATRIX_SIZE);
        const col = index % DOT_MATRIX_SIZE;
        const opacity = dotMatrixOpacityForCell(row, col, progress);

        return (
          <circle
            cx={col * cell + dotSize / 2}
            cy={row * cell + dotSize / 2}
            fill="rgba(104, 216, 208, 1)"
            key={`${row}-${col}`}
            opacity={opacity}
            r={dotSize / 2}
          />
        );
      })}
    </svg>
  );
};

const PromptComposer: React.FC<{frame: number}> = ({frame}) => {
  const {cursorVisible, pressProgress, text} = getPromptComposerState(frame);

  return (
    <div
      style={{
        background: TOKENS.input,
        border: `1px solid ${TOKENS.border}`,
        borderRadius: RADIUS.lg,
        boxShadow: TOKENS.shadow,
        overflow: "hidden",
        width: "100%",
      }}
    >
      <div
        style={{
          minHeight: 126,
          padding: "16px 18px 0",
          position: "relative",
        }}
      >
        <p
          aria-hidden
          style={{
            ...composerTextStyle,
            opacity: 0,
            pointerEvents: "none",
            width: "100%",
          }}
        >
          {LONGEST_PROMPT}
        </p>
        <div
          style={{
            inset: "16px 18px 0",
            position: "absolute",
          }}
        >
          <p style={composerTextStyle}>
            {text}
            {cursorVisible ? <span>|</span> : null}
          </p>
        </div>
      </div>
      <div
        style={{
          alignItems: "center",
          display: "flex",
          justifyContent: "space-between",
          padding: "8px 12px 12px",
        }}
      >
        <BorealCue />
        <SubmitButton pressProgress={pressProgress} />
      </div>
    </div>
  );
};

export const PromptBurstScene: React.FC<{frame: number}> = ({frame}) => {
  const transitionProgress =
    frame >= CHAT_EXIT_START
      ? interpolate(frame, [CHAT_EXIT_START, REQUEST_SCENE_START], [0, 1], {
          ...CLAMP,
          easing: Easing.out(Easing.cubic),
        })
      : 0;
  const fadeMidpoint = CHAT_EXIT_START + Math.floor((REQUEST_SCENE_START - CHAT_EXIT_START) * 0.6);
  const opacity =
    frame >= CHAT_EXIT_START
      ? interpolate(frame, [CHAT_EXIT_START, fadeMidpoint, REQUEST_SCENE_START], [1, 0.95, 0.34], CLAMP)
      : 1;
  const zoomScale =
    frame >= CHAT_ZOOM_START
      ? interpolate(frame, [CHAT_ZOOM_START, REQUEST_SCENE_START], [1, 1.04], {
          ...CLAMP,
          easing: Easing.out(Easing.cubic),
        })
      : 1;
  const snapExitStart = Math.max(CHAT_EXIT_START, REQUEST_SCENE_START - CHAT_SNAP_EXIT_DURATION);
  const snapTranslateY =
    frame >= snapExitStart
      ? interpolate(frame, [snapExitStart, REQUEST_SCENE_START], [0, -20], {
          ...CLAMP,
          easing: Easing.in(Easing.cubic),
        })
      : 0;
  const requestsCount = getSubmittedRequestCount(frame);
  const requestScale =
    requestsCount === 0 ? 1 : 1 + Math.max(0, 0.08 - (frame - PROMPT_CYCLES[requestsCount - 1].submitFrame) * 0.006);

  return (
    <div
      style={{
        ...centeredColumn,
        gap: 18,
        height: "100%",
        justifyContent: "center",
        opacity,
        transform: `translateY(${snapTranslateY}px) scale(${zoomScale})`,
        transformOrigin: "center center",
        width: "100%",
      }}
    >
      <div
        style={{
          ...centeredColumn,
          gap: 10,
          width: INNER_WIDTH,
        }}
      >
        <h1
          style={{
            color: TOKENS.foreground,
            fontFamily: FONTS.sans,
            fontSize: 48,
            fontWeight: 500,
            letterSpacing: "-0.06em",
            lineHeight: 1.05,
            margin: 0,
            textAlign: "center",
          }}
        >
          Tell Boreal what you want done
        </h1>
        <p style={heroCopyStyle}>
          Boreal turns intent into matched offers and tracked requests before it routes the right work thread.
        </p>
      </div>

      <div
        style={{
          ...centeredColumn,
          gap: 12,
          width: INNER_WIDTH,
        }}
      >
        <PromptComposer frame={frame} />
        <div
          style={{
            alignItems: "center",
            display: "flex",
            gap: 10,
            justifyContent: "center",
            width: "100%",
          }}
        >
          <CounterPill count={23} label="Offers" />
          <div
            style={{
              transform: `scale(${requestScale})`,
              transformOrigin: "center center",
            }}
          >
            <CounterPill count={requestsCount} label="Requests" muted />
          </div>
        </div>
      </div>
    </div>
  );
};

const StreamRequestCard: React.FC<{
  feedOpacity: number;
  frame: number;
  index: number;
  pressProgress: number;
  request: StoryRequest;
  scrollOffset: number;
  startFrame: number;
}> = ({
  feedOpacity,
  frame,
  index,
  pressProgress,
  request,
  scrollOffset,
  startFrame,
}) => {
  const appear = interpolate(frame, [startFrame, startFrame + CARD_ENTRY_DURATION], [0, 1], CLAMP);
  const opacity = appear * feedOpacity;
  const translateY = FIRST_CARD_TOP + index * CARD_STACK_GAP + (1 - appear) * 20 - scrollOffset;
  const baseScale = interpolate(appear, [0, 1], [0.99, 1], CLAMP);
  const isCenteredCard = index === CENTERED_REQUEST_INDEX;
  const centeredFocusProgress =
    frame < REQUEST_SCROLL_STOP ? 0 : interpolate(frame, [REQUEST_SCROLL_STOP, LOADING_START], [0, 1], CLAMP);
  const focusScale = isCenteredCard ? 1 : 1 - centeredFocusProgress * 0.012;
  const scale = isCenteredCard ? baseScale * (1 - pressProgress * 0.045) : baseScale * focusScale;
  const pressShift = isCenteredCard ? pressProgress * 0.9 : 0;
  const cardOpacity = isCenteredCard ? opacity : opacity * (1 - centeredFocusProgress * 0.42);
  const assignStart = startFrame + FIRST_CARD_ASSIGN_DELAY;
  const assigningEnd = assignStart + ASSIGNING_DURATION;
  const teamRevealStart = assigningEnd + 2;
  const routingOpacity = frame < assignStart ? 1 : interpolate(frame, [assignStart, assigningEnd], [1, 0], CLAMP);
  const assigningOpacity =
    frame < assignStart
      ? 0
      : Math.min(
          interpolate(frame, [assignStart, assignStart + 3], [0, 1], CLAMP),
          interpolate(frame, [assigningEnd - 1, teamRevealStart + 3], [1, 0], CLAMP),
        );
  const teamOpacity = interpolate(frame, [teamRevealStart, teamRevealStart + 10], [0, 1], CLAMP);
  const teamLabel = formatParticipantCount(request.participants.length);

  return (
    <div
      style={{
        background: isCenteredCard
          ? `rgba(255, 255, 255, ${0.02 + pressProgress * 0.045})`
          : "rgba(255, 255, 255, 0.02)",
        border: `1px solid ${TOKENS.border}`,
        borderRadius: 12,
        boxShadow: "none",
        left: 0,
        opacity: cardOpacity,
        overflow: "hidden",
        position: "absolute",
        top: 0,
        transform: `translateY(${translateY + pressShift}px) scale(${scale})`,
        transformOrigin: "center center",
        width: "100%",
        zIndex: isCenteredCard ? 2 : 1,
      }}
    >
      <div
        style={{
          padding: "10px 14px 10px",
        }}
      >
        <div
          style={{
            alignItems: "center",
            color: TOKENS.mutedForeground,
            display: "flex",
            gap: 8,
            fontFamily: FONTS.mono,
            fontSize: 11,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
          }}
        >
          <span>Open</span>
          <span
            style={{
              background: TOKENS.border,
              height: 4,
              width: 4,
            }}
          />
          <span>{request.timeLabel}</span>
        </div>
        <p
          style={{
            color: TOKENS.foreground,
            fontFamily: FONTS.sans,
            fontSize: 14,
            fontWeight: 500,
            letterSpacing: "-0.02em",
            lineHeight: "20px",
            margin: "8px 0 0",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {request.title}
        </p>
        <p
          style={{
            color: TOKENS.mutedForeground,
            fontFamily: FONTS.sans,
            fontSize: 11.5,
            lineHeight: "18px",
            margin: "4px 0 0",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {request.summary}
        </p>
      </div>
      <div
        style={{
          alignItems: "center",
          borderTop: `1px solid rgba(255, 255, 255, 0.06)`,
          display: "flex",
          gap: 16,
          padding: "8px 14px",
        }}
      >
        <div
          style={{
            flex: "1 1 auto",
            minHeight: 28,
            minWidth: 180,
            position: "relative",
          }}
        >
          <div
            style={{
              left: 0,
              opacity: routingOpacity,
              position: "absolute",
              top: 0,
              transform: `translateY(${(1 - routingOpacity) * -6}px)`,
            }}
          >
            <StatusBadge label="Routing" />
          </div>
          <div
            style={{
              left: 0,
              opacity: assigningOpacity,
              position: "absolute",
              top: 0,
              transform: `translateY(${(1 - assigningOpacity) * -4}px)`,
            }}
          >
            <StatusBadge label="Assigning" />
          </div>
          <div
            style={{
              left: 0,
              opacity: teamOpacity,
              position: "absolute",
              top: 0,
              transform: `translateY(${(1 - teamOpacity) * 8}px)`,
            }}
          >
            <AvatarRow frame={frame} participants={request.participants} revealStartFrame={teamRevealStart + 2} />
          </div>
        </div>
        <div
          style={{
            alignItems: "center",
            color: TOKENS.mutedForeground,
            display: "flex",
            flex: "0 0 auto",
            fontFamily: FONTS.sans,
            fontSize: 11,
            justifyContent: "flex-end",
            letterSpacing: "0.16em",
            minWidth: 182,
            position: "relative",
            textAlign: "right",
            textTransform: "uppercase",
          }}
        >
          <span
            style={{
              inset: 0,
              opacity: routingOpacity,
              position: "absolute",
            }}
          >
            Routing
          </span>
          <span
            style={{
              inset: 0,
              opacity: assigningOpacity,
              position: "absolute",
            }}
          >
            Assigning
          </span>
          <span
            style={{
              inset: 0,
              opacity: teamOpacity,
              position: "absolute",
            }}
          >
            {teamLabel}
          </span>
          <span style={{opacity: 0}}>{teamLabel}</span>
        </div>
      </div>
    </div>
  );
};

export const RequestRoutingScene: React.FC<{frame: number}> = ({frame}) => {
  const shadowOpacity = interpolate(frame, [SECOND_CARD_START - 4, SECOND_CARD_START + 8], [0, 1], CLAMP);
  const scrollOffset = getRequestScrollOffset(frame);
  const feedOpacity = interpolate(frame, [FEED_FADE_START, LOADING_START], [1, 0], CLAMP);
  const pressProgress = getSinePressProgress(frame, REQUEST_CARD_CLICK_START, REQUEST_CARD_PRESS_DURATION);

  return (
    <div
      style={{
        alignItems: "center",
        display: "flex",
        inset: 0,
        justifyContent: "center",
        position: "absolute",
      }}
    >
      <div
        style={{
          height: STACK_VIEWPORT_HEIGHT,
          overflow: "hidden",
          position: "relative",
          width: INNER_WIDTH,
        }}
      >
        {STORY_REQUESTS.map((request, index) => (
          <StreamRequestCard
            feedOpacity={feedOpacity}
            frame={frame}
            index={index}
            key={request.title}
            pressProgress={pressProgress}
            request={request}
            scrollOffset={scrollOffset}
            startFrame={CARD_START_FRAMES[index] ?? REQUEST_SCENE_START}
          />
        ))}
        <div
          style={{
            background: "linear-gradient(180deg, rgba(0, 0, 0, 1) 0%, rgba(0, 0, 0, 0.86) 38%, rgba(0, 0, 0, 0) 100%)",
            height: 72,
            inset: "0 0 auto 0",
            opacity: shadowOpacity,
            pointerEvents: "none",
            position: "absolute",
          }}
        />
        <div
          style={{
            background: "linear-gradient(0deg, rgba(0, 0, 0, 1) 0%, rgba(0, 0, 0, 0.86) 38%, rgba(0, 0, 0, 0) 100%)",
            height: 84,
            inset: "auto 0 0 0",
            opacity: shadowOpacity,
            pointerEvents: "none",
            position: "absolute",
          }}
        />
      </div>
    </div>
  );
};

const StaticAvatarRow: React.FC<{participants: StoryParticipant[]}> = ({participants}) => {
  return (
    <div
      style={{
        alignItems: "center",
        display: "flex",
        minHeight: 28,
      }}
    >
      {participants.map((participant, index) => (
        <AgentAvatar
          index={index}
          key={`${participant.label}-${index}`}
          participant={participant}
          progress={1}
        />
      ))}
    </div>
  );
};

const BorealizingLine: React.FC<{dotSize?: number; frame: number; labelSize?: number; size?: number}> = ({
  dotSize = 5,
  frame,
  labelSize = 16,
  size = 34,
}) => {
  const progress = getDotMatrixProgress(frame);

  return (
    <div
      style={{
        alignItems: "center",
        display: "inline-flex",
        gap: 8,
      }}
    >
      <DotMatrixSquare17 dotSize={dotSize} progress={progress} size={size} />
      <p
        style={{
          color: TOKENS.mutedForeground,
          fontFamily: FONTS.sans,
          fontSize: labelSize,
          fontWeight: 400,
          letterSpacing: "-0.03em",
          lineHeight: `${Math.round(labelSize * 1.2)}px`,
          margin: 0,
        }}
      >
        Borealizing...
      </p>
    </div>
  );
};

const DotMatrixLoader: React.FC<{frame: number}> = ({frame}) => {
  const opacity = interpolate(frame, [LOADING_START, LOADING_START + LOADER_FADE_DURATION], [0, 1], CLAMP);

  return (
    <div
      style={{
        alignItems: "center",
        display: "inline-flex",
        gap: 16,
        opacity,
        transform: `translateY(${interpolate(opacity, [0, 1], [10, 0], CLAMP)}px)`,
      }}
    >
      <BorealizingLine dotSize={6} frame={frame} labelSize={28} size={42} />
    </div>
  );
};

export const LoadingScene: React.FC<{frame: number}> = ({frame}) => {
  return (
    <div
      style={{
        alignItems: "center",
        display: "flex",
        inset: 0,
        justifyContent: "center",
        position: "absolute",
      }}
    >
      <DotMatrixLoader frame={frame} />
    </div>
  );
};

const ThreadTabTrigger: React.FC<{active?: boolean; count?: number; label: string}> = ({
  active = false,
  count = 0,
  label,
}) => {
  const hasCount = count > 0;

  return (
    <div
      style={{
        alignItems: "center",
        background: active ? "rgba(255, 255, 255, 0.06)" : "transparent",
        border: `1px solid ${active ? "rgba(255, 255, 255, 0.08)" : "transparent"}`,
        borderRadius: 10,
        color: active ? TOKENS.foreground : TOKENS.mutedForeground,
        display: "inline-flex",
        gap: 6,
        height: 30,
        padding: "0 12px",
      }}
    >
      <span
        style={{
          fontFamily: FONTS.sans,
          fontSize: 12,
          fontWeight: 500,
          lineHeight: "16px",
        }}
      >
        {label}
      </span>
      <span
        style={{
          alignItems: "center",
          background: hasCount ? "rgba(104, 216, 208, 0.12)" : "transparent",
          borderRadius: 999,
          color: hasCount ? TOKENS.accent : "transparent",
          display: "inline-flex",
          fontFamily: FONTS.sans,
          fontSize: 10,
          fontWeight: 600,
          height: 18,
          justifyContent: "center",
          minWidth: 22,
          opacity: hasCount ? 1 : 0,
          padding: "0 6px",
        }}
      >
        {count}
      </span>
    </div>
  );
};

const ThreadStatusMeta: React.FC = () => {
  return (
    <div
      style={{
        alignItems: "center",
        color: TOKENS.mutedForeground,
        display: "inline-flex",
        fontFamily: FONTS.mono,
        fontSize: 11,
        gap: 8,
        letterSpacing: "0.16em",
        textTransform: "uppercase",
      }}
    >
      <span
        style={{
          background: TOKENS.accent,
          borderRadius: 999,
          display: "inline-flex",
          height: 6,
          width: 6,
        }}
      />
      <span>In progress</span>
    </div>
  );
};

const ThreadPromptBubble: React.FC<{progress: number; prompt: string}> = ({progress, prompt}) => {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "flex-end",
        opacity: progress,
        transform: `translateY(${(1 - progress) * 14}px)`,
        width: "100%",
      }}
    >
      <div
        style={{
          background: "rgba(255, 255, 255, 0.04)",
          border: `1px solid ${TOKENS.border}`,
          borderRadius: 18,
          maxWidth: 760,
          padding: "14px 16px",
        }}
      >
        <p
          style={{
            color: TOKENS.foreground,
            fontFamily: FONTS.sans,
            fontSize: 18,
            fontWeight: 500,
            letterSpacing: "-0.03em",
            lineHeight: "25px",
            margin: 0,
          }}
        >
          {prompt}
        </p>
      </div>
    </div>
  );
};

const ThreadLoaderBubble: React.FC<{frame: number; progress: number}> = ({frame, progress}) => {
  return (
    <div
      style={{
        alignSelf: "flex-start",
        opacity: progress,
        transform: `translateY(${(1 - progress) * 12}px)`,
      }}
    >
      <div
        style={{
          background: "rgba(255, 255, 255, 0.02)",
          border: `1px solid ${TOKENS.border}`,
          borderRadius: 18,
          padding: "14px 16px",
        }}
      >
        <BorealizingLine frame={frame} labelSize={16} size={34} />
      </div>
    </div>
  );
};

const ThreadComposerCue: React.FC<{participants: StoryParticipant[]}> = ({participants}) => {
  const lead = participants[0]?.label ?? "Boreal Agent";
  const remainder = Math.max(0, participants.length - 1);

  return (
    <div
      style={{
        alignItems: "center",
        display: "inline-flex",
        gap: 10,
      }}
    >
      <StaticAvatarRow participants={participants.slice(0, 3)} />
      <span
        style={{
          color: TOKENS.mutedForeground,
          fontFamily: FONTS.sans,
          fontSize: 12,
          fontWeight: 500,
          lineHeight: "16px",
        }}
      >
        {remainder > 0 ? `${lead} +${remainder}` : lead}
      </span>
    </div>
  );
};

const ThreadComposer: React.FC<{participants: StoryParticipant[]}> = ({participants}) => {
  const lead = participants[0]?.label ?? "Boreal Agent";
  const remainder = Math.max(0, participants.length - 1);
  const placeholder =
    remainder > 0
      ? `Reply to ${lead} +${remainder}, coordinate on the request, or keep the team moving.`
      : `Reply to ${lead}, coordinate on the request, or keep the team moving.`;

  return (
    <div
      style={{
        background: TOKENS.input,
        border: `1px solid ${TOKENS.border}`,
        borderRadius: 20,
        overflow: "hidden",
        width: "100%",
      }}
    >
      <div
        style={{
          minHeight: 78,
          padding: "14px 16px 0",
        }}
      >
        <p
          style={{
            color: TOKENS.mutedForeground,
            fontFamily: FONTS.sans,
            fontSize: 15,
            lineHeight: "22px",
            margin: 0,
          }}
        >
          {placeholder}
        </p>
      </div>
      <div
        style={{
          alignItems: "center",
          display: "flex",
          justifyContent: "space-between",
          padding: "10px 12px 12px",
        }}
      >
        <ThreadComposerCue participants={participants} />
        <SubmitButton pressProgress={0} />
      </div>
    </div>
  );
};

export const RequestThreadScene: React.FC<{frame: number}> = ({frame}) => {
  const threadFrame = Math.max(0, frame - THREAD_SCENE_START);
  const shellProgress = interpolate(threadFrame, [0, THREAD_SHELL_FADE_DURATION], [0, 1], CLAMP);
  const requestProgress = interpolate(
    threadFrame,
    [THREAD_REQUEST_BUBBLE_START, THREAD_REQUEST_BUBBLE_START + THREAD_REQUEST_BUBBLE_DURATION],
    [0, 1],
    CLAMP,
  );
  const loaderProgress = interpolate(
    threadFrame,
    [THREAD_LOADER_START, THREAD_LOADER_START + THREAD_LOADER_DURATION],
    [0, 1],
    CLAMP,
  );
  const composerProgress = interpolate(threadFrame, [6, 6 + THREAD_COMPOSER_REVEAL_DURATION], [0, 1], CLAMP);

  return (
    <div
      style={{
        alignItems: "center",
        display: "flex",
        inset: 0,
        justifyContent: "center",
        opacity: shellProgress,
        position: "absolute",
        transform: `scale(${0.99 + shellProgress * 0.01})`,
      }}
    >
      <div
        style={{
          background: "rgba(255, 255, 255, 0.015)",
          border: `1px solid ${TOKENS.border}`,
          borderRadius: 22,
          display: "flex",
          flexDirection: "column",
          height: SCENE_HEIGHT,
          overflow: "hidden",
          width: INNER_WIDTH,
        }}
      >
        <div
          style={{
            alignItems: "center",
            borderBottom: `1px solid rgba(255, 255, 255, 0.06)`,
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            padding: "12px 14px",
          }}
        >
          <div
            style={{
              alignItems: "center",
              background: "rgba(255, 255, 255, 0.03)",
              border: `1px solid rgba(255, 255, 255, 0.06)`,
              borderRadius: 14,
              display: "inline-flex",
              gap: 4,
              padding: 4,
            }}
          >
            <ThreadTabTrigger active label="Chat" />
            <ThreadTabTrigger count={4} label="Activity" />
            <ThreadTabTrigger count={FOCUSED_REQUEST.participants.length} label="Team" />
            <ThreadTabTrigger count={1} label="Workboard" />
          </div>
          <ThreadStatusMeta />
        </div>

        <div
          style={{
            display: "flex",
            flex: "1 1 auto",
            flexDirection: "column",
            minHeight: 0,
          }}
        >
          <div
            style={{
              display: "flex",
              flex: "1 1 auto",
              flexDirection: "column",
              gap: 12,
              minHeight: 0,
              padding: "18px 20px 0",
            }}
          >
            <ThreadPromptBubble progress={requestProgress} prompt={FOCUSED_REQUEST.prompt} />
            <ThreadLoaderBubble frame={frame} progress={loaderProgress} />
          </div>

          <div
            style={{
              borderTop: `1px solid rgba(255, 255, 255, 0.06)`,
              opacity: composerProgress,
              padding: "16px 20px 18px",
              transform: `translateY(${(1 - composerProgress) * 10}px)`,
            }}
          >
            <ThreadComposer participants={FOCUSED_REQUEST.participants} />
          </div>
        </div>
      </div>
    </div>
  );
};

export const HomeChatMockup: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill
      style={{
        alignItems: "center",
        background: TOKENS.background,
        color: TOKENS.foreground,
        fontFamily: FONTS.sans,
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      <style>{fontFaceCss}</style>
      <div
        style={{
          ...centeredColumn,
          height: "100%",
          justifyContent: "center",
          transform: `scale(${SCALE})`,
          transformOrigin: "center center",
          width: OUTER_WIDTH,
        }}
      >
        <div
          style={{
            height: SCENE_HEIGHT,
            position: "relative",
            width: "100%",
          }}
        >
          <Sequence durationInFrames={CHAT_SEQUENCE_DURATION} from={0} name="Prompt burst scene">
            <div
              style={{
                inset: 0,
                position: "absolute",
              }}
            >
              <PromptBurstScene frame={frame} />
            </div>
          </Sequence>
          <Sequence durationInFrames={REQUEST_SEQUENCE_DURATION} from={REQUEST_SCENE_START} name="Request routing scene">
            <RequestRoutingScene frame={frame} />
          </Sequence>
          <Sequence durationInFrames={LOADING_SEQUENCE_DURATION} from={LOADING_START} name="Loader scene">
            <LoadingScene frame={frame} />
          </Sequence>
          <Sequence durationInFrames={THREAD_SEQUENCE_DURATION} from={THREAD_SCENE_START} name="Request thread scene">
            <RequestThreadScene frame={frame} />
          </Sequence>
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const BorealAccurateHomeChatCompositions: React.FC = () => {
  return (
    <Folder name="Boreal-Accurate-Home-Chat">
      <Composition
        component={HomeChatMockup}
        durationInFrames={HOME_CHAT_DURATION}
        fps={FPS}
        height={HEIGHT}
        id="BorealHomeChatMockup"
        width={WIDTH}
      />
    </Folder>
  );
};
