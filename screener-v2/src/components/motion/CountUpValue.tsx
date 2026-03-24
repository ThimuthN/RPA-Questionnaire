"use client";

import { animate, motion, useMotionValue, useMotionValueEvent } from "framer-motion";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function CountUpValue({
  value,
  decimals = 0,
  className,
  suffix = ""
}: {
  value: number;
  decimals?: number;
  className?: string;
  suffix?: string;
}) {
  const motionValue = useMotionValue(0);
  const [displayValue, setDisplayValue] = useState(() => value.toFixed(decimals));

  useEffect(() => {
    const controls = animate(motionValue, value, {
      duration: 0.8,
      ease: [0.22, 1, 0.36, 1]
    });

    return () => controls.stop();
  }, [motionValue, value]);

  useMotionValueEvent(motionValue, "change", (latest) => {
    setDisplayValue(latest.toFixed(decimals));
  });

  return <motion.span className={cn(className)}>{displayValue}{suffix}</motion.span>;
}
