// src/components/ui/Avatar.tsx
"use client";

export type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl";

interface AvatarProps {
  name?: string;
  email?: string;
  size?: AvatarSize;
  className?: string;
}

const sizeClasses: Record<AvatarSize, string> = {
  xs: "w-6 h-6 text-[10px] rounded-md",
  sm: "w-8 h-8 text-xs rounded-lg",
  md: "w-10 h-10 text-sm rounded-xl",
  lg: "w-12 h-12 text-base rounded-xl",
  xl: "w-16 h-16 text-xl rounded-2xl",
};

/** Returns a deterministic gradient based on the first letter */
function pickGradient(char: string): string {
  const gradients = [
    "from-indigo-500 to-purple-600",
    "from-purple-500 to-pink-600",
    "from-blue-500 to-indigo-600",
    "from-teal-500 to-blue-600",
    "from-violet-500 to-indigo-600",
    "from-fuchsia-500 to-purple-600",
  ];
  const index = char.charCodeAt(0) % gradients.length;
  return gradients[index];
}

function getInitial(name?: string, email?: string): string {
  const source = name || email || "?";
  return source.charAt(0).toUpperCase();
}

export function Avatar({ name, email, size = "md", className = "" }: AvatarProps) {
  const initial = getInitial(name, email);
  const gradient = pickGradient(initial);

  return (
    <div
      className={[
        "bg-gradient-to-br flex items-center justify-center shrink-0",
        "font-bold text-white select-none",
        gradient,
        sizeClasses[size],
        className,
      ].join(" ")}
      title={name || email}
      aria-label={name || email}
    >
      {initial}
    </div>
  );
}
