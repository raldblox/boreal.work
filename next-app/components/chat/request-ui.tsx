"use client";

import {
  CheckIcon,
  CircleDotIcon,
  Clock3Icon,
  PackageIcon,
  SearchIcon,
  SparklesIcon,
} from "lucide-react";

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export function getRequestStage(status: string) {
  if (status === "fulfilled") {
    return 3;
  }

  if (status === "claimed" || status === "in_progress" || status === "blocked") {
    return 2;
  }

  if (status === "proposed" || status === "open" || status === "closed") {
    return 1;
  }

  return 0;
}

export function getRequestStatusLabel(status: string) {
  if (status === "open") {
    return "Waiting room";
  }

  if (status === "proposed") {
    return "Awaiting approval";
  }

  if (status === "claimed") {
    return "Assigned";
  }

  if (status === "in_progress") {
    return "Working";
  }

  if (status === "blocked") {
    return "Blocked";
  }

  if (status === "fulfilled") {
    return "Delivered";
  }

  if (status === "closed") {
    return "Closed";
  }

  return status.replaceAll("_", " ");
}

export function RequestStatusBadge({
  status,
}: {
  status: string;
}) {
  const label = getRequestStatusLabel(status);
  const Icon =
    status === "fulfilled"
      ? CheckIcon
      : status === "claimed" || status === "in_progress"
        ? SparklesIcon
        : status === "proposed"
          ? Clock3Icon
          : CircleDotIcon;

  return (
    <span className="inline-flex items-center gap-1 border border-border px-2 py-1 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
      <Icon className="size-3" />
      {label}
    </span>
  );
}

export function RequestStageRail({
  status,
}: {
  status: string;
}) {
  const stage = getRequestStage(status);
  const stages = [
    { icon: SearchIcon, label: "Detect" },
    { icon: CheckIcon, label: "Approve" },
    { icon: SparklesIcon, label: "Work" },
    { icon: PackageIcon, label: "Deliver" },
  ] as const;
  const isWorking = status === "claimed" || status === "in_progress";

  return (
    <TooltipProvider>
      <div className="mt-3 w-full">
        <div className="grid w-full grid-cols-[auto_minmax(0,1fr)_auto_minmax(0,1fr)_auto_minmax(0,1fr)_auto] items-center gap-x-2">
          {stages.map((stageItem, index) => {
            const isComplete = index <= stage;
            const isCurrent = index === stage;
            const shouldPulse = isCurrent && index === 2 && isWorking;
            const Icon = stageItem.icon;

            return (
              <div className="contents" key={stageItem.label}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      aria-label={stageItem.label}
                      className={cn(
                        "flex size-6 items-center justify-center rounded-full border",
                        isComplete
                          ? "border-primary bg-foreground/80 text-background"
                          : "border-border bg-foreground/20 text-muted-foreground",
                        shouldPulse && "animate-pulse",
                      )}
                    >
                      <Icon className="size-3.5" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top" sideOffset={8}>
                    {stageItem.label}
                  </TooltipContent>
                </Tooltip>
                {index < stages.length - 1 ? (
                  <div
                    className={cn(
                      "h-0.5 w-full bg-border",
                      index < stage && "bg-foreground/80",
                    )}
                  />
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </TooltipProvider>
  );
}

export function formatRequestDate(value: number | null | undefined) {
  if (!value) {
    return null;
  }

  return new Date(value).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function formatOutputTypes(values: string[]) {
  return values.map((value) => value.replaceAll("_", " ")).join(" / ");
}
