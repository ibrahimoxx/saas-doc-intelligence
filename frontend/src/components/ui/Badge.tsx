"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[5px] text-[11px] font-semibold border whitespace-nowrap transition-colors",
  {
    variants: {
      variant: {
        green:  "bg-success-bg text-success border-success-border",
        amber:  "bg-warning-bg text-warning border-warning-border",
        red:    "bg-error-bg   text-error   border-error-border",
        blue:   "bg-info-bg    text-info    border-info-border",
        purple: "bg-brand-soft text-brand-primary border-transparent",
        slate:  "bg-bg-elevated-1 text-fg-secondary border-border-subtle",
        indigo: "bg-brand-soft text-brand-primary border-transparent",
      },
    },
    defaultVariants: {
      variant: "slate",
    },
  }
);

const dotColors: Record<string, string> = {
  green:  "bg-success",
  amber:  "bg-warning",
  red:    "bg-error",
  blue:   "bg-info",
  purple: "bg-brand-primary",
  slate:  "bg-fg-tertiary",
  indigo: "bg-brand-primary",
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
            "w-[5px] h-[5px] rounded-full shrink-0",
            dotColors[variant ?? "slate"],
            pulse && "animate-pulse"
          )}
        />
      )}
      {children}
    </span>
  );
}
