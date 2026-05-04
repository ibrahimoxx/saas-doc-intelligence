"use client";

import { FolderOpen } from "lucide-react";
import { cn } from "@/lib/cn";
import { Button } from "./Button";

interface EmptyStateProps {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
  illustration?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  icon,
  illustration,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-20 px-4 text-center",
        className
      )}
    >
      {illustration ? (
        <div className="mb-8 opacity-80">{illustration}</div>
      ) : (
        <div className="w-20 h-20 rounded-3xl surface-glass flex items-center justify-center mb-6">
          {icon ?? <FolderOpen className="w-9 h-9 text-fg-muted" />}
        </div>
      )}
      <h3 className="font-serif text-2xl mb-2 text-fg-primary">{title}</h3>
      {description && (
        <p className="text-sm text-fg-secondary max-w-sm mb-6 leading-relaxed">
          {description}
        </p>
      )}
      {actionLabel && onAction && (
        <Button variant="primary" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
