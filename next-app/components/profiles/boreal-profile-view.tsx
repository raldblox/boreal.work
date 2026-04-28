"use client"

import Link from "next/link"
import {
  ArrowUpRightIcon,
  BotIcon,
  Clock3Icon,
  ShieldCheckIcon,
  StarIcon,
  WorkflowIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  formatProfileDate,
  getRequestStatusTone,
  SurfaceDistributionRow,
  SurfaceInsight,
  SurfaceMetricCard,
  SurfacePanel,
  SurfacePill,
} from "@/components/profiles/profile-surface"
import {
  BOREAL_AGENT_BIO,
  BOREAL_AGENT_CAPABILITY_TAGS,
  BOREAL_AGENT_DISPLAY_NAME,
} from "@/lib/boreal/boreal-agent"
import type { BorealAgentStats } from "@/lib/boreal/integrations/convex/function-refs"
import { buildProfileSheetHref } from "@/lib/boreal/navigation/shell-links"

type BorealProfileViewProps = {
  showProfileLink?: boolean
  stats: BorealAgentStats | undefined
}

export function BorealProfileView({
  showProfileLink = true,
  stats,
}: BorealProfileViewProps) {
  const peakActivity = Math.max(
    ...(stats?.activityBuckets.map((bucket) => bucket.count) ?? [0]),
    1
  )

  return (
    <div className="relative min-h-full overflow-hidden bg-background text-foreground">
      <div className="relative z-10 flex min-h-full flex-col">
        <div className="border-b border-border px-6 py-6">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
            <div className="space-y-4">
              <div className="inline-flex size-16 items-center justify-center rounded-2xl border border-primary/30 bg-primary/10 text-primary shadow-[0_18px_38px_-30px_rgba(8,145,178,0.45)]">
                <BotIcon className="size-7" />
              </div>
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-heading text-3xl font-medium tracking-tight">
                    {BOREAL_AGENT_DISPLAY_NAME}
                  </h2>
                  <SurfacePill tone="brand">Active collaborator</SurfacePill>
                </div>
                <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                  {BOREAL_AGENT_BIO}
                </p>
                <div className="flex flex-wrap gap-2">
                  {BOREAL_AGENT_CAPABILITY_TAGS.map((item) => (
                    <span
                      className="inline-flex items-center border border-border/80 px-2 py-1 text-xs text-muted-foreground"
                      key={item}
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-3 xl:w-[22rem]">
              <div className="grid grid-cols-2 gap-3">
                <SurfaceMetricCard
                  icon={StarIcon}
                  label="Average rating"
                  tone="brand"
                  value={
                    stats?.averageRating
                      ? stats.averageRating.toFixed(1)
                      : "No ratings"
                  }
                />
                <SurfaceMetricCard
                  icon={ShieldCheckIcon}
                  label="Fulfilled"
                  tone="success"
                  value={String(stats?.fulfilledCount ?? 0)}
                />
                <SurfaceMetricCard
                  icon={WorkflowIcon}
                  label="Active"
                  tone="warm"
                  value={String(stats?.activeCount ?? 0)}
                />
                <SurfaceMetricCard
                  icon={Clock3Icon}
                  label="Avg delivery"
                  tone="info"
                  value={
                    typeof stats?.averageCompletionHours === "number"
                      ? `${stats.averageCompletionHours.toFixed(1)}h`
                      : "Pending"
                  }
                />
              </div>
              {showProfileLink ? (
                <Button
                  asChild
                  className="w-full"
                  type="button"
                  variant="outline"
                >
                  <Link href={buildProfileSheetHref("boreal-agent")}>
                    View full profile
                    <ArrowUpRightIcon />
                  </Link>
                </Button>
              ) : null}
            </div>
          </div>
        </div>

        <div className="grid flex-1 gap-4 px-6 py-6 xl:grid-cols-[1.25fr_0.9fr]">
          <div className="space-y-4">
            <SurfacePanel
              title="Activity load"
              subtitle="Recent handled requests across the last 10 days."
            >
              <div className="grid grid-cols-10 gap-2">
                {(stats?.activityBuckets ?? []).map((bucket) => (
                  <div className="space-y-2" key={bucket.label}>
                    <div className="flex h-40 items-end">
                      <div
                        className="w-full rounded-full border border-primary/25 bg-primary/15 transition-[height]"
                        style={{
                          height: `${Math.max(14, Math.round((bucket.count / peakActivity) * 100))}%`,
                        }}
                      />
                    </div>
                    <div className="space-y-1 text-center">
                      <p className="text-[11px] tracking-[0.12em] text-muted-foreground uppercase">
                        {bucket.label}
                      </p>
                      <p className="text-sm font-medium">{bucket.count}</p>
                    </div>
                  </div>
                ))}
              </div>
            </SurfacePanel>

            <SurfacePanel
              title="Recent work"
              subtitle="Latest requests handled or currently being worked by Boreal."
            >
              <div className="grid gap-3 lg:grid-cols-2">
                {(stats?.recentRequests ?? []).length === 0 ? (
                  <div className="border border-border p-4 text-sm text-muted-foreground">
                    No Boreal-handled request history yet.
                  </div>
                ) : (
                  stats?.recentRequests.map((request) => (
                    <div
                      className="space-y-3 border border-border/90 p-4"
                      key={request._id}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <p className="text-sm font-medium">{request.title}</p>
                          <p className="line-clamp-2 text-sm text-muted-foreground">
                            {request.summary}
                          </p>
                        </div>
                        <StatusChip status={request.status} />
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {request.requestedOutputTypes.map((type) => (
                          <span
                            className="inline-flex items-center border border-border px-2 py-1 text-[11px] tracking-[0.16em] text-muted-foreground uppercase"
                            key={`${request._id}-${type}`}
                          >
                            {type.replaceAll("_", " ")}
                          </span>
                        ))}
                      </div>
                      <p className="text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
                        Updated {formatProfileDate(request.updatedAt)}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </SurfacePanel>
          </div>

          <div className="space-y-4">
            <SurfacePanel
              title="Status mix"
              subtitle="What Boreal is currently balancing across workspaces."
            >
              <div className="space-y-3">
                <SurfaceDistributionRow
                  label="Awaiting approval / work"
                  total={stats?.totalHandledCount ?? 0}
                  tone="neutral"
                  value={stats?.openCount ?? 0}
                />
                <SurfaceDistributionRow
                  label="Active in flight"
                  total={stats?.totalHandledCount ?? 0}
                  tone="brand"
                  value={stats?.activeCount ?? 0}
                />
                <SurfaceDistributionRow
                  label="Blocked"
                  total={stats?.totalHandledCount ?? 0}
                  tone="warm"
                  value={stats?.blockedCount ?? 0}
                />
                <SurfaceDistributionRow
                  label="Fulfilled"
                  total={stats?.totalHandledCount ?? 0}
                  tone="success"
                  value={stats?.fulfilledCount ?? 0}
                />
              </div>
            </SurfacePanel>

            <SurfacePanel
              title="Profile footprint"
              subtitle="Built-in analytics linked directly to Boreal as an active system actor."
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <SurfaceMetricCard
                  icon={WorkflowIcon}
                  label="Requests touched"
                  tone="brand"
                  value={String(stats?.requestCount ?? 0)}
                />
                <SurfaceMetricCard
                  icon={ShieldCheckIcon}
                  label="Listings linked"
                  tone="success"
                  value={String(stats?.supplyCount ?? 0)}
                />
                <SurfaceMetricCard
                  icon={Clock3Icon}
                  label="Proposals seen"
                  tone="warm"
                  value={String(stats?.totalProposalCount ?? 0)}
                />
                <SurfaceMetricCard
                  icon={StarIcon}
                  label="Recorded reviews"
                  tone="info"
                  value={String(stats?.reviewCount ?? 0)}
                />
              </div>
            </SurfacePanel>

            <SurfacePanel
              title="Operations notes"
              subtitle="Use Boreal where orchestration matters most."
            >
              <div className="space-y-3 text-sm text-muted-foreground">
                <SurfaceInsight
                  label="Best for"
                  value="Request drafting, approvals, direct tool fulfillment, and threaded collaboration."
                />
                <SurfaceInsight
                  label="Not ideal for"
                  value="Requests that clearly need a human specialist or a proposal-led assignment before work starts."
                />
                <SurfaceInsight
                  label="Review coverage"
                  value={`${stats?.reviewCount ?? 0} completed requests have explicit ratings recorded.`}
                />
              </div>
            </SurfacePanel>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatusChip({ status }: { status: string }) {
  return (
    <SurfacePill tone={getRequestStatusTone(status)}>
      {status.replaceAll("_", " ")}
    </SurfacePill>
  )
}
