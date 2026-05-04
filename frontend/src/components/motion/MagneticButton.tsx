"use client";

import type { MouseEvent, ReactNode } from "react";
import { motion, useMotionValue, useReducedMotion, useSpring } from "framer-motion";

import cn from "@/lib/cn";

interface MagneticButtonProps {
  children: ReactNode;
  className?: string;
  strength?: number;
}

const MAX_DEFLECTION = 8;

export function MagneticButton({
  children,
  className,
  strength = 0.4,
}: MagneticButtonProps) {
  const shouldReduceMotion = useReducedMotion();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 100, damping: 20 });
  const springY = useSpring(y, { stiffness: 100, damping: 20 });

  const clampedStrength = Math.min(Math.max(strength, 0), 1);
  const maxOffset = MAX_DEFLECTION * clampedStrength;

  const handleMouseMove = (event: MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const normalizedX = rect.width === 0 ? 0 : (event.clientX - centerX) / (rect.width / 2);
    const normalizedY = rect.height === 0 ? 0 : (event.clientY - centerY) / (rect.height / 2);

    const nextX = Math.max(-1, Math.min(1, normalizedX)) * maxOffset;
    const nextY = Math.max(-1, Math.min(1, normalizedY)) * maxOffset;

    x.set(nextX);
    y.set(nextY);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  if (shouldReduceMotion) {
    if (!className) {
      return <>{children}</>;
    }

    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={cn(className)}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ x: springX, y: springY }}
    >
      {children}
    </motion.div>
  );
}
