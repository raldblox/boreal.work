"use client"

import type {
  RequestDetail,
  SidebarIntentPreview,
} from "@/lib/boreal/integrations/convex/function-refs"

export type RequestNotificationTab = "activity" | "participants" | "workspace"
export type RequestNavigationView = "chat" | RequestNotificationTab

export type RequestNotificationCounts = Record<RequestNotificationTab, number>

const emptyCounts: RequestNotificationCounts = {
  activity: 0,
  participants: 0,
  workspace: 0,
}

export function getPreviewRequestNotificationCounts(
  intent: SidebarIntentPreview
): RequestNotificationCounts {
  const participants = intent.participants.filter(
    (participant) => participant.status !== "owner"
  ).length
  const workspace =
    intent.status === "fulfilled" && intent.reviewRating === null ? 1 : 0
  const activity =
    intent.status === "claimed" || intent.status === "in_progress" ? 1 : 0

  return {
    activity,
    participants,
    workspace,
  }
}

export function getDetailRequestNotificationCounts(
  requestDetail: RequestDetail | null
): RequestNotificationCounts {
  if (!requestDetail?.intent) {
    return emptyCounts
  }

  const participants = (requestDetail.participants ?? []).filter(
    (participant) => participant.status !== "owner"
  ).length
  const submittedProposals = requestDetail.access?.canApproveProposals
    ? requestDetail.proposals.filter(
        (proposal) => proposal.status === "submitted"
      ).length
    : 0
  const deliveryAction =
    requestDetail.access?.canSubmitWork &&
    requestDetail.fulfillment?.acceptedProposalId &&
    requestDetail.fulfillment.status !== "fulfilled"
      ? 1
      : 0
  const workspace =
    submittedProposals +
    deliveryAction +
    (requestDetail.intent.status === "proposed" ? 1 : 0) +
    (requestDetail.intent.status === "open" ? 1 : 0) +
    (requestDetail.intent.status === "blocked" ? 1 : 0) +
    (requestDetail.intent.reviewPending ? 1 : 0)
  const activity = Math.min(requestDetail.activity.length, 9)

  return {
    activity,
    participants,
    workspace,
  }
}

export function getRequestNotificationTotal(counts: RequestNotificationCounts) {
  return counts.activity + counts.participants + counts.workspace
}

export function getPositiveRequestNotificationTabs(
  counts: RequestNotificationCounts
) {
  return (Object.entries(counts) as Array<[RequestNotificationTab, number]>)
    .filter(([, count]) => count > 0)
    .map(([tab]) => tab)
}

export function getDefaultRequestNavigationView(
  counts: RequestNotificationCounts
): RequestNavigationView {
  const positiveTabs = getPositiveRequestNotificationTabs(counts)

  if (positiveTabs.length === 1) {
    return positiveTabs[0]
  }

  return "chat"
}

export function formatNotificationCount(count: number) {
  return count > 9 ? "9+" : `${count}`
}
