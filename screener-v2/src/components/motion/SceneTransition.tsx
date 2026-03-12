"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { PropsWithChildren } from "react";

export function SceneTransition({ children }: PropsWithChildren) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 10 }}
      animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
      exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
      transition={{ duration: reduceMotion ? 0.14 : 0.36, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
