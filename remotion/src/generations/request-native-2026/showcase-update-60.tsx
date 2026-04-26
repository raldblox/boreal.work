import type { CSSProperties, ReactNode } from "react";
import React from "react";
import {
  AbsoluteFill,
  Series,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

import {
  AmbientBed,
  BodyText,
  MonoText,
  SectionCard,
  SharedCompositionProps,
  TitleText,
  TypewriterText,
  WordTypewriterText,
  mixHex,
  sceneFade,
  springIn,
  withAlpha,
} from "./shared";
import { COLORS, FONTS } from "./theme";

export const BOREAL_SHOWCASE_DURATION = 1800;
export const BOREAL_SHOWCASE_DEFAULT_AUDIO = "/music/candidates/vastness-mixkit-184.mp3";

const requestPrompt =
  "Need a 60-second launch update with script, voice, motion, and final render in 3 days.";

const REQUEST_TITLE = "60-second Boreal launch update";
const REQUEST_SUMMARY =
  "Script, voice, motion, and final delivery. Route the best mix of providers and collaborators.";
const SCENE_PADDING = "84px 84px";
const WORKSPACE_HEIGHT = 736;

const trackingSteps = ["Scope", "Approve", "Active", "Deliver"] as const;

const marketParticipants = [
  {
    kind: "provider",
    label: "Voice workflow",
    route: "Provider-backed",
    score: 96,
    quote: "$45 voice bid",
    tags: ["ready now", "preview ready", "1 day"],
  },
  {
    kind: "human",
    label: "Motion lead",
    route: "Open market",
    score: 91,
    quote: "$90 motion bid",
    tags: ["cut-ready", "proof attached", "2 days"],
  },
  {
    kind: "human",
    label: "Copy lead",
    route: "Open market",
    score: 86,
    quote: "$55 copy bid",
    tags: ["headline polish", "launch copy", "same day"],
  },
] as const;

const architectureEdges = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 4],
  [4, 5],
  [5, 6],
  [6, 1],
] as const;

const participantRoster = [
  { kind: "agent", label: "BA", name: "Boreal Agent", color: COLORS.primaryStrong },
  { kind: "provider", label: "VO", name: "Voice workflow", color: COLORS.cyan },
  { kind: "human", label: "MO", name: "Motion lead", color: COLORS.success },
  { kind: "human", label: "CP", name: "Copy lead", color: COLORS.primary },
] as const;

const workAssignments = [
  {
    label: "Boreal Agent",
    role: "Orchestration",
    detail: "Keeps the request live, routed, and moving.",
    color: COLORS.primaryStrong,
    progress: 0.9,
  },
  {
    label: "Voice workflow",
    role: "Voice",
    detail: "Generates narration and timing-ready audio.",
    color: COLORS.cyan,
    progress: 0.72,
  },
  {
    label: "Motion lead",
    role: "Motion",
    detail: "Builds the cut, preview, and final export.",
    color: COLORS.success,
    progress: 0.64,
  },
  {
    label: "Copy lead",
    role: "Copy",
    detail: "Sharpens the hook, structure, and launch copy.",
    color: COLORS.primary,
    progress: 0.82,
  },
] as const;

const architectureNodes = [
  { label: "Request intake", sublabel: "chat, search, APIs", x: 0.14, y: 0.22 },
  { label: "Request surface", sublabel: "chat UI, MCP, A2A", x: 0.31, y: 0.22 },
  { label: "Live request state", sublabel: "context, status, approvals", x: 0.48, y: 0.22 },
  { label: "Matching engine", sublabel: "ranked supply routes", x: 0.65, y: 0.22 },
  { label: "Supply network", sublabel: "humans, agents, providers", x: 0.82, y: 0.22 },
  { label: "Commerce spine", sublabel: "wallets, x402, ACP/UCP", x: 0.82, y: 0.49 },
  { label: "Work thread", sublabel: "proof, delivery", x: 0.82, y: 0.79 },
] as const;
const OFFER_SIGNAL = "#ff6b6b";

const stageStyle: CSSProperties = {
  alignItems: "center",
  display: "flex",
  justifyContent: "center",
};

const panelBorder = `1px solid ${withAlpha(COLORS.frost, 0.08)}`;

const BorealMark: React.FC<{
  size?: number;
}> = ({ size = 28 }) => (
  <svg
    aria-hidden
    height={size}
    viewBox="0 0 1029 1025"
    width={size}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M514.5 1023H1025.5L514.5 1V1023Z" fill="#071311" />
    <path d="M514.5 1024.5H5L514.5 1V1024.5Z" fill="#071311" />
    <path d="M381 486.5L701 374L382.5 266L381 486.5Z" fill="url(#boreal-watermark-paint0)" />
    <path d="M701 374V693L255 522L701 374Z" fill="url(#boreal-watermark-paint1)" />
    <path d="M255 522L879.5 730.5L255 979V522Z" fill="url(#boreal-watermark-paint2)" />
    <path d="M4.5 1024L879.5 730.5L881.5 1024H4.5Z" fill="url(#boreal-watermark-paint3)" />
    <defs>
      <linearGradient id="boreal-watermark-paint0" gradientUnits="userSpaceOnUse" x1="701" x2="381" y1="376" y2="376">
        <stop stopColor="#01FDFF" />
        <stop offset="1" stopColor="#62FFCE" />
      </linearGradient>
      <linearGradient id="boreal-watermark-paint1" gradientUnits="userSpaceOnUse" x1="255" x2="701" y1="519.5" y2="534">
        <stop stopColor="#22C1F3" />
        <stop offset="1" stopColor="#01FDFF" />
      </linearGradient>
      <linearGradient id="boreal-watermark-paint2" gradientUnits="userSpaceOnUse" x1="879" x2="255" y1="522" y2="522">
        <stop stopColor="#477BE0" />
        <stop offset="1" stopColor="#23C1F0" />
      </linearGradient>
      <linearGradient id="boreal-watermark-paint3" gradientUnits="userSpaceOnUse" x1="4" x2="881" y1="1024" y2="1024">
        <stop stopColor="#6537C6" />
        <stop offset="1" stopColor="#3D73CB" />
      </linearGradient>
    </defs>
  </svg>
);

const BorealWatermark: React.FC<{
  placement?: "bottom-right" | "top-center";
}> = ({ placement = "bottom-right" }) => {
  const isTop = placement === "top-center";

  return (
    <div
      style={{
        alignItems: "center",
        background: "transparent",
        display: "flex",
        gap: 10,
        left: isTop ? "50%" : undefined,
        padding: 0,
        position: "absolute",
        right: isTop ? undefined : 40,
        top: isTop ? 50 : undefined,
        bottom: isTop ? undefined : 50,
        transform: isTop ? "translateX(-50%)" : undefined,
        zIndex: 5,
        opacity: isTop ? 1 : 0.7,
      }}
    >
      <BorealMark size={isTop ? 44 : 28} />
    </div>
  );
};

const FilmStage: React.FC<{
  background?: string;
  children: ReactNode;
  watermarkPlacement?: "bottom-right" | "top-center" | "none";
}> = ({ background = COLORS.ink, children, watermarkPlacement = "bottom-right" }) => {
  const frame = useCurrentFrame();
  const drift = Math.sin(frame / 60) * 40;
  const driftTwo = Math.cos(frame / 80) * 35;

  return (
    <AbsoluteFill
      style={{
        background,
        color: COLORS.paper,
        fontFamily: FONTS.sans,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          background: `radial-gradient(circle at ${20 + drift / 12}% 18%, ${withAlpha(COLORS.primaryStrong, 0.14)}, transparent 30%), radial-gradient(circle at ${78 + driftTwo / 16}% 78%, ${withAlpha(COLORS.cyan, 0.12)}, transparent 28%)`,
          inset: -120,
          position: "absolute",
        }}
      />
      <div
        style={{
          border: `1px solid ${withAlpha(COLORS.primaryStrong, 0.08)}`,
          borderRadius: 32,
          inset: 18,
          position: "absolute",
        }}
      />
      <div
        style={{
          backgroundImage: `linear-gradient(${withAlpha(COLORS.frost, 0.025)} 1px, transparent 1px), linear-gradient(90deg, ${withAlpha(COLORS.frost, 0.025)} 1px, transparent 1px)`,
          backgroundPosition: `${drift / 6}px ${driftTwo / 6}px`,
          backgroundSize: "72px 72px",
          inset: 0,
          opacity: 0.18,
          position: "absolute",
        }}
      />
      {watermarkPlacement !== "none" ? <BorealWatermark placement={watermarkPlacement} /> : null}
      {children}
    </AbsoluteFill>
  );
};

const HeroLine: React.FC<{
  emphasis: number;
  opacity: number;
  text: string;
}> = ({ emphasis, opacity, text }) => {
  const accentColor = emphasis >= 0.6 ? COLORS.primary : withAlpha(COLORS.primary, 0.34);
  const highlightStyle: CSSProperties = {
    color: accentColor,
  };

  const renderText = () => {
    const segments = text.split(/(Boreal|work)/g);
    return segments.map((segment, index) =>
      segment === "Boreal" || segment === "work" ? (
        <span key={`${segment}-${index}`} style={highlightStyle}>
          {segment}
        </span>
      ) : (
        <React.Fragment key={`${segment}-${index}`}>{segment}</React.Fragment>
      ),
    );
  };

  return (
    <div
      style={{
        opacity,
      }}
    >
      <TitleText
        color={emphasis >= 0.6 ? COLORS.paper : withAlpha(COLORS.paper, 0.68)}
        size={70}
        weight={640}
      >
        {renderText()}
      </TitleText>
    </div>
  );
};

const HeaderRail: React.FC<{
  title: string;
}> = ({ title }) => {
  return (
    <div
      style={{
        alignItems: "center",
        display: "flex",
        justifyContent: "space-between",
        padding: "24px 30px",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <TitleText color={COLORS.paper} size={30} weight={620}>
          {title}
        </TitleText>
      </div>
      <div style={{ alignItems: "center", display: "flex", gap: 8 }}>
        {[COLORS.primaryStrong, COLORS.cyan, COLORS.success].map((color) => (
          <div
            key={color}
            style={{
              background: color,
              borderRadius: "50%",
              boxShadow: `0 0 22px ${withAlpha(color, 0.26)}`,
              height: 7,
              width: 7,
            }}
          />
        ))}
      </div>
    </div>
  );
};

const SidebarStack: React.FC<{
  phase?: "drafting" | "detected";
  highlight?: number;
}> = ({ phase = "drafting", highlight = 2 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const selectedReady = phase === "detected";
  return (
    <div
      style={{
        background: withAlpha(COLORS.surface, 0.92),
        border: panelBorder,
        borderRadius: 28,
        display: "flex",
        flexDirection: "column",
        gap: 14,
        height: WORKSPACE_HEIGHT,
        padding: 20,
        width: 270,
      }}
    >
      <div
        style={{
          alignItems: "center",
          display: "flex",
          marginBottom: 8,
          paddingLeft: 16,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          <BodyText color={COLORS.paper} size={17}>
            Requests
          </BodyText>
        </div>
      </div>
      {[0, 1, 2].map((index) => {
        const active = index === highlight;
        const isDetected = index === 2 && selectedReady;
        const cardReveal =
          index < 2
            ? 1
            : interpolate(frame, [236, 264], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });
        return (
          <div
            key={index}
            style={{
              background: active
                ? mixHex(withAlpha(COLORS.surfaceRaised, 0.98), withAlpha(COLORS.primarySoft, 0.18), 0.32)
                : withAlpha(COLORS.surfaceRaised, 0.9),
              border: `1px solid ${active ? withAlpha(COLORS.primaryStrong, 0.24) : withAlpha(COLORS.frost, 0.08)
                }`,
              borderRadius: 22,
              boxShadow: active
                ? `0 16px 34px ${withAlpha(COLORS.ink, 0.26)}`
                : `0 10px 24px ${withAlpha(COLORS.ink, 0.18)}`,
              minHeight: 114,
              opacity: cardReveal,
              overflow: "hidden",
              padding: 16,
              position: "relative",
              transform: `scale(${index < 2 ? 1 : interpolate(cardReveal, [0, 1], [0.96, 1])})`,
            }}
          >
            <BodyText color={COLORS.paper} size={17}>
              {index === 0
                ? "Verify a supplier with onsite photos, customs docs, and pricing checks"
                : index === 1
                  ? "Ship a launch update with script, voice, motion, and export-ready assets"
                  : REQUEST_TITLE}
            </BodyText>
            <MonoText color={active ? COLORS.mist : COLORS.quiet} size={10} style={{ marginTop: 10 }}>
              {index < 2 ? "Open" : selectedReady ? "Live" : "Parsing"}
            </MonoText>
            <div style={{ alignItems: "center", display: "flex", gap: 8, marginTop: 16 }}>
              {(index === 2 && selectedReady ? participantRoster : []).map((participant, avatarIndex) => {
                const pop = spring({
                  fps,
                  frame: frame - (256 + avatarIndex * 10),
                  config: {
                    damping: 10,
                    stiffness: 180,
                  },
                });
                return (
                  <div
                    key={participant.label}
                    style={{
                      background: participant.color,
                      borderRadius: "50%",
                      boxShadow: `0 0 18px ${withAlpha(participant.color, 0.26)}`,
                      height: 14,
                      transform: `scale(${interpolate(pop, [0, 1], [0.45, 0.72])})`,
                      width: 14,
                    }}
                  />
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const RequestCard: React.FC<{
  bottomContent?: ReactNode;
  progress: number;
  style?: CSSProperties;
}> = ({ bottomContent, progress, style }) => {
  const currentStep = Math.max(0, Math.min(trackingSteps.length - 1, Math.floor(progress * 3.4)));
  const stageLabel =
    currentStep === 0 ? "scoping" : currentStep === 1 ? "routing" : currentStep === 2 ? "active" : "done";

  return (
    <SectionCard
      style={{
        background: withAlpha(COLORS.surfaceRaised, 0.96),
        borderRadius: 30,
        display: "flex",
        flexDirection: "column",
        gap: 24,
        height: 620,
        padding: 28,
        ...style,
      }}
    >
      <div style={{ alignItems: "flex-start", display: "flex", justifyContent: "space-between" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, maxWidth: 620 }}>
          <TitleText color={COLORS.paper} size={36} weight={620}>
            {REQUEST_TITLE}
          </TitleText>
          <BodyText color={COLORS.mist} size={18}>
            {REQUEST_SUMMARY}
          </BodyText>
        </div>
        <div
          style={{
            background: withAlpha(COLORS.primaryStrong, 0.12),
            border: `1px solid ${withAlpha(COLORS.primaryStrong, 0.24)}`,
            borderRadius: 999,
            padding: "11px 14px",
          }}
        >
          <MonoText color={COLORS.primary} size={11} uppercase>
            {stageLabel}
          </MonoText>
        </div>
      </div>

      <div
        style={{
          background: withAlpha(COLORS.primarySoft, 0.5),
          border: `1px solid ${withAlpha(COLORS.primaryStrong, 0.16)}`,
          borderRadius: 24,
          padding: 20,
        }}
      >
        <ProgressStepper activeIndex={currentStep} />
      </div>
      <div style={{ display: "flex", flex: 1, marginTop: 4 }}>
        {bottomContent ? bottomContent : <div style={{ flex: 1 }} />}
      </div>
    </SectionCard>
  );
};

const ProgressRail: React.FC<{
  activeIndex: number;
  progress: number;
}> = ({ activeIndex }) => {
  return (
    <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(4, 1fr)" }}>
      {trackingSteps.map((step, index) => {
        const done = index <= activeIndex;
        const isActive = index === activeIndex;
        return (
          <div
            key={step}
            style={{
              background: withAlpha(COLORS.ink, 0.22),
              border: `1px solid ${done ? withAlpha(COLORS.primaryStrong, 0.16) : withAlpha(COLORS.frost, 0.06)}`,
              borderRadius: 18,
              display: "flex",
              flexDirection: "column",
              gap: 12,
              minHeight: 106,
              padding: "16px 14px 14px",
            }}
          >
            <div
              style={{
                alignItems: "center",
                display: "flex",
                gap: 10,
              }}
            >
              <div
                style={{
                  ...stageStyle,
                  background: done ? COLORS.primaryStrong : withAlpha(COLORS.frost, 0.06),
                  border: `2px solid ${done ? COLORS.primaryStrong : withAlpha(COLORS.frost, 0.14)}`,
                  borderRadius: "50%",
                  boxShadow: done ? `inset 0 0 0 6px ${COLORS.ink}` : "none",
                  fontSize: 0,
                  height: 20,
                  width: 20,
                }}
              >
                •
              </div>
              <MonoText color={done ? COLORS.paper : COLORS.quiet} size={11} uppercase>
                {step}
              </MonoText>
            </div>
            <BodyText color={isActive ? COLORS.paper : COLORS.mist} size={15}>
              {index === 0
                ? "Lock scope"
                : index === 1
                  ? "Approve route"
                  : index === 2
                    ? "Run work"
                    : "Return proof"}
            </BodyText>
          </div>
        );
      })}
    </div>
  );
};

const ProgressStepper: React.FC<{
  activeIndex: number;
}> = ({ activeIndex }) => {
  return (
    <div
      style={{
        display: "grid",
        gap: 16,
        gridTemplateColumns: "repeat(4, 1fr)",
      }}
    >
      {trackingSteps.map((step, index) => {
        const done = index <= activeIndex;
        const isActive = index === activeIndex;

        return (
          <div
            key={step}
            style={{
              background: withAlpha(COLORS.ink, 0.22),
              border: `1px solid ${done ? withAlpha(COLORS.primaryStrong, 0.16) : withAlpha(COLORS.frost, 0.06)}`,
              borderRadius: 18,
              display: "flex",
              flexDirection: "column",
              gap: 12,
              justifyContent: "space-between",
              minHeight: 112,
              padding: "16px 14px 14px",
            }}
          >
            <div
              style={{
                alignItems: "center",
                display: "flex",
                gap: 10,
              }}
            >
              <div
                style={{
                  ...stageStyle,
                  background: done ? COLORS.primaryStrong : withAlpha(COLORS.frost, 0.06),
                  border: `2px solid ${done ? COLORS.primaryStrong : withAlpha(COLORS.frost, 0.14)}`,
                  borderRadius: "50%",
                  boxShadow: done ? `inset 0 0 0 6px ${COLORS.ink}` : "none",
                  fontSize: 0,
                  height: 20,
                  width: 20,
                }}
              />
              <MonoText color={done ? COLORS.paper : COLORS.quiet} size={11} uppercase>
                {step}
              </MonoText>
            </div>
            <BodyText color={isActive ? COLORS.paper : COLORS.mist} size={15}>
              {index === 0
                ? "Lock scope"
                : index === 1
                  ? "Approve route"
                  : index === 2
                    ? "Run work"
                    : "Return proof"}
            </BodyText>
          </div>
        );
      })}
    </div>
  );
};

const CompactTrackingRail: React.FC<{
  activeIndex: number;
}> = ({ activeIndex }) => {
  return (
    <div
      style={{
        alignItems: "center",
        display: "flex",
        gap: 0,
      }}
    >
      {trackingSteps.map((step, index) => {
        const done = index <= activeIndex;
        const current = index === activeIndex;
        const last = index === trackingSteps.length - 1;
        return (
          <React.Fragment key={step}>
            <div
              style={{
                ...stageStyle,
                background: done ? withAlpha(COLORS.primaryStrong, 0.06) : COLORS.surfaceRaised,
                border: `1px solid ${done ? withAlpha(COLORS.primaryStrong, 0.42) : withAlpha(COLORS.frost, 0.16)}`,
                borderRadius: "50%",
                boxShadow: current ? `0 0 0 4px ${withAlpha(COLORS.primaryStrong, 0.14)}` : "none",
                height: 22,
                position: "relative",
                width: 22,
              }}
            >
              <div
                style={{
                  background: done ? COLORS.primaryStrong : withAlpha(COLORS.frost, 0.14),
                  borderRadius: "50%",
                  height: 8,
                  width: 8,
                }}
              />
            </div>
            {!last ? (
              <div
                style={{
                  background: done ? withAlpha(COLORS.primaryStrong, 0.75) : withAlpha(COLORS.frost, 0.12),
                  height: 2,
                  width: 20,
                }}
              />
            ) : null}
          </React.Fragment>
        );
      })}
    </div>
  );
};

const AssignedParticipantsRow: React.FC = () => {
  return (
    <div
      style={{
        alignItems: "center",
        display: "flex",
        flexWrap: "wrap",
        gap: 10,
      }}
    >
      <MonoText color={COLORS.quiet} size={10} uppercase>
        Assigned to
      </MonoText>
      {participantRoster.map((participant) => (
        <div
          key={participant.name}
          style={{
            alignItems: "center",
            background: withAlpha(participant.color, 0.1),
            border: `1px solid ${withAlpha(participant.color, 0.18)}`,
            borderRadius: 999,
            display: "flex",
            gap: 8,
            padding: "6px 10px 6px 6px",
          }}
        >
          <div
            style={{
              ...stageStyle,
              background: withAlpha(participant.color, 0.18),
              border: `1px solid ${withAlpha(participant.color, 0.28)}`,
              borderRadius: "50%",
              boxShadow: `0 0 14px ${withAlpha(participant.color, 0.16)}`,
              color: COLORS.paper,
              fontFamily: FONTS.mono,
              fontSize: 9,
              height: 22,
              width: 22,
            }}
          >
            {participant.label}
          </div>
          <MonoText color={COLORS.paper} size={9}>
            {participant.name}
          </MonoText>
        </div>
      ))}
    </div>
  );
};

const MatchingBoard: React.FC = () => {
  const frame = useCurrentFrame();
  const seeMoreReveal = interpolate(frame, [136, 160], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        display: "grid",
        gap: 24,
        gridTemplateColumns: "0.98fr 1.02fr",
        minHeight: 736,
        opacity: interpolate(frame, [30, 54], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        }),
        width: "100%",
      }}
    >
      <RequestCard progress={0.34} style={{ height: 560 }} />
      <SectionCard
        style={{
          background: withAlpha(COLORS.surfaceRaised, 0.96),
          borderRadius: 30,
          display: "flex",
          flexDirection: "column",
          gap: 18,
          height: 760,
          padding: 28,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <TitleText color={COLORS.paper} size={34} weight={620}>
            Waiting for approval
          </TitleText>
          <BodyText color={COLORS.mist} size={18}>
            Joined participants are ready. Approve what fits, invite more supply, or keep the market open.
          </BodyText>
        </div>
        <div style={{ display: "grid", gap: 14 }}>
          {marketParticipants.map((candidate, index) => {
            const reveal = interpolate(frame, [60 + index * 18, 86 + index * 18], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });
            const highlight = index === 0;
            return (
              <div
                key={candidate.label}
                style={{
                  background: highlight ? withAlpha(COLORS.primaryStrong, 0.1) : withAlpha(COLORS.frost, 0.03),
                  border: `1px solid ${highlight ? withAlpha(COLORS.primaryStrong, 0.24) : withAlpha(COLORS.frost, 0.08)
                    }`,
                  borderRadius: 24,
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                  minHeight: 152,
                  opacity: reveal,
                  padding: 16,
                  transform: `translateX(${interpolate(reveal, [0, 1], [18, 0])}px)`,
                }}
              >
                <div style={{ alignItems: "center", display: "flex", justifyContent: "space-between" }}>
                  <div style={{ alignItems: "center", display: "flex", flex: 1, gap: 12, minWidth: 0, paddingRight: 12 }}>
                    <div
                      style={{
                        ...stageStyle,
                        background:
                          candidate.kind === "provider"
                            ? withAlpha(COLORS.cyan, 0.16)
                            : withAlpha(COLORS.success, 0.16),
                        border: `1px solid ${candidate.kind === "provider"
                          ? withAlpha(COLORS.cyan, 0.28)
                          : withAlpha(COLORS.success, 0.28)
                          }`,
                        borderRadius: "50%",
                        color:
                          candidate.kind === "provider"
                            ? COLORS.cyan
                            : COLORS.success,
                        fontFamily: FONTS.mono,
                        fontSize: 11,
                        height: 40,
                        width: 40,
                      }}
                    >
                      {candidate.label
                        .split(" ")
                        .slice(0, 2)
                        .map((chunk) => chunk[0])
                        .join("")}
                    </div>
                    <div style={{ display: "flex", flex: 1, flexDirection: "column", gap: 6, minWidth: 0 }}>
                      <BodyText color={COLORS.paper} size={18}>
                        {candidate.label}
                      </BodyText>
                      <MonoText color={COLORS.mist} size={10} uppercase>
                        {candidate.route}
                      </MonoText>
                    </div>
                  </div>
                  <div style={{ alignItems: "center", display: "flex", flexShrink: 0, flexWrap: "wrap", gap: 10, justifyContent: "flex-end" }}>
                    <div
                      style={{
                        ...stageStyle,
                        background: withAlpha(COLORS.frost, 0.04),
                        border: panelBorder,
                        borderRadius: 999,
                        color: COLORS.paper,
                        fontFamily: FONTS.mono,
                        fontSize: 11,
                        height: 42,
                        padding: "0 14px",
                      }}
                    >
                      {candidate.quote}
                    </div>
                    <div
                      style={{
                        ...stageStyle,
                        background: highlight ? withAlpha(COLORS.success, 0.14) : withAlpha(COLORS.frost, 0.04),
                        border: `1px solid ${highlight ? withAlpha(COLORS.success, 0.26) : withAlpha(COLORS.frost, 0.08)
                          }`,
                        borderRadius: 999,
                        color: highlight ? COLORS.success : COLORS.paper,
                        fontFamily: FONTS.mono,
                        fontSize: 11,
                        height: 42,
                        padding: "0 14px",
                      }}
                    >
                      {candidate.score}% fit
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {candidate.tags.map((tag) => (
                    <div
                      key={tag}
                      style={{
                        background: withAlpha(COLORS.frost, 0.04),
                        border: `1px solid ${withAlpha(COLORS.frost, 0.08)}`,
                        borderRadius: 999,
                        padding: "7px 9px",
                      }}
                    >
                      <MonoText color={COLORS.mist} size={9}>
                        {tag}
                      </MonoText>
                    </div>
                  ))}
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <div
                    style={{
                      background: highlight ? withAlpha(COLORS.success, 0.16) : withAlpha(COLORS.primaryStrong, 0.14),
                      border: `1px solid ${highlight ? withAlpha(COLORS.success, 0.28) : withAlpha(COLORS.primaryStrong, 0.24)
                        }`,
                      borderRadius: 999,
                      padding: "11px 14px",
                    }}
                  >
                    <MonoText color={highlight ? COLORS.success : COLORS.primary} size={10} uppercase>
                      Approve
                    </MonoText>
                  </div>
                  <div
                    style={{
                      background: withAlpha("#ff8a8a", 0.12),
                      border: `1px solid ${withAlpha("#ff8a8a", 0.24)}`,
                      borderRadius: 999,
                      padding: "11px 14px",
                    }}
                  >
                    <MonoText color="#ff9f9f" size={10} uppercase>
                      Pass
                    </MonoText>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            opacity: seeMoreReveal,
            paddingTop: 2,
            transform: `translateY(${interpolate(seeMoreReveal, [0, 1], [10, 0])}px)`,
          }}
        >
          <div
            style={{
              background: withAlpha(COLORS.frost, 0.04),
              border: panelBorder,
              borderRadius: 999,
              padding: "11px 14px",
            }}
          >
            <MonoText color={COLORS.mist} size={10} uppercase>
              See more participants
            </MonoText>
          </div>
        </div>
      </SectionCard>
    </div>
  );
};

const CollaborationWorkspace: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <div style={{ display: "grid", gap: 22, gridTemplateColumns: "0.8fr 1.2fr", minHeight: 690 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <SectionCard
          style={{
            background: withAlpha(COLORS.surfaceRaised, 0.96),
            borderRadius: 26,
            minHeight: 230,
            padding: 20,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ alignItems: "center", display: "flex", gap: 8, flexWrap: "wrap" }}>
              <MonoText color={COLORS.quiet} size={10} uppercase>
                active
              </MonoText>
              <div
                style={{
                  background: withAlpha(COLORS.frost, 0.14),
                  borderRadius: "50%",
                  height: 4,
                  width: 4,
                }}
              />
              <MonoText color={COLORS.quiet} size={10}>
                4 participants
              </MonoText>
            </div>
            <TitleText color={COLORS.paper} size={28} weight={620}>
              {REQUEST_TITLE}
            </TitleText>
            <BodyText color={COLORS.mist} size={17}>
              {REQUEST_SUMMARY}
            </BodyText>
            <div style={{ alignItems: "center", display: "flex", gap: 8, marginTop: 8 }}>
              {participantRoster.map((participant, index) => {
                const pop = spring({
                  fps,
                  frame: frame - (24 + index * 12),
                  config: {
                    damping: 10,
                    stiffness: 180,
                  },
                });
                return (
                  <div
                    key={participant.label}
                    style={{
                      ...stageStyle,
                      background: withAlpha(participant.color, 0.14),
                      border: `1px solid ${withAlpha(participant.color, 0.3)}`,
                      borderRadius: "50%",
                      color: COLORS.paper,
                      fontFamily: FONTS.mono,
                      fontSize: 10,
                      height: 30,
                      transform: `scale(${interpolate(pop, [0, 1], [0.25, 1])})`,
                      width: 30,
                    }}
                  >
                    {participant.label}
                  </div>
                );
              })}
            </div>
          </div>
        </SectionCard>
      </div>

      <SectionCard
        style={{
          background: withAlpha(COLORS.surfaceRaised, 0.94),
          borderRadius: 26,
          display: "grid",
          alignContent: "start",
          gap: 14,
          padding: 18,
        }}
      >
        {workAssignments.map((assignment, index) => {
          const reveal = interpolate(frame, [22 + index * 16, 56 + index * 16], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          const progressFill = interpolate(frame, [72 + index * 18, 198 + index * 18], [0, assignment.progress], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          const statusLabel =
            index === 0 ? "routing" : index === 1 ? "voicing" : index === 2 ? "animating" : "polishing";

          return (
            <SectionCard
              key={assignment.label}
              style={{
                background: withAlpha(COLORS.surface, 0.72),
                borderRadius: 24,
                opacity: reveal,
                padding: 18,
                transform: `scale(${interpolate(reveal, [0, 1], [0.96, 1])})`,
                transformOrigin: "center top",
              }}
            >
              <div style={{ alignItems: "center", display: "flex", justifyContent: "space-between", gap: 14 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <BodyText color={COLORS.paper} size={20}>
                    {assignment.label}
                  </BodyText>
                  <MonoText color={COLORS.mist} size={10} uppercase>
                    {assignment.role}
                  </MonoText>
                </div>
                <div style={{ alignItems: "center", display: "flex", gap: 8 }}>
                  <div
                    style={{
                      background: assignment.color,
                      borderRadius: "50%",
                      boxShadow: `0 0 18px ${withAlpha(assignment.color, 0.25)}`,
                      height: 10,
                      width: 10,
                    }}
                  />
                  <MonoText color={assignment.color} size={10} uppercase>
                    {statusLabel}
                  </MonoText>
                </div>
              </div>
              <BodyText color={COLORS.mist} size={16} style={{ marginTop: 10 }}>
                {assignment.detail}
              </BodyText>
              <div
                style={{
                  background: withAlpha(COLORS.frost, 0.08),
                  border: `1px solid ${withAlpha(assignment.color, 0.12)}`,
                  borderRadius: 999,
                  height: 8,
                  marginTop: 14,
                  overflow: "hidden",
                  position: "relative",
                }}
              >
                <div
                  style={{
                    background: `linear-gradient(90deg, ${withAlpha(assignment.color, 0.78)}, ${assignment.color})`,
                    borderRadius: 999,
                    boxShadow: `0 0 18px ${withAlpha(assignment.color, 0.22)}`,
                    height: "100%",
                    width: `${Math.max(0, Math.min(100, progressFill * 100))}%`,
                  }}
                />
              </div>
            </SectionCard>
          );
        })}
      </SectionCard>
    </div>
  );
};

const ConversationThread: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const shimmer = 0.4 + ((Math.sin(frame / 10) + 1) / 2) * 0.6;
  const deliveredReveal = spring({
    fps,
    frame: frame - 26,
    config: {
      damping: 14,
      stiffness: 170,
    },
  });
  const reviewReveal = spring({
    fps,
    frame: frame - 88,
    config: {
      damping: 14,
      stiffness: 170,
    },
  });

  return (
    <SectionCard
      style={{
        background: withAlpha(COLORS.surfaceRaised, 0.96),
        borderRadius: 30,
        display: "flex",
        flexDirection: "column",
        minHeight: 700,
        overflow: "hidden",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", padding: "22px 26px", borderBottom: panelBorder }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div
              style={{
                ...stageStyle,
                border: panelBorder,
                borderRadius: 18,
                height: 52,
                width: 52,
              }}
            >
              <MonoText color={COLORS.paper} size={14}>
                ←
              </MonoText>
            </div>
            <TitleText color={COLORS.paper} size={28} weight={620}>
              {REQUEST_TITLE}
            </TitleText>
          </div>
          <AssignedParticipantsRow />
        </div>
        <div
          style={{
            ...stageStyle,
            border: panelBorder,
            borderRadius: 14,
            height: 34,
            width: 34,
          }}
        >
          <MonoText color={COLORS.quiet} size={10}>
            []
          </MonoText>
        </div>
      </div>

      <div
        style={{
          alignItems: "center",
          borderBottom: panelBorder,
          display: "flex",
          justifyContent: "space-between",
          padding: "16px 26px 14px",
        }}
      >
        <div
          style={{
            alignItems: "center",
            display: "flex",
            gap: 12,
          }}
        >
          {[
            { label: "Chat", active: true },
            { label: "Activity", badge: "10+" },
            { label: "Participants", badge: "4" },
            { label: "Workspace" },
          ].map((tab) => (
            <div
              key={tab.label}
              style={{
                alignItems: "center",
                background: tab.active ? withAlpha(COLORS.paper, 0.08) : "transparent",
                border: `1px solid ${tab.active ? withAlpha(COLORS.paper, 0.16) : "transparent"}`,
                borderRadius: 999,
                display: "flex",
                gap: 8,
                padding: "10px 14px",
              }}
            >
              <BodyText color={tab.active ? COLORS.paper : COLORS.mist} size={16}>
                {tab.label}
              </BodyText>
              {tab.badge ? (
                <div
                  style={{
                    ...stageStyle,
                    background: withAlpha(COLORS.primaryStrong, 0.16),
                    border: `1px solid ${withAlpha(COLORS.primaryStrong, 0.22)}`,
                    borderRadius: 999,
                    height: 24,
                    minWidth: 24,
                    padding: "0 8px",
                  }}
                >
                  <MonoText color={COLORS.primary} size={9}>
                    {tab.badge}
                  </MonoText>
                </div>
              ) : null}
            </div>
          ))}
        </div>
        <CompactTrackingRail activeIndex={3} />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 18, padding: "10px 26px 26px" }}>
        <div
          style={{
            alignSelf: "flex-end",
            background: withAlpha(COLORS.frost, 0.12),
            borderRadius: 24,
            maxWidth: 1120,
            padding: "18px 22px",
          }}
        >
          <BodyText color={COLORS.paper} size={20}>
            {requestPrompt}
          </BodyText>
        </div>

        <div
          style={{
            alignSelf: "flex-start",
            background: withAlpha(COLORS.success, 0.08),
            border: `1px solid ${withAlpha(COLORS.success, 0.22)}`,
            borderRadius: 26,
            display: "flex",
            flexDirection: "column",
            gap: 18,
            maxWidth: "80%",
            opacity: interpolate(deliveredReveal, [0, 1], [0, 1]),
            padding: 22,
            transform: `translateY(${interpolate(deliveredReveal, [0, 1], [22, 0])}px)`,
          }}
        >
          <div style={{ alignItems: "center", display: "flex", justifyContent: "space-between" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <MonoText color={COLORS.success} size={10} uppercase>
                Delivered work
              </MonoText>
              <BodyText color={COLORS.paper} size={26}>
                boreal-showcase-60-v1.mp4
              </BodyText>
            </div>
          </div>

          <BodyText color={COLORS.mist} size={17}>
            Files, proof, and preview land in the same thread.
          </BodyText>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {["showcase-60.mp4", "voiceover.wav", "shot-plan.md"].map((file, index) => (
              <div
                key={file}
                style={{
                  alignItems: "center",
                  background: withAlpha(COLORS.frost, 0.04),
                  border: panelBorder,
                  borderRadius: 999,
                  display: "flex",
                  gap: 10,
                  padding: "11px 14px",
                  transform: `translateY(${Math.sin(frame / 16 + index) * 1.5}px)`,
                }}
              >
                <div
                  style={{
                    background: index === 0 ? COLORS.success : index === 1 ? COLORS.primaryStrong : COLORS.cyan,
                    borderRadius: "50%",
                    height: 9,
                    width: 9,
                  }}
                />
                <MonoText color={COLORS.paper} size={10}>
                  {file}
                </MonoText>
              </div>
            ))}
          </div>

          <div
            style={{
              background: withAlpha(COLORS.ink, 0.32),
              border: panelBorder,
              borderRadius: 22,
              minHeight: 110,
              overflow: "hidden",
              padding: 16,
              position: "relative",
            }}
          >
            <div
              style={{
                background: `linear-gradient(90deg, transparent, ${withAlpha(COLORS.primaryStrong, 0.18)}, transparent)`,
                inset: 0,
                opacity: shimmer,
                position: "absolute",
                transform: `translateX(${Math.sin(frame / 18) * 16}px)`,
              }}
            />
            <MonoText color={COLORS.quiet} size={10} uppercase>
              preview
            </MonoText>
            <div
              style={{
                alignItems: "center",
                display: "flex",
                height: "100%",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  ...stageStyle,
                  background: withAlpha(COLORS.primaryStrong, 0.2),
                  border: `1px solid ${withAlpha(COLORS.primaryStrong, 0.3)}`,
                  borderRadius: "50%",
                  boxShadow: `0 0 18px ${withAlpha(COLORS.primaryStrong, 0.22)}`,
                  height: 52,
                  position: "relative",
                  width: 52,
                }}
              >
                <div
                  style={{
                    borderBottom: "8px solid transparent",
                    borderLeft: `12px solid ${COLORS.paper}`,
                    borderTop: "8px solid transparent",
                    height: 0,
                    marginLeft: 4,
                    width: 0,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        <div
          style={{
            alignSelf: "flex-end",
            background: withAlpha(COLORS.primaryStrong, 0.12),
            border: `1px solid ${withAlpha(COLORS.primaryStrong, 0.24)}`,
            borderRadius: 24,
            display: "none",
            maxWidth: 540,
            padding: "16px 20px",
          }}
        >
          <BodyText color={COLORS.paper} size={18}>
            ★★★★★ Delivered exactly what I needed.
          </BodyText>
        </div>

        <div
          style={{
            alignSelf: "flex-end",
            background: withAlpha(COLORS.primaryStrong, 0.12),
            border: `1px solid ${withAlpha(COLORS.primaryStrong, 0.24)}`,
            borderRadius: 24,
            display: "flex",
            flexDirection: "column",
            gap: 12,
            maxWidth: 560,
            opacity: interpolate(reviewReveal, [0, 1], [0, 1]),
            padding: "16px 20px",
            transform: `translateY(${interpolate(reviewReveal, [0, 1], [18, 0])}px)`,
          }}
        >
          <div style={{ display: "flex", gap: 6 }}>
            {Array.from({ length: 5 }).map((_, index) => (
              <div
                key={`review-star-${index}`}
                style={{
                  color: COLORS.primaryStrong,
                  fontFamily: FONTS.sans,
                  fontSize: 20,
                  lineHeight: 1,
                  textShadow: `0 0 12px ${withAlpha(COLORS.primaryStrong, 0.28)}`,
                }}
              >
                ★
              </div>
            ))}
          </div>
          <BodyText color={COLORS.paper} size={18}>
            Exactly what we needed.
          </BodyText>
        </div>
      </div>
    </SectionCard>
  );
};

const ArchitectureDiagram: React.FC = () => {
  const frame = useCurrentFrame();
  const reveal = springIn(frame, useVideoConfig().fps, 44, 100, 18);

  return (
    <SectionCard
      style={{
        background: withAlpha(COLORS.surfaceRaised, 0.96),
        borderRadius: 34,
        display: "flex",
        flexDirection: "column",
        gap: 18,
        minHeight: 740,
        opacity: interpolate(reveal, [0, 1], [0, 1]),
        padding: 30,
      }}
    >
      <div style={{ alignItems: "flex-start", display: "flex", justifyContent: "space-between" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <TitleText color={COLORS.paper} size={34} weight={620}>
            Live demand. Swarming supply.
          </TitleText>
        </div>
        <BodyText color={COLORS.mist} size={18} width={420}>
          Providers, developers, and freelancers can plug supply into live demand.
        </BodyText>
      </div>
      <div
        style={{
          background: COLORS.surface,
          border: panelBorder,
          borderRadius: 28,
          flex: 1,
          minHeight: 600,
          position: "relative",
        }}
      >
        {(() => {
          const chatNode = architectureNodes[1];
          const workNode = architectureNodes[6];
          return (
            <div
              style={{
                left: `${chatNode.x * 100}%`,
                position: "absolute",
                top: `${workNode.y * 100}%`,
                transform: `translate(-50%, -50%) translateY(${Math.sin(frame / 22) * 3}px)`,
                zIndex: 3,
              }}
            >
              <div
                style={{
                  alignItems: "center",
                  background: withAlpha(COLORS.surfaceRaised, 0.98),
                  border: `1px solid ${withAlpha(COLORS.primaryStrong, 0.22)}`,
                  borderRadius: 999,
                  boxShadow: `0 14px 30px ${withAlpha(COLORS.ink, 0.3)}`,
                  display: "flex",
                  gap: 10,
                  padding: "12px 16px 12px 12px",
                }}
              >
                <div
                  style={{
                    background: withAlpha(COLORS.primaryStrong, 0.18),
                    border: `1px solid ${withAlpha(COLORS.primaryStrong, 0.28)}`,
                    borderRadius: "50%",
                    boxShadow: `0 0 16px ${withAlpha(COLORS.primaryStrong, 0.22)}`,
                    height: 22,
                    width: 22,
                  }}
                />
                <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                  <MonoText color={COLORS.primary} size={9} uppercase>
                    Boreal Agent
                  </MonoText>
                  <MonoText color={COLORS.mist} size={9}>
                    orchestrate, route, fulfill
                  </MonoText>
                </div>
              </div>
            </div>
          );
        })()}
        {architectureNodes.map((node, index) => {
          const x = `${node.x * 100}%`;
          const y = `${node.y * 100}%`;
          const swarmNode = node.label === "Supply network";
          const chatNode = node.label === "Request surface";
          const workNode = node.label === "Work thread";
          return (
            <div
              key={node.label}
              style={{
                left: x,
                position: "absolute",
                top: y,
                zIndex: 2,
                transform: `translate(-50%, -50%) translateY(${Math.sin(frame / 24 + index) * 4}px)`,
              }}
            >
              <div
                style={{
                  background: withAlpha(COLORS.surfaceRaised, 0.94),
                  border: `1px solid ${withAlpha(COLORS.primaryStrong, 0.14)}`,
                  borderRadius: 24,
                  boxShadow: `0 18px 44px ${withAlpha(COLORS.ink, 0.34)}`,
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                  minWidth: swarmNode ? 236 : 212,
                  maxWidth: swarmNode ? 248 : 224,
                  padding: "18px 18px 16px",
                }}
              >
                <BodyText color={COLORS.paper} size={18}>
                  {node.label}
                </BodyText>
                <MonoText color={COLORS.mist} size={10}>
                  {node.sublabel}
                </MonoText>
                {swarmNode ? (
                  <div style={{ display: "grid", gap: 6, marginTop: 4 }}>
                    {[
                      [COLORS.success, COLORS.success, COLORS.success, COLORS.success, COLORS.success, COLORS.success, COLORS.success, COLORS.success, COLORS.success],
                      [COLORS.success, COLORS.success, COLORS.success, COLORS.success, COLORS.success, COLORS.success, OFFER_SIGNAL, OFFER_SIGNAL, OFFER_SIGNAL],
                      [OFFER_SIGNAL, OFFER_SIGNAL, OFFER_SIGNAL, OFFER_SIGNAL, OFFER_SIGNAL, OFFER_SIGNAL, OFFER_SIGNAL, OFFER_SIGNAL, OFFER_SIGNAL],
                    ].map((row, rowIndex) => (
                      <div
                        key={`${node.label}-row-${rowIndex}`}
                        style={{ display: "flex", justifyContent: "space-between", width: "100%" }}
                      >
                        {row.map((color, swarmIndex) => {
                          const pulsePhase = rowIndex * 1.2 + swarmIndex * 1.8;
                          const swarmPulse = (Math.sin(frame / 12 + pulsePhase) + 1) / 2;
                          const active = swarmPulse > 0.28;
                          return (
                            <div
                              key={`${node.label}-${rowIndex}-${swarmIndex}`}
                              style={{
                                background: active
                                  ? withAlpha(color, 0.34 + swarmPulse * 0.2)
                                  : withAlpha(color, 0.12),
                                border: `1px solid ${active ? withAlpha(color, 0.4) : withAlpha(color, 0.18)}`,
                                borderRadius: "50%",
                                boxShadow: active ? `0 0 16px ${withAlpha(color, 0.24 + swarmPulse * 0.1)}` : "none",
                                height: 10,
                                opacity: active ? 1 : 0.6,
                                transform: `scale(${active ? 0.82 + swarmPulse * 0.3 : 0.68})`,
                                width: 10,
                              }}
                            />
                          );
                        })}
                      </div>
                    ))}
                  </div>
                ) : null}
                {chatNode ? (
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, width: "100%" }}>
                    {[0, 1, 2, 3, 4, 5, 6, 7].map((dot) => {
                      const chatPulse = (Math.sin(frame / 10 + dot * 1.4) + 1) / 2;
                      const active = chatPulse > 0.36;
                      return (
                        <div
                          key={`${node.label}-${dot}`}
                          style={{
                            background: active
                              ? withAlpha(COLORS.primaryStrong, 0.54 + chatPulse * 0.3)
                              : "transparent",
                            border: `1px solid ${active
                              ? withAlpha(COLORS.primaryStrong, 0.28)
                              : withAlpha(COLORS.frost, 0.08)
                              }`,
                            borderRadius: "50%",
                            boxShadow: active ? `0 0 14px ${withAlpha(COLORS.primaryStrong, 0.22 + chatPulse * 0.1)}` : "none",
                            height: 10,
                            opacity: active ? 1 : 0.32,
                            transform: `scale(${active ? 0.78 + chatPulse * 0.35 : 0.62})`,
                            width: 10,
                          }}
                        />
                      );
                    })}
                  </div>
                ) : null}
                {workNode ? (
                  <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                    {[COLORS.primaryStrong, COLORS.cyan, COLORS.success, COLORS.primary, COLORS.success].map((color, dot) => (
                      <div
                        key={`${node.label}-${dot}`}
                        style={{
                          background: withAlpha(color, 0.22),
                          border: `1px solid ${withAlpha(color, 0.3)}`,
                          borderRadius: "50%",
                          boxShadow: `0 0 10px ${withAlpha(color, 0.18)}`,
                          height: 10,
                          width: 10,
                        }}
                      />
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          );
        })}
        {architectureEdges.map(([from, to], index) => {
          const fromNode = architectureNodes[from];
          const toNode = architectureNodes[to];
          const isUserChatEdge = from === 0 && to === 1;
          const isReturnEdge = from === 6 && to === 1;
          const highlightedEdge = isUserChatEdge || isReturnEdge;
          const startX = fromNode.x * 100;
          const endX = toNode.x * 100;
          const startY = fromNode.y * 100;
          const endY = toNode.y * 100;
          const left = Math.min(startX, endX);
          const top = Math.min(startY, endY);
          const width = Math.abs(endX - startX);
          const height = Math.abs(endY - startY);
          const horizontal = Math.abs(fromNode.y - toNode.y) < 0.05;
          const progress = (frame / 42 + index * 0.16) % 1;
          const firstSegmentRatio = horizontal ? 1 : 0.58;
          const resolveDotPosition = (travelProgress: number) => {
            const resolvedX = horizontal
              ? left + width * travelProgress
              : travelProgress < firstSegmentRatio
                ? startX + (endX - startX) * (travelProgress / firstSegmentRatio)
                : endX;
            const resolvedY = horizontal
              ? startY
              : travelProgress < firstSegmentRatio
                ? startY
                : startY +
                (endY - startY) * ((travelProgress - firstSegmentRatio) / (1 - firstSegmentRatio));

            return { x: resolvedX, y: resolvedY };
          };
          const mainDot = resolveDotPosition(progress);

          return (
            <div key={`${from}-${to}`}>
              <div
                style={{
                  background: highlightedEdge
                    ? withAlpha(COLORS.primaryStrong, 0.16)
                    : withAlpha(COLORS.frost, 0.08),
                  height: horizontal ? 2 : 2,
                  left: `${left}%`,
                  position: "absolute",
                  top: `${startY}%`,
                  zIndex: 1,
                  width: `${width}%`,
                }}
              />
              {!horizontal ? (
                <div
                  style={{
                    background: highlightedEdge
                      ? withAlpha(COLORS.primaryStrong, 0.16)
                      : withAlpha(COLORS.frost, 0.08),
                    height: `${height}%`,
                    left: `${endX}%`,
                    position: "absolute",
                    top: `${top}%`,
                    zIndex: 1,
                    width: 1,
                  }}
                />
              ) : null}
              <div
                style={{
                  background: highlightedEdge ? COLORS.cyan : COLORS.primaryStrong,
                  borderRadius: "50%",
                  boxShadow: `0 0 18px ${withAlpha(highlightedEdge ? COLORS.cyan : COLORS.primaryStrong, 0.3)}`,
                  height: 10,
                  left: `${mainDot.x}%`,
                  position: "absolute",
                  top: `${mainDot.y}%`,
                  zIndex: 1,
                  transform: "translate(-50%, -50%)",
                  width: 10,
                }}
              />
              {highlightedEdge
                ? [0.28, 0.56].map((offset) => {
                  const extraProgress = (progress + offset) % 1;
                  const extraDot = resolveDotPosition(extraProgress);

                  return (
                    <div
                      key={`${from}-${to}-${offset}`}
                      style={{
                        background: withAlpha(COLORS.cyan, 0.9),
                        borderRadius: "50%",
                        boxShadow: `0 0 14px ${withAlpha(COLORS.cyan, 0.26)}`,
                        height: 7,
                        left: `${extraDot.x}%`,
                        position: "absolute",
                        top: `${extraDot.y}%`,
                        zIndex: 1,
                        transform: "translate(-50%, -50%)",
                        width: 7,
                      }}
                    />
                  );
                })
                : null}
              {highlightedEdge
                ? [0.12, 0.38, 0.64].map((offset) => {
                  const reverseProgress = (1 - progress + offset) % 1;
                  const reverseDot = resolveDotPosition(reverseProgress);

                  return (
                    <div
                      key={`${from}-${to}-reverse-${offset}`}
                      style={{
                        background: withAlpha(COLORS.primaryStrong, 0.82),
                        borderRadius: "50%",
                        boxShadow: `0 0 12px ${withAlpha(COLORS.primaryStrong, 0.2)}`,
                        height: 6,
                        left: `${reverseDot.x}%`,
                        position: "absolute",
                        top: `${reverseDot.y}%`,
                        zIndex: 1,
                        transform: "translate(-50%, -50%)",
                        width: 6,
                      }}
                    />
                  );
                })
                : null}
            </div>
          );
        })}
      </div>
      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(4, 1fr)" }}>
        {[
          "Chat + API intake",
          "Live request state",
          "Supply network",
          "Commerce spine",
        ].map((line) => (
          <div
            key={line}
            style={{
              background: withAlpha(COLORS.frost, 0.03),
              border: panelBorder,
              borderRadius: 18,
              padding: "14px 14px 12px",
            }}
          >
            <MonoText color={COLORS.paper} size={10} uppercase>
              {line}
            </MonoText>
          </div>
        ))}
      </div>
    </SectionCard>
  );
};

const HookScene: React.FC = () => {
  const frame = useCurrentFrame();
  const fade = interpolate(frame, [0, 188, 210], [1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const firstOpacity = interpolate(frame, [0, 82, 108], [1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const secondOpacity = interpolate(frame, [70, 92, 150, 176], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const thirdOpacity = interpolate(frame, [138, 164, 210], [0, 1, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const firstVisibleOpacity = Math.max(firstOpacity, 0.46);
  const secondVisibleOpacity = Math.max(secondOpacity, 0.46);
  const thirdVisibleOpacity = Math.max(thirdOpacity, 0.46);

  return (
    <FilmStage background={mixHex(COLORS.ink, COLORS.primarySoft, 0.18)}>
      <AbsoluteFill style={{ ...stageStyle, opacity: fade }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 18, textAlign: "center" }}>
          <HeroLine
            emphasis={firstOpacity}
            opacity={firstVisibleOpacity}
            text="High-value requests become wasted intent."
          />
          <HeroLine
            emphasis={secondOpacity}
            opacity={secondVisibleOpacity}
            text="They end up as chat logs, heatmaps, and analytics."
          />
          <HeroLine
            emphasis={thirdOpacity}
            opacity={thirdVisibleOpacity}
            text="Boreal routes them into fulfilled work."
          />
        </div>
      </AbsoluteFill>
    </FilmStage>
  );
};

const IntakeScene: React.FC = () => {
  const frame = useCurrentFrame();
  const fade = sceneFade(frame, 350, 20);
  const promptWords = requestPrompt.trim().split(/\s+/);
  const prefilledWordCount = Math.floor(promptWords.length * 0.52);
  const prefilledPrompt = promptWords.slice(0, prefilledWordCount).join(" ");
  const remainingPrompt = promptWords.slice(prefilledWordCount).join(" ");
  const sendClick = spring({
    fps: useVideoConfig().fps,
    frame: frame - 158,
    config: {
      damping: 10,
      stiffness: 190,
    },
  });
  const composerTextOpacity = interpolate(frame, [164, 180], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const sendButtonOpacity = interpolate(frame, [136, 158], [0.4, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const sentOpacity = interpolate(frame, [184, 206], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const spinnerOpacity = interpolate(frame, [210, 232, 246], [0, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const createdOpacity = interpolate(frame, [244, 268], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <FilmStage>
      <AbsoluteFill style={{ opacity: fade, padding: SCENE_PADDING }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 20, height: "100%" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, textAlign: "center" }}>
            <TitleText color={COLORS.paper} size={58} weight={640}>
              Plain language becomes a live request.
            </TitleText>
          </div>
          <div
            style={{
              display: "grid",
              flex: 1,
              gap: 24,
              gridTemplateColumns: "270px 1fr",
              marginTop: 64,
              opacity: interpolate(frame, [38, 60], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              }),
            }}
          >
            <SidebarStack phase={frame >= 252 ? "detected" : "drafting"} />
            <SectionCard
              style={{
                background: withAlpha(COLORS.surface, 0.98),
                borderRadius: 32,
                display: "flex",
                flexDirection: "column",
                height: WORKSPACE_HEIGHT,
                overflow: "hidden",
              }}
            >
              <HeaderRail title="Request starts here" />
              <div style={{ display: "flex", flex: 1, flexDirection: "column", justifyContent: "space-between", padding: 28 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                  <div
                    style={{
                      alignSelf: "flex-end",
                      background: withAlpha(COLORS.primaryStrong, 0.12),
                      border: `1px solid ${withAlpha(COLORS.primaryStrong, 0.24)}`,
                      borderRadius: 28,
                      maxWidth: 900,
                      opacity: sentOpacity,
                      padding: "18px 22px",
                    }}
                  >
                    <BodyText color={COLORS.paper} size={20}>
                      {requestPrompt}
                    </BodyText>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      minHeight: 64,
                      position: "relative",
                    }}
                  >
                    <div
                      style={{
                        alignItems: "center",
                        background: withAlpha(COLORS.frost, 0.04),
                        border: `1px solid ${withAlpha(COLORS.primaryStrong, 0.16)}`,
                        borderRadius: 16,
                        display: "flex",
                        gap: 10,
                        height: 44,
                        left: 0,
                        opacity: spinnerOpacity,
                        padding: "0 14px",
                        position: "absolute",
                        top: 0,
                        width: "fit-content",
                      }}
                    >
                      <div
                        style={{
                          border: `2px solid ${withAlpha(COLORS.primaryStrong, 0.22)}`,
                          borderLeftColor: COLORS.primaryStrong,
                          borderRadius: "50%",
                          height: 20,
                          transform: `rotate(${frame * 12}deg)`,
                          width: 20,
                        }}
                      />
                      <MonoText color={COLORS.mist} size={12} uppercase>
                        structuring request
                      </MonoText>
                    </div>
                    <div
                      style={{
                        alignItems: "center",
                        background: withAlpha(COLORS.success, 0.08),
                        border: `1px solid ${withAlpha(COLORS.success, 0.18)}`,
                        borderRadius: 16,
                        display: "flex",
                        gap: 10,
                        height: 44,
                        left: 0,
                        opacity: createdOpacity,
                        padding: "0 14px",
                        position: "absolute",
                        top: 0,
                        width: "fit-content",
                      }}
                    >
                      <div
                        style={{
                          background: COLORS.success,
                          borderRadius: "50%",
                          height: 12,
                          width: 12,
                        }}
                      />
                      <MonoText color={COLORS.success} size={12} uppercase>
                        request created
                      </MonoText>
                    </div>
                  </div>
                </div>
                <div
                  style={{
                    background: withAlpha(COLORS.ink, 0.12),
                    border: `1px solid ${withAlpha(COLORS.primaryStrong, 0.18)}`,
                    borderRadius: 28,
                    display: "flex",
                    flexDirection: "column",
                    gap: 18,
                    minHeight: 210,
                    padding: 14,
                  }}
                >
                  <div
                    style={{
                      background: withAlpha(COLORS.ink, 0.16),
                      border: `1px solid ${withAlpha(COLORS.primaryStrong, 0.14)}`,
                      borderRadius: 22,
                      flex: 1,
                      padding: "18px 18px 54px",
                      position: "relative",
                    }}
                  >
                    <div
                      style={{
                        color: COLORS.paper,
                        fontFamily: FONTS.sans,
                        fontSize: 26,
                        lineHeight: 1.4,
                        opacity: composerTextOpacity,
                      }}
                    >
                      {prefilledPrompt}{" "}
                      <WordTypewriterText color={COLORS.paper} fontSize={26} startFrame={82} text={remainingPrompt} />
                    </div>
                    <div
                      style={{
                        alignItems: "center",
                        bottom: 16,
                        display: "flex",
                        justifyContent: "space-between",
                        left: 16,
                        position: "absolute",
                        right: 16,
                      }}
                    >
                      <div
                        style={{
                          background: withAlpha(COLORS.primaryStrong, 0.12),
                          border: `1px solid ${withAlpha(COLORS.primaryStrong, 0.24)}`,
                          borderRadius: 999,
                          padding: "10px 12px",
                        }}
                      >
                        <MonoText color={COLORS.primary} size={10} uppercase>
                          Boreal Agent
                        </MonoText>
                      </div>
                      <div
                        style={{
                          ...stageStyle,
                          background: withAlpha(COLORS.success, 0.14),
                          border: `1px solid ${withAlpha(COLORS.success, 0.26)}`,
                          borderRadius: "50%",
                          height: 42,
                          opacity: sendButtonOpacity,
                          transform: `scale(${interpolate(sendClick, [0, 1], [0.74, 1])})`,
                          width: 42,
                        }}
                      >
                        <MonoText color={COLORS.success} size={16}>
                          {">"}
                        </MonoText>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </SectionCard>
          </div>
        </div>
      </AbsoluteFill>
    </FilmStage>
  );
};

const MatchingScene: React.FC = () => {
  const frame = useCurrentFrame();
  const fade = sceneFade(frame, 200, 18);
  return (
    <FilmStage background={mixHex(COLORS.ink, COLORS.surface, 0.55)}>
      <AbsoluteFill style={{ opacity: fade, padding: SCENE_PADDING }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 18, textAlign: "center" }}>
          <TitleText color={COLORS.paper} size={56} weight={640}>
            Approve what fits on the open market.
          </TitleText>
        </div>
        <div style={{ marginTop: 64 }}>
          <MatchingBoard />
        </div>
      </AbsoluteFill>
    </FilmStage>
  );
};

const ParticipantsScene: React.FC = () => {
  const frame = useCurrentFrame();
  const fade = sceneFade(frame, 110, 16);
  const bg = mixHex(COLORS.ink, COLORS.primarySoft, 0.38);

  return (
    <FilmStage background={bg}>
      <AbsoluteFill style={{ ...stageStyle, opacity: fade }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 18, textAlign: "center" }}>
          <TitleText color={COLORS.paper} size={62} weight={640}>
            Humans, agents, and providers can share one request.
          </TitleText>
        </div>
      </AbsoluteFill>
    </FilmStage>
  );
};

const CollaborationScene: React.FC = () => {
  const frame = useCurrentFrame();
  const fade = sceneFade(frame, 210, 18);
  return (
    <FilmStage background={mixHex(COLORS.ink, COLORS.primarySoft, 0.38)}>
      <AbsoluteFill style={{ opacity: fade, padding: SCENE_PADDING }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 18, textAlign: "center" }}>
          <TitleText color={COLORS.paper} size={56} weight={640}>
            One request. Shared execution.
          </TitleText>
        </div>
        <div style={{ marginTop: 64 }}>
          <CollaborationWorkspace />
        </div>
      </AbsoluteFill>
    </FilmStage>
  );
};

const FulfillmentScene: React.FC = () => {
  const frame = useCurrentFrame();
  const fade = sceneFade(frame, 250, 20);
  return (
    <FilmStage background={mixHex(COLORS.surface, COLORS.ink, 0.3)}>
      <AbsoluteFill style={{ opacity: fade, padding: SCENE_PADDING }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 18, textAlign: "center" }}>
          <TitleText color={COLORS.paper} size={56} weight={640}>
            Work returns inside the thread.
          </TitleText>
        </div>
        <div style={{ marginTop: 64 }}>
          <ConversationThread />
        </div>
      </AbsoluteFill>
    </FilmStage>
  );
};

const ArchitectureScene: React.FC = () => {
  const frame = useCurrentFrame();
  const fade = sceneFade(frame, 300, 18);
  return (
    <FilmStage>
      <AbsoluteFill style={{ opacity: fade, padding: SCENE_PADDING }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 18, textAlign: "center" }}>
          <TitleText color={COLORS.paper} size={56} weight={640}>
            Boreal is request-native agentic commerce.
          </TitleText>
        </div>
        <div style={{ marginTop: 64 }}>
          <ArchitectureDiagram />
        </div>
      </AbsoluteFill>
    </FilmStage>
  );
};

const CloseScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const reveal = spring({
    fps,
    frame,
    config: {
      damping: 18,
      stiffness: 90,
    },
  });

  return (
    <FilmStage background={mixHex(COLORS.ink, COLORS.primarySoft, 0.24)} watermarkPlacement="none">
      <AbsoluteFill style={stageStyle}>
        <div
          style={{
            alignItems: "center",
            display: "flex",
            flexDirection: "column",
            gap: 20,
            opacity: sceneFade(frame, 170, 20),
            textAlign: "center",
            transform: `translateY(${interpolate(reveal, [0, 1], [18, 0])}px) scale(${interpolate(reveal, [0, 1], [0.96, 1])})`,
          }}
        >
          <BorealMark size={120} />
          <div style={{ marginTop: 50 }}>
            <TitleText color={COLORS.paper} size={64} weight={650}>
              Submit one request.
            </TitleText>
          </div>
          <TitleText color={COLORS.primary} italic size={52} weight={620}>
            Boreal finds the best path to fulfillment.
          </TitleText>
          <BodyText color={COLORS.mist} size={28} width={900}>
            The request stays live until the work is done.
          </BodyText>
          <div style={{ marginTop: 50 }}>
            <MonoText color={COLORS.paper} size={24}>
              boreal.work
            </MonoText>
          </div>

        </div>
      </AbsoluteFill>
    </FilmStage>
  );
};

export const BorealShowcase60: React.FC<SharedCompositionProps> = ({ ambientAudioSrc }) => {
  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.ink }}>
      <AmbientBed durationInFrames={BOREAL_SHOWCASE_DURATION} src={ambientAudioSrc} />
      <Series>
        <Series.Sequence durationInFrames={210}>
          <HookScene />
        </Series.Sequence>
        <Series.Sequence durationInFrames={350}>
          <IntakeScene />
        </Series.Sequence>
        <Series.Sequence durationInFrames={200}>
          <MatchingScene />
        </Series.Sequence>
        <Series.Sequence durationInFrames={110}>
          <ParticipantsScene />
        </Series.Sequence>
        <Series.Sequence durationInFrames={210}>
          <CollaborationScene />
        </Series.Sequence>
        <Series.Sequence durationInFrames={250}>
          <FulfillmentScene />
        </Series.Sequence>
        <Series.Sequence durationInFrames={300}>
          <ArchitectureScene />
        </Series.Sequence>
        <Series.Sequence durationInFrames={170}>
          <CloseScene />
        </Series.Sequence>
      </Series>
    </AbsoluteFill>
  );
};
