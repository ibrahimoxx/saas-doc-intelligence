"use client";

import type { ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion, type Variants } from "framer-motion";

import { fadeUp } from "@/lib/motion";

interface PageTransitionProps {
  children: ReactNode;
}

const reducedFadeUp: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

export function PageTransition({ children }: PageTransitionProps) {
  const shouldReduceMotion = useReducedMotion();
  const variants = shouldReduceMotion ? reducedFadeUp : fadeUp;

  return (
    <AnimatePresence mode="wait">
      <motion.div initial="hidden" animate="visible" exit="exit" variants={variants}>
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
