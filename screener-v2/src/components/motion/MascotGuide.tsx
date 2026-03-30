"use client";

import { motion, useReducedMotion } from "framer-motion";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { RiveMascot } from "@/components/brand/RiveMascot";

type GuideTarget = {
  id: string;
  hint: string;
  rect: DOMRect;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function readTargets() {
  if (typeof document === "undefined") return [] as GuideTarget[];

  return Array.from(document.querySelectorAll<HTMLElement>("[data-guide-id]"))
    .map((element) => ({
      id: element.dataset.guideId ?? "",
      hint: element.dataset.guideHint ?? element.textContent?.trim() ?? "Try this",
      rect: element.getBoundingClientRect()
    }))
    .filter(
      (target) =>
        target.id &&
        target.rect.width > 0 &&
        target.rect.height > 0 &&
        target.rect.bottom > 0 &&
        target.rect.right > 0 &&
        target.rect.top < window.innerHeight &&
        target.rect.left < window.innerWidth
    );
}

export function MascotGuide() {
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();
  const [targets, setTargets] = useState<GuideTarget[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (reduceMotion) return;

    const refresh = () => {
      setTargets((current) => {
        const next = readTargets();
        if (next.length === 0) return [];
        if (current.length === 0) return next;
        return next;
      });
    };

    const timer = window.setTimeout(refresh, 120);
    refresh();
    window.addEventListener("resize", refresh);
    window.addEventListener("scroll", refresh, { passive: true });

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("resize", refresh);
      window.removeEventListener("scroll", refresh);
    };
  }, [pathname, reduceMotion]);

  useEffect(() => {
    if (targets.length === 0 || reduceMotion) return;

    const cycle = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % targets.length);
    }, 3600);

    return () => window.clearInterval(cycle);
  }, [targets, reduceMotion]);

  useEffect(() => {
    if (activeIndex >= targets.length) {
      setActiveIndex(0);
    }
  }, [activeIndex, targets.length]);

  if (reduceMotion || targets.length === 0) return null;

  const target = targets[activeIndex];
  const mascotSize = 96;
  const aboveTarget = target.rect.top > 170;
  const mascotX = clamp(target.rect.left + target.rect.width / 2 - mascotSize / 2, 18, window.innerWidth - mascotSize - 18);
  const mascotY = aboveTarget
    ? clamp(target.rect.top - mascotSize - 30, 74, window.innerHeight - mascotSize - 24)
    : clamp(target.rect.bottom + 16, 74, window.innerHeight - mascotSize - 24);
  const bubbleX = clamp(mascotX - 14, 18, window.innerWidth - 200);
  const bubbleY = aboveTarget ? mascotY - 58 : mascotY + mascotSize - 10;

  return (
    <div className="pointer-events-none fixed inset-0 z-40 hidden md:block" aria-hidden="true">
      <motion.div
        className="absolute rounded-[18px] border border-brand-300/30 shadow-[0_0_0_1px_rgba(138,184,255,0.16),0_0_28px_rgba(47,134,255,0.12)]"
        animate={{
          left: target.rect.left - 8,
          top: target.rect.top - 8,
          width: target.rect.width + 16,
          height: target.rect.height + 16
        }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      />

      <motion.div
        className="absolute h-20 w-20"
        animate={{ left: mascotX, top: mascotY }}
        transition={{ duration: 0.7, ease: [0.18, 1, 0.32, 1] }}
      >
        <motion.div
          animate={{ y: [0, -8, 0], rotate: [0, -2, 2, 0] }}
          transition={{ duration: 4.2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
        >
          <RiveMascot size="md" />
        </motion.div>
      </motion.div>

      <motion.div
        className="absolute rounded-full border border-white/12 bg-[linear-gradient(180deg,rgba(10,22,43,0.96),rgba(7,15,30,0.9))] px-3 py-2 text-xs font-medium text-white shadow-[0_16px_30px_rgba(2,8,23,0.28)] backdrop-blur-xl"
        animate={{ left: bubbleX, top: bubbleY }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        {target.hint}
      </motion.div>
    </div>
  );
}
