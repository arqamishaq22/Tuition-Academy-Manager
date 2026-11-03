/**
 * Framer Motion animation variants for Academy Manager
 * Designed to provide smooth, delightful micro-interactions
 * and respects users who prefer reduced motion.
 */

// Smooth standard easing curve
export const easeTransition = [0.25, 0.1, 0.25, 1.0];

// Fade Up variant (used for cards, sections, hero elements)
export const fadeUp = {
  hidden: {
    opacity: 0,
    y: 16,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: easeTransition,
    },
  },
};

// Fade In variant
export const fadeIn = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.3,
      ease: easeTransition,
    },
  },
};

// Scale In variant (used for modals, popups, badges)
export const scaleIn = {
  hidden: {
    opacity: 0,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.25,
      ease: easeTransition,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: {
      duration: 0.2,
      ease: easeTransition,
    },
  },
};

// Slide In Left variant
export const slideInLeft = {
  hidden: {
    opacity: 0,
    x: -24,
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.35,
      ease: easeTransition,
    },
  },
};

// Stagger Container variant for lists, card grids, table rows
export const staggerContainer = (staggerChildren = 0.08, delayChildren = 0) => ({
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren,
      delayChildren,
    },
  },
});

// Page transition variant
export const pageTransition = {
  hidden: {
    opacity: 0,
    y: 8,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: easeTransition,
    },
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: {
      duration: 0.2,
      ease: easeTransition,
    },
  },
};

