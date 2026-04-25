import {Composition, Folder} from "remotion";

import {
  HACKATHON_PITCH,
  LAUNCH_CUT,
  TECHNICAL_DEMO,
  getDurationInFrames,
  VIDEO_FPS,
  VIDEO_HEIGHT,
  VIDEO_WIDTH,
} from "./data/video-variants";
import {
  BorealTimelineComposition,
  type BorealTimelineCompositionProps,
} from "./scenes/BorealTimelineComposition";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Folder name="Boreal-Demo">
        <Composition
          id="HackathonPitch3Min"
          component={BorealTimelineComposition}
          defaultProps={
            {
              variant: HACKATHON_PITCH,
            } satisfies BorealTimelineCompositionProps
          }
          durationInFrames={getDurationInFrames(HACKATHON_PITCH)}
          fps={VIDEO_FPS}
          height={VIDEO_HEIGHT}
          width={VIDEO_WIDTH}
        />
        <Composition
          id="LaunchCut90Sec"
          component={BorealTimelineComposition}
          defaultProps={
            {
              variant: LAUNCH_CUT,
            } satisfies BorealTimelineCompositionProps
          }
          durationInFrames={getDurationInFrames(LAUNCH_CUT)}
          fps={VIDEO_FPS}
          height={VIDEO_HEIGHT}
          width={VIDEO_WIDTH}
        />
        <Composition
          id="TechnicalDemo150Sec"
          component={BorealTimelineComposition}
          defaultProps={
            {
              variant: TECHNICAL_DEMO,
            } satisfies BorealTimelineCompositionProps
          }
          durationInFrames={getDurationInFrames(TECHNICAL_DEMO)}
          fps={VIDEO_FPS}
          height={VIDEO_HEIGHT}
          width={VIDEO_WIDTH}
        />
      </Folder>
    </>
  );
};
