"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import {
  BriefcaseBusinessIcon,
  ExternalLinkIcon,
  Layers3Icon,
  PackageIcon,
  UserIcon,
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
  const profile = detail.profile;

  return (
    <div className={cn("flex min-h-0 flex-col border border-border", className)}>
      <div className="border-b border-border p-5">
        <div className="flex items-start gap-4">
          <Avatar className="size-14">
            {profile.avatarUrl ? (
              <AvatarImage alt={profile.displayName} src={profile.avatarUrl} />
            ) : null}
            <AvatarFallback>
              <UserIcon className="size-5" />
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-medium">{profile.displayName}</h2>
              <AvailabilityPill status={profile.availabilityStatus} />
              {!profile.isPublic ? (
                <span className="inline-flex items-center border border-border px-2 py-1 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                  private
                </span>
              ) : null}
            </div>
            {profile.handle ? (
              <p className="text-sm text-muted-foreground">@{profile.handle}</p>
            ) : null}
            {profile.headline ? <p className="text-sm">{profile.headline}</p> : null}
            {profile.bio ? (
              <p className="text-sm leading-6 text-muted-foreground">{profile.bio}</p>
            ) : null}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {actions}
          {showProfileLink ? (
            <Button asChild size="sm" type="button" variant="outline">
              <Link href={`/p/${profile._id}`}>
                <ExternalLinkIcon />
                Open profile
              </Link>
            </Button>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 p-5 xl:grid-cols-2">
        <ProfileSection
          icon={Layers3Icon}
          items={profile.capabilityTags}
          title="Capabilities"
        />
        <ProfileSection
          icon={BriefcaseBusinessIcon}
          items={profile.skillTags}
          title="Skills"
        />
        <ProfileSection
          icon={PackageIcon}
          items={profile.productLabels}
          title="Products"
        />

        <div className="space-y-3 border border-border p-4">
          <div className="flex items-center gap-2">
            <PackageIcon className="size-4 text-muted-foreground" />
            <p className="text-sm font-medium">Supply entries</p>
          </div>
          {detail.supplies.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              No public supply entries yet.
            </p>
          ) : (
            <div className="space-y-2">
              {detail.supplies.map((supply) => (
                <div className="border border-border p-3" key={supply._id}>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium">{supply.title}</p>
                    <span className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                      {supply.supplyType.replaceAll("_", " ")}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{supply.description}</p>
                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                    <span>{supply.category}</span>
                    {"deliveryType" in supply && supply.deliveryType ? (
                      <span>{supply.deliveryType}</span>
                    ) : null}
                    <span>{formatPrice(supply.priceAmount, supply.priceType)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ProfileSection({
  icon: Icon,
  items,
  title,
}: {
  icon: typeof Layers3Icon;
  items: string[];
  title: string;
}) {
  return (
    <div className="space-y-3 border border-border p-4">
      <div className="flex items-center gap-2">
        <Icon className="size-4 text-muted-foreground" />
        <p className="text-sm font-medium">{title}</p>
      </div>
      {items.length === 0 ? (
        <p className="text-xs text-muted-foreground">Nothing listed yet.</p>
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

function AvailabilityPill({
  status,
}: {
  status: "available" | "limited" | "unavailable";
}) {
  const tone =
    status === "available"
      ? "border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
      : status === "limited"
        ? "border-amber-500/30 text-amber-600 dark:text-amber-400"
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
