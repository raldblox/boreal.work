import assert from "node:assert/strict";

import {
  buildAutoReopenForWorkersCopy,
  shouldAutoReopenRequestForWorkers,
} from "../lib/boreal/request-recovery.ts";

const genericFailure = "Provider execution failed after automatic retries.";
const videoAccessFailure =
  "OpenAI video route is unavailable for the current project or API key. Boreal called POST /v1/videos for model sora-2, but OpenAI returned 404 Invalid URL (POST /platform/video_gen). This usually means the current OpenAI project does not have Sora video access enabled yet.";

assert.equal(
  shouldAutoReopenRequestForWorkers("general_assistance", genericFailure),
  true,
  "general assistance requests should reopen for workers after automatic failure",
);
assert.equal(
  shouldAutoReopenRequestForWorkers("image_generation", genericFailure),
  true,
  "image generation requests should reopen for workers after automatic failure",
);
assert.equal(
  shouldAutoReopenRequestForWorkers("speech_generation", genericFailure),
  true,
  "speech generation requests should reopen for workers after automatic failure",
);
assert.equal(
  shouldAutoReopenRequestForWorkers("video_generation", genericFailure),
  true,
  "video generation requests should reopen for workers after automatic failure",
);
assert.equal(
  shouldAutoReopenRequestForWorkers("profile_update", genericFailure),
  false,
  "profile update should stay on the dedicated profile-builder recovery path",
);
assert.equal(
  shouldAutoReopenRequestForWorkers("clarification", genericFailure),
  false,
  "clarification routes should stay in-thread instead of reopening to workers",
);
assert.equal(
  shouldAutoReopenRequestForWorkers("catalog_lookup", genericFailure),
  false,
  "catalog lookups are informational and should not reopen to workers automatically",
);

const videoCopy = buildAutoReopenForWorkersCopy({
  assignedAgent: "Video Generation",
  message: videoAccessFailure,
  routeTarget: "video_generation",
});

assert.match(
  videoCopy.assistantMessage,
  /reopened this request for workers immediately/i,
  "video provider-access failures should say the request reopened immediately",
);

const generalCopy = buildAutoReopenForWorkersCopy({
  assignedAgent: "Startup Pressure Test",
  message: genericFailure,
  routeTarget: "general_assistance",
});

assert.match(
  generalCopy.approvalMessage,
  /reopened this request for workers/i,
  "general automatic failures should reopen for workers",
);
assert.match(
  generalCopy.assistantMessage,
  /approve a team instead of waiting on the blocked route/i,
  "general automatic failures should push the owner toward team approval",
);

console.log("smoke:request-recovery passed");
