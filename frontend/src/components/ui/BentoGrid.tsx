"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

interface BentoGridProps {
  children: ReactNode;
  className?: string;
  cols?: 2 | 3 | 4;
}

interface BentoCardProps {
  children: ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg" | "wide" | "tall";
}

const gridCols = {
  2: "lg:grid-cols-2",
  3: "lg:grid-cols-3",
  4: "lg:grid-cols-4",
} as const;

const cardSizes = {
  sm: "col-span-1 row-span-1",
  md: "col-span-1 md:col-span-2 row-span-1",
  lg: "col-span-1 md:col-span-2 row-span-2",
  wide: "col-span-full row-span-1",
  tall: "col-span-1 row-span-2",
} as const;

export function BentoGrid({
  children,
  className,
  cols = 3,
}: BentoGridProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-4 md:grid-cols-2",
        gridCols[cols],
        className
      )}
    >
      {children}
    </div>
  );
}

export function BentoCard({
  children,
  className,
  size = "sm",
}: BentoCardProps) {
  return (
    <div
      className={cn(
        "surface-glass relative overflow-hidden p-6",
        cardSizes[size],
        className
      )}
    >
      {children}
    </div>
  );
}
