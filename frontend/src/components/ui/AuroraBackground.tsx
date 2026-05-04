"use client";

import { cn } from "@/lib/cn";

interface AuroraBackgroundProps {
  className?: string;
}

export function AuroraBackground({ className }: AuroraBackgroundProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "aurora-bg noise-overlay pointer-events-none fixed inset-0 z-[-1]",
        className
      )}
    />
  );
}
