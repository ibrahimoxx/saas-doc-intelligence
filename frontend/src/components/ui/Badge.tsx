// src/components/ui/Badge.tsx
"use client";

export type BadgeVariant =
  | "green"
  | "amber"
  | "red"
  | "blue"
  | "purple"
  | "slate"
  | "indigo";

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  dot?: boolean;
  pulse?: boolean;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  green:  "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  amber:  "bg-amber-500/10  text-amber-400  border-amber-500/20",
  red:    "bg-red-500/10    text-red-400    border-red-500/20",
  blue:   "bg-blue-500/10   text-blue-400   border-blue-500/20",
  purple: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  slate:  "bg-slate-700/60  text-slate-300  border-slate-600/40",
  indigo: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
};

const dotColors: Record<BadgeVariant, string> = {
  green:  "bg-emerald-400",
  amber:  "bg-amber-400",
  red:    "bg-red-400",
  blue:   "bg-blue-400",
  purple: "bg-purple-400",
  slate:  "bg-slate-400",
  indigo: "bg-indigo-400",
};

export function Badge({
  variant = "slate",
  children,
  dot = false,
  pulse = false,
  className = "",
}: BadgeProps) {
  return (
    <span
      className={[
        "inline-flex items-center gap-1.5 px-2.5 py-0.5",
        "rounded-full text-xs font-semibold border",
        variantStyles[variant],
        className,
      ].join(" ")}
    >
      {dot && (
        <span
          className={[
            "w-1.5 h-1.5 rounded-full shrink-0",
            dotColors[variant],
            pulse ? "pulse-dot" : "",
          ].join(" ")}
        />
      )}
      {children}
    </span>
  );
}
