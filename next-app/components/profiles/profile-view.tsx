"use client";

import type { ReactNode } from "react";
import Link from "next/link";
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
} from "lucide-react";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import type { WorkerProfileDetail } from "@/lib/boreal/integrations/convex/function-refs";
import { cn } from "@/lib/utils";

type ProfileViewProps = {
  actions?: ReactNode;
  className?: string;
  detail: NonNullable<WorkerProfileDetail>;
  showProfileLink?: boolean;
};

export function ProfileView({
  actions,
  className,
  detail,
  showProfileLink = true,
}: ProfileViewProps) {
  const { analytics, profile, supplies } = detail;
  const ActorIcon = profile.actorKind === "agent" ? BotIcon : UserIcon;
  const activeSupplyCount = supplies.filter((supply) => supply.status === "active").length;
  const productSupplyCount = supplies.filter((supply) => supply.supplyType === "product").length;
  const taxonomyCount =
    new Set([
      ...profile.capabilityTags,
      ...profile.skillTags,
      ...profile.productLabels,
    ]).size;
  const supplyMix = [
    {
      count: supplies.filter((supply) => supply.supplyType === "product").length,
      label: "Products",
    },
    {
      count: supplies.filter((supply) => supply.supplyType === "capability").length,
      label: "Capabilities",
    },
    {
      count: supplies.filter((supply) => supply.supplyType === "collective").length,
      label: "Collectives",
    },
    {
      count: supplies.filter((supply) => supply.supplyType === "agent_tool").length,
      label: "Agent tools",
    },
  ];
  const peakSupplyMix = Math.max(...supplyMix.map((item) => item.count), 1);
  const peakActivity = Math.max(
    ...(analytics.activityBuckets.map((bucket) => bucket.count) ?? [0]),
    1,
  );

  return (
    <div
      className={cn(
        "relative min-h-full overflow-hidden bg-background text-foreground",
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-0 opacity-45">
        <div className="absolute inset-x-0 top-0 h-56 bg-[radial-gradient(circle_at_top_left,hsl(173_58%_46%/.09),transparent_58%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(135deg,hsl(var(--border))_1px,transparent_1px),linear-gradient(45deg,hsl(var(--border))_1px,transparent_1px)] bg-[size:120px_120px] opacity-[0.06]" />
      </div>

      <div className="relative z-10 flex min-h-full flex-col">
        <div className="border-b border-border px-6 py-6">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
            <div className="flex items-start gap-4">
              <Avatar className="size-20 border border-border/80">
                {profile.avatarUrl ? (
                  <AvatarImage alt={profile.displayName} src={profile.avatarUrl} />
                ) : null}
                <AvatarFallback className="bg-transparent">
                  <ActorIcon className="size-7" />
                </AvatarFallback>
              </Avatar>

              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-3xl font-medium tracking-tight">{profile.displayName}</h2>
                  <AvailabilityPill status={profile.availabilityStatus} />
                  <ActorPill kind={profile.actorKind} />
                  {!profile.isPublic ? (
                    <span className="inline-flex items-center border border-border px-2 py-1 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
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
              <MetricCard
                accent="teal"
                icon={StarIcon}
                label="Average rating"
                value={
                  analytics.averageRating
                    ? analytics.averageRating.toFixed(1)
                    : "No ratings"
                }
              />
              <MetricCard
                accent="emerald"
                icon={ShieldCheckIcon}
                label="Fulfilled"
                value={String(analytics.fulfilledCount)}
              />
              <MetricCard
                accent="amber"
                icon={WorkflowIcon}
                label="Active"
                value={String(analytics.activeCount)}
              />
              <MetricCard
                accent="sky"
                icon={Clock3Icon}
                label="Avg delivery"
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
            <Panel
              subtitle="Recent proposals, accepted work, and fulfillment updates across the last 10 days."
              title="Activity load"
            >
              <div className="grid grid-cols-10 gap-2">
                {analytics.activityBuckets.map((bucket) => (
                  <div className="space-y-2" key={bucket.label}>
                    <div className="flex h-40 items-end">
                      <div
                        className="w-full border border-teal-500/25 bg-teal-500/10"
                        style={{
                          height: `${Math.max(
                            14,
                            Math.round((bucket.count / peakActivity) * 100),
                          )}%`,
                        }}
                      />
                    </div>
                    <div className="space-y-1 text-center">
                      <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                        {bucket.label}
                      </p>
                      <p className="text-sm font-medium">{bucket.count}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Panel>

            <Panel
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
                    <div className="space-y-3 border border-border/90 p-4" key={request._id}>
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
                            className="inline-flex items-center border border-border px-2 py-1 text-[11px] uppercase tracking-[0.16em] text-muted-foreground"
                            key={`${request._id}-${type}`}
                          >
                            {type.replaceAll("_", " ")}
                          </span>
                        ))}
                      </div>
                      <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                        Updated {formatProfileDate(request.updatedAt)}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </Panel>
          </div>

          <div className="space-y-4">
            <Panel
              subtitle="How this profile is currently distributed across proposals and execution."
              title="Status mix"
            >
              <div className="space-y-3">
                <DistributionRow
                  accent="bg-slate-500/30"
                  label="Awaiting approval"
                  total={analytics.totalHandledCount}
                  value={analytics.openCount}
                />
                <DistributionRow
                  accent="bg-teal-500/40"
                  label="In flight"
                  total={analytics.totalHandledCount}
                  value={analytics.activeCount}
                />
                <DistributionRow
                  accent="bg-amber-500/40"
                  label="Blocked"
                  total={analytics.totalHandledCount}
                  value={analytics.blockedCount}
                />
                <DistributionRow
                  accent="bg-emerald-500/40"
                  label="Fulfilled"
                  total={analytics.totalHandledCount}
                  value={analytics.fulfilledCount}
                />
              </div>
            </Panel>

            <Panel
              subtitle="How this profile is packaged for search and discovery right now."
              title="Market packaging"
            >
              <div className="grid grid-cols-4 gap-3">
                {supplyMix.map((item) => (
                  <div className="space-y-2" key={item.label}>
                    <div className="flex h-28 items-end">
                      <div
                        className="w-full border border-teal-500/25 bg-teal-500/10"
                        style={{
                          height: `${Math.max(
                            12,
                            Math.round((item.count / peakSupplyMix) * 100),
                          )}%`,
                        }}
                      />
                    </div>
                    <div className="space-y-1 text-center">
                      <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
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
            </Panel>

            <Panel
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
                    <div className="space-y-3 border border-border/90 p-4" key={supply._id}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <p className="text-sm font-medium">{supply.title}</p>
                          <p className="line-clamp-2 text-sm text-muted-foreground">
                            {supply.description}
                          </p>
                        </div>
                        <StatusChip status={supply.status} />
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-2 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                        <span>{supply.category}</span>
                        <span>{supply.supplyType.replaceAll("_", " ")}</span>
                        {supply.deliveryType ? <span>{supply.deliveryType}</span> : null}
                        <span>{formatPrice(supply.priceAmount, supply.priceType)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Panel>

            <Panel
              subtitle="Key signals Boreal can use when matching new work to this profile."
              title="Operator notes"
            >
              <div className="space-y-3 text-sm text-muted-foreground">
                <Insight
                  label="Best fit"
                  value={
                    profile.capabilityTags.length > 0
                      ? profile.capabilityTags.slice(0, 3).join(", ")
                      : "General market participation"
                  }
                />
                <Insight
                  label="Discovery coverage"
                  value={
                    taxonomyCount > 0
                      ? `${taxonomyCount} public capability, skill, and product signals are available for search.`
                      : "This profile still needs structured metadata for stronger discovery."
                  }
                />
                <Insight
                  label="Market readiness"
                  value={
                    supplies.length > 0
                      ? `${activeSupplyCount} active listings, ${productSupplyCount} product entries, and ${analytics.reviewCount} recorded reviews.`
                      : "No public listings yet. Publish supply before expecting strong matching."
                  }
                />
              </div>
            </Panel>
          </div>
        </div>
      </div>
    </div>
  );
}

function Panel({
  children,
  subtitle,
  title,
}: {
  children: ReactNode;
  subtitle: string;
  title: string;
}) {
  return (
    <section className="space-y-4 border border-border/90 bg-background/90 p-4 backdrop-blur-sm">
      <div className="space-y-1">
        <p className="text-lg font-medium tracking-tight">{title}</p>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </div>
      {children}
    </section>
  );
}

function MetricCard({
  accent,
  icon: Icon,
  label,
  value,
}: {
  accent: "amber" | "emerald" | "sky" | "teal";
  icon: typeof StarIcon;
  label: string;
  value: string;
}) {
  const tone =
    accent === "teal"
      ? "border-teal-500/30 text-teal-700 dark:text-teal-300"
      : accent === "emerald"
        ? "border-emerald-500/30 text-emerald-700 dark:text-emerald-300"
        : accent === "amber"
          ? "border-amber-500/30 text-amber-700 dark:text-amber-300"
          : "border-sky-500/30 text-sky-700 dark:text-sky-300";

  return (
    <div className={cn("space-y-2 border p-3", tone)}>
      <div className="flex items-center gap-2">
        <Icon className="size-4" />
        <span className="text-[11px] uppercase tracking-[0.16em]">{label}</span>
      </div>
      <p className="text-xl font-medium tracking-tight">{value}</p>
    </div>
  );
}

function DistributionRow({
  accent,
  label,
  total,
  value,
}: {
  accent: string;
  label: string;
  total: number;
  value: number;
}) {
  const width = total > 0 ? Math.max(6, Math.round((value / total) * 100)) : 6;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span>{label}</span>
        <span className="text-muted-foreground">{value}</span>
      </div>
      <div className="h-3 border border-border p-0.5">
        <div className={cn("h-full", accent)} style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

function TaxonomyPanel({
  icon: Icon,
  items,
  title,
}: {
  icon: typeof Layers3Icon;
  items: string[];
  title: string;
}) {
  return (
    <div className="space-y-3 border border-border p-3">
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
  );
}

function Insight({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="border border-border p-3">
      <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 leading-6">{value}</p>
    </div>
  );
}

function ActorPill({
  kind,
}: {
  kind: "agent" | "human" | "tool";
}) {
  const label =
    kind === "agent" ? "Agent profile" : kind === "tool" ? "Tool profile" : "Human profile";

  return (
    <span className="inline-flex items-center border border-border px-2 py-1 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
      {label}
    </span>
  );
}

function AvailabilityPill({
  status,
}: {
  status: "available" | "limited" | "unavailable";
}) {
  const tone =
    status === "available"
      ? "border-emerald-500/30 text-emerald-700 dark:text-emerald-300"
      : status === "limited"
        ? "border-amber-500/30 text-amber-700 dark:text-amber-300"
        : "border-border text-muted-foreground";

  return (
    <span
      className={cn(
        "inline-flex items-center border px-2 py-1 text-[11px] uppercase tracking-[0.16em]",
        tone,
      )}
    >
      {status.replaceAll("_", " ")}
    </span>
  );
}

function StatusChip({ status }: { status: string }) {
  const tone =
    status === "active" || status === "fulfilled" || status === "accepted"
      ? "border-emerald-500/30 text-emerald-700 dark:text-emerald-300"
      : status === "claimed" || status === "in_progress"
        ? "border-teal-500/30 text-teal-700 dark:text-teal-300"
        : status === "blocked"
          ? "border-amber-500/30 text-amber-700 dark:text-amber-300"
          : "border-border text-muted-foreground";

  return (
    <span
      className={cn(
        "inline-flex items-center border px-2 py-1 text-[11px] uppercase tracking-[0.16em]",
        tone,
      )}
    >
      {status.replaceAll("_", " ")}
    </span>
  );
}

function formatPrice(amount: number | null, priceType: string) {
  if (amount === null) {
    return priceType.replaceAll("_", " ");
  }

  return `${amount} ${priceType.replaceAll("_", " ")}`;
}

function formatProfileDate(timestamp: number) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(timestamp);
}
