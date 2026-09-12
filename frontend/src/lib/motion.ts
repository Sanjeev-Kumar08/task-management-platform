import type { Transition, Variants } from 'framer-motion';

/** Soft ease — no bounce, no glitter */
export const easeOut: Transition['ease'] = [0.22, 1, 0.36, 1];

export const transition: Transition = {
  duration: 0.28,
  ease: easeOut,
};

export const transitionSlow: Transition = {
  duration: 0.4,
  ease: easeOut,
};

export const fadeIn: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition },
  exit: { opacity: 0, transition: { duration: 0.18, ease: easeOut } },
};

export const fadeUp: Variants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition },
  exit: { opacity: 0, y: 6, transition: { duration: 0.18, ease: easeOut } },
};

export const fadeScale: Variants = {
  initial: { opacity: 0, scale: 0.98 },
  animate: { opacity: 1, scale: 1, transition },
  exit: { opacity: 0, scale: 0.98, transition: { duration: 0.18, ease: easeOut } },
};

export const slideInRight: Variants = {
  initial: { opacity: 0, x: 28 },
  animate: { opacity: 1, x: 0, transition: transitionSlow },
  exit: { opacity: 0, x: 20, transition: { duration: 0.22, ease: easeOut } },
};

export const staggerContainer: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.04,
    },
  },
};

export const staggerItem: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition },
};
