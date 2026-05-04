"use client";

import { cn } from "@/lib/cn";

interface NoiseTextureProps {
  className?: string;
  opacity?: number;
}

export function NoiseTexture({
  className,
  opacity = 0.3,
}: NoiseTextureProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "noise-overlay pointer-events-none absolute inset-0 z-0",
        className
      )}
      style={{ opacity }}
    />
  );
}
