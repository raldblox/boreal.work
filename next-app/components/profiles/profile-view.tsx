"use client"

import type { ReactNode } from "react"
import Link from "next/link"
import {
  ArrowUpRightIcon,
  BotIcon,
  BriefcaseBusinessIcon,
  Layers3Icon,
  PackageIcon,
  ShieldCheckIcon,
  UserIcon,
} from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  formatProfileDate,
  getAvailabilityTone,
  getRequestStatusTone,
  SurfaceInsight,
  SurfacePanel,
  SurfacePill,
} from "@/components/profiles/profile-surface"
import type { WorkerProfileDetail } from "@/lib/boreal/integrations/convex/function-refs"
import {
  getPublicReadySpecialistMetaByHandle,
} from "@/lib/boreal/agents/public-ready-specialists"
import { buildProfileSheetHref } from "@/lib/boreal/navigation/shell-links"
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
  const specialistMeta = getPublicReadySpecialistMetaByHandle(profile.handle)
  const ActorIcon = profile.actorKind === "agent" ? BotIcon : UserIcon
  const activeSupplyCount = supplies.filter(
    (supply) => supply.status === "active"
  ).length
  const requestFootprint = analytics.requestCount + analytics.totalProposalCount
  const displayName = specialistMeta?.displayName ?? profile.displayName
  const displayHeadline = specialistMeta?.headline ?? profile.headline
  const displayBio = specialistMeta?.profileBio ?? profile.bio

  return (
    <div
      className={cn(
        "relative min-h-full overflow-hidden bg-background text-foreground",
        className
      )}
    >
      <div className="relative z-10 flex min-h-full flex-col">
        <div className="border-b border-border px-6 py-6">
          <div className="flex items-start gap-4">
            <Avatar className="size-20 border border-border/80">
              {profile.avatarUrl ? (
                <AvatarImage alt={displayName} src={profile.avatarUrl} />
              ) : null}
              <AvatarFallback className="bg-transparent">
                <ActorIcon className="size-7" />
              </AvatarFallback>
            </Avatar>

            <div className="min-w-0 flex-1 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-3xl font-medium tracking-tight">
                  {displayName}
                </h2>
                <AvailabilityPill status={profile.availabilityStatus} />
                <ActorPill kind={profile.actorKind} />
                {!profile.isPublic ? (
                  <SurfacePill>Private</SurfacePill>
                ) : null}
                {specialistMeta ? (
                  <>
                    <SurfacePill tone="info">
                      {specialistMeta.providerCompany}
                    </SurfacePill>
                    <SurfacePill tone="info">{specialistMeta.model}</SurfacePill>
                  </>
                ) : null}
              </div>

              <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground">
                {profile.handle ? <span>@{profile.handle}</span> : null}
                {displayHeadline ? <span>{displayHeadline}</span> : null}
              </div>

              {displayBio ? (
                <p className="max-w-4xl text-sm leading-6 text-muted-foreground">
                  {displayBio}
                </p>
              ) : null}

              <div className="flex flex-wrap gap-2">
                {actions}
                {showProfileLink ? (
                  <Button asChild size="sm" type="button" variant="outline">
                    <Link href={buildProfileSheetHref(profile._id)}>
                      View full profile
                      <ArrowUpRightIcon />
                    </Link>
                  </Button>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4 px-6 py-6">
          {specialistMeta ? (
            <SurfacePanel
              subtitle="Current public runtime truth for this specialist."
              title="Runtime transparency"
            >
              <div className="grid gap-3 md:grid-cols-3">
                <SurfaceInsight
                  label="Provider"
                  value={specialistMeta.providerCompany}
                />
                <SurfaceInsight
                  label="Model"
                  value={specialistMeta.model}
                />
                <SurfaceInsight
                  label="Live scope"
                  value={specialistMeta.liveScope}
                />
              </div>
            </SurfacePanel>
          ) : null}

          <SurfacePanel
            subtitle="Only the signals that still help routing, trust, and public understanding."
            title="Profile summary"
          >
            <div className="grid gap-3 md:grid-cols-3">
              <SurfaceInsight
                label="Requests + proposals"
                value={String(requestFootprint)}
              />
              <SurfaceInsight
                label="Public offers"
                value={`${activeSupplyCount} active of ${supplies.length} total`}
              />
              <SurfaceInsight
                label="Reviews"
                value={String(analytics.reviewCount)}
              />
            </div>
          </SurfacePanel>

          <SurfacePanel
            subtitle="Capabilities and public tags Boreal can actually route from this profile."
            title="What this profile offers"
          >
            <div className="grid gap-3 lg:grid-cols-3">
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
            subtitle="Latest requests this profile has proposed on, worked on, or fulfilled."
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

          <SurfacePanel
            subtitle="Public offers still attached to this profile."
            title="Offers"
          >
            {supplies.length === 0 ? (
              <div className="border border-border p-4 text-sm text-muted-foreground">
                No public offers yet.
              </div>
            ) : (
              <div className="grid gap-3 lg:grid-cols-2">
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
      ? "Agent"
      : kind === "tool"
        ? "Tool"
        : "Human"

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
