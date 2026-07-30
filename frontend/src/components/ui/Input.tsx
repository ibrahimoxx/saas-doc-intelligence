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
            className="dc-label"
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
              "w-full bg-bg-base border border-border-subtle rounded-md",
              "px-2.5 py-2 text-[13px] text-fg-primary placeholder-fg-tertiary",
              "transition-colors duration-150",
              "focus:outline-none focus:border-brand-primary",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              error
                ? "border-error focus:border-error"
                : "",
              leftIcon ? "pl-9" : "",
              className
            )}
            {...rest}
          />
        </div>
        {error && (
          <p className="text-[11.5px] text-error">{error}</p>
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
            className="dc-label"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          className={cn(
            "w-full bg-bg-base border border-border-subtle rounded-md",
            "px-2.5 py-2 text-[13px] text-fg-primary placeholder-fg-tertiary",
            "transition-colors duration-150 resize-none",
            "focus:outline-none focus:border-brand-primary",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            error
              ? "border-error focus:border-error"
              : "",
            className
          )}
          {...rest}
        />
        {error && (
          <p className="text-[11.5px] text-error">{error}</p>
        )}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";
