"use client";

import { useState } from "react";
import { AlertCircle, X } from "lucide-react";
import { cn } from "@/lib/cn";

interface ErrorBannerProps {
  message: string;
  dismissible?: boolean;
  className?: string;
}

export function ErrorBanner({
  message,
  dismissible = true,
  className,
}: ErrorBannerProps) {
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  return (
    <div
      role="alert"
      className={cn(
        "flex items-start gap-3 px-4 py-3 rounded-xl text-sm",
        "bg-error/10 border border-error/20 text-red-400",
        className
      )}
    >
      <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
      <p className="flex-1">{message}</p>
      {dismissible && (
        <button
          onClick={() => setVisible(false)}
          className="ml-auto shrink-0 text-red-400/50 hover:text-red-400 transition-colors"
          aria-label="Fermer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
