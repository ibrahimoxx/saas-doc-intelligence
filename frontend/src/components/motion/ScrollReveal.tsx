"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion, type Variants } from "framer-motion";

import cn from "@/lib/cn";
import { scrollReveal } from "@/lib/motion";

interface ScrollRevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

export function ScrollReveal({
  children,
  className,
  delay = 0,
}: ScrollRevealProps) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    if (!className) {
      return <>{children}</>;
    }

    return <div className={className}>{children}</div>;
  }

  const variants: Variants = {
    ...scrollReveal,
    visible: {
      ...(scrollReveal.visible ?? {}),
      transition: {
        ...(typeof scrollReveal.visible === "object" && scrollReveal.visible !== null && "transition" in scrollReveal.visible
          ? (scrollReveal.visible.transition as Record<string, unknown>)
          : {}),
        delay,
      },
    },
  };

  return (
    <motion.div
      className={cn(className)}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      variants={variants}
    >
      {children}
    </motion.div>
  );
}
