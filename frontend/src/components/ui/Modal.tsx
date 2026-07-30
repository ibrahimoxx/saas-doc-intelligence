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
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        onClick={onClose}
      />

      {/* Card */}
      <div
        className={cn(
          "relative w-full dc-card overflow-hidden shadow-card-lift",
          width
        )}
      >
        {/* Header */}
        {(title || subtitle) && (
          <div className="flex items-start justify-between border-b border-border-subtle px-5 py-3.5">
            <div>
              {title && (
                <h2 className="text-[15px] font-bold text-fg-primary">
                  {title}
                </h2>
              )}
              {subtitle && (
                <p className="mt-0.5 text-[12.5px] text-fg-secondary">{subtitle}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="ml-4 p-1.5 rounded-md text-fg-tertiary hover:text-fg-primary hover:bg-bg-elevated-1 transition-colors"
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
            className="absolute top-3.5 right-3.5 p-1.5 rounded-md text-fg-tertiary hover:text-fg-primary hover:bg-bg-elevated-1 transition-colors"
            aria-label="Fermer"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Content */}
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  );
}
