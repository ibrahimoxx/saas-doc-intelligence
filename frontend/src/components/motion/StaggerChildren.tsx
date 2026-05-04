"use client";

import { Children, type ReactNode } from "react";
import { motion, useReducedMotion, type Variants } from "framer-motion";

import cn from "@/lib/cn";
import { staggerContainer, staggerItem } from "@/lib/motion";

interface StaggerChildrenProps {
  children: ReactNode;
  className?: string;
}

const reducedStaggerItem: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

export function StaggerChildren({ children, className }: StaggerChildrenProps) {
  const shouldReduceMotion = useReducedMotion();
  const items = Children.toArray(children);

  if (shouldReduceMotion) {
    return (
      <div className={cn(className)}>
        {items.map((child, index) => (
          <div key={index}>{child}</div>
        ))}
      </div>
    );
  }

  return (
    <motion.div
      className={cn(className)}
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
    >
      {items.map((child, index) => (
        <motion.div key={index} variants={shouldReduceMotion ? reducedStaggerItem : staggerItem}>
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
}
