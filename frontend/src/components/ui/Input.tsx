// src/components/ui/Input.tsx
"use client";

import { forwardRef } from "react";

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
  ({ label, error, leftIcon, className = "", id, ...rest }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-xs font-semibold uppercase tracking-widest text-slate-400"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
              {leftIcon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={[
              "w-full bg-white/5 border border-white/10 rounded-xl",
              "px-4 py-3 text-sm text-slate-100 placeholder-slate-500",
              "transition-all duration-200",
              "focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              error ? "border-red-500/60 focus:border-red-500 focus:ring-red-500/20" : "",
              leftIcon ? "pl-10" : "",
              className,
            ].join(" ")}
            {...rest}
          />
        </div>
        {error && (
          <p className="text-xs text-red-400 mt-0.5">{error}</p>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className = "", id, ...rest }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-xs font-semibold uppercase tracking-widest text-slate-400"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          className={[
            "w-full bg-white/5 border border-white/10 rounded-xl",
            "px-4 py-3 text-sm text-slate-100 placeholder-slate-500",
            "transition-all duration-200 resize-none",
            "focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            error ? "border-red-500/60 focus:border-red-500 focus:ring-red-500/20" : "",
            className,
          ].join(" ")}
          {...rest}
        />
        {error && (
          <p className="text-xs text-red-400 mt-0.5">{error}</p>
        )}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";
