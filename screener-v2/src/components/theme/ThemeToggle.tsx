"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type Theme = "light" | "dark";

const STORAGE_KEY = "northstar-theme";
const LEGACY_STORAGE_KEY = "assessment-hub-theme";

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);
  const [animating, setAnimating] = useState(false);
  const [phase, setPhase] = useState<"idle" | "cover" | "reveal">("idle");
  const timers = useRef<number[]>([]);

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY) || window.localStorage.getItem(LEGACY_STORAGE_KEY);
    const nextTheme: Theme = saved === "dark" ? "dark" : "light";
    applyTheme(nextTheme);
    setTheme(nextTheme);
    setMounted(true);

    return () => {
      timers.current.forEach((timer) => window.clearTimeout(timer));
    };
  }, []);

  function schedule(callback: () => void, delay: number) {
    const timer = window.setTimeout(callback, delay);
    timers.current.push(timer);
  }

  function toggleTheme() {
    if (animating) return;

    const nextTheme: Theme = theme === "light" ? "dark" : "light";
    setAnimating(true);
    setPhase("cover");

    schedule(() => {
      applyTheme(nextTheme);
      setTheme(nextTheme);
      window.localStorage.setItem(STORAGE_KEY, nextTheme);
      window.localStorage.removeItem(LEGACY_STORAGE_KEY);
    }, 220);

    schedule(() => {
      setPhase("reveal");
    }, 380);

    schedule(() => {
      setAnimating(false);
      setPhase("idle");
    }, 860);
  }

  return (
    <>
      <button
        type="button"
        aria-label={mounted ? `Switch to ${theme === "light" ? "dark" : "light"} mode` : "Toggle theme"}
        title={mounted ? `Switch to ${theme === "light" ? "dark" : "light"} mode` : "Toggle theme"}
        onClick={toggleTheme}
        className="fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 rounded-full border border-[color:var(--app-border)] bg-[color:var(--app-surface)] px-4 py-2 text-sm text-[color:var(--app-text)] shadow-[var(--app-shadow)] transition hover:-translate-y-[1px] hover:bg-[color:var(--app-surface-soft)]"
      >
        {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
        <span>{theme === "light" ? "Dark mode" : "Light mode"}</span>
      </button>

      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none fixed inset-0 z-[60] overflow-hidden transition-opacity duration-300",
          animating ? "opacity-100" : "opacity-0"
        )}
      >
        <div
          className={cn(
            "absolute inset-0 transition-opacity duration-500",
            phase === "idle" ? "opacity-0" : "opacity-100"
          )}
          style={{
            background:
              theme === "light"
                ? "radial-gradient(circle at 30% 30%, rgba(15,168,161,0.18), transparent 26%), rgba(14,28,44,0.10)"
                : "radial-gradient(circle at 70% 30%, rgba(255,255,255,0.18), transparent 24%), rgba(240,247,248,0.14)"
          }}
        />
        <div
          className={cn(
            "absolute -left-[30%] top-0 h-full w-[68%] skew-x-[-18deg] bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.9),rgba(15,168,161,0.75),transparent)] blur-2xl transition-transform duration-[780ms] ease-[cubic-bezier(0.22,1,0.36,1)]",
            phase === "idle" && "-translate-x-[140%]",
            phase === "cover" && "translate-x-[185%]",
            phase === "reveal" && "translate-x-[240%]"
          )}
        />
      </div>
    </>
  );
}
