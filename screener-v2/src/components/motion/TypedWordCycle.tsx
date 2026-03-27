"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function TypedWordCycle({
  prefix,
  words,
  className
}: {
  prefix: string;
  words: string[];
  className?: string;
}) {
  const [wordIndex, setWordIndex] = useState(0);
  const [displayed, setDisplayed] = useState("");
  const [phase, setPhase] = useState<"typing" | "holding" | "deleting">("typing");

  useEffect(() => {
    const currentWord = words[wordIndex] ?? "";

    if (phase === "typing") {
      if (displayed === currentWord) {
        const timeout = window.setTimeout(() => setPhase("holding"), 900);
        return () => window.clearTimeout(timeout);
      }

      const timeout = window.setTimeout(() => {
        setDisplayed(currentWord.slice(0, displayed.length + 1));
      }, 58);
      return () => window.clearTimeout(timeout);
    }

    if (phase === "holding") {
      const timeout = window.setTimeout(() => setPhase("deleting"), 720);
      return () => window.clearTimeout(timeout);
    }

    if (displayed.length === 0) {
      setWordIndex((current) => (current + 1) % words.length);
      setPhase("typing");
      return;
    }

    const timeout = window.setTimeout(() => {
      setDisplayed((current) => current.slice(0, -1));
    }, 34);
    return () => window.clearTimeout(timeout);
  }, [displayed, phase, wordIndex, words]);

  return (
    <span className={cn("inline-flex items-center gap-1", className)}>
      <span>{prefix}</span>
      <span className="bg-[linear-gradient(90deg,var(--blue-300),var(--cyan-300),#ffffff)] bg-clip-text text-transparent">
        {displayed}
      </span>
      <span className="typed-caret text-brand-200">|</span>
    </span>
  );
}
