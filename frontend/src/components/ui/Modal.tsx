// src/components/ui/Modal.tsx
"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  /** Width class e.g. "max-w-lg", defaults to "max-w-lg" */
  width?: string;
}

export function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  width = "max-w-lg",
}: ModalProps) {
  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Card */}
      <div
        className={[
          "relative w-full bg-slate-900/95 backdrop-blur-xl",
          "border border-white/10 rounded-2xl shadow-2xl shadow-black/50",
          "animate-fade-in-up overflow-hidden",
          width,
        ].join(" ")}
      >
        {/* Top gradient bar */}
        <div className="h-1 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

        {/* Header */}
        {(title || subtitle) && (
          <div className="flex items-start justify-between px-6 pt-5 pb-4 border-b border-white/5">
            <div>
              {title && (
                <h2 className="text-lg font-bold text-white">{title}</h2>
              )}
              {subtitle && (
                <p className="text-sm text-slate-400 mt-0.5">{subtitle}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="ml-4 p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Fermer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Close button (no header) */}
        {!title && !subtitle && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Fermer"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Content */}
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}
