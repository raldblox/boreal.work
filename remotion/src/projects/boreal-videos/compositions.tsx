import React from "react";
import {Composition, Folder} from "remotion";

import {
  FPS,
  HEIGHT,
  WIDTH,
} from "../../generations/home-chat-accurate-2026/theme";
import {
  PITCH_VIDEO_DEFAULT_PROPS,
  PITCH_VIDEO_DURATION,
  PitchVideo,
  type PitchVideoProps,
} from "./PitchVideo";

export const BorealVideosCompositions: React.FC = () => {
  return (
    <Folder name="Boreal-Videos">
      <Composition
        id="PitchVideo"
        component={PitchVideo}
        defaultProps={PITCH_VIDEO_DEFAULT_PROPS satisfies PitchVideoProps}
        durationInFrames={PITCH_VIDEO_DURATION}
        fps={FPS}
        height={HEIGHT}
        width={WIDTH}
      />
    </Folder>
  );
};
