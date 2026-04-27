import assert from "node:assert/strict";

import {
  DEFAULT_BOREAL_VIDEO_SECONDS,
  DEFAULT_BOREAL_VIDEO_SIZE,
  resolveVideoRequestSettings,
} from "../lib/boreal/media/video-contract.ts";
import { normalizeIntentExtraction } from "../lib/boreal/schemas/intent.ts";

const defaultVideo = resolveVideoRequestSettings({
  message: "Can you generate me a sad cat video?",
});

assert.equal(defaultVideo.seconds, DEFAULT_BOREAL_VIDEO_SECONDS);
assert.equal(defaultVideo.size, DEFAULT_BOREAL_VIDEO_SIZE);
assert.equal(defaultVideo.invalidDetails.length, 0);

const blankRawVideo = resolveVideoRequestSettings({
  message: "Can you generate me a sad cat video?",
  rawSeconds: "",
  rawSize: "",
});

assert.equal(blankRawVideo.seconds, DEFAULT_BOREAL_VIDEO_SECONDS);
assert.equal(blankRawVideo.size, DEFAULT_BOREAL_VIDEO_SIZE);
assert.equal(blankRawVideo.invalidDetails.length, 0);

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

const normalizedVideoIntent = normalizeIntentExtraction(
  {
    body: "Generate me a sad cat video.",
    intentType: "demand",
    needsClarification: true,
    missingDetails: [
      "video duration",
      "video resolution or format",
      "style or specific content preferences",
    ],
    requestedOutputTypes: ["video_generation"],
    routeTarget: "clarification",
    summary: "Request to create a sad cat video.",
    title: "Sad cat video",
    videoSeconds: "",
    videoSize: "",
  },
  "Generate me a sad cat video.",
  [{ kind: "video_generation", score: 0.99 }],
);

assert.equal(normalizedVideoIntent.routeTarget, "video_generation");
assert.equal(normalizedVideoIntent.needsClarification, false);
assert.deepEqual(normalizedVideoIntent.missingDetails, []);
assert.equal(normalizedVideoIntent.videoSeconds, DEFAULT_BOREAL_VIDEO_SECONDS);
assert.equal(normalizedVideoIntent.videoSize, DEFAULT_BOREAL_VIDEO_SIZE);

const underspecifiedVideoIntent = normalizeIntentExtraction(
  {
    body: "Generate me a video.",
    intentType: "demand",
    requestedOutputTypes: ["video_generation"],
    routeTarget: "clarification",
    summary: "Request to generate a video.",
    title: "Video generation",
    videoSeconds: "",
    videoSize: "",
  },
  "Generate me a video.",
  [{ kind: "video_generation", score: 0.99 }],
);

assert.equal(underspecifiedVideoIntent.routeTarget, "clarification");
assert.equal(underspecifiedVideoIntent.needsClarification, true);
assert.match(
  underspecifiedVideoIntent.missingDetails.join("\n"),
  /what should the video show/i,
);

console.log(
  JSON.stringify(
    {
      blankRawDefaultsBlocked: blankRawVideo.invalidDetails.length > 0,
      defaultSeconds: defaultVideo.seconds,
      defaultSize: defaultVideo.size,
      invalidDurationBlocked: invalidDuration.invalidDetails.length > 0,
      normalizedMissingDetails: normalizedVideoIntent.missingDetails.length,
      normalizedRouteTarget: normalizedVideoIntent.routeTarget,
      portraitSize: portraitVideo.size,
      underspecifiedVideoNeedsClarification:
        underspecifiedVideoIntent.needsClarification,
    },
    null,
    2,
  ),
);
