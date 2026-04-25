import type {CSSProperties, ReactNode} from "react";
import React from "react";
import {
  AbsoluteFill,
  Audio,
  OffthreadVideo,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

import {COLORS, FONTS} from "./theme";

export type SharedCompositionProps = {
  ambientAudioSrc?: string | null;
  screenRecordingSrc?: string | null;
};

export const withAlpha = (hex: string, alpha: number) => {
  const normalized = hex.replace("#", "");
  const expanded =
    normalized.length === 3
      ? normalized
          .split("")
          .map((character) => `${character}${character}`)
          .join("")
      : normalized;

  const red = Number.parseInt(expanded.slice(0, 2), 16);
  const green = Number.parseInt(expanded.slice(2, 4), 16);
  const blue = Number.parseInt(expanded.slice(4, 6), 16);

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
};

export const mixHex = (from: string, to: string, amount: number) => {
  const parse = (hex: string) => {
    const normalized = hex.replace("#", "");
    return normalized.length === 3
      ? normalized
          .split("")
          .map((character) => `${character}${character}`)
          .join("")
      : normalized;
  };

  const source = parse(from);
  const target = parse(to);
  const t = Math.max(0, Math.min(1, amount));

  const channel = (start: number, end: number) =>
    Math.round(start + (end - start) * t)
      .toString(16)
      .padStart(2, "0");

  const r = channel(
    Number.parseInt(source.slice(0, 2), 16),
    Number.parseInt(target.slice(0, 2), 16),
  );
  const g = channel(
    Number.parseInt(source.slice(2, 4), 16),
    Number.parseInt(target.slice(2, 4), 16),
  );
  const b = channel(
    Number.parseInt(source.slice(4, 6), 16),
    Number.parseInt(target.slice(4, 6), 16),
  );

  return `#${r}${g}${b}`;
};

export const sceneFade = (frame: number, durationInFrames: number, length = 20) => {
  const enter = interpolate(frame, [0, length], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const exit = interpolate(frame, [durationInFrames - length, durationInFrames], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return Math.min(enter, exit);
};

export const AmbientBed: React.FC<{
  durationInFrames: number;
  src?: string | null;
}> = ({durationInFrames, src}) => {
  if (!src) {
    return null;
  }

  return (
    <Audio
      src={staticFile(src.replace(/^\//, ""))}
      volume={(frame) =>
        interpolate(
          frame,
          [Math.max(0, durationInFrames - 60), durationInFrames],
          [0.15, 0],
          {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          },
        )
      }
    />
  );
};

export const SceneSurface: React.FC<{
  background?: string;
  children: ReactNode;
  glowColor?: string;
  opacity?: number;
}> = ({background = COLORS.ink, children, glowColor = COLORS.primary, opacity = 1}) => {
  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(circle at 78% 18%, ${withAlpha(glowColor, 0.18)}, transparent 30%), radial-gradient(circle at 14% 82%, ${withAlpha(
          COLORS.cyan,
          0.1,
        )}, transparent 28%), ${background}`,
        color: COLORS.frost,
        fontFamily: FONTS.sans,
        opacity,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          border: `1px solid ${withAlpha(COLORS.primary, 0.14)}`,
          inset: 24,
          position: "absolute",
        }}
      />
      {children}
    </AbsoluteFill>
  );
};

export const TitleText: React.FC<{
  children: ReactNode;
  color?: string;
  italic?: boolean;
  size?: number;
  style?: CSSProperties;
  weight?: number | string;
}> = ({children, color = COLORS.paper, italic = false, size = 52, style, weight = 600}) => {
  return (
    <div
      style={{
        color,
        fontFamily: FONTS.display,
        fontSize: size,
        fontStyle: italic ? "italic" : "normal",
        fontWeight: weight,
        letterSpacing: "-0.05em",
        lineHeight: 0.96,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

export const MonoText: React.FC<{
  children: ReactNode;
  color?: string;
  size?: number;
  spacing?: string;
  style?: CSSProperties;
  uppercase?: boolean;
}> = ({children, color = COLORS.mist, size = 12, spacing = "0.16em", style, uppercase = false}) => {
  return (
    <div
      style={{
        color,
        fontFamily: FONTS.mono,
        fontSize: size,
        letterSpacing: spacing,
        textTransform: uppercase ? "uppercase" : "none",
        ...style,
      }}
    >
      {children}
    </div>
  );
};

export const BodyText: React.FC<{
  children: ReactNode;
  color?: string;
  size?: number;
  style?: CSSProperties;
  width?: number | string;
}> = ({children, color = COLORS.mist, size = 20, style, width = "100%"}) => {
  return (
    <div
      style={{
        color,
        fontFamily: FONTS.sans,
        fontSize: size,
        lineHeight: 1.45,
        maxWidth: width,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

export const TypewriterText: React.FC<{
  color?: string;
  fontFamily?: string;
  fontSize?: number;
  startFrame: number;
  text: string;
}> = ({color = COLORS.primary, fontFamily = FONTS.mono, fontSize = 28, startFrame, text}) => {
  const frame = useCurrentFrame();
  const charsVisible = Math.floor(
    interpolate(frame, [startFrame, startFrame + text.length * 2], [0, text.length], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }),
  );

  return (
    <span
      style={{
        color,
        fontFamily,
        fontSize,
        whiteSpace: "pre-wrap",
      }}
    >
      {text.slice(0, charsVisible)}
      {charsVisible < text.length ? (
        <span style={{opacity: frame % 20 < 10 ? 1 : 0}}>|</span>
      ) : null}
    </span>
  );
};

export const WordTypewriterText: React.FC<{
  color?: string;
  fontSize?: number;
  startFrame: number;
  text: string;
}> = ({color = COLORS.frost, fontSize = 24, startFrame, text}) => {
  const frame = useCurrentFrame();
  const words = text.trim().split(/\s+/);
  const visibleWords = Math.floor(
    interpolate(frame, [startFrame, startFrame + words.length * 5], [0, words.length], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }),
  );

  return (
    <span
      style={{
        color,
        fontFamily: FONTS.sans,
        fontSize,
        lineHeight: 1.4,
      }}
    >
      {words.slice(0, visibleWords).join(" ")}
      {visibleWords < words.length ? (
        <span style={{opacity: frame % 18 < 9 ? 1 : 0}}>_</span>
      ) : null}
    </span>
  );
};

export const SectionCard: React.FC<{
  children: ReactNode;
  style?: CSSProperties;
}> = ({children, style}) => {
  return (
    <div
      style={{
        background: withAlpha(COLORS.surfaceRaised, 0.9),
        border: `1px solid ${COLORS.line}`,
        boxShadow: `0 24px 70px ${withAlpha(COLORS.ink, 0.42)}`,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

export const ProgressBar: React.FC<{
  background?: string;
  color?: string;
  progress: number;
  thickness?: number;
}> = ({background = withAlpha(COLORS.frost, 0.12), color = COLORS.primaryStrong, progress, thickness = 8}) => {
  return (
    <div
      style={{
        background,
        height: thickness,
        overflow: "hidden",
        width: "100%",
      }}
    >
      <div
        style={{
          background: color,
          height: "100%",
          width: `${Math.max(0, Math.min(100, progress * 100))}%`,
        }}
      />
    </div>
  );
};

export const springIn = (frame: number, fps: number, delay = 0, stiffness = 120, damping = 18) => {
  return spring({
    fps,
    frame: frame - delay,
    config: {
      damping,
      stiffness,
    },
  });
};

export const ScreenCaptureSlot: React.FC<{
  src?: string | null;
}> = ({src}) => {
  if (src) {
    return (
      <OffthreadVideo
        src={staticFile(src.replace(/^\//, ""))}
        style={{
          height: "100%",
          objectFit: "cover",
          width: "100%",
        }}
      />
    );
  }

  return (
    <div
      style={{
        alignItems: "center",
        background: withAlpha(COLORS.frost, 0.06),
        border: `1px dashed ${withAlpha(COLORS.frost, 0.26)}`,
        color: withAlpha(COLORS.frost, 0.3),
        display: "flex",
        fontFamily: FONTS.mono,
        fontSize: 20,
        height: "100%",
        justifyContent: "center",
        letterSpacing: "0.18em",
        textTransform: "uppercase",
        width: "100%",
      }}
    >
      [ screen recording ]
    </div>
  );
};

export const BrandLockup: React.FC<{
  subtitle?: string;
}> = ({subtitle = "Commerce, headed north."}) => {
  return (
    <div style={{alignItems: "center", display: "flex", flexDirection: "column", gap: 10}}>
      <MonoText color={COLORS.paper} size={28} spacing="0.35em" uppercase>
        BOREAL
      </MonoText>
      <MonoText color={COLORS.quiet} size={16}>
        boreal.work
      </MonoText>
      <TitleText color={COLORS.primary} italic size={20} weight={500}>
        {subtitle}
      </TitleText>
    </div>
  );
};

export const FloatingButton: React.FC<{
  active?: boolean;
  children: ReactNode;
}> = ({active = false, children}) => {
  return (
    <div
      style={{
        alignItems: "center",
        background: active ? COLORS.primaryStrong : "transparent",
        border: `1px solid ${active ? COLORS.primaryStrong : COLORS.line}`,
        color: active ? COLORS.ink : COLORS.frost,
        display: "inline-flex",
        fontFamily: FONTS.mono,
        fontSize: 12,
        gap: 8,
        letterSpacing: "0.12em",
        padding: "12px 16px",
        textTransform: "uppercase",
      }}
    >
      {children}
    </div>
  );
};

export const useSceneSpring = (delay = 0, stiffness = 120, damping = 18) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  return springIn(frame, fps, delay, stiffness, damping);
};
