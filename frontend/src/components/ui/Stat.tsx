"use client";

import type { ReactNode } from "react";

import cn from "@/lib/cn";

type StatTrend = "up" | "down" | "neutral";

interface StatProps {
  label: string;
  value: string | number;
  trend?: StatTrend;
  trendValue?: string;
  icon?: ReactNode;
  className?: string;
}

const trendClasses: Record<StatTrend, string> = {
  up: "text-success",
  down: "text-error",
  neutral: "text-fg-muted",
};

export function Stat({
  label,
  value,
  trend,
  trendValue,
  icon,
  className,
}: StatProps) {
  return (
    <div
      className={cn(
        "surface-glass relative overflow-hidden p-6",
        className
      )}
    >
      {icon ? (
        <div className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-lg bg-brand-soft text-brand-primary">
          {icon}
        </div>
      ) : null}

      <div className="pr-14">
        <p className="text-xs font-semibold uppercase tracking-widest text-fg-tertiary">
          {label}
        </p>
        <p className="mt-3 text-3xl font-bold font-display text-fg-primary">
          {value}
        </p>
        {trendValue ? (
          <p
            className={cn(
              "mt-3 text-sm font-medium",
              trend ? trendClasses[trend] : trendClasses.neutral
            )}
          >
            {trendValue}
          </p>
        ) : null}
      </div>
    </div>
  );
}
