import {Composition, Folder} from "remotion";

import {
  FEATURE_VARIANTS,
  getDurationInFrames,
  SHORT_VARIANTS,
  VIDEO_FPS,
  VIDEO_HEIGHT,
  VIDEO_WIDTH,
} from "./data/video-variants";
import {BorealFilm, type BorealFilmProps} from "./compositions/BorealFilm";
import {BorealTruthful2026Compositions} from "./generations/request-native-2026/compositions";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Folder name="Boreal-Film">
        {FEATURE_VARIANTS.map((variant) => (
          <Composition
            id={variant.compositionId}
            component={BorealFilm}
            defaultProps={
              {
                variant,
              } satisfies BorealFilmProps
            }
            durationInFrames={getDurationInFrames(variant)}
            fps={VIDEO_FPS}
            height={VIDEO_HEIGHT}
            key={variant.compositionId}
            width={VIDEO_WIDTH}
          />
        ))}
      </Folder>

      <Folder name="Boreal-Shorts">
        {SHORT_VARIANTS.map((variant) => (
          <Composition
            id={variant.compositionId}
            component={BorealFilm}
            defaultProps={
              {
                variant,
              } satisfies BorealFilmProps
            }
            durationInFrames={getDurationInFrames(variant)}
            fps={VIDEO_FPS}
            height={VIDEO_HEIGHT}
            key={variant.compositionId}
            width={VIDEO_WIDTH}
          />
        ))}
      </Folder>

      <BorealTruthful2026Compositions />
    </>
  );
};
