"use client";

import { useEffect, useState } from "react";
import { useMotionValue, useReducedMotion, useSpring } from "framer-motion";

import cn from "@/lib/cn";

interface AnimatedNumberProps {
  value: number;
  className?: string;
  format?: (n: number) => string;
}

const defaultFormat = (n: number) => n.toLocaleString("fr-FR");

export function AnimatedNumber({
  value,
  className,
  format = defaultFormat,
}: AnimatedNumberProps) {
  const shouldReduceMotion = useReducedMotion();
  const motionValue = useMotionValue(0);
  const springValue = useSpring(motionValue, { stiffness: 100, damping: 30 });
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const unsubscribe = springValue.on("change", (latest) => {
      setDisplayValue(Math.round(latest));
    });

    return unsubscribe;
  }, [springValue]);

  useEffect(() => {
    motionValue.set(value);
  }, [motionValue, value]);

  if (shouldReduceMotion) {
    return <span className={cn(className)}>{format(value)}</span>;
  }

  return <span className={cn(className)}>{format(displayValue)}</span>;
}
