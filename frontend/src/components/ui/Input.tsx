"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/cn";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
}

interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, leftIcon, className, id, ...rest }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-xs font-semibold uppercase tracking-widest text-fg-tertiary"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-muted">
              {leftIcon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              "w-full bg-white/4 border border-white/8 rounded-xl",
              "px-4 py-3 text-sm text-fg-primary placeholder-fg-muted",
              "transition-all duration-200",
              "focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 focus:bg-white/6",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              error
                ? "border-error/50 focus:border-error focus:ring-error/20"
                : "",
              leftIcon ? "pl-10" : "",
              className
            )}
            {...rest}
          />
        </div>
        {error && (
          <p className="text-xs text-error mt-0.5">{error}</p>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className, id, ...rest }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-xs font-semibold uppercase tracking-widest text-fg-tertiary"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          className={cn(
            "w-full bg-white/4 border border-white/8 rounded-xl",
            "px-4 py-3 text-sm text-fg-primary placeholder-fg-muted",
            "transition-all duration-200 resize-none",
            "focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 focus:bg-white/6",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            error
              ? "border-error/50 focus:border-error focus:ring-error/20"
              : "",
            className
          )}
          {...rest}
        />
        {error && (
          <p className="text-xs text-error mt-0.5">{error}</p>
        )}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";
