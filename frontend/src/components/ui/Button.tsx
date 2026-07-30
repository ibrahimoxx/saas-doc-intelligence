"use client";

import { forwardRef } from "react";
import { Loader2 } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-1.5 font-semibold",
    "transition-colors duration-150 ease-out",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base",
    "disabled:opacity-50 disabled:cursor-not-allowed",
    "select-none",
  ].join(" "),
  {
    variants: {
      variant: {
        primary: [
          "bg-fg-primary text-bg-base",
          "border border-fg-primary",
          "hover:opacity-88",
        ].join(" "),
        secondary: [
          "bg-bg-base text-fg-primary",
          "border border-border-subtle",
          "hover:border-border-strong hover:bg-bg-elevated-1",
        ].join(" "),
        danger: [
          "bg-error-bg text-error",
          "border border-error-border",
          "hover:brightness-95",
        ].join(" "),
        ghost: [
          "bg-transparent text-fg-secondary",
          "border border-transparent",
          "hover:bg-bg-elevated-1 hover:text-fg-primary",
        ].join(" "),
      },
      size: {
        sm: "px-2.5 py-1.5 text-[12px] rounded-md",
        md: "px-3.5 py-2 text-[12.5px] rounded-md",
        lg: "px-4 py-2.5 text-[13px] rounded-md",
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
