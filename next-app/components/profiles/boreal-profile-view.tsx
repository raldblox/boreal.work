"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import {
  ArrowUpRightIcon,
  BotIcon,
  Clock3Icon,
  ShieldCheckIcon,
  StarIcon,
  WorkflowIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import type { BorealAgentStats } from "@/lib/boreal/integrations/convex/function-refs";
import { cn } from "@/lib/utils";

const capabilities = [
  "Intent extraction",
  "Proposal drafting",
  "Chat collaboration",
  "Catalog matching",
  "Image generation",
  "Speech generation",
  "Video orchestration",
  "Request tracking",
];

type BorealProfileViewProps = {
  showProfileLink?: boolean;
  stats: BorealAgentStats | undefined;
};

export function BorealProfileView({
  showProfileLink = true,
  stats,
}: BorealProfileViewProps) {
  const peakActivity = Math.max(...(stats?.activityBuckets.map((bucket) => bucket.count) ?? [0]), 1);

  return (
    <div className="relative min-h-full overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0 opacity-50">
        <div className="absolute inset-x-0 top-0 h-56 bg-[radial-gradient(circle_at_top_left,hsl(173_58%_46%/.12),transparent_55%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(135deg,hsl(var(--border))_1px,transparent_1px),linear-gradient(45deg,hsl(var(--border))_1px,transparent_1px)] bg-[size:120px_120px] opacity-[0.08]" />
      </div>

      <div className="relative z-10 flex min-h-full flex-col">
        <div className="border-b border-border px-6 py-6">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
            <div className="space-y-4">
              <div className="inline-flex size-16 items-center justify-center border border-teal-500/30 text-teal-700 shadow-[0_0_0_1px_rgba(13,148,136,0.12),0_0_28px_rgba(13,148,136,0.08)] dark:text-teal-300">
                <BotIcon className="size-7" />
              </div>
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-3xl font-medium tracking-tight">Boreal Agent</h2>
                  <span className="inline-flex items-center border border-teal-500/30 px-2 py-1 text-[11px] uppercase tracking-[0.16em] text-teal-700 dark:text-teal-300">
                    Active collaborator
                  </span>
                </div>
                <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                  Boreal is the system operator for request-first work. It drafts intent,
                  coordinates approvals, collaborates in thread, and fulfills supported tasks
                  directly when the workspace allows it.
                </p>
                <div className="flex flex-wrap gap-2">
                  {capabilities.map((item) => (
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
                <MetricCard
                  accent="teal"
                  icon={StarIcon}
                  label="Average rating"
                  value={stats?.averageRating ? stats.averageRating.toFixed(1) : "No ratings"}
                />
                <MetricCard
                  accent="emerald"
                  icon={ShieldCheckIcon}
                  label="Fulfilled"
                  value={String(stats?.fulfilledCount ?? 0)}
                />
                <MetricCard
                  accent="amber"
                  icon={WorkflowIcon}
                  label="Active"
                  value={String(stats?.activeCount ?? 0)}
                />
                <MetricCard
                  accent="sky"
                  icon={Clock3Icon}
                  label="Avg delivery"
                  value={
                    typeof stats?.averageCompletionHours === "number"
                      ? `${stats.averageCompletionHours.toFixed(1)}h`
                      : "Pending"
                  }
                />
              </div>
              {showProfileLink ? (
                <Button asChild className="w-full" type="button" variant="outline">
                  <Link href="/p/boreal-agent">
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
            <Panel title="Activity load" subtitle="Recent handled requests across the last 10 days.">
              <div className="grid grid-cols-10 gap-2">
                {(stats?.activityBuckets ?? []).map((bucket) => (
                  <div className="space-y-2" key={bucket.label}>
                    <div className="flex h-40 items-end">
                      <div
                        className="w-full border border-teal-500/30 bg-teal-500/10 transition-all"
                        style={{
                          height: `${Math.max(14, Math.round((bucket.count / peakActivity) * 100))}%`,
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
            <Panel title="Status mix" subtitle="What Boreal is currently balancing across workspaces.">
              <div className="space-y-3">
                <DistributionRow
                  label="Awaiting approval / work"
                  value={stats?.openCount ?? 0}
                  accent="bg-slate-500/30"
                  total={stats?.totalHandledCount ?? 0}
                />
                <DistributionRow
                  label="Active in flight"
                  value={stats?.activeCount ?? 0}
                  accent="bg-teal-500/40"
                  total={stats?.totalHandledCount ?? 0}
                />
                <DistributionRow
                  label="Blocked"
                  value={stats?.blockedCount ?? 0}
                  accent="bg-amber-500/40"
                  total={stats?.totalHandledCount ?? 0}
                />
                <DistributionRow
                  label="Fulfilled"
                  value={stats?.fulfilledCount ?? 0}
                  accent="bg-emerald-500/40"
                  total={stats?.totalHandledCount ?? 0}
                />
              </div>
            </Panel>

            <Panel title="Profile footprint" subtitle="Built-in analytics linked directly to Boreal as an active system actor.">
              <div className="grid gap-3 sm:grid-cols-2">
                <MetricCard
                  accent="teal"
                  icon={WorkflowIcon}
                  label="Requests touched"
                  value={String(stats?.requestCount ?? 0)}
                />
                <MetricCard
                  accent="emerald"
                  icon={ShieldCheckIcon}
                  label="Listings linked"
                  value={String(stats?.supplyCount ?? 0)}
                />
                <MetricCard
                  accent="amber"
                  icon={Clock3Icon}
                  label="Proposals seen"
                  value={String(stats?.totalProposalCount ?? 0)}
                />
                <MetricCard
                  accent="sky"
                  icon={StarIcon}
                  label="Recorded reviews"
                  value={String(stats?.reviewCount ?? 0)}
                />
              </div>
            </Panel>

            <Panel title="Operations notes" subtitle="Use Boreal where orchestration matters most.">
              <div className="space-y-3 text-sm text-muted-foreground">
                <Insight
                  label="Best for"
                  value="Request drafting, approvals, direct tool fulfillment, and threaded collaboration."
                />
                <Insight
                  label="Not ideal for"
                  value="Requests that clearly need a human specialist or a proposal-led assignment before work starts."
                />
                <Insight
                  label="Review coverage"
                  value={`${stats?.reviewCount ?? 0} completed requests have explicit ratings recorded.`}
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

function Insight({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="border border-border p-3">
      <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
      <p className="mt-2 leading-6">{value}</p>
    </div>
  );
}

function StatusChip({ status }: { status: string }) {
  const tone =
    status === "fulfilled"
      ? "border-emerald-500/30 text-emerald-700 dark:text-emerald-300"
      : status === "blocked"
        ? "border-amber-500/30 text-amber-700 dark:text-amber-300"
        : status === "claimed" || status === "in_progress"
          ? "border-teal-500/30 text-teal-700 dark:text-teal-300"
          : "border-border text-muted-foreground";

  return (
    <span className={cn("inline-flex items-center border px-2 py-1 text-[11px] uppercase tracking-[0.16em]", tone)}>
      {status.replaceAll("_", " ")}
    </span>
  );
}

function formatProfileDate(timestamp: number) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(timestamp);
}
