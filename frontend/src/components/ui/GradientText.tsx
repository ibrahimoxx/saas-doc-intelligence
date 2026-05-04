"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

interface GradientTextProps {
  children: ReactNode;
  className?: string;
}

export function GradientText({ children, className }: GradientTextProps) {
  return <span className={cn("text-gradient", className)}>{children}</span>;
}
