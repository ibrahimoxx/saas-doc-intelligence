// src/components/ui/EmptyState.tsx
"use client";

import { FolderOpen } from "lucide-react";
import { Button } from "./Button";

interface EmptyStateProps {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  icon,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
      <div className="w-20 h-20 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center mb-6 animate-glow">
        {icon ?? <FolderOpen className="w-9 h-9 text-slate-500" />}
      </div>
      <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-slate-500 max-w-sm mb-6">{description}</p>
      )}
      {actionLabel && onAction && (
        <Button variant="primary" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
