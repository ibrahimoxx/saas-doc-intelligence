// src/components/ui/ErrorBanner.tsx
"use client";

import { useState } from "react";
import { AlertCircle, X } from "lucide-react";

interface ErrorBannerProps {
  message: string;
  dismissible?: boolean;
  className?: string;
}

export function ErrorBanner({
  message,
  dismissible = true,
  className = "",
}: ErrorBannerProps) {
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  return (
    <div
      role="alert"
      className={[
        "flex items-start gap-3 px-4 py-3",
        "bg-red-500/10 border border-red-500/30 rounded-xl",
        "text-red-400 text-sm",
        className,
      ].join(" ")}
    >
      <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
      <p className="flex-1">{message}</p>
      {dismissible && (
        <button
          onClick={() => setVisible(false)}
          className="ml-auto shrink-0 text-red-400/60 hover:text-red-400 transition-colors"
          aria-label="Fermer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
