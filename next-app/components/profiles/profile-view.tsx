"use client"

import type { ReactNode } from "react"
import Link from "next/link"
import {
  ArrowUpRightIcon,
  BotIcon,
  BriefcaseBusinessIcon,
  Clock3Icon,
  Layers3Icon,
  PackageIcon,
  ShieldCheckIcon,
  StarIcon,
  UserIcon,
  WorkflowIcon,
} from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  formatMoney,
  formatProfileDate,
  getAvailabilityTone,
  getRequestStatusTone,
  SurfaceDistributionRow,
  SurfaceInsight,
  SurfaceMetricCard,
  SurfacePanel,
  SurfacePill,
} from "@/components/profiles/profile-surface"
import type { WorkerProfileDetail } from "@/lib/boreal/integrations/convex/function-refs"
import { cn } from "@/lib/utils"

type ProfileViewProps = {
  actions?: ReactNode
  className?: string
  detail: NonNullable<WorkerProfileDetail>
  showProfileLink?: boolean
}

export function ProfileView({
  actions,
  className,
  detail,
  showProfileLink = true,
}: ProfileViewProps) {
  const { analytics, profile, supplies } = detail
  const ActorIcon = profile.actorKind === "agent" ? BotIcon : UserIcon
  const activeSupplyCount = supplies.filter(
    (supply) => supply.status === "active"
  ).length
  const productSupplyCount = supplies.filter(
    (supply) => supply.supplyType === "product"
  ).length
  const taxonomyCount = new Set([
    ...profile.capabilityTags,
    ...profile.skillTags,
    ...profile.productLabels,
  ]).size
  const supplyMix = [
    {
      count: supplies.filter((supply) => supply.supplyType === "product")
        .length,
      label: "Products",
    },
    {
      count: supplies.filter((supply) => supply.supplyType === "capability")
        .length,
      label: "Capabilities",
    },
    {
      count: supplies.filter((supply) => supply.supplyType === "collective")
        .length,
      label: "Collectives",
    },
    {
      count: supplies.filter((supply) => supply.supplyType === "agent_tool")
        .length,
      label: "Agent tools",
    },
  ]
  const peakSupplyMix = Math.max(...supplyMix.map((item) => item.count), 1)
  const peakActivity = Math.max(
    ...(analytics.activityBuckets.map((bucket) => bucket.count) ?? [0]),
    1
  )
  const requestFootprint = analytics.requestCount + analytics.totalProposalCount

  return (
    <div
      className={cn(
        "relative min-h-full overflow-hidden bg-background text-foreground",
        className
      )}
    >
      <div className="relative z-10 flex min-h-full flex-col">
        <div className="border-b border-border px-6 py-6">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
            <div className="flex items-start gap-4">
              <Avatar className="size-20 border border-border/80">
                {profile.avatarUrl ? (
                  <AvatarImage
                    alt={profile.displayName}
                    src={profile.avatarUrl}
                  />
                ) : null}
                <AvatarFallback className="bg-transparent">
                  <ActorIcon className="size-7" />
                </AvatarFallback>
              </Avatar>

              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-3xl font-medium tracking-tight">
                    {profile.displayName}
                  </h2>
                  <AvailabilityPill status={profile.availabilityStatus} />
                  <ActorPill kind={profile.actorKind} />
                  {!profile.isPublic ? (
                    <span className="inline-flex items-center border border-border px-2 py-1 text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
                      private
                    </span>
                  ) : null}
                </div>

                <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground">
                  {profile.handle ? <span>@{profile.handle}</span> : null}
                  {profile.headline ? <span>{profile.headline}</span> : null}
                </div>

                {profile.bio ? (
                  <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
                    {profile.bio}
                  </p>
                ) : null}

                <div className="flex flex-wrap gap-2">
                  {actions}
                  {showProfileLink ? (
                    <Button asChild size="sm" type="button" variant="outline">
                      <Link href={`/p/${profile._id}`}>
                        View full profile
                        <ArrowUpRightIcon />
                      </Link>
                    </Button>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="grid min-w-full grid-cols-2 gap-3 xl:min-w-[24rem]">
              <SurfaceMetricCard
                icon={StarIcon}
                label="Average rating"
                tone="brand"
                value={
                  analytics.averageRating
                    ? analytics.averageRating.toFixed(1)
                    : "No ratings"
                }
              />
              <SurfaceMetricCard
                icon={ShieldCheckIcon}
                label="Fulfilled"
                tone="success"
                value={String(analytics.fulfilledCount)}
              />
              <SurfaceMetricCard
                icon={WorkflowIcon}
                label="Active"
                tone="warm"
                value={String(analytics.activeCount)}
              />
              <SurfaceMetricCard
                icon={Clock3Icon}
                label="Avg delivery"
                tone="info"
                value={
                  typeof analytics.averageCompletionHours === "number"
                    ? `${analytics.averageCompletionHours.toFixed(1)}h`
                    : "Pending"
                }
              />
            </div>
          </div>
        </div>

        <div className="grid flex-1 gap-4 px-6 py-6 xl:grid-cols-[1.2fr_0.9fr]">
          <div className="space-y-4">
            <SurfacePanel
              subtitle="Recent proposals, accepted work, and fulfillment updates across the last 10 days."
              title="Activity load"
            >
              <div className="grid grid-cols-10 gap-2">
                {analytics.activityBuckets.map((bucket) => (
                  <div className="space-y-2" key={bucket.label}>
                    <div className="flex h-40 items-end">
                      <div
                        className="w-full rounded-full border border-primary/25 bg-primary/15"
                        style={{
                          height: `${Math.max(
                            14,
                            Math.round((bucket.count / peakActivity) * 100)
                          )}%`,
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
              subtitle="Latest requests this profile has proposed on, is working on, or has fulfilled."
              title="Recent work"
            >
              <div className="grid gap-3 lg:grid-cols-2">
                {analytics.recentRequests.length === 0 ? (
                  <div className="border border-border p-4 text-sm text-muted-foreground">
                    No request history yet.
                  </div>
                ) : (
                  analytics.recentRequests.map((request) => (
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
              subtitle="How this profile is currently distributed across proposals and execution."
              title="Status mix"
            >
              <div className="space-y-3">
                <SurfaceDistributionRow
                  label="Awaiting approval"
                  total={analytics.totalHandledCount}
                  tone="neutral"
                  value={analytics.openCount}
                />
                <SurfaceDistributionRow
                  label="In flight"
                  total={analytics.totalHandledCount}
                  tone="brand"
                  value={analytics.activeCount}
                />
                <SurfaceDistributionRow
                  label="Blocked"
                  total={analytics.totalHandledCount}
                  tone="warm"
                  value={analytics.blockedCount}
                />
                <SurfaceDistributionRow
                  label="Fulfilled"
                  total={analytics.totalHandledCount}
                  tone="success"
                  value={analytics.fulfilledCount}
                />
              </div>
            </SurfacePanel>

            <SurfacePanel
              subtitle="How this profile is packaged for search and discovery right now."
              title="Market packaging"
            >
              <div className="grid grid-cols-4 gap-3">
                {supplyMix.map((item) => (
                  <div className="space-y-2" key={item.label}>
                    <div className="flex h-28 items-end">
                      <div
                        className="w-full rounded-full border border-primary/25 bg-primary/15"
                        style={{
                          height: `${Math.max(
                            12,
                            Math.round((item.count / peakSupplyMix) * 100)
                          )}%`,
                        }}
                      />
                    </div>
                    <div className="space-y-1 text-center">
                      <p className="text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
                        {item.label}
                      </p>
                      <p className="text-sm font-medium">{item.count}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid gap-3 pt-2">
                <TaxonomyPanel
                  icon={Layers3Icon}
                  items={profile.capabilityTags}
                  title="Capabilities"
                />
                <TaxonomyPanel
                  icon={BriefcaseBusinessIcon}
                  items={profile.skillTags}
                  title="Skills"
                />
                <TaxonomyPanel
                  icon={PackageIcon}
                  items={profile.productLabels}
                  title="Products"
                />
              </div>
            </SurfacePanel>

            <SurfacePanel
              subtitle="Commercial activity and market participation already linked to this profile."
              title="Commerce footprint"
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <SurfaceMetricCard
                  icon={WorkflowIcon}
                  label="Requests + proposals"
                  tone="brand"
                  value={String(requestFootprint)}
                />
                <SurfaceMetricCard
                  icon={PackageIcon}
                  label="Listings + sales"
                  tone="success"
                  value={`${analytics.supplyCount} / ${analytics.sellerOrderCount}`}
                />
                <SurfaceMetricCard
                  icon={BriefcaseBusinessIcon}
                  label="Buyer spend"
                  tone="info"
                  value={formatMoney(analytics.grossSpend)}
                />
                <SurfaceMetricCard
                  icon={StarIcon}
                  label="Seller earned"
                  tone="warm"
                  value={formatMoney(analytics.grossEarned)}
                />
              </div>
            </SurfacePanel>

            <SurfacePanel
              subtitle="Most recent public supply entries available in the market."
              title="Recent listings"
            >
              {supplies.length === 0 ? (
                <div className="border border-border p-4 text-sm text-muted-foreground">
                  No public supply entries yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {supplies.slice(0, 6).map((supply) => (
                    <div
                      className="space-y-3 border border-border/90 p-4"
                      key={supply._id}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <p className="text-sm font-medium">{supply.title}</p>
                          <p className="line-clamp-2 text-sm text-muted-foreground">
                            {supply.description}
                          </p>
                        </div>
                        <StatusChip status={supply.status} />
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-2 text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
                        <span>{supply.category}</span>
                        <span>{supply.supplyType.replaceAll("_", " ")}</span>
                        {supply.deliveryType ? (
                          <span>{supply.deliveryType}</span>
                        ) : null}
                        <span>
                          {formatPrice(supply.priceAmount, supply.priceType)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </SurfacePanel>

            <SurfacePanel
              subtitle="Key signals Boreal can use when matching new work to this profile."
              title="Operator notes"
            >
              <div className="space-y-3 text-sm text-muted-foreground">
                <SurfaceInsight
                  label="Best fit"
                  value={
                    profile.capabilityTags.length > 0
                      ? profile.capabilityTags.slice(0, 3).join(", ")
                      : "General market participation"
                  }
                />
                <SurfaceInsight
                  label="Discovery coverage"
                  value={
                    taxonomyCount > 0
                      ? `${taxonomyCount} public capability, skill, and product signals are available for search.`
                      : "This profile still needs structured metadata for stronger discovery."
                  }
                />
                <SurfaceInsight
                  label="Market readiness"
                  value={
                    supplies.length > 0
                      ? `${activeSupplyCount} active listings, ${productSupplyCount} product entries, and ${analytics.reviewCount} recorded reviews.`
                      : "No public listings yet. Publish supply before expecting strong matching."
                  }
                />
              </div>
            </SurfacePanel>
          </div>
        </div>
      </div>
    </div>
  )
}

function TaxonomyPanel({
  icon: Icon,
  items,
  title,
}: {
  icon: typeof Layers3Icon
  items: string[]
  title: string
}) {
  return (
    <div className="space-y-3 rounded-xl border border-border p-3">
      <div className="flex items-center gap-2">
        <Icon className="size-4 text-muted-foreground" />
        <p className="text-sm font-medium">{title}</p>
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nothing listed yet.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {items.map((item) => (
            <span
              className="inline-flex items-center border border-border px-2 py-1 text-xs text-muted-foreground"
              key={item}
            >
              {item}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

function ActorPill({ kind }: { kind: "agent" | "human" | "tool" }) {
  const label =
    kind === "agent"
      ? "Agent profile"
      : kind === "tool"
        ? "Tool profile"
        : "Human profile"

  return <SurfacePill>{label}</SurfacePill>
}

function AvailabilityPill({
  status,
}: {
  status: "available" | "limited" | "unavailable"
}) {
  return (
    <SurfacePill tone={getAvailabilityTone(status)}>
      {status.replaceAll("_", " ")}
    </SurfacePill>
  )
}

function StatusChip({ status }: { status: string }) {
  return (
    <SurfacePill tone={getRequestStatusTone(status)}>
      {status.replaceAll("_", " ")}
    </SurfacePill>
  )
}

function formatPrice(amount: number | null, priceType: string) {
  if (amount === null) {
    return priceType.replaceAll("_", " ")
  }

  return `${amount} ${priceType.replaceAll("_", " ")}`
}
