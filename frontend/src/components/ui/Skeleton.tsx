"use client";

import { cn } from "@/lib/cn";

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "rounded-xl bg-gradient-to-r from-white/0 via-white/8 to-white/0 bg-[length:200%_100%] animate-[shimmer_2s_linear_infinite]",
        className
      )}
    />
  );
}

export function SkeletonText({ className }: SkeletonProps) {
  return <Skeleton className={cn("h-4 w-3/4", className)} />;
}

export function SkeletonCard({ className }: SkeletonProps) {
  return <Skeleton className={cn("h-32 w-full", className)} />;
}
