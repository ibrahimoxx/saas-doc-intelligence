"use client";

import { cn } from "@/lib/cn";

interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizes: Record<string, string> = {
  sm: "w-5 h-5 border-2",
  md: "w-8 h-8 border-[3px]",
  lg: "w-12 h-12 border-[3px]",
};

export function LoadingSpinner({ size = "md", className }: SpinnerProps) {
  return (
    <div
      role="status"
      aria-label="Chargement…"
      className={cn(
        "rounded-full border-brand-primary/20 border-t-brand-primary animate-spin",
        sizes[size],
        className
      )}
    />
  );
}

export function PageLoader() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-bg-base gap-4">
      <div className="relative">
        <div className="w-16 h-16 rounded-full border-2 border-brand-primary/10 border-t-brand-primary animate-spin" />
        <div
          className="absolute inset-2 rounded-full border-2 border-brand-secondary/10 border-t-brand-secondary animate-spin"
          style={{ animationDirection: "reverse", animationDuration: "0.8s" }}
        />
      </div>
      <p className="text-fg-muted text-sm font-mono tracking-widest animate-pulse">
        CHARGEMENT…
      </p>
    </div>
  );
}
