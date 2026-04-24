import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";

import type { ChatUiContext } from "@/lib/boreal/schemas/chat";

const characterPath = path.resolve(process.cwd(), "..", "CHARACTER.md");

let cachedCharacterDoc: Promise<string> | null = null;

export async function buildBorealSystemPrompt(uiContext?: ChatUiContext) {
  const doc = await loadCharacterDoc();
  const baseCharacter = extractSectionCodeBlock(doc, "## BASE CHARACTER");
  const contextKey = pickCharacterContextKey(uiContext);
  const contextBlock = extractSectionCodeBlock(doc, `### ${contextKey}`);

  return [
    baseCharacter ||
      "You are Boreal. Move requests toward resolution with direct, minimal language.",
    contextBlock || "",
    buildUiSnapshot(uiContext),
    "TOOL GRANTS",
    "- You may explain, route, compare, draft, and summarize.",
    "- Do not pretend a proposal, approval, or fulfillment has been submitted if no mutation has run.",
    "- Use the current UI state as a hard constraint for how you behave.",
  ]
    .filter(Boolean)
    .join("\n\n");
}

export function buildIntentRoutingHint(uiContext?: ChatUiContext) {
  if (!uiContext) {
    return "No UI context was provided.";
  }

  const lines = [
    `UI surface: ${uiContext.surface}`,
    `UI focus: ${pickCharacterContextKey(uiContext)}`,
    `Center tab: ${uiContext.centerTab ?? "none"}`,
    `Directory tab: ${uiContext.browseTab ?? "none"}`,
    `Request role: ${uiContext.requestRole ?? "none"}`,
    `Request status: ${uiContext.requestStatus ?? "none"}`,
  ];

  if (
    (uiContext.centerTab === "proposals" || uiContext.centerTab === "workspace") &&
    uiContext.canSubmitProposal
  ) {
    lines.push(
      "In proposal mode for a supplier. Prefer helping draft or refine a proposal instead of creating a new request.",
    );
  }

  if (
    (uiContext.centerTab === "proposals" || uiContext.centerTab === "workspace") &&
    uiContext.canApproveProposals
  ) {
    lines.push(
      "In proposal review mode for an owner. Prefer comparison, approval reasoning, or revision guidance instead of intake.",
    );
  }

  if (
    uiContext.surface === "request" &&
    (uiContext.centerTab === "workers" || uiContext.centerTab === "participants")
  ) {
    lines.push(
      "The user is reviewing worker participation for an existing request. Prefer matching, proposal, or assignment guidance.",
    );
  }

  return lines.join("\n");
}

function buildUiSnapshot(uiContext?: ChatUiContext) {
  if (!uiContext) {
    return "";
  }

  return [
    "UI SNAPSHOT",
    `- surface: ${uiContext.surface}`,
    `- center tab: ${uiContext.centerTab ?? "none"}`,
    `- directory tab: ${uiContext.browseTab ?? "none"}`,
    `- request role: ${uiContext.requestRole ?? "none"}`,
    `- request status: ${uiContext.requestStatus ?? "none"}`,
    `- can submit proposal: ${uiContext.canSubmitProposal ? "yes" : "no"}`,
    `- can approve proposals: ${uiContext.canApproveProposals ? "yes" : "no"}`,
  ].join("\n");
}

function pickCharacterContextKey(uiContext?: ChatUiContext) {
  if (!uiContext) {
    return "CTX-01";
  }

  if (
    (uiContext.centerTab === "proposals" || uiContext.centerTab === "workspace") &&
    uiContext.canSubmitProposal
  ) {
    return "CTX-05";
  }

  if (
    (uiContext.centerTab === "proposals" || uiContext.centerTab === "workspace") &&
    uiContext.canApproveProposals
  ) {
    return "CTX-04";
  }

  if (
    uiContext.surface === "request" &&
    uiContext.requestRole === "supplier" &&
    (uiContext.requestStatus === "claimed" || uiContext.requestStatus === "in_progress")
  ) {
    return "CTX-06";
  }

  if (
    uiContext.surface === "request" &&
    uiContext.requestRole === "owner" &&
    uiContext.requestStatus === "fulfilled"
  ) {
    return "CTX-07";
  }

  if (
    uiContext.surface === "request" &&
    uiContext.requestRole === "owner" &&
    (uiContext.requestStatus === "open" || uiContext.requestStatus === "proposed")
  ) {
    return "CTX-02";
  }

  return "CTX-01";
}

async function loadCharacterDoc() {
  if (!cachedCharacterDoc) {
    cachedCharacterDoc = readFile(characterPath, "utf8").catch(() => "");
  }

  return cachedCharacterDoc;
}

function extractSectionCodeBlock(markdown: string, heading: string) {
  const start = markdown.indexOf(heading);

  if (start === -1) {
    return "";
  }

  const fromHeading = markdown.slice(start);
  const firstFence = fromHeading.indexOf("```");

  if (firstFence === -1) {
    return "";
  }

  const afterFirstFence = fromHeading.slice(firstFence + 3);
  const secondFence = afterFirstFence.indexOf("```");

  if (secondFence === -1) {
    return "";
  }

  return afterFirstFence.slice(0, secondFence).trim();
}
