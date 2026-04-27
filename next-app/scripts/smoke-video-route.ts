import assert from "node:assert/strict";

import {
  DEFAULT_BOREAL_VIDEO_SECONDS,
  DEFAULT_BOREAL_VIDEO_SIZE,
  resolveVideoRequestSettings,
} from "../lib/boreal/media/video-contract.ts";

const defaultVideo = resolveVideoRequestSettings({
  message: "Can you generate me a sad cat video?",
});

assert.equal(defaultVideo.seconds, DEFAULT_BOREAL_VIDEO_SECONDS);
assert.equal(defaultVideo.size, DEFAULT_BOREAL_VIDEO_SIZE);
assert.equal(defaultVideo.invalidDetails.length, 0);

const portraitVideo = resolveVideoRequestSettings({
  message: "Generate a vertical sad cat video for reels.",
});

assert.equal(portraitVideo.size, "720x1280");
assert.equal(portraitVideo.invalidDetails.length, 0);

const invalidDuration = resolveVideoRequestSettings({
  message: "Generate a 6 second sad cat video.",
});

assert.equal(invalidDuration.seconds, DEFAULT_BOREAL_VIDEO_SECONDS);
assert.match(
  invalidDuration.invalidDetails.join("\n"),
  /4, 8, or 12 seconds/i,
);

const invalidSize = resolveVideoRequestSettings({
  message: "Generate a sad cat video at 1920x1080.",
});

assert.equal(invalidSize.size, DEFAULT_BOREAL_VIDEO_SIZE);
assert.match(
  invalidSize.invalidDetails.join("\n"),
  /720x1280, 1280x720, 1024x1792, or 1792x1024/i,
);

console.log(
  JSON.stringify(
    {
      defaultSeconds: defaultVideo.seconds,
      defaultSize: defaultVideo.size,
      invalidDurationBlocked: invalidDuration.invalidDetails.length > 0,
      portraitSize: portraitVideo.size,
    },
    null,
    2,
  ),
);
