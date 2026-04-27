import type { ChatUiContext } from "@/lib/boreal/schemas/chat";
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
const supplyOnboardingPattern =
  /\b(publish my skills|publish.*(skills|services|products)|supply listing|list my (skills|services|products)|public worker profile|worker profile|profile update|package my capabilities|package my skills|match me to relevant requests|set up a strong supply listing|help me set up.*listing|help me publish.*(services|products|skills))\b/i;
const lowSignalConversationPattern =
  /^(hi|hello|hey|yo|sup|gm|good morning|good afternoon|good evening|thanks|thank you|thx|ok|okay|cool|nice|sounds good|all good|test|ping)[!. ]*$/i;
const informationalQuestionPattern =
  /\b(what is|what's|how does|how do|can you explain|explain|tell me about|who is|where is|why does|why is|what can you do)\b/i;

export function refineIntentForRequestLifecycle(
  intent: IntentExtraction,
  message: string,
  uiContext?: ChatUiContext,
): IntentExtraction {
  const text = buildIntentText(intent, message);
  const supplyOnboarding = isLikelySupplyOnboardingRequest(text);
  const likelyDeliverable = isLikelyDeliverableRequest(text);
  const workerLed = isLikelyWorkerLedRequest(text);
  const textOnly = isTextOnlyIntent(intent.requestedOutputTypes);

  if (shouldStayDirect(text, intent, uiContext)) {
    return {
      ...intent,
      intentType: "informational",
      missingDetails: [],
      needsClarification: false,
      requestedOutputTypes: ["text"],
      persistence: {
        ...intent.persistence,
        isUnresolved: false,
        reason: "Handled as direct chat guidance.",
        shouldPersist: false,
      },
      responseInstructions:
        uiContext?.surface === "request"
          ? "Reply directly inside the current request thread. Do not open a new request."
          : "Reply directly in chat. Do not open a tracked request unless the user clearly asks for work to be opened.",
      routeTarget:
        intent.routeTarget === "catalog_lookup" ? "catalog_lookup" : "general_assistance",
      routing: {
        ...intent.routing,
        resolutionTier: "fast",
        shouldCreateFulfillmentRequest: false,
        shouldPersistToBoard: false,
      },
      shouldSearchCatalog:
        intent.routeTarget === "catalog_lookup" ? intent.shouldSearchCatalog : false,
      suggestedReplies: intent.suggestedReplies.slice(0, 4),
    };
  }

  if (supplyOnboarding && textOnly) {
    return {
      ...intent,
      intentType: "supply",
      missingDetails: [],
      needsClarification: false,
      persistence: {
        ...intent.persistence,
        isUnresolved: true,
        reason: "Tracked as a profile and supply onboarding request.",
        shouldPersist: true,
      },
      responseInstructions:
        "Do not answer inline as a generic request. Prepare an editable profile and supply builder. Let the user fill it manually or approve Boreal to draft it from their brief.",
      routeTarget: "profile_update",
      routing: {
        ...intent.routing,
        resolutionTier: "auto",
        shouldCreateFulfillmentRequest: true,
        shouldPersistToBoard: true,
      },
      shouldSearchCatalog: false,
      suggestedReplies: Array.from(
        new Set([
          ...intent.suggestedReplies,
          "Draft my profile and first listing",
          "Open the builder form",
          "I offer services",
          "I sell digital products",
        ]),
      ).slice(0, 4),
    };
  }

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
    intent.routeTarget === "profile_update" ||
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

function isLikelySupplyOnboardingRequest(text: string) {
  return supplyOnboardingPattern.test(text);
}

function shouldStayDirect(
  text: string,
  intent: IntentExtraction,
  uiContext?: ChatUiContext,
) {
  if (uiContext?.surface === "request") {
    return true;
  }

  if (lowSignalConversationPattern.test(text.trim())) {
    return true;
  }

  if (
    informationalQuestionPattern.test(text) &&
    !isLikelyDeliverableRequest(text) &&
    !isLikelyWorkerLedRequest(text) &&
    !isLikelySupplyOnboardingRequest(text) &&
    isTextOnlyIntent(intent.requestedOutputTypes)
  ) {
    return true;
  }

  return false;
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
