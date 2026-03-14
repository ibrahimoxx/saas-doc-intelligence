// src/components/ui/Button.tsx
"use client";

import { forwardRef } from "react";
import { Loader2 } from "lucide-react";

export type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/20 hover:opacity-90 hover:-translate-y-0.5 hover:shadow-indigo-500/30 border border-transparent",
  secondary:
    "bg-white/5 backdrop-blur-md text-slate-200 border border-white/10 hover:bg-white/10 hover:border-white/20 hover:-translate-y-0.5",
  danger:
    "bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20 hover:border-red-500/50 hover:-translate-y-0.5",
  ghost:
    "bg-transparent text-slate-400 border border-transparent hover:text-white hover:bg-white/5",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-xs rounded-lg",
  md: "px-4 py-2.5 text-sm rounded-xl",
  lg: "px-6 py-3 text-base rounded-xl",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      leftIcon,
      rightIcon,
      children,
      className = "",
      disabled,
      ...rest
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={[
          "inline-flex items-center justify-center gap-2 font-semibold",
          "transition-all duration-200 ease-in-out",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900",
          "disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none",
          variantClasses[variant],
          sizeClasses[size],
          className,
        ].join(" ")}
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
