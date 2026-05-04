import type { Variants, Transition } from "framer-motion";

export const easings = {
  outExpo: [0.16, 1, 0.3, 1] as [number, number, number, number],
  inQuart: [0.7, 0, 0.84, 0] as [number, number, number, number],
  natural: [0.4, 0, 0.2, 1] as [number, number, number, number],
} as const;

export const transitions = {
  fast: { duration: 0.15, ease: easings.natural },
  normal: { duration: 0.3, ease: easings.natural },
  slow: { duration: 0.5, ease: easings.outExpo },
  cinematic: { duration: 0.8, ease: easings.outExpo },
  enter: { duration: 0.4, ease: easings.outExpo },
  exit: { duration: 0.2, ease: easings.inQuart },
} satisfies Record<string, Transition>;

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: transitions.enter },
  exit: { opacity: 0, y: -8, transition: transitions.exit },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: transitions.normal },
  exit: { opacity: 0, transition: transitions.exit },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: transitions.enter },
  exit: { opacity: 0, scale: 0.95, transition: transitions.exit },
};

export const slideLeft: Variants = {
  hidden: { opacity: 0, x: -24 },
  visible: { opacity: 1, x: 0, transition: transitions.enter },
  exit: { opacity: 0, x: -24, transition: transitions.exit },
};

export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: transitions.enter },
};

export const scrollReveal: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: easings.outExpo },
  },
};
