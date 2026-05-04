"use client";

import { forwardRef } from "react";
import { Loader2 } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 font-semibold",
    "transition-all duration-300 ease-out",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base",
    "disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none",
    "select-none",
  ].join(" "),
  {
    variants: {
      variant: {
        primary: [
          "bg-gradient-to-r from-indigo-600 to-purple-600 text-white",
          "shadow-[0_8px_24px_-8px_rgba(99,102,241,0.5)]",
          "hover:opacity-95 hover:-translate-y-0.5 hover:shadow-[0_16px_32px_-8px_rgba(99,102,241,0.6)]",
          "active:scale-95 active:shadow-none",
          "border border-transparent",
        ].join(" "),
        secondary: [
          "bg-white/5 backdrop-blur-md text-fg-secondary",
          "border border-white/10",
          "hover:bg-white/10 hover:border-white/20 hover:text-fg-primary hover:-translate-y-0.5",
          "active:scale-95",
        ].join(" "),
        danger: [
          "bg-red-500/10 text-red-400",
          "border border-red-500/20",
          "hover:bg-red-500/20 hover:border-red-500/40 hover:-translate-y-0.5",
          "active:scale-95",
        ].join(" "),
        ghost: [
          "bg-transparent text-fg-tertiary",
          "border border-transparent",
          "hover:text-fg-primary hover:bg-white/5",
          "active:scale-95",
        ].join(" "),
      },
      size: {
        sm: "px-3 py-1.5 text-xs rounded-lg",
        md: "px-4 py-2.5 text-sm rounded-xl",
        lg: "px-6 py-3 text-sm rounded-xl font-bold tracking-wide",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

export type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      leftIcon,
      rightIcon,
      children,
      className,
      disabled,
      ...rest
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(buttonVariants({ variant, size }), className)}
        {...rest}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : leftIcon ? (
          <span className="shrink-0">{leftIcon}</span>
        ) : null}
        {children}
        {!loading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = "Button";
