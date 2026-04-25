import React from "react";
import {Player} from "@remotion/player";

import {
  BOREAL_DEMO_DURATION,
  BOREAL_LAUNCH_DURATION,
  BOREAL_UPDATE_DURATION,
  BorealDemo,
  BorealLaunch,
  BorealUpdate,
} from "./compositions";
import {FPS, HEIGHT, WIDTH} from "./theme";

const playerStyle = {
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 24,
  overflow: "hidden",
} as const;

export const BorealTruthPreview: React.FC = () => {
  return (
    <div
      style={{
        background: "#000",
        color: "#eff7f4",
        display: "grid",
        gap: 28,
        gridTemplateColumns: "1fr",
        padding: 28,
      }}
    >
      <Player
        autoPlay={false}
        component={BorealDemo}
        compositionHeight={HEIGHT}
        compositionWidth={WIDTH}
        controls
        durationInFrames={BOREAL_DEMO_DURATION}
        fps={FPS}
        inputProps={{ambientAudioSrc: null}}
        style={playerStyle}
      />
      <Player
        autoPlay={false}
        component={BorealUpdate}
        compositionHeight={HEIGHT}
        compositionWidth={WIDTH}
        controls
        durationInFrames={BOREAL_UPDATE_DURATION}
        fps={FPS}
        inputProps={{ambientAudioSrc: null, screenRecordingSrc: null}}
        style={playerStyle}
      />
      <Player
        autoPlay={false}
        component={BorealLaunch}
        compositionHeight={HEIGHT}
        compositionWidth={WIDTH}
        controls
        durationInFrames={BOREAL_LAUNCH_DURATION}
        fps={FPS}
        inputProps={{ambientAudioSrc: null}}
        style={playerStyle}
      />
    </div>
  );
};
