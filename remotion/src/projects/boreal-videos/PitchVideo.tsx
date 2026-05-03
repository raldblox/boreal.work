import React from "react";
import {
  AbsoluteFill,
  Audio,
  interpolate,
  Sequence,
  Series,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

import {
  FONTS,
  FPS,
  HEIGHT,
  TOKENS,
  WIDTH,
} from "../../generations/home-chat-accurate-2026/theme";
import {
  PITCH_VIDEO_ID,
  PITCH_VIDEO_PRIMARY_RENDER_SOURCE,
  PITCH_VIDEO_SUPPORT_RENDER_SOURCE,
  PITCH_VIDEO_VOICE_SCRIPT,
} from "./script";
import {
  ClosingCategoryScene,
  ExecutionThreadScene,
  FreeIntakeScene,
  PaymentRequiredScene,
  ProofRoomScene,
  ProblemHookScene,
  RouteLockScene,
  SolanaVerificationScene,
} from "./simple-scenes";
import {
  type PitchScenePlan,
  PITCH_VIDEO_SCENES,
  PITCH_VIDEO_TOTAL_FRAMES,
} from "./pitch-plan";

export type PitchVideoProps = {
  audioSrc?: string;
  primarySource?: string;
  showNotes?: boolean;
  supportSource?: string;
  videoId?: string;
};

export const PITCH_VIDEO_DEFAULT_PROPS = {
  audioSrc: undefined,
  primarySource: PITCH_VIDEO_PRIMARY_RENDER_SOURCE,
  showNotes: false,
  supportSource: PITCH_VIDEO_SUPPORT_RENDER_SOURCE,
  videoId: PITCH_VIDEO_ID,
} satisfies PitchVideoProps;

const DirectorBackdrop: React.FC = () => {
  return (
    <AbsoluteFill
      style={{
        background: "#000000",
      }}
    />
  );
};

const DirectorSlate: React.FC<{scene: PitchScenePlan}> = ({scene}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const reveal = spring({
    fps,
    frame,
    config: {damping: 18, stiffness: 90},
  });

  return (
    <AbsoluteFill
      style={{
        alignItems: "center",
        color: TOKENS.foreground,
        display: "flex",
        fontFamily: FONTS.sans,
        justifyContent: "center",
        padding: 96,
      }}
    >
      <div
        style={{
          alignItems: "center",
          display: "flex",
          flexDirection: "column",
          gap: 16,
          maxWidth: 1240,
          opacity: reveal,
          textAlign: "center",
          transform: `translateY(${interpolate(reveal, [0, 1], [18, 0])}px)`,
          width: "100%",
        }}
      >
        <div
          style={{
            color: TOKENS.accent,
            fontFamily: FONTS.mono,
            fontSize: 14,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
          }}
        >
          Boreal-Videos / PitchVideo / placeholder / {`${(scene.durationInFrames / FPS).toFixed(1)}s`}
        </div>
        <div
          style={{
            fontFamily: FONTS.heading,
            fontSize: 72,
            letterSpacing: "-0.06em",
            lineHeight: 0.92,
            maxWidth: 1040,
          }}
        >
          {scene.title}
        </div>
        <div
          style={{
            color: TOKENS.mutedForeground,
            fontSize: 28,
            lineHeight: 1.45,
            maxWidth: 1080,
            whiteSpace: "pre-wrap",
          }}
        >
          This scene does not match the script yet.
        </div>
        <div
          style={{
            color: TOKENS.foreground,
            fontSize: 26,
            lineHeight: 1.5,
            maxWidth: 1080,
            whiteSpace: "pre-wrap",
          }}
        >
          {scene.purpose}
        </div>
        <div
          style={{
            color: TOKENS.mutedForeground,
            fontSize: 24,
            lineHeight: 1.52,
            maxWidth: 1120,
            whiteSpace: "pre-wrap",
          }}
        >
          Build here: {(scene.componentNeed ?? []).join(" + ")}
        </div>
        <div
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.1)",
            fontSize: 22,
            lineHeight: 1.55,
            maxWidth: 1180,
            padding: "24px 28px",
            whiteSpace: "pre-wrap",
          }}
        >
          Voiceover: {scene.voiceover}
        </div>
      </div>
    </AbsoluteFill>
  );
};

const SceneFade: React.FC<{children: React.ReactNode; durationInFrames: number}> = ({
  children,
  durationInFrames,
}) => {
  const frame = useCurrentFrame();
  const fadeIn = interpolate(frame, [0, 14], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const fadeOut = interpolate(frame, [durationInFrames - 18, durationInFrames - 2], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const opacity = Math.min(fadeIn, fadeOut);
  const translateY = interpolate(opacity, [0, 1], [14, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        opacity,
        transform: `translateY(${translateY}px)`,
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

const PitchSceneRenderer: React.FC<{scene: PitchScenePlan; showNotes: boolean}> = ({
  scene,
  showNotes,
}) => {
  if (scene.status === "needs-component") {
    return <DirectorSlate scene={scene} />;
  }

  switch (scene.id) {
    case "hook":
      return <ProblemHookScene showNote={showNotes} />;
    case "free-intake":
      return <FreeIntakeScene showNote={showNotes} />;
    case "route-lock":
      return <RouteLockScene showNote={showNotes} />;
    case "payment-required":
      return <PaymentRequiredScene showNote={showNotes} />;
    case "solana-verify":
      return <SolanaVerificationScene showNote={showNotes} />;
    case "execution-thread":
      return <ExecutionThreadScene showNote={showNotes} />;
    case "proof-room":
      return <ProofRoomScene showNote={showNotes} />;
    case "close":
      return <ClosingCategoryScene showNote={showNotes} />;
    default:
      return <DirectorSlate scene={scene} />;
  }
};

export const PitchVideo: React.FC<PitchVideoProps> = ({audioSrc, showNotes = false}) => {
  return (
    <AbsoluteFill style={{background: TOKENS.background}}>
      <DirectorBackdrop />
      {audioSrc ? <Audio src={audioSrc} /> : null}
      <Series>
        {PITCH_VIDEO_SCENES.map((scene) => (
          <Series.Sequence
            durationInFrames={scene.durationInFrames}
            key={scene.id}
            premountFor={FPS}
          >
            <SceneFade durationInFrames={scene.durationInFrames}>
              <PitchSceneRenderer scene={scene} showNotes={showNotes} />
            </SceneFade>
          </Series.Sequence>
        ))}
      </Series>
    </AbsoluteFill>
  );
};

export const PITCH_VIDEO_DURATION = PITCH_VIDEO_TOTAL_FRAMES;

export const PITCH_VIDEO_DIMENSIONS = {
  fps: FPS,
  height: HEIGHT,
  width: WIDTH,
} as const;

export const PITCH_VIDEO_SCRIPT = PITCH_VIDEO_VOICE_SCRIPT.pitch120;
