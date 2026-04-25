import {AbsoluteFill, Audio, Sequence, staticFile} from "remotion";

import {
  BorealBackdrop,
  ChatWorkspaceSurface,
  ClosingMontageSurface,
  type FilmSceneProps,
  FulfillmentSurface,
  HomepageSurface,
  LifecycleSurface,
  ProblemPulseSurface,
  SceneFrame,
  SolanaSurface,
  SupplyMarketSurface,
} from "../components/BorealSurface";
import {
  getSceneVoiceoverFile,
  VIDEO_FPS,
  type SceneId,
  type VideoVariant,
} from "../data/video-variants";
import {GENERATED_VOICEOVER_MANIFEST} from "../data/generated-voiceover";

export type BorealFilmProps = {
  variant: VideoVariant;
};

type SceneRenderer = React.FC<FilmSceneProps>;

const getSurfaceTitle = (variant: VideoVariant, sceneId: SceneId) => {
  return variant.surfaceTitles?.[sceneId];
};

const getSurfaceMode = (variant: VideoVariant) => {
  return variant.surfaceMode ?? "standard";
};

const getVoiceoverPlaybackRate = (variant: VideoVariant, sceneIndex: number) => {
  const manifest = GENERATED_VOICEOVER_MANIFEST[
    variant.compositionId as keyof typeof GENERATED_VOICEOVER_MANIFEST
  ];

  return manifest?.[sceneIndex]?.playbackRate ?? 1;
};

const sceneRegistry: Record<SceneId, SceneRenderer> = {
  "intent-disappears": ({scene, sceneCount, sceneIndex, variant}) => (
    <SceneFrame scene={scene} sceneCount={sceneCount} sceneIndex={sceneIndex} variant={variant}>
      <ProblemPulseSurface accent={variant.accent} mode={getSurfaceMode(variant)} />
    </SceneFrame>
  ),
  "missing-layer": ({scene, sceneCount, sceneIndex, variant}) => (
    <SceneFrame scene={scene} sceneCount={sceneCount} sceneIndex={sceneIndex} variant={variant}>
      <HomepageSurface
        accent={variant.accent}
        mode={getSurfaceMode(variant)}
        title={getSurfaceTitle(variant, scene.id)}
      />
    </SceneFrame>
  ),
  "chat-to-workspace": ({scene, sceneCount, sceneIndex, variant}) => (
    <SceneFrame scene={scene} sceneCount={sceneCount} sceneIndex={sceneIndex} variant={variant}>
      <ChatWorkspaceSurface
        accent={variant.accent}
        mode={getSurfaceMode(variant)}
        title={getSurfaceTitle(variant, scene.id)}
      />
    </SceneFrame>
  ),
  "real-supply": ({scene, sceneCount, sceneIndex, variant}) => (
    <SceneFrame scene={scene} sceneCount={sceneCount} sceneIndex={sceneIndex} variant={variant}>
      <SupplyMarketSurface
        accent={variant.accent}
        mode={getSurfaceMode(variant)}
        title={getSurfaceTitle(variant, scene.id)}
      />
    </SceneFrame>
  ),
  "proposal-delivery": ({scene, sceneCount, sceneIndex, variant}) => (
    <SceneFrame scene={scene} sceneCount={sceneCount} sceneIndex={sceneIndex} variant={variant}>
      <LifecycleSurface
        accent={variant.accent}
        mode={getSurfaceMode(variant)}
        title={getSurfaceTitle(variant, scene.id)}
      />
    </SceneFrame>
  ),
  "direct-fulfillment": ({scene, sceneCount, sceneIndex, variant}) => (
    <SceneFrame scene={scene} sceneCount={sceneCount} sceneIndex={sceneIndex} variant={variant}>
      <FulfillmentSurface
        accent={variant.accent}
        mode={getSurfaceMode(variant)}
        title={getSurfaceTitle(variant, scene.id)}
      />
    </SceneFrame>
  ),
  "solana-fit": ({scene, sceneCount, sceneIndex, variant}) => (
    <SceneFrame scene={scene} sceneCount={sceneCount} sceneIndex={sceneIndex} variant={variant}>
      <SolanaSurface
        accent={variant.accent}
        mode={getSurfaceMode(variant)}
        title={getSurfaceTitle(variant, scene.id)}
      />
    </SceneFrame>
  ),
  "missing-piece": ({scene, sceneCount, sceneIndex, variant}) => (
    <SceneFrame scene={scene} sceneCount={sceneCount} sceneIndex={sceneIndex} variant={variant}>
      <ClosingMontageSurface
        accent={variant.accent}
        mode={getSurfaceMode(variant)}
        title={getSurfaceTitle(variant, scene.id)}
      />
    </SceneFrame>
  ),
};

export const BorealFilm: React.FC<BorealFilmProps> = ({variant}) => {
  let from = 0;
  const sequencedScenes = variant.scenes.map((scene) => {
    const durationInFrames = scene.durationInSeconds * VIDEO_FPS;
    const sequenceFrom = from;
    from += durationInFrames;

    return {
      durationInFrames,
      scene,
      sequenceFrom,
    };
  });

  return (
    <AbsoluteFill
      style={{
        background: "#071115",
        color: "#f8fafc",
        overflow: "hidden",
      }}
    >
      <BorealBackdrop accent={variant.accent} />

      {sequencedScenes.map(({durationInFrames, scene, sequenceFrom}, sceneIndex) => {
        const SceneComponent = sceneRegistry[scene.id];

        return (
          <Sequence durationInFrames={durationInFrames} from={sequenceFrom} key={`${scene.id}-${sceneIndex}`}>
            <SceneComponent
              scene={scene}
              sceneCount={variant.scenes.length}
              sceneIndex={sceneIndex}
              variant={variant}
            />
          </Sequence>
        );
      })}

      {variant.voiceoverMode === "scene"
        ? sequencedScenes.map(({durationInFrames, scene, sequenceFrom}, sceneIndex) => {
            return (
              <Sequence
                durationInFrames={durationInFrames}
                from={sequenceFrom}
                key={`voiceover-${scene.id}-${sceneIndex}`}
              >
                <Audio
                  playbackRate={getVoiceoverPlaybackRate(variant, sceneIndex)}
                  src={staticFile(getSceneVoiceoverFile(variant.compositionId, sceneIndex, scene.id))}
                  trimAfter={durationInFrames}
                />
              </Sequence>
            );
          })
        : null}
    </AbsoluteFill>
  );
};
