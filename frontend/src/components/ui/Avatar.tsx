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
  xs: "w-6 h-6 text-[10px] rounded-lg",
  sm: "w-8 h-8 text-xs rounded-xl",
  md: "w-10 h-10 text-sm rounded-xl",
  lg: "w-12 h-12 text-base rounded-2xl",
  xl: "w-16 h-16 text-xl rounded-2xl",
};

const gradients = [
  "from-indigo-500 via-purple-500 to-purple-600",
  "from-purple-500 via-fuchsia-500 to-pink-600",
  "from-blue-500 via-indigo-500 to-indigo-600",
  "from-teal-500 via-emerald-500 to-blue-600",
  "from-violet-500 via-purple-500 to-indigo-600",
  "from-fuchsia-500 via-purple-500 to-violet-600",
  "from-cyan-500 via-blue-500 to-indigo-600",
  "from-amber-500 via-orange-500 to-rose-600",
];

function pickGradient(char: string): string {
  return gradients[char.charCodeAt(0) % gradients.length];
}

function getInitial(name?: string, email?: string): string {
  return (name || email || "?").charAt(0).toUpperCase();
}

export function Avatar({ name, email, size = "md", className }: AvatarProps) {
  const initial = getInitial(name, email);
  const gradient = pickGradient(initial);

  return (
    <div
      className={cn(
        "bg-linear-to-br flex items-center justify-center shrink-0",
        "font-bold text-white select-none ring-1 ring-white/10",
        gradient,
        sizeClasses[size],
        className
      )}
      title={name || email}
      aria-label={name || email}
    >
      {initial}
    </div>
  );
}
