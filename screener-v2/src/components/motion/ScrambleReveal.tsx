"use client";

import { useEffect, useMemo, useState } from "react";
import { useInView, useReducedMotion } from "framer-motion";
import { useRef } from "react";
import { cn } from "@/lib/utils";

const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

export function ScrambleReveal({
  text,
  className,
  once = true,
  delay = 0
}: {
  text: string;
  className?: string;
  once?: boolean;
  delay?: number;
}) {
  const reduceMotion = useReducedMotion();
  const ref = useRef<HTMLSpanElement | null>(null);
  const inView = useInView(ref, { once, margin: "-10% 0px -10% 0px" });
  const [displayed, setDisplayed] = useState(() => (reduceMotion ? text : ""));
  const target = useMemo(() => text.split(""), [text]);

  useEffect(() => {
    if (reduceMotion || !inView) {
      setDisplayed(text);
      return;
    }

    const frames = target.length + 10;
    let frame = 0;
    let timeoutId = 0;

    const tick = () => {
      const revealIndex = Math.max(0, frame - 5);
      const next = target
        .map((char, index) => {
          if (char === " ") return " ";
          if (index <= revealIndex) return char;
          return GLYPHS[(frame + index * 7) % GLYPHS.length];
        })
        .join("");

      setDisplayed(next);
      frame += 1;

      if (frame <= frames) {
        timeoutId = window.setTimeout(tick, frame < 4 ? 34 : 24);
      } else {
        setDisplayed(text);
      }
    };

    const startId = window.setTimeout(tick, delay * 1000);
    return () => {
      window.clearTimeout(startId);
      window.clearTimeout(timeoutId);
    };
  }, [delay, inView, reduceMotion, target, text]);

  return (
    <span ref={ref} className={cn("inline-block", className)}>
      {displayed}
    </span>
  );
}
