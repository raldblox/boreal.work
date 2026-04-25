import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

import type {SceneSpec, VideoVariant} from "../data/video-variants";

export type BorealTimelineCompositionProps = {
  variant: VideoVariant;
};

const BACKGROUND = "#071115";
const PANEL = "rgba(11, 22, 28, 0.88)";
const TEXT_MUTED = "#99a8b6";
const TEXT_PRIMARY = "#f8fafc";

export const BorealTimelineComposition: React.FC<BorealTimelineCompositionProps> = ({
  variant,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const sceneFrames = variant.scenes.map((scene) => scene.durationInSeconds * fps);
  const currentSceneIndex = getCurrentSceneIndex(frame, sceneFrames);
  const currentScene = variant.scenes[currentSceneIndex];
  const sceneStart = getSceneStartFrame(currentSceneIndex, sceneFrames);
  const sceneFrame = frame - sceneStart;
  const reveal = spring({
    fps,
    frame: sceneFrame,
    config: {
      damping: 18,
      stiffness: 140,
    },
  });
  const scanOffset = interpolate(frame, [0, 240], [0, 180], {
    extrapolateRight: "extend",
  });

  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(circle at 20% 20%, ${withAlpha(
          variant.accent,
          0.18,
        )}, transparent 35%), ${BACKGROUND}`,
        color: TEXT_PRIMARY,
        fontFamily: '"IBM Plex Sans", "Segoe UI", sans-serif',
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.045) 1px, transparent 1px)",
          backgroundSize: "120px 120px",
          opacity: 0.35,
          transform: `translateY(${scanOffset}px)`,
        }}
      />

      <div
        style={{
          position: "absolute",
          inset: 48,
          border: `1px solid ${withAlpha(variant.accent, 0.45)}`,
          padding: 48,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: withAlpha("#041017", 0.7),
          boxShadow: `0 0 0 1px ${withAlpha(variant.accent, 0.18)} inset`,
        }}
      >
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 32,
          }}
        >
          <div style={{maxWidth: 1040}}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 12,
                border: `1px solid ${withAlpha(variant.accent, 0.5)}`,
                color: variant.accent,
                padding: "10px 14px",
                fontSize: 20,
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                marginBottom: 22,
              }}
            >
              {variant.kicker}
            </div>
            <h1
              style={{
                fontSize: 78,
                lineHeight: 1,
                margin: 0,
                letterSpacing: "-0.05em",
                transform: `translateY(${(1 - reveal) * 40}px)`,
                opacity: reveal,
              }}
            >
              {currentScene.title}
            </h1>
            <p
              style={{
                margin: "22px 0 0 0",
                fontSize: 28,
                lineHeight: 1.45,
                color: TEXT_MUTED,
                maxWidth: 980,
                transform: `translateY(${(1 - reveal) * 28}px)`,
                opacity: Math.min(1, reveal * 1.1),
              }}
            >
              {currentScene.message}
            </p>
          </div>

          <div
            style={{
              minWidth: 260,
              border: `1px solid ${withAlpha(variant.accent, 0.32)}`,
              padding: 24,
              background: PANEL,
            }}
          >
            <div
              style={{
                fontSize: 16,
                textTransform: "uppercase",
                letterSpacing: "0.18em",
                color: variant.accent,
                marginBottom: 14,
              }}
            >
              {variant.label}
            </div>
            <div style={{fontSize: 38, lineHeight: 1.05, marginBottom: 12}}>
              {variant.headline}
            </div>
            <div style={{fontSize: 18, lineHeight: 1.5, color: TEXT_MUTED}}>
              {variant.subheadline}
            </div>
          </div>
        </header>

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "1.15fr 0.85fr",
            gap: 28,
            alignItems: "stretch",
          }}
        >
          <div
            style={{
              border: `1px solid ${withAlpha(variant.accent, 0.3)}`,
              background: PANEL,
              padding: 28,
              display: "grid",
              gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
              gap: 18,
            }}
          >
            {variant.scenes.map((scene, index) => {
              const isActive = index === currentSceneIndex;
              const progress = getSceneProgress(frame, index, sceneFrames);
              return (
                <SceneCard
                  accent={variant.accent}
                  index={index}
                  isActive={isActive}
                  key={scene.key}
                  progress={progress}
                  scene={scene}
                />
              );
            })}
          </div>

          <div
            style={{
              border: `1px solid ${withAlpha(variant.accent, 0.3)}`,
              background: PANEL,
              padding: 28,
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              gap: 24,
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 16,
                  textTransform: "uppercase",
                  letterSpacing: "0.18em",
                  color: variant.accent,
                  marginBottom: 14,
                }}
              >
                Timeline
              </div>
              <div style={{fontSize: 44, lineHeight: 1.05, marginBottom: 16}}>
                Scene {String(currentSceneIndex + 1).padStart(2, "0")}
              </div>
              <div style={{fontSize: 22, color: TEXT_MUTED, lineHeight: 1.5}}>
                Starter Remotion app for Boreal.  This scaffold turns the approved
                storyboard into renderable compositions before actual UI footage and assets
                are added.
              </div>
            </div>

            <div style={{display: "flex", flexDirection: "column", gap: 14}}>
              {variant.scenes.map((scene, index) => {
                const progress = getSceneProgress(frame, index, sceneFrames);
                return (
                  <TimelineRow
                    accent={variant.accent}
                    index={index}
                    key={scene.key}
                    progress={progress}
                    scene={scene}
                  />
                );
              })}
            </div>
          </div>
        </section>
      </div>
    </AbsoluteFill>
  );
};

const SceneCard: React.FC<{
  accent: string;
  index: number;
  isActive: boolean;
  progress: number;
  scene: SceneSpec;
}> = ({accent, index, isActive, progress, scene}) => {
  return (
    <div
      style={{
        border: `1px solid ${withAlpha(accent, isActive ? 0.7 : 0.2)}`,
        padding: 18,
        background: withAlpha(accent, isActive ? 0.14 : 0.04),
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        gap: 18,
      }}
    >
      <div>
        <div
          style={{
            color: isActive ? accent : TEXT_MUTED,
            fontSize: 14,
            textTransform: "uppercase",
            letterSpacing: "0.16em",
            marginBottom: 12,
          }}
        >
          Scene {String(index + 1).padStart(2, "0")}
        </div>
        <div style={{fontSize: 28, lineHeight: 1.1, marginBottom: 10}}>{scene.title}</div>
        <div style={{fontSize: 16, lineHeight: 1.5, color: TEXT_MUTED}}>
          {scene.durationInSeconds}s
        </div>
      </div>
      <div
        style={{
          height: 6,
          background: "rgba(255,255,255,0.08)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${Math.round(progress * 100)}%`,
            background: accent,
          }}
        />
      </div>
    </div>
  );
};

const TimelineRow: React.FC<{
  accent: string;
  index: number;
  progress: number;
  scene: SceneSpec;
}> = ({accent, index, progress, scene}) => {
  return (
    <div style={{display: "grid", gridTemplateColumns: "88px 1fr", gap: 16, alignItems: "center"}}>
      <div
        style={{
          fontSize: 14,
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          color: TEXT_MUTED,
        }}
      >
        {String(index + 1).padStart(2, "0")}
      </div>
      <div>
        <div style={{display: "flex", justifyContent: "space-between", marginBottom: 8}}>
          <div style={{fontSize: 20}}>{scene.title}</div>
          <div style={{fontSize: 18, color: TEXT_MUTED}}>{scene.durationInSeconds}s</div>
        </div>
        <div
          style={{
            height: 8,
            background: "rgba(255,255,255,0.08)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${Math.round(progress * 100)}%`,
              background: accent,
            }}
          />
        </div>
      </div>
    </div>
  );
};

const getCurrentSceneIndex = (frame: number, sceneFrames: number[]) => {
  let consumed = 0;
  for (let index = 0; index < sceneFrames.length; index++) {
    const next = consumed + sceneFrames[index];
    if (frame < next) {
      return index;
    }
    consumed = next;
  }

  return sceneFrames.length - 1;
};

const getSceneStartFrame = (sceneIndex: number, sceneFrames: number[]) => {
  return sceneFrames.slice(0, sceneIndex).reduce((sum, duration) => sum + duration, 0);
};

const getSceneProgress = (frame: number, sceneIndex: number, sceneFrames: number[]) => {
  const start = getSceneStartFrame(sceneIndex, sceneFrames);
  const duration = sceneFrames[sceneIndex];

  if (frame <= start) {
    return 0;
  }

  if (frame >= start + duration) {
    return 1;
  }

  return (frame - start) / duration;
};

const withAlpha = (hex: string, alpha: number) => {
  const normalized = hex.replace("#", "");
  const expanded =
    normalized.length === 3
      ? normalized
          .split("")
          .map((char) => char + char)
          .join("")
      : normalized;

  const red = Number.parseInt(expanded.slice(0, 2), 16);
  const green = Number.parseInt(expanded.slice(2, 4), 16);
  const blue = Number.parseInt(expanded.slice(4, 6), 16);

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
};
