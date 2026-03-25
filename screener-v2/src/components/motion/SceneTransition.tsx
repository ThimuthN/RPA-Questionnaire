"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { PropsWithChildren } from "react";

export function SceneTransition({ children }: PropsWithChildren) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 14, scale: 0.992, filter: "blur(8px)" }}
      animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
      exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -10, scale: 0.995, filter: "blur(6px)" }}
      transition={{ duration: reduceMotion ? 0.14 : 0.42, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
