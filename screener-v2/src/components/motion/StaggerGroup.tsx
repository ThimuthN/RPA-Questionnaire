"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { PropsWithChildren } from "react";
import { cn } from "@/lib/utils";

export function StaggerGroup({
  children,
  className,
  delay = 0
}: PropsWithChildren<{ className?: string; delay?: number }>) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="visible"
      variants={
        reduceMotion
          ? {
              hidden: { opacity: 1 },
              visible: { opacity: 1 }
            }
          : {
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: {
                  delayChildren: delay,
                  staggerChildren: 0.11
                }
              }
            }
      }
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className,
  hover = false
}: PropsWithChildren<{ className?: string; hover?: boolean }>) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className={cn(className)}
      variants={
        reduceMotion
          ? {
              hidden: { opacity: 1 },
              visible: { opacity: 1 }
            }
          : {
              hidden: { opacity: 0, y: 26, scale: 0.986, filter: "blur(10px)" },
              visible: {
                opacity: 1,
                y: 0,
                scale: 1,
                filter: "blur(0px)",
                transition: { duration: 0.62, ease: [0.22, 1, 0.36, 1] }
              }
            }
      }
      whileHover={
        hover && !reduceMotion
          ? {
              y: -6,
              scale: 1.014,
              transition: { duration: 0.24, ease: [0.22, 1, 0.36, 1] }
            }
          : undefined
      }
    >
      {children}
    </motion.div>
  );
}
