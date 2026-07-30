"use client";

import { cn } from "@/lib/cn";

export type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl";

interface AvatarProps {
  name?: string;
  email?: string;
  size?: AvatarSize;
  className?: string;
}

const sizeClasses: Record<AvatarSize, string> = {
  xs: "w-6 h-6 text-[10px] rounded-[5px]",
  sm: "w-[30px] h-[30px] text-[11px] rounded-[7px]",
  md: "w-9 h-9 text-xs rounded-[7px]",
  lg: "w-11 h-11 text-sm rounded-[9px]",
  xl: "w-14 h-14 text-lg rounded-[11px]",
};

function getInitials(name?: string, email?: string): string {
  const source = name?.trim() || email?.split("@")[0] || "?";
  const parts = source.split(/[\s._-]+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return source.slice(0, 2).toUpperCase();
}

export function Avatar({ name, email, size = "md", className }: AvatarProps) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center select-none",
        "bg-brand-soft font-bold text-brand-primary",
        sizeClasses[size],
        className
      )}
      title={name || email}
      aria-label={name || email}
    >
      {getInitials(name, email)}
    </div>
  );
}
