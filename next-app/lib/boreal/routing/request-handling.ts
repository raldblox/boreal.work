import type { IntentExtraction, RequestedOutputType } from "@/lib/boreal/schemas/intent";

type RequestHandlingIntent = {
  body: string;
  capabilityTags?: string[];
  category: string;
  keywords?: string[];
  missingDetails: string[];
  needsClarification: boolean;
  requestedOutputTypes: RequestedOutputType[];
  routeTarget: IntentExtraction["routeTarget"];
  routing?: {
    shouldCreateFulfillmentRequest: boolean;
  };
  shouldSearchCatalog: boolean;
  suggestedReplies?: string[];
  summary: string;
  title: string;
};

export type RequestHandlingMode = "boreal" | "clarify" | "direct" | "workers";

const deliverableVerbPattern =
  /\b(help me make|help me create|help me write|help me build|can someone help|can someone make|can someone create|need help making|need help creating|make me|create me|write me|prepare|put together|draft|build)\b/i;

const deliverableNounPattern =
  /\b(tutorial|guide|explainer|lesson|course|article|post|script|outline|deck|presentation|landing page|copy|brief|proposal|plan|website|web app|app|product page|workflow|agent|bot)\b/i;

const workerLedPattern =
  /\b(website|web app|app|mobile app|frontend|backend|full[- ]stack|landing page|design system|dashboard|api integration|automation|smart contract|marketplace|platform|saas)\b/i;

const audiencePattern =
  /\b(beginner|kids|student|students|teacher|teachers|technical|engineer|developer|parent|marketing|sales|founder|operator)\b/i;

const scopePattern =
  /\b(short|long|detailed|step[- ]by[- ]step|deep|overview|full lesson|3[- ]minute|5[- ]minute|one[- ]page)\b/i;

const formatPattern =
  /\b(tutorial|guide|article|lesson|script|outline|deck|presentation|slides|blog post|thread|video script|email|prompt)\b/i;

export function refineIntentForRequestLifecycle(
  intent: IntentExtraction,
  message: string,
): IntentExtraction {
  const text = buildIntentText(intent, message);
  const likelyDeliverable = isLikelyDeliverableRequest(text);
  const workerLed = isLikelyWorkerLedRequest(text);
  const textOnly = isTextOnlyIntent(intent.requestedOutputTypes);

  if (!likelyDeliverable || !textOnly) {
    return intent;
  }

  const missingDetails = mergeMissingDetails(
    intent.missingDetails,
    inferDeliverableClarifications(text),
  );
  const needsClarification = missingDetails.length > 0;

  return {
    ...intent,
    intentType: "demand",
    missingDetails,
    needsClarification,
    persistence: {
      ...intent.persistence,
      isUnresolved: needsClarification,
      reason: workerLed
        ? "Tracked as a worker-led request."
        : "Tracked as a Boreal-handled text deliverable request.",
      shouldPersist: true,
    },
    responseInstructions: workerLed
      ? "Do not fulfill inline. Treat this as a tracked request, gather clarification when needed, and open it for worker proposals after approval."
      : "Do not answer inline right away. Treat this as a tracked text-deliverable request, gather missing scope details, then wait for approval before generating the final output.",
    routeTarget: needsClarification ? "clarification" : intent.routeTarget,
    routing: {
      ...intent.routing,
      resolutionTier: workerLed ? "open" : intent.routing.resolutionTier,
      shouldCreateFulfillmentRequest: true,
      shouldPersistToBoard: true,
    },
    shouldSearchCatalog: intent.shouldSearchCatalog || workerLed,
    suggestedReplies: buildSuggestedReplies(intent.suggestedReplies, workerLed),
  };
}

export function getRequestHandlingMode(intent: RequestHandlingIntent): RequestHandlingMode {
  if (intent.needsClarification || intent.routeTarget === "clarification") {
    return "clarify";
  }

  if (
    intent.routeTarget === "catalog_lookup" ||
    intent.routeTarget === "image_generation" ||
    intent.routeTarget === "speech_generation" ||
    intent.routeTarget === "video_generation"
  ) {
    return "boreal";
  }

  const text = buildIntentText(intent);

  if (isLikelyWorkerLedRequest(text)) {
    return "workers";
  }

  if (
    isLikelyDeliverableRequest(text) ||
    intent.routing?.shouldCreateFulfillmentRequest
  ) {
    return "boreal";
  }

  return "direct";
}

export function getRequestHandlingLabel(mode: RequestHandlingMode) {
  switch (mode) {
    case "clarify":
      return "Clarify request";
    case "workers":
      return "Open for workers";
    case "boreal":
      return "Boreal Agent";
    default:
      return "Direct answer";
  }
}

function buildIntentText(intent: Partial<RequestHandlingIntent>, message = "") {
  return [message, intent.title, intent.summary, intent.body, intent.category, ...(intent.capabilityTags ?? []), ...(intent.keywords ?? [])]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function isLikelyDeliverableRequest(text: string) {
  return deliverableVerbPattern.test(text) || deliverableNounPattern.test(text);
}

function isLikelyWorkerLedRequest(text: string) {
  return workerLedPattern.test(text);
}

function isTextOnlyIntent(values: RequestedOutputType[]) {
  return values.length === 1 && values[0] === "text";
}

function inferDeliverableClarifications(text: string) {
  const questions: string[] = [];

  if (!formatPattern.test(text)) {
    questions.push(
      "What should the final format be: written tutorial, lesson outline, video script, slide deck, tutor prompt, or something else?",
    );
  } else {
    questions.push(
      "What should the outcome look like exactly: written tutorial, lesson outline, tutor flow, video script, or another format?",
    );
  }

  if (!audiencePattern.test(text)) {
    questions.push(
      "Who is this for: beginner, student, teacher, parent, or a technical audience?",
    );
  }

  if (!scopePattern.test(text)) {
    questions.push(
      "How detailed should it be: short overview, step-by-step tutorial, or full lesson?",
    );
  }

  return questions.slice(0, 3);
}

function mergeMissingDetails(current: string[], inferred: string[]) {
  return Array.from(new Set([...current, ...inferred])).slice(0, 4);
}

function buildSuggestedReplies(current: string[], workerLed: boolean) {
  const suggestions = [
    ...current,
    "Beginner written tutorial",
    "Step-by-step lesson outline",
    workerLed ? "Open it for proposals" : "Let Boreal draft it",
  ];

  return Array.from(new Set(suggestions)).slice(0, 4);
}
