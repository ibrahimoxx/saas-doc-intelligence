"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border transition-colors",
  {
    variants: {
      variant: {
        green:  "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
        amber:  "bg-amber-500/10  text-amber-400  border-amber-500/20",
        red:    "bg-red-500/10    text-red-400    border-red-500/20",
        blue:   "bg-blue-500/10   text-blue-400   border-blue-500/20",
        purple: "bg-purple-500/10 text-purple-400 border-purple-500/20",
        slate:  "bg-white/5       text-fg-tertiary border-white/10",
        indigo: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
      },
    },
    defaultVariants: {
      variant: "slate",
    },
  }
);

const dotColors: Record<string, string> = {
  green:  "bg-emerald-400",
  amber:  "bg-amber-400",
  red:    "bg-red-400",
  blue:   "bg-blue-400",
  purple: "bg-purple-400",
  slate:  "bg-fg-tertiary",
  indigo: "bg-indigo-400",
};

export type BadgeVariant =
  | "green" | "amber" | "red" | "blue" | "purple" | "slate" | "indigo";

interface BadgeProps extends VariantProps<typeof badgeVariants> {
  variant?: BadgeVariant;
  children: React.ReactNode;
  dot?: boolean;
  pulse?: boolean;
  className?: string;
}

export function Badge({
  variant = "slate",
  children,
  dot = false,
  pulse = false,
  className,
}: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)}>
      {dot && (
        <span
          className={cn(
            "w-1.5 h-1.5 rounded-full shrink-0",
            dotColors[variant ?? "slate"],
            pulse && "animate-pulse"
          )}
        />
      )}
      {children}
    </span>
  );
}
