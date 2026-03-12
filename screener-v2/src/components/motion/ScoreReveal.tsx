"use client";

import { motion } from "framer-motion";

export function ScoreReveal({ value }: { value: number }) {
  return (
    <motion.div
      className="text-5xl font-semibold text-white"
      initial={{ scale: 0.92, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.42, ease: [0.19, 1, 0.22, 1] }}
    >
      {value.toFixed(1)}%
    </motion.div>
  );
}
