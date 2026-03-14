// src/components/ui/LoadingSpinner.tsx
"use client";

interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizes = {
  sm: "w-5 h-5 border-2",
  md: "w-8 h-8 border-[3px]",
  lg: "w-12 h-12 border-[3px]",
};

export function LoadingSpinner({ size = "md", className = "" }: SpinnerProps) {
  return (
    <div
      role="status"
      aria-label="Chargement…"
      className={[
        "rounded-full border-indigo-500/20 border-t-indigo-500",
        "animate-spin",
        sizes[size],
        className,
      ].join(" ")}
    />
  );
}

/** Full-screen centered loading state */
export function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#020617]">
      <LoadingSpinner size="lg" />
    </div>
  );
}
