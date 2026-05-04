"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
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
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

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
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Card */}
      <div
        className={cn(
          "relative w-full surface-elevated overflow-hidden",
          "animate-[fade-in-up_0.3s_cubic-bezier(0.16,1,0.3,1)_forwards]",
          width
        )}
      >
        {/* Top gradient bar */}
        <div className="h-px w-full bg-linear-to-r from-brand-primary via-brand-secondary to-aurora-4" />

        {/* Header */}
        {(title || subtitle) && (
          <div className="flex items-start justify-between px-6 pt-5 pb-4 border-b border-border-subtle">
            <div>
              {title && (
                <h2 className="text-base font-bold text-fg-primary font-display">
                  {title}
                </h2>
              )}
              {subtitle && (
                <p className="text-sm text-fg-secondary mt-0.5">{subtitle}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="ml-4 p-1.5 rounded-lg text-fg-muted hover:text-fg-primary hover:bg-white/8 transition-colors"
              aria-label="Fermer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Close without header */}
        {!title && !subtitle && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-fg-muted hover:text-fg-primary hover:bg-white/8 transition-colors"
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
