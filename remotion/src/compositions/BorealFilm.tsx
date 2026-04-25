import {AbsoluteFill, Sequence} from "remotion";

import {
  BorealBackdrop,
  ChatWorkspaceSurface,
  ClosingMontageSurface,
  type FilmSceneProps,
  FilmOverlay,
  FulfillmentSurface,
  HomepageSurface,
  ProblemPulseSurface,
  SceneFrame,
  SolanaSurface,
  SupplyMarketSurface,
  LifecycleSurface,
} from "../components/BorealSurface";
import {VIDEO_FPS, type SceneId, type VideoVariant} from "../data/video-variants";

export type BorealFilmProps = {
  variant: VideoVariant;
};

type SceneRenderer = React.FC<FilmSceneProps>;

const sceneRegistry: Record<SceneId, SceneRenderer> = {
  "intent-disappears": ({scene, sceneCount, sceneIndex, variant}) => (
    <SceneFrame
      notes={[
        "Search finds information, but it does not route work.",
        "Chat generates text, but it often does not create accountable execution.",
      ]}
      scene={scene}
      sceneCount={sceneCount}
      sceneIndex={sceneIndex}
      variant={variant}
    >
      <ProblemPulseSurface accent={variant.accent} />
    </SceneFrame>
  ),
  "missing-layer": ({scene, sceneCount, sceneIndex, variant}) => (
    <SceneFrame
      notes={[
        "Use the real homepage language as proof of category position.",
        "The UI should feel like infrastructure, not a chatbot skin.",
      ]}
      scene={scene}
      sceneCount={sceneCount}
      sceneIndex={sceneIndex}
      variant={variant}
    >
      <HomepageSurface accent={variant.accent} />
    </SceneFrame>
  ),
  "chat-to-workspace": ({scene, sceneCount, sceneIndex, variant}) => (
    <SceneFrame
      notes={[
        "Natural language in. Structured work out.",
        "Requests, approvals, and execution paths stay reviewable.",
      ]}
      scene={scene}
      sceneCount={sceneCount}
      sceneIndex={sceneIndex}
      variant={variant}
    >
      <ChatWorkspaceSurface accent={variant.accent} />
    </SceneFrame>
  ),
  "real-supply": ({scene, sceneCount, sceneIndex, variant}) => (
    <SceneFrame
      notes={[
        "Boreal is a market surface, not a private assistant thread.",
        "Profiles, supply cards, and request discovery make the network legible.",
      ]}
      scene={scene}
      sceneCount={sceneCount}
      sceneIndex={sceneIndex}
      variant={variant}
    >
      <SupplyMarketSurface accent={variant.accent} />
    </SceneFrame>
  ),
  "proposal-delivery": ({scene, sceneCount, sceneIndex, variant}) => (
    <SceneFrame
      notes={[
        "The request persists until the outcome is delivered and reviewed.",
        "That auditability is what lets the market improve over time.",
      ]}
      scene={scene}
      sceneCount={sceneCount}
      sceneIndex={sceneIndex}
      variant={variant}
    >
      <LifecycleSurface accent={variant.accent} />
    </SceneFrame>
  ),
  "direct-fulfillment": ({scene, sceneCount, sceneIndex, variant}) => (
    <SceneFrame
      notes={[
        "Known supply can resolve directly inside the product surface.",
        "Market routing and instant fulfillment can coexist in one flow.",
      ]}
      scene={scene}
      sceneCount={sceneCount}
      sceneIndex={sceneIndex}
      variant={variant}
    >
      <FulfillmentSurface accent={variant.accent} />
    </SceneFrame>
  ),
  "solana-fit": ({scene, sceneCount, sceneIndex, variant}) => (
    <SceneFrame
      notes={[
        "Stay honest about shipped alpha versus next-layer architecture.",
        "Tie Solana to real product needs: speed, trust, and economic coordination.",
      ]}
      scene={scene}
      sceneCount={sceneCount}
      sceneIndex={sceneIndex}
      variant={variant}
    >
      <SolanaSurface accent={variant.accent} />
    </SceneFrame>
  ),
  "missing-piece": ({scene, sceneCount, sceneIndex, variant}) => (
    <SceneFrame
      notes={[
        "This scene doubles as the reusable marketing close.",
        "Keep the category line strong enough to stand alone in short cuts.",
      ]}
      scene={scene}
      sceneCount={sceneCount}
      sceneIndex={sceneIndex}
      variant={variant}
    >
      <ClosingMontageSurface accent={variant.accent} />
    </SceneFrame>
  ),
};

export const BorealFilm: React.FC<BorealFilmProps> = ({variant}) => {
  let from = 0;

  return (
    <AbsoluteFill
      style={{
        background: "#071115",
        color: "#f8fafc",
        overflow: "hidden",
      }}
    >
      <BorealBackdrop accent={variant.accent} />

      {variant.scenes.map((scene, sceneIndex) => {
        const durationInFrames = scene.durationInSeconds * VIDEO_FPS;
        const SceneComponent = sceneRegistry[scene.id];
        const sequenceFrom = from;
        from += durationInFrames;

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

      <FilmOverlay variant={variant} />
    </AbsoluteFill>
  );
};
